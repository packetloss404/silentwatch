// SilentWatch — shared domain types.
// These mirror the eventual database schema but are intentionally framework-agnostic
// so the same models can be reused by the future FastAPI / NestJS backend.

export type ID = string;
export type ISODate = string;
export type LngLat = [number, number]; // [longitude, latitude]

// ─── People & access ───────────────────────────────────────────────
export type Role = 'admin' | 'operator' | 'analyst' | 'viewer';

export interface User {
  id: ID;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  lastSeen: ISODate;
}

// ─── Geography ─────────────────────────────────────────────────────
export interface Site {
  id: ID;
  name: string;
  description: string;
  center: LngLat;
  bounds: [LngLat, LngLat];
  timezone: string;
}

export type ZoneKind = 'perimeter' | 'interior' | 'restricted' | 'public' | 'parking' | 'utility';

export interface Zone {
  id: ID;
  siteId: ID;
  name: string;
  kind: ZoneKind;
  /** GeoJSON polygon ring (lng,lat pairs). */
  polygon: LngLat[];
  notes?: string;
}

// ─── Assets ────────────────────────────────────────────────────────
export type AssetType =
  | 'camera'
  | 'lpr-camera'
  | 'ir-camera'
  | 'sensor'
  | 'occupancy-counter'
  | 'access-point'
  | 'gateway'
  | 'switch'
  | 'door-controller'
  | 'vehicle'
  | 'building'
  | 'entrance'
  | 'beacon';

/** Optional sensing capabilities a camera or sensor may carry. */
export type AssetCapability =
  | 'lpr'
  | 'thermal'
  | 'low-light'
  | 'audio'
  | 'ptz'
  | 'occupancy'
  | 'motion';

export type AssetStatus = 'online' | 'offline' | 'degraded' | 'unknown' | 'maintenance';

export interface Asset {
  id: ID;
  siteId: ID;
  zoneId?: ID;
  name: string;
  type: AssetType;
  status: AssetStatus;
  position: LngLat;
  /** For directional sensors / cameras: heading in degrees (0 = north). */
  headingDeg?: number;
  /** For sensors / cameras: detection radius in meters (visualization only). */
  rangeM?: number;
  /** For cameras: field-of-view in degrees. */
  fovDeg?: number;
  vendor?: string;
  model?: string;
  serial?: string;
  owner?: string;
  installedAt?: ISODate;
  lastSeen?: ISODate;
  capabilities?: AssetCapability[];
  tags?: string[];
  notes?: string;
}

// ─── Vehicle observations (LPR) ────────────────────────────────────
// SilentWatch records *observations* — what was seen passing or stopping near
// the operator's property. It does NOT perform plate-to-owner lookups, store
// raw plates client-side (UI shows masked plate), or build identity dossiers.
// "Patterns" are anonymous frequency analysis (this plate has been seen N
// times in this time window) — useful for noticing unusual recurring traffic.

export type VehicleClass = 'car' | 'suv' | 'truck' | 'van' | 'motorcycle' | 'bicycle' | 'unknown';
export type VehicleClassification =
  | 'expected'   // matches an operator watchlist entry tagged 'expect'
  | 'repeat'     // seen frequently but not on a watchlist
  | 'unknown'    // first observation
  | 'flagged'    // matches an operator watchlist entry tagged 'flag'
  | 'ignored';   // explicitly muted by operator

export type VehicleDirection = 'arriving' | 'departing' | 'passing' | 'stopped';

export interface VehicleObservation {
  id: ID;
  siteId: ID;
  /** Plate as displayed in the UI — partially masked (e.g. "8B···K2"). */
  plateMasked: string;
  /** Region hint from plate format (e.g. "US-WA"). Best-effort, may be null. */
  plateRegion?: string;
  /** Hash of the canonical plate; used to match against the watchlist. */
  plateHash: string;
  color?: string;
  vehicleClass: VehicleClass;
  /** Camera/asset that captured the observation. */
  cameraId?: ID;
  zoneId?: ID;
  classification: VehicleClassification;
  direction: VehicleDirection;
  /** Average dwell time at site over recent visits (seconds). */
  dwellSeconds?: number;
  /** Per-day visit counts for the last 7 days. */
  visitsByDay?: number[];
  /** Hour-of-day visit histogram (length 24). */
  visitsByHour?: number[];
  firstSeen: ISODate;
  lastSeen: ISODate;
  count: number;
  watchlistId?: ID;
  tags?: string[];
  notes?: string;
}

export interface WatchlistEntry {
  id: ID;
  siteId: ID;
  /** Display label only — operator-defined. */
  label: string;
  /** Plate hash or partial mask the operator entered. */
  plateMasked: string;
  plateHash: string;
  /** Operator policy for this plate. */
  action: 'expect' | 'flag' | 'ignore';
  /** Optional reason for the watchlist entry (audit only). */
  reason?: string;
  createdBy: ID;
  createdAt: ISODate;
  active: boolean;
}

// ─── Anonymous occupancy / presence events ─────────────────────────
// Occupancy events are *counts* — how many person-shaped detections were
// observed in a zone, for how long. They never include identity, biometrics,
// or per-individual tracks. Cameras and IR sensors emit these aggregated
// counts via on-device analytics; SilentWatch only stores the totals.

export interface OccupancyEvent {
  id: ID;
  siteId: ID;
  zoneId: ID;
  /** Bucket start time. */
  t: ISODate;
  /** Aggregated person-shaped detections in this bucket. */
  count: number;
  /** Bucket duration in seconds. */
  durationS: number;
  /** Source asset id (camera or occupancy counter). */
  source: ID;
  /** True if outside the zone's documented operating hours. */
  afterHours?: boolean;
}

