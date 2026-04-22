'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import { useMemo, useRef, useState } from 'react';
import Map, { Layer, Marker, Source } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import { Eye, EyeOff, Layers, Maximize2, ScanSearch } from 'lucide-react';
import type { Alert, Asset, LngLat, SignalObservation, Site, Zone } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ClassificationBadge, SeverityBadge, StatusBadge } from '@/components/ui/Severity';
import { KV, KVList } from '@/components/ui/KeyValue';
import { Panel } from '@/components/ui/Panel';
import { TagList } from '@/components/ui/Tag';
import { dateTime, relTime } from '@/lib/format';
import { Sparkline } from '@/components/ui/Sparkline';
import { AssetMarker, SignalPing } from './AssetMarker';
import { buildCameraFovs, buildSensorRanges, zonesToFeatureCollection } from './geo';
import { flatDarkStyle } from './styleLight';
import styles from './MapWorkspace.module.scss';

interface Props {
  site: Site;
  zones: Zone[];
  assets: Asset[];
  signals: SignalObservation[];
  alerts: Alert[];
}

type LayerKey =
  | 'zones'
  | 'cameras'
  | 'lpr'
  | 'ir'
  | 'occupancy'
  | 'sensors'
  | 'access-points'
  | 'doors'
  | 'vehicles'
  | 'buildings'
  | 'beacons'
  | 'fovs'
  | 'ranges'
  | 'alerts';

const LAYER_LABELS: Record<LayerKey, string> = {
  zones: 'Zones',
  cameras: 'Cameras',
  lpr: 'LPR cameras',
  ir: 'IR / thermal',
  occupancy: 'Occupancy counters',
  sensors: 'Sensors',
  'access-points': 'Wi-Fi APs',
  doors: 'Doors / Access',
  vehicles: 'Vehicles',
  buildings: 'Buildings',
  beacons: 'Beacons',
  fovs: 'Camera FOVs',
  ranges: 'Sensor coverage',
  alerts: 'Active alerts',
};

const DEFAULT_LAYERS: Record<LayerKey, boolean> = {
  zones: true,
  cameras: true,
  lpr: true,
  ir: true,
  occupancy: true,
  sensors: true,
  'access-points': true,
  doors: true,
  vehicles: true,
  buildings: true,
  beacons: true,
  fovs: true,
  ranges: false,
  alerts: true,
};

