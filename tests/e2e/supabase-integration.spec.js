import { test, expect } from '@playwright/test';

// Test data from our seeded Supabase database
const SEEDED_DATA = {
  shopId: '550e8400-e29b-41d4-a716-446655440001',
  customers: [
    { id: '550e8400-e29b-41d4-a716-446655440002', name: 'John Doe', email: 'john.doe@email.com' },
    { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Acme Corp', email: 'contact@acme.com' },
    { id: '550e8400-e29b-41d4-a716-446655440004', name: 'State Farm Insurance', email: 'claims@statefarm.com' },
    { id: '550e8400-e29b-41d4-a716-446655440005', name: 'Sarah Wilson', email: 'sarah.wilson@email.com' },
    { id: '550e8400-e29b-41d4-a716-446655440006', name: 'Mike Johnson', email: 'mike.johnson@email.com' }
  ],
  jobs: [
    { id: '550e8400-e29b-41d4-a716-446655440007', title: 'Front Bumper Repair', status: 'in_progress' },
    { id: '550e8400-e29b-41d4-a716-446655440008', title: 'Side Panel Replacement', status: 'in_progress' },
    { id: '550e8400-e29b-41d4-a716-446655440009', title: 'Full Paint Job', status: 'completed' }
  ],
  parts: [
    { name: 'Front Bumper', category: 'body_parts' },
    { name: 'Headlight Assembly', category: 'lighting' },
    { name: 'Paint - Red', category: 'paint_supplies' }
  ]
};

test.describe('Supabase Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Login with admin credentials
    await page.fill('input[placeholder="admin"]', 'admin');
    await page.fill('input[placeholder="admin123"]', 'admin123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/.*\/dashboard/);
  });

  test.describe('Data Loading from Supabase', () => {
    test('should load dashboard metrics from Supabase', async ({ page }) => {
      // Wait for dashboard to load with data
      await page.waitForTimeout(3000);
      
      // Check that KPI cards show data from seeded database
      const totalJobsElement = page.locator('text=Total Jobs').first();
      await expect(totalJobsElement).toBeVisible();
      
      // The total jobs should be 3 (from our seeded data)
      const totalJobsText = await page.locator('text=/\\d+/').first().textContent();
      expect(parseInt(totalJobsText)).toBeGreaterThanOrEqual(3);
      
      // Check for revenue data
      const revenueElement = page.locator('text=Revenue').first();
      await expect(revenueElement).toBeVisible();
      
      // Check for active jobs
      const activeJobsElement = page.locator('text=Active Jobs').first();
      await expect(activeJobsElement).toBeVisible();
    });

    test('should load customer data from Supabase', async ({ page }) => {
      // Navigate to customers
      await page.click('text=Customers');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Check for all seeded customers
      for (const customer of SEEDED_DATA.customers) {
        await expect(page.locator(`text=${customer.name}`)).toBeVisible();
      }
      
      // Check for customer details
      await expect(page.locator('text=john.doe@email.com')).toBeVisible();
      await expect(page.locator('text=contact@acme.com')).toBeVisible();
      await expect(page.locator('text=claims@statefarm.com')).toBeVisible();
    });

    test('should load job data from Supabase', async ({ page }) => {
      // Navigate to production
      await page.click('text=Production');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Check for all seeded jobs
      for (const job of SEEDED_DATA.jobs) {
        await expect(page.locator(`text=${job.title}`)).toBeVisible();
      }
      
      // Check for job status columns
      await expect(page.locator('text=In Progress')).toBeVisible();
      await expect(page.locator('text=Completed')).toBeVisible();
    });

    test('should load parts data from Supabase', async ({ page }) => {
      // Navigate to parts
      await page.click('text=Parts');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Check for all seeded parts
      for (const part of SEEDED_DATA.parts) {
        await expect(page.locator(`text=${part.name}`)).toBeVisible();
      }
    });
  });

  test.describe('Real-time Updates', () => {
    test('should handle real-time customer updates', async ({ page }) => {
      // Navigate to customers
      await page.click('text=Customers');
      await page.waitForLoadState('networkidle');
      
      // Create a new customer (this should trigger real-time updates)
      await page.click('button:has-text("Add Customer")');
      
      // Fill in customer form
      await page.fill('input[name="firstName"]', 'RealTime');
      await page.fill('input[name="lastName"]', 'Test');
      await page.fill('input[name="email"]', 'realtime@test.com');
      await page.fill('input[name="phone"]', '+1-555-9999');
      
      // Submit form
      await page.click('button:has-text("Save")');
      
      // Wait for success message
      await expect(page.locator('text=Customer created successfully')).toBeVisible();
      
      // Verify customer appears in list (real-time update)
      await expect(page.locator('text=RealTime Test')).toBeVisible();
    });

    test('should handle real-time job updates', async ({ page }) => {
      // Navigate to production
      await page.click('text=Production');
      await page.waitForLoadState('networkidle');
      
      // Create a new job
      await page.click('button:has-text("Add Job")');
      
      // Fill in job form
      await page.fill('input[name="jobNumber"]', 'REALTIME-001');
      await page.fill('input[name="description"]', 'Real-time Test Job');
      
      // Submit form
      await page.click('button:has-text("Create Job")');
      
      // Wait for success message
      await expect(page.locator('text=Job created successfully')).toBeVisible();
      
      // Verify job appears in board (real-time update)
      await expect(page.locator('text=REALTIME-001')).toBeVisible();
    });
  });

  test.describe('API Integration', () => {
    test('should handle Supabase API calls correctly', async ({ page }) => {
      // Monitor network requests to Supabase
      const supabaseRequests = [];
      
      page.on('request', request => {
        if (request.url().includes('supabase.co')) {
          supabaseRequests.push({
            url: request.url(),
            method: request.method(),
            headers: request.headers()
          });
        }
      });
      
      // Navigate to customers to trigger API calls
      await page.click('text=Customers');
      await page.waitForLoadState('networkidle');
      
      // Wait a bit for all requests to complete
      await page.waitForTimeout(2000);
      
      // Should have made requests to Supabase
      expect(supabaseRequests.length).toBeGreaterThan(0);
      
      // Check that requests include proper headers
      const hasAuthHeader = supabaseRequests.some(req => 
        req.headers['authorization'] || req.headers['apikey']
      );
      expect(hasAuthHeader).toBeTruthy();
    });

    test('should handle API errors gracefully', async ({ page }) => {
      // Intercept Supabase requests and return errors
      await page.route('**/*supabase.co/**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });
      
      // Navigate to customers
      await page.click('text=Customers');
      
      // Should show error message
      await expect(page.locator('text=Error')).toBeVisible();
    });
  });

  test.describe('Data Relationships', () => {
    test('should display customer-job relationships', async ({ page }) => {
      // Navigate to production
      await page.click('text=Production');
      await page.waitForLoadState('networkidle');
      
      // Click on a job to see details
      await page.click('text=Front Bumper Repair');
      
      // Should show customer information in job details
      await expect(page.locator('text=Customer:')).toBeVisible();
      await expect(page.locator('text=John Doe')).toBeVisible();
    });

    test('should display job-parts relationships', async ({ page }) => {
      // Navigate to production
      await page.click('text=Production');
      await page.waitForLoadState('networkidle');
      
      // Click on a job to see details
      await page.click('text=Front Bumper Repair');
      
      // Should show parts information in job details
      await expect(page.locator('text=Parts:')).toBeVisible();
      await expect(page.locator('text=Front Bumper')).toBeVisible();
    });
  });

  test.describe('Data Validation', () => {
    test('should validate customer data integrity', async ({ page }) => {
      // Navigate to customers
      await page.click('text=Customers');
      await page.waitForLoadState('networkidle');
      
      // Check that customer data is properly formatted
      await expect(page.locator('text=john.doe@email.com')).toBeVisible();
      await expect(page.locator('text=+1-555-0101')).toBeVisible();
      
      // Check customer types
      await expect(page.locator('text=Individual')).toBeVisible();
      await expect(page.locator('text=Business')).toBeVisible();
      await expect(page.locator('text=Insurance')).toBeVisible();
    });

    test('should validate job data integrity', async ({ page }) => {
      // Navigate to production
      await page.click('text=Production');
      await page.waitForLoadState('networkidle');
      
      // Check that job data is properly formatted
      await expect(page.locator('text=Front Bumper Repair')).toBeVisible();
      await expect(page.locator('text=Side Panel Replacement')).toBeVisible();
      await expect(page.locator('text=Full Paint Job')).toBeVisible();
      
      // Check job statuses
      await expect(page.locator('text=In Progress')).toBeVisible();
      await expect(page.locator('text=Completed')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load data within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      
      // Navigate to customers
      await page.click('text=Customers');
      await page.waitForLoadState('networkidle');
      
      // Wait for customer data to appear
      await expect(page.locator('text=John Doe')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      // Navigate to dashboard
      await page.click('text=Dashboard');
      await page.waitForLoadState('networkidle');
      
      // Check that dashboard loads quickly even with multiple data sources
      await expect(page.locator('text=Total Jobs')).toBeVisible();
      await expect(page.locator('text=Revenue')).toBeVisible();
      await expect(page.locator('text=Active Jobs')).toBeVisible();
      
      // Should not show loading indicators for too long
      const loadingIndicator = page.locator('text=Loading...');
      if (await loadingIndicator.isVisible()) {
        await expect(loadingIndicator).not.toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe('Authentication & Authorization', () => {
    test('should maintain authentication state', async ({ page }) => {
      // Navigate to different sections
      await page.click('text=Customers');
      await page.waitForLoadState('networkidle');
      
      await page.click('text=Production');
      await page.waitForLoadState('networkidle');
      
      await page.click('text=Parts');
      await page.waitForLoadState('networkidle');
      
      // Should remain authenticated throughout
      await expect(page).toHaveURL(/.*\/parts/);
      await expect(page.locator('text=Parts Management')).toBeVisible();
    });

    test('should handle authentication errors', async ({ page }) => {
      // Clear authentication
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // Refresh page
      await page.reload();
      
      // Should redirect to login
      await expect(page).toHaveURL(/.*\/login/);
      await expect(page.locator('text=Sign In')).toBeVisible();
    });
  });
});
