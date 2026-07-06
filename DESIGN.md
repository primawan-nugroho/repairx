---
version: beta
name: RepairX-design
description: The design language for RepairX, an aviation MRO part-repair monitoring dashboard. Superseded the original dark "control room" language (still available in git history) with a macOS Sonoma-esque system — light by default with a user-toggleable dark mode, translucent vibrancy surfaces on chrome (sidebar, topbar, cards), SF-Pro-style system typography in sentence case, a single system-blue accent, and generous corner radii. Data density stays high (the orders table still needs to show 10k+ rows), but the chrome around it now reads as a native macOS app rather than an avionics panel. A dedicated light print theme (unchanged) still styles the end-shift report for PDF/JPG export, independent of the app's light/dark toggle.

colors:
  light:
    canvas: "#f5f5f7"
    surface: "rgba(255,255,255,0.72)"
    surface-solid: "#ffffff"
    sidebar: "rgba(255,255,255,0.70)"
    text-primary: "#1d1d1f"
    text-secondary: "#6e6e73"
    text-tertiary: "#98989d"
    border: "rgba(0,0,0,0.08)"
    border-strong: "rgba(0,0,0,0.14)"
    accent: "#0071e3"
    accent-bg: "rgba(0,113,227,0.12)"
  dark:
    canvas: "#1c1c1e"
    surface: "rgba(44,44,46,0.62)"
    surface-solid: "#2c2c2e"
    sidebar: "rgba(30,30,32,0.70)"
    text-primary: "#f5f5f7"
    text-secondary: "#98989d"
    text-tertiary: "#6e6e73"
    border: "rgba(255,255,255,0.10)"
    border-strong: "rgba(255,255,255,0.16)"
    accent: "#409cff"
    accent-bg: "rgba(64,156,255,0.16)"
  status:
    open: { light: "#8e8e93", dark: "#98989d" }
    progress: { light: "#0071e3", dark: "#409cff" }
    closed: { light: "#248a3d", dark: "#30d158" }
    waiting: { light: "#a05a00", dark: "#ffb340" }
    urgent: { light: "#d70015", dark: "#ff453a" }
  print:
    canvas-light: "#ffffff"
    canvas-cool: "#f0f0fa"
    ink: "#0f0f10"
    ink-mute: "#5a5a5f"
    hairline-on-light: "#e0e0e8"

typography:
  font-family: "-apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"SF Pro Text\", Inter, system-ui, sans-serif"
  font-mono: "\"SF Mono\", \"JetBrains Mono\", Consolas, monospace"
  display-lg:
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.2px
  display-md:
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.1px
  heading:
    fontSize: 17px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0
  body:
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0
  data-mono:
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  label:
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.1px
  caption:
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  sm: 8px
  md: 10px
  lg: 14px
  pill: 999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 32px
  huge: 48px

components:
  button-primary:
    backgroundColor: "{colors.*.accent}"
    textColor: "#ffffff"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: 8px 18px
  button-secondary:
    backgroundColor: "{colors.*.surface}"
    textColor: "{colors.*.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: 8px 18px
    border: "1px solid {colors.*.border}"
  card:
    backgroundColor: "{colors.*.surface}"
    textColor: "{colors.*.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 20px
    backdropFilter: "blur(20px)"
  text-input:
    backgroundColor: "{colors.*.surface}"
    textColor: "{colors.*.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: 8px 12px
    border: "1px solid {colors.*.border}"
  badge-status:
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: 3px 10px
  sidebar-nav:
    backgroundColor: "{colors.*.sidebar}"
    textColor: "{colors.*.text-secondary}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: 7px 10px
    backdropFilter: "blur(20px)"
  topbar:
    backgroundColor: "{colors.*.surface}"
    textColor: "{colors.*.text-primary}"
    typography: "{typography.body}"
    padding: 10px 16px
    backdropFilter: "blur(20px)"
  login-card:
    backgroundColor: "{colors.*.surface}"
    textColor: "{colors.*.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 32px
    backdropFilter: "blur(20px)"
  report-print-page:
    backgroundColor: "{colors.print.canvas-light}"
    textColor: "{colors.print.ink}"
    typography: "{typography.body-sm}"
    padding: 32px
---

## Overview

RepairX reads as a native macOS app: light by default (System Settings, Finder), with
a one-click switch to dark. Chrome surfaces — sidebar, topbar, cards, the login panel —
use translucent "vibrancy" fills with `backdrop-filter: blur()` over the canvas, exactly
like macOS's frosted sidebars. Data density is preserved where it matters (the orders
table still needs to show thousands of rows at a glance), but the surrounding UI trades
the previous dark-industrial-control-room language for calm, light, rounded, sentence-case
chrome with a single system-blue accent.

