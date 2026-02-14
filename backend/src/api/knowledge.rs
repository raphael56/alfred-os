use axum::{extract::{Path, State, Query}, Json};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, FromRow};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, FromRow, utoipa::ToSchema)]
pub struct Knowledge {
    pub id: Uuid,
    pub content: String,
    pub source: Option<String>,
    pub tags: Option<Vec<String>>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct CreateKnowledge {
    pub content: String,
    pub source: Option<String>,
    pub tags: Option<Vec<String>>,
    pub metadata: Option<serde_json::Value>,
    /// Optional pre-computed embedding vector (1536 dimensions)
    pub embedding: Option<Vec<f32>>,
}

#[derive(Debug, Deserialize, utoipa::IntoParams)]
pub struct KnowledgeFilter {
    pub source: Option<String>,
    pub tag: Option<String>,
    pub limit: Option<i64>,
}

#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct SearchQuery {
    pub query: String,
    /// Optional embedding vector for semantic search
    pub embedding: Option<Vec<f32>>,
    pub limit: Option<i64>,
}

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub struct SearchResult {
    pub id: Uuid,
    pub content: String,
    pub source: Option<String>,
    pub tags: Option<Vec<String>>,
    pub score: f64,
    pub match_type: String,
}

/// List all knowledge entries
#[utoipa::path(get, path = "/knowledge", params(KnowledgeFilter),
    responses((status = 200, description = "List knowledge entries", body = Vec<Knowledge>)))]
pub async fn list_knowledge(
    State(pool): State<PgPool>,
    Query(filter): Query<KnowledgeFilter>,
) -> Json<Vec<Knowledge>> {
    let limit = filter.limit.unwrap_or(50);

    let entries = match (&filter.source, &filter.tag) {
        (Some(src), Some(tag)) => {
            sqlx::query_as::<_, Knowledge>(
                "SELECT id, content, source, tags, metadata, created_at, updated_at FROM system_knowledge WHERE source = $1 AND $2 = ANY(tags) ORDER BY updated_at DESC LIMIT $3"
            ).bind(src).bind(tag).bind(limit).fetch_all(&pool).await.unwrap_or_default()
        }
        (Some(src), None) => {
            sqlx::query_as::<_, Knowledge>(
                "SELECT id, content, source, tags, metadata, created_at, updated_at FROM system_knowledge WHERE source = $1 ORDER BY updated_at DESC LIMIT $2"
            ).bind(src).bind(limit).fetch_all(&pool).await.unwrap_or_default()
        }
        (None, Some(tag)) => {
            sqlx::query_as::<_, Knowledge>(
                "SELECT id, content, source, tags, metadata, created_at, updated_at FROM system_knowledge WHERE $1 = ANY(tags) ORDER BY updated_at DESC LIMIT $2"
            ).bind(tag).bind(limit).fetch_all(&pool).await.unwrap_or_default()
        }
        _ => {
            sqlx::query_as::<_, Knowledge>(
                "SELECT id, content, source, tags, metadata, created_at, updated_at FROM system_knowledge ORDER BY updated_at DESC LIMIT $1"
            ).bind(limit).fetch_all(&pool).await.unwrap_or_default()
        }
    };
    Json(entries)
}

/// Add knowledge entry
#[utoipa::path(post, path = "/knowledge", request_body = CreateKnowledge,
    responses((status = 201, description = "Knowledge stored", body = Knowledge)))]
pub async fn create_knowledge(
    State(pool): State<PgPool>,
    Json(input): Json<CreateKnowledge>,
) -> (axum::http::StatusCode, Json<Knowledge>) {
    let tags = input.tags.unwrap_or_default();
    let metadata = input.metadata.unwrap_or(serde_json::json!({}));

    let entry = if let Some(ref emb) = input.embedding {
        let emb_str = format!("[{}]", emb.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(","));
        sqlx::query_as::<_, Knowledge>(
            "INSERT INTO system_knowledge (content, source, tags, metadata, embedding) VALUES ($1, $2, $3, $4, $5::vector) RETURNING id, content, source, tags, metadata, created_at, updated_at"
        )
        .bind(&input.content)
        .bind(&input.source)
        .bind(&tags)
        .bind(&metadata)
        .bind(&emb_str)
        .fetch_one(&pool).await.unwrap()
    } else {
        sqlx::query_as::<_, Knowledge>(
            "INSERT INTO system_knowledge (content, source, tags, metadata) VALUES ($1, $2, $3, $4) RETURNING id, content, source, tags, metadata, created_at, updated_at"
        )
        .bind(&input.content)
        .bind(&input.source)
        .bind(&tags)
        .bind(&metadata)
        .fetch_one(&pool).await.unwrap()
    };

    (axum::http::StatusCode::CREATED, Json(entry))
}

