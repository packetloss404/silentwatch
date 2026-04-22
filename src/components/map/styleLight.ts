// Self-contained dark MapLibre style — works fully offline (no tile fetches).
// We render a flat dark canvas and let our own GeoJSON sources draw zones and assets.
// This keeps the demo runnable without any external tile provider, and makes
// the map look intentionally "schematic / operator surface" rather than satellite.

import type { StyleSpecification } from 'maplibre-gl';

export const flatDarkStyle: StyleSpecification = {
  version: 8,
  name: 'silentwatch-dark',
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#0b0e13',
      },
    },
  ],
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
};
