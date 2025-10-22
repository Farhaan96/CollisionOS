/**
 * Sync Configuration Service
 * Manages hybrid cloud sync settings and feature flags
 */

const { Shop } = require('../database/models');

/**
 * Default sync configuration
 */
const DEFAULT_SYNC_CONFIG = {
  // Global sync toggle
  enabled: false,

  // Feature-specific toggles
  features: {
    bmsIngestion: false, // BMS XML processing via Supabase Edge Functions
    mobileSync: false, // Mobile app data synchronization
    multiLocation: false, // Multi-location shop support
    fileBackup: false, // Automatic file backups to Supabase Storage
    realtimeUpdates: false, // WebSocket real-time updates
  },

  // Sync behavior settings
  syncInterval: 30000, // Sync every 30 seconds (ms)
  retryAttempts: 3, // Number of retry attempts for failed syncs
  retryDelay: 5000, // Delay between retries (ms)
  batchSize: 50, // Number of records to sync in one batch
  conflictResolution: 'last-write-wins', // Conflict resolution strategy

  // Performance settings
  enableCompression: true, // Compress data before sending to cloud
  enableDeltaSync: true, // Only sync changed fields
  offlineQueueLimit: 1000, // Maximum queued operations when offline

  // Cost management
  estimatedMonthlyCost: 0, // Estimated monthly cost in USD
  dataTransferLimit: 10 * 1024 * 1024 * 1024, // 10 GB per month
};

/**
 * Feature cost estimates (USD per month)
 */
const FEATURE_COSTS = {
  bmsIngestion: 10, // Edge function invocations
  mobileSync: 15, // Database reads/writes + storage
  multiLocation: 20, // Additional storage + compute
  fileBackup: 25, // Storage costs (photos, documents)
  realtimeUpdates: 30, // Realtime channel subscriptions
};

class SyncConfigService {
  constructor() {
    this.config = { ...DEFAULT_SYNC_CONFIG };
    this.shopConfigs = new Map(); // Cache shop-specific configs
  }

  /**
   * Initialize sync configuration from environment and database
   */
  async initialize() {
    // Load global config from environment
    const envConfig = this.loadFromEnvironment();
    this.config = { ...this.config, ...envConfig };

    console.log('[SyncConfig] Initialized with config:', {
      enabled: this.config.enabled,
      features: this.config.features,
      syncInterval: this.config.syncInterval,
    });

    return this.config;
  }

  /**
   * Load configuration from environment variables
   */
  loadFromEnvironment() {
    const enabled =
      process.env.ENABLE_SUPABASE === 'true' &&
      process.env.SYNC_ENABLED === 'true';

    return {
      enabled,
      features: {
        bmsIngestion: process.env.SYNC_BMS_INGESTION === 'true',
        mobileSync: process.env.SYNC_MOBILE === 'true',
        multiLocation: process.env.SYNC_MULTI_LOCATION === 'true',
        fileBackup: process.env.SYNC_FILE_BACKUP === 'true',
        realtimeUpdates: process.env.SYNC_REALTIME === 'true',
      },
      syncInterval: parseInt(process.env.SYNC_INTERVAL_MS) || 30000,
      retryAttempts: parseInt(process.env.SYNC_RETRY_ATTEMPTS) || 3,
      retryDelay: parseInt(process.env.SYNC_RETRY_DELAY_MS) || 5000,
      batchSize: parseInt(process.env.SYNC_BATCH_SIZE) || 50,
    };
  }

  /**
   * Get sync configuration for a specific shop
   * @param {string} shopId - Shop UUID
   * @returns {Promise<Object>} Shop-specific sync configuration
   */
  async getShopConfig(shopId) {
    // Check cache first
    if (this.shopConfigs.has(shopId)) {
      return this.shopConfigs.get(shopId);
    }

    try {
      // Load shop-specific config from database
      const shop = await Shop.findByPk(shopId);
      if (!shop) {
        throw new Error(`Shop not found: ${shopId}`);
      }

      // Merge shop settings with global config
      const shopSyncSettings = shop.settings?.sync || {};
      const shopConfig = {
        ...this.config,
        ...shopSyncSettings,
        shopId,
        shopName: shop.name,
      };

      // Cache the config
      this.shopConfigs.set(shopId, shopConfig);

      return shopConfig;
    } catch (error) {
      console.error(`[SyncConfig] Error loading shop config for ${shopId}:`, error);
      return this.config; // Fallback to global config
    }
  }

