import { adapter } from '@/lib/mock/adapter';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Download, FileText, History, Share2 } from 'lucide-react';
import { bytes, dateTime, relTime } from '@/lib/format';
import type { BadgeTone } from '@/components/ui/Badge';
import type { ReportKind } from '@/lib/types';
import styles from './page.module.scss';

export const dynamic = 'force-static';

const KIND_LABEL: Record<ReportKind, string> = {
  executive: 'Executive summary',
  technical: 'Technical detail',
  'baseline-drift': 'Baseline drift',
  'incident-export': 'Incident export',
  'change-log': 'Change log',
};

const KIND_TONE: Record<ReportKind, BadgeTone> = {
  executive: 'cyan',
  technical: 'violet',
  'baseline-drift': 'amber',
  'incident-export': 'red',
  'change-log': 'neutral',
};

export default async function ReportsPage() {
  const [reports, audit, users] = await Promise.all([
    adapter.listReports(),
    adapter.listAudit(),
    adapter.listUsers(),
  ]);
  const dayAgo = Date.now() - 86400000;
  const auditRecent = audit.filter((e) => +new Date(e.at) > dayAgo);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Operations"
        title="Reports"
        description="Generate exportable summaries for stakeholders, compliance reviewers, and security leadership."
        actions={<Button variant="primary" iconLeft={<FileText size={13} />}>New report</Button>}
      />

      <section className={styles.builder}>
        <Panel title="Report builder" subtitle="Choose a template, range, and audience">
          <div className={styles.builderGrid}>
            <button className={styles.tile}>
              <Badge tone="cyan" size="sm">EXEC</Badge>
              <div className={styles.tileTitle}>Executive summary</div>
              <p className={styles.tileBody}>One-page snapshot of posture, incidents, and action items.</p>
            </button>
            <button className={styles.tile}>
              <Badge tone="violet" size="sm">TECH</Badge>
              <div className={styles.tileTitle}>Technical detail</div>
              <p className={styles.tileBody}>
                Camera, RF, sensor, and optional on-site host correlation with charts and tables.
              </p>
            </button>
            <button className={styles.tile}>
              <Badge tone="amber" size="sm">DRIFT</Badge>
              <div className={styles.tileTitle}>Baseline drift</div>
              <p className={styles.tileBody}>Findings vs baseline with remediation status and exceptions.</p>
            </button>
            <button className={styles.tile}>
              <Badge tone="red" size="sm">IR</Badge>
              <div className={styles.tileTitle}>Incident export</div>
              <p className={styles.tileBody}>Full incident bundle with timeline, evidence, and decisions.</p>
            </button>
            <button className={styles.tile}>
              <Badge tone="neutral" size="sm">CHG</Badge>
              <div className={styles.tileTitle}>Change log</div>
              <p className={styles.tileBody}>Configuration, asset, and watchlist diffs for compliance reviews.</p>
            </button>
            <button className={styles.tile}>
              <Badge tone="green" size="sm">GOV</Badge>
              <div className={styles.tileTitle}>Oversight &amp; custody</div>
              <p className={styles.tileBody}>
                Redacted audit chain, pattern decision records, and retention report for boards and reviewers.
              </p>
            </button>
          </div>
          <div className={styles.builderFoot}>
            <div className={styles.builderHint}>
              <span className={styles.dot} /> All exports are watermarked with operator identity and review timestamps.
            </div>
            <Button variant="primary" iconLeft={<Download size={13} />}>Generate PDF</Button>
          </div>
        </Panel>
      </section>

      <Panel title={`Generated reports (${reports.length})`} subtitle="Most recent first" padded={false}>
        <ul className={styles.reports}>
          {reports.map((r) => {
            const author = users.find((u) => u.id === r.generatedBy);
            return (
              <li key={r.id} className={styles.report}>
                <div>
                  <div className={styles.repHead}>
                    <Badge tone={KIND_TONE[r.kind]}>{KIND_LABEL[r.kind]}</Badge>
                    <span className={styles.repTitle}>{r.title}</span>
                  </div>
                  <div className={styles.repMeta}>
                    <span>{author?.name ?? 'unknown'}</span>
                    <span>·</span>
                    <span>generated {relTime(r.generatedAt)}</span>
                    <span>·</span>
                    <span>range {dateTime(r.rangeFrom)} → {dateTime(r.rangeTo)}</span>
                    <span>·</span>
                    <span>{bytes(r.sizeBytes)}</span>
                  </div>
                  <p className={styles.repSummary}>{r.summary}</p>
                </div>
                <div className={styles.repActions}>
                  <Button variant="ghost" iconLeft={<Share2 size={13} />}>Share</Button>
                  <Button variant="subtle" iconLeft={<Download size={13} />}>PDF</Button>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title="Audit log" subtitle="Operator actions over the last 24h" padded={false}>
        <ul className={styles.auditList}>
          {auditRecent.length === 0 && <li className={styles.auditEmpty}>No audit entries in the last 24 hours.</li>}
          {auditRecent.map((e) => (
            <li key={e.id} className={styles.auditRow}>
              <History size={14} className={styles.auditIcon} />
              <div className={styles.auditBody}>
                <div className={styles.auditAction}>
                  <span className={styles.auditMono}>{e.action}</span>
                  <span className={styles.auditTarget}>{e.target}</span>
                </div>
                <div className={styles.auditMeta}>
                  {e.actorName} · {dateTime(e.at)}
                  {e.detail && <> · {e.detail}</>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </PageContainer>
  );
}
