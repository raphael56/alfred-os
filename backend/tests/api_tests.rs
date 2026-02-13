use axum::{routing::get, Router, Json};
use tower::ServiceExt;
use axum::http::{Request, StatusCode};
use axum::body::Body;
use serde_json::Value;
use sqlx::PgPool;

async fn setup_pool() -> PgPool {
    let url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://alfred:alfredsupersecret@localhost:5432/alfred_core".to_string());
    sqlx::postgres::PgPoolOptions::new()
        .max_connections(2)
        .connect(&url)
        .await
        .expect("Failed to connect to test database")
}

fn build_app(pool: PgPool) -> Router {
    Router::new()
        .route("/health", get(health_check))
        .route("/tasks", get(list_tasks).post(create_task))
        .route("/tasks/:id", get(get_task).put(update_task).delete(delete_task))
        .route("/metrics", get(list_metrics).post(create_metric))
        .with_state(pool)
}

async fn health_check() -> Json<Value> {
    Json(serde_json::json!({"status": "operational", "system": "Alfred OS v0.1.0"}))
}

async fn list_tasks(
    axum::extract::State(pool): axum::extract::State<PgPool>,
) -> Json<Vec<Value>> {
    let rows = sqlx::query_as::<_, (uuid::Uuid, String, String, i32)>(
        "SELECT id, title, status, priority FROM tasks ORDER BY created_at DESC LIMIT 50"
    ).fetch_all(&pool).await.unwrap_or_default();
    Json(rows.iter().map(|r| serde_json::json!({"id": r.0, "title": r.1, "status": r.2, "priority": r.3})).collect())
}

async fn create_task(
    axum::extract::State(pool): axum::extract::State<PgPool>,
    Json(body): Json<Value>,
) -> (StatusCode, Json<Value>) {
    let title = body["title"].as_str().unwrap_or("untitled");
    let priority = body["priority"].as_i64().unwrap_or(1) as i32;
    let row = sqlx::query_as::<_, (uuid::Uuid,)>(
        "INSERT INTO tasks (title, priority) VALUES ($1, $2) RETURNING id"
    ).bind(title).bind(priority).fetch_one(&pool).await.unwrap();
    (StatusCode::CREATED, Json(serde_json::json!({"id": row.0, "title": title})))
}

async fn get_task(
    axum::extract::State(pool): axum::extract::State<PgPool>,
    axum::extract::Path(id): axum::extract::Path<uuid::Uuid>,
) -> Result<Json<Value>, StatusCode> {
    let row = sqlx::query_as::<_, (uuid::Uuid, String, String)>(
        "SELECT id, title, status FROM tasks WHERE id = $1"
    ).bind(id).fetch_optional(&pool).await.unwrap();
    row.map(|r| Json(serde_json::json!({"id": r.0, "title": r.1, "status": r.2})))
       .ok_or(StatusCode::NOT_FOUND)
}

