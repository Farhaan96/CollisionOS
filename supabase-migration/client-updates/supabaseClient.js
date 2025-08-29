/**
 * Supabase Client Configuration for CollisionOS
 * Replaces the current API service layer with Supabase client
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: process.env.NODE_ENV === 'development'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'collision-os@1.0.0'
    }
  }
});

// Database table references
export const tables = {
  shops: 'shops',
  users: 'users',
  customers: 'customers',
  vehicles: 'vehicles',
  parts: 'parts',
  vendors: 'vendors',
  jobs: 'jobs',
  jobParts: 'job_parts',
  jobLabor: 'job_labor',
  jobUpdates: 'job_updates',
  estimates: 'estimates',
  notifications: 'notifications',
  auditLog: 'audit_log'
};

// RPC function references
export const rpcFunctions = {
  getShopDashboardStats: 'get_shop_dashboard_stats',
  globalSearch: 'global_search',
  hasPermission: 'has_permission',
  getUserShop: 'get_user_shop',
  updateUserPermissions: 'update_user_permissions'
};

/**
 * Enhanced error handling for Supabase responses
 */
export const handleSupabaseError = (error, context = '') => {
  console.error(`Supabase Error ${context}:`, error);
  
  // Custom error handling based on error type
  if (error?.code === '42501') {
    throw new Error('Insufficient permissions for this operation');
  } else if (error?.code === '23505') {
    throw new Error('This record already exists');
  } else if (error?.code === '23503') {
    throw new Error('Cannot perform this action due to related records');
  } else if (error?.message?.includes('JWT expired')) {
    throw new Error('Your session has expired. Please log in again.');
  } else {
    throw new Error(error?.message || 'An unexpected error occurred');
  }
};

/**
 * Helper function to get current user's shop ID
 */
export const getCurrentUserShop = async () => {
  const { data, error } = await supabase.rpc(rpcFunctions.getUserShop);
  
  if (error) {
    handleSupabaseError(error, 'getting user shop');
  }
  
  return data;
};

/**
 * Helper function to check user permissions
 */
export const checkUserPermission = async (permission) => {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user?.user?.id) {
    return false;
  }
  
  const { data, error } = await supabase.rpc(rpcFunctions.hasPermission, {
    user_uuid: user.user.id,
    permission_name: permission
  });
  
  if (error) {
    console.warn('Permission check failed:', error);
    return false;
  }
  
  return data;
};

/**
 * Shop management functions
 */
export const shopService = {
  async getShop() {
    const shopId = await getCurrentUserShop();
    
    const { data, error } = await supabase
      .from(tables.shops)
      .select('*')
      .eq('id', shopId)
      .single();
    
    if (error) handleSupabaseError(error, 'fetching shop');
    return data;
  },

  async updateShop(updates) {
    const shopId = await getCurrentUserShop();
    
    const { data, error } = await supabase
      .from(tables.shops)
      .update(updates)
      .eq('id', shopId)
      .select()
      .single();
    
    if (error) handleSupabaseError(error, 'updating shop');
    return data;
  },

  async getDashboardStats() {
    const shopId = await getCurrentUserShop();
    
    const { data, error } = await supabase.rpc(rpcFunctions.getShopDashboardStats, {
      shop_uuid: shopId
    });
    
    if (error) handleSupabaseError(error, 'fetching dashboard stats');
    return data;
  }
};

/**
 * User management functions
 */
export const userService = {
  async getCurrentUser() {
    const { data: authUser } = await supabase.auth.getUser();
    
    if (!authUser?.user) return null;
    
    const { data, error } = await supabase
      .from(tables.users)
      .select('*')
      .eq('user_id', authUser.user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      handleSupabaseError(error, 'fetching current user');
    }
    
    return data;
  },

  async getShopUsers() {
    const { data, error } = await supabase
      .from(tables.users)
      .select('*')
      .eq('is_active', true)
      .order('first_name', { ascending: true });
    
    if (error) handleSupabaseError(error, 'fetching shop users');
    return data;
  },

  async updateUser(userId, updates) {
    const { data, error } = await supabase
      .from(tables.users)
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) handleSupabaseError(error, 'updating user');
    return data;
  },

  async createUser(userData) {
    const { data, error } = await supabase
      .from(tables.users)
      .insert([userData])
      .select()
      .single();
    
    if (error) handleSupabaseError(error, 'creating user');
    return data;
  }
};

/**
 * Customer management functions
 */
export const customerService = {
  async getCustomers(filters = {}) {
    let query = supabase
      .from(tables.customers)
      .select(`
        *,
        vehicles:vehicles(*)
      `)
      .eq('is_active', true);
    
    // Apply filters
    if (filters.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
    }
    
    if (filters.status) {
      query = query.eq('customer_status', filters.status);
    }
    
    query = query.order('last_name', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) handleSupabaseError(error, 'fetching customers');
    return data;
  },

  async getCustomer(customerId) {
    const { data, error } = await supabase
      .from(tables.customers)
      .select(`
        *,
        vehicles:vehicles(*),
        jobs:jobs(*)
      `)
      .eq('id', customerId)
      .single();
    
    if (error) handleSupabaseError(error, 'fetching customer');
    return data;
  },

  async createCustomer(customerData) {
    const shopId = await getCurrentUserShop();
    
    const { data, error } = await supabase
      .from(tables.customers)
      .insert([{ ...customerData, shop_id: shopId }])
      .select()
      .single();
    
    if (error) handleSupabaseError(error, 'creating customer');
    return data;
  },

  async updateCustomer(customerId, updates) {
    const { data, error } = await supabase
      .from(tables.customers)
      .update(updates)
      .eq('id', customerId)
      .select()
      .single();
    
    if (error) handleSupabaseError(error, 'updating customer');
    return data;
  },

  async deleteCustomer(customerId) {
    const { error } = await supabase
      .from(tables.customers)
      .delete()
      .eq('id', customerId);
    
    if (error) handleSupabaseError(error, 'deleting customer');
  }
};

