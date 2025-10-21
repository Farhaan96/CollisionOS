/**
 * Unit Tests for Sync Configuration Service
 * Tests configuration loading, feature flags, cost calculation, and validation
 */

const { SyncConfigService, syncConfigService, DEFAULT_SYNC_CONFIG, FEATURE_COSTS } = require('../../server/services/syncConfig');

describe('Sync Configuration Service', () => {
  let configService;

  beforeEach(() => {
    // Create fresh instance for each test
    configService = new SyncConfigService();

    // Reset environment variables
    delete process.env.ENABLE_SUPABASE;
    delete process.env.SYNC_ENABLED;
    delete process.env.SYNC_BMS_INGESTION;
    delete process.env.SYNC_MOBILE;
    delete process.env.SYNC_MULTI_LOCATION;
    delete process.env.SYNC_FILE_BACKUP;
    delete process.env.SYNC_REALTIME;
  });

  describe('Default Configuration', () => {
    test('should have correct default config', () => {
      expect(configService.config.enabled).toBe(false);
      expect(configService.config.syncInterval).toBe(30000);
      expect(configService.config.retryAttempts).toBe(3);
      expect(configService.config.batchSize).toBe(50);
      expect(configService.config.features).toBeDefined();
    });

    test('all features should be disabled by default', () => {
      const features = configService.config.features;
      expect(features.bmsIngestion).toBe(false);
      expect(features.mobileSync).toBe(false);
      expect(features.multiLocation).toBe(false);
      expect(features.fileBackup).toBe(false);
      expect(features.realtimeUpdates).toBe(false);
    });

    test('should have default performance settings', () => {
      expect(configService.config.enableCompression).toBe(true);
      expect(configService.config.enableDeltaSync).toBe(true);
      expect(configService.config.offlineQueueLimit).toBe(1000);
    });
  });

  describe('Environment Variable Parsing', () => {
    test('should load enabled state from environment', async () => {
      process.env.ENABLE_SUPABASE = 'true';
      process.env.SYNC_ENABLED = 'true';

      await configService.initialize();

      expect(configService.config.enabled).toBe(true);
    });

    test('should require both ENABLE_SUPABASE and SYNC_ENABLED', async () => {
      process.env.ENABLE_SUPABASE = 'true';
      process.env.SYNC_ENABLED = 'false';

      await configService.initialize();

      expect(configService.config.enabled).toBe(false);
    });

    test('should load feature flags from environment', async () => {
      process.env.ENABLE_SUPABASE = 'true';
      process.env.SYNC_ENABLED = 'true';
      process.env.SYNC_BMS_INGESTION = 'true';
      process.env.SYNC_MOBILE = 'true';

      await configService.initialize();

      expect(configService.config.features.bmsIngestion).toBe(true);
      expect(configService.config.features.mobileSync).toBe(true);
      expect(configService.config.features.multiLocation).toBe(false);
    });

    test('should parse numeric config values', async () => {
      process.env.SYNC_INTERVAL_MS = '60000';
      process.env.SYNC_RETRY_ATTEMPTS = '5';
      process.env.SYNC_BATCH_SIZE = '100';

      await configService.initialize();

      expect(configService.config.syncInterval).toBe(60000);
      expect(configService.config.retryAttempts).toBe(5);
      expect(configService.config.batchSize).toBe(100);
    });

    test('should use defaults for invalid numeric values', async () => {
      process.env.SYNC_INTERVAL_MS = 'invalid';
      process.env.SYNC_RETRY_ATTEMPTS = 'not-a-number';

      await configService.initialize();

      expect(configService.config.syncInterval).toBe(30000);
      expect(configService.config.retryAttempts).toBe(3);
    });
  });

  describe('Cost Calculation', () => {
    test('should calculate zero cost when no features enabled', () => {
      const cost = configService.calculateCost({
        bmsIngestion: false,
        mobileSync: false,
        multiLocation: false,
        fileBackup: false,
        realtimeUpdates: false,
      });

      expect(cost).toBe(0);
    });

    test('should calculate cost for single feature', () => {
      const cost = configService.calculateCost({
        bmsIngestion: true,
        mobileSync: false,
        multiLocation: false,
        fileBackup: false,
        realtimeUpdates: false,
      });

      expect(cost).toBe(FEATURE_COSTS.bmsIngestion);
    });

    test('should calculate total cost for multiple features', () => {
      const cost = configService.calculateCost({
        bmsIngestion: true,
        mobileSync: true,
        multiLocation: true,
        fileBackup: false,
        realtimeUpdates: false,
      });

      const expectedCost = FEATURE_COSTS.bmsIngestion + FEATURE_COSTS.mobileSync + FEATURE_COSTS.multiLocation;
      expect(cost).toBe(expectedCost);
    });

    test('should calculate cost for all features', () => {
      const cost = configService.calculateCost({
        bmsIngestion: true,
        mobileSync: true,
        multiLocation: true,
        fileBackup: true,
        realtimeUpdates: true,
      });

      const expectedCost = Object.values(FEATURE_COSTS).reduce((sum, cost) => sum + cost, 0);
      expect(cost).toBe(expectedCost);
    });
  });

  describe('Cost Breakdown', () => {
    test('should provide detailed cost breakdown', () => {
      const breakdown = configService.getCostBreakdown({
        bmsIngestion: true,
        mobileSync: true,
        multiLocation: false,
        fileBackup: false,
        realtimeUpdates: false,
      });

      expect(breakdown).toHaveProperty('base');
      expect(breakdown).toHaveProperty('features');
      expect(breakdown).toHaveProperty('total');
      expect(breakdown.features.bmsIngestion).toBe(FEATURE_COSTS.bmsIngestion);
      expect(breakdown.features.mobileSync).toBe(FEATURE_COSTS.mobileSync);
      expect(breakdown.total).toBe(FEATURE_COSTS.bmsIngestion + FEATURE_COSTS.mobileSync);
    });

    test('should only include enabled features in breakdown', () => {
      const breakdown = configService.getCostBreakdown({
        bmsIngestion: false,
        mobileSync: true,
        multiLocation: false,
        fileBackup: false,
        realtimeUpdates: false,
      });

      expect(breakdown.features).not.toHaveProperty('bmsIngestion');
      expect(breakdown.features).toHaveProperty('mobileSync');
    });
  });

  describe('Configuration Getters', () => {
    test('should get configuration value by key', () => {
      configService.config.syncInterval = 45000;

      const value = configService.get('syncInterval');
      expect(value).toBe(45000);
    });

    test('should get nested configuration value', () => {
      configService.config.features.bmsIngestion = true;

      const value = configService.get('features.bmsIngestion');
      expect(value).toBe(true);
    });

    test('should return default value for missing key', () => {
      const value = configService.get('nonexistent.key', 'default-value');
      expect(value).toBe('default-value');
    });

    test('should return undefined for missing key without default', () => {
      const value = configService.get('nonexistent.key');
      expect(value).toBeUndefined();
    });
  });

  describe('Sync Enabled Check', () => {
    test('should return false when sync disabled', () => {
      configService.config.enabled = false;
      expect(configService.isSyncEnabled()).toBe(false);
    });

    test('should return true when sync enabled', () => {
      configService.config.enabled = true;
      expect(configService.isSyncEnabled()).toBe(true);
    });
  });

  describe('Feature Enabled Check', () => {
    test('should return false when sync globally disabled', async () => {
      configService.config.enabled = false;
      configService.config.features.bmsIngestion = true;

      const enabled = await configService.isFeatureEnabled('bmsIngestion');
      expect(enabled).toBe(false);
    });

    test('should return true when feature and sync both enabled', async () => {
      configService.config.enabled = true;
      configService.config.features.mobileSync = true;

      const enabled = await configService.isFeatureEnabled('mobileSync');
      expect(enabled).toBe(true);
    });

    test('should return false when feature disabled but sync enabled', async () => {
      configService.config.enabled = true;
      configService.config.features.fileBackup = false;

      const enabled = await configService.isFeatureEnabled('fileBackup');
      expect(enabled).toBe(false);
    });
  });

  describe('Cache Management', () => {
    test('should clear all shop configs from cache', () => {
      configService.shopConfigs.set('shop1', { test: 'data' });
      configService.shopConfigs.set('shop2', { test: 'data' });

      expect(configService.shopConfigs.size).toBe(2);

      configService.clearCache();

      expect(configService.shopConfigs.size).toBe(0);
    });

    test('should clear specific shop config from cache', () => {
      configService.shopConfigs.set('shop1', { test: 'data' });
      configService.shopConfigs.set('shop2', { test: 'data' });

      configService.clearCache('shop1');

      expect(configService.shopConfigs.has('shop1')).toBe(false);
      expect(configService.shopConfigs.has('shop2')).toBe(true);
    });
  });

  describe('Constants', () => {
    test('DEFAULT_SYNC_CONFIG should be exported', () => {
      expect(DEFAULT_SYNC_CONFIG).toBeDefined();
      expect(DEFAULT_SYNC_CONFIG.enabled).toBe(false);
    });

    test('FEATURE_COSTS should be exported with all features', () => {
      expect(FEATURE_COSTS).toBeDefined();
      expect(FEATURE_COSTS.bmsIngestion).toBe(10);
      expect(FEATURE_COSTS.mobileSync).toBe(15);
      expect(FEATURE_COSTS.multiLocation).toBe(20);
      expect(FEATURE_COSTS.fileBackup).toBe(25);
      expect(FEATURE_COSTS.realtimeUpdates).toBe(30);
    });
  });
});
