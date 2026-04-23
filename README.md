# SilentWatch

> Defensive privacy & situational-awareness for **property you own or lawfully
> protect** — perimeter, buildings, parking, and approaches — not corporate
> network or server operations.

SilentWatch is an operator-grade web app for **physical site security** and
**awareness around the property**: what the cameras and edge devices see and
record in aggregate, how vehicles and patterns of movement look over time, and
(optionally) what **Wi-Fi, Bluetooth, and BLE** passes through or near the site
so you notice new or suspicious radio activity. It helps teams **see the
site**, not run a NOC.

**Core use cases (in design order):**

- **Cameras & coverage** — Fixed assets on a map: visible, IR/thermal, LPR,
  occupancy counters, door/sensor points; field of view and zones for the
  **property**, not a data-center rack diagram.
- **Movement & people (non-identifying)** — Motion and **anonymous
  occupancy counts** per zone (people-shaped detections as bucketed totals
  only — no faces, no identities, no per-person tracking).
- **Vehicles at the edge** — License plate readers on **your** property: masked
  plate, **vehicle class / make-style** fields where the pipeline provides them,
  watchlist match (operator-defined: expected delivery, advisory, etc.). No
  DMV or third-party plate-to-owner lookup.
- **Cataloging & patterns** — Repeat visitors, after-hours activity, unusual
  dwell, time-of-day habits — **frequency** and **catalog** views, not identity
  dossiers.
- **Ambient RF module** — Wi-Fi / Bluetooth / BLE **observed in or near the
  environment** (e.g. strong unknown AP, BLE beacon persistence). This
  complements physical sensors; it is **not** the primary story of “monitoring
  your network” or server health.
- **Optional LAN context** — Where you also administer on-site IT, you can
  correlate with inventoried hosts on owned subnets; that remains **secondary**
  to **property** security in product positioning.
- **Documentation** — Drift from an approved baseline, incidents, operator
  audit, and reports for oversight.

**Not in scope (intentionally and permanently):**

- No offensive surveillance. No covert collection.
- No deauth, jamming, packet injection, cracking, or credential capture.
- No facial recognition, person identification, or identity inference.
- No automated tracking of identified individuals.
- No plate-to-owner lookups or third-party plate-search integrations.
- All sensitive integrations are gated behind explicit, off-by-default flags.

---

## Stack

- **Frontend:** Next.js 14 (App Router) · TypeScript · React 18
- **Styling:** SCSS modules with a real design-token system (no Tailwind)
- **UI primitives:** Radix UI for dialogs / popovers / tabs
- **Mapping:** MapLibre GL JS via `react-map-gl/maplibre` (offline dark style by default)
- **Charts:** Recharts
- **State:** colocated React state, Zustand available for cross-cutting concerns
- **Backend:** in-memory mock adapter behind `/api/*` routes — replaceable with
  a real FastAPI / NestJS service against PostgreSQL + PostGIS, Redis, and
  S3-compatible storage. Compose stubs are included in `docker-compose.yml`.
- **Auth:** placeholder. Production should add local auth + RBAC.

---

## Getting started

### 1. Install

```bash
cp .env.example .env.local
npm install
```

### 2. Run the dev server

```bash
npm run dev
```

Open <http://localhost:3000>. The root redirects to the Command dashboard.
To run on a different port: `npx next dev -p <port>`.

### 3. Other useful scripts

```bash
npm run typecheck    # TypeScript only
npm run build        # production build
npm run start        # serve the production build on :3000
npm run seed         # print the mock-data summary (sanity check)
npm run lint
```

### 4. Docker

```bash
docker compose up --build
```

The compose file ships a single `web` service in mock mode. Database, API,
Redis, and MinIO services are present but commented out — uncomment them when a
real backend is wired up.

---

## Project layout

