# Frontend

_Last updated: 2026-05-07_

## Framework & routing

- **Framework**: Next.js 15 App Router
- **Rendering**: Server Components by default. Client Components (`"use client"`) only where interactivity is needed (forms, drag & drop, SSE listener).
- **Approach**: Mobile-first. All layouts and components designed for small screens first.

## UI & components

- **Component library**: MUI (Material UI)
- **Navigation**: Burger menu (drawer) — stylized, opens from the side. Persistent on desktop if screen allows.
- **Drag & drop**: `dnd-kit` (performance order page only)
- **Real-time**: Native `EventSource` (SSE) on the public show view

## State management

No global state library. Data flows via:
- **Server Components** for initial data fetch (CRUD pages)
- **`useState` / `useReducer`** for local interactive state (order generator config, drag & drop)
- **SSE** for live updates on the public view

---

## Route map

| Route | Auth | Description |
|---|---|---|
| `/login` | Public | Username + password login form |
| `/` | ADMIN | Redirects to `/app/dashboard` |
| `/app/dashboard` | ADMIN | Overview of active season (students, classes, shows at a glance) |
| `/app/students` | ADMIN | Student list with search |
| `/app/students/[id]` | ADMIN | Student detail — info + class enrollments per season |
| `/app/teachers` | ADMIN | Teacher list + CRUD |
| `/app/classes` | ADMIN | Class list filtered by active season |
| `/app/classes/[id]` | ADMIN | Class detail — enrolled students + roll call view (ephemeral) |
| `/app/shows` | ADMIN | Show list filtered by active season |
| `/app/shows/[id]` | ADMIN | Show detail — acts list + participation management per act |
| `/app/shows/[id]/order` | ADMIN | Performance order generator (configure → generate → adjust → validate) |
| `/app/admin/users` | SUPER_ADMIN | Admin account management |
| `/app/admin/seasons` | SUPER_ADMIN | Season management (create, activate, edit, delete) |
| `/s/[slug]` | Public | Read-only performance order view with live SSE updates |

---

## Layouts

| Layout | Routes | Content |
|---|---|---|
| `AuthLayout` | `/login` | Centered card, no nav |
| `AppLayout` | All `/app/*` routes | Burger menu, top app bar, main content area |
| `PublicLayout` | `/s/[slug]` | Minimal — show name, date, ordered act list. No nav. |

---

## Key screens

### Performance order generator (`/app/shows/[id]/order`)

Most complex screen. Fully client-side state until validation.

1. **Config panel** — list of acts with lock toggle (fixed position icon). Values pre-filled from DB on load.
2. **Generate button** — sends current config to `POST /api/shows/[showId]/order/generate`, displays returned order.
3. **Order list** — draggable act list (`dnd-kit`). Lock icon per act sets/unsets `fixedPosition` at current index.
4. **Validate button** — sends `PUT /api/shows/[showId]/order` with final positions + actConfigs. Triggers SSE broadcast.

State resets on page reload (unsaved config is lost — expected behavior).

### Public show view (`/s/[slug]`)

- Initial data fetched server-side (SSR).
- Client component subscribes to SSE stream on mount.
- On each SSE event, full act list is replaced in local state.
- Displays: show name, date, ordered list of act names.

### Roll call (`/app/classes/[id]` — roll call tab)

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
