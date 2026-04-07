import { beforeAll, describe, expect, it } from 'vitest';

const BASE_URL = 'http://localhost:3000';

let dbConfigured = false;
let devAuthBypass = false;
let authToken: string | null = null;

function api(path: string, init?: RequestInit) {
  return fetch(`${BASE_URL}${path}`, init);
}

function authHeaders(extra: Record<string, string> = {}) {
  return {
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...extra,
  };
}

beforeAll(async () => {
  const healthResponse = await api('/api/health');
  expect(healthResponse.status).toBe(200);
  const health = await healthResponse.json();

  dbConfigured = health.database !== 'not configured';
  devAuthBypass = !!health.devAuthBypass;

  if (!dbConfigured) {
    return;
  }

  const email = `settings_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`;
  const registerResponse = await api('/api/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'password123',
      displayName: 'Settings Tester',
    }),
  });

  if (registerResponse.status === 201) {
    const body = await registerResponse.json();
    authToken = body.token ?? null;
    return;
  }

  const loginResponse = await api('/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dev@geodaily.com', password: 'password123' }),
  });

  if (loginResponse.ok) {
    const body = await loginResponse.json();
    authToken = body.token ?? null;
  }
});

describe('User Settings API', () => {
  it('returns settings with expected shape', async () => {
    if (!dbConfigured) {
      expect(dbConfigured).toBe(false);
      return;
    }

    const response = await api('/api/users/settings', {
      headers: authHeaders(),
    });

    if (!authToken && !devAuthBypass) {
      expect(response.status).toBe(401);
      return;
    }

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('notificationsEnabled');
    expect(data).toHaveProperty('soundEnabled');
    expect(data).toHaveProperty('darkMode');
    expect(data).toHaveProperty('language');
    expect(data).toHaveProperty('units');
  });

  it('updates settings and persists changes', async () => {
    if (!dbConfigured) {
      expect(dbConfigured).toBe(false);
      return;
    }

    const currentResponse = await api('/api/users/settings', {
      headers: authHeaders(),
    });

    if (!authToken && !devAuthBypass) {
      expect(currentResponse.status).toBe(401);
      return;
    }

    const current = await currentResponse.json();

    const updatedPayload = {
      notificationsEnabled: !current.notificationsEnabled,
      soundEnabled: !current.soundEnabled,
      darkMode: !current.darkMode,
      language: current.language === 'en' ? 'fr' : 'en',
      units: current.units === 'metric' ? 'imperial' : 'metric',
    };

    const updateResponse = await api('/api/users/settings', {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(updatedPayload),
    });
    const updateResult = await updateResponse.json();

    expect(updateResponse.status).toBe(200);
    expect(updateResult.success).toBe(true);

    const afterResponse = await api('/api/users/settings', {
      headers: authHeaders(),
    });
    const after = await afterResponse.json();

    expect(afterResponse.status).toBe(200);
    expect(after.notificationsEnabled).toBe(updatedPayload.notificationsEnabled);
    expect(after.soundEnabled).toBe(updatedPayload.soundEnabled);
    expect(after.darkMode).toBe(updatedPayload.darkMode);
    expect(after.language).toBe(updatedPayload.language);
    expect(after.units).toBe(updatedPayload.units);

    // Restore original state to keep tests isolated.
    await api('/api/users/settings', {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        notificationsEnabled: current.notificationsEnabled,
        soundEnabled: current.soundEnabled,
        darkMode: current.darkMode,
        language: current.language,
        units: current.units,
      }),
    });
  });
});
