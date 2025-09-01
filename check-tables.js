require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkTables() {
  console.log('🔍 Checking CollisionOS Tables in Supabase...\n');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_JWT_SECRET) {
    console.log('❌ Missing Supabase credentials');
    return;
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_JWT_SECRET
  );

  // List of expected tables
  const expectedTables = [
    'shops',
    'users',
    'customers',
    'vehicles',
    'vendors',
    'parts',
    'audit_trail',
  ];

  console.log('📋 Expected Tables:');
  expectedTables.forEach(table => console.log(`   - ${table}`));
  console.log('');

  try {
    // Query to get all tables in public schema
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');

    if (error) {
      console.log('❌ Error querying tables:', error.message);
      return;
    }

    const existingTables = data.map(row => row.table_name);

    console.log('✅ Found Tables:');
    existingTables.forEach(table => console.log(`   - ${table}`));
    console.log('');

    // Check which expected tables are missing
    const missingTables = expectedTables.filter(
      table => !existingTables.includes(table)
    );
    const foundTables = expectedTables.filter(table =>
      existingTables.includes(table)
    );

    console.log(`📊 Summary:`);
    console.log(
      `   ✅ Found: ${foundTables.length}/${expectedTables.length} tables`
    );
    console.log(`   ❌ Missing: ${missingTables.length} tables`);

    if (missingTables.length > 0) {
      console.log('\n❌ Missing Tables:');
      missingTables.forEach(table => console.log(`   - ${table}`));
    } else {
      console.log('\n🎉 All CollisionOS tables are present!');
    }

    // Check for any extra tables
    const extraTables = existingTables.filter(
      table => !expectedTables.includes(table)
    );
    if (extraTables.length > 0) {
      console.log('\n📝 Extra Tables (not part of CollisionOS):');
      extraTables.forEach(table => console.log(`   - ${table}`));
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

checkTables().catch(console.error);
