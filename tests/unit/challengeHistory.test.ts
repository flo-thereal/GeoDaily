import { describe, expect, it } from 'vitest';
import {
  CHALLENGE_LOOKBACK_DAYS,
  collectExcludedCountryCodes,
  countryCodesFromTasks,
  priorDates,
  shouldSkipChallengeFile,
} from '../../src/lib/challengeHistory';
import { DAILY_PATTERN } from '../../src/lib/generateQuiz';
import type { DailyTask } from '../../src/store/useStore';

describe('priorDates', () => {
  it('returns the prior N calendar days', () => {
    expect(priorDates('2026-06-20', 3)).toEqual(['2026-06-19', '2026-06-18', '2026-06-17']);
  });

  it('handles month boundaries', () => {
    expect(priorDates('2026-03-02', 2)).toEqual(['2026-03-01', '2026-02-28']);
  });
});

describe('countryCodesFromTasks', () => {
  it('extracts unique ISO codes from tasks', () => {
    const tasks: DailyTask[] = [
      {
        id: 'flag-CA-0',
        type: 'flag',
        question: "Which country's flag is this?",
        correctAnswer: 'Canada',
        options: ['Canada', 'Mexico', 'United States', 'Brazil'],
        countryCode: 'CA',
        imageUrl: 'CA',
      },
      {
        id: 'capital-BR-1',
        type: 'capital',
        question: 'Where is the capital of Brazil?',
        correctAnswer: 'Brasília',
        options: [],
        countryCode: 'BR',
        mapCoordinates: { lat: -15.7939, lng: -47.8828 },
      },
      {
        id: 'map-BR-2',
        type: 'map',
        question: 'Where is Brazil located?',
        correctAnswer: 'Brazil',
        options: [],
        countryCode: 'BR',
        imageUrl: 'BR',
        mapCoordinates: { lat: -14, lng: -51 },
      },
    ];

    expect(countryCodesFromTasks(tasks).sort()).toEqual(['BR', 'CA']);
  });
});

describe('collectExcludedCountryCodes', () => {
  it('unions country codes from resolved prior challenges', () => {
    const excluded = collectExcludedCountryCodes('2026-06-20', 2, (date) => {
      if (date === '2026-06-19') {
        return [{ id: 'flag-CA-0', type: 'flag', question: 'q', correctAnswer: 'Canada', countryCode: 'CA' }];
      }
      if (date === '2026-06-18') {
        return [{ id: 'flag-JP-0', type: 'flag', question: 'q', correctAnswer: 'Japan', countryCode: 'JP' }];
      }
      return undefined;
    });

    expect(excluded).toEqual(new Set(['CA', 'JP']));
  });
});

describe('CHALLENGE_LOOKBACK_DAYS', () => {
  it('defaults to 7 days', () => {
    expect(CHALLENGE_LOOKBACK_DAYS).toBe(7);
  });
});

describe('shouldSkipChallengeFile', () => {
  const minTasks = DAILY_PATTERN.length;
  const today = '2026-06-24';

  it('does not skip when no file exists', () => {
    expect(shouldSkipChallengeFile('2026-06-24', today, undefined, minTasks)).toBe(false);
  });

  it('skips past dates even when the file is short', () => {
    expect(shouldSkipChallengeFile('2026-06-23', today, 5, minTasks)).toBe(true);
  });

  it('skips today and future dates that already meet the minimum', () => {
    expect(shouldSkipChallengeFile('2026-06-24', today, minTasks, minTasks)).toBe(true);
    expect(shouldSkipChallengeFile('2026-07-07', today, minTasks, minTasks)).toBe(true);
  });

  it('regenerates today and future dates with legacy short files', () => {
    expect(shouldSkipChallengeFile('2026-06-24', today, 5, minTasks)).toBe(false);
    expect(shouldSkipChallengeFile('2026-07-06', today, 5, minTasks)).toBe(false);
  });
});
