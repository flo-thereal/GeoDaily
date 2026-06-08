/**
 * One-time enrichment: adds capitalCoordinates to src/data/countries.json
 * using REST Countries capitalInfo lat/lng.
 *
 *   npx tsx scripts/enrich-capital-coords.ts
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface CountryEntry {
  code: string;
  name: string;
  capital: string;
  capitalCoordinates?: { lat: number; lng: number };
  [key: string]: unknown;
}

interface RestCountry {
  cca2: string;
  capital?: string[];
  capitalInfo?: { latlng?: [number, number] };
}

const MANUAL_CAPITAL_COORDS: Record<string, { lat: number; lng: number }> = {
  XK: { lat: 42.6629, lng: 21.1655 },
};

const DATA_PATH = join(process.cwd(), 'src/data/countries.json');

async function main() {
  const countries = JSON.parse(readFileSync(DATA_PATH, 'utf8')) as CountryEntry[];
  const res = await fetch(
    'https://restcountries.com/v3.1/all?fields=cca2,capital,capitalInfo'
  );
  if (!res.ok) throw new Error(`REST Countries failed: ${res.status}`);
  const rest = (await res.json()) as RestCountry[];
  const byCode = new Map(rest.map((c) => [c.cca2.toUpperCase(), c]));

  let enriched = 0;
  let missing: string[] = [];

  for (const country of countries) {
    if (MANUAL_CAPITAL_COORDS[country.code]) {
      country.capitalCoordinates = MANUAL_CAPITAL_COORDS[country.code];
      enriched++;
      continue;
    }

    const remote = byCode.get(country.code.toUpperCase());
    const latlng = remote?.capitalInfo?.latlng;
    if (latlng && latlng.length === 2) {
      country.capitalCoordinates = { lat: latlng[0], lng: latlng[1] };
      enriched++;
    } else {
      missing.push(`${country.code} (${country.name})`);
    }
  }

  writeFileSync(DATA_PATH, `${JSON.stringify(countries, null, 2)}\n`);
  console.log(`Updated ${enriched}/${countries.length} countries with capitalCoordinates.`);
  if (missing.length > 0) {
    console.warn('Missing capital coordinates for:', missing.join(', '));
    process.exitCode = 1;
  }
}

void main();