// ─── Pattern findings ──────────────────────────────────────────────
// Distilled, operator-facing summaries of patterns SilentWatch noticed
// over the recent window. Always anonymous and frequency-based.

export type PatternKind =
  | 'repeat-vehicle'
  | 'after-hours-vehicle'
  | 'after-hours-presence'
  | 'unusual-dwell'
  | 'first-time-vehicle'
  | 'recurring-time-of-day';

export interface PatternFinding {
  id: ID;
  siteId: ID;
  kind: PatternKind;
  severity: Severity;
  subject: string;
  detail: string;
  evidence: string;
  detectedAt: ISODate;
  zoneId?: ID;
  vehicleId?: ID;
  acknowledged: boolean;
}

// ─── Signal & network observations ─────────────────────────────────
export type SignalBand = 'wifi-2.4' | 'wifi-5' | 'wifi-6' | 'bluetooth' | 'ble' | 'lora' | 'zigbee' | 'unknown';
export type Classification = 'known' | 'unknown' | 'suspicious' | 'hostile' | 'ignored';

export interface SignalObservation {
  id: ID;
  siteId: ID;
  zoneId?: ID;
  /** Display alias / SSID / advertised name. */
  alias: string;
  /** Hashed or partially-masked identifier (never raw MAC in UI). */
  identifier: string;
  band: SignalBand;
  type: 'access-point' | 'station' | 'beacon' | 'peripheral' | 'unknown';
  vendorHint?: string;
  classification: Classification;
  /** dBm, typically -100..-30 */
  rssi: number;
  channel?: number;
  firstSeen: ISODate;
  lastSeen: ISODate;
  count: number;
  /** -1..1; positive means rising over the recent window. */
  trend: number;
  /** 0..100 */
  anomalyScore: number;
  tags?: string[];
  notes?: string;
  /** Per-hour observation counts for the last N hours (newest last). */
  history?: number[];
}

export interface NetworkObservation {
  id: ID;
  siteId: ID;
  hostname: string;
  ipMasked: string;
  macMasked: string;
  vendorHint?: string;
  subnet: string;
  firstSeen: ISODate;
  lastSeen: ISODate;
  classification: Classification;
  openPorts?: number[];
  notes?: string;
}

// ─── Incidents & alerts ────────────────────────────────────────────
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type IncidentStatus = 'open' | 'investigating' | 'contained' | 'resolved' | 'dismissed';

export interface Alert {
  id: ID;
  siteId: ID;
  zoneId?: ID;
  assetId?: ID;
  signalId?: ID;
  title: string;
  detail: string;
  severity: Severity;
  source: 'signal' | 'sensor' | 'camera' | 'network' | 'baseline' | 'operator';
  acknowledged: boolean;
  createdAt: ISODate;
  position?: LngLat;
}

export interface Incident {
  id: ID;
  siteId: ID;
  title: string;
  summary: string;
  severity: Severity;
  status: IncidentStatus;
  assignee?: ID;
  openedAt: ISODate;
  updatedAt: ISODate;
  closedAt?: ISODate;
  alertIds: ID[];
  evidenceIds: ID[];
  zoneIds: ID[];
  tags?: string[];
}

export type EvidenceKind = 'note' | 'snapshot' | 'signal-log' | 'sensor-log' | 'attachment' | 'map-pin';

export interface EvidenceItem {
  id: ID;
  incidentId: ID;
  kind: EvidenceKind;
  title: string;
  body?: string;
  capturedAt: ISODate;
  capturedBy?: ID;
  position?: LngLat;
  /** Reference key for object storage; UI never inlines binary content. */
  storageKey?: string;
}

// ─── Baselines & audit ─────────────────────────────────────────────
export interface Baseline {
  id: ID;
  siteId: ID;
  name: string;
  createdAt: ISODate;
  description: string;
  /** snapshot summary stats — full data lives server-side */
  signalCount: number;
  networkCount: number;
  assetCount: number;
  active: boolean;
}

export type DriftKind =
  | 'unknown-network-device'
  | 'rogue-access-point'
  | 'unusual-bluetooth'
  | 'exposed-service'
  | 'asset-missing'
  | 'asset-relocated'
  | 'misconfigured-camera';

export interface BaselineDiff {
  id: ID;
  baselineId: ID;
  kind: DriftKind;
  severity: Severity;
  subject: string;
  detail: string;
  remediation: string;
  detectedAt: ISODate;
  resolved: boolean;
}

// ─── Audit log ─────────────────────────────────────────────────────
export interface AuditLogEntry {
  id: ID;
  actorId: ID;
  actorName: string;
  action: string;
  target?: string;
  at: ISODate;
  detail?: string;
}

// ─── Tags ──────────────────────────────────────────────────────────
export interface Tag {
  id: ID;
  label: string;
  color?: string;
}

// ─── Time-series helpers ───────────────────────────────────────────
export interface TimePoint {
  t: ISODate;
  v: number;
}

export interface SignalDensityPoint {
  t: ISODate;
  wifi: number;
  bluetooth: number;
  ble: number;
}

// ─── Reports ───────────────────────────────────────────────────────
export type ReportKind = 'executive' | 'technical' | 'baseline-drift' | 'incident-export' | 'change-log';

export interface Report {
  id: ID;
  siteId: ID;
  kind: ReportKind;
  title: string;
  generatedAt: ISODate;
  generatedBy: ID;
  rangeFrom: ISODate;
  rangeTo: ISODate;
  summary: string;
  sizeBytes: number;
}
