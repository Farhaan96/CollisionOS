const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { sequelize, Shop, User } = require('./database/models');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const customerRoutes = require('./routes/customers');
const vehicleRoutes = require('./routes/vehicles');
const technicianRoutes = require('./routes/technicians');
const jobRoutes = require('./routes/jobs');
const estimateRoutes = require('./routes/estimates');
const partsRoutes = require('./routes/parts');
const inventoryRoutes = require('./routes/inventory');
const vendorRoutes = require('./routes/vendors');
const financialRoutes = require('./routes/financial');
const qualityRoutes = require('./routes/quality');
const reportRoutes = require('./routes/reports');
const integrationRoutes = require('./routes/integrations');
const notificationRoutes = require('./routes/notifications');
const attachmentRoutes = require('./routes/attachments');
const importRoutes = require('./api/import');
const bmsApiRoutes = require('./routes/bmsApi');
const dashboardRoutes = require('./routes/dashboard');
// IMEX-Level Enhancement Routes
const productionRoutes = require('./routes/production');
const laborRoutes = require('./routes/labor');
const communicationRoutes = require('./routes/communication');
const timeclockRoutes = require('./routes/timeclock');

// Phase 2 Backend Development Routes
const purchaseOrderRoutes = require('./routes/purchaseOrders');
const repairOrderRoutes = require('./routes/repairOrders');
const partsWorkflowRoutes = require('./routes/partsWorkflow');
const partsStatusUpdateRoutes = require('./routes/partsStatusUpdate'); // Parts status workflow API
const schedulingRoutes = require('./routes/scheduling');
const loanerFleetRoutes = require('./routes/loanerFleet');
const customerCommunicationRoutes = require('./routes/customerCommunication');
const qualityControlRoutes = require('./routes/qualityControl');
const aiRoutes = require('./routes/ai');

// Phase 2 Financial Integration Routes
const paymentsRoutes = require('./routes/payments');
const expensesRoutes = require('./routes/expenses');
const invoicesRoutes = require('./routes/invoices');
const quickbooksRoutes = require('./routes/quickbooks');

// Digital Signature Routes
const signaturesRoutes = require('./routes/signatures');

const {
  authenticateToken,
  optionalAuth,
} = require('./middleware/authEnhanced'); // Use enhanced auth with proper token handling

// Create a development bypass middleware for certain routes
const devBypass = (req, res, next) => {
  console.log('🔓 DevBypass middleware called for:', req.path);
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Development mode - bypassing auth');
    req.user = {
      id: 'dev-user',
      userId: 'dev-user',
      username: 'admin',
      shopId: '00000000-0000-4000-8000-000000000001',
      role: 'admin',
      email: 'admin@collisionos.com',
    };
  }
  next();
};
const { errorHandler, notFoundHandler } = require('./utils/errorHandler');
const {
  securityHeaders,
  sanitizeInput,
  auditLogger,
  httpsOnly,
} = require('./middleware/security');
const { swaggerUi, specs } = require('./docs/swagger');
const { realtimeService } = require('./services/realtimeService');

const app = express();
const PORT = process.env.SERVER_PORT || 3002; // Standardized on 3002 for frontend-backend connectivity

// Debug environment variables
console.log('🔍 Environment Variables Debug:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('SERVER_PORT:', process.env.SERVER_PORT || 'undefined');

// Create HTTP server for Socket.io
const server = require('http').createServer(app);

// Security middleware
app.use(httpsOnly);
app.use(securityHeaders());

app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://collisionos.com', 'https://app.collisionos.com']
        : ['http://localhost:3000'],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Audit logging
app.use(auditLogger);

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
} else {
  // In development, serve a simple landing page for API status
  app.get('/', (req, res) => {
    res.json({
      message: 'CollisionOS API Server',
      status: 'Running',
      environment: 'Development',
      api_docs: '/api',
      health_check: '/health',
    });
  });
}

