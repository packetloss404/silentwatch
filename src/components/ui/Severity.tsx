import type { Severity, Classification, AssetStatus } from '@/lib/types';
import { Badge } from './Badge';

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <Badge tone={severity} dot>{severity}</Badge>;
}

export function ClassificationBadge({ value }: { value: Classification }) {
  return <Badge tone={value} dot>{value}</Badge>;
}

const STATUS_TONE: Record<AssetStatus, 'green' | 'red' | 'amber' | 'neutral' | 'cyan'> = {
  online: 'green',
  offline: 'red',
  degraded: 'amber',
  unknown: 'neutral',
  maintenance: 'cyan',
};

export function StatusBadge({ status }: { status: AssetStatus }) {
  return <Badge tone={STATUS_TONE[status]} dot>{status}</Badge>;
}
