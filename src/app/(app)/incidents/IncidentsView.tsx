'use client';

import { useMemo, useState } from 'react';
import type { BadgeTone } from '@/components/ui/Badge';
import type { Alert, EvidenceItem, Incident, IncidentStatus, User } from '@/lib/types';
import { Panel } from '@/components/ui/Panel';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SeverityBadge } from '@/components/ui/Severity';
import { TagList } from '@/components/ui/Tag';
import { KV, KVList } from '@/components/ui/KeyValue';
import { Segmented } from '@/components/ui/Segmented';
import { dateTime, relTime } from '@/lib/format';
import { Camera, FileText, Map as MapIcon, MessageSquare, Paperclip, Radio } from 'lucide-react';
import styles from './page.module.scss';

const STATUS_OPTIONS = [
  { value: 'all' as const, label: 'All' },
  { value: 'open' as const, label: 'Open' },
  { value: 'investigating' as const, label: 'Investigating' },
  { value: 'contained' as const, label: 'Contained' },
  { value: 'resolved' as const, label: 'Resolved' },
];

const STATUS_TONE: Record<IncidentStatus, BadgeTone> = {
  open: 'amber',
  investigating: 'cyan',
  contained: 'green',
  resolved: 'green',
  dismissed: 'neutral',
};

const EVIDENCE_ICON = {
  note: MessageSquare,
  snapshot: Camera,
  'signal-log': Radio,
  'sensor-log': Radio,
  attachment: Paperclip,
  'map-pin': MapIcon,
} as const;

interface Props {
  incidents: Incident[];
  evidence: EvidenceItem[];
  alerts: Alert[];
  users: User[];
}

export function IncidentsView({ incidents, evidence, alerts, users }: Props) {
  const [filter, setFilter] = useState<(typeof STATUS_OPTIONS)[number]['value']>('all');
  const filtered = useMemo(
    () => (filter === 'all' ? incidents : incidents.filter((i) => i.status === filter)),
    [incidents, filter],
  );

  const [selected, setSelected] = useState<string | null>(null);
  const selectedId = useMemo(() => {
    if (selected && filtered.some((i) => i.id === selected)) return selected;
    return filtered[0]?.id ?? null;
  }, [selected, filtered]);
  const sel = selectedId != null ? filtered.find((i) => i.id === selectedId) ?? null : null;
  const selEvidence = sel ? evidence.filter((e) => e.incidentId === sel.id) : [];
  const selAlerts = sel ? alerts.filter((a) => sel.alertIds.includes(a.id)) : [];
  const assigneeUser = sel?.assignee ? users.find((u) => u.id === sel.assignee) : undefined;

  return (
    <div className={styles.layout}>
      <Panel
        padded={false}
        title="Queue"
        subtitle={`${filtered.length} incidents`}
        actions={<Segmented value={filter} options={STATUS_OPTIONS} onChange={setFilter} />}
        className={styles.queuePanel}
      >
        <ul className={styles.queue}>
          {filtered.map((i) => {
            const evCount = evidence.filter((e) => e.incidentId === i.id).length;
            return (
              <li key={i.id}>
                <button
                  className={`${styles.queueItem} ${sel?.id === i.id ? styles.queueItemActive : ''}`}
                  onClick={() => setSelected(i.id)}
                >
                  <div className={styles.queueRow1}>
                    <SeverityBadge severity={i.severity} />
                    <span className={styles.queueId}>{i.id}</span>
                    <Badge tone={STATUS_TONE[i.status]} size="sm">{i.status}</Badge>
                  </div>
                  <div className={styles.queueTitle}>{i.title}</div>
                  <div className={styles.queueMeta}>
                    <span>{relTime(i.updatedAt)}</span>
                    <span>·</span>
                    <span>{evCount} evidence</span>
                    <span>·</span>
                    <span>{i.alertIds.length} alerts</span>
                  </div>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && <li className={styles.queueEmpty}>No incidents in this filter.</li>}
        </ul>
      </Panel>

      <div className={styles.detail}>
        {sel ? (
          <>
            <Panel
              title={sel.title}
              subtitle={
                <span>
                  {sel.id} · opened {relTime(sel.openedAt)} · last update {relTime(sel.updatedAt)}
                </span>
              }
              actions={
                <div className={styles.headerActions}>
                  <SeverityBadge severity={sel.severity} />
                  <Badge tone={STATUS_TONE[sel.status]}>{sel.status}</Badge>
                  <Button variant="ghost">Reassign</Button>
                  <Button variant="primary">Update status</Button>
                </div>
              }
            >
              <p className={styles.summary}>{sel.summary}</p>
              <div className={styles.metaGrid}>
                <KVList>
                  <KV label="Assignee">{assigneeUser?.name ?? '—'}</KV>
                  <KV label="Tags"><TagList tags={sel.tags} /></KV>
                  <KV label="Opened">{dateTime(sel.openedAt)}</KV>
                </KVList>
                <KVList>
                  <KV label="Updated">{dateTime(sel.updatedAt)}</KV>
                  <KV label="Closed">{sel.closedAt ? dateTime(sel.closedAt) : '—'}</KV>
                  <KV label="Zones">{sel.zoneIds.join(', ') || '—'}</KV>
                </KVList>
              </div>
            </Panel>

            <Panel title={`Linked alerts (${selAlerts.length})`} padded={false}>
              <ul className={styles.alertList}>
                {selAlerts.map((a) => (
                  <li key={a.id}>
                    <SeverityBadge severity={a.severity} />
                    <div>
                      <div className={styles.alertTitle}>{a.title}</div>
                      <div className={styles.alertMeta}>
                        {a.source} · {relTime(a.createdAt)}
                        {a.acknowledged ? <> · <Badge tone="green" size="sm">ack</Badge></> : <> · <Badge tone="amber" size="sm">unack</Badge></>}
                      </div>
                    </div>
                  </li>
                ))}
                {selAlerts.length === 0 && <li className={styles.empty}>No linked alerts.</li>}
              </ul>
            </Panel>

            <Panel title={`Evidence timeline (${selEvidence.length})`} padded>
              <ol className={styles.timeline}>
                {selEvidence.map((e) => {
                  const Icon = EVIDENCE_ICON[e.kind] ?? FileText;
                  return (
                    <li key={e.id} className={styles.tlItem}>
                      <span className={styles.tlIcon}><Icon size={13} /></span>
                      <div className={styles.tlBody}>
                        <div className={styles.tlHead}>
                          <span className={styles.tlTitle}>{e.title}</span>
                          <span className={styles.tlTime}>{dateTime(e.capturedAt)}</span>
                        </div>
                        {e.body && <p className={styles.tlText}>{e.body}</p>}
                        <div className={styles.tlMeta}>
                          <Badge size="sm">{e.kind}</Badge>
                          {e.position && (
                            <span className={styles.mono}>
                              {e.position[1].toFixed(5)}, {e.position[0].toFixed(5)}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
                {selEvidence.length === 0 && <li className={styles.empty}>No evidence captured yet.</li>}
              </ol>
              <div className={styles.composer}>
                <input className={styles.composerInput} placeholder="Add a note or attach evidence…" />
                <Button variant="subtle" iconLeft={<Paperclip size={13} />}>Attach</Button>
                <Button variant="primary" iconLeft={<MessageSquare size={13} />}>Add note</Button>
              </div>
            </Panel>
          </>
        ) : (
          <Panel title="No incident selected" padded>
            <p className={styles.summary}>Choose an incident from the queue.</p>
          </Panel>
        )}
      </div>
    </div>
  );
}
