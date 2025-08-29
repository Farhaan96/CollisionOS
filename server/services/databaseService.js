const { getSupabaseClient, isSupabaseEnabled } = require('../config/supabase');
const { sequelize, User, Job, Customer, Vehicle, Part, Vendor } = require('../database/models'); // Legacy models

/**
 * Universal database service that handles both Supabase and legacy database operations
 */
class DatabaseService {
  constructor() {
    this.useSupabase = isSupabaseEnabled;
  }

  /**
   * Generic query method that routes to appropriate database
   * @param {string} table - Table name
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Query results
   */
  async query(table, options = {}) {
    if (this.useSupabase) {
      return this.supabaseQuery(table, options);
    } else {
      return this.legacyQuery(table, options);
    }
  }

  /**
   * Execute Supabase query
   * @param {string} table - Table name
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Query results
   */
  async supabaseQuery(table, options = {}) {
    const supabase = getSupabaseClient(options.adminOperation);
    if (!supabase) {
      throw new Error('Supabase not available');
    }

    let query = supabase.from(table);

    // Apply select fields
    if (options.select) {
      query = query.select(options.select);
    } else {
      query = query.select('*');
    }

    // Apply filters
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (typeof value === 'object' && value !== null) {
          // Handle complex filters like { gt: 10 }, { lt: 100 }, etc.
          Object.entries(value).forEach(([operator, operatorValue]) => {
            query = query[operator](key, operatorValue);
          });
        } else {
          query = query.eq(key, value);
        }
      });
    }

    // Apply ordering
    if (options.order) {
      options.order.forEach(([column, direction = 'asc']) => {
        query = query.order(column, { ascending: direction.toLowerCase() === 'asc' });
      });
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 1000) - 1);
    }

    // Execute query
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Supabase query error: ${error.message}`);
    }

    return data;
  }

  /**
   * Execute legacy Sequelize query
   * @param {string} table - Table name
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Query results
   */
  async legacyQuery(table, options = {}) {
    const modelMap = {
      users: User,
      jobs: Job,
      customers: Customer,
      vehicles: Vehicle,
      parts: Part,
      vendors: Vendor
    };

    const Model = modelMap[table];
    if (!Model) {
      throw new Error(`Unknown table: ${table}`);
    }

    const queryOptions = {};

    if (options.select) {
      queryOptions.attributes = options.select.split(',').map(s => s.trim());
    }

    if (options.where) {
      queryOptions.where = options.where;
    }

    if (options.order) {
      queryOptions.order = options.order;
    }

    if (options.limit) {
      queryOptions.limit = options.limit;
    }

    if (options.offset) {
      queryOptions.offset = options.offset;
    }

    const results = await Model.findAll(queryOptions);
    return results.map(result => result.toJSON());
  }

  /**
   * Insert new record
   * @param {string} table - Table name
   * @param {Object} data - Data to insert
   * @param {Object} options - Insert options
   * @returns {Promise<Object>} Inserted record
   */
  async insert(table, data, options = {}) {
    if (this.useSupabase) {
      return this.supabaseInsert(table, data, options);
    } else {
      return this.legacyInsert(table, data, options);
    }
  }

  async supabaseInsert(table, data, options = {}) {
    const supabase = getSupabaseClient(options.adminOperation);
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase insert error: ${error.message}`);
    }

    return result;
  }

  async legacyInsert(table, data) {
    const modelMap = {
      users: User,
      jobs: Job,
      customers: Customer,
      vehicles: Vehicle,
      parts: Part,
      vendors: Vendor
    };

    const Model = modelMap[table];
    if (!Model) {
      throw new Error(`Unknown table: ${table}`);
    }

    const result = await Model.create(data);
    return result.toJSON();
  }

  /**
   * Update existing record
   * @param {string} table - Table name
   * @param {Object} data - Data to update
   * @param {Object} where - Where conditions
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated record
   */
  async update(table, data, where, options = {}) {
    if (this.useSupabase) {
      return this.supabaseUpdate(table, data, where, options);
    } else {
      return this.legacyUpdate(table, data, where, options);
    }
  }

  async supabaseUpdate(table, data, where, options = {}) {
    const supabase = getSupabaseClient(options.adminOperation);
    let query = supabase.from(table).update(data);

    // Apply where conditions
    Object.entries(where).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data: result, error } = await query.select().single();

    if (error) {
      throw new Error(`Supabase update error: ${error.message}`);
    }

    return result;
  }

  async legacyUpdate(table, data, where) {
    const modelMap = {
      users: User,
      jobs: Job,
      customers: Customer,
      vehicles: Vehicle,
      parts: Part,
      vendors: Vendor
    };

    const Model = modelMap[table];
    if (!Model) {
      throw new Error(`Unknown table: ${table}`);
    }

    await Model.update(data, { where });
    const updated = await Model.findOne({ where });
    return updated ? updated.toJSON() : null;
  }

  /**
   * Delete record
   * @param {string} table - Table name
   * @param {Object} where - Where conditions
   * @param {Object} options - Delete options
   * @returns {Promise<boolean>} Success status
   */
  async delete(table, where, options = {}) {
    if (this.useSupabase) {
      return this.supabaseDelete(table, where, options);
    } else {
      return this.legacyDelete(table, where);
    }
  }

  async supabaseDelete(table, where, options = {}) {
    const supabase = getSupabaseClient(options.adminOperation);
    let query = supabase.from(table).delete();

    Object.entries(where).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { error } = await query;
    
    if (error) {
      throw new Error(`Supabase delete error: ${error.message}`);
    }

    return true;
  }

  async legacyDelete(table, where) {
    const modelMap = {
      users: User,
      jobs: Job,
      customers: Customer,
      vehicles: Vehicle,
      parts: Part,
      vendors: Vendor
    };

    const Model = modelMap[table];
    if (!Model) {
      throw new Error(`Unknown table: ${table}`);
    }

    const result = await Model.destroy({ where });
    return result > 0;
  }

  /**
   * Execute raw SQL query (legacy only)
   * @param {string} sql - SQL query
   * @param {Array} replacements - Query parameters
   * @returns {Promise<Array>} Query results
   */
  async rawQuery(sql, replacements = []) {
    if (this.useSupabase) {
      throw new Error('Raw SQL queries not supported with Supabase. Use RPC functions instead.');
    }

    const [results] = await sequelize.query(sql, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    return results;
  }

  /**
   * Call Supabase RPC function
   * @param {string} functionName - Function name
   * @param {Object} params - Function parameters
   * @returns {Promise<any>} Function result
   */
  async rpc(functionName, params = {}) {
    if (!this.useSupabase) {
      throw new Error('RPC functions only available with Supabase');
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc(functionName, params);

    if (error) {
      throw new Error(`RPC error: ${error.message}`);
    }

    return data;
  }

  /**
   * Start transaction (legacy only for now)
   * @returns {Promise<Object>} Transaction object
   */
  async beginTransaction() {
    if (this.useSupabase) {
      throw new Error('Transactions not yet implemented for Supabase');
    }

    return await sequelize.transaction();
  }

  /**
   * Get database connection status
   * @returns {Promise<Object>} Connection status
   */
  async getConnectionStatus() {
    if (this.useSupabase) {
      const supabase = getSupabaseClient();
      try {
        const { data, error } = await supabase.auth.getSession();
        return {
          connected: !error,
          type: 'supabase',
          error: error?.message
        };
      } catch (err) {
        return {
          connected: false,
          type: 'supabase',
          error: err.message
        };
      }
    } else {
      try {
        await sequelize.authenticate();
        return {
          connected: true,
          type: 'sequelize'
        };
      } catch (err) {
        return {
          connected: false,
          type: 'sequelize',
          error: err.message
        };
      }
    }
  }
}

// Create singleton instance
const databaseService = new DatabaseService();

module.exports = {
  DatabaseService,
  databaseService
};