use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;

pub async fn init_pool() -> PgPool {
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");

    PgPoolOptions::new()
        .max_connections(10)
        .connect(&database_url)
        .await
        .expect("Failed to connect to database")
}

pub async fn run_migrations(pool: &PgPool) {
    // Enable pgvector extension
    sqlx::query("CREATE EXTENSION IF NOT EXISTS vector")
        .execute(pool)
        .await
        .ok();

    // Create tables
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS metrics (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            category VARCHAR(50) NOT NULL,
            key VARCHAR(100) NOT NULL,
            value JSONB NOT NULL,
            recorded_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(255) NOT NULL,
            status VARCHAR(50) DEFAULT 'todo',
            priority INT DEFAULT 1,
            tags JSONB,
            due_date TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS system_knowledge (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            content TEXT NOT NULL,
            embedding vector(1536),
            source VARCHAR(100),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        "#,
    )
    .execute(pool)
    .await
    .expect("Failed to run migrations");

    tracing::info!("Database migrations completed");
}
