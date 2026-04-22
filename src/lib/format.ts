import { formatDistanceToNowStrict, parseISO } from 'date-fns';

export function relTime(iso: string): string {
  try {
    return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

export function shortTime(iso: string): string {
  try {
    const d = parseISO(iso);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export function shortDate(iso: string): string {
  try {
    const d = parseISO(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
  } catch {
    return iso;
  }
}

export function dateTime(iso: string): string {
  try {
    const d = parseISO(iso);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/** Mask a MAC-like identifier so we never display raw addresses in the UI. */
export function maskMac(mac: string): string {
  const parts = mac.split(/[:\-]/);
  if (parts.length < 3) return mac.slice(0, 4) + '··';
  return `${parts[0]}:${parts[1]}:··:··:··:${parts[parts.length - 1]}`;
}

/** Truncate an arbitrary identifier for display. */
export function shortId(id: string, head = 4, tail = 4): string {
  if (id.length <= head + tail + 1) return id;
  return `${id.slice(0, head)}…${id.slice(-tail)}`;
}

export function rssiLabel(rssi: number): string {
  if (rssi >= -55) return 'strong';
  if (rssi >= -70) return 'good';
  if (rssi >= -82) return 'fair';
  return 'weak';
}

export function bytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function percent(n: number, digits = 0): string {
  return `${n.toFixed(digits)}%`;
}

export function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
}
