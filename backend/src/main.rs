use axum::{routing::get, Router, Json};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;

mod db;

#[tokio::main]
async fn main() {
    // 1. Logs
    tracing_subscriber::fmt::init();

    // 2. Database connection
    let pool = db::init_pool().await;
    db::run_migrations(&pool).await;

    // 3. Documentation OpenAPI
    #[derive(OpenApi)]
    #[openapi(paths(health_check, sys_schema))]
    struct ApiDoc;

    // 4. Router
    let app = Router::new()
        .merge(SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", ApiDoc::openapi()))
        .route("/health", get(health_check))
        .route("/sys/schema", get(sys_schema))
        .layer(CorsLayer::permissive())
        .with_state(pool);

    // 5. Server
    let port: u16 = std::env::var("SERVER_PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()
        .unwrap_or(8080);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("ALFRED OS Backend running on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

/// Health check endpoint
#[utoipa::path(get, path = "/health", responses((status = 200, description = "System operational")))]
async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "operational",
        "system": "Alfred OS v0.1.0"
    }))
}

/// System schema introspection for OpenClaw
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
