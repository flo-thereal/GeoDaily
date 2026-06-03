import { expect, test } from '@playwright/test';

const STORAGE_KEY = 'geodaily-storage';
const VISITED_KEY = 'geodaily_has_visited';

test.describe('Static persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/');
    await page.evaluate(
      ({ visitedKey }) => localStorage.setItem(visitedKey, '1'),
      { visitedKey: VISITED_KEY }
    );
  });

  test('dashboard boots without a server', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.getByText("Today's Challenge")).toBeVisible();
  });

  test('reflects locally persisted progress after reload', async ({ page }) => {
    await page.evaluate(
      ({ key, value }) => localStorage.setItem(key, value),
      {
        key: STORAGE_KEY,
        value: JSON.stringify({
          state: {
            dailyTasks: [],
            dailyTasksDate: null,
            currentTaskIndex: 0,
            history: {},
            progress: {
              stats: {
                currentStreak: 4,
                longestStreak: 9,
                totalPoints: 1234,
                daysPlayed: 6,
                countriesMastered: 2,
                totalQuestionsAnswered: 20,
                correctAnswers: 15,
                lastPlayedDate: null,
              },
              countryProgress: {},
              continentMastery: {},
              skillCorrect: { flag: 0, capital: 0, map: 0 },
              unlockedAchievements: {},
            },
            settings: {
              language: 'en',
              dailyReminderEnabled: true,
              dailyReminderTime: '09:00',
              soundEnabled: true,
              hapticEnabled: true,
              theme: 'system',
            },
          },
          version: 0,
        }),
      }
    );

    await page.reload();
    await page.goto('/#/');

    await expect(page.getByText('4', { exact: true })).toBeVisible();
    await expect(page.getByText('1234', { exact: true })).toBeVisible();
  });
});
