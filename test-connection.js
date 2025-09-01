#!/usr/bin/env node

/**
 * Test Supabase Connection
 * Manually load environment variables and test connection
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
  console.log('🔧 Testing Supabase Connection\n');

  // Manually load .env.local file
  const envLocalPath = path.join(__dirname, '.env.local');
  let supabaseUrl = '';
  let supabaseAnonKey = '';
  let supabaseJwtSecret = '';

  try {
    const content = fs.readFileSync(envLocalPath, 'utf8');
    const lines = content.split('\n');

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('SUPABASE_URL=')) {
        supabaseUrl = trimmedLine.split('=')[1];
      } else if (trimmedLine.startsWith('SUPABASE_ANON_KEY=')) {
        supabaseAnonKey = trimmedLine.split('=')[1];
      } else if (trimmedLine.startsWith('SUPABASE_JWT_SECRET=')) {
        supabaseJwtSecret = trimmedLine.split('=')[1];
      }
    });

    console.log('📋 Loaded credentials:');
    console.log(`   ✅ SUPABASE_URL: ${supabaseUrl ? 'Found' : 'Missing'}`);
    console.log(
      `   ✅ SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'Found' : 'Missing'}`
    );
    console.log(
      `   ✅ SUPABASE_JWT_SECRET: ${supabaseJwtSecret ? 'Found' : 'Missing'}`
    );

    if (!supabaseUrl || !supabaseAnonKey) {
      console.log('\n❌ Missing required credentials');
      return;
    }

    console.log('\n🔍 Testing connection with anon key...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Test basic connection
    const { data, error } = await supabase.auth.getSession();
    if (error && error.message !== 'No session found') {
      throw error;
    }
    console.log('✅ Supabase connection successful');

    // Check existing tables
    console.log('\n📊 Checking existing database schema...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.log('⚠️  Could not check existing tables:', tablesError.message);
    } else {
      const tableNames = tables?.map(t => t.table_name) || [];
      console.log(`📋 Found ${tableNames.length} existing tables:`, tableNames);

      if (tableNames.length === 0) {
        console.log(
          '\n💡 No tables found. You need to deploy the CollisionOS schema.'
        );
        console.log('   Run: node deploy-schema.js');
      }
    }

    // Test admin connection if JWT secret is available
    if (supabaseJwtSecret) {
      console.log('\n🔍 Testing admin connection...');
      const supabaseAdmin = createClient(supabaseUrl, supabaseJwtSecret);

      try {
        const { data: adminData, error: adminError } =
          await supabaseAdmin.auth.getSession();
        if (adminError && adminError.message !== 'No session found') {
          throw adminError;
        }
        console.log('✅ Admin connection successful');

        // Check tables with admin access
        const { data: adminTables, error: adminTablesError } =
          await supabaseAdmin
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');

        if (!adminTablesError) {
          const adminTableNames = adminTables?.map(t => t.table_name) || [];
          console.log(`📋 Admin found ${adminTableNames.length} tables`);
        }
      } catch (adminError) {
        console.log('⚠️  Admin connection failed:', adminError.message);
      }
    }

    console.log('\n🎉 Connection test completed successfully!');
    console.log('💡 Next steps:');
    console.log('   1. Deploy schema: node deploy-schema.js');
    console.log('   2. Test user connection: node configure-supabase.js');
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
  }
}

// Run the test
testConnection().catch(console.error);
