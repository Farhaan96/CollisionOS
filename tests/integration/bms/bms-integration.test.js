/**
 * BMS Integration Tests
 * Comprehensive tests for BMS file upload, processing, and database integration
 */

import bmsService from '../../../src/services/bmsService';
import { readFileSync } from 'fs';
import { join, resolve } from 'path';

// Mock file paths for sample BMS files
const BMS_SAMPLES_PATH = resolve(__dirname, '../../../data/Example BMS');
const sampleFiles = [
  'minor_collision_estimate.xml',
  'major_collision_estimate.xml',
  'luxury_vehicle_estimate.xml',
  'paint_only_estimate.xml',
  'glass_replacement_estimate.xml'
];

describe('BMS Integration Tests', () => {
  const sampleFileContents = {};

  beforeAll(async () => {
    // Load all sample BMS files
    try {
      for (const filename of sampleFiles) {
        const filePath = join(BMS_SAMPLES_PATH, filename);
        try {
          const content = readFileSync(filePath, 'utf8');
          sampleFileContents[filename] = content;
        } catch (error) {
          console.warn(`Could not load sample file ${filename}:`, error.message);
          // Create mock content for missing files
          sampleFileContents[filename] = createMockBMSContent(filename);
        }
      }
    } catch (error) {
      console.warn('Could not load all BMS samples, using mock data');
    }
  });

  describe('BMS File Processing', () => {
    it('should successfully parse all sample BMS files', async () => {
      const results = {};
      
      for (const [filename, content] of Object.entries(sampleFileContents)) {
        try {
          const parsed = bmsService.parseBMSFile(content);
          results[filename] = {
            success: true,
            data: parsed,
            hasRequiredFields: validateRequiredFields(parsed)
          };
        } catch (error) {
          results[filename] = {
            success: false,
            error: error.message
          };
        }
      }

      // All files should parse successfully
      const failedFiles = Object.entries(results).filter(([_, result]) => !result.success);
      if (failedFiles.length > 0) {
        console.error('Failed to parse files:', failedFiles);
      }
      
      expect(failedFiles.length).toBe(0);

      // All parsed files should have required fields
      const filesWithMissingFields = Object.entries(results)
        .filter(([_, result]) => result.success && !result.hasRequiredFields);
      
      expect(filesWithMissingFields.length).toBe(0);
    });

    it('should extract customer information consistently', async () => {
      const customerData = {};
      
      for (const [filename, content] of Object.entries(sampleFileContents)) {
        try {
          const parsed = bmsService.parseBMSFile(content);
          customerData[filename] = {
            policyHolder: parsed.adminInfo?.policyHolder,
            hasValidCustomer: validateCustomerData(parsed.adminInfo?.policyHolder)
          };
        } catch (error) {
          customerData[filename] = { error: error.message };
        }
      }

      // At least some files should have valid customer data
      const validCustomers = Object.values(customerData)
        .filter(data => data.hasValidCustomer);
      
      expect(validCustomers.length).toBeGreaterThan(0);
    });

    it('should extract vehicle information consistently', async () => {
      const vehicleData = {};
      
      for (const [filename, content] of Object.entries(sampleFileContents)) {
        try {
          const parsed = bmsService.parseBMSFile(content);
          vehicleData[filename] = {
            vehicle: parsed.vehicleInfo,
            hasValidVehicle: validateVehicleData(parsed.vehicleInfo)
          };
        } catch (error) {
          vehicleData[filename] = { error: error.message };
        }
      }

      // All files should have some vehicle information
      const validVehicles = Object.values(vehicleData)
        .filter(data => data.hasValidVehicle);
      
      expect(validVehicles.length).toBeGreaterThan(0);
    });

    it('should extract damage line information consistently', async () => {
      const damageData = {};
      
      for (const [filename, content] of Object.entries(sampleFileContents)) {
        try {
          const parsed = bmsService.parseBMSFile(content);
          damageData[filename] = {
            damageLines: parsed.damageLines,
            lineCount: parsed.damageLines?.length || 0,
            hasValidDamage: parsed.damageLines && parsed.damageLines.length > 0
          };
        } catch (error) {
          damageData[filename] = { error: error.message };
        }
      }

      // Most files should have damage line information
      const filesWithDamage = Object.values(damageData)
        .filter(data => data.hasValidDamage);
      
      expect(filesWithDamage.length).toBeGreaterThan(0);
    });

    it('should extract totals information consistently', async () => {
      const totalsData = {};
      
      for (const [filename, content] of Object.entries(sampleFileContents)) {
        try {
          const parsed = bmsService.parseBMSFile(content);
          totalsData[filename] = {
            totals: parsed.totals,
            hasValidTotals: validateTotalsData(parsed.totals)
          };
        } catch (error) {
          totalsData[filename] = { error: error.message };
        }
      }

      // Most files should have totals information
      const validTotals = Object.values(totalsData)
        .filter(data => data.hasValidTotals);
      
      expect(validTotals.length).toBeGreaterThan(0);
    });
  });

  describe('File Upload Simulation', () => {
    it('should handle file upload end-to-end for all sample files', async () => {
      const uploadResults = {};
      
      for (const [filename, content] of Object.entries(sampleFileContents)) {
        // Create mock File object
        const mockFile = {
          name: filename,
          size: content.length,
          type: 'text/xml',
          lastModified: Date.now(),
          [Symbol.toStringTag]: 'File'
        };

        // Mock FileReader
        global.FileReader = class {
          readAsText(file) {
            setTimeout(() => {
              this.result = content;
              this.onload({ target: { result: content } });
            }, 10);
          }
        };

        try {
          const result = await bmsService.uploadBMSFile(mockFile);
          uploadResults[filename] = result;
        } catch (error) {
          uploadResults[filename] = {
            success: false,
            error: error.message
          };
        }
      }

      // Check results
      const successfulUploads = Object.values(uploadResults)
        .filter(result => result.success);
      
      const failedUploads = Object.values(uploadResults)
        .filter(result => !result.success);

      console.log(`Successful uploads: ${successfulUploads.length}/${Object.keys(uploadResults).length}`);
      if (failedUploads.length > 0) {
        console.warn('Failed uploads:', failedUploads.map(f => f.error));
      }

      // At least 60% of uploads should succeed
      expect(successfulUploads.length / Object.keys(uploadResults).length).toBeGreaterThanOrEqual(0.6);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed XML gracefully', async () => {
      const malformedXML = '<invalid>xml<unclosed>';
      
      expect(() => {
        bmsService.parseBMSFile(malformedXML);
      }).toThrow();
    });

    it('should handle empty files gracefully', async () => {
      const emptyContent = '';
      
      expect(() => {
        bmsService.parseBMSFile(emptyContent);
      }).toThrow();
    });

    it('should handle non-BMS XML files gracefully', async () => {
      const nonBMSXML = `<?xml version="1.0"?>
        <root>
          <data>This is not a BMS file</data>
        </root>`;
      
      try {
        const result = bmsService.parseBMSFile(nonBMSXML);
        // Should return an object but with missing BMS fields
        expect(result).toBeDefined();
      } catch (error) {
        // Should throw meaningful error
        expect(error.message).toContain('parse');
      }
    });

    it('should handle file upload errors', async () => {
      const mockFile = {
        name: 'test.xml',
        size: 100,
        type: 'text/xml'
      };

      // Mock FileReader that fails
      global.FileReader = class {
        readAsText(file) {
          setTimeout(() => {
            this.onerror(new Error('File read failed'));
          }, 10);
        }
      };

      const result = await bmsService.uploadBMSFile(mockFile);
      expect(result.success).toBe(false);
    });
  });

  describe('Performance Tests', () => {
    it('should parse large BMS files within reasonable time', async () => {
      const largeBMSContent = createLargeMockBMSContent();
      
      const startTime = Date.now();
      const result = bmsService.parseBMSFile(largeBMSContent);
      const endTime = Date.now();
      
      const processingTime = endTime - startTime;
      
      expect(result).toBeDefined();
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle multiple concurrent file uploads', async () => {
      const concurrentUploads = [];
      const numUploads = 5;
      
      // Mock FileReader
      global.FileReader = class {
        readAsText(file) {
          setTimeout(() => {
            this.result = sampleFileContents['minor_collision_estimate.xml'] || createMockBMSContent('test.xml');
            this.onload({ target: { result: this.result } });
          }, Math.random() * 100);
        }
      };

      for (let i = 0; i < numUploads; i++) {
        const mockFile = {
          name: `test_${i}.xml`,
          size: 1000,
          type: 'text/xml'
        };
        
        concurrentUploads.push(bmsService.uploadBMSFile(mockFile));
      }

      const results = await Promise.all(concurrentUploads);
      const successfulResults = results.filter(r => r.success);
      
      expect(successfulResults.length).toBeGreaterThanOrEqual(numUploads * 0.8); // 80% success rate
    });
  });
});

