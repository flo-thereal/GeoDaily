import { describe, expect, it } from 'vitest';
import {
  CHALLENGE_LOOKBACK_DAYS,
  countryCodesFromTasks,
  priorDates,
} from '../../src/lib/challengeHistory';
import { generateDailyTasks, generatePracticeTasks, DAILY_PATTERN } from '../../src/lib/generateQuiz';

describe('generateDailyTasks', () => {
  it('produces 10 well-formed tasks with map-heavy mix', () => {
    const tasks = generateDailyTasks('2026-05-29');
    expect(tasks).toHaveLength(DAILY_PATTERN.length);
    expect(tasks.map((t) => t.type).filter((t) => t === 'map')).toHaveLength(4);
    expect(tasks.map((t) => t.type).filter((t) => t === 'flag')).toHaveLength(3);
    expect(tasks.map((t) => t.type).filter((t) => t === 'capital')).toHaveLength(3);
    const codes = tasks.map((t) => t.countryCode);
    expect(new Set(codes).size).toBe(codes.length);
    for (const t of tasks) {
      expect(t.id).toBeTruthy();
      expect(['flag', 'capital', 'map']).toContain(t.type);
      expect(t.correctAnswer).toBeTruthy();
      if (t.type === 'map' || t.type === 'capital') {
        expect(t.mapCoordinates).toBeDefined();
        expect(t.options).toEqual([]);
      } else {
        expect(t.options!.length).toBe(4);
        expect(t.options).toContain(t.correctAnswer);
      }
    }
  });

  it('is deterministic for a given date', () => {
    expect(generateDailyTasks('2026-05-29')).toEqual(generateDailyTasks('2026-05-29'));
    expect(generateDailyTasks('2026-05-29')).not.toEqual(generateDailyTasks('2026-05-30'));
  });

  it('avoids countries used in the prior lookback window', () => {
    const start = '2026-08-01';
    const days = Array.from({ length: 10 }, (_, i) => {
      const d = new Date(`${start}T12:00:00Z`);
      d.setUTCDate(d.getUTCDate() + i);
      return d.toISOString().split('T')[0];
    });

    for (let i = CHALLENGE_LOOKBACK_DAYS; i < days.length; i++) {
      const date = days[i];
      const currentCodes = new Set(countryCodesFromTasks(generateDailyTasks(date)));
      const recentCodes = new Set(
        priorDates(date, CHALLENGE_LOOKBACK_DAYS).flatMap((priorDate) =>
          countryCodesFromTasks(generateDailyTasks(priorDate))
        )
      );

      for (const code of currentCodes) {
        expect(recentCodes.has(code)).toBe(false);
      }
    }
  });
});

describe('generatePracticeTasks', () => {
  it('generates 5 tasks of the requested type', () => {
    expect(generatePracticeTasks('capitals').every((t) => t.type === 'capital')).toBe(true);
    expect(generatePracticeTasks('flags').every((t) => t.type === 'flag')).toBe(true);
    expect(generatePracticeTasks('map').every((t) => t.type === 'map')).toBe(true);
  });
});
