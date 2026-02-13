# Alfred OS - Contexte Projet

## Session 1 - 2026-02-13

### Etat actuel
- **Phase:** Initialisation (Phase A + B)
- **Stack:** Rust (Axum) / Next.js 14 / PostgreSQL 16 + pgvector
- **Infra:** Docker Compose, Tailscale only
- **Objectif:** Dashboard souverain "Single Pane of Glass" + introspection AI (OpenClaw)

### Architecture
- Backend Rust Axum sur port 8080 avec Swagger UI (`/swagger-ui`)
- Frontend Next.js 14 sur port 3000 avec Shadcn/UI (Bento Grid, Dark Mode)
- PostgreSQL 16 + pgvector pour stockage local + mémoire vectorielle
- Réseau Docker isolé (`alfred-net`)
- Hot-reload via bind mounts

### Choix techniques
- Image DB: `ankane/pgvector:v0.5.1`
- Utoipa pour documentation OpenAPI auto
- CORS permissif en dev
- Zero Trust : accès Tailscale uniquement
