/**
 * Frontend Sync Service
 * API client for cloud sync configuration and monitoring
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

class SyncService {
  /**
   * Get sync status
   */
  async getStatus() {
    const response = await fetch(`${API_BASE_URL}/sync/status`);
    return response.json();
  }

  /**
   * Get sync configuration
   */
  async getConfig(shopId = null) {
    const url = shopId
      ? `${API_BASE_URL}/sync/config?shopId=${shopId}`
      : `${API_BASE_URL}/sync/config`;

    const response = await fetch(url);
    return response.json();
  }

  /**
   * Update sync configuration
   */
  async updateConfig(updates) {
    const response = await fetch(`${API_BASE_URL}/sync/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    return response.json();
  }

  /**
   * Get sync queue
   */
  async getQueue() {
    const response = await fetch(`${API_BASE_URL}/sync/queue`);
    return response.json();
  }

  /**
   * Trigger manual sync
   */
  async triggerSync() {
    const response = await fetch(`${API_BASE_URL}/sync/trigger`, {
      method: 'POST',
    });

    return response.json();
  }

  /**
   * Clear sync queue
   */
  async clearQueue() {
    const response = await fetch(`${API_BASE_URL}/sync/queue/clear`, {
      method: 'POST',
    });

    return response.json();
  }

  /**
   * Get sync history
   */
  async getHistory(limit = 100) {
    const response = await fetch(`${API_BASE_URL}/sync/history?limit=${limit}`);
    return response.json();
  }

  /**
   * Test Supabase connection
   */
  async testConnection() {
    const response = await fetch(`${API_BASE_URL}/sync/test-connection`, {
      method: 'POST',
    });

    return response.json();
  }

  /**
   * Force sync a specific record
   */
  async forceSyncRecord(table, where) {
    const response = await fetch(`${API_BASE_URL}/sync/force-sync-record`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ table, where }),
    });

    return response.json();
  }

  /**
   * Get cost estimate for features
   */
  async getCostEstimate(features) {
    const queryParams = new URLSearchParams();

    Object.entries(features).forEach(([key, value]) => {
      queryParams.append(key, value.toString());
    });

    const response = await fetch(`${API_BASE_URL}/sync/cost-estimate?${queryParams}`);
    return response.json();
  }

  /**
   * Get sync statistics
   */
  async getStats(shopId = null) {
    const url = shopId
      ? `${API_BASE_URL}/sync/stats?shopId=${shopId}`
      : `${API_BASE_URL}/sync/stats`;

    const response = await fetch(url);
    return response.json();
  }

  /**
   * Enable cloud sync
   */
  async enable() {
    const response = await fetch(`${API_BASE_URL}/sync/enable`, {
      method: 'POST',
    });

    return response.json();
  }

  /**
   * Disable cloud sync
   */
  async disable() {
    const response = await fetch(`${API_BASE_URL}/sync/disable`, {
      method: 'POST',
    });

    return response.json();
  }

  /**
   * Subscribe to sync status updates (WebSocket - future)
   */
  async subscribeToUpdates(callback) {
    // TODO: Implement WebSocket subscription for real-time updates
    console.log('WebSocket sync updates not yet implemented');
  }
}

// Create singleton instance
export const syncService = new SyncService();
export default syncService;
