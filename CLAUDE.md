# Cadanse

Dance school management app — season tracking, classes, shows, performance order generation.

## Commands

```bash
# Dev
npm run dev           # Dev server → http://localhost:3000
npm run build         # Production build
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit

# Tests (algorithm only — see Testing section)
npm test              # Vitest

# Database
npx prisma migrate dev    # Apply migrations + regenerate client
npx prisma generate       # Regenerate client after schema change (no migration)
npx prisma studio         # DB GUI → http://localhost:5555

# Local infra
docker compose up -d      # Start postgres container
docker compose down       # Stop
```

## Architecture

Next.js 15 App Router. No separate backend — Route Handlers serve the REST API.

**Rendering rule**: Server Components by default. `"use client"` only for forms, drag & drop, SSE.

**Data fetching pattern**:
```
page.tsx (Server Component) → Prisma query directly (no API hop)
Client Component → fetch() to /api/... → router.refresh() to resync Server Component data
```

No SWR, no React Query, no global state library.

## Auth

- NextAuth.js v5, database sessions (no JWT)
- Roles: `SUPER_ADMIN` (credentials from env vars, single hardcoded account) | `ADMIN`
- Middleware protects all app routes; `/s/[slug]` is fully public
- Only `SUPER_ADMIN` can create/manage admin accounts

## Domain gotchas

- **One active season**: `Season.isActive = true` — enforced at app level, no DB constraint. Query active season explicitly; don't assume it exists.
- **Participation = row existence**: A `Participation` row = student is in the act. No `enabled` flag. Creating an act auto-creates participation rows for all students in its class.
- **fixedPosition beats priority**: In the ordering algorithm, `Act.fixedPosition` overrides `Act.priority`. Algorithm is best-effort when constraints conflict.
- **Teacher ≠ User**: Teachers have no app login — pure data entity, separate from `User`.
- **Class is season-scoped**: Classes must be re-created per season via `seasonId` FK.
- **Roll call is ephemeral**: `/app/classes/[id]` roll call tab has no save action — informational only.
- **Order state is volatile**: Unsaved config on `/shows/[id]/order` resets on page reload — expected behavior.
- **IDs are UUIDs**: All entities use UUID v4.
- **Public show link uses slug**: Slug computed at runtime from `name + season.label` (e.g. `gala-de-printemps-2025-2026`). Not stored in DB. Route: `/s/[slug]`.

## Testing

Vitest on ordering algorithm only. TypeScript strict mode covers CRUD correctness. No E2E tests.

```bash
npm test                # Run Vitest
npm test -- --watch     # Watch mode
```

Do not add E2E tests — out of scope.

## Real-time (SSE)

- Endpoint: `GET /api/public/shows/[slug]/stream`
- Public show page (`/s/[slug]`) subscribes via native `EventSource` on mount
- Server pushes on two events: admin validates order (`PUT /order`) AND admin advances current act (`PATCH /current-act`)
- Each push = full payload (`acts` + `currentPosition`). No partial diffs.
- One-way only (server → client). Not WebSocket.

## Deployment

Raspberry Pi, Docker Compose, Traefik TLS. CD triggers on GitHub Release.

CI (every PR): lint + typecheck + Vitest via GitHub Actions.

Production services: `app` (Next.js multi-stage build) + `db` (postgres:16-alpine). DB data in Docker volume.

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
