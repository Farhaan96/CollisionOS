/**
 * End-to-End Automated Parts Sourcing Workflow Tests
 * CollisionOS - Complete Business Process Validation
 * 
 * Tests the complete automated parts sourcing workflow:
 * 1. BMS file upload and processing
 * 2. Parts classification and normalization
 * 3. Vendor integration and real-time sourcing  
 * 4. Purchase order generation
 * 5. Dashboard updates and notifications
 * 6. Mobile app synchronization
 */

import { test, expect } from '@playwright/test';

test.describe('Automated Parts Sourcing Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application and login
    await page.goto('http://localhost:3000');
    
    // Handle authentication (assuming dev token is available)
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'dev-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-123',
        name: 'Test User',
        role: 'manager',
        shopId: 'test-shop-123'
      }));
    });

    await page.reload();
  });

  test('Complete BMS to PO Generation Workflow', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes for complete workflow

    console.log('🚀 Starting complete automated parts sourcing workflow test');

    // Step 1: Navigate to BMS Import
    await page.click('[data-testid="bms-import-nav"]');
    await expect(page).toHaveURL(/.*bms-import/);
    
    console.log('✓ Step 1: Navigated to BMS Import page');

    // Step 2: Upload BMS File
    const bmsContent = `<?xml version="1.0" encoding="UTF-8"?>
    <Estimate>
      <Header>
        <EstimateNumber>E2E-TEST-001</EstimateNumber>
        <Date>2024-01-15</Date>
      </Header>
      <Customer>
        <FirstName>John</FirstName>
        <LastName>Smith</LastName>
        <Phone>555-0123</Phone>
        <Email>john.smith@test.com</Email>
      </Customer>
      <Vehicle>
        <VIN>1G1BC5SM5H7123456</VIN>
        <Year>2017</Year>
        <Make>Chevrolet</Make>
        <Model>Malibu</Model>
      </Vehicle>
      <Claim>
        <ClaimNumber>CLM-E2E-001</ClaimNumber>
        <Insurer>State Farm</Insurer>
      </Claim>
      <RepairOrder>
        <RONumber>RO-E2E-001</RONumber>
      </RepairOrder>
      <DamageLines>
        <Line>
          <LineNumber>1</LineNumber>
          <PartNumber>GM-84044368</PartNumber>
          <OEMPartNumber>84044368</OEMPartNumber>
          <Description>Front Bumper Cover</Description>
          <Operation>Replace</Operation>
          <Quantity>1</Quantity>
          <PartCost>450.00</PartCost>
        </Line>
        <Line>
          <LineNumber>2</LineNumber>
          <PartNumber>GM-15228877</PartNumber>
          <OEMPartNumber>15228877</OEMPartNumber>
          <Description>Headlight Assembly LH</Description>
          <Operation>Replace</Operation>
          <Quantity>1</Quantity>
          <PartCost>275.50</PartCost>
        </Line>
      </DamageLines>
    </Estimate>`;

    // Create file input and upload
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([{
      name: 'e2e-test-estimate.xml',
      mimeType: 'text/xml',
      buffer: Buffer.from(bmsContent)
    }]);

    // Enable automated sourcing
    await page.check('[data-testid="enable-automated-sourcing"]');
    
    // Submit upload
    await page.click('[data-testid="upload-bms-button"]');
    
    console.log('✓ Step 2: BMS file uploaded with automated sourcing enabled');

    // Step 3: Wait for processing and verify results
    await page.waitForSelector('[data-testid="processing-complete"]', { timeout: 60000 });
    
    // Verify customer was created
    await expect(page.locator('[data-testid="customer-name"]')).toContainText('John Smith');
    await expect(page.locator('[data-testid="customer-phone"]')).toContainText('555-0123');
    
    // Verify vehicle was processed
    await expect(page.locator('[data-testid="vehicle-info"]')).toContainText('2017 Chevrolet Malibu');
    await expect(page.locator('[data-testid="vehicle-vin"]')).toContainText('1G1BC5SM5H7123456');
    
    // Verify parts were processed
    await expect(page.locator('[data-testid="parts-count"]')).toContainText('2 parts');
    
    console.log('✓ Step 3: BMS processing completed successfully');

    // Step 4: Verify Automated Parts Sourcing Results
    await page.click('[data-testid="view-sourcing-results"]');
    
    // Wait for sourcing results to appear
    await page.waitForSelector('[data-testid="sourcing-results-table"]', { timeout: 30000 });
    
    // Verify parts were classified
    const partRows = page.locator('[data-testid="sourcing-results-table"] tbody tr');
    await expect(partRows).toHaveCount(2);
    
    // Check first part (Front Bumper Cover)
    const firstPart = partRows.nth(0);
    await expect(firstPart.locator('[data-testid="part-number"]')).toContainText('GM-84044368');
    await expect(firstPart.locator('[data-testid="part-category"]')).toContainText('body');
    await expect(firstPart.locator('[data-testid="part-type"]')).toContainText('OEM');
    
    // Check for vendor recommendations
    await expect(firstPart.locator('[data-testid="recommended-vendor"]')).toBeVisible();
    await expect(firstPart.locator('[data-testid="vendor-price"]')).toBeVisible();
    
    console.log('✓ Step 4: Parts sourcing results verified');

    // Step 5: Generate Purchase Orders
    await page.click('[data-testid="generate-po-bulk"]');
    
    // Configure PO settings
    await page.selectOption('[data-testid="po-approval-level"]', 'auto');
    await page.click('[data-testid="confirm-po-generation"]');
    
    // Wait for PO generation
    await page.waitForSelector('[data-testid="po-generated-notification"]', { timeout: 30000 });
    
    // Verify PO numbers were assigned
    const poNotification = page.locator('[data-testid="po-generated-notification"]');
    await expect(poNotification).toContainText('Purchase orders generated');
    
    // Extract PO numbers for verification
    const poNumbers = await page.locator('[data-testid="generated-po-number"]').allTextContents();
    expect(poNumbers.length).toBeGreaterThan(0);
    
    console.log('✓ Step 5: Purchase orders generated successfully');
    console.log(`   Generated PO numbers: ${poNumbers.join(', ')}`);

    // Step 6: Navigate to Parts Sourcing Dashboard
    await page.click('[data-testid="parts-sourcing-nav"]');
    await expect(page).toHaveURL(/.*parts-sourcing/);
    
    // Verify dashboard shows updated metrics
    await page.waitForSelector('[data-testid="automated-sourcing-dashboard"]', { timeout: 10000 });
    
    // Check that metrics have been updated
    const totalPartsMetric = page.locator('[data-testid="total-parts-metric"]');
    const successRateMetric = page.locator('[data-testid="success-rate-metric"]');
    
    await expect(totalPartsMetric).toBeVisible();
    await expect(successRateMetric).toBeVisible();
    
    console.log('✓ Step 6: Dashboard updated with new sourcing results');

    // Step 7: Verify Real-time Updates
    await page.waitForSelector('[data-testid="recent-activity"]', { timeout: 10000 });
    
    // Check for recent activity entries
    const activityItems = page.locator('[data-testid="activity-item"]');
    await expect(activityItems.first()).toBeVisible();
    
    // Verify activity contains our sourcing operation
    const firstActivity = activityItems.first();
    const activityText = await firstActivity.textContent();
    expect(activityText).toMatch(/(sourced|processed|generated)/i);
    
    console.log('✓ Step 7: Real-time activity updates verified');

    // Step 8: Verify Vendor Performance Updates
    await page.click('[data-testid="vendor-performance-tab"]');
    
    const vendorTable = page.locator('[data-testid="vendor-performance-table"]');
    await expect(vendorTable).toBeVisible();
    
    // Check that vendors show activity
    const vendorRows = page.locator('[data-testid="vendor-performance-table"] tbody tr');
    await expect(vendorRows.first()).toBeVisible();
    
    // Verify performance metrics are displayed
    await expect(page.locator('[data-testid="vendor-success-rate"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="vendor-response-time"]').first()).toBeVisible();
    
    console.log('✓ Step 8: Vendor performance metrics updated');
  });

  test('Error Handling in Automated Sourcing Workflow', async ({ page }) => {
    test.setTimeout(60000);

    console.log('🔍 Testing error handling in automated sourcing workflow');

    // Navigate to BMS Import
    await page.click('[data-testid="bms-import-nav"]');
    
    // Step 1: Test malformed BMS file
    const malformedBmsContent = `<?xml version="1.0" encoding="UTF-8"?>
    <Estimate>
      <Customer>
        <FirstName>Jane</FirstName>
        <!-- Missing closing tag to create malformed XML -->
      </Customer>
    </Estimate>`;

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([{
      name: 'malformed-estimate.xml',
      mimeType: 'text/xml',
      buffer: Buffer.from(malformedBmsContent)
    }]);

    await page.click('[data-testid="upload-bms-button"]');
    
    // Verify error handling
    await page.waitForSelector('[data-testid="upload-error"]', { timeout: 15000 });
    await expect(page.locator('[data-testid="upload-error"]')).toContainText(/XML.*error|parsing.*error/i);
    
    console.log('✓ Malformed XML error handling verified');

    // Step 2: Test missing required fields
    const incompleteContent = `<?xml version="1.0" encoding="UTF-8"?>
    <Estimate>
      <Customer>
        <FirstName>Test</FirstName>
        <!-- Missing required fields -->
      </Customer>
    </Estimate>`;

    await page.reload();
    await page.locator('input[type="file"]').setInputFiles([{
      name: 'incomplete-estimate.xml',
      mimeType: 'text/xml',
      buffer: Buffer.from(incompleteContent)
    }]);

    await page.click('[data-testid="upload-bms-button"]');
    
    // Should process but show validation warnings
    await page.waitForSelector('[data-testid="validation-warnings"]', { timeout: 15000 });
    await expect(page.locator('[data-testid="validation-warnings"]')).toBeVisible();
    
    console.log('✓ Validation warnings for incomplete data verified');
  });

  test('Performance Monitoring in Sourcing Workflow', async ({ page }) => {
    test.setTimeout(90000);

    console.log('⚡ Testing performance monitoring in sourcing workflow');

    // Navigate to Parts Sourcing Dashboard
    await page.click('[data-testid="parts-sourcing-nav"]');
    
    // Verify performance metrics are displayed
    await page.waitForSelector('[data-testid="performance-metrics"]', { timeout: 10000 });
    
    const performanceSection = page.locator('[data-testid="performance-metrics"]');
    await expect(performanceSection).toBeVisible();
    
    // Check specific performance indicators
    await expect(page.locator('[data-testid="avg-processing-time"]')).toBeVisible();
    await expect(page.locator('[data-testid="vendor-response-times"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-rate-trends"]')).toBeVisible();
    
    // Verify performance thresholds are monitored
    const processingTime = await page.locator('[data-testid="avg-processing-time-value"]').textContent();
    const numericValue = parseFloat(processingTime?.replace(/[^\d.]/g, '') || '0');
    
    // Should meet performance requirements (<30 seconds for BMS processing)
    expect(numericValue).toBeLessThan(30);
    
    console.log(`✓ Performance monitoring verified - Processing time: ${processingTime}`);
  });

  test('Mobile App Synchronization Workflow', async ({ page, context }) => {
    test.setTimeout(60000);

    console.log('📱 Testing mobile app synchronization workflow');

    // Simulate mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to mobile interface
    await page.goto('http://localhost:3000/mobile/parts-sourcing');
    
    // Verify mobile interface loads
    await page.waitForSelector('[data-testid="mobile-sourcing-dashboard"]', { timeout: 15000 });
    
    // Check mobile-specific features
    await expect(page.locator('[data-testid="mobile-recent-pos"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-vendor-status"]')).toBeVisible();
    
    // Test mobile search functionality
    await page.click('[data-testid="mobile-parts-search"]');
    await page.fill('[data-testid="mobile-search-input"]', 'GM-84044368');
    await page.click('[data-testid="mobile-search-button"]');
    
    // Verify search results appear
    await page.waitForSelector('[data-testid="mobile-search-results"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="mobile-search-results"]')).toBeVisible();
    
    console.log('✓ Mobile app synchronization verified');
  });

  test('Real-time Notifications and WebSocket Integration', async ({ page }) => {
    test.setTimeout(45000);

    console.log('🔔 Testing real-time notifications and WebSocket integration');

    // Navigate to dashboard
    await page.click('[data-testid="parts-sourcing-nav"]');
    await page.waitForSelector('[data-testid="automated-sourcing-dashboard"]');
    
    // Monitor for WebSocket connection
    let webSocketConnected = false;
    
    page.on('websocket', ws => {
      webSocketConnected = true;
      console.log('✓ WebSocket connection established');
      
      ws.on('framesent', event => {
        console.log(`WebSocket frame sent: ${event.payload}`);
      });
      
      ws.on('framereceived', event => {
        console.log(`WebSocket frame received: ${event.payload}`);
      });
    });

    // Wait for WebSocket connection
    await page.waitForTimeout(5000);
    expect(webSocketConnected).toBe(true);
    
    // Check for notification area
    await expect(page.locator('[data-testid="notifications-area"]')).toBeVisible();
    
    // Simulate triggering a sourcing operation that should generate notifications
    await page.click('[data-testid="refresh-vendor-data"]');
    
    // Wait for and verify notification appears
    await page.waitForSelector('[data-testid="notification-item"]', { timeout: 15000 });
    await expect(page.locator('[data-testid="notification-item"]').first()).toBeVisible();
    
    console.log('✓ Real-time notifications verified');
  });

  test('Data Integrity and Audit Trail', async ({ page }) => {
    test.setTimeout(60000);

    console.log('🔍 Testing data integrity and audit trail');

    // Navigate to BMS Import and process a file
    await page.click('[data-testid="bms-import-nav"]');
    
    const testContent = `<?xml version="1.0" encoding="UTF-8"?>
    <Estimate>
      <Header><EstimateNumber>AUDIT-TEST-001</EstimateNumber></Header>
      <Customer><FirstName>Audit</FirstName><LastName>Test</LastName></Customer>
      <Vehicle><VIN>1HGBH41JXMN109999</VIN><Year>2018</Year><Make>Honda</Make><Model>Accord</Model></Vehicle>
      <DamageLines>
        <Line>
          <PartNumber>AUDIT-PART-001</PartNumber>
          <Description>Audit Test Part</Description>
          <Quantity>1</Quantity>
          <PartCost>100.00</PartCost>
        </Line>
      </DamageLines>
    </Estimate>`;

    await page.locator('input[type="file"]').setInputFiles([{
      name: 'audit-test.xml',
      mimeType: 'text/xml',
      buffer: Buffer.from(testContent)
    }]);

    await page.check('[data-testid="enable-automated-sourcing"]');
    await page.click('[data-testid="upload-bms-button"]');
    
    await page.waitForSelector('[data-testid="processing-complete"]', { timeout: 30000 });
    
    // Navigate to audit trail
    await page.click('[data-testid="audit-trail-nav"]');
    await page.waitForSelector('[data-testid="audit-trail-table"]');
    
    // Verify audit entries were created
    const auditEntries = page.locator('[data-testid="audit-entry"]');
    await expect(auditEntries.first()).toBeVisible();
    
    // Check for specific audit events
    await expect(page.locator('[data-testid="audit-entry"]').filter({ hasText: 'BMS_PROCESSED' })).toBeVisible();
    await expect(page.locator('[data-testid="audit-entry"]').filter({ hasText: 'PARTS_SOURCED' })).toBeVisible();
    
    console.log('✓ Data integrity and audit trail verified');
  });

  test('Cross-browser Compatibility', async ({ browserName, page }) => {
    test.setTimeout(45000);

    console.log(`🌐 Testing cross-browser compatibility on ${browserName}`);

    // Test core functionality across browsers
    await page.click('[data-testid="parts-sourcing-nav"]');
    await page.waitForSelector('[data-testid="automated-sourcing-dashboard"]');
    
    // Verify dashboard components load in all browsers
    await expect(page.locator('[data-testid="sourcing-metrics"]')).toBeVisible();
    await expect(page.locator('[data-testid="vendor-performance-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible();
    
    // Test interactive features
    await page.click('[data-testid="refresh-data-button"]');
    await page.waitForTimeout(2000);
    
    // Verify no browser-specific errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(5000);
    
    // Filter out known non-critical errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('manifest') &&
      !error.includes('webkit-mask')
    );
    
    expect(criticalErrors.length).toBe(0);
    
    console.log(`✓ Cross-browser compatibility verified for ${browserName}`);
  });
});