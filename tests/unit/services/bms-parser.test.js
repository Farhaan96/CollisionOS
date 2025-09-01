const {
  EnhancedBMSParser,
} = require('../../../server/services/import/bms_parser.ts');

describe('EnhancedBMSParser', () => {
  let parser;
  let sampleBMSXML;
  let malformedBMSXML;

  beforeEach(() => {
    parser = new EnhancedBMSParser();

    sampleBMSXML = `<?xml version="1.0" encoding="UTF-8"?>
    <VehicleDamageEstimateAddRq>
      <DocumentInfo>
        <DocumentID>EST123456</DocumentID>
        <DocumentType>Estimate</DocumentType>
        <VendorCode>Mitchell</VendorCode>
        <CreateDateTime>2025-01-15T10:30:00</CreateDateTime>
        <CurrencyInfo>
          <CurCode>USD</CurCode>
          <CurRate>1.0</CurRate>
        </CurrencyInfo>
      </DocumentInfo>
      <RefClaimNum>CLM789012</RefClaimNum>
      <AdminInfo>
        <PolicyHolder>
          <Party>
            <PersonInfo>
              <PersonName>
                <FirstName>John</FirstName>
                <LastName>Doe</LastName>
              </PersonName>
            </PersonInfo>
            <ContactInfo>
              <Communications>
                <CommQualifier>EM</CommQualifier>
                <CommEmail>john.doe@email.com</CommEmail>
              </Communications>
              <Communications>
                <CommQualifier>HP</CommQualifier>
                <CommPhone>555-123-4567</CommPhone>
              </Communications>
              <Communications>
                <CommQualifier>AL</CommQualifier>
                <Address>
                  <Address1>123 Main St</Address1>
                  <City>Toronto</City>
                  <StateProvince>ON</StateProvince>
                  <PostalCode>M5V 3A8</PostalCode>
                </Address>
              </Communications>
            </ContactInfo>
          </Party>
        </PolicyHolder>
        <InsuranceCompany>
          <Party>
            <OrgInfo>
              <CompanyName>Test Insurance Co.</CompanyName>
            </OrgInfo>
          </Party>
        </InsuranceCompany>
      </AdminInfo>
      <ClaimInfo>
        <ClaimNum>CLM789012</ClaimNum>
        <PolicyInfo>
          <PolicyNum>POL456789</PolicyNum>
          <CoverageInfo>
            <Coverage>
              <DeductibleInfo>
                <DeductibleAmt>500.00</DeductibleAmt>
              </DeductibleInfo>
            </Coverage>
          </CoverageInfo>
        </PolicyInfo>
        <CustomElement>
          <CustomElementID>GST_EXEMPT</CustomElementID>
          <CustomElementText>N</CustomElementText>
        </CustomElement>
      </ClaimInfo>
      <VehicleInfo>
        <VINInfo>
          <VIN>
            <VINNum>1HGCM82633A123456</VINNum>
          </VIN>
        </VINInfo>
        <License>
          <LicensePlateNum>ABC123</LicensePlateNum>
          <LicensePlateStateProvince>ON</LicensePlateStateProvince>
        </License>
        <VehicleDesc>
          <ModelYear>2020</ModelYear>
          <MakeDesc>Honda</MakeDesc>
          <ModelName>Civic</ModelName>
          <SubModelDesc>EX</SubModelDesc>
          <OdometerInfo>
            <OdometerReading>35000</OdometerReading>
            <OdometerReadingMeasure>miles</OdometerReadingMeasure>
          </OdometerInfo>
        </VehicleDesc>
        <Body>
          <BodyStyle>Sedan</BodyStyle>
        </Body>
        <Powertrain>
          <EngineDesc>2.0L I4</EngineDesc>
          <TransmissionInfo>
            <TransmissionDesc>CVT</TransmissionDesc>
          </TransmissionInfo>
          <FuelType>Gasoline</FuelType>
        </Powertrain>
        <Paint>
          <Exterior>
            <Color>
              <ColorName>Silver</ColorName>
            </Color>
          </Exterior>
          <Interior>
            <Color>
              <ColorName>Black</ColorName>
            </Color>
          </Interior>
        </Paint>
        <Condition>
          <ConditionCode>Good</ConditionCode>
          <DrivableInd>Y</DrivableInd>
          <PriorDamageInd>N</PriorDamageInd>
        </Condition>
      </VehicleInfo>
      <DamageLineInfo>
        <LineNum>1</LineNum>
        <UniqueSequenceNum>001</UniqueSequenceNum>
        <LineDesc>Front Bumper Cover</LineDesc>
        <LineType>Part</LineType>
        <PartInfo>
          <PartNum>04711-TBA-A90ZZ</PartNum>
          <OEMPartNum>04711-TBA-A90ZZ</OEMPartNum>
          <PartPrice>450.00</PartPrice>
          <Quantity>1</Quantity>
          <PartType>OEM</PartType>
          <PartSourceCode>OEM</PartSourceCode>
          <TaxableInd>1</TaxableInd>
        </PartInfo>
      </DamageLineInfo>
      <DamageLineInfo>
        <LineNum>2</LineNum>
        <UniqueSequenceNum>002</UniqueSequenceNum>
        <LineDesc>Paint Front Bumper</LineDesc>
        <LineType>Labor</LineType>
        <LaborInfo>
          <LaborType>Paint</LaborType>
          <LaborOperation>Paint Bumper Cover</LaborOperation>
          <LaborHours>3.5</LaborHours>
          <LaborRate>75.00</LaborRate>
          <TaxableInd>1</TaxableInd>
          <PaintStagesNum>3</PaintStagesNum>
        </LaborInfo>
      </DamageLineInfo>
      <RepairTotalsInfo>
        <PartsTotalsInfo>
          <TotalType>Parts</TotalType>
          <TaxableAmt>450.00</TaxableAmt>
          <TotalAmt>450.00</TotalAmt>
        </PartsTotalsInfo>
        <LaborTotalsInfo>
          <TotalType>Labor</TotalType>
          <TaxableAmt>262.50</TaxableAmt>
          <TotalAmt>262.50</TotalAmt>
        </LaborTotalsInfo>
        <SummaryTotalsInfo>
          <TotalType>Gross</TotalType>
          <TotalAmt>712.50</TotalAmt>
        </SummaryTotalsInfo>
      </RepairTotalsInfo>
    </VehicleDamageEstimateAddRq>`;

    malformedBMSXML = `<?xml version="1.0" encoding="UTF-8"?>
    <VehicleDamageEstimateAddRq>
      <DocumentInfo>
        <DocumentID>EST123456</DocumentID>
        <!-- Missing required elements -->
    </VehicleDamageEstimateAddRq>`;
  });

  describe('parseBMS', () => {
    it('should successfully parse a valid BMS XML file', async () => {
      const result = await parser.parseBMS(sampleBMSXML);

      expect(result).toHaveProperty('identities');
      expect(result).toHaveProperty('customer');
      expect(result).toHaveProperty('vehicle');
      expect(result).toHaveProperty('lines');
      expect(result).toHaveProperty('parts');
      expect(result).toHaveProperty('meta');

      // Check identities
      expect(result.identities.ro_number).toBe('EST123456');
      expect(result.identities.claim_number).toBe('CLM789012');
      expect(result.identities.vin).toBe('1HGCM82633A123456');

      // Check customer data
      expect(result.customer.firstName).toBe('John');
      expect(result.customer.lastName).toBe('Doe');
      expect(result.customer.email).toBe('john.doe@email.com');
      expect(result.customer.phone).toBe('555-123-4567');
      expect(result.customer.type).toBe('person');
      expect(result.customer.gst_payable).toBe(true);

      // Check vehicle data
      expect(result.vehicle.year).toBe(2020);
      expect(result.vehicle.make).toBe('Honda');
      expect(result.vehicle.model).toBe('Civic');
      expect(result.vehicle.vin).toBe('1HGCM82633A123456');
      expect(result.vehicle.odometer).toBe(35000);
      expect(result.vehicle.drivable).toBe(true);

      // Check estimate lines
      expect(result.lines).toHaveLength(2);
      expect(result.lines[0].lineNum).toBe(1);
      expect(result.lines[0].lineDesc).toBe('Front Bumper Cover');
      expect(result.lines[0].partInfo).toBeDefined();
      expect(result.lines[1].laborInfo).toBeDefined();

      // Check parts data
      expect(result.parts).toHaveLength(1);
      expect(result.parts[0].partNumber).toBe('04711-TBA-A90ZZ');
      expect(result.parts[0].description).toBe('Front Bumper Cover');

      // Check metadata
      expect(result.meta.source_system).toBe('Mitchell');
      expect(result.meta.import_timestamp).toBeInstanceOf(Date);
      expect(Array.isArray(result.meta.unknown_tags)).toBe(true);
    });

    it('should handle malformed XML gracefully', async () => {
      const invalidXML = '<invalid><xml>not closed';

      await expect(parser.parseBMS(invalidXML)).rejects.toThrow(
        'BMS parsing failed'
      );
    });

    it('should handle missing customer data with defaults', async () => {
      const minimalBMS = `<?xml version="1.0" encoding="UTF-8"?>
      <VehicleDamageEstimateAddRq>
        <DocumentInfo>
          <DocumentID>EST123456</DocumentID>
        </DocumentInfo>
        <VehicleInfo>
          <VINInfo>
            <VIN>
              <VINNum>1HGCM82633A123456</VINNum>
            </VIN>
          </VINInfo>
        </VehicleInfo>
      </VehicleDamageEstimateAddRq>`;

      const result = await parser.parseBMS(minimalBMS);

      expect(result.customer.firstName).toBe('Unknown');
      expect(result.customer.lastName).toBe('Customer');
      expect(result.customer.type).toBe('person');
      expect(result.customer.gst_payable).toBe(false);
    });

    it('should detect business customers and set GST payable', async () => {
      const businessBMS = `<?xml version="1.0" encoding="UTF-8"?>
      <VehicleDamageEstimateAddRq>
        <DocumentInfo>
          <DocumentID>EST123456</DocumentID>
        </DocumentInfo>
        <AdminInfo>
          <PolicyHolder>
            <Party>
              <OrgInfo>
                <CompanyName>ABC Corp</CompanyName>
              </OrgInfo>
            </Party>
          </PolicyHolder>
        </AdminInfo>
        <VehicleInfo>
          <VINInfo>
            <VIN>
              <VINNum>1HGCM82633A123456</VINNum>
            </VIN>
          </VINInfo>
        </VehicleInfo>
      </VehicleDamageEstimateAddRq>`;

      const result = await parser.parseBMS(businessBMS);

      expect(result.customer.type).toBe('organization');
      expect(result.customer.companyName).toBe('ABC Corp');
      expect(result.customer.gst_payable).toBe(true);
    });

    it('should handle alternative root element names', async () => {
      const alternativeRootBMS = sampleBMSXML.replace(
        'VehicleDamageEstimateAddRq',
        'VehicleDamageEstimate'
      );

      const result = await parser.parseBMS(alternativeRootBMS);

      expect(result.identities.ro_number).toBe('EST123456');
      expect(result.customer.firstName).toBe('John');
    });

    it('should track unknown tags', async () => {
      const bmsWithUnknownTags = `<?xml version="1.0" encoding="UTF-8"?>
      <UnknownRootElement>
        <DocumentInfo>
          <DocumentID>EST123456</DocumentID>
        </DocumentInfo>
      </UnknownRootElement>`;

      const result = await parser.parseBMS(bmsWithUnknownTags);

      expect(result.meta.unknown_tags.length).toBeGreaterThan(0);
      expect(
        result.meta.unknown_tags.some(tag => tag.includes('UnknownRootElement'))
      ).toBe(true);
    });

    it('should handle decimal amounts correctly', async () => {
      const result = await parser.parseBMS(sampleBMSXML);

      expect(result.lines[0].partInfo.price.toString()).toBe('450');
      expect(result.lines[1].laborInfo.hours.toString()).toBe('3.5');
      expect(result.lines[1].laborInfo.rate.toString()).toBe('75');
      expect(result.lines[1].amount.toString()).toBe('262.5');
    });

    it('should extract GST exemption from custom elements', async () => {
      const gstExemptBMS = sampleBMSXML.replace(
        '<CustomElementText>N</CustomElementText>',
        '<CustomElementText>Y</CustomElementText>'
      );

      const result = await parser.parseBMS(gstExemptBMS);

      expect(result.customer.gst_payable).toBe(false);
    });

    it('should handle empty or missing damage lines', async () => {
      const noDamageLinesBMS = `<?xml version="1.0" encoding="UTF-8"?>
      <VehicleDamageEstimateAddRq>
        <DocumentInfo>
          <DocumentID>EST123456</DocumentID>
        </DocumentInfo>
        <VehicleInfo>
          <VINInfo>
            <VIN>
              <VINNum>1HGCM82633A123456</VINNum>
            </VIN>
          </VINInfo>
        </VehicleInfo>
      </VehicleDamageEstimateAddRq>`;

      const result = await parser.parseBMS(noDamageLinesBMS);

      expect(result.lines).toHaveLength(0);
      expect(result.parts).toHaveLength(0);
    });
  });

  describe('getUnknownTags', () => {
    it('should return array of unknown tags encountered during parsing', async () => {
      await parser.parseBMS(sampleBMSXML);
      const unknownTags = parser.getUnknownTags();

      expect(Array.isArray(unknownTags)).toBe(true);
    });
  });

  describe('extractPartInfo', () => {
    it('should handle missing part information gracefully', () => {
      const partInfo = {
        PartNum: 'TEST-PART-123',
        PartPrice: '100.00',
        Quantity: '2',
      };

      // Use private method through reflection or create public test method
      const result = parser.extractPartInfo(partInfo);

      expect(result.partNumber).toBe('TEST-PART-123');
      expect(result.price.toString()).toBe('100');
      expect(result.quantity).toBe(2);
      expect(result.taxable).toBe(false); // Default when TaxableInd not specified
    });
  });

  describe('safeText extraction', () => {
    it('should handle various XML parser output formats', () => {
      // Test different value types that might come from XML parser
      expect(parser.safeText('simple string')).toBe('simple string');
      expect(parser.safeText(123)).toBe('123');
      expect(parser.safeText({ '#text': 'xml text node' })).toBe(
        'xml text node'
      );
      expect(parser.safeText(null)).toBe('');
      expect(parser.safeText(undefined)).toBe('');
      expect(parser.safeText({ complex: 'object' })).toBe(
        '{"complex":"object"}'
      );
    });
  });

  describe('safeNumber extraction', () => {
    it('should handle various numeric formats', () => {
      expect(parser.safeNumber('123.45')).toBe(123.45);
      expect(parser.safeNumber('$1,234.56')).toBe(1234.56);
      expect(parser.safeNumber(789)).toBe(789);
      expect(parser.safeNumber({ '#text': '456.78' })).toBe(456.78);
      expect(parser.safeNumber('invalid')).toBe(0);
      expect(parser.safeNumber(null)).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should provide meaningful error messages', async () => {
      const emptyString = '';

      await expect(parser.parseBMS(emptyString)).rejects.toThrow(
        'BMS parsing failed'
      );
    });

    it('should handle non-XML content', async () => {
      const nonXmlContent = 'This is not XML content';

      await expect(parser.parseBMS(nonXmlContent)).rejects.toThrow(
        'BMS parsing failed'
      );
    });
  });
});
