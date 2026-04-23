import type { Asset, AssetType } from '@/lib/types';

/** Human labels for fixed-asset / inventory type column (not raw enum strings). */
export const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  camera: 'Camera',
  'lpr-camera': 'LPR',
  'ir-camera': 'IR / thermal',
  sensor: 'Sensor',
  'occupancy-counter': 'Occupancy',
  'access-point': 'Wi-Fi AP',
  gateway: 'Gateway',
  switch: 'Switch',
  'door-controller': 'Door / access',
  vehicle: 'Vehicle',
  building: 'Building',
  entrance: 'Entrance',
  beacon: 'Beacon',
};

export function assetTypeLabel(type: AssetType): string {
  return ASSET_TYPE_LABEL[type] ?? type;
}

/** Short line for drawer subtitle: type + vendor. */
export function assetKindSummary(asset: Pick<Asset, 'type' | 'vendor'>): string {
  return `${assetTypeLabel(asset.type)} · ${asset.vendor ?? 'unknown vendor'}`;
}
