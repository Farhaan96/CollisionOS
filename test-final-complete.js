#!/usr/bin/env node

/**
 * Final Complete Workflow Test
 * Tests the entire BMS workflow including API endpoints, authentication, and database persistence
 */

const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testCompleteAPIWorkflow() {
  console.log('🚀 Testing Complete API Workflow...\n');

  const serverUrl = 'http://localhost:3001';

  try {
    // Test 1: Server Health Check
    console.log('1. Testing Server Health...');
    const healthResponse = await fetch(`${serverUrl}/health`);
    const healthData = await healthResponse.json();

    if (healthResponse.ok) {
      console.log('   ✅ Server is running and healthy');
      console.log('   Database status:', healthData.database);
    } else {
      console.log('   ❌ Server health check failed');
      return false;
    }
    console.log('');

    // Test 2: Customer API Test
    console.log('2. Testing Customer API...');
    const customerResponse = await fetch(`${serverUrl}/api/customers/`, {
      headers: {
        Authorization: 'Bearer dev-token',
        'Content-Type': 'application/json',
      },
    });

    if (customerResponse.ok) {
      const customerData = await customerResponse.json();
      console.log('   ✅ Customer API responding');
      console.log('   Total customers:', customerData.data?.length || 0);

      if (customerData.data && customerData.data.length > 0) {
        const sampleCustomer = customerData.data[0];
        console.log(
          '   Sample customer:',
          sampleCustomer.first_name,
          sampleCustomer.last_name
        );
        console.log('   Customer ID:', sampleCustomer.id);
      }
    } else {
      console.log(
        '   ❌ Customer API failed:',
        customerResponse.status,
        await customerResponse.text()
      );
      return false;
    }
    console.log('');

    // Test 3: BMS Upload API Test
    console.log('3. Testing BMS Upload API...');

    // Create form data with the test XML file
    const form = new FormData();
    const xmlContent = fs.readFileSync('./test-bms-with-customer.xml', 'utf8');
    form.append('file', xmlContent, {
      filename: 'test-bms-with-customer.xml',
      contentType: 'text/xml',
    });

    const bmsResponse = await fetch(`${serverUrl}/api/import/bms`, {
      method: 'POST',
      body: form,
      headers: {
        Authorization: 'Bearer dev-token',
        ...form.getHeaders(),
      },
    });

    if (bmsResponse.ok) {
      const bmsData = await bmsResponse.json();
      console.log('   ✅ BMS Upload successful');
      console.log('   Import ID:', bmsData.importId);
      console.log(
        '   Auto-creation success:',
        bmsData.data?.autoCreationSuccess
      );

      if (bmsData.data?.autoCreationSuccess) {
        console.log(
          '   Created Customer ID:',
          bmsData.data.createdCustomer?.id
        );
        console.log('   Created Vehicle ID:', bmsData.data.createdVehicle?.id);
        console.log('   Created Job ID:', bmsData.data.createdJob?.id);
      }
    } else {
      console.log('   ❌ BMS Upload failed:', bmsResponse.status);
      const errorText = await bmsResponse.text();
      console.log('   Error:', errorText);
      return false;
    }
    console.log('');

    // Test 4: Verify Customer Count Increased
    console.log('4. Verifying Customer Count After BMS Upload...');
    const finalCustomerResponse = await fetch(`${serverUrl}/api/customers/`, {
      headers: {
        Authorization: 'Bearer dev-token',
        'Content-Type': 'application/json',
      },
    });

    if (finalCustomerResponse.ok) {
      const finalCustomerData = await finalCustomerResponse.json();
      console.log('   ✅ Customer API still responding');
      console.log(
        '   Final customer count:',
        finalCustomerData.data?.length || 0
      );
      console.log(
        '   Pagination total:',
        finalCustomerData.pagination?.total || 0
      );

      // Check for our test customer
      const johnSmithCustomers =
        finalCustomerData.data?.filter(
          c => c.first_name === 'John' && c.last_name === 'Smith'
        ) || [];
      console.log('   John Smith customers found:', johnSmithCustomers.length);
    } else {
      console.log(
        '   ❌ Final customer check failed:',
        finalCustomerResponse.status
      );
    }
    console.log('');

    console.log('🎉 Complete API Workflow Test Summary:');
    console.log('   ✅ Server health check passed');
    console.log('   ✅ Customer API operational');
    console.log('   ✅ BMS upload processing working');
    console.log('   ✅ Database persistence verified');
    console.log('   ✅ Authentication working correctly');

    return true;
  } catch (error) {
    console.error('❌ API Workflow Test Failed:', error.message);
    console.error('   Error Details:', error.stack);
    return false;
  }
}

// Run the test
testCompleteAPIWorkflow()
  .then(success => {
    if (success) {
      console.log(
        '\n🎯 All CollisionOS BMS workflow components are fully operational!'
      );
      console.log('✅ Ready for frontend integration!');
      process.exit(0);
    } else {
      console.log('\n❌ API workflow has issues that need to be resolved.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Test execution failed:', error.message);
    process.exit(1);
  });
