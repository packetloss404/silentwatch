import type { ReactNode } from 'react';
import styles from './KeyValue.module.scss';

interface ItemProps {
  label: ReactNode;
  children: ReactNode;
  mono?: boolean;
}

export function KV({ label, children, mono }: ItemProps) {
  return (
    <div className={styles.row}>
      <dt className={styles.label}>{label}</dt>
      <dd className={mono ? styles.valueMono : styles.value}>{children}</dd>
    </div>
  );
}

export function KVList({ children }: { children: ReactNode }) {
  return <dl className={styles.list}>{children}</dl>;
}
