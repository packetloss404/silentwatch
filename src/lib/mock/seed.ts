import type {
  Alert,
  Asset,
  AssetType,
  AuditLogEntry,
  Baseline,
  BaselineDiff,
  EvidenceItem,
  ID,
  Incident,
  NetworkObservation,
  OccupancyEvent,
  PatternFinding,
  Report,
  SignalBand,
  SignalDensityPoint,
  SignalObservation,
  Site,
  Tag,
  TimePoint,
  User,
  VehicleClass,
  VehicleObservation,
  WatchlistEntry,
  Zone,
} from '@/lib/types';
import { chance, floatBetween, intBetween, mulberry32, pickFrom } from '@/lib/rand';

// ────────────────────────────────────────────────────────────────────
// Site geometry — fictional private campus near 47.6178, -122.1944
// (a placeholder; this is mock data only).
// ────────────────────────────────────────────────────────────────────

const SITE_CENTER: [number, number] = [-122.1944, 47.6178];

function offset(center: [number, number], dx: number, dy: number): [number, number] {
  // ~111km per degree; scale to small offsets at this latitude
  return [center[0] + dx * 0.0009, center[1] + dy * 0.00065];
}

const site: Site = {
  id: 'site_north_yard',
  name: 'North Yard',
  description: 'Private operations campus — primary site',
  center: SITE_CENTER,
  bounds: [offset(SITE_CENTER, -1.4, -1.0), offset(SITE_CENTER, 1.4, 1.0)],
  timezone: 'America/Los_Angeles',
};

// ────────────────────────────────────────────────────────────────────
// Zones (fictional polygons sketched around the site center)
// ────────────────────────────────────────────────────────────────────

const zones: Zone[] = [
  {
    id: 'z_perimeter_n',
    siteId: site.id,
    name: 'North Perimeter',
    kind: 'perimeter',
    polygon: [
      offset(SITE_CENTER, -1.2, 0.4),
      offset(SITE_CENTER, 1.2, 0.4),
      offset(SITE_CENTER, 1.2, 0.9),
      offset(SITE_CENTER, -1.2, 0.9),
    ],
  },
  {
    id: 'z_perimeter_s',
    siteId: site.id,
    name: 'South Perimeter',
    kind: 'perimeter',
    polygon: [
      offset(SITE_CENTER, -1.2, -0.9),
      offset(SITE_CENTER, 1.2, -0.9),
      offset(SITE_CENTER, 1.2, -0.4),
      offset(SITE_CENTER, -1.2, -0.4),
    ],
  },
  {
    id: 'z_main_yard',
    siteId: site.id,
    name: 'Main Yard',
    kind: 'interior',
    polygon: [
      offset(SITE_CENTER, -0.6, -0.2),
      offset(SITE_CENTER, 0.6, -0.2),
      offset(SITE_CENTER, 0.6, 0.2),
      offset(SITE_CENTER, -0.6, 0.2),
    ],
  },
  {
    id: 'z_ops_building',
    siteId: site.id,
    name: 'Operations Building',
    kind: 'restricted',
    polygon: [
      offset(SITE_CENTER, -0.25, -0.05),
      offset(SITE_CENTER, 0.05, -0.05),
      offset(SITE_CENTER, 0.05, 0.15),
      offset(SITE_CENTER, -0.25, 0.15),
    ],
    notes: 'Server room and SCIF. Card-access only.',
  },
  {
    id: 'z_visitor_lot',
    siteId: site.id,
    name: 'Visitor Parking',
    kind: 'parking',
    polygon: [
      offset(SITE_CENTER, 0.6, -0.35),
      offset(SITE_CENTER, 1.1, -0.35),
      offset(SITE_CENTER, 1.1, 0.0),
      offset(SITE_CENTER, 0.6, 0.0),
    ],
  },
  {
    id: 'z_utility',
    siteId: site.id,
    name: 'Utility Yard',
    kind: 'utility',
    polygon: [
      offset(SITE_CENTER, -1.1, -0.35),
      offset(SITE_CENTER, -0.6, -0.35),
      offset(SITE_CENTER, -0.6, 0.05),
      offset(SITE_CENTER, -1.1, 0.05),
    ],
  },
];

// ────────────────────────────────────────────────────────────────────
// Assets (cameras, sensors, APs, gateways, doors, vehicles)
// ────────────────────────────────────────────────────────────────────

const ASSET_VENDORS: Record<AssetType, string[]> = {
  camera: ['Axis', 'Hanwha', 'Bosch'],
  'lpr-camera': ['Genetec', 'Vigilant', 'Hanwha'],
  'ir-camera': ['FLIR', 'Hanwha', 'Axis'],
  'occupancy-counter': ['XOVIS', 'Density', 'Vivotek'],
  sensor: ['HoneyVue', 'Senstar', 'Detec'],
  'access-point': ['Ubiquiti', 'Aruba', 'Cisco Meraki'],
  gateway: ['MikroTik', 'pfSense', 'Juniper'],
  switch: ['Cisco', 'Arista', 'Ubiquiti'],
  'door-controller': ['Mercury', 'HID', 'Genetec'],
  vehicle: ['Fleet'],
  building: ['Civil'],
  entrance: ['Civil'],
  beacon: ['Estimote', 'Kontakt.io'],
};

