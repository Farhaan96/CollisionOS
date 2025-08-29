/**
 * Comprehensive Sample Data Generator for CollisionOS BMS System
 * Creates realistic customers, vehicles, jobs, and parts data for testing
 */

const { faker } = require('@faker-js/faker');

// Configuration
const CUSTOMERS_COUNT = 15;
const VEHICLES_PER_CUSTOMER = 1.2; // Average vehicles per customer
const JOBS_COUNT = 25;
const PARTS_COUNT = 50;

// Sample data arrays for realistic generation
const vehicleMakes = [
  'Honda', 'Toyota', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'Volkswagen',
  'BMW', 'Mercedes-Benz', 'Audi', 'Mazda', 'Subaru', 'Kia', 'Jeep', 'Ram'
];

const vehicleModels = {
  'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey', 'HR-V'],
  'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Prius', 'Sienna'],
  'Ford': ['F-150', 'Escape', 'Explorer', 'Focus', 'Mustang', 'Edge'],
  'Chevrolet': ['Silverado', 'Equinox', 'Malibu', 'Tahoe', 'Cruze', 'Traverse'],
  'Nissan': ['Altima', 'Sentra', 'Rogue', 'Murano', 'Pathfinder', 'Titan'],
  'Hyundai': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Accent', 'Palisade'],
  'Volkswagen': ['Jetta', 'Passat', 'Tiguan', 'Atlas', 'Golf', 'ID.4'],
  'BMW': ['3 Series', '5 Series', 'X3', 'X5', '2 Series', 'X1'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'GLC', 'GLE', 'A-Class', 'S-Class'],
  'Audi': ['A4', 'A6', 'Q5', 'Q7', 'A3', 'Q3'],
  'Mazda': ['CX-5', 'Mazda3', 'CX-9', 'CX-3', 'Mazda6', 'MX-5'],
  'Subaru': ['Outback', 'Forester', 'Impreza', 'Ascent', 'Legacy', 'Crosstrek'],
  'Kia': ['Forte', 'Optima', 'Sorento', 'Sportage', 'Soul', 'Telluride'],
  'Jeep': ['Grand Cherokee', 'Cherokee', 'Wrangler', 'Compass', 'Renegade', 'Gladiator'],
  'Ram': ['1500', '2500', '3500', 'ProMaster', 'ProMaster City']
};

const bodyStyles = ['sedan', 'suv', 'truck', 'coupe', 'wagon', 'hatchback', 'van'];
const colors = [
  'White', 'Black', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Brown',
  'Beige', 'Gold', 'Orange', 'Yellow', 'Purple', 'Maroon', 'Navy'
];

const insuranceCompanies = [
  'State Farm Insurance', 'Intact Insurance', 'TD Insurance', 'Co-operators Insurance',
  'Desjardins Insurance', 'Aviva Insurance', 'Allstate Insurance', 'Wawanesa Insurance',
  'RSA Insurance', 'Economical Insurance', 'CAA Insurance', 'Chubb Insurance'
];

const damageTypes = [
  'Minor rear-end collision', 'Side impact damage', 'Front-end collision',
  'Parking lot damage', 'Hail damage', 'Vandalism', 'Hit and run',
  'Multi-vehicle accident', 'Single vehicle accident', 'Weather damage',
  'Door ding', 'Scratches and scuffs', 'Bumper damage', 'Glass damage'
];

const partCategories = [
  'body', 'mechanical', 'electrical', 'interior', 'glass', 'trim', 'lighting'
];

const partTypes = ['oem', 'aftermarket', 'used', 'remanufactured'];

const jobStatuses = [
  'estimate', 'intake', 'blueprint', 'parts_ordering', 'parts_receiving',
  'body_structure', 'paint_prep', 'paint_booth', 'reassembly',
  'quality_control', 'detail', 'ready_pickup', 'delivered'
];

const priorities = ['low', 'normal', 'high', 'urgent'];

/**
 * Generate sample customers
 */
