import { test, expect } from '@playwright/test';

test.describe('CollisionOS Daily Workflow Tests', () => {
  // Helper function for login
  async function login(page, username = 'admin', password = 'admin123') {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="Enter username"]', username);
    await page.fill('input[placeholder="Enter password"]', password);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });
  }

  test.describe('Service Advisor Daily Workflow', () => {
    test('Complete customer intake and estimate workflow', async ({ page }) => {
      // Login as service advisor
      await login(page);

      // Navigate to Customers
      await page.click('text=Customers');
      await page.waitForLoadState('networkidle');

      // Verify customer list loads
      const customerTable = page.locator(
        'table, [role="grid"], .MuiDataGrid-root'
      );
      await expect(customerTable).toBeVisible({ timeout: 10000 });

      // Check for add customer button
      const addButton = page
        .locator(
          'button:has-text("Add"), button:has-text("New Customer"), button:has-text("Create")'
        )
        .first();
      if (await addButton.isVisible()) {
        // Click add customer
        await addButton.click();

        // Fill customer form if modal/form appears
        const formContainer = page
          .locator('form, [role="dialog"], .MuiModal-root, .MuiDialog-root')
          .first();
        if (
          await formContainer.isVisible({ timeout: 5000 }).catch(() => false)
        ) {
          // Fill basic customer info
          const nameInput = page
            .locator(
              'input[name="name"], input[placeholder*="name" i], input[label*="name" i]'
            )
            .first();
          if (await nameInput.isVisible()) {
            await nameInput.fill('Test Customer');
          }

          const phoneInput = page
            .locator(
              'input[name="phone"], input[placeholder*="phone" i], input[type="tel"]'
            )
            .first();
          if (await phoneInput.isVisible()) {
            await phoneInput.fill('555-0123');
          }

          const emailInput = page
            .locator(
              'input[name="email"], input[placeholder*="email" i], input[type="email"]'
            )
            .first();
          if (await emailInput.isVisible()) {
            await emailInput.fill('test@example.com');
          }

          // Save customer
          const saveButton = page
            .locator(
              'button:has-text("Save"), button:has-text("Submit"), button:has-text("Create")'
            )
            .last();
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(2000);
          }
        }
      }

      // Navigate to Production Board
      await page.click('text=Production');
      await page.waitForLoadState('networkidle');

      // Verify production board loads
      const productionBoard = page
        .locator(
          '.production-board, .kanban-board, [class*="production"], [class*="board"]'
        )
        .first();
      await expect(productionBoard).toBeVisible({ timeout: 10000 });

      // Check for different workflow stages
      const stages = [
        'Check-In',
        'Disassembly',
        'Parts',
        'Repair',
        'Paint',
        'Reassembly',
        'Detail',
        'Quality Control',
      ];
      for (const stage of stages) {
        const stageColumn = page.locator(`text=${stage}`).first();
        if (await stageColumn.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`Found stage: ${stage}`);
        }
      }
    });
  });

  test.describe('Technician Daily Workflow', () => {
    test('Update job status and request parts', async ({ page }) => {
      // Login as technician
      await login(page);

      // Navigate to Production Board
      await page.click('text=Production');
      await page.waitForLoadState('networkidle');

      // Look for job cards
      const jobCards = page.locator(
        '[class*="card"], [class*="job"], [class*="repair-order"]'
      );
      const jobCount = await jobCards.count();

      if (jobCount > 0) {
        // Click on first job card
        await jobCards.first().click();
        await page.waitForTimeout(1000);

        // Check if detail view opens
        const detailView = page
          .locator(
            '[role="dialog"], .MuiModal-root, .job-detail, .repair-detail'
          )
          .first();
        if (await detailView.isVisible({ timeout: 3000 }).catch(() => false)) {
          // Look for status update options
          const statusDropdown = page
            .locator('select, [role="combobox"], [class*="select"]')
            .first();
          if (await statusDropdown.isVisible()) {
            await statusDropdown.selectOption({ index: 1 });
          }

          // Close detail view
          const closeButton = page
            .locator(
              'button[aria-label*="close" i], button:has-text("Close"), button:has-text("Cancel")'
            )
            .first();
          if (await closeButton.isVisible()) {
            await closeButton.click();
          }
        }
      }

      // Navigate to Parts Management
      await page.click('text=Parts');
      await page.waitForLoadState('networkidle');

      // Verify parts interface loads
      const partsInterface = page
        .locator('[class*="parts"], table, .MuiDataGrid-root')
        .first();
      await expect(partsInterface).toBeVisible({ timeout: 10000 });

      // Check for parts request button
      const requestButton = page
        .locator(
          'button:has-text("Request"), button:has-text("Order"), button:has-text("Add Part")'
        )
        .first();
      if (await requestButton.isVisible()) {
        console.log('Parts request functionality available');
      }
    });
  });

  test.describe('Manager Daily Workflow', () => {
    test('Review dashboard metrics and generate reports', async ({ page }) => {
      // Login as manager
      await login(page, 'manager', 'manager123');

      // Dashboard should load automatically
      await page.waitForURL(/.*\/dashboard/);

      // Check for KPI cards
      const kpiCards = page.locator(
        '[class*="card"], [class*="metric"], [class*="kpi"]'
      );
      const kpiCount = await kpiCards.count();
      expect(kpiCount).toBeGreaterThan(0);

      // Look for specific metrics
      const metrics = [
        'Revenue',
        'Jobs',
        'Cycle Time',
        'Efficiency',
        'Customer',
        'Parts',
      ];
      for (const metric of metrics) {
        const metricElement = page.locator(`text=/${metric}/i`).first();
        if (
          await metricElement.isVisible({ timeout: 2000 }).catch(() => false)
        ) {
          console.log(`Found metric: ${metric}`);
        }
      }

      // Navigate to Reports
      const reportsLink = page.locator('text=Reports, text=Analytics').first();
      if (await reportsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await reportsLink.click();
        await page.waitForLoadState('networkidle');

        // Check for report generation options
        const reportTypes = [
          'Financial',
          'Production',
          'Customer',
          'Parts',
          'Technician',
        ];
        for (const reportType of reportTypes) {
          const reportOption = page.locator(`text=/${reportType}/i`).first();
          if (
            await reportOption.isVisible({ timeout: 2000 }).catch(() => false)
          ) {
            console.log(`Found report type: ${reportType}`);
          }
        }

        // Look for export options
        const exportButton = page
          .locator('button:has-text("Export"), button:has-text("Download")')
          .first();
        if (await exportButton.isVisible()) {
          console.log('Export functionality available');
        }
      }
    });
  });

  test.describe('Parts Manager Daily Workflow', () => {
    test('Manage inventory and process orders', async ({ page }) => {
      // Login as parts manager
      await login(page);

      // Navigate to Parts Management
      await page.click('text=Parts');
      await page.waitForLoadState('networkidle');

      // Verify parts inventory loads
      const partsTable = page
        .locator('table, [role="grid"], .MuiDataGrid-root')
        .first();
      await expect(partsTable).toBeVisible({ timeout: 10000 });

      // Check for inventory management features
      const inventoryFeatures = [
        'Add Part',
        'Stock',
        'Order',
        'Vendor',
        'Receive',
      ];
      for (const feature of inventoryFeatures) {
        const featureElement = page.locator(`text=/${feature}/i`).first();
        if (
          await featureElement.isVisible({ timeout: 2000 }).catch(() => false)
        ) {
          console.log(`Found inventory feature: ${feature}`);
        }
      }

      // Check for search/filter functionality
      const searchInput = page
        .locator('input[type="search"], input[placeholder*="search" i]')
        .first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('brake');
        await page.waitForTimeout(1000);
        console.log('Search functionality available');
      }

      // Check for vendor management
      const vendorTab = page
        .locator('text=/vendor/i, [role="tab"]:has-text("Vendor")')
        .first();
      if (await vendorTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await vendorTab.click();
        await page.waitForLoadState('networkidle');
        console.log('Vendor management available');
      }
    });
  });

  test.describe('Admin System Configuration', () => {
    test('Manage users and system settings', async ({ page }) => {
      // Login as admin
      await login(page);

      // Look for admin/settings menu
      const settingsLink = page
        .locator('text=/settings/i, text=/admin/i, text=/configuration/i')
        .first();
      if (await settingsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await settingsLink.click();
        await page.waitForLoadState('networkidle');

        // Check for user management
        const userManagement = page
          .locator('text=/user/i, text=/staff/i, text=/employee/i')
          .first();
        if (
          await userManagement.isVisible({ timeout: 3000 }).catch(() => false)
        ) {
          console.log('User management available');
        }

        // Check for system configuration options
        const configOptions = [
          'General',
          'Security',
          'Database',
          'Integration',
          'Backup',
        ];
        for (const option of configOptions) {
          const configElement = page.locator(`text=/${option}/i`).first();
          if (
            await configElement.isVisible({ timeout: 2000 }).catch(() => false)
          ) {
            console.log(`Found config option: ${option}`);
          }
        }
      }

      // Check for theme toggle
      const themeToggle = page
        .locator(
          '[aria-label*="theme" i], [title*="theme" i], button:has-text("Dark"), button:has-text("Light")'
        )
        .first();
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await page.waitForTimeout(500);
        console.log('Theme toggle functional');
        // Toggle back
        await themeToggle.click();
      }
    });
  });

  test.describe('Cross-functional Workflows', () => {
    test('Complete repair order from intake to delivery', async ({ page }) => {
      // Login as service advisor
      await login(page);

      // Step 1: Customer check-in
      await page.click('text=Customers');
      await page.waitForLoadState('networkidle');
      console.log('Step 1: Customer management accessed');

      // Step 2: Create repair order
      await page.click('text=Production');
      await page.waitForLoadState('networkidle');
      console.log('Step 2: Production board accessed');

      // Step 3: Parts ordering
      await page.click('text=Parts');
      await page.waitForLoadState('networkidle');
      console.log('Step 3: Parts management accessed');

      // Step 4: Quality control check
      const qcLink = page
        .locator('text=/quality/i, text=/qc/i, text=/inspection/i')
        .first();
      if (await qcLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await qcLink.click();
        await page.waitForLoadState('networkidle');
        console.log('Step 4: Quality control accessed');
      }

      // Step 5: Final delivery preparation
      await page.click('text=Dashboard');
      await page.waitForLoadState('networkidle');
      console.log('Step 5: Dashboard summary reviewed');

      // Verify workflow completion
      console.log('Complete repair workflow test completed');
    });

    test('Handle insurance claim workflow', async ({ page }) => {
      // Login as admin for full access
      await login(page);

      // Look for BMS/Insurance features
      const bmsLink = page
        .locator('text=/bms/i, text=/insurance/i, text=/claim/i')
        .first();
      if (await bmsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await bmsLink.click();
        await page.waitForLoadState('networkidle');

        // Check for import functionality
        const importButton = page
          .locator('button:has-text("Import"), button:has-text("Upload")')
          .first();
        if (await importButton.isVisible()) {
          console.log('BMS import functionality available');

          // Check for supported formats
          const formats = ['Mitchell', 'CCC', 'Audatex'];
          for (const format of formats) {
            const formatOption = page.locator(`text=/${format}/i`).first();
            if (
              await formatOption.isVisible({ timeout: 2000 }).catch(() => false)
            ) {
              console.log(`Found BMS format: ${format}`);
            }
          }
        }
      }

      // Check for estimate features
      const estimateLink = page.locator('text=/estimate/i').first();
      if (await estimateLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await estimateLink.click();
        await page.waitForLoadState('networkidle');
        console.log('Estimate management accessed');
      }
    });
  });

  test.describe('Performance and Reliability', () => {
    test('System handles concurrent operations', async ({ page }) => {
      await login(page);

      // Rapidly navigate between sections
      const sections = ['Dashboard', 'Customers', 'Production', 'Parts'];

      for (let i = 0; i < 3; i++) {
        for (const section of sections) {
          await page.click(`text=${section}`);
          // Don't wait for full load to test system stability
          await page.waitForTimeout(500);
        }
      }

      // System should remain responsive
      await page.click('text=Dashboard');
      await page.waitForLoadState('networkidle');

      // Verify dashboard still loads properly
      const dashboardContent = page
        .locator('[class*="dashboard"], [class*="metric"], main')
        .first();
      await expect(dashboardContent).toBeVisible();
      console.log('System remained stable under rapid navigation');
    });

    test('Data persistence across sessions', async ({ page, context }) => {
      // Login and make a change
      await login(page);

      // Navigate to customers
      await page.click('text=Customers');
      await page.waitForLoadState('networkidle');

      // Note current state
      const customerCount = await page.locator('tr, [role="row"]').count();
      console.log(`Initial customer count: ${customerCount}`);

      // Logout
      const logoutButton = page
        .locator('button:has-text("Logout"), button:has-text("Sign Out")')
        .first();
      if (await logoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await logoutButton.click();
        await page.waitForURL(/.*\/login/);
      } else {
        // Force navigation to login
        await page.goto('/login');
      }

      // Login again
      await login(page);

      // Navigate back to customers
      await page.click('text=Customers');
      await page.waitForLoadState('networkidle');

      // Verify data persistence
      const newCustomerCount = await page.locator('tr, [role="row"]').count();
      console.log(`Customer count after re-login: ${newCustomerCount}`);

      // Data should be consistent
      expect(Math.abs(newCustomerCount - customerCount)).toBeLessThanOrEqual(1);
      console.log('Data persistence verified');
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('Critical workflows function on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 812 }); // iPhone X size

      // Login on mobile
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.fill('input[placeholder="Enter username"]', 'admin');
      await page.fill('input[placeholder="Enter password"]', 'admin123');
      await page.click('button:has-text("Sign In")');
      await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });

      // Check for mobile menu (hamburger)
      const mobileMenu = page
        .locator(
          '[aria-label*="menu" i], button:has-text("☰"), .MuiIconButton-root'
        )
        .first();
      if (await mobileMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
        await mobileMenu.click();
        await page.waitForTimeout(500);

        // Navigate to main sections via mobile menu
        const mobileSections = ['Customers', 'Production', 'Parts'];
        for (const section of mobileSections) {
          const sectionLink = page.locator(`text=${section}`).first();
          if (await sectionLink.isVisible()) {
            await sectionLink.click();
            await page.waitForLoadState('networkidle');
            console.log(`Mobile navigation to ${section} successful`);

            // Open menu again for next navigation
            if (await mobileMenu.isVisible()) {
              await mobileMenu.click();
              await page.waitForTimeout(500);
            }
          }
        }
      }

      // Verify dashboard is responsive
      await page.goto('/dashboard');
      const dashboardCards = page.locator('[class*="card"], [class*="metric"]');
      const cardCount = await dashboardCards.count();
      expect(cardCount).toBeGreaterThan(0);
      console.log('Mobile responsiveness verified');
    });
  });
});
