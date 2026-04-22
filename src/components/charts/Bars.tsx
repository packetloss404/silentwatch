'use client';

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { shortTime } from '@/lib/format';
import styles from './chart.module.scss';

interface Props {
  data: Array<{ t: string; v: number }>;
  height?: number;
  color?: string;
}

function hexToRgbaFill(hex: string, alpha: number) {
  if (!hex.startsWith('#') || (hex.length !== 7 && hex.length !== 9)) {
    return `rgba(74, 168, 200, ${alpha})`;
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function BarsChart({ data, height = 160, color = '#4aa8c8' }: Props) {
  return (
    <div className={styles.chart} style={{ height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#1f2533" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="t"
            tick={{ fill: '#67738a', fontSize: 10 }}
            tickFormatter={(v: string) => shortTime(v)}
            stroke="#262d3d"
            tickLine={false}
            axisLine={false}
            minTickGap={32}
          />
          <YAxis
            tick={{ fill: '#67738a', fontSize: 10 }}
            stroke="#262d3d"
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip
            cursor={{ fill: hexToRgbaFill(color, 0.06) }}
            contentStyle={{
              background: '#161b24',
              border: '1px solid #262d3d',
              borderRadius: 6,
              fontSize: 12,
              color: '#e6ecf3',
            }}
            labelFormatter={(v: string) => shortTime(v)}
          />
          <Bar dataKey="v" fill={color} radius={[2, 2, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
