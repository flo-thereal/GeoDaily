import { DailyTask, DailyHistory, useStore } from '../store/useStore';
import { COUNTRIES, type Country } from '../lib/countries';
import { generateDailyTasks as genDaily, generatePracticeTasks } from '../lib/generateQuiz';
import { normalizeChallengeTask } from '../lib/taskNormalization';

// ============================================================================
// GeoDaily runs as a fully static site: there is no server or account system.
// Quiz data is bundled / pre-generated JSON; all progress lives in localStorage
// via the Zustand store. These functions keep the original async API surface so
// the pages need minimal changes.
// ============================================================================

export type { Country };

// ============================================================================
// Settings
// ============================================================================

export interface UserSettings {
  theme: string;
}

export async function getUserSettings(): Promise<UserSettings> {
  const { settings } = useStore.getState();
  return { theme: settings.theme };
}

export async function updateSettings(updates: { theme?: string }): Promise<{ success: boolean }> {
  useStore.getState().updateSettings(updates);
  return { success: true };
}

// ============================================================================
// Countries (bundled reference data)
// ============================================================================

export interface CountriesQueryParams {
  region?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function getCountries(params: CountriesQueryParams = {}): Promise<Country[]> {
  let result = COUNTRIES.slice();

  if (params.region) {
    result = result.filter((c) => c.region === params.region);
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.capital?.toLowerCase().includes(q) ||
        c.region?.toLowerCase().includes(q)
    );
  }
  result.sort((a, b) => a.name.localeCompare(b.name));

  const offset = params.offset ?? 0;
  const end = params.limit ? offset + params.limit : undefined;
  return result.slice(offset, end);
}

export async function getCountryByCode(code: string): Promise<Country> {
  const country = COUNTRIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
  if (!country) throw new Error('Country not found');
  return country;
}

export async function getRegions(): Promise<{ region: string; count: number }[]> {
  const counts: Record<string, number> = {};
  for (const c of COUNTRIES) counts[c.region] = (counts[c.region] ?? 0) + 1;
  return Object.entries(counts)
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => a.region.localeCompare(b.region));
}

// ============================================================================
// Challenges
// ============================================================================

function normalizeDailyTask(task: DailyTask): DailyTask {
  return normalizeChallengeTask(task);
}

/**
 * Daily tasks: prefer a pre-generated JSON committed by the nightly Action;
 * fall back to deterministic client generation if that day isn't published.
 */
export async function fetchDailyTasks(date: string): Promise<DailyTask[]> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/challenges/${date}.json`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return (data as DailyTask[]).map(normalizeDailyTask);
      }
    }
  } catch {
    /* fall through to local generation */
  }
  return genDaily(date);
}

// Legacy alias for backward compatibility
export const generateDailyTasks = fetchDailyTasks;

export async function fetchPracticeTasks(
  type: 'flags' | 'capitals' | 'map'
): Promise<DailyTask[]> {
  return generatePracticeTasks(type);
}

// ============================================================================
// History
// ============================================================================

export async function getChallengeHistory(
  _limit: number = 30
): Promise<Record<string, DailyHistory>> {
  return useStore.getState().history;
}

// ============================================================================
// Health Check
// ============================================================================

export async function checkHealth(): Promise<{
  status: string;
  database: boolean;
  mode: string;
}> {
  return { status: 'ok', database: false, mode: 'static' };
}
