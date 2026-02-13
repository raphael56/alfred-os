# Alfred OS - Decisions Log

## 2026-02-13

### D001 - Backend Rust (Axum)
**Choix:** Axum (pas Actix)
**Raison:** Ecosystème Tower, intégration native avec Tokio, API ergonomique, meilleur support utoipa/swagger.

### D002 - PostgreSQL + pgvector
**Choix:** ankane/pgvector:v0.5.1
**Raison:** Extension vectorielle pour mémoire sémantique (RAG local OpenClaw). Pas de dépendance externe.

### D003 - Utoipa pour OpenAPI
**Choix:** utoipa v4.2 + utoipa-swagger-ui v6.0
**Raison:** Génération auto de la doc Swagger depuis les annotations Rust. Critique pour l'introspection AI.

### D004 - Next.js 14 + Shadcn/UI
**Choix:** App Router + Server Components + Shadcn
**Raison:** Composants accessibles, design system cohérent, Tailwind natif, Dark Mode facile.

### D005 - Docker Compose pour orchestration
**Choix:** docker-compose v3.8
**Raison:** Simplicité, réseau isolé, hot-reload via bind mounts. Pas besoin de K8s pour un dashboard perso.

### D006 - Garmin sync via bridge script
**Choix:** Réutiliser garmin-sync.py d'alfred-dashboard + POST vers /sync/garmin
**Raison:** Le travail de connexion Garmin Connect est déjà fait. On crée un pont plutôt que de recoder. Les données sont décomposées en métriques individuelles côté backend Rust pour requêtes rapides.

### D007 - Volume monté pour refresh Garmin
**Choix:** Monter /home/raphael56/alfred-dashboard/data en read-only dans le container backend
**Raison:** Le bouton Sync du dashboard appelle POST /sync/garmin/refresh qui lit directement garmin.json depuis le volume monté. Pas besoin d'exécuter des scripts Python depuis Docker.

### D008 - Systemd user timers pour cron
**Choix:** systemd --user timers plutôt que crontab
**Raison:** Persistent=true, logging natif via journalctl, pas besoin de sudo. Garmin toutes les 30min, system metrics toutes les 5min.
