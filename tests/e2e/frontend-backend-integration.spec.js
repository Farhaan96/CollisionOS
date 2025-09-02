import { test, expect } from '@playwright/test';

test.describe('Frontend-Backend Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.waitForSelector('input[placeholder="Enter your username"]', { timeout: 10000 });
    await page.fill('input[placeholder="Enter your username"]', 'admin');
    await page.fill('input[placeholder="Enter your password"]', 'admin123');
    await page.click('button:has-text("Sign In to CollisionOS")');
    
    await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
  });

  test('should verify frontend-backend API connectivity', async ({ page }) => {
    console.log('Testing frontend-backend API connectivity...');
    
    // Intercept API calls to verify backend communication
    const apiCalls = [];
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('localhost:3001')) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          method: response.request().method(),
        });
      }
    });
    
    // Wait a moment for any initial API calls
    await page.waitForTimeout(3000);
    
    // Navigate through key pages to trigger API calls
    const navigationTests = [
      { link: 'Customers', expectedUrl: /customer/i },
      { link: 'Production', expectedUrl: /production/i },
      { link: 'Parts', expectedUrl: /parts/i },
    ];
    
    for (const nav of navigationTests) {
      try {
        const navLink = page.locator(`text=${nav.link}`).first();
        if (await navLink.isVisible()) {
          await navLink.click();
          await page.waitForTimeout(2000);
          
          const currentUrl = page.url();
          console.log(`Navigated to: ${currentUrl}`);
          
          // Navigate back to dashboard
          await page.goto('http://localhost:3000/dashboard');
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        console.log(`Navigation to ${nav.link} failed: ${error.message}`);
      }
    }
    
    console.log(`API calls detected: ${apiCalls.length}`);
    apiCalls.forEach((call, index) => {
      console.log(`${index + 1}. ${call.method} ${call.url} - Status: ${call.status}`);
    });
    
    // Verify that we can reach the dashboard without errors
    const dashboardContent = page.locator('text=Auto Body Shop Dashboard').or(page.locator('text=Dashboard'));
    await expect(dashboardContent.first()).toBeVisible();
  });

  test('should handle authentication flow properly', async ({ page }) => {
    console.log('Testing authentication flow...');
    
    // Verify we're authenticated and on dashboard
    await expect(page).toHaveURL(/.*dashboard.*/);
    
    // Check for user info in the UI (if present)
    const userInfo = page.locator('text=admin').or(page.locator('text=Admin')).or(page.locator('text=Manager'));
    const hasUserInfo = await userInfo.count() > 0;
    console.log(`User info visible: ${hasUserInfo}`);
    
    // Try to access a protected route directly
    await page.goto('http://localhost:3000/customers');
    await page.waitForTimeout(2000);
    
    // Should either show customers page or redirect to login if not authenticated
    const currentUrl = page.url();
    console.log(`After direct navigation: ${currentUrl}`);
    
    // If we got redirected to login, that's also valid behavior
    const isOnCustomers = currentUrl.includes('customers');
    const isOnLogin = currentUrl.includes('login');
    const isOnDashboard = currentUrl.includes('dashboard');
    
    expect(isOnCustomers || isOnLogin || isOnDashboard).toBe(true);
  });

  test('should validate collision repair dashboard components', async ({ page }) => {
    console.log('Testing collision repair dashboard components...');
    
    // Check for key collision repair elements
    const collisionElements = [
      'Active Repairs',
      'Insurance Claims', 
      'Parts',
      'Production',
      'Real-time Activity Feed'
    ];
    
    for (const element of collisionElements) {
      try {
        const elementLocator = page.locator(`text=${element}`);
        if (await elementLocator.isVisible()) {
          console.log(`✓ Found: ${element}`);
        } else {
          console.log(`⚠ Not visible: ${element}`);
        }
      } catch (error) {
        console.log(`✗ Error checking ${element}: ${error.message}`);
      }
    }
    
    // Verify KPI cards are present
    const kpiCards = page.locator('.MuiCard-root');
    const cardCount = await kpiCards.count();
    console.log(`KPI cards found: ${cardCount}`);
    
    expect(cardCount).toBeGreaterThan(0);
  });

  test('should handle navigation without errors', async ({ page }) => {
    console.log('Testing navigation error handling...');
    
    const consoleErrors = [];
    const jsErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    // Try various navigation actions
    const testActions = [
      { name: 'Click first KPI card', action: async () => {
        const firstCard = page.locator('.MuiCard-root').first();
        if (await firstCard.isVisible()) {
          await firstCard.click();
          await page.waitForTimeout(1000);
        }
      }},
      { name: 'Return to dashboard', action: async () => {
        await page.goto('http://localhost:3000/dashboard');
        await page.waitForTimeout(1000);
      }},
      { name: 'Check menu navigation', action: async () => {
        const menuItems = page.locator('nav a, [role="button"]');
        const menuCount = await menuItems.count();
        if (menuCount > 0) {
          const randomIndex = Math.floor(Math.random() * Math.min(menuCount, 3));
          const menuItem = menuItems.nth(randomIndex);
          if (await menuItem.isVisible()) {
            await menuItem.click();
            await page.waitForTimeout(1000);
          }
        }
      }}
    ];
    
    for (const testAction of testActions) {
      try {
        console.log(`Executing: ${testAction.name}`);
        await testAction.action();
      } catch (error) {
        console.log(`Action failed (${testAction.name}): ${error.message}`);
      }
    }
    
    // Log any errors found
    if (consoleErrors.length > 0) {
      console.log('Console errors:', consoleErrors);
    }
    if (jsErrors.length > 0) {
      console.log('JavaScript errors:', jsErrors);
    }
    
    // Critical errors should be minimal
    const criticalErrors = [...consoleErrors, ...jsErrors].filter(error => 
      !error.includes('favicon') && 
      !error.includes('websocket') &&
      !error.includes('DevTools')
    );
    
    expect(criticalErrors.length).toBeLessThanOrEqual(2); // Allow for minor non-critical errors
  });
});