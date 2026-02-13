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

## Todo
- [ ] Ameliorer dashboard (filtres tasks, formulaire ajout metrique, pagination)
- [ ] Cron automatique garmin-sync (systemd timer ou cron)
- [ ] Collecte metriques systeme auto (cpu, memory, disk)
- [ ] Authentification (si expose au-dela Tailscale)
