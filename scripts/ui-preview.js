/**
 * Interactive UI Preview Tool
 *
 * Takes screenshots of multiple pages for UI development
 * Usage: node scripts/ui-preview.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const PAGES_TO_CAPTURE = [
  { url: 'http://localhost:3000/dashboard', name: 'dashboard' },
  { url: 'http://localhost:3000/production-board', name: 'production-board' },
  { url: 'http://localhost:3000/bms-import', name: 'bms-import' },
  { url: 'http://localhost:3000/search', name: 'search' },
  { url: 'http://localhost:3000/technician', name: 'technician-dashboard' },
];

async function captureAllPages() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('📸 CollisionOS UI Preview Tool\n');
  console.log('================================\n');

  const results = [];

  for (const pageConfig of PAGES_TO_CAPTURE) {
    const page = await context.newPage();

    try {
      console.log(`📄 Capturing: ${pageConfig.name}`);
      console.log(`   URL: ${pageConfig.url}`);

      await page.goto(pageConfig.url, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      await page.waitForTimeout(2000);

      const screenshotPath = path.join(screenshotsDir, `${pageConfig.name}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });

      console.log(`   ✅ Saved to: screenshots/${pageConfig.name}.png\n`);

      results.push({
        name: pageConfig.name,
        url: pageConfig.url,
        path: screenshotPath
      });

    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}\n`);
    } finally {
      await page.close();
    }
  }

  await browser.close();

  // Create summary
  console.log('================================\n');
  console.log('✨ UI Preview Complete!\n');
  console.log('Screenshots saved:');
  results.forEach(r => {
    console.log(`   • ${r.name}: screenshots/${r.name}.png`);
  });
  console.log('\nYou can now view these images to see the UI.');

  return results;
}

captureAllPages()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Error:', error.message);
    process.exit(1);
  });
