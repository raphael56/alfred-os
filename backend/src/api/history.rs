use axum::{extract::{State, Query}, Json};
use sqlx::PgPool;
use serde::Deserialize;

#[derive(Debug, Deserialize, utoipa::IntoParams)]
pub struct HistoryFilter {
    pub category: Option<String>,
    pub key: Option<String>,
    pub days: Option<i32>,
    pub limit: Option<i64>,
}

#[utoipa::path(get, path = "/metrics/history", params(HistoryFilter),
    responses((status = 200, description = "Metric history")))]
pub async fn metric_history(
    State(pool): State<PgPool>,
    Query(filter): Query<HistoryFilter>,
) -> Json<serde_json::Value> {
    let cat = filter.category.unwrap_or("sport".into());
    let key = filter.key.unwrap_or("vo2max".into());
    let days = filter.days.unwrap_or(30);
    let limit = filter.limit.unwrap_or(100);

    let rows = sqlx::query_as::<_, (serde_json::Value, chrono::DateTime<chrono::Utc>)>(
        "SELECT value, recorded_at FROM metrics WHERE category = $1 AND key = $2 AND recorded_at > NOW() - ($3 || ' days')::interval ORDER BY recorded_at ASC LIMIT $4"
    )
    .bind(&cat)
    .bind(&key)
    .bind(days.to_string())
    .bind(limit)
    .fetch_all(&pool)
    .await
    .unwrap_or_default();

    Json(serde_json::json!({
        "category": cat,
        "key": key,
        "days": days,
        "data": rows.iter().map(|(v, t)| serde_json::json!({"value": v, "time": t.to_rfc3339()})).collect::<Vec<_>>()
    }))
}
