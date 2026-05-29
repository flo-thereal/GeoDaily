import type { DailyTask, GameType } from '../store/useStore';
import { findCountry, regionToContinent, type Continent } from './countries';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string; // material-symbols name
  category: string;
  points: number;
}

// Ported from the old server seed (server/drizzle/seed.ts), with icons mapped to
// Material Symbols names used by the Profile page.
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_quest', name: 'First Steps', description: 'Complete your first daily challenge', icon: 'flag', category: 'progress', points: 50 },
  { id: 'streak_3', name: 'Consistent Explorer', description: 'Maintain a 3-day streak', icon: 'local_fire_department', category: 'streak', points: 100 },
  { id: 'streak_7', name: 'Weekly Warrior', description: 'Maintain a 7-day streak', icon: 'local_fire_department', category: 'streak', points: 250 },
  { id: 'streak_30', name: 'Monthly Master', description: 'Maintain a 30-day streak', icon: 'emoji_events', category: 'streak', points: 1000 },
  { id: 'perfect_score', name: 'Perfect Score', description: 'Get 5/5 on a daily challenge', icon: 'star', category: 'accuracy', points: 150 },
  { id: 'countries_10', name: 'Globe Trotter', description: 'Answer questions about 10 different countries', icon: 'public', category: 'mastery', points: 200 },
  { id: 'countries_50', name: 'World Traveler', description: 'Answer questions about 50 different countries', icon: 'travel_explore', category: 'mastery', points: 500 },
  { id: 'countries_100', name: 'Geography Expert', description: 'Answer questions about 100 different countries', icon: 'workspace_premium', category: 'mastery', points: 1000 },
  { id: 'continent_europe', name: 'European Explorer', description: 'Master European countries', icon: 'map', category: 'continent', points: 500 },
  { id: 'continent_asia', name: 'Asian Adventurer', description: 'Master Asian countries', icon: 'map', category: 'continent', points: 500 },
  { id: 'continent_africa', name: 'African Adventurer', description: 'Master African countries', icon: 'map', category: 'continent', points: 500 },
  { id: 'points_1000', name: 'Rising Star', description: 'Earn 1000 total points', icon: 'auto_awesome', category: 'points', points: 100 },
  { id: 'points_5000', name: 'Shining Beacon', description: 'Earn 5000 total points', icon: 'wb_sunny', category: 'points', points: 300 },
  { id: 'flags_50', name: 'Flag Expert', description: 'Answer 50 flag questions correctly', icon: 'flag', category: 'skill', points: 200 },
  { id: 'capitals_50', name: 'Capital Connoisseur', description: 'Answer 50 capital questions correctly', icon: 'apartment', category: 'skill', points: 200 },
  { id: 'maps_50', name: 'Map Maven', description: 'Answer 50 map questions correctly', icon: 'location_on', category: 'skill', points: 200 },
];

export interface Stats {
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  daysPlayed: number;
  countriesMastered: number;
  totalQuestionsAnswered: number;
  correctAnswers: number;
  lastPlayedDate: string | null;
}

export interface ContinentEntry {
  questionsAnswered: number;
  correctAnswers: number;
  percentage: number;
}

export interface ProgressState {
  stats: Stats;
  countryProgress: Record<string, { timesCorrect: number; timesIncorrect: number; mastered: boolean }>;
  continentMastery: Record<string, ContinentEntry>;
  skillCorrect: Record<GameType, number>;
  unlockedAchievements: Record<string, string>; // id -> ISO unlock date
}

export function initialProgress(): ProgressState {
  return {
    stats: {
      currentStreak: 0,
      longestStreak: 0,
      totalPoints: 0,
      daysPlayed: 0,
      countriesMastered: 0,
      totalQuestionsAnswered: 0,
      correctAnswers: 0,
      lastPlayedDate: null,
    },
    countryProgress: {},
    continentMastery: {},
    skillCorrect: { flag: 0, capital: 0, map: 0 },
    unlockedAchievements: {},
  };
}

export interface DailyResult {
  date: string;
  tasks: DailyTask[];
  answers: Array<{ guess?: string | null; answer?: string | null; isCorrect: boolean }>;
  score: number;
  maxScore: number;
}

function isoDate(d = new Date()): string {
  return d.toISOString().split('T')[0];
}

function normalizeCountryCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const normalized = raw.trim().toUpperCase();
  return /^[A-Z]{2,3}$/.test(normalized) ? normalized : null;
}

/**
 * Apply a completed daily challenge to the progress state. Pure: returns a new
 * state plus the list of newly unlocked achievement ids. Ported from the old
 * server submit handler (server/routes/challenges.ts).
 */
