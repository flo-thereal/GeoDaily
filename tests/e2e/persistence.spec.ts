import { expect, test } from '@playwright/test';

const STORAGE_KEY = 'geodaily-storage';

test.describe('Static persistence', () => {
  test('dashboard boots without a server', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.getByText("Today's Challenge")).toBeVisible();
  });

  test('reflects locally persisted progress after reload', async ({ page }) => {
    // Seed the persisted Zustand store, then load the app fresh.
    await page.goto('/#/');
    await page.evaluate(
      ({ key, value }) => localStorage.setItem(key, value),
      {
        key: STORAGE_KEY,
        value: JSON.stringify({
          state: {
            streak: 0,
            lastPlayedDate: null,
            points: 0,
            dailyTasks: [],
            dailyTasksDate: null,
            currentTaskIndex: 0,
            isDailyCompleted: false,
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

    // Streak (4) and points (1234) headline badges should reflect stored state.
    await expect(page.getByText('4', { exact: true })).toBeVisible();
    await expect(page.getByText('1234', { exact: true })).toBeVisible();
  });
});
