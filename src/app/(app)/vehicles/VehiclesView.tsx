'use client';

import { useMemo, useState } from 'react';
import type { Asset, VehicleClassification, VehicleObservation, WatchlistEntry } from '@/lib/types';
import { Panel } from '@/components/ui/Panel';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { KV, KVList } from '@/components/ui/KeyValue';
import { Segmented } from '@/components/ui/Segmented';
import { SearchInput } from '@/components/ui/SearchInput';
import { TagList } from '@/components/ui/Tag';
import { BarRow } from '@/components/ui/BarRow';
import { dateTime, relTime } from '@/lib/format';
import { CarFront, ChevronRight, ShieldCheck, Trash2 } from 'lucide-react';
import styles from './page.module.scss';

const CLASS_TONE: Record<VehicleClassification, BadgeTone> = {
  expected: 'green',
  repeat: 'cyan',
  unknown: 'neutral',
  flagged: 'amber',
  ignored: 'ignored',
};

const CLASS_OPTIONS = [
  { value: 'all' as const, label: 'All' },
  { value: 'expected' as const, label: 'Expected' },
  { value: 'repeat' as const, label: 'Repeat' },
  { value: 'unknown' as const, label: 'Unknown' },
  { value: 'flagged' as const, label: 'Flagged' },
];

