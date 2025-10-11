/**
 * Phase 1 Workflow Validation - End-to-End Testing
 * 
 * Tests the complete collision repair workflow:
 * 1. BMS Upload → Parse XML → Create Customer/Vehicle/RO/Parts
 * 2. RO Search → Find RO → View Details
 * 3. Parts Management → Drag-drop status → Update DB
 * 4. Create PO → Multi-select parts → Generate PO number
 * 5. Receive Parts → Update quantities → Mark installed
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('Phase 1: Collision Repair Workflow Validation', () => {
  let testShopId;
  let testUserId;
  let testROId;
  let testPartIds = [];

  test.beforeAll(async () => {
    // Setup test data
    testShopId = '550e8400-e29b-41d4-a716-446655440000';
    testUserId = '550e8400-e29b-41d4-a716-446655440001';
  });

  test('1. BMS Upload and Processing', async ({ page }) => {
    // Navigate to BMS import page
    await page.goto('/bms-import');
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="bms-upload-area"]');
    
    // Upload test BMS file
    const testBMSFile = path.join(__dirname, '../fixtures/test-bms.xml');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testBMSFile);
    
    // Wait for upload to complete
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 10000 });
    
    // Verify upload success message
    const successMessage = await page.locator('[data-testid="upload-success"]').textContent();
    expect(successMessage).toContain('BMS file uploaded successfully');
    
    // Verify processing status
    await page.waitForSelector('[data-testid="processing-complete"]', { timeout: 30000 });
    
    // Verify data was created
    const customerName = await page.locator('[data-testid="customer-name"]').textContent();
    const vehicleInfo = await page.locator('[data-testid="vehicle-info"]').textContent();
    const roNumber = await page.locator('[data-testid="ro-number"]').textContent();
    
    expect(customerName).toBeTruthy();
    expect(vehicleInfo).toBeTruthy();
    expect(roNumber).toMatch(/RO-\d{4}-\d{4}/);
    
    // Store RO ID for later tests
    testROId = await page.locator('[data-testid="ro-id"]').getAttribute('data-id');
  });

  test('2. RO Search and Navigation', async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
    
    // Wait for search bar to load
    await page.waitForSelector('[data-testid="search-bar"]');
    
    // Search for the created RO
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('RO-2024-001');
    
    // Wait for search results
    await page.waitForSelector('[data-testid="search-results"]');
    
    // Verify search results
    const searchResults = page.locator('[data-testid="search-result"]');
    await expect(searchResults).toHaveCount(1);
    
    // Click on search result
    await searchResults.first().click();
    
    // Verify navigation to RO detail page
    await page.waitForURL(/\/ro\/[a-f0-9-]+/);
    
    // Verify RO details are displayed
    await expect(page.locator('[data-testid="ro-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="customer-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="vehicle-info"]')).toBeVisible();
  });

  test('3. Parts Management Workflow', async ({ page }) => {
    // Navigate to RO detail page
    await page.goto(`/ro/${testROId}`);
    
    // Wait for parts section to load
    await page.waitForSelector('[data-testid="parts-section"]');
    
    // Verify parts are displayed
    const partsList = page.locator('[data-testid="part-item"]');
    await expect(partsList).toHaveCount.greaterThan(0);
    
    // Get initial part IDs
    const partElements = await partsList.all();
    for (const partElement of partElements) {
      const partId = await partElement.getAttribute('data-part-id');
      testPartIds.push(partId);
    }
    
    // Test drag and drop for part status change
    const sourcePart = page.locator('[data-testid="part-item"]').first();
    const targetStatus = page.locator('[data-testid="status-bucket-ordered"]');
    
    // Perform drag and drop
    await sourcePart.dragTo(targetStatus);
    
    // Wait for status update
    await page.waitForSelector('[data-testid="status-updated"]');
    
    // Verify status change
    const updatedPart = page.locator('[data-testid="part-item"]').first();
    const statusChip = updatedPart.locator('[data-testid="status-chip"]');
    await expect(statusChip).toHaveText('ordered');
  });

  test('4. Purchase Order Creation', async ({ page }) => {
    // Navigate to RO detail page
    await page.goto(`/ro/${testROId}`);
    
    // Wait for parts section
    await page.waitForSelector('[data-testid="parts-section"]');
    
    // Select parts for PO creation
    const partCheckboxes = page.locator('[data-testid="part-checkbox"]');
    await partCheckboxes.first().check();
    await partCheckboxes.nth(1).check();
    
    // Click create PO button
    await page.click('[data-testid="create-po-button"]');
    
    // Wait for PO creation dialog
    await page.waitForSelector('[data-testid="po-creation-dialog"]');
    
    // Fill PO details
    await page.fill('[data-testid="po-supplier"]', 'OEM Parts Direct');
    await page.fill('[data-testid="po-notes"]', 'Test PO for workflow validation');
    
    // Submit PO creation
    await page.click('[data-testid="create-po-submit"]');
    
    // Wait for PO creation success
    await page.waitForSelector('[data-testid="po-created-success"]');
    
    // Verify PO was created
    const poNumber = await page.locator('[data-testid="po-number"]').textContent();
    expect(poNumber).toMatch(/PO-\d{4}-\d{4}/);
    
    // Verify parts are now in ordered status
    const orderedParts = page.locator('[data-testid="status-bucket-ordered"] [data-testid="part-item"]');
    await expect(orderedParts).toHaveCount.greaterThan(0);
  });

  test('5. Parts Receiving and Installation', async ({ page }) => {
    // Navigate to RO detail page
    await page.goto(`/ro/${testROId}`);
    
    // Wait for parts section
    await page.waitForSelector('[data-testid="parts-section"]');
    
    // Simulate parts receiving
    const receivedParts = page.locator('[data-testid="status-bucket-ordered"] [data-testid="part-item"]');
    const firstPart = receivedParts.first();
    
    // Click receive button
    await firstPart.locator('[data-testid="receive-button"]').click();
    
    // Wait for receive dialog
    await page.waitForSelector('[data-testid="receive-dialog"]');
    
    // Fill receive details
    await page.fill('[data-testid="received-quantity"]', '1');
    await page.fill('[data-testid="receive-notes"]', 'Part received in good condition');
    
    // Submit receive
    await page.click('[data-testid="receive-submit"]');
    
    // Wait for receive success
    await page.waitForSelector('[data-testid="receive-success"]');
    
    // Verify part moved to received status
    const receivedStatus = page.locator('[data-testid="status-bucket-received"] [data-testid="part-item"]');
    await expect(receivedStatus).toHaveCount.greaterThan(0);
    
    // Simulate part installation
    const installedPart = receivedStatus.first();
    await installedPart.locator('[data-testid="install-button"]').click();
    
    // Wait for install dialog
    await page.waitForSelector('[data-testid="install-dialog"]');
    
    // Fill install details
    await page.fill('[data-testid="install-notes"]', 'Part installed successfully');
    
    // Submit install
    await page.click('[data-testid="install-submit"]');
    
    // Wait for install success
    await page.waitForSelector('[data-testid="install-success"]');
    
    // Verify part moved to installed status
    const installedStatus = page.locator('[data-testid="status-bucket-installed"] [data-testid="part-item"]');
    await expect(installedStatus).toHaveCount.greaterThan(0);
  });

  test('6. Workflow Progress Tracking', async ({ page }) => {
    // Navigate to RO detail page
    await page.goto(`/ro/${testROId}`);
    
    // Wait for workflow section
    await page.waitForSelector('[data-testid="workflow-progress"]');
    
    // Verify progress bar is visible
    const progressBar = page.locator('[data-testid="progress-bar"]');
    await expect(progressBar).toBeVisible();
    
    // Verify progress percentage
    const progressText = await page.locator('[data-testid="progress-text"]').textContent();
    expect(progressText).toMatch(/\d+%/);
    
    // Verify workflow steps
    const workflowSteps = page.locator('[data-testid="workflow-step"]');
    await expect(workflowSteps).toHaveCount.greaterThan(0);
    
    // Verify completed steps
    const completedSteps = page.locator('[data-testid="workflow-step-completed"]');
    await expect(completedSteps).toHaveCount.greaterThan(0);
  });

  test('7. Dashboard Integration', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard-metrics"]');
    
    // Verify metrics are displayed
    const totalROs = page.locator('[data-testid="total-ros"]');
    const inProgressROs = page.locator('[data-testid="in-progress-ros"]');
    const completedROs = page.locator('[data-testid="completed-ros"]');
    
    await expect(totalROs).toBeVisible();
    await expect(inProgressROs).toBeVisible();
    await expect(completedROs).toBeVisible();
    
    // Verify recent ROs section
    const recentROs = page.locator('[data-testid="recent-ros"]');
    await expect(recentROs).toBeVisible();
    
    // Verify our test RO appears in recent ROs
    const testROInList = page.locator(`[data-testid="ro-item-${testROId}"]`);
    await expect(testROInList).toBeVisible();
  });

  test('8. Data Persistence Verification', async ({ page }) => {
    // Navigate to RO detail page
    await page.goto(`/ro/${testROId}`);
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="ro-header"]');
    
    // Refresh page to verify data persistence
    await page.reload();
    
    // Wait for page to load again
    await page.waitForSelector('[data-testid="ro-header"]');
    
    // Verify all data is still there
    await expect(page.locator('[data-testid="customer-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="vehicle-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="parts-section"]')).toBeVisible();
    
    // Verify part statuses are preserved
    const installedParts = page.locator('[data-testid="status-bucket-installed"] [data-testid="part-item"]');
    await expect(installedParts).toHaveCount.greaterThan(0);
    
    // Verify workflow progress is preserved
    const progressBar = page.locator('[data-testid="progress-bar"]');
    await expect(progressBar).toBeVisible();
  });

  test('9. Error Handling and Recovery', async ({ page }) => {
    // Test invalid RO ID
    await page.goto('/ro/invalid-id');
    
    // Verify error handling
    await page.waitForSelector('[data-testid="error-message"]');
    const errorMessage = await page.locator('[data-testid="error-message"]').textContent();
    expect(errorMessage).toContain('Repair order not found');
    
    // Test network error simulation
    await page.route('**/api/repair-orders/*', route => route.abort());
    
    // Navigate to valid RO
    await page.goto(`/ro/${testROId}`);
    
    // Verify error boundary is triggered
    await page.waitForSelector('[data-testid="error-boundary"]');
    
    // Verify retry functionality
    await page.click('[data-testid="retry-button"]');
    
    // Restore network
    await page.unroute('**/api/repair-orders/*');
    
    // Verify page recovers
    await page.waitForSelector('[data-testid="ro-header"]');
  });

  test('10. Performance and Responsiveness', async ({ page }) => {
    // Navigate to RO detail page
    await page.goto(`/ro/${testROId}`);
    
    // Measure page load time
    const startTime = Date.now();
    await page.waitForSelector('[data-testid="ro-header"]');
    const loadTime = Date.now() - startTime;
    
    // Verify page loads within acceptable time
    expect(loadTime).toBeLessThan(3000); // 3 seconds
    
    // Test responsive design
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    
    // Verify mobile layout
    await expect(page.locator('[data-testid="mobile-layout"]')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 }); // Tablet
    
    // Verify tablet layout
    await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();
    
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
    
    // Verify desktop layout
    await expect(page.locator('[data-testid="desktop-layout"]')).toBeVisible();
  });
});

test.describe('Phase 1: API Integration Tests', () => {
  test('BMS API Integration', async ({ request }) => {
    // Test BMS upload API
    const testBMSFile = fs.readFileSync(path.join(__dirname, '../fixtures/test-bms.xml'));
    
    const response = await request.post('/api/bms/upload', {
      multipart: {
        file: {
          name: 'test-bms.xml',
          mimeType: 'application/xml',
          buffer: testBMSFile
        }
      }
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.importId).toBeTruthy();
  });

  test('Repair Orders API', async ({ request }) => {
    // Test repair orders list API
    const response = await request.get('/api/repair-orders', {
      params: {
        limit: 10,
        page: 1
      }
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.repair_orders)).toBe(true);
  });

  test('Parts Management API', async ({ request }) => {
    // Test parts list API
    const response = await request.get('/api/repair-orders/test-ro-id/parts');
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.parts)).toBe(true);
  });

  test('Purchase Orders API', async ({ request }) => {
    // Test purchase orders list API
    const response = await request.get('/api/purchase-orders');
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.purchase_orders)).toBe(true);
  });
});