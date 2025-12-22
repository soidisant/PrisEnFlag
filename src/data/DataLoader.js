export class DataLoader {
  constructor() {
    this.countries = null;
    this.geojson = null;
  }

  async load() {
    try {
      const [countriesResponse, geojsonResponse] = await Promise.all([
        fetch('/data/countries.json'),
        fetch('/data/countries.geojson')
      ]);

      if (!countriesResponse.ok || !geojsonResponse.ok) {
        throw new Error('Failed to load game data');
      }

      this.countries = await countriesResponse.json();
      this.geojson = await geojsonResponse.json();

      return {
        countries: this.countries,
        geojson: this.geojson
      };
    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    }
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
