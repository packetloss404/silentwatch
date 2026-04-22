'use client';

import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import styles from './Segmented.module.scss';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
}

interface Props<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (next: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function Segmented<T extends string>({ value, options, onChange, className, size = 'sm' }: Props<T>) {
  return (
    <div className={clsx(styles.group, styles[size], className)} role="tablist">
      {options.map((opt) => (
        <button
          type="button"
          key={opt.value}
          role="tab"
          aria-selected={opt.value === value}
          className={clsx(styles.btn, opt.value === value && styles.active)}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
