'use client';

import { Search } from 'lucide-react';
import { forwardRef, type InputHTMLAttributes } from 'react';
import styles from './SearchInput.module.scss';

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  width?: number | string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { width = 220, className, ...rest },
  ref,
) {
  return (
    <div className={styles.wrap} style={{ width }}>
      <Search size={14} className={styles.icon} />
      <input
        ref={ref}
        type="search"
        className={styles.input + (className ? ` ${className}` : '')}
        {...rest}
      />
    </div>
  );
});
