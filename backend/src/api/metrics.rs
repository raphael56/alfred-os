use axum::{extract::{Path, State, Query}, Json};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, FromRow};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, FromRow, utoipa::ToSchema)]
pub struct Metric {
    pub id: Uuid,
    pub category: String,
    pub key: String,
    pub value: serde_json::Value,
    pub recorded_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct CreateMetric {
    pub category: String,
    pub key: String,
    pub value: serde_json::Value,
}

#[derive(Debug, Deserialize, utoipa::IntoParams)]
pub struct MetricFilter {
    pub category: Option<String>,
    pub key: Option<String>,
}

#[utoipa::path(get, path = "/metrics", params(MetricFilter),
    responses((status = 200, description = "List metrics", body = Vec<Metric>)))]
pub async fn list_metrics(
    State(pool): State<PgPool>,
    Query(filter): Query<MetricFilter>,
) -> Json<Vec<Metric>> {
    let metrics: Vec<Metric> = match (&filter.category, &filter.key) {
        (Some(cat), Some(k)) => {
            sqlx::query_as::<_, Metric>(
                "SELECT id, category, key, value, recorded_at FROM metrics WHERE category = $1 AND key = $2 ORDER BY recorded_at DESC LIMIT 100"
            ).bind(cat).bind(k).fetch_all(&pool).await.unwrap_or_default()
        }
        (Some(cat), None) => {
            sqlx::query_as::<_, Metric>(
                "SELECT id, category, key, value, recorded_at FROM metrics WHERE category = $1 ORDER BY recorded_at DESC LIMIT 100"
            ).bind(cat).fetch_all(&pool).await.unwrap_or_default()
        }
        _ => {
            sqlx::query_as::<_, Metric>(
                "SELECT id, category, key, value, recorded_at FROM metrics ORDER BY recorded_at DESC LIMIT 100"
            ).fetch_all(&pool).await.unwrap_or_default()
        }
    };
    Json(metrics)
}

#[utoipa::path(post, path = "/metrics", request_body = CreateMetric,
    responses((status = 201, description = "Metric recorded", body = Metric)))]
pub async fn create_metric(
    State(pool): State<PgPool>,
    Json(input): Json<CreateMetric>,
) -> (axum::http::StatusCode, Json<Metric>) {
    let metric = sqlx::query_as::<_, Metric>(
        "INSERT INTO metrics (category, key, value) VALUES ($1, $2, $3) RETURNING id, category, key, value, recorded_at"
    )
    .bind(&input.category)
    .bind(&input.key)
    .bind(&input.value)
    .fetch_one(&pool).await.unwrap();
    (axum::http::StatusCode::CREATED, Json(metric))
}

#[utoipa::path(delete, path = "/metrics/{id}",
    responses((status = 204, description = "Metric deleted")))]
pub async fn delete_metric(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
) -> axum::http::StatusCode {
    let result = sqlx::query("DELETE FROM metrics WHERE id = $1")
        .bind(id)
        .execute(&pool).await.unwrap();
    if result.rows_affected() > 0 {
        axum::http::StatusCode::NO_CONTENT
    } else {
        axum::http::StatusCode::NOT_FOUND
    }
}
