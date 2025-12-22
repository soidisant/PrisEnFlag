import L from 'leaflet';

// Fix Leaflet default icon path issue with bundlers
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export const TILE_LAYER_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_LAYER_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const WORLD_BOUNDS = [
  [-60, -180],
  [85, 180]
];

export const DEFAULT_CENTER = [20, 0];
export const DEFAULT_ZOOM = 2;
export const MAX_ZOOM = 10;

export function createTileLayer() {
  return L.tileLayer(TILE_LAYER_URL, {
    attribution: TILE_LAYER_ATTRIBUTION,
    maxZoom: 19
  });
}

export function calculateDistance(latlng1, latlng2) {
  // Returns distance in meters
  const point1 = L.latLng(latlng1);
  const point2 = L.latLng(latlng2);
  return point1.distanceTo(point2);
}

export function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Ray-casting algorithm to check if a point is inside a polygon
 * @param {[number, number]} point - [lng, lat] coordinates
 * @param {Array} ring - Array of [lng, lat] coordinates forming a polygon ring
 * @returns {boolean}
 */
function pointInRing(point, ring) {
  const x = point[0];
  const y = point[1];
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Check if a point is inside a GeoJSON geometry (Polygon or MultiPolygon)
 * @param {[number, number]} point - [lng, lat] coordinates
 * @param {Object} geometry - GeoJSON geometry object
 * @returns {boolean}
 */
function pointInGeometry(point, geometry) {
  if (geometry.type === 'Polygon') {
    // Check outer ring (first ring), ignore holes for simplicity
    return pointInRing(point, geometry.coordinates[0]);
  } else if (geometry.type === 'MultiPolygon') {
    // Check each polygon in the MultiPolygon
    for (const polygon of geometry.coordinates) {
      if (pointInRing(point, polygon[0])) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Find all GeoJSON layers that contain the given point
 * @param {L.LatLng} latlng - Leaflet LatLng object
 * @param {L.GeoJSON} geoJsonLayer - Leaflet GeoJSON layer
 * @returns {Array} Array of layers containing the point
 */
export function findLayersAtPoint(latlng, geoJsonLayer) {
  const point = [latlng.lng, latlng.lat];
  const results = [];

  geoJsonLayer.eachLayer((layer) => {
    // Quick bounds check first (optimization)
    if (layer.getBounds && layer.getBounds().contains(latlng)) {
      // Precise polygon check
      if (layer.feature && layer.feature.geometry) {
        if (pointInGeometry(point, layer.feature.geometry)) {
          results.push(layer);
        }
      }
    }
  });

  return results;
}
