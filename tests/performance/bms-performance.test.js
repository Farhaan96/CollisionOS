/**
 * BMS Performance Tests
 * Tests performance characteristics of BMS import functionality
 */

import bmsService from '../../src/services/bmsService';

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  SINGLE_FILE_PARSE: 1000,     // 1 second for single file parsing
  LARGE_FILE_PARSE: 5000,      // 5 seconds for large file parsing
  CONCURRENT_UPLOADS: 10000,   // 10 seconds for 10 concurrent uploads
  DATABASE_SAVE: 2000,         // 2 seconds for database save operation
  MEMORY_USAGE: 100 * 1024 * 1024  // 100MB memory usage limit
};

describe('BMS Performance Tests', () => {
  // Helper function to measure execution time
  const measureTime = async (fn) => {
    const start = process.hrtime.bigint();
    const result = await fn();
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    return { result, duration };
  };

  // Helper function to measure memory usage
  const measureMemory = () => {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage();
    }
    return null;
  };

  // Generate test BMS content of various sizes
  const generateBMSContent = (size = 'small') => {
    const baseContent = `<?xml version="1.0" encoding="UTF-8"?>
<VehicleDamageEstimateAddRq>
  <RqUID>PERF-TEST-${Date.now()}</RqUID>
  <RefClaimNum>CLM-PERF-001</RefClaimNum>
  
  <DocumentInfo>
    <BMSVer>5.2.22</BMSVer>
    <DocumentType>Estimate</DocumentType>
    <DocumentID>EST-PERF-001</DocumentID>
    <VendorCode>PERF</VendorCode>
    <DocumentStatus>Final</DocumentStatus>
    <CreateDateTime>${new Date().toISOString()}</CreateDateTime>
    <TransmitDateTime>${new Date().toISOString()}</TransmitDateTime>
  </DocumentInfo>
  
  <AdminInfo>
    <InsuranceCompany>
      <Party>
        <OrgInfo>
          <CompanyName>Performance Test Insurance</CompanyName>
        </OrgInfo>
      </Party>
    </InsuranceCompany>
    <PolicyHolder>
      <Party>
        <PersonInfo>
          <PersonName>
            <FirstName>Performance</FirstName>
            <LastName>TestCustomer</LastName>
          </PersonName>
        </PersonInfo>
      </Party>
    </PolicyHolder>
  </AdminInfo>
  
  <ClaimInfo>
    <ClaimNum>CLM-PERF-001</ClaimNum>
  </ClaimInfo>
  
  <VehicleInfo>
    <VINInfo>
      <VIN>
        <VINNum>PERFTEST123456789</VINNum>
      </VIN>
    </VINInfo>
    <VehicleDesc>
      <ModelYear>2023</ModelYear>
      <MakeDesc>Performance</MakeDesc>
      <ModelName>TestCar</ModelName>
    </VehicleDesc>
  </VehicleInfo>`;

    let damageLines = '';
    const lineCount = size === 'small' ? 5 : 
                     size === 'medium' ? 50 : 
                     size === 'large' ? 500 : 
                     size === 'xlarge' ? 2000 : 5;

    for (let i = 1; i <= lineCount; i++) {
      damageLines += `
  <DamageLineInfo>
    <LineNum>${i}</LineNum>
    <UniqueSequenceNum>${i + 1000}</UniqueSequenceNum>
    <LineDesc>Performance Test Damage Line ${i}</LineDesc>
    <LineHeaderDesc>Performance Section ${Math.ceil(i / 10)}</LineHeaderDesc>
    <LineType>REPAIR</LineType>
    <PartInfo>
      <PartSourceCode>OEM</PartSourceCode>
      <PartType>BODY</PartType>
      <PartNum>PERF-PART-${i.toString().padStart(4, '0')}</PartNum>
      <OEMPartNum>OEM-${i.toString().padStart(6, '0')}</OEMPartNum>
      <PartPrice>${(Math.random() * 1000).toFixed(2)}</PartPrice>
      <OEMPartPrice>${(Math.random() * 1500).toFixed(2)}</OEMPartPrice>
      <Quantity>1</Quantity>
      <TaxableInd>1</TaxableInd>
    </PartInfo>
    <LaborInfo>
      <LaborType>BODY</LaborType>
      <LaborOperation>REPAIR</LaborOperation>
      <LaborHours>${(Math.random() * 10).toFixed(2)}</LaborHours>
      <DatabaseLaborHours>${(Math.random() * 10).toFixed(2)}</DatabaseLaborHours>
      <LaborInclInd>0</LaborInclInd>
      <TaxableInd>1</TaxableInd>
    </LaborInfo>
    <OtherChargesInfo>
      <OtherChargesType>MATERIAL</OtherChargesType>
      <Price>${(Math.random() * 100).toFixed(2)}</Price>
      <TaxableInd>1</TaxableInd>
    </OtherChargesInfo>
  </DamageLineInfo>`;
    }

    const totalsContent = `
  <RepairTotalsInfo>
    <LaborTotalsInfo>
      <TotalType>LA</TotalType>
      <TotalTypeDesc>Labor</TotalTypeDesc>
      <TaxableAmt>${(lineCount * 200).toFixed(2)}</TaxableAmt>
      <TaxTotalAmt>${(lineCount * 20).toFixed(2)}</TaxTotalAmt>
      <TotalAmt>${(lineCount * 220).toFixed(2)}</TotalAmt>
    </LaborTotalsInfo>
    <PartsTotalsInfo>
      <TotalType>PA</TotalType>
      <TotalTypeDesc>Parts</TotalTypeDesc>
      <TaxableAmt>${(lineCount * 300).toFixed(2)}</TaxableAmt>
      <TaxTotalAmt>${(lineCount * 30).toFixed(2)}</TaxTotalAmt>
      <TotalAmt>${(lineCount * 330).toFixed(2)}</TotalAmt>
    </PartsTotalsInfo>
    <OtherChargesTotalsInfo>
      <TotalType>OC</TotalType>
      <TotalTypeDesc>Other Charges</TotalTypeDesc>
      <TaxableAmt>${(lineCount * 50).toFixed(2)}</TaxableAmt>
      <TaxTotalAmt>${(lineCount * 5).toFixed(2)}</TaxTotalAmt>
      <TotalAmt>${(lineCount * 55).toFixed(2)}</TotalAmt>
    </OtherChargesTotalsInfo>
    <SummaryTotalsInfo>
      <TotalType>TOT</TotalType>
      <TotalSubType>CE</TotalSubType>
      <TotalTypeDesc>Gross Total</TotalTypeDesc>
      <TotalAmt>${(lineCount * 605).toFixed(2)}</TotalAmt>
    </SummaryTotalsInfo>
  </RepairTotalsInfo>`;

    return baseContent + damageLines + totalsContent + '\n</VehicleDamageEstimateAddRq>';
  };

  describe('Parse Performance', () => {
    it('should parse small BMS files within performance threshold', async () => {
      const smallContent = generateBMSContent('small');
      
      const { result, duration } = await measureTime(async () => {
        return bmsService.parseBMSFile(smallContent);
      });

      expect(result).toBeDefined();
      expect(result.documentInfo).toBeDefined();
      expect(result.damageLines).toHaveLength(5);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SINGLE_FILE_PARSE);
      
      console.log(`✅ Small file parse time: ${duration.toFixed(2)}ms`);
    });

    it('should parse medium BMS files within reasonable time', async () => {
      const mediumContent = generateBMSContent('medium');
      
      const { result, duration } = await measureTime(async () => {
        return bmsService.parseBMSFile(mediumContent);
      });

      expect(result).toBeDefined();
      expect(result.damageLines).toHaveLength(50);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SINGLE_FILE_PARSE * 2);
      
      console.log(`✅ Medium file parse time: ${duration.toFixed(2)}ms`);
    });

    it('should parse large BMS files within performance threshold', async () => {
      const largeContent = generateBMSContent('large');
      
      const { result, duration } = await measureTime(async () => {
        return bmsService.parseBMSFile(largeContent);
      });

      expect(result).toBeDefined();
      expect(result.damageLines).toHaveLength(500);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_FILE_PARSE);
      
      console.log(`✅ Large file parse time: ${duration.toFixed(2)}ms`);
    });

    it('should handle extra-large BMS files without timing out', async () => {
      const xlargeContent = generateBMSContent('xlarge');
      
      const { result, duration } = await measureTime(async () => {
        return bmsService.parseBMSFile(xlargeContent);
      });

      expect(result).toBeDefined();
      expect(result.damageLines).toHaveLength(2000);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_FILE_PARSE * 2);
      
      console.log(`✅ Extra-large file parse time: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not consume excessive memory during parsing', async () => {
      const initialMemory = measureMemory();
      
      // Parse multiple large files sequentially
      for (let i = 0; i < 5; i++) {
        const content = generateBMSContent('large');
        await bmsService.parseBMSFile(content);
      }

      const finalMemory = measureMemory();
      
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
        
        // Memory increase should be reasonable
        expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_USAGE);
      }
    });

    it('should garbage collect properly after parsing', async () => {
      const initialMemory = measureMemory();
      
      // Create a large number of temporary parsing operations
      const promises = [];
      for (let i = 0; i < 10; i++) {
        const content = generateBMSContent('medium');
        promises.push(bmsService.parseBMSFile(content));
      }
      
      await Promise.all(promises);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const finalMemory = measureMemory();
      
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        console.log(`Memory increase after GC: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
        
        // Should not have significant memory leaks
        expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_USAGE / 2);
      }
    });
  });

  describe('Concurrent Processing Tests', () => {
    it('should handle multiple concurrent file uploads efficiently', async () => {
      // Create multiple mock files
      const fileCount = 10;
      const mockFiles = [];
      
      for (let i = 0; i < fileCount; i++) {
        mockFiles.push({
          name: `concurrent_test_${i}.xml`,
          content: generateBMSContent('small'),
          size: 1000 + i * 100,
          type: 'text/xml'
        });
      }

      // Mock FileReader for concurrent tests
      global.FileReader = class {
        constructor() {
          this.onload = null;
          this.onerror = null;
          this.result = null;
        }
        
        readAsText(file) {
          setTimeout(() => {
            const mockFile = mockFiles.find(f => f.name === file.name);
            this.result = mockFile ? mockFile.content : '<xml>test</xml>';
            if (this.onload) {
              this.onload({ target: { result: this.result } });
            }
          }, Math.random() * 50); // Random delay 0-50ms
        }
      };

      const { result, duration } = await measureTime(async () => {
        const uploadPromises = mockFiles.map(mockFile => {
          return bmsService.uploadBMSFile(mockFile);
        });
        
        return Promise.all(uploadPromises);
      });

      expect(result).toHaveLength(fileCount);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.CONCURRENT_UPLOADS);
      
      const successCount = result.filter(r => r.success).length;
      expect(successCount).toBeGreaterThanOrEqual(fileCount * 0.8); // 80% success rate
      
      console.log(`✅ Concurrent processing: ${successCount}/${fileCount} files in ${duration.toFixed(2)}ms`);
    });

    it('should maintain performance under load', async () => {
      const batchSize = 5;
      const batchCount = 3;
      const results = [];

      for (let batch = 0; batch < batchCount; batch++) {
        const batchFiles = [];
        for (let i = 0; i < batchSize; i++) {
          batchFiles.push({
            name: `load_test_batch${batch}_file${i}.xml`,
            content: generateBMSContent('medium'),
            size: 5000,
            type: 'text/xml'
          });
        }

        global.FileReader = class {
          constructor() {
            this.onload = null;
            this.onerror = null;
            this.result = null;
          }
          
          readAsText(file) {
            setTimeout(() => {
              const mockFile = batchFiles.find(f => f.name === file.name);
              this.result = mockFile ? mockFile.content : '<xml>test</xml>';
              if (this.onload) {
                this.onload({ target: { result: this.result } });
              }
            }, 10);
          }
        };

        const { result: batchResult, duration } = await measureTime(async () => {
          const promises = batchFiles.map(file => bmsService.uploadBMSFile(file));
          return Promise.all(promises);
        });

        results.push({ batch, duration, successCount: batchResult.filter(r => r.success).length });
        console.log(`Batch ${batch}: ${duration.toFixed(2)}ms`);
      }

      // Performance should remain consistent across batches
      const durations = results.map(r => r.duration);
      const avgDuration = durations.reduce((a, b) => a + b) / durations.length;
      const maxDuration = Math.max(...durations);
      
      // Max duration shouldn't be more than 2x average (indicating performance degradation)
      expect(maxDuration).toBeLessThan(avgDuration * 2);
      
      console.log(`✅ Load test completed - Average: ${avgDuration.toFixed(2)}ms, Max: ${maxDuration.toFixed(2)}ms`);
    });
  });

  describe('Database Performance Tests', () => {
    it('should save BMS data to database within performance threshold', async () => {
      const testContent = generateBMSContent('medium');
      const parsedData = bmsService.parseBMSFile(testContent);

      const { duration } = await measureTime(async () => {
        return bmsService.saveBMSData(parsedData);
      });

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_SAVE);
      console.log(`✅ Database save time: ${duration.toFixed(2)}ms`);
    });

    it('should handle multiple database saves efficiently', async () => {
      const testCount = 5;
      const testData = [];
      
      for (let i = 0; i < testCount; i++) {
        const content = generateBMSContent('small');
        testData.push(bmsService.parseBMSFile(content));
      }

      const { duration } = await measureTime(async () => {
        const savePromises = testData.map(data => bmsService.saveBMSData(data));
        return Promise.all(savePromises);
      });

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_SAVE * testCount);
      console.log(`✅ Multiple database saves: ${testCount} records in ${duration.toFixed(2)}ms`);
    });
  });

  describe('Error Handling Performance', () => {
    it('should fail fast on invalid XML', async () => {
      const invalidXML = '<invalid>xml<unclosed>';
      
      const { duration } = await measureTime(async () => {
        try {
          return bmsService.parseBMSFile(invalidXML);
        } catch (error) {
          return { error: error.message };
        }
      });

      expect(duration).toBeLessThan(100); // Should fail very quickly
      console.log(`✅ Fast failure time: ${duration.toFixed(2)}ms`);
    });

    it('should handle parsing errors efficiently', async () => {
      const corruptedXML = generateBMSContent('large').replace(/<\/VehicleInfo>/g, '');
      
      const { duration } = await measureTime(async () => {
        try {
          return bmsService.parseBMSFile(corruptedXML);
        } catch (error) {
          return { error: error.message };
        }
      });

      expect(duration).toBeLessThan(500); // Should detect corruption quickly
      console.log(`✅ Error detection time: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Scalability Tests', () => {
    it('should maintain linear performance scaling', async () => {
      const sizes = [10, 50, 100, 200];
      const results = [];

      for (const size of sizes) {
        const content = generateBMSContent('custom');
        const customContent = content.replace(
          /<DamageLineInfo>[\s\S]*?<\/DamageLineInfo>/g,
          Array(size).fill('<DamageLineInfo><LineNum>1</LineNum><LineDesc>Test</LineDesc></DamageLineInfo>').join('')
        );

        const { duration } = await measureTime(async () => {
          return bmsService.parseBMSFile(customContent);
        });

        results.push({ size, duration });
        console.log(`Size ${size}: ${duration.toFixed(2)}ms`);
      }

      // Check that performance scales reasonably (not exponentially)
      const ratios = [];
      for (let i = 1; i < results.length; i++) {
        const ratio = results[i].duration / results[i-1].duration;
        const sizeRatio = results[i].size / results[i-1].size;
        ratios.push(ratio / sizeRatio);
      }

      const avgRatio = ratios.reduce((a, b) => a + b) / ratios.length;
      expect(avgRatio).toBeLessThan(2); // Performance should scale roughly linearly
      
      console.log(`✅ Scalability test completed - Average scaling ratio: ${avgRatio.toFixed(2)}`);
    });
  });

  afterEach(() => {
    // Clean up mocks
    delete global.FileReader;
  });
});