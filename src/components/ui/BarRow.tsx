import styles from './BarRow.module.scss';

interface Props {
  data: number[];
  /** Per-bar tooltips (length matches data). */
  tips?: string[];
  /** Optional labels under bars. */
  labels?: string[];
  height?: number;
  color?: string;
}

/** Tiny inline bar row — no recharts overhead, perfect for hour-of-day strips. */
export function BarRow({ data, tips, labels, height = 36, color = '#4aa8c8' }: Props) {
  const max = Math.max(1, ...data);
  return (
    <div className={styles.wrap}>
      <div className={styles.row} style={{ height }}>
        {data.map((v, i) => (
          <div
            key={i}
            className={styles.bar}
            title={tips?.[i] ?? `${v}`}
            style={{
              height: `${(v / max) * 100}%`,
              background: v === 0 ? 'transparent' : color,
              opacity: v === 0 ? 0 : 0.55 + (v / max) * 0.45,
            }}
          />
        ))}
      </div>
      {labels && (
        <div className={styles.labels}>
          {labels.map((l, i) => (
            <span key={i} className={styles.label}>
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
