/**
 * Complete test for BMS customer creation workflow
 * Creates shop first, then customer, then tests BMS import
 */
require('dotenv').config();
const { supabaseAdmin } = require('./server/config/supabase');
const {
  customerService,
} = require('./server/database/services/customerService');

const SHOP_ID = '00000000-0000-4000-8000-000000000001';

async function setupShop() {
  try {
    console.log('🏢 Setting up test shop...');

    const shopData = {
      id: SHOP_ID,
      name: 'Demo Auto Body Shop',
      business_name: 'Demo Auto Body Shop',
      address: '123 Main St',
      city: 'Demo City',
      state: 'NY',
      postal_code: '12345',
      phone: '(555) 123-4567',
      email: 'info@demoautobody.com',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Try to create shop or get existing
    const { data, error } = await supabaseAdmin
      .from('shops')
      .upsert([shopData])
      .select()
      .single();

    if (error) {
      console.error('❌ Shop creation failed:', error);
      return false;
    }

    console.log('✅ Shop created/found:', data.id);
    return true;
  } catch (error) {
    console.error('❌ Shop setup failed:', error);
    return false;
  }
}

async function testCustomerCreation() {
  try {
    console.log('👤 Testing Customer Creation...');

    const testCustomer = {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@test.com',
      phone: '555-1234',
      address: '123 Main St',
      city: 'Anytown',
      state: 'NY',
      zip: '12345',
      shopId: SHOP_ID,
    };

    const result = await customerService.createCustomer(testCustomer);
    console.log('✅ Customer created:', result.id);
    return result;
  } catch (error) {
    console.error('❌ Customer creation failed:', error);
    return null;
  }
}

async function testBMSWorkflow() {
  try {
    console.log('🔧 Testing BMS Workflow...');

    // First setup shop
    const shopReady = await setupShop();
    if (!shopReady) {
      throw new Error('Shop setup failed');
    }

    // Test customer creation
    const customer = await testCustomerCreation();
    if (!customer) {
      throw new Error('Customer creation failed');
    }

    console.log('🎉 BMS workflow setup complete!');
    console.log('Shop ID:', SHOP_ID);
    console.log('Customer ID:', customer.id);
    console.log('Customer Name:', customer.name);

    return true;
  } catch (error) {
    console.error('❌ BMS workflow test failed:', error);
    return false;
  }
}

// Run the test
testBMSWorkflow();
