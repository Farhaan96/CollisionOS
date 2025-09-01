const { getSupabaseClient, isSupabaseEnabled } = require('../config/supabase');

/**
 * Real-time service that manages both Supabase real-time subscriptions and Socket.io fallback
 */
class RealtimeService {
  constructor() {
    this.subscriptions = new Map();
    this.socketIoServer = null;
    this.useSupabase = isSupabaseEnabled;

    console.log(
      `🔄 Real-time service initialized with ${this.useSupabase ? 'Supabase' : 'Socket.io'} backend`
    );
  }

  /**
   * Set Socket.io server instance for fallback
   * @param {Object} io - Socket.io server instance
   */
  setSocketServer(io) {
    this.socketIoServer = io;
  }

  /**
   * Subscribe to real-time updates for a table
   * @param {string} subscriptionId - Unique subscription identifier
   * @param {string} table - Table name to watch
   * @param {Object} options - Subscription options
   * @returns {Promise<Object>} Subscription object
   */
  async subscribe(subscriptionId, table, options = {}) {
    if (this.subscriptions.has(subscriptionId)) {
      console.warn(`Subscription ${subscriptionId} already exists`);
      return this.subscriptions.get(subscriptionId);
    }

    if (this.useSupabase) {
      return this.subscribeSupabase(subscriptionId, table, options);
    } else {
      return this.subscribeSocketIo(subscriptionId, table, options);
    }
  }

