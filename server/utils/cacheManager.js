/**
 * Memory Leak Fixes - Critical Implementation
 * 
 * Replaces unbounded Maps with LRU caches to prevent memory leaks
 */

const { LRUCache } = require('lru-cache');

// Replace unbounded dashboard cache with LRU cache
const dashboardCache = new LRUCache({
  max: 100, // Maximum 100 entries
  ttl: 5 * 60 * 1000, // 5 minutes TTL (note: 'ttl' not 'maxAge' in newer versions)
  updateAgeOnGet: true, // Reset TTL on access
});

const getCacheKey = (method, params, shopId) =>
  `${method}-${shopId}-${JSON.stringify(params)}`;

const isCacheValid = (cached) => {
  if (!cached) return false;
  // LRU cache handles expiration automatically
  return true;
};

// Export for use in dashboard routes
module.exports = {
  dashboardCache,
  getCacheKey,
  isCacheValid,
};

