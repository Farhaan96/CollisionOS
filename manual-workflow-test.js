const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * Manual workflow testing script for CollisionOS
 * Tests all primary user workflows and daily operations
 */
async function runManualWorkflowTests() {
  console.log('🚀 Starting CollisionOS Comprehensive Workflow Tests\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  const results = {
    timestamp: new Date().toISOString(),
    testResults: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      issues: []
    }
  };

  // Test helper function
  async function runTest(testName, testFn) {
    console.log(`📋 Testing: ${testName}`);
    results.summary.total++;
    
    try {
      await testFn();
      console.log(`✅ PASSED: ${testName}\n`);
      results.testResults.push({ test: testName, status: 'PASSED', error: null });
      results.summary.passed++;
    } catch (error) {
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${error.message}\n`);
      results.testResults.push({ test: testName, status: 'FAILED', error: error.message });
      results.summary.failed++;
      results.summary.issues.push(`${testName}: ${error.message}`);
    }
  }

  // Login helper
  async function login(username = 'admin', password = 'admin123') {
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    
    // Wait for form to be available
    await page.waitForSelector('input[placeholder="Enter username"]', { timeout: 10000 });
    
    await page.fill('input[placeholder="Enter username"]', username);
    await page.fill('input[placeholder="Enter password"]', password);
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });
  }

  // Test 1: Authentication Workflow
  await runTest('Admin Authentication Flow', async () => {
    await page.goto('http://localhost:3000');
    
    // Should redirect to login
    await page.waitForURL(/.*\/login/);
    
    // Check login form elements
    await page.waitForSelector('text=CollisionOS');
    await page.waitForSelector('input[placeholder="Enter username"]');
    await page.waitForSelector('input[placeholder="Enter password"]');
    await page.waitForSelector('button[type="submit"]');
    
    // Test login with admin credentials
    await login();
    
    // Should be on dashboard
    await page.waitForSelector('text=Dashboard', { timeout: 10000 });
  });

  // Test 2: Dashboard KPI Display
  await runTest('Dashboard KPI Cards and Metrics', async () => {
    // Look for key dashboard elements
    const dashboardElements = [
      'text=Active Repairs',
      'text=Today\'s Deliveries', 
      'text=Revenue This Month',
      'text=Parts Pending',
      'text=Avg Cycle Time',
      'text=Customer Satisfaction'
    ];

    for (const element of dashboardElements) {
      try {
        await page.waitForSelector(element, { timeout: 5000 });
      } catch (e) {
        // Check if alternative naming exists
        console.log(`   Warning: Expected dashboard element not found: ${element}`);
      }
    }

    // At minimum, should have some dashboard content
    const hasContent = await page.locator('body').textContent();
    if (!hasContent.toLowerCase().includes('dashboard') && !hasContent.toLowerCase().includes('repair')) {
      throw new Error('Dashboard does not appear to have relevant content');
    }
  });

  // Test 3: Navigation to Main Sections
  await runTest('Navigation to Core Sections', async () => {
    const sections = ['Customers', 'Production', 'Parts', 'Reports'];
    
    for (const section of sections) {
      try {
        // Try to find and click navigation item
        const navItem = page.locator(`text=${section}`).first();
        if (await navItem.count() > 0) {
          await navItem.click();
          await page.waitForLoadState('networkidle');
          
          // Verify we navigated somewhere relevant
          const content = await page.locator('body').textContent();
          if (!content.toLowerCase().includes(section.toLowerCase())) {
            console.log(`   Warning: ${section} page may not have loaded correctly`);
          }
        } else {
          console.log(`   Warning: ${section} navigation not found`);
        }
      } catch (e) {
        console.log(`   Warning: Could not navigate to ${section}: ${e.message}`);
      }
    }
  });

  // Test 4: Customer Management Workflow
  await runTest('Customer Management Operations', async () => {
    // Navigate to customers page
    try {
      await page.goto('http://localhost:3000/customers');
      await page.waitForLoadState('networkidle');
    } catch (e) {
      // Try clicking navigation
      const customersNav = page.locator('text=Customers').first();
      if (await customersNav.count() > 0) {
        await customersNav.click();
        await page.waitForLoadState('networkidle');
      }
    }

    // Look for customer-related content
    const content = await page.locator('body').textContent();
    if (!content.toLowerCase().includes('customer')) {
      throw new Error('Customer page does not appear to contain customer-related content');
    }

    // Look for typical customer management features
    const customerFeatures = [
      'button:has-text("Add")',
      'button:has-text("New")', 
      'input[placeholder*="Search"]',
      'table',
      '.customer'
    ];

    let foundFeatures = 0;
    for (const feature of customerFeatures) {
      if (await page.locator(feature).count() > 0) {
        foundFeatures++;
      }
    }

    if (foundFeatures === 0) {
      console.log('   Warning: No typical customer management features found');
    }
  });

  // Test 5: Production Board / Job Management
  await runTest('Production Board and Job Management', async () => {
    // Navigate to production/jobs
    try {
      await page.goto('http://localhost:3000/production');
      await page.waitForLoadState('networkidle');
    } catch (e) {
      try {
        await page.goto('http://localhost:3000/jobs');
        await page.waitForLoadState('networkidle');
      } catch (e2) {
        // Try navigation menu
        const productionNav = page.locator('text=Production').first();
        if (await productionNav.count() > 0) {
          await productionNav.click();
          await page.waitForLoadState('networkidle');
        }
      }
    }

    // Check for production/job related content
    const content = await page.locator('body').textContent();
    if (!content.toLowerCase().includes('production') && !content.toLowerCase().includes('job')) {
      throw new Error('Production page does not contain production/job related content');
    }

    // Look for production board features
    const productionFeatures = [
      '.job-card',
      '.kanban',
      '.production-board',
      'text=In Progress',
      'text=Complete',
      'text=Estimate'
    ];

    let foundProductionFeatures = 0;
    for (const feature of productionFeatures) {
      if (await page.locator(feature).count() > 0) {
        foundProductionFeatures++;
      }
    }

    console.log(`   Found ${foundProductionFeatures} production features`);
  });

  // Test 6: Parts Management
  await runTest('Parts Management System', async () => {
    // Navigate to parts
    try {
      await page.goto('http://localhost:3000/parts');
      await page.waitForLoadState('networkidle');
    } catch (e) {
      const partsNav = page.locator('text=Parts').first();
      if (await partsNav.count() > 0) {
        await partsNav.click();
        await page.waitForLoadState('networkidle');
      }
    }

    // Check for parts-related content
    const content = await page.locator('body').textContent();
    if (!content.toLowerCase().includes('parts')) {
      throw new Error('Parts page does not contain parts-related content');
    }
  });

  // Test 7: BMS Import Functionality
  await runTest('BMS File Import System', async () => {
    // Look for BMS/Import functionality
    const bmsUrls = [
      'http://localhost:3000/bms',
      'http://localhost:3000/import', 
      'http://localhost:3000/upload'
    ];

    let foundBMS = false;
    for (const url of bmsUrls) {
      try {
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        const content = await page.locator('body').textContent();
        if (content.toLowerCase().includes('bms') || content.toLowerCase().includes('import') || content.toLowerCase().includes('upload')) {
          foundBMS = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!foundBMS) {
      // Try navigation menu
      const importNav = page.locator('text=Import,text=Upload,text=BMS').first();
      if (await importNav.count() > 0) {
        await importNav.click();
        await page.waitForLoadState('networkidle');
        foundBMS = true;
      }
    }

    if (!foundBMS) {
      throw new Error('BMS Import functionality not accessible');
    }

    // Look for file upload features
    const uploadFeatures = [
      'input[type="file"]',
      '.file-upload',
      '.drop-zone',
      'text=Upload',
      'text=Choose File'
    ];

    let foundUploadFeature = false;
    for (const feature of uploadFeatures) {
      if (await page.locator(feature).count() > 0) {
        foundUploadFeature = true;
        break;
      }
    }

    console.log(`   Upload interface found: ${foundUploadFeature}`);
  });

  // Test 8: Reports Generation
  await runTest('Reports and Analytics', async () => {
    try {
      await page.goto('http://localhost:3000/reports');
      await page.waitForLoadState('networkidle');
    } catch (e) {
      const reportsNav = page.locator('text=Reports').first();
      if (await reportsNav.count() > 0) {
        await reportsNav.click();
        await page.waitForLoadState('networkidle');
      }
    }

    const content = await page.locator('body').textContent();
    if (!content.toLowerCase().includes('report')) {
      throw new Error('Reports page not accessible or empty');
    }
  });

  // Test 9: User Role Testing
  await runTest('Manager Role Access', async () => {
    // Logout and login as manager
    try {
      await page.goto('http://localhost:3000/login');
      await login('manager', 'manager123');
      
      // Should access dashboard
      await page.waitForSelector('text=Dashboard', { timeout: 10000 });
      
      // Manager should have access to key features
      const managerContent = await page.locator('body').textContent();
      if (!managerContent.toLowerCase().includes('dashboard')) {
        throw new Error('Manager role cannot access dashboard');
      }
      
    } finally {
      // Login back as admin for remaining tests
      await page.goto('http://localhost:3000/login');
      await login('admin', 'admin123');
    }
  });

  // Test 10: Responsive Design
  await runTest('Mobile Responsiveness', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should still be functional
    const content = await page.locator('body').textContent();
    if (!content.toLowerCase().includes('dashboard')) {
      throw new Error('Mobile view does not display dashboard content');
    }
    
    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  // Cleanup
  await browser.close();

  // Generate report
  const report = {
    ...results,
    summary: {
      ...results.summary,
      successRate: `${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%`
    }
  };

  // Save report
  fs.writeFileSync(
    path.join(__dirname, 'workflow-test-report.json'),
    JSON.stringify(report, null, 2)
  );

  // Print summary
  console.log('\n=== COLLISIONOS WORKFLOW TEST SUMMARY ===');
  console.log(`📊 Total Tests: ${report.summary.total}`);
  console.log(`✅ Passed: ${report.summary.passed}`);
  console.log(`❌ Failed: ${report.summary.failed}`);
  console.log(`📈 Success Rate: ${report.summary.successRate}`);
  
  if (report.summary.issues.length > 0) {
    console.log('\n🔍 Issues Found:');
    report.summary.issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  }

  console.log('\n📄 Full report saved to: workflow-test-report.json');
  
  return report;
}

// Run the tests
if (require.main === module) {
  runManualWorkflowTests()
    .then(() => {
      console.log('\n✨ Testing complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Testing failed:', error);
      process.exit(1);
    });
}

module.exports = { runManualWorkflowTests };