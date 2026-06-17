import type { DailyTask } from '../store/useStore';
import { findCountry } from './countries';
import { inferCountryFromTask, taskCountryCode } from './progress';

function normalizeCountryCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const normalized = raw.trim().toUpperCase();
  return /^[A-Z]{2,3}$/.test(normalized) ? normalized : null;
}

function backfillCountryMetadata(task: DailyTask): DailyTask {
  const hasCode = Boolean(normalizeCountryCode(task.countryCode));
  const hasImage = Boolean(normalizeCountryCode(task.imageUrl));
  if (hasCode && hasImage) return task;

  const fromFields =
    normalizeCountryCode(task.countryCode) ?? normalizeCountryCode(task.imageUrl);
  const country = fromFields ? findCountry(fromFields) : inferCountryFromTask(task);
  if (!country) return task;

  return {
    ...task,
    countryCode: hasCode ? task.countryCode : country.code,
    imageUrl: hasImage ? task.imageUrl : (task.imageUrl ?? country.code),
  };
}

/** Normalize challenge tasks from committed JSON or Gemini output. */
export function normalizeChallengeTask(task: DailyTask): DailyTask {
  let normalized = backfillCountryMetadata(task);

  if (normalized.type !== 'capital') return normalized;

  const code = taskCountryCode(normalized);
  const country = code ? findCountry(code) : undefined;
  if (!country?.capitalCoordinates) return normalized;

  return {
    ...normalized,
    options: [],
    mapCoordinates: country.capitalCoordinates,
    question: `Where is the capital of ${country.name}?`,
    countryCode: country.code,
    correctAnswer: country.capital,
  };
}
