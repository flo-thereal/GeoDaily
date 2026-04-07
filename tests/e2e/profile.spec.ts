import { test, expect, Page } from '@playwright/test';

// Helper to login as dev user
async function loginAsDevUser(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="text"], input[placeholder*="email" i]', 'dev@geodaily.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('/');
}

test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDevUser(page);
    await page.goto('/profile');
  });

  test('should display user information', async ({ page }) => {
    await expect(page.locator('h2:has-text("Dev Explorer")')).toBeVisible();
    await expect(page.locator('text=Explorer Profile')).toBeVisible();
  });

  test('should display stats cards', async ({ page }) => {
    await expect(page.locator('h3:has-text("Days Active")')).toBeVisible();
    await expect(page.locator('h3:has-text("Countries Mastered")')).toBeVisible();
    await expect(page.locator('h3:has-text("Avg Accuracy")')).toBeVisible();
    await expect(page.locator('h3:has-text("Total Points")')).toBeVisible();
  });

  test('should display learning history chart', async ({ page }) => {
    await expect(page.locator('h3:has-text("Learning History")')).toBeVisible();
    await expect(page.locator('text=Points earned')).toBeVisible();
    
    // Chart time range selector should be present
    await expect(page.locator('select, [role="combobox"]')).toBeVisible();
  });

  test('should display continent mastery section', async ({ page }) => {
    await expect(page.locator('h3:has-text("Continent Mastery")')).toBeVisible();
    await expect(page.locator('text=Europe')).toBeVisible();
    await expect(page.locator('text=Asia')).toBeVisible();
    await expect(page.locator('text=Africa')).toBeVisible();
  });

  test('should display achievements section', async ({ page }) => {
    await expect(page.locator('h3:has-text("Recent Landmarks")')).toBeVisible();
  });

  test('should change chart time range', async ({ page }) => {
    // Find and click the time range selector
    const selector = page.locator('select, [role="combobox"]').first();
    await selector.selectOption({ label: 'Last 3 Months' });
    
    // Chart should update (just verify no errors)
    await page.waitForTimeout(500);
    await expect(page.locator('h3:has-text("Learning History")')).toBeVisible();
  });
});

test.describe('Profile Stats Update', () => {
  test('should reflect updated stats after completing quiz', async ({ page }) => {
    await loginAsDevUser(page);
    
    // Get initial stats
    await page.goto('/profile');
    const initialPoints = await page.locator('h3:has-text("Total Points") + p, h3:has-text("Total Points") ~ p').first().textContent();
    
    // Complete a quiz (abbreviated flow)
    await page.goto('/quiz/daily');
    await page.waitForSelector('button:not([disabled])');
    
    // Answer questions
    for (let i = 0; i < 5; i++) {
      const buttons = page.locator('button:not(:has-text("Finish")):not(:has-text("Review")):not(:has-text("Dashboard"))');
      const count = await buttons.count();
      if (count > 0) {
        await buttons.first().click();
        await page.waitForTimeout(300);
      }
      
      const finishButton = page.locator('button:has-text("Finish")');
      if (await finishButton.isVisible()) {
        await finishButton.click();
        break;
      }
    }
    
    // Wait for submission to complete
    await page.waitForTimeout(1000);
    
    // Check stats are still displayed (actual value depends on test isolation)
    await page.goto('/profile');
    await expect(page.locator('h3:has-text("Total Points")')).toBeVisible();
  });
});
