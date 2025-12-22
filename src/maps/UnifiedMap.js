import L from 'leaflet';
import { IdleTracker } from './IdleTracker.js';
import { HintManager } from './HintManager.js';
import { createTileLayer, DEFAULT_CENTER, DEFAULT_ZOOM, findLayersAtPoint, calculateDistance } from './mapUtils.js';
import { languageManager } from '../i18n/LanguageManager.js';

// Configuration
const IDLE_THRESHOLD = 3000;           // 3 seconds before hints start
const HINT_INTERVAL = 3000;            // 3 seconds between hint progressions
const WRONG_AREA_THRESHOLD = 3000;     // 3 seconds in wrong area before shake hint
const ZOOM_THRESHOLD = 0.5;            // Tolerance for "at default zoom"

// Colors
const COLORS = {
  OCEAN: '#aad3df',
  DEFAULT: 'transparent',
  CONTINENT: '#e8e8e8',
  CANDIDATE: '#fbbf24',
  TARGET: '#22c55e',
  SELECTION: '#3388ff',
  ELIMINATED: '#ccc'
};

export class UnifiedMap {
  constructor(containerId) {
    // Initialize map with full interactivity
    this.map = L.map(containerId, {
      zoomControl: true,
      attributionControl: true
    }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

    this.map.getContainer().style.background = COLORS.OCEAN;

    // Tile layer
    this.tileLayer = createTileLayer(languageManager.lang);
    this.tileLayer.addTo(this.map);

    // GeoJSON
    this.countriesLayer = null;
    this.countryLayers = {};
    this.countriesData = null;

    // Selection state (from AnswerMap)
    this.marker = null;
    this.selectedCountryCode = null;
    this.selectedLatLng = null;
    this.highlightedLayer = null;
    this.selectedViaPanel = false; // Track if selection was made via hint panel

    // Target state (from ClueMap)
    this.targetCode = null;
    this.targetContinent = null;
    this.continentCountries = [];
    this.candidateCountries = [];

    // Idle and hint tracking
    this.idleTracker = new IdleTracker(IDLE_THRESHOLD);
    this.hintManager = new HintManager();
    this.hintIntervalId = null;
    this.wrongAreaCheckId = null;

    // Zoom state tracking
    this.userHasZoomed = false;
    this.autoZoomInProgress = false;

    // Round state
    this.isRoundActive = false;

    // Callbacks
    this.onCountrySelected = null;
    this.onCandidatesRevealed = null;
    this.onCandidateEliminated = null;

    // Hint toggle
    this.hintsEnabled = true;

    this.setupEventListeners();
  }

  setHintsEnabled(enabled) {
    this.hintsEnabled = enabled;
    if (!enabled && this.isRoundActive) {
      // Clear any current hint displays
      this.resetCountryStyles();
      this.hintManager.reset();
      this.clearHintTimers();
    }
  }

  setupEventListeners() {
    // Click handler for country selection
    this.map.on('click', (e) => {
      if (this.isRoundActive) {
        this.handleClick(e.latlng);
      }
    });

    // Track user interactions for idle detection
    // Only reset idle on actual mouse/touch actions, not on scroll/zoom
    const container = this.map.getContainer();
    ['mousedown', 'touchstart'].forEach(event => {
      container.addEventListener(event, () => {
        if (this.isRoundActive) {
          this.idleTracker.recordActivity();
        }
      }, { passive: true });
    });

    // Track zoom changes
    this.map.on('zoomstart', () => {
      if (!this.autoZoomInProgress && this.isRoundActive) {
        this.userHasZoomed = true;
      }
    });

    this.map.on('zoomend', () => {
      // Check if user returned to world view
      if (this.map.getZoom() <= DEFAULT_ZOOM + ZOOM_THRESHOLD) {
        this.userHasZoomed = false;
      }
    });

    // Idle callbacks
    this.idleTracker.onIdle(() => this.handleIdleStart());
    this.idleTracker.onActivity(() => this.handleActivity());
  }

  setLanguage(lang) {
    if (this.tileLayer) {
      this.map.removeLayer(this.tileLayer);
    }
    this.tileLayer = createTileLayer(lang);
    this.tileLayer.addTo(this.map);
  }

  setGeoJSON(geojson, countriesData) {
    this.countriesData = countriesData;

    if (this.countriesLayer) {
      this.map.removeLayer(this.countriesLayer);
    }

    this.countryLayers = {};

    this.countriesLayer = L.geoJSON(geojson, {
      style: {
        fillColor: COLORS.DEFAULT,
        fillOpacity: 0,
        color: '#3388ff',
        weight: 1,
        opacity: 0.3
      },
      onEachFeature: (feature, layer) => {
        const code = feature.properties['ISO3166-1-Alpha-2'];
        if (code && code !== '-99') {
          this.countryLayers[code] = layer;
          layer.countryCode = code;
          layer.countryName = feature.properties.name;
          layer.feature = feature; // Store feature for SVG generation
        }
      }
    }).addTo(this.map);
  }

  // ========== Target Setup (from ClueMap) ==========

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

    // Reset hint manager
    this.hintManager.reset();
    this.hintManager.setTotalCandidates(this.candidateCountries.length);
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // ========== Round Control ==========

  startRound() {
    this.isRoundActive = true;
    this.userHasZoomed = false;
    this.autoZoomInProgress = false;

    // Reset selection
    this.clearSelection();

    // Reset all country styles
    this.resetCountryStyles();

    // Reset view to world
    this.map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: true });

