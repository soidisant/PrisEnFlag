// Script to add difficulty ratings to countries
// Difficulty: 1 = Easy (famous countries), 2 = Medium, 3 = Hard (obscure/small countries)

import { readFileSync, writeFileSync } from 'fs';

const countries = JSON.parse(readFileSync('./public/data/countries.json', 'utf-8'));

// Easy countries (1) - Major world powers, very famous, distinctive flags
const easyCountries = new Set([
  'US', 'GB', 'FR', 'DE', 'IT', 'ES', 'PT', 'JP', 'CN', 'IN', 'BR', 'MX',
  'CA', 'AU', 'RU', 'KR', 'ZA', 'EG', 'TR', 'GR', 'SE', 'NO', 'DK', 'FI',
  'NL', 'BE', 'CH', 'AT', 'PL', 'IE', 'AR', 'CL', 'CO', 'PE', 'NZ', 'TH',
  'VN', 'ID', 'PH', 'MY', 'SG', 'IL', 'SA', 'AE', 'NG', 'KE', 'MA', 'UA',
  'CZ', 'HU', 'RO', 'PK', 'BD', 'IR', 'IQ'
]);

// Medium countries (2) - Known but less famous, or similar-looking flags
const mediumCountries = new Set([
  'HR', 'RS', 'BG', 'SK', 'SI', 'LT', 'LV', 'EE', 'IS', 'LU', 'MT', 'CY',
  'AL', 'MK', 'BA', 'ME', 'XK', 'MD', 'BY', 'GE', 'AM', 'AZ', 'KZ', 'UZ',
  'TM', 'KG', 'TJ', 'MN', 'NP', 'LK', 'MM', 'KH', 'LA', 'BN', 'TW', 'HK',
  'MO', 'JO', 'LB', 'SY', 'KW', 'QA', 'BH', 'OM', 'YE', 'AF', 'ET', 'TZ',
  'UG', 'GH', 'CI', 'SN', 'CM', 'AO', 'MZ', 'MG', 'ZW', 'ZM', 'BW', 'NA',
  'TN', 'DZ', 'LY', 'SD', 'EC', 'VE', 'BO', 'PY', 'UY', 'CR', 'PA', 'CU',
  'DO', 'JM', 'TT', 'PR', 'GT', 'HN', 'SV', 'NI', 'HT'
]);

// Everything else is Hard (3) - Pacific islands, small Caribbean, obscure nations

let easy = 0, medium = 0, hard = 0;

for (const [code, data] of Object.entries(countries)) {
  if (easyCountries.has(code)) {
    data.difficulty = 1;
    easy++;
  } else if (mediumCountries.has(code)) {
    data.difficulty = 2;
    medium++;
  } else {
    data.difficulty = 3;
    hard++;
  }
}

console.log(`Difficulty assigned:`);
console.log(`  Easy (1): ${easy} countries`);
console.log(`  Medium (2): ${medium} countries`);
console.log(`  Hard (3): ${hard} countries`);
console.log(`  Total: ${easy + medium + hard} countries`);

writeFileSync('./public/data/countries.json', JSON.stringify(countries, null, 2), 'utf-8');
console.log('\nCountries file updated!');
