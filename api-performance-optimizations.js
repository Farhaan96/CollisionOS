
// API Performance Optimizations for CollisionOS

// 1. Response compression middleware
const compression = require('compression');
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// 2. Request batching middleware
const batchRequests = (req, res, next) => {
  if (req.path === '/api/batch') {
    const { requests } = req.body;
    const promises = requests.map(request => 
      executeRequest(request)
    );
    
    Promise.all(promises)
      .then(results => res.json({ results }))
      .catch(error => res.status(500).json({ error }));
  } else {
    next();
  }
};

// 3. Query optimization with pagination
const getRepairOrders = async (req, res) => {
  const { limit = 20, page = 1, sort = 'created_at', order = 'desc' } = req.query;
  const offset = (page - 1) * limit;
  
  const query = `
    SELECT ro.*, c.first_name, c.last_name, v.make, v.model
    FROM repair_orders ro
    LEFT JOIN customers c ON ro.customer_id = c.id
    LEFT JOIN vehicles v ON ro.vehicle_id = v.id
    WHERE ro.shop_id = $1
    ORDER BY ro.${sort} ${order}
    LIMIT $2 OFFSET $3
  `;
  
  const { data, error } = await supabase
    .rpc('execute_sql', { sql: query, params: [req.user.shopId, limit, offset] });
    
  if (error) throw error;
  
  res.json({
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: data.length
    }
  });
};

// 4. Caching middleware
const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    const cacheKey = `api:${req.path}:${JSON.stringify(req.query)}`;
    
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      const originalJson = res.json;
      res.json = function(data) {
        redis.setex(cacheKey, ttl, JSON.stringify(data));
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      next();
    }
  };
};

// 5. Database connection pooling
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 6. WebSocket real-time updates
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  socket.on('join-shop', (shopId) => {
    socket.join(`shop-${shopId}`);
  });
  
  socket.on('repair-order-update', (data) => {
    socket.to(`shop-${data.shopId}`).emit('repair-order-changed', data);
  });
});
