/**
 * Test to discover actual customer table schema in Supabase
 */
require('dotenv').config();
const { supabase } = require('./server/config/supabase');

async function testCustomerSchema() {
  try {
    console.log('🔍 Testing Customer Table Schema...');

    // Try to create a minimal customer record to see what fields exist
    const minimalCustomer = {
      first_name: 'Test',
      last_name: 'User',
    };

    console.log('📝 Trying minimal customer creation...');
    const { data, error } = await supabase
      .from('customers')
      .insert([minimalCustomer])
      .select()
      .single();

    if (error) {
      console.error('❌ Minimal customer creation failed:', error);

      // Try to query the table to see what's there
      console.log('\n🔍 Trying to query existing customers...');
      const { data: existingData, error: queryError } = await supabase
        .from('customers')
        .select('*')
        .limit(1);

      if (queryError) {
        console.error('❌ Query failed:', queryError);
      } else {
        console.log('✅ Query successful, existing customers:', existingData);
      }
    } else {
      console.log('✅ Minimal customer created:', data);

      // Clean up the test record
      await supabase.from('customers').delete().eq('id', data.id);
      console.log('🧹 Test record cleaned up');
    }
  } catch (error) {
    console.error('❌ Schema Test Failed:', error);
  }
}

// Run the test
testCustomerSchema();
