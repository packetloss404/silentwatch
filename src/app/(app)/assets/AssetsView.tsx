'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import btnStyles from '@/components/ui/Button.module.scss';
import {
  Building2,
  Car,
  Cctv,
  DoorClosed,
  Flame,
  Gauge,
  Network,
  Radio,
  RadioTower,
  ScanLine,
  Server,
  Users,
  Wifi,
} from 'lucide-react';
import type { Asset, AssetType, Zone } from '@/lib/types';
import { assetKindSummary, assetTypeLabel } from '@/lib/assetDisplay';
import { Panel } from '@/components/ui/Panel';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Severity';
import { Drawer } from '@/components/ui/Drawer';
import { KV, KVList } from '@/components/ui/KeyValue';
import { Button } from '@/components/ui/Button';
import { TagList } from '@/components/ui/Tag';
import { Segmented } from '@/components/ui/Segmented';
import { SearchInput } from '@/components/ui/SearchInput';
import { dateTime, relTime } from '@/lib/format';
import styles from './page.module.scss';

const TYPE_ICONS: Record<AssetType, typeof Cctv> = {
  camera: Cctv,
  'lpr-camera': ScanLine,
  'ir-camera': Flame,
  sensor: Gauge,
  'occupancy-counter': Users,
  'access-point': Wifi,
  gateway: Server,
  switch: Network,
  'door-controller': DoorClosed,
  vehicle: Car,
  building: Building2,
  entrance: DoorClosed,
  beacon: RadioTower,
};

const TYPE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'camera', label: 'Camera' },
  { value: 'lpr-camera', label: 'LPR' },
  { value: 'ir-camera', label: 'IR' },
  { value: 'occupancy-counter', label: 'Occupancy' },
  { value: 'sensor', label: 'Sensor' },
  { value: 'access-point', label: 'AP' },
  { value: 'door-controller', label: 'Door' },
  { value: 'gateway', label: 'Gateway' },
  { value: 'vehicle', label: 'Vehicle' },
] as const;

function capabilityShort(cap: string): string {
  const map: Record<string, string> = {
    lpr: 'LPR',
    thermal: 'Thermal',
    'low-light': 'Low light',
    audio: 'Audio',
    ptz: 'PTZ',
    occupancy: 'Count',
    motion: 'Motion',
  };
  return map[cap] ?? cap;
}

