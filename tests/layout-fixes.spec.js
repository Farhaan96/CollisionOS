import { test, expect } from '@playwright/test';

test.describe('Layout Fixes', () => {
  test('check login page layout and responsiveness', async ({ page }) => {
    await page.goto('/');
    await page.screenshot({ path: 'login-page-before.png', fullPage: true });

    // Check for responsive issues
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.screenshot({
        path: `login-${viewport.name}.png`,
        fullPage: true,
      });

      // Check if login form is properly visible and centered
      const loginForm = page.locator('form');
      const loginFormBounds = await loginForm.boundingBox();

      if (loginFormBounds) {
        console.log(`${viewport.name} - Login form bounds:`, loginFormBounds);

        // Check if form is too wide or overflowing
        if (loginFormBounds.width > viewport.width) {
          console.log(`${viewport.name} - Login form is wider than viewport!`);
        }
      }
    }
  });

  test('login and check dashboard text overflow', async ({ page }) => {
    await page.goto('/');

    // Try to login with admin credentials
    await page.fill('input[placeholder="admin"]', 'admin');
    await page.fill('input[placeholder="admin123"]', 'admin123');
    await page.click('button:has-text("Sign In")');

    // Wait for navigation
    try {
      await page.waitForURL('/dashboard', { timeout: 5000 });
      await page.screenshot({
        path: 'dashboard-after-login.png',
        fullPage: true,
      });

      // Check for text overflow in dashboard
      const textOverflowElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const overflowing = [];

        elements.forEach(el => {
          if (
            el.scrollWidth > el.clientWidth &&
            el.innerText &&
            el.innerText.trim().length > 0
          ) {
            const rect = el.getBoundingClientRect();
            overflowing.push({
              tagName: el.tagName,
              className: el.className,
              text: el.innerText.substring(0, 100) + '...',
              scrollWidth: el.scrollWidth,
              clientWidth: el.clientWidth,
              overflow: el.scrollWidth - el.clientWidth,
              rect: {
                width: rect.width,
                height: rect.height,
                top: rect.top,
                left: rect.left,
              },
            });
          }
        });

        return overflowing.sort((a, b) => b.overflow - a.overflow);
      });

      if (textOverflowElements.length > 0) {
        console.log(
          'Found text overflow elements:',
          textOverflowElements.slice(0, 10)
        );
      }

      // Take screenshots at different viewport sizes
      const viewports = [
        { width: 375, height: 667, name: 'mobile' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1280, height: 720, name: 'laptop' },
        { width: 1920, height: 1080, name: 'desktop' },
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.screenshot({
          path: `dashboard-${viewport.name}.png`,
          fullPage: true,
        });
      }
    } catch (error) {
      console.log(
        'Could not navigate to dashboard, likely still on login page'
      );
      await page.screenshot({
        path: 'login-attempt-failed.png',
        fullPage: true,
      });
    }
  });
});
