/**
 * Quick BMS Upload Test - Simplified version
 * Tests basic BMS upload functionality without complex UI navigation
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function quickBMSTest() {
  console.log('🚀 Quick BMS Upload Test');
  console.log('========================');

  let browser = null;
  let context = null;
  let page = null;

  try {
    browser = await chromium.launch({
      headless: false,
      slowMo: 500,
    });

    context = await browser.newContext();
    page = await context.newPage();

    // Monitor console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      }
    });

    console.log('\n1. Navigate to application');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Check current page
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);

    // Try to find main content
    const pageContent = await page.textContent('body');
    console.log('📄 Page contains "BMS":', pageContent.includes('BMS'));
    console.log('📄 Page contains "Import":', pageContent.includes('Import'));
    console.log(
      '📄 Page contains "Dashboard":',
      pageContent.includes('Dashboard')
    );

    // Try direct navigation to different BMS routes
    const routesToTry = [
      '/bms-import',
      '/bms',
      '/import',
      '/pages/BMS/BMSImport',
    ];

    for (const route of routesToTry) {
      try {
        console.log(`\n2. Testing route: ${route}`);
        await page.goto(`http://localhost:3000${route}`);
        await page.waitForTimeout(2000);

        const title = await page
          .textContent('h1, h2, h3, h4, h5, h6')
          .catch(() => 'No heading found');
        console.log(`   Title: ${title}`);

        if (title.includes('BMS') || title.includes('Import')) {
          console.log('✅ Found BMS Import page!');

          // Test file upload
          const fileInput = await page.locator('input[type="file"]');
          if ((await fileInput.count()) > 0) {
            console.log('✅ File input found');

            const testFilePath = path.join(__dirname, 'test-bms.xml');
            if (fs.existsSync(testFilePath)) {
              console.log('📤 Uploading test file...');
              await fileInput.setInputFiles(testFilePath);

              // Look for upload button
              const uploadButton = page
                .locator('button:has-text("Upload")')
                .first();
              if ((await uploadButton.count()) > 0) {
                console.log('🔄 Clicking upload button...');
                await uploadButton.click();

                // Wait for response
                await page.waitForTimeout(5000);

                const success = await page.isVisible('text=success');
                const error = await page.isVisible('text=error');

                console.log(
                  '✅ Upload result - Success:',
                  success,
                  'Error:',
                  error
                );

                if (success) {
                  console.log('🎉 BMS upload successful!');
                  return true;
                }
              }
            }
          }
          break;
        }
      } catch (error) {
        console.log(`❌ Route ${route} failed:`, error.message);
      }
    }

    // Try using the menu/navigation
    console.log('\n3. Testing navigation menu');
    try {
      const navLinks = await page
        .locator('nav a, [role="navigation"] a, .nav-link')
        .allTextContents();
      console.log('🧭 Navigation links found:', navLinks.length);
      navLinks.forEach((link, index) => {
        if (
          link.toLowerCase().includes('bms') ||
          link.toLowerCase().includes('import')
        ) {
          console.log(`   ${index}: ${link} ⭐`);
        } else {
          console.log(`   ${index}: ${link}`);
        }
      });

      // Try clicking BMS related link
      const bmsLink = page.locator('text=BMS').first();
      if ((await bmsLink.count()) > 0) {
        console.log('🔗 Clicking BMS link...');
        await bmsLink.click();
        await page.waitForTimeout(2000);

        const newTitle = await page
          .textContent('h1, h2, h3, h4, h5, h6')
          .catch(() => 'No heading');
        console.log('📄 After click title:', newTitle);
      }
    } catch (error) {
      console.log('❌ Navigation test failed:', error.message);
    }

    console.log('\n4. Test API directly');
    try {
      // Test the API endpoint directly
      const response = await page.evaluate(async () => {
        try {
          const formData = new FormData();
          formData.append(
            'file',
            new Blob(
              [
                '<?xml version="1.0"?><test><customer><firstName>John</firstName><lastName>Smith</lastName></customer></test>',
              ],
              { type: 'text/xml' }
            ),
            'test.xml'
          );

          const result = await fetch('http://localhost:3001/api/import/bms', {
            method: 'POST',
            headers: {
              Authorization: 'Bearer dev-token',
            },
            body: formData,
          });

          return {
            status: result.status,
            ok: result.ok,
            text: await result.text(),
          };
        } catch (error) {
          return {
            error: error.message,
          };
        }
      });

      console.log(
        '🌐 API Response:',
        response.status,
        response.ok ? '✅' : '❌'
      );
      if (response.error) {
        console.log('❌ API Error:', response.error);
      } else if (response.text) {
        console.log('📝 API Response text:', response.text.substring(0, 200));
      }

      if (response.status === 200) {
        console.log('🎉 API is working! BMS upload endpoint is functional.');
        return true;
      }
    } catch (error) {
      console.log('❌ API test failed:', error.message);
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log('❌ BMS upload workflow needs investigation');
  console.log('💡 Check:');
  console.log('   1. Frontend routes configuration');
  console.log('   2. Component imports and exports');
  console.log('   3. Server API endpoints');
  console.log('   4. Authentication middleware');

  return false;
}

// Run the test
quickBMSTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
