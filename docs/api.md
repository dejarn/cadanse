# API

_Last updated: 2026-05-07_

## Style & format

- **Style**: REST
- **Format**: JSON (`Content-Type: application/json`)
- **Base path**: `/api`
- **Auth**: Session cookie (NextAuth). All endpoints require a valid session unless marked **public**.
- **Roles**: `SUPER_ADMIN` > `ADMIN`. Role checked per endpoint where noted.

## Error codes

| Code | Meaning |
|---|---|
| `400` | Invalid request body or params |
| `401` | Not authenticated |
| `403` | Authenticated but insufficient role — also returned for write attempts on data belonging to an inactive season |
| `404` | Resource not found |
| `409` | Conflict (e.g. duplicate name within season) |
| `410` | Gone (invite token expired or already used) |
| `500` | Server error |

**Inactive season writes**: All create/update/delete operations on data linked to an inactive season (classes, students, shows, acts, participations, order) are rejected at the handler level with `403`.

## Pagination

No pagination. Data volume is small (single school).

---

## Seasons

| Method | Path | Description | Role |
|---|---|---|---|
| `GET` | `/api/seasons` | List all seasons | ADMIN |
| `GET` | `/api/seasons/[id]` | Get season | ADMIN |
| `POST` | `/api/seasons` | Create season | SUPER_ADMIN |
| `PATCH` | `/api/seasons/[id]` | Update season | SUPER_ADMIN |
| `DELETE` | `/api/seasons/[id]` | Delete season | SUPER_ADMIN |
| `POST` | `/api/seasons/[id]/activate` | Set as active season | SUPER_ADMIN |

**GET /api/seasons** response:
```json
[{ "id": "...", "label": "2025-2026", "isActive": true, "createdAt": "..." }]
```

**GET /api/seasons/[id]** response:
```json
{ "id": "...", "label": "2025-2026", "isActive": true, "createdAt": "..." }
```

**POST /api/seasons** body:
```json
{ "label": "2025-2026" }
```

---

## Users

| Method | Path | Description | Role |
|---|---|---|---|
| `GET` | `/api/users` | List all users | SUPER_ADMIN |
| `PATCH` | `/api/users/[id]` | Update user | SUPER_ADMIN |
| `DELETE` | `/api/users/[id]` | Delete user | SUPER_ADMIN |

**GET /api/users** response:
```json
[{ "id": "...", "username": "marie", "role": "ADMIN", "createdAt": "..." }]
```
`hashedPassword` never returned.

## Invites

| Method | Path | Description | Role |
|---|---|---|---|
| `POST` | `/api/invites` | Generate invite link | SUPER_ADMIN |
| `GET` | `/api/invites/[token]` | Validate token | Public |
| `POST` | `/api/register` | Create account + consume token | Public |

**POST /api/invites** — no body. Returns a single-use registration URL valid 48h. No list or revoke endpoint — intentional (simplicity; tokens expire in 48h regardless).

```json
{ "url": "/register?token=<uuid>", "expiresAt": "2026-05-09T10:00:00Z" }
```

**GET /api/invites/[token]** — checks token is valid and unused. Returns `410` if expired or consumed.

**POST /api/register** body:
```json
{ "token": "...", "username": "marie", "password": "..." }
```

Returns `410` if token invalid. Consumes token on success (`usedAt = now`). Created account role is always `ADMIN`.

---

## Teachers

| Method | Path | Description | Role |
|---|---|---|---|
| `GET` | `/api/teachers` | List all teachers | ADMIN |
| `POST` | `/api/teachers` | Create teacher | ADMIN |
| `PATCH` | `/api/teachers/[id]` | Update teacher | ADMIN |
| `DELETE` | `/api/teachers/[id]` | Delete teacher | ADMIN |

**GET /api/teachers** response:
```json
[{ "id": "...", "firstName": "Marie", "lastName": "Dupont", "createdAt": "..." }]
```

**POST /api/teachers** body:
```json
{ "firstName": "Marie", "lastName": "Dupont" }
```

---

## Students

