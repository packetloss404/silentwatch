// Mock-data smoke check.
//
// SilentWatch currently ships with an in-memory mock store (`src/lib/mock/seed.ts`).
// When a real backend is added, replace this script with the real DB seed loader.
// For now we simply print summary counts so `npm run seed` is a useful sanity check.

import { mockStore } from '../src/lib/mock/seed';

function fmt(label: string, n: number) {
  return `  ${label.padEnd(28, ' ')} ${String(n).padStart(5, ' ')}`;
}

console.log('SilentWatch — mock data summary');
console.log('────────────────────────────────────────');
console.log(fmt('site', 1));
console.log(fmt('zones', mockStore.zones.length));
console.log(fmt('assets', mockStore.assets.length));
console.log(fmt('signal observations', mockStore.signals.length));
console.log(fmt('network observations', mockStore.networkObservations.length));
console.log(fmt('alerts', mockStore.alerts.length));
console.log(fmt('incidents', mockStore.incidents.length));
console.log(fmt('evidence items', mockStore.evidence.length));
console.log(fmt('baselines', mockStore.baselines.length));
console.log(fmt('baseline diffs', mockStore.baselineDiffs.length));
console.log(fmt('reports', mockStore.reports.length));
console.log(fmt('users', mockStore.users.length));
console.log(fmt('audit log entries', mockStore.audit.length));
console.log('────────────────────────────────────────');
console.log('OK');
