'use client';

import { useMemo, useState } from 'react';
import type { Asset, AssetType, Zone } from '@/lib/types';
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
      const hay = `${a.name} ${a.vendor ?? ''} ${a.model ?? ''} ${a.tags?.join(' ') ?? ''} ${zn}`.toLowerCase();
      return hay.includes(q);
    });
  }, [assets, type, query, zones]);

  const displaySelected = useMemo(() => {
    if (selectedId && filtered.some((a) => a.id === selectedId)) return selectedId;
    return undefined;
  }, [selectedId, filtered]);

  const sel = displaySelected ? filtered.find((a) => a.id === displaySelected) ?? null : null;
  const selZone = sel?.zoneId ? zones.find((z) => z.id === sel.zoneId) : null;

  const cols: Column<Asset>[] = [
    {
      key: 'name',
      header: 'Asset',
      render: (r) => (
        <div className={styles.aliasCell}>
          <span className={styles.aliasName}>{r.name}</span>
          <span className={styles.muted}>{r.type}</span>
        </div>
      ),
    },
    { key: 'vendor', header: 'Vendor', width: 130, render: (r) => <span className={styles.muted}>{r.vendor ?? '—'}</span> },
    { key: 'model', header: 'Model', width: 140, render: (r) => <span className={styles.mono}>{r.model ?? '—'}</span> },
    {
      key: 'zone',
      header: 'Zone',
      width: 170,
      render: (r) => <span className={styles.muted}>{zones.find((z) => z.id === r.zoneId)?.name ?? '—'}</span>,
    },
    { key: 'status', header: 'Status', width: 110, render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'lastSeen',
      header: 'Last seen',
      width: 130,
      render: (r) => <span className={styles.muted}>{r.lastSeen ? relTime(r.lastSeen) : '—'}</span>,
    },
    {
      key: 'tags',
      header: 'Tags',
      width: 220,
      render: (r) => <TagList tags={r.tags} />,
    },
  ];

  return (
    <>
      <Panel
        padded={false}
        title={`${filtered.length} assets`}
        subtitle="Filter by type or text. Click a row to inspect."
        actions={
          <div className={styles.toolbar}>
            <SearchInput
              placeholder="Search by name, vendor, model"
              width={260}
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
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
          onRowClick={(r) => setSelectedId(r.id)}
          selectedKey={displaySelected}
        />
      </Panel>

      <Drawer
        open={!!sel}
        onOpenChange={(o) => !o && setSelectedId(null)}
        title={sel?.name ?? ''}
        subtitle={sel ? `${sel.type} · ${sel.vendor ?? 'unknown vendor'}` : ''}
        width={500}
        footer={
          <>
            <Button variant="ghost">Edit position</Button>
            <Button variant="subtle">Schedule maintenance</Button>
            <Button variant="primary">View on map</Button>
          </>
        }
      >
        {sel && (
          <div className={styles.drawer}>
            <Panel title="Identification" padded>
              <KVList>
                <KV label="ID">{sel.id}</KV>
                <KV label="Type">{sel.type}</KV>
                <KV label="Status"><StatusBadge status={sel.status} /></KV>
                <KV label="Vendor">{sel.vendor ?? '—'}</KV>
                <KV label="Model">{sel.model ?? '—'}</KV>
                <KV label="Serial" mono>{sel.serial ?? '—'}</KV>
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
                <KV label="Capabilities"><TagList tags={sel.capabilities} /></KV>
                <KV label="Tags"><TagList tags={sel.tags} /></KV>
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
