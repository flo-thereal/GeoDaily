import type { DailyTask } from '../store/useStore';
import { taskCountryCode } from './progress';

export const CHALLENGE_LOOKBACK_DAYS = 7;

/** Return YYYY-MM-DD strings for the N calendar days immediately before `date`. */
export function priorDates(date: string, lookback: number): string[] {
  const anchor = new Date(`${date}T12:00:00Z`);
  const dates: string[] = [];
  for (let i = 1; i <= lookback; i++) {
    const d = new Date(anchor);
    d.setUTCDate(d.getUTCDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

/** Extract unique ISO country codes from a challenge's tasks. */
export function countryCodesFromTasks(tasks: DailyTask[]): string[] {
  const codes = new Set<string>();
  for (const task of tasks) {
    const code = taskCountryCode(task);
    if (code) codes.add(code);
  }
  return [...codes];
}

/**
 * Union country codes used in the lookback window before `date`.
 * `resolveTasks` returns tasks for a prior date, or undefined if unavailable.
 */
export function collectExcludedCountryCodes(
  date: string,
  lookback: number,
  resolveTasks: (priorDate: string) => DailyTask[] | undefined
): Set<string> {
  const excluded = new Set<string>();
  for (const priorDate of priorDates(date, lookback)) {
    const tasks = resolveTasks(priorDate);
    if (!tasks) continue;
    for (const code of countryCodesFromTasks(tasks)) {
      excluded.add(code);
    }
  }
  return excluded;
}
