/**
 * Enhanced Real-time Service
 * Optimized integration between Supabase Realtime and Socket.io
 * Includes connection pooling, retry logic, and performance monitoring
 */

const {
  getSupabaseClient,
  isSupabaseEnabled,
} = require('../../server/config/supabase');

class EnhancedRealtimeService {
  constructor() {
    this.subscriptions = new Map();
    this.connectionPool = new Map();
    this.socketIoServer = null;
    this.useSupabase = isSupabaseEnabled;
    this.metrics = {
      messagesProcessed: 0,
      subscriptionsActive: 0,
      connectionTime: null,
      lastPing: null,
      errors: 0,
    };

    // Connection settings
    this.maxRetries = 3;
    this.retryDelay = 2000;
    this.pingInterval = 30000; // 30 seconds
    this.maxSubscriptionsPerChannel = 50;

    console.log(
      `🚀 Enhanced Real-time service initialized with ${this.useSupabase ? 'Supabase' : 'Socket.io'} backend`
    );

    // Start monitoring
    if (this.useSupabase) {
      this.startConnectionMonitoring();
    }
  }

  /**
   * Set Socket.io server instance
   * @param {Object} io - Socket.io server instance
   */
  setSocketServer(io) {
    this.socketIoServer = io;

    // Enhanced Socket.io connection handling
    io.on('connection', socket => {
      this.handleSocketConnection(socket);
    });
  }

