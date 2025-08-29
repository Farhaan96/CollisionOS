import { test, expect } from '@playwright/test';

test.describe('CollisionOS UI Issues', () => {
  test('capture login page screenshot and check branding', async ({ page }) => {
    await page.goto('/');
    
    // Take screenshot of login page
    await page.screenshot({ path: 'login-page.png', fullPage: true });
    
    // Check for incorrect branding
    const precisionText = page.locator('text=Precision Autobody');
    if (await precisionText.count() > 0) {
      console.log('Found "Precision Autobody" text that should be "CollisionOS"');
    }
    
    // Check for CollisionOS branding
    const collisionOSText = page.locator('text=CollisionOS');
    const collisionOSCount = await collisionOSText.count();
    console.log(`Found ${collisionOSCount} instances of "CollisionOS" text`);
  });

  test('capture dashboard page and check for text overflow', async ({ page }) => {
    await page.goto('/');
    
    // Try to login or navigate to dashboard
    // Check if we're already on dashboard or need to login
    const loginButton = page.locator('button:has-text("Sign In"), button:has-text("Login")');
    const dashboardContent = page.locator('[data-testid="dashboard"], .dashboard, h1:has-text("Dashboard"), h2:has-text("Dashboard")');
    
    if (await loginButton.count() > 0) {
      console.log('Login page detected');
    } else if (await dashboardContent.count() > 0) {
      console.log('Dashboard page detected');
      await page.screenshot({ path: 'dashboard-page.png', fullPage: true });
      
      // Check for text overflow by looking for elements with scrollWidth > clientWidth
      const overflowElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const overflowing = [];
        elements.forEach(el => {
          if (el.scrollWidth > el.clientWidth && el.innerText) {
            overflowing.push({
              tagName: el.tagName,
              className: el.className,
              text: el.innerText.substring(0, 50) + '...'
            });
          }
        });
        return overflowing;
      });
      
      if (overflowElements.length > 0) {
        console.log('Found elements with text overflow:', overflowElements);
      }
    }
  });

  test('check responsive layout', async ({ page }) => {
    await page.goto('/');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: 'mobile-layout.png', fullPage: true });
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: 'tablet-layout.png', fullPage: true });
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({ path: 'desktop-layout.png', fullPage: true });
  });
});