/// Get a specific knowledge entry
#[utoipa::path(get, path = "/knowledge/{id}",
    responses((status = 200, description = "Knowledge entry", body = Knowledge)))]
pub async fn get_knowledge(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
) -> Result<Json<Knowledge>, axum::http::StatusCode> {
    let entry = sqlx::query_as::<_, Knowledge>(
        "SELECT id, content, source, tags, metadata, created_at, updated_at FROM system_knowledge WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(&pool).await.unwrap();

    entry.map(Json).ok_or(axum::http::StatusCode::NOT_FOUND)
}

/// Delete a knowledge entry
#[utoipa::path(delete, path = "/knowledge/{id}",
    responses((status = 204, description = "Knowledge deleted")))]
pub async fn delete_knowledge(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
) -> axum::http::StatusCode {
    let result = sqlx::query("DELETE FROM system_knowledge WHERE id = $1")
        .bind(id)
        .execute(&pool).await.unwrap();
    if result.rows_affected() > 0 {
        axum::http::StatusCode::NO_CONTENT
    } else {
        axum::http::StatusCode::NOT_FOUND
    }
}

/// Search knowledge using semantic (vector) or full-text search
#[utoipa::path(post, path = "/knowledge/search", request_body = SearchQuery,
    responses((status = 200, description = "Search results", body = Vec<SearchResult>)))]
pub async fn search_knowledge(
    State(pool): State<PgPool>,
    Json(input): Json<SearchQuery>,
) -> Json<Vec<SearchResult>> {
    let limit = input.limit.unwrap_or(10);

    // If embedding provided, do vector similarity search
    if let Some(ref emb) = input.embedding {
        let emb_str = format!("[{}]", emb.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(","));
        let results = sqlx::query_as::<_, (Uuid, String, Option<String>, Option<Vec<String>>, f64)>(
            "SELECT id, content, source, tags, 1 - (embedding <=> $1::vector) as score FROM system_knowledge WHERE embedding IS NOT NULL ORDER BY embedding <=> $1::vector LIMIT $2"
        )
        .bind(&emb_str)
        .bind(limit)
        .fetch_all(&pool)
        .await
        .unwrap_or_default();

        return Json(results.into_iter().map(|(id, content, source, tags, score)| SearchResult {
            id, content, source, tags, score, match_type: "semantic".to_string(),
        }).collect());
    }

    // Fallback: PostgreSQL full-text search
    let results = sqlx::query_as::<_, (Uuid, String, Option<String>, Option<Vec<String>>, f64)>(
        "SELECT id, content, source, tags, ts_rank(tsv, plainto_tsquery('french', $1))::float8 as score FROM system_knowledge WHERE tsv @@ plainto_tsquery('french', $1) ORDER BY score DESC LIMIT $2"
    )
    .bind(&input.query)
    .bind(limit)
    .fetch_all(&pool)
    .await
    .unwrap_or_default();

    if !results.is_empty() {
        return Json(results.into_iter().map(|(id, content, source, tags, score)| SearchResult {
            id, content, source, tags, score, match_type: "fulltext".to_string(),
        }).collect());
    }

    // Last fallback: ILIKE search
    let pattern = format!("%{}%", input.query);
    let results = sqlx::query_as::<_, (Uuid, String, Option<String>, Option<Vec<String>>)>(
        "SELECT id, content, source, tags FROM system_knowledge WHERE content ILIKE $1 ORDER BY updated_at DESC LIMIT $2"
    )
    .bind(&pattern)
    .bind(limit)
    .fetch_all(&pool)
    .await
    .unwrap_or_default();

    Json(results.into_iter().map(|(id, content, source, tags)| SearchResult {
        id, content, source, tags, score: 0.5, match_type: "keyword".to_string(),
    }).collect())
}

