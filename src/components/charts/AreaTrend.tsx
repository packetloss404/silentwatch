'use client';

import { useId } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { shortTime } from '@/lib/format';
import styles from './chart.module.scss';

export interface Series {
  key: string;
  label: string;
  color: string;
}

interface Props {
  data: Array<Record<string, string | number>>;
  xKey?: string;
  series: Series[];
  height?: number;
  yLabel?: string;
}

export function AreaTrend({ data, xKey = 't', series, height = 200, yLabel }: Props) {
  const chartId = useId().replace(/:/g, '');
  return (
    <div className={styles.chart} style={{ height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`${chartId}-g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.32} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="#1f2533" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey={xKey}
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
            label={
              yLabel
                ? { value: yLabel, angle: -90, position: 'insideLeft', fill: '#67738a', fontSize: 10 }
                : undefined
            }
          />
          <Tooltip
            cursor={{ stroke: '#323a4d', strokeDasharray: '2 2' }}
            contentStyle={{
              background: '#161b24',
              border: '1px solid #262d3d',
              borderRadius: 6,
              fontSize: 12,
              color: '#e6ecf3',
              padding: '8px 10px',
            }}
            labelStyle={{ color: '#9aa6b8', marginBottom: 4 }}
            labelFormatter={(v: string) => shortTime(v)}
          />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={1.5}
              fill={`url(#${chartId}-g-${s.key})`}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
