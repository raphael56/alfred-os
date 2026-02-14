use axum::{extract::State, Json};
use sqlx::PgPool;

#[utoipa::path(get, path = "/report/weekly",
    responses((status = 200, description = "Weekly report")))]
pub async fn weekly_report(
    State(pool): State<PgPool>,
) -> Json<serde_json::Value> {
    // Tasks summary
    let task_stats = sqlx::query_as::<_, (String, i64)>(
        "SELECT status, COUNT(*) FROM tasks GROUP BY status"
    ).fetch_all(&pool).await.unwrap_or_default();
    let tasks_created = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM tasks WHERE created_at > NOW() - INTERVAL '7 days'"
    ).fetch_one(&pool).await.unwrap_or(0);
    let tasks_completed = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM tasks WHERE status = 'done' AND created_at > NOW() - INTERVAL '7 days'"
    ).fetch_one(&pool).await.unwrap_or(0);

    // Sport metrics
    let sport_keys = &["vo2max", "resting_hr", "sleep_hours", "weekly_km", "training_load"];
    let mut sport = serde_json::Map::new();
    for key in sport_keys {
        if let Ok(Some((val,))) = sqlx::query_as::<_, (serde_json::Value,)>(
            "SELECT value FROM metrics WHERE category='sport' AND key=$1 ORDER BY recorded_at DESC LIMIT 1"
        ).bind(*key).fetch_optional(&pool).await {
            sport.insert(key.to_string(), val);
        }
    }

    // Recent activities
    let activities = sqlx::query_as::<_, (serde_json::Value,)>(
        "SELECT value FROM metrics WHERE category='sport' AND key='activity' ORDER BY recorded_at DESC LIMIT 10"
    ).fetch_all(&pool).await.unwrap_or_default();

    // System avg (last 7 days)
    let cpu_avg = sqlx::query_scalar::<_, f64>(
        "SELECT AVG((value::text)::float8) FROM metrics WHERE category='system' AND key='cpu_load' AND recorded_at > NOW() - INTERVAL '7 days'"
    ).fetch_one(&pool).await.ok();

    // AI usage
    let ai_weekly = sqlx::query_as::<_, (serde_json::Value,)>(
        "SELECT value FROM metrics WHERE category='ai' AND key='weekly_usage' ORDER BY recorded_at DESC LIMIT 1"
    ).fetch_optional(&pool).await.ok().flatten();

    // Knowledge base size
    let kb_size = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM system_knowledge"
    ).fetch_one(&pool).await.unwrap_or(0);

    // Race info
    let race = sqlx::query_as::<_, (serde_json::Value,)>(
        "SELECT value FROM metrics WHERE category='race' AND key='info' ORDER BY recorded_at DESC LIMIT 1"
    ).fetch_optional(&pool).await.ok().flatten();

    Json(serde_json::json!({
        "period": "weekly",
        "generated_at": chrono::Utc::now().to_rfc3339(),
        "tasks": {
            "by_status": task_stats.iter().map(|(s,c)| serde_json::json!({"status": s, "count": c})).collect::<Vec<_>>(),
            "created_this_week": tasks_created,
            "completed_this_week": tasks_completed,
        },
        "sport": sport,
        "activities": activities.iter().map(|(v,)| v.clone()).collect::<Vec<_>>(),
        "system": {
            "cpu_avg_7d": cpu_avg,
        },
        "ai": ai_weekly.map(|(v,)| v),
        "knowledge_base_entries": kb_size,
        "race": race.map(|(v,)| v),
    }))
}
