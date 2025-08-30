#!/usr/bin/env node

/**
 * Admin Supabase Setup Script (SERVER-SIDE ONLY)
 * This script uses the service role key for admin operations
 * NEVER expose this to client-side code or users
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from both .env and .env.local
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

async function adminSetupSupabase() {
  console.log('🔧 Admin Supabase Setup (Server-Side Only)\n');
  
  // Check if we have the required environment variables
  const requiredVars = ['SUPABASE_URL', 'SUPABASE_JWT_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('❌ Missing required admin environment variables:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
    console.log('\n💡 Please add these to your .env.local file (SERVER-SIDE ONLY):');
    console.log('   SUPABASE_URL=https://your-project-ref.supabase.co');
    console.log('   SUPABASE_JWT_SECRET=your_service_role_key_here');
    console.log('\n⚠️  WARNING: Service role key should NEVER be exposed to users!');
    return;
  }
  
  console.log('✅ Admin environment variables found');
  console.log('⚠️  Using service role key for admin operations...');
  
  // Test connection with service role
  console.log('\n🔍 Testing admin connection...');
  const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_JWT_SECRET);
  
  try {
    // Test basic connection
    const { data, error } = await supabaseAdmin.auth.getSession();
    if (error && error.message !== 'No session found') {
      throw error;
    }
    console.log('✅ Admin connection successful');
    
    // Check existing tables
    console.log('\n📊 Checking existing database schema...');
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.log('⚠️  Could not check existing tables:', tablesError.message);
    } else {
      const tableNames = tables?.map(t => t.table_name) || [];
      console.log(`📋 Found ${tableNames.length} existing tables:`, tableNames);
    }
    
    // Check for CollisionOS specific tables
    const collisionTables = ['customers', 'vehicles', 'repair_orders', 'parts', 'claims'];
    console.log('\n🔍 Checking for CollisionOS tables...');
    
    for (const tableName of collisionTables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ ${tableName}: Not found`);
        } else {
          console.log(`   ✅ ${tableName}: Available`);
        }
      } catch (err) {
        console.log(`   ❌ ${tableName}: Error checking`);
      }
    }
    
    console.log('\n🎯 Admin Setup Complete');
    console.log('💡 Next Steps:');
    console.log('   1. Deploy schema: node deploy-schema.js');
    console.log('   2. Test user connection: node configure-supabase.js');
    
  } catch (error) {
    console.log('❌ Admin connection failed:', error.message);
    console.log('\n💡 Please check your service role credentials.');
  }
}

// Run the admin setup
adminSetupSupabase().catch(console.error);