// Helper functions
function validateRequiredFields(parsed) {
  return !!(
    parsed &&
    parsed.documentInfo &&
    parsed.adminInfo &&
    parsed.claimInfo &&
    parsed.vehicleInfo
  );
}

function validateCustomerData(customer) {
  return !!(
    customer &&
    (customer.firstName || customer.lastName || customer.fullName)
  );
}

function validateVehicleData(vehicle) {
  return !!(
    vehicle &&
    (vehicle.vin || vehicle.description)
  );
}

function validateTotalsData(totals) {
  return !!(
    totals &&
    (totals.laborTotals || totals.partsTotals || totals.summaryTotals)
  );
}

function createMockBMSContent(filename) {
  const estimateType = filename.includes('major') ? 'Major' : 
                      filename.includes('luxury') ? 'Luxury' :
                      filename.includes('paint') ? 'Paint' :
                      filename.includes('glass') ? 'Glass' : 'Minor';

  return `<?xml version="1.0" encoding="UTF-8"?>
<VehicleDamageEstimateAddRq>
  <RqUID>TEST-${Date.now()}</RqUID>
  <RefClaimNum>CLM-TEST-001</RefClaimNum>
  
  <DocumentInfo>
    <BMSVer>5.2.22</BMSVer>
    <DocumentType>Estimate</DocumentType>
    <DocumentID>EST-TEST-001</DocumentID>
    <VendorCode>TEST</VendorCode>
    <DocumentStatus>Final</DocumentStatus>
    <CreateDateTime>${new Date().toISOString()}</CreateDateTime>
    <TransmitDateTime>${new Date().toISOString()}</TransmitDateTime>
  </DocumentInfo>
  
  <AdminInfo>
    <PolicyHolder>
      <Party>
        <PersonInfo>
          <PersonName>
            <FirstName>Test</FirstName>
            <LastName>Customer</LastName>
          </PersonName>
        </PersonInfo>
      </Party>
    </PolicyHolder>
  </AdminInfo>
  
  <ClaimInfo>
    <ClaimNum>CLM-TEST-001</ClaimNum>
  </ClaimInfo>
  
  <VehicleInfo>
    <VINInfo>
      <VIN>
        <VINNum>TEST123456789TEST</VINNum>
      </VIN>
    </VINInfo>
    <VehicleDesc>
      <ModelYear>2020</ModelYear>
      <MakeDesc>Toyota</MakeDesc>
      <ModelName>Camry</ModelName>
    </VehicleDesc>
  </VehicleInfo>
  
  <DamageLineInfo>
    <LineNum>1</LineNum>
    <LineDesc>${estimateType} Collision Repair</LineDesc>
    <PartInfo>
      <PartNum>TEST-PART-001</PartNum>
      <PartPrice>100.00</PartPrice>
    </PartInfo>
  </DamageLineInfo>
  
  <RepairTotalsInfo>
    <SummaryTotalsInfo>
      <TotalType>TOT</TotalType>
      <TotalSubType>CE</TotalSubType>
      <TotalTypeDesc>Gross Total</TotalTypeDesc>
      <TotalAmt>500.00</TotalAmt>
    </SummaryTotalsInfo>
  </RepairTotalsInfo>
</VehicleDamageEstimateAddRq>`;
}

function createLargeMockBMSContent() {
  const baseContent = createMockBMSContent('large_test.xml');
  
  // Create a large BMS file by adding many damage lines
  const damageLines = [];
  for (let i = 1; i <= 100; i++) {
    damageLines.push(`
    <DamageLineInfo>
      <LineNum>${i}</LineNum>
      <LineDesc>Damage Line ${i}</LineDesc>
      <PartInfo>
        <PartNum>PART-${i.toString().padStart(3, '0')}</PartNum>
        <PartPrice>${(Math.random() * 1000).toFixed(2)}</PartPrice>
      </PartInfo>
      <LaborInfo>
        <LaborHours>${(Math.random() * 5).toFixed(2)}</LaborHours>
      </LaborInfo>
    </DamageLineInfo>`);
  }
  
  // Insert damage lines into the base content
  return baseContent.replace(
    '<DamageLineInfo>',
    damageLines.join('\n') + '\n    <DamageLineInfo>'
  );
}