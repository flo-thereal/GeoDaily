import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface GameState {
  streak: number;
  lastPlayedDate: string | null;
  points: number;
  dailyTasks: DailyTask[];
  currentTaskIndex: number;
  isDailyCompleted: boolean;
  history: Record<string, DailyHistory>;
  
  incrementStreak: () => void;
  addPoints: (points: number) => void;
  setDailyTasks: (tasks: DailyTask[]) => void;
  nextTask: () => void;
  completeDaily: () => void;
  resetDaily: () => void;
  saveHistory: (date: string, history: DailyHistory) => void;
}

export const useStore = create<GameState>()(
  persist(
    (set) => ({
      streak: 0,
      lastPlayedDate: null,
      points: 0,
      dailyTasks: [],
      currentTaskIndex: 0,
      isDailyCompleted: false,
      history: {},

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
      
      setDailyTasks: (tasks) => set({ dailyTasks: tasks, currentTaskIndex: 0, isDailyCompleted: false }),
      
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
      }))
    }),
    {
      name: 'geodaily-storage',
    }
  )
);
