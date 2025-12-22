import L from 'leaflet';
import { DEFAULT_CENTER, DEFAULT_ZOOM, createTileLayer } from './mapUtils.js';
import { languageManager } from '../i18n/LanguageManager.js';

// Phase timings (in milliseconds)
const PHASE_0_END = 4000;   // 0-4s: Show world map
const PHASE_1_END = 10000;  // 4-10s: Highlight continent
const PHASE_2_END = 18000;  // 10-18s: Show ~10 countries
const PHASE_3_END = 30000;  // 18-30s: Eliminate to target

// Colors
const OCEAN_COLOR = '#aad3df';
const CONTINENT_COLOR = '#e8e8e8';
const CANDIDATE_COLOR = '#fbbf24';
const TARGET_COLOR = '#22c55e';

export class ClueMap {
  constructor(containerId) {
    this.map = L.map(containerId, {
      zoomControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      attributionControl: false
    }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

    // Set ocean background
    this.map.getContainer().style.background = OCEAN_COLOR;

    this.countriesLayer = null;
    this.countryLayers = {};  // code -> layer mapping
    this.geojson = null;
    this.countriesData = null;

    this.targetCode = null;
    this.targetContinent = null;
    this.continentCountries = [];
    this.candidateCountries = [];
    this.eliminatedCount = 0;

    this.animationId = null;
    this.progress = 0;
    this.currentPhase = 0;
    this.zoomControl = null;
    this.tileLayer = null;
  }

  setGeoJSON(geojson, countriesData) {
    this.geojson = geojson;
    this.countriesData = countriesData;

    if (this.countriesLayer) {
      this.map.removeLayer(this.countriesLayer);
    }

    this.countryLayers = {};

    this.countriesLayer = L.geoJSON(geojson, {
      style: {
        fillColor: 'transparent',
        fillOpacity: 0,
        color: 'transparent',
        weight: 0
      },
      onEachFeature: (feature, layer) => {
        const code = feature.properties['ISO3166-1-Alpha-2'];
        if (code && code !== '-99') {
          this.countryLayers[code] = layer;
        }
      }
    }).addTo(this.map);
  }

  setTarget(countryCode, continent) {
    this.targetCode = countryCode;
    this.targetContinent = continent;

    // Get all countries in the same continent
    this.continentCountries = Object.entries(this.countriesData)
      .filter(([code, data]) => data.continent === continent && this.countryLayers[code])
      .map(([code]) => code);

    // Shuffle and pick candidates (target + up to 9 others)
    const others = this.continentCountries.filter(c => c !== countryCode);
    this.shuffleArray(others);
    const numOthers = Math.min(9, others.length);
    this.candidateCountries = [countryCode, ...others.slice(0, numOthers)];
    this.shuffleArray(this.candidateCountries);

    this.eliminatedCount = 0;
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  startAnimation(duration = 30000, onProgress = null) {
    const startTime = Date.now();
    this.progress = 0;
    this.currentPhase = -1;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      this.progress = Math.min(elapsed / duration, 1);

      // Determine current phase and update display
      if (elapsed < PHASE_0_END) {
        if (this.currentPhase !== 0) {
          this.currentPhase = 0;
          this.showPhase0();
        }
      } else if (elapsed < PHASE_1_END) {
        if (this.currentPhase !== 1) {
          this.currentPhase = 1;
          this.showPhase1();
        }
      } else if (elapsed < PHASE_2_END) {
        if (this.currentPhase !== 2) {
          this.currentPhase = 2;
          this.showPhase2();
        }
      } else {
        if (this.currentPhase !== 3) {
          this.currentPhase = 3;
        }
        // Progressive elimination during phase 3
        this.updatePhase3(elapsed - PHASE_2_END, PHASE_3_END - PHASE_2_END);
      }

      if (onProgress) {
        onProgress(this.progress);
      }

      if (this.progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      }
    };

    this.animationId = requestAnimationFrame(animate);
  }

  showPhase0() {
    // Show world map with all countries dimmed
    Object.values(this.countryLayers).forEach(layer => {
      layer.setStyle({
        fillColor: CONTINENT_COLOR,
        fillOpacity: 0.5,
        color: '#bbb',
        weight: 0.5
      });
    });

    // Reset to world view
    this.map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: true, duration: 0.3 });
  }

  showPhase1() {
    // Highlight continent, dim others
    Object.entries(this.countryLayers).forEach(([code, layer]) => {
      if (this.continentCountries.includes(code)) {
        layer.setStyle({
          fillColor: CONTINENT_COLOR,
          fillOpacity: 1,
          color: '#999',
          weight: 1
        });
      } else {
        layer.setStyle({
          fillColor: CONTINENT_COLOR,
          fillOpacity: 0.2,
          color: '#ccc',
          weight: 0.5
        });
      }
    });

    // Fit map to show the continent
    this.fitToCountries(this.continentCountries);
  }

  showPhase2() {
    // Hide non-candidate countries, highlight candidates
    this.continentCountries.forEach(code => {
      const layer = this.countryLayers[code];
      if (layer) {
        if (this.candidateCountries.includes(code)) {
          layer.setStyle({
            fillColor: CANDIDATE_COLOR,
            fillOpacity: 0.8,
            color: '#b45309',
            weight: 2
          });
        } else {
          layer.setStyle({
            fillColor: CONTINENT_COLOR,
            fillOpacity: 0.3,
            color: '#ccc',
            weight: 1
          });
        }
      }
    });

    // Fit map to candidates
    this.fitToCountries(this.candidateCountries);
  }

  updatePhase3(elapsed, phaseDuration) {
    // Calculate how many countries should be eliminated by now
    const remainingToEliminate = this.candidateCountries.length - 1; // Keep target
    const eliminateProgress = elapsed / phaseDuration;
    const shouldEliminate = Math.floor(eliminateProgress * remainingToEliminate);

    // Eliminate countries one by one
    while (this.eliminatedCount < shouldEliminate) {
      this.eliminateNextCountry();
    }
  }

  eliminateNextCountry() {
    // Find a non-target candidate to eliminate
    const remaining = this.candidateCountries.filter(code => {
      const layer = this.countryLayers[code];
      return code !== this.targetCode && layer &&
             layer.options.fillOpacity > 0.5; // Still visible
    });

    if (remaining.length > 0) {
      const toEliminate = remaining[0];
      const layer = this.countryLayers[toEliminate];
      if (layer) {
        layer.setStyle({
          fillColor: CONTINENT_COLOR,
          fillOpacity: 0.3,
          color: '#ccc',
          weight: 1
        });
      }
      this.eliminatedCount++;
    }
  }

  showTarget() {
    // Highlight the target country in green
    const layer = this.countryLayers[this.targetCode];
    if (layer) {
      layer.setStyle({
        fillColor: TARGET_COLOR,
        fillOpacity: 0.8,
        color: '#15803d',
        weight: 3
      });
    }
  }

  focusOnTarget() {
    // Zoom and focus on the target country (with generous padding for context)
    const layer = this.countryLayers[this.targetCode];
    if (layer && layer.getBounds) {
      this.map.fitBounds(layer.getBounds(), {
        padding: [80, 80],
        maxZoom: 6,
        animate: true,
        duration: 0.5
      });
    }
  }

  enableInteraction() {
    this.map.dragging.enable();
    this.map.touchZoom.enable();
    this.map.scrollWheelZoom.enable();
    this.map.doubleClickZoom.enable();
    this.map.boxZoom.enable();

    // Add tile layer with country names
    if (!this.tileLayer) {
      this.tileLayer = createTileLayer(languageManager.lang);
      this.tileLayer.addTo(this.map);
      // Move tile layer below the country shapes
      this.tileLayer.bringToBack();
    }

    // Add zoom control if not already present
    if (!this.zoomControl) {
      this.zoomControl = L.control.zoom({ position: 'bottomleft' });
      this.zoomControl.addTo(this.map);
    }
  }

  disableInteraction() {
    this.map.dragging.disable();
    this.map.touchZoom.disable();
    this.map.scrollWheelZoom.disable();
    this.map.doubleClickZoom.disable();
    this.map.boxZoom.disable();

    // Remove tile layer
    if (this.tileLayer) {
      this.map.removeLayer(this.tileLayer);
      this.tileLayer = null;
    }

    // Remove zoom control
    if (this.zoomControl) {
      this.map.removeControl(this.zoomControl);
      this.zoomControl = null;
    }
  }

  fitToCountries(codes) {
    const bounds = L.latLngBounds([]);
    codes.forEach(code => {
      const layer = this.countryLayers[code];
      if (layer && layer.getBounds) {
        bounds.extend(layer.getBounds());
      }
    });

    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [20, 20], animate: true, duration: 0.5 });
    }
  }

  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  getCurrentProgress() {
    return this.progress;
  }

  reset() {
    this.stopAnimation();

    // Hide all countries
    Object.values(this.countryLayers).forEach(layer => {
      layer.setStyle({
        fillColor: 'transparent',
        fillOpacity: 0,
        color: 'transparent',
        weight: 0
      });
    });

    this.targetCode = null;
    this.targetContinent = null;
    this.continentCountries = [];
    this.candidateCountries = [];
    this.eliminatedCount = 0;
    this.progress = 0;
    this.currentPhase = 0;

    this.map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: false });
  }

  invalidateSize() {
    this.map.invalidateSize();
  }
}