function generateCustomers() {
  const customers = [];
  
  for (let i = 0; i < CUSTOMERS_COUNT; i++) {
    const customerType = faker.helpers.arrayElement(['individual', 'business', 'fleet']);
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    
    const customer = {
      id: faker.string.uuid(),
      customerNumber: `CUST-${String(i + 1).padStart(4, '0')}`,
      firstName,
      lastName,
      email: faker.internet.email({ firstName, lastName }),
      phone: faker.phone.number('###-###-####'),
      mobile: faker.phone.number('###-###-####'),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zipCode: faker.location.zipCode(),
      country: 'Canada',
      dateOfBirth: customerType === 'individual' ? faker.date.birthdate({ min: 18, max: 75, mode: 'age' }) : null,
      driverLicense: customerType === 'individual' ? faker.vehicle.vrm() : null,
      preferredContact: faker.helpers.arrayElement(['phone', 'email', 'sms']),
      smsOptIn: faker.datatype.boolean(),
      emailOptIn: faker.datatype.boolean({ probability: 0.8 }),
      marketingOptIn: faker.datatype.boolean({ probability: 0.3 }),
      customerType,
      customerStatus: faker.helpers.arrayElement(['active', 'prospect', 'vip']),
      companyName: customerType === 'business' || customerType === 'fleet' ? faker.company.name() : null,
      taxId: customerType === 'business' || customerType === 'fleet' ? faker.finance.accountNumber(9) : null,
      creditLimit: customerType === 'business' || customerType === 'fleet' ? faker.number.float({ min: 5000, max: 50000, fractionDigits: 2 }) : 0,
      paymentTerms: customerType === 'business' || customerType === 'fleet' ? faker.helpers.arrayElement(['net_15', 'net_30', 'net_60']) : 'immediate',
      loyaltyPoints: faker.number.int({ min: 0, max: 5000 }),
      referralSource: faker.helpers.arrayElement(['Google', 'Facebook', 'Referral', 'Insurance', 'Drive-by', 'Repeat', null]),
      notes: faker.lorem.sentences({ min: 0, max: 3 }),
      firstVisitDate: faker.date.between({ from: '2023-01-01', to: new Date() }),
      lastVisitDate: faker.date.between({ from: '2024-01-01', to: new Date() }),
      isActive: true,
      createdAt: faker.date.between({ from: '2023-01-01', to: new Date() })
    };
    
    customers.push(customer);
  }
  
  return customers;
}

/**
 * Generate sample vehicles
 */
function generateVehicles(customers) {
  const vehicles = [];
  
  customers.forEach((customer, customerIndex) => {
    const vehicleCount = Math.floor(VEHICLES_PER_CUSTOMER + (Math.random() > 0.8 ? 1 : 0));
    
    for (let i = 0; i < vehicleCount; i++) {
      const make = faker.helpers.arrayElement(vehicleMakes);
      const model = faker.helpers.arrayElement(vehicleModels[make]);
      const year = faker.number.int({ min: 2010, max: 2024 });
      const bodyStyle = faker.helpers.arrayElement(bodyStyles);
      
      // Generate realistic VIN
      const vin = generateVIN(make, year);
      
      const vehicle = {
        id: faker.string.uuid(),
        customerId: customer.id,
        vin,
        licensePlate: faker.vehicle.vrm(),
        state: 'ON', // Ontario
        year,
        make,
        model,
        trim: faker.vehicle.model(),
        bodyStyle,
        color: faker.helpers.arrayElement(colors),
        colorCode: faker.color.rgb().replace('#', ''),
        engineSize: generateEngineSize(),
        engineType: faker.helpers.arrayElement(['I4', 'V6', 'V8', 'Turbo I4', 'Hybrid']),
        transmission: faker.helpers.arrayElement(['Manual', 'Automatic', 'CVT']),
        fuelType: faker.helpers.arrayElement(['gasoline', 'hybrid', 'electric', 'diesel']),
        mileage: faker.number.int({ min: 1000, max: 300000 }),
        mileageUnit: 'kilometers',
        insuranceCompany: faker.helpers.arrayElement(insuranceCompanies),
        policyNumber: `POL-${faker.string.alphanumeric(9).toUpperCase()}`,
        vehicleStatus: 'active',
        features: generateVehicleFeatures(make, year),
        notes: faker.lorem.sentence(),
        warrantyExpiry: year >= 2020 ? faker.date.future({ years: 3 }) : null,
        warrantyType: year >= 2020 ? 'manufacturer' : 'none',
        isActive: true,
        createdAt: faker.date.between({ from: '2023-01-01', to: new Date() })
      };
      
      vehicles.push(vehicle);
    }
  });
  
  return vehicles;
}

