import type { Asset } from '@/lib/types';
import {
  Camera, Cctv, DoorClosed, Gauge, Wifi, Server, Network, Car, Building2, Radio, RadioTower,
  ScanLine, Flame, Users,
} from 'lucide-react';
import { clsx } from 'clsx';
import styles from './AssetMarker.module.scss';

const ICONS = {
  camera: Cctv,
  'lpr-camera': ScanLine,
  'ir-camera': Flame,
  sensor: Gauge,
  'occupancy-counter': Users,
  'access-point': Wifi,
  gateway: Server,
  switch: Network,
  'door-controller': DoorClosed,
  vehicle: Car,
  building: Building2,
  entrance: DoorClosed,
  beacon: RadioTower,
} as const satisfies Record<Asset['type'], any>;

const SIZE = {
  building: 28,
  default: 22,
};

interface Props {
  asset: Asset;
  selected?: boolean;
  onClick?: () => void;
}

export function AssetMarker({ asset, selected, onClick }: Props) {
  const Icon = ICONS[asset.type] ?? Radio;
  const size = asset.type === 'building' ? SIZE.building : SIZE.default;
  const dim = asset.status === 'offline';
  const warn = asset.status === 'degraded';
  const isCameraLike =
    asset.type === 'camera' || asset.type === 'lpr-camera' || asset.type === 'ir-camera';
  const headingClass = isCameraLike && asset.headingDeg != null;

  return (
    <button
      type="button"
      className={clsx(
        styles.marker,
        styles[`type-${asset.type}`],
        selected && styles.selected,
        dim && styles.dim,
        warn && styles.warn,
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      style={{ width: size, height: size }}
      title={asset.name}
    >
      {headingClass && (
        <span
          className={styles.heading}
          style={{ transform: `rotate(${asset.headingDeg}deg)` }}
          aria-hidden
        />
      )}
      <Icon size={size === 28 ? 14 : 12} />
      <span className={styles.label}>{asset.name}</span>
    </button>
  );
}

export function SignalPing({ label, color = '#c89f4a' }: { label: string; color?: string }) {
  return (
    <span className={styles.ping} style={{ color }} title={label}>
      <span className={styles.pingPulse} />
      <span className={styles.pingDot} />
    </span>
  );
}
