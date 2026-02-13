use axum::{extract::{Path, State, Query}, Json};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, FromRow};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::collections::HashMap;

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

/// Collect and store system metrics (CPU, memory, disk)
#[utoipa::path(post, path = "/metrics/system",
    responses((status = 200, description = "System metrics collected")))]
pub async fn collect_system_metrics(
    State(pool): State<PgPool>,
) -> Json<serde_json::Value> {
    let mut collected = HashMap::new();

    // CPU load from /proc/loadavg
    if let Ok(loadavg) = std::fs::read_to_string("/proc/loadavg") {
        let parts: Vec<&str> = loadavg.split_whitespace().collect();
        if let Some(load1) = parts.first().and_then(|v| v.parse::<f64>().ok()) {
            let _ = sqlx::query("INSERT INTO metrics (category, key, value) VALUES ($1, $2, $3)")
                .bind("system").bind("cpu_load").bind(serde_json::json!(load1))
                .execute(&pool).await;
            collected.insert("cpu_load", serde_json::json!(load1));
        }
    }

    // Memory from /proc/meminfo
    if let Ok(meminfo) = std::fs::read_to_string("/proc/meminfo") {
        let mut mem: HashMap<String, u64> = HashMap::new();
        for line in meminfo.lines() {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 2 {
                let key = parts[0].trim_end_matches(':');
                if let Ok(val) = parts[1].parse::<u64>() {
                    mem.insert(key.to_string(), val);
                }
            }
        }
        if let (Some(&total), Some(&available)) = (mem.get("MemTotal"), mem.get("MemAvailable")) {
            if total > 0 {
                let used_pct = ((total - available) as f64 / total as f64) * 100.0;
                let used_pct = (used_pct * 10.0).round() / 10.0;
                let total_gb = (total as f64 / 1_048_576.0 * 10.0).round() / 10.0;
                let used_gb = ((total - available) as f64 / 1_048_576.0 * 10.0).round() / 10.0;
                let val = serde_json::json!({
                    "used_pct": used_pct,
                    "total_gb": total_gb,
                    "used_gb": used_gb
                });
                let _ = sqlx::query("INSERT INTO metrics (category, key, value) VALUES ($1, $2, $3)")
                    .bind("system").bind("memory").bind(&val)
                    .execute(&pool).await;
                collected.insert("memory", val);
            }
        }
    }

    // Disk usage via statvfs on /
    let disk = get_disk_usage("/");
    if let Some(disk_val) = disk {
        let _ = sqlx::query("INSERT INTO metrics (category, key, value) VALUES ($1, $2, $3)")
            .bind("system").bind("disk").bind(&disk_val)
            .execute(&pool).await;
        collected.insert("disk", disk_val);
    }

    Json(serde_json::json!({
        "status": "collected",
        "metrics": collected
    }))
}

fn get_disk_usage(path: &str) -> Option<serde_json::Value> {
    // Read from /proc/mounts + manual stat - simpler: use df parsing
    let output = std::process::Command::new("df")
        .args(["-BG", path])
        .output()
        .ok()?;
    let stdout = String::from_utf8_lossy(&output.stdout);
    let line = stdout.lines().nth(1)?;
    let parts: Vec<&str> = line.split_whitespace().collect();
    if parts.len() >= 5 {
        let total = parts[1].trim_end_matches('G').parse::<f64>().ok()?;
        let used = parts[2].trim_end_matches('G').parse::<f64>().ok()?;
        let pct_str = parts[4].trim_end_matches('%');
        let used_pct = pct_str.parse::<f64>().ok()?;
        return Some(serde_json::json!({
            "total_gb": total,
            "used_gb": used,
            "used_pct": used_pct
        }));
    }
    None
}
