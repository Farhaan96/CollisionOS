const fs = require('fs');
const EnhancedBMSParser = require('./server/services/import/bms_parser.js');

async function debugBMSParser() {
  try {
    // Read the test BMS XML file
    const xmlContent = fs.readFileSync('./test-bms.xml', 'utf8');
    console.log('XML Content:', xmlContent);

    // Create parser instance
    const parser = new EnhancedBMSParser();

    // Parse the XML
    const result = await parser.parseBMS(xmlContent);

    console.log('\n=== PARSED RESULT ===');
    console.log('Customer Data:', JSON.stringify(result.customer, null, 2));
    console.log('Vehicle Data:', JSON.stringify(result.vehicle, null, 2));
    console.log('Estimate Data:', JSON.stringify(result.estimate, null, 2));
    console.log('Parts Data:', JSON.stringify(result.parts, null, 2));
    console.log('Labor Data:', JSON.stringify(result.labor, null, 2));
    console.log('Financial Data:', JSON.stringify(result.financial, null, 2));
  } catch (error) {
    console.error('Debug Error:', error);
  }
}

// Run the debug
debugBMSParser();