function buildAssets(): Asset[] {
  const r = mulberry32(11);
  const list: Asset[] = [];

  function add(partial: Omit<Asset, 'id' | 'siteId' | 'lastSeen' | 'installedAt'> & { id?: string }) {
    const id = partial.id ?? `a_${list.length + 1}_${Math.floor(r() * 9999).toString(36)}`;
    list.push({
      siteId: site.id,
      installedAt: new Date(Date.now() - intBetween(r, 90, 1200) * 86400000).toISOString(),
      lastSeen: new Date(Date.now() - intBetween(r, 0, 600) * 1000).toISOString(),
      ...partial,
      id,
    });
  }

  // perimeter cameras
  add({
    name: 'CAM-N01',
    type: 'camera',
    status: 'online',
    position: offset(SITE_CENTER, -1.0, 0.6),
    headingDeg: 200,
    fovDeg: 78,
    rangeM: 60,
    zoneId: 'z_perimeter_n',
    vendor: 'Axis',
    model: 'P3267-LV',
    owner: 'Security Ops',
    tags: ['perimeter', 'fixed'],
  });
  add({
    name: 'CAM-N02',
    type: 'camera',
    status: 'online',
    position: offset(SITE_CENTER, 0.0, 0.65),
    headingDeg: 180,
    fovDeg: 90,
    rangeM: 70,
    zoneId: 'z_perimeter_n',
    vendor: 'Axis',
    model: 'P3267-LV',
    owner: 'Security Ops',
    tags: ['perimeter'],
  });
  add({
    name: 'CAM-N03',
    type: 'camera',
    status: 'degraded',
    position: offset(SITE_CENTER, 1.0, 0.6),
    headingDeg: 220,
    fovDeg: 78,
    rangeM: 60,
    zoneId: 'z_perimeter_n',
    vendor: 'Hanwha',
    model: 'PNV-A9081R',
    owner: 'Security Ops',
    tags: ['perimeter'],
    notes: 'IR illuminator intermittent — ticket SO-1142.',
  });
  add({
    name: 'CAM-S01',
    type: 'camera',
    status: 'online',
    position: offset(SITE_CENTER, -1.0, -0.6),
    headingDeg: 20,
    fovDeg: 78,
    rangeM: 60,
    zoneId: 'z_perimeter_s',
    vendor: 'Axis',
  });
  add({
    name: 'CAM-S02',
    type: 'camera',
    status: 'online',
    position: offset(SITE_CENTER, 1.0, -0.6),
    headingDeg: 340,
    fovDeg: 78,
    rangeM: 60,
    zoneId: 'z_perimeter_s',
    vendor: 'Axis',
  });
  add({
    name: 'CAM-DOOR-01',
    type: 'camera',
    status: 'online',
    position: offset(SITE_CENTER, -0.1, -0.04),
    headingDeg: 90,
    fovDeg: 60,
    rangeM: 25,
    zoneId: 'z_ops_building',
    vendor: 'Bosch',
  });
  add({
    name: 'CAM-LOT-01',
    type: 'camera',
    status: 'online',
    position: offset(SITE_CENTER, 0.85, -0.18),
    headingDeg: 270,
    fovDeg: 90,
    rangeM: 80,
    zoneId: 'z_visitor_lot',
    vendor: 'Hanwha',
    capabilities: ['low-light', 'occupancy'],
  });

  // LPR cameras (license plate readers — operator-owned, edge-processed)
  add({
    name: 'LPR-GATE-IN',
    type: 'lpr-camera',
    status: 'online',
    position: offset(SITE_CENTER, 1.13, -0.21),
    headingDeg: 270,
    fovDeg: 36,
    rangeM: 30,
    zoneId: 'z_visitor_lot',
    vendor: 'Genetec',
    model: 'AutoVu SharpV',
    owner: 'Security Ops',
    capabilities: ['lpr'],
    tags: ['lpr', 'inbound'],
    notes: 'Captures arriving plates at main gate. On-device OCR; no plate-to-owner lookups.',
  });
  add({
    name: 'LPR-GATE-OUT',
    type: 'lpr-camera',
    status: 'online',
    position: offset(SITE_CENTER, 1.17, -0.18),
    headingDeg: 90,
    fovDeg: 36,
    rangeM: 30,
    zoneId: 'z_visitor_lot',
    vendor: 'Genetec',
    model: 'AutoVu SharpV',
    owner: 'Security Ops',
    capabilities: ['lpr'],
    tags: ['lpr', 'outbound'],
  });
  add({
    name: 'LPR-STREET-N',
    type: 'lpr-camera',
    status: 'online',
    position: offset(SITE_CENTER, 0.0, 0.85),
    headingDeg: 0,
    fovDeg: 28,
    rangeM: 45,
    zoneId: 'z_perimeter_n',
    vendor: 'Genetec',
    model: 'AutoVu SharpZ3',
    owner: 'Security Ops',
    capabilities: ['lpr', 'low-light'],
    tags: ['lpr', 'street-facing'],
    notes: 'Captures plates passing on the public street adjoining the property.',
  });

  // IR / thermal cameras (perimeter, no visible illumination)
  add({
    name: 'IR-PERIM-N',
    type: 'ir-camera',
    status: 'online',
    position: offset(SITE_CENTER, -0.5, 0.7),
    headingDeg: 200,
    fovDeg: 60,
    rangeM: 90,
    zoneId: 'z_perimeter_n',
    vendor: 'FLIR',
    model: 'FH-Series',
    capabilities: ['thermal', 'low-light', 'motion'],
    tags: ['perimeter', 'thermal'],
  });
  add({
    name: 'IR-PERIM-S',
    type: 'ir-camera',
    status: 'online',
    position: offset(SITE_CENTER, 0.5, -0.7),
    headingDeg: 20,
    fovDeg: 60,
    rangeM: 90,
    zoneId: 'z_perimeter_s',
    vendor: 'FLIR',
    model: 'FH-Series',
    capabilities: ['thermal', 'low-light', 'motion'],
    tags: ['perimeter', 'thermal'],
  });
  add({
    name: 'IR-UTIL-01',
    type: 'ir-camera',
    status: 'degraded',
    position: offset(SITE_CENTER, -0.95, -0.1),
    headingDeg: 90,
    fovDeg: 50,
    rangeM: 60,
    zoneId: 'z_utility',
    vendor: 'Hanwha',
    capabilities: ['thermal', 'motion'],
    tags: ['utility', 'thermal'],
    notes: 'Thermal dynamic range alarm — service ticket SO-1149.',
  });

  // Anonymous occupancy counters (edge-analytics, count-only)
  add({
    name: 'OCC-OPS-LOBBY',
    type: 'occupancy-counter',
    status: 'online',
    position: offset(SITE_CENTER, -0.12, 0.02),
    rangeM: 8,
    zoneId: 'z_ops_building',
    vendor: 'XOVIS',
    model: 'PC2',
    capabilities: ['occupancy'],
    tags: ['count-only'],
    notes: 'Returns aggregate person counts only — no images stored.',
  });
  add({
    name: 'OCC-MAIN-YARD',
    type: 'occupancy-counter',
    status: 'online',
    position: offset(SITE_CENTER, 0.0, 0.05),
    rangeM: 25,
    zoneId: 'z_main_yard',
    vendor: 'XOVIS',
    model: 'PC2',
    capabilities: ['occupancy'],
    tags: ['count-only'],
  });

  // sensors
  add({
    name: 'PIR-N-01',
    type: 'sensor',
    status: 'online',
    position: offset(SITE_CENTER, -0.5, 0.5),
    rangeM: 25,
    zoneId: 'z_perimeter_n',
    vendor: 'Detec',
    tags: ['motion'],
  });
  add({
    name: 'PIR-N-02',
    type: 'sensor',
    status: 'online',
    position: offset(SITE_CENTER, 0.5, 0.5),
    rangeM: 25,
    zoneId: 'z_perimeter_n',
    vendor: 'Detec',
  });
  add({
    name: 'PIR-S-01',
    type: 'sensor',
    status: 'offline',
    position: offset(SITE_CENTER, -0.4, -0.55),
    rangeM: 25,
    zoneId: 'z_perimeter_s',
    vendor: 'Detec',
    notes: 'Offline since maintenance window 04/14.',
  });
  add({
    name: 'CONTACT-DR-01',
    type: 'sensor',
    status: 'online',
    position: offset(SITE_CENTER, -0.2, 0.0),
    rangeM: 1,
    zoneId: 'z_ops_building',
    vendor: 'HoneyVue',
    tags: ['door-contact'],
  });

  // APs
  add({
    name: 'AP-OPS-01',
    type: 'access-point',
    status: 'online',
    position: offset(SITE_CENTER, -0.15, 0.05),
    rangeM: 35,
    zoneId: 'z_ops_building',
    vendor: 'Ubiquiti',
    model: 'U6-Pro',
    tags: ['wifi', 'corp'],
  });
  add({
    name: 'AP-OPS-02',
    type: 'access-point',
    status: 'online',
    position: offset(SITE_CENTER, -0.05, 0.1),
    rangeM: 35,
    zoneId: 'z_ops_building',
    vendor: 'Ubiquiti',
    model: 'U6-Pro',
  });
  add({
    name: 'AP-YARD-01',
    type: 'access-point',
    status: 'online',
    position: offset(SITE_CENTER, 0.0, 0.0),
    rangeM: 70,
    zoneId: 'z_main_yard',
    vendor: 'Aruba',
    model: 'AP-635',
    tags: ['wifi', 'site'],
  });
  add({
    name: 'AP-LOT-01',
    type: 'access-point',
    status: 'online',
    position: offset(SITE_CENTER, 0.85, -0.18),
    rangeM: 50,
    zoneId: 'z_visitor_lot',
    vendor: 'Aruba',
    model: 'AP-635',
    tags: ['wifi', 'guest'],
  });

  // gateways / switches
  add({
    name: 'GW-CORE',
    type: 'gateway',
    status: 'online',
    position: offset(SITE_CENTER, -0.18, 0.06),
    zoneId: 'z_ops_building',
    vendor: 'pfSense',
  });
  add({
    name: 'SW-OPS-01',
    type: 'switch',
    status: 'online',
    position: offset(SITE_CENTER, -0.18, 0.04),
    zoneId: 'z_ops_building',
    vendor: 'Arista',
    model: '7050X3',
  });

  // door controllers
  add({
    name: 'DOOR-OPS-MAIN',
    type: 'door-controller',
    status: 'online',
    position: offset(SITE_CENTER, -0.1, -0.03),
    zoneId: 'z_ops_building',
    vendor: 'Mercury',
  });
  add({
    name: 'DOOR-UTIL-01',
    type: 'door-controller',
    status: 'online',
    position: offset(SITE_CENTER, -0.85, -0.15),
    zoneId: 'z_utility',
    vendor: 'Mercury',
  });

  // vehicle, entrance, building markers
  add({
    name: 'VEH-PATROL-01',
    type: 'vehicle',
    status: 'online',
    position: offset(SITE_CENTER, 0.4, -0.1),
    vendor: 'Fleet',
    tags: ['patrol'],
  });
  add({
    name: 'GATE-MAIN',
    type: 'entrance',
    status: 'online',
    position: offset(SITE_CENTER, 1.15, -0.2),
    zoneId: 'z_visitor_lot',
  });
  add({
    name: 'BLD-OPS',
    type: 'building',
    status: 'online',
    position: offset(SITE_CENTER, -0.1, 0.05),
    zoneId: 'z_ops_building',
  });

  // beacons
  add({
    name: 'BEACON-OPS-A',
    type: 'beacon',
    status: 'online',
    position: offset(SITE_CENTER, -0.18, 0.03),
    zoneId: 'z_ops_building',
    vendor: 'Estimote',
  });

  return list;
}

