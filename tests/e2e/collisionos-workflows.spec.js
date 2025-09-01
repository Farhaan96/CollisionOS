import { test, expect } from '@playwright/test';

// Test data from our seeded database
const TEST_USERS = {
  admin: { username: 'admin', password: 'admin123', role: 'owner' },
  manager: { username: 'manager', password: 'manager123', role: 'manager' },
  estimator: {
    username: 'estimator',
    password: 'estimator123',
    role: 'estimator',
  },
};

const SEEDED_DATA = {
  shopId: '550e8400-e29b-41d4-a716-446655440001',
  customerIds: [
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440006',
  ],
  jobIds: [
    '550e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440008',
    '550e8400-e29b-41d4-a716-446655440009',
  ],
};

test.describe('CollisionOS End-to-End Workflows', () => {
  let authToken;

  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Authentication & Login', () => {
    test('should display login page with proper styling', async ({ page }) => {
      // Check if we're on the login page
      await expect(page).toHaveURL(/.*\/login/);

      // Verify login form elements are present
      await expect(page.locator('input[placeholder="admin"]')).toBeVisible();
      await expect(page.locator('input[placeholder="admin123"]')).toBeVisible();
      await expect(page.locator('button:has-text("Sign In")')).toBeVisible();

      // Check for CollisionOS branding
      await expect(page.locator('text=CollisionOS')).toBeVisible();

      // Verify password toggle functionality
      const passwordField = page.locator('input[placeholder="admin123"]');
      await expect(passwordField).toHaveAttribute('type', 'password');

      // Try to toggle password visibility
      const eyeIcon = page.locator(
        'button[aria-label="toggle password visibility"]'
      );
      if (await eyeIcon.isVisible()) {
        await eyeIcon.click();
        await expect(passwordField).toHaveAttribute('type', 'text');
      }
    });

    test('should login successfully with admin credentials', async ({
      page,
    }) => {
      // Fill in login form
      await page.fill('input[placeholder="admin"]', TEST_USERS.admin.username);
      await page.fill(
        'input[placeholder="admin123"]',
        TEST_USERS.admin.password
      );

      // Submit form
      await page.click('button:has-text("Sign In")');

      // Wait for navigation to dashboard
      await page.waitForURL(/.*\/dashboard/);

      // Verify we're on the dashboard
      await expect(page).toHaveURL(/.*\/dashboard/);

      // Check for dashboard elements
      await expect(page.locator('text=Dashboard')).toBeVisible();

      // Store auth token for other tests
      authToken = await page.evaluate(() => localStorage.getItem('authToken'));
    });

    test('should show error for invalid credentials', async ({ page }) => {
      // Fill in invalid credentials
      await page.fill('input[placeholder="admin"]', 'invalid');
      await page.fill('input[placeholder="admin123"]', 'invalid');

      // Submit form
      await page.click('button:has-text("Sign In")');

      // Check for error message
      await expect(page.locator('text=Invalid credentials')).toBeVisible();

      // Verify we're still on login page
      await expect(page).toHaveURL(/.*\/login/);
    });

    test('should validate required fields', async ({ page }) => {
      // Try to submit empty form
      await page.click('button:has-text("Sign In")');

      // Check for validation message
      await expect(
        page.locator('text=Please enter both username and password')
      ).toBeVisible();
    });
  });

  test.describe('Dashboard & Navigation', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await page.fill('input[placeholder="admin"]', TEST_USERS.admin.username);
      await page.fill(
        'input[placeholder="admin123"]',
        TEST_USERS.admin.password
      );
      await page.click('button:has-text("Sign In")');
      await page.waitForURL(/.*\/dashboard/);
    });

    test('should display dashboard with key metrics', async ({ page }) => {
      // Check for main dashboard elements
      await expect(page.locator('text=Dashboard')).toBeVisible();

      // Check for KPI cards (these should be present based on seeded data)
      await expect(page.locator('text=Total Jobs')).toBeVisible();
      await expect(page.locator('text=Active Jobs')).toBeVisible();
      await expect(page.locator('text=Completed Jobs')).toBeVisible();
      await expect(page.locator('text=Revenue')).toBeVisible();

      // Check for navigation menu
      await expect(page.locator('text=Customers')).toBeVisible();
      await expect(page.locator('text=Production')).toBeVisible();
      await expect(page.locator('text=Parts')).toBeVisible();
      await expect(page.locator('text=Reports')).toBeVisible();
    });

    test('should navigate to different sections', async ({ page }) => {
      // Navigate to Customers
      await page.click('text=Customers');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Customer Management')).toBeVisible();

      // Navigate to Production
      await page.click('text=Production');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Production Board')).toBeVisible();

      // Navigate to Parts
      await page.click('text=Parts');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Parts Management')).toBeVisible();

      // Navigate back to Dashboard
      await page.click('text=Dashboard');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('should display real-time data from Supabase', async ({ page }) => {
      // Wait for dashboard to load with data
      await page.waitForTimeout(2000);

      // Check that we have some data displayed (from seeded data)
      const jobCount = await page.locator('text=/\\d+/').first().textContent();
      expect(parseInt(jobCount)).toBeGreaterThan(0);

      // Check for customer data
      await page.click('text=Customers');
      await page.waitForLoadState('networkidle');

      // Should see seeded customers
      await expect(page.locator('text=John Doe')).toBeVisible();
      await expect(page.locator('text=Acme Corp')).toBeVisible();
    });
  });

  test.describe('Customer Management', () => {
    test.beforeEach(async ({ page }) => {
      // Login and navigate to customers
      await page.fill('input[placeholder="admin"]', TEST_USERS.admin.username);
      await page.fill(
        'input[placeholder="admin123"]',
        TEST_USERS.admin.password
      );
      await page.click('button:has-text("Sign In")');
      await page.waitForURL(/.*\/dashboard/);

      await page.click('text=Customers');
      await page.waitForLoadState('networkidle');
    });

    test('should display customer list with seeded data', async ({ page }) => {
      // Check for customer management header
      await expect(page.locator('text=Customer Management')).toBeVisible();

      // Check for seeded customers
      await expect(page.locator('text=John Doe')).toBeVisible();
      await expect(page.locator('text=Acme Corp')).toBeVisible();
      await expect(page.locator('text=State Farm Insurance')).toBeVisible();
      await expect(page.locator('text=Sarah Wilson')).toBeVisible();
      await expect(page.locator('text=Mike Johnson')).toBeVisible();

      // Check for customer details
      await expect(page.locator('text=+1-555-0101')).toBeVisible();
      await expect(page.locator('text=john.doe@email.com')).toBeVisible();
    });

    test('should create new customer', async ({ page }) => {
      // Click add customer button
      await page.click('button:has-text("Add Customer")');

      // Fill in customer form
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'Customer');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="phone"]', '+1-555-9999');

      // Select customer type
      await page.selectOption('select[name="customerType"]', 'individual');

      // Submit form
      await page.click('button:has-text("Save")');

      // Wait for success message
      await expect(
        page.locator('text=Customer created successfully')
      ).toBeVisible();

      // Verify customer appears in list
      await expect(page.locator('text=Test Customer')).toBeVisible();
    });

    test('should view customer details', async ({ page }) => {
      // Click on first customer
      await page.click('text=John Doe');

      // Check for customer detail dialog
      await expect(page.locator('text=Customer Details')).toBeVisible();
      await expect(page.locator('text=john.doe@email.com')).toBeVisible();
      await expect(page.locator('text=+1-555-0101')).toBeVisible();

      // Check for customer type
      await expect(page.locator('text=Individual')).toBeVisible();
    });

    test('should search customers', async ({ page }) => {
      // Find search input
      const searchInput = page.locator(
        'input[placeholder*="search" i], input[placeholder*="customer" i]'
      );
      if (await searchInput.isVisible()) {
        await searchInput.fill('John');

        // Should show only John Doe
        await expect(page.locator('text=John Doe')).toBeVisible();
        await expect(page.locator('text=Acme Corp')).not.toBeVisible();
      }
    });
  });

  test.describe('Job Management', () => {
    test.beforeEach(async ({ page }) => {
      // Login and navigate to production
      await page.fill('input[placeholder="admin"]', TEST_USERS.admin.username);
      await page.fill(
        'input[placeholder="admin123"]',
        TEST_USERS.admin.password
      );
      await page.click('button:has-text("Sign In")');
      await page.waitForURL(/.*\/dashboard/);

      await page.click('text=Production');
      await page.waitForLoadState('networkidle');
    });

    test('should display production board with seeded jobs', async ({
      page,
    }) => {
      // Check for production board header
      await expect(page.locator('text=Production Board')).toBeVisible();

      // Check for job status columns
      await expect(page.locator('text=In Progress')).toBeVisible();
      await expect(page.locator('text=Completed')).toBeVisible();

      // Check for seeded jobs
      await expect(page.locator('text=Front Bumper Repair')).toBeVisible();
      await expect(page.locator('text=Side Panel Replacement')).toBeVisible();
      await expect(page.locator('text=Full Paint Job')).toBeVisible();
    });

    test('should create new job', async ({ page }) => {
      // Click add job button
      await page.click('button:has-text("Add Job")');

      // Fill in job form
      await page.fill('input[name="jobNumber"]', 'JOB-2024-001');
      await page.fill('input[name="description"]', 'Test Job Description');

      // Select customer
      await page.selectOption(
        'select[name="customerId"]',
        SEEDED_DATA.customerIds[0]
      );

      // Select priority
      await page.selectOption('select[name="priority"]', 'high');

      // Submit form
      await page.click('button:has-text("Create Job")');

      // Wait for success message
      await expect(page.locator('text=Job created successfully')).toBeVisible();

      // Verify job appears in board
      await expect(page.locator('text=JOB-2024-001')).toBeVisible();
    });

    test('should update job status', async ({ page }) => {
      // Find a job card
      const jobCard = page.locator('text=Front Bumper Repair').first();
      await jobCard.click();

      // Check for job detail dialog
      await expect(page.locator('text=Job Details')).toBeVisible();

      // Update status
      await page.selectOption('select[name="status"]', 'completed');
      await page.click('button:has-text("Update")');

      // Wait for success message
      await expect(page.locator('text=Job updated successfully')).toBeVisible();
    });

    test('should filter jobs by status', async ({ page }) => {
      // Find filter controls
      const statusFilter = page.locator(
        'select[name="statusFilter"], button:has-text("Filter")'
      );
      if (await statusFilter.isVisible()) {
        await statusFilter.selectOption('in_progress');

        // Should show only in-progress jobs
        await expect(page.locator('text=Front Bumper Repair')).toBeVisible();
        await expect(page.locator('text=Side Panel Replacement')).toBeVisible();
      }
    });
  });

  test.describe('Parts Management', () => {
    test.beforeEach(async ({ page }) => {
      // Login and navigate to parts
      await page.fill('input[placeholder="admin"]', TEST_USERS.admin.username);
      await page.fill(
        'input[placeholder="admin123"]',
        TEST_USERS.admin.password
      );
      await page.click('button:has-text("Sign In")');
      await page.waitForURL(/.*\/dashboard/);

      await page.click('text=Parts');
      await page.waitForLoadState('networkidle');
    });

    test('should display parts management with seeded data', async ({
      page,
    }) => {
      // Check for parts management header
      await expect(page.locator('text=Parts Management')).toBeVisible();

      // Check for seeded parts
      await expect(page.locator('text=Front Bumper')).toBeVisible();
      await expect(page.locator('text=Headlight Assembly')).toBeVisible();
      await expect(page.locator('text=Paint - Red')).toBeVisible();
    });

    test('should add new part', async ({ page }) => {
      // Click add part button
      await page.click('button:has-text("Add Part")');

      // Fill in part form
      await page.fill('input[name="partNumber"]', 'PART-001');
      await page.fill('input[name="name"]', 'Test Part');
      await page.fill('input[name="description"]', 'Test Part Description');
      await page.fill('input[name="cost"]', '100.00');
      await page.fill('input[name="price"]', '150.00');

      // Select category
      await page.selectOption('select[name="category"]', 'body_parts');

      // Submit form
      await page.click('button:has-text("Save")');

      // Wait for success message
      await expect(page.locator('text=Part added successfully')).toBeVisible();

      // Verify part appears in list
      await expect(page.locator('text=Test Part')).toBeVisible();
    });
  });

  test.describe('Reports & Analytics', () => {
    test.beforeEach(async ({ page }) => {
      // Login and navigate to reports
      await page.fill('input[placeholder="admin"]', TEST_USERS.admin.username);
      await page.fill(
        'input[placeholder="admin123"]',
        TEST_USERS.admin.password
      );
      await page.click('button:has-text("Sign In")');
      await page.waitForURL(/.*\/dashboard/);

      await page.click('text=Reports');
      await page.waitForLoadState('networkidle');
    });

    test('should display reports with data', async ({ page }) => {
      // Check for reports header
      await expect(page.locator('text=Reports')).toBeVisible();

      // Check for report types
      await expect(page.locator('text=Job Reports')).toBeVisible();
      await expect(page.locator('text=Financial Reports')).toBeVisible();
      await expect(page.locator('text=Customer Reports')).toBeVisible();
    });

    test('should generate job report', async ({ page }) => {
      // Click on job reports
      await page.click('text=Job Reports');

      // Select date range
      await page.fill('input[name="startDate"]', '2024-01-01');
      await page.fill('input[name="endDate"]', '2024-12-31');

      // Generate report
      await page.click('button:has-text("Generate Report")');

      // Wait for report to load
      await page.waitForTimeout(2000);

      // Check for report content
      await expect(page.locator('text=Job Summary')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Navigate to login
      await page.goto('/login');

      // Check login form is accessible
      await expect(page.locator('input[placeholder="admin"]')).toBeVisible();
      await expect(page.locator('input[placeholder="admin123"]')).toBeVisible();
      await expect(page.locator('button:has-text("Sign In")')).toBeVisible();

      // Login
      await page.fill('input[placeholder="admin"]', TEST_USERS.admin.username);
      await page.fill(
        'input[placeholder="admin123"]',
        TEST_USERS.admin.password
      );
      await page.click('button:has-text("Sign In")');

      // Check dashboard loads on mobile
      await page.waitForURL(/.*\/dashboard/);
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('should work on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      // Navigate to login
      await page.goto('/login');

      // Login
      await page.fill('input[placeholder="admin"]', TEST_USERS.admin.username);
      await page.fill(
        'input[placeholder="admin123"]',
        TEST_USERS.admin.password
      );
      await page.click('button:has-text("Sign In")');

      // Check dashboard loads on tablet
      await page.waitForURL(/.*\/dashboard/);
      await expect(page.locator('text=Dashboard')).toBeVisible();

      // Navigate to customers
      await page.click('text=Customers');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Customer Management')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Login first
      await page.fill('input[placeholder="admin"]', TEST_USERS.admin.username);
      await page.fill(
        'input[placeholder="admin123"]',
        TEST_USERS.admin.password
      );
      await page.click('button:has-text("Sign In")');
      await page.waitForURL(/.*\/dashboard/);

      // Simulate offline mode
      await page.route('**/*', route => route.abort());

      // Try to navigate
      await page.click('text=Customers');

      // Should show error message
      await expect(page.locator('text=Error')).toBeVisible();
    });

    test('should handle invalid data gracefully', async ({ page }) => {
      // Login first
      await page.fill('input[placeholder="admin"]', TEST_USERS.admin.username);
      await page.fill(
        'input[placeholder="admin123"]',
        TEST_USERS.admin.password
      );
      await page.click('button:has-text("Sign In")');
      await page.waitForURL(/.*\/dashboard/);

      // Navigate to customers
      await page.click('text=Customers');
      await page.waitForLoadState('networkidle');

      // Try to create customer with invalid data
      await page.click('button:has-text("Add Customer")');
      await page.click('button:has-text("Save")');

      // Should show validation errors
      await expect(page.locator('text=Required')).toBeVisible();
    });
  });
});
