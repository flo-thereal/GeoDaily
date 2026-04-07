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

    const module = await import('../../src/store/useStore');
    useStore = module.useStore;

    useStore.setState({
      streak: 0,
      lastPlayedDate: null,
      points: 0,
      dailyTasks: [],
      dailyTasksDate: null,
      currentTaskIndex: 0,
      isDailyCompleted: false,
      history: {},
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with expected defaults', () => {
    const state = useStore.getState();

    expect(state.streak).toBe(0);
    expect(state.lastPlayedDate).toBeNull();
    expect(state.points).toBe(0);
    expect(state.dailyTasks).toEqual([]);
    expect(state.currentTaskIndex).toBe(0);
    expect(state.isDailyCompleted).toBe(false);
    expect(state.history).toEqual({});
  });

  it('adds points cumulatively', () => {
    const { addPoints } = useStore.getState();

    addPoints(100);
    addPoints(250);

    expect(useStore.getState().points).toBe(350);
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
        },
      ],
      '2026-04-07'
    );

    const state = useStore.getState();
    expect(state.dailyTasks).toHaveLength(1);
    expect(state.dailyTasksDate).toBe('2026-04-07');
    expect(state.currentTaskIndex).toBe(0);
    expect(state.isDailyCompleted).toBe(false);
  });

  it('does not move beyond final task index', () => {
    const { setDailyTasks, nextTask } = useStore.getState();

    setDailyTasks(
      [
        {
          id: 'q1',
          type: 'capital',
          question: 'Capital of France?',
          options: ['Paris', 'Berlin', 'Madrid', 'Rome'],
          correctAnswer: 'Paris',
        },
        {
          id: 'q2',
          type: 'flag',
          question: "Which country's flag is this?",
          options: ['France', 'Germany', 'Italy', 'Spain'],
          correctAnswer: 'France',
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

  it('marks completion and can reset the daily flow', () => {
    const { completeDaily, resetDaily } = useStore.getState();

    completeDaily();
    expect(useStore.getState().isDailyCompleted).toBe(true);

    resetDaily();
    expect(useStore.getState().isDailyCompleted).toBe(false);
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

  it('increments streak for consecutive days and resets after gaps', () => {
    const { incrementStreak } = useStore.getState();

    vi.useFakeTimers();

    vi.setSystemTime(new Date('2026-04-07T12:00:00Z'));
    incrementStreak();
    expect(useStore.getState().streak).toBe(1);

    // Same day should not increment.
    incrementStreak();
    expect(useStore.getState().streak).toBe(1);

    vi.setSystemTime(new Date('2026-04-08T12:00:00Z'));
    incrementStreak();
    expect(useStore.getState().streak).toBe(2);

    vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
    incrementStreak();
    expect(useStore.getState().streak).toBe(1);
  });
});
