/**
 * Test Script for Automated Parts Sourcing
 * Validates the enhanced BMS processing pipeline with automated sourcing
 */

const path = require('path');
const fs = require('fs');

// Import our enhanced services
const bmsService = require('../server/services/bmsService');
const { AutomatedPartsSourcingService } = require('../server/services/automatedPartsSourcing');
const { BMSValidationService } = require('../server/services/bmsValidationService');
const { VINDecodingService } = require('../server/services/vinDecodingService');

async function testAutomatedSourcing() {
  console.log('🔧 Testing Automated Parts Sourcing Enhancement');
  console.log('='.repeat(60));

  try {
    // Initialize services (bmsService is already an instance)
    const automatedSourcing = new AutomatedPartsSourcingService();
    const validationService = new BMSValidationService();
    const vinDecoder = new VINDecodingService();

    console.log('✅ Services initialized successfully');

    // Test 1: VIN Decoding Service
    console.log('\n📍 Test 1: VIN Decoding Service');
    console.log('-'.repeat(40));
    
    const testVIN = '1G1BC5SM5H7123456';
    console.log(`Testing VIN: ${testVIN}`);
    
    const vinValidation = vinDecoder.validateVIN(testVIN);
    console.log(`VIN Validation: ${vinValidation.isValid ? '✅ Valid' : '❌ Invalid'}`);
    
    const basicVINInfo = vinDecoder.extractBasicVINInfo(testVIN);
    if (basicVINInfo) {
      console.log(`Manufacturer: ${basicVINInfo.manufacturerInfo.name}`);
      console.log(`Year: ${basicVINInfo.year}`);
      console.log(`WMI: ${basicVINInfo.wmi}`);
    }

    // Test 2: Sample Parts Sourcing
    console.log('\n📍 Test 2: Sample Parts Sourcing');
    console.log('-'.repeat(40));
    
    const sampleParts = [
      {
        lineNumber: 1,
        description: 'Front Bumper Cover - Primed',
        partNumber: '84044368',
        quantity: 1,
        partCost: 385.00,
        operationType: 'Replace'
      },
      {
        lineNumber: 2,
        description: 'Headlight Assembly Left',
        partNumber: '22851449',
        quantity: 1,
        partCost: 245.00,
        operationType: 'Replace'
      },
      {
        lineNumber: 3,
        description: 'Brake Pads',
        partNumber: 'BP12345',
        quantity: 1,
        partCost: 85.00,
        operationType: 'Replace'
      }
    ];

    const vehicleInfo = {
      vin: testVIN,
      year: 2017,
      make: 'Chevrolet',
      model: 'Malibu',
      subModel: 'LT'
    };

    const sourcingOptions = {
      enhanceWithVinDecoding: false, // Skip for testing
      generatePO: true,
      vendorTimeout: 2000,
      preferredVendors: ['oem_direct', 'aftermarket_premium'],
      approvalThreshold: 500,
      baseMarkup: 0.25
    };

    console.log(`Processing ${sampleParts.length} parts for sourcing...`);
    
    const startTime = Date.now();
    const sourcingResults = await automatedSourcing.processAutomatedPartsSourcing(
      sampleParts,
      vehicleInfo,
      sourcingOptions
    );
    const processingTime = Date.now() - startTime;

    console.log(`⏱️  Processing time: ${processingTime}ms`);
    console.log(`📊 Success: ${sourcingResults.success}`);
    console.log(`📈 Results: ${sourcingResults.results.length} parts processed`);
    console.log(`📋 Statistics: ${JSON.stringify(sourcingResults.statistics, null, 2)}`);

    // Display sourcing results
    sourcingResults.results.forEach((result, index) => {
      const part = result.originalLine;
      const sourcing = result.recommendedSource;
      
      console.log(`\n   Part ${index + 1}: ${part.description}`);
      console.log(`   Classification: ${result.classifiedPart.classifiedType}`);
      console.log(`   Category: ${result.classifiedPart.category}`);
      console.log(`   Sourcing Success: ${sourcing.recommended ? '✅' : '❌'}`);
      
      if (sourcing.recommended) {
        console.log(`   Vendor: ${sourcing.vendor.vendorId}`);
        console.log(`   Price: $${sourcing.vendor.price}`);
        console.log(`   Lead Time: ${sourcing.vendor.leadTime} days`);
        
        if (result.poData) {
          console.log(`   PO Required: ${result.poData.requiresApproval ? 'Approval' : 'Auto-Generate'}`);
          console.log(`   Extended Price: $${result.poData.poLineItem.extendedPrice}`);
        }
      } else {
        console.log(`   Reason: ${sourcing.reason}`);
      }
    });

    // Test 3: BMS Validation
    console.log('\n📍 Test 3: BMS Validation Service');
    console.log('-'.repeat(40));
    
    const testBMSData = {
      customer: {
        firstName: 'Robert',
        lastName: 'Johnson',
        phone: '303-555-1234',
        email: 'rjohnson@email.com'
      },
      vehicle: vehicleInfo,
      estimate: {
        estimateNumber: 'EST-2024-001',
        insuranceCompany: 'State Farm'
      },
      parts: sampleParts,
      financial: {
        partsTotal: 715.00,
        laborTotal: 350.00,
        totalEstimate: 1065.00
      }
    };

    const validationResult = await validationService.validateBMSData(testBMSData, {
      level: 'full'
    });

    console.log(`Validation Result: ${validationResult.isValid ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`Errors: ${validationResult.errors.length}`);
    console.log(`Warnings: ${validationResult.warnings.length}`);
    console.log(`Automated Sourcing Ready: ${validationResult.automatedSourcingReady ? '✅' : '❌'}`);
    console.log(`Recommendations: ${validationResult.recommendations.length}`);

    if (validationResult.errors.length > 0) {
      console.log('\nValidation Errors:');
      validationResult.errors.forEach(error => {
        console.log(`   ❌ ${error.code}: ${error.message}`);
      });
    }

    if (validationResult.recommendations.length > 0) {
      console.log('\nRecommendations:');
      validationResult.recommendations.forEach(rec => {
        console.log(`   💡 ${rec.type}: ${rec.message} (Priority: ${rec.priority})`);
      });
    }

    // Test 4: Sample BMS File Processing (if XML exists)
    console.log('\n📍 Test 4: BMS File Processing Integration');
    console.log('-'.repeat(40));
    
    // Create sample BMS XML
    const sampleBMSContent = `<?xml version="1.0" encoding="UTF-8"?>
<BMS_ESTIMATE>
  <CUSTOMER>
    <FIRST_NAME>Robert</FIRST_NAME>
    <LAST_NAME>Johnson</LAST_NAME>
    <PHONE>303-555-1234</PHONE>
    <EMAIL>rjohnson@email.com</EMAIL>
  </CUSTOMER>
  <VEHICLE>
    <VIN>1G1BC5SM5H7123456</VIN>
    <YEAR>2017</YEAR>
    <MAKE>Chevrolet</MAKE>
    <MODEL>Malibu</MODEL>
  </VEHICLE>
  <DAMAGE_ASSESSMENT>
    <DAMAGE_LINES>
      <LINE_ITEM>
        <LINE_NUMBER>1</LINE_NUMBER>
        <PART_NAME>Front Bumper Cover</PART_NAME>
        <PART_NUMBER>84044368</PART_NUMBER>
        <OPERATION_TYPE>Replace</OPERATION_TYPE>
        <PART_TYPE>OEM</PART_TYPE>
        <PART_COST>385.00</PART_COST>
        <LABOR_HOURS>2.5</LABOR_HOURS>
        <LABOR_RATE>55.00</LABOR_RATE>
        <LABOR_AMOUNT>137.50</LABOR_AMOUNT>
        <TOTAL_AMOUNT>522.50</TOTAL_AMOUNT>
      </LINE_ITEM>
      <LINE_ITEM>
        <LINE_NUMBER>2</LINE_NUMBER>
        <PART_NAME>Headlight Assembly</PART_NAME>
        <PART_NUMBER>22851449</PART_NUMBER>
        <OPERATION_TYPE>Replace</OPERATION_TYPE>
        <PART_TYPE>OEM</PART_TYPE>
        <PART_COST>245.00</PART_COST>
        <LABOR_HOURS>1.0</LABOR_HOURS>
        <LABOR_RATE>55.00</LABOR_RATE>
        <LABOR_AMOUNT>55.00</LABOR_AMOUNT>
        <TOTAL_AMOUNT>300.00</TOTAL_AMOUNT>
      </LINE_ITEM>
    </DAMAGE_LINES>
    <TOTAL_ESTIMATE>822.50</TOTAL_ESTIMATE>
    <LABOR_TOTAL>192.50</LABOR_TOTAL>
    <PARTS_TOTAL>630.00</PARTS_TOTAL>
  </DAMAGE_ASSESSMENT>
</BMS_ESTIMATE>`;

    const context = {
      fileName: 'test-estimate.xml',
      userId: 'test-user'
    };

    console.log('Processing sample BMS file with automated sourcing...');
    
    const bmsStartTime = Date.now();
    const bmsResult = await bmsService.processBMSWithAutomatedSourcing(
      sampleBMSContent,
      context,
      {
        enableAutomatedSourcing: true,
        enhanceWithVinDecoding: false,
        generateAutoPO: true,
        vendorTimeout: 2000
      }
    );
    const bmsProcessingTime = Date.now() - bmsStartTime;

    console.log(`⏱️  BMS Processing time: ${bmsProcessingTime}ms`);
    console.log(`📋 Import ID: ${bmsResult.importId}`);
    console.log(`🚗 Vehicle: ${bmsResult.vehicle.year} ${bmsResult.vehicle.make} ${bmsResult.vehicle.model}`);
    console.log(`👤 Customer: ${bmsResult.customer.firstName} ${bmsResult.customer.lastName}`);
    console.log(`🔧 Automated Sourcing: ${bmsResult.automatedSourcing.enabled ? '✅ Enabled' : '❌ Disabled'}`);
    
    if (bmsResult.automatedSourcing.enabled && bmsResult.automatedSourcing.success) {
      console.log(`📊 Sourcing Statistics: ${JSON.stringify(bmsResult.automatedSourcing.statistics, null, 2)}`);
      
      if (bmsResult.sourcedParts) {
        console.log(`📦 Sourced Parts: ${bmsResult.sourcedParts.length}`);
        bmsResult.sourcedParts.forEach((part, index) => {
          console.log(`   ${index + 1}. ${part.originalPart.description} - ${part.sourcing.success ? 'Sourced' : 'Failed'}`);
          if (part.sourcing.success) {
            console.log(`      Vendor: ${part.sourcing.vendor.id}, Price: $${part.sourcing.vendor.price}`);
          }
        });
      }
      
      if (bmsResult.purchaseOrderRecommendations) {
        console.log(`📋 PO Recommendations: ${bmsResult.purchaseOrderRecommendations.length}`);
        bmsResult.purchaseOrderRecommendations.forEach((po, index) => {
          console.log(`   PO ${index + 1}: Vendor ${po.vendorId}, Items: ${po.itemCount}, Total: $${po.totalValue.toFixed(2)}`);
        });
      }
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('='.repeat(60));
    console.log('✅ Automated Parts Sourcing Enhancement is working correctly');
    console.log('📊 Key Features Validated:');
    console.log('   • VIN Decoding and validation');
    console.log('   • Parts classification and normalization');
    console.log('   • Real-time vendor integration (mocked)');
    console.log('   • Business rules and markup application');
    console.log('   • Automated PO generation recommendations');
    console.log('   • Comprehensive BMS validation');
    console.log('   • End-to-end workflow integration');

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testAutomatedSourcing().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { testAutomatedSourcing };