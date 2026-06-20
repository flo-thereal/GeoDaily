import type { DailyTask, GameType } from '../store/useStore';
import {
  CHALLENGE_LOOKBACK_DAYS,
  countryCodesFromTasks,
  priorDates,
} from './challengeHistory';
import { COUNTRIES, type Country } from './countries';

// Deterministic seed from a date string (ported from the old server so a given
// day produces a stable challenge across reloads and devices).
export function generateSeed(input: string): number {
  let seed = 0;
  for (let i = 0; i < input.length; i++) {
    seed = (seed << 5) - seed + input.charCodeAt(i);
    seed |= 0;
  }
  return Math.abs(seed);
}

// Small, fast seedable PRNG. seed === undefined → use Math.random (unseeded).
function makeRng(seed?: number): () => number {
  if (seed === undefined) return Math.random;
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickDistinct<T>(pool: T[], count: number, rng: () => number): T[] {
  return shuffle(pool, rng).slice(0, count);
}

// Some entries share a capital ("N/A"-like) — keep only usable countries.
const USABLE = COUNTRIES.filter((c) => c.capital && c.name);

function buildTask(type: GameType, country: Country, index: number, rng: () => number): DailyTask {
  const id = `${type}-${country.code}-${index}`;

  if (type === 'flag') {
    const distractors = pickDistinct(
      USABLE.filter((c) => c.code !== country.code).map((c) => c.name),
      3,
      rng
    );
    return {
      id,
      type: 'flag',
      question: "Which country's flag is this?",
      correctAnswer: country.name,
      options: shuffle([country.name, ...distractors], rng),
      countryCode: country.code,
      imageUrl: country.code,
    };
  }

  if (type === 'capital') {
    return {
      id,
      type: 'capital',
      question: `Where is the capital of ${country.name}?`,
      correctAnswer: country.capital,
      options: [],
      countryCode: country.code,
      mapCoordinates: country.capitalCoordinates ?? country.coordinates,
    };
  }

  // map
  return {
    id,
    type: 'map',
    question: `Where is ${country.name} located?`,
    correctAnswer: country.name,
    options: [],
    countryCode: country.code,
    imageUrl: country.code,
    mapCoordinates: country.coordinates,
  };
}

const DAILY_PATTERN: GameType[] = ['flag', 'capital', 'map', 'flag', 'capital'];

/** First date used as the lookback base case (no challenges exist before this). */
const CHALLENGE_EPOCH = '2026-01-01';

const challengeCache = new Map<string, DailyTask[]>();

function buildDailyTasks(
  date: string,
  excludeCodes: Set<string>,
  rng: () => number
): DailyTask[] {
  const pool =
    excludeCodes.size > 0 ? USABLE.filter((c) => !excludeCodes.has(c.code)) : USABLE;
  const countries = pickDistinct(
    pool.length >= DAILY_PATTERN.length ? pool : USABLE,
    DAILY_PATTERN.length,
    rng
  );
  return DAILY_PATTERN.map((type, i) => buildTask(type, countries[i], i, rng));
}

function generateDailyTasksWithLookback(date: string): DailyTask[] {
  const cached = challengeCache.get(date);
  if (cached) return cached;

  const excluded = new Set<string>();
  for (const priorDate of priorDates(date, CHALLENGE_LOOKBACK_DAYS)) {
    if (priorDate < CHALLENGE_EPOCH) continue;
    for (const code of countryCodesFromTasks(generateDailyTasksWithLookback(priorDate))) {
      excluded.add(code);
    }
  }

  const tasks = buildDailyTasks(date, excluded, makeRng(generateSeed(date)));
  challengeCache.set(date, tasks);
  return tasks;
}

/** Generate a stable 5-question daily challenge for the given date. */
export function generateDailyTasks(date: string, excludeCodes?: Set<string>): DailyTask[] {
  if (excludeCodes) {
    return buildDailyTasks(date, excludeCodes, makeRng(generateSeed(date)));
  }
  return generateDailyTasksWithLookback(date);
}

/** Return true when any task uses an excluded country or repeats a country within the day. */
export function challengeHasCountryConflicts(
  tasks: DailyTask[],
  excludeCodes: Set<string>
): boolean {
  const codes = countryCodesFromTasks(tasks);
  if (codes.length !== new Set(codes).size) return true;
  return codes.some((code) => excludeCodes.has(code));
}

/** Generate a 5-question single-type practice session (unseeded / random). */
export function generatePracticeTasks(type: 'flags' | 'capitals' | 'map'): DailyTask[] {
  const gameType: GameType = type === 'flags' ? 'flag' : type === 'capitals' ? 'capital' : 'map';
  const rng = makeRng();
  const countries = pickDistinct(USABLE, 5, rng);
  return countries.map((c, i) => buildTask(gameType, c, i, rng));
}
