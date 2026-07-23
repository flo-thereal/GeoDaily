import { describe, expect, it, vi } from 'vitest';
import { localDateString, localYesterdayString } from '../../src/lib/utils';
import { applyDailyResult, initialProgress } from '../../src/lib/progress';

describe('localDateString', () => {
  it('formats using local calendar date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-03T23:30:00'));
    expect(localDateString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    vi.useRealTimers();
  });

  it('computes yesterday in local time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-03T12:00:00'));
    expect(localYesterdayString()).toBe('2026-06-02');
    vi.useRealTimers();
  });
});

describe('applyDailyResult streak rules', () => {
  it('extends streak on consecutive calendar days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-04T12:00:00'));

    const prev = {
      ...initialProgress(),
      stats: {
        ...initialProgress().stats,
        currentStreak: 1,
        longestStreak: 1,
        lastPlayedDate: '2026-06-03',
        daysPlayed: 1,
      },
    };

    const day2 = applyDailyResult(prev, { date: localDateString() });

    expect(day2.stats.currentStreak).toBe(2);

    vi.useRealTimers();
  });
});
