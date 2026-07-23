import type { DailyTask } from '../store/useStore';
import { COUNTRIES, findCountry, findCountryByName, type Country } from './countries';
import { localDateString, localYesterdayString } from './utils';

export interface Stats {
  currentStreak: number;
  longestStreak: number;
  daysPlayed: number;
  lastPlayedDate: string | null;
}

export interface ProgressState {
  stats: Stats;
}

export function initialProgress(): ProgressState {
  return {
    stats: {
      currentStreak: 0,
      longestStreak: 0,
      daysPlayed: 0,
      lastPlayedDate: null,
    },
  };
}

export interface DailyResult {
  date: string;
}

function normalizeCountryCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const normalized = raw.trim().toUpperCase();
  return /^[A-Z]{2,3}$/.test(normalized) ? normalized : null;
}

const LEGACY_TASK_ID_CODE = /(?:^|-)(?:flag|capital|map)-([A-Z]{2})(?:-|$)/i;

function countryCodeFromTaskId(id: string): string | null {
  const legacyMatch = id.match(LEGACY_TASK_ID_CODE);
  if (legacyMatch) return normalizeCountryCode(legacyMatch[1]);
  return null;
}

function countryFromAnswer(answer: string): Country | undefined {
  const trimmed = answer.trim();
  const exact = findCountryByName(trimmed);
  if (exact) return exact;

  const commaParts = trimmed.split(',').map((part) => part.trim());
  for (let i = commaParts.length - 1; i >= 0; i--) {
    const fromSuffix = findCountryByName(commaParts[i]);
    if (fromSuffix) return fromSuffix;
  }

  let best: Country | undefined;
  for (const country of COUNTRIES) {
    if (!trimmed.includes(country.name)) continue;
    if (!best || country.name.length > best.name.length) best = country;
  }
  return best;
}

/** Infer country from task metadata when countryCode/imageUrl are missing. */
export function inferCountryFromTask(task: DailyTask): Country | undefined {
  const fromId = countryCodeFromTaskId(task.id);
  if (fromId) {
    const country = findCountry(fromId);
    if (country) return country;
  }

  if (task.correctAnswer) {
    const fromAnswer = countryFromAnswer(task.correctAnswer);
    if (fromAnswer) return fromAnswer;
  }

  return undefined;
}

/** Resolve ISO country code from task fields (supports legacy challenge JSON). */
export function taskCountryCode(task: DailyTask): string | null {
  const fromField =
    normalizeCountryCode(task.countryCode) ?? normalizeCountryCode(task.imageUrl);
  if (fromField) return fromField;

  const fromId = countryCodeFromTaskId(task.id);
  if (fromId) return fromId;

  const inferred = inferCountryFromTask(task);
  return inferred?.code ?? null;
}

/**
 * Apply a completed **today** daily challenge to progress. Only call when the
 * challenge date is the local calendar today.
 */
export function applyDailyResult(prev: ProgressState, result: DailyResult): ProgressState {
  const { date } = result;
  const today = localDateString();
  const yesterdayStr = localYesterdayString();

  if (date !== today) {
    return prev;
  }

  const lastPlayed = prev.stats.lastPlayedDate;
  let currentStreak = 1;
  if (lastPlayed === yesterdayStr) currentStreak = prev.stats.currentStreak + 1;
  else if (lastPlayed === today) currentStreak = prev.stats.currentStreak;

  const longestStreak = Math.max(currentStreak, prev.stats.longestStreak);
  const daysPlayed = prev.stats.daysPlayed + (lastPlayed !== today ? 1 : 0);

  return {
    stats: {
      currentStreak,
      longestStreak,
      daysPlayed,
      lastPlayedDate: today,
    },
  };
}