const assets = buildAssets();

// ────────────────────────────────────────────────────────────────────
// Signals — observed Wi-Fi / BT / BLE inventory
// ────────────────────────────────────────────────────────────────────

const SSIDS_KNOWN = ['NorthYard-Corp', 'NorthYard-Guest', 'NorthYard-IoT', 'NorthYard-Mgmt'];
const SSIDS_AMBIENT = [
  'xfinitywifi',
  'ATT-WIFI-3329',
  'NETGEAR62',
  'CenturyLink-bF82',
  'Linksys02841',
  'Spectrum-Mobile',
  'HOME-A1B2',
  '<hidden>',
];
const PERIPHERALS = [
  'JBL Flip 6',
  'AirPods Pro',
  'Galaxy Buds',
  'Bose QC45',
  'Logitech MX',
  'Tile Slim',
  'Garmin fēnix',
  'Fitbit Charge',
];
const VENDOR_HINTS = ['Apple Inc.', 'Samsung', 'Espressif', 'Texas Inst.', 'Murata', 'Liteon', 'Intel'];

function buildSignals(): SignalObservation[] {
  const r = mulberry32(207);
  const list: SignalObservation[] = [];
  const now = Date.now();

  function makeHistory(): number[] {
    const out: number[] = [];
    let v = intBetween(r, 1, 4);
    for (let i = 0; i < 24; i++) {
      v = Math.max(0, Math.min(40, v + intBetween(r, -2, 3)));
      out.push(v);
    }
    return out;
  }

  // Known infra (matches our APs)
  for (const ssid of SSIDS_KNOWN) {
    list.push({
      id: `s_known_${ssid}`,
      siteId: site.id,
      alias: ssid,
      identifier: `9c:1c:12:··:··:${(intBetween(r, 16, 255)).toString(16)}`,
      band: pickFrom(r, ['wifi-5', 'wifi-6'] as const),
      type: 'access-point',
      vendorHint: 'Ubiquiti',
      classification: 'known',
      rssi: intBetween(r, -65, -38),
      channel: pickFrom(r, [36, 44, 100, 149, 157]),
      firstSeen: new Date(now - intBetween(r, 30, 360) * 86400000).toISOString(),
      lastSeen: new Date(now - intBetween(r, 0, 60) * 1000).toISOString(),
      count: intBetween(r, 800, 9000),
      trend: floatBetween(r, -0.1, 0.1),
      anomalyScore: intBetween(r, 0, 8),
      tags: ['infra'],
      history: makeHistory(),
    });
  }

  // Ambient APs (neighbors, expected unknowns)
  for (const ssid of SSIDS_AMBIENT) {
    list.push({
      id: `s_amb_${ssid}_${list.length}`,
      siteId: site.id,
      alias: ssid,
      identifier: `${(intBetween(r, 0, 255)).toString(16).padStart(2, '0')}:${(intBetween(r, 0, 255)).toString(16).padStart(2, '0')}:··:··:··:${(intBetween(r, 0, 255)).toString(16).padStart(2, '0')}`,
      band: pickFrom(r, ['wifi-2.4', 'wifi-5'] as const),
      type: 'access-point',
      vendorHint: pickFrom(r, VENDOR_HINTS),
      classification: chance(r, 0.85) ? 'unknown' : 'ignored',
      rssi: intBetween(r, -92, -68),
      channel: pickFrom(r, [1, 6, 11, 36, 149]),
      firstSeen: new Date(now - intBetween(r, 5, 200) * 86400000).toISOString(),
      lastSeen: new Date(now - intBetween(r, 30, 3600) * 1000).toISOString(),
      count: intBetween(r, 12, 600),
      trend: floatBetween(r, -0.4, 0.4),
      anomalyScore: intBetween(r, 0, 35),
      history: makeHistory(),
    });
  }

  // Bluetooth peripherals (expected staff devices)
  for (let i = 0; i < 18; i++) {
    const name = pickFrom(r, PERIPHERALS);
    list.push({
      id: `s_bt_${i}`,
      siteId: site.id,
      alias: `${name}`,
      identifier: `aa:bb:··:··:··:${(intBetween(r, 16, 255)).toString(16)}`,
      band: chance(r, 0.7) ? 'ble' : 'bluetooth',
      type: 'peripheral',
      vendorHint: pickFrom(r, VENDOR_HINTS),
      classification: chance(r, 0.6) ? 'known' : 'unknown',
      rssi: intBetween(r, -88, -55),
      firstSeen: new Date(now - intBetween(r, 1, 90) * 86400000).toISOString(),
      lastSeen: new Date(now - intBetween(r, 0, 600) * 1000).toISOString(),
      count: intBetween(r, 5, 400),
      trend: floatBetween(r, -0.3, 0.3),
      anomalyScore: intBetween(r, 0, 25),
      history: makeHistory(),
    });
  }

  // Suspicious / new-this-week
  list.push({
    id: 's_susp_1',
    siteId: site.id,
    alias: 'NorthYard-Corp_5G',
    identifier: '00:13:37:··:··:af',
    band: 'wifi-5',
    type: 'access-point',
    vendorHint: 'TP-Link',
    classification: 'suspicious',
    rssi: -71,
    channel: 36,
    firstSeen: new Date(now - 4 * 86400000).toISOString(),
    lastSeen: new Date(now - 120 * 1000).toISOString(),
    count: 412,
    trend: 0.62,
    anomalyScore: 84,
    tags: ['ssid-similarity', 'rogue-candidate'],
    notes: 'SSID resembles corporate network but BSSID is not in inventory. Candidate evil-twin AP.',
    history: makeHistory(),
  });
  list.push({
    id: 's_susp_2',
    siteId: site.id,
    alias: '<hidden>',
    identifier: '5e:88:4a:··:··:11',
    band: 'wifi-2.4',
    type: 'access-point',
    vendorHint: 'Espressif',
    classification: 'suspicious',
    rssi: -78,
    channel: 11,
    firstSeen: new Date(now - 2 * 86400000).toISOString(),
    lastSeen: new Date(now - 90 * 1000).toISOString(),
    count: 288,
    trend: 0.45,
    anomalyScore: 71,
    tags: ['hidden-ssid', 'esp32'],
    notes: 'Hidden SSID on a low-power module. Persistent inside Operations Building footprint.',
    history: makeHistory(),
  });
  list.push({
    id: 's_susp_3',
    siteId: site.id,
    alias: 'Tile Slim',
    identifier: '10:42:1c:··:··:7e',
    band: 'ble',
    type: 'beacon',
    vendorHint: 'Tile',
    classification: 'unknown',
    rssi: -82,
    firstSeen: new Date(now - 36 * 3600000).toISOString(),
    lastSeen: new Date(now - 30 * 1000).toISOString(),
    count: 96,
    trend: 0.31,
    anomalyScore: 58,
    tags: ['tracker'],
    notes: 'Persistent BLE tracker observed in visitor parking. No matching staff device.',
    history: makeHistory(),
  });

  return list;
}