function dwellLabel(seconds?: number): string {
  if (seconds == null || Number.isNaN(seconds)) return '—';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

interface Props {
  vehicles: VehicleObservation[];
  watchlist: WatchlistEntry[];
  assets: Asset[];
}

export function VehiclesView({ vehicles, watchlist, assets }: Props) {
  const [filter, setFilter] = useState<(typeof CLASS_OPTIONS)[number]['value']>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vehicles.filter((v) => {
      if (filter !== 'all' && v.classification !== (filter as VehicleClassification)) return false;
      if (!q) return true;
      const cam = assets.find((a) => a.id === v.cameraId)?.name ?? '';
      const hay = `${v.plateMasked} ${v.plateRegion ?? ''} ${v.color ?? ''} ${v.vehicleClass} ${v.direction ?? ''} ${v.tags?.join(' ') ?? ''} ${cam}`.toLowerCase();
      return hay.includes(q);
    });
  }, [vehicles, filter, query, assets]);

  const displaySelected = useMemo(() => {
    if (selectedId && filtered.some((v) => v.id === selectedId)) return selectedId;
    return undefined;
  }, [selectedId, filtered]);

  const sel = displaySelected ? filtered.find((v) => v.id === displaySelected) ?? null : null;
  const selWatch = sel?.watchlistId ? watchlist.find((w) => w.id === sel.watchlistId) : undefined;
  const selCamera = sel?.cameraId ? assets.find((a) => a.id === sel.cameraId) : undefined;

  const cols: Column<VehicleObservation>[] = [
    {
      key: 'plate',
      header: 'Plate',
      width: 130,
      render: (r) => (
        <div className={styles.plateCell}>
          <span className={styles.plateValue}>{r.plateMasked}</span>
          {r.plateRegion && <span className={styles.plateRegion}>{r.plateRegion}</span>}
        </div>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      width: 150,
      render: (r) => (
        <div className={styles.aliasCell}>
          <span className={styles.aliasName}>{r.color ? `${r.color} ${r.vehicleClass}` : r.vehicleClass}</span>
          <TagList tags={r.tags} />
        </div>
      ),
    },
    { key: 'class', header: 'Class', width: 110, render: (r) => <Badge tone={CLASS_TONE[r.classification]} dot>{r.classification}</Badge> },
    { key: 'direction', header: 'Direction', width: 100, render: (r) => <span className={styles.muted}>{r.direction}</span> },
    {
      key: 'cam',
      header: 'Captured by',
      width: 150,
      render: (r) => <span className={styles.muted}>{assets.find((a) => a.id === r.cameraId)?.name ?? '—'}</span>,
    },
    { key: 'dwell', header: 'Dwell', width: 70, align: 'right', render: (r) => <span className={styles.mono}>{dwellLabel(r.dwellSeconds)}</span> },
    { key: 'count', header: '7d count', width: 80, align: 'right', render: (r) => <span className={styles.mono}>{r.count}</span> },
    { key: 'first', header: 'First seen', width: 130, render: (r) => <span className={styles.muted}>{relTime(r.firstSeen)}</span> },
    { key: 'last', header: 'Last seen', width: 130, render: (r) => <span className={styles.muted}>{relTime(r.lastSeen)}</span> },
    {
      key: 'pattern',
      header: 'Hour-of-day',
      width: 200,
      render: (r) => (
        <div style={{ ['--cols' as any]: 24 }}>
          <BarRow data={r.visitsByHour ?? new Array(24).fill(0)} height={22} color={r.classification === 'flagged' ? '#c89f4a' : '#4aa8c8'} />
        </div>
      ),
    },
  ];

  const groupedWatch = {
    expect: watchlist.filter((w) => w.action === 'expect'),
    flag: watchlist.filter((w) => w.action === 'flag'),
    ignore: watchlist.filter((w) => w.action === 'ignore'),
  };

  return (
    <div className={styles.layout}>
      <div className={styles.tableCol}>
        <Panel
          padded={false}
          title={`${filtered.length} plate observations`}
          subtitle="Last 7 days. Click a row to inspect visit history and watchlist linkage."
          actions={
            <div className={styles.toolbar}>
              <SearchInput
                placeholder="Search plate, color, tag…"
                width={240}
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
              />
              <Segmented value={filter} options={CLASS_OPTIONS} onChange={setFilter} />
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

        <div className={styles.privacyCard}>
          <ShieldCheck size={16} />
          <div>
            <div className={styles.privacyTitle}>Privacy posture</div>
            <p>
              Plates displayed here are masked. SilentWatch hashes the canonical plate at the edge and
              uses the hash only to match against this site&apos;s operator-defined watchlist. Plates are
              never sent to a DMV lookup, plate-search service, or third-party identity provider.
              Patterns are anonymous frequency analysis only.
            </p>
          </div>
        </div>
      </div>

      <aside className={styles.sideCol}>
        <Panel
          title="Watchlist"
          subtitle={`${watchlist.length} entries · operator-defined`}
          actions={<Button variant="primary" iconLeft={<ChevronRight size={13} />}>Add</Button>}
          padded={false}
        >
          <ul className={styles.watchGroups}>
            {(['expect', 'flag', 'ignore'] as const).map((action) => (
              <li key={action} className={styles.watchGroup}>
                <div className={styles.watchGroupHead}>
                  <Badge tone={action === 'expect' ? 'green' : action === 'flag' ? 'amber' : 'ignored'} size="sm">
                    {action}
                  </Badge>
                  <span className={styles.watchGroupCount}>{groupedWatch[action].length}</span>
                </div>
                <ul className={styles.watchItems}>
                  {groupedWatch[action].map((w) => (
                    <li key={w.id} className={styles.watchItem}>
                      <div>
                        <div className={styles.watchLabel}>{w.label}</div>
                        <div className={styles.watchMeta}>
                          <span className={styles.mono}>{w.plateMasked}</span>
                          {w.reason && <span> · {w.reason}</span>}
                        </div>
                      </div>
                      <button className={styles.watchTrash} aria-label="Remove">
                        <Trash2 size={12} />
                      </button>
                    </li>
                  ))}
                  {groupedWatch[action].length === 0 && (
                    <li className={styles.watchEmpty}>No entries.</li>
                  )}
                </ul>
              </li>
            ))}
          </ul>
        </Panel>
      </aside>

      <Drawer
        open={!!sel}
        onOpenChange={(o) => !o && setSelectedId(null)}
        title={
          <span className={styles.drawerTitle}>
            <CarFront size={15} /> Plate {sel?.plateMasked ?? ''}
          </span>
        }
        subtitle={
          sel
            ? `${sel.color ? `${sel.color} ` : ''}${sel.vehicleClass}${sel.plateRegion ? ` · ${sel.plateRegion}` : ''}`
            : ''
        }
        width={520}
        footer={
          <>
            <Button variant="ghost">Mark ignore</Button>
            <Button variant="subtle">Add to watchlist · expect</Button>
            <Button variant="primary">Add to watchlist · flag</Button>
          </>
        }
      >
        {sel && (
          <div className={styles.drawerBody}>
            <div className={styles.drawerStats}>
              <div className={styles.dStat}>
                <span className={styles.dStatLabel}>7d count</span>
                <span className={styles.dStatVal}>{sel.count}</span>
              </div>
              <div className={styles.dStat}>
                <span className={styles.dStatLabel}>Avg dwell</span>
                <span className={styles.dStatVal}>{dwellLabel(sel.dwellSeconds)}</span>
              </div>
              <div className={styles.dStat}>
                <span className={styles.dStatLabel}>Class</span>
                <span><Badge tone={CLASS_TONE[sel.classification]} dot>{sel.classification}</Badge></span>
              </div>
              <div className={styles.dStat}>
                <span className={styles.dStatLabel}>Direction</span>
                <span className={styles.dStatVal}>{sel.direction}</span>
              </div>
            </div>

            {sel.readQuality && (
              <Panel title="LPR read quality (edge aggregate)" padded>
                <p className={styles.readQualityNote}>
                  Quality metrics for the capture path on this row — used for pipeline health, not identity.
                </p>
                <KVList>
                  <KV label="Mean confidence">{Math.round(sel.readQuality.confidenceAvg * 100)}%</KV>
                  <KV label="Partial read rate">{Math.round(sel.readQuality.partialReadRate * 100)}%</KV>
                  {sel.readQuality.note && <KV label="Note">{sel.readQuality.note}</KV>}
                </KVList>
              </Panel>
            )}

            <Panel title="Hour-of-day pattern" padded>
              <div style={{ ['--cols' as any]: 24 }}>
                <BarRow
                  data={sel.visitsByHour ?? new Array(24).fill(0)}
                  labels={Array.from({ length: 24 }).map((_, i) => (i % 6 === 0 ? `${i.toString().padStart(2, '0')}` : ''))}
                  height={56}
                  color={sel.classification === 'flagged' ? '#c89f4a' : '#4aa8c8'}
                />
              </div>
            </Panel>

            <Panel title="Last 7 days" padded>
              <div style={{ ['--cols' as any]: 7 }}>
                <BarRow
                  data={sel.visitsByDay ?? new Array(7).fill(0)}
                  labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                  height={56}
                  color="#5fa37a"
                />
              </div>
            </Panel>

            <Panel title="Identification" padded>
              <KVList>
                <KV label="Plate" mono>{sel.plateMasked}</KV>
                <KV label="Region">{sel.plateRegion ?? '—'}</KV>
                <KV label="Plate hash" mono>{sel.plateHash}</KV>
                <KV label="Captured by">{selCamera?.name ?? '—'}</KV>
                <KV label="Watchlist">
                  {selWatch ? `${selWatch.label} (${selWatch.action})` : 'no match'}
                </KV>
                <KV label="First seen">{dateTime(sel.firstSeen)}</KV>
                <KV label="Last seen">{dateTime(sel.lastSeen)}</KV>
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
    </div>
  );
}
