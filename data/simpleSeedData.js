/**
 * Simple Sample Data Generator for CollisionOS BMS System (No external dependencies)
 * Creates realistic customers, vehicles, jobs, and parts data for testing
 */

// Simple data arrays for realistic generation
const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jennifer', 'William', 'Jessica', 'James', 'Ashley', 'Christopher', 'Amanda', 'Daniel'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'];

const vehicleMakes = ['Honda', 'Toyota', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'Volkswagen', 'BMW', 'Mercedes-Benz', 'Audi', 'Mazda', 'Subaru', 'Kia', 'Jeep', 'Ram'];

const vehicleModels = {
  'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey', 'HR-V'],
  'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Prius', 'Sienna'],
  'Ford': ['F-150', 'Escape', 'Explorer', 'Focus', 'Mustang', 'Edge'],
  'Chevrolet': ['Silverado', 'Equinox', 'Malibu', 'Tahoe', 'Cruze', 'Traverse'],
  'Nissan': ['Altima', 'Sentra', 'Rogue', 'Murano', 'Pathfinder', 'Titan'],
  'BMW': ['3 Series', '5 Series', 'X3', 'X5', '2 Series', 'X1'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'GLC', 'GLE', 'A-Class', 'S-Class'],
  'Audi': ['A4', 'A6', 'Q5', 'Q7', 'A3', 'Q3']
};

const colors = ['White', 'Black', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Brown', 'Beige', 'Gold'];
const cities = ['Toronto', 'Mississauga', 'Brampton', 'Hamilton', 'London', 'Ottawa', 'Markham', 'Vaughan', 'Kitchener', 'Windsor'];
const streets = ['Main St', 'King St', 'Queen St', 'Yonge St', 'Bay St', 'University Ave', 'College St', 'Bloor St', 'Dundas St', 'Spadina Ave'];

// Utility functions
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

function generateId() {
  return 'sample-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function generateCustomerNumber(index) {
  return `CUST-${String(index + 1).padStart(4, '0')}`;
}

function generateJobNumber(index) {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${year}${month}${day}-${String(index + 1).padStart(3, '0')}`;
}

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
  
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ123456789';
  let vin = wmi;
  
  // Add random middle section
  for (let i = 0; i < 6; i++) {
    vin += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // Add year code
  const yearCode = {
    2010: 'A', 2011: 'B', 2012: 'C', 2013: 'D', 2014: 'E',
    2015: 'F', 2016: 'G', 2017: 'H', 2018: 'J', 2019: 'K',
    2020: 'L', 2021: 'M', 2022: 'N', 2023: 'P', 2024: 'R'
  }[year] || 'X';
  
  vin += yearCode;
  
  // Add final section
  for (let i = 0; i < 7; i++) {
    vin += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return vin;
}

function generatePhoneNumber() {
  const area = randomChoice(['416', '647', '905', '519', '613']);
  const exchange = randomInt(200, 999);
  const number = randomInt(1000, 9999);
  return `${area}-${exchange}-${number}`;
}

function generateEmail(firstName, lastName) {
  const domains = ['gmail.com', 'yahoo.ca', 'hotmail.com', 'outlook.com', 'bell.net'];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${randomChoice(domains)}`;
}

function generateLicensePlate() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  let plate = '';
  for (let i = 0; i < 3; i++) {
    plate += letters[Math.floor(Math.random() * letters.length)];
  }
  for (let i = 0; i < 3; i++) {
    plate += numbers[Math.floor(Math.random() * numbers.length)];
  }
  
  return plate;
}

function generateAddress() {
  const number = randomInt(100, 9999);
  const street = randomChoice(streets);
  return `${number} ${street}`;
}

/**
 * Generate sample customers
 */
