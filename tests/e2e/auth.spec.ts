import { test, expect, Page } from '@playwright/test';

// Helper to login as dev user
async function loginAsDevUser(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="text"], input[placeholder*="email" i]', 'dev@geodaily.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('/');
}

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText(/Welcome/i);
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"], input[placeholder*="email" i]', 'dev@geodaily.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    
    // Should redirect to home and show user info
    await page.waitForURL('/');
    await expect(page.locator('text=Dev Explorer')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"], input[placeholder*="email" i]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button:has-text("Sign In")');
    
    // Should show error message
    await expect(page.locator('text=Invalid')).toBeVisible();
  });

  test('should allow guest access via Continue as Guest', async ({ page }) => {
    await page.goto('/login');
    await page.click('a:has-text("Continue as Guest")');
    await page.waitForURL('/');
    await expect(page.locator('h1')).toContainText(/Hello/i);
  });
});

test.describe('Home Page', () => {
  test('should display daily challenge card', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h2:has-text("Today\'s Challenge")')).toBeVisible();
  });

  test('should display past expeditions', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h3:has-text("Past Expeditions")')).toBeVisible();
  });

  test('should show sign-in prompt for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Sign In')).toBeVisible();
  });

  test('should show user stats when logged in', async ({ page }) => {
    await loginAsDevUser(page);
    await expect(page.locator('text=Dev Explorer')).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('should navigate to Atlas page', async ({ page }) => {
    await page.goto('/');
    await page.click('a:has-text("Atlas")');
    await page.waitForURL('/atlas');
    await expect(page).toHaveURL('/atlas');
  });

  test('should navigate to Settings page', async ({ page }) => {
    await page.goto('/');
    await page.click('a:has-text("Settings")');
    await page.waitForURL('/settings');
    await expect(page).toHaveURL('/settings');
  });

  test('should navigate to Profile when logged in', async ({ page }) => {
    await loginAsDevUser(page);
    await page.click('a[href="/profile"]');
    await page.waitForURL('/profile');
    await expect(page.locator('text=Explorer Profile')).toBeVisible();
  });
});
