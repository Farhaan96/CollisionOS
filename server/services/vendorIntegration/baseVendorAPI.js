/**
 * Base Vendor API Class
 * Provides standardized interface for all vendor integrations with rate limiting, caching, and error handling
 */

const EventEmitter = require('events');
const axios = require('axios');
const { APIError } = require('../../utils/errorHandler');

class BaseVendorAPI extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.vendorName = config.vendorName || 'Unknown Vendor';
    this.vendorId = config.vendorId || 'unknown';
    this.vendorType = config.vendorType || 'aftermarket'; // oem, aftermarket, recycled, remanufactured
    
    // API Configuration
    this.baseURL = config.baseURL || '';
    this.apiKey = config.apiKey || '';
    this.username = config.username || '';
    this.password = config.password || '';
    this.timeout = config.timeout || 30000; // 30 seconds
    
    // Rate limiting configuration
    this.rateLimits = {
      inventory: config.rateLimits?.inventory || { requests: 100, window: 60000 }, // 100 requests per minute
      pricing: config.rateLimits?.pricing || { requests: 50, window: 60000 }, // 50 requests per minute
      orders: config.rateLimits?.orders || { requests: 20, window: 60000 }, // 20 requests per minute
      tracking: config.rateLimits?.tracking || { requests: 10, window: 60000 }, // 10 requests per minute
    };
    
    // Rate limiting counters
    this.requestCounters = {};
    
    // Caching configuration
    this.cacheConfig = {
      inventory: config.cacheConfig?.inventory || { ttl: 300000, max: 1000 }, // 5 minutes, 1000 items
      pricing: config.cacheConfig?.pricing || { ttl: 600000, max: 500 }, // 10 minutes, 500 items
      parts: config.cacheConfig?.parts || { ttl: 1800000, max: 2000 }, // 30 minutes, 2000 items
    };
    
    // Performance metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      rateLimitHits: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
    
    // Initialize HTTP client
    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'User-Agent': `CollisionOS-VendorIntegration/1.0`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    this.setupInterceptors();
    this.initializeRateLimiting();
    
    console.log(`🔧 BaseVendorAPI initialized for ${this.vendorName} (${this.vendorId})`);
  }
  
  /**
   * Setup HTTP interceptors for authentication and monitoring
   */
  setupInterceptors() {
    // Request interceptor
    this.httpClient.interceptors.request.use(
      (config) => {
        const startTime = Date.now();
        config.metadata = { startTime };
        
        // Add authentication
        this.addAuthentication(config);
        
        this.metrics.totalRequests++;
        return config;
      },
      (error) => {
        this.metrics.failedRequests++;
        return Promise.reject(error);
      }
    );
    
    // Response interceptor
    this.httpClient.interceptors.response.use(
      (response) => {
        const endTime = Date.now();
        const duration = endTime - response.config.metadata.startTime;
        
        this.updateResponseMetrics(duration, true);
        this.metrics.successfulRequests++;
        
        return response;
      },
      (error) => {
        const endTime = Date.now();
        const duration = endTime - (error.config?.metadata?.startTime || endTime);
        
        this.updateResponseMetrics(duration, false);
        this.metrics.failedRequests++;
        
        // Handle rate limiting
        if (error.response?.status === 429) {
          this.metrics.rateLimitHits++;
          this.emit('rateLimitHit', { vendor: this.vendorId, error });
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Add vendor-specific authentication to request
   * Override in vendor-specific implementations
   */
  addAuthentication(config) {
    if (this.apiKey) {
      config.headers['X-API-Key'] = this.apiKey;
    }
    
    if (this.username && this.password) {
      config.auth = {
        username: this.username,
        password: this.password,
      };
    }
  }
  
  /**
   * Initialize rate limiting counters
   */
  initializeRateLimiting() {
    Object.keys(this.rateLimits).forEach(endpoint => {
      this.requestCounters[endpoint] = {
        count: 0,
        windowStart: Date.now(),
      };
    });
  }
  
  /**
   * Check rate limits for endpoint
   */
  checkRateLimit(endpoint) {
    const limit = this.rateLimits[endpoint];
    if (!limit) return true;
    
    const counter = this.requestCounters[endpoint];
    const now = Date.now();
    
    // Reset counter if window has passed
    if (now - counter.windowStart >= limit.window) {
      counter.count = 0;
      counter.windowStart = now;
    }
    
    return counter.count < limit.requests;
  }
  
  /**
   * Increment rate limit counter
   */
  incrementRateLimit(endpoint) {
    if (this.requestCounters[endpoint]) {
      this.requestCounters[endpoint].count++;
    }
  }
  
  /**
   * Update response time metrics
   */
  updateResponseMetrics(duration, success) {
    const totalResponseTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + duration;
    this.metrics.averageResponseTime = totalResponseTime / this.metrics.totalRequests;
  }
  
  /**
   * Abstract method: Check inventory availability
   * Must be implemented by vendor-specific classes
   */
  async checkInventory(partNumbers, options = {}) {
    throw new APIError(`checkInventory not implemented for ${this.vendorName}`, 501);
  }
  
  /**
   * Abstract method: Get part pricing
   * Must be implemented by vendor-specific classes
   */
  async getPartPricing(partNumbers, quantity = 1, options = {}) {
    throw new APIError(`getPartPricing not implemented for ${this.vendorName}`, 501);
  }
  
  /**
   * Abstract method: Submit purchase order
   * Must be implemented by vendor-specific classes
   */
  async submitPurchaseOrder(orderData) {
    throw new APIError(`submitPurchaseOrder not implemented for ${this.vendorName}`, 501);
  }
  
  /**
   * Abstract method: Track shipment
   * Must be implemented by vendor-specific classes
   */
  async trackShipment(orderNumber) {
    throw new APIError(`trackShipment not implemented for ${this.vendorName}`, 501);
  }
  
  /**
   * Abstract method: Process return
   * Must be implemented by vendor-specific classes
   */
  async processReturn(returnData) {
    throw new APIError(`processReturn not implemented for ${this.vendorName}`, 501);
  }
  
  /**
   * Generic API request with rate limiting and error handling
   */
  async makeRequest(endpoint, method = 'GET', data = null, options = {}) {
    const rateLimitKey = options.rateLimitKey || 'inventory';
    
    // Check rate limits
    if (!this.checkRateLimit(rateLimitKey)) {
      throw new APIError(`Rate limit exceeded for ${this.vendorName} ${rateLimitKey} endpoint`, 429);
    }
    
    try {
      this.incrementRateLimit(rateLimitKey);
      
      const config = {
        method,
        url: endpoint,
        ...options,
      };
      
      if (data) {
        config.data = data;
      }
      
      const response = await this.httpClient.request(config);
      return response.data;
    } catch (error) {
      if (error.response) {
        // HTTP error response
        throw new APIError(
          `${this.vendorName} API error: ${error.response.status} - ${error.response.statusText}`,
          error.response.status
        );
      } else if (error.request) {
        // Network error
        throw new APIError(`${this.vendorName} network error: ${error.message}`, 503);
      } else {
        // Other error
        throw new APIError(`${this.vendorName} request error: ${error.message}`, 500);
      }
    }
  }
  
  /**
   * Get vendor performance metrics
   */
  getMetrics() {
    const successRate = this.metrics.totalRequests > 0 
      ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 
      : 0;
      
    return {
      vendor: this.vendorName,
      vendorId: this.vendorId,
      vendorType: this.vendorType,
      totalRequests: this.metrics.totalRequests,
      successfulRequests: this.metrics.successfulRequests,
      failedRequests: this.metrics.failedRequests,
      successRate: Math.round(successRate * 100) / 100,
      averageResponseTime: Math.round(this.metrics.averageResponseTime),
      rateLimitHits: this.metrics.rateLimitHits,
      cacheHits: this.metrics.cacheHits,
      cacheMisses: this.metrics.cacheMisses,
    };
  }
  
  /**
   * Reset performance metrics
   */
  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      rateLimitHits: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }
  
  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log(`🔧 Shutting down ${this.vendorName} API integration`);
    this.removeAllListeners();
  }
  
  /**
   * Health check
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      await this.makeRequest('/health', 'GET', null, { rateLimitKey: 'inventory' });
      const responseTime = Date.now() - startTime;
      
      return {
        vendor: this.vendorName,
        vendorId: this.vendorId,
        status: 'healthy',
        responseTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        vendor: this.vendorName,
        vendorId: this.vendorId,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

module.exports = BaseVendorAPI;