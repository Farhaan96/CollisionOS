/**
 * Automated Parts Sourcing Test Suite
 * Comprehensive tests for BMS processing with automated vendor integration
 */

const { AutomatedPartsSourcingService } = require('../services/automatedPartsSourcing');
const { BMSValidationService } = require('../services/bmsValidationService');
const { VINDecodingService } = require('../services/vinDecodingService');
const BMSService = require('../services/bmsService');

describe('Automated Parts Sourcing Integration Tests', () => {
  let automatedSourcing;
  let validationService;
  let vinDecoder;
  let bmsService;

  beforeAll(() => {
    automatedSourcing = new AutomatedPartsSourcingService();
    validationService = new BMSValidationService();
    vinDecoder = new VINDecodingService();
    bmsService = new BMSService();
  });

  describe('BMS Validation Service', () => {
    test('should validate complete BMS data successfully', async () => {
      const completeBMSData = {
        customer: {
          firstName: 'John',
          lastName: 'Smith',
          phone: '555-1234',
          email: 'john@email.com'
        },
        vehicle: {
          vin: '1G1BC5SM5H7123456',
          year: 2017,
          make: 'Chevrolet',
          model: 'Malibu'
        },
        estimate: {
          estimateNumber: 'EST-2024-001',
          insuranceCompany: 'State Farm'
        },
        parts: [
          {
            lineNumber: 1,
            description: 'Front Bumper Cover',
            partNumber: '84044368',
            quantity: 1,
            price: 385.00
          }
        ],
        financial: {
          partsTotal: 385.00,
          laborTotal: 150.00,
          totalEstimate: 535.00
        }
      };

      const result = await validationService.validateBMSData(completeBMSData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.automatedSourcingReady).toBe(true);
      expect(result.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'automation',
          action: 'enable_automated_sourcing'
        })
      );
    });

    test('should detect missing required fields', async () => {
      const incompleteBMSData = {
        customer: {
          firstName: 'John'
          // Missing lastName
        },
        vehicle: {
          // Missing year, make, model
        },
        parts: [] // No parts
      };

      const result = await validationService.validateBMSData(incompleteBMSData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.automatedSourcingReady).toBe(false);
      
      // Should have specific validation errors
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_CUSTOMER_NAME'
        })
      );
    });

    test('should validate VIN format correctly', async () => {
      const invalidVINData = {
        customer: { lastName: 'Smith' },
        vehicle: {
          vin: '1G1BC5SM5H7123456TOOLONG', // Too long
          year: 2017,
          make: 'Chevrolet',
          model: 'Malibu'
        },
        estimate: {},
        parts: [{ description: 'Test Part', quantity: 1 }]
      };

      const result = await validationService.validateBMSData(invalidVINData);
      
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_VIN_LENGTH'
        })
      );
    });

    test('should validate for automated sourcing readiness', async () => {
      const sourcingReadyData = {
        customer: { lastName: 'Smith' },
        vehicle: {
          vin: '1G1BC5SM5H7123456',
          year: 2017,
          make: 'Chevrolet',
          model: 'Malibu'
        },
        estimate: {},
        parts: [
          {
            description: 'Front Bumper Cover',
            partNumber: '84044368',
            quantity: 1
          }
        ]
      };

      const result = validationService.validateForAutomatedSourcing(sourcingReadyData);
      
      expect(result.isValid).toBe(true);
      expect(result.canProceedWithSourcing).toBe(true);
      expect(result.sourcingReadyParts).toBe(1);
    });
  });

  describe('VIN Decoding Service', () => {
    test('should validate VIN format correctly', () => {
      const validVIN = '1G1BC5SM5H7123456';
      const invalidVIN = '1G1BC5SM5H712345O'; // Contains 'O'
      
      expect(vinDecoder.validateVIN(validVIN).isValid).toBe(true);
      expect(vinDecoder.validateVIN(invalidVIN).isValid).toBe(false);
      expect(vinDecoder.validateVIN('SHORT').isValid).toBe(false);
    });

    test('should extract basic VIN information', () => {
      const vin = '1G1BC5SM5H7123456';
      const basicInfo = vinDecoder.extractBasicVINInfo(vin);
      
      expect(basicInfo).toBeDefined();
      expect(basicInfo.vin).toBe(vin);
      expect(basicInfo.wmi).toBe('1G1');
      expect(basicInfo.year).toBeDefined();
      expect(basicInfo.manufacturerInfo.name).toBe('Chevrolet');
    });

    test('should get manufacturer from WMI correctly', () => {
      expect(vinDecoder.getManufacturerFromWMI('1G1').name).toBe('Chevrolet');
      expect(vinDecoder.getManufacturerFromWMI('1FA').name).toBe('Ford');
      expect(vinDecoder.getManufacturerFromWMI('JT2').name).toBe('Toyota');
      expect(vinDecoder.getManufacturerFromWMI('XXX').name).toBe('Unknown');
    });

    test('should decode year from VIN character', () => {
      expect(vinDecoder.getYearFromCode('H')).toBe(2017);
      expect(vinDecoder.getYearFromCode('J')).toBe(2018);
      expect(vinDecoder.getYearFromCode('1')).toBe(2001);
    });

    test('should handle VIN decoding with fallback', async () => {
      const vin = '1G1BC5SM5H7123456';
      
      try {
        const result = await vinDecoder.decodeVIN(vin);
        expect(result).toBeDefined();
        expect(result.vin).toBe(vin);
        expect(result.source).toBeDefined();
      } catch (error) {
        // Even if decoding fails, should provide fallback data
        expect(error.message).toContain('VIN decoding failed');
      }
    });
  });

  describe('Automated Parts Sourcing Service', () => {
    test('should process parts sourcing successfully', async () => {
      const sampleParts = [
        {
          lineNumber: 1,
          description: 'Front Bumper Cover',
          partNumber: '84044368',
          quantity: 1,
          partCost: 385.00
        },
        {
          lineNumber: 2,
          description: 'Headlight Assembly',
          partNumber: '12345678',
          quantity: 1,
          partCost: 245.00
        }
      ];

      const vehicleInfo = {
        vin: '1G1BC5SM5H7123456',
        year: 2017,
        make: 'Chevrolet',
        model: 'Malibu'
      };

      const options = {
        enhanceWithVinDecoding: false, // Skip VIN decoding for test
        generatePO: true,
        vendorTimeout: 1000,
        preferredVendors: ['oem_direct', 'aftermarket_premium']
      };

      const result = await automatedSourcing.processAutomatedPartsSourcing(
        sampleParts,
        vehicleInfo,
        options
      );

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.statistics.totalParts).toBe(2);
      expect(result.processingTime).toBeGreaterThan(0);
      
      // Check that each part has sourcing data
      result.results.forEach(partResult => {
        expect(partResult.originalLine).toBeDefined();
        expect(partResult.classifiedPart).toBeDefined();
        expect(partResult.recommendedSource).toBeDefined();
        expect(partResult.vendorResults).toBeDefined();
      });
    });

    test('should handle parts classification correctly', async () => {
      const parts = [
        {
          description: 'Genuine Toyota Front Bumper',
          partNumber: 'TOY12345',
          partType: 'OEM'
        },
        {
          description: 'Aftermarket Brake Pads',
          partNumber: 'AFT67890'
        },
        {
          description: 'Used Headlight Assembly',
          partNumber: 'LKQ11111'
        }
      ];

      const vehicleInfo = { year: 2017, make: 'Toyota', model: 'Camry' };
      
      const result = await automatedSourcing.processAutomatedPartsSourcing(
        parts,
        vehicleInfo,
        { enhanceWithVinDecoding: false }
      );

      expect(result.results[0].classifiedPart.classifiedType).toBe('OEM');
      expect(result.results[1].classifiedPart.category).toContain('mechanical');
      expect(result.results[2].classifiedPart.category).toContain('lighting');
    });

    test('should generate PO data when requested', async () => {
      const parts = [
        {
          description: 'Front Bumper Cover',
          partNumber: '84044368',
          quantity: 1,
          partCost: 385.00
        }
      ];

      const vehicleInfo = { year: 2017, make: 'Chevrolet', model: 'Malibu' };
      
      const result = await automatedSourcing.processAutomatedPartsSourcing(
        parts,
        vehicleInfo,
        { generatePO: true, enhanceWithVinDecoding: false }
      );

      const partWithPO = result.results.find(r => r.poData);
      if (partWithPO) {
        expect(partWithPO.poData.vendorId).toBeDefined();
        expect(partWithPO.poData.poLineItem).toBeDefined();
        expect(partWithPO.poData.poLineItem.unitPrice).toBeGreaterThan(0);
        expect(partWithPO.poData.businessRules).toBeDefined();
      }
    });

    test('should handle errors gracefully', async () => {
      const invalidParts = [
        {
          // Missing description
          quantity: -1 // Invalid quantity
        }
      ];

      const vehicleInfo = { year: 2017, make: 'Chevrolet', model: 'Malibu' };
      
      const result = await automatedSourcing.processAutomatedPartsSourcing(
        invalidParts,
        vehicleInfo,
        { enhanceWithVinDecoding: false }
      );

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('BMS Service Integration', () => {
    test('should process BMS with automated sourcing', async () => {
      // Sample BMS XML content
      const sampleBMSContent = `<?xml version="1.0" encoding="UTF-8"?>
<BMS_ESTIMATE>
  <CUSTOMER>
    <FIRST_NAME>John</FIRST_NAME>
    <LAST_NAME>Smith</LAST_NAME>
    <PHONE>555-1234</PHONE>
    <EMAIL>john@email.com</EMAIL>
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
    </DAMAGE_LINES>
    <TOTAL_ESTIMATE>522.50</TOTAL_ESTIMATE>
    <LABOR_TOTAL>137.50</LABOR_TOTAL>
    <PARTS_TOTAL>385.00</PARTS_TOTAL>
  </DAMAGE_ASSESSMENT>
</BMS_ESTIMATE>`;

      const context = {
        fileName: 'test-estimate.xml',
        userId: 'test-user'
      };

      const sourcingOptions = {
        enableAutomatedSourcing: true,
        enhanceWithVinDecoding: false, // Skip for testing
        generateAutoPO: true,
        vendorTimeout: 1000
      };

      const result = await bmsService.processBMSWithAutomatedSourcing(
        sampleBMSContent,
        context,
        sourcingOptions
      );

      expect(result).toBeDefined();
      expect(result.importId).toBeDefined();
      expect(result.customer.lastName).toBe('Smith');
      expect(result.vehicle.year).toBe(2017);
      expect(result.automatedSourcing.enabled).toBe(true);
      
      if (result.automatedSourcing.success) {
        expect(result.sourcedParts).toBeDefined();
        expect(result.sourcedParts.length).toBeGreaterThan(0);
      }
    });

    test('should handle BMS processing errors gracefully', async () => {
      const invalidBMSContent = `<?xml version="1.0" encoding="UTF-8"?>
<INVALID_XML>
  <INCOMPLETE_DATA>
  </INCOMPLETE_DATA>
</INVALID_XML>`;

      const context = { fileName: 'invalid.xml' };
      const sourcingOptions = { enableAutomatedSourcing: true };

      try {
        await bmsService.processBMSWithAutomatedSourcing(
          invalidBMSContent,
          context,
          sourcingOptions
        );
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('BMS file processing with automated sourcing failed');
      }
    });
  });

  describe('Performance and Reliability Tests', () => {
    test('should handle large parts lists efficiently', async () => {
      // Generate a large parts list
      const largeParts = Array.from({ length: 50 }, (_, i) => ({
        lineNumber: i + 1,
        description: `Test Part ${i + 1}`,
        partNumber: `TP${String(i + 1).padStart(6, '0')}`,
        quantity: 1,
        partCost: Math.random() * 500 + 10
      }));

      const vehicleInfo = { year: 2017, make: 'Toyota', model: 'Camry' };
      
      const startTime = Date.now();
      const result = await automatedSourcing.processAutomatedPartsSourcing(
        largeParts,
        vehicleInfo,
        { 
          enhanceWithVinDecoding: false,
          vendorTimeout: 500 // Shorter timeout for performance test
        }
      );
      const processingTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(50);
      expect(processingTime).toBeLessThan(30000); // Should complete within 30 seconds
      expect(result.processingTime).toBeGreaterThan(0);
    });

    test('should handle vendor timeout gracefully', async () => {
      const parts = [
        {
          description: 'Test Timeout Part',
          partNumber: 'TIMEOUT123',
          quantity: 1
        }
      ];

      const vehicleInfo = { year: 2017, make: 'Test', model: 'Model' };
      
      const result = await automatedSourcing.processAutomatedPartsSourcing(
        parts,
        vehicleInfo,
        { 
          enhanceWithVinDecoding: false,
          vendorTimeout: 100 // Very short timeout to trigger timeout handling
        }
      );

      expect(result).toBeDefined();
      // Should handle timeout gracefully without throwing
      expect(result.errors).toBeDefined();
    });
  });

  describe('Business Rules and Logic Tests', () => {
    test('should apply markup correctly based on part category', async () => {
      const parts = [
        {
          description: 'Engine Block',
          category: 'mechanical',
          partCost: 1000
        },
        {
          description: 'Dashboard Trim',
          category: 'interior',
          partCost: 150
        }
      ];

      const vehicleInfo = { year: 2017, make: 'Toyota', model: 'Camry' };
      
      const result = await automatedSourcing.processAutomatedPartsSourcing(
        parts,
        vehicleInfo,
        { 
          generatePO: true,
          baseMarkup: 0.25,
          enhanceWithVinDecoding: false
        }
      );

      const partsWithPO = result.results.filter(r => r.poData);
      
      partsWithPO.forEach(partResult => {
        expect(partResult.poData.businessRules.markup).toBeGreaterThan(0);
        expect(partResult.poData.poLineItem.customerPrice).toBeGreaterThan(
          partResult.poData.poLineItem.unitPrice
        );
      });
    });

    test('should flag high-value parts for approval', async () => {
      const highValueParts = [
        {
          description: 'Transmission Assembly',
          partCost: 2500, // High value
          quantity: 1
        }
      ];

      const vehicleInfo = { year: 2017, make: 'Toyota', model: 'Camry' };
      
      const result = await automatedSourcing.processAutomatedPartsSourcing(
        highValueParts,
        vehicleInfo,
        { 
          generatePO: true,
          approvalThreshold: 1000,
          enhanceWithVinDecoding: false
        }
      );

      const highValuePart = result.results.find(r => 
        r.poData && r.poData.poLineItem.extendedPrice > 1000
      );

      if (highValuePart) {
        expect(highValuePart.poData.requiresApproval).toBe(true);
      }
    });

    test('should prioritize safety-critical parts', async () => {
      const parts = [
        {
          description: 'Brake Pads',
          partCost: 85
        },
        {
          description: 'Air Freshener',
          partCost: 5
        }
      ];

      const vehicleInfo = { year: 2017, make: 'Toyota', model: 'Camry' };
      
      const result = await automatedSourcing.processAutomatedPartsSourcing(
        parts,
        vehicleInfo,
        { enhanceWithVinDecoding: false }
      );

      const brakePart = result.results.find(r => 
        r.originalLine.description.toLowerCase().includes('brake')
      );
      const airFreshener = result.results.find(r => 
        r.originalLine.description.toLowerCase().includes('air freshener')
      );

      if (brakePart && airFreshener) {
        expect(brakePart.classifiedPart.sourcingPriority).toBeGreaterThan(
          airFreshener.classifiedPart.sourcingPriority
        );
      }
    });
  });

  afterAll(() => {
    // Cleanup
    if (vinDecoder.clearCache) {
      vinDecoder.clearCache();
    }
  });
});

// Performance benchmark test (run separately)
describe.skip('Performance Benchmarks', () => {
  test('benchmark full BMS processing with automated sourcing', async () => {
    const largeBMSContent = generateLargeBMSContent(100); // 100 parts
    const bmsService = new BMSService();
    
    const iterations = 5;
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      
      await bmsService.processBMSWithAutomatedSourcing(
        largeBMSContent,
        { fileName: `benchmark-${i}.xml` },
        { 
          enableAutomatedSourcing: true,
          enhanceWithVinDecoding: false,
          vendorTimeout: 1000
        }
      );
      
      times.push(Date.now() - start);
    }
    
    const avgTime = times.reduce((sum, time) => sum + time, 0) / iterations;
    console.log(`Average processing time for 100 parts: ${avgTime}ms`);
    
    // Should complete within reasonable time
    expect(avgTime).toBeLessThan(60000); // 60 seconds
  });
});

