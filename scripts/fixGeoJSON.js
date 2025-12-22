// Script to fix GeoJSON ISO codes by matching country names with countries.json
import { readFileSync, writeFileSync } from 'fs';

const geojson = JSON.parse(readFileSync('./public/data/countries.geojson', 'utf-8'));
const countries = JSON.parse(readFileSync('./public/data/countries.json', 'utf-8'));

// Create name -> code mapping from countries.json
const nameToCode = {};
for (const [code, data] of Object.entries(countries)) {
  nameToCode[data.name.toLowerCase()] = code;
}

// Add common name variations
const nameAliases = {
  'united states of america': 'US',
  'united kingdom': 'GB',
  'russia': 'RU',
  'south korea': 'KR',
  'north korea': 'KP',
  'czech republic': 'CZ',
  'czechia': 'CZ',
  'democratic republic of the congo': 'CD',
  'republic of the congo': 'CG',
  'ivory coast': 'CI',
  "côte d'ivoire": 'CI',
  'east timor': 'TL',
  'timor-leste': 'TL',
  'myanmar': 'MM',
  'burma': 'MM',
  'eswatini': 'SZ',
  'swaziland': 'SZ',
  'the bahamas': 'BS',
  'bahamas': 'BS',
  'the gambia': 'GM',
  'gambia': 'GM',
  'republic of serbia': 'RS',
  'serbia': 'RS',
  'united republic of tanzania': 'TZ',
  'tanzania': 'TZ',
  'brunei darussalam': 'BN',
  'brunei': 'BN',
  'cabo verde': 'CV',
  'cape verde': 'CV',
  'vatican city': 'VA',
  'holy see': 'VA',
  'taiwan': 'TW',
  'north macedonia': 'MK',
  'macedonia': 'MK'
};

Object.assign(nameToCode, nameAliases);

let fixed = 0;
let notFound = [];

for (const feature of geojson.features) {
  const currentCode = feature.properties['ISO3166-1-Alpha-2'];
  const name = feature.properties.name;

  if (currentCode === '-99' || !currentCode) {
    const nameLower = name?.toLowerCase();
    const newCode = nameToCode[nameLower];

    if (newCode) {
      feature.properties['ISO3166-1-Alpha-2'] = newCode;
      fixed++;
      console.log(`Fixed: ${name} -> ${newCode}`);
    } else {
      notFound.push(name);
    }
  }
}

console.log(`\nFixed ${fixed} countries`);
console.log(`Not found: ${notFound.length}`, notFound);

writeFileSync('./public/data/countries.geojson', JSON.stringify(geojson), 'utf-8');
console.log('\nGeoJSON file updated!');
