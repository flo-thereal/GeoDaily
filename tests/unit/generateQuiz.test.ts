import { describe, expect, it } from 'vitest';
import { generateDailyTasks, generatePracticeTasks } from '../../src/lib/generateQuiz';

describe('generateDailyTasks', () => {
  it('produces 5 well-formed tasks', () => {
    const tasks = generateDailyTasks('2026-05-29');
    expect(tasks).toHaveLength(5);
    for (const t of tasks) {
      expect(t.id).toBeTruthy();
      expect(['flag', 'capital', 'map']).toContain(t.type);
      expect(t.correctAnswer).toBeTruthy();
      if (t.type === 'map') {
        expect(t.mapCoordinates).toBeDefined();
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
});

describe('generatePracticeTasks', () => {
  it('generates 5 tasks of the requested type', () => {
    expect(generatePracticeTasks('capitals').every((t) => t.type === 'capital')).toBe(true);
    expect(generatePracticeTasks('flags').every((t) => t.type === 'flag')).toBe(true);
    expect(generatePracticeTasks('map').every((t) => t.type === 'map')).toBe(true);
  });
});
