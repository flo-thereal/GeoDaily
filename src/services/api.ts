import { DailyTask, DailyHistory, useStore, type AnswerRecord } from '../store/useStore';
import { localDateString } from '../lib/utils';
import { COUNTRIES, type Country } from '../lib/countries';
import { generateDailyTasks as genDaily, generatePracticeTasks } from '../lib/generateQuiz';
import { ACHIEVEMENTS } from '../lib/progress';
import { normalizeChallengeTask } from '../lib/taskNormalization';

// ============================================================================
// GeoDaily runs as a fully static site: there is no server or account system.
// Quiz data is bundled / pre-generated JSON; all progress lives in localStorage
// via the Zustand store. These functions keep the original async API surface so
// the pages need minimal changes.
// ============================================================================

export type { Country };

// ============================================================================
// Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  level: number;
  title?: string;
  createdAt: string;
}

export interface UserStats {
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  totalDaysPlayed: number;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  countriesMastered: number;
  accuracy: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earnedAt: string;
}

export interface UserProfile extends User {
  stats: UserStats;
  continentMastery: Record<string, number>;
  achievements: Achievement[];
}

export interface UserSettings {
  language: string;
  daily_reminder_enabled: boolean;
  daily_reminder_time: string;
  sound_enabled: boolean;
  haptic_enabled: boolean;
  theme: string;
}

export interface SubmitChallengeResult {
  success: boolean;
  stats: {
    totalPoints: number;
    currentStreak: number;
    longestStreak: number;
  };
  newAchievements?: string[];
}

// ============================================================================
// Derived profile helpers
// ============================================================================

function levelForPoints(points: number): number {
  return Math.floor(points / 1000) + 1;
}

function titleForLevel(level: number): string {
  if (level >= 20) return 'Master Cartographer';
  if (level >= 10) return 'Globe Master';
  if (level >= 5) return 'Seasoned Explorer';
  if (level >= 2) return 'Explorer';
  return 'Novice Explorer';
}

function computeStats(): UserStats {
  const { stats } = useStore.getState().progress;
  const accuracy = stats.totalQuestionsAnswered > 0
    ? Math.round((stats.correctAnswers / stats.totalQuestionsAnswered) * 100)
    : 0;
  return {
    totalPoints: stats.totalPoints,
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    totalDaysPlayed: stats.daysPlayed,
    totalQuestionsAnswered: stats.totalQuestionsAnswered,
    totalCorrectAnswers: stats.correctAnswers,
    countriesMastered: stats.countriesMastered,
    accuracy,
  };
}

// ============================================================================
// "Auth" — single local explorer, no accounts
// ============================================================================

// Kept so existing callers don't break; there are no real accounts anymore.
export function isAuthenticated(): boolean {
  return true;
}

export function logout(): void {
  /* no-op: nothing to sign out of */
}

// ============================================================================
// User Profile (computed from local progress)
// ============================================================================

export async function getCurrentUser(): Promise<UserProfile> {
  const { progress } = useStore.getState();
  const stats = computeStats();
  const level = levelForPoints(stats.totalPoints);

  const continentMastery: Record<string, number> = {};
  for (const [continent, entry] of Object.entries(progress.continentMastery)) {
    continentMastery[continent] = entry.percentage;
  }

  const achievements: Achievement[] = ACHIEVEMENTS
    .filter((a) => progress.unlockedAchievements[a.id])
    .map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      icon: a.icon,
      category: a.category,
      earnedAt: progress.unlockedAchievements[a.id],
    }))
    .sort((a, b) => b.earnedAt.localeCompare(a.earnedAt));

  return {
    id: 'local-explorer',
    email: '',
    displayName: 'Explorer',
    level,
    title: titleForLevel(level),
    createdAt: new Date().toISOString(),
    stats,
    continentMastery,
    achievements,
    avatarUrl: undefined,
  };
}

export async function updateProfile(_updates: {
  displayName?: string;
  avatarUrl?: string;
  title?: string;
}): Promise<{ success: boolean }> {
  return { success: true };
}

export async function getUserStats(): Promise<UserStats> {
  return computeStats();
}

export interface LearningHistoryEntry {
  date: string;
  score: number;
  maxScore: number;
}

export async function getLearningHistory(days: number = 30): Promise<LearningHistoryEntry[]> {
  const { history } = useStore.getState();
  const entries: LearningHistoryEntry[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const date = localDateString(d);
    entries.push({ date, score: history[date]?.score ?? 0, maxScore: 500 });
  }
  return entries;
}

export async function getUserSettings(): Promise<UserSettings> {
  const { settings } = useStore.getState();
  return {
    language: settings.language,
    daily_reminder_enabled: settings.dailyReminderEnabled,
    daily_reminder_time: settings.dailyReminderTime,
    sound_enabled: settings.soundEnabled,
    haptic_enabled: settings.hapticEnabled,
    theme: settings.theme,
  };
}

export async function updateSettings(updates: {
  language?: string;
  dailyReminderEnabled?: boolean;
  dailyReminderTime?: string;
  soundEnabled?: boolean;
  hapticEnabled?: boolean;
  theme?: string;
}): Promise<{ success: boolean }> {
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

export interface SubmitChallengeParams {
  date: string;
  tasks: DailyTask[];
  answers: AnswerRecord[];
  score: number;
  maxScore: number;
  timeTaken?: number;
}

export async function submitChallenge(
  params: SubmitChallengeParams
): Promise<SubmitChallengeResult> {
  const newAchievements = useStore.getState().submitDailyResult({
    date: params.date,
    tasks: params.tasks,
    answers: params.answers,
    score: params.score,
    maxScore: params.maxScore,
  });
  const stats = computeStats();
  return {
    success: true,
    stats: {
      totalPoints: stats.totalPoints,
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
    },
    newAchievements: newAchievements.length > 0 ? newAchievements : undefined,
  };
}

export async function completeChallenge(
  _date: string,
  _score: number
): Promise<{ success: boolean }> {
  return { success: true };
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
