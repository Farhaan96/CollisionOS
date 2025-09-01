#!/usr/bin/env node

/**
 * Test script to verify Supabase connection and configuration
 */

const {
  testSupabaseConnection,
  isSupabaseAvailable,
  getSupabaseClient,
} = require('./server/config/supabase');
require('dotenv').config();

async function testSupabase() {
  console.log('🔍 Testing Supabase Configuration...\n');

  // Check environment variables
  console.log('Environment Variables:');
  console.log(
    `  SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`
  );
  console.log(
    `  SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`
  );
  console.log(
    `  SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`
  );
  console.log(`  ENABLE_SUPABASE: ${process.env.ENABLE_SUPABASE || 'false'}\n`);

  // Check if Supabase is enabled
  if (process.env.ENABLE_SUPABASE !== 'true') {
    console.log('⚠️  Supabase is currently disabled.');
    console.log('💡 To enable: Set ENABLE_SUPABASE=true in your .env file\n');
    return;
  }

  // Test connection
  console.log('Testing connection...');
  const isConnected = await testSupabaseConnection();

  if (isConnected) {
    console.log('✅ Supabase connection successful!\n');

    // Test basic operations
    await testBasicOperations();
  } else {
    console.log('❌ Supabase connection failed.\n');
  }
}

async function testBasicOperations() {
  const supabase = getSupabaseClient();
  const supabaseAdmin = getSupabaseClient(true);

  try {
    console.log('Testing basic operations...');

    // Test 1: List tables
    console.log('  → Checking tables...');
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5);

    if (tablesError) {
      console.log(`    ❌ Error listing tables: ${tablesError.message}`);
    } else {
      console.log(`    ✅ Found ${tables?.length || 0} tables`);
      if (tables?.length) {
        tables.forEach(table => console.log(`      - ${table.table_name}`));
      }
    }

    // Test 2: Check for collision repair tables
    console.log('  → Checking collision repair schema...');
    const collisionTables = [
      'customers',
      'vehicles',
      'repair_orders',
      'parts',
      'claims',
    ];

    for (const tableName of collisionTables) {
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(
          `    ❌ ${tableName}: Not found or error (${error.message})`
        );
      } else {
        console.log(`    ✅ ${tableName}: Available`);
      }
    }

    // Test 3: Auth functionality
    console.log('  → Testing auth...');
    const { data: authData, error: authError } =
      await supabase.auth.getSession();

    if (authError && authError.message !== 'No session found') {
      console.log(`    ❌ Auth error: ${authError.message}`);
    } else {
      console.log('    ✅ Auth system working');
    }
  } catch (error) {
    console.log(`❌ Error during testing: ${error.message}`);
  }
}

// Run the test
testSupabase().catch(console.error);
