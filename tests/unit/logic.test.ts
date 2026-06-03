import { describe, expect, it, vi } from 'vitest';
import { localDateString, localYesterdayString } from '../../src/lib/utils';
import { applyDailyResult, initialProgress } from '../../src/lib/progress';
import type { DailyTask } from '../../src/store/useStore';

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

    const task: DailyTask = {
      id: 'flag-FR-0',
      type: 'flag',
      question: 'q',
      correctAnswer: 'France',
      countryCode: 'FR',
      imageUrl: 'FR',
    };

    const prev = {
      ...initialProgress(),
      stats: {
        ...initialProgress().stats,
        currentStreak: 1,
        longestStreak: 1,
        lastPlayedDate: '2026-06-03',
        totalPoints: 100,
        daysPlayed: 1,
      },
    };

    const day2 = applyDailyResult(prev, {
      date: localDateString(),
      tasks: [task],
      answers: [{ guess: 'France', isCorrect: true }],
      score: 100,
      maxScore: 100,
    });

    expect(day2.state.stats.currentStreak).toBe(2);

    vi.useRealTimers();
  });
});
