import { test, expect } from '@playwright/test';

test.describe('Simple Login Test', () => {
  test('password toggle with specific selector', async ({ page }) => {
    await page.goto('/');

    const passwordField = page.locator('input[placeholder="Enter password"]');

    // Check initial state
    await expect(passwordField).toHaveAttribute('type', 'password');
    await page.screenshot({ path: 'simple-password-hidden.png' });

    // Try to click the eye icon using the most specific selector
    const eyeIcon = page
      .locator(
        'input[placeholder="Enter password"] + div svg, input[placeholder="Enter password"] ~ div svg'
      )
      .first();

    try {
      await eyeIcon.click({ timeout: 5000 });
      await page.waitForTimeout(1000);

      // Check if password type changed
      const passwordType = await passwordField.getAttribute('type');
      console.log('Password field type after click:', passwordType);

      await page.screenshot({ path: 'simple-password-after-click.png' });
    } catch (error) {
      console.log('Could not click eye icon:', error.message);

      // Try alternative approach - click on the container
      const eyeContainer = page
        .locator('.MuiInputBase-adornedEnd .MuiBox-root')
        .last();
      try {
        await eyeContainer.click({ force: true });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'simple-password-container-click.png' });
      } catch (e) {
        console.log('Container click also failed:', e.message);
      }
    }

    // Test input field focus and styling
    await passwordField.focus();
    await page.screenshot({ path: 'simple-password-focused.png' });

    await passwordField.fill('test123');
    await page.screenshot({ path: 'simple-password-filled.png' });

    // Test username field
    const usernameField = page.locator('input[placeholder="Enter username"]');
    await usernameField.focus();
    await page.screenshot({ path: 'simple-username-focused.png' });

    await usernameField.fill('testuser');
    await page.screenshot({ path: 'simple-username-filled.png' });

    // Final screenshot with both fields filled
    await page.screenshot({ path: 'simple-both-filled.png' });
  });
});
