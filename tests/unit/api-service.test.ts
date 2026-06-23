import { beforeEach, describe, expect, it, vi } from 'vitest';
import { localDateString } from '../../src/lib/utils';
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

function flagTask(code: string, name: string): DailyTask {
  return {
    id: `flag-${code}-0`,
    type: 'flag',
    question: 'flag?',
    correctAnswer: name,
    options: [name],
    countryCode: code,
    imageUrl: code,
  };
}

describe('static api service', () => {
  let api: typeof import('../../src/services/api');

  beforeEach(async () => {
    setupLocalStorage();
    vi.resetModules();
    api = await import('../../src/services/api');
  });

  it('reports as always authenticated (no accounts)', () => {
    expect(api.isAuthenticated()).toBe(true);
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

  it('records a daily result into local progress', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-03T12:00:00'));

    const tasks = [
      flagTask('FR', 'France'),
      flagTask('DE', 'Germany'),
      flagTask('JP', 'Japan'),
      flagTask('BR', 'Brazil'),
      flagTask('US', 'United States'),
    ];
    const result = await api.submitChallenge({
      date: '2026-06-03',
      tasks,
      answers: tasks.map((t) => ({ guess: t.correctAnswer, isCorrect: true })),
      score: 500,
      maxScore: 500,
    });

    expect(result.success).toBe(true);
    expect(result.stats.totalPoints).toBe(500);
    expect(result.stats.currentStreak).toBe(1);
    expect(result.newAchievements).toContain('first_quest');
    expect(result.newAchievements).toContain('perfect_score');

    const stats = await api.getUserStats();
    expect(stats.totalPoints).toBe(500);
    expect(stats.accuracy).toBe(100);
    expect(stats.totalDaysPlayed).toBe(1);

    const profile = await api.getCurrentUser();
    expect(profile.displayName).toBe('Explorer');
    expect(profile.achievements.some((a) => a.id === 'perfect_score')).toBe(true);

    vi.useRealTimers();
  });

  it('builds learning history spanning the requested days, ending today', async () => {
    const history = await api.getLearningHistory(7);
    expect(history).toHaveLength(7);
    const today = localDateString();
    expect(history[history.length - 1].date).toBe(today);
    expect(history.every((h) => h.maxScore === 1000)).toBe(true);
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
    await api.updateSettings({ language: 'fr', soundEnabled: false });
    const settings = await api.getUserSettings();
    expect(settings.language).toBe('fr');
    expect(settings.sound_enabled).toBe(false);
  });
});
