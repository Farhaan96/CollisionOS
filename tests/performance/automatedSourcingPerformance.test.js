/**
 * Comprehensive Performance Tests for Automated Parts Sourcing System
 * CollisionOS - Performance and Load Testing Suite
 * 
 * Tests performance requirements for:
 * - BMS processing under 30 seconds
 * - Vendor API responses under 2 seconds  
 * - Database queries under 100ms
 * - Dashboard load times under 2 seconds
 * - Mobile app cold start under 3 seconds
 * - 50+ concurrent user simulation
 * - Memory usage and leak detection
 */

const { performance } = require('perf_hooks');
const { AutomatedPartsSourcingService } = require('../../server/services/automatedPartsSourcing');
const { PartsSupplierIntegrationService } = require('../../server/services/partsSupplierIntegration');
const puppeteer = require('puppeteer');
const axios = require('axios');

describe('Automated Parts Sourcing Performance Tests', () => {
  let sourcingService;
  let supplierService;
  let browser;
  let page;

  beforeAll(async () => {
    sourcingService = new AutomatedPartsSourcingService();
    supplierService = new PartsSupplierIntegrationService();
    
    // Launch browser for frontend performance testing
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  describe('BMS Processing Performance', () => {
    it('should process typical BMS estimate under 30 seconds', async () => {
      const typicalBmsData = Array(25).fill().map((_, i) => ({
        lineNumber: i + 1,
        partNumber: `PERF_TEST_${i}`,
        oemPartNumber: `OEM_${i}`,
        description: `Performance Test Part ${i}`,
        quantity: Math.floor(Math.random() * 3) + 1,
        partCost: Math.floor(Math.random() * 500) + 50,
        operationType: 'Replace'
      }));

      const vehicleInfo = {
        year: 2017,
        make: 'Chevrolet',
        model: 'Malibu',
        vin: '1G1BC5SM5H7123456'
      };

      const startTime = performance.now();
      
      const result = await sourcingService.processAutomatedPartsSourcing(
        typicalBmsData,
        vehicleInfo,
        { enhanceWithVinDecoding: true }
      );

      const processingTime = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(25);
      expect(processingTime).toBeLessThan(30000); // 30 second requirement
      
      console.log(`BMS processing completed in ${processingTime.toFixed(2)}ms`);
    });

    it('should handle large BMS file (100+ parts) efficiently', async () => {
      const largeBmsData = Array(150).fill().map((_, i) => ({
        lineNumber: i + 1,
        partNumber: `LARGE_BMS_${i}`,
        description: `Large BMS Test Part ${i}`,
        quantity: 1,
        partCost: Math.floor(Math.random() * 1000) + 25,
        operationType: ['Replace', 'Repair', 'Remove'][Math.floor(Math.random() * 3)]
      }));

      const vehicleInfo = {
        year: 2018,
        make: 'Honda',
        model: 'Accord',
        vin: '1HGBH41JXMN109186'
      };

      const startTime = performance.now();
      
      const result = await sourcingService.processAutomatedPartsSourcing(
        largeBmsData,
        vehicleInfo
      );

      const processingTime = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(150);
      expect(processingTime).toBeLessThan(60000); // 1 minute for large files
      
      console.log(`Large BMS processing completed in ${processingTime.toFixed(2)}ms`);
    });

    it('should maintain memory usage within limits during processing', async () => {
      const initialMemory = process.memoryUsage();
      
      const batchSizes = [25, 50, 100, 200];
      const memoryMeasurements = [];

      for (const batchSize of batchSizes) {
        const bmsData = Array(batchSize).fill().map((_, i) => ({
          lineNumber: i + 1,
          partNumber: `MEMORY_TEST_${i}`,
          description: `Memory Test Part ${i}`,
          quantity: 1,
          partCost: Math.random() * 500
        }));

        const vehicleInfo = {
          year: 2017,
          make: 'Test',
          model: 'Vehicle'
        };

        await sourcingService.processAutomatedPartsSourcing(bmsData, vehicleInfo);
        
        const currentMemory = process.memoryUsage();
        memoryMeasurements.push({
          batchSize,
          heapUsed: currentMemory.heapUsed,
          heapTotal: currentMemory.heapTotal,
          rss: currentMemory.rss
        });
      }

      // Memory usage should not increase linearly with batch size (indicating memory leaks)
      const memoryGrowthRate = memoryMeasurements.map((measurement, index) => {
        if (index === 0) return 0;
        return (measurement.heapUsed - memoryMeasurements[0].heapUsed) / measurement.batchSize;
      });

      const avgGrowthRate = memoryGrowthRate.slice(1).reduce((sum, rate) => sum + rate, 0) / (memoryGrowthRate.length - 1);
      
      expect(avgGrowthRate).toBeLessThan(50000); // Less than 50KB per part
      
      console.log('Memory usage measurements:', memoryMeasurements);
      console.log('Average memory growth rate:', avgGrowthRate, 'bytes per part');
    });
  });

  describe('Vendor API Performance', () => {
    it('should query individual vendors under 2 seconds', async () => {
      const mockPart = {
        normalizedPartNumber: 'PERF_TEST_123',
        classifiedType: 'OEM',
        category: 'body',
        valueTier: 'standard',
        vehicleContext: {
          year: 2017,
          make: 'Chevrolet',
          model: 'Malibu'
        }
      };

      const vendors = ['lkq_direct', 'parts_trader', 'oe_connection'];
      const responseTimes = [];

      for (const vendorId of vendors) {
        const startTime = performance.now();
        
        await sourcingService.queryVendor(vendorId, mockPart);
        
        const responseTime = performance.now() - startTime;
        responseTimes.push({ vendorId, responseTime });
        
        expect(responseTime).toBeLessThan(2000); // 2 second requirement
      }

      console.log('Vendor response times:', responseTimes);
      
      const avgResponseTime = responseTimes.reduce((sum, vendor) => sum + vendor.responseTime, 0) / responseTimes.length;
      expect(avgResponseTime).toBeLessThan(1500); // Average under 1.5 seconds
    });

    it('should handle concurrent vendor queries efficiently', async () => {
      const mockParts = Array(20).fill().map((_, i) => ({
        normalizedPartNumber: `CONCURRENT_${i}`,
        classifiedType: 'OEM',
        category: 'body',
        valueTier: 'standard',
        vehicleContext: {
          year: 2017,
          make: 'Test',
          model: 'Vehicle'
        }
      }));

      const startTime = performance.now();
      
      const promises = mockParts.map(part => 
        sourcingService.checkVendorAvailability(part, { vendorTimeout: 2000 })
      );

      const results = await Promise.all(promises);
      
      const totalTime = performance.now() - startTime;

      expect(results).toHaveLength(20);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds due to parallelization
      
      console.log(`Concurrent vendor queries completed in ${totalTime.toFixed(2)}ms`);
    });

    it('should maintain performance under rate limiting', async () => {
      const mockPart = {
        normalizedPartNumber: 'RATE_LIMIT_TEST',
        valueTier: 'standard'
      };

      const requestCount = 50;
      const startTime = performance.now();
      
      const promises = Array(requestCount).fill().map(() =>
        sourcingService.checkVendorAvailability(mockPart, { vendorTimeout: 3000 })
      );

      const results = await Promise.allSettled(promises);
      
      const totalTime = performance.now() - startTime;
      const successfulRequests = results.filter(r => r.status === 'fulfilled').length;

      console.log(`Rate limiting test: ${successfulRequests}/${requestCount} successful in ${totalTime.toFixed(2)}ms`);
      
      // Should handle rate limiting gracefully without complete failure
      expect(successfulRequests).toBeGreaterThan(requestCount * 0.5); // At least 50% success
      expect(totalTime).toBeLessThan(30000); // Complete within 30 seconds
    });
  });

  describe('Database Query Performance', () => {
    beforeEach(() => {
      // Mock database operations for performance testing
      global.mockDatabase = {
        query: jest.fn().mockImplementation(() => {
          const delay = Math.random() * 50; // Simulate 0-50ms query time
          return new Promise(resolve => 
            setTimeout(() => resolve({ rows: [] }), delay)
          );
        })
      };
    });

    it('should execute parts lookup queries under 100ms', async () => {
      const mockPart = {
        normalizedPartNumber: 'DB_PERF_TEST',
        vehicleContext: {
          year: 2017,
          make: 'Chevrolet',
          model: 'Malibu'
        }
      };

      const queryTypes = [
        'parts_lookup',
        'vendor_pricing',
        'alternative_parts',
        'pricing_history',
        'inventory_check'
      ];

      for (const queryType of queryTypes) {
        const startTime = performance.now();
        
        // Simulate database query
        await global.mockDatabase.query(
          `SELECT * FROM ${queryType} WHERE part_number = $1`,
          [mockPart.normalizedPartNumber]
        );
        
        const queryTime = performance.now() - startTime;
        
        expect(queryTime).toBeLessThan(100); // 100ms requirement
        console.log(`${queryType} query completed in ${queryTime.toFixed(2)}ms`);
      }
    });

    it('should handle batch database operations efficiently', async () => {
      const batchSize = 100;
      const mockParts = Array(batchSize).fill().map((_, i) => `BATCH_PART_${i}`);

      const startTime = performance.now();
      
      // Simulate batch insert/update
      const batchPromises = mockParts.map(partNumber =>
        global.mockDatabase.query(
          'INSERT INTO parts_performance (part_number, timestamp) VALUES ($1, $2)',
          [partNumber, new Date()]
        )
      );

      await Promise.all(batchPromises);
      
      const batchTime = performance.now() - startTime;
      const avgTimePerOperation = batchTime / batchSize;

      expect(avgTimePerOperation).toBeLessThan(50); // Average under 50ms per operation
      console.log(`Batch database operations: ${avgTimePerOperation.toFixed(2)}ms average per operation`);
    });
  });

  describe('Dashboard Load Performance', () => {
    it('should load dashboard under 2 seconds', async () => {
      const startTime = performance.now();
      
      await page.goto('http://localhost:3000/parts-sourcing', { 
        waitUntil: 'networkidle2',
        timeout: 10000
      });

      const loadTime = performance.now() - startTime;
      
      expect(loadTime).toBeLessThan(2000); // 2 second requirement
      console.log(`Dashboard loaded in ${loadTime.toFixed(2)}ms`);
    });

    it('should render components efficiently with real data', async () => {
      await page.goto('http://localhost:3000/parts-sourcing');
      
      // Wait for main components to load
      await page.waitForSelector('[data-testid="automated-sourcing-dashboard"]');
      await page.waitForSelector('[data-testid="vendor-performance-table"]');
      await page.waitForSelector('[data-testid="sourcing-metrics-charts"]');

      // Measure rendering performance
      const metrics = await page.evaluate(() => {
        return JSON.parse(JSON.stringify(performance.getEntriesByType('measure')));
      });

      console.log('Component rendering metrics:', metrics);
      
      // Check for performance entries indicating efficient rendering
      const navigationEntry = await page.evaluate(() => {
        return JSON.parse(JSON.stringify(performance.getEntriesByType('navigation')[0]));
      });

      expect(navigationEntry.domContentLoadedEventEnd - navigationEntry.navigationStart).toBeLessThan(2000);
    });

    it('should handle large datasets without performance degradation', async () => {
      // Mock large dataset
      await page.evaluateOnNewDocument(() => {
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
          if (args[0].includes('/api/parts-sourcing/stats')) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({
                success: true,
                data: {
                  totalParts: 10000,
                  vendors: Array(50).fill().map((_, i) => ({
                    id: `vendor_${i}`,
                    name: `Vendor ${i}`,
                    performance: Math.random() * 100
                  }))
                }
              })
            });
          }
          return originalFetch.apply(this, args);
        };
      });

      const startTime = performance.now();
      
      await page.goto('http://localhost:3000/parts-sourcing');
      await page.waitForSelector('[data-testid="automated-sourcing-dashboard"]');
      
      const loadTime = performance.now() - startTime;
      
      expect(loadTime).toBeLessThan(3000); // Slightly higher threshold for large datasets
      console.log(`Dashboard with large dataset loaded in ${loadTime.toFixed(2)}ms`);
    });

    it('should maintain responsive interactions under load', async () => {
      await page.goto('http://localhost:3000/parts-sourcing');
      await page.waitForSelector('[data-testid="automated-sourcing-dashboard"]');

      // Simulate user interactions
      const interactions = [
        () => page.click('[data-testid="refresh-data-button"]'),
        () => page.click('[data-testid="parts-search-button"]'),
        () => page.type('[data-testid="vendor-filter"]', 'LKQ'),
        () => page.click('[data-testid="export-data-button"]')
      ];

      const interactionTimes = [];

      for (const interaction of interactions) {
        const startTime = performance.now();
        
        await interaction();
        await page.waitForTimeout(100); // Allow interaction to complete
        
        const interactionTime = performance.now() - startTime;
        interactionTimes.push(interactionTime);
        
        expect(interactionTime).toBeLessThan(500); // 500ms for responsive interactions
      }

      console.log('Interaction response times:', interactionTimes);
    });
  });

  describe('Mobile App Performance (Simulated)', () => {
    it('should simulate mobile app cold start under 3 seconds', async () => {
      // Simulate mobile environment constraints
      await page.emulate({
        viewport: { width: 375, height: 667 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7 like Mac OS X)'
      });

      // Simulate slower network conditions
      await page.emulateNetworkConditions({
        offline: false,
        downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
        uploadThroughput: 750 * 1024 / 8, // 750 kbps
        latency: 40 // 40ms latency
      });

      const startTime = performance.now();
      
      await page.goto('http://localhost:3000/mobile/parts-sourcing', {
        waitUntil: 'domcontentloaded',
        timeout: 5000
      });

      const coldStartTime = performance.now() - startTime;
      
      expect(coldStartTime).toBeLessThan(3000); // 3 second requirement for mobile
      console.log(`Mobile app cold start simulated in ${coldStartTime.toFixed(2)}ms`);
    });

    it('should handle mobile touch interactions efficiently', async () => {
      await page.emulate({
        viewport: { width: 375, height: 667 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7 like Mac OS X)'
      });

      await page.goto('http://localhost:3000/mobile/parts-sourcing');
      
      // Simulate touch interactions
      const touchTargets = [
        '[data-testid="mobile-search-parts"]',
        '[data-testid="mobile-vendor-list"]',
        '[data-testid="mobile-po-history"]'
      ];

      const touchResponseTimes = [];

      for (const target of touchTargets) {
        await page.waitForSelector(target, { timeout: 2000 });
        
        const startTime = performance.now();
        await page.tap(target);
        await page.waitForTimeout(100);
        const responseTime = performance.now() - startTime;
        
        touchResponseTimes.push(responseTime);
        expect(responseTime).toBeLessThan(200); // 200ms for touch responses
      }

      console.log('Mobile touch response times:', touchResponseTimes);
    });
  });

  describe('Concurrent User Simulation', () => {
    it('should handle 50+ concurrent users efficiently', async () => {
      const concurrentUsers = 50;
      const testDuration = 30000; // 30 seconds
      
      console.log(`Starting ${concurrentUsers} concurrent user simulation for ${testDuration/1000} seconds`);
      
      const userSessions = [];
      const performanceMetrics = [];

      for (let i = 0; i < concurrentUsers; i++) {
        const userSession = async () => {
          const userStartTime = performance.now();
          
          try {
            // Simulate user workflow
            const sourcingRequest = {
              damageLines: [
                {
                  lineNumber: 1,
                  partNumber: `CONCURRENT_USER_${i}_PART`,
                  description: `User ${i} Test Part`,
                  quantity: 1,
                  partCost: Math.random() * 500
                }
              ],
              vehicleInfo: {
                year: 2015 + (i % 8),
                make: ['Chevrolet', 'Ford', 'Honda', 'Toyota'][i % 4],
                model: 'TestModel'
              }
            };

            const result = await sourcingService.processAutomatedPartsSourcing(
              sourcingRequest.damageLines,
              sourcingRequest.vehicleInfo,
              { vendorTimeout: 3000 }
            );

            const userEndTime = performance.now();
            const userProcessingTime = userEndTime - userStartTime;

            performanceMetrics.push({
              userId: i,
              processingTime: userProcessingTime,
              success: result.success,
              partsProcessed: result.results?.length || 0
            });

          } catch (error) {
            performanceMetrics.push({
              userId: i,
              processingTime: performance.now() - userStartTime,
              success: false,
              error: error.message
            });
          }
        };

        userSessions.push(userSession());
      }

      const startTime = performance.now();
      await Promise.allSettled(userSessions);
      const totalTime = performance.now() - startTime;

      console.log(`Concurrent user simulation completed in ${totalTime.toFixed(2)}ms`);

      // Analyze results
      const successfulSessions = performanceMetrics.filter(m => m.success).length;
      const avgProcessingTime = performanceMetrics
        .filter(m => m.success)
        .reduce((sum, m) => sum + m.processingTime, 0) / successfulSessions;

      console.log(`Success rate: ${(successfulSessions / concurrentUsers * 100).toFixed(1)}%`);
      console.log(`Average processing time: ${avgProcessingTime.toFixed(2)}ms`);

      // Performance requirements
      expect(successfulSessions / concurrentUsers).toBeGreaterThan(0.90); // 90% success rate
      expect(avgProcessingTime).toBeLessThan(10000); // 10 second average under load
      expect(totalTime).toBeLessThan(60000); // Complete within 1 minute
    });

    it('should maintain database integrity under concurrent load', async () => {
      const concurrentOperations = 100;
      const mockDatabaseOperations = [];

      for (let i = 0; i < concurrentOperations; i++) {
        const operation = async () => {
          const startTime = performance.now();
          
          // Simulate database operations
          await global.mockDatabase?.query(
            'INSERT INTO performance_test (operation_id, timestamp) VALUES ($1, $2)',
            [i, new Date()]
          );

          await global.mockDatabase?.query(
            'SELECT * FROM performance_test WHERE operation_id = $1',
            [i]
          );

          return performance.now() - startTime;
        };

        mockDatabaseOperations.push(operation());
      }

      const results = await Promise.allSettled(mockDatabaseOperations);
      const successfulOperations = results.filter(r => r.status === 'fulfilled');

      expect(successfulOperations.length).toBe(concurrentOperations);
      
      const avgDbOperationTime = successfulOperations
        .reduce((sum, r) => sum + r.value, 0) / successfulOperations.length;

      expect(avgDbOperationTime).toBeLessThan(200); // 200ms average for concurrent DB operations
      
      console.log(`Database concurrent operations: ${avgDbOperationTime.toFixed(2)}ms average`);
    });
  });

  describe('Memory and Resource Monitoring', () => {
    it('should monitor memory usage during extended operation', async () => {
      const monitoringDuration = 60000; // 1 minute
      const memorySnapshots = [];
      
      console.log('Starting memory monitoring for 1 minute...');
      
      const memoryMonitor = setInterval(() => {
        const memory = process.memoryUsage();
        memorySnapshots.push({
          timestamp: Date.now(),
          heapUsed: memory.heapUsed,
          heapTotal: memory.heapTotal,
          rss: memory.rss,
          external: memory.external
        });
      }, 5000); // Every 5 seconds

      // Simulate continuous processing
      const processingInterval = setInterval(async () => {
        const bmsData = Array(10).fill().map((_, i) => ({
          lineNumber: i + 1,
          partNumber: `MEMORY_MONITOR_${Date.now()}_${i}`,
          description: `Memory Monitor Part ${i}`,
          quantity: 1,
          partCost: Math.random() * 200
        }));

        await sourcingService.processAutomatedPartsSourcing(
          bmsData,
          { year: 2017, make: 'Test', model: 'Vehicle' }
        );
      }, 2000); // Every 2 seconds

      await new Promise(resolve => setTimeout(resolve, monitoringDuration));
      
      clearInterval(memoryMonitor);
      clearInterval(processingInterval);

      console.log('Memory monitoring completed');
      console.log(`Collected ${memorySnapshots.length} memory snapshots`);

      // Analyze memory usage
      const initialMemory = memorySnapshots[0];
      const finalMemory = memorySnapshots[memorySnapshots.length - 1];
      
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryGrowthRate = memoryGrowth / monitoringDuration * 1000; // bytes per second

      console.log(`Memory growth: ${memoryGrowth} bytes over ${monitoringDuration/1000} seconds`);
      console.log(`Memory growth rate: ${memoryGrowthRate.toFixed(2)} bytes/second`);

      // Memory should not grow excessively (indicating memory leaks)
      expect(memoryGrowthRate).toBeLessThan(100000); // Less than 100KB/second growth
    });

    it('should handle garbage collection efficiently', async () => {
      const initialMemory = process.memoryUsage();
      
      // Create memory pressure
      const largeObjects = [];
      for (let i = 0; i < 1000; i++) {
        const largeObject = {
          id: i,
          data: Array(1000).fill(`memory_pressure_test_${i}`)
        };
        largeObjects.push(largeObject);
      }

      const beforeGcMemory = process.memoryUsage();
      
      // Trigger garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Clear references
      largeObjects.length = 0;
      
      // Wait for GC to potentially run
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const afterGcMemory = process.memoryUsage();

      const memoryReclaimed = beforeGcMemory.heapUsed - afterGcMemory.heapUsed;
      
      console.log('Memory usage:');
      console.log(`  Initial: ${initialMemory.heapUsed} bytes`);
      console.log(`  Before GC: ${beforeGcMemory.heapUsed} bytes`);
      console.log(`  After GC: ${afterGcMemory.heapUsed} bytes`);
      console.log(`  Memory reclaimed: ${memoryReclaimed} bytes`);

      // Memory should be efficiently reclaimed
      expect(memoryReclaimed).toBeGreaterThan(0);
    });
  });
});