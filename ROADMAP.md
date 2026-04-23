# SilentWatch — Roadmap

This roadmap is intentionally narrow. SilentWatch is a defensive tool. We
will not add capabilities that enable offensive surveillance, hidden
collection, or interference with third-party devices and networks.

**Product framing:** SilentWatch is about the **outside world** — property,
perimeter, and approaches — **not** lab or datacenter “networking.” It is
**lawful, documented, defensive** awareness on ground you control: what a
**reasonable security operation** would notice around a site, done with
**consent, minimization, and auditability** — *not* dragnet surveillance,
covert collection, or identity systems dressed as “security.”

---

## North star (shared principles)

- **Place-first:** Fences, gates, driveways, lots, and **zones on a map** — not
  racks, subnets, or a NOC story.
- **Sensors, not “users on the LAN”:** Cameras, motion, **aggregate
  people-shaped counts**, **LPR the operator owns** with **operator-defined**
  watchlists, **optional RF** at or near the property line.
- **Documentation and posture:** Shifts, handoffs, incidents, and exports that
  stand up to **insurance, boards, and counsel** without becoming a
  general-purpose people database.
- **Guardrails by design:** Jurisdiction, purpose codes, minimization,
  retention, **opt-in** for sensitive RF modes, **no plate–to–owner** from
  third parties, **no face search** as a product feature.

---

## Strategic product themes (ideation pool)

Concrete directions for v1 and beyond, grouped by theme. Items are
**candidates** for prioritization; each must pass the “defensive, lawful,
property-scoped” test above.

### 1) Perimeter and physical site

- Boundary and **approach map** — path from street → gate → entry with
  dwell, not only “an alert fired.”
- **Expected flow lanes and time windows** — visitor vs service vs delivery;
  off-lane = review, not automatic accusation.
- **Neighbor-adjacent sensitivity bands** along shared property edges to reduce
  noise and intrusiveness.
- **Perimeter test / drill mode** — walk tests with pass/fail and a **site
  readiness** digest.
- **Lighting / night context** — align motion with dusk/dark vs lit paths.
- **“Quiet site” health** — false positives down, baselines healthy, **physical**
  readiness visible.

### 2) Vehicles and parking

- **Operator watchlists** — advisory, expected, flag-for-review; clearly *the
  site’s* policy, not a public list.
- **Time-window rules** — e.g. this plate is OK only in approved windows.
- **Stall / zone parking** — wrong stall or lot without resolving driver
  identity.
- **Visit threading** (large sites) — e.g. gate read then dock read as one
  **session**.
- **Pseudonymous vehicle cards** — “vehicle A on site” plus operator notes, not
  DMV enrichment.

### 3) Ambient RF (module, not NOC)

- **SSID / BSSID and BLE persistence** — first-seen, trend, “present > N
  minutes” near the line.
- **Heuristic “odd AP” / evil-twin style flags** — always review, never
  over-claim “proof.”
- **Property-line pass vs loiter** — multi-sensor layout with **confidence** in
  UI.
- **Allowlists** — neighbor gear, contractor days/times; audit who added
  overrides.
- **Regime-dependent band awareness** (e.g. RC) — **off by default**, geo
  disclaimers, **no payload decode** as the story.
- **RF evidence pack** — metadata and series, no decrypted content; jurisdiction
  + non-forensic disclaimer.

### 4) Operator workflow (physical security, not ITSM)

- **Shift brief and sign-on** — open incidents, known contractors, who’s on
  post, mandatory acks.
- **“What changed since last night”** — new assets/zones, watchlist, baseline
  drift, overnight incidents.
- **Triage lane** — acknowledge / false positive / escalate / handoff; stale
  alerts resurface.
- **Zone-first map + list** — think in *space*, not abstract ticket order.
- **Handoff / passdown** — structured end-of-shift note for the next crew.
- **Drill and quiet hours** — training traffic tagged so KPIs stay honest.

### 5) Governance, audit, minimization

- **Policy profiles** per zone — what is collected, when, and why.
- **Purpose codes** on search and export; optional approver for sensitive
  exports.
- **Immutable audit log** — who did what to which data and configuration.
- **Retention + legal hold** with place/release workflow.
- **Oversight dashboard** (aggregate) — access and export volume, not always
  full operator view.
- **Record lineage** — “explain this row”: policy version, transforms,
  source sensor.

### 6) Integrations and edge (property-shaped, not CMDB)

- **VMS / camera adapter** — coverage, online/offline, blind spots; read-first.
- **LPR POST API** (vendor-agnostic) — masked identifiers, class, confidence;
  edge container on site.
- **Door / access events** as **zone-level** signals, not full HR/identity
  sync.
- **Edge analytics contract** — counts/dwell in, **no video in core** by
  default.
- **On-prem / air-gapped** deployment — local tiles, **site-scoped** trust
  boundary, optional cloud read-side only.

### 7) Defensive awareness (lawful, bounded)

- **Property-bounded timeline** — fuse gates, vehicles, motion, RF **on the
  site** under policy.
