'use client';

import { useEffect, useRef } from 'react';
import { Bell, Command, KeyRound, Wifi } from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import styles from './TopBar.module.scss';

export function TopBar() {
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const now = new Date();
  const stamp = now.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <header className={styles.top}>
      <div className={styles.left}>
        <SearchInput
          ref={searchRef}
          placeholder="Search zones, devices, vehicles, incidents…"
          width={320}
          aria-label="Search zones, edge devices, vehicles, and incidents"
        />
        <div className={styles.kbHint} title="Focus search (Ctrl or ⌘ + K)">
          <Command size={11} /> <span>K</span>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.stat} title="Active operator session">
          <KeyRound size={12} className={styles.statIcon} />
          <span>J. Aoki · Operator</span>
        </div>

        <div className={styles.stat} title="Live ingest status">
          <Wifi size={12} className={styles.statIcon} />
          <Badge tone="green" dot size="sm">live</Badge>
        </div>

        <div className={styles.timestamp} title="Local time">{stamp}</div>

        <button type="button" className={styles.bell} aria-label="Alerts, 3 unread">
          <Bell size={15} />
          <span className={styles.bellBadge} aria-hidden>
            3
          </span>
        </button>
      </div>
    </header>
  );
}
