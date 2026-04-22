import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import styles from './StatBlock.module.scss';

interface StatBlockProps {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  hint?: ReactNode;
  tone?: 'neutral' | 'cyan' | 'amber' | 'red' | 'green';
  className?: string;
}

export function StatBlock({ label, value, delta, hint, tone = 'neutral', className }: StatBlockProps) {
  return (
    <div className={clsx(styles.stat, styles[tone], className)}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
      {(delta || hint) && (
        <div className={styles.foot}>
          {delta && <span className={styles.delta}>{delta}</span>}
          {hint && <span className={styles.hint}>{hint}</span>}
        </div>
      )}
    </div>
  );
}
