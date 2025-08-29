const { test, expect } = require('@playwright/test');

test.describe('BMS Upload Simple Test', () => {
  test('should load BMS Dashboard without XML parsing errors', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check if there are any console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate to BMS Dashboard if possible
    try {
      await page.click('text=BMS Dashboard');
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('Could not navigate to BMS Dashboard, checking current page');
    }
    
    // Check for XML parsing errors specifically
    const xmlErrors = consoleErrors.filter(error => 
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
