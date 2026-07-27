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

  for (const viewport of [
    { name: 'desktop', width: 1280, height: 720 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    test(`preserves the showcase image aspect ratio on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/about/index.html');

      const image = page.getByRole('img', {
        name: 'GeoDaily map practice asking the player to locate Sweden on a world map',
      });
      await expect(image).toBeVisible();

      const dimensions = await image.evaluate((element: HTMLImageElement) => {
        const bounds = element.getBoundingClientRect();
        const styles = getComputedStyle(element);
        const horizontalBorder =
          Number.parseFloat(styles.borderLeftWidth) + Number.parseFloat(styles.borderRightWidth);
        const verticalBorder =
          Number.parseFloat(styles.borderTopWidth) + Number.parseFloat(styles.borderBottomWidth);

        return {
          naturalWidth: element.naturalWidth,
          naturalHeight: element.naturalHeight,
          renderedWidth: bounds.width - horizontalBorder,
          renderedHeight: bounds.height - verticalBorder,
        };
      });

      expect(dimensions.naturalWidth).toBe(1440);
      expect(dimensions.naturalHeight).toBe(900);
      expect(dimensions.renderedWidth / dimensions.renderedHeight).toBeCloseTo(1.6, 2);
    });
  }
});