// API Documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'CollisionOS API Documentation',
  })
);

// Health check with enhanced database status
app.get('/health', async (req, res) => {
  const { databaseService } = require('./services/databaseService');
  const { realtimeService } = require('./services/realtimeService');

  try {
    const dbStatus = await databaseService.getConnectionStatus();
    const realtimeStatus = realtimeService.getStatus();

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        type: dbStatus.type,
        connected: dbStatus.connected,
        error: dbStatus.error || null,
      },
      realtime: {
        backend: realtimeStatus.backend,
        subscriptions: realtimeStatus.activeSubscriptions,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Migration status endpoint
app.get('/api/migration/status', async (req, res) => {
  const { migrationUtils } = require('./utils/migrationUtils');

  try {
    const status = await migrationUtils.getMigrationStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Health check endpoints (both versioned and legacy)
app.get('/api/health', async (req, res) => {
  const { databaseService } = require('./services/databaseService');
  const { realtimeService } = require('./services/realtimeService');

  try {
    const dbStatus = await databaseService.getConnectionStatus();
    const realtimeStatus = realtimeService.getStatus();

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        type: dbStatus.type,
        connected: dbStatus.connected,
        error: dbStatus.error || null,
      },
      realtime: {
        backend: realtimeStatus.backend,
        subscriptions: realtimeStatus.activeSubscriptions,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// API v1 Routes (with versioning)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', authenticateToken(), userRoutes);
app.use('/api/v1/customers', authenticateToken(), customerRoutes);
app.use('/api/v1/vehicles', authenticateToken(), vehicleRoutes);
app.use('/api/v1/technicians', authenticateToken(), technicianRoutes);
app.use('/api/v1/jobs', authenticateToken(), jobRoutes);
app.use('/api/v1/estimates', authenticateToken(), estimateRoutes);
app.use('/api/v1/parts', authenticateToken(), partsRoutes);
app.use('/api/v1/inventory', authenticateToken(), inventoryRoutes);
app.use('/api/v1/vendors', authenticateToken(), vendorRoutes);
app.use('/api/v1/financial', authenticateToken(), financialRoutes);
app.use('/api/v1/quality', authenticateToken(), qualityRoutes);
app.use('/api/v1/reports', authenticateToken(), reportRoutes);
app.use('/api/v1/integrations', authenticateToken(), integrationRoutes);
app.use('/api/v1/notifications', authenticateToken(), notificationRoutes);
app.use('/api/v1/attachments', authenticateToken(), attachmentRoutes);
app.use('/api/v1/import', optionalAuth, importRoutes);
app.use('/api/v1/bms', authenticateToken(), bmsApiRoutes);
app.use('/api/v1/dashboard', optionalAuth, dashboardRoutes); // Dashboard endpoints with optional auth
// IMEX-Level Enhancement API Routes (v1)
app.use('/api/v1/production', authenticateToken(), productionRoutes);
app.use('/api/v1/labor', authenticateToken(), laborRoutes);
app.use('/api/v1/communication', authenticateToken(), communicationRoutes);
app.use('/api/v1/timeclock', authenticateToken(), timeclockRoutes);

// Phase 2 Backend Development API Routes (v1)
app.use('/api/v1/purchase-orders', authenticateToken(), purchaseOrderRoutes);
app.use('/api/v1/pos', authenticateToken(), purchaseOrderRoutes); // Shorter alias
app.use('/api/v1/repair-orders', authenticateToken(), repairOrderRoutes);
app.use('/api/v1/ros', authenticateToken(), repairOrderRoutes); // Shorter alias
app.use('/api/v1/parts-workflow', authenticateToken(), partsWorkflowRoutes);
app.use('/api/v1/scheduling', authenticateToken(), schedulingRoutes);
app.use('/api/v1/loaner-fleet', authenticateToken(), loanerFleetRoutes);
app.use('/api/v1/loaners', authenticateToken(), loanerFleetRoutes); // Shorter alias
app.use(
  '/api/v1/customer-communication',
  authenticateToken(),
  customerCommunicationRoutes
);
app.use('/api/v1/qc', authenticateToken(), qualityControlRoutes);
app.use('/api/v1/quality-control', authenticateToken(), qualityControlRoutes); // Full name alias
app.use('/api/v1/ai', authenticateToken(), aiRoutes);

// Phase 2 Financial Integration API Routes (v1)
app.use('/api/v1/payments', authenticateToken(), paymentsRoutes);
app.use('/api/v1/expenses', authenticateToken(), expensesRoutes);
app.use('/api/v1/invoices', authenticateToken(), invoicesRoutes);
app.use('/api/v1/quickbooks', authenticateToken(), quickbooksRoutes);
app.use('/api/v1/signatures', authenticateToken(), signaturesRoutes);

// Maintain backward compatibility with unversioned routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken(), userRoutes);
app.use('/api/customers', authenticateToken(), customerRoutes);
app.use('/api/vehicles', authenticateToken(), vehicleRoutes);
app.use('/api/technicians', authenticateToken(), technicianRoutes);
app.use(
  '/api/jobs',
  devBypass, // Bypass auth in development for easier testing
  jobRoutes
);
app.use('/api/estimates', authenticateToken(), estimateRoutes);
app.use('/api/parts', authenticateToken(), partsRoutes);
app.use('/api/parts', authenticateToken(), partsStatusUpdateRoutes); // Parts status update endpoints
app.use('/api/inventory', authenticateToken(), inventoryRoutes);
app.use('/api/vendors', authenticateToken(), vendorRoutes);
app.use('/api/financial', authenticateToken(), financialRoutes);
app.use('/api/quality', authenticateToken(), qualityRoutes);
app.use('/api/reports', authenticateToken(), reportRoutes);
app.use('/api/integrations', authenticateToken(), integrationRoutes);
app.use('/api/notifications', authenticateToken(), notificationRoutes);
app.use('/api/attachments', authenticateToken(), attachmentRoutes);
app.use('/api/import', optionalAuth, importRoutes);
app.use('/api/bms', optionalAuth, bmsApiRoutes);
app.use('/api/dashboard', optionalAuth, dashboardRoutes); // Dashboard endpoints with optional auth
// IMEX-Level Enhancement API Routes (legacy)
app.use('/api/production', authenticateToken(), productionRoutes);
app.use('/api/labor', authenticateToken(), laborRoutes);
app.use('/api/communication', authenticateToken(), communicationRoutes);
app.use('/api/timeclock', authenticateToken(), timeclockRoutes);

// Phase 2 Backend Development API Routes (legacy)
app.use('/api/purchase-orders', authenticateToken(), purchaseOrderRoutes);
app.use('/api/pos', authenticateToken(), purchaseOrderRoutes);
app.use('/api/repair-orders', authenticateToken(), repairOrderRoutes);
app.use('/api/ros', authenticateToken(), repairOrderRoutes);
app.use('/api/parts-workflow', authenticateToken(), partsWorkflowRoutes);
app.use('/api/scheduling', authenticateToken(), schedulingRoutes);
app.use('/api/loaner-fleet', authenticateToken(), loanerFleetRoutes);
app.use('/api/loaners', authenticateToken(), loanerFleetRoutes);
app.use(
  '/api/customer-communication',
  authenticateToken(),
  customerCommunicationRoutes
);
app.use('/api/qc', authenticateToken(), qualityControlRoutes);
app.use('/api/quality-control', authenticateToken(), qualityControlRoutes);
app.use('/api/ai', aiRoutes);

// Phase 2 Financial Integration API Routes (legacy)
app.use('/api/payments', authenticateToken(), paymentsRoutes);
app.use('/api/expenses', authenticateToken(), expensesRoutes);
app.use('/api/invoices', authenticateToken(), invoicesRoutes);
app.use('/api/quickbooks', authenticateToken(), quickbooksRoutes);
app.use('/api/signatures', authenticateToken(), signaturesRoutes);

// Socket.io connection handling
const socketAuth = require('./middleware/socketAuth');
const { handleJobUpdates } = require('./services/socketService');

// Initialize real-time service with Socket.io server
const io = realtimeService.initialize(server);

io.use(socketAuth);

io.on('connection', socket => {
  console.log(`User connected: ${socket.userId} (Shop: ${socket.shopId})`);

  // Join user to their shop's room
  socket.join(`shop_${socket.shopId}`);

  // Handle job updates (legacy and new)
  socket.on('job_update', data => {
    handleJobUpdates(socket, data);
    // Also broadcast through real-time service for consistency
    realtimeService.broadcastJobUpdate(data, 'updated');
  });

  // Handle real-time notifications
  socket.on('notification', data => {
    socket.to(`shop_${socket.shopId}`).emit('notification', data);
    realtimeService.broadcastNotification(data, socket.shopId);
  });

  // Handle chat messages
  socket.on('chat_message', data => {
    socket.to(`shop_${socket.shopId}`).emit('chat_message', data);
  });

  // Handle production board updates
  socket.on('production_update', data => {
    socket.to(`shop_${socket.shopId}`).emit('production_update', data);
    realtimeService.broadcastProductionUpdate(data, socket.shopId);
  });

  // Handle parts status updates
  socket.on('parts_update', data => {
    socket.to(`shop_${socket.shopId}`).emit('parts_update', data);
    realtimeService.broadcastPartsUpdate(data, 'updated');
  });

  // Handle quality control updates
  socket.on('quality_update', data => {
    socket.to(`shop_${socket.shopId}`).emit('quality_update', data);
    realtimeService.broadcastQualityUpdate(data, 'updated');
  });

  // Handle financial updates
  socket.on('financial_update', data => {
    socket.to(`shop_${socket.shopId}`).emit('financial_update', data);
    realtimeService.broadcastFinancialUpdate(data, 'updated');
  });

  // Handle customer updates
  socket.on('customer_update', data => {
    socket.to(`shop_${socket.shopId}`).emit('customer_update', data);
    realtimeService.broadcastCustomerUpdate(data, 'updated');
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});

// 404 handler
app.use('*', notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Database connection and server startup
async function startServer() {
  try {
    console.log('🚀 Starting CollisionOS Server...');

    // Ensure SQLite data directory exists in development
    if (
      process.env.DB_HOST === 'sqlite' ||
      process.env.NODE_ENV === 'development'
    ) {
      const sqlitePath =
        process.env.DATABASE_PATH || path.join(__dirname, '../data/collisionos.db');
      const dataDir = path.dirname(sqlitePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
    }

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');

    // Sync database models (in development)
    if (process.env.NODE_ENV === 'development') {
      await Shop.sync({ force: false });
      await User.sync({ force: false });
      console.log('📊 Database models synchronized');
    }

    // Start server
    server.listen(PORT, () => {
      console.log('\n🎉 CollisionOS Server Started Successfully!');
      console.log('=====================================');
      console.log(`🌐 Server: http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API docs: http://localhost:${PORT}/api-docs`);
      console.log('🔧 Database: SQLite (local)');
      console.log('📡 Real-time: Socket.io');
      console.log('=====================================\n');
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
const gracefulShutdown = async signal => {
  console.log(`\n${signal} received, shutting down gracefully...`);

  try {
    // Clean up real-time subscriptions
    await realtimeService.close();

    // Close server
    server.close(async () => {
      console.log('✅ HTTP server closed');

      // Close database connection
      if (sequelize) {
        await sequelize.close();
        console.log('✅ Database connection closed');
      }

      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      console.error(
        '❌ Could not close connections in time, forcefully shutting down'
      );
      process.exit(1);
    }, 10000);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = { app, server, io };
// Force restart
