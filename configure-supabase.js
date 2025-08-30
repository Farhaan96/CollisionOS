#!/usr/bin/env node

/**
 * Simple Supabase Configuration Script
 * Helps configure existing Supabase project with CollisionOS
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from both .env and .env.local
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

async function configureSupabase() {
  console.log('🔧 CollisionOS Supabase Configuration\n');
  
  // Check if we have the required environment variables
  const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
    console.log('\n💡 Please add these to your .env.local file:');
    console.log('   SUPABASE_URL=https://your-project-ref.supabase.co');
    console.log('   SUPABASE_ANON_KEY=your_anon_key_here');
    console.log('   ENABLE_SUPABASE=true');
    return;
  }
  
  console.log('✅ Environment variables found');
  
  // Test connection
  console.log('\n🔍 Testing Supabase connection...');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  
  try {
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
        console.log('\n💡 No tables found. You need to deploy the CollisionOS schema.');
        console.log('   Run: npm run deploy-schema');
      }
    }
    
    // Check for CollisionOS specific tables
    const collisionTables = ['customers', 'vehicles', 'repair_orders', 'parts', 'claims'];
    console.log('\n🔍 Checking for CollisionOS tables...');
    
    for (const tableName of collisionTables) {
      try {
        const { data, error } = await supabase
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
    
    console.log('\n🎯 Next Steps:');
    console.log('1. If tables are missing, run: npm run deploy-schema');
    console.log('2. To seed test data, run: npm run seed-data');
    console.log('3. To test the connection, run: node test-supabase-connection.js');
    
  } catch (error) {
    console.log('❌ Supabase connection failed:', error.message);
    console.log('\n💡 Please check your credentials and try again.');
  }
}

// Run the configuration
configureSupabase().catch(console.error);
