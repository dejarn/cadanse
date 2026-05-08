# Database

_Last updated: 2026-05-07_

## Engine & access

- **Database**: PostgreSQL 16
- **ORM**: Prisma (migrations, type-safe queries, Prisma Studio for inspection)
- **ID strategy**: UUID v4 on all entities (`@default(uuid())`)

## Multi-user & ownership

Single-school instance. No row-level tenant isolation needed. All admins share full access to all data.

---

## Entities

### `Season`

| Column | Type | Notes |
|---|---|---|
| `id` | `String` (UUID) | PK |
| `label` | `String` | e.g. `"2025-2026"`, unique |
| `isActive` | `Boolean` | One active season at a time |
| `createdAt` | `DateTime` | Auto |

- Only one `Season` can have `isActive = true`. Enforced at application level.
- Inactive seasons are read-only. All write operations on data belonging to an inactive season (classes, students, shows, acts, participations, order) are rejected at the API level.

---

### `User`

| Column | Type | Notes |
|---|---|---|
| `id` | `String` (UUID) | PK |
| `username` | `String` | Unique |
| `hashedPassword` | `String` | bcrypt |
| `role` | `Enum` | `SUPER_ADMIN` \| `ADMIN` |
| `createdAt` | `DateTime` | Auto |

- `SUPER_ADMIN` credentials set via environment variables. Single account.
- `SUPER_ADMIN` creates admin accounts via single-use invite links (see `InviteToken`).
- No email field. Authentication via username + password (NextAuth credentials provider).

---

### `InviteToken`

| Column | Type | Notes |
|---|---|---|
| `id` | `String` (UUID) | PK |
| `token` | `String` (UUID) | Unique, used in the invite URL |
| `createdBy` | `String` (UUID) | FK → `User` (super-admin) |
| `expiresAt` | `DateTime` | 48h after creation |
| `usedAt` | `DateTime?` | Null = not yet used |

- Token consumed on successful registration (`usedAt = now`).
- Expired or already-used token returns `410 Gone`.

---

### `Teacher`

| Column | Type | Notes |
|---|---|---|
| `id` | `String` (UUID) | PK |
| `firstName` | `String` | |
| `lastName` | `String` | |
| `createdAt` | `DateTime` | Auto |

- Pure data entity. Independent from `User`. A teacher does not have an app account.

---

### `Student`

| Column | Type | Notes |
|---|---|---|
| `id` | `String` (UUID) | PK |
| `firstName` | `String` | |
| `lastName` | `String` | |
| `createdAt` | `DateTime` | Auto |

---

### `Class`

| Column | Type | Notes |
|---|---|---|
| `id` | `String` (UUID) | PK |
| `name` | `String` | |
| `schedule` | `String` | Free text, e.g. `"Lundi 18h"` |
| `teacherId` | `String` (UUID) | FK → `Teacher` |
| `seasonId` | `String` (UUID) | FK → `Season` |
| `createdAt` | `DateTime` | Auto |

- Scoped to a season. A class must be recreated (or re-linked) for each new season.

---

### `StudentClass`

| Column | Type | Notes |
|---|---|---|
| `studentId` | `String` (UUID) | FK → `Student` |
| `classId` | `String` (UUID) | FK → `Class` |

- Composite PK: `(studentId, classId)`.
- Represents enrollment. A student's enrollment can change between seasons (via different `Class` records per season).

---

### `Show`

| Column | Type | Notes |
|---|---|---|
| `id` | `String` (UUID) | PK |
| `name` | `String` | |
| `date` | `DateTime` | |
| `seasonId` | `String` (UUID) | FK → `Season` |
| `currentPosition` | `Int?` | 0-indexed position of the act currently on stage. `null` = no act in progress (show not started or finished — not distinguished). |
| `createdAt` | `DateTime` | Auto |

- Multiple shows per season allowed.
- Public link uses a slug computed at runtime from `name + season.label` (e.g. `gala-de-printemps-2025-2026`). Not stored — derived on each lookup.
- `currentPosition` is updated live by an admin during the show. Changes are broadcast via SSE to all connected public viewers.

---

### `Act`

| Column | Type | Notes |
|---|---|---|
| `id` | `String` (UUID) | PK |
| `name` | `String` | |
| `classId` | `String` (UUID) | FK → `Class` |
| `showId` | `String` (UUID) | FK → `Show` |
| `fixedPosition` | `Int?` | Optional. Pins act to a specific 0-indexed position in the order (0 = first). |
| `createdAt` | `DateTime` | Auto |

- One class can have multiple acts in the same show.
- Unpinned acts are ordered by drag-and-drop.

---

### `Participation`

| Column | Type | Notes |
|---|---|---|
| `studentId` | `String` (UUID) | FK → `Student` |
| `actId` | `String` (UUID) | FK → `Act` |

- Composite PK: `(studentId, actId)`.
- **Existence = included**. No row = student excluded from this act.
- Default behavior: when an act is created, participation rows are auto-created for all students enrolled in the act's class.
- Removing a row = opting the student out of that specific act.

---

### `ActPosition`

| Column | Type | Notes |
|---|---|---|
| `showId` | `String` (UUID) | FK → `Show` |
| `actId` | `String` (UUID) | FK → `Act` |
| `position` | `Int` | 0-indexed order within the show |

- Composite PK: `(showId, actId)`.
- Populated after the ordering algorithm runs and an admin validates the order.
- Updated in place when admin adjusts the order manually.
- SSE stream reads from this table to push live updates.
