import bmsService from '../../../src/services/bmsService';

// Mock XML content from a sample BMS file
const mockBMSXML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<VehicleDamageEstimateAddRq xmlns="http://www.cieca.com/BMS">
  <RqUID xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">test-uuid-123</RqUID>
  <RefClaimNum>CX52401-1-A</RefClaimNum>
  <DocumentInfo>
    <BMSVer>5.2.22</BMSVer>
    <DocumentType xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">E</DocumentType>
    <DocumentID>CX52401-1-A20250721224658</DocumentID>
    <VendorCode>M</VendorCode>
    <DocumentStatus xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">C</DocumentStatus>
    <CreateDateTime>2025-08-25T09:30:24.853-07:00</CreateDateTime>
    <TransmitDateTime>2025-08-25T09:30:24.853-07:00</TransmitDateTime>
    <CurrencyInfo xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <CurCode>CAD</CurCode>
      <BaseCurCode>CAD</BaseCurCode>
      <CurRate>0.0</CurRate>
    </CurrencyInfo>
  </DocumentInfo>
  <AdminInfo>
    <InsuranceCompany>
      <Party>
        <OrgInfo>
          <CompanyName>Insurance Corporation of British Columbia</CompanyName>
        </OrgInfo>
      </Party>
    </InsuranceCompany>
    <PolicyHolder>
      <Party>
        <PersonInfo>
          <PersonName>
            <FirstName xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">JOHN</FirstName>
            <LastName xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">DOE</LastName>
          </PersonName>
          <Communications>
            <CommQualifier>AL</CommQualifier>
            <Address>
              <Address1>123 MAIN ST</Address1>
              <City>VANCOUVER</City>
              <StateProvince xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">BC</StateProvince>
              <PostalCode xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">V6B 1A1</PostalCode>
            </Address>
          </Communications>
        </PersonInfo>
        <ContactInfo>
          <Communications>
            <CommQualifier xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">HP</CommQualifier>
            <CommPhone xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">604-555-1234</CommPhone>
          </Communications>
        </ContactInfo>
      </Party>
    </PolicyHolder>
    <Estimator>
      <Party>
        <PersonInfo>
          <PersonName>
            <FirstName xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">Farhaan</FirstName>
            <LastName xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">Mohammed</LastName>
          </PersonName>
        </PersonInfo>
        <ContactInfo>
          <Communications>
            <CommQualifier xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">EM</CommQualifier>
            <CommEmail xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">sopronautobody@telus.net</CommEmail>
          </Communications>
        </ContactInfo>
      </Party>
      <Affiliation xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">69</Affiliation>
    </Estimator>
    <RepairFacility>
      <Party>
        <OrgInfo>
          <CompanyName>SOPRON AUTO BODY</CompanyName>
          <Communications>
            <CommQualifier>AL</CommQualifier>
            <Address>
              <Address1>11966 95 Ave</Address1>
              <City>Delta</City>
              <StateProvince xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">BC</StateProvince>
              <PostalCode xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">V4C 3T9</PostalCode>
            </Address>
          </Communications>
        </OrgInfo>
        <ContactInfo>
          <Communications>
            <CommQualifier xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">WP</CommQualifier>
            <CommPhone xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">604-5813717</CommPhone>
          </Communications>
        </ContactInfo>
      </Party>
    </RepairFacility>
  </AdminInfo>
  <ClaimInfo>
    <ClaimNum xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">CX52401-1-A</ClaimNum>
    <PolicyInfo>
      <PolicyNum xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">2O.F3O</PolicyNum>
      <CoverageInfo>
        <Coverage>
          <CoverageCategory xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">C</CoverageCategory>
          <DeductibleInfo>
            <DeductibleStatus xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">D2</DeductibleStatus>
            <DeductibleAmt>300.00</DeductibleAmt>
          </DeductibleInfo>
        </Coverage>
      </CoverageInfo>
    </PolicyInfo>
    <LossInfo>
      <Facts>
        <LossDateTime>2025-07-17T07:00:00Z</LossDateTime>
        <ReportedDateTime>2025-07-17T07:00:00Z</ReportedDateTime>
        <PrimaryPOI>
          <POICode>5</POICode>
        </PrimaryPOI>
        <DamageMemo>RR AREA , RR BUMPER</DamageMemo>
        <LossMemo>DAMAGE IS CONSISTENT WITH COLLISION</LossMemo>
      </Facts>
      <TotalLossInd xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">N</TotalLossInd>
    </LossInfo>
  </ClaimInfo>
  <VehicleInfo>
    <VINInfo>
      <VIN>
        <VINNum xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">JT2BG22K710532984</VINNum>
      </VIN>
    </VINInfo>
    <License>
      <LicensePlateNum xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">452JWF</LicensePlateNum>
      <LicensePlateStateProvince xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">BC</LicensePlateStateProvince>
    </License>
    <VehicleDesc>
      <ProductionDate xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">2000-09</ProductionDate>
      <ModelYear xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">2001</ModelYear>
      <MakeCode xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">45</MakeCode>
      <MakeDesc xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">Toyota</MakeDesc>
      <ModelNum xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">109</ModelNum>
      <ModelName xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">Camry</ModelName>
      <SubModelDesc>CE</SubModelDesc>
      <VehicleType xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">PC</VehicleType>
      <OdometerInfo>
        <OdometerInd>1</OdometerInd>
        <OdometerReading xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">212013</OdometerReading>
        <OdometerReadingMeasure xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">DK</OdometerReadingMeasure>
      </OdometerInfo>
    </VehicleDesc>
    <Paint>
      <Exterior>
        <Color>
          <ColorName>8N7 - Sailfin Blue Pearl</ColorName>
        </Color>
      </Exterior>
      <Interior>
        <Color>
          <ColorName xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">GREY</ColorName>
        </Color>
      </Interior>
    </Paint>
    <Body>
      <BodyStyle>4 Door Sedan</BodyStyle>
    </Body>
    <Powertrain>
      <EngineDesc>2.2L 4 Cyl Gas Injected</EngineDesc>
      <EngineCode>00099</EngineCode>
      <TransmissionInfo>
        <TransmissionCode>00004</TransmissionCode>
        <TransmissionDesc xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">4 Speed Auto Trans</TransmissionDesc>
      </TransmissionInfo>
      <FuelType>G</FuelType>
    </Powertrain>
    <Condition>
      <ConditionCode xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">GO</ConditionCode>
      <DrivableInd xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">Y</DrivableInd>
      <PriorDamageInd>N</PriorDamageInd>
    </Condition>
    <Valuation>
      <ValuationType>BKV</ValuationType>
      <ValuationAmt>2376.18</ValuationAmt>
    </Valuation>
  </VehicleInfo>
  <DamageLineInfo>
    <LineNum xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">1</LineNum>
    <UniqueSequenceNum xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">4</UniqueSequenceNum>
    <LineDesc xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">Rear Bumper Cover Assy</LineDesc>
    <LineHeaderDesc>Rear Bumper</LineHeaderDesc>
    <PartInfo>
      <PartSourceCode xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">99</PartSourceCode>
      <PartType xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">PAE</PartType>
      <PartNum>Existing</PartNum>
      <PartPrice>0.00</PartPrice>
      <OEMPartPrice>0.0</OEMPartPrice>
      <TaxableInd>0</TaxableInd>
    </PartInfo>
    <LaborInfo>
      <LaborType xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">LAB</LaborType>
      <LaborOperation xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">OP5</LaborOperation>
      <LaborHours>1.70</LaborHours>
      <DatabaseLaborHours>1.70</DatabaseLaborHours>
      <LaborHoursCalc>1.70</LaborHoursCalc>
      <LaborInclInd>0</LaborInclInd>
      <TaxableInd>1</TaxableInd>
    </LaborInfo>
  </DamageLineInfo>
  <DamageLineInfo>
    <LineNum xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">2</LineNum>
    <UniqueSequenceNum xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">1</UniqueSequenceNum>
    <LineDesc xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">Rear Bumper Cover</LineDesc>
    <LineHeaderDesc>Rear Bumper</LineHeaderDesc>
    <PartInfo>
      <PartSourceCode xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">04</PartSourceCode>
      <PartType xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">PAA</PartType>
      <PartNum>TY37-087-C0</PartNum>
      <OEMPartNum xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">52159-AA902</OEMPartNum>
      <PartPrice>210.01</PartPrice>
      <OEMPartPrice>745.08</OEMPartPrice>
      <TaxableInd>1</TaxableInd>
      <Quantity xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">1</Quantity>
    </PartInfo>
  </DamageLineInfo>
  <RepairTotalsInfo>
    <LaborTotalsInfo>
      <TotalType>LA</TotalType>
      <TotalTypeDesc>Labor</TotalTypeDesc>
      <TaxableAmt>152.13</TaxableAmt>
      <TaxTotalAmt>61.82</TaxTotalAmt>
      <TotalAmt>577.01</TotalAmt>
    </LaborTotalsInfo>
    <PartsTotalsInfo>
      <TotalType>PA</TotalType>
      <TotalTypeDesc>Parts</TotalTypeDesc>
      <TaxableAmt>210.01</TaxableAmt>
      <TaxTotalAmt>25.20</TaxTotalAmt>
      <TotalAmt>235.21</TotalAmt>
    </PartsTotalsInfo>
    <SummaryTotalsInfo>
      <TotalType>TOT</TotalType>
      <TotalSubType>CE</TotalSubType>
      <TotalTypeDesc>Gross Total</TotalTypeDesc>
      <TotalAmt>1125.63</TotalAmt>
    </SummaryTotalsInfo>
    <SummaryTotalsInfo>
      <TotalType>TOT</TotalType>
      <TotalSubType>TT</TotalSubType>
      <TotalTypeDesc>Net Total</TotalTypeDesc>
      <TotalAmt>825.63</TotalAmt>
    </SummaryTotalsInfo>
  </RepairTotalsInfo>
