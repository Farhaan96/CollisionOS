
// Caching Implementation for CollisionOS

// 1. Redis caching middleware
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

const cacheMiddleware = (keyGenerator, ttl = 300) => {
  return async (req, res, next) => {
    const cacheKey = keyGenerator(req);
    
    try {
      const cached = await client.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      const originalJson = res.json;
      res.json = function(data) {
        client.setex(cacheKey, ttl, JSON.stringify(data));
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      next();
    }
  };
};

// 2. Dashboard stats caching
const cacheDashboardStats = async (shopId) => {
  const cacheKey = `dashboard:stats:${shopId}`;
  const ttl = 300; // 5 minutes
  
  try {
    const cached = await client.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const stats = await calculateDashboardStats(shopId);
    await client.setex(cacheKey, ttl, JSON.stringify(stats));
    return stats;
  } catch (error) {
    console.error('Dashboard stats caching error:', error);
    return await calculateDashboardStats(shopId);
  }
};

// 3. Search results caching
const cacheSearchResults = async (query, results, ttl = 600) => {
  const cacheKey = `search:${query}`;
  await client.setex(cacheKey, ttl, JSON.stringify(results));
};

// 4. User permissions caching
const cacheUserPermissions = async (userId, permissions, ttl = 1800) => {
  const cacheKey = `user:permissions:${userId}`;
  await client.setex(cacheKey, ttl, JSON.stringify(permissions));
};

// 5. Cache invalidation strategies
const invalidateShopCache = async (shopId) => {
  const patterns = [
    `dashboard:stats:${shopId}`,
    `repair_orders:*:${shopId}`,
    `customers:*:${shopId}`,
    `vehicles:*:${shopId}`
  ];
  
  for (const pattern of patterns) {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  }
};

// 6. Cache warming
const warmCache = async (shopId) => {
  try {
    // Warm dashboard stats
    await cacheDashboardStats(shopId);
    
    // Warm recent repair orders
    const recentROs = await getRecentRepairOrders(shopId);
    await client.setex(`repair_orders:recent:${shopId}`, 300, JSON.stringify(recentROs));
    
    // Warm customer list
    const customers = await getActiveCustomers(shopId);
    await client.setex(`customers:active:${shopId}`, 600, JSON.stringify(customers));
    
    console.log(`Cache warmed for shop ${shopId}`);
  } catch (error) {
    console.error('Cache warming error:', error);
  }
};
