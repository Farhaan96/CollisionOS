const fs = require('fs');
const bmsService = require('./server/services/bmsService');

async function debugBMSService() {
  try {
    // Read the test BMS XML file
    const xmlContent = fs.readFileSync('./test-bms.xml', 'utf8');
    console.log('XML Content:', xmlContent);

    // Create context like the API does
    const context = {
      uploadId: 'test-upload-123',
      fileName: 'test-bms.xml',
      userId: 'test-user',
      shopId: '00000000-0000-4000-8000-000000000001',
    };

    console.log('\n=== TESTING BMS SERVICE PROCESS FILE ===');
    const result = await bmsService.processBMSFile(xmlContent, context);

    console.log(
      'Customer Data from BMS Service:',
      JSON.stringify(result.customer, null, 2)
    );
    console.log(
      'Vehicle Data from BMS Service:',
      JSON.stringify(result.vehicle, null, 2)
    );
    console.log(
      'Job Data from BMS Service:',
      JSON.stringify(result.job, null, 2)
    );

    console.log('\n=== TESTING BMS SERVICE WITH AUTO CREATION ===');
    const autoResult = await bmsService.processBMSWithAutoCreation(
      xmlContent,
      context
    );

    console.log(
      'Auto-creation result customer:',
      autoResult.customer ? 'has data' : 'empty'
    );
    console.log(
      'Auto-creation result vehicle:',
      autoResult.vehicle ? 'has data' : 'empty'
    );
    console.log('Auto-creation success:', autoResult.autoCreationSuccess);
    console.log('Auto-creation error:', autoResult.autoCreationError);
  } catch (error) {
    console.error('Debug Error:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the debug
debugBMSService();