/**
 * Job management functions
 */
export const jobService = {
  async getJobs(filters = {}) {
    let query = supabase
      .from(tables.jobs)
      .select(`
        *,
        customer:customers(*),
        vehicle:vehicles(*),
        assignee:users(*)
      `)
      .eq('is_archived', false);
    
    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.assignee) {
      query = query.eq('assigned_to', filters.assignee);
    }
    
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    
    if (filters.search) {
      query = query.or(`job_number.ilike.%${filters.search}%,damage_description.ilike.%${filters.search}%`);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) handleSupabaseError(error, 'fetching jobs');
    return data;
  },

  async getJob(jobId) {
    const { data, error } = await supabase
      .from(tables.jobs)
      .select(`
        *,
        customer:customers(*),
        vehicle:vehicles(*),
        assignee:users(*),
        job_parts:job_parts(*),
        job_labor:job_labor(*),
        estimates:estimates(*),
        updates:job_updates(*)
      `)
      .eq('id', jobId)
      .single();
    
    if (error) handleSupabaseError(error, 'fetching job');
    return data;
  },

  async createJob(jobData) {
    const shopId = await getCurrentUserShop();
    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from(tables.jobs)
      .insert([{ 
        ...jobData, 
        shop_id: shopId,
        created_by: user?.user?.id
      }])
      .select()
      .single();
    
    if (error) handleSupabaseError(error, 'creating job');
    return data;
  },

  async updateJob(jobId, updates) {
    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from(tables.jobs)
      .update({ 
        ...updates,
        updated_by: user?.user?.id
      })
      .eq('id', jobId)
      .select()
      .single();
    
    if (error) handleSupabaseError(error, 'updating job');
    return data;
  },

  async deleteJob(jobId) {
    const { error } = await supabase
      .from(tables.jobs)
      .delete()
      .eq('id', jobId);
    
    if (error) handleSupabaseError(error, 'deleting job');
  }
};

/**
 * Parts management functions
 */
export const partService = {
  async getParts(filters = {}) {
    let query = supabase
      .from(tables.parts)
      .select(`
        *,
        vendor:vendors(name)
      `)
      .eq('is_active', true);
    
    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters.lowStock) {
      query = query.lt('current_stock', supabase.rpc('minimum_stock'));
    }
    
    if (filters.search) {
      query = query.or(`part_number.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    
    query = query.order('part_number', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) handleSupabaseError(error, 'fetching parts');
    return data;
  },

  async createPart(partData) {
    const shopId = await getCurrentUserShop();
    
    const { data, error } = await supabase
      .from(tables.parts)
      .insert([{ ...partData, shop_id: shopId }])
      .select()
      .single();
    
    if (error) handleSupabaseError(error, 'creating part');
    return data;
  },

  async updatePart(partId, updates) {
    const { data, error } = await supabase
      .from(tables.parts)
      .update(updates)
      .eq('id', partId)
      .select()
      .single();
    
    if (error) handleSupabaseError(error, 'updating part');
    return data;
  }
};

/**
 * Search functionality
 */
export const searchService = {
  async globalSearch(searchTerm, entityTypes = ['jobs', 'customers', 'vehicles', 'parts']) {
    const shopId = await getCurrentUserShop();
    
    const { data, error } = await supabase.rpc(rpcFunctions.globalSearch, {
      shop_uuid: shopId,
      search_term: searchTerm,
      entity_types: entityTypes
    });
    
    if (error) handleSupabaseError(error, 'performing global search');
    return data;
  }
};

/**
 * Realtime subscription helpers
 */
export const realtimeService = {
  subscribeToJobs(shopId, callback) {
    return supabase
      .channel('jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `shop_id=eq.${shopId}`
        },
        callback
      )
      .subscribe();
  },

  subscribeToJobUpdates(jobId, callback) {
    return supabase
      .channel(`job-updates-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'job_updates',
          filter: `job_id=eq.${jobId}`
        },
        callback
      )
      .subscribe();
  },

  subscribeToNotifications(userId, callback) {
    return supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  },

  unsubscribe(channel) {
    return supabase.removeChannel(channel);
  }
};

/**
 * Authentication helpers
 */
export const authService = {
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) handleSupabaseError(error, 'signing in');
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    
    if (error) handleSupabaseError(error, 'signing out');
  },

  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    
    if (error) handleSupabaseError(error, 'resetting password');
  },

  async updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) handleSupabaseError(error, 'updating password');
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

export default supabase;