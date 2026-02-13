use axum::{extract::State, Json};
use serde::Deserialize;
use sqlx::PgPool;

#[derive(Debug, Deserialize)]
pub struct GarminSync {
    #[serde(rename = "lastUpdate")]
    pub last_update: Option<String>,
    pub race: Option<serde_json::Value>,
    pub today: Option<serde_json::Value>,
    #[serde(rename = "heartRate")]
    pub heart_rate: Option<serde_json::Value>,
    pub sleep: Option<serde_json::Value>,
    pub fitness: Option<serde_json::Value>,
    #[serde(rename = "trainingLoad")]
    pub training_load: Option<serde_json::Value>,
    pub activities: Option<Vec<serde_json::Value>>,
    pub week: Option<serde_json::Value>,
    #[serde(rename = "runningStats")]
    pub running_stats: Option<serde_json::Value>,
    pub body: Option<serde_json::Value>,
}

async fn insert_metric(pool: &PgPool, category: &str, key: &str, value: &serde_json::Value) {
    sqlx::query(
        "INSERT INTO metrics (category, key, value) VALUES ($1, $2, $3)"
    )
    .bind(category)
    .bind(key)
    .bind(value)
    .execute(pool)
    .await
    .ok();
}

/// Ingest Garmin JSON data into metrics
#[utoipa::path(post, path = "/sync/garmin",
    responses((status = 200, description = "Garmin data synced")))]
pub async fn sync_garmin(
    State(pool): State<PgPool>,
    Json(data): Json<GarminSync>,
) -> Json<serde_json::Value> {
    let mut count = 0;

    // Race info
    if let Some(ref race) = data.race {
        insert_metric(&pool, "race", "info", race).await;
        count += 1;
    }

    // Today stats
    if let Some(ref today) = data.today {
        if let Some(steps) = today.get("steps").and_then(|v| v.as_i64()) {
            insert_metric(&pool, "sport", "steps", &serde_json::json!(steps)).await;
            count += 1;
        }
        if let Some(dist) = today.get("distance").and_then(|v| v.as_f64()) {
            insert_metric(&pool, "sport", "daily_km", &serde_json::json!(dist)).await;
            count += 1;
        }
        if let Some(cal) = today.get("calories").and_then(|v| v.as_f64()) {
            insert_metric(&pool, "sport", "calories", &serde_json::json!(cal)).await;
            count += 1;
        }
        if let Some(stress) = today.get("stress") {
            insert_metric(&pool, "sport", "stress", stress).await;
            count += 1;
        }
    }

    // Heart rate
    if let Some(ref hr) = data.heart_rate {
        if let Some(resting) = hr.get("resting").and_then(|v| v.as_i64()) {
            insert_metric(&pool, "sport", "resting_hr", &serde_json::json!(resting)).await;
            count += 1;
        }
        insert_metric(&pool, "sport", "heart_rate", hr).await;
        count += 1;
    }

    // Sleep
    if let Some(ref sleep) = data.sleep {
        insert_metric(&pool, "sport", "sleep", sleep).await;
        if let Some(dur) = sleep.get("duration").and_then(|v| v.as_f64()) {
            insert_metric(&pool, "sport", "sleep_hours", &serde_json::json!(dur)).await;
            count += 1;
        }
        count += 1;
    }

    // Fitness (VO2max)
    if let Some(ref fitness) = data.fitness {
        if let Some(vo2) = fitness.get("vo2max").and_then(|v| v.as_f64()) {
            insert_metric(&pool, "sport", "vo2max", &serde_json::json!(vo2)).await;
            count += 1;
        }
        insert_metric(&pool, "sport", "fitness", fitness).await;
        count += 1;
    }

    // Training load
    if let Some(ref tl) = data.training_load {
        insert_metric(&pool, "sport", "training_load", tl).await;
        count += 1;
    }

    // Week summary
    if let Some(ref week) = data.week {
        insert_metric(&pool, "sport", "weekly_summary", week).await;
        if let Some(km) = week.get("km").and_then(|v| v.as_f64()) {
            insert_metric(&pool, "sport", "weekly_km", &serde_json::json!(km)).await;
            count += 1;
        }
        count += 1;
    }

    // Running stats
    if let Some(ref rs) = data.running_stats {
        insert_metric(&pool, "sport", "running_stats", rs).await;
        count += 1;
    }

    // Body composition
    if let Some(ref body) = data.body {
        insert_metric(&pool, "sport", "body_composition", body).await;
        count += 1;
    }

    // Individual activities
    if let Some(ref activities) = data.activities {
        for a in activities.iter().take(10) {
            insert_metric(&pool, "sport", "activity", a).await;
            count += 1;
        }
    }

    Json(serde_json::json!({
        "status": "synced",
        "metrics_inserted": count
    }))
}

/// Ingest OpenClaw usage data
#[utoipa::path(post, path = "/sync/usage",
    responses((status = 200, description = "Usage data synced")))]
pub async fn sync_usage(
    State(pool): State<PgPool>,
    Json(data): Json<serde_json::Value>,
) -> Json<serde_json::Value> {
    let mut count = 0;

    if let Some(today) = data.get("today") {
        insert_metric(&pool, "ai", "daily_usage", today).await;
        count += 1;
    }
    if let Some(week) = data.get("week") {
        insert_metric(&pool, "ai", "weekly_usage", week).await;
        count += 1;
    }

    Json(serde_json::json!({
        "status": "synced",
        "metrics_inserted": count
    }))
}

/// Get latest Garmin snapshot (most recent of each key)
#[utoipa::path(get, path = "/garmin/latest",
    responses((status = 200, description = "Latest Garmin data")))]
pub async fn garmin_latest(
    State(pool): State<PgPool>,
) -> Json<serde_json::Value> {
    let keys = &[
        "heart_rate", "sleep", "fitness", "training_load",
        "weekly_summary", "running_stats", "body_composition",
        "resting_hr", "vo2max", "weekly_km", "sleep_hours",
    ];

    let mut result = serde_json::Map::new();

    for key in keys {
        let row = sqlx::query_as::<_, (serde_json::Value,)>(
            "SELECT value FROM metrics WHERE category = 'sport' AND key = $1 ORDER BY recorded_at DESC LIMIT 1"
        )
        .bind(*key)
        .fetch_optional(&pool)
        .await
        .ok()
        .flatten();

        if let Some((val,)) = row {
            result.insert(key.to_string(), val);
        }
    }

    // Race info
    let race = sqlx::query_as::<_, (serde_json::Value,)>(
        "SELECT value FROM metrics WHERE category = 'race' AND key = 'info' ORDER BY recorded_at DESC LIMIT 1"
    )
    .fetch_optional(&pool)
    .await
    .ok()
    .flatten();
    if let Some((val,)) = race {
        result.insert("race".to_string(), val);
    }

    // Recent activities
    let activities = sqlx::query_as::<_, (serde_json::Value,)>(
        "SELECT value FROM metrics WHERE category = 'sport' AND key = 'activity' ORDER BY recorded_at DESC LIMIT 10"
    )
    .fetch_all(&pool)
    .await
    .unwrap_or_default();
    result.insert("activities".to_string(), serde_json::json!(activities.iter().map(|a| &a.0).collect::<Vec<_>>()));

    Json(serde_json::Value::Object(result))
}
