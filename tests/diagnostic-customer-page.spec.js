import { test, expect } from '@playwright/test';

test('Diagnostic - Customer Page Content', async ({ page }) => {
  // Monitor network requests
  const requests = [];
  const responses = [];
  
  page.on('request', request => {
    if (request.url().includes('customers')) {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('customers')) {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });
  
  // Login first
  await page.goto('/login');
  await page.fill('input[placeholder="admin"]', 'admin');
  await page.fill('input[placeholder="admin123"]', 'admin123');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL(/.*\/dashboard/);
  
  // Navigate to customers
  await page.waitForSelector('text=Customers', { timeout: 10000 });
  await page.click('text=Customers');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000); // Give time for data to load
  
  // Take screenshot
  await page.screenshot({ path: 'diagnostic-customer-page.png' });
  
  // Get page content
  const bodyText = await page.textContent('body');
  console.log('FULL PAGE TEXT:', bodyText);
  
  // Check for specific customer data patterns
  const hasJohnDoe = bodyText.includes('John Doe');
  const hasTestCustomer = bodyText.includes('Test Customer');
  const hasCarolDavis = bodyText.includes('Carol Davis');
  
  console.log('Customer search results:');
  console.log('- John Doe found:', hasJohnDoe);
  console.log('- Test Customer found:', hasTestCustomer);
  console.log('- Carol Davis found:', hasCarolDavis);
  
  // Check table rows
  const tableRows = await page.locator('table tbody tr').count();
  console.log('Table rows found:', tableRows);
  
  // List all table cell content
  for (let i = 0; i < Math.min(tableRows, 10); i++) {
    const rowText = await page.locator(`table tbody tr:nth-child(${i + 1})`).textContent();
    console.log(`Row ${i + 1}:`, rowText);
  }
  
  // Log network activity
  console.log('\n=== NETWORK REQUESTS ===');
  requests.forEach((req, i) => {
    console.log(`Request ${i + 1}:`, req.method, req.url);
    console.log('  Authorization header:', req.headers.authorization || 'MISSING');
  });
  
  console.log('\n=== NETWORK RESPONSES ===');
  responses.forEach((res, i) => {
    console.log(`Response ${i + 1}:`, res.status, res.statusText, res.url);
  });
});