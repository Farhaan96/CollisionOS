/**
 * BMS Testing Configuration
 *
 * Configuration for BMS upload comprehensive testing suite
 * Includes test data, API endpoints, validation rules, and thresholds
 */

module.exports = {
  // Test Environment Configuration
  environment: {
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    testTimeout: 300000, // 5 minutes max per test
    retryAttempts: 2,
    enableScreenshots: true,
    headless: process.env.CI === 'true',
  },

  // Authentication Configuration
  authentication: {
    testUser: {
      email: 'admin@demoautobody.com',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
    },
    testToken: process.env.TEST_TOKEN || 'dev-token',
    shopId: process.env.TEST_SHOP_ID || '1',
    tokenExpiry: 3600000, // 1 hour
  },

  // Test Data Configuration
  testData: {
    sampleBMSFiles: [
      {
        name: 'sample-bms-test.xml',
        path: './test-files/sample-bms-test.xml',
        expectedCustomer: {
          firstName: 'Michael',
          lastName: 'Thompson',
          email: 'michael.thompson@email.com',
          phone: '555-987-6543',
        },
        expectedVehicle: {
          year: '2022',
          make: 'Honda',
          model: 'Civic',
          vin: '1HGBH41JXMN109186',
        },
        expectedClaim: {
          claimNumber: 'CLM-2025-567890',
          totalAmount: 4250.75,
        },
      },
      {
        name: 'large-bms-test.xml',
        path: './test-files/large-bms-test.xml',
        size: '5MB',
        partCount: 50,
        processingTimeExpected: 15000, // 15 seconds
      },
    ],
    invalidFiles: [
      {
        name: 'invalid-format.txt',
        type: 'text/plain',
        expectedError: 'Invalid file type',
      },
      {
        name: 'malformed.xml',
        content: '<?xml version="1.0"?><BROKEN><TAG>',
        expectedError: 'Malformed XML',
      },
      {
        name: 'too-large.xml',
        size: '100MB',
        expectedError: 'File too large',
      },
    ],
  },

  // API Endpoint Configuration
  endpoints: {
    health: '/health',
    customers: {
      list: '/api/customers',
      create: '/api/customers',
      update: '/api/customers/:id',
      delete: '/api/customers/:id',
    },
    bmsImport: {
      single: '/api/import/bms',
      batch: '/api/import/batch',
      status: '/api/import/status/:id',
      ems: '/api/import/ems',
    },
    authentication: {
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      refresh: '/api/auth/refresh',
    },
  },

  // Validation Rules
  validation: {
    apiResponse: {
      maxResponseTime: 5000, // 5 seconds
      requiredFields: ['success', 'data'],
      errorFields: ['error', 'message'],
    },
    bmsUpload: {
      maxUploadTime: 30000, // 30 seconds
      maxFileSize: 52428800, // 50MB
      allowedTypes: ['text/xml', 'application/xml'],
      requiredElements: ['CUSTOMER_INFO', 'VEHICLE_INFO', 'CLAIM_INFO'],
    },
    customerCreation: {
      requiredFields: ['first_name', 'last_name', 'email', 'phone'],
      optionalFields: ['address', 'company_name', 'notes'],
      maxCreationTime: 10000, // 10 seconds
    },
    uiIntegration: {
      maxRefreshTime: 2000, // 2 seconds as required
      elementSelectors: {
        customerList:
          '[data-testid="customer-row"], tr:has(td), .customer-item',
        fileInput: 'input[type="file"], #file-input',
        uploadButton: 'button:has-text("Upload"), button:has-text("Import")',
        successIndicator: '[class*="success"], [class*="complete"]',
        errorIndicator: '[class*="error"], [class*="alert"]',
      },
    },
  },

  // Performance Thresholds
  performance: {
    pageLoad: 5000, // 5 seconds
    apiCall: 2000, // 2 seconds
    fileUpload: 30000, // 30 seconds
    customerRefresh: 2000, // 2 seconds
    batchProcessing: 120000, // 2 minutes
  },

  // Test Thresholds
  thresholds: {
    overallSuccessRate: 80, // 80% minimum
    criticalTestsSuccessRate: 100, // All critical tests must pass
    performancePassRate: 90, // 90% of performance tests must pass
    maxErrorRate: 10, // Maximum 10% error rate
    maxConsoleErrors: 5, // Maximum 5 console errors per test
  },

  // Test Categories
  categories: {
    critical: [
      'BMS file upload',
      'Customer creation via BMS',
      'Authentication',
      'API responses',
    ],
    important: [
      'UI integration',
      'Error handling',
      'File validation',
      'Data transformation',
    ],
    optional: [
      'Performance optimization',
      'Advanced error scenarios',
      'Concurrent operations',
      'Large file handling',
    ],
  },

  // Reporting Configuration
  reporting: {
    formats: ['json', 'html', 'junit'],
    outputDir: './tests/reports',
    includeLogs: true,
    includeScreenshots: true,
    includeNetworkLogs: true,
    detailLevel: 'verbose',
  },

  // Retry and Recovery Configuration
  retry: {
    maxAttempts: 3,
    delayBetweenAttempts: 5000, // 5 seconds
    exponentialBackoff: true,
    retryableErrors: [
      'Network error',
      'Timeout',
      'Connection refused',
      'Service unavailable',
    ],
  },

  // Mock Data for Testing
  mockData: {
    sampleBMSXML: `<?xml version="1.0" encoding="UTF-8"?>
<BMS_ESTIMATE>
  <CUSTOMER_INFO>
    <FIRST_NAME>Test</FIRST_NAME>
    <LAST_NAME>Customer</LAST_NAME>
    <EMAIL>test.customer@example.com</EMAIL>
    <PHONE>555-TEST-001</PHONE>
    <ADDRESS>
      <STREET>123 Test Street</STREET>
      <CITY>Test City</CITY>
      <STATE>TS</STATE>
      <ZIP>12345</ZIP>
    </ADDRESS>
  </CUSTOMER_INFO>
  <VEHICLE_INFO>
    <YEAR>2023</YEAR>
    <MAKE>Test</MAKE>
    <MODEL>Vehicle</MODEL>
    <VIN>TEST123456789VIN</VIN>
    <LICENSE_PLATE>TEST123</LICENSE_PLATE>
  </VEHICLE_INFO>
  <CLAIM_INFO>
    <CLAIM_NUMBER>TEST-CLAIM-001</CLAIM_NUMBER>
    <POLICY_NUMBER>TEST-POLICY-001</POLICY_NUMBER>
    <INSURANCE_COMPANY>Test Insurance Co</INSURANCE_COMPANY>
    <DATE_OF_LOSS>2024-01-01</DATE_OF_LOSS>
  </CLAIM_INFO>
  <DAMAGE_ASSESSMENT>
    <TOTAL_ESTIMATE>1000.00</TOTAL_ESTIMATE>
    <LABOR_TOTAL>500.00</LABOR_TOTAL>
    <PARTS_TOTAL>400.00</PARTS_TOTAL>
    <TAX_TOTAL>100.00</TAX_TOTAL>
    <DAMAGE_LINES>
      <LINE_ITEM>
        <LINE_NUMBER>1</LINE_NUMBER>
        <OPERATION_TYPE>REPAIR</OPERATION_TYPE>
        <PART_NAME>Test Part</PART_NAME>
        <PART_COST>400.00</PART_COST>
        <LABOR_AMOUNT>500.00</LABOR_AMOUNT>
        <TOTAL_AMOUNT>900.00</TOTAL_AMOUNT>
      </LINE_ITEM>
    </DAMAGE_LINES>
  </DAMAGE_ASSESSMENT>
</BMS_ESTIMATE>`,
    sampleCustomer: {
      first_name: 'Test',
      last_name: 'Customer',
      email: 'test.customer@example.com',
      phone: '555-TEST-001',
      customer_type: 'individual',
      is_active: true,
    },
    apiResponses: {
      success: {
        success: true,
        data: { id: '12345', message: 'Operation completed' },
        timestamp: new Date().toISOString(),
      },
      error: {
        success: false,
        error: 'Test error',
        message: 'This is a test error message',
        code: 'TEST_ERROR',
      },
    },
  },

  // Browser Configuration for E2E Tests
  browser: {
    headless: process.env.CI === 'true',
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    slowMo: process.env.DEBUG ? 100 : 0,
    devtools: process.env.DEBUG === 'true',
    launchOptions: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    },
  },

  // Database Configuration for Testing
  database: {
    testDatabase: process.env.TEST_DATABASE_URL || 'test_collision_os',
    cleanupAfterTests: true,
    seedTestData: true,
    backupBeforeTests: false,
  },
};