  /**
   * Handle new Socket.io connection
   * @param {Object} socket - Socket instance
   */
  handleSocketConnection(socket) {
    const { userId, shopId } = socket;

    console.log(`📱 Enhanced socket connected: ${userId} (Shop: ${shopId})`);

    // Join shop-specific room
    socket.join(`shop_${shopId}`);
    socket.join(`user_${userId}`);

    // Handle subscription requests from client
    socket.on('subscribe_to_table', data => {
      this.handleClientSubscription(socket, data);
    });

    socket.on('unsubscribe_from_table', data => {
      this.handleClientUnsubscription(socket, data);
    });

    // Handle heartbeat
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
      this.metrics.lastPing = new Date();
    });

    socket.on('disconnect', () => {
      console.log(`📱 Socket disconnected: ${userId}`);
      this.cleanupSocketSubscriptions(socket);
    });
  }

  /**
   * Handle client subscription request
   * @param {Object} socket - Socket instance
   * @param {Object} data - Subscription data
   */
  async handleClientSubscription(socket, data) {
    const { table, filter, event = '*' } = data;
    const subscriptionId = `${socket.id}_${table}_${JSON.stringify(filter)}`;

    try {
      if (this.useSupabase) {
        await this.subscribeSupabase(subscriptionId, table, {
          event,
          filter,
          callback: payload => {
            socket.emit(`${table}_change`, payload);
            this.metrics.messagesProcessed++;
          },
          socketId: socket.id,
        });
      } else {
        // For Socket.io fallback, just track the subscription
        this.subscribeSocketIo(subscriptionId, table, {
          event,
          filter,
          socketId: socket.id,
        });
      }

      socket.emit('subscription_success', { subscriptionId, table });
    } catch (error) {
      console.error(
        `Failed to subscribe ${socket.id} to ${table}:`,
        error.message
      );
      socket.emit('subscription_error', { table, error: error.message });
      this.metrics.errors++;
    }
  }

  /**
   * Handle client unsubscription request
   * @param {Object} socket - Socket instance
   * @param {Object} data - Unsubscription data
   */
  async handleClientUnsubscription(socket, data) {
    const { subscriptionId } = data;

    try {
      await this.unsubscribe(subscriptionId);
      socket.emit('unsubscription_success', { subscriptionId });
    } catch (error) {
      socket.emit('unsubscription_error', {
        subscriptionId,
        error: error.message,
      });
    }
  }

  /**
   * Enhanced Supabase subscription with connection pooling
   * @param {string} subscriptionId - Unique subscription ID
   * @param {string} table - Table name
   * @param {Object} options - Subscription options
   * @returns {Promise<Object>} Subscription object
   */
  async subscribeSupabase(subscriptionId, table, options = {}) {
    if (this.subscriptions.has(subscriptionId)) {
      console.warn(`Subscription ${subscriptionId} already exists`);
      return this.subscriptions.get(subscriptionId);
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase not available for real-time subscriptions');
    }

    const {
      event = '*',
      filter,
      callback,
      schema = 'public',
      socketId,
    } = options;

    // Use connection pooling for better performance
    let channelName = `${table}_changes`;
    if (filter) {
      channelName += `_${Object.keys(filter).join('_')}`;
    }

    // Check if we already have a channel for this pattern
    let channel = this.connectionPool.get(channelName);
    const subscriptionsForChannel = Array.from(
      this.subscriptions.values()
    ).filter(sub => sub.channelName === channelName).length;

    if (
      !channel ||
      subscriptionsForChannel >= this.maxSubscriptionsPerChannel
    ) {
      // Create new channel
      const channelId = `${channelName}_${Date.now()}`;

      channel = supabase.channel(channelId).on(
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
          // Broadcast to all subscribers of this channel
          this.handleSupabaseEvent(channelName, payload);
        }
      );

      // Subscribe with retry logic
      const subscribeWithRetry = async (retryCount = 0) => {
        const subscriptionResponse = await channel.subscribe(status => {
          console.log(`📡 Enhanced subscription ${channelId} status:`, status);

          if (status === 'SUBSCRIBED') {
            this.metrics.connectionTime = new Date();
            this.metrics.subscriptionsActive++;
          } else if (status === 'CHANNEL_ERROR') {
            this.metrics.errors++;

            if (retryCount < this.maxRetries) {
              setTimeout(
                () => {
                  console.log(
                    `🔄 Retrying subscription ${channelId} (${retryCount + 1}/${this.maxRetries})`
                  );
                  subscribeWithRetry(retryCount + 1);
                },
                this.retryDelay * (retryCount + 1)
              );
            } else {
              console.error(
                `❌ Failed to establish subscription ${channelId} after ${this.maxRetries} retries`
              );
            }
          }
        });

        return subscriptionResponse;
      };

      await subscribeWithRetry();

      this.connectionPool.set(channelName, {
        channel,
        channelId,
        subscriptions: new Map(),
        createdAt: new Date(),
      });
    }

    // Add subscription to the channel
    const pooledChannel = this.connectionPool.get(channelName);
    pooledChannel.subscriptions.set(subscriptionId, {
      callback,
      socketId,
      filter,
      event,
    });

    const subscription = {
      id: subscriptionId,
      type: 'supabase',
      table,
      channelName,
      options,
      createdAt: new Date(),
    };

    this.subscriptions.set(subscriptionId, subscription);
    return subscription;
  }

  /**
   * Handle Supabase real-time events
   * @param {string} channelName - Channel name
   * @param {Object} payload - Event payload
   */
  handleSupabaseEvent(channelName, payload) {
    const pooledChannel = this.connectionPool.get(channelName);
    if (!pooledChannel) return;

    // Process each subscription in this channel
    for (const [subscriptionId, subscription] of pooledChannel.subscriptions) {
      try {
        // Apply filters if any
        if (this.shouldProcessEvent(subscription, payload)) {
          if (subscription.callback) {
            subscription.callback(payload);
          }

          // Also emit to Socket.io for backwards compatibility
          this.emitToSocketIo(
            `${payload.table}_change`,
            payload,
            null,
            subscription.socketId
          );
        }
      } catch (error) {
        console.error(
          `Error processing event for subscription ${subscriptionId}:`,
          error.message
        );
        this.metrics.errors++;
      }
    }

    this.metrics.messagesProcessed++;
  }

  /**
   * Check if event should be processed based on subscription filters
   * @param {Object} subscription - Subscription details
   * @param {Object} payload - Event payload
   * @returns {boolean} Should process event
   */
  shouldProcessEvent(subscription, payload) {
    if (!subscription.filter) return true;

    const { new: newRecord, old: oldRecord } = payload;
    const record = newRecord || oldRecord;

    if (!record) return true;

    // Check filter conditions
    for (const [key, value] of Object.entries(subscription.filter)) {
      if (record[key] !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Enhanced Socket.io subscription (fallback mode)
   * @param {string} subscriptionId - Subscription ID
   * @param {string} table - Table name
   * @param {Object} options - Options
   * @returns {Object} Subscription object
   */
  subscribeSocketIo(subscriptionId, table, options = {}) {
    const subscription = {
      id: subscriptionId,
      type: 'socket.io',
      table,
      options,
      createdAt: new Date(),
    };

    this.subscriptions.set(subscriptionId, subscription);
    console.log(`📡 Socket.io subscription created: ${subscriptionId}`);

    return subscription;
  }

  /**
   * Unsubscribe with enhanced cleanup
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<boolean>} Success status
   */
  async unsubscribe(subscriptionId) {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      console.warn(`Subscription ${subscriptionId} not found`);
      return false;
    }

    if (subscription.type === 'supabase') {
      const pooledChannel = this.connectionPool.get(subscription.channelName);
      if (pooledChannel) {
        // Remove subscription from the pooled channel
        pooledChannel.subscriptions.delete(subscriptionId);

        // If no more subscriptions, close the channel
        if (pooledChannel.subscriptions.size === 0) {
          const supabase = getSupabaseClient();
          if (supabase) {
            await supabase.removeChannel(pooledChannel.channel);
            this.metrics.subscriptionsActive--;
          }
          this.connectionPool.delete(subscription.channelName);
          console.log(`📡 Closed unused channel: ${subscription.channelName}`);
        }
      }
    }

    this.subscriptions.delete(subscriptionId);
    console.log(`📡 Unsubscribed: ${subscriptionId}`);
    return true;
  }

  /**
   * Cleanup subscriptions for a specific socket
   * @param {Object} socket - Socket instance
   */
  cleanupSocketSubscriptions(socket) {
    const subscriptionsToRemove = [];

    for (const [subscriptionId, subscription] of this.subscriptions) {
      if (subscription.options?.socketId === socket.id) {
        subscriptionsToRemove.push(subscriptionId);
      }
    }

    // Clean up subscriptions
    subscriptionsToRemove.forEach(subscriptionId => {
      this.unsubscribe(subscriptionId);
    });

    console.log(
      `🧹 Cleaned up ${subscriptionsToRemove.length} subscriptions for socket ${socket.id}`
    );
  }

  /**
   * Enhanced emit with targeting
   * @param {string} event - Event name
   * @param {Object} data - Event data
   * @param {string} shopId - Shop ID for targeting
   * @param {string} socketId - Specific socket ID (optional)
   */
  emitToSocketIo(event, data, shopId = null, socketId = null) {
    if (!this.socketIoServer) return;

    if (socketId) {
      // Emit to specific socket
      this.socketIoServer.to(socketId).emit(event, data);
    } else if (shopId) {
      // Emit to shop room
      this.socketIoServer.to(`shop_${shopId}`).emit(event, data);
    } else {
      // Broadcast to all
      this.socketIoServer.emit(event, data);
    }
  }

  /**
   * Start connection monitoring for diagnostics
   */
  startConnectionMonitoring() {
    setInterval(() => {
      if (this.useSupabase) {
        this.performHealthCheck();
      }
    }, this.pingInterval);

    console.log('📊 Started connection monitoring');
  }

  /**
   * Perform health check on connections
   */
  async performHealthCheck() {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        // Test connection with a lightweight query
        const { data, error } = await supabase
          .from('_realtime')
          .select('*')
          .limit(1);
        this.metrics.lastPing = new Date();

        if (error && !error.message.includes('does not exist')) {
          console.warn('⚠️ Health check failed:', error.message);
          this.metrics.errors++;
        }
      }
    } catch (error) {
      console.warn('⚠️ Health check error:', error.message);
      this.metrics.errors++;
    }
  }

  /**
   * Get enhanced service metrics
   * @returns {Object} Detailed metrics
   */
  getMetrics() {
    const now = new Date();
    const uptime = this.metrics.connectionTime
      ? (now - this.metrics.connectionTime) / 1000
      : 0;

    return {
      backend: this.useSupabase ? 'supabase' : 'socket.io',
      activeSubscriptions: this.subscriptions.size,
      connectionPools: this.connectionPool.size,
      messagesProcessed: this.metrics.messagesProcessed,
      errors: this.metrics.errors,
      uptime: uptime,
      lastPing: this.metrics.lastPing,
      performance: {
        subscriptionsPerSecond:
          uptime > 0 ? (this.subscriptions.size / uptime).toFixed(2) : 0,
        messagesPerSecond:
          uptime > 0 ? (this.metrics.messagesProcessed / uptime).toFixed(2) : 0,
        errorRate:
          this.metrics.messagesProcessed > 0
            ? (
                (this.metrics.errors / this.metrics.messagesProcessed) *
                100
              ).toFixed(2)
            : 0,
      },
    };
  }

  /**
   * Business-specific broadcast methods with enhanced targeting
   */

  /**
   * Broadcast job update with smart filtering
   * @param {Object} jobData - Job data
   * @param {string} eventType - Event type
   */
  broadcastJobUpdate(jobData, eventType = 'updated') {
    const payload = {
      type: eventType,
      data: jobData,
      timestamp: new Date().toISOString(),
      table: 'jobs',
    };

    // Broadcast to shop and assigned technician specifically
    this.emitToSocketIo(
      'job_update',
      payload,
      jobData.shopId || jobData.shop_id
    );

    if (jobData.assigned_to) {
      this.emitToSocketIo(
        'job_assignment_update',
        payload,
        null,
        `user_${jobData.assigned_to}`
      );
    }
  }

  /**
   * Broadcast with priority handling
   * @param {string} event - Event name
   * @param {Object} data - Data
   * @param {string} priority - Priority level (low, normal, high)
   * @param {string} target - Target (shop_id or user_id)
   */
  broadcastWithPriority(event, data, priority = 'normal', target = null) {
    const payload = {
      ...data,
      priority,
      timestamp: new Date().toISOString(),
    };

    // Add priority-specific handling
    if (priority === 'high' || priority === 'urgent') {
      // For high priority, ensure delivery
      payload.requiresAck = true;
      payload.retryCount = 3;
    }

    if (target) {
      if (target.startsWith('shop_')) {
        this.emitToSocketIo(event, payload, target.replace('shop_', ''));
      } else if (target.startsWith('user_')) {
        this.emitToSocketIo(event, payload, null, target);
      }
    } else {
      this.emitToSocketIo(event, payload);
    }
  }

  /**
   * Enhanced cleanup with metrics
   * @returns {Promise<void>}
   */
  async cleanup() {
    console.log('🧹 Enhanced real-time service cleanup starting...');

    const startTime = Date.now();

    // Cleanup all subscriptions
    const subscriptionIds = Array.from(this.subscriptions.keys());
    for (const subscriptionId of subscriptionIds) {
      await this.unsubscribe(subscriptionId);
    }

    // Close all connection pools
    if (this.useSupabase) {
      const supabase = getSupabaseClient();
      if (supabase) {
        for (const [channelName, pooledChannel] of this.connectionPool) {
          await supabase.removeChannel(pooledChannel.channel);
        }
        this.connectionPool.clear();
      }
    }

    const cleanupTime = Date.now() - startTime;

    console.log(
      `✅ Enhanced real-time service cleanup completed in ${cleanupTime}ms`
    );
    console.log(`📊 Final metrics:`, this.getMetrics());
  }
}

// Create singleton instance
const enhancedRealtimeService = new EnhancedRealtimeService();

module.exports = {
  EnhancedRealtimeService,
  enhancedRealtimeService,
};
