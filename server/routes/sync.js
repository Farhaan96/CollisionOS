/**
 * Sync Monitoring and Control API
 * Routes for managing hybrid cloud synchronization
 */

const express = require('express');
const router = express.Router();
const { hybridDatabaseService } = require('../services/databaseServiceHybrid');
const { syncConfigService } = require('../services/syncConfig');
const { syncQueueService } = require('../services/syncQueue');

/**
 * GET /api/sync/status
 * Get current sync status and statistics
 */
router.get('/status', async (req, res) => {
  try {
    const status = await hybridDatabaseService.getSyncStatus();

    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Sync API] Error getting status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sync status',
      message: error.message,
    });
  }
});

/**
 * GET /api/sync/config
 * Get sync configuration
 */
router.get('/config', async (req, res) => {
  try {
    const shopId = req.query.shopId || req.user?.shopId;

    const config = shopId
      ? await syncConfigService.getShopConfig(shopId)
      : syncConfigService.config;

    const costBreakdown = syncConfigService.getCostBreakdown(config.features);

    res.json({
      success: true,
      data: {
        config,
        costBreakdown,
      },
    });
  } catch (error) {
    console.error('[Sync API] Error getting config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sync config',
      message: error.message,
    });
  }
});

/**
 * PUT /api/sync/config
 * Update sync configuration
 */
router.put('/config', async (req, res) => {
  try {
    const shopId = req.user?.shopId;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID required',
      });
    }

    const updates = req.body;

    // Validate updates
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid configuration updates',
      });
    }

    const updatedConfig = await syncConfigService.updateShopConfig(shopId, updates);

    // If sync was enabled/disabled, update the service
    if (updates.enabled !== undefined) {
      hybridDatabaseService.setSyncEnabled(updates.enabled);
    }

    res.json({
      success: true,
      data: updatedConfig,
      message: 'Sync configuration updated successfully',
    });
  } catch (error) {
    console.error('[Sync API] Error updating config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update sync config',
      message: error.message,
    });
  }
});

/**
 * GET /api/sync/queue
 * Get sync queue contents
 */
router.get('/queue', async (req, res) => {
  try {
    const queue = hybridDatabaseService.getSyncQueue();
    const stats = syncQueueService.getStats();

    res.json({
      success: true,
      data: {
        queue,
        stats,
        count: queue.length,
      },
    });
  } catch (error) {
    console.error('[Sync API] Error getting queue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sync queue',
      message: error.message,
    });
  }
});

/**
 * POST /api/sync/trigger
 * Manually trigger sync (force process queue)
 */
router.post('/trigger', async (req, res) => {
  try {
    const result = await hybridDatabaseService.triggerSync();

    res.json({
      success: true,
      data: result,
      message: 'Sync triggered successfully',
    });
  } catch (error) {
    console.error('[Sync API] Error triggering sync:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger sync',
      message: error.message,
    });
  }
});

/**
 * POST /api/sync/queue/clear
 * Clear sync queue (use with caution)
 */
router.post('/queue/clear', async (req, res) => {
  try {
    // Require admin permission
    if (req.user?.role !== 'owner' && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
    }

    const clearedCount = hybridDatabaseService.clearSyncQueue();

    res.json({
      success: true,
      data: {
        clearedCount,
      },
      message: `Cleared ${clearedCount} operations from sync queue`,
    });
  } catch (error) {
    console.error('[Sync API] Error clearing queue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear sync queue',
      message: error.message,
    });
  }
});

/**
 * GET /api/sync/history
 * Get sync history
 */
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const history = syncQueueService.getHistory(limit);

    res.json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error) {
    console.error('[Sync API] Error getting history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sync history',
      message: error.message,
    });
  }
});

/**
 * POST /api/sync/test-connection
 * Test Supabase connection
 */
router.post('/test-connection', async (req, res) => {
  try {
    const credentialsValid = await syncConfigService.validateCredentials();

    if (!credentialsValid) {
      return res.status(400).json({
        success: false,
        error: 'Supabase credentials invalid or connection failed',
      });
    }

    res.json({
      success: true,
      message: 'Supabase connection successful',
      data: {
        url: process.env.SUPABASE_URL,
        credentialsValid: true,
      },
    });
  } catch (error) {
    console.error('[Sync API] Error testing connection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test connection',
      message: error.message,
    });
  }
});

/**
 * POST /api/sync/force-sync-record
 * Force sync a specific record to cloud
 */
router.post('/force-sync-record', async (req, res) => {
  try {
    const { table, where } = req.body;

    if (!table || !where) {
      return res.status(400).json({
        success: false,
        error: 'Table and where conditions required',
      });
    }

    const result = await hybridDatabaseService.forceSyncRecord(table, where);

    res.json({
      success: true,
      data: result,
      message: 'Record synced to cloud successfully',
    });
  } catch (error) {
    console.error('[Sync API] Error forcing sync:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync record',
      message: error.message,
    });
  }
});

/**
 * GET /api/sync/cost-estimate
 * Get cost estimate for selected features
 */
router.get('/cost-estimate', (req, res) => {
  try {
    const features = req.query;

    // Convert query params to boolean
    const featureConfig = {
      bmsIngestion: features.bmsIngestion === 'true',
      mobileSync: features.mobileSync === 'true',
      multiLocation: features.multiLocation === 'true',
      fileBackup: features.fileBackup === 'true',
      realtimeUpdates: features.realtimeUpdates === 'true',
    };

    const costBreakdown = syncConfigService.getCostBreakdown(featureConfig);

    res.json({
      success: true,
      data: costBreakdown,
    });
  } catch (error) {
    console.error('[Sync API] Error calculating cost:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate cost estimate',
      message: error.message,
    });
  }
});

/**
 * GET /api/sync/stats
 * Get detailed sync statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = syncQueueService.getStats();
    const shopId = req.query.shopId || req.user?.shopId;

    res.json({
      success: true,
      data: {
        ...stats,
        shopId,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Sync API] Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sync stats',
      message: error.message,
    });
  }
});

/**
 * POST /api/sync/enable
 * Enable cloud sync
 */
router.post('/enable', async (req, res) => {
  try {
    // Require admin permission
    if (req.user?.role !== 'owner' && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
    }

    // Validate credentials first
    const credentialsValid = await syncConfigService.validateCredentials();

    if (!credentialsValid) {
      return res.status(400).json({
        success: false,
        error: 'Cannot enable sync - invalid Supabase credentials',
      });
    }

    // Enable sync
    hybridDatabaseService.setSyncEnabled(true);

    // Update shop config
    const shopId = req.user.shopId;
    if (shopId) {
      await syncConfigService.updateShopConfig(shopId, { enabled: true });
    }

    res.json({
      success: true,
      message: 'Cloud sync enabled successfully',
    });
  } catch (error) {
    console.error('[Sync API] Error enabling sync:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enable sync',
      message: error.message,
    });
  }
});

/**
 * POST /api/sync/disable
 * Disable cloud sync
 */
router.post('/disable', async (req, res) => {
  try {
    // Require admin permission
    if (req.user?.role !== 'owner' && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
    }

    // Disable sync
    hybridDatabaseService.setSyncEnabled(false);

    // Update shop config
    const shopId = req.user.shopId;
    if (shopId) {
      await syncConfigService.updateShopConfig(shopId, { enabled: false });
    }

    res.json({
      success: true,
      message: 'Cloud sync disabled successfully',
    });
  } catch (error) {
    console.error('[Sync API] Error disabling sync:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disable sync',
      message: error.message,
    });
  }
});

module.exports = router;
