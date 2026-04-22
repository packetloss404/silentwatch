import styles from './Heatmap.module.scss';

interface Props {
  /** rows × cols matrix of values. */
  data: number[][];
  rowLabels: string[];
  colLabels: string[];
  /** column highlight band (start inclusive, end exclusive). */
  band?: { from: number; to: number; label?: string };
  /** Extra bands (e.g. 00:00–06:00) for overnight ranges that wrap past midnight. */
  extraBands?: { from: number; to: number }[];
  /** color stops */
  color?: string;
}

/**
 * Compact 2D heatmap (typically 7 days × 24 hours). Renders as a CSS grid of
 * cells with opacity scaled to the cell value. No JS dependency — works in
 * server components.
 */
export function Heatmap({ data, rowLabels, colLabels, band, extraBands, color = '#4aa8c8' }: Props) {
  let max = 1;
  for (const row of data) for (const v of row) if (v > max) max = v;

  const inBand = (c: number) =>
    (band != null && c >= band.from && c < band.to) ||
    (extraBands?.some((b) => c >= b.from && c < b.to) ?? false);

  return (
    <div className={styles.wrap}>
      <div className={styles.colLabels} style={{ gridTemplateColumns: `48px repeat(${colLabels.length}, 1fr)` }}>
        <span />
        {colLabels.map((c, i) => (
          <span key={i} className={`${styles.colLabel} ${inBand(i) ? styles.bandLabel : ''}`}>
            {c}
          </span>
        ))}
      </div>
      <div className={styles.grid} style={{ gridTemplateColumns: `48px repeat(${colLabels.length}, 1fr)` }}>
        {rowLabels.map((label, r) => (
          <div key={label} className={styles.rowGroup} style={{ display: 'contents' }}>
            <span className={styles.rowLabel}>{label}</span>
            {data[r]?.map((v, c) => {
              const intensity = max === 0 ? 0 : v / max;
              return (
                <span
                  key={c}
                  className={`${styles.cell} ${inBand(c) ? styles.bandCell : ''}`}
                  title={`${label} ${colLabels[c]}: ${v}`}
                  style={{
                    background:
                      v === 0 ? 'rgba(255,255,255,0.02)' : color,
                    opacity: v === 0 ? 1 : 0.18 + intensity * 0.82,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      {band?.label && (
        <div className={styles.bandLegend}>
          <span className={styles.bandSwatch} />
          {band.label}
        </div>
      )}
    </div>
  );
}
