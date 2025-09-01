const { EMSParser } = require('../../../server/services/import/ems_parser.ts');

describe('EMSParser', () => {
  let parser;
  let sampleEMSContent;
  let minimalEMSContent;
  let malformedEMSContent;

  beforeEach(() => {
    parser = new EMSParser();

    sampleEMSContent = `HDR|1.0|Mitchell|UltraMate|20250115|103000
CLM|CLM789012|POL456789|500.00|20250101|John Smith|Test Insurance Co
CST|John|Doe|ABC Corp|123 Main St|Toronto|ON|M5V3A8|555-123-4567|john@email.com|N
VEH|1HGCM82633A123456|2020|Honda|Civic|EX|Sedan|Silver|ABC123|35000|2.0L I4|CVT|Gasoline
EST|EST123456|20250115|approved|262.50|450.00|50.00|762.50
LIN|1|Front Bumper Cover|part|450.00|Y|
LIN|2|Paint Front Bumper|labor|262.50|Y|1
LIN|3|Paint Materials|material|50.00|Y|
PRT|1|04711-TBA-A90ZZ|Front Bumper Cover|04711-TBA-A90ZZ|1|450.00|OEM|OEM|Y
LAB|2|Paint Bumper Cover|3.5|75.00|paint|Y|3
MTL|3|misc|Paint Materials|50.00|Y
TOT|parts||450.00|450.00|0.00
TOT|labor||262.50|262.50|0.00
TOT|materials||50.00|50.00|0.00
TOT|gross||762.50|762.50|0.00`;

    minimalEMSContent = `HDR|1.0|Unknown|Unknown|20250115|103000
CST|Unknown|Customer||||||||N
VEH||2020|Unknown|Unknown||||||0|||`;

    malformedEMSContent = `HDR|1.0|Mitchell
INVALID_RECORD_TYPE|some|data
CST|John|Doe|`;
  });

  describe('parseEMS', () => {
    it('should successfully parse a valid EMS file', async () => {
      const result = await parser.parseEMS(sampleEMSContent);

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
      expect(result.customer.companyName).toBe('ABC Corp');
      expect(result.customer.type).toBe('organization');
      expect(result.customer.gst_payable).toBe(true); // Business customer

      // Check vehicle data
      expect(result.vehicle.year).toBe(2020);
      expect(result.vehicle.make).toBe('Honda');
      expect(result.vehicle.model).toBe('Civic');
      expect(result.vehicle.vin).toBe('1HGCM82633A123456');
      expect(result.vehicle.odometer).toBe(35000);

      // Check estimate lines
      expect(result.lines).toHaveLength(3);
      expect(result.lines[0].lineNum).toBe(1);
      expect(result.lines[0].lineDesc).toBe('Front Bumper Cover');
      expect(result.lines[0].partInfo).toBeDefined();
      expect(result.lines[1].laborInfo).toBeDefined();
      expect(result.lines[2].otherChargesInfo).toBeDefined();

      // Check parts data
      expect(result.parts).toHaveLength(1);
      expect(result.parts[0].partNumber).toBe('04711-TBA-A90ZZ');

      // Check metadata
      expect(result.meta.source_system).toBe('Mitchell EMS');
      expect(result.meta.import_timestamp).toBeInstanceOf(Date);
      expect(Array.isArray(result.meta.unknown_tags)).toBe(true);
    });

    it('should handle minimal EMS content with defaults', async () => {
      const result = await parser.parseEMS(minimalEMSContent);

      expect(result.customer.firstName).toBe('Unknown');
      expect(result.customer.lastName).toBe('Customer');
      expect(result.customer.type).toBe('person');
      expect(result.customer.gst_payable).toBe(false);

      expect(result.vehicle.year).toBe(2020);
      expect(result.vehicle.make).toBe('Unknown');
      expect(result.vehicle.model).toBe('Unknown');
    });

    it('should handle malformed EMS content and track unknown records', async () => {
      const result = await parser.parseEMS(malformedEMSContent);

      expect(result.meta.unknown_tags.length).toBeGreaterThan(0);
      expect(
        result.meta.unknown_tags.some(tag =>
          tag.includes('INVALID_RECORD_TYPE')
        )
      ).toBe(true);
    });

    it('should detect different EMS source systems', async () => {
      const cccEMS = sampleEMSContent.replace('Mitchell|UltraMate', 'CCC|ONE');
      const result = await parser.parseEMS(cccEMS);

      expect(result.meta.source_system).toBe('CCC ONE EMS');
    });

    it('should handle empty lines and malformed records gracefully', async () => {
      const contentWithEmptyLines = `HDR|1.0|Mitchell|UltraMate|20250115|103000

CST|John|Doe||||||||N

VEH||2020|Honda|Civic||||||0|||`;

      const result = await parser.parseEMS(contentWithEmptyLines);

      expect(result.customer.firstName).toBe('John');
      expect(result.vehicle.make).toBe('Honda');
    });

    it('should correctly parse and link line items with parts/labor/materials', async () => {
      const result = await parser.parseEMS(sampleEMSContent);

      // Check part line
      const partLine = result.lines.find(line => line.lineNum === 1);
      expect(partLine.partInfo).toBeDefined();
      expect(partLine.partInfo.partNumber).toBe('04711-TBA-A90ZZ');
      expect(partLine.partInfo.price.toString()).toBe('450');
      expect(partLine.partInfo.quantity).toBe(1);

      // Check labor line
      const laborLine = result.lines.find(line => line.lineNum === 2);
      expect(laborLine.laborInfo).toBeDefined();
      expect(laborLine.laborInfo.hours.toString()).toBe('3.5');
      expect(laborLine.laborInfo.rate.toString()).toBe('75');
      expect(laborLine.laborInfo.paintStages).toBe(3);

      // Check material line
      const materialLine = result.lines.find(line => line.lineNum === 3);
      expect(materialLine.otherChargesInfo).toBeDefined();
      expect(materialLine.otherChargesInfo.price.toString()).toBe('50');
    });

    it('should handle date parsing correctly', async () => {
      const emsWithDates = `HDR|1.0|Mitchell|UltraMate|20250115|103000
CLM|CLM123|POL123|0|20250101||
EST|EST123|20250115|draft|0|0|0|0`;

      const result = await parser.parseEMS(emsWithDates);
      const sections = parser.parseEMSSections(
        emsWithDates.split('\n').filter(line => line.trim())
      );

      const headerRecord = sections.get('HDR')[0];
      expect(headerRecord.timestamp).toBeInstanceOf(Date);
      expect(headerRecord.timestamp.getFullYear()).toBe(2025);
      expect(headerRecord.timestamp.getMonth()).toBe(0); // January (0-indexed)
      expect(headerRecord.timestamp.getDate()).toBe(15);
    });

    it('should handle business customers correctly', async () => {
      const businessEMS = `HDR|1.0|Mitchell|UltraMate|20250115|103000
CST||Business|ABC Corp|123 Main St|Toronto|ON|M5V3A8|555-123-4567|business@email.com|Y`;

      const result = await parser.parseEMS(businessEMS);

      expect(result.customer.type).toBe('organization');
      expect(result.customer.companyName).toBe('ABC Corp');
      expect(result.customer.firstName).toBe('Business');
      expect(result.customer.lastName).toBe('Business');
      expect(result.customer.gst_payable).toBe(true);
    });
  });

  describe('parseEMSSections', () => {
    it('should correctly parse lines into sections by record type', () => {
      const lines = sampleEMSContent.split('\n').filter(line => line.trim());
      const sections = parser.parseEMSSections(lines);

      expect(sections.has('HDR')).toBe(true);
      expect(sections.has('CLM')).toBe(true);
      expect(sections.has('CST')).toBe(true);
      expect(sections.has('VEH')).toBe(true);
      expect(sections.has('EST')).toBe(true);
      expect(sections.has('LIN')).toBe(true);
      expect(sections.has('PRT')).toBe(true);
      expect(sections.has('LAB')).toBe(true);
      expect(sections.has('MTL')).toBe(true);
      expect(sections.has('TOT')).toBe(true);

      expect(sections.get('LIN')).toHaveLength(3);
      expect(sections.get('TOT')).toHaveLength(4);
    });

    it('should handle invalid or malformed lines', () => {
      const malformedLines = [
        'HDR|1.0|Mitchell', // Missing fields
        '', // Empty line
        'INVALID', // No pipe separator
        'UNK|unknown|data', // Unknown record type
      ];

      const sections = parser.parseEMSSections(malformedLines);

      expect(sections.has('HDR')).toBe(true);
      expect(sections.has('UNK')).toBe(true);
      expect(sections.get('UNK')).toHaveLength(1);
    });
  });

  describe('parseDecimal', () => {
    it('should handle various decimal formats', () => {
      expect(parser.parseDecimal('123.45').toString()).toBe('123.45');
      expect(parser.parseDecimal('$1,234.56').toString()).toBe('1234.56');
      expect(parser.parseDecimal('0').toString()).toBe('0');
      expect(parser.parseDecimal('').toString()).toBe('0');
      expect(parser.parseDecimal('invalid').toString()).toBe('0');
      expect(parser.parseDecimal(null).toString()).toBe('0');
      expect(parser.parseDecimal(undefined).toString()).toBe('0');
    });
  });

  describe('parseEMSDate', () => {
    it('should parse YYYYMMDD format correctly', () => {
      const date = parser.parseEMSDate('20250115');
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(0); // January (0-indexed)
      expect(date.getDate()).toBe(15);
    });

    it('should parse YYYY-MM-DD format correctly', () => {
      const date = parser.parseEMSDate('2025-01-15');
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(0);
      // Date might be off by one due to timezone, so check it's around the expected date
      expect([14, 15]).toContain(date.getDate());
    });

    it('should handle invalid dates', () => {
      expect(parser.parseEMSDate('')).toBeUndefined();
      expect(parser.parseEMSDate('invalid')).toBeUndefined();
      expect(parser.parseEMSDate('20251301')).toBeUndefined(); // Invalid month
    });
  });

  describe('parseEMSDateTime', () => {
    it('should combine date and time correctly', () => {
      const dateTime = parser.parseEMSDateTime('20250115', '103000');
      expect(dateTime).toBeInstanceOf(Date);
      expect(dateTime.getFullYear()).toBe(2025);
      expect(dateTime.getMonth()).toBe(0);
      expect(dateTime.getDate()).toBe(15);
      expect(dateTime.getHours()).toBe(10);
      expect(dateTime.getMinutes()).toBe(30);
      expect(dateTime.getSeconds()).toBe(0);
    });

    it('should handle missing time', () => {
      const dateTime = parser.parseEMSDateTime('20250115', '');
      expect(dateTime).toBeInstanceOf(Date);
      expect(dateTime.getHours()).toBe(0); // Default time
    });

    it('should handle invalid date/time', () => {
      expect(parser.parseEMSDateTime('', '103000')).toBeUndefined();
      expect(parser.parseEMSDateTime('invalid', '103000')).toBeUndefined();
    });
  });

  describe('getUnknownFields', () => {
    it('should track unknown record types', async () => {
      await parser.parseEMS(malformedEMSContent);
      const unknownFields = parser.getUnknownFields();

      expect(Array.isArray(unknownFields)).toBe(true);
      expect(
        unknownFields.some(field => field.includes('INVALID_RECORD_TYPE'))
      ).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should provide meaningful error messages', async () => {
      const invalidContent = null;

      await expect(parser.parseEMS(invalidContent)).rejects.toThrow(
        /EMS parsing failed/
      );
    });

    it('should handle empty content', async () => {
      const emptyContent = '';

      const result = await parser.parseEMS(emptyContent);

      expect(result.identities.ro_number).toBe('');
      expect(result.customer.firstName).toBe('Unknown');
      expect(result.vehicle.make).toBe('Unknown');
    });
  });

  describe('record type parsing', () => {
    it('should parse header records correctly', () => {
      const headerFields = [
        'HDR',
        '1.0',
        'Mitchell',
        'UltraMate',
        '20250115',
        '103000',
      ];
      const record = parser.parseEMSFields(headerFields, 'HDR');

      expect(record.recordType).toBe('HDR');
      expect(record.version).toBe('1.0');
      expect(record.vendor).toBe('Mitchell');
      expect(record.system).toBe('UltraMate');
      expect(record.date).toBe('20250115');
      expect(record.time).toBe('103000');
    });

    it('should parse claim records correctly', () => {
      const claimFields = [
        'CLM',
        'CLM123',
        'POL456',
        '500.00',
        '20250101',
        'John Smith',
        'Test Insurance',
      ];
      const record = parser.parseEMSFields(claimFields, 'CLM');

      expect(record.claimNumber).toBe('CLM123');
      expect(record.policyNumber).toBe('POL456');
      expect(record.deductible.toString()).toBe('500');
      expect(record.adjuster).toBe('John Smith');
      expect(record.insuranceCompany).toBe('Test Insurance');
    });

    it('should parse parts records correctly', () => {
      const partsFields = [
        'PRT',
        '1',
        'PART123',
        'Test Part',
        'OEM123',
        '2',
        '150.00',
        'OEM',
        'OEM',
        'Y',
      ];
      const record = parser.parseEMSFields(partsFields, 'PRT');

      expect(record.lineNumber).toBe(1);
      expect(record.partNumber).toBe('PART123');
      expect(record.description).toBe('Test Part');
      expect(record.oemPartNumber).toBe('OEM123');
      expect(record.quantity).toBe(2);
      expect(record.price.toString()).toBe('150');
      expect(record.partType).toBe('OEM');
      expect(record.sourceCode).toBe('OEM');
      expect(record.taxable).toBe(true);
    });

    it('should parse labor records correctly', () => {
      const laborFields = [
        'LAB',
        '2',
        'Paint Operation',
        '3.5',
        '75.00',
        'paint',
        'Y',
        '3',
      ];
      const record = parser.parseEMSFields(laborFields, 'LAB');

      expect(record.lineNumber).toBe(2);
      expect(record.operation).toBe('Paint Operation');
      expect(record.hours.toString()).toBe('3.5');
      expect(record.rate.toString()).toBe('75');
      expect(record.laborType).toBe('paint');
      expect(record.taxable).toBe(true);
      expect(record.paintStages).toBe(3);
    });
  });
});
