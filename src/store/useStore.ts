import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  applyDailyResult,
  initialProgress,
  type DailyResult,
  type ProgressState,
} from '../lib/progress';

export type GameType = 'flag' | 'map' | 'capital';

export interface MapGuess {
  lat: number;
  lng: number;
  distance: number | null;
  points?: number;
}

export type AnswerGuess = string | MapGuess;

export interface AnswerRecord {
  guess: AnswerGuess;
  isCorrect: boolean;
}

export interface DailyTask {
  id: string;
  type: GameType;
  question: string;
  options?: string[];
  correctAnswer: string;
  countryCode: string;
  imageUrl?: string;
  mapCoordinates?: { lat: number; lng: number };
}

export interface DailyHistory {
  date: string;
  tasks: DailyTask[];
  answers: AnswerRecord[];
  score: number;
  completed: boolean;
}

export interface Settings {
  theme: string;
}

export const defaultSettings: Settings = {
  theme: 'system',
};

interface GameState {
  dailyTasks: DailyTask[];
  dailyTasksDate: string | null;
  currentTaskIndex: number;
  history: Record<string, DailyHistory>;
  progress: ProgressState;
  settings: Settings;

  setDailyTasks: (tasks: DailyTask[], date: string) => void;
  nextTask: () => void;
  resetDaily: () => void;
  saveHistory: (date: string, history: DailyHistory) => void;
  submitDailyResult: (result: DailyResult) => void;
  updateSettings: (updates: Partial<Settings>) => void;
  resetAllProgress: () => void;
}

export const useStore = create<GameState>()(
  persist(
    (set) => ({
      dailyTasks: [],
      dailyTasksDate: null,
      currentTaskIndex: 0,
      history: {},
      progress: initialProgress(),
      settings: { ...defaultSettings },

      setDailyTasks: (tasks, date) =>
        set({ dailyTasks: tasks, dailyTasksDate: date, currentTaskIndex: 0 }),

      nextTask: () =>
        set((state) => ({
          currentTaskIndex: Math.min(state.currentTaskIndex + 1, state.dailyTasks.length - 1),
        })),

      resetDaily: () => set({ currentTaskIndex: 0 }),

      saveHistory: (date, history) =>
        set((state) => ({
          history: { ...state.history, [date]: history },
        })),

      submitDailyResult: (result) => {
        const nextProgress = applyDailyResult(useStore.getState().progress, result);
        set({ progress: nextProgress });
      },

      updateSettings: (updates) => set((state) => ({ settings: { ...state.settings, ...updates } })),

      resetAllProgress: () =>
        set({
          dailyTasks: [],
          dailyTasksDate: null,
          currentTaskIndex: 0,
          history: {},
          progress: initialProgress(),
        }),
    }),
    { name: 'geodaily-storage' }
  )
);
