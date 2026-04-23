'use client';

import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import styles from './DataTable.module.scss';

export interface Column<T> {
  key: string;
  header: ReactNode;
  width?: string | number;
  align?: 'left' | 'right' | 'center';
  render: (row: T) => ReactNode;
  className?: string;
  mono?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** Screen reader + aria label for a row; defaults to `rowKey` string. */
  getRowLabel?: (row: T) => string;
  selectedKey?: string;
  empty?: ReactNode;
  dense?: boolean;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  getRowLabel,
  selectedKey,
  empty,
  dense,
  className,
}: DataTableProps<T>) {
  return (
    <div className={clsx(styles.wrap, className)}>
      <table className={clsx(styles.table, dense && styles.dense)}>
        <colgroup>
          {columns.map((c) => (
            <col key={c.key} style={c.width ? { width: typeof c.width === 'number' ? `${c.width}px` : c.width } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={clsx(c.align && styles[`align-${c.align}`], c.className)}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr className={styles.emptyRow}>
              <td colSpan={columns.length}>{empty ?? 'No records.'}</td>
            </tr>
          ) : (
            rows.map((row) => {
              const key = rowKey(row);
              const label = (getRowLabel ?? ((r: T) => String(rowKey(r))))(row);
              return (
                <tr
                  key={key}
                  className={clsx(
                    onRowClick && styles.clickable,
                    selectedKey === key && styles.selected,
                  )}
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-selected={onRowClick ? selectedKey === key : undefined}
                  aria-label={onRowClick ? `Open details for ${label}` : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={clsx(
                        c.align && styles[`align-${c.align}`],
                        c.mono && styles.mono,
                        c.className,
                      )}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
