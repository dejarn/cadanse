# Architecture

_Last updated: 2026-05-07_

## Overview

Single full-stack Next.js application. No separate backend process. PostgreSQL runs as a Docker container on the same host. Real-time updates use Server-Sent Events (SSE) via standard Route Handlers — no custom server required.

```
Browser
  │
  ├── HTTPS ──► Traefik (reverse proxy)
  │                  │
  │                  ▼
  │            Next.js (App Router)
  │              ├── React Server Components (pages, layouts)
  │              ├── Client Components (interactive UI)
  │              ├── Route Handlers (REST API + SSE)
  │              └── Prisma Client ──► PostgreSQL
  │
  └── SSE (public link) ──► Route Handler ──► PostgreSQL
```

## Stack

| Layer | Technology | Role |
|---|---|---|
| Frontend | Next.js 15 App Router + React | Pages, layouts, client components |
| API | Next.js Route Handlers | REST endpoints, SSE stream |
| ORM | Prisma | Schema, migrations, type-safe queries |
| Database | PostgreSQL 16 | Persistent data store |
| Auth | NextAuth.js v5 (Auth.js) | Session-based authentication |
| Real-time | SSE via Route Handler | Live performance order updates (public view) |
| Styling | MUI (Material UI) | Component library — mobile-first |
| Testing | Vitest | Unit tests for the ordering algorithm |
| Linting | ESLint + Prettier | Code style enforcement |
| Language | TypeScript (strict mode) | End-to-end type safety |

## Authentication & Authorization

- **Strategy**: Database sessions (NextAuth.js). Session token stored in DB, renewed silently on each request. No forced re-login unless explicit logout or extended inactivity.
- **Roles**: `SUPER_ADMIN`, `ADMIN`. Role stored on the `User` model.
- **Super-admin**: Single account, credentials hardcoded in environment variables. Only account that can create/manage admin accounts.
- **Public access**: Performance order public link requires no authentication. Route is fully public.
- **Protected routes**: All `/app/*` routes require an active session. Middleware enforces this at the edge.

## Real-time (SSE)

The public performance order view connects to a SSE Route Handler (`GET /api/public/shows/[slug]/stream`). When an admin updates or validates a performance order, the server broadcasts the new order to all connected clients. No WebSocket, no external service.

## Data strategy

- Single source of truth: PostgreSQL.
- No client-side cache beyond React state (no SWR/React Query for admin views). Public view uses native `EventSource` SSE — no polling, no cache layer.
- SSE stream pushes full order payload on each update (small payload, simplifies client logic).

## Infrastructure

| Component | Details |
|---|---|
| Host | Raspberry Pi (self-hosted) |
| Containerization | Docker Compose |
| Reverse proxy | Traefik (TLS termination, routing) |
| Container registry | GitHub Container Registry (ghcr.io) |
| CI | GitHub Actions — lint, typecheck, Vitest on every PR |
| CD | GitHub Actions self-hosted runner on Pi — triggered on release, pulls new image, restarts compose |

### Docker Compose services

| Service | Image |
|---|---|
| `app` | Custom Next.js image (multi-stage build) |
| `db` | `postgres:16-alpine` |

Database data persisted via Docker volume. App connects to DB via internal Docker network.

## Decisions

| Decision | Choice | Reason |
|---|---|---|
| Full-stack in Next.js | Yes | Single codebase, no inter-service overhead, sufficient for load |
| No custom server | SSE over Route Handlers | Unidirectional stream is enough; avoids `ws` complexity |
| ORM | Prisma | Type-safe queries, auto migrations, Prisma Studio for DB inspection |
| Auth strategy | NextAuth.js + DB sessions | Minimal re-authentication, session lifespan configurable |
| Real-time transport | SSE | Server-to-client only; simpler than WebSocket for this use case |
| Testing scope | Vitest on algorithm only | CRUD correctness covered by TypeScript; algorithm has non-trivial edge cases |
| Deployment trigger | GitHub Release | Stable, explicit promotion gate before hitting production |
