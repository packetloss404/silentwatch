import { clsx } from 'clsx';
import { adapter } from '@/lib/mock/adapter';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import btnStyles from '@/components/ui/Button.module.scss';
import { StatBlock } from '@/components/ui/StatBlock';
import { SeverityBadge, ClassificationBadge } from '@/components/ui/Severity';
import { Sparkline } from '@/components/ui/Sparkline';
import { AreaTrend } from '@/components/charts/AreaTrend';
import { Donut } from '@/components/charts/Donut';
import { BarsChart } from '@/components/charts/Bars';
import { compact, dateTime, relTime, shortDate } from '@/lib/format';
import { ArrowUpRight, CarFront, ChevronRight, Download, MoonStar, RefreshCw, ScanSearch, Users } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.scss';

export const dynamic = 'force-static';

export default async function DashboardPage() {
  const [site, alerts, signals, incidents, density, detections, audit, baselines, vehicles, patterns, occupancy, assets] = await Promise.all([
    adapter.getSite(),
    adapter.listAlerts(),
    adapter.listSignals(),
    adapter.listIncidents(),
    adapter.signalDensity(),
    adapter.detections(),
    adapter.listAudit(),
    adapter.listBaselines(),
    adapter.listVehicles(),
    adapter.listPatterns(),
    adapter.listOccupancy(),
    adapter.listAssets(),
  ]);
  const activeBaseline = baselines.find((b) => b.active) ?? baselines[0];
  const baselineDiffs = await adapter.listBaselineDiffs(activeBaseline?.id);

  // ── New surfaces (LPR, IR, occupancy, patterns)
  const newPlatesToday = vehicles.filter((v) => +new Date(v.firstSeen) > Date.now() - 86400000).length;
  const flaggedSeenToday = vehicles
    .filter((v) => v.classification === 'flagged' && +new Date(v.lastSeen) > Date.now() - 86400000)
    .length;
  const afterHoursVehicles = vehicles
    .map((v) => (v.visitsByHour ?? []).reduce((acc, c, h) => acc + (h >= 22 || h <= 5 ? c : 0), 0))
    .reduce((a, b) => a + b, 0);
  const occupancyAfterHours = occupancy.filter((e) => e.afterHours && e.count > 0).length;
  const lprCameras = assets.filter((a) => a.type === 'lpr-camera').length;
  const irCameras = assets.filter((a) => a.type === 'ir-camera').length;
  const topRepeats = [...vehicles]
    .filter((v) => v.classification === 'repeat' || v.classification === 'flagged')
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const recentPatterns = [...patterns]
    .sort((a, b) => +new Date(b.detectedAt) - +new Date(a.detectedAt))
    .slice(0, 4);

  const now = Date.now();
  const weekAgo = now - 7 * 86400000;
  const dayAgo = now - 86400000;
  const openIncidents = incidents.filter((i) => i.status !== 'resolved' && i.status !== 'dismissed');
  const unackAlerts = alerts.filter((a) => !a.acknowledged);
  const newUnknownInWeek = signals.filter(
    (s) => (s.classification === 'unknown' || s.classification === 'suspicious') && +new Date(s.firstSeen) > weekAgo,
  );
  const newUnknown = [...newUnknownInWeek]
    .sort((a, b) => +new Date(b.firstSeen) - +new Date(a.firstSeen))
    .slice(0, 6);
  const newUnknownWeekCount = newUnknownInWeek.length;
  const openedLast24h = incidents.filter((i) => +new Date(i.openedAt) > dayAgo).length;
  const highSeverityOpen = openIncidents.filter((i) => i.severity === 'high' || i.severity === 'critical').length;
  const recentDetections = signals
    .slice()
    .sort((a, b) => +new Date(b.lastSeen) - +new Date(a.lastSeen))
    .slice(0, 8);

  const driftOpen = baselineDiffs.filter((d) => !d.resolved).length;

  // Zone heatmap mock — derived counts per zone (kept as a tidy visual block).
  const zoneActivity = [
    { name: 'North Perimeter', value: 38 },
    { name: 'South Perimeter', value: 22 },
    { name: 'Main Yard', value: 71 },
    { name: 'Operations Building', value: 89 },
    { name: 'Visitor Parking', value: 54 },
    { name: 'Utility Yard', value: 17 },
  ];
  const maxZone = Math.max(...zoneActivity.map((z) => z.value));

  const classCounts = {
    known: signals.filter((s) => s.classification === 'known').length,
    unknown: signals.filter((s) => s.classification === 'unknown').length,
    suspicious: signals.filter((s) => s.classification === 'suspicious').length,
    ignored: signals.filter((s) => s.classification === 'ignored').length,
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Command Dashboard"
        title={`${site.name} — operating posture`}
        description="Live overview of detections, environment integrity, and operator workload across the site."
        meta={
          <>
            <Badge tone="green" dot size="sm">All ingest pipelines online</Badge>
            <span>· last refresh {relTime(new Date().toISOString())}</span>
            <span>· timezone {site.timezone}</span>
          </>
        }
        actions={
          <>
            <Button variant="ghost" iconLeft={<RefreshCw size={13} />}>Refresh</Button>
            <Button variant="subtle" iconLeft={<Download size={13} />}>Snapshot</Button>
            <Link
              href="/incidents"
              className={clsx(btnStyles.btn, btnStyles.primary, btnStyles.sm)}
              style={{ textDecoration: 'none' }}
            >
              <span className={btnStyles.label}>Open queue</span>
              <span className={btnStyles.icon}>
                <ChevronRight size={13} />
              </span>
            </Link>
          </>
        }
      />

      <section className={styles.stats}>
        <StatBlock
          label="Open incidents"
          value={openIncidents.length}
          tone="amber"
          delta={<Badge tone="amber" size="sm">+{openedLast24h} last 24h</Badge>}
          hint={highSeverityOpen > 0 ? `${highSeverityOpen} high or critical in queue` : 'None elevated'}
        />
        <StatBlock
          label="Unacknowledged alerts"
          value={unackAlerts.length}
          tone="red"
          delta={<Badge tone="red" size="sm">{alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length} critical</Badge>}
          hint="Across all sources"
        />
        <StatBlock
          label="New / unknown devices"
          value={signals.filter((s) => s.classification === 'unknown').length}
          tone="cyan"
          delta={<Badge tone="cyan" size="sm">+{newUnknownWeekCount} this week</Badge>}
          hint="Pending operator triage"
        />
        <StatBlock
          label="Baseline drift findings"
          value={driftOpen}
          tone="amber"
          delta={<Badge tone="amber" size="sm">vs Q1-2026</Badge>}
          hint="Open audit findings"
        />
        <StatBlock
          label="Devices observed (24h)"
          value={compact(signals.reduce((acc, s) => acc + (s.history?.[s.history.length - 1] ?? 0), 0))}
          tone="green"
          hint="Across Wi-Fi, BT and BLE"
        />
      </section>

      <section className={styles.gridA}>
        <Panel
          title="Signal density (24h)"
          subtitle="Per 30-minute bucket. Wi-Fi / Bluetooth / BLE."
          actions={<Badge size="sm">live</Badge>}
        >
          <AreaTrend
            data={density as unknown as Array<Record<string, string | number>>}
            series={[
              { key: 'wifi', label: 'Wi-Fi', color: '#4aa8c8' },
              { key: 'bluetooth', label: 'Bluetooth', color: '#8a7ac8' },
              { key: 'ble', label: 'BLE', color: '#5fa37a' },
            ]}
            height={220}
          />
        </Panel>

        <Panel title="Signal classification" subtitle="Current inventory mix">
          <Donut
            data={[
              { label: 'Known', value: classCounts.known, color: '#5fa37a' },
              { label: 'Unknown', value: classCounts.unknown, color: '#67738a' },
              { label: 'Suspicious', value: classCounts.suspicious, color: '#c89f4a' },
              { label: 'Ignored', value: classCounts.ignored, color: '#4a5468' },
            ]}
            centerLabel={signals.length.toString()}
            centerSub="signals"
            height={220}
          />
        </Panel>
      </section>

      <section className={styles.gridB}>
        <Panel
          title="Active alerts"
          subtitle={`${unackAlerts.length} unacknowledged · ${alerts.length} total`}
          actions={<Link href="/incidents" className={styles.linkAction}>Triage <ChevronRight size={12} /></Link>}
          padded={false}
        >
          <ul className={styles.alertList}>
            {alerts.slice(0, 6).map((a) => (
              <li key={a.id} className={styles.alertItem}>
                <div className={styles.alertSev}>
                  <SeverityBadge severity={a.severity} />
                </div>
                <div className={styles.alertBody}>
                  <div className={styles.alertTitle}>{a.title}</div>
                  <div className={styles.alertMeta}>
                    <span>{a.source}</span>
                    <span>·</span>
                    <span>{relTime(a.createdAt)}</span>
                    {!a.acknowledged && (
                      <>
                        <span>·</span>
                        <Badge tone="amber" size="sm">unack</Badge>
                      </>
                    )}
                  </div>
                </div>
                <Link href="/incidents" className={styles.alertCta} aria-label="Open">
                  <ArrowUpRight size={14} />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Incidents in progress"
          subtitle={`${openIncidents.length} open · ${incidents.filter(i=>i.status==='investigating').length} investigating`}
          actions={<Link href="/incidents" className={styles.linkAction}>All <ChevronRight size={12} /></Link>}
          padded={false}
        >
          <ul className={styles.incidentList}>
            {openIncidents.slice(0, 5).map((i) => (
              <li key={i.id}>
                <Link href="/incidents" className={styles.incidentRow}>
                  <SeverityBadge severity={i.severity} />
                  <div className={styles.incidentBody}>
                    <div className={styles.incidentTitle}>{i.title}</div>
                    <div className={styles.incidentMeta}>
                      <span>{i.id}</span>
                      <span>·</span>
                      <span>{i.status}</span>
                      <span>·</span>
                      <span>updated {relTime(i.updatedAt)}</span>
                    </div>
                  </div>
                  <span className={styles.incidentTags}>
                    {i.tags?.map((t) => <span key={t} className={styles.tagChip}>{t}</span>)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      {/* ── LPR / Patterns / IR row ── */}
      <section className={styles.gridStats2}>
        <StatBlock
          label="New plates today"
          value={newPlatesToday}
          tone="cyan"
          delta={<Badge tone="cyan" size="sm">{lprCameras} LPR cams</Badge>}
          hint="First observation in last 24h"
        />
        <StatBlock
          label="Flagged plate hits today"
          value={flaggedSeenToday}
          tone="red"
          hint="Operator-defined advisory list"
        />
        <StatBlock
          label="After-hours vehicle activity"
          value={afterHoursVehicles}
          tone="amber"
          delta={<Badge tone="amber" size="sm">22:00–05:00</Badge>}
          hint="Across last 7 days"
        />
        <StatBlock
          label="After-hours presence buckets"
          value={occupancyAfterHours}
          tone="amber"
          delta={<Badge tone="cyan" size="sm">{irCameras} IR cams</Badge>}
          hint="Anonymous occupancy detections"
        />
      </section>

      <section className={styles.gridB}>
        <Panel
          title="Top repeat / flagged vehicles"
          subtitle="Last 7 days · operator-relevant plates"
          actions={<Link href="/vehicles" className={styles.linkAction}>Vehicles <ChevronRight size={12} /></Link>}
          padded={false}
        >
          <ul className={styles.repeatList}>
            {topRepeats.length === 0 && <li className={styles.repeatEmpty}>No repeat or flagged plates yet.</li>}
            {topRepeats.map((v) => (
              <li key={v.id} className={styles.repeatRow}>
                <CarFront size={14} className={styles.repeatIcon} />
                <div className={styles.repeatBody}>
                  <div className={styles.repeatPlate}>
                    {v.plateMasked}
                    <Badge
                      tone={v.classification === 'flagged' ? 'amber' : 'cyan'}
                      size="sm"
                    >
                      {v.classification}
                    </Badge>
                  </div>
                  <div className={styles.repeatMeta}>
                    <span>{v.color} {v.vehicleClass}</span>
                    <span>·</span>
                    <span>{v.count} obs</span>
                    <span>·</span>
                    <span>last {relTime(v.lastSeen)}</span>
                  </div>
                </div>
                <Link href="/vehicles" className={styles.alertCta} aria-label="Open">
                  <ArrowUpRight size={14} />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Recent pattern findings"
          subtitle="Repeat-visitor, after-hours, dwell anomalies"
          actions={<Link href="/patterns" className={styles.linkAction}>Patterns <ChevronRight size={12} /></Link>}
          padded={false}
        >
          <ul className={styles.patternList}>
            {recentPatterns.map((p) => (
              <li key={p.id} className={styles.patternRow}>
                <span className={styles.patternIcon}>
                  {p.kind.startsWith('after-hours') ? <MoonStar size={13} /> :
                   p.kind === 'unusual-dwell' ? <Users size={13} /> :
                   <ScanSearch size={13} />}
                </span>
                <div className={styles.patternBody}>
                  <div className={styles.patternSubject}>{p.subject}</div>
                  <div className={styles.patternMeta}>
                    <SeverityBadge severity={p.severity} />
                    <span>·</span>
                    <span>{relTime(p.detectedAt)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <section className={styles.gridC}>
        <Panel title="Zone activity (24h)" subtitle="Detections per zone — heat scaled to busiest zone">
          <ul className={styles.zoneList}>
            {zoneActivity.map((z) => (
              <li key={z.name} className={styles.zoneRow}>
                <span className={styles.zoneName}>{z.name}</span>
                <div className={styles.zoneBar}>
                  <div
                    className={styles.zoneBarFill}
                    style={{ width: `${(z.value / maxZone) * 100}%` }}
                  />
                </div>
                <span className={styles.zoneVal}>{z.value}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Detections per hour" subtitle="Aggregate sensor + signal events">
          <BarsChart data={detections} height={210} />
        </Panel>

        <Panel
          title="New & unknown devices"
          subtitle="First seen within the last 7 days"
          actions={<Link href="/signals" className={styles.linkAction}>Signals <ChevronRight size={12} /></Link>}
          padded={false}
        >
          <ul className={styles.unknownList}>
            {newUnknown.map((s) => (
              <li key={s.id} className={styles.unknownRow}>
                <div>
                  <div className={styles.unknownAlias}>{s.alias}</div>
                  <div className={styles.unknownMeta}>
                    <span className={styles.mono}>{s.identifier}</span>
                    <span>·</span>
                    <span>{s.band}</span>
                    <span>·</span>
                    <span>seen {relTime(s.firstSeen)}</span>
                  </div>
                </div>
                <div className={styles.unknownRight}>
                  <Sparkline data={s.history ?? []} color="#4aa8c8" width={64} height={20} />
                  <ClassificationBadge value={s.classification} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <section className={styles.gridD}>
        <Panel
          title="Recent detections"
          subtitle="Most recently observed signals"
          padded={false}
          actions={<Link href="/signals" className={styles.linkAction}>Open <ChevronRight size={12} /></Link>}
        >
          <ul className={styles.detList}>
            {recentDetections.map((s) => (
              <li key={s.id} className={styles.detRow}>
                <span className={styles.detTime}>{shortDate(s.lastSeen)}</span>
                <span className={styles.detAlias}>{s.alias}</span>
                <span className={styles.detBand}>{s.band}</span>
                <ClassificationBadge value={s.classification} />
                <span className={styles.detRssi} title="signal strength">{s.rssi} dBm</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Operator activity"
          subtitle="Recent actions in the audit log"
          padded={false}
          actions={<Link href="/reports" className={styles.linkAction}>Audit <ChevronRight size={12} /></Link>}
        >
          <ul className={styles.auditList}>
            {audit.slice(0, 6).map((e) => (
              <li key={e.id} className={styles.auditRow}>
                <div>
                  <div className={styles.auditAction}>{e.action}</div>
                  <div className={styles.auditMeta}>
                    {e.actorName} · {e.target}
                  </div>
                </div>
                <span className={styles.auditTime}>{dateTime(e.at)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </section>
    </PageContainer>
  );
}
