/**
 * Screenshot Utility for CollisionOS UI Development
 *
 * This script takes screenshots of the running app for visual verification
 * Usage: node scripts/take-screenshot.js [url] [filename]
 *
 * Examples:
 *   node scripts/take-screenshot.js
 *   node scripts/take-screenshot.js http://localhost:3000/dashboard dashboard.png
 *   node scripts/take-screenshot.js http://localhost:3000/production-board production.png
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function takeScreenshot(url = 'http://localhost:3000/dashboard', filename = 'dashboard-screenshot.png') {
  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();

  try {
    console.log(`📸 Navigating to: ${url}`);

    // Check if we need to login first - go directly to login page
    await page.goto('http://localhost:3000/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for login page to load
    await page.waitForTimeout(1000);

    // Check if we're on the login page by looking for the username field
    const isLoginPage = await page.locator('input[placeholder="admin"]').isVisible().catch(() => false);

    if (isLoginPage) {
      console.log('🔐 Logging in...');

      // Fill in login credentials using placeholder selectors
      await page.locator('input[placeholder="admin"]').fill('admin');
      await page.locator('input[placeholder="admin123"]').fill('admin123');

      // Click login button and wait for navigation
      await Promise.all([
        page.waitForURL('**/dashboard', { timeout: 10000 }),
        page.click('button:has-text("Sign In")')
      ]);

      // Wait for dashboard to fully load
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      console.log('✅ Logged in successfully');
    }

    // Now navigate to the target URL
    if (url !== 'http://localhost:3000') {
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000
      });
    }

    // Wait for main content to load
    await page.waitForTimeout(2000);

    // Create screenshots directory if it doesn't exist
    const screenshotsDir = path.join(__dirname, '..', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    // Take screenshot
    const screenshotPath = path.join(screenshotsDir, filename);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });

    console.log(`✅ Screenshot saved to: ${screenshotPath}`);
    console.log(`📏 Viewport: 1920x1080`);
    console.log(`📄 Full page: Yes`);

    // Also take a mobile screenshot
    const mobileFilename = filename.replace('.png', '-mobile.png');
    const mobileScreenshotPath = path.join(screenshotsDir, mobileFilename);

    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({
      path: mobileScreenshotPath,
      fullPage: true
    });

    console.log(`📱 Mobile screenshot saved to: ${mobileScreenshotPath}`);

    return { desktop: screenshotPath, mobile: mobileScreenshotPath };

  } catch (error) {
    console.error('❌ Error taking screenshot:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Main execution
const args = process.argv.slice(2);
const url = args[0] || 'http://localhost:3000/dashboard';
const filename = args[1] || 'dashboard-screenshot.png';

takeScreenshot(url, filename)
  .then(paths => {
    console.log('\n✨ Screenshots complete!');
    console.log(`   Desktop: ${paths.desktop}`);
    console.log(`   Mobile: ${paths.mobile}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Screenshot failed:', error.message);
    process.exit(1);
  });
