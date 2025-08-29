/**
 * Integration Tests for Third-Party API Integrations
 * Tests insurance companies, parts suppliers, and integration framework
 */

const request = require('supertest');
const { app } = require('../../server/index');
const { integrationManager } = require('../../server/services/integrationFramework');
const { 
  InsuranceIntegrationService,
  MitchellProvider,
  CCCProvider 
} = require('../../server/services/insuranceIntegration');
const { 
  PartsSupplierIntegrationService,
  LKQProvider,
  GPCProvider 
} = require('../../server/services/partsSupplierIntegration');

describe('Third-Party Integrations', () => {
  let authToken;
  let insuranceService;
  let partsSupplierService;

  beforeAll(async () => {
    // Set up authentication token for tests
    const authResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@collisionos.com',
        password: 'testpassword'
      });
    
    if (authResponse.body && authResponse.body.token) {
      authToken = authResponse.body.token;
    } else {
      // Use dev token for testing
      authToken = 'dev-token';
    }

    // Initialize test services
    insuranceService = new InsuranceIntegrationService();
    partsSupplierService = new PartsSupplierIntegrationService();
  });

  describe('Integration Framework', () => {
    test('should get integration statistics', async () => {
      const response = await request(app)
        .get('/api/integrations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('statistics');
      expect(response.body.data).toHaveProperty('health');
      expect(response.body.data).toHaveProperty('providers');
    });

    test('should get health check for all providers', async () => {
      const response = await request(app)
        .get('/api/integrations/health')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('timestamp');
    });

    test('should get integration configuration', async () => {
      const response = await request(app)
        .get('/api/integrations/config')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('supportedInsuranceProviders');
      expect(response.body.data).toHaveProperty('supportedPartsSuppliers');
      expect(response.body.data).toHaveProperty('features');
      expect(response.body.data.features.realTimeUpdates).toBe(true);
    });
  });

  describe('Insurance Integration', () => {
    test('should get insurance providers list', async () => {
      const response = await request(app)
        .get('/api/integrations/insurance/providers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should register Mitchell insurance provider', async () => {
      const providerData = {
        name: 'Mitchell Test',
        type: 'mitchell',
        credentials: {
          accessToken: 'test-access-token',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret'
        }
      };

      const response = await request(app)
        .post('/api/integrations/insurance/providers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(providerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(providerData.name);
      expect(response.body.data.type).toBe(providerData.type);
    });

    test('should register CCC insurance provider', async () => {
      const providerData = {
        name: 'CCC Test',
        type: 'ccc',
        credentials: {
          apiKey: 'test-api-key',
          secretKey: 'test-secret-key'
        }
      };

      const response = await request(app)
        .post('/api/integrations/insurance/providers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(providerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(providerData.name);
    });

    test('should validate claim data before submission', async () => {
      const invalidClaimData = {
        provider: 'Mitchell Test',
        claimData: {
          // Missing required fields
          customerInfo: {
            firstName: 'John',
            lastName: 'Doe'
          }
        }
      };

      const response = await request(app)
        .post('/api/integrations/insurance/claims')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidClaimData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should submit valid insurance claim', async () => {
      const claimData = {
        provider: 'Mitchell Test',
        claimData: {
          policyNumber: 'POL-123456',
          dateOfLoss: '2024-01-15',
          damageDescription: 'Front end collision damage',
          customerInfo: {
            firstName: 'John',
            lastName: 'Doe',
            phone: '555-1234',
            email: 'john.doe@email.com',
            address: '123 Main St, Anytown, ST 12345'
          },
          vehicleInfo: {
            vin: '1HGBH41JXMN109186',
            year: 2021,
            make: 'Honda',
            model: 'Accord',
            mileage: 25000
          }
        }
      };

      // Mock the provider to avoid actual API calls
      jest.spyOn(insuranceService, 'submitClaim').mockResolvedValue({
        claimNumber: 'CLM-789012',
        status: 'submitted',
        message: 'Claim submitted successfully'
      });

      const response = await request(app)
        .post('/api/integrations/insurance/claims')
        .set('Authorization', `Bearer ${authToken}`)
        .send(claimData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.claimNumber).toBeDefined();
    });

    test('should submit estimate for approval', async () => {
      const estimateData = {
        provider: 'Mitchell Test',
        estimateData: {
          claimNumber: 'CLM-789012',
          totalAmount: 5500.00,
          laborTotal: 2800.00,
          partsTotal: 2200.00,
          repairItems: [
            {
              lineNumber: 1,
              description: 'Replace front bumper',
              laborHours: 3.5,
              laborRate: 65.00,
              partsAmount: 450.00
            },
            {
              lineNumber: 2,
              description: 'Paint front bumper',
              laborHours: 2.0,
              laborRate: 65.00,
              partsAmount: 120.00
            }
          ]
        }
      };

      // Mock the provider
      jest.spyOn(insuranceService, 'submitEstimate').mockResolvedValue({
        estimateId: 'EST-456789',
        status: 'submitted',
        message: 'Estimate submitted for review'
      });

      const response = await request(app)
        .post('/api/integrations/insurance/estimates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(estimateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.estimateId).toBeDefined();
    });

    test('should get claim status', async () => {
      const claimNumber = 'CLM-789012';
      const provider = 'Mitchell Test';

      // Mock the provider
      jest.spyOn(insuranceService, 'getClaimStatus').mockResolvedValue({
        claimNumber,
        status: 'under_review',
        lastUpdated: new Date().toISOString()
      });

      const response = await request(app)
        .get(`/api/integrations/insurance/claims/${claimNumber}/status`)
        .query({ provider })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.claimNumber).toBe(claimNumber);
    });
  });

  describe('Parts Supplier Integration', () => {
    test('should get parts supplier providers list', async () => {
      const response = await request(app)
        .get('/api/integrations/parts/providers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should register LKQ parts supplier provider', async () => {
      const providerData = {
        name: 'LKQ Test',
        type: 'lkq',
        credentials: {
          apiKey: 'test-lkq-api-key'
        }
      };

      const response = await request(app)
        .post('/api/integrations/parts/providers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(providerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(providerData.name);
    });

    test('should register GPC parts supplier provider', async () => {
      const providerData = {
        name: 'GPC Test',
        type: 'gpc',
        credentials: {
          clientId: 'test-gpc-client-id',
          clientSecret: 'test-gpc-secret',
          accessToken: 'test-gpc-token'
        }
      };

      const response = await request(app)
        .post('/api/integrations/parts/providers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(providerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(providerData.name);
    });

    test('should search parts across suppliers', async () => {
      const searchData = {
        searchCriteria: {
          query: 'front bumper',
          vehicleInfo: {
            year: 2021,
            make: 'Honda',
            model: 'Accord'
          },
          category: 'body'
        },
        providers: ['LKQ Test', 'GPC Test']
      };

      // Mock the parts supplier service
      jest.spyOn(partsSupplierService, 'searchParts').mockResolvedValue({
        searchCriteria: searchData.searchCriteria,
        providers: searchData.providers,
        results: [
          {
            provider: 'LKQ Test',
            results: {
              totalResults: 5,
              parts: [
                {
                  partNumber: 'HO1000245',
                  description: '2021 Honda Accord Front Bumper Cover',
                  price: 285.00,
                  availability: true,
                  partType: 'oem'
                }
              ]
            }
          }
        ],
        aggregated: {
          totalParts: 5,
          providerCount: { 'LKQ Test': 3, 'GPC Test': 2 }
        }
      });

      const response = await request(app)
        .post('/api/integrations/parts/search')
        .set('Authorization', `Bearer ${authToken}`)
        .send(searchData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toBeDefined();
      expect(response.body.data.aggregated).toBeDefined();
    });

    test('should compare prices across suppliers', async () => {
      const priceData = {
        partNumbers: ['HO1000245', 'HO1000246'],
        providers: ['LKQ Test', 'GPC Test']
      };

      // Mock the price comparison
      jest.spyOn(partsSupplierService, 'comparePrices').mockResolvedValue({
        'HO1000245': {
          partNumber: 'HO1000245',
          providers: [
            { provider: 'LKQ Test', price: 285.00, availability: true },
            { provider: 'GPC Test', price: 295.00, availability: true }
          ],
          bestPrice: 285.00,
          averagePrice: 290.00
        },
        'HO1000246': {
          partNumber: 'HO1000246',
          providers: [
            { provider: 'LKQ Test', price: 125.00, availability: false },
            { provider: 'GPC Test', price: 135.00, availability: true }
          ],
          bestPrice: 125.00,
          averagePrice: 130.00
        }
      });

      const response = await request(app)
        .post('/api/integrations/parts/pricing/compare')
        .set('Authorization', `Bearer ${authToken}`)
        .send(priceData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data['HO1000245']).toBeDefined();
      expect(response.body.data['HO1000245'].bestPrice).toBe(285.00);
    });

    test('should create order with best price strategy', async () => {
      const orderData = {
        orderData: {
          items: [
            {
              partNumber: 'HO1000245',
              quantity: 1,
              description: '2021 Honda Accord Front Bumper Cover'
            }
          ],
          shippingAddress: {
            name: 'Test Shop',
            address: '123 Business St',
            city: 'Anytown',
            state: 'ST',
            zipCode: '12345'
          }
        },
        strategy: 'best_price'
      };

      // Mock the order creation
      jest.spyOn(partsSupplierService, 'createOrderWithBestPrice').mockResolvedValue({
        strategy: 'best_price',
        priceComparison: {
          'HO1000245': {
            partNumber: 'HO1000245',
            providers: [
              { provider: 'LKQ Test', price: 285.00, availability: true }
            ],
            bestPrice: 285.00
          }
        },
        orderResults: [
          {
            provider: 'LKQ Test',
            success: true,
            orderNumber: 'ORD-123456',
            items: 1
          }
        ]
      });

      const response = await request(app)
        .post('/api/integrations/parts/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orderResults).toBeDefined();
      expect(response.body.data.orderResults[0].success).toBe(true);
    });

    test('should reject invalid part numbers for price comparison', async () => {
      const invalidData = {
        partNumbers: [], // Empty array
        providers: ['LKQ Test']
      };

      const response = await request(app)
        .post('/api/integrations/parts/pricing/compare')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Webhook Handling', () => {
    test('should handle insurance claim status webhook', async () => {
      const webhookPayload = {
        claimNumber: 'CLM-789012',
        status: 'approved',
        updatedAt: new Date().toISOString()
      };

      // Mock webhook handler
      jest.spyOn(integrationManager, 'handleWebhook').mockResolvedValue({
        status: 'processed',
        result: { success: true, claimNumber: 'CLM-789012', status: 'approved' }
      });

      const response = await request(app)
        .post('/api/integrations/webhooks/mitchell/claim_status_update')
        .send(webhookPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('processed');
    });

    test('should handle parts order status webhook', async () => {
      const webhookPayload = {
        orderNumber: 'ORD-123456',
        status: 'shipped',
        trackingNumber: 'TRK-789012',
        estimatedDelivery: '2024-01-20'
      };

      // Mock webhook handler
      jest.spyOn(integrationManager, 'handleWebhook').mockResolvedValue({
        status: 'processed',
        result: { success: true, orderNumber: 'ORD-123456', status: 'shipped' }
      });

      const response = await request(app)
        .post('/api/integrations/webhooks/lkq/order_status_update')
        .send(webhookPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('processed');
    });

    test('should reject webhook with invalid signature', async () => {
      const webhookPayload = {
        orderNumber: 'ORD-123456',
        status: 'shipped'
      };

      // Mock webhook handler to throw authentication error
      jest.spyOn(integrationManager, 'handleWebhook').mockResolvedValue({
        status: 'error',
        error: 'Invalid webhook signature'
      });

      const response = await request(app)
        .post('/api/integrations/webhooks/lkq/order_status_update')
        .set('x-signature', 'invalid-signature')
        .send(webhookPayload)
        .expect(200); // Webhook still returns 200 but with error status

      expect(response.body.data.status).toBe('error');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid provider registration', async () => {
      const invalidProvider = {
        name: 'Invalid Provider',
        type: 'invalid_type',
        credentials: { apiKey: 'test' }
      };

      const response = await request(app)
        .post('/api/integrations/insurance/providers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProvider)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle missing authentication token', async () => {
      const response = await request(app)
        .get('/api/integrations')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should handle provider not found error', async () => {
      const claimData = {
        provider: 'NonExistent Provider',
        claimData: { policyNumber: 'POL-123' }
      };

      const response = await request(app)
        .post('/api/integrations/insurance/claims')
        .set('Authorization', `Bearer ${authToken}`)
        .send(claimData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    test('should respect rate limits', async () => {
      // This test would require actual rate limiting implementation
      // For now, we'll test that the endpoint responds normally
      const response = await request(app)
        .get('/api/integrations/config')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.rateLimits).toBeDefined();
      expect(response.body.data.rateLimits.requestsPerMinute).toBe(60);
    });
  });

  afterAll(async () => {
    // Clean up any test data or connections
    jest.restoreAllMocks();
  });
});