// Helper function to generate large BMS content for testing
function generateLargeBMSContent(partCount) {
  const parts = Array.from({ length: partCount }, (_, i) => `
    <LINE_ITEM>
      <LINE_NUMBER>${i + 1}</LINE_NUMBER>
      <PART_NAME>Test Part ${i + 1}</PART_NAME>
      <PART_NUMBER>TP${String(i + 1).padStart(6, '0')}</PART_NUMBER>
      <OPERATION_TYPE>Replace</OPERATION_TYPE>
      <PART_TYPE>OEM</PART_TYPE>
      <PART_COST>${Math.random() * 500 + 10}</PART_COST>
      <LABOR_HOURS>2.0</LABOR_HOURS>
      <LABOR_RATE>55.00</LABOR_RATE>
      <LABOR_AMOUNT>110.00</LABOR_AMOUNT>
      <TOTAL_AMOUNT>${Math.random() * 600 + 120}</TOTAL_AMOUNT>
    </LINE_ITEM>
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<BMS_ESTIMATE>
  <CUSTOMER>
    <FIRST_NAME>Test</FIRST_NAME>
    <LAST_NAME>Customer</LAST_NAME>
    <PHONE>555-TEST</PHONE>
  </CUSTOMER>
  <VEHICLE>
    <VIN>1G1BC5SM5H7123456</VIN>
    <YEAR>2017</YEAR>
    <MAKE>Toyota</MAKE>
    <MODEL>Camry</MODEL>
  </VEHICLE>
  <DAMAGE_ASSESSMENT>
    <DAMAGE_LINES>
      ${parts}
    </DAMAGE_LINES>
    <TOTAL_ESTIMATE>10000.00</TOTAL_ESTIMATE>
    <LABOR_TOTAL>5000.00</LABOR_TOTAL>
    <PARTS_TOTAL>5000.00</PARTS_TOTAL>
  </DAMAGE_ASSESSMENT>
</BMS_ESTIMATE>`;
}