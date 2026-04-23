import { adapter } from '@/lib/mock/adapter';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatBlock } from '@/components/ui/StatBlock';
import { Heatmap } from '@/components/charts/Heatmap';
import { BarRow } from '@/components/ui/BarRow';
import { SeverityBadge } from '@/components/ui/Severity';
import { CheckCircle2, Clock, MoonStar, RefreshCw, Repeat, Sigma } from 'lucide-react';
import { compact, relTime } from '@/lib/format';
import { DataMinimizationBanner } from '@/components/governance/DataMinimizationBanner';
import type { OccupancyEvent, PatternFinding, VehicleObservation } from '@/lib/types';
import styles from './page.module.scss';

export const dynamic = 'force-static';

export default async function PatternsPage() {
  const [vehicles, occupancy, patterns, zones] = await Promise.all([
    adapter.listVehicles(),
    adapter.listOccupancy(),
    adapter.listPatterns(),
    adapter.listZones(),
  ]);

  // ── Top repeat vehicles
  const repeats = [...vehicles]
    .filter((v) => v.classification !== 'expected' && v.count >= 3)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // ── After-hours vehicles (visits between 22:00-05:00)
  const afterHours = vehicles
    .map((v) => {
      const ah = (v.visitsByHour ?? []).reduce((acc, c, h) => acc + (h >= 22 || h <= 5 ? c : 0), 0);
      return { v, ah };
    })
    .filter((x) => x.ah > 0)
    .sort((a, b) => b.ah - a.ah)
    .slice(0, 6);

  // ── Vehicle hour-of-day heatmap (7d × 24h)
  const vehicleHeatmap = buildVehicleHeatmap(vehicles);

  // ── Occupancy heatmap per zone
  const occHeatmaps = zones
    .filter((z) => z.kind !== 'utility' && z.kind !== 'public')
    .map((z) => ({
      zoneName: z.name,
      grid: buildOccupancyHeatmap(occupancy, z.id),
    }))
    .filter((z) => sum2D(z.grid) > 0);

  const totalObservations = vehicles.reduce((acc, v) => acc + v.count, 0);
  const uniquePlates = vehicles.length;
  const flaggedHits = vehicles.filter((v) => v.classification === 'flagged').reduce((a, v) => a + v.count, 0);
  const newToday = vehicles.filter((v) => +new Date(v.firstSeen) > Date.now() - 86400000).length;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Sensors & edge"
        title="Patterns"
        description="Anonymous frequency analysis across cameras, sensors, and LPR — repeat-visitor detection, time-of-day heatmaps, after-hours presence. Counts and patterns only — never identities."
        meta={
          <>
            <Badge tone="cyan" dot size="sm">{patterns.filter((p) => !p.acknowledged).length} active findings</Badge>
            <span>· refreshed {relTime(new Date().toISOString())}</span>
          </>
        }
        actions={
          <>
            <Button variant="ghost" iconLeft={<RefreshCw size={13} />}>Re-analyze</Button>
            <Button variant="primary">Open queue</Button>
          </>
        }
      />

      <DataMinimizationBanner variant="patterns" />

      <section className={styles.stats}>
        <StatBlock
          label="Plate observations (7d)"
          value={compact(totalObservations)}
          tone="cyan"
          delta={<Badge tone="cyan" size="sm">{uniquePlates} unique</Badge>}
          hint="Across LPR-equipped cameras"
        />
        <StatBlock
          label="New plates today"
          value={newToday}
          tone="amber"
          hint="First observation in the last 24h"
        />
        <StatBlock
          label="After-hours dwell events"
          value={afterHours.reduce((a, x) => a + x.ah, 0)}
          tone="amber"
          delta={<Badge tone="amber" size="sm">22:00–05:00</Badge>}
        />
        <StatBlock
          label="Watchlist hits (flagged)"
          value={flaggedHits}
          tone="red"
          hint="Operator-defined advisory list"
        />
      </section>

      <section className={styles.row1}>
        <Panel
          title="Vehicle activity by hour"
          subtitle="Aggregated plate captures across last 7 days × 24 hours of day"
          actions={<Badge tone="amber" size="sm">22–05 advisory band</Badge>}
        >
          <Heatmap
            data={vehicleHeatmap}
            rowLabels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
            colLabels={Array.from({ length: 24 }).map((_, i) => (i % 3 === 0 ? `${i.toString().padStart(2, '0')}` : ''))}
            band={{ from: 22, to: 24, label: 'After-hours band — 22:00–05:00 highlighted' }}
            extraBands={[{ from: 0, to: 6 }]}
            color="#4aa8c8"
          />
        </Panel>

        <Panel
          title="Top repeat vehicles"
          subtitle="Frequency anomalies — unique plates seen most over the last 7 days"
          padded={false}
        >
          <ul className={styles.repeatList}>
            {repeats.map((v) => (
              <li key={v.id} className={styles.repeatRow}>
                <div>
                  <div className={styles.repeatPlate}>{v.plateMasked}</div>
                  <div className={styles.repeatMeta}>
                    <span>{v.color} {v.vehicleClass}</span>
                    <span>·</span>
                    <span>last {relTime(v.lastSeen)}</span>
                  </div>
                </div>
                <div className={styles.repeatRight}>
                  <div className={styles.repeatHour}>
                    <BarRow
                      data={v.visitsByHour ?? new Array(24).fill(0)}
                      height={20}
                      color={v.classification === 'flagged' ? '#c89f4a' : '#4aa8c8'}
                    />
                  </div>
                  <div className={styles.repeatCount}>
                    <span className={styles.repeatCountVal}>{v.count}</span>
                    <span className={styles.repeatCountLabel}>obs</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <Panel title={`Pattern findings (${patterns.length})`} subtitle="Distilled signals from the last 7 days" padded={false}>
        <ul className={styles.findings}>
          {patterns.map((p) => (
            <li key={p.id} className={styles.finding}>
              <div className={styles.findingIconWrap}>
                {kindIcon(p.kind)}
              </div>
              <div className={styles.findingBody}>
                <div className={styles.findingHead}>
                  <span className={styles.findingKind}>{kindLabel(p.kind)}</span>
                  <SeverityBadge severity={p.severity} />
                  {p.acknowledged && <Badge tone="green" size="sm">ack</Badge>}
                  <span className={styles.findingTime}>{relTime(p.detectedAt)}</span>
                </div>
                <div className={styles.findingSubject}>{p.subject}</div>
                <p className={styles.findingDetail}>{p.detail}</p>
                <div className={styles.findingEvidence}>
                  <span>{p.evidence}</span>
                </div>
                <PatternExplainBlock p={p} />
                <div className={styles.findingActions}>
                  <Button variant="ghost">Mute</Button>
                  <Button variant="subtle">Open incident</Button>
                  <Button variant="primary" iconLeft={<CheckCircle2 size={13} />}>Acknowledge</Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      {occHeatmaps.length > 0 && <DataMinimizationBanner variant="occupancy" />}

      <section className={styles.row2}>
        {occHeatmaps.map((z) => (
          <Panel
            key={z.zoneName}
            title={`Occupancy — ${z.zoneName}`}
            subtitle="Anonymous person-count totals · 7d × hour of day"
            actions={<Badge size="sm">count-only</Badge>}
          >
            <Heatmap
              data={z.grid}
              rowLabels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
              colLabels={Array.from({ length: 24 }).map((_, i) => (i % 4 === 0 ? `${i.toString().padStart(2, '0')}` : ''))}
              band={{ from: 22, to: 24 }}
              extraBands={[{ from: 0, to: 6 }]}
              color="#5fa37a"
            />
          </Panel>
        ))}
      </section>
    </PageContainer>
  );
}

function buildVehicleHeatmap(vehicles: VehicleObservation[]): number[][] {
  const grid: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  for (const v of vehicles) {
    if (!v.visitsByDay || !v.visitsByHour) continue;
    for (let day = 0; day < 7; day++) {
      const dayWeight = v.visitsByDay[day] ?? 0;
      if (dayWeight === 0) continue;
      for (let hour = 0; hour < 24; hour++) {
        const w = (v.visitsByHour[hour] ?? 0) * dayWeight;
        if (w > 0) grid[day][hour] += w;
      }
    }
  }
  return grid;
}

function buildOccupancyHeatmap(events: OccupancyEvent[], zoneId: string): number[][] {
  const grid: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  for (const e of events) {
    if (e.zoneId !== zoneId) continue;
    const d = new Date(e.t);
    const day = (d.getDay() + 6) % 7; // Mon = 0
    const hour = d.getHours();
    grid[day][hour] += e.count;
  }
  return grid;
}

function sum2D(g: number[][]): number {
  let s = 0;
  for (const r of g) for (const v of r) s += v;
  return s;
}

function PatternExplainBlock({ p }: { p: PatternFinding }) {
  if (!p.decision && !p.featureAttributions?.length && !p.matchedRuleIds?.length) {
    return null;
  }
  const attrs = p.featureAttributions ?? [];
  const maxA = Math.max(0.01, ...attrs.map((a) => Math.abs(a.contribution)));

  return (
    <div className={styles.findingExplain}>
      {p.explanationMode && (
        <div className={styles.explainPill}>
          Mode: <span className={styles.explainPillVal}>{p.explanationMode}</span>
        </div>
      )}
      {p.matchedRuleIds && p.matchedRuleIds.length > 0 && (
        <div className={styles.explainRules}>
          <span className={styles.explainLabel}>Rules</span>
          <ul>
            {p.matchedRuleIds.map((id) => (
              <li key={id} className={styles.monoList}>{id}</li>
            ))}
          </ul>
        </div>
      )}
      {p.decision && (
        <div className={styles.explainDecision}>
          {p.decision.modelVersion && (
            <span>Model <code>{p.decision.modelVersion}</code></span>
          )}
          {p.decision.rulesetVersion && (
            <span>Ruleset <code>{p.decision.rulesetVersion}</code></span>
          )}
          {p.decision.score != null && p.decision.threshold != null && (
            <span>
              Score {p.decision.score} / threshold {p.decision.threshold}
            </span>
          )}
          {p.decision.inputsHash && (
            <div className={styles.inputsHash}>Inputs: {p.decision.inputsHash}</div>
          )}
        </div>
      )}
      {attrs.length > 0 && (
        <div className={styles.explainAttr}>
          <span className={styles.explainLabel}>Feature contributions (relative)</span>
          <ul className={styles.attrList}>
            {attrs.map((a) => (
              <li key={a.featureId} className={styles.attrRow}>
                <div className={styles.attrLabel}>{a.label}</div>
                <div className={styles.attrBarTrack}>
                  <div
                    className={styles.attrBarFill}
                    style={{ width: `${(Math.abs(a.contribution) / maxA) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function kindLabel(k: PatternFinding['kind']): string {
  switch (k) {
    case 'repeat-vehicle': return 'Repeat vehicle';
    case 'after-hours-vehicle': return 'After-hours vehicle';
    case 'after-hours-presence': return 'After-hours presence';
    case 'unusual-dwell': return 'Unusual dwell';
    case 'first-time-vehicle': return 'First-time vehicle';
    case 'recurring-time-of-day': return 'Recurring time-of-day';
  }
}

function kindIcon(k: PatternFinding['kind']) {
  switch (k) {
    case 'after-hours-vehicle':
    case 'after-hours-presence':
      return <MoonStar size={15} />;
    case 'repeat-vehicle':
    case 'recurring-time-of-day':
      return <Repeat size={15} />;
    case 'unusual-dwell':
      return <Clock size={15} />;
    case 'first-time-vehicle':
      return <Sigma size={15} />;
  }
}
