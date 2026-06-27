/**
 * Downloads country boundaries and writes per-ISO GeoJSON files under
 * public/data/boundaries/.
 *
 * Tier A (areaKm2 < 1,000): geoBoundaries full resolution
 * Tier B (1,000 ≤ areaKm2 < 5,000): geoBoundaries simplified
 * Tier C (areaKm2 ≥ 5,000): Natural Earth 10m admin-0
 *
 *   npm run prepare:boundaries
 */
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from 'geojson';
import countries from '../src/data/countries.json';

const NE_SOURCE_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson';
const GEOBOUNDARIES_API = 'https://www.geoboundaries.org/api/current/gbOpen';
const OUT_DIR = join(process.cwd(), 'public', 'data', 'boundaries');
const LEGACY_MONOLITH = join(process.cwd(), 'public', 'data', 'country-boundaries.geojson');
const GEOBOUNDARIES_RATE_LIMIT_MS = 200;

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

/** ISO-2 codes where Natural Earth ISO_A3 does not match geoBoundaries ISO-3. */
const ISO2_TO_ISO3_OVERRIDES: Record<string, string> = {
  GB: 'GBR',
  GR: 'GRC',
  CI: 'CIV',
  CD: 'COD',
  CG: 'COG',
  KP: 'PRK',
  KR: 'KOR',
  LA: 'LAO',
  FM: 'FSM',
  SY: 'SYR',
  TW: 'TWN',
  TZ: 'TZA',
  US: 'USA',
  VA: 'VAT',
  VN: 'VNM',
  BO: 'BOL',
  BN: 'BRN',
  IR: 'IRN',
  RU: 'RUS',
  VE: 'VEN',
  VU: 'VUT',
  MK: 'MKD',
  MD: 'MDA',
  SZ: 'SWZ',
  TL: 'TLS',
  CV: 'CPV',
  ST: 'STP',
};

type CountryFeature = Feature<Polygon | MultiPolygon>;
type BoundaryTier = 'full' | 'simplified' | 'natural-earth';

