import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

function setupLocalStorage() {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  });
}

type UseStoreType = typeof import('../../src/store/useStore').useStore;

describe('useStore', () => {
  let useStore: UseStoreType;

  beforeEach(async () => {
    vi.useRealTimers();
    setupLocalStorage();
    vi.resetModules();

    const { initialProgress } = await import('../../src/lib/progress');
    const module = await import('../../src/store/useStore');
    useStore = module.useStore;

    useStore.setState({
      dailyTasks: [],
      dailyTasksDate: null,
      currentTaskIndex: 0,
      history: {},
      progress: initialProgress(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with expected defaults', () => {
    const state = useStore.getState();

    expect(state.dailyTasks).toEqual([]);
    expect(state.currentTaskIndex).toBe(0);
    expect(state.history).toEqual({});
    expect(state.progress.stats.currentStreak).toBe(0);
  });

  it('sets daily tasks and resets progress', () => {
    const { setDailyTasks } = useStore.getState();

    setDailyTasks(
      [
        {
          id: 'q1',
          type: 'capital',
          question: 'Capital of France?',
          options: ['Paris', 'Berlin', 'Madrid', 'Rome'],
          correctAnswer: 'Paris',
          countryCode: 'FR',
        },
      ],
      '2026-04-07'
    );

    const state = useStore.getState();
    expect(state.dailyTasks).toHaveLength(1);
    expect(state.dailyTasksDate).toBe('2026-04-07');
    expect(state.currentTaskIndex).toBe(0);
  });

  it('does not move beyond final task index', () => {
    const { setDailyTasks, nextTask } = useStore.getState();

    setDailyTasks(
      [
        {
          id: 'capital-FR-0',
          type: 'capital',
          question: 'Capital of France?',
          options: ['Paris', 'Berlin', 'Madrid', 'Rome'],
          correctAnswer: 'Paris',
          countryCode: 'FR',
        },
        {
          id: 'flag-FR-1',
          type: 'flag',
          question: "Which country's flag is this?",
          options: ['France', 'Germany', 'Italy', 'Spain'],
          correctAnswer: 'France',
          countryCode: 'FR',
          imageUrl: 'FR',
        },
      ],
      '2026-04-07'
    );

    nextTask();
    nextTask();
    nextTask();

    expect(useStore.getState().currentTaskIndex).toBe(1);
  });

  it('can reset the daily flow index', () => {
    const { setDailyTasks, nextTask, resetDaily } = useStore.getState();

    setDailyTasks(
      [
        {
          id: 'q1',
          type: 'capital',
          question: 'Capital of France?',
          options: ['Paris', 'Berlin', 'Madrid', 'Rome'],
          correctAnswer: 'Paris',
          countryCode: 'FR',
        },
      ],
      '2026-04-07'
    );
    nextTask();
    resetDaily();
    expect(useStore.getState().currentTaskIndex).toBe(0);
  });

  it('saves challenge history by date', () => {
    const { saveHistory } = useStore.getState();

    saveHistory('2026-04-07', {
      date: '2026-04-07',
      tasks: [],
      answers: [],
      score: 500,
      completed: true,
    });

    const state = useStore.getState();
    expect(state.history['2026-04-07']).toBeDefined();
    expect(state.history['2026-04-07'].score).toBe(500);
    expect(state.history['2026-04-07'].completed).toBe(true);
  });

  it('resets all progress while keeping settings', () => {
    const { saveHistory, updateSettings, resetAllProgress } = useStore.getState();

    updateSettings({ theme: 'dark' });
    saveHistory('2026-04-07', {
      date: '2026-04-07',
      tasks: [],
      answers: [],
      score: 400,
      completed: true,
    });

    resetAllProgress();

    const state = useStore.getState();
    expect(state.history).toEqual({});
    expect(state.progress.stats.currentStreak).toBe(0);
    expect(state.settings.theme).toBe('dark');
  });
});
