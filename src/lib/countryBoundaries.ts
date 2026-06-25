import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import { findCountry } from './countries';
import { getDistanceFromLatLonInKm } from './utils';

type CountryFeature = Feature<Polygon | MultiPolygon>;

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

let boundariesPromise: Promise<FeatureCollection> | null = null;
let featuresByCode: Map<string, CountryFeature> | null = null;

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function isValidIsoCode(code: unknown): code is string {
  return typeof code === 'string' && code.length >= 2 && code !== '-99';
}

function indexFeatures(collection: FeatureCollection): Map<string, CountryFeature> {
  const byCode = new Map<string, CountryFeature>();

  for (const feature of collection.features) {
    if (feature.geometry.type !== 'Polygon' && feature.geometry.type !== 'MultiPolygon') continue;
    const countryFeature = feature as CountryFeature;
    const props = feature.properties ?? {};

    const iso2 = isValidIsoCode(props.ISO_A2) ? props.ISO_A2 : props.ISO_A2_EH;
    if (isValidIsoCode(iso2)) {
      byCode.set(normalizeCode(iso2), countryFeature);
    }

    const admin = typeof props.ADMIN === 'string' ? props.ADMIN : undefined;
    if (admin) {
      byCode.set(`name:${admin}`, countryFeature);
    }
  }

  return byCode;
}

function resolveFeature(code: string): CountryFeature | undefined {
  if (!featuresByCode) return undefined;

  const normalized = normalizeCode(code);
  const direct = featuresByCode.get(normalized);
  if (direct) return direct;

  const country = findCountry(normalized);
  if (!country) return undefined;

  const alias = ADMIN_ALIASES[country.name] ?? country.name;
  return featuresByCode.get(`name:${alias}`) ?? featuresByCode.get(`name:${country.name}`);
}

function fallbackRadiusKm(areaKm2: number): number {
  const equivalentRadius = Math.sqrt(areaKm2 / Math.PI);
  return Math.max(40, Math.min(250, equivalentRadius * 0.65));
}

export { fallbackRadiusKm };

export async function loadCountryBoundaries(): Promise<FeatureCollection> {
  if (!boundariesPromise) {
    boundariesPromise = fetch(`${import.meta.env.BASE_URL}data/country-boundaries.geojson`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load country boundaries');
        return res.json() as Promise<FeatureCollection>;
      })
      .then((collection) => {
        featuresByCode = indexFeatures(collection);
        return collection;
      });
  }
  return boundariesPromise;
}

export function getCountryFeature(code: string): CountryFeature | undefined {
  return resolveFeature(code);
}

export async function isPointInCountry(code: string, lat: number, lng: number): Promise<boolean> {
  await loadCountryBoundaries();

  const feature = resolveFeature(code);
  if (feature) {
    return booleanPointInPolygon(point([lng, lat]), feature);
  }

  const country = findCountry(code);
  if (!country) return false;

  const distance = getDistanceFromLatLonInKm(
    lat,
    lng,
    country.coordinates.lat,
    country.coordinates.lng
  );
  return distance <= fallbackRadiusKm(country.areaKm2);
}
