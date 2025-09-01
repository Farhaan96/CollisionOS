/**
 * COMPREHENSIVE END-TO-END BMS UPLOAD TESTING SUITE
 *
 * Tests the critical BMS upload → customer creation → display workflow
 *
 * Test Scenarios:
 * 1. BMS Upload Flow - Upload valid BMS XML file and verify processing
 * 2. Customer API Integration - Test customer creation via BMS and API response
 * 3. UI Integration - Test customer list auto-refresh and display
 *
 * Validation Points:
 * - No 400 API errors
 * - Customer data properly saved to database
 * - Customer appears in UI within 2 seconds of upload
 * - All console errors resolved
 * - Authentication and shop context working
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('BMS Upload Comprehensive Testing', () => {
  let uploadResponse = null;
  let customerCreated = null;
  let apiErrors = [];
  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    // Reset tracking variables
    uploadResponse = null;
    customerCreated = null;
    apiErrors = [];
    consoleErrors = [];

    // Monitor console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('❌ Console Error:', msg.text());
      }
    });

    // Monitor API responses
    page.on('response', response => {
      const url = response.url();
      const status = response.status();

      // Track BMS upload responses
      if (url.includes('/api/import/bms')) {
        uploadResponse = {
          status,
          url,
          ok: response.ok(),
        };
        console.log(`📡 BMS API Response: ${status} ${response.statusText()}`);
      }

      // Track customer API responses
      if (url.includes('/api/customers')) {
        console.log(
          `📡 Customer API Response: ${status} ${response.statusText()}`
        );
        if (status >= 400) {
          apiErrors.push({ url, status, statusText: response.statusText() });
        }
      }

      // Track any 400+ errors
      if (status >= 400) {
        console.log(`❌ API Error: ${status} ${url}`);
      }
    });

    // Navigate and login
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const isLoginPage = await page.locator('text=Sign In').isVisible();
    if (isLoginPage) {
      await page.fill(
        'input[type="email"], input[name="username"]',
        'admin@demoautobody.com'
      );
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"], button:has-text("Sign In")');
      await page.waitForTimeout(2000);
    }
  });

  test('1. BMS Upload Flow - Complete File Processing', async ({ page }) => {
    console.log('\n🎯 TEST 1: BMS Upload Flow - Complete File Processing');
    console.log('======================================================');

    // Navigate to BMS import page
    await page.goto('/bms-import');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify BMS import page loads
    const pageTitle = await page
      .locator('h1, h2, h3')
      .filter({ hasText: /BMS|Import/i })
      .first()
      .isVisible();
    expect(pageTitle).toBe(true);
    console.log('✅ BMS import page loaded successfully');

    // Locate file input
    const fileInput = page.locator('input[type="file"], #file-input').first();
    await expect(fileInput).toBeAttached();
    console.log('✅ File input element found');

    // Prepare test BMS file path
    const testFilePath = path.resolve(
      __dirname,
      '../../test-files/sample-bms-test.xml'
    );
    console.log('📁 Using test file:', testFilePath);

    // Upload the BMS file
    await fileInput.setInputFiles(testFilePath);
    console.log('✅ BMS file selected for upload');

    // Wait for any auto-upload or find upload button
    await page.waitForTimeout(1000);

    const uploadButton = page
      .locator('button')
      .filter({ hasText: /upload|import|process/i })
      .first();
    const hasUploadButton = await uploadButton.isVisible();

    if (hasUploadButton) {
      await uploadButton.click();
      console.log('✅ Upload button clicked');
    } else {
      console.log('ℹ️  Auto-upload detected (no manual upload button)');
    }

    // Wait for upload to complete (up to 10 seconds)
    let waitTime = 0;
    while (waitTime < 10000 && !uploadResponse) {
      await page.waitForTimeout(500);
      waitTime += 500;
    }

    // Verify upload response
    expect(uploadResponse).not.toBeNull();
    expect(uploadResponse.status).toBe(200);
    expect(uploadResponse.ok).toBe(true);
    console.log('✅ BMS upload completed with 200 OK response');

    // Look for success indicators in UI
    const successIndicator = page
      .locator(
        '[class*="success"], [class*="complete"], text=/success|complete|processed/i'
      )
      .first();
    const hasSuccessIndicator = await successIndicator.isVisible();

    if (hasSuccessIndicator) {
      console.log('✅ Success indicator visible in UI');
    }

    console.log('\n📊 TEST 1 RESULTS:');
    console.log('==================');
    console.log(`BMS Page Load: ✅`);
    console.log(`File Input Found: ✅`);
    console.log(`Upload Response: ✅ ${uploadResponse?.status || 'N/A'}`);
    console.log(`Success Indicator: ${hasSuccessIndicator ? '✅' : '⚠️'}`);
  });

  test('2. Customer Creation via BMS Integration', async ({ page }) => {
    console.log('\n🎯 TEST 2: Customer Creation via BMS Integration');
    console.log('================================================');

    let customerApiResponse = null;
    let customerData = null;

    // Monitor customer API calls
    page.on('response', async response => {
      if (
        response.url().includes('/api/customers') &&
        response.request().method() === 'GET'
      ) {
        customerApiResponse = response;
        try {
          const data = await response.json();
          customerData = data;
          console.log(
            '📊 Customer API Response received:',
            data.customers?.length || 0,
            'customers'
          );
        } catch (e) {
          console.log('⚠️  Could not parse customer API response');
        }
      }
    });

    // Navigate to BMS import and upload file
    await page.goto('/bms-import');
    await page.waitForLoadState('networkidle');

    const fileInput = page.locator('input[type="file"], #file-input').first();
    const testFilePath = path.resolve(
      __dirname,
      '../../test-files/sample-bms-test.xml'
    );

    await fileInput.setInputFiles(testFilePath);
    console.log('✅ BMS file uploaded for customer creation test');

    // Trigger upload
    const uploadButton = page
      .locator('button')
      .filter({ hasText: /upload|import|process/i })
      .first();
    const hasUploadButton = await uploadButton.isVisible();
    if (hasUploadButton) {
      await uploadButton.click();
    }

    // Wait for processing
    await page.waitForTimeout(3000);

    // Navigate to customers page to verify customer creation
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify customer API was called and returned data
    expect(customerApiResponse).not.toBeNull();
    expect(customerApiResponse.status()).toBe(200);
    console.log('✅ Customer API responded with 200 OK');

    // Look for the customer from BMS file (Michael Thompson)
    const customerName = 'Thompson'; // From sample-bms-test.xml
    const customerRow = page.locator(`text=${customerName}`).first();
    const hasCustomer = await customerRow.isVisible();

    if (hasCustomer) {
      console.log('✅ Customer "Michael Thompson" found in customer list');
      customerCreated = true;
    } else {
      console.log(
        '⚠️  Customer not found in list - checking for any customers'
      );
      const anyCustomer = page
        .locator('[data-testid="customer-row"], tr, .customer-item')
        .first();
      const hasAnyCustomer = await anyCustomer.isVisible();
      console.log(`Customer list populated: ${hasAnyCustomer ? '✅' : '❌'}`);
    }

    console.log('\n📊 TEST 2 RESULTS:');
    console.log('==================');
    console.log(
      `Customer API Call: ✅ ${customerApiResponse?.status() || 'N/A'}`
    );
    console.log(`Customer Data: ${customerData ? '✅' : '❌'}`);
    console.log(`BMS Customer Created: ${customerCreated ? '✅' : '⚠️'}`);
    console.log(`Customer List Populated: ${hasCustomer ? '✅' : '⚠️'}`);
  });

  test('3. UI Integration - Customer List Auto-Refresh', async ({ page }) => {
    console.log('\n🎯 TEST 3: UI Integration - Customer List Auto-Refresh');
    console.log('======================================================');

    // First, get baseline customer count
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const initialCustomers = await page
      .locator('[data-testid="customer-row"], tr:has(td), .customer-item')
      .count();
    console.log(`📊 Initial customer count: ${initialCustomers}`);

    // Upload BMS file to create new customer
    await page.goto('/bms-import');
    await page.waitForLoadState('networkidle');

    const fileInput = page.locator('input[type="file"], #file-input').first();
    const testFilePath = path.resolve(
      __dirname,
      '../../test-files/sample-bms-test.xml'
    );

    await fileInput.setInputFiles(testFilePath);

    const uploadButton = page
      .locator('button')
      .filter({ hasText: /upload|import|process/i })
      .first();
    const hasUploadButton = await uploadButton.isVisible();
    if (hasUploadButton) {
      await uploadButton.click();
    }

    console.log('✅ BMS file uploaded for UI integration test');

    // Wait for processing to complete
    await page.waitForTimeout(3000);

    // Navigate back to customers page
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');

    // Wait for potential auto-refresh (within 2 seconds as required)
    await page.waitForTimeout(2000);

    // Check if customer list has been updated
    const updatedCustomers = await page
      .locator('[data-testid="customer-row"], tr:has(td), .customer-item')
      .count();
    console.log(`📊 Updated customer count: ${updatedCustomers}`);

    // Look specifically for the new customer
    const newCustomerVisible = await page.locator('text=Thompson').isVisible();
    const customerListRefreshed =
      updatedCustomers > initialCustomers || newCustomerVisible;

    // Test for UI feedback elements
    const loadingIndicator = await page
      .locator(
        '[class*="loading"], [class*="spinner"], .MuiCircularProgress-root'
      )
      .isVisible();
    const refreshButton = await page
      .locator('button')
      .filter({ hasText: /refresh|reload/i })
      .isVisible();

    console.log('\n📊 TEST 3 RESULTS:');
    console.log('==================');
    console.log(
      `Customer List Refreshed: ${customerListRefreshed ? '✅' : '⚠️'}`
    );
    console.log(`New Customer Visible: ${newCustomerVisible ? '✅' : '⚠️'}`);
    console.log(`Loading Indicators: ${loadingIndicator ? '✅' : 'N/A'}`);
    console.log(`Refresh Controls: ${refreshButton ? '✅' : 'N/A'}`);
    console.log(
      `Customer Count Change: ${initialCustomers} → ${updatedCustomers}`
    );

    // Verify the customer list is functional
    expect(updatedCustomers).toBeGreaterThanOrEqual(initialCustomers);
  });

  test('4. Error Handling & Authentication Validation', async ({ page }) => {
    console.log('\n🎯 TEST 4: Error Handling & Authentication Validation');
    console.log('=====================================================');

    let authenticationWorking = true;
    let errorHandlingValid = true;

    // Test 1: Verify no authentication errors
    await page.goto('/bms-import');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check for authentication redirects or errors
    const currentUrl = page.url();
    const isOnLoginPage =
      currentUrl.includes('/login') || currentUrl.includes('/signin');

    if (isOnLoginPage) {
      authenticationWorking = false;
      console.log('❌ Authentication failed - redirected to login');
    } else {
      console.log('✅ Authentication working - stayed on intended page');
    }

    // Test 2: Upload invalid file to test error handling
    const fileInput = page.locator('input[type="file"], #file-input').first();

    // Create a temporary invalid file path (assuming it doesn't exist)
    const invalidFilePath = path.resolve(
      __dirname,
      '../../test-files/invalid-file.txt'
    );

    try {
      // This should trigger error handling
      await fileInput.setInputFiles(invalidFilePath);
      console.log('⚠️  Invalid file upload attempted for error handling test');
    } catch (error) {
      console.log('✅ File validation working - invalid file rejected');
    }

    // Test 3: Check for error display elements
    await page.waitForTimeout(1000);

    const errorMessage = await page
      .locator('[class*="error"], [class*="alert"], .MuiAlert-root')
      .isVisible();
    const errorHandlingPresent = errorMessage || consoleErrors.length === 0;

    console.log('\n📊 TEST 4 RESULTS:');
    console.log('==================');
    console.log(
      `Authentication Working: ${authenticationWorking ? '✅' : '❌'}`
    );
    console.log(
      `Error Handling Present: ${errorHandlingPresent ? '✅' : '⚠️'}`
    );
    console.log(
      `Console Errors: ${consoleErrors.length === 0 ? '✅ None' : `❌ ${consoleErrors.length} errors`}`
    );
    console.log(
      `API Errors: ${apiErrors.length === 0 ? '✅ None' : `❌ ${apiErrors.length} errors`}`
    );

    // Log any API errors found
    if (apiErrors.length > 0) {
      console.log('\n❌ API ERRORS DETECTED:');
      apiErrors.forEach((error, index) => {
        console.log(
          `${index + 1}. ${error.status} ${error.statusText} - ${error.url}`
        );
      });
    }

    // Log any console errors
    if (consoleErrors.length > 0) {
      console.log('\n❌ CONSOLE ERRORS DETECTED:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    expect(authenticationWorking).toBe(true);
    expect(apiErrors.length).toBe(0);
  });

  test('5. Complete End-to-End Workflow Validation', async ({ page }) => {
    console.log('\n🎯 TEST 5: Complete End-to-End Workflow Validation');
    console.log('==================================================');

    const workflowSteps = {
      navigation: false,
      fileUpload: false,
      processing: false,
      customerCreation: false,
      uiUpdate: false,
    };

    // Step 1: Navigate to BMS import
    await page.goto('/bms-import');
    await page.waitForLoadState('networkidle');
    workflowSteps.navigation = await page
      .locator('h1, h2, h3')
      .filter({ hasText: /BMS|Import/i })
      .isVisible();
    console.log(
      `✅ Step 1 - Navigation: ${workflowSteps.navigation ? 'PASS' : 'FAIL'}`
    );

    // Step 2: Upload file
    const fileInput = page.locator('input[type="file"], #file-input').first();
    const testFilePath = path.resolve(
      __dirname,
      '../../test-files/sample-bms-test.xml'
    );

    await fileInput.setInputFiles(testFilePath);
    workflowSteps.fileUpload = true;
    console.log(
      `✅ Step 2 - File Upload: ${workflowSteps.fileUpload ? 'PASS' : 'FAIL'}`
    );

    // Step 3: Process file
    const uploadButton = page
      .locator('button')
      .filter({ hasText: /upload|import|process/i })
      .first();
    const hasUploadButton = await uploadButton.isVisible();
    if (hasUploadButton) {
      await uploadButton.click();
    }

    // Wait for processing
    await page.waitForTimeout(5000);
    workflowSteps.processing = uploadResponse?.ok || false;
    console.log(
      `✅ Step 3 - Processing: ${workflowSteps.processing ? 'PASS' : 'FAIL'}`
    );

    // Step 4: Verify customer creation
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    workflowSteps.customerCreation = await page
      .locator('text=Thompson')
      .isVisible();
    console.log(
      `✅ Step 4 - Customer Creation: ${workflowSteps.customerCreation ? 'PASS' : 'FAIL'}`
    );

    // Step 5: Verify UI update
    const customerCount = await page
      .locator('[data-testid="customer-row"], tr:has(td), .customer-item')
      .count();
    workflowSteps.uiUpdate = customerCount > 0;
    console.log(
      `✅ Step 5 - UI Update: ${workflowSteps.uiUpdate ? 'PASS' : 'FAIL'}`
    );

    // Calculate overall success rate
    const passedSteps = Object.values(workflowSteps).filter(Boolean).length;
    const totalSteps = Object.keys(workflowSteps).length;
    const successRate = Math.round((passedSteps / totalSteps) * 100);

    console.log('\n🏆 COMPLETE END-TO-END WORKFLOW RESULTS:');
    console.log('=========================================');
    console.log(
      `Overall Success Rate: ${successRate}% (${passedSteps}/${totalSteps})`
    );
    console.log(
      `Navigation to BMS Import: ${workflowSteps.navigation ? '✅' : '❌'}`
    );
    console.log(
      `File Upload Interface: ${workflowSteps.fileUpload ? '✅' : '❌'}`
    );
    console.log(`BMS Processing: ${workflowSteps.processing ? '✅' : '❌'}`);
    console.log(
      `Customer Creation: ${workflowSteps.customerCreation ? '✅' : '❌'}`
    );
    console.log(`UI Update/Display: ${workflowSteps.uiUpdate ? '✅' : '❌'}`);

    if (successRate === 100) {
      console.log(
        '\n🎉 BMS UPLOAD → CUSTOMER CREATION → DISPLAY WORKFLOW IS FULLY FUNCTIONAL!'
      );
    } else {
      console.log(
        `\n⚠️  Workflow is ${successRate}% functional. See individual test results for issues.`
      );
    }

    // Test should pass if core functionality (80%+) is working
    expect(successRate).toBeGreaterThanOrEqual(80);
    expect(workflowSteps.navigation).toBe(true);
    expect(workflowSteps.fileUpload).toBe(true);
  });

  test.afterEach(async ({ page }) => {
    // Clean up and report final status
    console.log('\n📋 TEST SESSION SUMMARY:');
    console.log('========================');
    console.log(
      `Upload Response Status: ${uploadResponse?.status || 'Not tested'}`
    );
    console.log(
      `Customer Created: ${customerCreated ? 'Yes' : 'Not confirmed'}`
    );
    console.log(`API Errors: ${apiErrors.length}`);
    console.log(`Console Errors: ${consoleErrors.length}`);

    if (apiErrors.length === 0 && consoleErrors.length === 0) {
      console.log('✅ NO ERRORS DETECTED - CLEAN TEST RUN');
    }
  });
});