export function AssetsView({ assets, zones }: { assets: Asset[]; zones: Zone[] }) {
  const [type, setType] = useState<(typeof TYPE_OPTIONS)[number]['value']>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((a) => {
      if (type !== 'all' && a.type !== (type as AssetType)) return false;
      if (!q) return true;
      const zn = zones.find((z) => z.id === a.zoneId)?.name ?? '';
      const typeLabel = assetTypeLabel(a.type).toLowerCase();
      const caps = (a.capabilities ?? []).join(' ').toLowerCase();
      const hay = `${a.name} ${a.vendor ?? ''} ${a.model ?? ''} ${
        a.tags?.join(' ') ?? ''
      } ${zn} ${typeLabel} ${caps}`.toLowerCase();
      return hay.includes(q);
    });
  }, [assets, type, query, zones]);

  const displaySelected = useMemo(() => {
    if (selectedId && filtered.some((a) => a.id === selectedId)) return selectedId;
    return undefined;
  }, [selectedId, filtered]);

  const sel = displaySelected ? filtered.find((a) => a.id === displaySelected) ?? null : null;
  const selZone = sel?.zoneId ? zones.find((z) => z.id === sel.zoneId) : null;
  const hasActiveFilters = type !== 'all' || query.trim() !== '';
  const panelTitle =
    hasActiveFilters && assets.length > 0
      ? `Showing ${filtered.length} of ${assets.length} assets`
      : `${filtered.length} assets`;

  const emptyMessage =
    assets.length === 0
      ? 'No edge assets in the site catalog yet.'
      : 'No assets match your filters. Clear the search or set type to All.';

  const IconFor = sel ? TYPE_ICONS[sel.type] ?? Radio : Cctv;

  const cols: Column<Asset>[] = [
    {
      key: 'name',
      header: 'Asset',
      width: 200,
      render: (r) => (
        <div className={styles.aliasCell}>
          <span className={styles.aliasName}>{r.name}</span>
        </div>
      ),
    },
    {
      key: 'assetType',
      header: 'Type',
      width: 130,
      render: (r) => <span className={styles.typeLabel}>{assetTypeLabel(r.type)}</span>,
    },
    {
      key: 'capabilities',
      header: 'Sensing',
      width: 200,
      render: (r) =>
        r.capabilities && r.capabilities.length > 0 ? (
          <span className={styles.sensingCell}>
            {r.capabilities.slice(0, 4).map((c) => (
              <span key={c} className={styles.sensingChip}>
                {capabilityShort(c)}
              </span>
            ))}
            {r.capabilities.length > 4 && <span className={styles.muted}>+{r.capabilities.length - 4}</span>}
          </span>
        ) : (
          <span className={styles.muted}>—</span>
        ),
    },
    { key: 'vendor', header: 'Vendor', width: 120, render: (r) => <span className={styles.muted}>{r.vendor ?? '—'}</span> },
    { key: 'model', header: 'Model', width: 120, render: (r) => <span className={styles.mono}>{r.model ?? '—'}</span> },
    {
      key: 'zone',
      header: 'Zone',
      width: 150,
      render: (r) => <span className={styles.muted}>{zones.find((z) => z.id === r.zoneId)?.name ?? '—'}</span>,
    },
    { key: 'status', header: 'Status', width: 100, render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'lastSeen',
      header: 'Last seen',
      width: 120,
      render: (r) => <span className={styles.muted}>{r.lastSeen ? relTime(r.lastSeen) : '—'}</span>,
    },
    {
      key: 'tags',
      header: 'Tags',
      width: 180,
      render: (r) => (r.tags && r.tags.length > 0 ? <TagList tags={r.tags} /> : <span className={styles.muted}>—</span>),
    },
  ];

  return (
    <>
      <Panel
        padded={false}
        title={panelTitle}
        subtitle="Filter by type or text (name, zone, tags, capabilities). Tab to a row, Enter to open details."
        actions={
          <div className={styles.toolbar}>
            <SearchInput
              placeholder="Search name, vendor, zone, tags, capabilities…"
              width={280}
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              aria-label="Filter assets by name, vendor, model, zone, tags, or capability"
            />
            <Segmented
              value={type}
              options={[...TYPE_OPTIONS] as { value: (typeof TYPE_OPTIONS)[number]['value']; label: string }[]}
              onChange={(v) => setType(v)}
            />
          </div>
        }
      >
        <DataTable
          columns={cols}
          rows={filtered}
          rowKey={(r) => r.id}
          getRowLabel={(r) => r.name}
          onRowClick={(r) => setSelectedId(r.id)}
          selectedKey={displaySelected}
          empty={emptyMessage}
        />
      </Panel>

      <Drawer
        open={!!sel}
        onOpenChange={(o) => !o && setSelectedId(null)}
        title={
          sel ? (
            <span className={styles.drawerTitle}>
              <IconFor size={16} aria-hidden />
              {sel.name}
            </span>
          ) : (
            ''
          )
        }
        subtitle={sel ? assetKindSummary(sel) : ''}
        width={500}
        footer={
          <>
            <Button type="button" variant="ghost">
              Edit position
            </Button>
            <Button type="button" variant="subtle">
              Schedule maintenance
            </Button>
            <Link
              href="/map"
              className={clsx(btnStyles.btn, btnStyles.primary, btnStyles.sm)}
              style={{ textDecoration: 'none' }}
            >
              <span className={btnStyles.label}>View on map</span>
            </Link>
          </>
        }
      >
        {sel && (
          <div className={styles.drawer}>
            <Panel title="Identification" padded>
              <KVList>
                <KV label="ID">{sel.id}</KV>
                <KV label="Type">{assetTypeLabel(sel.type)}</KV>
                <KV label="Status">
                  <StatusBadge status={sel.status} />
                </KV>
                <KV label="Vendor">{sel.vendor ?? '—'}</KV>
                <KV label="Model">{sel.model ?? '—'}</KV>
                <KV label="Serial" mono>
                  {sel.serial ?? '—'}
                </KV>
                <KV label="Owner">{sel.owner ?? '—'}</KV>
              </KVList>
            </Panel>

            <Panel title="Placement" padded>
              <KVList>
                <KV label="Zone">{selZone?.name ?? '—'}</KV>
                <KV label="Position" mono>
                  {sel.position[1].toFixed(5)}, {sel.position[0].toFixed(5)}
                </KV>
                {sel.headingDeg != null && <KV label="Heading">{sel.headingDeg}°</KV>}
                {sel.fovDeg != null && <KV label="FOV">{sel.fovDeg}°</KV>}
                {sel.rangeM != null && <KV label="Range">{sel.rangeM} m</KV>}
              </KVList>
            </Panel>

            <Panel title="Lifecycle" padded>
              <KVList>
                <KV label="Installed">{sel.installedAt ? dateTime(sel.installedAt) : '—'}</KV>
                <KV label="Last seen">{sel.lastSeen ? dateTime(sel.lastSeen) : '—'}</KV>
                <KV label="Capabilities">
                  <TagList tags={sel.capabilities} />
                </KV>
                <KV label="Tags">
                  <TagList tags={sel.tags} />
                </KV>
              </KVList>
            </Panel>

            {sel.notes && (
              <Panel title="Operator note" padded>
                <p className={styles.note}>{sel.notes}</p>
              </Panel>
            )}
          </div>
        )}
      </Drawer>
    </>
  );
}
