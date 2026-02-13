# Alfred OS - Contexte Projet

## Session 1 - 2026-02-13

### Etat actuel
- **Phase:** Infra deployee, tous services UP
- **Stack:** Rust (Axum) / Next.js 14 / PostgreSQL 16 + pgvector
- **Infra:** Docker Compose, 3 conteneurs operationnels

### Services actifs
| Service | Container | Port | Status |
|---------|-----------|------|--------|
| DB | alfred-db | 5432 (interne) | healthy |
| Backend | alfred-backend | 8080 | operational |
| Frontend | alfred-frontend | 3001 (remap) | OK |

### Endpoints disponibles
- `http://localhost:8080/health` -> {"status": "operational"}
- `http://localhost:8080/sys/schema` -> liste des tables
- `http://localhost:8080/swagger-ui/` -> Documentation OpenAPI
- `http://localhost:3001` -> Frontend Next.js

### Tables DB creees
- `metrics` (category, key, value JSONB, recorded_at)
- `tasks` (title, status, priority, tags JSONB, due_date)
- `system_knowledge` (content, embedding vector(1536), source)

### Fixes appliques
- Rust image: `rust:slim-bookworm` (latest stable, edition2024 support)
- SQLx: migrations separees (1 CREATE TABLE par query)
- Frontend: port remappé 3001->3000 (port 3000 occupé par un autre process Node)
