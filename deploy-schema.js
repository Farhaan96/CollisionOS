#!/usr/bin/env node

/**
 * Deploy CollisionOS Schema to Supabase
 * Applies the complete database schema to your existing Supabase project
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from both .env and .env.local
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

async function deploySchema() {
  console.log('🚀 Deploying CollisionOS Schema to Supabase\n');
  
  // Check environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_JWT_SECRET) {
    console.log('❌ Missing Supabase credentials. Please set:');
    console.log('   SUPABASE_URL');
    console.log('   SUPABASE_JWT_SECRET');
    return;
  }
  
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_JWT_SECRET);
  
  try {
    console.log('📋 Loading schema files...');
    
    // Load schema files
    const schemaDir = path.join(__dirname, 'supabase-migration', 'schema');
    const schemaFiles = [
      '01_initial_schema.sql',
      '02_jobs_and_workflow.sql', 
      '03_realtime_and_permissions.sql',
      '04_advanced_analytics.sql'
    ];
    
    let allSchema = '';
    
    for (const file of schemaFiles) {
      const filePath = path.join(schemaDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`   📄 Loading ${file}...`);
        const schema = fs.readFileSync(filePath, 'utf8');
        allSchema += schema + '\n';
      } else {
        console.log(`   ⚠️  ${file} not found, skipping...`);
      }
    }
    
    if (!allSchema.trim()) {
      console.log('❌ No schema files found. Please check the schema directory.');
      return;
    }
    
    console.log('✅ Schema files loaded');
    
    // Split schema into individual statements
    const statements = allSchema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📊 Deploying ${statements.length} SQL statements...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        // Execute the SQL statement
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Try direct execution for DDL statements
          const { error: directError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .limit(1);
          
          if (directError && directError.message.includes('relation')) {
            // This is likely a DDL statement that needs special handling
            console.log(`   ⚠️  Statement ${i + 1}: DDL statement (may need manual execution)`);
          } else {
            console.log(`   ❌ Statement ${i + 1}: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log(`   ✅ Statement ${i + 1}: Success`);
          successCount++;
        }
      } catch (err) {
        console.log(`   ❌ Statement ${i + 1}: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📈 Deployment Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log('\n💡 Some statements may need manual execution in the Supabase SQL Editor.');
      console.log('   Go to your Supabase Dashboard → SQL Editor');
      console.log('   Copy and paste the schema files manually if needed.');
    }
    
    // Verify deployment
    console.log('\n🔍 Verifying deployment...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.log('⚠️  Could not verify tables:', tablesError.message);
    } else {
      const tableNames = tables?.map(t => t.table_name) || [];
      console.log(`📋 Found ${tableNames.length} tables in database`);
      
      if (tableNames.length > 0) {
        console.log('   Tables:', tableNames.join(', '));
      }
    }
    
    console.log('\n🎉 Schema deployment completed!');
    console.log('💡 Next steps:');
    console.log('   1. Run: node seed-data.js (to add test data)');
    console.log('   2. Run: node test-supabase-connection.js (to verify connection)');
    
  } catch (error) {
    console.log('❌ Schema deployment failed:', error.message);
  }
}

// Run the deployment
deploySchema().catch(console.error);
