import { describe, expect, it, vi } from 'vitest';
import {
  CAPITAL_CORRECT_THRESHOLD,
  MAX_CAPITAL_DISTANCE_KM,
  scoreCapitalMapGuess,
  scoreCountryMapGuess,
} from '../../src/lib/mapScoring';

vi.mock('../../src/lib/countryBoundaries', () => ({
  isPointInCountry: vi.fn(),
}));

import { isPointInCountry } from '../../src/lib/countryBoundaries';

const mockedIsPointInCountry = vi.mocked(isPointInCountry);

describe('scoreCapitalMapGuess', () => {
  it('awards full points at zero distance', () => {
    expect(scoreCapitalMapGuess(0)).toEqual({ points: 100, isCorrect: true, distance: 0 });
  });

  it('awards partial points based on distance', () => {
    expect(scoreCapitalMapGuess(100)).toEqual({ points: 80, isCorrect: true, distance: 100 });
    expect(scoreCapitalMapGuess(250)).toEqual({ points: 50, isCorrect: true, distance: 250 });
  });

  it('marks incorrect below the threshold', () => {
    const result = scoreCapitalMapGuess(260);
    expect(result.points).toBe(48);
    expect(result.isCorrect).toBe(false);
  });

  it('awards zero points at or beyond max distance', () => {
    expect(scoreCapitalMapGuess(MAX_CAPITAL_DISTANCE_KM).points).toBe(0);
    expect(scoreCapitalMapGuess(MAX_CAPITAL_DISTANCE_KM + 50).isCorrect).toBe(false);
    expect(CAPITAL_CORRECT_THRESHOLD).toBe(50);
  });
});

describe('scoreCountryMapGuess', () => {
  it('returns full points when inside the country', async () => {
    mockedIsPointInCountry.mockResolvedValueOnce(true);
    await expect(scoreCountryMapGuess('FR', 48.85, 2.35)).resolves.toEqual({
      points: 100,
      isCorrect: true,
      distance: null,
    });
  });

  it('returns zero points when outside the country', async () => {
    mockedIsPointInCountry.mockResolvedValueOnce(false);
    await expect(scoreCountryMapGuess('FR', 52.52, 13.4)).resolves.toEqual({
      points: 0,
      isCorrect: false,
      distance: null,
    });
  });
});
