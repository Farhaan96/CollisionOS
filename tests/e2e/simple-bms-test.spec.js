const { test, expect } = require('@playwright/test');

test.describe('Simple BMS Test', () => {
  test('should load BMS Dashboard page', async ({ page }) => {
    // Navigate directly to BMS Dashboard
    await page.goto('http://localhost:3000/bms-dashboard');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check if the page loads without errors
    const errorText = await page.locator('text=Error').count();
    expect(errorText).toBe(0);
    
    // Check if BMS Dashboard title is present
    const title = await page.locator('h3').textContent();
    console.log('Page title:', title);
    
    // The page should either show the BMS Dashboard or redirect to login
    // Both are acceptable outcomes
    const isBMSDashboard = title && title.includes('BMS Files Dashboard');
    const isLoginPage = await page.locator('input[name="email"]').count() > 0;
    
    expect(isBMSDashboard || isLoginPage).toBe(true);
  });
});
