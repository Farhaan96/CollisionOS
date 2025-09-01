/**
 * Scalable NLP Query Router
 * 3-Tier Architecture for handling thousands of concurrent users
 * Tier 1: Smart Caching (70% of queries)
 * Tier 2: Local NLP Processing (25% of queries)
 * Tier 3: Cloud AI APIs (5% of queries)
 */

const redis = require('redis');
const crypto = require('crypto');
const { IntelligentCollisionAssistant } = require('./intelligentAssistant');

class ScalableNLPRouter {
  constructor() {
    this.redisClient = null;
    this.memoryCache = new Map(); // Fallback memory cache
    this.intelligentAssistant = new IntelligentCollisionAssistant();
    this.initializeRedis();

    // Performance tracking
    this.stats = {
      cacheHits: 0,
      localProcessing: 0,
      cloudAPIUsage: 0,
      totalQueries: 0,
      avgResponseTime: 0,
    };

    // Common collision repair query patterns for caching
    this.commonPatterns = [
      {
        pattern: /what('s|\s+is)\s+(in\s+)?repair/i,
        category: 'status_inquiry',
      },
      {
        pattern: /show\s+(me\s+)?(repair\s+orders?|ros?)\s*(from|this)?/i,
        category: 'repair_orders_list',
      },
      {
        pattern: /how\s+many\s+(repair|job|vehicle)/i,
        category: 'count_query',
      },
      { pattern: /what('s|\s+is)\s+our\s+average/i, category: 'analytics' },
      { pattern: /pending\s+parts?/i, category: 'workflow_status' },
      {
        pattern: /ready\s+for\s+(pickup|delivery)/i,
        category: 'ready_vehicles',
      },
      { pattern: /overdue|behind\s+schedule/i, category: 'overdue_repairs' },
      {
        pattern: /(honda|toyota|ford|bmw|mercedes)/i,
        category: 'vehicle_search',
      },
    ];
  }

  async initializeRedis() {
    try {
      // Use local Redis for development, cloud Redis for production
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.redisClient = redis.createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: retries => {
            if (retries > 3) {
              console.warn(
                '⚠️ Redis unavailable after 3 attempts, continuing without cache'
              );
              return false;
            }
            return Math.min(retries * 1000, 3000);
          },
        },
      });

      this.redisClient.on('error', err => {
        // Silently handle Redis errors - already logged via reconnectStrategy
        this.redisClient = null;
      });

      this.redisClient.on('connect', () => {
        console.log('✅ Redis cache connected successfully');
      });

      await this.redisClient.connect();
    } catch (error) {
      console.warn(
        '⚠️ Redis not available, continuing without cache:',
        error.message
      );
      this.redisClient = null;
    }
  }

  /**
   * Main query routing logic - 3-tier processing
   */
  async processQuery(query, shopId, userId, userToken) {
    const startTime = Date.now();
    this.stats.totalQueries++;

    try {
      // Normalize query for consistent processing
      const normalizedQuery = this.normalizeQuery(query);

      console.log(
        `🎯 Processing query: "${normalizedQuery}" (shop: ${shopId})`
      );

      // TIER 1: Check cache first (70% hit rate expected)
      const cachedResult = await this.checkCache(normalizedQuery, shopId);
      if (cachedResult) {
        this.stats.cacheHits++;
        console.log(`⚡ Cache hit for query: "${normalizedQuery}"`);
        return this.addPerformanceMetrics(cachedResult, startTime, 'cache');
      }

      // TIER 2: Local NLP processing (25% of queries)
      const complexity = this.assessQueryComplexity(normalizedQuery);
      console.log(
        `🔍 Query complexity: ${complexity.score} (${complexity.reason})`
      );

      if (complexity.score >= 0.7) {
        const result = await this.processLocalNLP(
          normalizedQuery,
          shopId,
          userId,
          userToken
        );
        this.stats.localProcessing++;

        // Cache successful results
        await this.cacheResult(normalizedQuery, shopId, result);

        return this.addPerformanceMetrics(result, startTime, 'local');
      }

      // TIER 3: Advanced AI processing (5% of queries)
      const result = await this.processWithCloudAI(
        normalizedQuery,
        shopId,
        userId,
        userToken
      );
      this.stats.cloudAPIUsage++;

      // Cache AI results for reuse
      await this.cacheResult(normalizedQuery, shopId, result, 300); // 5 min cache for AI

      return this.addPerformanceMetrics(result, startTime, 'cloud');
    } catch (error) {
      console.error('❌ NLP Router error:', error);
      return this.generateFallbackResponse(query, error);
    }
  }

