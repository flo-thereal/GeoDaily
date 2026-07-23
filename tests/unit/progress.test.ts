import { describe, expect, it, vi } from 'vitest';
import { applyDailyResult, inferCountryFromTask, initialProgress, taskCountryCode } from '../../src/lib/progress';
import type { DailyTask } from '../../src/store/useStore';
import { localDateString } from '../../src/lib/utils';

describe('applyDailyResult', () => {
  it('updates streak and days played for today only', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-03T15:00:00'));

    const today = localDateString();
    const next = applyDailyResult(initialProgress(), { date: today });

    expect(next.stats.currentStreak).toBe(1);
    expect(next.stats.longestStreak).toBe(1);
    expect(next.stats.daysPlayed).toBe(1);
    expect(next.stats.lastPlayedDate).toBe(today);

    vi.useRealTimers();
  });

  it('does not apply progress for a past challenge date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-03T15:00:00'));

    const next = applyDailyResult(initialProgress(), { date: '2020-01-01' });

    expect(next.stats.currentStreak).toBe(0);
    expect(next.stats.daysPlayed).toBe(0);
    expect(next.stats.lastPlayedDate).toBeNull();

    vi.useRealTimers();
  });
});

describe('taskCountryCode', () => {
  it('falls back to task id for legacy challenges', () => {
    const task: DailyTask = {
      id: 'capital-CF-1',
      type: 'capital',
      question: 'Capital?',
      correctAnswer: 'Bangui',
      countryCode: '',
    };
    expect(taskCountryCode({ ...task, countryCode: '' })).toBe('CF');
  });

  it('does not treat date-based ids as country codes', () => {
    const task: DailyTask = {
      id: '2026-06-17-map-1',
      type: 'map',
      question: 'Where?',
      correctAnswer: 'Machu Picchu, Peru',
      countryCode: '',
      mapCoordinates: { lat: -13.1631, lng: -72.545 },
    };
    expect(taskCountryCode(task)).toBe('PE');
  });

  it('resolves legacy map task ids', () => {
    const task: DailyTask = {
      id: 'map-TL-2',
      type: 'map',
      question: 'Where is Timor-Leste located?',
      correctAnswer: 'Timor-Leste',
      countryCode: '',
      mapCoordinates: { lat: -8.8383, lng: 125.8272 },
    };
    expect(taskCountryCode(task)).toBe('TL');
  });
});

describe('inferCountryFromTask', () => {
  it('infers country from comma-separated landmark answers', () => {
    const task: DailyTask = {
      id: '2026-06-17-map-1',
      type: 'map',
      question: 'Where?',
      correctAnswer: 'Machu Picchu, Peru',
      countryCode: '',
      mapCoordinates: { lat: -13.1631, lng: -72.545 },
    };
    expect(inferCountryFromTask(task)?.code).toBe('PE');
  });

  it('infers country from answers that include a country name', () => {
    const task: DailyTask = {
      id: '2026-06-18-q3',
      type: 'map',
      question: 'Where?',
      correctAnswer: 'Great Barrier Reef, Australia',
      countryCode: '',
      mapCoordinates: { lat: -18.2871, lng: 147.6995 },
    };
    expect(inferCountryFromTask(task)?.code).toBe('AU');
  });
});