/**
 * Generate sample jobs
 */
function generateJobs(customers, vehicles) {
  const jobs = [];
  
  for (let i = 0; i < JOBS_COUNT; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const customerVehicles = vehicles.filter(v => v.customerId === customer.id);
    const vehicle = faker.helpers.arrayElement(customerVehicles);
    
    if (!vehicle) continue;
    
    const status = faker.helpers.arrayElement(jobStatuses);
    const priority = faker.helpers.arrayElement(priorities);
    const jobType = faker.helpers.arrayElement(['collision', 'glass', 'paint', 'mechanical']);
    const isInsurance = faker.datatype.boolean({ probability: 0.8 });
    
    const laborAmount = faker.number.float({ min: 200, max: 5000, fractionDigits: 2 });
    const partsAmount = faker.number.float({ min: 100, max: 8000, fractionDigits: 2 });
    const materialsAmount = faker.number.float({ min: 50, max: 1000, fractionDigits: 2 });
    const totalAmount = laborAmount + partsAmount + materialsAmount;
    
    const deductible = isInsurance ? faker.number.float({ min: 250, max: 2000, fractionDigits: 2 }) : 0;
    const insurancePay = isInsurance ? totalAmount - deductible : 0;
    const customerPay = isInsurance ? deductible : totalAmount;
    
    const checkInDate = faker.date.between({ from: '2024-01-01', to: new Date() });
    const estimatedDays = faker.number.int({ min: 3, max: 21 });
    const targetDeliveryDate = new Date(checkInDate);
    targetDeliveryDate.setDate(targetDeliveryDate.getDate() + estimatedDays);
    
    const job = {
      id: faker.string.uuid(),
      jobNumber: generateJobNumber(i + 1),
      customerId: customer.id,
      vehicleId: vehicle.id,
      status,
      priority,
      jobType,
      claimNumber: isInsurance ? `CLM-24-${String(i + 1).padStart(4, '0')}` : null,
      deductible,
      customerPay,
      insurancePay,
      totalAmount,
      laborAmount,
      partsAmount,
      materialsAmount,
      subletAmount: faker.number.float({ min: 0, max: 500, fractionDigits: 2 }),
      taxAmount: totalAmount * 0.13, // 13% HST in Ontario
      estimatedHours: faker.number.float({ min: 5, max: 80, fractionDigits: 1 }),
      actualHours: status === 'delivered' ? faker.number.float({ min: 5, max: 80, fractionDigits: 1 }) : null,
      targetDeliveryDate,
      actualDeliveryDate: status === 'delivered' ? faker.date.between({ from: checkInDate, to: new Date() }) : null,
      checkInDate,
      startDate: ['body_structure', 'paint_prep', 'paint_booth', 'reassembly', 'quality_control', 'detail', 'ready_pickup', 'delivered'].includes(status) 
        ? faker.date.between({ from: checkInDate, to: new Date() }) : null,
      completionDate: status === 'delivered' ? faker.date.between({ from: checkInDate, to: new Date() }) : null,
      damageDescription: faker.helpers.arrayElement(damageTypes),
      repairDescription: generateRepairDescription(jobType),
      notes: faker.lorem.sentences({ min: 1, max: 3 }),
      isDRP: faker.datatype.boolean({ probability: 0.3 }),
      isWarranty: faker.datatype.boolean({ probability: 0.1 }),
      isRush: priority === 'urgent',
      isInsurance,
      isCustomerPay: !isInsurance,
      paymentMethod: isInsurance ? 'insurance' : faker.helpers.arrayElement(['cash', 'credit_card', 'debit_card']),
      paymentStatus: status === 'delivered' ? 'paid' : 'pending',
      invoiceStatus: status === 'delivered' ? 'paid' : (status === 'ready_pickup' ? 'sent' : 'draft'),
      estimateStatus: ['estimate'].includes(status) ? 'pending' : 'approved',
      partsStatus: generatePartsStatus(status),
      qualityStatus: generateQualityStatus(status),
      calibrationStatus: jobType === 'glass' || faker.datatype.boolean({ probability: 0.2 }) ? 'pending' : 'not_required',
      photosRequired: true,
      photosTaken: !['estimate', 'intake'].includes(status),
      photosCount: faker.number.int({ min: 5, max: 25 }),
      documentsRequired: isInsurance,
      documentsReceived: isInsurance && !['estimate', 'intake'].includes(status),
      authorizationReceived: !['estimate'].includes(status),
      authorizationDate: !['estimate'].includes(status) ? faker.date.between({ from: checkInDate, to: new Date() }) : null,
      authorizationMethod: 'phone',
      rentalRequired: faker.datatype.boolean({ probability: 0.4 }),
      rentalProvided: faker.datatype.boolean({ probability: 0.6 }),
      towRequired: faker.datatype.boolean({ probability: 0.2 }),
      tags: generateJobTags(jobType, priority, isInsurance),
      customFields: {},
      workflow: {},
      timeline: [],
      history: [],
      metadata: {
        source: 'manual_entry',
        importedFrom: null,
        bmsData: null
      },
      isArchived: false,
      createdAt: faker.date.between({ from: '2023-01-01', to: new Date() })
    };
    
    jobs.push(job);
  }
  
  return jobs;
}

