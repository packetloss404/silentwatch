'use client';

import { useMemo, useState } from 'react';
import type { Alert, Classification, SignalBand, SignalObservation } from '@/lib/types';
import { Panel } from '@/components/ui/Panel';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ClassificationBadge } from '@/components/ui/Severity';
import { KV, KVList } from '@/components/ui/KeyValue';
import { Sparkline } from '@/components/ui/Sparkline';
import { TagList } from '@/components/ui/Tag';
import { SearchInput } from '@/components/ui/SearchInput';
import { Segmented } from '@/components/ui/Segmented';
import { compact, dateTime, relTime, rssiLabel } from '@/lib/format';
import { ArrowDown, ArrowUp, Eye, Flag } from 'lucide-react';
import styles from './page.module.scss';

const BAND_OPTIONS = [
  { value: 'all' as const, label: 'All bands' },
  { value: 'wifi' as const, label: 'Wi-Fi' },
  { value: 'bt' as const, label: 'Bluetooth' },
  { value: 'ble' as const, label: 'BLE' },
];

const CLASS_OPTIONS = [
  { value: 'all' as const, label: 'All' },
  { value: 'known' as const, label: 'Known' },
  { value: 'unknown' as const, label: 'Unknown' },
  { value: 'suspicious' as const, label: 'Suspicious' },
  { value: 'ignored' as const, label: 'Ignored' },
];

function bandMatches(band: SignalBand, group: (typeof BAND_OPTIONS)[number]['value']) {
  if (group === 'all') return true;
  if (group === 'wifi') return band === 'wifi-2.4' || band === 'wifi-5' || band === 'wifi-6';
  if (group === 'bt') return band === 'bluetooth';
  if (group === 'ble') return band === 'ble';
  return true;
}

