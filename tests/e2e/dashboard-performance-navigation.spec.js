import { test, expect } from '@playwright/test';

test.describe('CollisionOS Dashboard Performance Navigation', () => {
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

  test.describe('Navigation Performance Metrics', () => {
    test('should measure KPI card interaction response time', async ({ page }) => {
      await page.waitForTimeout(2000);

      const performanceMetrics = [];
      const cards = page.locator('.MuiCard-root');
      const cardCount = await cards.count();

      // Test first 6 cards for performance
      for (let i = 0; i < Math.min(cardCount, 6); i++) {
        const card = cards.nth(i);
        if (await card.isVisible()) {
          // Measure hover response time
          const hoverStartTime = performance.now();
          await card.hover();
          await page.waitForTimeout(50); // Allow hover effects to apply
          const hoverEndTime = performance.now();
          
          const hoverTime = hoverEndTime - hoverStartTime;
          performanceMetrics.push({ action: `card-${i}-hover`, time: hoverTime });
          
          // Hover effects should be responsive (< 200ms)
          expect(hoverTime).toBeLessThan(200);
          
          // Measure click response time
          const clickStartTime = performance.now();
          await card.click({ timeout: 2000 });
          const clickEndTime = performance.now();
          
          const clickTime = clickEndTime - clickStartTime;
          performanceMetrics.push({ action: `card-${i}-click`, time: clickTime });
          
          // Click interactions should be fast (< 300ms)
          expect(clickTime).toBeLessThan(300);
          
          // Return to dashboard if navigation occurred
          const currentUrl = page.url();
          if (!currentUrl.includes('dashboard')) {
            await page.goBack();
            await page.waitForLoadState('networkidle');
          }
        }
      }

      console.log('Performance Metrics:', performanceMetrics);
    });

    test('should measure activity feed scroll performance', async ({ page }) => {
      await page.waitForTimeout(3000);

      const activityFeed = page.locator('text=Real-time Activity Feed');
      if (await activityFeed.isVisible()) {
        const feedContainer = activityFeed.locator('xpath=ancestor::*[contains(@class, "MuiPaper-root")]');
        
        // Measure scroll performance
        const scrollStartTime = performance.now();
        
        // Perform multiple scroll operations
        for (let i = 0; i < 5; i++) {
          await feedContainer.evaluate(el => el.scrollTop += 50);
          await page.waitForTimeout(10);
        }
        
        const scrollEndTime = performance.now();
        const scrollTime = scrollEndTime - scrollStartTime;
        
        // Scrolling should be smooth and fast
        expect(scrollTime).toBeLessThan(100);
        
        // Feed should remain responsive during scrolling
        await expect(activityFeed).toBeVisible();
      }
    });

    test('should measure dashboard re-render performance during navigation', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Measure initial render time
      const initialRenderStart = performance.now();
      await page.reload();
      await page.waitForSelector('text=Auto Body Shop Dashboard', { timeout: 10000 });
      await page.waitForLoadState('networkidle');
      const initialRenderEnd = performance.now();
      
      const initialRenderTime = initialRenderEnd - initialRenderStart;
      expect(initialRenderTime).toBeLessThan(5000); // 5 seconds max
      
      // Measure navigation and return performance
      const navStartTime = performance.now();
      
      // Navigate away
      const customersLink = page.locator('text=Customers').first();
      await customersLink.click();
      await page.waitForLoadState('networkidle');
      
      // Navigate back
      const dashboardLink = page.locator('text=Dashboard').first();
      await dashboardLink.click();
      await page.waitForSelector('text=Auto Body Shop Dashboard');
      await page.waitForLoadState('networkidle');
      
      const navEndTime = performance.now();
      const navigationTime = navEndTime - navStartTime;
      
      // Navigation round trip should be fast
      expect(navigationTime).toBeLessThan(3000); // 3 seconds max
    });

    test('should monitor memory usage during intensive interactions', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Get initial memory baseline
      const initialMemory = await page.evaluate(() => {
        return performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize
        } : null;
      });

      // Perform intensive interactions
      const cards = page.locator('.MuiCard-root');
      const cardCount = await cards.count();

      // Hover over all cards multiple times
      for (let round = 0; round < 3; round++) {
        for (let i = 0; i < cardCount; i++) {
          const card = cards.nth(i);
          if (await card.isVisible()) {
            await card.hover();
            await page.waitForTimeout(50);
          }
        }
      }

      // Check memory after interactions
      const finalMemory = await page.evaluate(() => {
        return performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize
        } : null;
      });

      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
        const memoryIncreasePercent = (memoryIncrease / initialMemory.usedJSHeapSize) * 100;
        
        // Memory usage shouldn't increase dramatically
        expect(memoryIncreasePercent).toBeLessThan(50); // Less than 50% increase
        
        console.log(`Memory usage increased by ${memoryIncreasePercent.toFixed(2)}%`);
      }
    });
  });

  test.describe('Network Performance Tests', () => {
    test('should handle slow network conditions gracefully', async ({ page }) => {
      // Simulate slow network
      await page.context().addInitScript(() => {
        // Add artificial delay to network requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
          return originalFetch(...args);
        };
      });

      const slowNetworkStartTime = performance.now();
      
      // Reload dashboard with slow network
      await page.reload();
      await page.waitForSelector('text=Auto Body Shop Dashboard', { timeout: 15000 });
      await page.waitForLoadState('networkidle');
      
      const slowNetworkEndTime = performance.now();
      const loadTime = slowNetworkEndTime - slowNetworkStartTime;
      
      // Should still load in reasonable time despite slow network
      expect(loadTime).toBeLessThan(15000); // 15 seconds max with slow network
      
      // All key metrics should be visible
      const metricsCount = await page.locator('.MuiCard-root').count();
      expect(metricsCount).toBeGreaterThan(0);
    });

    test('should optimize repeated navigation patterns', async ({ page }) => {
      await page.waitForTimeout(2000);

      const navigationTimes = [];

      // Perform repeated navigation pattern (dashboard -> customers -> dashboard)
      for (let i = 0; i < 3; i++) {
        const navStartTime = performance.now();
        
        // Navigate to customers
        const customersLink = page.locator('text=Customers').first();
        await customersLink.click();
        await page.waitForLoadState('networkidle');
        
        // Navigate back to dashboard
        const dashboardLink = page.locator('text=Dashboard').first();
        await dashboardLink.click();
        await page.waitForSelector('text=Auto Body Shop Dashboard');
        await page.waitForLoadState('networkidle');
        
        const navEndTime = performance.now();
        const navTime = navEndTime - navStartTime;
        navigationTimes.push(navTime);
      }

      // Navigation should get faster with caching/optimization
      const avgTime = navigationTimes.reduce((a, b) => a + b) / navigationTimes.length;
      expect(avgTime).toBeLessThan(4000); // Average should be reasonable
      
      // Later navigations should not be significantly slower
      const firstNavTime = navigationTimes[0];
      const lastNavTime = navigationTimes[navigationTimes.length - 1];
      expect(lastNavTime).toBeLessThan(firstNavTime * 1.5); // Not more than 50% slower
      
      console.log('Navigation times:', navigationTimes);
    });

    test('should handle concurrent navigation requests', async ({ page, context }) => {
      await page.waitForTimeout(2000);

      // Open multiple tabs/pages
      const page2 = await context.newPage();
      
      // Login to second page
      await page2.goto('/login');
      await page2.waitForLoadState('networkidle');
      await page2.fill('input[placeholder="Enter username"]', 'admin');
      await page2.fill('input[placeholder="Enter password"]', 'admin123');
      await page2.click('button:has-text("Sign In")', { force: true });
      await page2.waitForURL(/.*\/dashboard/, { timeout: 15000 });
      
      // Perform concurrent navigation on both pages
      const concurrentStartTime = performance.now();
      
      const [nav1, nav2] = await Promise.all([
        page.locator('text=Customers').first().click().then(() => page.waitForLoadState('networkidle')),
        page2.locator('text=Production').first().click().then(() => page2.waitForLoadState('networkidle'))
      ]);
      
      const concurrentEndTime = performance.now();
      const concurrentTime = concurrentEndTime - concurrentStartTime;
      
      // Concurrent navigation should complete in reasonable time
      expect(concurrentTime).toBeLessThan(8000); // 8 seconds max
      
      // Both pages should have navigated successfully
      expect(page.url()).toMatch(/customers/i);
      expect(page2.url()).toMatch(/production/i);
      
      await page2.close();
    });
  });

  test.describe('Resource Usage Tests', () => {
    test('should monitor CPU usage during animations', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Start CPU monitoring
      const cpuStartTime = process.hrtime();
      
      // Trigger multiple hover animations simultaneously
      const cards = page.locator('.MuiCard-root');
      const cardCount = await cards.count();
      
      // Hover over multiple cards rapidly to stress animations
      for (let i = 0; i < Math.min(cardCount, 8); i++) {
        const card = cards.nth(i);
        if (await card.isVisible()) {
          await card.hover();
          // Don't wait - create animation stress
        }
      }
      
      // Allow animations to complete
      await page.waitForTimeout(1000);
      
      const cpuEndTime = process.hrtime(cpuStartTime);
      const cpuTimeMs = cpuEndTime[0] * 1000 + cpuEndTime[1] / 1000000;
      
      // Animations should not cause excessive CPU usage
      expect(cpuTimeMs).toBeLessThan(2000); // 2 seconds max CPU time
      
      // Page should remain responsive
      await expect(page.locator('text=Auto Body Shop Dashboard')).toBeVisible();
    });

    test('should optimize image and asset loading', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Monitor network requests
      const resourceSizes = [];
      let totalResourceSize = 0;

      page.on('response', response => {
        const contentLength = response.headers()['content-length'];
        if (contentLength) {
          const size = parseInt(contentLength);
          resourceSizes.push({ url: response.url(), size });
          totalResourceSize += size;
        }
      });

      // Trigger resource loading by navigating and interacting
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Interact with cards to potentially load additional assets
      const cards = page.locator('.MuiCard-root');
      const cardCount = await cards.count();
      
      for (let i = 0; i < Math.min(cardCount, 4); i++) {
        const card = cards.nth(i);
        if (await card.isVisible()) {
          await card.hover();
          await page.waitForTimeout(100);
        }
      }

      await page.waitForTimeout(1000);

      // Total resource size should be reasonable for dashboard
      expect(totalResourceSize).toBeLessThan(5 * 1024 * 1024); // Less than 5MB total
      
      console.log(`Total resources loaded: ${(totalResourceSize / 1024).toFixed(2)} KB`);
    });

    test('should handle rapid successive navigation clicks', async ({ page }) => {
      await page.waitForTimeout(2000);

      const rapidClickStartTime = performance.now();
      
      // Perform rapid navigation clicks
      const navigationItems = page.locator('text=Customers, text=Production, text=Dashboard');
      const navCount = await navigationItems.count();
      
      // Click navigation items rapidly
      for (let round = 0; round < 2; round++) {
        for (let i = 0; i < navCount; i++) {
          const navItem = navigationItems.nth(i);
          if (await navItem.isVisible()) {
            await navItem.click({ timeout: 1000 });
            await page.waitForTimeout(100); // Minimal wait
          }
        }
      }
      
      // Wait for final navigation to settle
      await page.waitForLoadState('networkidle');
      
      const rapidClickEndTime = performance.now();
      const rapidClickTime = rapidClickEndTime - rapidClickStartTime;
      
      // Rapid navigation should complete without hanging
      expect(rapidClickTime).toBeLessThan(10000); // 10 seconds max
      
      // Application should remain functional
      const dashboardVisible = await page.locator('text=Auto Body Shop Dashboard, text=Customer Management, text=Production Board').count();
      expect(dashboardVisible).toBeGreaterThan(0);
    });
  });

  test.describe('Stress Testing', () => {
    test('should handle prolonged interaction sessions', async ({ page }) => {
      await page.waitForTimeout(2000);

      const sessionStartTime = performance.now();
      
      // Simulate prolonged user session with various interactions
      const totalInteractions = 50;
      let completedInteractions = 0;
      
      for (let i = 0; i < totalInteractions; i++) {
        try {
          // Vary the interactions
          const interactionType = i % 4;
          
          switch (interactionType) {
            case 0:
              // Hover over cards
              const cards = page.locator('.MuiCard-root');
              const cardCount = await cards.count();
              if (cardCount > 0) {
                const randomCard = cards.nth(Math.floor(Math.random() * cardCount));
                await randomCard.hover({ timeout: 1000 });
              }
              break;
              
            case 1:
              // Scroll activity feed
              const activityFeed = page.locator('text=Real-time Activity Feed');
              if (await activityFeed.isVisible()) {
                const feedContainer = activityFeed.locator('xpath=ancestor::*[contains(@class, "MuiPaper-root")]');
                await feedContainer.evaluate(el => el.scrollTop += 20);
              }
              break;
              
            case 2:
              // Click navigation (with return)
              const navItems = page.locator('text=Customers, text=Production');
              const navCount = await navItems.count();
              if (navCount > 0) {
                const randomNav = navItems.nth(Math.floor(Math.random() * navCount));
                await randomNav.click({ timeout: 2000 });
                await page.waitForTimeout(200);
                await page.goBack();
                await page.waitForTimeout(200);
              }
              break;
              
            case 3:
              // Just wait (simulate reading)
              await page.waitForTimeout(100);
              break;
          }
          
          completedInteractions++;
          
          // Check that page is still responsive every 10 interactions
          if (i % 10 === 0) {
            await expect(page.locator('text=Auto Body Shop Dashboard, text=CollisionOS')).toBeVisible({ timeout: 5000 });
          }
          
        } catch (error) {
          console.log(`Interaction ${i} failed: ${error.message}`);
          // Continue with next interaction
        }
      }
      
      const sessionEndTime = performance.now();
      const sessionTime = sessionEndTime - sessionStartTime;
      
      // Session should complete in reasonable time
      expect(sessionTime).toBeLessThan(60000); // 1 minute max
      
      // Most interactions should succeed
      expect(completedInteractions).toBeGreaterThan(totalInteractions * 0.8); // 80% success rate
      
      // Final state should be stable
      await expect(page.locator('text=Auto Body Shop Dashboard')).toBeVisible();
      
      console.log(`Completed ${completedInteractions}/${totalInteractions} interactions in ${sessionTime.toFixed(0)}ms`);
    });

    test('should maintain performance with multiple dashboard refreshes', async ({ page }) => {
      await page.waitForTimeout(2000);

      const refreshTimes = [];
      const numberOfRefreshes = 5;
      
      for (let i = 0; i < numberOfRefreshes; i++) {
        const refreshStartTime = performance.now();
        
        // Refresh dashboard
        await page.reload();
        await page.waitForSelector('text=Auto Body Shop Dashboard', { timeout: 10000 });
        await page.waitForLoadState('networkidle');
        
        const refreshEndTime = performance.now();
        const refreshTime = refreshEndTime - refreshStartTime;
        refreshTimes.push(refreshTime);
        
        // Verify dashboard loaded properly
        const metricsCount = await page.locator('.MuiCard-root').count();
        expect(metricsCount).toBeGreaterThan(0);
        
        // Small delay between refreshes
        await page.waitForTimeout(500);
      }
      
      // All refreshes should complete in reasonable time
      const maxRefreshTime = Math.max(...refreshTimes);
      const avgRefreshTime = refreshTimes.reduce((a, b) => a + b) / refreshTimes.length;
      
      expect(maxRefreshTime).toBeLessThan(8000); // 8 seconds max for any single refresh
      expect(avgRefreshTime).toBeLessThan(6000); // 6 seconds average
      
      // Performance shouldn't degrade significantly over time
      const firstRefresh = refreshTimes[0];
      const lastRefresh = refreshTimes[refreshTimes.length - 1];
      expect(lastRefresh).toBeLessThan(firstRefresh * 2); // Not more than 2x slower
      
      console.log(`Refresh times: ${refreshTimes.map(t => t.toFixed(0)).join('ms, ')}ms`);
    });
  });
});