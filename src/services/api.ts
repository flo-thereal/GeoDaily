import { DailyTask, DailyHistory } from '../store/useStore';

// ============================================================================
// Auth Token Management
// ============================================================================

const TOKEN_KEY = 'geodaily_auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

// ============================================================================
// API Request Helper
// ============================================================================

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requireAuth = false, headers = {}, ...rest } = options;

  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };

  const token = getAuthToken();
  if (token) {
    (requestHeaders as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  } else if (requireAuth) {
    throw new Error('Authentication required');
  }

  const response = await fetch(endpoint, {
    headers: requestHeaders,
    ...rest,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    if (errorData?.error) {
      throw new Error(errorData.error);
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

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

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Country {
  code: string;
  name: string;
  capital: string;
  region: string;
  subregion?: string;
  population: number;
  areaKm2: number;
  currency: {
    code: string;
    name: string;
    symbol: string;
  };
  languages: string[];
  borders: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  flagEmoji: string;
  description?: string;
  funFacts?: string[];
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
// Auth Endpoints
// ============================================================================

export async function register(
  email: string,
  password: string,
  displayName: string
): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/api/users/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  });
  setAuthToken(response.token);
  return response;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/api/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(response.token);
  return response;
}

export function logout(): void {
  clearAuthToken();
}

// ============================================================================
// User Profile Endpoints
// ============================================================================

export async function getCurrentUser(): Promise<UserProfile> {
  return apiRequest<UserProfile>('/api/users/me', { requireAuth: true });
}

export async function updateProfile(updates: {
  displayName?: string;
  avatarUrl?: string;
  title?: string;
}): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>('/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify(updates),
    requireAuth: true,
  });
}

export async function getUserStats(): Promise<UserStats> {
  const profile = await getCurrentUser();
  return profile.stats;
}

export interface LearningHistoryEntry {
  date: string;
  score: number;
  maxScore: number;
}

export async function getLearningHistory(days: number = 30): Promise<LearningHistoryEntry[]> {
  return apiRequest<LearningHistoryEntry[]>(`/api/users/history?days=${days}`, { requireAuth: true });
}

export async function getUserSettings(): Promise<UserSettings> {
  return apiRequest<UserSettings>('/api/users/settings', { requireAuth: true });
}

export async function updateSettings(updates: {
  language?: string;
  dailyReminderEnabled?: boolean;
  dailyReminderTime?: string;
  soundEnabled?: boolean;
  hapticEnabled?: boolean;
  theme?: string;
}): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>('/api/users/settings', {
    method: 'PATCH',
    body: JSON.stringify(updates),
    requireAuth: true,
  });
}

// ============================================================================
// Countries Endpoints
// ============================================================================

export interface CountriesQueryParams {
  region?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function getCountries(params: CountriesQueryParams = {}): Promise<Country[]> {
  const searchParams = new URLSearchParams();
  if (params.region) searchParams.set('region', params.region);
  if (params.search) searchParams.set('search', params.search);
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.offset) searchParams.set('offset', params.offset.toString());

  const query = searchParams.toString();
  return apiRequest<Country[]>(`/api/countries${query ? `?${query}` : ''}`);
}

export async function getCountryByCode(code: string): Promise<Country> {
  return apiRequest<Country>(`/api/countries/${code.toUpperCase()}`);
}

export async function getRegions(): Promise<{ region: string; count: number }[]> {
  return apiRequest<{ region: string; count: number }[]>('/api/countries/meta/regions');
}

// ============================================================================
// Challenge Endpoints
// ============================================================================

export async function fetchDailyTasks(date: string): Promise<DailyTask[]> {
  // Auth is optional for daily tasks - include token if available
  return apiRequest<DailyTask[]>(`/api/daily?date=${date}`);
}

// Legacy alias for backward compatibility
export const generateDailyTasks = fetchDailyTasks;

export async function fetchPracticeTasks(
  type: 'flags' | 'capitals' | 'map'
): Promise<DailyTask[]> {
  return apiRequest<DailyTask[]>(`/api/practice?type=${type}`);
}

export interface SubmitChallengeParams {
  date: string;
  tasks: DailyTask[];
  answers: Array<{
    answer: string;
    isCorrect: boolean;
    timeTaken?: number;
  }>;
  score: number;
  maxScore: number;
  timeTaken?: number;
}

export async function submitChallenge(
  params: SubmitChallengeParams
): Promise<SubmitChallengeResult> {
  return apiRequest<SubmitChallengeResult>('/api/submit', {
    method: 'POST',
    body: JSON.stringify(params),
    requireAuth: true,
  });
}

export async function completeChallenge(
  date: string,
  score: number
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>('/api/complete', {
    method: 'POST',
    body: JSON.stringify({ date, score }),
    requireAuth: true,
  });
}

// ============================================================================
// History Endpoints
// ============================================================================

export async function getChallengeHistory(
  limit: number = 30
): Promise<Record<string, DailyHistory>> {
  return apiRequest<Record<string, DailyHistory>>(`/api/history?limit=${limit}`, {
    requireAuth: true,
  });
}

// ============================================================================
// Health Check
// ============================================================================

export async function checkHealth(): Promise<{
  status: string;
  database: boolean;
  mode: string;
}> {
  return apiRequest<{ status: string; database: boolean; mode: string }>('/api/health');
}
