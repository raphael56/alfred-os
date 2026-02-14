use axum::{extract::State, Json};
use sqlx::PgPool;

#[derive(Debug, serde::Serialize, utoipa::ToSchema)]
pub struct Alert {
    pub level: String,
    pub category: String,
    pub message: String,
}

#[utoipa::path(get, path = "/alerts",
    responses((status = 200, description = "Active alerts", body = Vec<Alert>)))]
pub async fn check_alerts(
    State(pool): State<PgPool>,
) -> Json<Vec<Alert>> {
    let mut alerts = Vec::new();

    // CPU load > 4
    if let Ok(Some((val,))) = sqlx::query_as::<_, (serde_json::Value,)>(
        "SELECT value FROM metrics WHERE category='system' AND key='cpu_load' ORDER BY recorded_at DESC LIMIT 1"
    ).fetch_optional(&pool).await {
        if let Some(load) = val.as_f64() {
            if load > 4.0 {
                alerts.push(Alert { level: "warning".into(), category: "system".into(), message: format!("CPU load high: {:.1}", load) });
            }
        }
    }

    // Memory > 80%
    if let Ok(Some((val,))) = sqlx::query_as::<_, (serde_json::Value,)>(
        "SELECT value FROM metrics WHERE category='system' AND key='memory' ORDER BY recorded_at DESC LIMIT 1"
    ).fetch_optional(&pool).await {
        if let Some(pct) = val.get("used_pct").and_then(|v| v.as_f64()) {
            if pct > 80.0 {
                alerts.push(Alert { level: "warning".into(), category: "system".into(), message: format!("Memory usage: {:.0}%", pct) });
            }
        }
    }

    // Disk > 85%
    if let Ok(Some((val,))) = sqlx::query_as::<_, (serde_json::Value,)>(
        "SELECT value FROM metrics WHERE category='system' AND key='disk' ORDER BY recorded_at DESC LIMIT 1"
    ).fetch_optional(&pool).await {
        if let Some(pct) = val.get("used_pct").and_then(|v| v.as_f64()) {
            if pct > 85.0 {
                alerts.push(Alert { level: "critical".into(), category: "system".into(), message: format!("Disk usage: {:.0}%", pct) });
            }
        }
    }

    // Sleep < 6h
    if let Ok(Some((val,))) = sqlx::query_as::<_, (serde_json::Value,)>(
        "SELECT value FROM metrics WHERE category='sport' AND key='sleep_hours' ORDER BY recorded_at DESC LIMIT 1"
    ).fetch_optional(&pool).await {
        if let Some(h) = val.as_f64() {
            if h < 6.0 {
                alerts.push(Alert { level: "info".into(), category: "sport".into(), message: format!("Sleep low: {:.1}h", h) });
            }
        }
    }

    // Training load anaerobic > 200
    if let Ok(Some((val,))) = sqlx::query_as::<_, (serde_json::Value,)>(
        "SELECT value FROM metrics WHERE category='sport' AND key='training_load' ORDER BY recorded_at DESC LIMIT 1"
    ).fetch_optional(&pool).await {
        if let Some(an) = val.get("anaerobic").and_then(|v| v.as_f64()) {
            if an > 200.0 {
                alerts.push(Alert { level: "warning".into(), category: "sport".into(), message: format!("Anaerobic load high: {:.0}", an) });
            }
        }
    }

    // Overdue tasks
    if let Ok(count) = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM tasks WHERE status != 'done' AND due_date < NOW()"
    ).fetch_one(&pool).await {
        if count > 0 {
            alerts.push(Alert { level: "info".into(), category: "tasks".into(), message: format!("{} overdue task(s)", count) });
        }
    }

    Json(alerts)
}
