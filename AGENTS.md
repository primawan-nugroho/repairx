# RepairX — Aviation MRO Part Repair Monitoring Dashboard

> Naming: the project was started as "Repairly"; the user renamed it **RepairX**.
> Use RepairX in all UI/branding regardless of the folder name.

## What This Project Is

RepairX is an internal web dashboard for the **repair production control** team of an
aviation MRO (Maintenance, Repair & Overhaul) shop. It replaces two Excel workbooks:

1. **Main Database.xlsx** — the live register of every part/repair order in the shop
   (~3,000 rows and growing; expect 10,000+ over time).
2. **End Shift Report.xlsx** — the per-shift activity report production control writes
   at the end of each shift, summarizing what production personnel worked on.

**Users:** ≤ 30 employees, all internal (production control personnel, plus read-only
management). No public access. Indonesian/English mixed content in remarks is normal.

## Core Features (in priority order)

1. **Login page** — **username + password** (local accounts, admin-created; no email
   login, no self-registration), session-based. Roles: `admin`, `production_control`
   (create/edit), `viewer` (management, read-only).
2. **Order list (Main Database)** — searchable, filterable, sortable table of all repair
   orders keyed by **order number**. Inline status updates. Filters on engine type, UIC,
   work center, tier, status, date ranges.
3. **End Shift Report** — production control logs per-order shift activities
   (ops number, activity, progress %, manhours, status), grouped by work center/UIC.
   The report is **exportable to PDF and JPG** for sharing with management (WhatsApp/email).
4. **Master data (optional/later)** — engine types, work centers (MWC), UIC teams,
   users, shifts.

## Tech Stack

Chosen for a small internal tool (≤30 users, >10k rows) deployed on **free cloud
tiers** (see Deployment):

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15+ (App Router) + TypeScript** | One codebase for UI + API routes/server actions; deploys straight to Vercel |
| UI | **Tailwind CSS v4 + shadcn/ui** | Fast to build data-dense dashboards; themeable to DESIGN.md tokens |
| Tables | **TanStack Table v8** | Sorting/filtering/pagination for 10k+ rows (server-side pagination) |
| Database | **Neon PostgreSQL (free tier)** | Managed serverless Postgres, 0.5 GB free ≫ enough for 10k+ rows; no server to maintain |
| ORM | **Drizzle ORM** + drizzle-kit migrations + Neon serverless driver | Type-safe, lightweight, first-class Neon support |
| Auth | **Auth.js (NextAuth v5)** credentials provider — **decided: local accounts, username + password** (usernames may mirror company LDAP usernames for familiarity) | Session cookies; works on serverless. LDAP rejected (unreachable from Vercel); Entra ID SSO is a possible later swap if IT confirms availability |
| Validation | **Zod** | Shared schema validation client/server |
| PDF + JPG export | **Client-side**: print-styled report page → `html-to-image` for JPG, `jsPDF` (image-based) for PDF | Serverless-friendly (no headless Chromium on free tiers); one HTML/CSS layout drives both formats |
| Excel import | **SheetJS (`xlsx`)** | One-time migration of the two existing workbooks + ongoing bulk import |
| Charts (later) | **Recharts** | Shift/backlog KPIs on a dashboard home |

**Not needed at this scale:** microservices, Redis, message queues, GraphQL, separate
backend, server-side headless browsers. Keep it a monolith.

## Deployment (decided: VPS/cloud, simplest + reliable + free)

- **App: Vercel Hobby (free)** — zero-config Next.js hosting, HTTPS, git-push deploys.
  Caveat: Hobby plan is licensed for non-commercial/personal use; an internal company
  tool is a gray area — if that becomes a problem, the fallback is Vercel Pro (~$20/mo)
  or a single cheap VPS with Docker Compose (the app stays deployable both ways).
- **Database: Neon free tier** — serverless Postgres. Autosuspends when idle → first
  query after a quiet period has a ~1s cold start; acceptable for a 30-user internal tool.
- **Consequence for exports:** no long-running server → PDF/JPG generation happens in
  the browser from the print-styled report page (see stack table). Do NOT introduce
  Playwright/Puppeteer server-side unless deployment moves off serverless.
- Environment: `DATABASE_URL` (Neon), `AUTH_SECRET`. Keep all secrets in Vercel env
  vars, never in the repo.

## Domain Model (derived from the Excel files)

