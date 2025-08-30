require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function verifySchema() {
  console.log('🔍 Verifying CollisionOS Schema...\n');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_JWT_SECRET) {
    console.log('❌ Missing Supabase credentials');
    return;
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_JWT_SECRET);

  // List of tables to check (including all schemas 01-04)
  const tables = [
    // Schema 01 - Core tables
    'shops',
    'users', 
    'customers',
    'vehicles',
    'vendors',
    'parts',
    'audit_trail',
    // Schema 02 - Jobs and workflow
    'jobs',
    'estimates',
    'work_orders',
    'job_photos',
    'job_notes',
    // Schema 03 - Realtime and permissions
    'notifications',
    // Schema 04 - Advanced analytics
    'daily_metrics',
    'monthly_metrics',
    'technician_performance',
    'customer_analytics',
    'parts_analytics'
  ];

  console.log('📋 Checking each table...\n');

  for (const table of tables) {
    try {
      // Try to query each table (limit 0 to just check if it exists)
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0);

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Table exists and is accessible`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }

  console.log('\n🎯 Schema verification complete!');
  console.log('💡 If you see ✅ for all tables, your schema is ready!');
}

verifySchema().catch(console.error);
