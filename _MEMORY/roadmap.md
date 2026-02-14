# Alfred OS - Roadmap

## Done
- [x] Bootstrap projet + _MEMORY + Git
- [x] Docker Compose (DB pgvector + Backend Rust + Frontend Next.js)
- [x] Backend: /health, /sys/schema, /swagger-ui
- [x] Backend: CRUD Tasks + CRUD Metrics + Swagger OpenAPI
- [x] Frontend: Bento Grid Dashboard (Recharts, TaskStats, auto-refresh 15s)
- [x] Proxy API Next.js rewrites -> backend Docker interne
- [x] Tailscale HTTPS serve (3001 -> 3002 -> Docker)
- [x] Tests integration backend : 3/3 passing (health, task_crud, metric_crud)
- [x] _SKILLS/check_health.sh
- [x] 3 commits Git

- [x] Garmin sync: /sync/garmin, /sync/usage, /garmin/latest endpoints
- [x] _SKILLS/sync-garmin.sh (bridge alfred-dashboard -> Alfred OS)
- [x] Frontend: GarminDashboard (race countdown, fitness rings, training load, body, activities)

- [x] Collecte metriques systeme: POST /metrics/system (CPU, memory, disk via /proc)
- [x] _SKILLS/collect-system.sh
- [x] Dashboard: SystemMetrics component (gauge bars + mini sparkline history)
- [x] Dashboard: Task filters (All/Todo/Active/Done) + formulaire ajout metrique

- [x] Bouton Sync Garmin sur le dashboard (POST /sync/garmin/refresh via volume monté)
- [x] Cron automatique: systemd timers (garmin 30min, system metrics 5min)
- [x] _SKILLS/cron-setup.sh

- [x] pgvector: Knowledge Base RAG (CRUD, full-text search, semantic search, bulk ingest, chunking)
- [x] Frontend: KnowledgeBase component (search/browse views, add entries, delete, source/tag display)
- [x] _SKILLS/ingest-memory.sh (auto-ingest _MEMORY/*.md files)

- [x] Endpoint OpenClaw RAG: POST /knowledge/query -> contexte enrichi (knowledge + tasks + system + garmin)
- [x] Full-text search amélioré: french AND -> simple AND -> simple OR -> ILIKE (4 niveaux de fallback)

- [x] AI usage dashboard: OpenClaw tokens, cost, models, latency, success rate (weekly + daily)

## Todo
- [ ] Authentification (si expose au-dela Tailscale)
- [ ] Webhook: auto-ingest _MEMORY sur git push
- [ ] Notifications / alertes (seuils system, training load)
