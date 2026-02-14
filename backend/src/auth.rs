use axum::{
    http::{Request, StatusCode},
    middleware::Next,
    response::Response,
};

/// Simple token auth middleware for write operations.
/// Reads ALFRED_API_TOKEN from env. If not set, auth is disabled.
/// Only protects POST/PUT/DELETE requests. GET is always open.
pub async fn auth_middleware(
    req: Request<axum::body::Body>,
    next: Next,
) -> Result<Response, StatusCode> {
    let method = req.method().clone();

    // GET requests are always allowed
    if method == axum::http::Method::GET {
        return Ok(next.run(req).await);
    }

    // Health check is always allowed
    if req.uri().path() == "/health" {
        return Ok(next.run(req).await);
    }

    // If no token configured, auth is disabled
    let token = match std::env::var("ALFRED_API_TOKEN") {
        Ok(t) if !t.is_empty() => t,
        _ => return Ok(next.run(req).await),
    };

    // Check Authorization header
    let auth_header = req.headers()
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    let provided_token = auth_header.strip_prefix("Bearer ").unwrap_or(auth_header);

    if provided_token == token {
        Ok(next.run(req).await)
    } else {
        Err(StatusCode::UNAUTHORIZED)
    }
}
