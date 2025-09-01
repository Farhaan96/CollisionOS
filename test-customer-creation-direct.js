const {
  customerService,
} = require('./server/database/services/customerService');

async function testCustomerCreation() {
  console.log('Testing direct customer creation...');

  try {
    // Test customer data from BMS
    const customerData = {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@test.com',
      phone: '555-1234',
      address: '',
      city: '',
      state: '',
      zip: '',
      shopId: '00000000-0000-4000-8000-000000000001',
    };

    console.log('Creating customer with data:', customerData);

    const customer = await customerService.createCustomer(customerData);

    console.log('✅ Customer created successfully:', customer);
    return customer;
  } catch (error) {
    console.error('❌ Customer creation failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testCustomerCreation();
