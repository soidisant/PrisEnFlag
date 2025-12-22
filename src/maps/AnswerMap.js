import L from 'leaflet';
import { createTileLayer, DEFAULT_CENTER, DEFAULT_ZOOM, calculateDistance, findLayersAtPoint } from './mapUtils.js';

export class AnswerMap {
  constructor(containerId) {
    this.map = L.map(containerId).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

    createTileLayer().addTo(this.map);

    this.marker = null;
    this.countriesLayer = null;
    this.selectedCountryCode = null;
    this.selectedLatLng = null;
    this.highlightedLayer = null;

    this.onCountrySelected = null;

    this.setupClickHandler();
  }

  setGeoJSON(geojson) {
    if (this.countriesLayer) {
      this.map.removeLayer(this.countriesLayer);
    }

    this.countriesLayer = L.geoJSON(geojson, {
      style: {
        fillColor: 'transparent',
        fillOpacity: 0,
        color: '#3388ff',
        weight: 1,
        opacity: 0.3
      },
      onEachFeature: (feature, layer) => {
        // Store the country code for lookup (GeoJSON uses ISO3166-1-Alpha-2)
        layer.countryCode = feature.properties['ISO3166-1-Alpha-2'];
        layer.countryName = feature.properties.name;
      }
    }).addTo(this.map);
  }

  setupClickHandler() {
    this.map.on('click', (e) => {
      this.handleClick(e.latlng);
    });
  }

  handleClick(latlng) {
    // Find which country was clicked
    if (!this.countriesLayer) return;

    const layers = findLayersAtPoint(latlng, this.countriesLayer);

    if (layers.length > 0) {
      const clickedLayer = layers[0];
      this.selectCountry(clickedLayer, latlng);
    } else {
      // Clicked outside any country (ocean)
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
    this.highlightCountry(layer);

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

  highlightCountry(layer) {
    this.clearHighlight();

    this.highlightedLayer = layer;
    layer.setStyle({
      fillColor: '#3388ff',
      fillOpacity: 0.3,
      color: '#3388ff',
      weight: 2,
      opacity: 1
    });
  }

  clearHighlight() {
    if (this.highlightedLayer) {
      this.highlightedLayer.setStyle({
        fillColor: 'transparent',
        fillOpacity: 0,
        color: '#3388ff',
        weight: 1,
        opacity: 0.3
      });
      this.highlightedLayer = null;
    }
  }

  showCorrectCountry(countryCode) {
    if (!this.countriesLayer) return;

    this.countriesLayer.eachLayer((layer) => {
      if (layer.countryCode === countryCode) {
        layer.setStyle({
          fillColor: '#22c55e',
          fillOpacity: 0.4,
          color: '#22c55e',
          weight: 3,
          opacity: 1
        });
      }
    });
  }

  getSelectedCountry() {
    return {
      countryCode: this.selectedCountryCode,
      latlng: this.selectedLatLng
    };
  }

  getDistanceToCapital(capitalCoords) {
    if (!this.selectedLatLng || !capitalCoords) return Infinity;
    return calculateDistance(this.selectedLatLng, capitalCoords);
  }

  reset() {
    if (this.marker) {
      this.map.removeLayer(this.marker);
      this.marker = null;
    }

    this.clearHighlight();

    // Reset all country styles
    if (this.countriesLayer) {
      this.countriesLayer.eachLayer((layer) => {
        layer.setStyle({
          fillColor: 'transparent',
          fillOpacity: 0,
          color: '#3388ff',
          weight: 1,
          opacity: 0.3
        });
      });
    }

    this.selectedCountryCode = null;
    this.selectedLatLng = null;
    this.map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  }

  invalidateSize() {
    this.map.invalidateSize();
  }
}
