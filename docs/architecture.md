# Architecture

_Last updated: 2026-05-26_

## Overview

Single full-stack Next.js application. No separate backend process. PostgreSQL runs as a Docker container on the same host. Real-time updates use Server-Sent Events (SSE) via standard Route Handlers — no custom server required.

```
Browser
  │
  ├── HTTPS ──► external reverse proxy (TLS)
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
| Frontend | Next.js 16 App Router + React 19 | Pages, layouts, client components |
| API | Next.js Route Handlers | REST endpoints, SSE stream |
| ORM | Prisma 7 | Schema, migrations, type-safe queries |
| Database | PostgreSQL 18 | Persistent data store |
| Auth | NextAuth.js v5 (Auth.js) | Session-based authentication |
| Real-time | SSE via Route Handler | Live performance order updates (public view) |
| Styling | MUI v9 (Material UI) | Component library — mobile-first |
| Testing | Vitest | Unit tests for the ordering algorithm |
| Linting | ESLint + Prettier | Code style enforcement |
| Language | TypeScript (strict mode) | End-to-end type safety |

## Authentication & Authorization

- **Strategy**: JWT sessions (NextAuth.js). Token stored in cookie, maxAge 8h. No database session storage.
- **Roles**: `SUPER_ADMIN`, `ADMIN`. Role stored on the `User` model.
- **Super-admin**: Single account, credentials hardcoded in environment variables. Only account that can create/manage admin accounts.
- **Public access**: Performance order public link requires no authentication. Route is fully public.
- **Protected routes**: All `/app/*` routes require an active session. Middleware enforces this.

## Real-time (SSE)

The public performance order view connects to a SSE Route Handler (`GET /api/public/shows/[slug]/stream`). When an admin updates/validates a performance order or advances the current act, the server broadcasts the new order to all connected clients. No WebSocket, no external service.

## Data strategy

- Single source of truth: PostgreSQL.
- No client-side cache beyond React state (no SWR/React Query for admin views). Public view uses native `EventSource` SSE — no polling, no cache layer.
- SSE stream pushes full order payload on each update (small payload, simplifies client logic).

## Infrastructure

| Component | Details |
|---|---|
| Host | Raspberry Pi (self-hosted) |
| Containerization | Docker Compose |
| Reverse proxy | External reverse proxy on the shared `edge` network (TLS + routing configured in the proxy itself, outside this repo) |
| Container registry | GitHub Container Registry (ghcr.io) |
| CI | GitHub Actions — lint, typecheck, Vitest on every PR |
| CD | GitHub Actions — image built & pushed to GHCR on a cloud arm64 runner; the Pi's self-hosted runner only pulls and restarts compose (release or manual dispatch) |

### Docker Compose services

| Service | Image |
|---|---|
| `app` | Custom Next.js image (multi-stage build) |
| `db` | `postgres:18-alpine` |

Database data persisted via Docker volume. App connects to DB via internal Docker network.

`docker-compose.yml` is production-only (reverse-proxy network join, resource limits, Pi networking). Local dev uses `pnpm dev` with a local PostgreSQL instance.

## Decisions

| Decision | Choice | Reason |
|---|---|---|
| Full-stack in Next.js | Yes | Single codebase, no inter-service overhead, sufficient for load |
| No custom server | SSE over Route Handlers | Unidirectional stream is enough; avoids `ws` complexity |
| ORM | Prisma | Type-safe queries, auto migrations, Prisma Studio for DB inspection |
| Auth strategy | NextAuth.js + JWT sessions | Stateless, no DB session storage, cookie-based |
| Real-time transport | SSE | Server-to-client only; simpler than WebSocket for this use case |
| Testing scope | Vitest on algorithm only | CRUD correctness covered by TypeScript; algorithm has non-trivial edge cases |
| Deployment trigger | GitHub Release or manual dispatch | Stable, explicit promotion gate before hitting production |
