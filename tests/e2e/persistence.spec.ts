import { expect, test } from '@playwright/test';

const STORAGE_KEY = 'geodaily-storage';

test.describe('Static persistence', () => {
  test('dashboard boots without a server', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.getByText("Today's Challenge")).toBeVisible();
  });

  test('reflects locally persisted progress after reload', async ({ page }) => {
    await page.goto('/#/');
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
                daysPlayed: 6,
                lastPlayedDate: null,
              },
            },
            settings: {
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
  });
});
