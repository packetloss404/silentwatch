'use client';

import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import styles from './chart.module.scss';

export interface Slice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  data: Slice[];
  height?: number;
  inner?: number;
  outer?: number;
  centerLabel?: string;
  centerSub?: string;
}

export function Donut({ data, height = 180, inner = 50, outer = 70, centerLabel, centerSub }: Props) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  return (
    <div className={styles.donutWrap} style={{ height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            innerRadius={inner}
            outerRadius={outer}
            paddingAngle={1}
            dataKey="value"
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((d) => (
              <Cell key={d.label} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className={styles.center}>
        <div className={styles.centerVal}>{centerLabel ?? total}</div>
        {centerSub && <div className={styles.centerSub}>{centerSub}</div>}
      </div>
      <ul className={styles.legend}>
        {data.map((d) => (
          <li key={d.label}>
            <span className={styles.legendDot} style={{ background: d.color }} />
            <span className={styles.legendLabel}>{d.label}</span>
            <span className={styles.legendVal}>{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
