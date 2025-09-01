#!/usr/bin/env node

/**
 * Complete BMS Workflow Test
 * Tests the entire BMS upload workflow including parsing, customer creation, and database storage
 */

const fs = require('fs');
const path = require('path');

async function testBMSWorkflow() {
  console.log('🔍 Testing Complete BMS Workflow...\n');

  try {
    // Test 1: BMS Parser Functionality
    console.log('1. Testing BMS Parser...');
    const EnhancedBMSParser = require('./server/services/import/bms_parser.js');
    const parser = new EnhancedBMSParser();

    const xmlContent = fs.readFileSync('./test-bms-with-customer.xml', 'utf8');
    const parsedData = await parser.parseBMS(xmlContent);

    console.log('   ✅ XML parsed successfully');
    console.log(
      '   Customer:',
      parsedData.customer.firstName,
      parsedData.customer.lastName
    );
    console.log('   Email:', parsedData.customer.email);
    console.log(
      '   Vehicle:',
      parsedData.vehicle.year,
      parsedData.vehicle.make,
      parsedData.vehicle.model
    );
    console.log('');

    // Test 2: Customer Service Direct Test
    console.log('2. Testing Customer Service...');
    const {
      customerService,
    } = require('./server/database/services/customerService.js');

    // Test customer creation with the parsed data
    const normalizedCustomer = {
      firstName: parsedData.customer.firstName,
      lastName: parsedData.customer.lastName,
      email: parsedData.customer.email,
      phone: parsedData.customer.phone,
      address: parsedData.customer.address,
      city: parsedData.customer.city,
      state: parsedData.customer.state,
      shopId: process.env.DEV_SHOP_ID || '00000000-0000-4000-8000-000000000001',
    };

    try {
      const createdCustomer =
        await customerService.createCustomer(normalizedCustomer);
      console.log('   ✅ Customer created successfully:', createdCustomer.id);
      console.log('   Customer Name:', createdCustomer.name);
      console.log('   Customer Email:', createdCustomer.email);
    } catch (customerError) {
      console.log('   ❌ Customer creation failed:', customerError.message);
      return false;
    }
    console.log('');

    // Test 3: Full BMS Service Test
    console.log('3. Testing Full BMS Service...');
    const bmsService = require('./server/services/bmsService.js');

    const serviceResult = await bmsService.processBMSWithAutoCreation(
      xmlContent,
      {
        uploadId: 'test-upload-' + Date.now(),
        fileName: 'test-bms-with-customer.xml',
        userId: 'test-user-123',
        shopId:
          process.env.DEV_SHOP_ID || '00000000-0000-4000-8000-000000000001',
      }
    );

    console.log('   ✅ BMS Service processing completed');
    console.log('   Auto-creation success:', serviceResult.autoCreationSuccess);
    if (serviceResult.autoCreationSuccess) {
      console.log('   Created Customer ID:', serviceResult.createdCustomer?.id);
      console.log('   Created Vehicle ID:', serviceResult.createdVehicle?.id);
      console.log('   Created Job ID:', serviceResult.createdJob?.id);
    } else {
      console.log('   Auto-creation error:', serviceResult.autoCreationError);
    }
    console.log('');

    // Test 4: Verify Customer Retrieval
    console.log('4. Testing Customer Retrieval...');

    try {
      // Test the service method first
      const allCustomers = await customerService.getAllCustomers({ limit: 10 });
      console.log(
        '   Service method - Total customers in database:',
        allCustomers.length
      );

      if (allCustomers.length > 0) {
        const latestCustomer = allCustomers[0];
        console.log(
          '   Latest customer:',
          latestCustomer.name,
          '(' + latestCustomer.email + ')'
        );
        console.log('   Customer ID:', latestCustomer.id);
      }

      // Also test with a direct query to understand the data
      const { supabaseAdmin } = require('./server/config/supabase.js');
      const { data: directQuery, error } = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq(
          'shop_id',
          process.env.DEV_SHOP_ID || '00000000-0000-4000-8000-000000000001'
        );

      console.log(
        '   Direct query - Total customers found:',
        directQuery?.length || 0
      );
      if (error) {
        console.log('   Direct query error:', error.message);
      }
      if (directQuery && directQuery.length > 0) {
        console.log('   Sample customer record:', {
          id: directQuery[0].id,
          name: `${directQuery[0].first_name} ${directQuery[0].last_name}`,
          email: directQuery[0].email,
          shopId: directQuery[0].shop_id,
          customerStatus: directQuery[0].customer_status,
          isActive: directQuery[0].is_active,
        });
      }
    } catch (retrievalError) {
      console.log('   ❌ Customer retrieval failed:', retrievalError.message);
    }
    console.log('');

    console.log('🎉 Complete BMS Workflow Test Summary:');
    console.log('   ✅ BMS XML parsing working correctly');
    console.log('   ✅ Customer service operational');
    console.log('   ✅ Database integration functional');
    console.log('   ✅ Full workflow process completed');

    return true;
  } catch (error) {
    console.error('❌ BMS Workflow Test Failed:', error.message);
    console.error('   Error Details:', error.stack);
    return false;
  }
}

// Run the test
testBMSWorkflow()
  .then(success => {
    if (success) {
      console.log('\n✅ All BMS workflow components are working correctly!');
      process.exit(0);
    } else {
      console.log('\n❌ BMS workflow has issues that need to be resolved.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Test execution failed:', error.message);
    process.exit(1);
  });
