/**
 * Real-time Service for CollisionOS
 * Socket.io-based real-time notifications (Supabase integration removed)
 */

/**
 * Real-time service that manages Socket.io connections for live updates
 */
class RealtimeService {
  constructor() {
    this.io = null;
    this.subscribers = new Map();
    console.log('🔄 Real-time service initialized with Socket.io backend');
  }

  /**
   * Initialize Socket.io server
   * @param {Object} server - HTTP server instance
   * @returns {Object} Socket.io server instance
   */
  initialize(server) {
    const socketIo = require('socket.io');

    this.io = socketIo(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.io.on('connection', (socket) => {
      console.log('📡 Client connected:', socket.id);

      // Handle subscription requests
      socket.on('subscribe', (channel) => {
        socket.join(channel);
        console.log(`📡 Client ${socket.id} subscribed to ${channel}`);

        // Track subscription
        if (!this.subscribers.has(channel)) {
          this.subscribers.set(channel, new Set());
        }
        this.subscribers.get(channel).add(socket.id);
      });

      // Handle unsubscription
      socket.on('unsubscribe', (channel) => {
        socket.leave(channel);
        console.log(`📡 Client ${socket.id} unsubscribed from ${channel}`);

        // Remove from tracking
        if (this.subscribers.has(channel)) {
          this.subscribers.get(channel).delete(socket.id);
          if (this.subscribers.get(channel).size === 0) {
            this.subscribers.delete(channel);
          }
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('📡 Client disconnected:', socket.id);

        // Clean up subscriptions
        this.subscribers.forEach((subscribers, channel) => {
          subscribers.delete(socket.id);
          if (subscribers.size === 0) {
            this.subscribers.delete(channel);
          }
        });
      });
    });

    console.log('✅ Socket.io server initialized');
    return this.io;
  }

  /**
   * Broadcast an event to a specific channel
   * @param {string} channel - Channel/room name
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  broadcast(channel, event, data) {
    if (!this.io) {
      console.warn('⚠️  Socket.io not initialized, cannot broadcast');
      return;
    }

    this.io.to(channel).emit(event, data);
    console.log(`📡 Broadcasted ${event} to channel ${channel}`);
  }

  /**
   * Notify clients about database changes
   * @param {string} table - Table name that changed
   * @param {string} operation - Operation type (INSERT, UPDATE, DELETE)
   * @param {Object} data - Changed data
   * @param {string} shopId - Optional shop ID for filtering
   */
  notifyChange(table, operation, data, shopId = null) {
    const channel = shopId ? `shop:${shopId}:${table}` : `table:${table}`;

    this.broadcast(channel, 'change', {
      table,
      operation,
      data,
      timestamp: new Date().toISOString(),
    });

    // Also broadcast to general table channel
    this.broadcast(`table:${table}`, 'change', {
      table,
      operation,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit event to specific shop room
   * @param {string} shopId - Shop ID
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emitToShop(shopId, event, data) {
    const channel = `shop:${shopId}`;
    this.broadcast(channel, event, data);
  }

  /**
   * Emit event to all connected clients
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emitToAll(event, data) {
    if (!this.io) {
      console.warn('⚠️  Socket.io not initialized, cannot emit');
      return;
    }

    this.io.emit(event, data);
    console.log(`📡 Broadcasted ${event} to all clients`);
  }

  /**
   * Get current service status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      backend: 'socket.io',
      connected: this.io ? true : false,
      activeChannels: Array.from(this.subscribers.keys()),
      activeSubscriptions: this.subscribers.size,
      totalClients: this.io ? this.io.sockets.sockets.size : 0,
    };
  }

  /**
   * Get Socket.io server instance
   * @returns {Object} Socket.io server
   */
  getServer() {
    return this.io;
  }

  /**
   * Subscribe to a table (legacy compatibility method)
   * @param {string} subscriptionId - Subscription ID
   * @param {string} table - Table name
   * @param {Object} options - Subscription options
   * @returns {Object} Subscription object
   */
  async subscribe(subscriptionId, table, options = {}) {
    console.log(`📡 Creating subscription: ${subscriptionId} for table ${table}`);

    // This is a no-op since Socket.io subscriptions are handled client-side
    // Just return a subscription object for compatibility
    return {
      id: subscriptionId,
      type: 'socket.io',
      table,
      options,
      status: 'active',
    };
  }

  /**
   * Unsubscribe (legacy compatibility method)
   * @param {string} subscriptionId - Subscription ID
   * @returns {boolean} Success status
   */
  async unsubscribe(subscriptionId) {
    console.log(`📡 Unsubscribed: ${subscriptionId}`);
    return true;
  }

  /**
   * Close all connections
   */
  async close() {
    if (this.io) {
      this.io.close();
      console.log('🔌 Socket.io server closed');
    }
  }
}

// Singleton instance
const realtimeService = new RealtimeService();

module.exports = {
  realtimeService,
  RealtimeService,
};
