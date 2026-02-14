# Alfred OS - Contexte Projet

## Session 1-2 - 2026-02-13/14

### Etat actuel
- **Phase:** Production locale, toutes features implementees
- **Commits:** 15
- **Stack:** Rust (Axum) / Next.js 14 / PostgreSQL 16 + pgvector
- **Infra:** Docker Compose, 3 conteneurs, systemd timers

### Services actifs
| Service | Container | Port | Status |
|---------|-----------|------|--------|
| DB | alfred-db | 5432 | healthy |
| Backend | alfred-backend | 8080 | operational |
| Frontend | alfred-frontend | 3002->3000 | OK |
| Tailscale | - | HTTPS 3001->3002 | active |

### Timers systemd
- alfred-system-metrics.timer : toutes les 5min
- alfred-garmin-sync.timer : toutes les 30min

### Knowledge Base
- 31 entries, 9 sources, full-text search (french + simple + OR + ILIKE)
- RAG endpoint pour OpenClaw

### Garmin Data
- VO2max 58, resting HR 45, weekly 63.3km / 60 target
- North Trail Mont des Flandres 115km - 2026-04-19
- 10 activites recentes (running + yoga)

### Git Hook
- post-commit: auto-ingest _MEMORY modifies dans knowledge base
