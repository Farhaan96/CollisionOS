/**
 * Third-Party Integration Framework for CollisionOS
 * Provides robust API integration capabilities with error handling, retry logic,
 * rate limiting, and webhook support for real-time updates
 */

const axios = require('axios');
const EventEmitter = require('events');
const crypto = require('crypto');
const { APIError, logError } = require('../utils/errorHandler');
const { realtimeService } = require('./realtimeService');

/**
 * Base Integration Client with common functionality
 */
class IntegrationClient extends EventEmitter {
  constructor(config) {
    super();
    
    this.name = config.name;
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 30000;
    this.retryAttempts = config.retryAttempts || 3;
    this.rateLimitDelay = config.rateLimitDelay || 1000;
    this.authType = config.authType || 'apikey';
    this.credentials = config.credentials || {};
    
    // Initialize axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CollisionOS/1.0',
        ...config.headers
      }
    });
    
    // Set up request/response interceptors
    this.setupInterceptors();
    
    // Rate limiting
    this.lastRequestTime = 0;
    this.requestQueue = [];
    this.isProcessingQueue = false;
    
    // Webhook verification
    this.webhookSecret = config.webhookSecret;
  }

  /**
   * Set up axios interceptors for auth, retry, and logging
   */
  setupInterceptors() {
    // Request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        // Add authentication
        config = this.addAuthentication(config);
        
        // Log request
        console.log(`📤 ${this.name} API Request: ${config.method?.toUpperCase()} ${config.url}`);
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ ${this.name} API Response: ${response.status} ${response.statusText}`);
        this.emit('response', { status: response.status, data: response.data });
        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        
        // Handle rate limiting
        if (error.response?.status === 429 && !originalRequest._rateLimitRetry) {
          const retryAfter = error.response.headers['retry-after'] || this.rateLimitDelay / 1000;
          console.warn(`⏳ ${this.name} Rate limited, retrying after ${retryAfter}s`);
          
          await this.delay(retryAfter * 1000);
          originalRequest._rateLimitRetry = true;
          return this.client(originalRequest);
        }
        
        // Handle retries for certain errors
        if (this.shouldRetry(error) && !originalRequest._retry) {
          originalRequest._retry = true;
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
          
          if (originalRequest._retryCount <= this.retryAttempts) {
            const delay = this.calculateRetryDelay(originalRequest._retryCount);
            console.warn(`🔄 ${this.name} Retry ${originalRequest._retryCount}/${this.retryAttempts} after ${delay}ms`);
            
            await this.delay(delay);
            return this.client(originalRequest);
          }
        }
        
        // Log error
        const apiError = this.formatError(error);
        logError(apiError);
        this.emit('error', apiError);
        
        return Promise.reject(apiError);
      }
    );
  }

  /**
   * Add authentication to request
   */
  addAuthentication(config) {
    switch (this.authType) {
      case 'apikey':
        config.headers['Authorization'] = `Bearer ${this.credentials.apiKey}`;
        break;
      case 'basic':
        const auth = Buffer.from(`${this.credentials.username}:${this.credentials.password}`).toString('base64');
        config.headers['Authorization'] = `Basic ${auth}`;
        break;
      case 'oauth':
        config.headers['Authorization'] = `Bearer ${this.credentials.accessToken}`;
        break;
      case 'custom':
        if (this.credentials.customHeader) {
          config.headers[this.credentials.customHeader.name] = this.credentials.customHeader.value;
        }
        break;
    }
    return config;
  }

  /**
   * Determine if request should be retried
   */
  shouldRetry(error) {
    if (!error.response) return true; // Network errors
    
    const status = error.response.status;
    return status >= 500 || status === 408 || status === 409;
  }

  /**
   * Calculate exponential backoff delay
   */
  calculateRetryDelay(attempt) {
    const baseDelay = 1000;
    const maxDelay = 30000;
    const delay = baseDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, maxDelay);
  }

  /**
   * Format error for consistent handling
   */
  formatError(error) {
    if (error.response) {
      return new APIError(
        error.response.data?.message || `${this.name} API Error`,
        error.response.status,
        `${this.name.toUpperCase()}_API_ERROR`,
        {
          provider: this.name,
          endpoint: error.config?.url,
          method: error.config?.method,
          response: error.response.data
        }
      );
    } else if (error.request) {
      return new APIError(
        `${this.name} API Network Error`,
        0,
        `${this.name.toUpperCase()}_NETWORK_ERROR`,
        {
          provider: this.name,
          endpoint: error.config?.url
        }
      );
    } else {
      return new APIError(
        error.message,
        0,
        `${this.name.toUpperCase()}_CLIENT_ERROR`,
        { provider: this.name }
      );
    }
  }

  /**
   * Rate-limited request execution
   */
  async makeRequest(config) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ config, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Process request queue with rate limiting
   */
  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    while (this.requestQueue.length > 0) {
      const { config, resolve, reject } = this.requestQueue.shift();
      
      // Enforce rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.rateLimitDelay) {
        await this.delay(this.rateLimitDelay - timeSinceLastRequest);
      }
      
      try {
        const response = await this.client(config);
        this.lastRequestTime = Date.now();
        resolve(response);
      } catch (error) {
        reject(error);
      }
    }
    
    this.isProcessingQueue = false;
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature, secret = null) {
    if (!secret && !this.webhookSecret) {
      throw new APIError('No webhook secret configured', 400);
    }
    
    const webhookSecret = secret || this.webhookSecret;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Generic GET request
   */
  async get(endpoint, params = {}, options = {}) {
    const config = {
      method: 'GET',
      url: endpoint,
      params,
      ...options
    };
    
    const response = await this.makeRequest(config);
    return response.data;
  }

  /**
   * Generic POST request
   */
  async post(endpoint, data = {}, options = {}) {
    const config = {
      method: 'POST',
      url: endpoint,
      data,
      ...options
    };
    
    const response = await this.makeRequest(config);
    return response.data;
  }

  /**
   * Generic PUT request
   */
  async put(endpoint, data = {}, options = {}) {
    const config = {
      method: 'PUT',
      url: endpoint,
      data,
      ...options
    };
    
    const response = await this.makeRequest(config);
    return response.data;
  }

  /**
   * Generic DELETE request
   */
  async delete(endpoint, options = {}) {
    const config = {
      method: 'DELETE',
      url: endpoint,
      ...options
    };
    
    const response = await this.makeRequest(config);
    return response.data;
  }

  /**
   * Health check endpoint
   */
  async healthCheck() {
    try {
      await this.get('/health', {}, { timeout: 5000 });
      return { status: 'healthy', provider: this.name };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        provider: this.name, 
        error: error.message 
      };
    }
  }
}

/**
 * Integration Manager to handle multiple providers
 */
class IntegrationManager extends EventEmitter {
  constructor() {
    super();
    this.providers = new Map();
    this.webhookHandlers = new Map();
  }

  /**
   * Register a new integration provider
   */
  registerProvider(name, client) {
    this.providers.set(name, client);
    
    // Forward events from client
    client.on('response', (data) => this.emit('response', { provider: name, ...data }));
    client.on('error', (error) => this.emit('error', { provider: name, error }));
    
    console.log(`✅ Registered integration provider: ${name}`);
  }

  /**
   * Get provider instance
   */
  getProvider(name) {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new APIError(`Integration provider '${name}' not found`, 404);
    }
    return provider;
  }

  /**
   * Get all providers
   */
  getAllProviders() {
    return Array.from(this.providers.keys());
  }

  /**
   * Register webhook handler
   */
  registerWebhookHandler(provider, eventType, handler) {
    const key = `${provider}:${eventType}`;
    this.webhookHandlers.set(key, handler);
    console.log(`📡 Registered webhook handler: ${key}`);
  }

  /**
   * Handle incoming webhook
   */
  async handleWebhook(provider, eventType, payload, signature = null) {
    try {
      // Verify signature if provided
      if (signature) {
        const providerInstance = this.getProvider(provider);
        if (!providerInstance.verifyWebhookSignature(JSON.stringify(payload), signature)) {
          throw new APIError('Invalid webhook signature', 401);
        }
      }

      // Find and execute handler
      const key = `${provider}:${eventType}`;
      const handler = this.webhookHandlers.get(key);
      
      if (!handler) {
        console.warn(`⚠️ No webhook handler found for ${key}`);
        return { status: 'ignored', message: 'No handler registered' };
      }

      const result = await handler(payload);
      
      // Broadcast update through real-time service
      realtimeService.broadcastIntegrationUpdate({
        provider,
        eventType,
        data: result
      });

      console.log(`✅ Webhook processed: ${key}`);
      return { status: 'processed', result };
      
    } catch (error) {
      logError(error);
      return { status: 'error', error: error.message };
    }
  }

  /**
   * Health check all providers
   */
  async healthCheckAll() {
    const results = {};
    
    for (const [name, provider] of this.providers) {
      try {
        results[name] = await provider.healthCheck();
      } catch (error) {
        results[name] = { 
          status: 'error', 
          provider: name, 
          error: error.message 
        };
      }
    }
    
    return results;
  }

  /**
   * Get integration statistics
   */
  getStatistics() {
    const stats = {
      totalProviders: this.providers.size,
      webhookHandlers: this.webhookHandlers.size,
      providers: {}
    };

    for (const [name, provider] of this.providers) {
      stats.providers[name] = {
        name: provider.name,
        baseURL: provider.baseURL,
        authType: provider.authType,
        retryAttempts: provider.retryAttempts
      };
    }

    return stats;
  }
}

// Global integration manager instance
const integrationManager = new IntegrationManager();

module.exports = {
  IntegrationClient,
  IntegrationManager,
  integrationManager
};