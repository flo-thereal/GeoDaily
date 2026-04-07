import { beforeAll, describe, expect, it } from 'vitest';

const BASE_URL = 'http://localhost:3000';

type HealthResponse = {
  status: string;
  database: 'connected' | 'disconnected' | 'not configured';
  mode: string;
  devAuthBypass?: boolean;
};

let health: HealthResponse;
let authToken: string | null = null;

function api(path: string, init?: RequestInit) {
  return fetch(`${BASE_URL}${path}`, init);
}

function getQuestionsPayload(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.questions)) return data.questions;
  return [];
}

beforeAll(async () => {
  const healthResponse = await api('/api/health');
  expect(healthResponse.status).toBe(200);
  health = await healthResponse.json();

  if (health.database === 'not configured') {
    return;
  }

  const uniqueEmail = `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`;
  const registerResponse = await api('/api/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'password123',
      displayName: 'Integration Tester',
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
    body: JSON.stringify({
      email: 'dev@geodaily.com',
      password: 'password123',
    }),
  });

  if (loginResponse.ok) {
    const body = await loginResponse.json();
    authToken = body.token ?? null;
  }
});

describe('Health API', () => {
  it('returns health metadata', async () => {
    const response = await api('/api/health');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(['connected', 'disconnected', 'not configured']).toContain(data.database);
    expect(typeof data.mode).toBe('string');
  });
});

describe('Daily Challenge API', () => {
  it('returns 400 when date is missing', async () => {
    const response = await api('/api/daily');
    expect(response.status).toBe(400);
  });

  it('returns challenge questions or key error for a dated request', async () => {
    const today = new Date().toISOString().split('T')[0];
    const response = await api(`/api/daily?date=${today}`);
    const data = await response.json();

    expect([200, 401]).toContain(response.status);

    if (response.status === 200) {
      const questions = getQuestionsPayload(data);
      expect(questions.length).toBeGreaterThan(0);

      const question = questions[0];
      expect(question).toHaveProperty('id');
      expect(question).toHaveProperty('type');
      expect(question).toHaveProperty('question');
      expect(question).toHaveProperty('correctAnswer');
      expect(['flag', 'capital', 'map']).toContain(question.type);
    } else {
      expect(typeof data.error).toBe('string');
    }
  });
});

describe('Authentication API', () => {
  it('registers a new user in database mode', async () => {
    if (health.database === 'not configured') {
      const response = await api('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'x@y.z', password: 'password123', displayName: 'x' }),
      });
      expect(response.status).toBe(404);
      return;
    }

    const email = `register_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`;
    const response = await api('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'password123',
        displayName: 'Register Test',
      }),
    });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('token');
    expect(data).toHaveProperty('user');
    expect(data.user.email).toBe(email);
  });

  it('rejects invalid credentials', async () => {
    if (health.database === 'not configured') {
      const response = await api('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nope@example.com', password: 'wrongpassword' }),
      });
      expect(response.status).toBe(404);
      return;
    }

    const response = await api('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'dev@geodaily.com',
        password: 'wrongpassword',
      }),
    });

    expect(response.status).toBe(401);
  });
});

describe('Users API', () => {
  it('returns profile with auth in database mode', async () => {
    if (health.database === 'not configured') {
      expect(health.database).toBe('not configured');
      return;
    }

    const response = await api('/api/users/me', {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    });

    if (!authToken && !health.devAuthBypass) {
      expect(response.status).toBe(401);
      return;
    }

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('email');
    expect(data).toHaveProperty('displayName');
    expect(data).toHaveProperty('stats');
    expect(data.stats).toHaveProperty('totalPoints');
    expect(data.stats).toHaveProperty('currentStreak');
    expect(data.stats).toHaveProperty('longestStreak');
    expect(data.stats).toHaveProperty('countriesMastered');
  });

  it('supports learning history endpoint in database mode', async () => {
    if (health.database === 'not configured') {
      expect(health.database).toBe('not configured');
      return;
    }

    const response = await api('/api/users/history?days=7', {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    });

    if (!authToken && !health.devAuthBypass) {
      expect(response.status).toBe(401);
      return;
    }

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('date');
      expect(data[0]).toHaveProperty('score');
      expect(data[0]).toHaveProperty('maxScore');
    }
  });
});

describe('Countries API', () => {
  it('returns a countries list with filtering', async () => {
    const response = await api('/api/countries?limit=5&search=an');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const country = data[0];
    expect(country).toHaveProperty('code');
    expect(country).toHaveProperty('name');
    expect(country).toHaveProperty('region');
  });

  it('returns regions metadata', async () => {
    const response = await api('/api/countries/meta/regions');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('region');
    expect(data[0]).toHaveProperty('count');
  });

  it('returns a single country by code', async () => {
    const listResponse = await api('/api/countries?limit=1');
    const list = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(list.length).toBeGreaterThan(0);

    const code = list[0].code;
    const response = await api(`/api/countries/${code}`);
    const country = await response.json();

    expect(response.status).toBe(200);
    expect(country.code).toBe(code);
  });
});

describe('Challenge Submission API', () => {
  it('validates required fields', async () => {
    if (health.database === 'not configured') {
      const response = await api('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(response.status).toBe(404);
      return;
    }

    const response = await api('/api/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({}),
    });

    if (!authToken && !health.devAuthBypass) {
      expect(response.status).toBe(401);
      return;
    }

    expect(response.status).toBe(400);
  });

  it('accepts a valid challenge submission and exposes history', async () => {
    if (health.database === 'not configured') {
      expect(health.database).toBe('not configured');
      return;
    }

    const date = `2099-12-${Math.floor(Math.random() * 20 + 10)}`;
    const submission = {
      date,
      tasks: [
        {
          id: 'q1',
          type: 'flag',
          question: "Which country's flag is this?",
          options: ['France', 'Germany', 'Italy', 'Spain'],
          correctAnswer: 'France',
          imageUrl: 'FR',
        },
      ],
      answers: [{ answer: 'France', isCorrect: true }],
      score: 100,
      maxScore: 100,
      timeTaken: 42,
    };

    const submitResponse = await api('/api/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(submission),
    });

    if (!authToken && !health.devAuthBypass) {
      expect(submitResponse.status).toBe(401);
      return;
    }

    const submitData = await submitResponse.json();
    expect(submitResponse.status).toBe(200);
    expect(submitData.success).toBe(true);
    expect(submitData).toHaveProperty('stats');
    expect(submitData.stats).toHaveProperty('totalPoints');
    expect(submitData.stats).toHaveProperty('currentStreak');
    expect(submitData.stats).toHaveProperty('longestStreak');

    const historyResponse = await api('/api/history?limit=10', {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    });
    const historyData = await historyResponse.json();

    expect(historyResponse.status).toBe(200);
    expect(typeof historyData).toBe('object');
    expect(historyData).toHaveProperty(date);
  });
});
