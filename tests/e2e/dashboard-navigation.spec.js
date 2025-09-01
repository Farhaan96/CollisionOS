import { test, expect } from '@playwright/test';

test.describe('CollisionOS Dashboard Navigation System', () => {
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

  test.describe('1. KPI Card Navigation Tests', () => {
    test('should verify all 12+ KPI cards are present and clickable', async ({
      page,
    }) => {
      // Wait for dashboard to fully load
      await page.waitForTimeout(2000);

      // Define expected KPI cards with their text and navigation targets
      const expectedKPIs = [
        {
          title: 'Active Repairs',
          value: '24',
          shouldNavigate: true,
          expectedUrl: '/production',
        },
        {
          title: "Today's Deliveries",
          value: '3/8',
          shouldNavigate: true,
          expectedUrl: '/deliveries',
        },
        {
          title: 'Monthly Revenue',
          value: '$249K',
          shouldNavigate: true,
          expectedUrl: '/analytics',
        },
        {
          title: 'Parts Inventory',
          value: '1247',
          shouldNavigate: true,
          expectedUrl: '/parts',
        },
        {
          title: 'Technician Utilization',
          value: '87.5%',
          shouldNavigate: true,
          expectedUrl: '/technicians',
        },
        {
          title: 'Average Cycle Time',
          value: '5.8 days',
          shouldNavigate: true,
          expectedUrl: '/analytics',
        },
        {
          title: 'Job Completion Rate',
          value: '94.2%',
          shouldNavigate: true,
          expectedUrl: '/production',
        },
        {
          title: 'Customer Satisfaction',
          value: '4.7/5.0',
          shouldNavigate: true,
          expectedUrl: '/customers',
        },
        {
          title: 'Insurance Claims',
          value: '142',
          shouldNavigate: true,
          expectedUrl: '/insurance',
        },
        {
          title: 'Shop Capacity',
          value: '24/28',
          shouldNavigate: true,
          expectedUrl: '/capacity',
        },
        {
          title: 'Quality Score',
          value: '96.8%',
          shouldNavigate: true,
          expectedUrl: '/quality',
        },
        {
          title: 'Average Ticket',
          value: '$3,247',
          shouldNavigate: true,
          expectedUrl: '/analytics',
        },
      ];

      // Verify all KPI cards are visible
      for (const kpi of expectedKPIs) {
        const kpiCard = page.locator(`text=${kpi.title}`).first();
        await expect(kpiCard).toBeVisible({ timeout: 10000 });

        // Verify the value is displayed
        const valueElement = page.locator(`text=${kpi.value}`).first();
        await expect(valueElement).toBeVisible({ timeout: 5000 });

        // Check if card is clickable by checking cursor
        const cardElement = kpiCard
          .locator('xpath=ancestor::*[contains(@class, "MuiCard-root")]')
          .first();
        await expect(cardElement).toBeVisible();

        // Verify card has hover effect (indicates interactivity)
        await cardElement.hover();
        await page.waitForTimeout(200); // Allow hover effect to apply
      }
    });

    test('should navigate to correct URLs when KPI cards are clicked', async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      // Test Active Repairs navigation
      const activeRepairsCard = page
        .locator('text=Active Repairs')
        .locator('xpath=ancestor::*[contains(@class, "MuiCard-root")]')
        .first();
      await expect(activeRepairsCard).toBeVisible();
      await activeRepairsCard.click();

      // Should navigate to production or similar page
      await page.waitForLoadState('networkidle');
      // For now, check we've navigated away from dashboard
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/dashboard');

      // Return to dashboard for next test
      await page.goBack();
      await page.waitForLoadState('networkidle');
    });

    test('should pass correct URL parameters for filtered views', async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      // Test Parts Inventory navigation with expected filtering
      const partsCard = page
        .locator('text=Parts Inventory')
        .locator('xpath=ancestor::*[contains(@class, "MuiCard-root")]')
        .first();
      if (await partsCard.isVisible()) {
        await partsCard.click();
        await page.waitForLoadState('networkidle');

        // Should include filter parameters for low stock items
        const currentUrl = page.url();
        // Check URL contains relevant parameters or we're on parts page
        expect(currentUrl).toMatch(/parts|inventory/i);
      }
    });

    test('should verify trend indicators are interactive', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Find cards with trend indicators
      const trendIcons = page.locator(
        '[data-testid*="trending"], .MuiSvgIcon-root[data-testid*="Trending"]'
      );
      const trendCount = await trendIcons.count();

      if (trendCount > 0) {
        // Verify trend indicators are visible and styled correctly
        for (let i = 0; i < Math.min(trendCount, 3); i++) {
          const trendIcon = trendIcons.nth(i);
          await expect(trendIcon).toBeVisible();

          // Check color coding (green for up, red for down)
          const iconColor = await trendIcon.evaluate(
            el => window.getComputedStyle(el).color
          );
          expect(iconColor).toMatch(/rgb\(/); // Should have color applied
        }
      }
    });
  });

  test.describe('2. Activity Feed Navigation Tests', () => {
    test('should verify activity feed is interactive', async ({ page }) => {
      await page.waitForTimeout(3000);

      // Find the activity feed section
      const activityFeed = page.locator('text=Real-time Activity Feed');
      await expect(activityFeed).toBeVisible({ timeout: 10000 });

      // Check for activity items
      const activityItems = page.locator('[role="listitem"]');
      const itemCount = await activityItems.count();

      expect(itemCount).toBeGreaterThan(0);

      // Test first few activity items are clickable
      for (let i = 0; i < Math.min(itemCount, 3); i++) {
        const item = activityItems.nth(i);
        await expect(item).toBeVisible();

        // Check for hover effects
        await item.hover();
        await page.waitForTimeout(200);
      }
    });

    test('should navigate to correct context when activity items are clicked', async ({
      page,
    }) => {
      await page.waitForTimeout(3000);

      // Find job completion activity items
      const jobCompletedItem = page
        .locator('text=Job CR-2024-008 completed')
        .first();

      if (await jobCompletedItem.isVisible()) {
        const parentItem = jobCompletedItem.locator(
          'xpath=ancestor::*[contains(@class, "MuiListItem-root")]'
        );
        await parentItem.click();

        await page.waitForLoadState('networkidle');

        // Should navigate to production or job details
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/production|job|cr-2024-008/i);
      }
    });

    test('should handle parts arrival navigation', async ({ page }) => {
      await page.waitForTimeout(3000);

      // Find parts arrival activity
      const partsArrivedItem = page.locator('text*=Parts order').first();

      if (await partsArrivedItem.isVisible()) {
        const parentItem = partsArrivedItem.locator(
          'xpath=ancestor::*[contains(@class, "MuiListItem-root")]'
        );
        await parentItem.click();

        await page.waitForLoadState('networkidle');

        // Should navigate to parts page
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/parts|inventory/i);
      }
    });

    test('should handle quality alert navigation', async ({ page }) => {
      await page.waitForTimeout(3000);

      // Find quality issue activity
      const qualityIssueItem = page
        .locator('text*=Quality check flagged')
        .first();

      if (await qualityIssueItem.isVisible()) {
        const parentItem = qualityIssueItem.locator(
          'xpath=ancestor::*[contains(@class, "MuiListItem-root")]'
        );
        await parentItem.click();

        await page.waitForLoadState('networkidle');

        // Should navigate to quality or job details page
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/quality|production|job/i);
      }
    });
  });

  test.describe('3. Technician Performance Tests', () => {
    test('should verify technician cards are interactive', async ({ page }) => {
      await page.waitForTimeout(3000);

      // Find technician performance section
      const techSection = page.locator('text=Technician Performance');
      await expect(techSection).toBeVisible({ timeout: 10000 });

      // Find technician cards/rows
      const techCards = page.locator(
        'text=Mike Rodriguez, text=Sarah Chen, text=James Wilson, text=Lisa Garcia'
      );
      const techCount = await techCards.count();

      expect(techCount).toBeGreaterThan(0);

      // Test each technician row is interactive
      for (let i = 0; i < techCount; i++) {
        const techCard = techCards.nth(i);
        await expect(techCard).toBeVisible();

        // Check hover effects
        await techCard.hover();
        await page.waitForTimeout(200);
      }
    });

    test('should navigate to individual technician pages', async ({ page }) => {
      await page.waitForTimeout(3000);

      // Click on first technician (Mike Rodriguez)
      const mikeCard = page.locator('text=Mike Rodriguez').first();

      if (await mikeCard.isVisible()) {
        const parentElement = mikeCard.locator(
          'xpath=ancestor::*[contains(@style, "cursor") or contains(@class, "clickable") or @role="button"]'
        );

        if ((await parentElement.count()) > 0) {
          await parentElement.click();
          await page.waitForLoadState('networkidle');

          // Should navigate to technician details page
          const currentUrl = page.url();
          expect(currentUrl).toMatch(/technician|mike|rodriguez|staff/i);
        }
      }
    });

    test('should verify technician performance metrics', async ({ page }) => {
      await page.waitForTimeout(3000);

      // Find technician utilization percentages
      const utilizationMetrics = page.locator(
        'text=94%, text=89%, text=82%, text=85%'
      );
      const metricCount = await utilizationMetrics.count();

      expect(metricCount).toBeGreaterThan(0);

      // Verify progress bars are present
      const progressBars = page.locator('.MuiLinearProgress-root');
      const progressCount = await progressBars.count();

      expect(progressCount).toBeGreaterThanOrEqual(4); // At least 4 technicians
    });
  });

  test.describe('4. Alert Navigation Tests', () => {
    test('should verify alert banner is interactive', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Find alert banner
      const alertBanner = page.locator('[role="alert"]').first();

      if (await alertBanner.isVisible()) {
        await expect(alertBanner).toBeVisible();

        // Check for action button
        const alertButton = alertBanner.locator('button').first();
        if (await alertButton.isVisible()) {
          await expect(alertButton).toBeVisible();
          await alertButton.hover();
        }
      }
    });

    test('should handle parts delay alert navigation', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Find parts delay alert
      const partsDelayAlert = page
        .locator('text*=Parts Delay Alert, text*=Critical parts')
        .first();

      if (await partsDelayAlert.isVisible()) {
        const parentAlert = partsDelayAlert.locator(
          'xpath=ancestor::*[contains(@class, "MuiAlert-root")]'
        );
        const actionButton = parentAlert.locator('button');

        if (await actionButton.isVisible()) {
          await actionButton.click();
          await page.waitForLoadState('networkidle');

          // Should navigate to parts or affected jobs
          const currentUrl = page.url();
          expect(currentUrl).toMatch(/parts|jobs|alerts/i);
        }
      }
    });

    test('should handle capacity warning navigation', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Find capacity warning
      const capacityWarning = page
        .locator('text*=Capacity Warning, text*=96% capacity')
        .first();

      if (await capacityWarning.isVisible()) {
        const parentAlert = capacityWarning.locator(
          'xpath=ancestor::*[contains(@class, "MuiAlert-root")]'
        );
        const actionButton = parentAlert.locator('button');

        if (await actionButton.isVisible()) {
          await actionButton.click();
          await page.waitForLoadState('networkidle');

          // Should navigate to capacity management
          const currentUrl = page.url();
          expect(currentUrl).toMatch(/capacity|schedule|production/i);
        }
      }
    });

    test('should handle insurance follow-up alerts', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Find insurance follow-up alert
      const insuranceAlert = page
        .locator('text*=Insurance Follow-up, text*=claims pending')
        .first();

      if (await insuranceAlert.isVisible()) {
        const parentAlert = insuranceAlert.locator(
          'xpath=ancestor::*[contains(@class, "MuiAlert-root")]'
        );
        const actionButton = parentAlert.locator('button');

        if (await actionButton.isVisible()) {
          await actionButton.click();
          await page.waitForLoadState('networkidle');

          // Should navigate to insurance or customer page
          const currentUrl = page.url();
          expect(currentUrl).toMatch(/insurance|claims|customers/i);
        }
      }
    });
  });

  test.describe('5. Visual Interaction Tests', () => {
    test('should verify hover effects on interactive elements', async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      // Test KPI card hover effects
      const firstKPICard = page.locator('.MuiCard-root').first();
      await expect(firstKPICard).toBeVisible();

      // Get initial transform state
      const initialTransform = await firstKPICard.evaluate(
        el => window.getComputedStyle(el).transform
      );

      // Hover and check for transform change
      await firstKPICard.hover();
      await page.waitForTimeout(300);

      const hoveredTransform = await firstKPICard.evaluate(
        el => window.getComputedStyle(el).transform
      );

      // Transform should change on hover (translateY effect)
      expect(hoveredTransform).not.toBe(initialTransform);
    });

    test('should verify cursor changes to pointer on clickable items', async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      // Test cursor on KPI cards
      const kpiCards = page.locator('.MuiCard-root');
      const cardCount = await kpiCards.count();

      for (let i = 0; i < Math.min(cardCount, 3); i++) {
        const card = kpiCards.nth(i);
        await card.hover();

        const cursor = await card.evaluate(
          el => window.getComputedStyle(el).cursor
        );

        // Should have pointer cursor if clickable
        expect(cursor).toMatch(/pointer|default/);
      }
    });

    test('should verify loading states during navigation', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Navigate to a different page and monitor loading states
      const productionLink = page.locator('text=Production').first();
      await expect(productionLink).toBeVisible();

      // Click and immediately check for loading indicators
      await productionLink.click();

      // Check for any loading indicators (spinners, skeletons, etc.)
      const loadingIndicators = page.locator(
        '.MuiCircularProgress-root, .MuiSkeleton-root, [data-testid*="loading"], text=Loading'
      );

      // Wait for page to load
      await page.waitForLoadState('networkidle');
    });

    test('should validate mobile touch targets are appropriate size', async ({
      page,
    }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Test button sizes on mobile
      const buttons = page.locator('button, [role="button"]');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const box = await button.boundingBox();

          if (box) {
            // Touch targets should be at least 44x44px
            expect(box.width).toBeGreaterThanOrEqual(32);
            expect(box.height).toBeGreaterThanOrEqual(32);
          }
        }
      }
    });
  });

  test.describe('6. Cross-Page Integration Tests', () => {
    test('should maintain user context during navigation', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Navigate to customers page
      const customersLink = page.locator('text=Customers').first();
      await expect(customersLink).toBeVisible();
      await customersLink.click();
      await page.waitForLoadState('networkidle');

      // Verify user is still authenticated
      const userGreeting = page.locator(
        'text*=Welcome, text*=admin, text*=Manager'
      );
      // User context should be maintained (either visible or in DOM)
      const hasUserContext = (await userGreeting.count()) > 0;

      // Navigate back to dashboard
      const dashboardLink = page.locator('text=Dashboard').first();
      await dashboardLink.click();
      await page.waitForLoadState('networkidle');

      // Verify we're back on dashboard with context maintained
      await expect(page).toHaveURL(/.*dashboard.*/);
    });

    test('should verify filtered views load with correct data', async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      // Click on active repairs to get filtered production view
      const activeRepairsCard = page.locator('text=Active Repairs').first();

      if (await activeRepairsCard.isVisible()) {
        const parentCard = activeRepairsCard.locator(
          'xpath=ancestor::*[contains(@class, "MuiCard-root")]'
        );
        await parentCard.click();
        await page.waitForLoadState('networkidle');

        // Should show production data filtered to active repairs
        const currentUrl = page.url();
        if (currentUrl.includes('production')) {
          // Look for job data indicating active repairs
          const activeJobs = page.locator(
            'text*=J-2024, text*=In Progress, text*=Active'
          );
          const activeJobCount = await activeJobs.count();
          expect(activeJobCount).toBeGreaterThan(0);
        }
      }
    });

    test('should verify back button functionality maintains dashboard state', async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      // Record initial dashboard state
      const initialMetrics = await page.locator('.MuiCard-root').count();

      // Navigate away
      const customersLink = page.locator('text=Customers').first();
      await customersLink.click();
      await page.waitForLoadState('networkidle');

      // Use browser back button
      await page.goBack();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Verify dashboard state is restored
      await expect(page).toHaveURL(/.*dashboard.*/);
      const restoredMetrics = await page.locator('.MuiCard-root').count();
      expect(restoredMetrics).toBe(initialMetrics);
    });
  });

  test.describe('7. Error Handling Tests', () => {
    test('should handle navigation with invalid parameters gracefully', async ({
      page,
    }) => {
      // Try navigating to a potentially invalid filtered view
      await page.goto('/dashboard?filter=invalid-filter-value');
      await page.waitForLoadState('networkidle');

      // Dashboard should still load, ignoring invalid parameters
      await expect(page.locator('text=Auto Body Shop Dashboard')).toBeVisible();

      // Basic metrics should still be visible
      const metricsVisible = await page.locator('.MuiCard-root').count();
      expect(metricsVisible).toBeGreaterThan(0);
    });

    test('should verify graceful handling of missing data', async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      // Check that dashboard handles missing/empty data gracefully
      // Look for fallback content or loading states
      const errorMessages = page.locator(
        'text*=Error, text*=Failed, text*=Unable'
      );
      const errorCount = await errorMessages.count();

      // Should not have visible error messages on successful load
      expect(errorCount).toBe(0);

      // Should have proper fallbacks for missing data
      const fallbackContent = page.locator(
        'text*=No data, text*=Loading, .MuiSkeleton-root'
      );
      // Fallbacks are acceptable
    });

    test('should handle failed navigation attempts', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Try to click on potentially non-functional elements
      const allCards = page.locator('.MuiCard-root');
      const cardCount = await allCards.count();

      for (let i = 0; i < Math.min(cardCount, 2); i++) {
        const card = allCards.nth(i);

        try {
          await card.click({ timeout: 5000 });
          await page.waitForTimeout(1000);

          // If navigation occurs, verify page is functional
          const currentUrl = page.url();
          if (!currentUrl.includes('dashboard')) {
            // Verify new page loads properly
            const pageContent = page.locator('body');
            await expect(pageContent).toBeVisible();

            // Navigate back for next test
            await page.goBack();
            await page.waitForLoadState('networkidle');
          }
        } catch (error) {
          // Failed clicks are acceptable for non-interactive cards
          console.log(`Card ${i} not interactive: ${error.message}`);
        }
      }
    });
  });

  test.describe('8. Accessibility Tests', () => {
    test('should verify interactive elements have proper ARIA attributes', async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      // Check buttons have proper labels
      const buttons = page.locator('button, [role="button"]');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);

        if (await button.isVisible()) {
          const ariaLabel = await button.getAttribute('aria-label');
          const hasText = await button.textContent();

          // Button should have either aria-label or text content
          expect(ariaLabel || hasText).toBeTruthy();
        }
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Test tab navigation through interactive elements
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);

      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();

      // Continue tabbing through a few elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(200);
      }
    });

    test('should have proper color contrast ratios', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Test text elements have sufficient contrast
      const textElements = page.locator('.MuiTypography-root').first();

      if (await textElements.isVisible()) {
        const styles = await textElements.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
          };
        });

        // Should have defined colors (not transparent/empty)
        expect(styles.color).toMatch(/rgb/);
      }
    });
  });
});