export function MapWorkspace({ site, zones, assets, signals, alerts }: Props) {
  const mapRef = useRef<MapRef | null>(null);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>(DEFAULT_LAYERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [time, setTime] = useState<number>(24); // hours-ago slider; 24 == "now"

  const zonesGeo = useMemo(() => zonesToFeatureCollection(zones), [zones]);
  const fovGeo = useMemo(() => buildCameraFovs(assets), [assets]);
  const rangeGeo = useMemo(() => buildSensorRanges(assets.filter((a) => a.type === 'sensor')), [assets]);

  const visibleAssets = useMemo(
    () =>
      assets.filter((a) => {
        switch (a.type) {
          case 'camera':
            return layers.cameras;
          case 'lpr-camera':
            return layers.lpr;
          case 'ir-camera':
            return layers.ir;
          case 'occupancy-counter':
            return layers.occupancy;
          case 'sensor':
            return layers.sensors;
          case 'access-point':
            return layers['access-points'];
          case 'door-controller':
          case 'entrance':
            return layers.doors;
          case 'vehicle':
            return layers.vehicles;
          case 'building':
            return layers.buildings;
          case 'beacon':
            return layers.beacons;
          default:
            return true;
        }
      }),
    [assets, layers],
  );

  const selectedAsset = assets.find((a) => a.id === selectedId) ?? null;
  const selectedAlerts = selectedAsset ? alerts.filter((a) => a.assetId === selectedAsset.id) : [];

  const flyTo = (target: LngLat) => {
    mapRef.current?.flyTo({ center: target, zoom: 17.4, speed: 1.4, curve: 1.2 });
  };

  return (
    <div className={styles.workspace}>
      <div className={styles.mapWrap}>
        <Map
          ref={mapRef}
          mapStyle={flatDarkStyle as any}
          initialViewState={{
            longitude: site.center[0],
            latitude: site.center[1],
            zoom: 17,
            bearing: -8,
            pitch: 0,
          }}
          style={{ position: 'absolute', inset: 0 }}
          attributionControl={false}
          dragRotate={false}
          interactive
          onClick={() => setSelectedId(null)}
        >
          {/* Zones */}
          {layers.zones && (
            <Source id="zones" type="geojson" data={zonesGeo as any}>
              <Layer
                id="zones-fill"
                type="fill"
                paint={{
                  'fill-color': [
                    'match',
                    ['get', 'kind'],
                    'restricted', '#c8584a',
                    'perimeter', '#4aa8c8',
                    'parking', '#8a7ac8',
                    'utility', '#67738a',
                    /* default */ '#5fa37a',
                  ],
                  'fill-opacity': [
                    'case',
                    ['==', ['get', 'id'], hoveredZone ?? ''],
                    0.18,
                    0.08,
                  ],
                }}
              />
              <Layer
                id="zones-outline"
                type="line"
                paint={{
                  'line-color': [
                    'match',
                    ['get', 'kind'],
                    'restricted', '#c8584a',
                    'perimeter', '#4aa8c8',
                    'parking', '#8a7ac8',
                    'utility', '#67738a',
                    '#5fa37a',
                  ],
                  'line-opacity': 0.65,
                  'line-width': 1.2,
                  'line-dasharray': [2, 2],
                }}
              />
            </Source>
          )}

          {/* Camera FOV cones */}
          {layers.fovs && layers.cameras && (
            <Source id="fovs" type="geojson" data={fovGeo as any}>
              <Layer
                id="fovs-fill"
                type="fill"
                paint={{
                  'fill-color': '#4aa8c8',
                  'fill-opacity': 0.06,
                }}
              />
              <Layer
                id="fovs-line"
                type="line"
                paint={{
                  'line-color': '#4aa8c8',
                  'line-opacity': 0.35,
                  'line-width': 1,
                  'line-dasharray': [3, 3],
                }}
              />
            </Source>
          )}

          {/* Sensor coverage rings */}
          {layers.ranges && (
            <Source id="ranges" type="geojson" data={rangeGeo as any}>
              <Layer
                id="ranges-fill"
                type="fill"
                paint={{ 'fill-color': '#5fa37a', 'fill-opacity': 0.05 }}
              />
              <Layer
                id="ranges-line"
                type="line"
                paint={{ 'line-color': '#5fa37a', 'line-opacity': 0.4, 'line-width': 1 }}
              />
            </Source>
          )}

          {/* Asset markers */}
          {visibleAssets.map((a) => (
            <Marker
              key={a.id}
              longitude={a.position[0]}
              latitude={a.position[1]}
              anchor="center"
            >
              <AssetMarker
                asset={a}
                selected={selectedId === a.id}
                onClick={() => {
                  setSelectedId(a.id);
                  flyTo(a.position);
                }}
              />
            </Marker>
          ))}

          {/* Alert pings */}
          {layers.alerts &&
            alerts
              .filter((a) => a.position && !a.acknowledged)
              .map((a) => (
                <Marker
                  key={a.id}
                  longitude={a.position![0]}
                  latitude={a.position![1]}
                  anchor="center"
                >
                  <SignalPing
                    label={a.title}
                    color={
                      a.severity === 'critical' ? '#c8584a' :
                      a.severity === 'high' ? '#d97c4a' :
                      a.severity === 'medium' ? '#c89f4a' : '#4aa8c8'
                    }
                  />
                </Marker>
              ))}
        </Map>

        {/* Decorative scan grid */}
        <div className={styles.scanGrid} aria-hidden />

        {/* Top-left layer panel */}
        <div className={styles.layerPanel}>
          <div className={styles.layerHeader}>
            <Layers size={13} /> Layers
          </div>
          <ul className={styles.layerList}>
            {(Object.keys(LAYER_LABELS) as LayerKey[]).map((k) => (
              <li key={k}>
                <button
                  className={styles.layerToggle}
                  onClick={() => setLayers((prev) => ({ ...prev, [k]: !prev[k] }))}
                >
                  {layers[k] ? <Eye size={12} /> : <EyeOff size={12} />}
                  <span>{LAYER_LABELS[k]}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Top-right legend & controls */}
        <div className={styles.controls}>
          <Badge tone="green" dot size="sm">live</Badge>
          <Button
            variant="subtle"
            iconLeft={<Maximize2 size={12} />}
            onClick={() => mapRef.current?.flyTo({ center: site.center, zoom: 17, bearing: -8, pitch: 0, speed: 1.2 })}
          >
            Fit site
          </Button>
        </div>

        {/* Zone hover ribbon */}
        <div className={styles.zoneStrip}>
          {zones.map((z) => (
            <button
              key={z.id}
              onMouseEnter={() => setHoveredZone(z.id)}
              onMouseLeave={() => setHoveredZone(null)}
              className={`${styles.zoneChip} ${styles[`kind-${z.kind}`]}`}
            >
              <span className={styles.zoneDot} />
              {z.name}
            </button>
          ))}
        </div>

        {/* Bottom timeline */}
        <div className={styles.timeline}>
          <div className={styles.timelineLabel}>Timeline scrubber</div>
          <div className={styles.timelineRow}>
            <span className={styles.timeStamp}>−24h</span>
            <input
              type="range"
              min={0}
              max={24}
              value={time}
              onChange={(e) => setTime(parseInt(e.target.value, 10))}
              className={styles.slider}
              aria-label="Timeline"
            />
            <span className={styles.timeStamp}>now</span>
            <Badge size="sm">{time === 24 ? 'live' : `${24 - time}h ago`}</Badge>
          </div>
        </div>
      </div>

      {/* Inspector */}
      <aside className={styles.inspector}>
        {selectedAsset ? (
          <Panel
            title={selectedAsset.name}
            subtitle={
              <span>
                {selectedAsset.type} · {selectedAsset.vendor ?? 'unknown vendor'}
              </span>
            }
            actions={<StatusBadge status={selectedAsset.status} />}
            padded={false}
          >
            <div className={styles.inspectorBody}>
              <KVList>
                <KV label="ID">{selectedAsset.id}</KV>
                {selectedAsset.zoneId && (
                  <KV label="Zone">
                    {zones.find((z) => z.id === selectedAsset.zoneId)?.name ?? selectedAsset.zoneId}
                  </KV>
                )}
                <KV label="Position" mono>
                  {selectedAsset.position[1].toFixed(5)}, {selectedAsset.position[0].toFixed(5)}
                </KV>
                {selectedAsset.headingDeg != null && (
                  <KV label="Heading">{selectedAsset.headingDeg}°</KV>
                )}
                {selectedAsset.fovDeg && <KV label="FOV">{selectedAsset.fovDeg}°</KV>}
                {selectedAsset.rangeM && <KV label="Range">{selectedAsset.rangeM} m</KV>}
                {selectedAsset.model && <KV label="Model">{selectedAsset.model}</KV>}
                {selectedAsset.owner && <KV label="Owner">{selectedAsset.owner}</KV>}
                {selectedAsset.installedAt && (
                  <KV label="Installed">{dateTime(selectedAsset.installedAt)}</KV>
                )}
                {selectedAsset.lastSeen && (
                  <KV label="Last seen">{relTime(selectedAsset.lastSeen)}</KV>
                )}
                <KV label="Tags"><TagList tags={selectedAsset.tags} /></KV>
              </KVList>

              {selectedAsset.notes && (
                <div className={styles.inspectorNote}>
                  <div className={styles.inspectorSection}>Operator note</div>
                  <p>{selectedAsset.notes}</p>
                </div>
              )}

              {selectedAlerts.length > 0 && (
                <div>
                  <div className={styles.inspectorSection}>Linked alerts</div>
                  <ul className={styles.alertMini}>
                    {selectedAlerts.map((a) => (
                      <li key={a.id}>
                        <SeverityBadge severity={a.severity} />
                        <div>
                          <div className={styles.alertMiniTitle}>{a.title}</div>
                          <div className={styles.alertMiniMeta}>{relTime(a.createdAt)}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <div className={styles.inspectorSection}>Recent signal proximity</div>
                <ul className={styles.signalMini}>
                  {signals.slice(0, 4).map((s) => (
                    <li key={s.id}>
                      <div>
                        <div className={styles.signalMiniAlias}>{s.alias}</div>
                        <div className={styles.signalMiniMeta}>
                          <span>{s.band}</span> · <span>{s.rssi} dBm</span>
                        </div>
                      </div>
                      <div className={styles.signalMiniRight}>
                        <Sparkline data={s.history ?? []} color="#4aa8c8" width={56} height={18} />
                        <ClassificationBadge value={s.classification} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Panel>
        ) : (
          <Panel title="Inspector" subtitle="Select an asset on the map" padded>
            <div className={styles.inspectorEmpty}>
              <ScanSearch size={28} />
              <p>Click any asset to view its details, recent activity, and linked alerts.</p>
              <ul className={styles.legendList}>
                <li><span className={styles.legendDot} style={{ background: '#4aa8c8' }} />Camera</li>
                <li><span className={styles.legendDot} style={{ background: '#5fa37a' }} />Sensor</li>
                <li><span className={styles.legendDot} style={{ background: '#8a7ac8' }} />Wi-Fi AP / Beacon</li>
                <li><span className={styles.legendDot} style={{ background: '#c89f4a' }} />Door / Vehicle</li>
                <li><span className={styles.legendDot} style={{ background: '#c8584a' }} />Active alert</li>
              </ul>
            </div>

            <hr />

            <div className={styles.inspectorSection}>Pinned signals nearby</div>
            <ul className={styles.signalMini}>
              {signals.filter((s) => s.classification === 'suspicious').map((s) => (
                <li key={s.id}>
                  <div>
                    <div className={styles.signalMiniAlias}>{s.alias}</div>
                    <div className={styles.signalMiniMeta}>
                      <span>{s.band}</span> · <span>{s.rssi} dBm</span> · <span>{relTime(s.lastSeen)}</span>
                    </div>
                  </div>
                  <div className={styles.signalMiniRight}>
                    <Sparkline data={s.history ?? []} color="#c89f4a" width={56} height={18} />
                    <ClassificationBadge value={s.classification} />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </aside>
    </div>
  );
}