const signals = buildSignals();

// ────────────────────────────────────────────────────────────────────
// Network observations (assets the network team has authorized us to inventory)
// ────────────────────────────────────────────────────────────────────

const networkObservations: NetworkObservation[] = [
  {
    id: 'n_1',
    siteId: site.id,
    hostname: 'ops-fileserver-01',
    ipMasked: '10.20.0.··',
    macMasked: 'b8:27:eb:··:··:14',
    vendorHint: 'Raspberry Pi',
    subnet: '10.20.0.0/24',
    firstSeen: '2025-09-12T11:32:00Z',
    lastSeen: new Date().toISOString(),
    classification: 'known',
    openPorts: [22, 445, 3128],
  },
  {
    id: 'n_2',
    siteId: site.id,
    hostname: 'cam-axis-cluster-n',
    ipMasked: '10.20.10.··',
    macMasked: '00:40:8c:··:··:21',
    vendorHint: 'Axis Comm.',
    subnet: '10.20.10.0/24',
    firstSeen: '2025-08-04T08:12:00Z',
    lastSeen: new Date().toISOString(),
    classification: 'known',
    openPorts: [80, 443, 554],
  },
  {
    id: 'n_3',
    siteId: site.id,
    hostname: 'unknown-iot-44',
    ipMasked: '10.20.40.··',
    macMasked: '24:0a:c4:··:··:9b',
    vendorHint: 'Espressif',
    subnet: '10.20.40.0/24',
    firstSeen: new Date(Date.now() - 36 * 3600000).toISOString(),
    lastSeen: new Date(Date.now() - 60 * 1000).toISOString(),
    classification: 'suspicious',
    openPorts: [80, 1883],
    notes: 'Unmanaged ESP32 device found bridged onto IoT VLAN. Pending owner identification.',
  },
  {
    id: 'n_4',
    siteId: site.id,
    hostname: 'ops-printer-01',
    ipMasked: '10.20.0.··',
    macMasked: '00:1b:a9:··:··:55',
    vendorHint: 'Brother',
    subnet: '10.20.0.0/24',
    firstSeen: '2024-11-22T17:00:00Z',
    lastSeen: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    classification: 'known',
    openPorts: [9100, 631],
  },
  {
    id: 'n_5',
    siteId: site.id,
    hostname: 'guest-vlan-leak',
    ipMasked: '10.99.7.··',
    macMasked: 'f4:5c:89:··:··:0a',
    vendorHint: 'Apple',
    subnet: '10.99.0.0/16',
    firstSeen: new Date(Date.now() - 4 * 3600000).toISOString(),
    lastSeen: new Date().toISOString(),
    classification: 'unknown',
    openPorts: [],
    notes: 'Device on guest VLAN attempting mDNS lookups for corporate hostnames.',
  },
];

// ────────────────────────────────────────────────────────────────────
// Alerts
// ────────────────────────────────────────────────────────────────────

