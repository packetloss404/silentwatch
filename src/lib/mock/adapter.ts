// Adapter layer between the mock store and the API routes.
// `app/api/*` handlers and RSC `page.tsx` files call this adapter; keep both in sync
// when swapping the backend. `mockStore` is only read here (and in `seed` during init).

import { mockStore } from './seed';
import type {
  Alert,
  Asset,
  AuditLogEntry,
  Baseline,
  BaselineDiff,
  EvidenceItem,
  Incident,
  NetworkObservation,
  OccupancyEvent,
  PatternFinding,
  Report,
  SignalDensityPoint,
  SignalObservation,
  Site,
  TimePoint,
  User,
  VehicleObservation,
  WatchlistEntry,
  Zone,
} from '@/lib/types';

export interface SilentWatchAdapter {
  getSite(): Promise<Site>;
  listZones(): Promise<Zone[]>;
  listAssets(): Promise<Asset[]>;
  listSignals(): Promise<SignalObservation[]>;
  listNetwork(): Promise<NetworkObservation[]>;
  listVehicles(): Promise<VehicleObservation[]>;
  listWatchlist(): Promise<WatchlistEntry[]>;
  listOccupancy(): Promise<OccupancyEvent[]>;
  listPatterns(): Promise<PatternFinding[]>;
  listAlerts(): Promise<Alert[]>;
  listIncidents(): Promise<Incident[]>;
  listEvidence(incidentId?: string): Promise<EvidenceItem[]>;
  listBaselines(): Promise<Baseline[]>;
  listBaselineDiffs(baselineId?: string): Promise<BaselineDiff[]>;
  signalDensity(): Promise<SignalDensityPoint[]>;
  detections(): Promise<TimePoint[]>;
  listUsers(): Promise<User[]>;
  listAudit(): Promise<AuditLogEntry[]>;
  listReports(): Promise<Report[]>;
}

export const mockAdapter: SilentWatchAdapter = {
  async getSite() {
    return mockStore.site;
  },
  async listZones() {
    return mockStore.zones;
  },
  async listAssets() {
    return mockStore.assets;
  },
  async listSignals() {
    return mockStore.signals;
  },
  async listNetwork() {
    return mockStore.networkObservations;
  },
  async listVehicles() {
    return mockStore.vehicles;
  },
  async listWatchlist() {
    return mockStore.watchlist;
  },
  async listOccupancy() {
    return mockStore.occupancy;
  },
  async listPatterns() {
    return mockStore.patterns;
  },
  async listAlerts() {
    return mockStore.alerts;
  },
  async listIncidents() {
    return mockStore.incidents;
  },
  async listEvidence(incidentId?: string) {
    if (incidentId === undefined) return mockStore.evidence;
    if (incidentId === '') return [];
    return mockStore.evidence.filter((e) => e.incidentId === incidentId);
  },
  async listBaselines() {
    return mockStore.baselines;
  },
  async listBaselineDiffs(baselineId?: string) {
    if (baselineId === undefined) return mockStore.baselineDiffs;
    if (baselineId === '') return [];
    return mockStore.baselineDiffs.filter((d) => d.baselineId === baselineId);
  },
  async signalDensity() {
    return mockStore.signalDensity;
  },
  async detections() {
    return mockStore.detections;
  },
  async listUsers() {
    return mockStore.users;
  },
  async listAudit() {
    return mockStore.audit;
  },
  async listReports() {
    return mockStore.reports;
  },
};

export const adapter: SilentWatchAdapter = mockAdapter;
