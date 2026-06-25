/**
 * Downloads Natural Earth 50m country boundaries, strips unused properties,
 * and writes public/data/country-boundaries.geojson for the map quiz.
 *
 *   npm run prepare:boundaries
 */
import { writeFileSync } from 'fs';
import { join } from 'path';
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';

const SOURCE_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson';
const OUT_PATH = join(process.cwd(), 'public', 'data', 'country-boundaries.geojson');

const KEEP_PROPS = ['ISO_A2', 'ISO_A2_EH', 'ADMIN'] as const;

type CountryFeature = Feature<Polygon | MultiPolygon>;

function stripFeature(feature: CountryFeature): CountryFeature | null {
  if (feature.geometry.type !== 'Polygon' && feature.geometry.type !== 'MultiPolygon') {
    return null;
  }

  const props = feature.properties ?? {};
  const stripped: Record<string, string> = {};
  for (const key of KEEP_PROPS) {
    const value = props[key];
    if (typeof value === 'string' && value.length > 0) {
      stripped[key] = value;
    }
  }

  return {
    type: 'Feature',
    properties: stripped,
    geometry: feature.geometry,
  };
}

async function main() {
  console.log(`Fetching ${SOURCE_URL}...`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) {
    throw new Error(`Failed to download boundaries: ${res.status} ${res.statusText}`);
  }

  const source = (await res.json()) as FeatureCollection;
  const features: CountryFeature[] = [];

  for (const feature of source.features) {
    const stripped = stripFeature(feature as CountryFeature);
    if (stripped) features.push(stripped);
  }

  const collection = {
    type: 'FeatureCollection' as const,
    name: 'ne_50m_admin_0_countries',
    features,
  };

  const json = JSON.stringify(collection);
  writeFileSync(OUT_PATH, json, 'utf8');

  console.log(`Wrote ${features.length} features to ${OUT_PATH} (${(json.length / 1024 / 1024).toFixed(2)} MB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
