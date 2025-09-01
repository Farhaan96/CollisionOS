#!/usr/bin/env node

const fs = require('fs');
const FormData = require('form-data');
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function testBMSUpload() {
  try {
    console.log('🧪 Testing BMS Upload Functionality...\n');

    // Create form data
    const form = new FormData();
    const filePath = './test-files/sample-bms-test.xml';

    if (!fs.existsSync(filePath)) {
      console.error('❌ Test file not found:', filePath);
      process.exit(1);
    }

    form.append('file', fs.createReadStream(filePath), {
      filename: 'sample-bms-test.xml',
      contentType: 'application/xml',
    });

    console.log('📤 Uploading BMS file to /api/import/bms...');

    // Test upload
    const response = await fetch('http://localhost:3001/api/import/bms', {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders(),
      },
    });

    const contentType = response.headers.get('content-type');
    let result;

    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      result = { error: 'Non-JSON response', text: await response.text() };
    }

    console.log(
      `\n📊 Response Status: ${response.status} ${response.statusText}`
    );
    console.log('📋 Response Headers:');
    response.headers.forEach((value, key) => {
      console.log(`   ${key}: ${value}`);
    });

    console.log('\n📄 Response Body:');
    console.log(JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✅ BMS Upload Test: PASSED');

      if (result.importId) {
        console.log('\n⏳ Checking import status...');
        await checkImportStatus(result.importId);
      }
    } else {
      console.log('\n❌ BMS Upload Test: FAILED');
      console.log('Error Details:', result);
    }
  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

async function checkImportStatus(importId) {
  try {
    const response = await fetch(
      `http://localhost:3001/api/import/status/${importId}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    console.log(`📊 Status Check Response: ${response.status}`);
    console.log('📄 Status Data:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('⚠️  Status check failed:', error.message);
  }
}

// Run the test
testBMSUpload();
