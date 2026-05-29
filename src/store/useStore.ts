import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { applyDailyResult, initialProgress, type DailyResult, type ProgressState } from '../lib/progress';

export type GameType = 'flag' | 'map' | 'capital';

export interface DailyTask {
  id: string;
  type: GameType;
  question: string;
  options?: string[];
  correctAnswer: string;
  imageUrl?: string;
  mapCoordinates?: { lat: number; lng: number };
}

export interface DailyHistory {
  date: string;
  tasks: DailyTask[];
  answers: any[];
  score: number;
  completed: boolean;
}

export interface Settings {
  language: string;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  theme: string;
}

export const defaultSettings: Settings = {
  language: 'en',
  dailyReminderEnabled: true,
  dailyReminderTime: '09:00',
  soundEnabled: true,
  hapticEnabled: true,
  theme: 'system',
};

interface GameState {
  streak: number;
  lastPlayedDate: string | null;
  points: number;
  dailyTasks: DailyTask[];
  dailyTasksDate: string | null;
  currentTaskIndex: number;
  isDailyCompleted: boolean;
  history: Record<string, DailyHistory>;

  // Local "database": all profile progress lives here (no server/account).
  progress: ProgressState;
  settings: Settings;

  incrementStreak: () => void;
  addPoints: (points: number) => void;
  setDailyTasks: (tasks: DailyTask[], date: string) => void;
  nextTask: () => void;
  completeDaily: () => void;
  resetDaily: () => void;
  saveHistory: (date: string, history: DailyHistory) => void;

  /** Record a finished daily challenge into local progress. Returns newly unlocked achievement ids. */
  submitDailyResult: (result: DailyResult) => string[];
  updateSettings: (updates: Partial<Settings>) => void;
}

export const useStore = create<GameState>()(
  persist(
    (set) => ({
      streak: 0,
      lastPlayedDate: null,
      points: 0,
      dailyTasks: [],
      dailyTasksDate: null,
      currentTaskIndex: 0,
      isDailyCompleted: false,
      history: {},
      progress: initialProgress(),
      settings: { ...defaultSettings },

      incrementStreak: () => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        if (state.lastPlayedDate === today) return state;

        // Check if yesterday was played
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const newStreak = state.lastPlayedDate === yesterdayStr ? state.streak + 1 : 1;
        return { streak: newStreak, lastPlayedDate: today };
      }),

      addPoints: (points) => set((state) => ({ points: state.points + points })),

      setDailyTasks: (tasks, date) => set({ dailyTasks: tasks, dailyTasksDate: date, currentTaskIndex: 0, isDailyCompleted: false }),

      nextTask: () => set((state) => ({
        currentTaskIndex: Math.min(state.currentTaskIndex + 1, state.dailyTasks.length - 1)
      })),

      completeDaily: () => set({ isDailyCompleted: true }),

      resetDaily: () => set({ currentTaskIndex: 0, isDailyCompleted: false }),

      saveHistory: (date, history) => set((state) => ({
        history: {
          ...state.history,
          [date]: history
        }
      })),

      submitDailyResult: (result) => {
        const { state: nextProgress, newAchievements } = applyDailyResult(useStore.getState().progress, result);
        set({ progress: nextProgress });
        return newAchievements;
      },

      updateSettings: (updates) => set((state) => ({ settings: { ...state.settings, ...updates } })),
    }),
    {
      name: 'geodaily-storage',
    }
  )
);
