/**
 * Test BMS Parser to debug customer creation issues
 */
const fs = require('fs');
const path = require('path');

// Import the BMS parser directly
const EnhancedBMSParser = require('./server/services/import/bms_parser.js');

async function testBMSParser() {
  try {
    console.log('🔍 Testing BMS Parser...');

    // Read the test BMS file
    const xmlPath = path.join(__dirname, 'test-bms.xml');
    const xmlContent = fs.readFileSync(xmlPath, 'utf8');

    console.log('📄 XML Content:');
    console.log(xmlContent);
    console.log('\n' + '='.repeat(50) + '\n');

    // Create parser instance
    const parser = new EnhancedBMSParser();

    // Parse the XML
    const result = await parser.parseBMS(xmlContent);

    console.log('✅ Parsed BMS Data:');
    console.log(JSON.stringify(result, null, 2));

    // Specifically check customer and vehicle data
    console.log('\n' + '='.repeat(50));
    console.log('👤 Customer Data:');
    console.log('firstName:', result.customer.firstName);
    console.log('lastName:', result.customer.lastName);
    console.log('email:', result.customer.email);
    console.log('phone:', result.customer.phone);

    console.log('\n🚗 Vehicle Data:');
    console.log('year:', result.vehicle.year);
    console.log('make:', result.vehicle.make);
    console.log('model:', result.vehicle.model);
    console.log('vin:', result.vehicle.vin);
  } catch (error) {
    console.error('❌ BMS Parser Test Failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testBMSParser();
