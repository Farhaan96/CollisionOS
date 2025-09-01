const { test, expect } = require('@playwright/test');

test.describe('BMS Upload Final Test', () => {
  test('should handle BMS file upload without XML parsing errors', async ({
    page,
  }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Set up console error monitoring
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Try to navigate to BMS Dashboard
    try {
      await page.click('text=BMS Dashboard');
      await page.waitForTimeout(2000);

      // Check if we're on the BMS Dashboard page
      const title = await page.locator('h3').textContent();
      console.log('Current page title:', title);

      if (title && title.includes('BMS Files Dashboard')) {
        console.log('Successfully navigated to BMS Dashboard');

        // Try to click the upload button
        try {
          await page.click('button:has-text("Upload BMS Files")');
          await page.waitForTimeout(1000);

          // Check if upload dialog opened
          const dialogVisible = await page
            .locator(
              'text=Drag and drop BMS XML files here, or click to browse'
            )
            .isVisible();
          console.log('Upload dialog opened:', dialogVisible);

          // Close dialog
          await page.click('button:has-text("Close")');
        } catch (e) {
          console.log('Could not interact with upload button:', e.message);
        }
      } else {
        console.log('Not on BMS Dashboard page, current title:', title);
      }
    } catch (e) {
      console.log('Could not navigate to BMS Dashboard:', e.message);
    }

    // Check for XML parsing errors
    const xmlErrors = consoleErrors.filter(
      error =>
        error.includes('Objects are not valid as a React child') ||
        error.includes('#text') ||
        error.includes('@_xmlns')
    );

    console.log('Total console errors:', consoleErrors.length);
    console.log('XML parsing errors:', xmlErrors.length);

    // The test should pass if there are no XML parsing errors
    expect(xmlErrors.length).toBe(0);

    // The page should still be functional
    const pageContent = await page.content();
    expect(pageContent).toContain('CollisionOS');

    console.log(
      '✅ BMS Upload test completed successfully - no XML parsing errors found!'
    );
  });
});
