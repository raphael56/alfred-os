use axum::{extract::State, Json};
use sqlx::PgPool;

const DEFAULT_SETTINGS: &str = r#"{
    "alerts": {
        "cpu_load_max": 4.0,
        "memory_pct_max": 80.0,
        "disk_pct_max": 85.0,
        "sleep_hours_min": 6.0,
        "anaerobic_max": 200.0
    },
    "sync": {
        "garmin_interval_min": 30,
        "system_interval_min": 5
    }
}"#;

#[utoipa::path(get, path = "/settings",
    responses((status = 200, description = "Current settings")))]
pub async fn get_settings(
    State(pool): State<PgPool>,
) -> Json<serde_json::Value> {
    let row = sqlx::query_as::<_, (serde_json::Value,)>(
        "SELECT value FROM metrics WHERE category = 'config' AND key = 'settings' ORDER BY recorded_at DESC LIMIT 1"
    ).fetch_optional(&pool).await.ok().flatten();

    match row {
        Some((val,)) => Json(val),
        None => Json(serde_json::from_str(DEFAULT_SETTINGS).unwrap()),
    }
}

#[utoipa::path(put, path = "/settings", request_body = serde_json::Value,
    responses((status = 200, description = "Settings updated")))]
pub async fn update_settings(
    State(pool): State<PgPool>,
    Json(input): Json<serde_json::Value>,
) -> Json<serde_json::Value> {
    let _ = sqlx::query(
        "INSERT INTO metrics (category, key, value) VALUES ('config', 'settings', $1)"
    ).bind(&input).execute(&pool).await;

    Json(serde_json::json!({"status": "updated"}))
}
