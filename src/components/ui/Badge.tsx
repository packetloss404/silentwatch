import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import styles from './Badge.module.scss';

export type BadgeTone =
  | 'neutral'
  | 'cyan'
  | 'amber'
  | 'red'
  | 'green'
  | 'violet'
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'info'
  | 'known'
  | 'unknown'
  | 'suspicious'
  | 'hostile'
  | 'ignored';

interface BadgeProps {
  tone?: BadgeTone;
  dot?: boolean;
  outline?: boolean;
  size?: 'sm' | 'md';
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', dot, outline, size = 'sm', children, className }: BadgeProps) {
  return (
    <span className={clsx(styles.badge, styles[tone], outline && styles.outline, styles[size], className)}>
      {dot && <span className={styles.dot} />}
      {children}
    </span>
  );
}
