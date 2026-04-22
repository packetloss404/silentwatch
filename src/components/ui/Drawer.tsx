'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import styles from './Drawer.module.scss';

interface DrawerProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  width?: number;
  children: ReactNode;
  footer?: ReactNode;
}

export function Drawer({ open, onOpenChange, title, subtitle, width = 460, children, footer }: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content} style={{ width }}>
          <Dialog.Title className={styles.srOnly}>{typeof title === 'string' ? title : 'Detail panel'}</Dialog.Title>
          <header className={styles.header}>
            <div className={styles.titles}>
              {title && <h3 className={styles.title}>{title}</h3>}
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
            <Dialog.Close asChild>
              <button className={styles.close} aria-label="Close">
                <X size={16} />
              </button>
            </Dialog.Close>
          </header>
          <div className={styles.body}>{children}</div>
          {footer && <footer className={styles.footer}>{footer}</footer>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