- **Corroboration bundle** for real incidents — user-initiated, custody-aware.
- **Environmental context** — weather, power, public alerts to cut false
  positives.
- **Multi-party transparency** (shared sites) — who can see what and why.
- **Explicit non-goals:** stalking, offensive tooling, hidden live tracking off
  property.

### 8) Reports and third parties

- **Posture one-pager** (quarterly) for boards / programs.
- **Per-incident fact sheet** — roles and facts, not unnecessary PII.
- **Insurance / risk narrative** — aggregate classes and response metrics.
- **Integrity of reports** — hashes or signatures on “what this export
  included.”
- **Preset export profiles** — Insurance, Board, Regulator, Legal with **field
  caps**; optional second approver for high-sensitivity fields.

### 9) AI and analytics (physical, explainable)

- **Per-zone and time baselines** with clear “what we learned from.”
- **Human-in-the-loop** labels for RF clusters / repeat patterns; provenance
  for audit.
- **Cross-sensor agreement** before max severity; avoid single-channel panic.
- **“Why not critical”** and **threshold replay** on historical data.
- **Explicit bias / coverage risk** when zones are unequally instrumented.

### 10) Differentiation (vs consumer / cloud-SOC one-box)

- **Sovereign policy plane** — your retention, your boundary, your rules.
- **LPR and watchlists are operator-owned** — not vendor “community” lists.
- **RF is optional** — a module, not a forced all-in-one stack.
- **Operator-grade** — handoff, runbooks, multi-site, not only doorbell UX.
- **Incident-centric fusion** — one investigation timeline across vehicles,
  motion, RF, and video-adjacent metadata.
- **On-prem / hybrid** as a first-class story for sites that will not default
  all video to a public cloud.

### Suggested sequencing (into delivery planning)

1. **Perimeter and zone** depth on the map and in copy (already aligned with
   product story).
2. **Shift digest + triage** patterns on the dashboard and incidents path.
3. **LPR** time-windows, visit threading, and stronger **watchlist** semantics.
4. **Governance** — purpose codes, stricter export presets, audit log surface.
5. **Edge adapters** — LPR POST + VMS read-only when leaving mock data.

---

## Now (v0.x)

- ✅ Operator-grade UI scaffold (sidebar shell, design system, polished pages).
- ✅ Mock dataset and adapter layer covering all seven product areas.
- ✅ Map workspace with zones, assets, FOV cones, alert pings, and a
  timeline scrubber.
- ✅ Signals / Assets / Incidents / Audit / Reports modules with realistic
  filtering and inspection drawers.

## Near-term (v0.x → v1.0)

These build on the existing scaffold and are safe to add incrementally:

- **Real auth + RBAC.** Local-first auth with a hardened cookie session.
  Roles: admin, operator, analyst, viewer.
- **Persistent backend.** PostgreSQL + PostGIS for geometry; Redis + BullMQ
  (or Celery if Python) for jobs; S3-compatible storage for evidence.
- **Realtime channel.** WebSocket / SSE for incoming alerts and live signal
  status; map markers update without a refresh.
- **Saved workspaces.** Operator-saved map views, filter sets, and
  investigation contexts.
- **Keyboard shortcuts.** Ranger-style quick navigation, command palette,
  shortcut hints in the UI.
- **Better timeline UX.** Scrub + pin time ranges; correlate signals,
  sensor events, and notes in one composite view.
- **Report generation.** Real PDF exports for the four templates already
  surfaced in the UI, with watermarking and audit metadata.
- **Operator audit log.** First-class searchable audit trail for every state
  change, exportable per incident.

## Future safe integrations (gated, off by default)

Each of the following will live behind a `FEATURE_*` flag (already declared in
`.env.example`) and be implemented as an isolated adapter:

- **Approved camera systems.** Read-only inventory + status ingestion from
  Axis, Hanwha, Bosch, Genetec, Milestone — only against operator-owned
  systems with explicit credentials.
- **Approved network inventory.** Read-only ingestion from MikroTik /
  pfSense / Cisco / Aruba / Ubiquiti against operator-owned infrastructure.
- **Environmental sensors.** Door contacts, temperature, occupancy sensors
  from operator-owned controllers.
- **Site maps and floorplans.** GeoTIFF / SVG overlays so the map
  workspace can use the operator's own basemap rather than a public tile
  provider.
- **Public weather overlays.** Optional, read-only meteorological overlays
  for situational awareness.

Everything in this category must:

- Be explicitly enabled by the operator.
- Operate against systems they own or administer.
- Default to read-only; never push state into the upstream system.
- Mask sensitive identifiers in the UI.

## Out of scope — permanently

The following will not be added, regardless of demand:

- Packet injection, deauthentication, jamming, or any active interference
  with third-party radios.
- Credential capture, password cracking, or exploit tooling.
- Facial recognition, person identification, or identity inference.
- Automated tracking of individuals.
- Covert / hidden collection.
- Data exfiltration tooling.
- Anything that captures content from communications you are not
  authorized to inspect.

This list reflects the product's intent: defenders, on their own ground,
documenting what they own. If an integration request would push past those
boundaries, the answer is no.
