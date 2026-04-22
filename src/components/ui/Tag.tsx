import type { ReactNode } from 'react';
import styles from './Tag.module.scss';

export function TagPill({ children }: { children: ReactNode }) {
  return <span className={styles.tag}>{children}</span>;
}

export function TagList({ tags }: { tags?: string[] }) {
  if (!tags || tags.length === 0) return <span className={styles.empty}>—</span>;
  return (
    <span className={styles.list}>
      {tags.map((t) => (
        <TagPill key={t}>{t}</TagPill>
      ))}
    </span>
  );
}