/// Bulk ingest knowledge (for importing _MEMORY files, docs, etc.)
#[utoipa::path(post, path = "/knowledge/ingest",
    responses((status = 200, description = "Bulk knowledge ingested")))]
pub async fn ingest_knowledge(
    State(pool): State<PgPool>,
    Json(input): Json<serde_json::Value>,
) -> Json<serde_json::Value> {
    let mut count = 0u32;

    if let Some(entries) = input.get("entries").and_then(|v| v.as_array()) {
        for entry in entries {
            let content = entry.get("content").and_then(|v| v.as_str()).unwrap_or("");
            if content.is_empty() { continue; }
            let source = entry.get("source").and_then(|v| v.as_str());
            let tags: Vec<String> = entry.get("tags")
                .and_then(|v| v.as_array())
                .map(|a| a.iter().filter_map(|v| v.as_str().map(String::from)).collect())
                .unwrap_or_default();
            let metadata = entry.get("metadata").cloned().unwrap_or(serde_json::json!({}));

            let _ = sqlx::query(
                "INSERT INTO system_knowledge (content, source, tags, metadata) VALUES ($1, $2, $3, $4)"
            )
            .bind(content)
            .bind(source)
            .bind(&tags)
            .bind(&metadata)
            .execute(&pool)
            .await;

            count += 1;
        }
    }

    // Also support single-text chunking mode
    if let Some(text) = input.get("text").and_then(|v| v.as_str()) {
        let source = input.get("source").and_then(|v| v.as_str());
        let chunk_size = input.get("chunk_size").and_then(|v| v.as_u64()).unwrap_or(500) as usize;

        let chunks = chunk_text(text, chunk_size);
        for (i, chunk) in chunks.iter().enumerate() {
            let meta = serde_json::json!({"chunk_index": i, "total_chunks": chunks.len()});
            let _ = sqlx::query(
                "INSERT INTO system_knowledge (content, source, tags, metadata) VALUES ($1, $2, $3, $4)"
            )
            .bind(chunk)
            .bind(source)
            .bind(&vec!["auto-chunk".to_string()])
            .bind(&meta)
            .execute(&pool)
            .await;
            count += 1;
        }
    }

    Json(serde_json::json!({
        "status": "ingested",
        "entries": count
    }))
}

/// Get knowledge stats
#[utoipa::path(get, path = "/knowledge/stats",
    responses((status = 200, description = "Knowledge base statistics")))]
pub async fn knowledge_stats(
    State(pool): State<PgPool>,
) -> Json<serde_json::Value> {
    let total = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM system_knowledge")
        .fetch_one(&pool).await.unwrap_or(0);

    let with_embeddings = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM system_knowledge WHERE embedding IS NOT NULL")
        .fetch_one(&pool).await.unwrap_or(0);

    let sources = sqlx::query_as::<_, (Option<String>, i64)>(
        "SELECT source, COUNT(*) as cnt FROM system_knowledge GROUP BY source ORDER BY cnt DESC"
    ).fetch_all(&pool).await.unwrap_or_default();

    let tags = sqlx::query_as::<_, (String, i64)>(
        "SELECT unnest(tags) as tag, COUNT(*) as cnt FROM system_knowledge GROUP BY tag ORDER BY cnt DESC LIMIT 20"
    ).fetch_all(&pool).await.unwrap_or_default();

    Json(serde_json::json!({
        "total_entries": total,
        "with_embeddings": with_embeddings,
        "sources": sources.iter().map(|(s, c)| serde_json::json!({"source": s, "count": c})).collect::<Vec<_>>(),
        "top_tags": tags.iter().map(|(t, c)| serde_json::json!({"tag": t, "count": c})).collect::<Vec<_>>(),
    }))
}

fn chunk_text(text: &str, chunk_size: usize) -> Vec<String> {
    let sentences: Vec<&str> = text.split(|c: char| c == '.' || c == '\n')
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .collect();

    let mut chunks = Vec::new();
    let mut current = String::new();

    for sentence in sentences {
        if current.len() + sentence.len() > chunk_size && !current.is_empty() {
            chunks.push(current.clone());
            current.clear();
        }
        if !current.is_empty() { current.push_str(". "); }
        current.push_str(sentence);
    }
    if !current.is_empty() {
        chunks.push(current);
    }
    if chunks.is_empty() && !text.is_empty() {
        chunks.push(text.to_string());
    }
    chunks
}
