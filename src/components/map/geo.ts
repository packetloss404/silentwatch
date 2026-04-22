import type { Asset, LngLat, Zone } from '@/lib/types';
import type { Feature, FeatureCollection, Polygon } from 'geojson';

const METERS_PER_DEG_LAT = 111_320;

function metersToLngLatDelta(lat: number, dxM: number, dyM: number): [number, number] {
  const latClamped = Math.min(89.9, Math.max(-89.9, lat));
  const dy = dyM / METERS_PER_DEG_LAT;
  const cos = Math.max(0.0001, Math.abs(Math.cos((latClamped * Math.PI) / 180)));
  const dx = dxM / (METERS_PER_DEG_LAT * cos);
  return [dx, dy];
}

export function zonesToFeatureCollection(zones: Zone[]): FeatureCollection {
  const features: FeatureCollection['features'] = [];
  for (const z of zones) {
    if (z.polygon.length < 3) continue;
    const ring = [...z.polygon, z.polygon[0]];
    features.push({
      type: 'Feature',
      properties: { id: z.id, name: z.name, kind: z.kind },
      geometry: {
        type: 'Polygon',
        coordinates: [ring],
      },
    });
  }
  return { type: 'FeatureCollection', features };
}

/** Approximate a camera FOV cone as a polygon in lng/lat space. */
export function cameraFovPolygon(asset: Asset): Feature<Polygon> | null {
  const isCameraLike =
    asset.type === 'camera' || asset.type === 'lpr-camera' || asset.type === 'ir-camera';
  if (!isCameraLike || asset.headingDeg == null || asset.fovDeg == null || asset.rangeM == null) {
    return null;
  }
  const lat = asset.position[1];
  const lng = asset.position[0];
  const half = asset.fovDeg / 2;
  const steps = 14;
  const points: [number, number][] = [[lng, lat]];
  for (let i = 0; i <= steps; i++) {
    const a = ((asset.headingDeg - half) + (asset.fovDeg * i) / steps) * (Math.PI / 180);
    const dx = Math.sin(a) * asset.rangeM;
    const dy = Math.cos(a) * asset.rangeM;
    const [dLng, dLat] = metersToLngLatDelta(lat, dx, dy);
    points.push([lng + dLng, lat + dLat]);
  }
  points.push([lng, lat]);
  return {
    type: 'Feature',
    properties: { id: asset.id, kind: 'camera-fov' },
    geometry: { type: 'Polygon', coordinates: [points] },
  };
}

/** Approximate a sensor coverage circle as a polygon. */
export function sensorRangePolygon(asset: Asset): Feature<Polygon> | null {
  if (asset.rangeM == null || asset.rangeM <= 0) return null;
  const lat = asset.position[1];
  const lng = asset.position[0];
  const steps = 36;
  const points: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const dx = Math.sin(a) * asset.rangeM;
    const dy = Math.cos(a) * asset.rangeM;
    const [dLng, dLat] = metersToLngLatDelta(lat, dx, dy);
    points.push([lng + dLng, lat + dLat]);
  }
  return {
    type: 'Feature',
    properties: { id: asset.id, kind: 'sensor-range' },
    geometry: { type: 'Polygon', coordinates: [points] },
  };
}

export function buildCameraFovs(assets: Asset[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: assets
      .map((a) => cameraFovPolygon(a))
      .filter((x): x is Feature<Polygon> => x !== null),
  };
}

export function buildSensorRanges(assets: Asset[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: assets
      .filter((a) => a.type === 'sensor' || a.type === 'access-point')
      .map((a) => sensorRangePolygon(a))
      .filter((x): x is Feature<Polygon> => x !== null),
  };
}

export function lngLatBoundsToObject(b: [LngLat, LngLat]): { sw: LngLat; ne: LngLat } {
  return { sw: b[0], ne: b[1] };
}
