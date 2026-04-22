import { Shield } from 'lucide-react';
import styles from './DataMinimizationBanner.module.scss';

type Variant = 'patterns' | 'occupancy' | 'generic';

const COPY: Record<Variant, { title: string; body: string }> = {
  patterns: {
    title: 'Aggregate patterns only',
    body:
      'This view uses frequency and time-of-day analysis on hashes and counts. It is not a person or vehicle dossier, and patterns can be explained and challenged using decision metadata when your deployment enables it.',
  },
  occupancy: {
    title: 'Count-only occupancy',
    body:
      'Each cell is a bucketed total. SilentWatch does not store individual tracks, biometrics, or re-identified paths across cameras.',
  },
  generic: {
    title: 'Data minimization',
    body:
      'Operators should collect only what your policy allows. Exports to third parties need a separate process and may require additional redaction.',
  },
};

export function DataMinimizationBanner({ variant = 'generic' }: { variant?: Variant }) {
  const { title, body } = COPY[variant];
  return (
    <div className={styles.banner} role="status">
      <Shield size={16} className={styles.icon} aria-hidden />
      <div>
        <div className={styles.title}>{title}</div>
        <p className={styles.body}>{body}</p>
      </div>
    </div>
  );
}
