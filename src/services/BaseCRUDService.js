
// Base CRUD Service Class
import { createClient } from '@supabase/supabase-js';

export class BaseCRUDService {
  constructor(tableName, supabase) {
    this.tableName = tableName;
    this.supabase = supabase;
  }

  async create(data, options = {}) {
    try {
      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .insert(data)
        .select(options.select || '*')
        .single();

      if (error) throw error;
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async findById(id, options = {}) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(options.select || '*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async findMany(filters = {}, options = {}) {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select(options.select || '*');

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending !== false });
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async update(id, data, options = {}) {
    try {
      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select(options.select || '*')
        .single();

      if (error) throw error;
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async delete(id) {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async count(filters = {}) {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { count, error } = await query;

      if (error) throw error;
      return { success: true, count };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
