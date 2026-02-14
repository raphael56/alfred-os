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

    // Create metrics table
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS metrics (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            category VARCHAR(50) NOT NULL,
            key VARCHAR(100) NOT NULL,
            value JSONB NOT NULL,
            recorded_at TIMESTAMPTZ DEFAULT NOW()
        )"
    )
    .execute(pool)
    .await
    .expect("Failed to create metrics table");

    // Create tasks table
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS tasks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(255) NOT NULL,
            status VARCHAR(50) DEFAULT 'todo',
            priority INT DEFAULT 1,
            tags JSONB,
            due_date TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )"
    )
    .execute(pool)
    .await
    .expect("Failed to create tasks table");

    // Create system_knowledge table with full-text search support
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS system_knowledge (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            content TEXT NOT NULL,
            embedding vector(1536),
            source VARCHAR(100),
            tags TEXT[] DEFAULT '{}',
            metadata JSONB DEFAULT '{}',
            tsv tsvector GENERATED ALWAYS AS (to_tsvector('french', content)) STORED,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )"
    )
    .execute(pool)
    .await
    .expect("Failed to create system_knowledge table");

    // Migrate: add new columns if missing
    sqlx::query("ALTER TABLE system_knowledge ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'")
        .execute(pool).await.ok();
    sqlx::query("ALTER TABLE system_knowledge ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'")
        .execute(pool).await.ok();
    sqlx::query("ALTER TABLE system_knowledge ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()")
        .execute(pool).await.ok();
    // tsv generated column - add only if not exists
    sqlx::query("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='system_knowledge' AND column_name='tsv') THEN ALTER TABLE system_knowledge ADD COLUMN tsv tsvector GENERATED ALWAYS AS (to_tsvector('french', content)) STORED; END IF; END $$")
        .execute(pool).await.ok();

    // Index for full-text search
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_knowledge_tsv ON system_knowledge USING gin(tsv)")
        .execute(pool)
        .await
        .ok();

    // Index for vector similarity search
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON system_knowledge USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10)")
        .execute(pool)
        .await
        .ok();

    tracing::info!("Database migrations completed");
}
