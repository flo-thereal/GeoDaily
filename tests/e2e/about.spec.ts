import { expect, test } from '@playwright/test';

test.describe('Project showcase', () => {
  test('introduces GeoDaily and links to the app and source', async ({ page }) => {
    await page.goto('/about/index.html');

    await expect(page).toHaveTitle(/GeoDaily — A little geography, every day/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'A little geography, every day.' })
    ).toBeVisible();

    await expect(page.getByRole('link', { name: 'Play today', exact: true })).toHaveAttribute(
      'href',
      'https://flo-thereal.github.io/GeoDaily/'
    );
    await expect(page.getByRole('link', { name: 'View source' })).toHaveAttribute(
      'href',
      'https://github.com/flo-thereal/GeoDaily'
    );
  });
});