  /**
   * TIER 1: Smart Caching Layer (Redis or Memory)
   */
  async checkCache(normalizedQuery, shopId) {
    const cacheKey = this.generateCacheKey(normalizedQuery, shopId);

    // Try Redis first
    if (this.redisClient) {
      try {
        const cached = await this.redisClient.get(cacheKey);
        if (cached) {
          const result = JSON.parse(cached);
          result.fromCache = true;
          result.cacheTimestamp = new Date().toISOString();
          result.cacheSource = 'redis';
          return result;
        }
      } catch (error) {
        console.warn('⚠️ Redis cache check failed:', error.message);
      }
    }

    // Fallback to memory cache
    if (this.memoryCache.has(cacheKey)) {
      const cached = this.memoryCache.get(cacheKey);
      if (cached.expiry > Date.now()) {
        const result = { ...cached.data };
        result.fromCache = true;
        result.cacheTimestamp = new Date().toISOString();
        result.cacheSource = 'memory';
        console.log(`💾 Memory cache hit for: "${normalizedQuery}"`);
        return result;
      } else {
        // Clean up expired entry
        this.memoryCache.delete(cacheKey);
      }
    }

    return null;
  }

  async cacheResult(normalizedQuery, shopId, result, ttlSeconds = 600) {
    if (!result) return;

    const cacheKey = this.generateCacheKey(normalizedQuery, shopId);

    // Remove performance metadata before caching
    const cacheData = { ...result };
    delete cacheData.processingTime;
    delete cacheData.processingTier;
    delete cacheData.fromCache;
    delete cacheData.cacheSource;

    // Try Redis first
    if (this.redisClient) {
      try {
        await this.redisClient.setEx(
          cacheKey,
          ttlSeconds,
          JSON.stringify(cacheData)
        );
        console.log(
          `💾 Redis cached result for: "${normalizedQuery}" (TTL: ${ttlSeconds}s)`
        );
        return;
      } catch (error) {
        console.warn('⚠️ Redis cache write failed:', error.message);
      }
    }

    // Fallback to memory cache
    const expiry = Date.now() + ttlSeconds * 1000;
    this.memoryCache.set(cacheKey, {
      data: cacheData,
      expiry: expiry,
    });
    console.log(
      `💾 Memory cached result for: "${normalizedQuery}" (TTL: ${ttlSeconds}s)`
    );

    // Clean up old entries periodically
    if (this.memoryCache.size > 100) {
      this.cleanupMemoryCache();
    }
  }

  cleanupMemoryCache() {
    const now = Date.now();
    const toDelete = [];

    for (const [key, value] of this.memoryCache.entries()) {
      if (value.expiry <= now) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.memoryCache.delete(key));
    console.log(`🧹 Cleaned up ${toDelete.length} expired cache entries`);
  }

  /**
   * TIER 2: Local NLP Processing
   */
  async processLocalNLP(query, shopId, userId, userToken) {
    console.log('🔧 Processing with local NLP');

    // Use existing intelligent assistant for local processing
    return await this.intelligentAssistant.processIntelligentQuery(
      query,
      shopId,
      userId,
      userToken
    );
  }

  /**
   * TIER 3: Cloud AI Processing (Future implementation)
   */
  async processWithCloudAI(query, shopId, userId, userToken) {
    console.log('☁️ Processing with Cloud AI (fallback to local)');

    // For now, fallback to local processing
    // TODO: Implement Azure/AWS/OpenAI integration
    const result = await this.processLocalNLP(query, shopId, userId, userToken);
    result.processedWith = 'cloud_fallback';
    return result;
  }

