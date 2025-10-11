/**
 * Pagination Middleware
 * 
 * Implements comprehensive pagination for all API endpoints:
 * - Consistent pagination parameters
 * - Performance optimization with LIMIT/OFFSET
 * - Metadata for frontend pagination controls
 * - Cursor-based pagination for large datasets
 */

const redisCache = require('./redisCache');

class PaginationMiddleware {
  constructor() {
    this.defaultConfig = {
      limit: 20,
      maxLimit: 100,
      page: 1,
      sortFields: ['created_at', 'updated_at', 'id'],
      defaultSort: 'created_at',
      defaultOrder: 'desc'
    };
  }

  /**
   * Parse pagination parameters from request
   */
  parsePaginationParams(req) {
    const {
      limit = this.defaultConfig.limit,
      page = this.defaultConfig.page,
      sort = this.defaultConfig.defaultSort,
      order = this.defaultConfig.defaultOrder
    } = req.query;

    // Validate and sanitize parameters
    const parsedLimit = Math.min(
      Math.max(parseInt(limit) || this.defaultConfig.limit, 1),
      this.defaultConfig.maxLimit
    );

    const parsedPage = Math.max(parseInt(page) || this.defaultConfig.page, 1);
    const offset = (parsedPage - 1) * parsedLimit;

    // Validate sort field
    const validSortFields = this.defaultConfig.sortFields;
    const parsedSort = validSortFields.includes(sort) ? sort : this.defaultConfig.defaultSort;

    // Validate order
    const parsedOrder = ['asc', 'desc'].includes(order.toLowerCase()) ? order.toLowerCase() : this.defaultConfig.defaultOrder;

    return {
      limit: parsedLimit,
      page: parsedPage,
      offset,
      sort: parsedSort,
      order: parsedOrder,
      sortField: parsedSort,
      sortDirection: parsedOrder.toUpperCase()
    };
  }

