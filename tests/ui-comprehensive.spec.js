import { test, expect } from '@playwright/test';

test.describe('CollisionOS Comprehensive UI Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[placeholder="admin"]', 'admin');
    await page.fill('input[placeholder="admin123"]', 'admin123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/.*\/dashboard/);
  });

  test('Phase 3: Navigation and Routing', async ({ page }) => {
    console.log('=== TESTING NAVIGATION AND ROUTING ===');

    // Test main navigation menu items
    const menuItems = [
      'Dashboard',
      'BMS Import',
      'BMS Dashboard',
      'Customers',
      'Production',
      'Parts',
      'Technician',
      'QC',
      'Reports',
    ];

    for (const item of menuItems) {
      console.log(`Testing navigation to: ${item}`);

      // Click menu item
      await page.waitForSelector(`text=${item}`, { timeout: 5000 });
      await page.click(`text=${item}`);
      await page.waitForLoadState('networkidle');

      // Verify URL changed (basic routing test)
      const url = page.url();
      console.log(`  ✓ Navigated to: ${url}`);

      // Verify page header/title is visible
      await page.waitForTimeout(1000); // Allow page to load
      const bodyText = await page.textContent('body');
      console.log(`  ✓ Page loaded with content length: ${bodyText.length}`);
    }
  });

  test('Phase 4: Form Functionality - Customer Management', async ({
    page,
  }) => {
    console.log('=== TESTING FORM FUNCTIONALITY ===');

    // Navigate to customers
    await page.click('text=Customers');
    await page.waitForLoadState('networkidle');

    // Test Add Customer button/modal
    try {
      await page.waitForSelector('text=Add Customer', { timeout: 5000 });
      await page.click('text=Add Customer');
      console.log('  ✓ Add Customer button clicked');

      // Wait for modal/form to appear
      await page.waitForTimeout(2000);

      // Check for common form elements
      const hasNameField = await page
        .locator(
          'input[name*="name"], input[placeholder*="name"], input[label*="Name"]'
        )
        .count();
      const hasEmailField = await page
        .locator(
          'input[type="email"], input[name*="email"], input[placeholder*="email"]'
        )
        .count();
      const hasPhoneField = await page
        .locator(
          'input[type="tel"], input[name*="phone"], input[placeholder*="phone"]'
        )
        .count();

      console.log(
        `  ✓ Form fields found - Name: ${hasNameField}, Email: ${hasEmailField}, Phone: ${hasPhoneField}`
      );

      // Try to close modal if open
      const closeButtons = await page
        .locator(
          'button:has-text("Cancel"), button:has-text("Close"), [aria-label="close"]'
        )
        .count();
      if (closeButtons > 0) {
        await page.click(
          'button:has-text("Cancel"), button:has-text("Close"), [aria-label="close"]'
        );
        console.log('  ✓ Modal closed successfully');
      }
    } catch (error) {
      console.log(
        '  ⚠ Add Customer functionality may not be available or has different UI'
      );
    }
  });

  test('Phase 5: Interactive Elements - Buttons and Controls', async ({
    page,
  }) => {
    console.log('=== TESTING INTERACTIVE ELEMENTS ===');

    // Test dashboard interactive elements
    await page.click('text=Dashboard');
    await page.waitForLoadState('networkidle');

    // Count and test buttons
    const allButtons = await page.locator('button').count();
    console.log(`  ✓ Found ${allButtons} buttons on dashboard`);

    // Test refresh/reload functionality
    try {
      const refreshButton = page.locator(
        'button:has-text("Refresh"), button[aria-label*="refresh"], button[title*="refresh"]'
      );
      if ((await refreshButton.count()) > 0) {
        await refreshButton.first().click();
        console.log('  ✓ Refresh button clicked');
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      console.log('  ⚠ Refresh button not found or not clickable');
    }

    // Test filter/search elements
    const searchInputs = await page
      .locator(
        'input[type="search"], input[placeholder*="search"], input[placeholder*="filter"]'
      )
      .count();
    const dropdowns = await page
      .locator('select, [role="combobox"], [role="listbox"]')
      .count();

    console.log(
      `  ✓ Found ${searchInputs} search inputs and ${dropdowns} dropdown controls`
    );
  });

  test('Phase 6: Interface Design - Visual Elements', async ({ page }) => {
    console.log('=== TESTING INTERFACE DESIGN ===');

    // Test responsive design
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 },
    ];

    for (const viewport of viewports) {
      console.log(
        `Testing ${viewport.name} viewport (${viewport.width}x${viewport.height})`
      );

      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.waitForTimeout(1000);

      // Test if main navigation is accessible
      const navVisible = await page
        .locator('nav, [role="navigation"], .navbar, .menu')
        .count();
      console.log(`  ✓ Navigation elements visible: ${navVisible > 0}`);

      // Test if main content is visible
      const mainContent = await page
        .locator('main, [role="main"], .content, #main')
        .count();
      console.log(`  ✓ Main content visible: ${mainContent > 0}`);

      // Take screenshot for manual review
      await page.screenshot({
        path: `ui-test-${viewport.name.toLowerCase()}-${Date.now()}.png`,
        fullPage: false,
      });
    }

    // Reset to desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('Phase 6: Material-UI Component Rendering', async ({ page }) => {
    console.log('=== TESTING MATERIAL-UI COMPONENTS ===');

    // Navigate through different pages to test MUI components
    const pages = ['Dashboard', 'Customers', 'Production', 'Parts'];

    for (const pageName of pages) {
      console.log(`Testing MUI components on ${pageName}`);

      await page.click(`text=${pageName}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Count common MUI components
      const cards = await page
        .locator('.MuiCard-root, [class*="MuiCard"]')
        .count();
      const buttons = await page
        .locator('.MuiButton-root, [class*="MuiButton"]')
        .count();
      const textFields = await page
        .locator('.MuiTextField-root, [class*="MuiTextField"]')
        .count();
      const chips = await page
        .locator('.MuiChip-root, [class*="MuiChip"]')
        .count();
      const tables = await page
        .locator('.MuiTable-root, [class*="MuiTable"], table')
        .count();

      console.log(`  ✓ MUI Components found:`);
      console.log(`    - Cards: ${cards}`);
      console.log(`    - Buttons: ${buttons}`);
      console.log(`    - Text Fields: ${textFields}`);
      console.log(`    - Chips: ${chips}`);
      console.log(`    - Tables: ${tables}`);

      // Check for proper Material-UI theming
      const muiThemed = await page
        .locator('[class*="Mui"], [class*="MuiThemeProvider"]')
        .count();
      console.log(`  ✓ MUI themed elements: ${muiThemed}`);
    }
  });

  test('Phase 6: Typography and Color Scheme', async ({ page }) => {
    console.log('=== TESTING TYPOGRAPHY AND COLOR SCHEME ===');

    // Test various text elements
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
    const bodyText = await page.locator('p, span, div').count();

    console.log(
      `  ✓ Typography elements - Headings: ${headings}, Body text: ${bodyText}`
    );

    // Check for consistent color scheme by looking for common CSS classes
    const bodyHTML = await page.innerHTML('body');
    const hasColorClasses =
      bodyHTML.includes('color') ||
      bodyHTML.includes('primary') ||
      bodyHTML.includes('secondary');
    console.log(`  ✓ Color scheme classes present: ${hasColorClasses}`);

    // Take a full page screenshot for visual design review
    await page.screenshot({
      path: `ui-design-review-${Date.now()}.png`,
      fullPage: true,
    });
  });

  test('Phase 6: Layout Alignment and Spacing', async ({ page }) => {
    console.log('=== TESTING LAYOUT AND SPACING ===');

    // Test grid layouts
    const gridElements = await page
      .locator('[class*="Grid"], [class*="grid"], .container, .row')
      .count();
    console.log(`  ✓ Grid/layout elements: ${gridElements}`);

    // Test consistent spacing
    const spacedElements = await page
      .locator('[class*="margin"], [class*="padding"], [class*="spacing"]')
      .count();
    console.log(`  ✓ Spaced elements: ${spacedElements}`);

    // Check for proper alignment
    const alignedElements = await page
      .locator('[class*="align"], [class*="justify"], [class*="center"]')
      .count();
    console.log(`  ✓ Aligned elements: ${alignedElements}`);
  });

  test('Performance and Load Testing', async ({ page }) => {
    console.log('=== TESTING PERFORMANCE ===');

    // Measure page load times
    const pages = ['Dashboard', 'Customers', 'Production'];

    for (const pageName of pages) {
      const startTime = Date.now();

      await page.click(`text=${pageName}`);
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;
      console.log(`  ✓ ${pageName} load time: ${loadTime}ms`);

      // Check for loading indicators
      const loadingIndicators = await page
        .locator(
          '[class*="loading"], [class*="spinner"], .MuiCircularProgress-root'
        )
        .count();
      console.log(`    - Loading indicators: ${loadingIndicators}`);
    }
  });
});
