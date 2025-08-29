import { test, expect } from '@playwright/test';

test('Network Debug - Customer API', async ({ page }) => {
  // Capture console logs and network errors
  const logs = [];
  const networkErrors = [];
  
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });
  
  page.on('requestfailed', request => {
    networkErrors.push({
      url: request.url(),
      errorText: request.failure().errorText,
      method: request.method()
    });
  });
  
  page.on('response', async response => {
    if (response.url().includes('/api/customers')) {
      try {
        const responseBody = await response.text();
        console.log(`\n=== API RESPONSE ===`);
        console.log(`URL: ${response.url()}`);
        console.log(`Status: ${response.status()}`);
        console.log(`Body: ${responseBody.substring(0, 500)}${responseBody.length > 500 ? '...' : ''}`);
      } catch (error) {
        console.log('Error reading response body:', error.message);
      }
    }
  });
  
  // Login and navigate
  await page.goto('/login');
  await page.fill('input[placeholder="admin"]', 'admin');
  await page.fill('input[placeholder="admin123"]', 'admin123');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL(/.*\/dashboard/);
  
  console.log('\n=== NAVIGATING TO CUSTOMERS ===');
  
  await page.click('text=Customers');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);
  
  // Log any console errors
  console.log('\n=== CONSOLE LOGS ===');
  logs.forEach(log => console.log(log));
  
  // Log network failures
  console.log('\n=== NETWORK ERRORS ===');
  networkErrors.forEach(error => {
    console.log(`Failed request: ${error.method} ${error.url} - ${error.errorText}`);
  });
});