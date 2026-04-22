# SilentWatch — Roadmap

This roadmap is intentionally narrow. SilentWatch is a defensive tool. We
will not add capabilities that enable offensive surveillance, hidden
collection, or interference with third-party devices and networks.

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