/**
 * Generate sample parts
 */
function generateParts() {
  const parts = [];
  
  for (let i = 0; i < PARTS_COUNT; i++) {
    const category = faker.helpers.arrayElement(partCategories);
    const partType = faker.helpers.arrayElement(partTypes);
    const make = faker.helpers.arrayElement(vehicleMakes);
    
    const part = {
      id: faker.string.uuid(),
      partNumber: generatePartNumber(make, category),
      oemPartNumber: faker.datatype.boolean({ probability: 0.7 }) ? generateOEMPartNumber(make) : null,
      description: generatePartDescription(category),
      category,
      partType,
      currentStock: faker.number.int({ min: 0, max: 50 }),
      minimumStock: faker.number.int({ min: 1, max: 10 }),
      costPrice: faker.number.float({ min: 25, max: 2500, fractionDigits: 2 }),
      sellingPrice: faker.number.float({ min: 50, max: 5000, fractionDigits: 2 }),
      partStatus: faker.helpers.arrayElement(['active', 'discontinued', 'special_order']),
      supplier: generateSupplierName(partType),
      supplierPartNumber: faker.string.alphanumeric(8).toUpperCase(),
      leadTime: faker.number.int({ min: 1, max: 30 }),
      weight: faker.number.float({ min: 0.1, max: 50, fractionDigits: 2 }),
      dimensions: `${faker.number.int({ min: 5, max: 200 })}x${faker.number.int({ min: 5, max: 100 })}x${faker.number.int({ min: 2, max: 50 })}cm`,
      compatibility: {
        makes: [make],
        years: [faker.number.int({ min: 2010, max: 2024 })],
        models: faker.helpers.arrayElements(vehicleModels[make] || [], { min: 1, max: 3 })
      },
      warranty: {
        period: faker.number.int({ min: 6, max: 36 }),
        unit: 'months',
        type: faker.helpers.arrayElement(['manufacturer', 'supplier', 'shop'])
      },
      notes: faker.lorem.sentence(),
      isActive: true,
      createdAt: faker.date.between({ from: '2023-01-01', to: new Date() })
    };
    
    parts.push(part);
  }
  
  return parts;
}

// Helper functions for realistic data generation

function generateVIN(make, year) {
  const wmi = {
    'Honda': '1HG',
    'Toyota': '1T0',
    'Ford': '1F0',
    'Chevrolet': '1G1',
    'Nissan': '1N4',
    'BMW': 'WBA',
    'Mercedes-Benz': 'WDD'
  }[make] || '1XX';
  
  const yearCode = {
    2010: 'A', 2011: 'B', 2012: 'C', 2013: 'D', 2014: 'E',
    2015: 'F', 2016: 'G', 2017: 'H', 2018: 'J', 2019: 'K',
    2020: 'L', 2021: 'M', 2022: 'N', 2023: 'P', 2024: 'R'
  }[year] || 'X';
  
  return wmi + faker.string.alphanumeric(6).toUpperCase() + yearCode + faker.string.alphanumeric(7).toUpperCase();
}