| Method | Path | Description | Role |
|---|---|---|---|
| `GET` | `/api/students` | List all students | ADMIN |
| `POST` | `/api/students` | Create student | ADMIN |
| `PATCH` | `/api/students/[id]` | Update student | ADMIN |
| `DELETE` | `/api/students/[id]` | Delete student | ADMIN |

**GET /api/students** response:
```json
[{ "id": "...", "firstName": "Léa", "lastName": "Martin", "createdAt": "..." }]
```

**POST /api/students** body:
```json
{ "firstName": "Léa", "lastName": "Martin" }
```

---

## Classes

| Method | Path | Description | Role |
|---|---|---|---|
| `GET` | `/api/classes` | List classes (filter by `?seasonId=`) | ADMIN |
| `POST` | `/api/classes` | Create class | ADMIN |
| `PATCH` | `/api/classes/[id]` | Update class | ADMIN |
| `DELETE` | `/api/classes/[id]` | Delete class | ADMIN |
| `GET` | `/api/classes/[id]/students` | List enrolled students | ADMIN |
| `POST` | `/api/classes/[id]/students` | Enroll student | ADMIN |
| `DELETE` | `/api/classes/[id]/students/[studentId]` | Unenroll student | ADMIN |
| `GET` | `/api/classes/[id]/rollcall` | Student list for checklist display | ADMIN |

**GET /api/classes** response:
```json
[{
  "id": "...", "name": "Jazz adultes", "schedule": "Lundi 18h",
  "seasonId": "...", "createdAt": "...",
  "teacher": { "id": "...", "firstName": "Marie", "lastName": "Dupont" }
}]
```

**POST /api/classes** body:
```json
{ "name": "Jazz adultes", "schedule": "Lundi 18h", "teacherId": "...", "seasonId": "..." }
```

**GET /api/classes/[id]/students** response:
```json
[{ "id": "...", "firstName": "Léa", "lastName": "Martin" }]
```

**POST /api/classes/[id]/students** body:
```json
{ "studentId": "..." }
```

**GET /api/classes/[id]/rollcall** — returns the enrolled student list for checklist display. No write endpoint. Checkbox state is local to the browser session, never persisted.
```json
[{ "id": "...", "firstName": "Léa", "lastName": "Martin" }]
```

---

## Shows

| Method | Path | Description | Role |
|---|---|---|---|
| `GET` | `/api/shows` | List shows (filter by `?seasonId=`) | ADMIN |
| `POST` | `/api/shows` | Create show | ADMIN |
| `GET` | `/api/shows/[id]` | Get show with act list | ADMIN |
| `PATCH` | `/api/shows/[id]` | Update show | ADMIN |
| `DELETE` | `/api/shows/[id]` | Delete show | ADMIN |

**GET /api/shows** response:
```json
[{ "id": "...", "name": "Gala de printemps", "date": "2026-06-14T19:00:00Z", "seasonId": "...", "currentPosition": null, "createdAt": "..." }]
```
Acts not included in list — use `GET /api/shows/[id]`.

**POST /api/shows** body:
```json
{ "name": "Gala de printemps", "date": "2026-06-14T19:00:00Z", "seasonId": "..." }
```

- `name` must be unique within the season → `409` if conflict.
- Slug is auto-generated from `name + season.label` (e.g. `gala-de-printemps-2025-2026`). Not stored — computed on each lookup.

**GET /api/shows/[id]** response:
```json
{
  "id": "...",
  "name": "Gala de printemps",
  "date": "2026-06-14T19:00:00Z",
  "seasonId": "...",
  "currentPosition": null,
  "acts": [
    { "id": "...", "name": "Hip-hop juniors", "classId": "...", "priority": 1, "fixedPosition": null }
  ]
}
```

---

## Acts

| Method | Path | Description | Role |
|---|---|---|---|
| `GET` | `/api/shows/[showId]/acts` | List acts for a show | ADMIN |
| `POST` | `/api/shows/[showId]/acts` | Create act | ADMIN |
| `PATCH` | `/api/acts/[id]` | Update act (name, priority, fixedPosition) | ADMIN |
| `DELETE` | `/api/acts/[id]` | Delete act | ADMIN |
| `GET` | `/api/acts/[id]/participants` | List participating students | ADMIN |
| `POST` | `/api/acts/[id]/participants` | Add student to act | ADMIN |
| `DELETE` | `/api/acts/[id]/participants/[studentId]` | Remove student from act | ADMIN |

