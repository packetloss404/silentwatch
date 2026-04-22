import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.scss';

type Variant = 'primary' | 'ghost' | 'subtle' | 'danger' | 'outline';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export function Button({
  variant = 'subtle',
  size = 'sm',
  type = 'button',
  className,
  children,
  iconLeft,
  iconRight,
  ...rest
}: ButtonProps) {
  return (
    <button type={type} {...rest} className={clsx(styles.btn, styles[variant], styles[size], className)}>
      {iconLeft && <span className={styles.icon}>{iconLeft}</span>}
      {children && <span className={styles.label}>{children}</span>}
      {iconRight && <span className={styles.icon}>{iconRight}</span>}
    </button>
  );
}
