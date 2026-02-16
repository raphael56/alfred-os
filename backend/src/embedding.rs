use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
struct EmbeddingRequest {
    model: String,
    input: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct EmbeddingResponse {
    data: Vec<EmbeddingData>,
}

#[derive(Debug, Deserialize)]
struct EmbeddingData {
    embedding: Vec<f32>,
}

/// Get embedding config from env vars.
/// Returns (api_url, model) or None if not configured.
fn get_config() -> Option<(String, String)> {
    let url = std::env::var("EMBEDDING_API_URL").ok()?;
    if url.is_empty() { return None; }
    let model = std::env::var("EMBEDDING_MODEL").unwrap_or_else(|_| "nomic-embed-text".to_string());
    Some((url, model))
}

/// Generate embeddings for a list of texts via OpenAI-compatible API.
/// Returns None if embedding API is not configured or call fails.
pub async fn embed_texts(texts: &[String]) -> Option<Vec<Vec<f32>>> {
    let (api_url, model) = get_config()?;
    if texts.is_empty() { return Some(vec![]); }

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .ok()?;

    let mut headers = reqwest::header::HeaderMap::new();
    if let Ok(token) = std::env::var("EMBEDDING_API_KEY") {
        if !token.is_empty() {
            headers.insert(
                reqwest::header::AUTHORIZATION,
                format!("Bearer {}", token).parse().ok()?,
            );
        }
    }

    let req = EmbeddingRequest {
        model,
        input: texts.to_vec(),
    };

    let resp = client
        .post(&api_url)
        .headers(headers)
        .json(&req)
        .send()
        .await
        .ok()?;

    if !resp.status().is_success() {
        tracing::warn!("Embedding API returned status {}", resp.status());
        return None;
    }

    let body: EmbeddingResponse = resp.json().await.ok()?;
    Some(body.data.into_iter().map(|d| d.embedding).collect())
}

/// Generate embedding for a single text.
pub async fn embed_one(text: &str) -> Option<Vec<f32>> {
    let results = embed_texts(&[text.to_string()]).await?;
    results.into_iter().next()
}

/// Check if embedding API is configured.
pub fn is_configured() -> bool {
    get_config().is_some()
}

/// Store embedding for a knowledge entry in the DB.
pub async fn store_embedding(pool: &sqlx::PgPool, id: uuid::Uuid, embedding: &[f32]) {
    let emb_str = format!("[{}]", embedding.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(","));
    let _ = sqlx::query("UPDATE system_knowledge SET embedding = $1::vector WHERE id = $2")
        .bind(&emb_str)
        .bind(id)
        .execute(pool)
        .await;
}
