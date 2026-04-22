import type { ReactNode } from 'react';
import styles from './Empty.module.scss';

interface EmptyProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export function Empty({ icon, title, description, action }: EmptyProps) {
  return (
    <div className={styles.empty}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.title}>{title}</div>
      {description && <div className={styles.desc}>{description}</div>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
