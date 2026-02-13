use axum::{routing::{get, delete, post}, Router, Json};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;

mod db;
mod api;

use api::{tasks, metrics, sync};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let pool = db::init_pool().await;
    db::run_migrations(&pool).await;

    #[derive(OpenApi)]
    #[openapi(
        paths(
            health_check,
            sys_schema,
            tasks::list_tasks, tasks::create_task, tasks::get_task, tasks::update_task, tasks::delete_task,
            metrics::list_metrics, metrics::create_metric, metrics::delete_metric, metrics::collect_system_metrics,
            sync::sync_garmin, sync::sync_usage, sync::garmin_latest,
        ),
        components(schemas(
            tasks::Task, tasks::CreateTask, tasks::UpdateTask,
            metrics::Metric, metrics::CreateMetric,
        ))
    )]
    struct ApiDoc;

    let app = Router::new()
        .merge(SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", ApiDoc::openapi()))
        .route("/health", get(health_check))
        .route("/sys/schema", get(sys_schema))
        .route("/tasks", get(tasks::list_tasks).post(tasks::create_task))
        .route("/tasks/:id", get(tasks::get_task).put(tasks::update_task).delete(tasks::delete_task))
        .route("/metrics", get(metrics::list_metrics).post(metrics::create_metric))
        .route("/metrics/:id", delete(metrics::delete_metric))
        .route("/metrics/system", post(metrics::collect_system_metrics))
        // Sync endpoints
        .route("/sync/garmin", post(sync::sync_garmin))
        .route("/sync/usage", post(sync::sync_usage))
        .route("/garmin/latest", get(sync::garmin_latest))
        .layer(CorsLayer::permissive())
        .with_state(pool);

    let port: u16 = std::env::var("SERVER_PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()
        .unwrap_or(8080);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("ALFRED OS Backend running on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

#[utoipa::path(get, path = "/health", responses((status = 200, description = "System operational")))]
async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "operational",
        "system": "Alfred OS v0.1.0"
    }))
}

#[utoipa::path(get, path = "/sys/schema", responses((status = 200, description = "Database schema")))]
async fn sys_schema(
    axum::extract::State(pool): axum::extract::State<sqlx::PgPool>,
) -> Json<serde_json::Value> {
    let tables = sqlx::query_scalar::<_, String>(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    )
    .fetch_all(&pool)
    .await
    .unwrap_or_default();

    Json(serde_json::json!({
        "system": "Alfred OS",
        "tables": tables
    }))
}
