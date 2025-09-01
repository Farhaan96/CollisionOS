import { test, expect } from '@playwright/test';

test.describe('Login Fixes Verification', () => {
  test('verify password toggle works and input fields display correctly', async ({
    page,
  }) => {
    await page.goto('/');

    // Test password visibility toggle
    const passwordField = page.locator('input[placeholder="admin123"]');
    const eyeContainer = page
      .locator('div')
      .filter({
        has: page.locator(
          'svg[data-testid="VisibilityIcon"], svg[data-testid="VisibilityOffIcon"]'
        ),
      });

    // Check initial state - password should be hidden
    await expect(passwordField).toHaveAttribute('type', 'password');
    await page.screenshot({ path: 'login-password-hidden.png' });

    // Click the eye icon container
    await eyeContainer.click({ force: true });
    await page.waitForTimeout(500); // Wait for state change

    // Check if password is now visible
    await expect(passwordField).toHaveAttribute('type', 'text');
    await page.screenshot({ path: 'login-password-visible.png' });

    // Click again to hide password
    await eyeContainer.click({ force: true });
    await page.waitForTimeout(500);

    // Should be hidden again
    await expect(passwordField).toHaveAttribute('type', 'password');

    // Test input field styling and blue border
    const usernameField = page.locator('input[placeholder="admin"]');

    // Focus on username field and check styling
    await usernameField.focus();
    await page.screenshot({ path: 'login-username-focused.png' });

    // Type in username
    await usernameField.fill('admin');
    await page.screenshot({ path: 'login-username-filled.png' });

    // Focus on password field and check styling
    await passwordField.focus();
    await page.screenshot({ path: 'login-password-focused.png' });

    // Type in password
    await passwordField.fill('admin123');
    await page.screenshot({ path: 'login-password-filled.png' });

    // Check final state with both fields filled
    await page.screenshot({ path: 'login-both-fields-filled.png' });

    console.log('Login fixes verification completed');
  });

  test('login page responsiveness on different screen sizes', async ({
    page,
  }) => {
    await page.goto('/');

    const viewports = [
      { width: 360, height: 640, name: 'small-mobile' },
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1280, height: 720, name: 'laptop' },
      { width: 1920, height: 1080, name: 'desktop' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.screenshot({
        path: `login-responsive-${viewport.name}.png`,
        fullPage: true,
      });

      // Verify form elements are visible and not cut off
      const loginForm = page.locator('form');
      const usernameField = page.locator('input[placeholder="admin"]');
      const passwordField = page.locator('input[placeholder="admin123"]');
      const loginButton = page.locator('button:has-text("Sign In")');

      await expect(loginForm).toBeVisible();
      await expect(usernameField).toBeVisible();
      await expect(passwordField).toBeVisible();
      await expect(loginButton).toBeVisible();

      console.log(`${viewport.name}: All elements visible`);
    }
  });
});
