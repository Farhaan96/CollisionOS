const request = require('supertest');
const express = require('express');

// Performance test suite for API endpoints
describe('API Performance Tests', () => {
  let app;
  
  beforeAll(async () => {
    // Setup test app with mock routes
    app = express();
    app.use(express.json());

    // Mock authentication middleware
    app.use((req, res, next) => {
      req.user = { id: 1, role: 'admin' };
      next();
    });

    // Mock routes with realistic delays
    app.get('/api/customers', async (req, res) => {
      // Simulate database query time
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
      
      const customers = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        firstName: `Customer${i + 1}`,
        lastName: 'Test',
        email: `customer${i + 1}@example.com`,
        phone: `555-${String(i + 1).padStart(4, '0')}`
      }));
      
      res.json({ success: true, data: customers });
    });

    app.get('/api/jobs', async (req, res) => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 75));
      
      const jobs = Array.from({ length: 200 }, (_, i) => ({
        id: i + 1,
        jobNumber: `JOB-${String(i + 1).padStart(4, '0')}`,
        customerId: Math.floor(Math.random() * 100) + 1,
        status: ['pending', 'in_progress', 'completed'][Math.floor(Math.random() * 3)],
        estimatedHours: Math.floor(Math.random() * 20) + 1,
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString()
      }));
      
      res.json({ success: true, data: jobs });
    });

    app.get('/api/dashboard/stats', async (req, res) => {
      // Simulate complex aggregation query
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      
      const stats = {
        totalJobs: 1250,
        activeJobs: 45,
        completedJobs: 1205,
        totalRevenue: 2500000,
        monthlyRevenue: 85000,
        averageJobTime: 8.5,
        customerSatisfaction: 4.7
      };
      
      res.json({ success: true, data: stats });
    });

    app.post('/api/customers', async (req, res) => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 30));
      
      const customer = {
        id: Math.floor(Math.random() * 10000),
        ...req.body,
        createdAt: new Date().toISOString()
      };
      
      res.status(201).json({ success: true, data: customer });
    });

    app.post('/api/jobs', async (req, res) => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 40));
      
      const job = {
        id: Math.floor(Math.random() * 10000),
        jobNumber: `JOB-${Date.now()}`,
        ...req.body,
        createdAt: new Date().toISOString()
      };
      
      res.status(201).json({ success: true, data: job });
    });
  });

  describe('Response Time Performance', () => {
    const RESPONSE_TIME_THRESHOLD = 100; // 100ms threshold

    test('GET /api/customers should respond within threshold', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/customers')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      console.log(`Customers API response time: ${responseTime}ms`);
      
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/jobs should respond within threshold', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/jobs')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      console.log(`Jobs API response time: ${responseTime}ms`);
      
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD + 25); // Slightly higher threshold for more complex data
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/dashboard/stats should respond within threshold', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/dashboard/stats')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      console.log(`Dashboard stats API response time: ${responseTime}ms`);
      
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD + 50); // Higher threshold for aggregations
      expect(response.body.success).toBe(true);
      expect(typeof response.body.data).toBe('object');
    });

    test('POST /api/customers should respond within threshold', async () => {
      const customerData = {
        firstName: 'Performance',
        lastName: 'Test',
        email: 'perf@test.com',
        phone: '555-0000'
      };

      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/customers')
        .send(customerData)
        .expect(201);
      
      const responseTime = Date.now() - startTime;
      console.log(`Create customer API response time: ${responseTime}ms`);
      
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Concurrent Request Performance', () => {
    test('should handle multiple concurrent GET requests', async () => {
      const concurrentRequests = 10;
      const promises = [];

      const startTime = Date.now();

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(app)
            .get('/api/customers')
            .expect(200)
        );
      }

      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / concurrentRequests;

      console.log(`${concurrentRequests} concurrent requests completed in ${totalTime}ms (avg: ${averageTime.toFixed(2)}ms)`);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
      });

      // Average response time should be reasonable
      expect(averageTime).toBeLessThan(200);
    });

    test('should handle mixed concurrent requests', async () => {
      const requests = [
        request(app).get('/api/customers'),
        request(app).get('/api/jobs'),
        request(app).get('/api/dashboard/stats'),
        request(app).post('/api/customers').send({
          firstName: 'Concurrent',
          lastName: 'Test',
          email: 'concurrent@test.com'
        }),
        request(app).post('/api/jobs').send({
          customerId: 1,
          description: 'Concurrent test job'
        })
      ];

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      console.log(`Mixed concurrent requests completed in ${totalTime}ms`);

      // All requests should succeed with appropriate status codes
      expect(responses[0].status).toBe(200); // GET customers
      expect(responses[1].status).toBe(200); // GET jobs
      expect(responses[2].status).toBe(200); // GET stats
      expect(responses[3].status).toBe(201); // POST customer
      expect(responses[4].status).toBe(201); // POST job

      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Load Testing', () => {
    test('should handle sustained load', async () => {
      const requestsPerBatch = 5;
      const batchCount = 3;
      const batchResults = [];

      for (let batch = 0; batch < batchCount; batch++) {
        const batchStartTime = Date.now();
        const batchPromises = [];

        for (let i = 0; i < requestsPerBatch; i++) {
          batchPromises.push(
            request(app)
              .get('/api/customers')
              .expect(200)
          );
        }

        const responses = await Promise.all(batchPromises);
        const batchTime = Date.now() - batchStartTime;
        
        batchResults.push({
          batch: batch + 1,
          time: batchTime,
          successCount: responses.length,
          averageTime: batchTime / requestsPerBatch
        });

        console.log(`Batch ${batch + 1}: ${requestsPerBatch} requests in ${batchTime}ms (avg: ${(batchTime / requestsPerBatch).toFixed(2)}ms)`);

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Verify performance consistency across batches
      const avgBatchTime = batchResults.reduce((sum, batch) => sum + batch.averageTime, 0) / batchCount;
      const maxBatchTime = Math.max(...batchResults.map(batch => batch.averageTime));
      const minBatchTime = Math.min(...batchResults.map(batch => batch.averageTime));

      console.log(`Load test summary: avg=${avgBatchTime.toFixed(2)}ms, min=${minBatchTime.toFixed(2)}ms, max=${maxBatchTime.toFixed(2)}ms`);

      // Performance shouldn't degrade significantly
      expect(maxBatchTime - minBatchTime).toBeLessThan(100); // Max variation of 100ms
      expect(avgBatchTime).toBeLessThan(150);
    });
  });

  describe('Memory and Resource Usage', () => {
    test('should not leak memory during repeated requests', async () => {
      const initialMemory = process.memoryUsage();
      const requestCount = 20;

      // Make repeated requests
      for (let i = 0; i < requestCount; i++) {
        await request(app)
          .get('/api/customers')
          .expect(200);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      console.log(`Memory usage - Initial: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB, Final: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);

      // Memory increase should be reasonable (less than 10MB for 20 requests)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Database Performance Simulation', () => {
    test('should handle simulated slow database queries', async () => {
      // Create endpoint with artificial delay
      app.get('/api/slow-query', async (req, res) => {
        // Simulate slow database query (200ms)
        await new Promise(resolve => setTimeout(resolve, 200));
        res.json({ 
          success: true, 
          data: { message: 'Slow query completed' },
          queryTime: 200 
        });
      });

      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/slow-query')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      console.log(`Slow query response time: ${responseTime}ms`);
      
      // Should handle slow queries gracefully
      expect(responseTime).toBeGreaterThan(190); // Should take at least the simulated time
      expect(responseTime).toBeLessThan(300); // But not too much overhead
      expect(response.body.success).toBe(true);
    });

    test('should handle concurrent slow queries', async () => {
      const slowPromises = [];
      const concurrentSlowRequests = 3;

      const startTime = Date.now();

      for (let i = 0; i < concurrentSlowRequests; i++) {
        slowPromises.push(
          request(app)
            .get('/api/slow-query')
            .expect(200)
        );
      }

      const responses = await Promise.all(slowPromises);
      const totalTime = Date.now() - startTime;

      console.log(`${concurrentSlowRequests} concurrent slow queries completed in ${totalTime}ms`);

      // Should handle concurrent slow queries
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
      });

      // Should run concurrently, not sequentially
      expect(totalTime).toBeLessThan(400); // Less than 3 * 200ms if running concurrently
      expect(totalTime).toBeGreaterThan(190); // But at least as long as one query
    });
  });

  describe('Error Handling Performance', () => {
    test('should handle 404 errors quickly', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/nonexistent-endpoint')
        .expect(404);
      
      const responseTime = Date.now() - startTime;
      console.log(`404 error response time: ${responseTime}ms`);
      
      // Error responses should be fast
      expect(responseTime).toBeLessThan(50);
    });

    test('should handle validation errors quickly', async () => {
      // Add validation error endpoint
      app.post('/api/validate-test', (req, res) => {
        if (!req.body.requiredField) {
          return res.status(400).json({
            success: false,
            error: 'Required field missing'
          });
        }
        res.json({ success: true });
      });

      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/validate-test')
        .send({}) // Missing required field
        .expect(400);
      
      const responseTime = Date.now() - startTime;
      console.log(`Validation error response time: ${responseTime}ms`);
      
      expect(responseTime).toBeLessThan(50);
      expect(response.body.success).toBe(false);
    });
  });
});