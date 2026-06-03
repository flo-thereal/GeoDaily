import { describe, expect, it, vi } from 'vitest';
import {
  applyDailyResult,
  applyPracticeResult,
  initialProgress,
  taskCountryCode,
} from '../../src/lib/progress';
import type { DailyTask } from '../../src/store/useStore';
import { localDateString } from '../../src/lib/utils';

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

function capitalTask(code: string, name: string, capital: string): DailyTask {
  return {
    id: `capital-${code}-1`,
    type: 'capital',
    question: `Capital of ${name}?`,
    correctAnswer: capital,
    options: [capital],
    countryCode: code,
  };
}

describe('applyDailyResult', () => {
  it('updates streak and points for today only', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-03T15:00:00'));

    const today = localDateString();
    const tasks = [
      flagTask('FR', 'France'),
      flagTask('DE', 'Germany'),
      flagTask('JP', 'Japan'),
      flagTask('BR', 'Brazil'),
      flagTask('US', 'United States'),
    ];

    const { state, newAchievements } = applyDailyResult(initialProgress(), {
      date: today,
      tasks,
      answers: tasks.map((t) => ({ guess: t.correctAnswer, isCorrect: true })),
      score: 500,
      maxScore: 500,
    });

    expect(state.stats.totalPoints).toBe(500);
    expect(state.stats.currentStreak).toBe(1);
    expect(state.stats.daysPlayed).toBe(1);
    expect(newAchievements).toContain('first_quest');
    expect(newAchievements).toContain('perfect_score');

    vi.useRealTimers();
  });

  it('does not apply progress for a past challenge date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-03T15:00:00'));

    const tasks = [flagTask('FR', 'France')];
    const { state, newAchievements } = applyDailyResult(initialProgress(), {
      date: '2020-01-01',
      tasks,
      answers: [{ guess: 'France', isCorrect: true }],
      score: 100,
      maxScore: 100,
    });

    expect(state.stats.totalPoints).toBe(0);
    expect(state.stats.currentStreak).toBe(0);
    expect(newAchievements).toEqual([]);

    vi.useRealTimers();
  });

  it('attributes country mastery from capital tasks via countryCode', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-03T15:00:00'));

    const today = localDateString();
    const tasks = [capitalTask('FR', 'France', 'Paris')];

    const { state } = applyDailyResult(initialProgress(), {
      date: today,
      tasks,
      answers: [{ guess: 'Paris', isCorrect: true }],
      score: 100,
      maxScore: 100,
    });

    expect(state.countryProgress.FR?.timesCorrect).toBe(1);

    vi.useRealTimers();
  });
});

describe('applyPracticeResult', () => {
  it('increments skill counters without adding points', () => {
    const tasks = [flagTask('FR', 'France')];
    const next = applyPracticeResult(initialProgress(), {
      tasks,
      answers: [{ guess: 'France', isCorrect: true }],
    });

    expect(next.skillCorrect.flag).toBe(1);
    expect(next.stats.totalPoints).toBe(0);
    expect(next.stats.currentStreak).toBe(0);
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
});
