# <img src="public/favicon.svg" alt="Cadanse logo" width="28" /> Cadanse

A dance school management app built for **seasons, classes, and show day**: student rosters, act lineups, performance-order generation, and a live public program.

## Core features

- **Seasons**: one active academic year at a time; past seasons stay available for reference.
- **Students and classes**: CRUD, class assignment per season, teachers and time slots.
- **Shows and acts**: multiple shows per season, acts linked to classes, participation managed per act.
- **Performance order**: constraint-aware generation (fixed positions, student spacing), manual tweaks, admin validation.
- **Roll call**: ephemeral class attendance view for the current session (not persisted).
- **Public program**: shareable read-only link with SSE updates on order validation and current act.

## Tech stack

- **App**: Next.js 16 (App Router), React 19, TypeScript, MUI, dnd-kit
- **API**: Next.js Route Handlers (REST + SSE)
- **Data**: PostgreSQL 18, Prisma 7
- **Auth**: NextAuth.js v5 (database sessions)
- **DevOps**: Docker Compose, GitHub Actions CI, release deployment workflow

## Quick start

### Prerequisites

Node.js 22+, pnpm 10+, Docker.

### Local development

```bash
cp .env.example .env
docker compose up -d db
pnpm install
pnpm prisma migrate dev
pnpm dev
```

- App: `http://localhost:3000`
- Database GUI: `pnpm prisma studio` → `http://localhost:5555`

### Production (Docker + Traefik)

`docker-compose.yml` targets a host already running Traefik (TLS termination, routing). It starts PostgreSQL, runs migrations, then the app with Traefik labels and an external `traefik` network. Set `APP_HOST` and the other production variables before deploy.

```bash
docker compose up --build -d
```

## Documentation

- `docs/vision.md`
- `docs/architecture.md`
- `docs/database.md`
- `docs/api.md`
- `docs/frontend.md`
- `docs/design.md`
