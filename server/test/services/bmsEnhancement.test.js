/**
 * Comprehensive BMS Processing Enhancement Tests
 * CollisionOS - Enhanced BMS Processing with Automated Parts Sourcing
 * 
 * Tests the enhanced BMS processing that includes:
 * - XML parsing improvements for CCC ONE, Mitchell, Audatex
 * - Parts extraction and classification
 * - VIN decoding integration with NHTSA API
 * - 3-tier validation system
 * - Real-time automated parts sourcing during import
 */

const { BMSProcessor } = require('../../services/import/bms_parser');
const { AutomatedPartsSourcingService } = require('../../services/automatedPartsSourcing');
const fs = require('fs').promises;
const path = require('path');

describe('Enhanced BMS Processing Tests', () => {
  let processor;
  let sourcingService;

  beforeEach(() => {
    processor = new BMSProcessor();
    sourcingService = new AutomatedPartsSourcingService();
  });

  describe('XML Parsing Tests - Multiple Formats', () => {
    it('should parse CCC ONE BMS format correctly', async () => {
      const cccOneXml = `<?xml version="1.0" encoding="UTF-8"?>
      <Estimate>
        <Header>
          <EstimateNumber>EST123456</EstimateNumber>
          <EstimatorName>John Smith</EstimateNumber>
          <Date>2024-01-15</Date>
        </Header>
        <Customer>
          <FirstName>Jane</FirstName>
          <LastName>Doe</LastName>
          <Phone>555-0123</Phone>
          <Email>jane.doe@email.com</Email>
        </Customer>
        <Vehicle>
          <VIN>1G1BC5SM5H7123456</VIN>
          <Year>2017</Year>
          <Make>Chevrolet</Make>
          <Model>Malibu</Model>
          <LicensePlate>ABC123</LicensePlate>
        </Vehicle>
        <Claim>
          <ClaimNumber>CLM-2024-001</ClaimNumber>
          <Insurer>State Farm</Insurer>
          <DateOfLoss>2024-01-10</DateOfLoss>
        </Claim>
        <RepairOrder>
          <RONumber>RO-2024-001</RONumber>
          <Deductible>500.00</Deductible>
        </RepairOrder>
        <DamageLines>
          <Line>
            <LineNumber>1</LineNumber>
            <PartNumber>GM-84044368</PartNumber>
            <OEMPartNumber>84044368</OEMPartNumber>
            <Description>Front Bumper Cover</Description>
            <Operation>Replace</Operation>
            <Quantity>1</Quantity>
            <PartCost>450.00</PartCost>
            <LaborHours>2.5</LaborHours>
            <LaborRate>65.00</LaborRate>
          </Line>
          <Line>
            <LineNumber>2</LineNumber>
            <PartNumber>GM-15228877</PartNumber>
            <OEMPartNumber>15228877</OEMPartNumber>
            <Description>Headlight Assembly LH</Description>
            <Operation>Replace</Operation>
            <Quantity>1</Quantity>
            <PartCost>275.50</PartCost>
            <LaborHours>1.0</LaborHours>
            <LaborRate>65.00</LaborRate>
          </Line>
        </DamageLines>
      </Estimate>`;

      const result = await processor.parseXML(cccOneXml, 'CCC_ONE');

      expect(result.success).toBe(true);
      expect(result.customer.firstName).toBe('Jane');
      expect(result.customer.lastName).toBe('Doe');
      expect(result.vehicle.vin).toBe('1G1BC5SM5H7123456');
      expect(result.vehicle.year).toBe(2017);
      expect(result.claim.claimNumber).toBe('CLM-2024-001');
      expect(result.damageLines).toHaveLength(2);
      expect(result.damageLines[0].partNumber).toBe('GM-84044368');
      expect(result.damageLines[0].partCost).toBe(450.00);
    });

    it('should parse Mitchell BMS format correctly', async () => {
      const mitchellXml = `<?xml version="1.0" encoding="UTF-8"?>
      <MITCHELL_ESTIMATE>
        <ESTIMATE_INFO>
          <ESTIMATE_NUMBER>MITCH789</ESTIMATE_NUMBER>
          <CREATION_DATE>2024-01-15</CREATION_DATE>
        </ESTIMATE_INFO>
        <CUSTOMER_INFO>
          <FIRST_NAME>Robert</FIRST_NAME>
          <LAST_NAME>Johnson</LAST_NAME>
          <PHONE_NUMBER>555-4567</PHONE_NUMBER>
        </CUSTOMER_INFO>
        <VEHICLE_INFO>
          <VIN_NUMBER>2G1WG5E32F1123456</VIN_NUMBER>
          <MODEL_YEAR>2015</MODEL_YEAR>
          <MAKE_DESC>Chevrolet</MAKE_DESC>
          <MODEL_NAME>Impala</MODEL_NAME>
        </VEHICLE_INFO>
        <INSURANCE_INFO>
          <CLAIM_NUMBER>MITCH-CLM-001</CLAIM_NUMBER>
          <CARRIER_NAME>Allstate</CARRIER_NAME>
        </INSURANCE_INFO>
        <DAMAGE_ANALYSIS>
          <PART_LINE>
            <LINE_NUM>001</LINE_NUM>
            <PART_NUMBER>22756117</PART_NUMBER>
            <OEM_PART_NUMBER>22756117</OEM_PART_NUMBER>
            <PART_NAME>FENDER RH</PART_NAME>
            <OPERATION_TYPE>R&amp;I</OPERATION_TYPE>
            <QTY>1</QTY>
            <PART_COST>320.50</PART_COST>
            <LABOR_HOURS>3.2</LABOR_HOURS>
            <PART_TYPE>OEM</PART_TYPE>
          </PART_LINE>
        </DAMAGE_ANALYSIS>
      </MITCHELL_ESTIMATE>`;

      const result = await processor.parseXML(mitchellXml, 'MITCHELL');

      expect(result.success).toBe(true);
      expect(result.customer.firstName).toBe('Robert');
      expect(result.vehicle.make).toBe('Chevrolet');
      expect(result.vehicle.model).toBe('Impala');
      expect(result.damageLines).toHaveLength(1);
      expect(result.damageLines[0].PART_NAME).toBe('FENDER RH');
      expect(result.damageLines[0].PART_TYPE).toBe('OEM');
    });

    it('should parse Audatex BMS format correctly', async () => {
      const audatexXml = `<?xml version="1.0" encoding="UTF-8"?>
      <AudatexEstimate xmlns="http://www.audatex.com/estimate">
        <EstimateHeader>
          <EstimateId>AUD456789</EstimateId>
          <CreatedDate>2024-01-15T10:30:00Z</CreatedDate>
        </EstimateHeader>
        <VehicleData>
          <Identification>
            <VIN>3VW2K7AJ9FM123456</VIN>
            <Year>2015</Year>
            <Make>Volkswagen</Make>
            <Model>Jetta</Model>
            <SubModel>SE</SubModel>
          </Identification>
        </VehicleData>
        <CustomerData>
          <Name>
            <First>Michael</First>
            <Last>Brown</Last>
          </Name>
          <Contact>
            <Phone>555-7890</Phone>
          </Contact>
        </CustomerData>
        <ClaimData>
          <ClaimNumber>AUD-CLM-001</ClaimNumber>
          <InsuranceCompany>Progressive</InsuranceCompany>
        </ClaimData>
        <RepairData>
          <RepairLine>
            <Position>1</Position>
            <PartData>
              <PartNumber>5C6807221GRU</PartNumber>
              <Description>Bumper Cover Rear</Description>
              <PartType>OEM</PartType>
              <UnitPrice>385.75</UnitPrice>
              <Quantity>1</Quantity>
            </PartData>
            <LaborData>
              <LaborTime>2.8</LaborTime>
              <LaborRate>70.00</LaborRate>
            </LaborData>
          </RepairLine>
        </RepairData>
      </AudatexEstimate>`;

      const result = await processor.parseXML(audatexXml, 'AUDATEX');

      expect(result.success).toBe(true);
      expect(result.customer.firstName).toBe('Michael');
      expect(result.vehicle.make).toBe('Volkswagen');
      expect(result.vehicle.subModel).toBe('SE');
      expect(result.damageLines).toHaveLength(1);
      expect(result.damageLines[0].partNumber).toBe('5C6807221GRU');
    });

    it('should handle malformed XML gracefully', async () => {
      const malformedXml = `<?xml version="1.0" encoding="UTF-8"?>
      <Estimate>
        <Customer>
          <FirstName>Jane</FirstName>
          <LastName>Doe
        </Customer>
      </Estimate>`;

      const result = await processor.parseXML(malformedXml, 'CCC_ONE');

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('XML parsing error');
    });

    it('should validate XML against schema', async () => {
      const invalidStructureXml = `<?xml version="1.0" encoding="UTF-8"?>
      <Estimate>
        <InvalidElement>This should not be here</InvalidElement>
      </Estimate>`;

      const result = await processor.parseXML(invalidStructureXml, 'CCC_ONE');

      expect(result.success).toBe(false);
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors.some(err => err.includes('schema'))).toBe(true);
    });
  });

  describe('Parts Extraction and Classification', () => {
    const mockEstimateData = {
      damageLines: [
        {
          lineNumber: 1,
          partNumber: 'GM-84044368',
          oemPartNumber: '84044368',
          description: 'Front Bumper Cover - OEM',
          quantity: 1,
          partCost: 450.00,
          operation: 'Replace'
        },
        {
          lineNumber: 2,
          partNumber: 'AF-12345',
          description: 'Aftermarket Headlight Assembly',
          quantity: 1,
          partCost: 185.00,
          partType: 'Aftermarket'
        },
        {
          lineNumber: 3,
          partNumber: 'LKQ-67890',
          description: 'Used Door Handle',
          quantity: 1,
          partCost: 45.00,
          condition: 'Used'
        }
      ],
      vehicle: {
        year: 2017,
        make: 'Chevrolet',
        model: 'Malibu',
        vin: '1G1BC5SM5H7123456'
      }
    };

    it('should classify parts correctly by type', async () => {
      const result = await processor.classifyParts(mockEstimateData.damageLines, mockEstimateData.vehicle);

      expect(result).toHaveLength(3);
      
      // OEM part classification
      expect(result[0].classifiedType).toBe('OEM');
      expect(result[0].category).toBe('body');
      expect(result[0].valueTier).toBe('standard');
      
      // Aftermarket part classification
      expect(result[1].classifiedType).toBe('Aftermarket');
      expect(result[1].category).toBe('lighting');
      
      // Used/recycled part classification
      expect(result[2].classifiedType).toBe('Recycled');
    });

    it('should normalize part numbers consistently', async () => {
      const unnormalizedParts = [
        { partNumber: ' GM-84044368 ', description: 'Part 1' },
        { partNumber: 'GM 84044368', description: 'Part 2' },
        { partNumber: 'gm-84044368', description: 'Part 3' }
      ];

      const result = await processor.classifyParts(unnormalizedParts, mockEstimateData.vehicle);

      result.forEach(part => {
        expect(part.normalizedPartNumber).toBe('GM84044368');
      });
    });

    it('should determine part categories accurately', async () => {
      const categoryTestParts = [
        { description: 'Front Bumper Cover', expectedCategory: 'body' },
        { description: 'Headlight Assembly RH', expectedCategory: 'lighting' },
        { description: 'Windshield Glass', expectedCategory: 'glass' },
        { description: 'Brake Pad Set Front', expectedCategory: 'mechanical' },
        { description: 'Seat Cover Leather', expectedCategory: 'interior' },
        { description: 'Wheel 17 Alloy', expectedCategory: 'wheels' },
        { description: 'Battery 12V', expectedCategory: 'electrical' }
      ];

      for (const testPart of categoryTestParts) {
        const result = await processor.classifyParts([testPart], mockEstimateData.vehicle);
        expect(result[0].category).toBe(testPart.expectedCategory);
      }
    });

    it('should handle safety-critical parts with OEM preference', async () => {
      const safetyParts = [
        { description: 'Airbag Module Driver', partType: 'Aftermarket' },
        { description: 'Brake Master Cylinder', partType: 'Used' },
        { description: 'Steering Column Assembly', partType: 'Remanufactured' },
        { description: 'Suspension Strut Assembly', partType: 'Generic' },
        { description: 'Seatbelt Pretensioner', partType: 'Unknown' }
      ];

      const result = await processor.classifyParts(safetyParts, mockEstimateData.vehicle);

      // All safety-critical parts should default to OEM
      result.forEach(part => {
        expect(part.classifiedType).toBe('OEM');
      });
    });
  });

  describe('VIN Decoding Integration', () => {
    it('should integrate with NHTSA VIN API successfully', async () => {
      const vin = '1G1BC5SM5H7123456';
      
      // Mock NHTSA API response
      const mockNHTSAResponse = {
        Results: [
          { Variable: 'Make', Value: 'CHEVROLET' },
          { Variable: 'Model', Value: 'Malibu' },
          { Variable: 'Model Year', Value: '2017' },
          { Variable: 'Body Class', Value: 'Sedan' },
          { Variable: 'Engine Number of Cylinders', Value: '4' },
          { Variable: 'Displacement (L)', Value: '1.5' },
          { Variable: 'Drive Type', Value: 'FWD' },
          { Variable: 'Transmission Style', Value: 'CVT' }
        ]
      };

      jest.spyOn(processor, 'callNHTSAAPI').mockResolvedValue(mockNHTSAResponse);

      const result = await processor.decodeVIN(vin);

      expect(result.success).toBe(true);
      expect(result.decodedData.make).toBe('CHEVROLET');
      expect(result.decodedData.model).toBe('Malibu');
      expect(result.decodedData.year).toBe('2017');
      expect(result.decodedData.bodyStyle).toBe('Sedan');
      expect(result.decodedData.engineSize).toBe('1.5');
      expect(result.decodedData.driveType).toBe('FWD');
    });

    it('should handle NHTSA API failures with fallback data', async () => {
      const vin = '1G1BC5SM5H7123456';
      
      jest.spyOn(processor, 'callNHTSAAPI').mockRejectedValue(new Error('NHTSA API unavailable'));

      const vehicleInfo = {
        year: 2017,
        make: 'Chevrolet',
        model: 'Malibu'
      };

      const result = await processor.decodeVIN(vin, vehicleInfo);

      expect(result.success).toBe(true);
      expect(result.fallbackUsed).toBe(true);
      expect(result.decodedData.make).toBe('Chevrolet');
      expect(result.decodedData.model).toBe('Malibu');
      expect(result.decodedData.year).toBe(2017);
    });

    it('should validate VIN format before API call', async () => {
      const invalidVins = [
        '1G1BC5SM5H712345', // Too short
        '1G1BC5SM5H71234567', // Too long
        '1G1BC5SM5H712345I', // Contains I
        '1G1BC5SM5H712345O', // Contains O
        '1G1BC5SM5H712345Q'  // Contains Q
      ];

      for (const invalidVin of invalidVins) {
        const result = await processor.decodeVIN(invalidVin);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid VIN format');
      }
    });

    it('should enhance vehicle data with VIN decode results', async () => {
      const estimateData = {
        vehicle: {
          vin: '1G1BC5SM5H7123456',
          year: 2017,
          make: 'Chevrolet',
          model: 'Malibu'
        }
      };

      const mockDecodeResult = {
        success: true,
        decodedData: {
          bodyStyle: 'Sedan',
          engineSize: '1.5L',
          transmission: 'CVT',
          driveType: 'FWD',
          fuelType: 'Gasoline'
        }
      };

      jest.spyOn(processor, 'decodeVIN').mockResolvedValue(mockDecodeResult);

      const result = await processor.enhanceVehicleData(estimateData);

      expect(result.vehicle.bodyStyle).toBe('Sedan');
      expect(result.vehicle.engineSize).toBe('1.5L');
      expect(result.vehicle.transmission).toBe('CVT');
      expect(result.vehicle.enhanced).toBe(true);
    });
  });

  describe('3-Tier Validation System', () => {
    const mockEstimateData = {
      customer: {
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '555-0123',
        email: 'jane.doe@email.com'
      },
      vehicle: {
        vin: '1G1BC5SM5H7123456',
        year: 2017,
        make: 'Chevrolet',
        model: 'Malibu'
      },
      claim: {
        claimNumber: 'CLM-2024-001',
        insurer: 'State Farm'
      },
      damageLines: [
        {
          lineNumber: 1,
          partNumber: 'GM-84044368',
          description: 'Front Bumper Cover',
          quantity: 1,
          partCost: 450.00
        }
      ]
    };

    it('should perform Tier 1 validation (Required Fields)', async () => {
      const result = await processor.validateTier1(mockEstimateData);

      expect(result.passed).toBe(true);
      expect(result.requiredFieldsPresent).toBe(true);
      expect(result.missingFields).toHaveLength(0);
    });

    it('should catch Tier 1 validation failures', async () => {
      const incompleteData = {
        customer: {
          firstName: 'Jane'
          // Missing lastName, phone
        },
        vehicle: {
          // Missing VIN, year, make, model
        },
        damageLines: []
      };

      const result = await processor.validateTier1(incompleteData);

      expect(result.passed).toBe(false);
      expect(result.missingFields.length).toBeGreaterThan(0);
      expect(result.missingFields).toContain('customer.lastName');
      expect(result.missingFields).toContain('vehicle.vin');
    });

    it('should perform Tier 2 validation (Data Format)', async () => {
      const result = await processor.validateTier2(mockEstimateData);

      expect(result.passed).toBe(true);
      expect(result.formatValid).toBe(true);
      expect(result.validationErrors).toHaveLength(0);
    });

    it('should catch Tier 2 format validation errors', async () => {
      const invalidFormatData = {
        ...mockEstimateData,
        customer: {
          ...mockEstimateData.customer,
          phone: '123', // Invalid phone format
          email: 'invalid-email' // Invalid email format
        },
        vehicle: {
          ...mockEstimateData.vehicle,
          year: 'invalid', // Invalid year format
          vin: '123' // Invalid VIN format
        },
        damageLines: [
          {
            lineNumber: 'one', // Should be number
            partCost: 'expensive', // Should be number
            quantity: -1 // Should be positive
          }
        ]
      };

      const result = await processor.validateTier2(invalidFormatData);

      expect(result.passed).toBe(false);
      expect(result.validationErrors.length).toBeGreaterThan(0);
      expect(result.validationErrors.some(err => err.includes('phone'))).toBe(true);
      expect(result.validationErrors.some(err => err.includes('email'))).toBe(true);
      expect(result.validationErrors.some(err => err.includes('VIN'))).toBe(true);
    });

    it('should perform Tier 3 validation (Sourcing Readiness)', async () => {
      const result = await processor.validateTier3(mockEstimateData);

      expect(result.passed).toBe(true);
      expect(result.sourcingReady).toBe(true);
      expect(result.sourcingReadiness.partsClassifiable).toBe(true);
      expect(result.sourcingReadiness.vehicleIdentifiable).toBe(true);
    });

    it('should assess sourcing readiness correctly', async () => {
      const poorSourcingData = {
        ...mockEstimateData,
        vehicle: {
          // Missing VIN makes VIN decoding impossible
          year: 2017,
          make: 'Unknown',
          model: 'Unknown'
        },
        damageLines: [
          {
            lineNumber: 1,
            // Missing part number makes sourcing difficult
            description: 'Some part',
            quantity: 1,
            partCost: 0 // Zero cost indicates incomplete data
          }
        ]
      };

      const result = await processor.validateTier3(poorSourcingData);

      expect(result.passed).toBe(false);
      expect(result.sourcingReady).toBe(false);
      expect(result.sourcingReadiness.vehicleIdentifiable).toBe(false);
      expect(result.sourcingReadiness.partsClassifiable).toBe(false);
    });

    it('should provide comprehensive validation summary', async () => {
      const result = await processor.performComprehensiveValidation(mockEstimateData);

      expect(result.overallValid).toBe(true);
      expect(result.tier1).toBeDefined();
      expect(result.tier2).toBeDefined();
      expect(result.tier3).toBeDefined();
      expect(result.readyForSourcing).toBe(true);
      expect(result.validationScore).toBeGreaterThan(0.8); // 80%+ validation score
    });
  });

  describe('Error Handling and Network Failures', () => {
    it('should handle network timeouts gracefully', async () => {
      const timeoutXml = `<?xml version="1.0" encoding="UTF-8"?>
      <Estimate><Vehicle><VIN>1G1BC5SM5H7123456</VIN></Vehicle></Estimate>`;

      // Mock network timeout
      jest.spyOn(processor, 'callNHTSAAPI').mockImplementation(() =>
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      const result = await processor.parseXML(timeoutXml, 'CCC_ONE');

      expect(result.success).toBe(true); // Should not fail completely
      expect(result.warnings).toBeDefined();
      expect(result.warnings.some(w => w.includes('VIN decoding failed'))).toBe(true);
    });

    it('should handle missing data gracefully', async () => {
      const sparseXml = `<?xml version="1.0" encoding="UTF-8"?>
      <Estimate>
        <Customer><FirstName>Jane</FirstName></Customer>
        <Vehicle><Year>2017</Year></Vehicle>
      </Estimate>`;

      const result = await processor.parseXML(sparseXml, 'CCC_ONE');

      expect(result.success).toBe(true);
      expect(result.customer.firstName).toBe('Jane');
      expect(result.customer.lastName).toBeUndefined();
      expect(result.completeness).toBeLessThan(1.0);
    });

    it('should handle large file processing', async () => {
      const largeDamageLines = Array(200).fill().map((_, i) => `
        <Line>
          <LineNumber>${i + 1}</LineNumber>
          <PartNumber>PART-${i + 1}</PartNumber>
          <Description>Test Part ${i + 1}</Description>
          <PartCost>${Math.floor(Math.random() * 500) + 50}</PartCost>
        </Line>
      `).join('');

      const largeXml = `<?xml version="1.0" encoding="UTF-8"?>
      <Estimate>
        <Customer><FirstName>Test</FirstName><LastName>User</LastName></Customer>
        <Vehicle><Year>2017</Year><Make>Test</Make><Model>Vehicle</Model></Vehicle>
        <DamageLines>${largeDamageLines}</DamageLines>
      </Estimate>`;

      const startTime = Date.now();
      const result = await processor.parseXML(largeXml, 'CCC_ONE');
      const processingTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.damageLines).toHaveLength(200);
      expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Integration with Automated Parts Sourcing', () => {
    it('should trigger automated sourcing during BMS processing', async () => {
      const bmsXml = `<?xml version="1.0" encoding="UTF-8"?>
      <Estimate>
        <Customer><FirstName>Jane</FirstName><LastName>Doe</LastName></Customer>
        <Vehicle><VIN>1G1BC5SM5H7123456</VIN><Year>2017</Year><Make>Chevrolet</Make><Model>Malibu</Model></Vehicle>
        <DamageLines>
          <Line>
            <PartNumber>GM-84044368</PartNumber>
            <Description>Front Bumper Cover</Description>
            <PartCost>450.00</PartCost>
          </Line>
        </DamageLines>
      </Estimate>`;

      const options = { enableAutomatedSourcing: true };
      
      // Mock the sourcing service
      jest.spyOn(sourcingService, 'processAutomatedPartsSourcing').mockResolvedValue({
        success: true,
        results: [{
          classifiedPart: { partNumber: 'GM-84044368' },
          recommendedSource: { recommended: true, vendor: { price: 420.00 } }
        }],
        statistics: { sourcingSuccessRate: '100%' }
      });

      const result = await processor.parseXMLWithSourcing(bmsXml, 'CCC_ONE', options);

      expect(result.success).toBe(true);
      expect(result.automatedSourcing).toBeDefined();
      expect(result.automatedSourcing.success).toBe(true);
      expect(result.automatedSourcing.statistics.sourcingSuccessRate).toBe('100%');
    });

    it('should handle sourcing failures without affecting BMS processing', async () => {
      const bmsXml = `<?xml version="1.0" encoding="UTF-8"?>
      <Estimate>
        <Customer><FirstName>Jane</FirstName><LastName>Doe</LastName></Customer>
        <Vehicle><VIN>1G1BC5SM5H7123456</VIN><Year>2017</Year><Make>Chevrolet</Make><Model>Malibu</Model></Vehicle>
        <DamageLines>
          <Line>
            <PartNumber>GM-84044368</PartNumber>
            <Description>Front Bumper Cover</Description>
            <PartCost>450.00</PartCost>
          </Line>
        </DamageLines>
      </Estimate>`;

      const options = { enableAutomatedSourcing: true };
      
      // Mock sourcing service failure
      jest.spyOn(sourcingService, 'processAutomatedPartsSourcing').mockRejectedValue(
        new Error('Sourcing service unavailable')
      );

      const result = await processor.parseXMLWithSourcing(bmsXml, 'CCC_ONE', options);

      expect(result.success).toBe(true); // BMS processing should still succeed
      expect(result.automatedSourcing).toBeDefined();
      expect(result.automatedSourcing.success).toBe(false);
      expect(result.automatedSourcing.error).toContain('Sourcing service unavailable');
    });
  });
});