**GET /api/shows/[showId]/acts** response:
```json
[{ "id": "...", "name": "Hip-hop juniors", "classId": "...", "priority": 1, "fixedPosition": null, "createdAt": "..." }]
```

**GET /api/acts/[id]/participants** response:
```json
[{ "id": "...", "firstName": "Léa", "lastName": "Martin" }]
```

**POST /api/shows/[showId]/acts** body:
```json
{ "name": "Hip-hop juniors", "classId": "...", "priority": 1, "fixedPosition": null }
```

- `priority`: integer `>= 1` or `null`. `1` = earliest, higher = later. `→ 400` if `< 1`.

- On act creation, `Participation` rows are auto-created for all students enrolled in the act's class.

**PATCH /api/acts/[id]** body (partial):
```json
{ "priority": 2, "fixedPosition": 3 }
```

- Set `fixedPosition: null` to unlock. Corresponds to the lock toggle in the UI.

---

## Show progress

| Method | Path | Description | Role |
|---|---|---|---|
| `PATCH` | `/api/shows/[id]/current-act` | Set currently performing act | ADMIN |

**PATCH /api/shows/[id]/current-act** body:
```json
{ "position": 3 }
```

Set `position: null` to reset (show not started or finished). Triggers SSE broadcast to all connected public viewers.

---

## Performance order

| Method | Path | Description | Role |
|---|---|---|---|
| `GET` | `/api/shows/[showId]/order` | Get current ordered act list | ADMIN |
| `POST` | `/api/shows/[showId]/order/generate` | Run ordering algorithm | ADMIN |
| `PUT` | `/api/shows/[showId]/order` | Save full order (after manual drag & drop) | ADMIN |

**GET /api/shows/[showId]/order** response:
```json
{
  "positions": [
    { "actId": "...", "actName": "Hip-hop juniors", "position": 0 },
    { "actId": "...", "actName": "Jazz adultes", "position": 1 }
  ]
}
```
Returns empty `positions: []` if no order has been validated yet.

**POST /api/shows/[showId]/order/generate** — receives full act config from frontend state (not read from DB). Returns proposed order without saving anything.

```json
{
  "actConfigs": [
    { "actId": "...", "priority": 1, "fixedPosition": null },
    { "actId": "...", "priority": null, "fixedPosition": 0 }
  ]
}
```

Response:
```json
{
  "order": [
    { "actId": "...", "position": 0 },
    { "actId": "...", "position": 1 }
  ]
}
```

**PUT /api/shows/[showId]/order** — saves final order to `ActPosition` and persists `actConfigs` back to `Act.priority` / `Act.fixedPosition`. Triggers SSE broadcast.

```json
{
  "positions": [
    { "actId": "...", "position": 0 },
    { "actId": "...", "position": 1 }
  ],
  "actConfigs": [
    { "actId": "...", "priority": 1, "fixedPosition": null },
    { "actId": "...", "priority": null, "fixedPosition": 0 }
  ]
}
```

> On page load, the frontend reads persisted `Act.priority` and `Act.fixedPosition` from DB to initialize the configuration UI (lock icons, priority values). Changes are held in local state until the admin clicks "Validate".

---

## Public (no auth)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/public/shows/[slug]` | Show metadata + ordered act list |
| `GET` | `/api/public/shows/[slug]/stream` | SSE stream — pushes updated order on each admin save |

**GET /api/public/shows/[slug]** response:
```json
{
  "name": "Gala de printemps",
  "date": "2026-06-14T19:00:00Z",
  "acts": [
    {
      "position": 0,
      "name": "Hip-hop juniors",
      "className": "Hip-hop ados",
      "teacher": { "firstName": "Marie", "lastName": "Dupont" }
    }
  ]
}
```

**SSE stream** — each event pushes the full payload below. Client replaces its local state on each event.

```json
{
  "acts": [...],
  "currentPosition": 3
}
```

`currentPosition: null` means no act is currently on stage (not started or finished — not distinguished by design).