Two surfaces exist:

1. **App shell** (light or dark, user-toggleable) — login, orders table, shift-report
   forms. Vibrancy on fixed chrome (sidebar/topbar/modals); flat canvas behind scrolling
   content so blur cost stays cheap on a 2,900+ row table.
2. **Light print theme** (`{report-print-page}`, unchanged) — the end-shift report
   rendered for PDF/JPG export. Always light regardless of the app's current theme,
   because it has to survive grayscale printing and WhatsApp compression.

**Key characteristics:**
- Light canvas `#f5f5f7` / dark canvas `#1c1c1e` — never pure white or pure black,
  matching macOS's slightly-off-neutral canvas.
- Vibrancy: sidebar, topbar, cards, and the login panel are translucent
  (`{colors.light.surface}` / `{colors.dark.surface}`) with `blur(20px)` — not applied to
  table body rows or the print page.
- System typography stack, **sentence case everywhere** — no more uppercase tracked
  display type. Headings are 600-weight, body is 400.
- One accent: system blue (`#0071e3` light / `#409cff` dark) for links, focus rings,
  the active nav item, and the primary button.
- Status colors keep their semantic-only role from the previous language, retuned to
  macOS system hues (gray/blue/green/amber/red) with light/dark variants.
- Radii grow (8–14px, pill for buttons/badges) versus the old 4px-heavy scale.
- Order numbers, serials, ops numbers, dates, manhours stay in `{typography.data-mono}`
  for column alignment — the one holdover from the data-density requirement.

## Colors

### Surface (light / dark)
- **Canvas** — `#f5f5f7` / `#1c1c1e`. Page background, never under vibrancy blur.
- **Surface** — `rgba(255,255,255,0.72)` / `rgba(44,44,46,0.62)`. Translucent fill for
  cards, sidebar, topbar, login panel, inputs — always paired with `blur(20px)`.
- **Surface Solid** — `#ffffff` / `#2c2c2e`. Opaque fallback where blur isn't supported
  or isn't wanted (e.g. dropdown popovers that must fully occlude content behind them).
- **Border** — `rgba(0,0,0,0.08)` / `rgba(255,255,255,0.10)`. Hairline on translucent
  surfaces. **Border Strong** — `rgba(0,0,0,0.14)` / `rgba(255,255,255,0.16)` for
  emphasis (focus, hover).

### Text (light / dark)
- **Text Primary** — `#1d1d1f` / `#f5f5f7`.
- **Text Secondary** — `#6e6e73` / `#98989d`. Supporting copy, idle nav items, labels.
- **Text Tertiary** — `#98989d` / `#6e6e73`. Placeholders, disabled, least emphasis.

### Accent
- **Accent** — `#0071e3` light / `#409cff` dark (system blue). Primary button fill,
  focus ring, active nav indicator, links.
- **Accent Bg** — `rgba(0,113,227,0.12)` / `rgba(64,156,255,0.16)`. Active nav-item
  background, selected-row tint.

### Status (semantic only, unchanged role from the previous language)
| Token | Light | Dark | Encodes |
|---|---|---|---|
| `open` | `#8e8e93` | `#98989d` | Open / not started |
| `progress` | `#0071e3` | `#409cff` | In progress / PROGRESS |
| `closed` | `#248a3d` | `#30d158` | closed / Final confirm / done |
| `waiting` | `#a05a00` | `#ffb340` | any `w/f …` waiting state |
| `urgent` | `#d70015` | `#ff453a` | URGENT / TOP URGENT / overdue Gate 4 |

Rules unchanged from the previous language: status colors appear only in badges, table
status cells, and small tier accents — never as panel backgrounds or headings. Badge
style is always a **tint** (14–20% opacity fill + the solid hue as text), matching
macOS's tag/label pill convention — no more separate "solid" variant for urgent states;
weight comes from the hue itself (red reads urgent at any opacity).

### Categorical UIC palette

A second, separate color system — one hue per **unit in charge (UIC)** team, used only
for the Work Center and UIC columns/badges and the routing popover. This is distinct
from the status palette above: status colors encode *order/shift state*, this palette
encodes *which team owns the part*. Work centers inherit their mapped UIC's hue (see
`src/lib/wc-uic-map.ts` — the work-center-to-UIC mapping is the single source of truth,
enforced server-side on every write, not just a display convention).

