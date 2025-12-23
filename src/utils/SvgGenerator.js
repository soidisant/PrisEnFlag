// Lightweight SVG generator for country silhouettes
// Can work independently from UnifiedMap

const SVG_CACHE_KEY = 'pris-en-flag-svg-cache';

// Map special GeoJSON codes to our country codes
const CODE_MAPPING = {
  'CN-TW': 'TW' // Taiwan
};

export class SvgGenerator {
  constructor() {
    this.cache = this.loadCache();
    this.featureMap = {};
  }

  loadCache() {
    try {
      const saved = localStorage.getItem(SVG_CACHE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }

  saveCache() {
    try {
      localStorage.setItem(SVG_CACHE_KEY, JSON.stringify(this.cache));
    } catch {
      // localStorage full or unavailable
    }
  }

  setGeoJSON(geojson) {
    this.featureMap = {};
    if (geojson && geojson.features) {
      geojson.features.forEach(feature => {
        let code = feature.properties['ISO3166-1-Alpha-2'];
        // Apply special mappings
        if (CODE_MAPPING[code]) {
          code = CODE_MAPPING[code];
        }
        if (code && code !== '-99') {
          this.featureMap[code] = feature;
        }
      });
    }
  }

  getSVG(code) {
    // Return cached if available
    if (this.cache[code]) {
      return this.cache[code];
    }

    const feature = this.featureMap[code];
    if (!feature) return '';

    const svg = this.generateSVG(feature);
    if (svg) {
      this.cache[code] = svg;
      this.saveCache();
    }
    return svg;
  }

  generateSVG(feature) {
    const geometry = feature.geometry;

    // Get coordinates - for MultiPolygon, use only the largest polygon (mainland)
    let allCoords = [];
    if (geometry.type === 'Polygon') {
      allCoords = [geometry.coordinates[0]];
    } else if (geometry.type === 'MultiPolygon') {
      // Find the largest polygon by bounding box area
      let largestPoly = null;
      let largestArea = 0;

      geometry.coordinates.forEach(poly => {
        const ring = poly[0];
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        ring.forEach(([lon, lat]) => {
          minX = Math.min(minX, lon);
          maxX = Math.max(maxX, lon);
          minY = Math.min(minY, lat);
          maxY = Math.max(maxY, lat);
        });
        const area = (maxX - minX) * (maxY - minY);
        if (area > largestArea) {
          largestArea = area;
          largestPoly = ring;
        }
      });

      if (largestPoly) {
        allCoords = [largestPoly];
      }
    }

    if (allCoords.length === 0) return '';

    // Find bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    allCoords.forEach(ring => {
      ring.forEach(([lon, lat]) => {
        minX = Math.min(minX, lon);
        maxX = Math.max(maxX, lon);
        minY = Math.min(minY, lat);
        maxY = Math.max(maxY, lat);
      });
    });

    const width = maxX - minX;
    const height = maxY - minY;
    const svgSize = 40;
    const padding = 2;
    const scale = (svgSize - padding * 2) / Math.max(width, height);

    // Convert coordinates to SVG path with simplification
    const paths = allCoords.map(ring => {
      const simplified = [];
      let lastX = null, lastY = null;

      ring.forEach(([lon, lat]) => {
        const x = padding + (lon - minX) * scale;
        const y = padding + (maxY - lat) * scale;

        if (lastX === null || Math.abs(x - lastX) > 0.5 || Math.abs(y - lastY) > 0.5) {
          simplified.push(`${x.toFixed(1)},${y.toFixed(1)}`);
          lastX = x;
          lastY = y;
        }
      });

      return simplified.length > 2 ? `M${simplified.join('L')}Z` : '';
    }).filter(p => p).join(' ');

    return `<svg viewBox="0 0 ${svgSize} ${svgSize}" width="${svgSize}" height="${svgSize}"><path d="${paths}" fill="#6b7280" stroke="#374151" stroke-width="0.5"/></svg>`;
  }
}