async fn update_task(
    axum::extract::State(pool): axum::extract::State<PgPool>,
    axum::extract::Path(id): axum::extract::Path<uuid::Uuid>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, StatusCode> {
    let status = body["status"].as_str().unwrap_or("todo");
    sqlx::query("UPDATE tasks SET status = $1 WHERE id = $2")
        .bind(status).bind(id).execute(&pool).await.unwrap();
    Ok(Json(serde_json::json!({"id": id, "status": status})))
}

async fn delete_task(
    axum::extract::State(pool): axum::extract::State<PgPool>,
    axum::extract::Path(id): axum::extract::Path<uuid::Uuid>,
) -> StatusCode {
    let r = sqlx::query("DELETE FROM tasks WHERE id = $1").bind(id).execute(&pool).await.unwrap();
    if r.rows_affected() > 0 { StatusCode::NO_CONTENT } else { StatusCode::NOT_FOUND }
}

async fn list_metrics(
    axum::extract::State(pool): axum::extract::State<PgPool>,
) -> Json<Vec<Value>> {
    let rows = sqlx::query_as::<_, (uuid::Uuid, String, String)>(
        "SELECT id, category, key FROM metrics ORDER BY recorded_at DESC LIMIT 50"
    ).fetch_all(&pool).await.unwrap_or_default();
    Json(rows.iter().map(|r| serde_json::json!({"id": r.0, "category": r.1, "key": r.2})).collect())
}

async fn create_metric(
    axum::extract::State(pool): axum::extract::State<PgPool>,
    Json(body): Json<Value>,
) -> (StatusCode, Json<Value>) {
    let cat = body["category"].as_str().unwrap_or("system");
    let key = body["key"].as_str().unwrap_or("unknown");
    let val = &body["value"];
    let row = sqlx::query_as::<_, (uuid::Uuid,)>(
        "INSERT INTO metrics (category, key, value) VALUES ($1, $2, $3) RETURNING id"
    ).bind(cat).bind(key).bind(val).fetch_one(&pool).await.unwrap();
    (StatusCode::CREATED, Json(serde_json::json!({"id": row.0})))
}

async fn do_request(pool: PgPool, req: Request<Body>) -> axum::response::Response {
    build_app(pool).oneshot(req).await.unwrap()
}

async fn body_json(resp: axum::response::Response) -> Value {
    let bytes = axum::body::to_bytes(resp.into_body(), 8192).await.unwrap();
    serde_json::from_slice(&bytes).unwrap()
}

#[tokio::test]
async fn test_health_check() {
    let pool = setup_pool().await;
    let resp = do_request(pool, Request::builder().uri("/health").body(Body::empty()).unwrap()).await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["status"], "operational");
}

#[tokio::test]
async fn test_task_crud() {
    let pool = setup_pool().await;

    // Create
    let resp = do_request(pool.clone(),
        Request::builder()
            .method("POST").uri("/tasks")
            .header("content-type", "application/json")
            .body(Body::from(r#"{"title":"Test integration","priority":3}"#)).unwrap()
    ).await;
    assert_eq!(resp.status(), StatusCode::CREATED);
    let body = body_json(resp).await;
    let task_id = body["id"].as_str().unwrap().to_string();

    // Get
    let resp = do_request(pool.clone(),
        Request::builder().uri(&format!("/tasks/{}", task_id)).body(Body::empty()).unwrap()
    ).await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["title"], "Test integration");

    // Update
    let resp = do_request(pool.clone(),
        Request::builder()
            .method("PUT").uri(&format!("/tasks/{}", task_id))
            .header("content-type", "application/json")
            .body(Body::from(r#"{"status":"done"}"#)).unwrap()
    ).await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["status"], "done");

    // Delete
    let resp = do_request(pool.clone(),
        Request::builder().method("DELETE").uri(&format!("/tasks/{}", task_id)).body(Body::empty()).unwrap()
    ).await;
    assert_eq!(resp.status(), StatusCode::NO_CONTENT);

    // Verify deleted
    let resp = do_request(pool.clone(),
        Request::builder().uri(&format!("/tasks/{}", task_id)).body(Body::empty()).unwrap()
    ).await;
    assert_eq!(resp.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_metric_create_and_list() {
    let pool = setup_pool().await;

    // Create metric
    let resp = do_request(pool.clone(),
        Request::builder()
            .method("POST").uri("/metrics")
            .header("content-type", "application/json")
            .body(Body::from(r#"{"category":"test","key":"test_val","value":42}"#)).unwrap()
    ).await;
    assert_eq!(resp.status(), StatusCode::CREATED);
    let body = body_json(resp).await;
    let metric_id = body["id"].as_str().unwrap().to_string();

    // List
    let resp = do_request(pool.clone(),
        Request::builder().uri("/metrics").body(Body::empty()).unwrap()
    ).await;
    assert_eq!(resp.status(), StatusCode::OK);
    let body: Vec<Value> = serde_json::from_slice(
        &axum::body::to_bytes(resp.into_body(), 8192).await.unwrap()
    ).unwrap();
    assert!(body.iter().any(|m| m["id"].as_str() == Some(&metric_id)));

    // Cleanup
    sqlx::query("DELETE FROM metrics WHERE id = $1")
        .bind(uuid::Uuid::parse_str(&metric_id).unwrap())
        .execute(&pool).await.ok();
}
