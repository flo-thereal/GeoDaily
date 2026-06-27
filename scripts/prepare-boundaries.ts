/**
 * Downloads Natural Earth 10m country boundaries, filters to app countries,
 * and writes per-ISO GeoJSON files under public/data/boundaries/.
 *
 *   npm run prepare:boundaries
 */
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import countries from '../src/data/countries.json';

const SOURCE_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson';
const OUT_DIR = join(process.cwd(), 'public', 'data', 'boundaries');
const LEGACY_MONOLITH = join(process.cwd(), 'public', 'data', 'country-boundaries.geojson');

const KEEP_PROPS = ['ISO_A2', 'ISO_A2_EH', 'ADMIN'] as const;

const ADMIN_ALIASES: Record<string, string> = {
  'United States': 'United States of America',
  'Czech Republic': 'Czechia',
  Congo: 'Republic of the Congo',
  'Cape Verde': 'Cabo Verde',
  'São Tomé and Príncipe': 'Sao Tome and Principe',
  Swaziland: 'eSwatini',
  'East Timor': 'Timor-Leste',
  Burma: 'Myanmar',
};

type CountryFeature = Feature<Polygon | MultiPolygon>;

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function isValidIsoCode(code: unknown): code is string {
  return typeof code === 'string' && code.length >= 2 && code !== '-99';
}

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

const appCodes = new Set(countries.map((c) => normalizeCode(c.code)));

const adminToCode = new Map<string, string>();
for (const country of countries) {
  adminToCode.set(country.name, normalizeCode(country.code));
  const alias = ADMIN_ALIASES[country.name];
  if (alias) adminToCode.set(alias, normalizeCode(country.code));
}

function resolveAppCode(feature: CountryFeature): string | null {
  const props = feature.properties ?? {};
  const iso2 = isValidIsoCode(props.ISO_A2) ? props.ISO_A2 : props.ISO_A2_EH;
  if (isValidIsoCode(iso2) && appCodes.has(normalizeCode(iso2))) {
    return normalizeCode(iso2);
  }

  const admin = typeof props.ADMIN === 'string' ? props.ADMIN : undefined;
  if (admin && adminToCode.has(admin)) {
    return adminToCode.get(admin)!;
  }

  return null;
}

async function main() {
  console.log(`Fetching ${SOURCE_URL}...`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) {
    throw new Error(`Failed to download boundaries: ${res.status} ${res.statusText}`);
  }

  const source = (await res.json()) as FeatureCollection;
  const byCode = new Map<string, CountryFeature>();

  for (const feature of source.features) {
    const stripped = stripFeature(feature as CountryFeature);
    if (!stripped) continue;

    const code = resolveAppCode(stripped);
    if (!code) continue;

    const existing = byCode.get(code);
    if (!existing) {
      byCode.set(code, stripped);
      continue;
    }

    // Prefer feature whose ISO_A2 matches the app code (handles split entries).
    const existingIso = existing.properties?.ISO_A2;
    if (existingIso !== code && stripped.properties?.ISO_A2 === code) {
      byCode.set(code, stripped);
    }
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const index: Record<string, number> = {};
  for (const [code, feature] of byCode) {
    const json = JSON.stringify(feature);
    const outPath = join(OUT_DIR, `${code}.geojson`);
    writeFileSync(outPath, json, 'utf8');
    index[code] = json.length;
  }

  writeFileSync(join(OUT_DIR, 'index.json'), JSON.stringify(index), 'utf8');

  const missing = countries
    .map((c) => normalizeCode(c.code))
    .filter((code) => !byCode.has(code));

  if (missing.length > 0) {
    console.warn(`Warning: no boundary polygon for ${missing.length} countries:`, missing.join(', '));
  }

  rmSync(LEGACY_MONOLITH, { force: true });
  console.log(`Removed legacy monolith ${LEGACY_MONOLITH}`);

  const totalKb = Object.values(index).reduce((sum, n) => sum + n, 0) / 1024;
  console.log(
    `Wrote ${byCode.size} boundary files to ${OUT_DIR} (${totalKb.toFixed(0)} KB total, index.json included)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