### `orders` (from Main Database.xlsx — one row per repair order)
| Field | Source column | Notes |
|---|---|---|
| `order_number` | Order | 9-digit, unique business key (e.g. `512211849`, `805976065`) |
| `date_in` | Date IN | date part arrived |
| `gate4_target` | Gate 4 Target | target date for the Gate 4 repair process; may be `-`/empty |
| `description` | Description & Quantity | free text, may embed qty |
| `serial_number` | Serial Number | ESN (e.g. `960285`) or aircraft reg (e.g. `PK-GNE`) for RETAIL |
| `engine_type` | Engine Type | CFM56-3 / CFM56-5 / CFM56-5B / CFM56-7B / GE90 / GTCP131-9(A/B) / GTCP85-129 / RETAIL |
| `mwc_routing` | MWC Process Tracking | hyphenated work-center chain, e.g. `MR-CC-ND-PT-BC` |
| `mwc_today` | MWC Process Today | current work center in the chain |
| `uic_today` | UIC TODAY | unit in charge currently holding the part: TVU-2/3/4, TVP-1/2, TVP-4, TCS-3, Kitting/RPC, TBR |
| `plan_finish_date` | Plan Finish Date | may be `WR` = **waiting for repair** (no date yet) — store nullable date + `waiting_repair` flag |
| `tier` | TIER | 1 / 2 / 3 priority (1 = highest) |
| `status` | STATUS | OPEN, PROGRESS, URGENT, TOP URGENT, `w/f …` (waiting-for) variants |
| `remark`, `location` | REMARK, LOCATION | free text |

### `shift_report_entries` (from End Shift Report.xlsx — many per order per shift)
| Field | Source column | Notes |
|---|---|---|
| `report_date`, `shift` | Date, Shift | shift ∈ **AM / PM / Overtime** |
| `order_number` | Order Number | FK → orders (soft — allow entries for orders not yet in DB, flag them) |
| `work_center` | Work Center | MWC code: MR, MC, MN, PT, LB, HT, WD, ND, CC, BC, BR, AD… |
| `uic` | UIC Today | unit in charge |
| `ops` | Ops | operation number(s), e.g. `100` or range `0030-0100` — store as text |
| `activity` | Activity | free-text description of work performed |
| `plan_mhrs`, `consumed_mhrs`, `manhours` | Plan/Consumed Mhrs, Manhours Record | numeric |
| `progress_pct`, `stamp_pct` | Actual Progress (%), Stamp | 0–100 |
| `completeness_status` | STATUS / rightmost status | Open / Inprogress / closed / Final confirm |
| `remark` | Remark | free text |

`description`, `serial_number`, `engine_type` in the report are denormalized from the
order — in the app, auto-fill them by order-number lookup instead of retyping.

### Glossary (confirmed by the user)
- **MWC** = work center. Codes seen: MR, MC, MN, PT, LB, HT, WD, ND, CC, BC, BR,
  AD/ADE. Treat as a master-data table, not an enum.
- **UIC** = unit in charge (team currently responsible for the part).
- **Gate 4** = name of the repair process; `Gate 4 Target` is its target date.
- **w/f** = "waiting for" (w/f BDP, w/f Material, w/f Tools/Calibration, w/f Slot…).
- **WR** (in Plan Finish Date) = **waiting for repair** — no plan finish date yet.
- **RETAIL** = an order *type* (customer/component work), recorded in the Engine Type
  column; serial is often an aircraft registration (e.g. `PK-GNE`).
- **Shifts** = AM, PM, Overtime.

## Design

Visual language lives in **DESIGN.md** (RepairX-specific, derived from
spacex-DESIGN.md): dark industrial control-room canvas, DIN-style condensed uppercase
display type, hairline borders, functional status colors ONLY for order/shift status
(see DESIGN.md — the marketing "no accent color" rule is relaxed for data semantics).
The end-shift report has a dedicated **light print theme** for PDF/JPG export.

## Planned Repository Layout (once scaffolding starts)

```
src/
  app/
    (auth)/login/            # login page
    (dashboard)/
      orders/                # order list + detail + edit
      shift-report/          # entry form + report view
      shift-report/[id]/export  # print-styled page, captured client-side to PDF/JPG
      masters/               # engine types, work centers, UIC, users
    api/                     # route handlers (import, lookups)
  db/schema.ts               # Drizzle schema
  lib/                       # auth, zod schemas, utils
scripts/import-excel.ts      # one-time migration from the two .xlsx files
```

## Conventions

- TypeScript strict mode; Zod-validate every mutation on the server.
- Server-side pagination/filtering for the orders table (never ship 10k rows to client).
- All dates stored UTC, displayed in shop-local time (WIB, UTC+7); dates in Excel import
  are day-precision.
- Order number is the universal join key and must be indexed/unique.
- Never delete orders or shift entries — soft-delete/archive; the report is an
  operational record shown to management.
- Keep Indonesian free-text remarks as-is; do not translate data.

## Current Status

- **Planning phase — no code yet.** Repo contains: this file, DESIGN.md,
  spacex-DESIGN.md (reference only — do not follow it directly), and the two source
  Excel files.
- Roadmap: scaffold → auth → orders CRUD + Excel import → shift report + client-side
  PDF/JPG export → masters → KPIs.
