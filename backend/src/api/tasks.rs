use axum::{extract::{Path, State, Query}, Json};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, FromRow};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, FromRow, utoipa::ToSchema)]
pub struct Task {
    pub id: Uuid,
    pub title: String,
    pub status: String,
    pub priority: i32,
    pub tags: Option<serde_json::Value>,
    pub due_date: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct CreateTask {
    pub title: String,
    pub priority: Option<i32>,
    pub tags: Option<serde_json::Value>,
    pub due_date: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct UpdateTask {
    pub title: Option<String>,
    pub status: Option<String>,
    pub priority: Option<i32>,
    pub tags: Option<serde_json::Value>,
    pub due_date: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize, utoipa::IntoParams)]
pub struct TaskFilter {
    pub status: Option<String>,
}

#[utoipa::path(get, path = "/tasks", params(TaskFilter),
    responses((status = 200, description = "List tasks", body = Vec<Task>)))]
pub async fn list_tasks(
    State(pool): State<PgPool>,
    Query(filter): Query<TaskFilter>,
) -> Json<Vec<Task>> {
    let tasks: Vec<Task> = match filter.status {
        Some(ref s) => {
            sqlx::query_as::<_, Task>(
                "SELECT id, title, status, priority, tags, due_date, created_at FROM tasks WHERE status = $1 ORDER BY priority DESC, created_at DESC"
            ).bind(s).fetch_all(&pool).await.unwrap_or_default()
        }
        None => {
            sqlx::query_as::<_, Task>(
                "SELECT id, title, status, priority, tags, due_date, created_at FROM tasks ORDER BY priority DESC, created_at DESC"
            ).fetch_all(&pool).await.unwrap_or_default()
        }
    };
    Json(tasks)
}

#[utoipa::path(post, path = "/tasks", request_body = CreateTask,
    responses((status = 201, description = "Task created", body = Task)))]
pub async fn create_task(
    State(pool): State<PgPool>,
    Json(input): Json<CreateTask>,
) -> (axum::http::StatusCode, Json<Task>) {
    let task = sqlx::query_as::<_, Task>(
        "INSERT INTO tasks (title, priority, tags, due_date) VALUES ($1, $2, $3, $4) RETURNING id, title, status, priority, tags, due_date, created_at"
    )
    .bind(&input.title)
    .bind(input.priority.unwrap_or(1))
    .bind(&input.tags)
    .bind(input.due_date)
    .fetch_one(&pool).await.unwrap();
    (axum::http::StatusCode::CREATED, Json(task))
}

#[utoipa::path(get, path = "/tasks/{id}",
    responses((status = 200, description = "Get task", body = Task)))]
pub async fn get_task(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
) -> Result<Json<Task>, axum::http::StatusCode> {
    sqlx::query_as::<_, Task>(
        "SELECT id, title, status, priority, tags, due_date, created_at FROM tasks WHERE id = $1"
    ).bind(id).fetch_optional(&pool).await.unwrap()
    .map(Json)
    .ok_or(axum::http::StatusCode::NOT_FOUND)
}

#[utoipa::path(put, path = "/tasks/{id}", request_body = UpdateTask,
    responses((status = 200, description = "Task updated", body = Task)))]
pub async fn update_task(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
    Json(input): Json<UpdateTask>,
) -> Result<Json<Task>, axum::http::StatusCode> {
    let existing = sqlx::query_as::<_, Task>(
        "SELECT id, title, status, priority, tags, due_date, created_at FROM tasks WHERE id = $1"
    ).bind(id).fetch_optional(&pool).await.unwrap()
    .ok_or(axum::http::StatusCode::NOT_FOUND)?;

    let task = sqlx::query_as::<_, Task>(
        "UPDATE tasks SET title = $1, status = $2, priority = $3, tags = $4, due_date = $5 WHERE id = $6 RETURNING id, title, status, priority, tags, due_date, created_at"
    )
    .bind(input.title.unwrap_or(existing.title))
    .bind(input.status.unwrap_or(existing.status))
    .bind(input.priority.unwrap_or(existing.priority))
    .bind(input.tags.or(existing.tags))
    .bind(input.due_date.or(existing.due_date))
    .bind(id)
    .fetch_one(&pool).await.unwrap();
    Ok(Json(task))
}

#[utoipa::path(delete, path = "/tasks/{id}",
    responses((status = 204, description = "Task deleted")))]
pub async fn delete_task(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
) -> axum::http::StatusCode {
    let result = sqlx::query("DELETE FROM tasks WHERE id = $1")
        .bind(id)
        .execute(&pool).await.unwrap();
    if result.rows_affected() > 0 {
        axum::http::StatusCode::NO_CONTENT
    } else {
        axum::http::StatusCode::NOT_FOUND
    }
}
