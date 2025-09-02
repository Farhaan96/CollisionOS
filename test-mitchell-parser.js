#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const EnhancedBMSParser = require('./server/services/import/bms_parser');

async function testMitchellParsing() {
  console.log('🔧 Mitchell BMS Parser Test Suite');
  console.log('=====================================\n');

  const parser = new EnhancedBMSParser();
  
  // Test files to validate
  const testFiles = [
    {
      name: '602197685.xml',
      path: './Example BMS/602197685.xml',
      expectedCustomer: {
        name: 'DIEU TA',
        firstName: 'DIEU',
        lastName: 'TA',
        phone: '(604) 729-1604' // Expected formatted phone from +1604-7291604
      }
    },
    {
      name: '599540605.xml',
      path: './Example BMS/599540605.xml',
      expectedCustomer: {
        name: 'HARWINDER SAHOTA',
        firstName: 'HARWINDER',
        lastName: 'SAHOTA'
      }
    },
    {
      name: '593475061.xml',
      path: './Example BMS/593475061.xml',
      expectedCustomer: {
        name: 'RAKESLA PRASAD',
        firstName: 'RAKESLA',
        lastName: 'PRASAD'
      }
    }
  ];

  let passedTests = 0;
  let totalTests = testFiles.length;

  for (const testFile of testFiles) {
    console.log(`📄 Testing: ${testFile.name}`);
    console.log('─'.repeat(50));

    try {
      // Check if file exists
      if (!fs.existsSync(testFile.path)) {
        console.log(`❌ ERROR: File not found at ${testFile.path}`);
        continue;
      }

      // Read and parse the file
      const xmlContent = fs.readFileSync(testFile.path, 'utf8');
      const result = await parser.parseBMS(xmlContent);

      // Validate results
      console.log('📊 Parsing Results:');
      console.log(`   Customer Name: "${result.customer.name}"`);
      console.log(`   First Name: "${result.customer.firstName}"`);
      console.log(`   Last Name: "${result.customer.lastName}"`);
      console.log(`   Phone: "${result.customer.phone}"`);
      console.log(`   Email: "${result.customer.email}"`);
      console.log(`   Claim Number: "${result.customer.claimNumber}"`);
      console.log(`   VIN: "${result.vehicle.vin}"`);
      console.log(`   Vehicle: ${result.vehicle.year} ${result.vehicle.make} ${result.vehicle.model}`);

      // Validation checks
      let testPassed = true;
      const issues = [];

      if (result.customer.name !== testFile.expectedCustomer.name) {
        testPassed = false;
        issues.push(`❌ Name mismatch: expected "${testFile.expectedCustomer.name}", got "${result.customer.name}"`);
      }

      if (result.customer.firstName !== testFile.expectedCustomer.firstName) {
        testPassed = false;
        issues.push(`❌ First name mismatch: expected "${testFile.expectedCustomer.firstName}", got "${result.customer.firstName}"`);
      }

      if (result.customer.lastName !== testFile.expectedCustomer.lastName) {
        testPassed = false;
        issues.push(`❌ Last name mismatch: expected "${testFile.expectedCustomer.lastName}", got "${result.customer.lastName}"`);
      }

      // Phone validation (if expected)
      if (testFile.expectedCustomer.phone && result.customer.phone !== testFile.expectedCustomer.phone) {
        testPassed = false;
        issues.push(`❌ Phone mismatch: expected "${testFile.expectedCustomer.phone}", got "${result.customer.phone}"`);
      }

      // Basic validations
      if (!result.vehicle.vin) {
        testPassed = false;
        issues.push('❌ VIN not extracted');
      }

      if (!result.vehicle.year || !result.vehicle.make || !result.vehicle.model) {
        testPassed = false;
        issues.push('❌ Vehicle information incomplete');
      }

      // Results
      if (testPassed) {
        console.log('✅ PASSED: All validations successful');
        passedTests++;
      } else {
        console.log('❌ FAILED: Validation issues:');
        issues.forEach(issue => console.log(`   ${issue}`));
      }

      // Mitchell-specific validations
      if (result.metadata.isMitchell) {
        console.log('✅ Mitchell format correctly detected');
      } else {
        console.log('❌ Mitchell format NOT detected');
      }

    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      console.error(error);
    }

    console.log('\n');
  }

  // Summary
  console.log('📈 Test Summary');
  console.log('================');
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} tests`);

  if (passedTests === totalTests) {
    console.log('🎉 All Mitchell BMS parsing tests PASSED!');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed - review the issues above');
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  testMitchellParsing().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { testMitchellParsing };