export function SignalsView({ signals, alerts }: { signals: SignalObservation[]; alerts: Alert[] }) {
  const [query, setQuery] = useState('');
  const [bandFilter, setBandFilter] = useState<(typeof BAND_OPTIONS)[number]['value']>('all');
  const [classFilter, setClassFilter] = useState<(typeof CLASS_OPTIONS)[number]['value']>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'lastSeen' | 'firstSeen' | 'count' | 'rssi' | 'anomaly'>('lastSeen');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = signals.filter((s) => {
      if (!bandMatches(s.band, bandFilter)) return false;
      if (classFilter !== 'all' && s.classification !== (classFilter as Classification)) return false;
      if (q && !`${s.alias} ${s.identifier} ${s.vendorHint ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
    rows = [...rows].sort((a, b) => {
      const m = dir === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'lastSeen': return (+new Date(a.lastSeen) - +new Date(b.lastSeen)) * m;
        case 'firstSeen': return (+new Date(a.firstSeen) - +new Date(b.firstSeen)) * m;
        case 'count': return (a.count - b.count) * m;
        case 'rssi': return (a.rssi - b.rssi) * m;
        case 'anomaly': return (a.anomalyScore - b.anomalyScore) * m;
      }
    });
    return rows;
  }, [signals, query, bandFilter, classFilter, sortBy, dir]);

  const toggleSort = (key: typeof sortBy) => {
    if (key === sortBy) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setDir('desc'); }
  };

  const sortIcon = (key: typeof sortBy) =>
    sortBy === key ? (dir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />) : null;

  const sel = signals.find((s) => s.id === selectedId) ?? null;
  const selAlerts = sel ? alerts.filter((a) => a.signalId === sel.id) : [];

  const cols: Column<SignalObservation>[] = [
    {
      key: 'alias',
      header: 'Alias',
      render: (r) => (
        <div className={styles.aliasCell}>
          <span className={styles.aliasName}>{r.alias}</span>
          <TagList tags={r.tags} />
        </div>
      ),
    },
    { key: 'band', header: 'Band', width: 90, render: (r) => <span className={styles.mono}>{r.band}</span> },
    { key: 'type', header: 'Type', width: 110, render: (r) => <span className={styles.muted}>{r.type}</span> },
    {
      key: 'identifier',
      header: 'Identifier',
      width: 180,
      render: (r) => (
        <span title="masked identifier" className={styles.mono}>
          {r.identifier}
        </span>
      ),
    },
    { key: 'vendor', header: 'Vendor', width: 130, render: (r) => <span className={styles.muted}>{r.vendorHint ?? '—'}</span> },
    {
      key: 'class',
      header: 'Class',
      width: 110,
      render: (r) => <ClassificationBadge value={r.classification} />,
    },
    {
      key: 'rssi',
      header: <button onClick={() => toggleSort('rssi')} className={styles.sortBtn}>RSSI {sortIcon('rssi')}</button>,
      width: 92,
      align: 'right',
      render: (r) => (
        <span className={styles.mono} title={rssiLabel(r.rssi)}>{r.rssi}</span>
      ),
    },
    {
      key: 'count',
      header: <button onClick={() => toggleSort('count')} className={styles.sortBtn}>Count {sortIcon('count')}</button>,
      width: 80,
      align: 'right',
      render: (r) => <span className={styles.mono}>{compact(r.count)}</span>,
    },
    {
      key: 'firstSeen',
      header: <button onClick={() => toggleSort('firstSeen')} className={styles.sortBtn}>First seen {sortIcon('firstSeen')}</button>,
      width: 130,
      render: (r) => <span className={styles.muted}>{relTime(r.firstSeen)}</span>,
    },
    {
      key: 'lastSeen',
      header: <button onClick={() => toggleSort('lastSeen')} className={styles.sortBtn}>Last seen {sortIcon('lastSeen')}</button>,
      width: 130,
      render: (r) => <span className={styles.muted}>{relTime(r.lastSeen)}</span>,
    },
    {
      key: 'trend',
      header: 'Trend (24h)',
      width: 120,
      render: (r) => <Sparkline data={r.history ?? []} color={r.classification === 'suspicious' ? '#c89f4a' : r.classification === 'known' ? '#5fa37a' : '#4aa8c8'} width={96} height={20} />,
    },
    {
      key: 'anomaly',
      header: <button onClick={() => toggleSort('anomaly')} className={styles.sortBtn}>Anomaly {sortIcon('anomaly')}</button>,
      width: 110,
      render: (r) => (
        <div className={styles.anomalyCell}>
          <div className={styles.anomalyBar}>
            <div
              className={styles.anomalyBarFill}
              style={{
                width: `${r.anomalyScore}%`,
                background:
                  r.anomalyScore > 70 ? '#c8584a' :
                  r.anomalyScore > 40 ? '#c89f4a' : '#4aa8c8',
              }}
            />
          </div>
          <span className={styles.mono}>{r.anomalyScore}</span>
        </div>
      ),
    },
  ];

  return (
    <>
      <Panel
        padded={false}
        title={`${filtered.length} signals`}
        subtitle="Tap a row to inspect history and link to incidents"
        actions={
          <div className={styles.toolbar}>
            <SearchInput
              placeholder="Filter by alias, vendor or identifier"
              width={260}
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
            />
            <Segmented value={bandFilter} options={BAND_OPTIONS} onChange={setBandFilter} />
            <Segmented value={classFilter} options={CLASS_OPTIONS} onChange={setClassFilter} />
          </div>
        }
      >
        <DataTable
          columns={cols}
          rows={filtered}
          rowKey={(r) => r.id}
          getRowLabel={(r) => r.alias}
          onRowClick={(r) => setSelectedId(r.id)}
          selectedKey={selectedId ?? undefined}
        />
      </Panel>

      <Drawer
        open={!!sel}
        onOpenChange={(open) => !open && setSelectedId(null)}
        title={sel?.alias ?? ''}
        subtitle={sel ? `${sel.band} · ${sel.type} · ${sel.vendorHint ?? 'unknown vendor'}` : ''}
        width={520}
        footer={
          <>
            <Button variant="ghost">Mark ignore</Button>
            <Button variant="subtle" iconLeft={<Flag size={13} />}>Mark suspicious</Button>
            <Button variant="primary" iconLeft={<Eye size={13} />}>Open incident</Button>
          </>
        }
      >
        {sel && (
          <div className={styles.drawerBody}>
            <div className={styles.drawerStats}>
              <div className={styles.dStat}>
                <span className={styles.dStatLabel}>Anomaly</span>
                <span className={styles.dStatVal}>{sel.anomalyScore}</span>
              </div>
              <div className={styles.dStat}>
                <span className={styles.dStatLabel}>RSSI</span>
                <span className={styles.dStatVal}>{sel.rssi} dBm</span>
              </div>
              <div className={styles.dStat}>
                <span className={styles.dStatLabel}>Count</span>
                <span className={styles.dStatVal}>{compact(sel.count)}</span>
              </div>
              <div className={styles.dStat}>
                <span className={styles.dStatLabel}>Class</span>
                <span><ClassificationBadge value={sel.classification} /></span>
              </div>
            </div>

            {sel.anomalyScoreComponents && sel.anomalyScoreComponents.length > 0 && (
              <Panel title="Anomaly score — factors" padded>
                <p className={styles.explainIntro}>
                  Illustrative breakdown for appeals and calibration. Total row score is still <strong>{sel.anomalyScore}</strong>.
                </p>
                <ul className={styles.scoreFactors}>
                  {sel.anomalyScoreComponents.map((c) => (
                    <li key={c.id} className={styles.scoreFactorRow}>
                      <div>
                        <div className={styles.scoreFactorLabel}>{c.label}</div>
                        <div className={styles.scoreFactorVal}>
                          value {typeof c.value === 'number' && !Number.isInteger(c.value) ? c.value.toFixed(2) : c.value}
                        </div>
                      </div>
                      <div className={styles.scoreFactorPts}>
                        <span className={styles.mono}>+{c.pointsToward}</span>
                        <span className={styles.scoreFactorBar}>
                          <span
                            className={styles.scoreFactorBarFill}
                            style={{
                              width: `${Math.min(100, (c.pointsToward / Math.max(sel.anomalyScore, 1)) * 100)}%`,
                            }}
                          />
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            <Panel title="24h occurrence trend" padded>
              <div className={styles.bigSpark}>
                <Sparkline
                  data={sel.history ?? []}
                  color={sel.classification === 'suspicious' ? '#c89f4a' : '#4aa8c8'}
                  width={460}
                  height={80}
                  strokeWidth={1.5}
                />
              </div>
            </Panel>

            <Panel title="Identification" padded>
              <KVList>
                <KV label="Identifier" mono>{sel.identifier}</KV>
                <KV label="Channel">{sel.channel ?? '—'}</KV>
                <KV label="Vendor">{sel.vendorHint ?? '—'}</KV>
                <KV label="Tags"><TagList tags={sel.tags} /></KV>
                <KV label="First seen">{dateTime(sel.firstSeen)}</KV>
                <KV label="Last seen">{dateTime(sel.lastSeen)}</KV>
              </KVList>
            </Panel>

            {sel.notes && (
              <Panel title="Operator note" padded>
                <p className={styles.note}>{sel.notes}</p>
              </Panel>
            )}

            <Panel title={`Linked alerts (${selAlerts.length})`} padded={false}>
              <ul className={styles.linkedAlerts}>
                {selAlerts.length === 0 && (
                  <li className={styles.emptyRow}>No alerts linked to this signal.</li>
                )}
                {selAlerts.map((a) => (
                  <li key={a.id}>
                    <Badge tone={a.severity} dot>{a.severity}</Badge>
                    <div>
                      <div className={styles.alertTitle}>{a.title}</div>
                      <div className={styles.alertMeta}>{relTime(a.createdAt)} · {a.source}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        )}
      </Drawer>
    </>
  );
}
