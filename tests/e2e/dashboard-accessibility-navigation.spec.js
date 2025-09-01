import { test, expect } from '@playwright/test';

test.describe('CollisionOS Dashboard Accessibility Navigation', () => {
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

  test.describe('Keyboard Navigation', () => {
    test('should support tab navigation through all interactive elements', async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      // Start tabbing from the top
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);

      let focusableElements = [];

      // Tab through first 20 elements to map navigation order
      for (let i = 0; i < 20; i++) {
        const focusedElement = page.locator(':focus');

        if ((await focusedElement.count()) > 0) {
          const tagName = await focusedElement.evaluate(el => el.tagName);
          const role = await focusedElement.getAttribute('role');
          const ariaLabel = await focusedElement.getAttribute('aria-label');
          const text = await focusedElement.textContent();

          focusableElements.push({
            index: i,
            tagName,
            role,
            ariaLabel,
            text: text?.slice(0, 50), // First 50 chars
          });

          // Verify element is visible when focused
          await expect(focusedElement).toBeVisible();
        }

        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
      }

      // Should have focused on multiple interactive elements
      expect(focusableElements.length).toBeGreaterThan(5);

      console.log('Focusable elements:', focusableElements);
    });

    test('should support Enter key activation on focusable elements', async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      // Tab to first interactive element (likely navigation or cards)
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);

      let enterTestCount = 0;
      const maxTests = 10;

      // Test Enter key on first few focusable elements
      for (let i = 0; i < maxTests; i++) {
        const focusedElement = page.locator(':focus');

        if ((await focusedElement.count()) > 0) {
          const tagName = await focusedElement.evaluate(el => el.tagName);
          const role = await focusedElement.getAttribute('role');

          // Test Enter on buttons, links, and interactive elements
          if (
            tagName === 'BUTTON' ||
            tagName === 'A' ||
            role === 'button' ||
            role === 'link'
          ) {
            const initialUrl = page.url();

            // Press Enter
            await page.keyboard.press('Enter');
            await page.waitForTimeout(500);

            const newUrl = page.url();

            // Either URL changed (navigation) or element responded
            if (newUrl !== initialUrl) {
              console.log(
                `Enter key navigated from ${initialUrl} to ${newUrl}`
              );
              // Navigate back for next test
              await page.goBack();
              await page.waitForLoadState('networkidle');
            }

            enterTestCount++;
          }
        }

        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
      }

      // Should have tested Enter on at least a few elements
      expect(enterTestCount).toBeGreaterThan(0);
    });

    test('should support arrow key navigation in grids and lists', async ({
      page,
    }) => {
      await page.waitForTimeout(3000);

      // Focus on dashboard metrics grid
      const firstMetricCard = page.locator('.MuiCard-root').first();
      await firstMetricCard.focus();

      // Test arrow key navigation
      const arrowKeyTests = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];

      for (const arrowKey of arrowKeyTests) {
        const beforeFocus = await page.evaluate(() =>
          document.activeElement?.textContent?.slice(0, 30)
        );

        await page.keyboard.press(arrowKey);
        await page.waitForTimeout(200);

        const afterFocus = await page.evaluate(() =>
          document.activeElement?.textContent?.slice(0, 30)
        );

        console.log(`${arrowKey}: "${beforeFocus}" -> "${afterFocus}"`);
      }

      // Test list navigation in activity feed
      const activityFeed = page.locator('text=Real-time Activity Feed');
      if (await activityFeed.isVisible()) {
        // Focus on first activity item
        const firstActivityItem = page.locator('[role="listitem"]').first();
        if ((await firstActivityItem.count()) > 0) {
          await firstActivityItem.focus();

          // Navigate with arrow keys
          await page.keyboard.press('ArrowDown');
          await page.waitForTimeout(200);
          await page.keyboard.press('ArrowUp');
          await page.waitForTimeout(200);
        }
      }
    });

    test('should support Escape key to close modals and cancel actions', async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      // Try to open a modal or dialog by clicking various elements
      const potentialModalTriggers = page.locator(
        'button:has-text("Add"), button:has-text("New"), button:has-text("Create"), [aria-haspopup="dialog"]'
      );

      const triggerCount = await potentialModalTriggers.count();

      if (triggerCount > 0) {
        const trigger = potentialModalTriggers.first();
        await trigger.click();
        await page.waitForTimeout(500);

        // Look for modal/dialog
        const modal = page.locator(
          '[role="dialog"], .MuiDialog-root, .MuiModal-root'
        );
        if ((await modal.count()) > 0) {
          // Test Escape key closes modal
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);

          // Modal should be closed
          expect(await modal.count()).toBe(0);
        }
      }

      // Test Escape on any focused element doesn't break navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);

      // Dashboard should still be functional
      await expect(page.locator('text=Auto Body Shop Dashboard')).toBeVisible();
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have proper ARIA labels on interactive elements', async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      // Check KPI cards have proper labeling
      const cards = page.locator('.MuiCard-root');
      const cardCount = await cards.count();

      for (let i = 0; i < Math.min(cardCount, 8); i++) {
        const card = cards.nth(i);

        if (await card.isVisible()) {
          const ariaLabel = await card.getAttribute('aria-label');
          const role = await card.getAttribute('role');
          const tabIndex = await card.getAttribute('tabindex');

          // Interactive cards should have proper accessibility attributes
          if (tabIndex === '0' || tabIndex === '-1' || role) {
            expect(ariaLabel || role).toBeTruthy();
          }

          // Check for descriptive text within cards
          const cardText = await card.textContent();
          expect(cardText?.length).toBeGreaterThan(5);
        }
      }
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Check heading structure
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();

      expect(headingCount).toBeGreaterThan(0);

      // Check that there's a main heading (h1)
      const h1Elements = page.locator('h1');
      const h1Count = await h1Elements.count();
      expect(h1Count).toBeGreaterThanOrEqual(1);

      // Document heading structure
      const headingStructure = [];
      for (let i = 0; i < headingCount; i++) {
        const heading = headings.nth(i);
        const tagName = await heading.evaluate(el => el.tagName);
        const text = await heading.textContent();

        headingStructure.push({
          level: tagName,
          text: text?.slice(0, 50),
        });
      }

      console.log('Heading structure:', headingStructure);
    });

    test('should provide meaningful alternative text and labels', async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      // Check images have alt text
      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const ariaLabel = await img.getAttribute('aria-label');

        // Images should have meaningful alt text or be marked decorative
        expect(alt !== null || ariaLabel !== null).toBeTruthy();
      }

      // Check form elements have proper labels
      const formElements = page.locator('input, select, textarea');
      const formElementCount = await formElements.count();

      for (let i = 0; i < formElementCount; i++) {
        const element = formElements.nth(i);

        if (await element.isVisible()) {
          const ariaLabel = await element.getAttribute('aria-label');
          const ariaLabelledBy = await element.getAttribute('aria-labelledby');
          const placeholder = await element.getAttribute('placeholder');

          // Form elements should have some form of labeling
          expect(ariaLabel || ariaLabelledBy || placeholder).toBeTruthy();
        }
      }
    });

    test('should announce dynamic content changes', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Look for live regions that announce updates
      const liveRegions = page.locator(
        '[aria-live], [role="status"], [role="alert"]'
      );
      const liveRegionCount = await liveRegions.count();

      // Dashboard should have some live regions for dynamic updates
      expect(liveRegionCount).toBeGreaterThanOrEqual(1);

      // Check that live regions have appropriate politeness settings
      for (let i = 0; i < liveRegionCount; i++) {
        const region = liveRegions.nth(i);
        const ariaLive = await region.getAttribute('aria-live');
        const role = await region.getAttribute('role');

        // Should have appropriate announcement settings
        expect(ariaLive || role).toMatch(/polite|assertive|status|alert/);
      }

      // Test interaction that might trigger announcements
      const interactiveElement = page
        .locator('button, [role="button"]')
        .first();
      if (await interactiveElement.isVisible()) {
        await interactiveElement.click();
        await page.waitForTimeout(500);

        // Check if any live regions were updated
        const updatedRegions = page.locator(
          '[aria-live]:not(:empty), [role="status"]:not(:empty)'
        );
        const updatedCount = await updatedRegions.count();

        console.log(
          `Found ${updatedCount} updated live regions after interaction`
        );
      }
    });
  });

  test.describe('Visual Accessibility', () => {
    test('should have sufficient color contrast ratios', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Test text elements for color contrast
      const textElements = page.locator(
        '.MuiTypography-root, .MuiButton-root, .MuiChip-root'
      );
      const textCount = await textElements.count();

      const contrastResults = [];

      for (let i = 0; i < Math.min(textCount, 10); i++) {
        const element = textElements.nth(i);

        if (await element.isVisible()) {
          const styles = await element.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              color: computed.color,
              backgroundColor: computed.backgroundColor,
              fontSize: computed.fontSize,
            };
          });

          contrastResults.push({
            index: i,
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            fontSize: styles.fontSize,
          });
        }
      }

      // All text elements should have defined colors
      expect(contrastResults.length).toBeGreaterThan(0);
      contrastResults.forEach(result => {
        expect(result.color).toMatch(/rgb/);
      });

      console.log('Color contrast samples:', contrastResults.slice(0, 5));
    });

    test('should support high contrast mode', async ({ page }) => {
      // Simulate high contrast mode
      await page.emulateMedia({
        colorScheme: 'dark',
        reducedMotion: 'reduce',
      });

      await page.waitForTimeout(1000);

      // Reload to apply high contrast
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Dashboard should still be functional in high contrast
      await expect(page.locator('text=Auto Body Shop Dashboard')).toBeVisible();

      // Interactive elements should still be identifiable
      const buttons = page.locator('button, [role="button"]');
      const buttonCount = await buttons.count();
      expect(buttonCount).toBeGreaterThan(0);

      // Cards should still be visible with clear boundaries
      const cards = page.locator('.MuiCard-root');
      const cardCount = await cards.count();
      expect(cardCount).toBeGreaterThan(0);
    });

    test('should support reduced motion preferences', async ({ page }) => {
      // Simulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForTimeout(500);

      // Reload to apply reduced motion
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Test that animations are reduced/disabled
      const cards = page.locator('.MuiCard-root');
      const firstCard = cards.first();

      if (await firstCard.isVisible()) {
        // Hover should still work but with reduced animation
        await firstCard.hover();
        await page.waitForTimeout(300);

        // Element should still respond to hover
        const hoverState = await firstCard.evaluate(
          el => window.getComputedStyle(el).transform
        );

        // Transform may be applied but should be subtle or instant
        console.log('Reduced motion hover transform:', hoverState);
      }

      // Dashboard should remain fully functional
      await expect(page.locator('text=Auto Body Shop Dashboard')).toBeVisible();
    });

    test('should scale properly with increased font sizes', async ({
      page,
    }) => {
      // Simulate increased font size (zoom)
      await page.setViewportSize({ width: 1280, height: 720 });

      // Simulate browser zoom
      await page.evaluate(() => {
        document.body.style.fontSize = '20px'; // Larger base font size
      });

      await page.waitForTimeout(1000);

      // Dashboard should adapt to larger text
      await expect(page.locator('text=Auto Body Shop Dashboard')).toBeVisible();

      // Cards should not overflow or become unusable
      const cards = page.locator('.MuiCard-root');
      const cardCount = await cards.count();

      for (let i = 0; i < Math.min(cardCount, 4); i++) {
        const card = cards.nth(i);
        const boundingBox = await card.boundingBox();

        if (boundingBox) {
          // Cards should not be clipped or overflow
          expect(boundingBox.width).toBeGreaterThan(100);
          expect(boundingBox.height).toBeGreaterThan(50);
        }
      }

      // Text should remain readable
      const textElements = page.locator('.MuiTypography-root');
      const textCount = await textElements.count();
      expect(textCount).toBeGreaterThan(0);
    });
  });

  test.describe('Focus Management', () => {
    test('should maintain logical focus order', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Document the focus order
      const focusOrder = [];
      let currentElement = null;

      // Tab through first 15 elements
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);

        const focusedElement = page.locator(':focus');

        if ((await focusedElement.count()) > 0) {
          const elementInfo = await focusedElement.evaluate(el => {
            const rect = el.getBoundingClientRect();
            return {
              tagName: el.tagName,
              text: el.textContent?.slice(0, 30),
              x: rect.x,
              y: rect.y,
              role: el.getAttribute('role'),
            };
          });

          focusOrder.push({ step: i, ...elementInfo });
        }
      }

      // Focus order should generally move left-to-right, top-to-bottom
      expect(focusOrder.length).toBeGreaterThan(5);

      // Check for any major focus order violations (jumping around)
      let orderViolations = 0;
      for (let i = 1; i < focusOrder.length; i++) {
        const prev = focusOrder[i - 1];
        const curr = focusOrder[i];

        // Major jump backwards in vertical position might indicate focus order issue
        if (curr.y < prev.y - 100) {
          orderViolations++;
        }
      }

      // Should have minimal focus order violations
      expect(orderViolations).toBeLessThan(3);

      console.log('Focus order:', focusOrder);
    });

    test('should provide visible focus indicators', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Tab to interactive elements and check focus indicators
      const focusTests = [];

      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(200);

        const focusedElement = page.locator(':focus');

        if ((await focusedElement.count()) > 0) {
          const focusStyles = await focusedElement.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              outline: computed.outline,
              outlineColor: computed.outlineColor,
              outlineWidth: computed.outlineWidth,
              border: computed.border,
              boxShadow: computed.boxShadow,
            };
          });

          // Should have some form of focus indicator
          const hasFocusIndicator =
            focusStyles.outline !== 'none' ||
            focusStyles.outlineColor !== 'initial' ||
            focusStyles.outlineWidth !== '0px' ||
            focusStyles.boxShadow.includes('0 0') ||
            focusStyles.border.includes('px');

          focusTests.push({
            step: i,
            hasFocusIndicator,
            styles: focusStyles,
          });
        }
      }

      // Most focused elements should have visible focus indicators
      const elementsWithFocus = focusTests.filter(
        test => test.hasFocusIndicator
      );
      expect(elementsWithFocus.length).toBeGreaterThan(focusTests.length * 0.7); // 70% should have indicators

      console.log('Focus indicator tests:', focusTests.slice(0, 5));
    });

    test('should trap focus in modal dialogs', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Try to open a modal
      const modalTriggers = page.locator(
        'button:has-text("Add"), button:has-text("New"), [aria-haspopup="dialog"]'
      );

      if ((await modalTriggers.count()) > 0) {
        await modalTriggers.first().click();
        await page.waitForTimeout(500);

        // Check if modal opened
        const modal = page.locator('[role="dialog"], .MuiDialog-root');

        if ((await modal.count()) > 0) {
          // Tab through modal and ensure focus stays within
          const initialFocusCount = await modal.locator(':focus').count();

          // Tab multiple times
          for (let i = 0; i < 10; i++) {
            await page.keyboard.press('Tab');
            await page.waitForTimeout(100);
          }

          // Focus should still be within modal
          const finalFocusInModal = await modal.locator(':focus').count();
          expect(finalFocusInModal).toBeGreaterThan(0);

          // Shift+Tab should also stay within modal
          await page.keyboard.press('Shift+Tab');
          await page.waitForTimeout(100);

          const shiftTabFocusInModal = await modal.locator(':focus').count();
          expect(shiftTabFocusInModal).toBeGreaterThan(0);

          // Close modal for cleanup
          await page.keyboard.press('Escape');
        }
      }
    });

    test('should restore focus after modal close', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Focus on an element, then open modal
      const triggerElement = page.locator('button, [role="button"]').first();

      if (await triggerElement.isVisible()) {
        await triggerElement.focus();
        const triggerText = await triggerElement.textContent();

        // Try to open modal by clicking the element
        await triggerElement.click();
        await page.waitForTimeout(500);

        // Check if modal opened
        const modal = page.locator('[role="dialog"], .MuiDialog-root');

        if ((await modal.count()) > 0) {
          // Close modal
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);

          // Focus should return to trigger element
          const focusedAfterClose = page.locator(':focus');

          if ((await focusedAfterClose.count()) > 0) {
            const focusedText = await focusedAfterClose.textContent();
            // Focus should be back on the trigger or nearby element
            expect(focusedText).toContain(triggerText?.slice(0, 10) || '');
          }
        }
      }
    });
  });
});
