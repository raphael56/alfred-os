# Alfred OS - Master Blueprint

## Mission
Dashboard Centralisé "Single Pane of Glass" avec capacités d'introspection pour Agent AI (OpenClaw).
Classification: RESTRICTED / TAILSCALE ONLY

## Stack
- Backend: Rust (Axum 0.7) - API REST, auth middleware, introspection
- Frontend: Next.js 14 - App Router, Tailwind, Recharts, Dark Mode
- Database: PostgreSQL 16 + pgvector (ankane/pgvector:v0.5.1)
- Infra: Docker Compose (3 services)
- Sécurité: Tailscale VPN + Bearer token optionnel
- Cron: systemd user timers

## API Endpoints (26 routes)
### Core
- GET /health, GET /sys/schema, GET /swagger-ui/

### Tasks CRUD
- GET/POST /tasks, GET/PUT/DELETE /tasks/:id

### Metrics
- GET/POST /metrics, DELETE /metrics/:id
- POST /metrics/system (CPU, memory, disk)
- GET /metrics/history?category=&key=&days=

### Garmin Sync
- POST /sync/garmin, POST /sync/usage
- POST /sync/garmin/refresh (lit depuis volume monté)
- GET /garmin/latest

### Knowledge Base (RAG)
- GET/POST /knowledge, GET/DELETE /knowledge/:id
- POST /knowledge/search (semantic + fulltext 4 niveaux)
- POST /knowledge/ingest (bulk + chunking auto)
- GET /knowledge/stats
- POST /knowledge/query (contexte enrichi pour OpenClaw)

### System
- GET /alerts (seuils configurables)
- GET/PUT /settings
- GET /report/weekly

## Schema DB
- `metrics` : time-series (category, key, value JSONB, recorded_at)
- `tasks` : ops (title, status, priority, tags JSONB, due_date)
- `system_knowledge` : RAG (content, embedding vector(1536), source, tags, tsv, metadata)

## Frontend Components (12)
GarminDashboard, SystemMetrics, TaskStats, MetricsChart, SportHistory,
KnowledgeBase, AiUsage, Settings page, Alert banner, ProgressRing, GaugeBar

## Ports
- Tailscale HTTPS: 3001 -> localhost:3002
- Frontend Docker: 3002 -> 3000 (Next.js)
- Backend Docker: 8080
- DB: 5432

## Skills
- sync-garmin.sh, collect-system.sh, ingest-memory.sh, cron-setup.sh, check_health.sh