```
src/
├── app/
│   ├── (app)/                  # signed-in app shell route group
│   │   ├── dashboard/          # Command dashboard
│   │   ├── map/                # Map workspace
│   │   ├── signals/            # Signal awareness table & inspector
│   │   ├── assets/             # Asset inventory
│   │   ├── vehicles/           # LPR observations + watchlist matches
│   │   ├── patterns/           # Repeat-visit / dwell / time-of-day analytics
│   │   ├── incidents/          # Incident queue + detail
│   │   ├── audit/              # Privacy audit (baseline drift)
│   │   ├── reports/            # Report builder + history
│   │   └── layout.tsx          # AppShell (sidebar + topbar)
│   ├── api/                    # Mock API routes — one per resource:
│   │   │                       #   alerts, assets, audit, baselines,
│   │   │                       #   incidents, network, occupancy, patterns,
│   │   │                       #   reports, signals, site, timeseries, users,
│   │   │                       #   vehicles, watchlist, zones
│   ├── icon.svg                # Favicon (Next.js app-router convention)
│   ├── globals.scss
│   ├── layout.tsx
│   └── page.tsx                # → /dashboard
├── components/
│   ├── shell/                  # Sidebar, TopBar, AppShell
│   ├── ui/                     # Reusable primitives (Panel, Badge, …)
│   ├── charts/                 # AreaTrend, BarsChart, Donut
│   ├── map/                    # MapLibre workspace + GeoJSON helpers
│   └── layout/                 # PageContainer
├── lib/
│   ├── types.ts                # Shared domain types
│   ├── format.ts               # Time/identifier formatting + masking
│   ├── rand.ts                 # Deterministic PRNG for seed data
│   └── mock/
│       ├── seed.ts             # Believable demo dataset
│       └── adapter.ts          # SilentWatchAdapter — swap to a real backend
└── styles/
    ├── tokens.scss             # Color, type, spacing, shadows
    └── mixins.scss             # Reusable SCSS helpers

public/
├── logo.svg                    # Full horizontal lockup (mark + wordmark)
└── logo-mark.svg               # Icon-only mark for compact UI slots
```

## Key design ideas

- **Single adapter seam.** UI fetches from `/api/*`, which delegates to
  `lib/mock/adapter.ts`. Replacing `mockAdapter` with a real backend client
  is the entire integration surface — no UI rewrites needed.
- **Tokens, not utility classes.** All visual decisions go through
  `src/styles/tokens.scss` so theme changes propagate consistently.
- **Mask identifiers in UI.** `format.ts` provides `maskMac` and `shortId` for
  any place that displays MACs / device identifiers.
- **No external tile dependency by default.** The map renders against a
  fully self-contained dark MapLibre style so the demo works offline. Point
  `NEXT_PUBLIC_MAP_STYLE_URL` at a self-hosted or commercial style for a real
  basemap when you have lawful rights to use it.
- **Off-by-default integrations.** All sensitive integrations
  (`FEATURE_*`) are flagged off in `.env.example`.

## Brand assets

- `public/logo.svg` — full horizontal lockup (mark + "SilentWatch" wordmark +
  tagline). Use in headers, splash screens, and marketing surfaces.
- `public/logo-mark.svg` — icon-only mark. Use wherever space is tight
  (sidebar collapsed state, favicons on surfaces Next.js doesn't auto-serve,
  report headers, loading states).
- `src/app/icon.svg` — favicon; Next.js injects the appropriate `<link>` tags
  automatically from the app-router convention.

The mark is a shield silhouette containing three stacked sonar-style arcs and
a cyan core — "defensive perimeter + silent listening". Primary palette is
cyan (`#a5f3fc → #22d3ee → #0e7490`) on the app's `#07090c` surface.

## Going deeper

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — module breakdown, data model, and
  how to wire a real backend in.
- [`ROADMAP.md`](./ROADMAP.md) — planned lawful integrations and what's
  intentionally out of scope.

## License

Internal project scaffold — choose your own license before distributing.
