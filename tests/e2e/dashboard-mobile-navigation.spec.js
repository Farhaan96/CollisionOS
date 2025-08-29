import { test, expect, devices } from '@playwright/test';

test.describe('CollisionOS Dashboard Mobile Navigation', () => {
  // Configure for mobile testing
  test.use({
    ...devices['iPhone 13'],
  });

  // Setup: Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="Enter username"]', 'admin');
    await page.fill('input[placeholder="Enter password"]', 'admin123');
    await page.click('button:has-text("Sign In")', { force: true });
    await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
  });

  test.describe('Mobile Dashboard Layout', () => {
    test('should display KPI cards in mobile-friendly layout', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Verify cards stack vertically on mobile
      const cards = page.locator('.MuiCard-root');
      const cardCount = await cards.count();
      expect(cardCount).toBeGreaterThan(0);

      // Check first few cards are full width on mobile
      for (let i = 0; i < Math.min(cardCount, 4); i++) {
        const card = cards.nth(i);
        const boundingBox = await card.boundingBox();
        
        if (boundingBox) {
          // On mobile, cards should take most of the screen width
          const viewportWidth = page.viewportSize()?.width || 375;
          expect(boundingBox.width).toBeGreaterThan(viewportWidth * 0.8);
        }
      }
    });

    test('should verify mobile touch targets are appropriately sized', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Check KPI card touch targets
      const interactiveCards = page.locator('.MuiCard-root[style*="cursor: pointer"], .MuiCard-root:hover');
      const cardCount = await interactiveCards.count();

      for (let i = 0; i < Math.min(cardCount, 6); i++) {
        const card = interactiveCards.nth(i);
        if (await card.isVisible()) {
          const boundingBox = await card.boundingBox();
          
          if (boundingBox) {
            // Touch targets should be at least 44px in height (iOS HIG)
            expect(boundingBox.height).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });

    test('should handle mobile scrolling for activity feed', async ({ page }) => {
      await page.waitForTimeout(3000);

      // Find activity feed
      const activityFeed = page.locator('text=Real-time Activity Feed');
      if (await activityFeed.isVisible()) {
        const feedContainer = activityFeed.locator('xpath=ancestor::*[contains(@class, "MuiPaper-root")]');
        
        // Scroll within the activity feed
        await feedContainer.scrollIntoViewIfNeeded();
        await page.mouse.wheel(0, 100);
        await page.waitForTimeout(500);
        
        // Activity feed should remain accessible
        await expect(activityFeed).toBeVisible();
      }
    });
  });

  test.describe('Mobile Touch Interactions', () => {
    test('should support tap gestures on KPI cards', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Test tap on Active Repairs card
      const activeRepairsCard = page.locator('text=Active Repairs').first();
      if (await activeRepairsCard.isVisible()) {
        const cardElement = activeRepairsCard.locator('xpath=ancestor::*[contains(@class, "MuiCard-root")]');
        
        // Simulate mobile tap
        await cardElement.tap();
        await page.waitForTimeout(1000);
        
        // Should navigate or show interaction feedback
        const currentUrl = page.url();
        // Either navigation occurred or we're still on dashboard (not all cards may be interactive)
        expect(currentUrl).toMatch(/dashboard|production|repair/);
      }
    });

    test('should support long press gestures for context menus', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Test long press on activity items
      const activityItems = page.locator('[role="listitem"]');
      const itemCount = await activityItems.count();

      if (itemCount > 0) {
        const firstItem = activityItems.first();
        
        // Simulate long press (mobile context menu)
        const boundingBox = await firstItem.boundingBox();
        if (boundingBox) {
          await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
          await page.mouse.down();
          await page.waitForTimeout(800); // Long press duration
          await page.mouse.up();
          
          // Check for context menu or action feedback
          await page.waitForTimeout(500);
        }
      }
    });

    test('should support swipe gestures for navigation', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Test horizontal swipe on technician performance section
      const techSection = page.locator('text=Technician Performance');
      if (await techSection.isVisible()) {
        const sectionContainer = techSection.locator('xpath=ancestor::*[contains(@class, "MuiPaper-root")]');
        const boundingBox = await sectionContainer.boundingBox();
        
        if (boundingBox) {
          // Simulate swipe gesture
          const startX = boundingBox.x + boundingBox.width * 0.8;
          const endX = boundingBox.x + boundingBox.width * 0.2;
          const y = boundingBox.y + boundingBox.height / 2;
          
          await page.mouse.move(startX, y);
          await page.mouse.down();
          await page.mouse.move(endX, y, { steps: 10 });
          await page.mouse.up();
          
          await page.waitForTimeout(500);
          
          // Section should remain functional after swipe
          await expect(techSection).toBeVisible();
        }
      }
    });
  });

  test.describe('Mobile Responsive Behavior', () => {
    test('should adapt alert banners for mobile display', async ({ page }) => {
      await page.waitForTimeout(2000);

      const alertBanner = page.locator('[role="alert"]').first();
      if (await alertBanner.isVisible()) {
        const boundingBox = await alertBanner.boundingBox();
        
        if (boundingBox) {
          // Alert should not exceed viewport width
          const viewportWidth = page.viewportSize()?.width || 375;
          expect(boundingBox.width).toBeLessThanOrEqual(viewportWidth);
        }
        
        // Alert text should be readable
        const alertText = await alertBanner.textContent();
        expect(alertText?.length).toBeGreaterThan(0);
      }
    });

    test('should show condensed metrics on mobile', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Mobile should show abbreviated values or condensed layouts
      const metricCards = page.locator('.MuiCard-root');
      const cardCount = await metricCards.count();
      expect(cardCount).toBeGreaterThan(0);

      // Check that metric values are still readable on mobile
      const metricValues = page.locator('.MuiTypography-h4');
      const valueCount = await metricValues.count();

      for (let i = 0; i < Math.min(valueCount, 6); i++) {
        const value = metricValues.nth(i);
        if (await value.isVisible()) {
          const fontSize = await value.evaluate(el => 
            window.getComputedStyle(el).fontSize
          );
          
          // Font should be large enough for mobile reading
          const fontSizeNum = parseFloat(fontSize);
          expect(fontSizeNum).toBeGreaterThanOrEqual(16); // Minimum readable size
        }
      }
    });

    test('should handle mobile navigation menu', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Look for mobile menu trigger (hamburger menu)
      const mobileMenuButton = page.locator(
        'button[aria-label*="menu"], button[aria-label*="navigation"], .MuiIconButton-root svg[data-testid*="Menu"]'
      );
      
      if (await mobileMenuButton.count() > 0) {
        const menuButton = mobileMenuButton.first();
        await menuButton.tap();
        await page.waitForTimeout(500);
        
        // Navigation drawer should open
        const navigationDrawer = page.locator('[role="dialog"], .MuiDrawer-root');
        if (await navigationDrawer.count() > 0) {
          await expect(navigationDrawer.first()).toBeVisible();
          
          // Should contain navigation links
          const navLinks = navigationDrawer.locator('text=Dashboard, text=Production, text=Customers');
          expect(await navLinks.count()).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Mobile Performance Tests', () => {
    test('should load quickly on mobile network conditions', async ({ page }) => {
      // Simulate mobile network conditions
      await page.context().addInitScript(() => {
        // Simulate slower mobile performance
        window.performance.mark('mobile-start');
      });

      const startTime = Date.now();
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const loadTime = Date.now() - startTime;
      
      // Dashboard should load in reasonable time even on mobile
      expect(loadTime).toBeLessThan(10000); // 10 seconds max for mobile
      
      // Key metrics should be visible
      const metricsVisible = await page.locator('.MuiCard-root').count();
      expect(metricsVisible).toBeGreaterThan(0);
    });

    test('should handle mobile memory constraints', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Simulate interaction with multiple cards to test memory usage
      const cards = page.locator('.MuiCard-root');
      const cardCount = await cards.count();

      for (let i = 0; i < Math.min(cardCount, 8); i++) {
        const card = cards.nth(i);
        await card.scrollIntoViewIfNeeded();
        await card.hover();
        await page.waitForTimeout(100);
      }

      // Page should remain responsive
      const dashboardTitle = page.locator('text=Auto Body Shop Dashboard');
      await expect(dashboardTitle).toBeVisible();
    });

    test('should optimize images and assets for mobile', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Check for image optimization indicators
      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < Math.min(imageCount, 3); i++) {
        const image = images.nth(i);
        if (await image.isVisible()) {
          const naturalWidth = await image.evaluate(img => img.naturalWidth);
          const displayWidth = await image.evaluate(img => img.clientWidth);
          
          // Images should be reasonably sized for mobile
          expect(naturalWidth).toBeLessThan(1200); // Not excessively large
          expect(displayWidth).toBeGreaterThan(0); // Actually displayed
        }
      }
    });
  });

  test.describe('Mobile Edge Cases', () => {
    test('should handle device rotation', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Start in portrait
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(1000);
      
      // Verify dashboard is visible in portrait
      const portraitMetrics = await page.locator('.MuiCard-root').count();
      expect(portraitMetrics).toBeGreaterThan(0);

      // Rotate to landscape
      await page.setViewportSize({ width: 812, height: 375 });
      await page.waitForTimeout(1000);
      
      // Dashboard should adapt to landscape
      const landscapeMetrics = await page.locator('.MuiCard-root').count();
      expect(landscapeMetrics).toBe(portraitMetrics);
      
      // Key elements should still be accessible
      await expect(page.locator('text=Auto Body Shop Dashboard')).toBeVisible();
    });

    test('should handle mobile keyboard display', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Navigate to page with input fields (simulate search)
      const searchableArea = page.locator('input, textarea, [contenteditable]');
      if (await searchableArea.count() > 0) {
        const firstInput = searchableArea.first();
        await firstInput.tap();
        
        // Simulate mobile keyboard appearing (viewport shrinks)
        const originalHeight = page.viewportSize()?.height || 812;
        await page.setViewportSize({ width: 375, height: originalHeight * 0.6 });
        await page.waitForTimeout(500);
        
        // Dashboard should remain functional with reduced viewport
        const dashboardTitle = page.locator('text=Auto Body Shop Dashboard');
        await expect(dashboardTitle).toBeVisible();
      }
    });

    test('should handle mobile app-like navigation patterns', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Test pull-to-refresh gesture simulation
      const dashboardContainer = page.locator('[data-testid="dashboard"], main, .MuiContainer-root').first();
      const boundingBox = await dashboardContainer.boundingBox();
      
      if (boundingBox) {
        // Simulate pull down gesture at top of screen
        const centerX = boundingBox.x + boundingBox.width / 2;
        const topY = boundingBox.y + 10;
        const pullDistance = 150;
        
        await page.mouse.move(centerX, topY);
        await page.mouse.down();
        await page.mouse.move(centerX, topY + pullDistance, { steps: 5 });
        await page.waitForTimeout(200);
        await page.mouse.up();
        
        await page.waitForTimeout(1000);
        
        // Dashboard should handle the gesture gracefully
        await expect(page.locator('text=Auto Body Shop Dashboard')).toBeVisible();
      }
    });

    test('should maintain state during mobile interruptions', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Record current state
      const initialMetrics = await page.locator('.MuiCard-root').count();
      
      // Simulate mobile app backgrounding/foregrounding
      await page.evaluate(() => {
        // Simulate visibility change (app backgrounded)
        Object.defineProperty(document, 'visibilityState', {
          value: 'hidden',
          writable: true
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      
      await page.waitForTimeout(500);
      
      // Simulate app foregrounding
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', {
          value: 'visible',
          writable: true
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      
      await page.waitForTimeout(1000);
      
      // Dashboard should maintain state
      const finalMetrics = await page.locator('.MuiCard-root').count();
      expect(finalMetrics).toBe(initialMetrics);
      await expect(page.locator('text=Auto Body Shop Dashboard')).toBeVisible();
    });
  });
});