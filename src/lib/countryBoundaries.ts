import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import { findCountry } from './countries';
import { getDistanceFromLatLonInKm } from './utils';

type CountryFeature = Feature<Polygon | MultiPolygon>;

const cache = new Map<string, CountryFeature>();
const inflight = new Map<string, Promise<CountryFeature | undefined>>();

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function fallbackRadiusKm(areaKm2: number): number {
  const equivalentRadius = Math.sqrt(areaKm2 / Math.PI);
  return Math.max(40, Math.min(250, equivalentRadius * 0.65));
}

export { fallbackRadiusKm };

function parseBoundaryResponse(data: unknown): CountryFeature | undefined {
  if (!data || typeof data !== 'object') return undefined;

  if ((data as Feature).type === 'Feature') {
    const feature = data as CountryFeature;
    if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
      return feature;
    }
    return undefined;
  }

  if ((data as { type?: string }).type === 'FeatureCollection') {
    const collection = data as { features: Feature[] };
    const feature = collection.features.find(
      (f) => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'
    ) as CountryFeature | undefined;
    return feature;
  }

  return undefined;
}

export async function loadCountryBoundary(code: string): Promise<CountryFeature | undefined> {
  const normalized = normalizeCode(code);

  const cached = cache.get(normalized);
  if (cached) return cached;

  const pending = inflight.get(normalized);
  if (pending) return pending;

  const promise = fetch(`${import.meta.env.BASE_URL}data/boundaries/${normalized}.geojson`)
    .then((res) => {
      if (!res.ok) return undefined;
      return res.json() as Promise<unknown>;
    })
    .then((data) => {
      const feature = parseBoundaryResponse(data);
      if (feature) cache.set(normalized, feature);
      return feature;
    })
    .catch(() => undefined)
    .finally(() => {
      inflight.delete(normalized);
    });

  inflight.set(normalized, promise);
  return promise;
}

/** @deprecated Use loadCountryBoundary(code) for per-country lazy loading. */
export async function loadCountryBoundaries(): Promise<{ features: CountryFeature[] }> {
  return { features: [] };
}

export function getCountryFeature(code: string): CountryFeature | undefined {
  return cache.get(normalizeCode(code));
}

export async function isPointInCountry(code: string, lat: number, lng: number): Promise<boolean> {
  const feature = await loadCountryBoundary(code);
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