interface GeoBoundariesMeta {
  gjDownloadURL?: string;
  simplifiedGeometryGeoJSON?: string;
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function isValidIsoCode(code: unknown): code is string {
  return typeof code === 'string' && code.length >= 2 && code !== '-99';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function extractPolygons(geometry: Polygon | MultiPolygon): Position[][][] {
  if (geometry.type === 'Polygon') {
    return [geometry.coordinates];
  }
  return geometry.coordinates;
}

function mergeToMultiPolygon(features: CountryFeature[]): MultiPolygon | null {
  const polygons: Position[][][] = [];

  for (const feature of features) {
    polygons.push(...extractPolygons(feature.geometry));
  }

  if (polygons.length === 0) return null;
  return { type: 'MultiPolygon', coordinates: polygons };
}

function parseBoundaryGeoJson(data: unknown): CountryFeature | null {
  if (!data || typeof data !== 'object') return null;

  const features: CountryFeature[] = [];

  if ((data as Feature).type === 'Feature') {
    const stripped = stripFeature(data as CountryFeature);
    if (stripped) features.push(stripped);
  } else if ((data as FeatureCollection).type === 'FeatureCollection') {
    for (const feature of (data as FeatureCollection).features) {
      const stripped = stripFeature(feature as CountryFeature);
      if (stripped) features.push(stripped);
    }
  }

  if (features.length === 0) return null;
  if (features.length === 1) return features[0];

  const geometry = mergeToMultiPolygon(features);
  if (!geometry) return null;

  const props = { ...features[0].properties };
  return { type: 'Feature', properties: props, geometry };
}

function boundaryTierForArea(areaKm2: number): BoundaryTier {
  if (areaKm2 < 1_000) return 'full';
  if (areaKm2 < 5_000) return 'simplified';
  return 'natural-earth';
}

const appCodes = new Set(countries.map((c) => normalizeCode(c.code)));

const areaByCode = new Map<string, number>();
for (const country of countries) {
  areaByCode.set(normalizeCode(country.code), country.areaKm2);
}

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

function resolveIso3(iso2: string, iso3ByCode: Map<string, string>): string | null {
  const override = ISO2_TO_ISO3_OVERRIDES[iso2];
  if (override) return override;

  const iso3 = iso3ByCode.get(iso2);
  if (iso3) return iso3;

  return null;
}

async function fetchGeoBoundariesFeature(
  iso3: string,
  tier: 'full' | 'simplified'
): Promise<CountryFeature | null> {
  const metaRes = await fetch(`${GEOBOUNDARIES_API}/${iso3}/ADM0/`);
  if (!metaRes.ok) {
    console.warn(`  geoBoundaries API ${metaRes.status} for ${iso3}`);
    return null;
  }

  const meta = (await metaRes.json()) as GeoBoundariesMeta;
  const url =
    tier === 'full' ? meta.gjDownloadURL : meta.simplifiedGeometryGeoJSON;
  if (!url) {
    console.warn(`  geoBoundaries missing ${tier} URL for ${iso3}`);
    return null;
  }

  const geoRes = await fetch(url);
  if (!geoRes.ok) {
    console.warn(`  geoBoundaries download ${geoRes.status} for ${iso3}`);
    return null;
  }

  const data = await geoRes.json();
  return parseBoundaryGeoJson(data);
}

function applyAppProperties(feature: CountryFeature, iso2: string): CountryFeature {
  const country = countries.find((c) => normalizeCode(c.code) === iso2);
  return {
    type: 'Feature',
    properties: {
      ISO_A2: iso2,
      ISO_A2_EH: iso2,
      ADMIN: country?.name ?? feature.properties?.ADMIN ?? iso2,
    },
    geometry: feature.geometry,
  };
}

async function main() {
  console.log(`Fetching ${NE_SOURCE_URL}...`);
  const res = await fetch(NE_SOURCE_URL);
  if (!res.ok) {
    throw new Error(`Failed to download boundaries: ${res.status} ${res.statusText}`);
  }

  const source = (await res.json()) as FeatureCollection;
  const neByCode = new Map<string, CountryFeature>();
  const iso3ByCode = new Map<string, string>();

  for (const feature of source.features) {
    const raw = feature as CountryFeature;
    const stripped = stripFeature(raw);
    if (!stripped) continue;

    const code = resolveAppCode(stripped);
    if (!code) continue;

    const rawIso3 = raw.properties?.ISO_A3;
    if (typeof rawIso3 === 'string' && rawIso3.length === 3 && rawIso3 !== '-99') {
      iso3ByCode.set(code, rawIso3);
    }

    const existing = neByCode.get(code);
    if (!existing) {
      neByCode.set(code, stripped);
      continue;
    }

    const existingIso = existing.properties?.ISO_A2;
    if (existingIso !== code && stripped.properties?.ISO_A2 === code) {
      neByCode.set(code, stripped);
    }
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const byCode = new Map<string, CountryFeature>();
  let geoBoundariesCount = 0;

  for (const country of countries) {
    const iso2 = normalizeCode(country.code);
    const neFeature = neByCode.get(iso2);
    const tier = boundaryTierForArea(country.areaKm2);

    if (tier === 'natural-earth') {
      if (neFeature) {
        byCode.set(iso2, neFeature);
      }
      continue;
    }

    const iso3 = resolveIso3(iso2, iso3ByCode);
    if (!iso3) {
      console.warn(`Warning: no ISO-3 for ${iso2}, falling back to Natural Earth`);
      if (neFeature) byCode.set(iso2, neFeature);
      continue;
    }

    console.log(`Fetching geoBoundaries (${tier}) for ${iso2} (${iso3})...`);
    const geoFeature = await fetchGeoBoundariesFeature(iso3, tier);
    await sleep(GEOBOUNDARIES_RATE_LIMIT_MS);

    if (geoFeature) {
      byCode.set(iso2, applyAppProperties(geoFeature, iso2));
      geoBoundariesCount++;
    } else if (neFeature) {
      console.warn(`Warning: geoBoundaries failed for ${iso2}, falling back to Natural Earth`);
      byCode.set(iso2, neFeature);
    }
  }

  for (const [code, feature] of neByCode) {
    if (!byCode.has(code)) {
      byCode.set(code, feature);
    }
  }

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
    `Wrote ${byCode.size} boundary files (${geoBoundariesCount} from geoBoundaries) to ${OUT_DIR} (${totalKb.toFixed(0)} KB total, index.json included)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
