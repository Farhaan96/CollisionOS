/**
 * Comprehensive BMS Upload Workflow Test
 * Tests the complete BMS upload → customer creation → database storage → display workflow
 * Author: Claude Code Agent
 * Date: 2025-09-01
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testBMSUploadWorkflow() {
  console.log('🚀 Starting Comprehensive BMS Upload Workflow Test');
  console.log('===============================================');

  let browser = null;
  let context = null;
  let page = null;

  const testResults = {
    authenticationWorking: false,
    bmsPageAccessible: false,
    fileUploadSuccessful: false,
    customerCreatedInDB: false,
    customerVisibleInUI: false,
    noConsoleErrors: true,
    responseTime: null,
    errors: [],
  };

  try {
    // Launch browser
    browser = await chromium.launch({
      headless: false, // Keep visible for debugging
      slowMo: 1000, // Slow down for observation
    });

    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });

    page = await context.newPage();

    // Monitor console for errors
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString(),
      });
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
        testResults.noConsoleErrors = false;
        testResults.errors.push(`Console Error: ${msg.text()}`);
      }
    });

    // Monitor network requests
    const networkRequests = [];
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString(),
      });
    });

    page.on('response', response => {
      if (
        response.url().includes('/import/bms') ||
        response.url().includes('/api/customers')
      ) {
        console.log(
          `📡 API Response: ${response.status()} - ${response.url()}`
        );
      }
    });

    console.log('\n1️⃣ STEP 1: Navigate to Application and Login');
    console.log('============================================');

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Check if we need to login
    const needsLogin = await page.isVisible('input[type="email"]');
    if (needsLogin) {
      console.log('🔐 Logging in...');
      await page.fill('input[type="email"]', 'admin@collisionos.com');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
      console.log('✅ Login successful');
    } else {
      console.log('✅ Already authenticated');
    }
    testResults.authenticationWorking = true;

    console.log('\n2️⃣ STEP 2: Navigate to BMS Import Page');
    console.log('=====================================');

    await page.goto('http://localhost:3000/bms-import');
    await page.waitForLoadState('networkidle');

    // Check if page is accessible
    const pageTitle = await page.locator('h4').first().textContent();
    if (pageTitle?.includes('BMS File Import')) {
      console.log('✅ BMS Import page accessible');
      testResults.bmsPageAccessible = true;
    } else {
      throw new Error('BMS Import page not accessible or title missing');
    }

    console.log('\n3️⃣ STEP 3: Upload Test BMS File');
    console.log('===============================');

    const testFilePath = path.join(__dirname, 'test-bms.xml');
    console.log('📁 Test file path:', testFilePath);

    // Verify test file exists
    if (!fs.existsSync(testFilePath)) {
      throw new Error(`Test BMS file not found at: ${testFilePath}`);
    }

    console.log('📤 Uploading BMS file...');
    const startTime = Date.now();

    // Upload the file
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    // Wait for file to be selected
    await page.waitForSelector('text=test-bms.xml', { timeout: 5000 });
    console.log('✅ File selected successfully');

    // Click upload button
    await page.click('button:has-text("Upload BMS File")');
    console.log('🔄 Upload initiated...');

    // Wait for upload completion (success message)
    try {
      await page.waitForSelector('text=BMS file processed successfully', {
        timeout: 15000,
      });
      const endTime = Date.now();
      testResults.responseTime = endTime - startTime;
      console.log(`✅ File upload successful (${testResults.responseTime}ms)`);
      testResults.fileUploadSuccessful = true;
    } catch (error) {
      console.log('❌ Upload failed or timed out');
      testResults.errors.push('File upload failed or timed out');
    }

    console.log('\n4️⃣ STEP 4: Verify Customer Creation in Database');
    console.log('===============================================');

    // Make API call to check if customer was created
    try {
      const response = await page.evaluate(async () => {
        const token = localStorage.getItem('token');
        const apiResponse = await fetch('http://localhost:3001/api/customers', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        return {
          status: apiResponse.status,
          data: await apiResponse.json(),
        };
      });

      if (response.status === 200 && response.data.customers) {
        const johnSmith = response.data.customers.find(
          c => c.firstName === 'John' && c.lastName === 'Smith'
        );

        if (johnSmith) {
          console.log('✅ Customer John Smith found in database');
          console.log('👤 Customer Details:', {
            id: johnSmith.id,
            email: johnSmith.email,
            phone: johnSmith.phone,
          });
          testResults.customerCreatedInDB = true;
        } else {
          console.log('❌ Customer John Smith not found in database');
          console.log(
            '📋 Available customers:',
            response.data.customers.map(c => `${c.firstName} ${c.lastName}`)
          );
        }
      } else {
        console.log('❌ Failed to fetch customers:', response.status);
        testResults.errors.push(`Customer API failed: ${response.status}`);
      }
    } catch (error) {
      console.log('❌ Error checking customer in database:', error.message);
      testResults.errors.push(`Database check failed: ${error.message}`);
    }

    console.log('\n5️⃣ STEP 5: Verify Customer Visible in UI');
    console.log('========================================');

    // Navigate to customers page
    await page.goto('http://localhost:3000/customers');
    await page.waitForLoadState('networkidle');

    // Wait for customer list to load and check for John Smith
    try {
      await page.waitForTimeout(2000); // Give UI time to refresh

      const johnSmithVisible = await page.isVisible('text=John Smith');
      if (johnSmithVisible) {
        console.log('✅ Customer John Smith visible in UI');
        testResults.customerVisibleInUI = true;
      } else {
        console.log('❌ Customer John Smith not visible in UI');

        // Check what customers are visible
        const visibleCustomers = await page
          .locator(
            '[data-testid*="customer"], .customer-row, text=/^[A-Z][a-z]+ [A-Z][a-z]+$/'
          )
          .allTextContents();
        console.log('👥 Visible customers:', visibleCustomers);
      }
    } catch (error) {
      console.log('❌ Error checking UI for customer:', error.message);
      testResults.errors.push(`UI check failed: ${error.message}`);
    }

    console.log('\n6️⃣ STEP 6: Console and Network Analysis');
    console.log('======================================');

    // Check for any 400+ HTTP status codes
    const badRequests = networkRequests.filter(
      req =>
        req.status >= 400 ||
        req.url.includes('import/bms') ||
        req.url.includes('/api/customers')
    );

    if (badRequests.length > 0) {
      console.log('⚠️  Network issues detected:');
      badRequests.forEach(req => {
        console.log(`   ${req.method} ${req.url} - ${req.status || 'Pending'}`);
      });
    } else {
      console.log('✅ No problematic network requests detected');
    }

    // Console error summary
    const errorCount = consoleMessages.filter(
      msg => msg.type === 'error'
    ).length;
    console.log(
      `📊 Console Messages: ${consoleMessages.length} total, ${errorCount} errors`
    );

    if (errorCount > 0) {
      console.log('❌ Console errors found:');
      consoleMessages
        .filter(msg => msg.type === 'error')
        .forEach(msg => {
          console.log(`   ${msg.timestamp}: ${msg.text}`);
        });
      testResults.noConsoleErrors = false;
    }
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    testResults.errors.push(`Test execution error: ${error.message}`);
  } finally {
    // Cleanup
    if (browser) {
      await browser.close();
    }
  }

  // Results Summary
  console.log('\n🏁 TEST RESULTS SUMMARY');
  console.log('======================');
  console.log(
    `✅ Authentication Working: ${testResults.authenticationWorking}`
  );
  console.log(`✅ BMS Page Accessible: ${testResults.bmsPageAccessible}`);
  console.log(`✅ File Upload Successful: ${testResults.fileUploadSuccessful}`);
  console.log(`✅ Customer Created in DB: ${testResults.customerCreatedInDB}`);
  console.log(`✅ Customer Visible in UI: ${testResults.customerVisibleInUI}`);
  console.log(`✅ No Console Errors: ${testResults.noConsoleErrors}`);
  console.log(`⏱️  Upload Response Time: ${testResults.responseTime}ms`);

  const successCount = Object.values(testResults).filter(
    v => v === true
  ).length;
  const totalTests = 6;
  const successRate = Math.round((successCount / totalTests) * 100);

  console.log(
    `\n📊 SUCCESS RATE: ${successCount}/${totalTests} (${successRate}%)`
  );

  if (testResults.errors.length > 0) {
    console.log('\n❌ ERRORS ENCOUNTERED:');
    testResults.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  // Final assessment
  const allCriticalTestsPassed =
    testResults.authenticationWorking &&
    testResults.bmsPageAccessible &&
    testResults.fileUploadSuccessful &&
    testResults.customerCreatedInDB &&
    testResults.customerVisibleInUI &&
    testResults.noConsoleErrors;

  if (allCriticalTestsPassed) {
    console.log(
      '\n🎉 ALL CRITICAL TESTS PASSED! BMS upload workflow is working perfectly.'
    );
  } else {
    console.log(
      '\n⚠️  SOME TESTS FAILED. BMS upload workflow needs attention.'
    );
  }

  return testResults;
}

// Run the test
if (require.main === module) {
  testBMSUploadWorkflow()
    .then(results => {
      process.exit(results.errors.length === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { testBMSUploadWorkflow };
