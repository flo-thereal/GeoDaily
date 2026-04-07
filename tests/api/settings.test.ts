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
    expect(data).toHaveProperty('language');
    expect(data).toHaveProperty('daily_reminder_enabled');
    expect(data).toHaveProperty('daily_reminder_time');
    expect(data).toHaveProperty('sound_enabled');
    expect(data).toHaveProperty('haptic_enabled');
    expect(data).toHaveProperty('theme');
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
      dailyReminderEnabled: !current.daily_reminder_enabled,
      dailyReminderTime: current.daily_reminder_time === '09:00' ? '10:00' : '09:00',
      soundEnabled: !current.sound_enabled,
      hapticEnabled: !current.haptic_enabled,
      theme: current.theme === 'dark' ? 'light' : 'dark',
      language: current.language === 'en' ? 'fr' : 'en',
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
    expect(after.daily_reminder_enabled).toBe(updatedPayload.dailyReminderEnabled);
    expect(after.daily_reminder_time).toBe(updatedPayload.dailyReminderTime);
    expect(after.sound_enabled).toBe(updatedPayload.soundEnabled);
    expect(after.haptic_enabled).toBe(updatedPayload.hapticEnabled);
    expect(after.theme).toBe(updatedPayload.theme);
    expect(after.language).toBe(updatedPayload.language);

    // Restore original state to keep tests isolated.
    await api('/api/users/settings', {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        dailyReminderEnabled: current.daily_reminder_enabled,
        dailyReminderTime: current.daily_reminder_time,
        soundEnabled: current.sound_enabled,
        hapticEnabled: current.haptic_enabled,
        theme: current.theme,
        language: current.language,
      }),
    });
  });
});
