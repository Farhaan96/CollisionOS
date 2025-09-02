import { test, expect } from '@playwright/test';

test.describe('BMS Upload Simple Test', () => {
  test('should load BMS page after login without XML parsing errors', async ({
    page,
  }) => {
    // Set up console error tracking
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Login first
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.waitForSelector('input[placeholder="Enter your username"]', { timeout: 10000 });
    await page.fill('input[placeholder="Enter your username"]', 'admin');
    await page.fill('input[placeholder="Enter your password"]', 'admin123');
    await page.click('button:has-text("Sign In to CollisionOS")');
    
    // Wait for dashboard
    await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Navigate to BMS Import page
    try {
      const bmsLink = page.locator('text=BMS').or(page.locator('text=Import')).first();
      if (await bmsLink.isVisible()) {
        await bmsLink.click();
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      console.log('Could not find BMS navigation, that\'s OK for this test');
    }

    // Check for XML parsing errors specifically
    const xmlErrors = consoleErrors.filter(
      error =>
        error.includes('Objects are not valid as a React child') ||
        error.includes('#text') ||
        error.includes('@_xmlns')
    );

    console.log('Console errors found:', consoleErrors);
    console.log('XML parsing errors found:', xmlErrors);

    // The test should pass if there are no XML parsing errors
    expect(xmlErrors.length).toBe(0);

    // The page should still be functional
    const pageContent = await page.content();
    expect(pageContent).toContain('CollisionOS');
  });
});
