const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Environment validation
const requiredEnvVars = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
};

// Check if Supabase is enabled
const isSupabaseEnabled = process.env.ENABLE_SUPABASE === 'true';

// Validate required environment variables when Supabase is enabled
if (isSupabaseEnabled) {
  const missingVars = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value || value === `your_supabase_${key.toLowerCase().replace('supabase_', '')}_here`)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error('❌ Missing required Supabase environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease update your .env file with your Supabase credentials.');
    process.exit(1);
  }
}

// Create Supabase clients
let supabase = null;
let supabaseAdmin = null;

if (isSupabaseEnabled) {
  try {
    // Client for public API usage (with RLS)
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: false, // We handle sessions server-side
          detectSessionInUrl: false
        },
        realtime: {
          params: {
            eventsPerSecond: 10 // Rate limiting for real-time events
          }
        }
      }
    );

    // Admin client for service operations (bypass RLS)
    supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('✅ Supabase clients initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing Supabase clients:', error);
    process.exit(1);
  }
} else {
  console.log('⚠️  Supabase is disabled. Using legacy database system.');
}

/**
 * Get appropriate Supabase client based on operation type
 * @param {boolean} adminOperation - Whether this is an admin operation that bypasses RLS
 * @returns {Object|null} Supabase client or null if disabled
 */
const getSupabaseClient = (adminOperation = false) => {
  if (!isSupabaseEnabled) {
    return null;
  }
  return adminOperation ? supabaseAdmin : supabase;
};

/**
 * Check if Supabase is available and configured
 * @returns {boolean}
 */
const isSupabaseAvailable = () => {
  return isSupabaseEnabled && supabase !== null && supabaseAdmin !== null;
};

/**
 * Test Supabase connection
 * @returns {Promise<boolean>}
 */
const testSupabaseConnection = async () => {
  if (!isSupabaseAvailable()) {
    return false;
  }

  try {
    // Try to ping Supabase by checking auth
    const { data, error } = await supabase.auth.getSession();
    if (error && error.message !== 'No session found') {
      throw error;
    }
    return true;
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error.message);
    return false;
  }
};

/**
 * Graceful shutdown of Supabase connections
 */
const closeSupabaseConnections = () => {
  if (supabase) {
    // Close any active real-time connections
    supabase.removeAllChannels();
  }
  // Note: Supabase JS client doesn't have explicit close method
  // Connections are cleaned up automatically
  console.log('✅ Supabase connections cleaned up');
};

module.exports = {
  supabase,
  supabaseAdmin,
  getSupabaseClient,
  isSupabaseAvailable,
  isSupabaseEnabled,
  testSupabaseConnection,
  closeSupabaseConnections
};