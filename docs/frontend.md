# Frontend

_Last updated: 2026-05-26_

## Framework & routing

- **Framework**: Next.js 16 App Router
- **Rendering**: Server Components by default. Client Components (`"use client"`) only where interactivity is needed (forms, drag & drop, SSE listener).
- **Approach**: Mobile-first. All layouts and components designed for small screens first.

## UI & components

- **Component library**: MUI v9 (Material UI)
- **Navigation**: Burger menu (drawer) — stylized, opens from the side. Persistent on desktop if screen allows.
- **Drag & drop**: `dnd-kit` (performance order page + scene reorder)
- **Real-time**: Native `EventSource` (SSE) on the public show view

## State management

No global state library. Data flows via:
- **Server Components** for initial data fetch (CRUD pages)
- **`useState` / `useReducer`** for local interactive state (order generator config, drag & drop, stage placements)
- **SSE** for live updates on the public view

---

## Route map

| Route | Auth | Description |
|---|---|---|
| `/login` | Public | Username + password login form |
| `/invite/[token]` | Public | Registration form via invite token |
| `/` | ADMIN | Redirects to `/dashboard` |
| `/dashboard` | ADMIN | Overview of active season (students, classes, shows at a glance) |
| `/students` | ADMIN | Student list with search |
| `/students/[id]` | ADMIN | Student detail — info + class enrollments per season |
| `/teachers` | ADMIN | Teacher list + CRUD |
| `/classes` | ADMIN | Class list filtered by active season |
| `/classes/[id]` | ADMIN | Class detail — enrolled students + roll call view (ephemeral) |
| `/shows` | ADMIN | Show list filtered by active season |
| `/shows/[id]` | ADMIN | Show detail — acts list + participation management per act |
| `/shows/[id]/order` | ADMIN | Performance order generator (configure → generate → adjust → validate) |
| `/shows/[id]/live` | ADMIN | Live show presentation — advance current act, broadcast to public viewers |
| `/shows/[id]/participants` | ADMIN | Show-level participation management |
| `/shows/[id]/acts/[actId]/placements` | ADMIN | Stage positioning — scenes with student placements (x/y coordinates) |
| `/shows/[id]/acts/[actId]/participants` | ADMIN | Act-level participation management |
| `/admin/users` | SUPER_ADMIN | Admin account management |
| `/admin/seasons` | SUPER_ADMIN | Season management (create, activate, edit, delete) |
| `/s/[slug]` | Public | Read-only performance order view with live SSE updates |
| `/s/[slug]/placements/[actId]` | Public | Read-only stage placement view for an act |

---

## Layouts

| Layout | Routes | Content |
|---|---|---|
| `AuthLayout` | `/login`, `/invite/[token]` | Centered card, no nav |
| `AppLayout` | All `(app)/*` routes | Burger menu, top app bar, main content area |
| `PublicLayout` | `/s/[slug]`, `/s/[slug]/placements/[actId]` | Minimal — show name, date, ordered act list. No nav. |

---

## Key screens

### Performance order generator (`/shows/[id]/order`)

Most complex screen. Fully client-side state until validation.

1. **Config panel** — list of acts with lock toggle (fixed position icon). Values pre-filled from DB on load.
2. **Generate button** — sends current config to `POST /api/shows/[showId]/order/generate`, displays returned order.
3. **Order list** — draggable act list (`dnd-kit`). Lock icon per act sets/unsets `fixedPosition` at current index.
4. **Validate button** — sends `PUT /api/shows/[showId]/order` with final positions + actConfigs. Triggers SSE broadcast.

State resets on page reload (unsaved config is lost — expected behavior).

### Live show (`/shows/[id]/live`)

Admin advances current act during the show. Each advance triggers SSE broadcast to public viewers.

### Stage placements (`/shows/[id]/acts/[actId]/placements`)

Scene-based stage positioning editor:
- Ordered list of scenes within an act (reorderable via drag & drop)
- Each scene displays a stage area where students are placed at x/y coordinates
- Students can be dragged to reposition on stage
- Placements persisted via `PUT /api/shows/[showId]/acts/[actId]/scenes/[sceneId]/placements`

### Public show view (`/s/[slug]`)

- Initial data fetched server-side (SSR).
- Client component subscribes to SSE stream on mount.
- On each SSE event, full act list is replaced in local state.
- Displays: show name, date, ordered list of act names.

### Public placements (`/s/[slug]/placements/[actId]`)

- Read-only view of stage placements for a specific act.
- Fetched via `GET /api/public/shows/[slug]/acts/[actId]/placements`.

### Roll call (`/classes/[id]` — roll call tab)

- Ephemeral list of students enrolled in the class.
- No save action. Purely informational for the teacher at class start.

---

## Data fetching pattern

```
Server Component (page.tsx)
  └── fetch data from DB via Prisma (server-side)
  └── pass as props to Client Components where needed

Client Component
  └── useState for local mutations
  └── fetch() calls to Route Handlers for create/update/delete
  └── router.refresh() after mutation to re-fetch Server Component data
```
