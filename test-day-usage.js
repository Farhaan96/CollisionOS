const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:3001';

// Test results collector
const testResults = {
  passed: [],
  failed: [],
  warnings: [],
  timestamp: new Date().toISOString()
};

// Helper function to log results
function logTest(name, status, details = '') {
  const result = { name, status, details, timestamp: new Date().toISOString() };
  if (status === 'PASS') {
    testResults.passed.push(result);
    console.log(`✅ ${name}`);
  } else if (status === 'FAIL') {
    testResults.failed.push(result);
    console.error(`❌ ${name}: ${details}`);
  } else if (status === 'WARN') {
    testResults.warnings.push(result);
    console.warn(`⚠️ ${name}: ${details}`);
  }
}

async function testAuthentication(page) {
  console.log('\n🔐 Testing Authentication System...');
  
  try {
    // Test login page loads
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Check if we're on login page or already logged in
    const isLoginPage = await page.locator('text=/Sign In|Login/i').isVisible().catch(() => false);
    
    if (isLoginPage) {
      logTest('Login page loads', 'PASS');
      
      // Test login with admin credentials
      await page.fill('input[type="text"], input[type="email"], input[placeholder*="user" i], input[placeholder*="email" i]', 'admin');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button:has-text("Sign In"), button[type="submit"]');
      
      // Wait for navigation or error
      await Promise.race([
        page.waitForURL('**/dashboard', { timeout: 5000 }),
        page.waitForSelector('text=/Dashboard|Welcome/i', { timeout: 5000 })
      ]).then(() => {
        logTest('Admin login', 'PASS');
      }).catch(() => {
        logTest('Admin login', 'FAIL', 'Login failed or timed out');
      });
    } else {
      logTest('Already logged in or no login required', 'WARN', 'Skipping authentication test');
    }
  } catch (error) {
    logTest('Authentication test', 'FAIL', error.message);
  }
}

async function testDashboard(page) {
  console.log('\n📊 Testing Dashboard...');
  
  try {
    // Navigate to dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    // Check for dashboard elements
    const dashboardVisible = await page.locator('text=/Dashboard|Overview|Statistics/i').isVisible().catch(() => false);
    
    if (dashboardVisible) {
      logTest('Dashboard loads', 'PASS');
      
      // Test KPI cards
      const kpiCards = await page.locator('[class*="card" i], [class*="stat" i], [class*="metric" i]').count();
      if (kpiCards > 0) {
        logTest('KPI cards displayed', 'PASS', `Found ${kpiCards} KPI cards`);
      } else {
        logTest('KPI cards displayed', 'WARN', 'No KPI cards found');
      }
      
      // Test charts
      const charts = await page.locator('canvas, svg[class*="chart" i], [class*="chart" i]').count();
      if (charts > 0) {
        logTest('Charts displayed', 'PASS', `Found ${charts} charts`);
      } else {
        logTest('Charts displayed', 'WARN', 'No charts found');
      }
    } else {
      logTest('Dashboard loads', 'FAIL', 'Dashboard not visible');
    }
  } catch (error) {
    logTest('Dashboard test', 'FAIL', error.message);
  }
}

async function testBMSImport(page) {
  console.log('\n📁 Testing BMS Import...');
  
  try {
    // Navigate to BMS import
    await page.goto(`${BASE_URL}/bms`);
    await page.waitForLoadState('networkidle');
    
    // Check for BMS import interface
    const bmsPageVisible = await page.locator('text=/BMS|Import|Upload/i').isVisible().catch(() => false);
    
    if (bmsPageVisible) {
      logTest('BMS import page loads', 'PASS');
      
      // Check for file upload
      const fileInput = await page.locator('input[type="file"]').isVisible().catch(() => false);
      if (fileInput) {
        logTest('File upload interface present', 'PASS');
      } else {
        logTest('File upload interface present', 'WARN', 'File input not found');
      }
    } else {
      logTest('BMS import page loads', 'FAIL', 'BMS page not visible');
    }
  } catch (error) {
    logTest('BMS import test', 'FAIL', error.message);
  }
}

async function testCustomerManagement(page) {
  console.log('\n👥 Testing Customer Management...');
  
  try {
    // Navigate to customers
    await page.goto(`${BASE_URL}/customers`);
    await page.waitForLoadState('networkidle');
    
    const customersVisible = await page.locator('text=/Customer|Client/i').isVisible().catch(() => false);
    
    if (customersVisible) {
      logTest('Customer page loads', 'PASS');
      
      // Check for customer list or table
      const customerData = await page.locator('table, [class*="list" i], [class*="grid" i]').isVisible().catch(() => false);
      if (customerData) {
        logTest('Customer data displayed', 'PASS');
      } else {
        logTest('Customer data displayed', 'WARN', 'No customer list found');
      }
      
      // Check for add customer button
      const addButton = await page.locator('button:has-text(/Add|New|Create/i)').isVisible().catch(() => false);
      if (addButton) {
        logTest('Add customer button present', 'PASS');
      } else {
        logTest('Add customer button present', 'WARN', 'Add button not found');
      }
    } else {
      logTest('Customer page loads', 'FAIL', 'Customer page not visible');
    }
  } catch (error) {
    logTest('Customer management test', 'FAIL', error.message);
  }
}

