const { getSupabaseClient, isSupabaseEnabled } = require('../config/supabase');
const { sequelize } = require('../database/models');
const fs = require('fs').promises;
const path = require('path');

/**
 * Migration utilities for transitioning from legacy database to Supabase
 */
class MigrationUtils {
  constructor() {
    this.migrationLog = [];
  }

  /**
   * Log migration events
   * @param {string} level - Log level (info, warn, error)
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  log(level, message, data = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
    
    this.migrationLog.push(logEntry);
    console.log(`[MIGRATION ${level.toUpperCase()}] ${message}`, data || '');
  }

  /**
   * Get migration status
   * @returns {Promise<Object>} Migration status
   */
  async getMigrationStatus() {
    const status = {
      supabaseEnabled: isSupabaseEnabled,
      supabaseConnected: false,
      legacyConnected: false,
      tables: {},
      recommendations: []
    };

    // Test Supabase connection
    if (isSupabaseEnabled) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.getSession();
        status.supabaseConnected = !error || error.message === 'No session found';
      } catch (error) {
        this.log('error', 'Supabase connection test failed', error.message);
      }
    }

    // Test legacy database connection
    try {
      await sequelize.authenticate();
      status.legacyConnected = true;
    } catch (error) {
      this.log('error', 'Legacy database connection test failed', error.message);
    }

    // Analyze tables
    if (status.legacyConnected) {
      try {
        const tables = await this.analyzeLegacyTables();
        status.tables = tables;
      } catch (error) {
        this.log('error', 'Failed to analyze legacy tables', error.message);
      }
    }

    // Generate recommendations
    status.recommendations = this.generateRecommendations(status);

    return status;
  }

  /**
   * Analyze legacy database tables
   * @returns {Promise<Object>} Table analysis
   */
  async analyzeLegacyTables() {
    const tables = {};
    
    try {
      // Get table information from Sequelize
      const queryInterface = sequelize.getQueryInterface();
      const tableNames = await queryInterface.showAllTables();

      for (const tableName of tableNames) {
        try {
          const [results] = await sequelize.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          const count = results[0]?.count || 0;

          // Get column information
          const columns = await queryInterface.describeTable(tableName);

          tables[tableName] = {
            name: tableName,
            recordCount: parseInt(count),
            columns: Object.keys(columns).length,
            structure: columns,
            migrationReady: this.isTableMigrationReady(tableName, columns)
          };

        } catch (tableError) {
          this.log('warn', `Failed to analyze table ${tableName}`, tableError.message);
          tables[tableName] = {
            name: tableName,
            recordCount: 0,
            columns: 0,
            error: tableError.message,
            migrationReady: false
          };
        }
      }

    } catch (error) {
      this.log('error', 'Failed to get table names', error.message);
    }

    return tables;
  }

  /**
   * Check if a table is ready for migration
   * @param {string} tableName - Table name
   * @param {Object} columns - Column information
   * @returns {boolean} Whether table is migration ready
   */
  isTableMigrationReady(tableName, columns) {
    // Tables that are safe to migrate
    const migratableTables = ['users', 'jobs', 'customers', 'vehicles', 'parts', 'vendors'];
    
    if (!migratableTables.includes(tableName.toLowerCase())) {
      return false;
    }

    // Check for required columns
    const columnNames = Object.keys(columns).map(col => col.toLowerCase());
    const hasId = columnNames.includes('id');
    const hasTimestamps = columnNames.includes('created_at') || columnNames.includes('createdat');

    return hasId && hasTimestamps;
  }

  /**
   * Generate migration recommendations
   * @param {Object} status - Migration status
   * @returns {Array} Recommendations
   */
  generateRecommendations(status) {
    const recommendations = [];

    if (!status.supabaseEnabled) {
      recommendations.push({
        type: 'setup',
        priority: 'high',
        message: 'Configure Supabase credentials in .env file',
        action: 'Add SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY to .env'
      });
    }

    if (status.supabaseEnabled && !status.supabaseConnected) {
      recommendations.push({
        type: 'connection',
        priority: 'high',
        message: 'Fix Supabase connection issues',
        action: 'Verify Supabase credentials and project status'
      });
    }

    if (!status.legacyConnected) {
      recommendations.push({
        type: 'legacy',
        priority: 'medium',
        message: 'Legacy database connection issues',
        action: 'Check legacy database configuration'
      });
    }

    if (status.supabaseConnected && status.legacyConnected) {
      const migratableTables = Object.values(status.tables || {})
        .filter(table => table.migrationReady && table.recordCount > 0);

      if (migratableTables.length > 0) {
        recommendations.push({
          type: 'migration',
          priority: 'medium',
          message: `${migratableTables.length} tables ready for migration`,
          action: 'Consider running data migration process'
        });
      }
    }

    return recommendations;
  }

  /**
   * Export data from legacy database for manual inspection
   * @param {string} tableName - Table to export
   * @param {Object} options - Export options
   * @returns {Promise<string>} File path of exported data
   */
  async exportLegacyData(tableName, options = {}) {
    const { limit = 1000, format = 'json' } = options;

    try {
      // Query the table
      const [results] = await sequelize.query(
        `SELECT * FROM ${tableName} LIMIT ${limit}`,
        { type: sequelize.QueryTypes.SELECT }
      );

      // Prepare export data
      const exportData = {
        table: tableName,
        exportedAt: new Date().toISOString(),
        recordCount: results.length,
        data: results
      };

      // Create exports directory
      const exportDir = path.join(__dirname, '../../data/exports');
      await fs.mkdir(exportDir, { recursive: true });

      // Write file
      const fileName = `${tableName}_${Date.now()}.${format}`;
      const filePath = path.join(exportDir, fileName);

      if (format === 'json') {
        await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));
      } else if (format === 'csv') {
        // Simple CSV export
        if (results.length > 0) {
          const headers = Object.keys(results[0]).join(',');
          const rows = results.map(row => 
            Object.values(row).map(val => 
              typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
            ).join(',')
          ).join('\n');
          
          await fs.writeFile(filePath, `${headers}\n${rows}`);
        }
      }

      this.log('info', `Exported ${results.length} records from ${tableName}`, { filePath });
      return filePath;

    } catch (error) {
      this.log('error', `Failed to export ${tableName}`, error.message);
      throw error;
    }
  }

  /**
   * Create Supabase table schema based on legacy table
   * @param {string} tableName - Table name
   * @returns {Promise<string>} SQL schema
   */
  async generateSupabaseSchema(tableName) {
    try {
      const queryInterface = sequelize.getQueryInterface();
      const columns = await queryInterface.describeTable(tableName);

      let sql = `-- Supabase schema for ${tableName}\nCREATE TABLE public.${tableName} (\n`;
      
      const columnDefs = [];
      
      Object.entries(columns).forEach(([columnName, columnDef]) => {
        let sqlType = this.mapSequelizeTypeToPostgres(columnDef.type);
        const constraints = [];

        if (columnName.toLowerCase() === 'id') {
          sqlType = 'UUID';
          constraints.push('PRIMARY KEY DEFAULT gen_random_uuid()');
        } else if (!columnDef.allowNull) {
          constraints.push('NOT NULL');
        }

        if (columnDef.defaultValue !== undefined && columnDef.defaultValue !== null) {
          if (typeof columnDef.defaultValue === 'string') {
            constraints.push(`DEFAULT '${columnDef.defaultValue}'`);
          } else {
            constraints.push(`DEFAULT ${columnDef.defaultValue}`);
          }
        }

        columnDefs.push(`  ${columnName} ${sqlType}${constraints.length ? ' ' + constraints.join(' ') : ''}`);
      });

      sql += columnDefs.join(',\n') + '\n);\n\n';
      
      // Add RLS policy
      sql += `-- Enable Row Level Security\nALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;\n\n`;
      sql += `-- Create policy for shop isolation\nCREATE POLICY "Users can only access their shop's data" ON public.${tableName}\n`;
      sql += `  FOR ALL USING (shop_id = auth.jwt() ->> 'shop_id');\n\n`;
      
      // Add indexes
      sql += `-- Add indexes\nCREATE INDEX idx_${tableName}_shop_id ON public.${tableName}(shop_id);\n`;
      if (columns.created_at || columns.createdAt) {
        sql += `CREATE INDEX idx_${tableName}_created_at ON public.${tableName}(created_at);\n`;
      }

      return sql;

    } catch (error) {
      this.log('error', `Failed to generate schema for ${tableName}`, error.message);
      throw error;
    }
  }

  /**
   * Map Sequelize data types to PostgreSQL types
   * @param {string} sequelizeType - Sequelize type
   * @returns {string} PostgreSQL type
   */
  mapSequelizeTypeToPostgres(sequelizeType) {
    const typeMap = {
      'STRING': 'VARCHAR',
      'TEXT': 'TEXT',
      'INTEGER': 'INTEGER',
      'BIGINT': 'BIGINT',
      'FLOAT': 'REAL',
      'DOUBLE': 'DOUBLE PRECISION',
      'DECIMAL': 'DECIMAL',
      'DATE': 'TIMESTAMP WITH TIME ZONE',
      'DATEONLY': 'DATE',
      'BOOLEAN': 'BOOLEAN',
      'JSON': 'JSONB',
      'JSONB': 'JSONB',
      'UUID': 'UUID'
    };

    // Extract base type from complex types like "VARCHAR(255)"
    const baseType = sequelizeType.split('(')[0];
    return typeMap[baseType] || 'TEXT';
  }

  /**
   * Save migration log to file
   * @returns {Promise<string>} Log file path
   */
  async saveMigrationLog() {
    const logDir = path.join(__dirname, '../../data/logs');
    await fs.mkdir(logDir, { recursive: true });

    const fileName = `migration_${Date.now()}.json`;
    const filePath = path.join(logDir, fileName);

    const logData = {
      timestamp: new Date().toISOString(),
      entries: this.migrationLog
    };

    await fs.writeFile(filePath, JSON.stringify(logData, null, 2));
    return filePath;
  }

  /**
   * Clear migration log
   */
  clearLog() {
    this.migrationLog = [];
  }
}

// Create singleton instance
const migrationUtils = new MigrationUtils();

module.exports = {
  MigrationUtils,
  migrationUtils
};