  /**
   * Query normalization for consistent caching
   */
  normalizeQuery(query) {
    return query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/what's/g, 'what is')
      .replace(/whats/g, 'what is')
      .replace(/we're/g, 'we are')
      .replace(/there's/g, 'there is');
  }

  /**
   * Assess query complexity to determine processing tier
   */
  assessQueryComplexity(query) {
    let score = 0;
    let reasons = [];

    // Check for known collision repair patterns (higher confidence)
    const matchedPattern = this.commonPatterns.find(p => p.pattern.test(query));
    if (matchedPattern) {
      score += 0.6;
      reasons.push(`matched_pattern:${matchedPattern.category}`);
    }

    // Simple keyword matching (medium confidence)
    const collisionKeywords = [
      'repair',
      'order',
      'vehicle',
      'customer',
      'parts',
      'status',
      'pending',
      'completed',
      'ready',
      'overdue',
      'honda',
      'toyota',
      'cycle time',
      'average',
      'revenue',
      'performance',
    ];

    const foundKeywords = collisionKeywords.filter(keyword =>
      query.includes(keyword)
    );
    if (foundKeywords.length > 0) {
      score += Math.min(foundKeywords.length * 0.15, 0.4);
      reasons.push(`keywords:${foundKeywords.length}`);
    }

    // Query structure analysis
    if (
      query.includes('show') ||
      query.includes('find') ||
      query.includes('list')
    ) {
      score += 0.2;
      reasons.push('list_query');
    }

    if (
      query.includes('how many') ||
      query.includes('count') ||
      query.includes('total')
    ) {
      score += 0.2;
      reasons.push('count_query');
    }

    // Penalty for complex or unusual queries
    if (query.length > 100) {
      score -= 0.2;
      reasons.push('long_query');
    }

    const uncommonWords = query
      .split(' ')
      .filter(word => word.length > 10 || /[^a-zA-Z0-9\s]/.test(word));
    if (uncommonWords.length > 2) {
      score -= 0.3;
      reasons.push('complex_language');
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      reason: reasons.join(',') || 'no_match',
    };
  }

  /**
   * Generate cache key for query and shop combination
   */
  generateCacheKey(query, shopId) {
    // Create deterministic cache key
    const queryHash = crypto.createHash('md5').update(query).digest('hex');
    return `nlp:${shopId}:${queryHash.substring(0, 16)}`;
  }

  /**
   * Add performance metrics to response
   */
  addPerformanceMetrics(result, startTime, tier) {
    const processingTime = Date.now() - startTime;

    // Update running average
    this.stats.avgResponseTime =
      (this.stats.avgResponseTime * (this.stats.totalQueries - 1) +
        processingTime) /
      this.stats.totalQueries;

    return {
      ...result,
      performance: {
        processingTime,
        processingTier: tier,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Generate fallback response for errors
   */
  generateFallbackResponse(query, error) {
    return {
      type: 'error',
      message:
        'I encountered an issue processing your request. Please try rephrasing your question.',
      query,
      error: error.message,
      suggestions: [
        'Try asking "what repair orders are in progress"',
        'Ask "show me today\'s repairs"',
        'Try "how many vehicles are pending parts"',
      ],
      performance: {
        processingTime: 50,
        processingTier: 'fallback',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Get performance statistics
   */
  getStats() {
    const total = this.stats.totalQueries;
    return {
      ...this.stats,
      cacheHitRate:
        total > 0
          ? ((this.stats.cacheHits / total) * 100).toFixed(1) + '%'
          : '0%',
      localProcessingRate:
        total > 0
          ? ((this.stats.localProcessing / total) * 100).toFixed(1) + '%'
          : '0%',
      cloudAPIRate:
        total > 0
          ? ((this.stats.cloudAPIUsage / total) * 100).toFixed(1) + '%'
          : '0%',
      avgResponseTime: Math.round(this.stats.avgResponseTime) + 'ms',
    };
  }

  /**
   * Health check for the router
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      redis: false,
      localNLP: true,
      cloudAI: false, // Not implemented yet
      timestamp: new Date().toISOString(),
    };

    // Check Redis connection
    if (this.redisClient) {
      try {
        await this.redisClient.ping();
        health.redis = true;
      } catch (error) {
        health.status = 'degraded';
        health.redis = false;
      }
    }

    return health;
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    if (this.redisClient) {
      await this.redisClient.quit();
      console.log('✅ Redis connection closed');
    }
  }
}

module.exports = { ScalableNLPRouter };
