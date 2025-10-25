/**
 * Database Service for CollisionOS
 * Simplified local-only version (Supabase integration removed)
 */

const { sequelize } = require('../database/models');

/**
 * @deprecated This service is DEPRECATED and should NOT be used for new code.
 *
 * All core database operations should use Sequelize models directly.
 * This file is kept ONLY for backwards compatibility with legacy code.
 *
 * For new code:
 * - Use Sequelize models directly from require('../database/models')
 * - Use queryHelpers from require('../utils/queryHelpers')
 */
class DatabaseService {
  constructor() {
    this.useSupabase = false; // Always false now
  }

  /**
   * Get database connection status
   * @returns {Promise<Object>} Connection status
   */
  async getConnectionStatus() {
    try {
      await sequelize.authenticate();
      return {
        type: 'sequelize',
        connected: true,
        dialect: sequelize.getDialect(),
        database: sequelize.config.database,
      };
    } catch (error) {
      return {
        type: 'sequelize',
        connected: false,
        error: error.message,
      };
    }
  }

  /**
   * Test database connection
   * @returns {Promise<boolean>} Connection success
   */
  async testConnection() {
    try {
      await sequelize.authenticate();
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error.message);
      return false;
    }
  }

  /**
   * Get Sequelize instance
   * @returns {Object} Sequelize instance
   */
  getSequelize() {
    return sequelize;
  }
}

// Singleton instance
const databaseService = new DatabaseService();

module.exports = {
  databaseService,
  DatabaseService,
};
