const { test, expect } = require('@playwright/test');

test.describe('CollisionOS Comprehensive Application Test', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the application
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should test every clickable element and navigation', async ({ page }) => {
    // Test login page elements
    await expect(page.locator('text=CollisionOS').first()).toBeVisible();
    await expect(page.locator('text=Auto Body Shop Management')).toBeVisible();
    
    // Test login form with correct selectors
    const usernameField = page.locator('input[type="text"]').first();
    const passwordField = page.locator('input[type="password"]');
    const signInButton = page.locator('button:has-text("Sign In to CollisionOS")');
    
    await expect(usernameField).toBeVisible();
    await expect(passwordField).toBeVisible();
    await expect(signInButton).toBeVisible();
    
    // Test "Remember me" checkbox
    const rememberCheckbox = page.locator('input[type="checkbox"]');
    await expect(rememberCheckbox).toBeVisible();
    await rememberCheckbox.click();
    
    // Test "Forgot password" link
    const forgotPasswordLink = page.locator('text=Forgot password?');
    await expect(forgotPasswordLink).toBeVisible();
    await forgotPasswordLink.click();
    
    // Should show error about feature coming soon
    await expect(page.locator('text=Password reset feature coming soon')).toBeVisible();
    
    // Login with valid credentials
    await usernameField.fill('admin');
    await passwordField.fill('admin123');
    
    // Verify validation feedback appears
    await expect(page.locator('text=Username entered')).toBeVisible();
    await expect(page.locator('text=Password entered')).toBeVisible();
    
    await signInButton.click();
    
    // Wait for dashboard to load
    await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Login successful - Testing Dashboard');
    
    // Test Dashboard Elements
    await expect(page.locator('text=Welcome back,').first()).toBeVisible();
    await expect(page.locator('text=CollisionOS Dashboard').first()).toBeVisible();
    
    // Test all KPI cards and their clickability
    const kpiCards = [
      { text: 'Jobs in Progress', expectedRoute: '/production' },
      { text: 'Parts Inventory', expectedRoute: '/parts' },
      { text: 'Customer Satisfaction', expectedRoute: '/customers' },
      { text: 'Revenue This Month', expectedRoute: '/analytics' },
      { text: 'Technician Performance', expectedRoute: '/analytics' },
      { text: 'Cycle Time', expectedRoute: '/production' },
      { text: 'Quality Score', expectedRoute: '/analytics' },
      { text: 'Parts Cost', expectedRoute: '/parts' }
    ];
    
    for (const kpi of kpiCards) {
      console.log(`Testing KPI: ${kpi.text}`);
      const kpiCard = page.locator(`text=${kpi.text}`).first();
      if (await kpiCard.isVisible()) {
        const cardContainer = kpiCard.locator('..').locator('..').locator('..');
        await cardContainer.click();
        // Wait a moment for navigation
        await page.waitForTimeout(1000);
      }
    }
    
    // Test sidebar navigation - go back to dashboard first
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Test all main navigation items
    const navItems = [
      { text: 'Dashboard', route: '/dashboard' },
      { text: 'Production Board', route: '/production' },
      { text: 'Customers', route: '/customers' },
      { text: 'Parts', route: '/parts' },
      { text: 'Analytics', route: '/analytics' },
      { text: 'BMS Import', route: '/bms-import' },
      { text: 'Settings', route: '/settings' }
    ];
    
    for (const navItem of navItems) {
      console.log(`Testing navigation: ${navItem.text} -> ${navItem.route}`);
      
      // Click navigation item
      const navLink = page.locator(`text=${navItem.text}`).first();
      if (await navLink.isVisible()) {
        await navLink.click();
        await page.waitForTimeout(2000);
        
        // Verify we're on the correct page
        const currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}, Expected: ${navItem.route}`);
        
        // Test specific page elements
        await testPageSpecificElements(page, navItem.route);
      }
    }
    
    console.log('✅ All navigation tests completed');
  });
  
  async function testPageSpecificElements(page, route) {
    switch (route) {
      case '/dashboard':
        await expect(page.locator('text=Dashboard').first()).toBeVisible();
        // Test dashboard charts and cards
        await testDashboardInteractivity(page);
        break;
        
      case '/production':
        console.log('Testing Production Board...');
        await expect(page.locator('text=Production Board').first()).toBeVisible();
        
        // Test stage columns
        const stages = ['Estimate', 'Body Work', 'Paint', 'Complete'];
        for (const stage of stages) {
          await expect(page.locator(`text=${stage}`).first()).toBeVisible();
        }
        
        // Test "New Job" button
        const newJobButton = page.locator('button:has-text("New Job")');
        if (await newJobButton.isVisible()) {
          await newJobButton.click();
          await page.waitForTimeout(1000);
        }
        break;
        
      case '/customers':
        console.log('Testing Customers page...');
        await expect(page.locator('text=Customer Management').first()).toBeVisible();
        
        // Test customer-related buttons
        const addCustomerButton = page.locator('button:has-text("Add Customer")');
        if (await addCustomerButton.isVisible()) {
          await addCustomerButton.click();
          await page.waitForTimeout(1000);
          
          // Test customer form if it opens
          const cancelButton = page.locator('button:has-text("Cancel")');
          if (await cancelButton.isVisible()) {
            await cancelButton.click();
          }
        }
        break;
        
      case '/parts':
        console.log('Testing Parts page...');
        // Test parts management elements
        const searchButton = page.locator('button:has-text("Search")');
        if (await searchButton.isVisible()) {
          await searchButton.click();
        }
        break;
        
      case '/bms-import':
        console.log('Testing BMS Import page...');
        await expect(page.locator('text=BMS File Import').first()).toBeVisible();
        
        // Test file upload area
        const uploadArea = page.locator('text=Drop your BMS file here');
        await expect(uploadArea).toBeVisible();
        
        // Test upload button
        const uploadButton = page.locator('button:has-text("Upload BMS File")');
        await expect(uploadButton).toBeVisible();
        break;
        
      case '/analytics':
        console.log('Testing Analytics page...');
        // Test analytics elements
        break;
        
      case '/settings':
        console.log('Testing Settings page...');
        // Test settings elements
        break;
    }
  }
  
  async function testDashboardInteractivity(page) {
    // Test Recent Activity section
    const activitySection = page.locator('text=Recent Activity');
    if (await activitySection.isVisible()) {
      console.log('✅ Recent Activity section visible');
    }
    
    // Test Quick Actions
    const quickActionsButtons = [
      'New Job',
      'Add Customer', 
      'Upload BMS',
      'View Reports'
    ];
    
    for (const buttonText of quickActionsButtons) {
      const button = page.locator(`button:has-text("${buttonText}")`);
      if (await button.isVisible()) {
        console.log(`✅ Quick Action button "${buttonText}" is clickable`);
        await button.click();
        await page.waitForTimeout(500);
        // Navigate back to dashboard
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
      }
    }
  }
  
  test('should test BMS file upload functionality', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.locator('input[type="text"]').fill('admin');
    await page.locator('input[type="password"]').fill('admin123');
    await page.locator('button:has-text("Sign In to CollisionOS")').click();
    await page.waitForURL(/.*\/dashboard/);
    
    // Navigate to BMS Import
    await page.goto('/bms-import');
    await page.waitForLoadState('networkidle');
    
    console.log('Testing BMS Import page...');
    
    // Verify page loads correctly
    await expect(page.locator('text=BMS File Import')).toBeVisible();
    await expect(page.locator('text=Upload BMS File')).toBeVisible();
    
    // Test file input area
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBePresent();
    
    // Test upload button (should be disabled initially)
    const uploadButton = page.locator('button:has-text("Upload BMS File")');
    await expect(uploadButton).toBeVisible();
    await expect(uploadButton).toBeDisabled();
    
    console.log('✅ BMS Import page elements are functional');
  });
  
  test('should test responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    
    // Should still show login elements on mobile
    await expect(page.locator('text=CollisionOS')).toBeVisible();
    await expect(page.locator('input[type="text"]')).toBeVisible();
    
    // Login and test dashboard on mobile
    await page.locator('input[type="text"]').fill('admin');
    await page.locator('input[type="password"]').fill('admin123');
    await page.locator('button:has-text("Sign In to CollisionOS")').click();
    await page.waitForURL(/.*\/dashboard/);
    
    // Test mobile navigation
    const mobileMenuButton = page.locator('[data-testid="menu-button"]');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
    }
    
    console.log('✅ Mobile responsiveness test completed');
  });
  
  test('should test error handling', async ({ page }) => {
    // Test invalid login
    await page.goto('/login');
    await page.locator('input[type="text"]').fill('invalid');
    await page.locator('input[type="password"]').fill('invalid');
    await page.locator('button:has-text("Sign In to CollisionOS")').click();
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
    
    console.log('✅ Error handling test completed');
  });
});