function generateCustomers(count = 15) {
  const customers = [];
  
  for (let i = 0; i < count; i++) {
    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    const customerType = randomChoice(['individual', 'individual', 'individual', 'business', 'fleet']);
    
    const customer = {
      id: generateId(),
      customerNumber: generateCustomerNumber(i),
      firstName,
      lastName,
      email: generateEmail(firstName, lastName),
      phone: generatePhoneNumber(),
      mobile: generatePhoneNumber(),
      address: generateAddress(),
      city: randomChoice(cities),
      state: 'ON',
      zipCode: `M${randomInt(1, 9)}${randomChoice(['A', 'B', 'C', 'E', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'])} ${randomInt(1, 9)}${randomChoice(['A', 'B', 'C', 'E', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'])}${randomInt(0, 9)}`,
      country: 'Canada',
      customerType,
      customerStatus: randomChoice(['active', 'active', 'active', 'prospect', 'vip']),
      preferredContact: randomChoice(['phone', 'email']),
      emailOptIn: Math.random() > 0.2,
      smsOptIn: Math.random() > 0.6,
      companyName: customerType !== 'individual' ? `${lastName} ${randomChoice(['Corp', 'Ltd', 'Inc', 'Enterprises', 'Services'])}` : null,
      loyaltyPoints: randomInt(0, 2500),
      notes: `Sample customer ${i + 1} for testing`,
      isActive: true,
      createdAt: new Date(Date.now() - randomInt(0, 365) * 24 * 60 * 60 * 1000) // Random date in last year
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
  
  customers.forEach((customer, index) => {
    const vehicleCount = Math.random() > 0.7 ? 2 : 1; // 30% chance of 2 vehicles
    
    for (let i = 0; i < vehicleCount; i++) {
      const make = randomChoice(vehicleMakes);
      const models = vehicleModels[make] || ['Model'];
      const model = randomChoice(models);
      const year = randomInt(2010, 2024);
      
      const vehicle = {
        id: generateId(),
        customerId: customer.id,
        vin: generateVIN(make, year),
        licensePlate: generateLicensePlate(),
        state: 'ON',
        year,
        make,
        model,
        trim: randomChoice(['Base', 'LX', 'EX', 'Sport', 'Touring', 'Limited']),
        bodyStyle: randomChoice(['sedan', 'suv', 'truck', 'coupe', 'hatchback']),
        color: randomChoice(colors),
        mileage: randomInt(1000, 200000),
        mileageUnit: 'kilometers',
        vehicleStatus: 'active',
        isActive: true,
        createdAt: new Date(Date.now() - randomInt(0, 180) * 24 * 60 * 60 * 1000) // Random date in last 6 months
      };
      
      vehicles.push(vehicle);
    }
  });
  
  return vehicles;
}

/**
 * Generate sample jobs
 */
function generateJobs(customers, vehicles, count = 25) {
  const jobs = [];
  const statuses = ['estimate', 'intake', 'blueprint', 'parts_ordering', 'parts_receiving', 'body_structure', 'paint_prep', 'paint_booth', 'reassembly', 'quality_control', 'detail', 'ready_pickup', 'delivered'];
  const priorities = ['low', 'normal', 'high', 'urgent'];
  const jobTypes = ['collision', 'glass', 'paint', 'mechanical'];
  
  for (let i = 0; i < count; i++) {
    const customer = randomChoice(customers);
    const customerVehicles = vehicles.filter(v => v.customerId === customer.id);
    const vehicle = randomChoice(customerVehicles);
    
    if (!vehicle) continue;
    
    const status = randomChoice(statuses);
    const priority = randomChoice(priorities);
    const jobType = randomChoice(jobTypes);
    const isInsurance = Math.random() > 0.2; // 80% insurance jobs
    
    const laborAmount = randomFloat(200, 3000);
    const partsAmount = randomFloat(100, 5000);
    const materialsAmount = randomFloat(50, 800);
    const totalAmount = laborAmount + partsAmount + materialsAmount;
    
    const deductible = isInsurance ? randomChoice([250, 500, 1000, 1500]) : 0;
    
    const job = {
      id: generateId(),
      jobNumber: generateJobNumber(i),
      customerId: customer.id,
      vehicleId: vehicle.id,
      status,
      priority,
      jobType,
      claimNumber: isInsurance ? `CLM-24-${String(i + 1).padStart(4, '0')}` : null,
      deductible,
      totalAmount,
      laborAmount,
      partsAmount,
      materialsAmount,
      customerPay: deductible,
      insurancePay: isInsurance ? totalAmount - deductible : 0,
      damageDescription: randomChoice([
        'Minor rear-end collision damage',
        'Side impact damage - driver side',
        'Front-end collision damage',
        'Parking lot damage - multiple panels',
        'Hail damage to hood and roof',
        'Vandalism - keyed paint',
        'Hit and run damage',
        'Single vehicle accident damage'
      ]),
      repairDescription: `${jobType} repair work required`,
      isInsurance,
      paymentMethod: isInsurance ? 'insurance' : randomChoice(['cash', 'credit_card', 'debit_card']),
      paymentStatus: status === 'delivered' ? 'paid' : 'pending',
      estimateStatus: status === 'estimate' ? 'pending' : 'approved',
      checkInDate: new Date(Date.now() - randomInt(0, 60) * 24 * 60 * 60 * 1000), // Random date in last 2 months
      notes: `Sample job ${i + 1} for testing`,
      tags: [jobType, isInsurance ? 'insurance' : 'customer-pay'],
      isActive: true,
      createdAt: new Date(Date.now() - randomInt(0, 90) * 24 * 60 * 60 * 1000) // Random date in last 3 months
    };
    
    jobs.push(job);
  }
  
  return jobs;
}

/**
 * Generate sample parts
 */
function generateParts(count = 50) {
  const parts = [];
  const categories = ['body', 'mechanical', 'electrical', 'interior', 'glass', 'trim', 'lighting'];
  const partTypes = ['oem', 'aftermarket', 'used', 'remanufactured'];
  
  const partDescriptions = {
    body: ['Front Bumper Cover', 'Rear Bumper Cover', 'Hood', 'Fender', 'Door Shell', 'Quarter Panel'],
    mechanical: ['Brake Pads', 'Air Filter', 'Oil Filter', 'Radiator', 'Alternator', 'Starter'],
    electrical: ['Headlight Assembly', 'Taillight', 'Battery', 'Ignition Coil', 'Sensor'],
    interior: ['Seat Cover', 'Dashboard', 'Door Panel', 'Console', 'Floor Mat'],
    glass: ['Windshield', 'Side Window', 'Rear Window', 'Door Glass'],
    trim: ['Chrome Strip', 'Molding', 'Emblem', 'Handle', 'Mirror'],
    lighting: ['Headlight Bulb', 'Taillight Bulb', 'Fog Light', 'Interior Light']
  };
  
  for (let i = 0; i < count; i++) {
    const category = randomChoice(categories);
    const partType = randomChoice(partTypes);
    const make = randomChoice(vehicleMakes);
    const descriptions = partDescriptions[category] || ['Generic Part'];
    
    const part = {
      id: generateId(),
      partNumber: `${make.toUpperCase().substr(0, 3)}-${category.toUpperCase().substr(0, 2)}-${String(i + 1).padStart(6, '0')}`,
      description: randomChoice(descriptions),
      category,
      partType,
      currentStock: randomInt(0, 25),
      minimumStock: randomInt(1, 5),
      costPrice: randomFloat(25, 1500),
      sellingPrice: randomFloat(50, 3000),
      partStatus: randomChoice(['active', 'active', 'active', 'discontinued']),
      supplier: randomChoice(['OEM Direct', 'Parts Plus', 'AutoZone', 'NAPA', 'Aftermarket Depot']),
      isActive: true,
      createdAt: new Date(Date.now() - randomInt(0, 365) * 24 * 60 * 60 * 1000) // Random date in last year
    };
    
    parts.push(part);
  }
  
  return parts;
}

/**
 * Generate default shop data
 */
function generateDefaultShop() {
  return {
    id: generateId(),
    name: 'Default Auto Body Shop',
    businessName: 'Default Auto Body Shop Ltd.',
    email: 'info@defaultautobody.com',
    phone: '(416) 555-0123',
    address: '123 Industrial Way',
    city: 'Toronto',
    state: 'Ontario',
    zipCode: 'M6B 1A6',
    country: 'Canada',
    setupCompleted: true,
    isActive: true,
    createdAt: new Date('2023-01-01')
  };
}

/**
 * Generate default admin user
 */
function generateDefaultUser() {
  return {
    id: generateId(),
    username: 'admin',
    email: 'admin@defaultautobody.com',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'admin',
    isActive: true,
    createdAt: new Date('2023-01-01')
  };
}

/**
 * Generate all sample data
 */
function generateAllSampleData() {
  console.log('🔧 Generating sample data for CollisionOS BMS system...\n');
  
  const shop = generateDefaultShop();
  console.log(`✓ Generated shop: ${shop.name}`);
  
  const adminUser = generateDefaultUser();
  console.log(`✓ Generated admin user: ${adminUser.username}`);
  
  const customers = generateCustomers(15);
  console.log(`✓ Generated ${customers.length} customers`);
  
  const vehicles = generateVehicles(customers);
  console.log(`✓ Generated ${vehicles.length} vehicles`);
  
  const jobs = generateJobs(customers, vehicles, 25);
  console.log(`✓ Generated ${jobs.length} jobs`);
  
  const parts = generateParts(50);
  console.log(`✓ Generated ${parts.length} parts`);
  
  const totalJobValue = jobs.reduce((sum, job) => sum + job.totalAmount, 0);
  const averageJobValue = totalJobValue / jobs.length;
  
  console.log('\n📊 Sample Data Summary:');
  console.log('═══════════════════════');
  console.log(`Customers: ${customers.length}`);
  console.log(`- Individual: ${customers.filter(c => c.customerType === 'individual').length}`);
  console.log(`- Business: ${customers.filter(c => c.customerType === 'business').length}`);
  console.log(`- Fleet: ${customers.filter(c => c.customerType === 'fleet').length}`);
  
  console.log(`\nVehicles: ${vehicles.length}`);
  const makeCount = {};
  vehicles.forEach(v => makeCount[v.make] = (makeCount[v.make] || 0) + 1);
  Object.entries(makeCount).slice(0, 5).forEach(([make, count]) => {
    console.log(`- ${make}: ${count}`);
  });
  
  console.log(`\nJobs: ${jobs.length}`);
  const statusCount = {};
  jobs.forEach(j => statusCount[j.status] = (statusCount[j.status] || 0) + 1);
  Object.entries(statusCount).forEach(([status, count]) => {
    console.log(`- ${status}: ${count}`);
  });
  
  console.log(`\nParts: ${parts.length}`);
  const categoryCount = {};
  parts.forEach(p => categoryCount[p.category] = (categoryCount[p.category] || 0) + 1);
  Object.entries(categoryCount).forEach(([category, count]) => {
    console.log(`- ${category}: ${count}`);
  });
  
  console.log('\n💰 Financial Summary:');
  console.log('═════════════════════');
  console.log(`Total Job Value: $${totalJobValue.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`);
  console.log(`Average Job Value: $${averageJobValue.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`);
  
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
      totalJobValue,
      averageJobValue
    }
  };
}

// Export functions
module.exports = {
  generateAllSampleData,
  generateCustomers,
  generateVehicles,
  generateJobs,
  generateParts,
  generateDefaultShop,
  generateDefaultUser
};

// Run if called directly
if (require.main === module) {
  const data = generateAllSampleData();
  
  console.log('\n🎯 Ready for BMS Testing:');
  console.log('1. Import BMS XML files from: data/Example BMS/');
  console.log('2. Use generated sample data for realistic testing');
  console.log('3. Test various BMS import scenarios');
  
  console.log('\n✅ Sample data generation complete!');
}