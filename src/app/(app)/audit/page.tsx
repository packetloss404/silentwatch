import { adapter } from '@/lib/mock/adapter';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatBlock } from '@/components/ui/StatBlock';
import { SeverityBadge } from '@/components/ui/Severity';
import { Donut } from '@/components/charts/Donut';
import { dateTime, relTime } from '@/lib/format';
import { CheckCircle2, ChevronRight, FileDown, ListChecks, ShieldAlert } from 'lucide-react';
import styles from './page.module.scss';

export const dynamic = 'force-static';

const KIND_LABEL: Record<string, string> = {
  'rogue-access-point': 'Rogue access point',
  'unknown-network-device': 'Unknown network device',
  'unusual-bluetooth': 'Unusual Bluetooth',
  'exposed-service': 'Exposed service',
  'asset-missing': 'Asset missing',
  'asset-relocated': 'Asset relocated',
  'misconfigured-camera': 'Misconfigured camera',
};

export default async function AuditPage() {
  const [baselines, network] = await Promise.all([adapter.listBaselines(), adapter.listNetwork()]);

  const active = baselines.find((b) => b.active) ?? baselines[0];
  const diffs = await adapter.listBaselineDiffs(active?.id);
  const open = diffs.filter((d) => !d.resolved);
  const resolved = diffs.filter((d) => d.resolved);

  const sevCounts = {
    critical: open.filter((d) => d.severity === 'critical').length,
    high: open.filter((d) => d.severity === 'high').length,
    medium: open.filter((d) => d.severity === 'medium').length,
    low: open.filter((d) => d.severity === 'low').length,
    info: open.filter((d) => d.severity === 'info').length,
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Operations"
        title="Privacy audit"
        description="Compare the current environment to an approved baseline. Surface drift, identify rogue or misconfigured devices, and ship a remediation checklist."
        meta={
          <>
            <Badge tone="cyan" dot size="sm">Active baseline · {active.name}</Badge>
            <span>captured {relTime(active.createdAt)}</span>
          </>
        }
        actions={
          <>
            <Button variant="ghost" iconLeft={<ListChecks size={13} />}>New baseline</Button>
            <Button variant="subtle" iconLeft={<FileDown size={13} />}>Drift report</Button>
            <Button variant="primary" iconRight={<ChevronRight size={13} />}>Run comparison</Button>
          </>
        }
      />

      <section className={styles.stats}>
        <StatBlock
          label="Open findings"
          value={open.length}
          tone="amber"
          delta={<Badge tone="red" size="sm">{sevCounts.high + sevCounts.critical} elevated</Badge>}
          hint={`${resolved.length} resolved this cycle`}
        />
        <StatBlock label="Network devices observed" value={network.length} tone="cyan" hint="Across owned subnets" />
        <StatBlock
          label="Baseline assets"
          value={active.assetCount}
          tone="green"
          hint={`Signals ${active.signalCount} · Net ${active.networkCount}`}
        />
        <StatBlock
          label="Baseline age"
          value={relTime(active.createdAt)}
          tone="neutral"
          hint="Recommend re-capturing every 90 days"
        />
      </section>

      <section className={styles.row}>
        <Panel title="Drift by severity" subtitle="Open findings only">
          <Donut
            data={[
              { label: 'Critical', value: sevCounts.critical, color: '#c8584a' },
              { label: 'High', value: sevCounts.high, color: '#d97c4a' },
              { label: 'Medium', value: sevCounts.medium, color: '#c89f4a' },
              { label: 'Low', value: sevCounts.low, color: '#4aa8c8' },
              { label: 'Info', value: sevCounts.info, color: '#67738a' },
            ]}
            centerLabel={open.length.toString()}
            centerSub="open"
            height={210}
          />
        </Panel>

        <Panel title="Baseline workflow" subtitle="Three-step audit cycle">
          <ol className={styles.steps}>
            <li className={styles.stepDone}>
              <span className={styles.stepNum}>1</span>
              <div>
                <div className={styles.stepTitle}>Capture baseline</div>
                <div className={styles.stepBody}>{active.name} captured {relTime(active.createdAt)} · {active.signalCount} signals · {active.networkCount} net · {active.assetCount} assets.</div>
              </div>
            </li>
            <li className={styles.stepDone}>
              <span className={styles.stepNum}>2</span>
              <div>
                <div className={styles.stepTitle}>Compare to current</div>
                <div className={styles.stepBody}>
                  {open.length === 0
                    ? 'No open findings from the last comparison to baseline.'
                    : `Last comparison ran ${relTime(open[0]!.detectedAt)} — ${open.length} open findings.`}
                </div>
              </div>
            </li>
            <li className={styles.stepActive}>
              <span className={styles.stepNum}>3</span>
              <div>
                <div className={styles.stepTitle}>Remediate</div>
                <div className={styles.stepBody}>Work the checklist below; close findings as resolved or document an exception.</div>
              </div>
            </li>
          </ol>
        </Panel>
      </section>

      <Panel
        title={`Drift findings (${open.length})`}
        subtitle="Compared against active baseline. Sorted by severity."
        padded={false}
      >
        <ul className={styles.findings}>
          {[...open].sort((a, b) => severityRank(b.severity) - severityRank(a.severity)).map((d) => (
            <li key={d.id} className={styles.finding}>
              <div className={styles.findingHead}>
                <div className={styles.findingTitle}>
                  <ShieldAlert size={14} className={styles.findingIcon} />
                  <span>{KIND_LABEL[d.kind] ?? d.kind}</span>
                </div>
                <div className={styles.findingMeta}>
                  <SeverityBadge severity={d.severity} />
                  <span>detected {relTime(d.detectedAt)}</span>
                </div>
              </div>
              <div className={styles.findingSubject}>{d.subject}</div>
              <p className={styles.findingDetail}>{d.detail}</p>
              <div className={styles.findingFix}>
                <span className={styles.findingFixLabel}>Suggested remediation</span>
                <span className={styles.findingFixText}>{d.remediation}</span>
              </div>
              <div className={styles.findingActions}>
                <Button variant="ghost">Document exception</Button>
                <Button variant="subtle">Open incident</Button>
                <Button variant="primary" iconLeft={<CheckCircle2 size={13} />}>Mark resolved</Button>
              </div>
            </li>
          ))}
          {open.length === 0 && <li className={styles.emptyRow}>No open drift findings — environment matches baseline.</li>}
        </ul>
      </Panel>

      {resolved.length > 0 && (
        <Panel title={`Resolved (${resolved.length})`} subtitle="Recently closed findings" padded={false}>
          <ul className={styles.resolvedList}>
            {resolved.map((d) => (
              <li key={d.id}>
                <CheckCircle2 size={14} className={styles.resolvedIcon} />
                <div>
                  <div className={styles.resolvedTitle}>{KIND_LABEL[d.kind] ?? d.kind} — {d.subject}</div>
                  <div className={styles.resolvedMeta}>
                    <SeverityBadge severity={d.severity} /> · detected {dateTime(d.detectedAt)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </PageContainer>
  );
}

function severityRank(s: string): number {
  return { critical: 4, high: 3, medium: 2, low: 1, info: 0 }[s] ?? 0;
}
