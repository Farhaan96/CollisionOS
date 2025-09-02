const { test, expect } = require('@playwright/test');

test('Debug login form selectors', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  console.log('=== PAGE CONTENT DEBUG ===');
  
  // Check if we're on the login page or redirected
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);
  
  // Get page title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Look for any input fields
  const inputs = await page.$$('input');
  console.log('Found inputs:', inputs.length);
  
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const type = await input.getAttribute('type');
    const placeholder = await input.getAttribute('placeholder');
    const id = await input.getAttribute('id');
    const name = await input.getAttribute('name');
    const ariaLabel = await input.getAttribute('aria-label');
    
    console.log(`Input ${i + 1}:`, {
      type,
      placeholder,
      id,
      name,
      ariaLabel
    });
  }
  
  // Look for TextFields (Material-UI)
  const textFields = await page.$$('[data-testid*="text"], .MuiTextField-root, .MuiInputBase-input');
  console.log('Found textfield elements:', textFields.length);
  
  // Look for labels
  const labels = await page.$$('label');
  console.log('Found labels:', labels.length);
  
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    const textContent = await label.textContent();
    const forAttr = await label.getAttribute('for');
    
    console.log(`Label ${i + 1}:`, {
      text: textContent,
      for: forAttr
    });
  }
  
  // Check if login form is visible
  const loginForm = await page.$('form');
  if (loginForm) {
    console.log('Login form found');
  } else {
    console.log('No form found');
  }
  
  // Try to find username field by label
  try {
    const usernameField = await page.getByLabel('Username');
    console.log('Found username field by label');
  } catch (e) {
    console.log('Username field by label not found');
  }
  
  // Take screenshot for visual debugging
  await page.screenshot({ path: 'debug-login-form.png' });
  console.log('Screenshot saved as debug-login-form.png');
});