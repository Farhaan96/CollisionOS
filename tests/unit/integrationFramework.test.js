/**
 * Unit Tests for Integration Framework
 * Tests the core integration framework functionality
 */

const {
  IntegrationClient,
  IntegrationManager,
} = require('../../server/services/integrationFramework');
const { APIError } = require('../../server/utils/errorHandler');

// Mock axios
jest.mock('axios');
const axios = require('axios');

describe('Integration Framework', () => {
  let mockAxiosInstance;

  beforeEach(() => {
    mockAxiosInstance = {
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };

    axios.create.mockReturnValue(mockAxiosInstance);
    jest.clearAllMocks();
  });

  describe('IntegrationClient', () => {
    let client;

    beforeEach(() => {
      client = new IntegrationClient({
        name: 'Test Provider',
        baseURL: 'https://api.testprovider.com',
        authType: 'apikey',
        credentials: { apiKey: 'test-api-key' },
        timeout: 5000,
        retryAttempts: 2,
      });
    });

    test('should initialize with correct configuration', () => {
      expect(client.name).toBe('Test Provider');
      expect(client.baseURL).toBe('https://api.testprovider.com');
      expect(client.timeout).toBe(5000);
      expect(client.retryAttempts).toBe(2);
      expect(client.authType).toBe('apikey');
    });

    test('should create axios instance with correct configuration', () => {
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.testprovider.com',
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CollisionOS/1.0',
        },
      });
    });

    test('should set up interceptors', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });

    describe('Authentication', () => {
      test('should add API key authentication', () => {
        const config = { headers: {} };
        const result = client.addAuthentication(config);

        expect(result.headers['Authorization']).toBe('Bearer test-api-key');
      });

      test('should add basic authentication', () => {
        client.authType = 'basic';
        client.credentials = { username: 'user', password: 'pass' };

        const config = { headers: {} };
        const result = client.addAuthentication(config);

        const expectedAuth = Buffer.from('user:pass').toString('base64');
        expect(result.headers['Authorization']).toBe(`Basic ${expectedAuth}`);
      });

      test('should add OAuth authentication', () => {
        client.authType = 'oauth';
        client.credentials = { accessToken: 'oauth-token' };

        const config = { headers: {} };
        const result = client.addAuthentication(config);

        expect(result.headers['Authorization']).toBe('Bearer oauth-token');
      });

      test('should add custom authentication header', () => {
        client.authType = 'custom';
        client.credentials = {
          customHeader: {
            name: 'X-API-Key',
            value: 'custom-key',
          },
        };

        const config = { headers: {} };
        const result = client.addAuthentication(config);

        expect(result.headers['X-API-Key']).toBe('custom-key');
      });
    });

    describe('Error Handling', () => {
      test('should determine if request should be retried', () => {
        // Network errors should be retried
        expect(client.shouldRetry({ request: true })).toBe(true);

        // 5xx errors should be retried
        expect(client.shouldRetry({ response: { status: 500 } })).toBe(true);
        expect(client.shouldRetry({ response: { status: 502 } })).toBe(true);

        // 408 (timeout) should be retried
        expect(client.shouldRetry({ response: { status: 408 } })).toBe(true);

        // 4xx errors (except 408, 409) should not be retried
        expect(client.shouldRetry({ response: { status: 400 } })).toBe(false);
        expect(client.shouldRetry({ response: { status: 404 } })).toBe(false);

        // 409 (conflict) should be retried
        expect(client.shouldRetry({ response: { status: 409 } })).toBe(true);
      });

      test('should calculate exponential backoff delay', () => {
        expect(client.calculateRetryDelay(1)).toBe(1000);
        expect(client.calculateRetryDelay(2)).toBe(2000);
        expect(client.calculateRetryDelay(3)).toBe(4000);
        expect(client.calculateRetryDelay(4)).toBe(8000);
        expect(client.calculateRetryDelay(10)).toBe(30000); // Max delay
      });

      test('should format API response errors', () => {
        const error = {
          response: {
            status: 400,
            data: {
              message: 'Invalid request',
              details: { field: 'required' },
            },
          },
          config: {
            url: '/test',
            method: 'POST',
          },
        };

        const formattedError = client.formatError(error);

        expect(formattedError).toBeInstanceOf(APIError);
        expect(formattedError.message).toBe('Invalid request');
        expect(formattedError.statusCode).toBe(400);
        expect(formattedError.code).toBe('TEST PROVIDER_API_ERROR');
        expect(formattedError.details.provider).toBe('Test Provider');
        expect(formattedError.details.endpoint).toBe('/test');
      });

      test('should format network errors', () => {
        const error = {
          request: true,
          config: { url: '/test' },
        };

        const formattedError = client.formatError(error);

        expect(formattedError).toBeInstanceOf(APIError);
        expect(formattedError.message).toBe('Test Provider API Network Error');
        expect(formattedError.statusCode).toBe(0);
        expect(formattedError.code).toBe('TEST PROVIDER_NETWORK_ERROR');
      });
    });

    describe('HTTP Methods', () => {
      test('should make GET request', async () => {
        const mockResponse = { data: { result: 'success' } };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        // Mock the makeRequest method
        client.makeRequest = jest.fn().mockResolvedValue(mockResponse);

        const result = await client.get('/test', { param: 'value' });

        expect(result).toEqual({ result: 'success' });
        expect(client.makeRequest).toHaveBeenCalledWith({
          method: 'GET',
          url: '/test',
          params: { param: 'value' },
        });
      });

      test('should make POST request', async () => {
        const mockResponse = { data: { id: 1 } };
        mockAxiosInstance.post.mockResolvedValue(mockResponse);

        client.makeRequest = jest.fn().mockResolvedValue(mockResponse);

        const result = await client.post('/test', { data: 'test' });

        expect(result).toEqual({ id: 1 });
        expect(client.makeRequest).toHaveBeenCalledWith({
          method: 'POST',
          url: '/test',
          data: { data: 'test' },
        });
      });

      test('should make PUT request', async () => {
        const mockResponse = { data: { updated: true } };
        mockAxiosInstance.put.mockResolvedValue(mockResponse);

        client.makeRequest = jest.fn().mockResolvedValue(mockResponse);

        const result = await client.put('/test/1', { data: 'updated' });

        expect(result).toEqual({ updated: true });
        expect(client.makeRequest).toHaveBeenCalledWith({
          method: 'PUT',
          url: '/test/1',
          data: { data: 'updated' },
        });
      });

      test('should make DELETE request', async () => {
        const mockResponse = { data: { deleted: true } };
        mockAxiosInstance.delete.mockResolvedValue(mockResponse);

        client.makeRequest = jest.fn().mockResolvedValue(mockResponse);

        const result = await client.delete('/test/1');

        expect(result).toEqual({ deleted: true });
        expect(client.makeRequest).toHaveBeenCalledWith({
          method: 'DELETE',
          url: '/test/1',
        });
      });
    });

    describe('Health Check', () => {
      test('should return healthy status', async () => {
        client.get = jest.fn().mockResolvedValue({ status: 'ok' });

        const result = await client.healthCheck();

        expect(result).toEqual({
          status: 'healthy',
          provider: 'Test Provider',
        });
        expect(client.get).toHaveBeenCalledWith(
          '/health',
          {},
          { timeout: 5000 }
        );
      });

      test('should return unhealthy status on error', async () => {
        client.get = jest
          .fn()
          .mockRejectedValue(new Error('Connection failed'));

        const result = await client.healthCheck();

        expect(result).toEqual({
          status: 'unhealthy',
          provider: 'Test Provider',
          error: 'Connection failed',
        });
      });
    });

    describe('Webhook Signature Verification', () => {
      test('should verify valid webhook signature', () => {
        client.webhookSecret = 'test-secret';
        const payload = '{"test": "data"}';
        const signature = require('crypto')
          .createHmac('sha256', 'test-secret')
          .update(payload)
          .digest('hex');

        const result = client.verifyWebhookSignature(payload, signature);
        expect(result).toBe(true);
      });

      test('should reject invalid webhook signature', () => {
        client.webhookSecret = 'test-secret';
        const payload = '{"test": "data"}';
        const signature = 'invalid-signature';

        expect(() => {
          client.verifyWebhookSignature(payload, signature);
        }).toThrow();
      });

      test('should throw error when no webhook secret configured', () => {
        client.webhookSecret = null;

        expect(() => {
          client.verifyWebhookSignature('payload', 'signature');
        }).toThrow(APIError);
      });
    });
  });

  describe('IntegrationManager', () => {
    let manager;
    let mockClient;

    beforeEach(() => {
      manager = new IntegrationManager();
      mockClient = {
        name: 'Test Provider',
        on: jest.fn(),
        healthCheck: jest.fn(),
        verifyWebhookSignature: jest.fn(),
      };
    });

    test('should register provider', () => {
      manager.registerProvider('test', mockClient);

      expect(manager.providers.has('test')).toBe(true);
      expect(mockClient.on).toHaveBeenCalledTimes(2); // response and error events
    });

    test('should get provider', () => {
      manager.registerProvider('test', mockClient);

      const provider = manager.getProvider('test');
      expect(provider).toBe(mockClient);
    });

    test('should throw error for non-existent provider', () => {
      expect(() => {
        manager.getProvider('nonexistent');
      }).toThrow(APIError);
    });

    test('should get all providers', () => {
      manager.registerProvider('test1', mockClient);
      manager.registerProvider('test2', mockClient);

      const providers = manager.getAllProviders();
      expect(providers).toEqual(['test1', 'test2']);
    });

    test('should register webhook handler', () => {
      const handler = jest.fn();

      manager.registerWebhookHandler('test', 'event', handler);

      expect(manager.webhookHandlers.has('test:event')).toBe(true);
    });

    test('should handle webhook successfully', async () => {
      const handler = jest.fn().mockResolvedValue({ processed: true });
      manager.registerProvider('test', mockClient);
      manager.registerWebhookHandler('test', 'event', handler);

      const payload = { data: 'test' };
      const result = await manager.handleWebhook('test', 'event', payload);

      expect(result.status).toBe('processed');
      expect(handler).toHaveBeenCalledWith(payload);
    });

    test('should handle webhook with signature verification', async () => {
      const handler = jest.fn().mockResolvedValue({ processed: true });
      mockClient.verifyWebhookSignature.mockReturnValue(true);

      manager.registerProvider('test', mockClient);
      manager.registerWebhookHandler('test', 'event', handler);

      const payload = { data: 'test' };
      const result = await manager.handleWebhook(
        'test',
        'event',
        payload,
        'signature'
      );

      expect(mockClient.verifyWebhookSignature).toHaveBeenCalled();
      expect(result.status).toBe('processed');
    });

    test('should reject webhook with invalid signature', async () => {
      mockClient.verifyWebhookSignature.mockReturnValue(false);

      manager.registerProvider('test', mockClient);

      const payload = { data: 'test' };
      const result = await manager.handleWebhook(
        'test',
        'event',
        payload,
        'invalid-signature'
      );

      expect(result.status).toBe('error');
    });

    test('should ignore webhook with no handler', async () => {
      manager.registerProvider('test', mockClient);

      const payload = { data: 'test' };
      const result = await manager.handleWebhook(
        'test',
        'unknown_event',
        payload
      );

      expect(result.status).toBe('ignored');
    });

    test('should health check all providers', async () => {
      const mockClient1 = {
        healthCheck: jest.fn().mockResolvedValue({ status: 'healthy' }),
      };
      const mockClient2 = {
        healthCheck: jest.fn().mockResolvedValue({ status: 'healthy' }),
      };

      manager.registerProvider('test1', mockClient1);
      manager.registerProvider('test2', mockClient2);

      const results = await manager.healthCheckAll();

      expect(results.test1.status).toBe('healthy');
      expect(results.test2.status).toBe('healthy');
    });

    test('should handle health check errors', async () => {
      const mockClient = {
        healthCheck: jest
          .fn()
          .mockRejectedValue(new Error('Connection failed')),
      };

      manager.registerProvider('test', mockClient);

      const results = await manager.healthCheckAll();

      expect(results.test.status).toBe('error');
      expect(results.test.error).toBe('Connection failed');
    });

    test('should get statistics', () => {
      manager.registerProvider('test1', mockClient);
      manager.registerProvider('test2', mockClient);
      manager.registerWebhookHandler('test1', 'event1', jest.fn());
      manager.registerWebhookHandler('test2', 'event2', jest.fn());

      const stats = manager.getStatistics();

      expect(stats.totalProviders).toBe(2);
      expect(stats.webhookHandlers).toBe(2);
      expect(stats.providers.test1).toBeDefined();
      expect(stats.providers.test2).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    let client;

    beforeEach(() => {
      client = new IntegrationClient({
        name: 'Test Provider',
        baseURL: 'https://api.testprovider.com',
        rateLimitDelay: 100,
      });
    });

    test('should enforce rate limiting in request queue', async () => {
      const mockResponse = { data: 'success' };
      client.client = jest.fn().mockResolvedValue(mockResponse);

      const startTime = Date.now();

      // Make two requests quickly
      const promise1 = client.makeRequest({ method: 'GET', url: '/test1' });
      const promise2 = client.makeRequest({ method: 'GET', url: '/test2' });

      await Promise.all([promise1, promise2]);

      const endTime = Date.now();

      // Second request should be delayed by at least the rate limit delay
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });
  });
});
