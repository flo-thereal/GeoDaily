import { expect, test } from '@playwright/test';
import { localDateString } from '../../src/lib/utils';

const STORAGE_KEY = 'geodaily-storage';

function buildStoragePayload(historyDate: string) {
  return {
    state: {
      dailyTasks: [],
      dailyTasksDate: null,
      currentTaskIndex: 0,
      history: {
        [historyDate]: {
          date: historyDate,
          tasks: [
            {
              id: 'flag-FR-0',
              type: 'flag',
              question: "Which country's flag is this?",
              correctAnswer: 'France',
              options: ['France', 'Germany', 'Italy', 'Spain'],
              countryCode: 'FR',
              imageUrl: 'FR',
            },
          ],
          answers: [{ guess: 'France', isCorrect: true }],
          score: 100,
          completed: true,
        },
      },
      progress: {
        stats: {
          currentStreak: 1,
          longestStreak: 1,
          daysPlayed: 1,
          lastPlayedDate: historyDate,
        },
      },
      settings: {
        theme: 'system',
      },
    },
    version: 0,
  };
}

test.describe('Daily quiz flow', () => {
  test('redirects completed today challenge to review mode', async ({ page }) => {
    const today = localDateString();

    await page.addInitScript(
      ({ key, payload }) => localStorage.setItem(key, JSON.stringify(payload)),
      { key: STORAGE_KEY, payload: buildStoragePayload(today) }
    );

    await page.goto(`/#/quiz/daily?date=${today}`);
    await page.waitForURL(/review=true/, { timeout: 15000 });
    await expect(page.getByText('Review Mode')).toBeVisible();
  });

  test('quest completed screen reflects stored streak', async ({ page }) => {
    const today = localDateString();

    await page.addInitScript(
      ({ key, payload }) => localStorage.setItem(key, JSON.stringify(payload)),
      {
        key: STORAGE_KEY,
        payload: {
          ...buildStoragePayload(today),
          state: {
            ...buildStoragePayload(today).state,
            progress: {
              ...buildStoragePayload(today).state.progress,
              stats: {
                ...buildStoragePayload(today).state.progress.stats,
                currentStreak: 3,
                longestStreak: 5,
              },
            },
          },
        },
      }
    );

    await page.goto('/#/quest-completed');
    await expect(page.getByText('Quest Completed!')).toBeVisible();
    await expect(page.getByText('3', { exact: true })).toBeVisible();
    await expect(page.getByText('Day Streak')).toBeVisible();
  });
});