  /**
   * Generate pagination metadata
   */
  generatePaginationMetadata(paginationParams, totalCount) {
    const { limit, page } = paginationParams;
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null,
      startIndex: (page - 1) * limit + 1,
      endIndex: Math.min(page * limit, totalCount)
    };
  }

  /**
   * Generate SQL pagination clause
   */
  generateSQLPagination(paginationParams) {
    const { limit, offset, sortField, sortDirection } = paginationParams;
    
    return {
      limitClause: `LIMIT ${limit}`,
      offsetClause: `OFFSET ${offset}`,
      orderClause: `ORDER BY ${sortField} ${sortDirection}`
    };
  }

  /**
   * Generate Supabase pagination options
   */
  generateSupabasePagination(paginationParams) {
    const { limit, offset, sortField, order } = paginationParams;
    
    return {
      limit,
      offset,
      order: `${sortField}.${order}`
    };
  }

  /**
   * Cache pagination results
   */
  async cachePaginationResults(cacheKey, data, metadata, ttl = 120) {
    try {
      const cacheData = {
        data,
        metadata,
        timestamp: new Date().toISOString()
      };
      
      await redisCache.set(cacheKey, cacheData, ttl);
      return true;
    } catch (error) {
      console.error('Pagination cache error:', error);
      return false;
    }
  }

  /**
   * Get cached pagination results
   */
  async getCachedPaginationResults(cacheKey) {
    try {
      return await redisCache.get(cacheKey);
    } catch (error) {
      console.error('Pagination cache get error:', error);
      return null;
    }
  }

  /**
   * Generate cache key for pagination
   */
  generatePaginationCacheKey(endpoint, params) {
    const { limit, page, sort, order, ...filters } = params;
    return redisCache.generateCacheKey(`pagination:${endpoint}`, {
      limit,
      page,
      sort,
      order,
      ...filters
    });
  }

  /**
   * Main pagination middleware
   */
  paginationMiddleware(endpoint) {
    return async (req, res, next) => {
      try {
        // Parse pagination parameters
        const paginationParams = this.parsePaginationParams(req);
        
        // Add pagination params to request
        req.pagination = paginationParams;
        
        // Generate cache key
        const cacheKey = this.generatePaginationCacheKey(endpoint, {
          ...paginationParams,
          shopId: req.user?.shopId,
          userId: req.user?.id,
          ...req.query
        });

        // Try to get from cache
        const cachedData = await this.getCachedPaginationResults(cacheKey);
        if (cachedData) {
          res.json({
            data: cachedData.data,
            pagination: cachedData.metadata
          });
          return;
        }

        // Store original json method
        const originalJson = res.json;
        
        // Override json method to add pagination metadata
        res.json = function(data, totalCount = null) {
          if (Array.isArray(data)) {
            const metadata = this.generatePaginationMetadata(paginationParams, totalCount || data.length);
            
            // Cache the results
            this.cachePaginationResults(cacheKey, data, metadata);
            
            // Return paginated response
            return originalJson.call(this, {
              data,
              pagination: metadata
            });
          }
          
          return originalJson.call(this, data);
        }.bind(this);

        next();
      } catch (error) {
        console.error('Pagination middleware error:', error);
        next();
      }
    };
  }

  /**
   * Cursor-based pagination for large datasets
   */
  cursorPaginationMiddleware(endpoint) {
    return async (req, res, next) => {
      try {
        const { cursor, limit = 20 } = req.query;
        const parsedLimit = Math.min(parseInt(limit) || 20, 100);
        
        req.cursorPagination = {
          cursor: cursor ? parseInt(cursor) : null,
          limit: parsedLimit
        };

        // Store original json method
        const originalJson = res.json;
        
        // Override json method to add cursor pagination metadata
        res.json = function(data, hasNextPage = false) {
          if (Array.isArray(data)) {
            const nextCursor = hasNextPage && data.length > 0 ? data[data.length - 1].id : null;
            
            return originalJson.call(this, {
              data,
              pagination: {
                cursor: req.cursorPagination.cursor,
                nextCursor,
                limit: parsedLimit,
                hasNextPage
              }
            });
          }
          
          return originalJson.call(this, data);
        };

        next();
      } catch (error) {
        console.error('Cursor pagination middleware error:', error);
        next();
      }
    };
  }

  /**
   * Search pagination with filters
   */
  searchPaginationMiddleware(endpoint) {
    return async (req, res, next) => {
      try {
        const paginationParams = this.parsePaginationParams(req);
        const searchParams = {
          q: req.query.q,
          filters: req.query.filters ? JSON.parse(req.query.filters) : {},
          dateRange: req.query.dateRange,
          status: req.query.status,
          priority: req.query.priority
        };

        req.pagination = paginationParams;
        req.searchParams = searchParams;

        // Generate cache key for search
        const cacheKey = this.generatePaginationCacheKey(`search:${endpoint}`, {
          ...paginationParams,
          ...searchParams,
          shopId: req.user?.shopId
        });

        // Try to get from cache
        const cachedData = await this.getCachedPaginationResults(cacheKey);
        if (cachedData) {
          res.json({
            data: cachedData.data,
            pagination: cachedData.metadata,
            searchParams: searchParams
          });
          return;
        }

        // Store original json method
        const originalJson = res.json;
        
        // Override json method to add search pagination metadata
        res.json = function(data, totalCount = null) {
          if (Array.isArray(data)) {
            const metadata = this.generatePaginationMetadata(paginationParams, totalCount || data.length);
            
            // Cache the results
            this.cachePaginationResults(cacheKey, data, metadata);
            
            return originalJson.call(this, {
              data,
              pagination: metadata,
              searchParams: searchParams
            });
          }
          
          return originalJson.call(this, data);
        }.bind(this);

        next();
      } catch (error) {
        console.error('Search pagination middleware error:', error);
        next();
      }
    };
  }

  /**
   * Invalidate pagination cache for endpoint
   */
  async invalidatePaginationCache(endpoint, shopId = null) {
    try {
      const patterns = [
        `pagination:${endpoint}:*`,
        `search:${endpoint}:*`
      ];

      if (shopId) {
        patterns.push(`pagination:${endpoint}:*shopId*${shopId}*`);
        patterns.push(`search:${endpoint}:*shopId*${shopId}*`);
      }

      for (const pattern of patterns) {
        await redisCache.delPattern(pattern);
      }

      return true;
    } catch (error) {
      console.error('Pagination cache invalidation error:', error);
      return false;
    }
  }

  /**
   * Get pagination configuration for endpoint
   */
  getPaginationConfig(endpoint) {
    const configs = {
      'repair-orders': {
        ...this.defaultConfig,
        sortFields: ['created_at', 'updated_at', 'ro_number', 'status', 'priority'],
        defaultSort: 'created_at'
      },
      'customers': {
        ...this.defaultConfig,
        sortFields: ['created_at', 'updated_at', 'last_name', 'first_name'],
        defaultSort: 'last_name'
      },
      'vehicles': {
        ...this.defaultConfig,
        sortFields: ['created_at', 'updated_at', 'year', 'make', 'model'],
        defaultSort: 'created_at'
      },
      'parts': {
        ...this.defaultConfig,
        sortFields: ['created_at', 'updated_at', 'part_number', 'status'],
        defaultSort: 'created_at'
      },
      'purchase-orders': {
        ...this.defaultConfig,
        sortFields: ['created_at', 'updated_at', 'po_number', 'status'],
        defaultSort: 'created_at'
      }
    };

    return configs[endpoint] || this.defaultConfig;
  }
}

// Create singleton instance
const paginationMiddleware = new PaginationMiddleware();

module.exports = paginationMiddleware;
