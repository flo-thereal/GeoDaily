import { beforeEach, describe, expect, it, vi } from 'vitest';

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

function mockResponse(status: number, payload: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

describe('api service', () => {
  let api: typeof import('../../src/services/api');

  beforeEach(async () => {
    setupLocalStorage();
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn());
    api = await import('../../src/services/api');
  });

  it('manages auth token in localStorage', () => {
    expect(api.getAuthToken()).toBeNull();

    api.setAuthToken('token-123');
    expect(api.getAuthToken()).toBe('token-123');
    expect(api.isAuthenticated()).toBe(true);

    api.clearAuthToken();
    expect(api.getAuthToken()).toBeNull();
    expect(api.isAuthenticated()).toBe(false);
  });

  it('saves token after successful login', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(
      mockResponse(200, {
        token: 'jwt-token',
        user: {
          id: 'u1',
          email: 'dev@geodaily.com',
          displayName: 'Dev Explorer',
          level: 1,
          createdAt: '2026-04-07T00:00:00.000Z',
        },
      })
    );

    const result = await api.login('dev@geodaily.com', 'password123');

    expect(result.token).toBe('jwt-token');
    expect(api.getAuthToken()).toBe('jwt-token');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/users/login',
      expect.objectContaining({
        method: 'POST',
      })
    );

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload).toEqual({ email: 'dev@geodaily.com', password: 'password123' });
  });

  it('throws before calling fetch when auth is required and token is missing', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;

    await expect(api.getCurrentUser()).rejects.toThrow('Authentication required');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends bearer token on authenticated requests', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    api.setAuthToken('abc-123');

    fetchMock.mockResolvedValue(
      mockResponse(200, {
        id: 'u1',
        email: 'dev@geodaily.com',
        displayName: 'Dev Explorer',
        level: 1,
        createdAt: '2026-04-07T00:00:00.000Z',
        stats: {
          totalPoints: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalDaysPlayed: 0,
          totalQuestionsAnswered: 0,
          totalCorrectAnswers: 0,
          countriesMastered: 0,
          accuracy: 0,
        },
        continentMastery: {},
        achievements: [],
      })
    );

    await api.getCurrentUser();

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/users/me',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer abc-123',
        }),
      })
    );
  });

  it('builds countries query parameters correctly', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(mockResponse(200, []));

    await api.getCountries({
      region: 'Europe',
      search: 'fra',
      limit: 10,
      offset: 20,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/countries?region=Europe&search=fra&limit=10&offset=20',
      expect.any(Object)
    );
  });

  it('surfaces API error messages', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(mockResponse(401, { error: 'Invalid credentials' }));

    await expect(api.login('wrong@example.com', 'bad')).rejects.toThrow('Invalid credentials');
  });
});
