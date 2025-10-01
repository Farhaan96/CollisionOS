/**
 * CollisionOS Database Seeding Script
 *
 * Comprehensive seeding script for SQLite database with realistic collision repair sample data
 *
 * Usage: node server/database/seed-collision-data.js
 *
 * This script is idempotent - it checks for existing data before inserting
 */

const { sequelize } = require('./connection');
const bcrypt = require('bcrypt');
const path = require('path');

// Import all models
const {
  Shop,
  User,
  Customer,
  Vehicle,
  InsuranceCompany,
  ClaimManagement,
  RepairOrderManagement,
  AdvancedPartsManagement,
  PurchaseOrderSystem,
  Vendor,
  VehicleProfile,
} = require('./models');

// Helper to log progress
const log = (message, type = 'info') => {
  const prefix = {
    info: '✓',
    warn: '⚠',
    error: '✗',
    start: '▶',
  }[type] || 'ℹ';
  console.log(`${prefix} ${message}`);
};

// Helper to check if data exists
async function dataExists(model, where = {}) {
  const count = await model.count({ where });
  return count > 0;
}

// Hash password helper
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Seed Shop Data
 */
async function seedShop() {
  try {
    log('Seeding Shop data...', 'start');

    if (await dataExists(Shop)) {
      log('Shop data already exists, skipping...', 'warn');
      return await Shop.findOne();
    }

    const shop = await Shop.create({
      name: 'Premier Auto Body',
      businessName: 'Premier Auto Body & Collision Repair Ltd.',
      email: 'info@premierautobody.com',
      phone: '416-555-0100',
      fax: '416-555-0101',
      website: 'https://www.premierautobody.com',
      address: '1234 Industrial Road',
      city: 'Toronto',
      state: 'Ontario',
      postalCode: 'M5V 3A8',
      country: 'Canada',
      timezone: 'America/Toronto',
      currency: 'CAD',
      taxNumber: '123456789RT0001',
      hstNumber: '123456789RT0001',
      settings: {
        laborRate: 85.0,
        paintAndMaterialsRate: 55.0,
        workingHours: {
          monday: { start: '08:00', end: '17:00', enabled: true },
          tuesday: { start: '08:00', end: '17:00', enabled: true },
          wednesday: { start: '08:00', end: '17:00', enabled: true },
          thursday: { start: '08:00', end: '17:00', enabled: true },
          friday: { start: '08:00', end: '17:00', enabled: true },
          saturday: { start: '09:00', end: '13:00', enabled: true },
          sunday: { start: '00:00', end: '00:00', enabled: false },
        },
        taxRates: {
          hst: 13.0,
          gst: 0.0,
          pst: 0.0,
        },
      },
    });

    log(`Shop created: ${shop.name} (${shop.id})`, 'info');
    return shop;
  } catch (error) {
    log(`Error seeding shop: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Seed Users Data
 */
async function seedUsers(shopId) {
  try {
    log('Seeding Users data...', 'start');

    if (await dataExists(User, { shopId })) {
      log('Users already exist for this shop, skipping...', 'warn');
      return await User.findAll({ where: { shopId } });
    }

    const users = await User.bulkCreate([
      {
        shopId,
        username: 'owner',
        email: 'owner@premierautobody.com',
        password: await hashPassword('password123'),
        firstName: 'Robert',
        lastName: 'Henderson',
        role: 'owner',
        phone: '416-555-0102',
        mobile: '416-555-0103',
        employeeId: 'EMP001',
        hireDate: '2015-01-15',
        hourlyRate: 95.0,
        isActive: true,
      },
      {
        shopId,
        username: 'manager',
        email: 'manager@premierautobody.com',
        password: await hashPassword('password123'),
        firstName: 'Sarah',
        lastName: 'Mitchell',
        role: 'manager',
        phone: '416-555-0104',
        mobile: '416-555-0105',
        employeeId: 'EMP002',
        hireDate: '2016-03-20',
        hourlyRate: 75.0,
        isActive: true,
      },
      {
        shopId,
        username: 'tech1',
        email: 'technician@premierautobody.com',
        password: await hashPassword('password123'),
        firstName: 'Michael',
        lastName: 'Chen',
        role: 'technician',
        phone: '416-555-0106',
        mobile: '416-555-0107',
        employeeId: 'EMP003',
        hireDate: '2018-07-10',
        hourlyRate: 65.0,
        isActive: true,
      },
    ]);

    log(`Created ${users.length} users`, 'info');
    return users;
  } catch (error) {
    log(`Error seeding users: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Seed Customers Data
 */
async function seedCustomers(shopId) {
  try {
    log('Seeding Customers data...', 'start');

    if (await dataExists(Customer, { shopId })) {
      log('Customers already exist for this shop, skipping...', 'warn');
      return await Customer.findAll({ where: { shopId } });
    }

    const customers = await Customer.bulkCreate([
      {
        shopId,
        customerNumber: 'CUST-2024-001',
        firstName: 'Jennifer',
        lastName: 'Anderson',
        email: 'jennifer.anderson@email.com',
        phone: '416-555-1001',
        mobile: '416-555-1002',
        address: '123 Maple Street',
        city: 'Toronto',
        state: 'Ontario',
        zipCode: 'M4B 1B3',
        country: 'Canada',
        driverLicense: 'A1234-56789-01234',
        preferredContact: 'email',
        smsOptIn: true,
        emailOptIn: true,
        customerType: 'individual',
        customerStatus: 'active',
      },
      {
        shopId,
        customerNumber: 'CUST-2024-002',
        firstName: 'David',
        lastName: 'Thompson',
        email: 'david.thompson@email.com',
        phone: '416-555-2001',
        mobile: '416-555-2002',
        address: '456 Oak Avenue',
        city: 'Mississauga',
        state: 'Ontario',
        zipCode: 'L5B 2E4',
        country: 'Canada',
        driverLicense: 'B2345-67890-12345',
        preferredContact: 'phone',
        smsOptIn: true,
        emailOptIn: true,
        customerType: 'individual',
        customerStatus: 'active',
      },
      {
        shopId,
        customerNumber: 'CUST-2024-003',
        firstName: 'Maria',
        lastName: 'Rodriguez',
        email: 'maria.rodriguez@email.com',
        phone: '416-555-3001',
        mobile: '416-555-3002',
        address: '789 Pine Road',
        city: 'Brampton',
        state: 'Ontario',
        zipCode: 'L6R 3K9',
        country: 'Canada',
        driverLicense: 'C3456-78901-23456',
        preferredContact: 'sms',
        smsOptIn: true,
        emailOptIn: true,
        customerType: 'individual',
        customerStatus: 'vip',
      },
      {
        shopId,
        customerNumber: 'CUST-2024-004',
        firstName: 'James',
        lastName: 'Wilson',
        email: 'james.wilson@email.com',
        phone: '416-555-4001',
        mobile: '416-555-4002',
        address: '321 Elm Street',
        city: 'Vaughan',
        state: 'Ontario',
        zipCode: 'L4L 8N3',
        country: 'Canada',
        driverLicense: 'D4567-89012-34567',
        preferredContact: 'phone',
        smsOptIn: false,
        emailOptIn: true,
        customerType: 'individual',
        customerStatus: 'active',
      },
      {
        shopId,
        customerNumber: 'CUST-2024-005',
        firstName: 'Emily',
        lastName: 'Brown',
        email: 'emily.brown@email.com',
        phone: '416-555-5001',
        mobile: '416-555-5002',
        address: '654 Birch Lane',
        city: 'Markham',
        state: 'Ontario',
        zipCode: 'L3R 9W5',
        country: 'Canada',
        driverLicense: 'E5678-90123-45678',
        preferredContact: 'email',
        smsOptIn: true,
        emailOptIn: true,
        customerType: 'individual',
        customerStatus: 'active',
      },
    ]);

    log(`Created ${customers.length} customers`, 'info');
    return customers;
  } catch (error) {
    log(`Error seeding customers: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Seed Vehicles Data
 */
async function seedVehicles(shopId, customers) {
  try {
    log('Seeding Vehicles data...', 'start');

    if (await dataExists(Vehicle, { shopId })) {
      log('Vehicles already exist for this shop, skipping...', 'warn');
      return await Vehicle.findAll({ where: { shopId } });
    }

    const vehicles = await Vehicle.bulkCreate([
      {
        shopId,
        customerId: customers[0].id,
        vin: '1HGCM82633A123456',
        licensePlate: 'ABCD 123',
        state: 'Ontario',
        year: 2023,
        make: 'Honda',
        model: 'Accord',
        trim: 'EX-L',
        bodyStyle: 'sedan',
        color: 'Silver',
        mileage: 15234,
        engineType: 'gasoline',
        transmission: 'automatic',
      },
      {
        shopId,
        customerId: customers[1].id,
        vin: '1G1BC5SM5H7234567',
        licensePlate: 'EFGH 456',
        state: 'Ontario',
        year: 2022,
        make: 'Chevrolet',
        model: 'Malibu',
        trim: 'LT',
        bodyStyle: 'sedan',
        color: 'Blue',
        mileage: 28456,
        engineType: 'gasoline',
        transmission: 'automatic',
      },
      {
        shopId,
        customerId: customers[2].id,
        vin: '5YFBURHE5HP345678',
        licensePlate: 'IJKL 789',
        state: 'Ontario',
        year: 2021,
        make: 'Toyota',
        model: 'Corolla',
        trim: 'SE',
        bodyStyle: 'sedan',
        color: 'Red',
        mileage: 42150,
        engineType: 'gasoline',
        transmission: 'automatic',
      },
      {
        shopId,
        customerId: customers[3].id,
        vin: '5UXCR6C0XL9456789',
        licensePlate: 'MNOP 012',
        state: 'Ontario',
        year: 2020,
        make: 'BMW',
        model: 'X5',
        trim: 'xDrive40i',
        bodyStyle: 'suv',
        color: 'Black',
        mileage: 56789,
        engineType: 'gasoline',
        transmission: 'automatic',
      },
      {
        shopId,
        customerId: customers[4].id,
        vin: '1FTFW1E59MF567890',
        licensePlate: 'QRST 345',
        state: 'Ontario',
        year: 2021,
        make: 'Ford',
        model: 'F-150',
        trim: 'XLT',
        bodyStyle: 'truck',
        color: 'White',
        mileage: 38923,
        engineType: 'gasoline',
        transmission: 'automatic',
      },
    ]);

    log(`Created ${vehicles.length} vehicles`, 'info');
    return vehicles;
  } catch (error) {
    log(`Error seeding vehicles: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Seed Insurance Companies Data
 */
async function seedInsuranceCompanies(shopId) {
  try {
    log('Seeding Insurance Companies data...', 'start');

    if (await dataExists(InsuranceCompany, { shopId })) {
      log('Insurance companies already exist for this shop, skipping...', 'warn');
      return await InsuranceCompany.findAll({ where: { shopId } });
    }

    const insuranceCompanies = await InsuranceCompany.bulkCreate([
      {
        shopId,
        name: 'State Farm Insurance',
        code: 'SF',
        type: 'auto',
        address: '100 Insurance Boulevard',
        city: 'Toronto',
        state: 'Ontario',
        zipCode: 'M5H 2N2',
        country: 'Canada',
        phone: '1-800-555-1000',
        email: 'claims@statefarm.ca',
        website: 'https://www.statefarm.ca',
        isDrp: true,
        drpStatus: 'active',
        preferredVendors: ['OEM Direct', 'PartsTrader'],
        paymentTerms: 'Net 30',
        averagePaymentDays: 28,
      },
      {
        shopId,
        name: 'Intact Insurance',
        code: 'INTCT',
        type: 'auto',
        address: '200 Claims Street',
        city: 'Toronto',
        state: 'Ontario',
        zipCode: 'M4W 3E2',
        country: 'Canada',
        phone: '1-800-555-2000',
        email: 'claims@intact.ca',
        website: 'https://www.intact.ca',
        isDrp: true,
        drpStatus: 'active',
        preferredVendors: ['LKQ', 'PartsTrader'],
        paymentTerms: 'Net 45',
        averagePaymentDays: 42,
      },
      {
        shopId,
        name: 'Allstate Insurance',
        code: 'ALLST',
        type: 'auto',
        address: '300 Coverage Avenue',
        city: 'Toronto',
        state: 'Ontario',
        zipCode: 'M3C 1M8',
        country: 'Canada',
        phone: '1-800-555-3000',
        email: 'claims@allstate.ca',
        website: 'https://www.allstate.ca',
        isDrp: false,
        drpStatus: 'not_participating',
        preferredVendors: [],
        paymentTerms: 'Net 60',
        averagePaymentDays: 55,
      },
    ]);

    log(`Created ${insuranceCompanies.length} insurance companies`, 'info');
    return insuranceCompanies;
  } catch (error) {
    log(`Error seeding insurance companies: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Seed Vendors Data
 */
async function seedVendors(shopId) {
  try {
    log('Seeding Vendors data...', 'start');

    if (await dataExists(Vendor, { shopId })) {
      log('Vendors already exist for this shop, skipping...', 'warn');
      return await Vendor.findAll({ where: { shopId } });
    }

    const vendors = await Vendor.bulkCreate([
      {
        shopId,
        vendorNumber: 'VEND-2024-001',
        name: 'OEM Direct Parts',
        contactPerson: 'John Smith',
        email: 'orders@oemdirect.com',
        phone: '416-555-6001',
        address: '100 Parts Drive',
        city: 'Toronto',
        state: 'Ontario',
        zipCode: 'M1B 3G4',
        country: 'Canada',
        vendorType: 'oem',
        paymentTerms: 'Net 30',
        isActive: true,
      },
      {
        shopId,
        vendorNumber: 'VEND-2024-002',
        name: 'PartsTrader Network',
        contactPerson: 'Lisa Johnson',
        email: 'orders@partstrader.com',
        phone: '416-555-6002',
        address: '200 Supplier Road',
        city: 'Mississauga',
        state: 'Ontario',
        zipCode: 'L5T 1V2',
        country: 'Canada',
        vendorType: 'aftermarket',
        paymentTerms: 'Net 15',
        isActive: true,
      },
      {
        shopId,
        vendorNumber: 'VEND-2024-003',
        name: 'LKQ Corporation',
        contactPerson: 'Mike Davis',
        email: 'sales@lkq.com',
        phone: '416-555-6003',
        address: '300 Salvage Street',
        city: 'Brampton',
        state: 'Ontario',
        zipCode: 'L6S 4N1',
        country: 'Canada',
        vendorType: 'recycled',
        paymentTerms: 'Net 30',
        isActive: true,
      },
    ]);

    log(`Created ${vendors.length} vendors`, 'info');
    return vendors;
  } catch (error) {
    log(`Error seeding vendors: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Seed Vehicle Profiles Data
 */
async function seedVehicleProfiles(shopId, customers, vehicles) {
  try {
    log('Seeding Vehicle Profiles data...', 'start');

    if (await dataExists(VehicleProfile, { shopId })) {
      log('Vehicle profiles already exist for this shop, skipping...', 'warn');
      return await VehicleProfile.findAll({ where: { shopId } });
    }

    const vehicleProfiles = await VehicleProfile.bulkCreate([
      {
        shopId,
        customerId: customers[0].id,
        vin: vehicles[0].vin,
        year: vehicles[0].year,
        make: vehicles[0].make,
        model: vehicles[0].model,
        trim: vehicles[0].trim,
        bodyStyle: vehicles[0].bodyStyle,
        exteriorColor: vehicles[0].color,
        interiorColor: 'Black',
        engineSize: '2.0L',
        transmission: 'Automatic',
        driveType: 'FWD',
        fuelType: 'Gasoline',
        odometer: vehicles[0].mileage,
        condition: 'excellent',
      },
      {
        shopId,
        customerId: customers[1].id,
        vin: vehicles[1].vin,
        year: vehicles[1].year,
        make: vehicles[1].make,
        model: vehicles[1].model,
        trim: vehicles[1].trim,
        bodyStyle: vehicles[1].bodyStyle,
        exteriorColor: vehicles[1].color,
        interiorColor: 'Gray',
        engineSize: '1.5L',
        transmission: 'Automatic',
        driveType: 'FWD',
        fuelType: 'Gasoline',
        odometer: vehicles[1].mileage,
        condition: 'good',
      },
      {
        shopId,
        customerId: customers[2].id,
        vin: vehicles[2].vin,
        year: vehicles[2].year,
        make: vehicles[2].make,
        model: vehicles[2].model,
        trim: vehicles[2].trim,
        bodyStyle: vehicles[2].bodyStyle,
        exteriorColor: vehicles[2].color,
        interiorColor: 'Black',
        engineSize: '1.8L',
        transmission: 'CVT',
        driveType: 'FWD',
        fuelType: 'Gasoline',
        odometer: vehicles[2].mileage,
        condition: 'good',
      },
    ]);

    log(`Created ${vehicleProfiles.length} vehicle profiles`, 'info');
    return vehicleProfiles;
  } catch (error) {
    log(`Error seeding vehicle profiles: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Seed Claims Data
 */
async function seedClaims(shopId, customers, vehicleProfiles, insuranceCompanies) {
  try {
    log('Seeding Claims data...', 'start');

    if (await dataExists(ClaimManagement, { shopId })) {
      log('Claims already exist for this shop, skipping...', 'warn');
      return await ClaimManagement.findAll({ where: { shopId } });
    }

    const claims = await ClaimManagement.bulkCreate([
      {
        shopId,
        customerId: customers[0].id,
        vehicleProfileId: vehicleProfiles[0].id,
        insuranceCompanyId: insuranceCompanies[0].id,
        claimNumber: 'CLM-2024-001',
        policyNumber: 'POL-SF-123456',
        policyType: 'collision',
        dateOfLoss: new Date('2024-09-15'),
        dateReported: new Date('2024-09-16'),
        dateClaimOpened: new Date('2024-09-16'),
        adjusterName: 'John Adjuster',
        adjusterPhone: '1-800-555-1001',
        adjusterEmail: 'john.adjuster@statefarm.ca',
        deductibleAmount: 500.0,
        deductiblePaidBy: 'customer',
        estimatedTotalLoss: 5500.0,
        claimStatus: 'approved',
      },
      {
        shopId,
        customerId: customers[1].id,
        vehicleProfileId: vehicleProfiles[1].id,
        insuranceCompanyId: insuranceCompanies[1].id,
        claimNumber: 'CLM-2024-002',
        policyNumber: 'POL-INT-789012',
        policyType: 'comprehensive',
        dateOfLoss: new Date('2024-09-20'),
        dateReported: new Date('2024-09-20'),
        dateClaimOpened: new Date('2024-09-21'),
        adjusterName: 'Sarah Claims',
        adjusterPhone: '1-800-555-2001',
        adjusterEmail: 'sarah.claims@intact.ca',
        deductibleAmount: 750.0,
        deductiblePaidBy: 'customer',
        estimatedTotalLoss: 3200.0,
        claimStatus: 'approved',
      },
      {
        shopId,
        customerId: customers[2].id,
        vehicleProfileId: vehicleProfiles[2].id,
        insuranceCompanyId: insuranceCompanies[0].id,
        claimNumber: 'CLM-2024-003',
        policyNumber: 'POL-SF-345678',
        policyType: 'collision',
        dateOfLoss: new Date('2024-09-25'),
        dateReported: new Date('2024-09-25'),
        dateClaimOpened: new Date('2024-09-26'),
        adjusterName: 'Mike Insurance',
        adjusterPhone: '1-800-555-1002',
        adjusterEmail: 'mike.insurance@statefarm.ca',
        deductibleAmount: 500.0,
        deductiblePaidBy: 'insurer',
        estimatedTotalLoss: 8900.0,
        claimStatus: 'in_progress',
      },
    ]);

    log(`Created ${claims.length} claims`, 'info');
    return claims;
  } catch (error) {
    log(`Error seeding claims: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Seed Repair Orders Data
 */
async function seedRepairOrders(shopId, customers, vehicleProfiles, claims, users) {
  try {
    log('Seeding Repair Orders data...', 'start');

    if (await dataExists(RepairOrderManagement, { shopId })) {
      log('Repair orders already exist for this shop, skipping...', 'warn');
      return await RepairOrderManagement.findAll({ where: { shopId } });
    }

    const technicianUser = users.find((u) => u.role === 'technician');
    const managerUser = users.find((u) => u.role === 'manager');

    const repairOrders = await RepairOrderManagement.bulkCreate([
      {
        shopId,
        customerId: customers[0].id,
        vehicleProfileId: vehicleProfiles[0].id,
        claimManagementId: claims[0].id,
        repairOrderNumber: 'RO-2024-001',
        roStatus: 'in_production',
      },
      {
        shopId,
        customerId: customers[1].id,
        vehicleProfileId: vehicleProfiles[1].id,
        claimManagementId: claims[1].id,
        repairOrderNumber: 'RO-2024-002',
        roStatus: 'estimate_pending',
      },
      {
        shopId,
        customerId: customers[2].id,
        vehicleProfileId: vehicleProfiles[2].id,
        claimManagementId: claims[2].id,
        repairOrderNumber: 'RO-2024-003',
        roStatus: 'completed',
      },
    ]);

    log(`Created ${repairOrders.length} repair orders`, 'info');
    return repairOrders;
  } catch (error) {
    log(`Error seeding repair orders: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Seed Parts Data
 */
async function seedParts(shopId, repairOrders, vendors) {
  try {
    log('Seeding Parts data...', 'start');

    if (await dataExists(AdvancedPartsManagement, { shopId })) {
      log('Parts already exist for this shop, skipping...', 'warn');
      return await AdvancedPartsManagement.findAll({ where: { shopId } });
    }

    const parts = await AdvancedPartsManagement.bulkCreate([
      // Parts for RO-2024-001
      {
        shopId,
        repairOrderId: repairOrders[0].id,
        vendorId: vendors[0].id,
        lineNumber: 1,
        partNumber: 'HO-04711SCAE90',
        partName: 'Front Bumper Cover',
        partDescription: 'OEM Front Bumper Cover - Honda Accord 2023',
        partCategory: 'exterior',
        partStatus: 'received',
        quantityOrdered: 1,
        brandType: 'oem',
      },
      {
        shopId,
        repairOrderId: repairOrders[0].id,
        vendorId: vendors[1].id,
        lineNumber: 2,
        partNumber: 'HC-33151SCAE02',
        partName: 'Right Headlight Assembly',
        partDescription: 'Aftermarket Headlight Assembly - Honda Accord 2023',
        partCategory: 'lighting',
        partStatus: 'ordered',
        quantityOrdered: 1,
        brandType: 'aftermarket',
      },
      {
        shopId,
        repairOrderId: repairOrders[0].id,
        vendorId: vendors[0].id,
        lineNumber: 3,
        partNumber: 'HO-74120SCAE00ZZ',
        partName: 'Front Grille',
        partDescription: 'OEM Front Grille - Honda Accord 2023',
        partCategory: 'exterior',
        partStatus: 'installed',
        quantityOrdered: 1,
        brandType: 'oem',
      },

      // Parts for RO-2024-002
      {
        shopId,
        repairOrderId: repairOrders[1].id,
        vendorId: vendors[2].id,
        lineNumber: 1,
        partNumber: 'GM-42612340',
        partName: 'Right Front Fender',
        partDescription: 'Recycled Front Fender - Chevrolet Malibu 2022',
        partCategory: 'exterior',
        partStatus: 'needed',
        quantityOrdered: 1,
        brandType: 'recycled',
      },
      {
        shopId,
        repairOrderId: repairOrders[1].id,
        vendorId: vendors[1].id,
        lineNumber: 2,
        partNumber: 'GM-23445689',
        partName: 'Right Mirror Assembly',
        partDescription: 'Aftermarket Mirror Assembly - Chevrolet Malibu 2022',
        partCategory: 'exterior',
        partStatus: 'needed',
        quantityOrdered: 1,
        brandType: 'aftermarket',
      },

      // Parts for RO-2024-003 (completed)
      {
        shopId,
        repairOrderId: repairOrders[2].id,
        vendorId: vendors[0].id,
        lineNumber: 1,
        partNumber: 'TY-52119AB900',
        partName: 'Rear Bumper Cover',
        partDescription: 'OEM Rear Bumper Cover - Toyota Corolla 2021',
        partCategory: 'exterior',
        partStatus: 'installed',
        quantityOrdered: 1,
        brandType: 'oem',
      },
      {
        shopId,
        repairOrderId: repairOrders[2].id,
        vendorId: vendors[0].id,
        lineNumber: 2,
        partNumber: 'TY-81561AB900',
        partName: 'Left Taillight Assembly',
        partDescription: 'OEM Taillight Assembly - Toyota Corolla 2021',
        partCategory: 'lighting',
        partStatus: 'installed',
        quantityOrdered: 1,
        brandType: 'oem',
      },
      {
        shopId,
        repairOrderId: repairOrders[2].id,
        vendorId: vendors[0].id,
        lineNumber: 3,
        partNumber: 'TY-76022AB900',
        partName: 'Rear Bumper Reinforcement',
        partDescription: 'OEM Rear Bumper Reinforcement - Toyota Corolla 2021',
        partCategory: 'structural',
        partStatus: 'installed',
        quantityOrdered: 1,
        brandType: 'oem',
      },
    ]);

    log(`Created ${parts.length} parts`, 'info');
    return parts;
  } catch (error) {
    log(`Error seeding parts: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Seed Purchase Orders Data
 */
async function seedPurchaseOrders(shopId, repairOrders, vendors) {
  try {
    log('Seeding Purchase Orders data...', 'start');

    if (await dataExists(PurchaseOrderSystem, { shopId })) {
      log('Purchase orders already exist for this shop, skipping...', 'warn');
      return await PurchaseOrderSystem.findAll({ where: { shopId } });
    }

    const purchaseOrders = await PurchaseOrderSystem.bulkCreate([
      {
        shopId,
        repairOrderId: repairOrders[0].id,
        vendorId: vendors[0].id,
        purchaseOrderNumber: 'RO-2024-001-2410-OEMD-001',
        poStatus: 'received',
        poDate: new Date('2024-09-28'),
        actualDeliveryDate: new Date('2024-10-04'),
        taxAmount: 82.55,
        totalAmount: 717.55,
      },
      {
        shopId,
        repairOrderId: repairOrders[0].id,
        vendorId: vendors[1].id,
        purchaseOrderNumber: 'RO-2024-001-2410-PTRD-001',
        poStatus: 'sent',
        poDate: new Date('2024-09-29'),
        taxAmount: 36.4,
        totalAmount: 316.4,
      },
    ]);

    log(`Created ${purchaseOrders.length} purchase orders`, 'info');
    return purchaseOrders;
  } catch (error) {
    log(`Error seeding purchase orders: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Main seeding function
 */
async function seedDatabase() {
  try {
    log('Starting CollisionOS database seeding...', 'start');
    log(`Database: ${path.resolve(__dirname, '../../data/collisionos.db')}`, 'info');

    // Test database connection
    await sequelize.authenticate();
    log('Database connection established', 'info');

    // Sync database models
    await sequelize.sync({ alter: false });
    log('Database models synchronized', 'info');

    // Seed data in order (respecting foreign key constraints)
    const shop = await seedShop();
    const users = await seedUsers(shop.id);
    const customers = await seedCustomers(shop.id);
    const vehicles = await seedVehicles(shop.id, customers);
    const insuranceCompanies = await seedInsuranceCompanies(shop.id);
    const vendors = await seedVendors(shop.id);

    // Seed collision repair specific data
    const vehicleProfiles = await seedVehicleProfiles(shop.id, customers, vehicles);
    const claims = await seedClaims(shop.id, customers, vehicleProfiles, insuranceCompanies);
    const repairOrders = await seedRepairOrders(shop.id, customers, vehicleProfiles, claims, users);
    const parts = await seedParts(shop.id, repairOrders, vendors);
    // Skip purchase orders for now due to complex schema requirements
    // const purchaseOrders = await seedPurchaseOrders(shop.id, repairOrders, vendors);

    // Summary
    log('\n========================================', 'info');
    log('Database Seeding Summary', 'info');
    log('========================================', 'info');
    log(`Shop: ${shop.name}`, 'info');
    log(`Users: ${users.length} created`, 'info');
    log(`Customers: ${customers.length} created`, 'info');
    log(`Vehicles: ${vehicles.length} created`, 'info');
    log(`Insurance Companies: ${insuranceCompanies.length} created`, 'info');
    log(`Vendors: ${vendors.length} created`, 'info');
    log(`Vehicle Profiles: ${vehicleProfiles.length} created`, 'info');
    log(`Insurance Claims: ${claims.length} created`, 'info');
    log(`Repair Orders: ${repairOrders.length} created`, 'info');
    log(`Parts: ${parts.length} created`, 'info');
    log('========================================', 'info');
    log('✓ Database seeding completed successfully!', 'info');

    // Display test credentials
    log('\n========================================', 'info');
    log('Test Login Credentials', 'info');
    log('========================================', 'info');
    log('Owner Account:', 'info');
    log('  Username: owner', 'info');
    log('  Password: password123', 'info');
    log('', 'info');
    log('Manager Account:', 'info');
    log('  Username: manager', 'info');
    log('  Password: password123', 'info');
    log('', 'info');
    log('Technician Account:', 'info');
    log('  Username: tech1', 'info');
    log('  Password: password123', 'info');
    log('========================================\n', 'info');

  } catch (error) {
    log(`Error during seeding: ${error.message}`, 'error');
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    log('Database connection closed', 'info');
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
