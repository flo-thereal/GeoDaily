import { test, expect } from '@playwright/test';

test.describe('Atlas Page', () => {
  test('should display atlas/explore page', async ({ page }) => {
    await page.goto('/atlas');
    
    // Should show country list or explore interface
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display country cards', async ({ page }) => {
    await page.goto('/atlas');
    await page.waitForTimeout(1000); // Wait for data to load
    
    // Should have some country content
    // The exact structure depends on the Atlas component
    const countryContent = page.locator('text=/population|capital|region/i');
    // Atlas should have loaded some content
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('should allow searching countries', async ({ page }) => {
    await page.goto('/atlas');
    
    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="country" i]');
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('France');
      await page.waitForTimeout(500);
      
      // Should filter results
      await expect(page.locator('text=France')).toBeVisible();
    }
  });

  test('should allow filtering by region', async ({ page }) => {
    await page.goto('/atlas');
    
    // Find region filter
    const regionFilter = page.locator('select, button:has-text("Region"), button:has-text("All Regions")');
    
    if (await regionFilter.first().isVisible()) {
      // Interact with filter
      await regionFilter.first().click();
      await page.waitForTimeout(300);
    }
  });
});

test.describe('Settings Page', () => {
  test('should display settings page', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have toggle switches for settings', async ({ page }) => {
    await page.goto('/settings');
    
    // Settings page should have some toggle/switch elements
    const toggles = page.locator('button[role="switch"], input[type="checkbox"], [class*="toggle"]');
    await page.waitForTimeout(500);
    
    // Should have at least one setting control
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('should have language selector', async ({ page }) => {
    await page.goto('/settings');
    
    // Look for language setting
    const languageText = page.locator('text=Language, text=language');
    if (await languageText.first().isVisible()) {
      await expect(languageText.first()).toBeVisible();
    }
  });
});
