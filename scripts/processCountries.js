// Script to process raw country data into game format
import { readFileSync, writeFileSync } from 'fs';

const rawData = JSON.parse(readFileSync('/tmp/countries_raw.json', 'utf-8'));

const countries = {};

for (const country of rawData) {
  const code = country.cca2;

  // Skip countries without proper data
  if (!code || !country.latlng || country.latlng.length < 2) {
    continue;
  }

  // Skip very small territories that might not be visible on map
  const skipList = ['AQ', 'BV', 'HM', 'TF', 'GS', 'UM'];
  if (skipList.includes(code)) {
    continue;
  }

  const name = country.name?.common || country.name?.official;
  if (!name) continue;

  const capital = country.capital?.[0] || null;
  const capitalCoords = country.capitalInfo?.latlng || null;

  countries[code] = {
    name,
    continent: country.region || 'Unknown',
    subregion: country.subregion || null,
    capital,
    capitalCoords: capitalCoords ? [capitalCoords[0], capitalCoords[1]] : null,
    center: [country.latlng[0], country.latlng[1]],
    flag: `https://flagcdn.com/${code.toLowerCase()}.svg`
  };
}

writeFileSync(
  './public/data/countries.json',
  JSON.stringify(countries, null, 2),
  'utf-8'
);

console.log(`Processed ${Object.keys(countries).length} countries`);