  /**
   * Update shop-specific sync configuration
   * @param {string} shopId - Shop UUID
   * @param {Object} updates - Configuration updates
   * @returns {Promise<Object>} Updated configuration
   */
  async updateShopConfig(shopId, updates) {
    try {
      const shop = await Shop.findByPk(shopId);
      if (!shop) {
        throw new Error(`Shop not found: ${shopId}`);
      }

      // Merge updates into shop settings
      const currentSettings = shop.settings || {};
      const currentSyncSettings = currentSettings.sync || {};
      const updatedSyncSettings = {
        ...currentSyncSettings,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Save to database
      await shop.update({
        settings: {
          ...currentSettings,
          sync: updatedSyncSettings,
        },
      });

      // Update cache
      const newConfig = {
        ...this.config,
        ...updatedSyncSettings,
        shopId,
        shopName: shop.name,
      };
      this.shopConfigs.set(shopId, newConfig);

      console.log(`[SyncConfig] Updated config for shop ${shopId}:`, updates);

      return newConfig;
    } catch (error) {
      console.error(`[SyncConfig] Error updating shop config:`, error);
      throw error;
    }
  }

  /**
   * Check if sync is enabled globally
   * @returns {boolean}
   */
  isSyncEnabled() {
    return this.config.enabled;
  }

  /**
   * Check if a specific feature is enabled
   * @param {string} feature - Feature name
   * @param {string} shopId - Optional shop ID for shop-specific check
   * @returns {Promise<boolean>}
   */
  async isFeatureEnabled(feature, shopId = null) {
    if (!this.config.enabled) {
      return false;
    }

    if (shopId) {
      const shopConfig = await this.getShopConfig(shopId);
      return shopConfig.features?.[feature] === true;
    }

    return this.config.features?.[feature] === true;
  }

  /**
   * Calculate estimated monthly cost based on enabled features
   * @param {Object} features - Enabled features
   * @returns {number} Estimated cost in USD
   */
  calculateCost(features) {
    let totalCost = 0;

    Object.entries(features).forEach(([feature, enabled]) => {
      if (enabled && FEATURE_COSTS[feature]) {
        totalCost += FEATURE_COSTS[feature];
      }
    });

    // Base Supabase cost (free tier)
    const baseCost = 0;

    return baseCost + totalCost;
  }

  /**
   * Get feature cost breakdown
   * @param {Object} features - Enabled features
   * @returns {Object} Cost breakdown
   */
  getCostBreakdown(features) {
    const breakdown = {
      base: 0,
      features: {},
      total: 0,
    };

    Object.entries(features).forEach(([feature, enabled]) => {
      if (enabled && FEATURE_COSTS[feature]) {
        breakdown.features[feature] = FEATURE_COSTS[feature];
      }
    });

    breakdown.total = this.calculateCost(features);

    return breakdown;
  }

  /**
   * Validate Supabase credentials
   * @returns {Promise<boolean>}
   */
  async validateCredentials() {
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ];

    const missing = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
      console.warn(`[SyncConfig] Missing Supabase credentials: ${missing.join(', ')}`);
      return false;
    }

    // Test connection (basic check)
    try {
      const { getSupabaseClient } = require('../config/supabase');
      const supabase = getSupabaseClient();

      if (!supabase) {
        console.warn('[SyncConfig] Failed to create Supabase client');
        return false;
      }

      // Simple health check
      const { error } = await supabase.from('shops').select('count', { count: 'exact', head: true });

      if (error) {
        console.warn('[SyncConfig] Supabase connection test failed:', error.message);
        return false;
      }

      console.log('[SyncConfig] Supabase credentials validated successfully');
      return true;
    } catch (error) {
      console.error('[SyncConfig] Error validating credentials:', error);
      return false;
    }
  }

  /**
   * Get sync status summary
   * @param {string} shopId - Optional shop ID
   * @returns {Promise<Object>} Sync status
   */
  async getStatus(shopId = null) {
    const config = shopId ? await this.getShopConfig(shopId) : this.config;

    const credentialsValid = await this.validateCredentials();

    return {
      enabled: config.enabled && credentialsValid,
      credentialsValid,
      features: config.features,
      syncInterval: config.syncInterval,
      retryAttempts: config.retryAttempts,
      estimatedCost: this.calculateCost(config.features),
      mode: config.enabled ? 'hybrid' : 'local-only',
      supabaseUrl: process.env.SUPABASE_URL || null,
    };
  }

  /**
   * Get configuration value
   * @param {string} key - Configuration key
   * @param {*} defaultValue - Default value if not set
   * @returns {*} Configuration value
   */
  get(key, defaultValue = undefined) {
    const keys = key.split('.');
    let value = this.config;

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }

    return value !== undefined ? value : defaultValue;
  }

  /**
   * Clear shop config cache
   * @param {string} shopId - Optional specific shop ID to clear
   */
  clearCache(shopId = null) {
    if (shopId) {
      this.shopConfigs.delete(shopId);
    } else {
      this.shopConfigs.clear();
    }
  }
}

// Create singleton instance
const syncConfigService = new SyncConfigService();

module.exports = {
  SyncConfigService,
  syncConfigService,
  DEFAULT_SYNC_CONFIG,
  FEATURE_COSTS,
};
