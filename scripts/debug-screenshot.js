/**
 * Debug Screenshot - Run with browser visible to see what's happening
 */

const { chromium } = require('playwright');
const path = require('path');

async function debugScreenshot() {
  const browser = await chromium.launch({
    headless: false,  // Show browser
    slowMo: 1000      // Slow down actions
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Log console messages
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  try {
    console.log('📸 Navigating to app...');
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('Current URL:', page.url());

    // Check if on login page
    const loginVisible = await page.locator('input[placeholder="admin"]').isVisible().catch(() => false);
    console.log('Login page visible:', loginVisible);

    if (loginVisible) {
      console.log('🔐 Attempting login...');

      // Fill credentials
      await page.locator('input[placeholder="admin"]').fill('admin');
      console.log('Filled username');

      await page.locator('input[placeholder="admin123"]').fill('admin123');
      console.log('Filled password');

      // Take screenshot before clicking
      await page.screenshot({ path: 'debug-before-click.png' });
      console.log('Screenshot taken before click');

      // Click and log
      console.log('Clicking Sign In button...');
      await page.click('button:has-text("Sign In")');

      // Wait and check URL
      await page.waitForTimeout(3000);
      console.log('Current URL after click:', page.url());

      // Take screenshot after clicking
      await page.screenshot({ path: 'debug-after-click.png' });
      console.log('Screenshot taken after click');

      // Check for errors
      const errorVisible = await page.locator('[role="alert"]').isVisible().catch(() => false);
      if (errorVisible) {
        const errorText = await page.locator('[role="alert"]').textContent();
        console.log('ERROR MESSAGE:', errorText);
      }
    }

    // Wait for user to see
    console.log('\nBrowser will stay open for 30 seconds...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

debugScreenshot()
  .then(() => {
    console.log('Debug complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('Debug failed:', error);
    process.exit(1);
  });
