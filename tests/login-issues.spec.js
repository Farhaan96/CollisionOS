import { test, expect } from '@playwright/test';

test.describe('Login Issues', () => {
  test('check login page layout and input field issues', async ({ page }) => {
    await page.goto('/');

    // Take initial screenshot
    await page.screenshot({ path: 'login-issues-initial.png', fullPage: true });

    // Test different viewport sizes to check for cutoff
    const viewports = [
      { width: 360, height: 640, name: 'small-mobile' },
      { width: 375, height: 667, name: 'mobile' },
      { width: 414, height: 896, name: 'large-mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1024, height: 768, name: 'tablet-landscape' },
      { width: 1280, height: 720, name: 'laptop' },
      { width: 1920, height: 1080, name: 'desktop' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.screenshot({
        path: `login-cutoff-${viewport.name}.png`,
        fullPage: true,
      });

      // Check if elements are visible and not cut off
      const loginForm = page.locator('form');
      const loginButton = page.locator('button:has-text("Sign In")');
      const usernameField = page.locator('input[placeholder="admin"]');
      const passwordField = page.locator('input[placeholder="admin123"]');

      // Check if form elements are visible
      await expect(loginForm).toBeVisible();
      await expect(loginButton).toBeVisible();
      await expect(usernameField).toBeVisible();
      await expect(passwordField).toBeVisible();

      // Check if elements are fully within viewport
      const formBox = await loginForm.boundingBox();
      const buttonBox = await loginButton.boundingBox();

      if (formBox && buttonBox) {
        const cutoffIssues = [];

        if (formBox.x < 0) cutoffIssues.push('Form cut off on left');
        if (formBox.x + formBox.width > viewport.width)
          cutoffIssues.push('Form cut off on right');
        if (formBox.y < 0) cutoffIssues.push('Form cut off on top');
        if (formBox.y + formBox.height > viewport.height)
          cutoffIssues.push('Form cut off on bottom');

        if (buttonBox.x < 0) cutoffIssues.push('Button cut off on left');
        if (buttonBox.x + buttonBox.width > viewport.width)
          cutoffIssues.push('Button cut off on right');
        if (buttonBox.y < 0) cutoffIssues.push('Button cut off on top');
        if (buttonBox.y + buttonBox.height > viewport.height)
          cutoffIssues.push('Button cut off on bottom');

        if (cutoffIssues.length > 0) {
          console.log(`${viewport.name} cutoff issues:`, cutoffIssues);
        }
      }
    }
  });

  test('password visibility toggle and input field behavior', async ({
    page,
  }) => {
    await page.goto('/');

    // Test password visibility toggle
    const passwordField = page.locator('input[placeholder="admin123"]');
    const eyeIcon = page
      .locator('svg')
      .filter({ hasText: /visibility/ })
      .or(
        page.locator(
          '[data-testid="VisibilityIcon"], [data-testid="VisibilityOffIcon"]'
        )
      );

    // Check initial state
    await expect(passwordField).toHaveAttribute('type', 'password');

    // Take screenshot before interaction
    await page.screenshot({ path: 'login-before-eye-click.png' });

    // Try different selectors for the eye icon
    const eyeSelectors = [
      'svg[data-testid="VisibilityIcon"]',
      'svg[data-testid="VisibilityOffIcon"]',
      'div:has(svg):near(input[placeholder="admin123"])',
      'div[role="button"]:has(svg)',
      '.MuiInputAdornment-root svg',
      'div:has(> svg[data-testid*="Visibility"])',
    ];

    let eyeClicked = false;
    for (const selector of eyeSelectors) {
      const element = page.locator(selector);
      if ((await element.count()) > 0) {
        console.log(`Found eye icon with selector: ${selector}`);
        await element.first().click();
        eyeClicked = true;
        break;
      }
    }

    if (!eyeClicked) {
      console.log('Could not find clickable eye icon');
      // Try clicking near the password field
      const passwordBox = await passwordField.boundingBox();
      if (passwordBox) {
        await page.click(
          passwordBox.x + passwordBox.width - 30,
          passwordBox.y + passwordBox.height / 2
        );
      }
    }

    // Take screenshot after click attempt
    await page.screenshot({ path: 'login-after-eye-click.png' });

    // Test input field behavior
    await page.fill('input[placeholder="admin"]', 'test');
    await page.screenshot({ path: 'login-username-filled.png' });

    await page.fill('input[placeholder="admin123"]', 'password');
    await page.screenshot({ path: 'login-password-filled.png' });

    // Check for blue bar/border issues
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      inputs.forEach(input => {
        const computedStyle = window.getComputedStyle(input);
        const parentStyle = window.getComputedStyle(input.parentElement);
        console.log('Input styles:', {
          element: input.placeholder,
          border: computedStyle.border,
          borderBottom: computedStyle.borderBottom,
          background: computedStyle.background,
          parentBorder: parentStyle.border,
          parentBackground: parentStyle.background,
        });
      });
    });
  });
});
