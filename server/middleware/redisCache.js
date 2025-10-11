/**
 * Redis Caching Middleware
 * 
 * Implements intelligent caching for CollisionOS:
 * - Query result caching
 * - Dashboard stats caching
 * - User session caching
 * - API response caching
 * - Cache invalidation strategies
 */

const Redis = require('redis');
const crypto = require('crypto');

class RedisCache {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.cacheConfig = {
      // Cache TTL configurations (in seconds)
      dashboardStats: 300,      // 5 minutes
      repairOrderLists: 120,    // 2 minutes
      customerSearch: 600,       // 10 minutes
      partsInventory: 900,       // 15 minutes
      userPermissions: 1800,     // 30 minutes
      apiResponses: 60,          // 1 minute
      userSessions: 3600,        // 1 hour
      staticData: 86400         // 24 hours
    };
  }

  async initialize() {
    try {
      this.redis = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error('Redis connection refused');
            return new Error('Redis connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Redis retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.redis.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.redis.on('connect', () => {
        console.log('Redis connected successfully');
        this.isConnected = true;
      });

      this.redis.on('disconnect', () => {
        console.log('Redis disconnected');
        this.isConnected = false;
      });

      await this.redis.connect();
      return true;
    } catch (error) {
      console.error('Redis initialization failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Generate cache key from request parameters
   */
  generateCacheKey(prefix, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    const paramString = JSON.stringify(sortedParams);
    const hash = crypto.createHash('md5').update(paramString).digest('hex');
    return `${prefix}:${hash}`;
  }

  /**
   * Get data from cache
   */
  async get(key) {
    if (!this.isConnected) return null;
    
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set data in cache with TTL
   */
  async set(key, data, ttl = null) {
    if (!this.isConnected) return false;
    
    try {
      const serializedData = JSON.stringify(data);
      if (ttl) {
        await this.redis.setEx(key, ttl, serializedData);
      } else {
        await this.redis.set(key, serializedData);
      }
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete data from cache
   */
  async del(key) {
    if (!this.isConnected) return false;
    
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys with pattern
   */
  async delPattern(pattern) {
    if (!this.isConnected) return false;
    
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Cache pattern delete error:', error);
      return false;
    }
  }

  /**
   * Cache middleware for API responses
   */
  cacheMiddleware(ttl = 60, keyGenerator = null) {
    return async (req, res, next) => {
      if (!this.isConnected) {
        return next();
      }

      try {
        // Generate cache key
        const cacheKey = keyGenerator 
          ? keyGenerator(req)
          : this.generateCacheKey('api', {
              path: req.path,
              method: req.method,
              query: req.query,
              user: req.user?.id,
              shop: req.user?.shopId
            });

        // Try to get from cache
        const cachedData = await this.get(cacheKey);
        if (cachedData) {
          res.json(cachedData);
          return;
        }

        // Store original json method
        const originalJson = res.json;
        
        // Override json method to cache response
        res.json = function(data) {
          // Cache the response
          this.set(cacheKey, data, ttl);
          
          // Call original json method
          return originalJson.call(this, data);
        }.bind(this);

        next();
      } catch (error) {
        console.error('Cache middleware error:', error);
        next();
      }
    };
  }

  /**
   * Cache dashboard stats
   */
  async cacheDashboardStats(shopId, stats) {
    const key = `dashboard:stats:${shopId}`;
    return await this.set(key, stats, this.cacheConfig.dashboardStats);
  }

  /**
   * Get cached dashboard stats
   */
  async getDashboardStats(shopId) {
    const key = `dashboard:stats:${shopId}`;
    return await this.get(key);
  }

  /**
   * Cache repair order list
   */
  async cacheRepairOrderList(shopId, filters, data) {
    const key = this.generateCacheKey('repair_orders', { shopId, ...filters });
    return await this.set(key, data, this.cacheConfig.repairOrderLists);
  }

  /**
   * Get cached repair order list
   */
  async getRepairOrderList(shopId, filters) {
    const key = this.generateCacheKey('repair_orders', { shopId, ...filters });
    return await this.get(key);
  }

  /**
   * Cache customer search results
   */
  async cacheCustomerSearch(shopId, query, results) {
    const key = this.generateCacheKey('customer_search', { shopId, query });
    return await this.set(key, results, this.cacheConfig.customerSearch);
  }

  /**
   * Get cached customer search results
   */
  async getCustomerSearch(shopId, query) {
    const key = this.generateCacheKey('customer_search', { shopId, query });
    return await this.get(key);
  }

  /**
   * Cache parts inventory
   */
  async cachePartsInventory(shopId, data) {
    const key = `parts:inventory:${shopId}`;
    return await this.set(key, data, this.cacheConfig.partsInventory);
  }

  /**
   * Get cached parts inventory
   */
  async getPartsInventory(shopId) {
    const key = `parts:inventory:${shopId}`;
    return await this.get(key);
  }

  /**
   * Cache user permissions
   */
  async cacheUserPermissions(userId, permissions) {
    const key = `user:permissions:${userId}`;
    return await this.set(key, permissions, this.cacheConfig.userPermissions);
  }

  /**
   * Get cached user permissions
   */
  async getUserPermissions(userId) {
    const key = `user:permissions:${userId}`;
    return await this.get(key);
  }

  /**
   * Cache user session
   */
  async cacheUserSession(sessionId, sessionData) {
    const key = `session:${sessionId}`;
    return await this.set(key, sessionData, this.cacheConfig.userSessions);
  }

  /**
   * Get cached user session
   */
  async getUserSession(sessionId) {
    const key = `session:${sessionId}`;
    return await this.get(key);
  }

  /**
   * Invalidate cache for specific shop
   */
  async invalidateShopCache(shopId) {
    const patterns = [
      `dashboard:stats:${shopId}`,
      `repair_orders:*shopId*${shopId}*`,
      `customer_search:*shopId*${shopId}*`,
      `parts:inventory:${shopId}`,
      `api:*shop*${shopId}*`
    ];

    for (const pattern of patterns) {
      await this.delPattern(pattern);
    }
  }

  /**
   * Invalidate cache for specific user
   */
  async invalidateUserCache(userId) {
    const patterns = [
      `user:permissions:${userId}`,
      `session:*`,
      `api:*user*${userId}*`
    ];

    for (const pattern of patterns) {
      await this.delPattern(pattern);
    }
  }

  /**
   * Invalidate cache for specific repair order
   */
  async invalidateRepairOrderCache(repairOrderId) {
    const patterns = [
      `repair_orders:*`,
      `dashboard:stats:*`,
      `api:*repair*`,
      `api:*ro*`
    ];

    for (const pattern of patterns) {
      await this.delPattern(pattern);
    }
  }

  /**
   * Invalidate cache for specific customer
   */
  async invalidateCustomerCache(customerId) {
    const patterns = [
      `customer_search:*`,
      `repair_orders:*`,
      `api:*customer*`
    ];

    for (const pattern of patterns) {
      await this.delPattern(pattern);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    if (!this.isConnected) return null;
    
    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      
      return {
        connected: this.isConnected,
        memory: info,
        keyspace: keyspace,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }

  /**
   * Clear all cache
   */
  async clearAllCache() {
    if (!this.isConnected) return false;
    
    try {
      await this.redis.flushAll();
      return true;
    } catch (error) {
      console.error('Clear cache error:', error);
      return false;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    if (!this.isConnected) return false;
    
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const redisCache = new RedisCache();

module.exports = redisCache;
