# Design

_Last updated: 2026-05-07_

## Concept

**"Scène"** — the contrast between backstage (technical, functional) and the stage (dramatic, refined). The app is used in dark environments (wings, backstage) and must remain readable under low light while feeling at home in the world of performance.

Dark theme only.

---

## Typography

| Usage | Font | Source |
|---|---|---|
| Headings, display, act numbers | **Cormorant Garamond** | Google Fonts |
| UI, body, labels, inputs | **DM Sans** | Google Fonts |

- Heading scale: generous size contrast between h1 and body. Act numbers in the performance order use Cormorant Garamond at large size for dramatic effect.
- Never use system fonts or Inter/Roboto.

---

## Color palette

| Token | Value | Usage |
|---|---|---|
| `background` | `#0F0E0D` | Page background — warm near-black |
| `surface` | `#1A1917` | Cards, drawers, modals |
| `surface-raised` | `#221F1C` | Hover states, elevated surfaces |
| `accent` | `#D4A853` | Primary CTA, active states, highlights — warm gold |
| `accent-muted` | `rgba(212,168,83,0.15)` | Borders, subtle accents |
| `text-primary` | `#F5F0E8` | Main text — warm white |
| `text-secondary` | `#9A9089` | Labels, placeholders, metadata |
| `error` | `#A85A5A` | Errors, destructive actions |
| `success` | `#6AAB8E` | Confirmations, validated states |

MUI theme configured via `createTheme` with these tokens as CSS variables. No MUI default blue.

---

## Motion

Restrained. Only key moments are animated — not every interaction.

| Moment | Animation |
|---|---|
| Page transition | Fade + 8px upward slide, 200ms ease-out |
| Burger menu open | Slide from left, 250ms, subtle curtain shadow |
| List item reveal | Staggered fade-in, 40ms delay per item |
| Drag & drop lift | Scale `1.02`, gold shadow `0 4px 20px rgba(212,168,83,0.3)` |
| Drag & drop drop | Spring back, 150ms |
| SSE order update | Smooth reorder animation on the public view |

No animations on form fields, tables, or standard navigation.

---

## Component details

**Cards**: `1px solid rgba(212,168,83,0.15)` border, no harsh drop shadows, `border-radius: 8px`.

**Buttons**:
- Primary: gold background `#D4A853`, dark text `#0F0E0D`, no outline.
- Secondary: transparent, gold border, gold text.
- Destructive: `#A85A5A`, used only for delete actions with confirmation.

**Burger menu (AppDrawer)**:
- Slides from left.
- Dark surface `#1A1917`.
- Menu items in DM Sans, active item highlighted in gold.
- App name "Cadanse" displayed in Cormorant Garamond at the top of the drawer.

**Performance order list**:
- Act number rendered large in Cormorant Garamond (e.g. `01`, `02`).
- Act name in DM Sans medium weight.
- Lock icon (🔒 → padlock outline/filled) toggles fixed position.
- Draggable handle visible on mobile (grab icon on the left).
- Lifted item shows gold glow shadow.

**Public show view (`/s/[slug]`)**:
- Minimal. Show name in Cormorant Garamond, large.
- Date in DM Sans, text-secondary.
- Ordered act list — number + name only, generous line height.
- No navigation, no admin UI elements.
- Live badge ("En direct") shown when SSE connection is active.

---

## Microcopy

Tone: **direct, brief, professional**. No exclamation marks. No over-friendly language. The users are teachers — treat them as competent adults.

| Context | Example |
|---|---|
| Empty state (no students) | "Aucun élève enregistré." |
| Delete confirmation | "Supprimer cet élève ? Cette action est irréversible." |
| Order generated | "Ordre généré. Ajustez si nécessaire, puis validez." |
| Order validated | "Ordre validé et partagé." |
| Unsaved changes warning | "Les paramètres non validés seront perdus." |
| Error generic | "Une erreur est survenue. Réessayez." |
| SSE connected | "En direct" |
| SSE disconnected | "Connexion perdue — actualisation automatique…" |

---

## Key user flows

### 1. Create a show and add acts

1. Navigate to **Shows** → tap "Nouveau show".
2. Fill name + date → confirm.
3. On show detail page, tap "Ajouter un tableau".
4. Select class → enter act name → confirm.
5. Repeat. Participants auto-populated from class enrollment.
6. Optionally remove individual students from specific acts.

### 2. Generate a performance order

1. Navigate to **Shows** → select show → tap "Ordre de passage".
2. Config panel shows all acts with priority input and lock icon.
3. Adjust priorities (optional) → tap "Générer".
4. Proposed order appears as draggable list.
5. Drag acts to adjust. Tap lock icon to pin an act at its current position.
6. Tap "Valider" → order saved, SSE broadcast sent.

### 3. Share the order (day of show)

1. Navigate to show → copy public link (short URL).
2. Share link with students/parents (WhatsApp, display on screen, etc.).
3. Spectators open the link — see the ordered act list, updated live as admin makes changes.

---

## Accessibility

- Minimum contrast ratio: 4.5:1 for body text, 3:1 for large text (WCAG AA).
- All interactive elements reachable by keyboard.
- Drag & drop: keyboard alternative for reordering (move up/down buttons visible on focus).
- `prefers-reduced-motion`: disable staggered reveals and page transitions, keep functional feedback only.