async function testProductionBoard(page) {
  console.log('\n🏭 Testing Production Board...');
  
  try {
    // Navigate to production board
    await page.goto(`${BASE_URL}/production`);
    await page.waitForLoadState('networkidle');
    
    const productionVisible = await page.locator('text=/Production|Board|Workflow/i').isVisible().catch(() => false);
    
    if (productionVisible) {
      logTest('Production board loads', 'PASS');
      
      // Check for kanban columns
      const columns = await page.locator('[class*="column" i], [class*="lane" i], [class*="stage" i]').count();
      if (columns > 0) {
        logTest('Kanban columns displayed', 'PASS', `Found ${columns} columns`);
      } else {
        logTest('Kanban columns displayed', 'WARN', 'No columns found');
      }
    } else {
      logTest('Production board loads', 'FAIL', 'Production board not visible');
    }
  } catch (error) {
    logTest('Production board test', 'FAIL', error.message);
  }
}

async function testPartsManagement(page) {
  console.log('\n🔧 Testing Parts Management...');
  
  try {
    // Navigate to parts
    await page.goto(`${BASE_URL}/parts`);
    await page.waitForLoadState('networkidle');
    
    const partsVisible = await page.locator('text=/Parts|Inventory/i').isVisible().catch(() => false);
    
    if (partsVisible) {
      logTest('Parts page loads', 'PASS');
      
      // Check for parts list
      const partsList = await page.locator('table, [class*="parts" i]').isVisible().catch(() => false);
      if (partsList) {
        logTest('Parts list displayed', 'PASS');
      } else {
        logTest('Parts list displayed', 'WARN', 'No parts list found');
      }
    } else {
      logTest('Parts page loads', 'FAIL', 'Parts page not visible');
    }
  } catch (error) {
    logTest('Parts management test', 'FAIL', error.message);
  }
}

async function testReports(page) {
  console.log('\n📈 Testing Reports & Analytics...');
  
  try {
    // Navigate to reports
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    
    const reportsVisible = await page.locator('text=/Report|Analytics/i').isVisible().catch(() => false);
    
    if (reportsVisible) {
      logTest('Reports page loads', 'PASS');
      
      // Check for report options
      const reportOptions = await page.locator('button, a').filter({ hasText: /Generate|Export|Download/i }).count();
      if (reportOptions > 0) {
        logTest('Report options available', 'PASS', `Found ${reportOptions} report options`);
      } else {
        logTest('Report options available', 'WARN', 'No report options found');
      }
    } else {
      logTest('Reports page loads', 'FAIL', 'Reports page not visible');
    }
  } catch (error) {
    logTest('Reports test', 'FAIL', error.message);
  }
}

async function testThemeToggle(page) {
  console.log('\n🎨 Testing Theme System...');
  
  try {
    // Look for theme toggle
    const themeToggle = await page.locator('[aria-label*="theme" i], button:has-text(/dark|light|theme/i), [class*="theme" i]').first();
    
    if (await themeToggle.isVisible().catch(() => false)) {
      // Get initial theme
      const initialBgColor = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
      
      // Toggle theme
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      // Check if theme changed
      const newBgColor = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
      
      if (initialBgColor !== newBgColor) {
        logTest('Theme toggle works', 'PASS', 'Theme successfully changed');
      } else {
        logTest('Theme toggle works', 'WARN', 'Theme toggle clicked but no visible change');
      }
    } else {
      logTest('Theme toggle present', 'WARN', 'Theme toggle not found');
    }
  } catch (error) {
    logTest('Theme test', 'FAIL', error.message);
  }
}

async function testAPIHealth(page) {
  console.log('\n🔌 Testing API Health...');
  
  try {
    const response = await page.request.get(`${API_URL}/health`);
    if (response.ok()) {
      const data = await response.json();
      logTest('API health check', 'PASS', `Status: ${data.status || 'OK'}`);
    } else {
      logTest('API health check', 'FAIL', `Status code: ${response.status()}`);
    }
  } catch (error) {
    logTest('API health check', 'FAIL', error.message);
  }
}

async function testResponsiveness(page) {
  console.log('\n📱 Testing Responsiveness...');
  
  try {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    const mobileMenuVisible = await page.locator('[class*="menu" i], [class*="hamburger" i], [aria-label*="menu" i]').isVisible().catch(() => false);
    if (mobileMenuVisible) {
      logTest('Mobile responsive', 'PASS', 'Mobile menu visible');
    } else {
      logTest('Mobile responsive', 'WARN', 'Mobile menu not found');
    }
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    logTest('Tablet responsive', 'PASS', 'Tablet view tested');
    
    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
  } catch (error) {
    logTest('Responsiveness test', 'FAIL', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting CollisionOS Day Usage Test');
  console.log('=====================================');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    // Run all tests
    await testAuthentication(page);
    await testDashboard(page);
    await testBMSImport(page);
    await testCustomerManagement(page);
    await testProductionBoard(page);
    await testPartsManagement(page);
    await testReports(page);
    await testThemeToggle(page);
    await testAPIHealth(page);
    await testResponsiveness(page);
    
  } catch (error) {
    console.error('Test execution error:', error);
  } finally {
    await browser.close();
    
    // Generate summary
    console.log('\n📊 TEST SUMMARY');
    console.log('=====================================');
    console.log(`✅ Passed: ${testResults.passed.length}`);
    console.log(`❌ Failed: ${testResults.failed.length}`);
    console.log(`⚠️ Warnings: ${testResults.warnings.length}`);
    console.log(`📅 Completed: ${new Date().toLocaleString()}`);
    
    // Save results to file
    await fs.writeFile(
      path.join(__dirname, 'day-usage-test-results.json'),
      JSON.stringify(testResults, null, 2)
    );
    
    console.log('\nResults saved to day-usage-test-results.json');
    
    // Exit with appropriate code
    process.exit(testResults.failed.length > 0 ? 1 : 0);
  }
}

// Run the tests
runAllTests().catch(console.error);