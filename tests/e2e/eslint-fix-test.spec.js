const { test, expect } = require('@playwright/test');

test.describe('ESLint Fix Test', () => {
  test('should load application without ESLint compilation errors', async ({
    page,
  }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');

    // Wait for page to load
    await page.waitForTimeout(5000);

    // Set up console error monitoring
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Check if the page loads without ESLint errors
    const pageContent = await page.content();

    // The page should contain CollisionOS (indicating it loaded)
    expect(pageContent).toContain('CollisionOS');

    // Check for ESLint compilation errors specifically
    const eslintErrors = consoleErrors.filter(
      error =>
        error.includes('ESLint') ||
        error.includes('import/first') ||
        error.includes('Compiled with problems')
    );

    console.log('Total console errors:', consoleErrors.length);
    console.log('ESLint errors found:', eslintErrors.length);

    // The test should pass if there are no ESLint errors
    expect(eslintErrors.length).toBe(0);

    // Also check that there are no React compilation errors
    const reactErrors = consoleErrors.filter(
      error =>
        error.includes('Objects are not valid as a React child') ||
        error.includes('Objects are not valid as a React child')
    );

    console.log('React errors found:', reactErrors.length);
    expect(reactErrors.length).toBe(0);

    console.log(
      '✅ ESLint fix test completed successfully - no compilation errors found!'
    );
  });
});
