/**
 * Enhanced BMS Integration Tests
 * Comprehensive testing for BMS import system including validation, batch processing, and error handling
 */
import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import request from 'supertest';

// Import test utilities
import { createTestApp } from '../../utils/testApp';
import {
  createMockBMSFile,
  createInvalidBMSFile,
} from '../../utils/bmsTestData';
import { generateTestToken } from '../../utils/authUtils';

// Import services to test
import BMSValidator from '../../../src/services/validation/bmsValidator';
import BMSBatchProcessor from '../../../src/services/batch/bmsBatchProcessor';
import BMSErrorReporter from '../../../src/services/error/bmsErrorReporter';

describe('Enhanced BMS Integration Tests', () => {
  let app;
  let testToken;
  let bmsValidator;
  let batchProcessor;
  let errorReporter;
  let testFiles = [];

  beforeEach(async () => {
    // Setup test application
    app = createTestApp();
    testToken = generateTestToken({
      id: 'test-user-id',
      permissions: [
        'bms:upload',
        'bms:batch_upload',
        'bms:view_errors',
        'bms:resolve_errors',
      ],
    });

    // Initialize services
    bmsValidator = new BMSValidator();
    batchProcessor = new BMSBatchProcessor();
    errorReporter = new BMSErrorReporter();

    // Create test files
    testFiles = await createTestBMSFiles();
  });

  afterEach(async () => {
    // Cleanup test files
    await cleanupTestFiles(testFiles);
    testFiles = [];

    // Reset services
    errorReporter.clearErrorLog();
  });

  describe('BMS File Validation', () => {
    test('should validate valid BMS file successfully', async () => {
      const validBMSContent = await createMockBMSFile({
        includeAllSections: true,
        validData: true,
      });

      const validation = await bmsValidator.validateBMSFile(validBMSContent);

      expect(validation.isValid).toBe(true);
      expect(validation.errorCount).toBe(0);
      expect(validation.summary.status).toBe('valid');
      expect(validation.fieldValidations).toBeDefined();
    });

    test('should identify validation errors in invalid BMS file', async () => {
      const invalidBMSContent = await createInvalidBMSFile({
        missingVIN: true,
        invalidEmail: true,
        missingRequiredFields: ['DocumentID', 'ClaimNum'],
      });

      const validation = await bmsValidator.validateBMSFile(invalidBMSContent);

      expect(validation.isValid).toBe(false);
      expect(validation.errorCount).toBeGreaterThan(0);
      expect(validation.errors).toContainEqual(
        expect.objectContaining({
          field: expect.stringContaining('vin'),
          severity: 'error',
        })
      );
    });

    test('should provide detailed field-level validation results', async () => {
      const bmsContent = await createMockBMSFile({
        includeWarnings: true,
      });

      const validation = await bmsValidator.validateBMSFile(bmsContent);

      expect(validation.fieldValidations).toBeDefined();
      expect(
        Object.keys(validation.fieldValidations)
      ).toHaveLength.toBeGreaterThan(0);

      // Check specific field validations
      expect(validation.fieldValidations['DocumentInfo.BMSVer']).toBeDefined();
      expect(validation.fieldValidations['VehicleInfo.VIN']).toBeDefined();
    });

    test('should handle malformed XML gracefully', async () => {
      const malformedXML =
        '<VehicleDamageEstimateAddRq><unclosed-tag>content</VehicleDamageEstimateAddRq>';

      const validation = await bmsValidator.validateBMSFile(malformedXML);

      expect(validation.isValid).toBe(false);
      expect(validation.errors[0].field).toBe('parsing');
      expect(validation.errors[0].message).toContain('parse');
    });
  });

  describe('Single File Upload API', () => {
    test('should upload and process valid BMS file', async () => {
      const response = await request(app)
        .post('/api/bms/upload')
        .set('Authorization', `Bearer ${testToken}`)
        .attach('file', testFiles.validBMS.path)
        .expect(200);

      expect(response.body.status).toBe('completed');
      expect(response.body.uploadId).toBeDefined();
      expect(response.body.data).toBeDefined();
      expect(response.body.validation).toBeDefined();
    });

    test('should reject invalid file types', async () => {
      const textFilePath = await createTextFile(
        'invalid.txt',
        'Not a BMS file'
      );

      const response = await request(app)
        .post('/api/bms/upload')
        .set('Authorization', `Bearer ${testToken}`)
        .attach('file', textFilePath)
        .expect(400);

      expect(response.body.error).toContain('Invalid file type');

      await fs.unlink(textFilePath);
    });

    test('should validate only when validateOnly flag is set', async () => {
      const response = await request(app)
        .post('/api/bms/upload')
        .set('Authorization', `Bearer ${testToken}`)
        .field('validateOnly', 'true')
        .attach('file', testFiles.validBMS.path)
        .expect(200);

      expect(response.body.status).toBe('validated');
      expect(response.body.validation).toBeDefined();
      expect(response.body.data).toBeUndefined();
    });

    test('should handle validation failures appropriately', async () => {
      const response = await request(app)
        .post('/api/bms/upload')
        .set('Authorization', `Bearer ${testToken}`)
        .attach('file', testFiles.invalidBMS.path)
        .expect(400);

      expect(response.body.status).toBe('validation_failed');
      expect(response.body.validation).toBeDefined();
      expect(response.body.validation.isValid).toBe(false);
    });

    test('should require authentication', async () => {
      await request(app)
        .post('/api/bms/upload')
        .attach('file', testFiles.validBMS.path)
        .expect(401);
    });

    test('should enforce rate limiting', async () => {
      // Make multiple rapid requests to trigger rate limit
      const promises = Array(25)
        .fill()
        .map(() =>
          request(app)
            .post('/api/bms/upload')
            .set('Authorization', `Bearer ${testToken}`)
            .attach('file', testFiles.validBMS.path)
        );

      const responses = await Promise.allSettled(promises);
      const rejectedCount = responses.filter(
        r => r.value?.status === 429
      ).length;

      expect(rejectedCount).toBeGreaterThan(0);
    });
  });

  describe('Batch Upload API', () => {
    test('should process multiple BMS files in batch', async () => {
      const response = await request(app)
        .post('/api/bms/batch-upload')
        .set('Authorization', `Bearer ${testToken}`)
        .attach('files', testFiles.validBMS.path)
        .attach('files', testFiles.validBMS2.path)
        .attach('files', testFiles.validBMS3.path)
        .expect(202);

      expect(response.body.batchId).toBeDefined();
      expect(response.body.status).toBe('accepted');
      expect(response.body.totalFiles).toBe(3);
      expect(response.body.statusUrl).toBeDefined();
    });

    test('should handle mixed valid/invalid files in batch', async () => {
      const response = await request(app)
        .post('/api/bms/batch-upload')
        .set('Authorization', `Bearer ${testToken}`)
        .field('pauseOnError', 'false')
        .attach('files', testFiles.validBMS.path)
        .attach('files', testFiles.invalidBMS.path)
        .attach('files', testFiles.validBMS2.path)
        .expect(202);

      expect(response.body.batchId).toBeDefined();

      // Wait for processing to complete
      await waitForBatchCompletion(response.body.batchId);

      // Check batch status
      const statusResponse = await request(app)
        .get(`/api/bms/batch-status/${response.body.batchId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      const status = statusResponse.body.data;
      expect(status.statistics.successfulFiles).toBeGreaterThan(0);
      expect(status.statistics.failedFiles).toBeGreaterThan(0);
    });

    test('should support batch pause/resume/cancel operations', async () => {
      // Start batch
      const uploadResponse = await request(app)
        .post('/api/bms/batch-upload')
        .set('Authorization', `Bearer ${testToken}`)
        .attach('files', testFiles.largeBatch[0].path)
        .attach('files', testFiles.largeBatch[1].path)
        .attach('files', testFiles.largeBatch[2].path)
        .expect(202);

      const batchId = uploadResponse.body.batchId;

      // Pause batch
      await request(app)
        .post(`/api/bms/batch-control/${batchId}/pause`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      // Check paused status
      const pausedStatus = await request(app)
        .get(`/api/bms/batch-status/${batchId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(pausedStatus.body.data.status).toBe('paused');

      // Resume batch
      await request(app)
        .post(`/api/bms/batch-control/${batchId}/resume`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      // Cancel batch
      await request(app)
        .post(`/api/bms/batch-control/${batchId}/cancel`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      // Check cancelled status
      const cancelledStatus = await request(app)
        .get(`/api/bms/batch-status/${batchId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(cancelledStatus.body.data.status).toBe('cancelled');
    });
  });

  describe('Error Reporting System', () => {
    test('should report and categorize errors correctly', async () => {
      const testError = new Error('XML parse error: Invalid character');

      const errorReport = errorReporter.reportError(testError, {
        fileName: 'test.xml',
        operation: 'parsing',
        userId: 'test-user',
      });

      expect(errorReport.id).toBeDefined();
      expect(errorReport.analysis.category).toBe('parsing');
      expect(errorReport.analysis.severity).toBeDefined();
      expect(errorReport.analysis.userMessage).toBeDefined();
      expect(errorReport.analysis.suggestions).toBeInstanceOf(Array);
    });

    test('should provide user-friendly error messages', async () => {
      const networkError = new Error('Network connection failed');

      const errorReport = errorReporter.reportError(networkError, {
        fileName: 'test.xml',
        operation: 'upload',
      });

      expect(errorReport.analysis.userMessage).not.toContain(
        'Network connection failed'
      );
      expect(errorReport.analysis.userMessage).toContain('network');
      expect(errorReport.analysis.suggestions.length).toBeGreaterThan(0);
    });

    test('should track error statistics', async () => {
      // Generate various types of errors
      errorReporter.reportError(new Error('XML parse error'), {
        operation: 'parsing',
      });
      errorReporter.reportError(new Error('Database connection failed'), {
        operation: 'database',
      });
      errorReporter.reportError(new Error('Invalid VIN'), {
        operation: 'validation',
      });

      const statistics = errorReporter.getErrorStatistics();

      expect(statistics.totalErrors).toBe(3);
      expect(statistics.errorsByCategory).toBeDefined();
      expect(statistics.errorsBySeverity).toBeDefined();
    });

    test('should export error logs', async () => {
      // Add some test errors
      errorReporter.reportError(new Error('Test error 1'), {
        operation: 'test',
      });
      errorReporter.reportError(new Error('Test error 2'), {
        operation: 'test',
      });

      const exportData = errorReporter.exportErrorLog({
        format: 'json',
        limit: 10,
      });

      expect(exportData.format).toBe('json');
      expect(exportData.data).toBeInstanceOf(Array);
      expect(exportData.data.length).toBe(2);
      expect(exportData.metadata).toBeDefined();
    });
  });

  describe('Batch Processing System', () => {
    test('should create and manage batch jobs', async () => {
      const files = [
        { name: 'test1.xml', size: 1000 },
        { name: 'test2.xml', size: 2000 },
      ];

      const batchId = batchProcessor.createBatch(files, {
        pauseOnError: false,
        maxRetries: 2,
      });

      expect(batchId).toBeDefined();

      const status = batchProcessor.getBatchStatus(batchId);
      expect(status.status).toBe('created');
      expect(status.statistics.totalFiles).toBe(2);
    });

    test('should track batch progress accurately', done => {
      const files = [
        { name: 'test1.xml', size: 1000 },
        { name: 'test2.xml', size: 2000 },
      ];

      const batchId = batchProcessor.createBatch(files);

      let progressEvents = 0;
      batchProcessor.on('batchProgress', batch => {
        progressEvents++;
        expect(batch.progress).toBeGreaterThanOrEqual(0);
        expect(batch.progress).toBeLessThanOrEqual(100);

        if (batch.progress === 100 || progressEvents >= 5) {
          done();
        }
      });

      batchProcessor.startBatch(batchId);
    });

    test('should handle batch errors gracefully', async () => {
      const batchId = batchProcessor.createBatch([
        { name: 'invalid.xml', size: 1000 },
      ]);

      try {
        await batchProcessor.startBatch(batchId);
      } catch (error) {
        // Expected to fail
      }

      const status = batchProcessor.getBatchStatus(batchId);
      expect(['error', 'completed'].includes(status.status)).toBe(true);
    });
  });

  describe('API Error Handling', () => {
    test('should return structured error responses', async () => {
      const response = await request(app)
        .post('/api/bms/upload')
        .set('Authorization', `Bearer ${testToken}`)
        // No file attached - should cause validation error
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.message).toBeDefined();
    });

    test('should handle authentication errors', async () => {
      const response = await request(app)
        .post('/api/bms/upload')
        .set('Authorization', 'Bearer invalid-token')
        .attach('file', testFiles.validBMS.path)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    test('should handle authorization errors', async () => {
      const limitedToken = generateTestToken({
        id: 'limited-user',
        permissions: [], // No permissions
      });

      const response = await request(app)
        .post('/api/bms/upload')
        .set('Authorization', `Bearer ${limitedToken}`)
        .attach('file', testFiles.validBMS.path)
        .expect(403);

      expect(response.body.error).toBe('Forbidden');
    });
  });

  describe('Statistics and Monitoring', () => {
    test('should provide processing statistics', async () => {
      const response = await request(app)
        .get('/api/bms/statistics')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overall).toBeDefined();
      expect(response.body.data.errors).toBeDefined();
      expect(response.body.data.period).toBeDefined();
    });

    test('should provide error reporting endpoint', async () => {
      // First create some errors
      await request(app)
        .post('/api/bms/upload')
        .set('Authorization', `Bearer ${testToken}`)
        .attach('file', testFiles.invalidBMS.path);

      const response = await request(app)
        .get('/api/bms/errors')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.errors).toBeInstanceOf(Array);
      expect(response.body.data.statistics).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
    });
  });

  describe('Performance and Load Testing', () => {
    test('should handle concurrent uploads efficiently', async () => {
      const concurrentUploads = 5;
      const startTime = Date.now();

      const promises = Array(concurrentUploads)
        .fill()
        .map((_, index) =>
          request(app)
            .post('/api/bms/upload')
            .set('Authorization', `Bearer ${testToken}`)
            .attach('file', testFiles[`validBMS${index % 3}`].path)
        );

      const results = await Promise.allSettled(promises);
      const successCount = results.filter(r => r.value?.status === 200).length;
      const processingTime = Date.now() - startTime;

      expect(successCount).toBeGreaterThan(0);
      expect(processingTime).toBeLessThan(30000); // Should complete within 30 seconds
    });

    test('should handle large file uploads', async () => {
      const largeFile = await createLargeBMSFile();

      const response = await request(app)
        .post('/api/bms/upload')
        .set('Authorization', `Bearer ${testToken}`)
        .attach('file', largeFile.path)
        .timeout(60000) // 60 second timeout
        .expect(200);

      expect(response.body.status).toBe('completed');

      await fs.unlink(largeFile.path);
    }, 60000);
  });

  // Helper Functions
  async function createTestBMSFiles() {
    const tempDir = path.join(__dirname, '../../temp');
    await fs.mkdir(tempDir, { recursive: true });

    const files = {};

    // Valid BMS file
    files.validBMS = {
      path: path.join(tempDir, 'valid1.xml'),
      content: await createMockBMSFile({ includeAllSections: true }),
    };

    files.validBMS2 = {
      path: path.join(tempDir, 'valid2.xml'),
      content: await createMockBMSFile({
        includeAllSections: true,
        customerName: 'Jane Smith',
      }),
    };

    files.validBMS3 = {
      path: path.join(tempDir, 'valid3.xml'),
      content: await createMockBMSFile({
        includeAllSections: true,
        customerName: 'Bob Johnson',
      }),
    };

    // Invalid BMS file
    files.invalidBMS = {
      path: path.join(tempDir, 'invalid.xml'),
      content: await createInvalidBMSFile({ missingVIN: true }),
    };

    // Large batch files
    files.largeBatch = [];
    for (let i = 0; i < 5; i++) {
      files.largeBatch.push({
        path: path.join(tempDir, `batch${i}.xml`),
        content: await createMockBMSFile({
          includeAllSections: true,
          customerName: `Customer ${i}`,
          manyDamageLines: true,
        }),
      });
    }

    // Write all files
    for (const [key, file] of Object.entries(files)) {
      if (Array.isArray(file)) {
        for (const f of file) {
          await fs.writeFile(f.path, f.content);
        }
      } else {
        await fs.writeFile(file.path, file.content);
      }
    }

    return files;
  }

  async function cleanupTestFiles(files) {
    for (const [key, file] of Object.entries(files)) {
      try {
        if (Array.isArray(file)) {
          for (const f of file) {
            await fs.unlink(f.path);
          }
        } else {
          await fs.unlink(file.path);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  async function createTextFile(filename, content) {
    const tempPath = path.join(__dirname, '../../temp', filename);
    await fs.writeFile(tempPath, content);
    return tempPath;
  }

  async function createLargeBMSFile() {
    const content = await createMockBMSFile({
      includeAllSections: true,
      manyDamageLines: true,
      damageLineCount: 500, // Create a file with many damage lines
    });

    const filePath = path.join(__dirname, '../../temp/large.xml');
    await fs.writeFile(filePath, content);

    return { path: filePath, content };
  }

  async function waitForBatchCompletion(batchId, timeout = 30000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const response = await request(app)
        .get(`/api/bms/batch-status/${batchId}`)
        .set('Authorization', `Bearer ${testToken}`);

      if (
        response.body.data.status === 'completed' ||
        response.body.data.status === 'error' ||
        response.body.data.status === 'cancelled'
      ) {
        return response.body.data;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Batch processing timeout');
  }
});