</VehicleDamageEstimateAddRq>`;

describe('BMSService', () => {
  describe('parseBMSFile', () => {
    it('should parse a valid BMS XML file', () => {
      const result = bmsService.parseBMSFile(mockBMSXML);

      expect(result).toBeDefined();
      expect(result.documentInfo).toBeDefined();
      expect(result.adminInfo).toBeDefined();
      expect(result.claimInfo).toBeDefined();
      expect(result.vehicleInfo).toBeDefined();
      expect(result.damageLines).toBeDefined();
      expect(result.totals).toBeDefined();
    });

    it('should extract document information correctly', () => {
      const result = bmsService.parseBMSFile(mockBMSXML);

      expect(result.documentInfo.bmsVersion).toBe('5.2.22');
      expect(result.documentInfo.documentType).toBe('E');
      expect(result.documentInfo.documentId).toBe('CX52401-1-A20250721224658');
      expect(result.documentInfo.claimNumber).toBe('CX52401-1-A');
      expect(result.documentInfo.currency.code).toBe('CAD');
    });

    it('should extract customer information correctly', () => {
      const result = bmsService.parseBMSFile(mockBMSXML);

      expect(result.adminInfo.policyHolder).toBeDefined();
      expect(result.adminInfo.policyHolder.firstName).toBe('JOHN');
      expect(result.adminInfo.policyHolder.lastName).toBe('DOE');
      expect(result.adminInfo.policyHolder.phone).toBe('604-555-1234');
      expect(result.adminInfo.policyHolder.address.city).toBe('VANCOUVER');
      expect(result.adminInfo.policyHolder.address.stateProvince).toBe('BC');
    });

    it('should extract vehicle information correctly', () => {
      const result = bmsService.parseBMSFile(mockBMSXML);

      expect(result.vehicleInfo.vin).toBe('JT2BG22K710532984');
      expect(result.vehicleInfo.license.plateNumber).toBe('452JWF');
      expect(result.vehicleInfo.license.stateProvince).toBe('BC');
      expect(result.vehicleInfo.description.modelYear).toBe('2001');
      expect(result.vehicleInfo.description.makeDesc).toBe('Toyota');
      expect(result.vehicleInfo.description.modelName).toBe('Camry');
      expect(result.vehicleInfo.description.bodyStyle).toBe('4 Door Sedan');
      expect(result.vehicleInfo.paint.exterior).toBe(
        '8N7 - Sailfin Blue Pearl'
      );
      expect(result.vehicleInfo.odometer.reading).toBe('212013');
    });

    it('should extract claim information correctly', () => {
      const result = bmsService.parseBMSFile(mockBMSXML);

      expect(result.claimInfo.claimNumber).toBe('CX52401-1-A');
      expect(result.claimInfo.policyNumber).toBe('2O.F3O');
      expect(result.claimInfo.coverage.deductible.amount).toBe('300.00');
      expect(result.claimInfo.loss.damageMemo).toBe('RR AREA , RR BUMPER');
      expect(result.claimInfo.loss.totalLoss).toBe(false);
    });

    it('should extract damage line items correctly', () => {
      const result = bmsService.parseBMSFile(mockBMSXML);

      expect(result.damageLines).toHaveLength(2);

      const firstLine = result.damageLines[0];
      expect(firstLine.lineNum).toBe(1);
      expect(firstLine.lineDesc).toBe('Rear Bumper Cover Assy');
      expect(firstLine.partInfo.partNum).toBe('Existing');
      expect(firstLine.laborInfo.laborHours).toBe('1.70');

      const secondLine = result.damageLines[1];
      expect(secondLine.lineNum).toBe(2);
      expect(secondLine.lineDesc).toBe('Rear Bumper Cover');
      expect(secondLine.partInfo.partNum).toBe('TY37-087-C0');
      expect(secondLine.partInfo.partPrice).toBe('210.01');
    });

    it('should extract totals correctly', () => {
      const result = bmsService.parseBMSFile(mockBMSXML);

      expect(result.totals.laborTotals.totalAmt).toBe('577.01');
      expect(result.totals.partsTotals.totalAmt).toBe('235.21');

      const grossTotal = result.totals.summaryTotals.find(
        t => t.totalSubType === 'CE'
      );
      expect(grossTotal.totalAmt).toBe('1125.63');

      const netTotal = result.totals.summaryTotals.find(
        t => t.totalSubType === 'TT'
      );
      expect(netTotal.totalAmt).toBe('825.63');
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalXML = `<?xml version="1.0" encoding="UTF-8"?>
      <VehicleDamageEstimateAddRq xmlns="http://www.cieca.com/BMS">
        <RqUID>test</RqUID>
        <RefClaimNum>TEST-001</RefClaimNum>
        <DocumentInfo>
          <BMSVer>5.2.22</BMSVer>
          <DocumentID>TEST-001</DocumentID>
        </DocumentInfo>
      </VehicleDamageEstimateAddRq>`;

      const result = bmsService.parseBMSFile(minimalXML);

      expect(result).toBeDefined();
      expect(result.documentInfo.claimNumber).toBe('TEST-001');
      expect(result.adminInfo.policyHolder).toBeNull();
      expect(result.vehicleInfo).toBeDefined();
      expect(result.damageLines).toHaveLength(0);
    });

    it('should throw error for invalid XML', () => {
      const invalidXML = '<invalid>xml</invalid>';

      expect(() => {
        bmsService.parseBMSFile(invalidXML);
      }).toThrow('Failed to parse BMS file');
    });
  });

  describe('uploadBMSFile', () => {
    it('should process a file successfully', async () => {
      const mockFile = new File([mockBMSXML], 'test.bms.xml', {
        type: 'text/xml',
      });

      const result = await bmsService.uploadBMSFile(mockFile);

      expect(result.success).toBe(true);
      expect(result.message).toBe('BMS file processed successfully');
      expect(result.data).toBeDefined();
    });

    it('should handle file reading errors', async () => {
      const mockFile = {
        name: 'test.xml',
        size: 100,
        type: 'text/xml',
      };

      const result = await bmsService.uploadBMSFile(mockFile);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to process BMS file');
    });
  });

  describe('extractPartyInfo', () => {
    it('should extract person information correctly', () => {
      const personParty = {
        PersonInfo: {
          PersonName: {
            FirstName: 'John',
            LastName: 'Doe',
          },
          Communications: {
            CommQualifier: 'AL',
            Address: {
              Address1: '123 Main St',
              City: 'Vancouver',
              StateProvince: 'BC',
              PostalCode: 'V6B 1A1',
            },
          },
        },
        ContactInfo: {
          Communications: {
            CommQualifier: 'HP',
            CommPhone: '604-555-1234',
          },
        },
      };

      const result = bmsService.extractPartyInfo(personParty);

      expect(result.type).toBe('person');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.fullName).toBe('John Doe');
      expect(result.phone).toBe('604-555-1234');
      expect(result.address.address1).toBe('123 Main St');
    });

    it('should extract organization information correctly', () => {
      const orgParty = {
        OrgInfo: {
          CompanyName: 'Test Company',
          Communications: {
            CommQualifier: 'AL',
            Address: {
              Address1: '456 Business Ave',
              City: 'Toronto',
              StateProvince: 'ON',
              PostalCode: 'M5V 2H1',
            },
          },
        },
        ContactInfo: {
          Communications: {
            CommQualifier: 'WP',
            CommPhone: '416-555-5678',
          },
        },
      };

      const result = bmsService.extractPartyInfo(orgParty);

      expect(result.type).toBe('organization');
      expect(result.companyName).toBe('Test Company');
      expect(result.phone).toBe('416-555-5678');
      expect(result.address.city).toBe('Toronto');
    });
  });

  describe('extractDamageLines', () => {
    it('should handle single damage line', () => {
      const bmsData = {
        DamageLineInfo: {
          LineNum: 1,
          LineDesc: 'Test Part',
          PartInfo: {
            PartNum: 'TEST-001',
            PartPrice: '100.00',
          },
        },
      };

      const result = bmsService.extractDamageLines(bmsData);

      expect(result).toHaveLength(1);
      expect(result[0].lineNum).toBe(1);
      expect(result[0].lineDesc).toBe('Test Part');
    });

    it('should handle multiple damage lines', () => {
      const bmsData = {
        DamageLineInfo: [
          {
            LineNum: 1,
            LineDesc: 'Part 1',
            PartInfo: { PartNum: 'P1' },
          },
          {
            LineNum: 2,
            LineDesc: 'Part 2',
            PartInfo: { PartNum: 'P2' },
          },
        ],
      };

      const result = bmsService.extractDamageLines(bmsData);

      expect(result).toHaveLength(2);
      expect(result[0].lineNum).toBe(1);
      expect(result[1].lineNum).toBe(2);
    });

    it('should handle missing damage lines', () => {
      const bmsData = {};

      const result = bmsService.extractDamageLines(bmsData);

      expect(result).toHaveLength(0);
    });
  });
});