  /**
   * Create Supabase real-time subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {string} table - Table name
   * @param {Object} options - Subscription options
   * @returns {Promise<Object>} Subscription object
   */
  async subscribeSupabase(subscriptionId, table, options = {}) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase not available for real-time subscriptions');
    }

    const {
      event = '*', // INSERT, UPDATE, DELETE, or *
      filter,
      callback,
      schema = 'public',
    } = options;

    let channelName = `${table}_changes`;
    if (filter) {
      channelName += `_${Object.keys(filter).join('_')}`;
    }

    const channel = supabase.channel(channelName).on(
      'postgres_changes',
      {
        event,
        schema,
        table,
        filter: filter
          ? `${Object.keys(filter)[0]}=eq.${Object.values(filter)[0]}`
          : undefined,
      },
      payload => {
        console.log(`📡 Supabase real-time event:`, payload);
        if (callback) {
          callback(payload);
        }
        // Also emit to Socket.io for backwards compatibility
        this.emitToSocketIo(`${table}_update`, payload);
      }
    );

    // Subscribe to the channel
    const subscriptionResponse = await channel.subscribe(status => {
      console.log(`📡 Supabase subscription ${subscriptionId} status:`, status);
    });

    const subscription = {
      id: subscriptionId,
      type: 'supabase',
      table,
      channel,
      options,
      status: subscriptionResponse,
    };

    this.subscriptions.set(subscriptionId, subscription);
    return subscription;
  }

  /**
   * Create Socket.io based subscription (fallback)
   * @param {string} subscriptionId - Subscription ID
   * @param {string} table - Table name
   * @param {Object} options - Subscription options
   * @returns {Object} Subscription object
   */
  subscribeSocketIo(subscriptionId, table, options = {}) {
    const subscription = {
      id: subscriptionId,
      type: 'socket.io',
      table,
      options,
    };

    this.subscriptions.set(subscriptionId, subscription);
    console.log(`📡 Socket.io subscription created: ${subscriptionId}`);

    return subscription;
  }

  /**
   * Unsubscribe from real-time updates
   * @param {string} subscriptionId - Subscription ID to remove
   * @returns {Promise<boolean>} Success status
   */
  async unsubscribe(subscriptionId) {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      console.warn(`Subscription ${subscriptionId} not found`);
      return false;
    }

    if (subscription.type === 'supabase' && subscription.channel) {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.removeChannel(subscription.channel);
      }
    }

    this.subscriptions.delete(subscriptionId);
    console.log(`📡 Unsubscribed: ${subscriptionId}`);
    return true;
  }

  /**
   * Emit real-time update to all connected clients
   * @param {string} event - Event name
   * @param {Object} data - Event data
   * @param {string} shopId - Optional shop ID for room targeting
   */
  emit(event, data, shopId = null) {
    if (this.useSupabase) {
      // With Supabase, real-time events are handled automatically
      // But we can still emit to Socket.io for backwards compatibility
      this.emitToSocketIo(event, data, shopId);
    } else {
      this.emitToSocketIo(event, data, shopId);
    }
  }

  /**
   * Emit to Socket.io server
   * @param {string} event - Event name
   * @param {Object} data - Event data
   * @param {string} shopId - Optional shop ID for room targeting
   */
  emitToSocketIo(event, data, shopId = null) {
    if (!this.socketIoServer) {
      return;
    }

    if (shopId) {
      this.socketIoServer.to(`shop_${shopId}`).emit(event, data);
    } else {
      this.socketIoServer.emit(event, data);
    }
  }

  /**
   * Broadcast job update to all relevant clients
   * @param {Object} jobData - Job data
   * @param {string} eventType - Type of update (created, updated, deleted)
   */
  broadcastJobUpdate(jobData, eventType = 'updated') {
    const event = 'job_update';
    const payload = {
      type: eventType,
      data: jobData,
      timestamp: new Date().toISOString(),
    };

    this.emit(event, payload, jobData.shopId || jobData.shop_id);
  }

  /**
   * Broadcast production board update
   * @param {Object} data - Production data
   * @param {string} shopId - Shop ID
   */
  broadcastProductionUpdate(data, shopId) {
    this.emit(
      'production_update',
      {
        type: 'status_change',
        data,
        timestamp: new Date().toISOString(),
      },
      shopId
    );
  }

  /**
   * Broadcast parts update
   * @param {Object} partData - Parts data
   * @param {string} eventType - Event type
   */
  broadcastPartsUpdate(partData, eventType = 'updated') {
    this.emit(
      'parts_update',
      {
        type: eventType,
        data: partData,
        timestamp: new Date().toISOString(),
      },
      partData.shopId || partData.shop_id
    );
  }

  /**
   * Broadcast quality control update
   * @param {Object} qualityData - Quality data
   * @param {string} eventType - Event type
   */
  broadcastQualityUpdate(qualityData, eventType = 'updated') {
    this.emit(
      'quality_update',
      {
        type: eventType,
        data: qualityData,
        timestamp: new Date().toISOString(),
      },
      qualityData.shopId || qualityData.shop_id
    );
  }

  /**
   * Broadcast notification to users
   * @param {Object} notification - Notification data
   * @param {string} shopId - Shop ID
   */
  broadcastNotification(notification, shopId) {
    this.emit(
      'notification',
      {
        ...notification,
        timestamp: new Date().toISOString(),
      },
      shopId
    );
  }

  /**
   * Broadcast customer update
   * @param {Object} customerData - Customer data
   * @param {string} eventType - Event type
   */
  broadcastCustomerUpdate(customerData, eventType = 'updated') {
    this.emit(
      'customer_update',
      {
        type: eventType,
        data: customerData,
        timestamp: new Date().toISOString(),
      },
      customerData.shopId || customerData.shop_id
    );
  }

  /**
   * Broadcast financial update
   * @param {Object} financialData - Financial data
   * @param {string} eventType - Event type
   */
  broadcastFinancialUpdate(financialData, eventType = 'updated') {
    this.emit(
      'financial_update',
      {
        type: eventType,
        data: financialData,
        timestamp: new Date().toISOString(),
      },
      financialData.shopId || financialData.shop_id
    );
  }

  /**
   * Get all active subscriptions
   * @returns {Array} List of active subscriptions
   */
  getActiveSubscriptions() {
    return Array.from(this.subscriptions.values()).map(sub => ({
      id: sub.id,
      type: sub.type,
      table: sub.table,
      status: sub.status || 'active',
    }));
  }

  /**
   * Clean up all subscriptions
   * @returns {Promise<void>}
   */
  async cleanup() {
    console.log('🧹 Cleaning up real-time subscriptions...');

    for (const [subscriptionId] of this.subscriptions) {
      await this.unsubscribe(subscriptionId);
    }

    if (this.useSupabase) {
      const supabase = getSupabaseClient();
      if (supabase) {
        // Remove all channels
        supabase.removeAllChannels();
      }
    }

    console.log('✅ Real-time service cleanup completed');
  }

  /**
   * Get service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      backend: this.useSupabase ? 'supabase' : 'socket.io',
      activeSubscriptions: this.subscriptions.size,
      subscriptions: this.getActiveSubscriptions(),
    };
  }
}

// Create singleton instance
const realtimeService = new RealtimeService();

module.exports = {
  RealtimeService,
  realtimeService,
};