    // Start idle tracking
    this.idleTracker.reset();
    this.idleTracker.start();
  }

  stopRound() {
    this.isRoundActive = false;
    this.idleTracker.stop();
    this.clearHintTimers();
  }

  // ========== Idle & Hint System ==========

  handleIdleStart() {
    if (!this.isRoundActive || !this.hintsEnabled) return;

    // Start hint progression
    this.triggerNextHint();

    // Set up interval for continued hints
    this.hintIntervalId = setInterval(() => {
      if (this.idleTracker.isIdle && this.isRoundActive) {
        this.triggerNextHint();
      }
    }, HINT_INTERVAL);

    // Start wrong area checking
    this.startWrongAreaCheck();
  }

  handleActivity() {
    // Clear hint timers but keep current hints visible
    this.clearHintTimers();
  }

  clearHintTimers() {
    if (this.hintIntervalId) {
      clearInterval(this.hintIntervalId);
      this.hintIntervalId = null;
    }
    if (this.wrongAreaCheckId) {
      clearInterval(this.wrongAreaCheckId);
      this.wrongAreaCheckId = null;
    }
  }

  triggerNextHint() {
    // Only auto-zoom if user hasn't manually zoomed
    const canAutoZoom = !this.userHasZoomed;

    const nextHint = this.hintManager.getNextHint();

    switch (nextHint) {
      case 'continent':
        this.showContinentHint(canAutoZoom);
        this.hintManager.markContinentZoomed();
        break;

      case 'candidates':
        this.showCandidatesHint(canAutoZoom);
        this.hintManager.markCandidatesHighlighted();
        break;

      case 'elimination':
        if (!this.hintManager.isEliminationStarted()) {
          this.hintManager.markEliminationStarted();
        }
        this.eliminateNextCandidate();
        break;
    }
  }

  showContinentHint(autoZoom) {
    // Highlight continent countries by dimming non-continent countries
    Object.entries(this.countryLayers).forEach(([code, layer]) => {
      if (this.continentCountries.includes(code)) {
        // Keep continent countries clear/normal - no fill overlay
        layer.setStyle({
          fillColor: COLORS.DEFAULT,
          fillOpacity: 0,
          color: '#3388ff',
          weight: 1.5,
          opacity: 0.6
        });
      } else {
        // Dim non-continent countries with dark overlay
        layer.setStyle({
          fillColor: '#1e293b',
          fillOpacity: 0.5,
          color: '#475569',
          weight: 0.5,
          opacity: 0.5
        });
      }
    });

    if (autoZoom) {
      this.fitToCountries(this.continentCountries);
    }
  }

  showCandidatesHint(autoZoom) {
    // Highlight candidate countries
    this.continentCountries.forEach(code => {
      const layer = this.countryLayers[code];
      if (layer) {
        if (this.candidateCountries.includes(code)) {
          layer.setStyle({
            fillColor: COLORS.CANDIDATE,
            fillOpacity: 0.8,
            color: '#b45309',
            weight: 2
          });
        } else {
          layer.setStyle({
            fillColor: COLORS.CONTINENT,
            fillOpacity: 0.3,
            color: '#ccc',
            weight: 1
          });
        }
      }
    });

    if (autoZoom) {
      this.fitToCountries(this.candidateCountries);
    }

    // Notify UI to show candidates panel
    if (this.onCandidatesRevealed) {
      const candidatesData = this.candidateCountries.map(code => ({
        code,
        name: this.countriesData[code]?.name || code,
        svg: this.getCountrySVG(code)
      }));
      this.onCandidatesRevealed(candidatesData);
    }
  }

  eliminateNextCandidate() {
    // Find a non-target candidate to eliminate
    const remaining = this.candidateCountries.filter(code => {
      const layer = this.countryLayers[code];
      return code !== this.targetCode && layer &&
             layer.options.fillColor === COLORS.CANDIDATE;
    });

    if (remaining.length > 0) {
      const toEliminate = remaining[0];
      const layer = this.countryLayers[toEliminate];
      if (layer) {
        layer.setStyle({
          fillColor: COLORS.CONTINENT,
          fillOpacity: 0.3,
          color: '#ccc',
          weight: 1
        });
      }
      this.hintManager.incrementEliminated();

      // Notify UI to update candidates panel
      if (this.onCandidateEliminated) {
        this.onCandidateEliminated(toEliminate);
      }
    }
  }

  // ========== Wrong Area Detection ==========

  startWrongAreaCheck() {
    let wrongAreaTime = 0;

    this.wrongAreaCheckId = setInterval(() => {
      if (!this.isRoundActive || !this.userHasZoomed) {
        wrongAreaTime = 0;
        return;
      }

      if (!this.isTargetInView()) {
        wrongAreaTime += 500;
        if (wrongAreaTime >= WRONG_AREA_THRESHOLD) {
          this.showZoomOutHint();
          wrongAreaTime = 0; // Reset to avoid spamming
        }
      } else {
        wrongAreaTime = 0;
      }
    }, 500);
  }

  isTargetInView() {
    const targetLayer = this.countryLayers[this.targetCode];
    if (!targetLayer) return true;

    const viewBounds = this.map.getBounds();
    const targetBounds = targetLayer.getBounds();

    return viewBounds.intersects(targetBounds);
  }

  showZoomOutHint() {
    const container = this.map.getContainer();
    container.classList.add('shake-hint');
    setTimeout(() => container.classList.remove('shake-hint'), 600);
  }

  // ========== Map Fitting ==========

  fitToCountries(codes) {
    this.autoZoomInProgress = true;

    const bounds = L.latLngBounds([]);
    codes.forEach(code => {
      const layer = this.countryLayers[code];
      if (layer && layer.getBounds) {
        bounds.extend(layer.getBounds());
      }
    });

    if (bounds.isValid()) {
      this.map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 6,
        animate: true,
        duration: 0.5
      });
    }

    // Clear auto-zoom flag after animation
    setTimeout(() => {
      this.autoZoomInProgress = false;
    }, 600);
  }

  // ========== Selection (from AnswerMap) ==========

  handleClick(latlng) {
    if (!this.countriesLayer) return;

    this.selectedViaPanel = false; // Direct map click

    const layers = findLayersAtPoint(latlng, this.countriesLayer);

    if (layers.length > 0) {
      this.selectCountry(layers[0], latlng);
    } else {
      // Clicked ocean
      this.placeMarker(latlng);
      this.clearHighlight();
      this.selectedCountryCode = null;

      if (this.onCountrySelected) {
        this.onCountrySelected(null, null, latlng);
      }
    }
  }

  selectCountry(layer, latlng) {
    this.placeMarker(latlng);
    this.highlightSelection(layer);

    this.selectedCountryCode = layer.countryCode;
    this.selectedLatLng = latlng;

    if (this.onCountrySelected) {
      this.onCountrySelected(layer.countryCode, layer.countryName, latlng);
    }
  }

  placeMarker(latlng) {
    if (this.marker) {
      this.marker.setLatLng(latlng);
    } else {
      this.marker = L.marker(latlng).addTo(this.map);
    }
  }

  highlightSelection(layer) {
    this.clearHighlight();
    this.highlightedLayer = layer;

    // Only change border, preserve fill from hint system
    const currentFill = layer.options.fillColor;
    const currentOpacity = layer.options.fillOpacity;

    layer.setStyle({
      fillColor: currentFill || COLORS.SELECTION,
      fillOpacity: Math.max(currentOpacity, 0.3),
      color: COLORS.SELECTION,
      weight: 3,
      opacity: 1
    });
  }

  clearHighlight() {
    if (this.highlightedLayer) {
      // Restore to hint-based style
      const code = this.highlightedLayer.countryCode;
      this.restoreCountryStyle(code);
      this.highlightedLayer = null;
    }
  }

  restoreCountryStyle(code) {
    const layer = this.countryLayers[code];
    if (!layer) return;

    // Determine style based on hint state
    if (this.hintManager.areCandidatesHighlighted()) {
      if (this.candidateCountries.includes(code)) {
        // Check if eliminated
        const isEliminated = layer.options.fillColor === COLORS.CONTINENT;
        if (!isEliminated) {
          layer.setStyle({
            fillColor: COLORS.CANDIDATE,
            fillOpacity: 0.8,
            color: '#b45309',
            weight: 2
          });
        }
      }
    } else if (this.hintManager.isContinentZoomed()) {
      if (this.continentCountries.includes(code)) {
        layer.setStyle({
          fillColor: COLORS.CONTINENT,
          fillOpacity: 0.7,
          color: '#999',
          weight: 1
        });
      }
    } else {
      layer.setStyle({
        fillColor: COLORS.DEFAULT,
        fillOpacity: 0,
        color: '#3388ff',
        weight: 1,
        opacity: 0.3
      });
    }
  }

  clearSelection() {
    if (this.marker) {
      this.map.removeLayer(this.marker);
      this.marker = null;
    }
    this.clearHighlight();
    this.selectedCountryCode = null;
    this.selectedLatLng = null;
  }

  getSelectedCountry() {
    return {
      countryCode: this.selectedCountryCode,
      latlng: this.selectedLatLng,
      viaPanel: this.selectedViaPanel
    };
  }

  selectCandidateByCode(code) {
    const layer = this.countryLayers[code];
    if (layer && layer.getBounds) {
      this.selectedViaPanel = true; // Selection via hint panel
      const center = layer.getBounds().getCenter();
      this.selectCountry(layer, center);
    }
  }

  getDistanceToCapital(capitalCoords) {
    if (!this.selectedLatLng || !capitalCoords) return Infinity;
    return calculateDistance(this.selectedLatLng, capitalCoords);
  }

  // Generate SVG path for a country silhouette
  getCountrySVG(code) {
    const layer = this.countryLayers[code];
    if (!layer || !layer.feature) return null;

    const feature = layer.feature;
    const geometry = feature.geometry;

    // Get all coordinates (handle both Polygon and MultiPolygon)
    let allCoords = [];
    if (geometry.type === 'Polygon') {
      allCoords = [geometry.coordinates[0]]; // Outer ring only
    } else if (geometry.type === 'MultiPolygon') {
      // Get outer ring of each polygon
      allCoords = geometry.coordinates.map(poly => poly[0]);
    }

    if (allCoords.length === 0) return null;

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

    // Convert coordinates to SVG path
    const paths = allCoords.map(ring => {
      const points = ring.map(([lon, lat]) => {
        const x = padding + (lon - minX) * scale;
        const y = padding + (maxY - lat) * scale; // Flip Y axis
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });
      return `M${points.join('L')}Z`;
    }).join(' ');

    return `<svg viewBox="0 0 ${svgSize} ${svgSize}" width="${svgSize}" height="${svgSize}"><path d="${paths}" fill="#6b7280" stroke="#374151" stroke-width="0.5"/></svg>`;
  }

  // ========== Result Display ==========

  showTarget() {
    const layer = this.countryLayers[this.targetCode];
    if (layer) {
      layer.setStyle({
        fillColor: COLORS.TARGET,
        fillOpacity: 0.8,
        color: '#15803d',
        weight: 3
      });
    }
  }

  focusOnTarget() {
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

  // ========== Utility ==========

  resetCountryStyles() {
    Object.values(this.countryLayers).forEach(layer => {
      layer.setStyle({
        fillColor: COLORS.DEFAULT,
        fillOpacity: 0,
        color: '#3388ff',
        weight: 1,
        opacity: 0.3
      });
    });
  }

  getHintProgress() {
    return this.hintManager.getHintProgress();
  }

  reset() {
    this.stopRound();
    this.clearSelection();
    this.resetCountryStyles();
    this.hintManager.reset();
    this.userHasZoomed = false;
    this.targetCode = null;
    this.targetContinent = null;
    this.continentCountries = [];
    this.candidateCountries = [];
    this.map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: false });
  }

  invalidateSize() {
    this.map.invalidateSize();
  }
}
