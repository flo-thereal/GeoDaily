import { isPointInCountry } from './countryBoundaries';

export const MAX_CAPITAL_DISTANCE_KM = 500;
export const CAPITAL_CORRECT_THRESHOLD = 50;

export interface MapScoreResult {
  points: number;
  isCorrect: boolean;
  distance: number | null;
}

export async function scoreCountryMapGuess(
  countryCode: string,
  lat: number,
  lng: number
): Promise<MapScoreResult> {
  const inside = await isPointInCountry(countryCode, lat, lng);
  return {
    points: inside ? 100 : 0,
    isCorrect: inside,
    distance: null,
  };
}

export function scoreCapitalMapGuess(distanceKm: number): MapScoreResult {
  const points = Math.round(100 * Math.max(0, 1 - distanceKm / MAX_CAPITAL_DISTANCE_KM));
  return {
    points,
    isCorrect: points >= CAPITAL_CORRECT_THRESHOLD,
    distance: distanceKm,
  };
}
