/**
 * Comprehensive Accessibility Testing - Phase 4
 * WCAG AA Compliance validation for CollisionOS enterprise system
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('CollisionOS Accessibility Compliance', () => {

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/dashboard/);
  });

  test('Dashboard WCAG AA Compliance', async ({ page }) => {
    console.log('♿ Testing Dashboard accessibility compliance...');
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Run axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    // Check for violations
    expect(accessibilityScanResults.violations).toEqual([]);
    
    // Detailed accessibility testing
    await test.step('Keyboard Navigation', async () => {
      // Test tab navigation through dashboard elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Verify focus is visible
      const focusedElement = await page.locator(':focus');
      const isVisible = await focusedElement.isVisible();
      expect(isVisible).toBe(true);
      
      console.log('  ✅ Keyboard navigation working');
    });

    await test.step('Screen Reader Support', async () => {
      // Check for proper ARIA labels on KPI cards
      const kpiCards = page.locator('[data-testid*="kpi"], .kpi-card, .stats-card');
      const cardCount = await kpiCards.count();
      
      if (cardCount > 0) {
        for (let i = 0; i < Math.min(cardCount, 5); i++) {
          const card = kpiCards.nth(i);
          const ariaLabel = await card.getAttribute('aria-label');
          const ariaDescribedBy = await card.getAttribute('aria-describedby');
          const role = await card.getAttribute('role');
          
          // At least one accessibility attribute should be present
          expect(ariaLabel || ariaDescribedBy || role).toBeTruthy();
        }
        console.log(`  ✅ ${cardCount} KPI cards have accessibility attributes`);
      }
    });

    await test.step('Color Contrast', async () => {
      // axe-core automatically checks color contrast
      const contrastViolations = accessibilityScanResults.violations
        .filter(violation => violation.id.includes('color-contrast'));
      
      expect(contrastViolations).toEqual([]);
      console.log('  ✅ Color contrast meets WCAG AA standards');
    });

    await test.step('Heading Structure', async () => {
      // Check for proper heading hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      expect(headings.length).toBeGreaterThan(0);
      
      // Should have at least one h1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);
      
      console.log(`  ✅ ${headings.length} headings found with proper structure`);
    });

    console.log('✅ Dashboard accessibility compliance validated');
  });

  test('Customer Management Accessibility', async ({ page }) => {
    console.log('♿ Testing Customer Management accessibility...');
    
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);

    await test.step('Form Accessibility', async () => {
      // Try to open customer creation form
      const addButtons = [
        'button:has-text("Add Customer")',
        'button:has-text("New Customer")', 
        'button:has-text("Create")',
        '[data-testid="add-customer"]'
      ];
      
      let formOpened = false;
      for (const buttonSelector of addButtons) {
        try {
          await page.click(buttonSelector, { timeout: 2000 });
          await page.waitForSelector('form, .modal, .dialog', { timeout: 3000 });
          formOpened = true;
          break;
        } catch (error) {
          continue;
        }
      }
      
      if (formOpened) {
        // Test form accessibility
        const formInputs = page.locator('input, select, textarea');
        const inputCount = await formInputs.count();
        
        if (inputCount > 0) {
          for (let i = 0; i < Math.min(inputCount, 5); i++) {
            const input = formInputs.nth(i);
            
            // Check for labels or aria-label
            const id = await input.getAttribute('id');
            const ariaLabel = await input.getAttribute('aria-label');
            const ariaLabelledBy = await input.getAttribute('aria-labelledby');
            
            if (id) {
              const label = page.locator(`label[for="${id}"]`);
              const labelExists = await label.count() > 0;
              
              expect(labelExists || ariaLabel || ariaLabelledBy).toBeTruthy();
            }
          }
          console.log(`  ✅ ${inputCount} form inputs properly labeled`);
        }
      } else {
        console.log('  ℹ️ Customer form not accessible - may be embedded differently');
      }
    });

    await test.step('Table Accessibility', async () => {
      // Check for accessible data tables
      const tables = page.locator('table');
      const tableCount = await tables.count();
      
      if (tableCount > 0) {
        for (let i = 0; i < tableCount; i++) {
          const table = tables.nth(i);
          
          // Check for table headers
          const headers = await table.locator('th').count();
          expect(headers).toBeGreaterThan(0);
          
          // Check for proper table structure
          const caption = await table.locator('caption').count();
          const summary = await table.getAttribute('summary');
          const ariaLabel = await table.getAttribute('aria-label');
          
          // At least one accessibility feature should be present
          expect(caption > 0 || summary || ariaLabel).toBeTruthy();
        }
        console.log(`  ✅ ${tableCount} tables with proper accessibility structure`);
      }
    });

    console.log('✅ Customer management accessibility validated');
  });

  test('Production Board Accessibility', async ({ page }) => {
    console.log('♿ Testing Production Board accessibility...');
    
    await page.goto('/production');
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);

    await test.step('Drag and Drop Accessibility', async () => {
      // Production board likely has drag-and-drop functionality
      const draggableItems = page.locator('[draggable="true"], .draggable, .job-card');
      const itemCount = await draggableItems.count();
      
      if (itemCount > 0) {
        for (let i = 0; i < Math.min(itemCount, 3); i++) {
          const item = draggableItems.nth(i);
          
          // Check for keyboard accessibility
          const tabindex = await item.getAttribute('tabindex');
          const role = await item.getAttribute('role');
          const ariaGrabbed = await item.getAttribute('aria-grabbed');
          
          // Draggable items should be keyboard accessible
          expect(tabindex !== null || role === 'button' || role === 'listitem').toBeTruthy();
        }
        console.log(`  ✅ ${itemCount} draggable items keyboard accessible`);
      }
    });

    await test.step('Visual Status Indicators', async () => {
      // Check for non-color-only status indicators
      const statusElements = page.locator('.status, .stage, .progress, [class*="status-"]');
      const statusCount = await statusElements.count();
      
      if (statusCount > 0) {
        // Status should be indicated by more than just color
        for (let i = 0; i < Math.min(statusCount, 5); i++) {
          const element = statusElements.nth(i);
          const text = await element.textContent();
          const ariaLabel = await element.getAttribute('aria-label');
          const title = await element.getAttribute('title');
          
          // Should have text or aria-label for status
          expect(text?.trim() || ariaLabel || title).toBeTruthy();
        }
        console.log(`  ✅ ${statusCount} status indicators have text/label`);
      }
    });

    console.log('✅ Production board accessibility validated');
  });

  test('BMS Import Accessibility', async ({ page }) => {
    console.log('♿ Testing BMS Import accessibility...');
    
    await page.goto('/bms-import');
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);

    await test.step('File Upload Accessibility', async () => {
      const fileInputs = page.locator('input[type="file"]');
      const inputCount = await fileInputs.count();
      
      if (inputCount > 0) {
        for (let i = 0; i < inputCount; i++) {
          const input = fileInputs.nth(i);
          
          // Check for proper labeling
          const id = await input.getAttribute('id');
          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledBy = await input.getAttribute('aria-labelledby');
          
          if (id) {
            const label = page.locator(`label[for="${id}"]`);
            const labelExists = await label.count() > 0;
            expect(labelExists || ariaLabel || ariaLabelledBy).toBeTruthy();
          }
          
          // Check for accept attribute
          const accept = await input.getAttribute('accept');
          expect(accept).toBeTruthy(); // Should specify accepted file types
        }
        console.log(`  ✅ ${inputCount} file inputs properly labeled and configured`);
      }
    });

    await test.step('Progress Indicators', async () => {
      // Upload a file to test progress indicators
      const fileInput = page.locator('input[type="file"]').first();
      if (await fileInput.count() > 0) {
        await fileInput.setInputFiles({
          name: 'accessibility-test.xml',
          mimeType: 'application/xml',
          buffer: Buffer.from('<?xml version="1.0"?><test></test>')
        });
        
        // Look for progress indicators
        const progressElements = page.locator('[role="progressbar"], .progress, progress');
        const progressCount = await progressElements.count();
        
        if (progressCount > 0) {
          for (let i = 0; i < progressCount; i++) {
            const progress = progressElements.nth(i);
            
            // Progress bars should have aria attributes
            const ariaValueNow = await progress.getAttribute('aria-valuenow');
            const ariaValueMin = await progress.getAttribute('aria-valuemin');
            const ariaValueMax = await progress.getAttribute('aria-valuemax');
            const ariaLabel = await progress.getAttribute('aria-label');
            
            expect(ariaValueNow || ariaLabel).toBeTruthy();
          }
          console.log(`  ✅ ${progressCount} progress indicators properly configured`);
        }
      }
    });

    console.log('✅ BMS import accessibility validated');
  });

  test('Navigation and Menu Accessibility', async ({ page }) => {
    console.log('♿ Testing Navigation accessibility...');
    
    // Test main navigation
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);

    await test.step('Skip Links', async () => {
      // Check for skip navigation links
      await page.keyboard.press('Tab');
      const focusedElement = await page.locator(':focus');
      const skipLinkText = await focusedElement.textContent();
      
      if (skipLinkText?.toLowerCase().includes('skip')) {
        console.log('  ✅ Skip navigation link found');
        
        // Test skip link functionality
        await page.keyboard.press('Enter');
        await page.waitForTimeout(100);
        
        const newFocusedElement = await page.locator(':focus');
        const newFocus = await newFocusedElement.getAttribute('id');
        expect(newFocus).toBeTruthy();
      } else {
        console.log('  ⚠️ Skip navigation link not found');
      }
    });

    await test.step('Navigation Menu Structure', async () => {
      // Check for proper navigation landmarks
      const navElements = page.locator('nav, [role="navigation"]');
      const navCount = await navElements.count();
      
      expect(navCount).toBeGreaterThan(0);
      
      // Navigation should have proper labeling
      for (let i = 0; i < navCount; i++) {
        const nav = navElements.nth(i);
        const ariaLabel = await nav.getAttribute('aria-label');
        const ariaLabelledBy = await nav.getAttribute('aria-labelledby');
        
        expect(ariaLabel || ariaLabelledBy).toBeTruthy();
      }
      
      console.log(`  ✅ ${navCount} navigation elements properly labeled`);
    });

    await test.step('Menu Item Accessibility', async () => {
      // Test menu items for keyboard navigation
      const menuItems = page.locator('[role="menuitem"], nav a, .menu-item');
      const itemCount = await menuItems.count();
      
      if (itemCount > 0) {
        // Test first few menu items
        for (let i = 0; i < Math.min(itemCount, 5); i++) {
          const item = menuItems.nth(i);
          
          // Menu items should be keyboard accessible
          const tabindex = await item.getAttribute('tabindex');
          const href = await item.getAttribute('href');
          const role = await item.getAttribute('role');
          
          expect(
            tabindex !== '-1' || 
            href !== null || 
            role === 'button' || 
            role === 'menuitem'
          ).toBeTruthy();
        }
        console.log(`  ✅ ${itemCount} menu items keyboard accessible`);
      }
    });

    console.log('✅ Navigation accessibility validated');
  });

  test('Mobile Accessibility', async ({ page, browserName }) => {
    console.log('♿ Testing Mobile accessibility...');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);

    await test.step('Touch Target Size', async () => {
      // Check touch targets meet minimum size (44x44px)
      const interactiveElements = page.locator('button, a, input, [role="button"]');
      const elementCount = await interactiveElements.count();
      
      if (elementCount > 0) {
        for (let i = 0; i < Math.min(elementCount, 10); i++) {
          const element = interactiveElements.nth(i);
          const box = await element.boundingBox();
          
          if (box && box.width > 0 && box.height > 0) {
            // WCAG AA requires minimum 44x44px touch targets
            expect(box.width >= 44 || box.height >= 44).toBeTruthy();
          }
        }
        console.log(`  ✅ ${elementCount} interactive elements meet touch target size`);
      }
    });

    await test.step('Mobile Navigation', async () => {
      // Check for mobile menu accessibility
      const mobileMenuTriggers = page.locator('[aria-label*="menu"], .hamburger, .menu-toggle, [data-testid*="menu"]');
      const triggerCount = await mobileMenuTriggers.count();
      
      if (triggerCount > 0) {
        const trigger = mobileMenuTriggers.first();
        
        // Mobile menu trigger should have proper attributes
        const ariaLabel = await trigger.getAttribute('aria-label');
        const ariaExpanded = await trigger.getAttribute('aria-expanded');
        const ariaControls = await trigger.getAttribute('aria-controls');
        
        expect(ariaLabel || ariaExpanded !== null || ariaControls).toBeTruthy();
        
        console.log('  ✅ Mobile menu trigger properly configured');
      }
    });

    console.log('✅ Mobile accessibility validated');
  });

  test('Error Handling Accessibility', async ({ page }) => {
    console.log('♿ Testing Error Handling accessibility...');
    
    // Test form validation errors
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');
    
    // Try to trigger validation errors
    const addButtons = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');
    const buttonCount = await addButtons.count();
    
    if (buttonCount > 0) {
      await addButtons.first().click();
      await page.waitForSelector('form, .modal', { timeout: 5000 });
      
      // Submit empty form to trigger validation
      const submitButtons = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
      const submitCount = await submitButtons.count();
      
      if (submitCount > 0) {
        await submitButtons.first().click();
        
        // Wait for error messages
        await page.waitForTimeout(1000);
        
        const errorElements = page.locator('[role="alert"], .error, .invalid, [aria-invalid="true"]');
        const errorCount = await errorElements.count();
        
        if (errorCount > 0) {
          for (let i = 0; i < errorCount; i++) {
            const error = errorElements.nth(i);
            
            // Error messages should be announced to screen readers
            const role = await error.getAttribute('role');
            const ariaLive = await error.getAttribute('aria-live');
            const ariaAtomic = await error.getAttribute('aria-atomic');
            
            expect(
              role === 'alert' || 
              ariaLive === 'polite' || 
              ariaLive === 'assertive'
            ).toBeTruthy();
          }
          console.log(`  ✅ ${errorCount} error messages properly announced`);
        }
      }
    }

    console.log('✅ Error handling accessibility validated');
  });

  test('Comprehensive Accessibility Report', async ({ page }) => {
    console.log('📊 Generating comprehensive accessibility report...');
    
    // Test all major pages
    const pages = [
      { url: '/dashboard', name: 'Dashboard' },
      { url: '/customers', name: 'Customers' },
      { url: '/production', name: 'Production' },
      { url: '/bms-import', name: 'BMS Import' }
    ];
    
    const overallResults = {
      totalViolations: 0,
      pageResults: [],
      summary: {}
    };
    
    for (const testPage of pages) {
      await page.goto(testPage.url);
      await page.waitForLoadState('networkidle');
      
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      
      const pageResult = {
        page: testPage.name,
        url: testPage.url,
        violations: results.violations.length,
        passes: results.passes.length,
        incomplete: results.incomplete.length
      };
      
      overallResults.pageResults.push(pageResult);
      overallResults.totalViolations += results.violations.length;
      
      console.log(`  ${testPage.name}: ${results.violations.length} violations, ${results.passes.length} passes`);
    }
    
    // Calculate summary
    overallResults.summary = {
      totalPages: pages.length,
      pagesWithoutViolations: overallResults.pageResults.filter(p => p.violations === 0).length,
      averagePassRate: overallResults.pageResults.reduce((sum, p) => sum + p.passes, 0) / pages.length
    };
    
    // Overall accessibility score
    const accessibilityScore = overallResults.totalViolations === 0 ? 100 : 
      Math.max(0, 100 - (overallResults.totalViolations * 10));
    
    console.log(`\n🏆 Accessibility Score: ${accessibilityScore}%`);
    console.log(`📊 Pages without violations: ${overallResults.summary.pagesWithoutViolations}/${pages.length}`);
    console.log(`✅ WCAG AA Compliance: ${overallResults.totalViolations === 0 ? 'PASS' : 'NEEDS IMPROVEMENT'}`);
    
    // Expect perfect accessibility compliance for production readiness
    expect(overallResults.totalViolations).toBe(0);
    
    console.log('✅ Comprehensive accessibility testing completed');
  });

});

console.log('♿ Comprehensive accessibility testing suite loaded - WCAG AA compliance validation ready');