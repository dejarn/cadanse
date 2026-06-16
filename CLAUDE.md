# Cadanse

Dance school management app — season tracking, classes, shows, performance order generation.

## Commands

```bash
# Dev
pnpm dev              # Dev server → http://localhost:3000
pnpm build            # Production build
pnpm lint             # ESLint
pnpm typecheck        # tsc --noEmit

# Tests (algorithm only — see Testing section)
pnpm test             # Vitest

# Database
pnpm prisma migrate dev    # Apply migrations + regenerate client
pnpm prisma generate       # Regenerate client after schema change (no migration)
pnpm prisma studio         # DB GUI → http://localhost:5555
```

## Architecture

Next.js 16 App Router. No separate backend — Route Handlers serve the REST API.

**Rendering rule**: Server Components by default. `"use client"` only for forms, drag & drop, SSE.

**Data fetching pattern**:
```
page.tsx (Server Component) → Prisma query directly (no API hop)
Client Component → fetch() to /api/... → router.refresh() to resync Server Component data
```

No SWR, no React Query, no global state library.

## Auth

- NextAuth.js v5, JWT sessions
- Roles: `SUPER_ADMIN` (credentials from env vars, single hardcoded account) | `ADMIN`
- Middleware protects all app routes; `/s/[slug]` is fully public
- Only `SUPER_ADMIN` can create/manage admin accounts

## Domain gotchas

- **One active season**: `Season.isActive = true` — enforced at app level, no DB constraint. Query active season explicitly; don't assume it exists.
- **Participation = row existence**: `ShowParticipation` links student↔show, `ActParticipation` links student↔act (with color). No `enabled` flag. Creating an act auto-creates participation rows for all students in its class.
- **fixedPosition pins acts**: In the ordering algorithm, `Act.fixedPosition` locks an act to a specific position. Unpinned acts flow around them in their current order.
- **Act.classId is optional**: An act can exist without a class link (e.g. opening/finale). Participation auto-creation only fires when `classId` is set.
- **Scenes & Placements**: Acts contain ordered `Scene` entries. Each scene has `Placement` rows (student + x/y coordinates) for stage positioning.
- **Teacher ≠ User**: Teachers have no app login — pure data entity, separate from `User`.
- **Class is season-scoped**: Classes must be re-created per season via `seasonId` FK.
- **Roll call is ephemeral**: `/app/classes/[id]` roll call tab has no save action — informational only.
- **Order state is volatile**: Unsaved config on `/shows/[id]/order` resets on page reload — expected behavior.
- **IDs are UUIDs**: All entities use UUID v4.
- **Public show link uses slug**: Slug computed at runtime from `name + season.label` (e.g. `gala-de-printemps-2025-2026`). Not stored in DB. Route: `/s/[slug]`.

## Testing

Vitest on ordering algorithm only. TypeScript strict mode covers CRUD correctness. No E2E tests.

```bash
pnpm test               # Run Vitest
pnpm test:watch         # Watch mode
```

Do not add E2E tests — out of scope.

## Real-time (SSE)

- Endpoint: `GET /api/public/shows/[slug]/stream`
- Public show page (`/s/[slug]`) subscribes via native `EventSource` on mount
- Server pushes on two events: admin validates order (`PUT /order`) AND admin advances current act (`PATCH /current-act`)
- Each push = full payload (`acts` + `currentPosition`). No partial diffs.
- One-way only (server → client). Not WebSocket.

## Deployment

Raspberry Pi, Docker Compose, external reverse proxy (TLS) on the shared `edge` network. Images built in CI on a cloud arm64 runner and pushed to GHCR; the Pi only pulls. CD triggers on GitHub Release.

CI (every PR): lint + typecheck + Vitest via GitHub Actions.

Production services: `app` (Next.js multi-stage build) + `db` (postgres:18-alpine). DB data in Docker volume.

## Docs

Detailed reference in `docs/`:

| File | Content |
|---|---|
| `docs/vision.md` | Problem statement, use cases, scope |
| `docs/architecture.md` | Stack decisions, infra, auth strategy |
| `docs/database.md` | Prisma schema, all entities + relationships |
| `docs/api.md` | REST endpoints, auth rules, error codes |
| `docs/frontend.md` | Routes, layouts, data fetching patterns |
| `docs/design.md` | UI system, colors, typography, tone |
