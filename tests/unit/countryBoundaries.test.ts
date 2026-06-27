import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import type { Feature, MultiPolygon, Polygon } from 'geojson';

const BOUNDARIES_DIR = join(process.cwd(), 'public/data/boundaries');

function loadBoundaryFeature(code: string): Feature<Polygon | MultiPolygon> {
  const filePath = join(BOUNDARIES_DIR, `${code}.geojson`);
  if (!existsSync(filePath)) {
    throw new Error(`Missing boundary file for ${code}`);
  }
  return JSON.parse(readFileSync(filePath, 'utf8')) as Feature<Polygon | MultiPolygon>;
}

describe('boundary GeoJSON files', () => {
  it('includes an index manifest for all app countries', () => {
    const index = JSON.parse(
      readFileSync(join(BOUNDARIES_DIR, 'index.json'), 'utf8')
    ) as Record<string, number>;
    expect(Object.keys(index).length).toBeGreaterThanOrEqual(190);
    expect(index.FR).toBeGreaterThan(0);
  });

  it('Paris is inside France', () => {
    const fr = loadBoundaryFeature('FR');
    expect(booleanPointInPolygon(point([2.3522, 48.8566]), fr)).toBe(true);
  });

  it('Berlin is outside France', () => {
    const fr = loadBoundaryFeature('FR');
    expect(booleanPointInPolygon(point([13.405, 52.52]), fr)).toBe(false);
  });

  it('Kaliningrad is inside Russia', () => {
    const ru = loadBoundaryFeature('RU');
    expect(booleanPointInPolygon(point([20.511, 54.7104]), ru)).toBe(true);
  });

  it('Malé is inside Maldives', () => {
    const mv = loadBoundaryFeature('MV');
    expect(booleanPointInPolygon(point([73.5093, 4.1755]), mv)).toBe(true);
  });

  it('point in the English Channel is outside France', () => {
    const fr = loadBoundaryFeature('FR');
    expect(booleanPointInPolygon(point([0.5, 50.0]), fr)).toBe(false);
  });
});

describe('isPointInCountry', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('scores using loaded per-country boundaries', async () => {
    const frFeature = loadBoundaryFeature('FR');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/data/boundaries/FR.geojson')) {
          return {
            ok: true,
            json: async () => frFeature,
          };
        }
        return { ok: false };
      })
    );

    const { isPointInCountry } = await import('../../src/lib/countryBoundaries');
    await expect(isPointInCountry('FR', 48.8566, 2.3522)).resolves.toBe(true);
    await expect(isPointInCountry('FR', 52.52, 13.405)).resolves.toBe(false);
  });
});