function generateEngineSize() {
  const sizes = ['1.0L', '1.4L', '1.6L', '1.8L', '2.0L', '2.4L', '2.5L', '3.0L', '3.5L', '4.0L', '5.0L', '6.0L'];
  return faker.helpers.arrayElement(sizes);
}

function generateVehicleFeatures(make, year) {
  const features = {};
  
  if (year >= 2018) {
    features.bluetooth = true;
    features.backupCamera = true;
  }
  
  if (year >= 2020) {
    features.appleCarPlay = faker.datatype.boolean({ probability: 0.8 });
    features.androidAuto = faker.datatype.boolean({ probability: 0.8 });
    features.blindSpotMonitoring = faker.datatype.boolean({ probability: 0.6 });
  }
  
  if (['BMW', 'Mercedes-Benz', 'Audi'].includes(make)) {
    features.premium = true;
    features.navigation = faker.datatype.boolean({ probability: 0.9 });
    features.heatedSeats = faker.datatype.boolean({ probability: 0.8 });
    features.sunroof = faker.datatype.boolean({ probability: 0.7 });
  }
  
  return features;
}

function generateJobNumber(index) {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${year}${month}${day}-${String(index).padStart(3, '0')}`;
}

function generateRepairDescription(jobType) {
  const descriptions = {
    collision: 'Body repair and paint work required due to collision damage',
    glass: 'Glass replacement and ADAS calibration',
    paint: 'Paint restoration and refinishing work',
    mechanical: 'Mechanical repairs and component replacement'
  };
  
  return descriptions[jobType] || 'General repair work required';
}

function generatePartsStatus(status) {
  if (['estimate', 'intake'].includes(status)) return 'pending';
  if (['blueprint', 'parts_ordering'].includes(status)) return 'ordered';
  if (['parts_receiving'].includes(status)) return 'partial';
  return 'received';
}

function generateQualityStatus(status) {
  if (['delivered'].includes(status)) return 'passed';
  if (['quality_control'].includes(status)) return 'in_progress';
  if (['estimate', 'intake', 'blueprint', 'parts_ordering', 'parts_receiving'].includes(status)) return 'pending';
  return 'pending';
}

function generateJobTags(jobType, priority, isInsurance) {
  const tags = [jobType];
  
  if (priority === 'urgent' || priority === 'high') {
    tags.push('rush');
  }
  
  if (isInsurance) {
    tags.push('insurance');
  } else {
    tags.push('customer-pay');
  }
  
  if (faker.datatype.boolean({ probability: 0.2 })) {
    tags.push('comeback');
  }
  
  if (faker.datatype.boolean({ probability: 0.1 })) {
    tags.push('warranty');
  }
  
  return tags;
}

function generatePartNumber(make, category) {
  const makePrefix = {
    'Honda': 'HN',
    'Toyota': 'TY',
    'Ford': 'FD',
    'Chevrolet': 'CH',
    'Nissan': 'NS',
    'BMW': 'BM',
    'Mercedes-Benz': 'MB'
  }[make] || 'XX';
  
  const categoryCode = {
    'body': 'BD',
    'mechanical': 'MC',
    'electrical': 'EL',
    'interior': 'IN',
    'glass': 'GL',
    'trim': 'TR',
    'lighting': 'LT'
  }[category] || 'XX';
  
  return `${makePrefix}-${categoryCode}-${faker.string.numeric(6)}`;
}

function generateOEMPartNumber(make) {
  const patterns = {
    'Honda': () => `${faker.string.numeric(5)}-${faker.string.alpha(3).toUpperCase()}-${faker.string.alphanumeric(3).toUpperCase()}`,
    'Toyota': () => `${faker.string.numeric(5)}-${faker.string.numeric(5)}`,
    'Ford': () => `${faker.string.alpha(1).toUpperCase()}${faker.string.numeric(3)}-${faker.string.numeric(2)}-${faker.string.numeric(3)}`,
    'BMW': () => `${faker.string.numeric(2)} ${faker.string.numeric(2)} ${faker.string.numeric(1)} ${faker.string.numeric(6)}`,
    'Mercedes-Benz': () => `A${faker.string.numeric(3)}${faker.string.numeric(3)}${faker.string.numeric(2)}${faker.string.numeric(2)}`
  };
  
  const pattern = patterns[make];
  return pattern ? pattern() : faker.string.alphanumeric(10).toUpperCase();
}

function generatePartDescription(category) {
  const descriptions = {
    body: [
      'Front Bumper Cover', 'Rear Bumper Cover', 'Hood', 'Front Fender', 'Rear Quarter Panel',
      'Door Shell', 'Rocker Panel', 'Trunk Lid', 'Front Grille', 'Side Mirror'
    ],
    mechanical: [
      'Brake Pad Set', 'Air Filter', 'Oil Filter', 'Spark Plugs', 'Radiator',
      'Alternator', 'Starter Motor', 'Fuel Pump', 'Water Pump', 'Timing Belt'
    ],
    electrical: [
      'Headlight Assembly', 'Taillight Assembly', 'Turn Signal Bulb', 'Battery',
      'ECU Module', 'Ignition Coil', 'Oxygen Sensor', 'Mass Air Flow Sensor'
    ],
    interior: [
      'Seat Cover', 'Dashboard Trim', 'Door Panel', 'Console Lid', 'Floor Mat',
      'Steering Wheel', 'Gear Shift Knob', 'Cup Holder', 'Armrest'
    ],
    glass: [
      'Windshield', 'Rear Window', 'Side Window', 'Door Glass', 'Quarter Glass',
      'Windshield Molding', 'Glass Adhesive', 'Window Regulator'
    ],
    trim: [
      'Chrome Strip', 'Body Side Molding', 'Door Handle', 'Antenna',
      'Wheel Cover', 'License Plate Frame', 'Emblem', 'Weather Stripping'
    ],
    lighting: [
      'Headlight Bulb', 'Taillight Bulb', 'Fog Light', 'Interior Light',
      'License Plate Light', 'Side Marker Light', 'Backup Light'
    ]
  };
  
  const categoryDescriptions = descriptions[category] || ['Generic Part'];
  return faker.helpers.arrayElement(categoryDescriptions);
}

function generateSupplierName(partType) {
  const suppliers = {
    oem: ['Honda Parts', 'Toyota Genuine', 'Ford Motorcraft', 'GM Parts', 'Nissan Parts'],
    aftermarket: ['AutoZone', 'NAPA', 'Dorman', 'Febi', 'Bosch', 'Continental'],
    used: ['LKQ Corporation', 'Keystone Automotive', 'Schnitzer Steel', 'Pick-n-Pull'],
    remanufactured: ['Cardone', 'A1 Remanufacturing', 'Bosch Exchange', 'Denso Remanufactured']
  };
  
  const supplierList = suppliers[partType] || suppliers.aftermarket;
  return faker.helpers.arrayElement(supplierList);
}

// Default shop data
function generateDefaultShop() {
  return {
    id: faker.string.uuid(),
    name: 'Default Auto Body Shop',
    businessName: 'Default Auto Body Shop Ltd.',
    email: 'info@defaultautobody.com',
    phone: '(416) 555-0123',
    mobile: '(647) 555-0456',
    fax: '(416) 555-0124',
    address: '123 Industrial Way',
    city: 'Toronto',
    state: 'Ontario',
    zipCode: 'M6B 1A6',
    country: 'Canada',
    website: 'https://www.defaultautobody.com',
    businessNumber: '123456789RT0001',
    hstNumber: '123456789RT0001',
    licenseNumber: 'MVDA-12345',
    setupCompleted: true,
    isActive: true,
    businessHours: {
      monday: { open: '08:00', close: '17:00', closed: false },
      tuesday: { open: '08:00', close: '17:00', closed: false },
      wednesday: { open: '08:00', close: '17:00', closed: false },
      thursday: { open: '08:00', close: '17:00', closed: false },
      friday: { open: '08:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '13:00', closed: false },
      sunday: { open: '00:00', close: '00:00', closed: true }
    },
    services: [
      'Collision Repair',
      'Auto Body Repair',
      'Paint Services',
      'Glass Replacement',
      'Frame Straightening',
      'Insurance Claims',
      'Custom Paint',
      'Detailing'
    ],
    certifications: [
      'I-CAR Gold Class',
      'OEM Certified',
      'PPG Certified',
      'ASE Certified'
    ],
    createdAt: new Date('2023-01-01')
  };
}

// Default admin user
function generateDefaultUser() {
  return {
    id: faker.string.uuid(),
    username: 'admin',
    email: 'admin@defaultautobody.com',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'admin',
    permissions: ['all'],
    isActive: true,
    lastLogin: new Date(),
    createdAt: new Date('2023-01-01')
  };
}

// Export the main generation function
function generateAllSampleData() {
  console.log('Generating comprehensive sample data for CollisionOS BMS system...\n');
  
  const shop = generateDefaultShop();
  console.log(`✓ Generated shop: ${shop.name}`);
  
  const adminUser = generateDefaultUser();
  console.log(`✓ Generated admin user: ${adminUser.username}`);
  
  const customers = generateCustomers();
  console.log(`✓ Generated ${customers.length} customers`);
  
  const vehicles = generateVehicles(customers);
  console.log(`✓ Generated ${vehicles.length} vehicles`);
  
  const jobs = generateJobs(customers, vehicles);
  console.log(`✓ Generated ${jobs.length} jobs`);
  
  const parts = generateParts();
  console.log(`✓ Generated ${parts.length} parts`);
  
  console.log('\n=== Sample Data Summary ===');
  console.log(`Customers: ${customers.length}`);
  console.log(`- Individual: ${customers.filter(c => c.customerType === 'individual').length}`);
  console.log(`- Business: ${customers.filter(c => c.customerType === 'business').length}`);
  console.log(`- Fleet: ${customers.filter(c => c.customerType === 'fleet').length}`);
  
  console.log(`\nVehicles: ${vehicles.length}`);
  const vehiclesByMake = vehicles.reduce((acc, v) => {
    acc[v.make] = (acc[v.make] || 0) + 1;
    return acc;
  }, {});
  Object.entries(vehiclesByMake).slice(0, 5).forEach(([make, count]) => {
    console.log(`- ${make}: ${count}`);
  });
  
  console.log(`\nJobs: ${jobs.length}`);
  const jobsByStatus = jobs.reduce((acc, j) => {
    acc[j.status] = (acc[j.status] || 0) + 1;
    return acc;
  }, {});
  Object.entries(jobsByStatus).forEach(([status, count]) => {
    console.log(`- ${status}: ${count}`);
  });
  
  console.log(`\nParts: ${parts.length}`);
  const partsByCategory = parts.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});
  Object.entries(partsByCategory).forEach(([category, count]) => {
    console.log(`- ${category}: ${count}`);
  });
  
  return {
    shop,
    adminUser,
    customers,
    vehicles,
    jobs,
    parts,
    stats: {
      customers: customers.length,
      vehicles: vehicles.length,
      jobs: jobs.length,
      parts: parts.length,
      totalEstimateValue: jobs.reduce((sum, job) => sum + job.totalAmount, 0)
    }
  };
}

module.exports = {
  generateAllSampleData,
  generateCustomers,
  generateVehicles,
  generateJobs,
  generateParts,
  generateDefaultShop,
  generateDefaultUser
};

// If running directly, generate and display the data
if (require.main === module) {
  const sampleData = generateAllSampleData();
  
  console.log('\n=== Financial Summary ===');
  console.log(`Total Estimate Value: $${sampleData.stats.totalEstimateValue.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`);
  console.log(`Average Job Value: $${(sampleData.stats.totalEstimateValue / sampleData.stats.jobs).toLocaleString('en-CA', { minimumFractionDigits: 2 })}`);
  
  console.log('\n✅ Sample data generation complete!');
  console.log('\nTo use this data:');
  console.log('1. Import BMS XML files from: data/Example BMS/');
  console.log('2. Use the generated sample data to seed your database');
  console.log('3. Test the BMS import functionality with the provided files');
}