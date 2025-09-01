/**
 * Direct test for customer creation to debug database schema issues
 */
require('dotenv').config();
const {
  customerService,
} = require('./server/database/services/customerService');

async function testCustomerCreation() {
  try {
    console.log('🧪 Testing Customer Creation...');

    // Test customer data from BMS
    const testCustomer = {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@test.com',
      phone: '555-1234',
      address: '123 Main St',
      city: 'Anytown',
      state: 'NY',
      zip: '12345',
      insurance: 'State Farm',
      shopId: process.env.DEV_SHOP_ID || '00000000-0000-4000-8000-000000000001',
    };

    console.log('📝 Test Customer Data:');
    console.log(JSON.stringify(testCustomer, null, 2));

    // Attempt to create customer
    console.log('\n🚀 Creating customer...');
    const result = await customerService.createCustomer(testCustomer);

    console.log('✅ Customer Created Successfully:');
    console.log(JSON.stringify(result, null, 2));

    // Try to find the customer
    console.log('\n🔍 Finding created customer...');
    const foundCustomers = await customerService.findCustomers({
      email: testCustomer.email,
    });

    console.log('🎯 Found Customers:');
    console.log(JSON.stringify(foundCustomers, null, 2));
  } catch (error) {
    console.error('❌ Customer Creation Test Failed:');
    console.error('Error Type:', error.constructor.name);
    console.error('Error Message:', error.message);
    console.error('Error Details:', error);

    if (error.code) {
      console.error('Error Code:', error.code);
    }
    if (error.details) {
      console.error('Error Details:', error.details);
    }
    if (error.hint) {
      console.error('Error Hint:', error.hint);
    }
  }
}

// Run the test
testCustomerCreation();
