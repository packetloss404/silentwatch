import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import styles from './Panel.module.scss';

interface PanelProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  padded?: boolean;
  raised?: boolean;
  className?: string;
  children: ReactNode;
}

export function Panel({ title, subtitle, actions, padded = true, raised, className, children }: PanelProps) {
  return (
    <section className={clsx(styles.panel, raised && styles.raised, className)}>
      {(title || actions) && (
        <header className={styles.header}>
          <div className={styles.titles}>
            {title && <h3 className={styles.title}>{title}</h3>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
      )}
      <div className={clsx(styles.body, !padded && styles.flush)}>{children}</div>
    </section>
  );
}
