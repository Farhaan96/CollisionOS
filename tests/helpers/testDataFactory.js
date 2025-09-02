/**
 * Test Data Factory for CollisionOS Integration Tests
 * Provides realistic collision repair test data generators
 */

class TestDataFactory {
  /**
   * Generate realistic BMS XML content for testing
   * @param {Object} options - Customization options
   * @returns {string} BMS XML content
   */
  static generateBmsXml(options = {}) {
    const defaults = {
      customerFirstName: 'John',
      customerLastName: 'Smith',
      customerEmail: 'john.smith@test.com',
      customerPhone: '555-1234',
      vehicleYear: 2017,
      vehicleMake: 'Chevrolet',
      vehicleModel: 'Malibu',
      vehicleVin: '1G1BC5SM5H7123456',
      claimNumber: 'CLM-2024-001',
      repairOrderNumber: 'RO-2024-001'
    };

    const data = { ...defaults, ...options };

    return `<?xml version="1.0" encoding="UTF-8"?>
<estimate>
  <customer>
    <first_name>${data.customerFirstName}</first_name>
    <last_name>${data.customerLastName}</last_name>
    <email>${data.customerEmail}</email>
    <phone>${data.customerPhone}</phone>
  </customer>
  <vehicle>
    <year>${data.vehicleYear}</year>
    <make>${data.vehicleMake}</make>
    <model>${data.vehicleModel}</model>
    <vin>${data.vehicleVin}</vin>
  </vehicle>
  <claim>
    <claim_number>${data.claimNumber}</claim_number>
  </claim>
  <repair_order>
    <ro_number>${data.repairOrderNumber}</ro_number>
  </repair_order>
  <parts>
    <part>
      <operation>Replace</operation>
      <description>Front Bumper Cover</description>
      <oem_number>84044368</oem_number>
      <quantity>1</quantity>
    </part>
  </parts>
</estimate>`;
  }

  /**
   * Generate realistic customer data for testing
   * @param {Object} options - Customization options
   * @returns {Object} Customer data object
   */
  static generateCustomerData(options = {}) {
    const defaults = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@email.com',
      phone: '555-0123',
      customerType: 'individual',
      customerStatus: 'active',
      isActive: true
    };

    return { ...defaults, ...options };
  }

  /**
   * Generate realistic vehicle data for testing
   * @param {Object} options - Customization options
   * @returns {Object} Vehicle data object
   */
  static generateVehicleData(options = {}) {
    const defaults = {
      vin: '1HGBH41JXMN109186',
      year: 2022,
      make: 'Honda',
      model: 'Civic',
      trim: 'EX',
      color: 'Silver',
      bodyStyle: 'sedan'
    };

    return { ...defaults, ...options };
  }

  /**
   * Generate a valid VIN for testing
   * @returns {string} Valid 17-character VIN
   */
  static generateValidVin() {
    const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
    const base = 'TEST' + Date.now().toString().slice(-6);
    
    // Pad to 16 characters
    let vin = base.padEnd(16, '0');
    
    // Add check digit (simplified - just use last digit of timestamp)
    vin += Date.now().toString().slice(-1);
    
    return vin.slice(0, 17);
  }

  /**
   * Generate malformed XML for testing error handling
   * @returns {string} Malformed XML content
   */
  static generateMalformedXml() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<estimate>
  <customer>
    <first_name>Test
    <!-- Missing closing tag -->
  <vehicle>
    <year>2022</year>
  </vehicle>
</estimate>`;
  }

  /**
   * Generate large BMS XML content for performance testing
   * @returns {string} Large XML content
   */
  static generateLargeBmsXml() {
    const basePart = `
    <part>
      <operation>Replace</operation>
      <description>Test Part Description</description>
      <oem_number>TEST${Math.random().toString().slice(2, 8)}</oem_number>
      <quantity>1</quantity>
    </part>`;

    const manyParts = Array(100).fill(basePart).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<estimate>
  <customer>
    <first_name>Performance</first_name>
    <last_name>TestCustomer</last_name>
    <email>performance.test@example.com</email>
    <phone>555-9999</phone>
  </customer>
  <vehicle>
    <year>2023</year>
    <make>TestMake</make>
    <model>TestModel</model>
    <vin>1PERFTEST12345678</vin>
  </vehicle>
  <parts>
    ${manyParts}
  </parts>
</estimate>`;
  }

  /**
   * Generate test authentication token
   * @returns {string} Test token
   */
  static generateTestToken() {
    return 'dev-token';
  }

  /**
   * Generate unique test identifier
   * @param {string} prefix - Prefix for the identifier
   * @returns {string} Unique test identifier
   */
  static generateTestId(prefix = 'TEST') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

module.exports = TestDataFactory;