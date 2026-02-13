# Alfred OS - Master Blueprint

## Mission
Dashboard Centralisé "Single Pane of Glass" avec capacités d'introspection pour Agent AI (OpenClaw).
Classification: RESTRICTED / TAILSCALE ONLY

## Directives
1. Souveraineté des données : 100% local (PostgreSQL)
2. AI-Native : OpenAPI + introspection endpoints
3. Performance : Rust Axum, latence < 50ms
4. Interface : Next.js 14 + Shadcn/UI, Bento Grid, Dark Mode
5. Hot-Reload : Volumes Docker montés

## Stack
- Backend: Rust (Axum) - API REST, tasks background, introspection
- Frontend: Next.js 14 - UI React, Server Components, Tailwind, Recharts/Tremor
- Database: PostgreSQL 16 + pgvector
- Infra: Docker Compose
- Sécurité: Tailscale VPN only

## Schema DB
- `metrics` : time-series flexible (category, key, value JSONB)
- `tasks` : gestion ops (title, status, priority, tags JSONB, due_date)
- `system_knowledge` : mémoire AI (content, embedding vector(1536), source)

## Ports
- Backend: 8080
- Frontend: 3000
- DB: 5432 (interne)
