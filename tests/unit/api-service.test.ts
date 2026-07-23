import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DailyTask } from '../../src/store/useStore';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length(): number { return this.data.size; }
  clear(): void { this.data.clear(); }
  getItem(key: string): string | null { return this.data.has(key) ? this.data.get(key)! : null; }
  key(index: number): string | null { return Array.from(this.data.keys())[index] ?? null; }
  removeItem(key: string): void { this.data.delete(key); }
  setItem(key: string, value: string): void { this.data.set(key, value); }
}

function setupLocalStorage() {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  });
}

describe('static api service', () => {
  let api: typeof import('../../src/services/api');

  beforeEach(async () => {
    setupLocalStorage();
    vi.resetModules();
    api = await import('../../src/services/api');
  });

  it('filters and sorts bundled countries', async () => {
    const europe = await api.getCountries({ region: 'Europe' });
    expect(europe.length).toBeGreaterThan(0);
    expect(europe.every((c) => c.region === 'Europe')).toBe(true);
    // sorted A→Z
    expect([...europe].sort((a, b) => a.name.localeCompare(b.name))).toEqual(europe);

    const search = await api.getCountries({ search: 'france' });
    expect(search.some((c) => c.name === 'France')).toBe(true);
  });

  it('looks up a country by code and reports regions with counts', async () => {
    const fr = await api.getCountryByCode('fr');
    expect(fr.name).toBe('France');
    await expect(api.getCountryByCode('ZZ')).rejects.toThrow();

    const regions = await api.getRegions();
    const total = regions.reduce((sum, r) => sum + r.count, 0);
    expect(total).toBe((await api.getCountries()).length);
  });

  it('normalizes legacy capital MCQ tasks into map tasks when fetching daily challenges', async () => {
    const legacyCapital: DailyTask = {
      id: 'capital-FR-1',
      type: 'capital',
      question: 'What is the capital of France?',
      correctAnswer: 'Paris',
      options: ['Paris', 'Berlin', 'Madrid', 'Rome'],
      countryCode: 'FR',
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [legacyCapital],
      })
    );

    const tasks = await api.fetchDailyTasks('2026-06-08');
    expect(tasks).toHaveLength(1);
    expect(tasks[0].options).toEqual([]);
    expect(tasks[0].mapCoordinates).toEqual({ lat: 48.87, lng: 2.33 });
    expect(tasks[0].question).toBe('Where is the capital of France?');

    vi.unstubAllGlobals();
  });

  it('backfills country metadata for landmark map tasks when fetching daily challenges', async () => {
    const landmarkMap: DailyTask = {
      id: '2026-06-17-map-1',
      type: 'map',
      question: 'This ancient Inca citadel... Where is it located?',
      correctAnswer: 'Machu Picchu, Peru',
      countryCode: '',
      mapCoordinates: { lat: -13.1631, lng: -72.545 },
      options: [],
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [landmarkMap],
      })
    );

    const tasks = await api.fetchDailyTasks('2026-06-17');
    expect(tasks).toHaveLength(1);
    expect(tasks[0].countryCode).toBe('PE');
    expect(tasks[0].imageUrl).toBe('PE');

    vi.unstubAllGlobals();
  });

  it('round-trips settings through the local store', async () => {
    await api.updateSettings({ theme: 'dark' });
    const settings = await api.getUserSettings();
    expect(settings.theme).toBe('dark');
  });
});
