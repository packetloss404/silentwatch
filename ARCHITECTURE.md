# SilentWatch — Architecture notes

Operator-grade defensive monitoring tool. The current scaffold is a
fully-typed Next.js 14 frontend backed by an in-memory mock adapter. The
adapter is intentionally narrow so a future FastAPI or NestJS backend can be
substituted without UI changes.

## Boundaries

```
┌──────────────────────────────────────────────────────────────────┐
│                       Browser (Next.js client)                    │
│  · App shell (sidebar/topbar)                                     │
│  · Pages: dashboard, map, signals, assets, incidents, audit,      │
│           reports                                                 │
│  · UI primitives + design tokens                                  │
│  · MapLibre GL workspace                                          │
└─────────────▲────────────────────────────────────▲────────────────┘
              │  fetch                              │  WebSockets (planned)
              │                                     │
┌─────────────┴────────────────────┐  ┌─────────────┴───────────────┐
│  Next.js API routes (/api/*)     │  │  Realtime gateway (planned) │
│  · One file per resource         │  │  · Push alerts, signal      │
│  · Delegates to SilentWatchAdapter│  │    updates, asset state     │
└─────────────▲────────────────────┘  └─────────────────────────────┘
              │ adapter interface
              │
┌─────────────┴────────────────────────────────────────────────────┐
│                   SilentWatchAdapter (lib/mock)                  │
│  Today  →  in-memory mock store (deterministic, seeded)          │
│  Future →  real backend client (FastAPI / NestJS / direct DB)    │
└───────────────────────────────────────────────────────────────────┘
```

The `SilentWatchAdapter` interface in `src/lib/mock/adapter.ts` is the only
seam between the UI and the data source. Anything that swaps it (a HTTP client,
a gRPC client, a tRPC layer, …) inherits the whole UI as-is.

## Data model

Defined in `src/lib/types.ts`. Mirrors the eventual database schema so the
same TypeScript types can also describe API responses in production.

| Entity | Purpose |
| ------ | ------- |
| `Site` | Top-level operating context (single-site for the demo). |
| `Zone` | Polygon regions: perimeter, interior, restricted, parking, utility. |
| `Asset` | Physical infrastructure: cameras, sensors, APs, doors, vehicles. |
| `SignalObservation` | RF observations: SSIDs, BLE peripherals, ambient APs. |
| `NetworkObservation` | Inventoried hosts on owned subnets. |
| `Alert` | Source events (signal / sensor / camera / network / baseline / operator). |
| `Incident` | Investigation aggregating alerts, evidence, and zones. |
| `EvidenceItem` | Notes, snapshots, signal logs, sensor logs, attachments, map pins. |
| `Baseline` / `BaselineDiff` | Approved snapshots and drift findings. |
| `Report` | Generated PDFs / exports with audit metadata. |
| `User` / `Role` | Operator identity and RBAC. |
| `AuditLogEntry` | Operator action history. |

Identifiers shown in the UI (e.g., MAC addresses) are pre-masked via
`format.ts → maskMac`. The store never holds raw addresses in places the UI
would render them un-masked.

## Module structure

```
src/components/
  ├─ shell/         AppShell · Sidebar · TopBar
  ├─ layout/        PageContainer (default vs. fluid)
  ├─ ui/            Panel · Button · Badge · DataTable · Drawer ·
  │                 PageHeader · Severity · KeyValue · Sparkline ·
  │                 SearchInput · Segmented · Tag · Empty · StatBlock
  ├─ charts/        AreaTrend · BarsChart · Donut (Recharts wrappers)
  └─ map/           MapWorkspace · AssetMarker · GeoJSON helpers ·
                    self-contained dark MapLibre style
```

UI primitives are intentionally small and composable — `Panel + DataTable +
Drawer` covers most page layouts.

## Map workspace

- `MapWorkspace.tsx` is the only client component on the Map page. The
  surrounding page is server-rendered and feeds it props.
- Camera FOVs and sensor coverage rings are computed in `geo.ts` as GeoJSON
  polygons, then drawn as MapLibre fill+line layers — no per-camera divs.
- Asset markers are real DOM elements (`<Marker>`) so they get full
  hover/click semantics and proper accessibility.
- `flatDarkStyle` in `styleLight.ts` is a one-layer MapLibre style so the
  demo runs offline. Replace with a real raster/vector style for production.

## State management

- Most state stays local to the page or component (`useState` + URL).
- `zustand` is included for any future cross-cutting state (e.g., a global
  filter bus, saved workspace views, keyboard shortcut registry).
- Server data flows through the adapter; we deliberately did not add SWR /
  React Query yet because the mock data is synchronous and the UI is
  server-rendered. Add a query layer when the real backend is wired up.

## API surface (Next.js routes)

Each resource lives at `src/app/api/<resource>/route.ts`. They are a thin
mapping over the adapter — no business logic. When the real backend exists,
these routes can either:

1. continue to exist as a Next.js BFF and proxy to the backend, or
2. be deleted entirely in favour of direct backend calls from server
   components.

## Wiring a real backend

1. Implement the `SilentWatchAdapter` interface in
   `src/lib/mock/adapter.ts` (or a sibling file) using `fetch` against your
   API. Export it under the same `adapter` name.
2. Set `BACKEND_URL` in `.env.local`. Decide whether to keep `/api/*` routes
   as a BFF or remove them.
3. Add auth (`AUTH_SECRET`, session cookie middleware in `src/middleware.ts`).
4. Provision the optional services in `docker-compose.yml` (PostgreSQL +
   PostGIS, Redis, MinIO).
5. Replace `mockStore` with whatever fixtures or migrations your backend uses.

## Conventions

- **Server components by default.** Client islands (`'use client'`) are
  scoped to interactive views: MapWorkspace, SignalsView, AssetsView,
  IncidentsView, the dashboard's interactive bits, and Drawer/Tabs primitives.
- **No Tailwind.** All styling is SCSS modules using design tokens.
- **No emoji decoration in the product.**
- **No fake metrics dressed up to look real.** All visible numbers come from
  the seed data and update consistently.
