/**
 * Secure Client-Side Supabase Configuration
 * 
 * IMPORTANT SECURITY NOTES:
 * - Only uses the ANON key (public key)
 * - NEVER includes the service role key
 * - All data access is controlled by Row Level Security (RLS)
 * - Users can only access data they're authorized to see
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables for client-side (these are safe to expose)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate that we have the required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables for client-side');
  console.error('Please set:');
  console.error('  REACT_APP_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  console.error('  REACT_APP_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  throw new Error('Supabase client configuration missing');
}

// Create the client-side Supabase client
// This only has access to what Row Level Security (RLS) allows
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Security helper functions
export const supabaseHelpers = {
  /**
   * Get the current user (if authenticated)
   */
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }
    return user;
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    const user = await this.getCurrentUser();
    return !!user;
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  /**
   * Get user's shop ID (for RLS filtering)
   */
  async getUserShopId() {
    const user = await this.getCurrentUser();
    if (!user) return null;
    
    // This assumes you store shop_id in user metadata
    return user.user_metadata?.shop_id || null;
  }
};

// Export for use in components
export default supabase;