| Slug | Light | Dark | UIC |
|---|---|---|---|
| `uic-a` | `#7c3aed` | `#a78bfa` | TVU-1 |
| `uic-b` | `#ea580c` | `#fb923c` | TVP-1/2 |
| `uic-c` | `#0d9488` | `#2dd4bf` | TVP-4 |
| `uic-d` | `#db2777` | `#f472b6` | TCS-3 |
| `uic-e` | `#0891b2` | `#22d3ee` | TCY-3 |
| `uic-f` | `#65a30d` | `#a3e635` | TVU-3 |
| `uic-g` | `#b45309` | `#fbbf24` | TVU-4 |
| `uic-h` | `#475569` | `#94a3b8` | Kitting/RPC |
| `uic-i` | `#9f1239` | `#fda4af` | TCS |
| `uic-j` | `#166534` | `#86efac` | TCW |
| `unmapped` | `#8e8e93` | `#98989d` | Any UIC not in the mapping (legacy data) |

Same tint-badge treatment as status colors (14–20% opacity fill + solid hue text).
Unmapped values render in neutral gray rather than guessing a hue — never invent a
color for data outside the known mapping.

## Typography

### Font family
System stack: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text",
Inter, system-ui, sans-serif` — renders as true SF Pro on macOS/iOS/Safari and falls
back to Inter elsewhere, which shares SF Pro's proportions closely enough that the shop
floor's Windows/Chrome machines still read as "native." Mono stack (`"SF Mono",
"JetBrains Mono", Consolas, monospace`) is reserved for order numbers, serials, ops
numbers, dates, and manhours only.

### Hierarchy

| Token | Size | Weight | Use |
|---|---|---|---|
| `{typography.display-lg}` | 28px | 600 | Page titles (Orders, Shift Report) |
| `{typography.display-md}` | 22px | 600 | Login wordmark, section openers |
| `{typography.heading}` | 17px | 600 | Card/panel headings |
| `{typography.body}` | 14px | 400 | Default UI body, form inputs, table cells |
| `{typography.body-sm}` | 13px | 400 | Dense body, print-theme body |
| `{typography.data-mono}` | 13px | 500 | Order no., serial, ops, dates, manhours |
| `{typography.label}` | 12px | 500 | Field labels, badges, table headers |
| `{typography.caption}` | 12px | 400 | Helper text, footer, print footnotes |

### Principles
- **Sentence case everywhere** — buttons, nav items, headings, table headers. "Sign in"
  not "SIGN IN", "Orders" not "ORDERS". This is the single biggest visible change from
  the previous language.
- No letter-spacing tricks — system fonts at system tracking (0 to -0.2px on large
  sizes, matching macOS's slightly-negative tracking on big headings).
- Numbers stay tabular/mono for scanability in dense tables; nothing else uses mono.

## Layout

### Spacing
Base unit 8px: `{spacing.xxs}` 4 → `{spacing.huge}` 48. Slightly more breathing room
than the previous language's table-first density — cards get 20px padding, not 16px.

### Grid & container
- **App shell**: fixed left sidebar 220px (`{sidebar-nav}`, vibrancy), top bar 52px
  (`{topbar}`, vibrancy), content area on flat canvas with `{spacing.xl}` gutters,
  max-width 1600px.
- **Orders table**: flat (no vibrancy) so scrolling 2,900+ rows stays cheap;
  horizontally scrollable below 1280px with the order-number column pinned.
- **Login**: single centered `{login-card}` (max 400px) on bare canvas — vibrancy panel
  floating on the flat canvas color, macOS System Settings' sign-in-panel look.
- **Print page**: unchanged — A4 landscape, 32px margins, repeating table header.

### Whitespace
Cards float on canvas with visible gaps (12–20px), not edge-to-edge hairline grids —
depth comes from blur + subtle shadow, not hairline separation alone.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 | Flat canvas | Page background, table body |
| 1 | `{colors.*.surface}` + `blur(20px)` + 1px border | Sidebar, topbar, cards, login panel |
| 2 | `{colors.*.surface-solid}` (opaque, no blur) + soft shadow (`0 8px 24px rgba(0,0,0,0.12)` light / `0 8px 24px rgba(0,0,0,0.4)` dark) + dark scrim behind | Modals: order edit dialog, work-center routing popover |

Unlike the previous language, soft shadows are back (macOS's signature window/popover
lift). **Level 2 is deliberately opaque, not blurred** — an early version put vibrancy
on the order edit dialog and it read as muddy/low-contrast with a dense form on top of
it; blur belongs to level 1 chrome that floats over empty canvas, not to modals that
need to fully occlude a data-dense page behind them. Column-filter dropdowns (level 1)
keep their vibrancy since they're small and float over canvas, not over a table.

## Shapes

| Token | Value | Use |
|---|---|---|
| `{rounded.sm}` | 8px | Inputs, small chips |
| `{rounded.md}` | 10px | Table row cards (mobile), dropdown items |
| `{rounded.lg}` | 14px | Cards, login panel, modals |
| `{rounded.pill}` | 999px | Buttons, badges, the theme toggle |

## Components

### Buttons
- **`{button-primary}`** — accent-blue fill, white label, pill radius. One per view
  maximum (Add entry, Export, Sign in) — the one-primary-CTA rule carries over from the
  previous language.
- **`{button-secondary}`** — translucent surface fill, 1px border, primary-text label.
  Everything else: filters, cancel, secondary actions.

### Theme toggle
A pill-shaped icon button in the topbar (sun/moon icon) that flips `data-theme` between
`light` and `dark`, persisted to `localStorage`, defaulting to the OS's
`prefers-color-scheme` on first visit. No third "system" option in v1 — two states,
one click.

### Tables
- Header row: flat canvas, `{typography.label}` in text-secondary, sentence case
  ("Order", not "ORDER"). Every column carries a small ▾ filter affordance next to its
  label (see Column filter below) — an Excel-style AutoFilter, not a separate top bar.
- Body rows: flat canvas (no vibrancy), 1px bottom border, hover → `{colors.*.surface}`
  tint. Tier no longer has its own column — it shows as a slim left-edge color accent
  only (status palette: tier 1 = urgent red, tier 2 = waiting amber, tier 3 = open gray).
- Order number is a clickable accent-colored link, not plain mono text — clicking opens
  the order edit dialog (see Signature components).
- Order number, serial, dates, manhours stay in `{typography.data-mono}`.
- Column order (orders table specifically): Order, Description, Serial number, Engine
  type, Work center, UIC, Status, Location, Remark.

### Column filter
A small ▾ button beside each header label opens a floating panel (rendered via portal,
`position: fixed`, so it's never clipped by the table's horizontal scroll container):
value-list columns (Engine type, Work center, UIC, Status) get a checkbox multi-select
with a search box and Select all/Clear; free-text columns (Order, Description, Serial
number, Location, Remark) get a single "contains" text field. An active filter tints the
▾ accent-blue. Filter state lives in the URL, so it survives reload and is shareable.

### Badges
**`{badge-status}`** — pill, `{typography.label}`, tint background (14–20% opacity of
the status hue) + the solid hue as text color. Same treatment for every state,
including urgent — no separate "solid" emphasis variant. The Work center and UIC
columns use the same pill shape but pull from the categorical UIC palette instead of
the status palette (see Colors → Categorical UIC palette).

### Inputs & forms
**`{text-input}`** — translucent surface fill, 1px border, `{rounded.sm}`, focus swaps
border to accent + a soft `0 0 0 3px accent-bg` ring (macOS's focus-ring convention,
not just a border-color swap). Labels in `{typography.label}`, sentence case, above the
field.

### Navigation
- **`{sidebar-nav}`** — collapsible: 220px expanded (logo + wordmark + labeled icon
  items) or 64px collapsed to an icon-only rail (icons only, labels as `title` tooltips).
  Vibrancy fill, hairline right border. Items in `{typography.body}` sentence case;
  idle = text-secondary; active = accent text + `{colors.*.accent-bg}` pill background.
  **The logo itself is the collapse toggle** — no separate hamburger button on
  desktop/tablet. Clicking the logo/wordmark row collapses it to the icon rail;
  clicking the (now icon-only) logo expands it again. State persists to `localStorage`
  (same pattern as the theme toggle) and does not reset on reload. Below 768px the
  sidebar is off-canvas entirely and the logo isn't visible to click, so a hamburger
  button reappears in the topbar there (hidden ≥768px) to open the sidebar as a
  slide-over with a scrim, always in its expanded (labeled) form.
- **`{topbar}`** — 52px, vibrancy fill, date on the left (plus the mobile-only
  hamburger), theme toggle + change-password + user menu + sign out on the right.

### Logo
A single monochrome black mark (`logo_only_black.png`, transparent background) is the
only brand asset. It appears at three places: the sidebar header (24px — doubling as
the collapse-toggle button, see Navigation), the login card (40px, above the wordmark),
and as the browser tab icon (`src/app/icon.png`, Next.js's auto-detected favicon
convention — no manifest needed). Because the mark is black-only, it uses `dark:invert`
in dark mode rather than a second asset — a plain CSS filter is enough for a flat
monochrome PNG and keeps the asset count at one.

### Signature components
- **`{login-card}`** — centered vibrancy panel on bare canvas, `{rounded.lg}`,
  soft level-2 shadow: logo, wordmark, two inputs, one `{button-primary}`. The closest
  analog to macOS's own login/System-Settings sign-in panel.
- **Order edit dialog** — centered **opaque** modal (`{colors.*.surface-solid}`, level-2
  shadow, dark scrim behind), opened by clicking an order number or the "Add order"
  button. Sized for a 13″ HD laptop: `max-height: 85vh` with the form area scrolling
  internally while the header and footer (Cancel/Save) stay pinned, so the action row
  is never lost off-screen. Handles both edit (order number fixed) and create (order
  number becomes an editable required field, checked server-side for duplicates before
  insert — the create path never silently overwrites an existing order). UIC is always
  read-only, live-derived from the Work center field as you type. Viewer-role users see
  the same dialog with every field disabled and no Save button.
- **Work center routing popover** — centered **opaque** modal (same level-2 treatment
  as the edit dialog, `max-height: 85vh` with internal scroll) opened by clicking a Work
  center badge. Renders the order's full `mwc_routing` chain as connected pill chips,
  each colored by its mapped UIC, with the current work center ringed/highlighted. If
  the chain repeats a work center, every occurrence is highlighted and a caption notes
  the data doesn't record which pass is current.
- **Add user / reset password dialogs** (Masters page, admin-only) — same opaque
  level-2 modal treatment, smaller (`max-w-md`/`max-w-sm`, no internal scroll needed).
  Add user takes username/display name/password/role; duplicate usernames are rejected
  with an inline message rather than silently overwriting. Reset password sets a new
  password for another user without knowing their old one — the "I forgot my password"
  path for a system with no email recovery.
- **Change password dialog** (topbar, any authenticated user) — same modal treatment;
  requires the current password (verified against the bcrypt hash server-side) plus a
  new password entered twice. This is the self-service counterpart to admin reset —
  a left-unlocked laptop can't change the password without knowing the existing one.
- **`{report-print-page}`** — unchanged: light, D-DIN-less now (plain sentence-case
  headings to match the rest of the app), rule-lined table, totals row,
  signature/prepared-by block. A4 landscape PDF / 1600px-wide JPG.

## Do's and Don'ts

### Do
- Use sentence case everywhere — this is the language's defining change.
- Apply vibrancy (blur + translucency) only to fixed chrome: sidebar, topbar, cards,
  modals, login panel. Never to table body rows.
- Keep exactly one `{button-primary}` per view.
- Keep status colors semantic-only; the chrome itself stays neutral + one accent.
- Respect the user's theme choice across sessions (persisted, not reset on reload).

### Don't
- Don't use uppercase tracked type anywhere — that was the previous language.
- Don't blur scrolling content — vibrancy on a 2,900-row table body kills scroll
  performance for no visual gain.
- Don't introduce a second accent color; blue does all accent work in both themes.
- Don't render the print report in dark mode — export is always light, independent of
  the app-wide toggle.
- Don't drop below 13px for any text a 30-user shop floor must read at arm's length.

## Responsive Behavior

| Name | Width | Key Changes |
|---|---|---|
| Desktop | ≥ 1280px | Sidebar expanded or icon-rail per user's saved toggle; all table columns |
| Laptop | 1024–1279px | Same user-toggleable sidebar; table hides Remark/Location |
| Tablet | 768–1023px | Orders table scrolls horizontally, order no. pinned |
| Mobile | < 768px | Sidebar is off-canvas; hamburger opens it as a slide-over |

- Touch targets ≥ 44px.
- The print page ignores breakpoints entirely — fixed A4-landscape layout.

## Iteration Guide

1. Focus on one component at a time; reference tokens directly
   (`{colors.light.surface}`, `{badge-status}`, `{typography.data-mono}`).
2. Sentence case is non-negotiable — if new copy reads in caps, fix the copy, not the
   CSS.
3. The status palette is closed — new states must map to the existing five hues before
   a new color is even discussed.
4. Every new surface must define both a light and dark value before shipping — no
   token should silently fall back to the wrong mode.
5. Any change to `{report-print-page}` must be re-verified in grayscale and at
   WhatsApp-compressed JPG quality, and must stay light regardless of app theme.
