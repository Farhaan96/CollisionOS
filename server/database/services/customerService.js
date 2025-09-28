const { supabase, supabaseAdmin } = require('../../config/supabase');

/**
 * Customer Service - Supabase integration for customer management
 */
class CustomerService {
  constructor() {
    this.table = 'customers';
  }

  /**
   * Find customers by criteria
   */
  async findCustomers(criteria = {}, shopId) {
    try {
      const client = supabase || supabaseAdmin;

      // Enforce tenant scoping
      const effectiveShopId = this._requireShopId(shopId);
      let query = client.from(this.table).select('*').eq('shop_id', effectiveShopId);

      // Apply filters based on criteria
      if (criteria.email) {
        query = query.eq('email', criteria.email);
      }
      if (criteria.phone) {
        query = query.eq('phone', criteria.phone);
      }
      if (criteria.firstName && criteria.lastName) {
        query = query
          .eq('first_name', criteria.firstName)
          .eq('last_name', criteria.lastName);
      }
      if (criteria.id) {
        query = query.eq('id', criteria.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error finding customers:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('CustomerService.findCustomers error:', error);
      throw error;
    }
  }

  /**
   * Create a new customer
   */
  async createCustomer(customerData, shopId) {
    try {
      // Generate customer number if not provided
      const customerNumber =
        customerData.customerNumber || `CUST-${Date.now()}`;

      // Start with minimal required fields only
      const customerRecord = {
        customer_number: customerNumber,
        first_name:
          customerData.firstName || customerData.name?.split(' ')[0] || '',
        last_name:
          customerData.lastName ||
          customerData.name?.split(' ').slice(1).join(' ') ||
          '',
        shop_id: this._requireShopId(customerData.shopId || shopId),
        customer_type: customerData.customerType || 'individual',
        customer_status: customerData.status || 'active',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add optional fields only if provided and we know they exist
      if (customerData.email) customerRecord.email = customerData.email;
      if (customerData.phone) customerRecord.phone = customerData.phone;
      if (customerData.address) customerRecord.address = customerData.address;
      if (customerData.city) customerRecord.city = customerData.city;
      if (customerData.state) customerRecord.state = customerData.state;
      // Note: removed zip field as it doesn't exist in current schema

      // Use non-admin when RLS is configured; fallback to admin only if needed
      const client = supabase || supabaseAdmin;
      const { data, error } = await client
        .from(this.table)
        .insert([customerRecord])
        .select()
        .single();

      if (error) {
        console.error('Error creating customer:', error);
        throw error;
      }

      console.log('Customer created successfully:', data.id);

      // Convert back to frontend format
      return this.transformToFrontend(data);
    } catch (error) {
      console.error('CustomerService.createCustomer error:', error);
      throw error;
    }
  }

  /**
   * Update existing customer
   */
  async updateCustomer(customerId, updateData, shopId) {
    try {
      const client = supabase || supabaseAdmin;
      const customerRecord = {
        first_name: updateData.firstName,
        last_name: updateData.lastName,
        email: updateData.email,
        phone: updateData.phone,
        address: updateData.address,
        city: updateData.city,
        state: updateData.state,
        // Remove non-existent columns for now
        // postal_code: updateData.zip || updateData.zipCode,
        // insurance_company: updateData.insurance,
        updated_at: new Date().toISOString(),
      };

      // Remove undefined values
      Object.keys(customerRecord).forEach(key => {
        if (customerRecord[key] === undefined) {
          delete customerRecord[key];
        }
      });

      const { data, error } = await client
        .from(this.table)
        .update(customerRecord)
        .eq('id', customerId)
        .select()
        .single();

      if (error) {
        console.error('Error updating customer:', error);
        throw error;
      }

      console.log('Customer updated successfully:', customerId);

      // Convert back to frontend format
      return this.transformToFrontend(data);
    } catch (error) {
      console.error('CustomerService.updateCustomer error:', error);
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(customerId) {
    try {
      // Use admin client to bypass RLS for development
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from(this.table)
        .select('*')
        .eq('id', customerId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        console.error('Error getting customer:', error);
        throw error;
      }

      return this.transformToFrontend(data);
    } catch (error) {
      console.error('CustomerService.getCustomerById error:', error);
      throw error;
    }
  }

  /**
   * Get all customers
   */
  async getAllCustomers(options = {}, shopId) {
    try {
      const client = supabase || supabaseAdmin;
      const effectiveShopId = this._requireShopId(shopId);
      let query = client.from(this.table).select('*').eq('shop_id', effectiveShopId);

      // Apply sorting
      if (options.sortBy) {
        query = query.order(options.sortBy, {
          ascending: options.ascending !== false,
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 100) - 1
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting customers:', error);
        throw error;
      }

      return (data || []).map(customer => this.transformToFrontend(customer));
    } catch (error) {
      console.error('CustomerService.getAllCustomers error:', error);
      throw error;
    }
  }

  /**
   * Search customers by text
   */
  async searchCustomers(searchTerm, shopId) {
    try {
      const client = supabase || supabaseAdmin;
      const effectiveShopId = this._requireShopId(shopId);
      const { data, error } = await client
        .from(this.table)
        .select('*')
        .eq('shop_id', effectiveShopId)
        .or(
          `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`
        )
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching customers:', error);
        throw error;
      }

      return (data || []).map(customer => this.transformToFrontend(customer));
    } catch (error) {
      console.error('CustomerService.searchCustomers error:', error);
      throw error;
    }
  }

  /**
   * Delete customer
   */
  async deleteCustomer(customerId, shopId) {
    try {
      const client = supabase || supabaseAdmin;
      const effectiveShopId = this._requireShopId(shopId);
      const { error } = await client
        .from(this.table)
        .delete()
        .eq('id', customerId)
        .eq('shop_id', effectiveShopId);

      if (error) {
        console.error('Error deleting customer:', error);
        throw error;
      }

      console.log('Customer deleted successfully:', customerId);
      return { success: true };
    } catch (error) {
      console.error('CustomerService.deleteCustomer error:', error);
      throw error;
    }
  }

  /**
   * Transform database record to frontend format
   */
  transformToFrontend(customerRecord) {
    if (!customerRecord) return null;

    return {
      id: customerRecord.id,
      firstName: customerRecord.first_name || '',
      lastName: customerRecord.last_name || '',
      name: `${customerRecord.first_name || ''} ${customerRecord.last_name || ''}`.trim(),
      email: customerRecord.email || '',
      phone: customerRecord.phone || '',
      address: customerRecord.address || '',
      city: customerRecord.city || '',
      state: customerRecord.state || '',
      zip: customerRecord.postal_code || customerRecord.zip || '',
      zipCode: customerRecord.postal_code || customerRecord.zip || '',
      insurance:
        customerRecord.insurance_company || customerRecord.insurance || '',
      customerType: customerRecord.customer_type || 'individual',
      status: customerRecord.status || 'active',
      createdAt: customerRecord.created_at,
      updatedAt: customerRecord.updated_at,
    };
  }

  /**
   * Internal: ensure a valid shopId is present
   */
  _requireShopId(shopId) {
    if (shopId) return shopId;
    if (process.env.NODE_ENV === 'development') {
      const fallback = process.env.DEV_SHOP_ID || '00000000-0000-4000-8000-000000000001';
      console.warn('Shop ID missing; using DEV fallback shop ID:', fallback);
      return fallback;
    }
    throw new Error('Missing shopId for tenant-scoped customer operation');
  }
}

module.exports = { customerService: new CustomerService(), CustomerService };
