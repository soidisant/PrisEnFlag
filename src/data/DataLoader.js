export class DataLoader {
  constructor() {
    this.countries = null;
    this.geojson = null;
    this.loaded = false;
  }

  async load(onProgress = null) {
    // Return cached data if already loaded
    if (this.loaded) {
      return {
        countries: this.countries,
        geojson: this.geojson
      };
    }

    try {
      // Load countries data
      if (onProgress) onProgress(10, 'loadingCountries');
      const countriesResponse = await fetch('/data/countries.json');
      if (!countriesResponse.ok) throw new Error('Failed to load countries');
      this.countries = await countriesResponse.json();

      if (onProgress) onProgress(40, 'loadingMap');

      // Load GeoJSON (larger file)
      const geojsonResponse = await fetch('/data/countries.geojson');
      if (!geojsonResponse.ok) throw new Error('Failed to load map');
      this.geojson = await geojsonResponse.json();

      if (onProgress) onProgress(100, '');

      this.loaded = true;

      return {
        countries: this.countries,
        geojson: this.geojson
      };
    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    }
  }

  isLoaded() {
    return this.loaded;
  }

  getCountries() {
    return this.countries;
  }

  getGeoJSON() {
    return this.geojson;
  }

  getCountryByCode(code) {
    return this.countries?.[code] || null;
  }

  getRandomCountry() {
    if (!this.countries) return null;

    const codes = Object.keys(this.countries);
    const randomIndex = Math.floor(Math.random() * codes.length);
    const code = codes[randomIndex];

    return {
      code,
      ...this.countries[code]
    };
  }

  getCountryList() {
    if (!this.countries) return [];

    return Object.entries(this.countries).map(([code, data]) => ({
      code,
      ...data
    }));
  }
}
