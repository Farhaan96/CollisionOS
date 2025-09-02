import { test, expect } from '@playwright/test';

test.describe('Simple Login Test', () => {
  test('should be able to login and reach dashboard', async ({ page }) => {
    console.log('Starting login test...');
    
    // Navigate to login page
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    console.log('Navigated to login page');
    
    // Wait for login form to be visible
    await page.waitForSelector('input[placeholder="Enter your username"]', { timeout: 10000 });
    console.log('Login form is visible');
    
    // Fill login form
    await page.fill('input[placeholder="Enter your username"]', 'admin');
    await page.fill('input[placeholder="Enter your password"]', 'admin123');
    
    console.log('Filled login credentials');
    
    // Click login button
    await page.click('button:has-text("Sign In to CollisionOS")');
    
    console.log('Clicked login button');
    
    // Wait for navigation to dashboard
    await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    
    console.log('Successfully navigated to dashboard');
    
    // Verify we're on the dashboard
    await expect(page).toHaveURL(/.*dashboard.*/);
    
    // Look for dashboard content
    const dashboardTitle = page.locator('text=Dashboard').or(page.locator('text=Auto Body Shop Dashboard'));
    await expect(dashboardTitle.first()).toBeVisible();
    
    console.log('Dashboard verification complete');
  });
});