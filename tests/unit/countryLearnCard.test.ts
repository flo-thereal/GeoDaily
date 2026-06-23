import { describe, expect, it } from 'vitest';
import { resolveCountryForTask } from '../../src/components/CountryLearnCard';
import { DAILY_PATTERN } from '../../src/lib/generateQuiz';
import type { DailyTask } from '../../src/store/useStore';

function taskFixture(
  type: DailyTask['type'],
  code: string,
  overrides: Partial<DailyTask> = {}
): DailyTask {
  const base: DailyTask = {
    id: `${type}-${code}-0`,
    type,
    question: 'test?',
    correctAnswer: type === 'capital' ? 'Paris' : 'France',
    countryCode: code,
    imageUrl: code,
    options: type === 'flag' ? ['France', 'Germany', 'Spain', 'Italy'] : [],
    mapCoordinates: type !== 'flag' ? { lat: 48.85, lng: 2.35 } : undefined,
  };
  return { ...base, ...overrides };
}

describe('resolveCountryForTask', () => {
  it('resolves flag tasks by country code', () => {
    const country = resolveCountryForTask(taskFixture('flag', 'NO', { correctAnswer: 'Norway' }));
    expect(country?.name).toBe('Norway');
    expect(country?.capital).toBe('Oslo');
  });

  it('resolves map tasks by country code', () => {
    const country = resolveCountryForTask(taskFixture('map', 'EG', { correctAnswer: 'Egypt' }));
    expect(country?.name).toBe('Egypt');
    expect(country?.capital).toBe('Cairo');
  });

  it('resolves capital tasks by country code', () => {
    const country = resolveCountryForTask(
      taskFixture('capital', 'FR', { correctAnswer: 'Paris', question: 'Where is the capital of France?' })
    );
    expect(country?.name).toBe('France');
    expect(country?.capital).toBe('Paris');
  });

  it('resolves legacy tasks missing countryCode via imageUrl', () => {
    const country = resolveCountryForTask({
      id: 'flag-BR-0',
      type: 'flag',
      question: "Which country's flag is this?",
      correctAnswer: 'Brazil',
      imageUrl: 'BR',
      options: ['Brazil', 'Argentina', 'Chile', 'Peru'],
    } as DailyTask);
    expect(country?.name).toBe('Brazil');
    expect(country?.capital).toBe('Brasília');
  });

  it('returns undefined when country cannot be resolved', () => {
    expect(
      resolveCountryForTask({
        id: 'map-XX-0',
        type: 'map',
        question: 'Where?',
        correctAnswer: 'Nowhere',
        imageUrl: 'XX',
      } as DailyTask)
    ).toBeUndefined();
  });
});

describe('DAILY_PATTERN', () => {
  it('has 10 questions with a map-heavy mix', () => {
    expect(DAILY_PATTERN).toHaveLength(10);
    expect(DAILY_PATTERN.filter((t) => t === 'map')).toHaveLength(4);
    expect(DAILY_PATTERN.filter((t) => t === 'flag')).toHaveLength(3);
    expect(DAILY_PATTERN.filter((t) => t === 'capital')).toHaveLength(3);
  });
});