export function applyDailyResult(
  prev: ProgressState,
  result: DailyResult
): { state: ProgressState; newAchievements: string[] } {
  const { date, tasks, answers, score, maxScore } = result;

  const today = isoDate();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = isoDate(yesterday);

  const lastPlayed = prev.stats.lastPlayedDate;
  let currentStreak = 1;
  if (lastPlayed === yesterdayStr) currentStreak = prev.stats.currentStreak + 1;
  else if (lastPlayed === today) currentStreak = prev.stats.currentStreak;

  const longestStreak = Math.max(currentStreak, prev.stats.longestStreak);
  const totalPoints = prev.stats.totalPoints + score;
  const daysPlayed = prev.stats.daysPlayed + (lastPlayed !== today ? 1 : 0);
  const isPerfectScore = score === maxScore && maxScore >= 500;

  const stats: Stats = {
    ...prev.stats,
    currentStreak,
    longestStreak,
    totalPoints,
    daysPlayed,
    lastPlayedDate: today,
    totalQuestionsAnswered: prev.stats.totalQuestionsAnswered + maxScore / 100,
    correctAnswers: prev.stats.correctAnswers + score / 100,
  };

  const countryProgress = { ...prev.countryProgress };
  const continentMastery: Record<string, ContinentEntry> = { ...prev.continentMastery };
  const skillCorrect: Record<GameType, number> = { ...prev.skillCorrect };
  let countriesMastered = prev.stats.countriesMastered;

  // Aggregate this session's answers by country.
  const countryAnswers: Record<string, { correct: number; total: number; region: string }> = {};

  tasks.forEach((task, i) => {
    const answer = answers[i];
    const isCorrect = answer?.isCorrect === true;
    const qType = task.type as GameType;
    if (isCorrect && (qType === 'flag' || qType === 'capital' || qType === 'map')) {
      skillCorrect[qType] += 1;
    }

    const code = normalizeCountryCode(task.imageUrl);
    if (!code) return;
    const country = findCountry(code);
    if (!country) return;
    const key = country.code;
    if (!countryAnswers[key]) countryAnswers[key] = { correct: 0, total: 0, region: country.region };
    countryAnswers[key].total += 1;
    if (isCorrect) countryAnswers[key].correct += 1;
  });

  // Update per-country progress + continent mastery.
  for (const [code, agg] of Object.entries(countryAnswers)) {
    const existing = countryProgress[code] ?? { timesCorrect: 0, timesIncorrect: 0, mastered: false };
    const timesCorrect = existing.timesCorrect + agg.correct;
    const timesIncorrect = existing.timesIncorrect + (agg.total - agg.correct);
    const mastered = timesCorrect >= 3;
    if (mastered && !existing.mastered) countriesMastered += 1;
    countryProgress[code] = { timesCorrect, timesIncorrect, mastered };

    const continent = regionToContinent(agg.region);
    const ce = continentMastery[continent] ?? { questionsAnswered: 0, correctAnswers: 0, percentage: 0 };
    const questionsAnswered = ce.questionsAnswered + agg.total;
    const correct = ce.correctAnswers + agg.correct;
    continentMastery[continent] = {
      questionsAnswered,
      correctAnswers: correct,
      percentage: questionsAnswered > 0 ? Math.round((correct / questionsAnswered) * 100) : 0,
    };
  }

  stats.countriesMastered = countriesMastered;

  // Achievement checks.
  const unlockedAchievements = { ...prev.unlockedAchievements };
  const newAchievements: string[] = [];
  const continentPct = (c: Continent) => continentMastery[c]?.percentage ?? 0;

  const predicates: Record<string, boolean> = {
    first_quest: daysPlayed >= 1,
    streak_3: currentStreak >= 3,
    streak_7: currentStreak >= 7,
    streak_30: currentStreak >= 30,
    perfect_score: isPerfectScore,
    points_1000: totalPoints >= 1000,
    points_5000: totalPoints >= 5000,
    countries_10: countriesMastered >= 10,
    countries_50: countriesMastered >= 50,
    countries_100: countriesMastered >= 100,
    flags_50: skillCorrect.flag >= 50,
    capitals_50: skillCorrect.capital >= 50,
    maps_50: skillCorrect.map >= 50,
    continent_europe: continentPct('Europe') >= 80,
    continent_asia: continentPct('Asia') >= 80,
    continent_africa: continentPct('Africa') >= 80,
  };

  const now = new Date().toISOString();
  for (const ach of ACHIEVEMENTS) {
    if (unlockedAchievements[ach.id]) continue;
    if (predicates[ach.id]) {
      unlockedAchievements[ach.id] = now;
      newAchievements.push(ach.id);
    }
  }

  return {
    state: { stats, countryProgress, continentMastery, skillCorrect, unlockedAchievements },
    newAchievements,
  };
}
