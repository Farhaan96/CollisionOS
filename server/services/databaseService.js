/**
 * Database Service for CollisionOS
 * Simplified local-only version (Supabase integration removed)
 */

const { sequelize } = require('../database/models');

/**
 * Simple database service for Sequelize operations
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
