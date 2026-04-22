'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  CarFront,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Map,
  Radio,
  ScanSearch,
  ShieldCheck,
} from 'lucide-react';
import { clsx } from 'clsx';
import styles from './Sidebar.module.scss';

const NAV: { href: string; label: string; icon: typeof Activity; group?: string; chip?: string }[] = [
  { href: '/dashboard', label: 'Command', icon: LayoutDashboard, group: 'Overview' },
  { href: '/map', label: 'Map workspace', icon: Map, group: 'Overview' },
  { href: '/signals', label: 'Signals', icon: Radio, group: 'Awareness' },
  { href: '/vehicles', label: 'Vehicles · LPR', icon: CarFront, group: 'Awareness' },
  { href: '/patterns', label: 'Patterns', icon: ScanSearch, group: 'Awareness' },
  { href: '/assets', label: 'Assets', icon: ShieldCheck, group: 'Awareness' },
  { href: '/incidents', label: 'Incidents', icon: AlertTriangle, group: 'Operations', chip: '5' },
  { href: '/audit', label: 'Privacy audit', icon: ClipboardList, group: 'Operations' },
  { href: '/reports', label: 'Reports', icon: FileText, group: 'Operations' },
];

export function Sidebar() {
  const pathname = usePathname();

  const groups = NAV.reduce<Record<string, typeof NAV>>((acc, item) => {
    const g = item.group ?? 'Other';
    (acc[g] ??= []).push(item);
    return acc;
  }, {});

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandMark} aria-hidden>
          <svg viewBox="0 0 24 24" width="18" height="18">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4" fill="none" opacity="0.5" />
            <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.4" fill="none" />
            <circle cx="12" cy="12" r="1.6" fill="currentColor" />
            <line x1="12" y1="1.5" x2="12" y2="3.5" stroke="currentColor" strokeWidth="1.4" />
            <line x1="12" y1="20.5" x2="12" y2="22.5" stroke="currentColor" strokeWidth="1.4" />
            <line x1="1.5" y1="12" x2="3.5" y2="12" stroke="currentColor" strokeWidth="1.4" />
            <line x1="20.5" y1="12" x2="22.5" y2="12" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </span>
        <div className={styles.brandText}>
          <div className={styles.brandName}>SilentWatch</div>
          <div className={styles.brandSub}>North Yard · Operator</div>
        </div>
      </div>

      <nav className={styles.nav}>
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className={styles.group}>
            <div className={styles.groupTitle}>{group}</div>
            {items.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(styles.link, active && styles.active)}
                >
                  <Icon size={15} className={styles.icon} />
                  <span className={styles.label}>{item.label}</span>
                  {item.chip && <span className={styles.chip}>{item.chip}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <footer className={styles.footer}>
        <div className={styles.footerRow}>
          <span className={styles.statusDot} aria-hidden />
          <span>All systems nominal</span>
        </div>
        <div className={styles.footerSub}>v0.1 · mock data</div>
      </footer>
    </aside>
  );
}
