# <img src="public/favicon.svg" alt="Cadanse logo" width="28" /> Cadanse

A dance school management app built for **seasons, classes, and show day**: student rosters, act lineups, performance-order generation, stage placements, and a live public program.

## Core features

- **Seasons**: one active academic year at a time; past seasons stay available for reference.
- **Students and classes**: CRUD, class assignment per season, teachers and time slots.
- **Shows and acts**: multiple shows per season, acts optionally linked to classes, with optional description and duration; participation managed per act.
- **Stage placements**: scene-based positioning with x/y coordinates for each student on stage.
- **Performance order**: constraint-aware generation (fixed positions, student spacing), manual tweaks, admin validation.
- **Live show**: advance the current act from the live console and broadcast updates to spectators in real time.
- **Roll call**: ephemeral class attendance view for the current session (not persisted).
- **Public program**: shareable read-only link with SSE updates on order validation and current act, plus a public per-act stage placements view.
- **Admin onboarding**: super-admin invites admins via single-use, time-limited invite links.

## Tech stack

| Layer | Tech |
|---|---|
| App | Next.js 16 (App Router), React 19, TypeScript |
| UI | MUI v9, dnd-kit |
| API | Next.js Route Handlers (REST + SSE) |
| Data | PostgreSQL 18, Prisma 7 |
| Auth | NextAuth.js v5 (JWT sessions) |
| DevOps | Docker Compose, GitHub Actions CI, release deployment workflow |

## Quick start

### Prerequisites

Node.js 22+, pnpm 10+, PostgreSQL 18.

### Local development

```bash
cp .env.example .env        # Edit with your DB URL and auth secrets
pnpm install
pnpm prisma migrate dev
pnpm dev
```

- App: `http://localhost:3000`
- Database GUI: `pnpm prisma studio` → `http://localhost:5555`

### Production (Docker)

Images are built in CI on a cloud arm64 runner and pushed to GHCR; the Pi only
pulls and runs them. `docker-compose.yml` targets a host already running an
external reverse proxy on the shared `edge` network (TLS + routing live in the
proxy, outside this repo). It starts PostgreSQL, runs migrations, then the app.
Deployment is driven by the `Deploy` workflow (GitHub Release / manual dispatch);
set the production secrets in the `production` environment beforehand.

```bash
# Manual equivalent on the host (CI does this automatically):
docker compose pull && docker compose up -d
```

## Documentation

| File | Content |
|---|---|
| [`docs/vision.md`](docs/vision.md) | Problem statement, use cases, scope |
| [`docs/architecture.md`](docs/architecture.md) | Stack decisions, infra, auth strategy |
| [`docs/database.md`](docs/database.md) | Prisma schema, all entities + relationships |
| [`docs/api.md`](docs/api.md) | REST endpoints, auth rules, error codes |
| [`docs/frontend.md`](docs/frontend.md) | Routes, layouts, data fetching patterns |
| [`docs/design.md`](docs/design.md) | UI system, colors, typography, tone |
