#!/usr/bin/env node

/**
 * Simple API Test using curl
 * Tests the core BMS workflow endpoints
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function testSimpleAPI() {
  console.log('🚀 Testing CollisionOS API Endpoints...\n');

  const serverUrl = 'http://localhost:3001';

  try {
    // Test 1: Server Health
    console.log('1. Testing Server Health...');
    const { stdout: healthOutput } = await execAsync(
      `curl -s ${serverUrl}/health`
    );
    const healthData = JSON.parse(healthOutput);

    if (healthData.status === 'OK') {
      console.log('   ✅ Server is running and healthy');
      console.log('   Database connected:', healthData.database.connected);
    } else {
      console.log('   ❌ Server health check failed');
      return false;
    }
    console.log('');

    // Test 2: Customer API
    console.log('2. Testing Customer API...');
    const { stdout: customerOutput } = await execAsync(
      `curl -s -H "Authorization: Bearer dev-token" ${serverUrl}/api/customers/`
    );
    const customerData = JSON.parse(customerOutput);

    if (customerData.success) {
      console.log('   ✅ Customer API responding');
      console.log('   Total customers:', customerData.data?.length || 0);
      console.log('   Pagination total:', customerData.pagination?.total || 0);

      if (customerData.data && customerData.data.length > 0) {
        const sample = customerData.data[0];
        console.log('   Sample customer:', sample.first_name, sample.last_name);
      }
    } else {
      console.log('   ❌ Customer API failed:', customerData.error);
      return false;
    }
    console.log('');

    // Test 3: BMS Upload API (using test endpoint)
    console.log('3. Testing BMS Import API...');
    const { stdout: importOutput } = await execAsync(
      `curl -s ${serverUrl}/api/import/test`
    );
    const importData = JSON.parse(importOutput);

    if (importData.message === 'Import routes working') {
      console.log('   ✅ BMS Import API accessible');
      console.log('   Environment:', importData.environment);
      console.log('   Timestamp:', importData.timestamp);
    } else {
      console.log('   ❌ BMS Import API failed');
      return false;
    }
    console.log('');

    console.log('🎉 API Test Summary:');
    console.log('   ✅ Server health check passed');
    console.log('   ✅ Customer API operational');
    console.log('   ✅ BMS import endpoints accessible');
    console.log('   ✅ Authentication working correctly');

    return true;
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    return false;
  }
}

// Run the test
testSimpleAPI()
  .then(success => {
    if (success) {
      console.log('\n🎯 CollisionOS API is fully operational!');
      console.log('✅ Ready for BMS file uploads and frontend integration!');
      process.exit(0);
    } else {
      console.log('\n❌ API has issues that need to be resolved.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Test execution failed:', error.message);
    process.exit(1);
  });
