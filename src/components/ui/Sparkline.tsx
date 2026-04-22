'use client';

import { useId } from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
  strokeWidth?: number;
}

export function Sparkline({
  data,
  width = 96,
  height = 24,
  color = 'currentColor',
  fill = true,
  strokeWidth = 1.25,
}: SparklineProps) {
  const id = useId();
  if (!data || data.length === 0) return <svg width={width} height={height} aria-hidden />;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = Math.max(1, max - min);
  const step = data.length > 1 ? width / (data.length - 1) : width;

  const pts = data.map((v, i) => [i * step, height - ((v - min) / span) * (height - 2) - 1] as const);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
  const area = `${line} L${width.toFixed(2)},${height} L0,${height} Z`;

  const gid = `spark-${id}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.32" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
