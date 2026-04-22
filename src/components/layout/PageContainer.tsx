import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import styles from './PageContainer.module.scss';

interface PageContainerProps {
  children: ReactNode;
  /** Use 'fluid' for full-bleed pages (Map workspace). */
  variant?: 'default' | 'fluid';
  className?: string;
}

export function PageContainer({ children, variant = 'default', className }: PageContainerProps) {
  return <div className={clsx(styles.container, styles[variant], className)}>{children}</div>;
}