const alerts: Alert[] = [
  {
    id: 'al_1',
    siteId: site.id,
    title: 'Possible evil-twin AP near Operations Building',
    detail: 'SSID "NorthYard-Corp_5G" advertised by an unmanaged BSSID. Persistent over 4 days, rising signal strength.',
    severity: 'high',
    source: 'signal',
    acknowledged: false,
    signalId: 's_susp_1',
    zoneId: 'z_ops_building',
    createdAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    position: offset(SITE_CENTER, -0.18, 0.08),
  },
  {
    id: 'al_2',
    siteId: site.id,
    title: 'Hidden 2.4GHz beacon inside restricted zone',
    detail: 'ESP32-class radio observed broadcasting from inside Operations Building. No matching asset.',
    severity: 'critical',
    source: 'signal',
    acknowledged: false,
    signalId: 's_susp_2',
    zoneId: 'z_ops_building',
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    position: offset(SITE_CENTER, -0.12, 0.07),
  },
  {
    id: 'al_3',
    siteId: site.id,
    title: 'Persistent BLE tracker in visitor lot',
    detail: 'A Tile-class BLE tracker with no matching staff device has been observed for 36+ hours.',
    severity: 'medium',
    source: 'signal',
    acknowledged: true,
    signalId: 's_susp_3',
    zoneId: 'z_visitor_lot',
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    position: offset(SITE_CENTER, 0.85, -0.18),
  },
  {
    id: 'al_4',
    siteId: site.id,
    title: 'PIR-S-01 offline',
    detail: 'South perimeter motion sensor unreachable since maintenance window.',
    severity: 'medium',
    source: 'sensor',
    acknowledged: true,
    assetId: assets.find((a) => a.name === 'PIR-S-01')?.id,
    zoneId: 'z_perimeter_s',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'al_5',
    siteId: site.id,
    title: 'Unmanaged device on IoT VLAN',
    detail: 'ESP32 bridged onto 10.20.40.0/24 with no owner.',
    severity: 'high',
    source: 'network',
    acknowledged: false,
    createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
  },
  {
    id: 'al_6',
    siteId: site.id,
    title: 'CAM-N03 IR illuminator degraded',
    detail: 'Camera reports infrared sub-system in fault state.',
    severity: 'low',
    source: 'camera',
    acknowledged: true,
    assetId: assets.find((a) => a.name === 'CAM-N03')?.id,
    zoneId: 'z_perimeter_n',
    createdAt: new Date(Date.now() - 14 * 3600000).toISOString(),
  },
  {
    id: 'al_7',
    siteId: site.id,
    title: 'Guest VLAN device probing corporate names',
    detail: 'mDNS queries for ops-fileserver-01 originating on guest VLAN.',
    severity: 'medium',
    source: 'network',
    acknowledged: false,
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'al_8',
    siteId: site.id,
    title: 'Baseline drift: 6 new devices since last snapshot',
    detail: 'Active baseline "Q1-2026" shows 6 new entries outside expected churn band.',
    severity: 'low',
    source: 'baseline',
    acknowledged: false,
    createdAt: new Date(Date.now() - 9 * 3600000).toISOString(),
  },
  {
    id: 'al_9',
    siteId: site.id,
    title: 'Door propped: DOOR-OPS-MAIN',
    detail: 'Operations main door reported open >120s during business hours.',
    severity: 'low',
    source: 'sensor',
    acknowledged: true,
    assetId: assets.find((a) => a.name === 'DOOR-OPS-MAIN')?.id,
    zoneId: 'z_ops_building',
    createdAt: new Date(Date.now() - 26 * 3600000).toISOString(),
  },
  {
    id: 'al_10',
    siteId: site.id,
    title: 'Operator note acknowledged',
    detail: 'Operator marked CAM-N03 advisory as accepted for current shift.',
    severity: 'info',
    source: 'operator',
    acknowledged: true,
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
];

// ────────────────────────────────────────────────────────────────────
// Incidents
// ────────────────────────────────────────────────────────────────────

const incidents: Incident[] = [
  {
    id: 'inc_001',
    siteId: site.id,
    title: 'Possible evil-twin AP — Operations',
    summary:
      'Suspicious AP advertising an SSID that mimics our corporate network. Persistent for several days inside the Operations Building footprint. Investigating.',
    severity: 'high',
    status: 'investigating',
    assignee: 'u_2',
    openedAt: new Date(Date.now() - 26 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    alertIds: ['al_1', 'al_2'],
    evidenceIds: ['ev_001', 'ev_002', 'ev_003'],
    zoneIds: ['z_ops_building'],
    tags: ['rf', 'rogue-ap'],
  },
  {
    id: 'inc_002',
    siteId: site.id,
    title: 'Unknown ESP32 on IoT VLAN',
    summary:
      'Unmanaged microcontroller bridged onto IoT subnet with no documented owner. Possible bring-your-own device left behind by contractor.',
    severity: 'medium',
    status: 'open',
    assignee: 'u_3',
    openedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    alertIds: ['al_5'],
    evidenceIds: ['ev_004'],
    zoneIds: ['z_ops_building'],
    tags: ['network', 'iot'],
  },
  {
    id: 'inc_003',
    siteId: site.id,
    title: 'Persistent BLE tracker — visitor parking',
    summary: 'BLE tracker (Tile-class) present 36+ hours in visitor lot. Could be a forgotten device — pending physical sweep.',
    severity: 'low',
    status: 'investigating',
    assignee: 'u_4',
    openedAt: new Date(Date.now() - 30 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    alertIds: ['al_3'],
    evidenceIds: ['ev_005'],
    zoneIds: ['z_visitor_lot'],
    tags: ['ble', 'sweep'],
  },
  {
    id: 'inc_004',
    siteId: site.id,
    title: 'CAM-N03 IR module fault',
    summary: 'Perimeter camera reports degraded infrared sub-system. Vendor RMA opened.',
    severity: 'low',
    status: 'contained',
    assignee: 'u_2',
    openedAt: new Date(Date.now() - 36 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    alertIds: ['al_6'],
    evidenceIds: [],
    zoneIds: ['z_perimeter_n'],
    tags: ['camera', 'maintenance'],
  },
  {
    id: 'inc_005',
    siteId: site.id,
    title: 'Door propped — Operations main',
    summary: 'Operations main door reported propped during yesterday afternoon. Reviewed CCTV — staff carrying equipment.',
    severity: 'low',
    status: 'resolved',
    assignee: 'u_2',
    openedAt: new Date(Date.now() - 28 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 27 * 3600000).toISOString(),
    closedAt: new Date(Date.now() - 27 * 3600000).toISOString(),
    alertIds: ['al_9'],
    evidenceIds: [],
    zoneIds: ['z_ops_building'],
    tags: ['access', 'review'],
  },
];

const evidence: EvidenceItem[] = [
  {
    id: 'ev_001',
    incidentId: 'inc_001',
    kind: 'signal-log',
    title: 'BSSID 00:13:37:··:··:af — 7d signal trend',
    capturedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    capturedBy: 'u_2',
    body: 'Trend rising, RSSI -86 → -71 over 4 days. Channel 36, security WPA2-PSK.',
  },
  {
    id: 'ev_002',
    incidentId: 'inc_001',
    kind: 'note',
    title: 'Beacon framing analysis',
    capturedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    capturedBy: 'u_2',
    body: 'Beacon interval and capability bits differ from corporate APs (Ubiquiti). Likely consumer-grade radio.',
  },
  {
    id: 'ev_003',
    incidentId: 'inc_001',
    kind: 'map-pin',
    title: 'Estimated origin pin',
    capturedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    capturedBy: 'u_2',
    position: offset(SITE_CENTER, -0.16, 0.07),
  },
  {
    id: 'ev_004',
    incidentId: 'inc_002',
    kind: 'sensor-log',
    title: 'DHCP lease record',
    capturedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    capturedBy: 'u_3',
    body: 'Device requested lease at 03:11 UTC. Hostname "esp32-xx". No 802.1X auth.',
  },
  {
    id: 'ev_005',
    incidentId: 'inc_003',
    kind: 'note',
    title: 'Initial BLE sweep result',
    capturedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    capturedBy: 'u_4',
    body: 'Tracker localized to north-west corner of visitor lot. Awaiting physical sweep next shift.',
  },
];

// ────────────────────────────────────────────────────────────────────
// Baselines & drift
// ────────────────────────────────────────────────────────────────────

const baselines: Baseline[] = [
  {
    id: 'bl_q1',
    siteId: site.id,
    name: 'Q1-2026',
    description: 'Approved environment snapshot taken at start of Q1.',
    createdAt: '2026-01-04T17:00:00Z',
    signalCount: 142,
    networkCount: 38,
    assetCount: 24,
    active: true,
  },
  {
    id: 'bl_q4',
    siteId: site.id,
    name: 'Q4-2025',
    description: 'Previous quarterly snapshot.',
    createdAt: '2025-10-02T16:30:00Z',
    signalCount: 137,
    networkCount: 36,
    assetCount: 23,
    active: false,
  },
];

const baselineDiffs: BaselineDiff[] = [
  {
    id: 'd_1',
    baselineId: 'bl_q1',
    kind: 'rogue-access-point',
    severity: 'high',
    subject: 'NorthYard-Corp_5G (00:13:37:··:··:af)',
    detail: 'Access point not present in baseline; SSID closely resembles corporate network.',
    remediation:
      'Locate emitter; if not authorized, take offline. File incident, rotate corp PSK if user data exposure suspected.',
    detectedAt: new Date(Date.now() - 26 * 3600000).toISOString(),
    resolved: false,
  },
  {
    id: 'd_2',
    baselineId: 'bl_q1',
    kind: 'unknown-network-device',
    severity: 'medium',
    subject: 'unknown-iot-44 (10.20.40.··)',
    detail: 'New device on IoT VLAN with no inventory entry.',
    remediation: 'Identify owner, add to inventory or remove from network. Verify VLAN segmentation policy.',
    detectedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    resolved: false,
  },
  {
    id: 'd_3',
    baselineId: 'bl_q1',
    kind: 'unusual-bluetooth',
    severity: 'low',
    subject: 'Tile Slim — visitor lot',
    detail: 'Persistent BLE tracker that was not in baseline.',
    remediation: 'Sweep parking area; document or escort device off premises.',
    detectedAt: new Date(Date.now() - 30 * 3600000).toISOString(),
    resolved: false,
  },
  {
    id: 'd_4',
    baselineId: 'bl_q1',
    kind: 'misconfigured-camera',
    severity: 'low',
    subject: 'CAM-N03',
    detail: 'IR illuminator reports fault; camera was healthy at baseline capture.',
    remediation: 'Hardware RMA in progress (ticket SO-1142).',
    detectedAt: new Date(Date.now() - 36 * 3600000).toISOString(),
    resolved: false,
  },
  {
    id: 'd_5',
    baselineId: 'bl_q1',
    kind: 'exposed-service',
    severity: 'medium',
    subject: 'ops-fileserver-01:3128',
    detail: 'Caching proxy port reachable from broader IoT VLAN — was firewalled at baseline.',
    remediation: 'Restore firewall rule; review change history on perimeter ACL.',
    detectedAt: new Date(Date.now() - 11 * 3600000).toISOString(),
    resolved: false,
  },
  {
    id: 'd_6',
    baselineId: 'bl_q1',
    kind: 'asset-relocated',
    severity: 'info',
    subject: 'BEACON-OPS-A',
    detail: 'Reference beacon position drifted >2m vs baseline.',
    remediation: 'Verify physical mount; recalibrate position survey.',
    detectedAt: new Date(Date.now() - 60 * 3600000).toISOString(),
    resolved: true,
  },
];

// ────────────────────────────────────────────────────────────────────
// Time-series — signal density and detection counts
// ────────────────────────────────────────────────────────────────────

function buildSignalDensity(): SignalDensityPoint[] {
  const r = mulberry32(909);
  const out: SignalDensityPoint[] = [];
  const now = Date.now();
  for (let i = 47; i >= 0; i--) {
    const t = new Date(now - i * 30 * 60 * 1000).toISOString();
    const hour = new Date(now - i * 30 * 60 * 1000).getHours();
    const dayLoad = hour >= 7 && hour <= 19 ? 1.6 : 0.7;
    out.push({
      t,
      wifi: Math.round((22 + r() * 14) * dayLoad),
      bluetooth: Math.round((6 + r() * 7) * dayLoad),
      ble: Math.round((11 + r() * 9) * dayLoad),
    });
  }
  return out;
}

function buildDetections(): TimePoint[] {
  const r = mulberry32(404);
  const out: TimePoint[] = [];
  const now = Date.now();
  for (let i = 23; i >= 0; i--) {
    const t = new Date(now - i * 3600000).toISOString();
    const hour = new Date(now - i * 3600000).getHours();
    const dayLoad = hour >= 7 && hour <= 19 ? 1.4 : 0.6;
    out.push({ t, v: Math.round((40 + r() * 30) * dayLoad) });
  }
  return out;
}

const signalDensity = buildSignalDensity();
const detections = buildDetections();

// ────────────────────────────────────────────────────────────────────
// Users / audit log / tags / reports
// ────────────────────────────────────────────────────────────────────

const users: User[] = [
  { id: 'u_1', name: 'M. Holst', email: 'mholst@northyard.local', role: 'admin', active: true, lastSeen: new Date().toISOString() },
  { id: 'u_2', name: 'J. Aoki', email: 'jaoki@northyard.local', role: 'operator', active: true, lastSeen: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: 'u_3', name: 'S. Vaughn', email: 'svaughn@northyard.local', role: 'analyst', active: true, lastSeen: new Date(Date.now() - 28 * 60000).toISOString() },
  { id: 'u_4', name: 'R. Kim', email: 'rkim@northyard.local', role: 'operator', active: true, lastSeen: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'u_5', name: 'D. Patel', email: 'dpatel@northyard.local', role: 'viewer', active: false, lastSeen: new Date(Date.now() - 14 * 86400000).toISOString() },
];

const audit: AuditLogEntry[] = [
  { id: 'log_1', actorId: 'u_2', actorName: 'J. Aoki', action: 'incident.update', target: 'inc_001', at: new Date(Date.now() - 30 * 60000).toISOString(), detail: 'Status set to investigating' },
  { id: 'log_2', actorId: 'u_2', actorName: 'J. Aoki', action: 'signal.classify', target: 's_susp_1', at: new Date(Date.now() - 50 * 60000).toISOString(), detail: 'Marked suspicious' },
  { id: 'log_3', actorId: 'u_3', actorName: 'S. Vaughn', action: 'baseline.compare', target: 'bl_q1', at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'log_4', actorId: 'u_2', actorName: 'J. Aoki', action: 'alert.ack', target: 'al_3', at: new Date(Date.now() - 6 * 3600000).toISOString() },
  { id: 'log_5', actorId: 'u_1', actorName: 'M. Holst', action: 'report.generate', target: 'rpt_exec_apr', at: new Date(Date.now() - 11 * 3600000).toISOString() },
  { id: 'log_6', actorId: 'u_4', actorName: 'R. Kim', action: 'asset.update', target: assets.find(a => a.name === 'CAM-N03')?.id ?? '', at: new Date(Date.now() - 12 * 3600000).toISOString(), detail: 'Status set to degraded' },
];

const tags: Tag[] = [
  { id: 't_perimeter', label: 'perimeter' },
  { id: 't_rf', label: 'rf' },
  { id: 't_iot', label: 'iot' },
  { id: 't_camera', label: 'camera' },
  { id: 't_baseline', label: 'baseline' },
  { id: 't_review', label: 'review' },
];

const reports: Report[] = [
  {
    id: 'rpt_exec_apr',
    siteId: site.id,
    kind: 'executive',
    title: 'April 2026 — Executive Summary',
    generatedAt: new Date(Date.now() - 11 * 3600000).toISOString(),
    generatedBy: 'u_1',
    rangeFrom: '2026-04-01T00:00:00Z',
    rangeTo: '2026-04-18T00:00:00Z',
    summary: 'Operating posture stable; one elevated incident under investigation (rogue AP candidate).',
    sizeBytes: 482000,
  },
  {
    id: 'rpt_tech_w16',
    siteId: site.id,
    kind: 'technical',
    title: 'Week 16 — Technical Detail',
    generatedAt: new Date(Date.now() - 36 * 3600000).toISOString(),
    generatedBy: 'u_3',
    rangeFrom: '2026-04-13T00:00:00Z',
    rangeTo: '2026-04-19T00:00:00Z',
    summary: 'RF, network and sensor activity report. 5 incidents (1 high, 1 medium, 3 low).',
    sizeBytes: 1840000,
  },
  {
    id: 'rpt_drift_q1',
    siteId: site.id,
    kind: 'baseline-drift',
    title: 'Baseline Drift — Q1-2026',
    generatedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    generatedBy: 'u_3',
    rangeFrom: '2026-01-04T00:00:00Z',
    rangeTo: '2026-04-18T00:00:00Z',
    summary: '6 drift findings — 1 high, 2 medium, 2 low, 1 info. 1 resolved.',
    sizeBytes: 928000,
  },
];

// ────────────────────────────────────────────────────────────────────
// Vehicle observations (LPR) and operator watchlist
// ────────────────────────────────────────────────────────────────────
//
// Plates are masked at the edge — only the first two and last two characters
// are displayed in the UI. The "hash" field is what we use to match against
// the operator's own watchlist; we never resolve plates to owners.

const VEHICLE_COLORS = ['white', 'silver', 'black', 'grey', 'blue', 'red', 'green', 'tan'];
const VEHICLE_CLASSES: VehicleClass[] = ['car', 'suv', 'truck', 'van', 'motorcycle'];

function maskPlate(plate: string): string {
  if (plate.length <= 4) return plate;
  return `${plate.slice(0, 2)}···${plate.slice(-2)}`;
}

function plateHash(plate: string): string {
  // Tiny non-cryptographic hash for mock matching — production code would
  // pre-hash at the edge with HMAC + per-site salt.
  let h = 2166136261;
  for (let i = 0; i < plate.length; i++) {
    h ^= plate.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

interface PlateSeed {
  plate: string;
  region?: string;
  color: string;
  vehicleClass: VehicleClass;
  classification: VehicleObservation['classification'];
  /** approx visits in the last 7 days */
  recent: number;
  /** preferred hour-of-day cluster, 0-23 */
  hourCluster: number;
  /** average dwell seconds at site */
  dwellSeconds?: number;
  watchlistId?: ID;
  notes?: string;
  tags?: string[];
}

const PLATE_SEEDS: PlateSeed[] = [
  // expected — match watchlist entries
  { plate: '8BFK271', region: 'US-WA', color: 'white', vehicleClass: 'truck', classification: 'expected', recent: 5, hourCluster: 9, dwellSeconds: 720, watchlistId: 'wl_ups', tags: ['delivery'] },
  { plate: 'AHR9038', region: 'US-WA', color: 'tan', vehicleClass: 'van', classification: 'expected', recent: 3, hourCluster: 14, dwellSeconds: 480, watchlistId: 'wl_fedex', tags: ['delivery'] },
  { plate: 'C7LM442', region: 'US-WA', color: 'blue', vehicleClass: 'car', classification: 'expected', recent: 12, hourCluster: 8, dwellSeconds: 32400, watchlistId: 'wl_holst', tags: ['staff'] },
  { plate: 'JKB1129', region: 'US-WA', color: 'silver', vehicleClass: 'suv', classification: 'expected', recent: 11, hourCluster: 8, dwellSeconds: 32400, watchlistId: 'wl_aoki', tags: ['staff'] },
  { plate: 'NHL8821', region: 'US-WA', color: 'black', vehicleClass: 'car', classification: 'expected', recent: 10, hourCluster: 9, dwellSeconds: 28800, watchlistId: 'wl_kim', tags: ['staff'] },

  // repeat — anonymous frequency, no watchlist match
  { plate: 'WRX5520', region: 'US-WA', color: 'grey', vehicleClass: 'truck', classification: 'repeat', recent: 8, hourCluster: 17, dwellSeconds: 90, tags: ['neighbor-vehicle'] },
  { plate: 'DEM1198', region: 'US-WA', color: 'white', vehicleClass: 'car', classification: 'repeat', recent: 7, hourCluster: 7, dwellSeconds: 60 },
  { plate: 'GRH4402', region: 'US-WA', color: 'red', vehicleClass: 'car', classification: 'repeat', recent: 6, hourCluster: 12, dwellSeconds: 120 },
  { plate: 'PWS7780', region: 'US-WA', color: 'green', vehicleClass: 'suv', classification: 'repeat', recent: 6, hourCluster: 19, dwellSeconds: 200 },

  // unknown — first observation this week
  { plate: 'KQT3061', region: 'US-WA', color: 'silver', vehicleClass: 'car', classification: 'unknown', recent: 1, hourCluster: 11, dwellSeconds: 30 },
  { plate: 'BNL2249', region: 'US-OR', color: 'black', vehicleClass: 'suv', classification: 'unknown', recent: 1, hourCluster: 13, dwellSeconds: 0 },
  { plate: 'XCV0099', color: 'white', vehicleClass: 'van', classification: 'unknown', recent: 2, hourCluster: 15, dwellSeconds: 60 },
  { plate: 'MYU8830', region: 'US-CA', color: 'red', vehicleClass: 'motorcycle', classification: 'unknown', recent: 1, hourCluster: 18, dwellSeconds: 0 },

  // flagged — operator-defined no-trespass / advisory entries
  {
    plate: 'TRS4419',
    region: 'US-WA',
    color: 'black',
    vehicleClass: 'truck',
    classification: 'flagged',
    recent: 4,
    hourCluster: 2,
    dwellSeconds: 740,
    watchlistId: 'wl_advisory_1',
    notes: 'Per neighborhood advisory — vehicle reported loitering on adjacent street.',
    tags: ['advisory', 'after-hours'],
  },
  {
    plate: 'PLR0007',
    region: 'US-WA',
    color: 'grey',
    vehicleClass: 'car',
    classification: 'flagged',
    recent: 3,
    hourCluster: 3,
    dwellSeconds: 1080,
    watchlistId: 'wl_advisory_2',
    notes: 'Recurring after-hours dwell at perimeter — operator added 2026-04-09.',
    tags: ['after-hours', 'dwell'],
  },

  // ambient passing traffic on the street
  ...Array.from({ length: 12 }).map<PlateSeed>((_, i) => ({
    plate: `Z${(100 + i).toString()}AB${i}`,
    region: 'US-WA',
    color: VEHICLE_COLORS[i % VEHICLE_COLORS.length],
    vehicleClass: VEHICLE_CLASSES[i % VEHICLE_CLASSES.length],
    classification: 'unknown',
    recent: 1,
    hourCluster: (8 + i * 2) % 24,
    dwellSeconds: 0,
    tags: ['street-passing'],
  })),
];

const watchlist: WatchlistEntry[] = [
  { id: 'wl_ups',         siteId: site.id, label: 'UPS — daily AM run',           plateMasked: maskPlate('8BFK271'),  plateHash: plateHash('8BFK271'),  action: 'expect', reason: 'Standing UPS contract',                createdBy: 'u_2', createdAt: '2025-12-04T17:00:00Z', active: true },
  { id: 'wl_fedex',       siteId: site.id, label: 'FedEx — afternoon',            plateMasked: maskPlate('AHR9038'),  plateHash: plateHash('AHR9038'),  action: 'expect', reason: 'Daily afternoon FedEx pickup',          createdBy: 'u_2', createdAt: '2025-12-04T17:05:00Z', active: true },
  { id: 'wl_holst',       siteId: site.id, label: 'M. Holst — staff vehicle',      plateMasked: maskPlate('C7LM442'),  plateHash: plateHash('C7LM442'),  action: 'expect', reason: 'Operator personal vehicle',             createdBy: 'u_1', createdAt: '2025-09-12T14:00:00Z', active: true },
  { id: 'wl_aoki',        siteId: site.id, label: 'J. Aoki — staff vehicle',       plateMasked: maskPlate('JKB1129'),  plateHash: plateHash('JKB1129'),  action: 'expect', reason: 'Operator personal vehicle',             createdBy: 'u_1', createdAt: '2025-09-12T14:02:00Z', active: true },
  { id: 'wl_kim',         siteId: site.id, label: 'R. Kim — staff vehicle',        plateMasked: maskPlate('NHL8821'),  plateHash: plateHash('NHL8821'),  action: 'expect', reason: 'Operator personal vehicle',             createdBy: 'u_1', createdAt: '2025-09-12T14:03:00Z', active: true },
  { id: 'wl_advisory_1',  siteId: site.id, label: 'Advisory — recurring street loiter', plateMasked: maskPlate('TRS4419'), plateHash: plateHash('TRS4419'), action: 'flag',   reason: 'Neighborhood advisory shared 2026-04-02', createdBy: 'u_2', createdAt: '2026-04-03T18:00:00Z', active: true },
  { id: 'wl_advisory_2',  siteId: site.id, label: 'Advisory — perimeter dwell',    plateMasked: maskPlate('PLR0007'),  plateHash: plateHash('PLR0007'),  action: 'flag',   reason: 'After-hours dwell observations',        createdBy: 'u_2', createdAt: '2026-04-09T20:30:00Z', active: true },
];

function buildVehicles(): VehicleObservation[] {
  const r = mulberry32(737);
  const lprAssets = assets.filter((a) => a.type === 'lpr-camera');
  const cameraIds = lprAssets.map((a) => a.id);
  const out: VehicleObservation[] = [];
  const now = Date.now();

  for (let idx = 0; idx < PLATE_SEEDS.length; idx++) {
    const seed = PLATE_SEEDS[idx];
    const visitsByHour = new Array(24).fill(0).map(() => 0);
    for (let i = 0; i < seed.recent; i++) {
      // cluster around `hourCluster` with a couple of strays
      const drift = intBetween(r, -2, 2);
      const hour = ((seed.hourCluster + drift) + 24) % 24;
      visitsByHour[hour] += 1;
    }
    const visitsByDay = new Array(7).fill(0).map(() => 0);
    for (let i = 0; i < seed.recent; i++) {
      visitsByDay[intBetween(r, 0, 6)] += 1;
    }
    const lastSeenHoursAgo = intBetween(r, 0, 18);
    const firstSeenDaysAgo =
      seed.classification === 'unknown' ? intBetween(r, 0, 4)
      : seed.classification === 'expected' ? intBetween(r, 30, 240)
      : intBetween(r, 7, 90);

    out.push({
      id: `veh_${idx + 1}`,
      siteId: site.id,
      plateMasked: maskPlate(seed.plate),
      plateRegion: seed.region,
      plateHash: plateHash(seed.plate),
      color: seed.color,
      vehicleClass: seed.vehicleClass,
      cameraId: cameraIds.length ? pickFrom(r, cameraIds) : undefined,
      zoneId: seed.tags?.includes('street-passing') ? 'z_perimeter_n' : 'z_visitor_lot',
      classification: seed.classification,
      direction: seed.dwellSeconds && seed.dwellSeconds > 60 ? 'arriving' : seed.tags?.includes('street-passing') ? 'passing' : 'arriving',
      dwellSeconds: seed.dwellSeconds,
      visitsByDay,
      visitsByHour,
      firstSeen: new Date(now - firstSeenDaysAgo * 86400000).toISOString(),
      lastSeen: new Date(now - lastSeenHoursAgo * 3600000).toISOString(),
      count: seed.recent + intBetween(r, 0, 4),
      watchlistId: seed.watchlistId,
      tags: seed.tags,
      notes: seed.notes,
    });
  }
  return out;
}

const vehicles = buildVehicles();

// ────────────────────────────────────────────────────────────────────
// Anonymous occupancy events — counts only, never identities
// ────────────────────────────────────────────────────────────────────

function buildOccupancy(): OccupancyEvent[] {
  const r = mulberry32(919);
  const out: OccupancyEvent[] = [];
  const now = Date.now();
  const occCameras = assets.filter((a) => a.capabilities?.includes('occupancy'));
  const zoneIds = ['z_main_yard', 'z_ops_building', 'z_visitor_lot', 'z_perimeter_n', 'z_perimeter_s', 'z_utility'];

  // Last 7 days × 24 hourly buckets per zone
  let id = 0;
  for (const zoneId of zoneIds) {
    for (let dayBack = 6; dayBack >= 0; dayBack--) {
      const dayStart = new Date(now - dayBack * 86400000);
      dayStart.setHours(0, 0, 0, 0);
      for (let hour = 0; hour < 24; hour++) {
        const isOps = zoneId === 'z_ops_building' || zoneId === 'z_main_yard';
        const isLot = zoneId === 'z_visitor_lot';
        const businessHour = hour >= 7 && hour <= 18;
        const dayOfWeek = (dayStart.getDay() + 7) % 7;
        const weekday = dayOfWeek > 0 && dayOfWeek < 6;

        let base = 0;
        if (isOps && businessHour && weekday) base = intBetween(r, 4, 16);
        else if (isOps && businessHour) base = intBetween(r, 0, 4);
        else if (isLot && businessHour) base = intBetween(r, 0, 8);
        else if (!businessHour) base = chance(r, 0.05) ? 1 : 0;
        else base = intBetween(r, 0, 2);

        if (base === 0 && !chance(r, 0.15)) continue;

        out.push({
          id: `occ_${++id}`,
          siteId: site.id,
          zoneId,
          t: new Date(dayStart.getTime() + hour * 3600000).toISOString(),
          count: base,
          durationS: 3600,
          source: occCameras[0]?.id ?? 'sensor_unknown',
          afterHours: !businessHour,
        });
      }
    }
  }
  return out;
}

const occupancy = buildOccupancy();

// ────────────────────────────────────────────────────────────────────
// Pattern findings — distilled signals for the operator
// ────────────────────────────────────────────────────────────────────

const patterns: PatternFinding[] = [
  {
    id: 'pat_1',
    siteId: site.id,
    kind: 'after-hours-vehicle',
    severity: 'medium',
    subject: 'Plate TR···19 — recurring 02:00–03:00 dwell',
    detail: 'Black truck observed at street-facing camera on 4 nights in the last 7, each between 02:00 and 03:00. Average dwell 12m.',
    evidence: 'LPR-STREET-N · 4 of 7 nights · avg dwell 740s',
    detectedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    zoneId: 'z_perimeter_n',
    vehicleId: 'veh_14',
    acknowledged: false,
  },
  {
    id: 'pat_2',
    siteId: site.id,
    kind: 'after-hours-vehicle',
    severity: 'medium',
    subject: 'Plate PL···07 — repeat 03:00 perimeter dwell',
    detail: 'Grey car has paused at north perimeter on 3 of the last 7 nights, each near 03:00. Engine off >15m on two occasions.',
    evidence: 'LPR-STREET-N · 3 of 7 nights · max dwell 18m',
    detectedAt: new Date(Date.now() - 9 * 3600000).toISOString(),
    zoneId: 'z_perimeter_n',
    vehicleId: 'veh_15',
    acknowledged: false,
  },
  {
    id: 'pat_3',
    siteId: site.id,
    kind: 'first-time-vehicle',
    severity: 'low',
    subject: '4 first-time plates on visitor lot today',
    detail: 'Four plates with no prior observations were captured at the visitor gate. None match the watchlist or any expected delivery window.',
    evidence: 'LPR-GATE-IN · 4 unique first-seen plates · 11:00–15:00',
    detectedAt: new Date(Date.now() - 30 * 60000).toISOString(),
    zoneId: 'z_visitor_lot',
    acknowledged: false,
  },
  {
    id: 'pat_4',
    siteId: site.id,
    kind: 'after-hours-presence',
    severity: 'medium',
    subject: 'Anonymous presence in main yard at 02:14',
    detail: 'Occupancy counter recorded a person-shaped detection in the main yard outside documented operating hours. No badge-in correlated.',
    evidence: 'OCC-MAIN-YARD · count=1 · duration ~3 minutes',
    detectedAt: new Date(Date.now() - 11 * 3600000).toISOString(),
    zoneId: 'z_main_yard',
    acknowledged: true,
  },
  {
    id: 'pat_5',
    siteId: site.id,
    kind: 'unusual-dwell',
    severity: 'low',
    subject: 'Plate KQ···61 stopped 12m at gate',
    detail: 'A previously-unseen plate paused 12 minutes at the inbound gate without a successful badge interaction.',
    evidence: 'LPR-GATE-IN · dwell 720s · no door-controller event',
    detectedAt: new Date(Date.now() - 75 * 60000).toISOString(),
    zoneId: 'z_visitor_lot',
    vehicleId: 'veh_10',
    acknowledged: false,
  },
  {
    id: 'pat_6',
    siteId: site.id,
    kind: 'recurring-time-of-day',
    severity: 'info',
    subject: 'Repeat-vehicle pattern: weekday 17:00 cluster',
    detail: 'Plate WR···20 has appeared on 8 of the last 9 weekdays around 17:00, consistent with a regular passing vehicle.',
    evidence: 'LPR-STREET-N · 8 of 9 weekdays · 16:55–17:10',
    detectedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    zoneId: 'z_perimeter_n',
    vehicleId: 'veh_6',
    acknowledged: false,
  },
];

// ────────────────────────────────────────────────────────────────────
// Public store (read-only — adapters can swap this for a real backend)
// ────────────────────────────────────────────────────────────────────

export const mockStore = {
  site,
  zones,
  assets,
  signals,
  networkObservations,
  vehicles,
  watchlist,
  occupancy,
  patterns,
  alerts,
  incidents,
  evidence,
  baselines,
  baselineDiffs,
  signalDensity,
  detections,
  users,
  audit,
  tags,
  reports,
} as const;

export type MockStore = typeof mockStore;
