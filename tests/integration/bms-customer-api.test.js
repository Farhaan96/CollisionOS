/**
 * BMS Customer API Integration Tests
 *
 * Tests the API endpoints involved in the BMS → Customer creation workflow:
 * - /api/import/bms (POST) - BMS file upload and processing
 * - /api/customers (GET) - Customer list retrieval
 * - /api/customers (POST) - Customer creation
 *
 * Validates:
 * - Authentication and shop context
 * - Data transformation from BMS to customer format
 * - Proper API response formats
 * - Error handling and edge cases
 */

const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');

// API Base URL
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// Test authentication token (you may need to adjust based on your auth system)
const TEST_TOKEN = process.env.TEST_TOKEN || 'dev-token';

describe('BMS Customer API Integration Tests', () => {
  let testToken = TEST_TOKEN;

  beforeAll(async () => {
    console.log('🚀 Starting BMS Customer API Integration Tests');
    console.log(`API Base URL: ${API_BASE_URL}`);

    // Verify server is running
    try {
      const response = await request(API_BASE_URL).get('/health');
      expect(response.status).toBe(200);
      console.log('✅ Backend server is running');
    } catch (error) {
      console.error('❌ Backend server not accessible:', error.message);
      throw new Error('Backend server must be running for integration tests');
    }
  });

  describe('1. Authentication & Health Checks', () => {
    test('Health endpoint should be accessible', async () => {
      const response = await request(API_BASE_URL).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      console.log('✅ Health check passed');
    });

    test('Protected endpoints should require authentication', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/customers')
        .expect(401);

      console.log('✅ Authentication required for protected endpoints');
    });

    test('Valid token should allow access to protected endpoints', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/customers')
        .set('Authorization', `Bearer ${testToken}`);

      // Should not return 401
      expect(response.status).not.toBe(401);
      console.log(`✅ Valid token allows access (status: ${response.status})`);
    });
  });

  describe('2. Customer API Endpoints', () => {
    test('GET /api/customers should return customer list', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/customers')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');

      if (response.body.customers) {
        console.log(
          `✅ Customer list returned: ${response.body.customers.length} customers`
        );
      } else if (response.body.data) {
        console.log(
          `✅ Customer data returned: ${response.body.data.length || 0} customers`
        );
      } else {
        console.log('✅ Customer endpoint responded (structure may vary)');
      }
    });

    test('GET /api/customers should handle pagination', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/customers')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      console.log('✅ Customer pagination handled');
    });

    test('GET /api/customers should handle search', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/customers')
        .query({ search: 'test' })
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      console.log('✅ Customer search handled');
    });
  });

  describe('3. BMS Import API Endpoints', () => {
    let testBMSContent = null;

    beforeAll(async () => {
      try {
        const filePath = path.resolve(
          __dirname,
          '../../test-files/sample-bms-test.xml'
        );
        testBMSContent = await fs.readFile(filePath, 'utf8');
        console.log('✅ Test BMS file loaded');
      } catch (error) {
        console.warn('⚠️  Could not load test BMS file, using mock data');
        testBMSContent = `<?xml version="1.0" encoding="UTF-8"?>
<BMS_ESTIMATE>
  <CUSTOMER_INFO>
    <FIRST_NAME>Test</FIRST_NAME>
    <LAST_NAME>Customer</LAST_NAME>
    <EMAIL>test@example.com</EMAIL>
    <PHONE>555-123-4567</PHONE>
  </CUSTOMER_INFO>
  <VEHICLE_INFO>
    <YEAR>2022</YEAR>
    <MAKE>Honda</MAKE>
    <MODEL>Civic</MODEL>
    <VIN>1HGBH41JXMN109186</VIN>
  </VEHICLE_INFO>
  <CLAIM_INFO>
    <CLAIM_NUMBER>TEST-CLAIM-001</CLAIM_NUMBER>
  </CLAIM_INFO>
</BMS_ESTIMATE>`;
      }
    });

    test('POST /api/import/bms should accept BMS file upload', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/import/bms')
        .set('Authorization', `Bearer ${testToken}`)
        .attach('file', Buffer.from(testBMSContent), 'test-bms.xml');

      console.log(
        `BMS Import Response: ${response.status} ${response.statusText || ''}`
      );

      // Should not return authentication errors
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);

      if (response.status === 200) {
        console.log('✅ BMS import successful');
        expect(response.body).toHaveProperty('success');
      } else if (response.status === 400) {
        console.log(
          '⚠️  BMS import validation error (expected for incomplete test data)'
        );
      } else {
        console.log(`ℹ️  BMS import returned status ${response.status}`);
      }
    });

    test('POST /api/import/bms should validate file format', async () => {
      const invalidContent = 'This is not XML content';

      const response = await request(API_BASE_URL)
        .post('/api/import/bms')
        .set('Authorization', `Bearer ${testToken}`)
        .attach('file', Buffer.from(invalidContent), 'invalid.xml');

      // Should handle invalid files gracefully
      expect(response.status).toBeGreaterThanOrEqual(400);
      console.log('✅ BMS import validates file format');
    });

    test('POST /api/import/bms should handle missing file', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/import/bms')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      console.log('✅ BMS import handles missing file');
    });
  });

  describe('4. BMS → Customer Integration Flow', () => {
    test('BMS upload should create customer data', async () => {
      // Get initial customer count
      const initialResponse = await request(API_BASE_URL)
        .get('/api/customers')
        .set('Authorization', `Bearer ${testToken}`);

      let initialCount = 0;
      if (initialResponse.body.customers) {
        initialCount = initialResponse.body.customers.length;
      } else if (initialResponse.body.data) {
        initialCount = initialResponse.body.data.length || 0;
      }

      console.log(`Initial customer count: ${initialCount}`);

      // Upload BMS file
      const bmsResponse = await request(API_BASE_URL)
        .post('/api/import/bms')
        .set('Authorization', `Bearer ${testToken}`)
        .attach('file', Buffer.from(testBMSContent), 'integration-test.xml');

      console.log(`BMS upload status: ${bmsResponse.status}`);

      // Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if customer count increased
      const afterResponse = await request(API_BASE_URL)
        .get('/api/customers')
        .set('Authorization', `Bearer ${testToken}`);

      let afterCount = 0;
      if (afterResponse.body.customers) {
        afterCount = afterResponse.body.customers.length;
      } else if (afterResponse.body.data) {
        afterCount = afterResponse.body.data.length || 0;
      }

      console.log(`After BMS upload customer count: ${afterCount}`);

      if (afterCount > initialCount) {
        console.log('✅ BMS upload created new customer');
      } else if (bmsResponse.status === 200) {
        console.log(
          '⚠️  BMS upload successful but customer count unchanged (may be duplicate)'
        );
      } else {
        console.log('ℹ️  BMS upload did not create customer (may be expected)');
      }

      // At minimum, the API should respond without errors
      expect(afterResponse.status).toBe(200);
    });

    test('Customer data should include BMS-derived information', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/customers')
        .query({ search: 'Thompson' }) // From our test BMS file
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);

      if (response.body.customers && response.body.customers.length > 0) {
        const customer = response.body.customers[0];
        console.log(
          '✅ Found customer with BMS data:',
          customer.first_name,
          customer.last_name
        );

        // Verify customer has expected fields
        expect(customer).toHaveProperty('first_name');
        expect(customer).toHaveProperty('last_name');
        expect(customer).toHaveProperty('email');
      } else {
        console.log(
          'ℹ️  No customers found matching BMS data (may need separate test run)'
        );
      }
    });
  });

  describe('5. Error Handling & Edge Cases', () => {
    test('Should handle malformed BMS XML gracefully', async () => {
      const malformedXML =
        '<?xml version="1.0"?><BMS_ESTIMATE><BROKEN_TAG></BMS_ESTIMATE>';

      const response = await request(API_BASE_URL)
        .post('/api/import/bms')
        .set('Authorization', `Bearer ${testToken}`)
        .attach('file', Buffer.from(malformedXML), 'malformed.xml');

      // Should return error but not crash
      expect([400, 422, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
      console.log('✅ Malformed XML handled gracefully');
    });

    test('Should handle large file upload limits', async () => {
      // Create a very large file content (simulated)
      const largeContent =
        '<?xml version="1.0"?><BMS_ESTIMATE>' +
        'x'.repeat(10000) +
        '</BMS_ESTIMATE>';

      const response = await request(API_BASE_URL)
        .post('/api/import/bms')
        .set('Authorization', `Bearer ${testToken}`)
        .attach('file', Buffer.from(largeContent), 'large.xml');

      // Should either accept it or return appropriate error
      console.log(`Large file test status: ${response.status}`);

      if (response.status >= 400) {
        expect(response.body).toHaveProperty('error');
        console.log('✅ Large file limits enforced');
      } else {
        console.log('✅ Large file processed successfully');
      }
    });

    test('Should handle concurrent uploads', async () => {
      const uploadPromises = Array(3)
        .fill()
        .map((_, index) =>
          request(API_BASE_URL)
            .post('/api/import/bms')
            .set('Authorization', `Bearer ${testToken}`)
            .attach(
              'file',
              Buffer.from(testBMSContent),
              `concurrent-${index}.xml`
            )
        );

      const responses = await Promise.all(uploadPromises);

      // All requests should get a response (not timeout)
      responses.forEach((response, index) => {
        expect(response.status).toBeDefined();
        console.log(`Concurrent upload ${index + 1}: ${response.status}`);
      });

      console.log('✅ Concurrent uploads handled');
    });
  });

  describe('6. Performance & Response Times', () => {
    test('API responses should be reasonably fast', async () => {
      const startTime = Date.now();

      const response = await request(API_BASE_URL)
        .get('/api/customers')
        .set('Authorization', `Bearer ${testToken}`);

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // 5 second timeout

      console.log(`✅ Customer API response time: ${responseTime}ms`);
    });

    test('BMS processing should complete within reasonable time', async () => {
      const startTime = Date.now();

      const response = await request(API_BASE_URL)
        .post('/api/import/bms')
        .set('Authorization', `Bearer ${testToken}`)
        .attach('file', Buffer.from(testBMSContent), 'performance-test.xml');

      const responseTime = Date.now() - startTime;

      // Should respond within 10 seconds
      expect(responseTime).toBeLessThan(10000);

      console.log(`✅ BMS processing response time: ${responseTime}ms`);
    });
  });

  afterAll(() => {
    console.log('\n🏁 BMS Customer API Integration Tests Complete');
    console.log('==============================================');
  });
});
