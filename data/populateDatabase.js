/**
 * Database Population Script for CollisionOS
 * Populates the database with sample data and imports BMS files
 */

const fs = require('fs').promises;
const path = require('path');
const { generateAllSampleData } = require('./seedData');

/**
 * Mock database operations for demonstration
 * In a real implementation, these would connect to your actual database
 */
class MockDatabase {
  constructor() {
    this.customers = [];
    this.vehicles = [];
    this.jobs = [];
    this.parts = [];
    this.shop = null;
    this.users = [];
    this.bmsImports = [];
  }

  async createShop(shopData) {
    this.shop = { ...shopData, id: this.generateId() };
    return this.shop;
  }

  async createUser(userData) {
    const user = { ...userData, id: this.generateId() };
    this.users.push(user);
    return user;
  }

  async createCustomer(customerData) {
    const customer = { ...customerData, id: this.generateId() };
    this.customers.push(customer);
    return customer;
  }

  async createVehicle(vehicleData) {
    const vehicle = { ...vehicleData, id: this.generateId() };
    this.vehicles.push(vehicle);
    return vehicle;
  }

  async createJob(jobData) {
    const job = { ...jobData, id: this.generateId() };
    this.jobs.push(job);
    return job;
  }

  async createPart(partData) {
    const part = { ...partData, id: this.generateId() };
    this.parts.push(part);
    return part;
  }

  async recordBMSImport(importData) {
    const record = { ...importData, id: this.generateId(), importedAt: new Date() };
    this.bmsImports.push(record);
    return record;
  }

  generateId() {
    return 'mock-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  getStats() {
    return {
      shop: this.shop ? 1 : 0,
      users: this.users.length,
      customers: this.customers.length,
      vehicles: this.vehicles.length,
      jobs: this.jobs.length,
      parts: this.parts.length,
      bmsImports: this.bmsImports.length
    };
  }

  getAllData() {
    return {
      shop: this.shop,
      users: this.users,
      customers: this.customers,
      vehicles: this.vehicles,
      jobs: this.jobs,
      parts: this.parts,
      bmsImports: this.bmsImports
    };
  }
}

/**
 * Mock BMS Service for processing XML files
 */
class MockBMSService {
  constructor(database) {
    this.db = database;
  }

  async processBMSFile(filePath) {
    try {
      console.log(`Processing BMS file: ${path.basename(filePath)}`);
      
      // Read the XML file
      const xmlContent = await fs.readFile(filePath, 'utf-8');
      
      // Extract basic data from filename for mock processing
      const filename = path.basename(filePath, '.xml');
      const mockData = this.generateMockDataFromFilename(filename, xmlContent);
      
      // Create customer
      const customer = await this.db.createCustomer(mockData.customer);
      console.log(`  ✓ Created customer: ${customer.firstName} ${customer.lastName}`);
      
      // Create vehicle
      const vehicle = await this.db.createVehicle({
        ...mockData.vehicle,
        customerId: customer.id
      });
      console.log(`  ✓ Created vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}`);
      
      // Create job
      const job = await this.db.createJob({
        ...mockData.job,
        customerId: customer.id,
        vehicleId: vehicle.id
      });
      console.log(`  ✓ Created job: ${job.jobNumber} (${job.status})`);
      
      // Record the BMS import
      const importRecord = await this.db.recordBMSImport({
        filename: path.basename(filePath),
        filePath,
        customerId: customer.id,
        vehicleId: vehicle.id,
        jobId: job.id,
        status: 'success',
        dataExtracted: {
          customerInfo: mockData.customer,
          vehicleInfo: mockData.vehicle,
          jobInfo: mockData.job,
          totalAmount: mockData.job.totalAmount
        }
      });
      
      console.log(`  ✓ Import recorded with ID: ${importRecord.id}`);
      
      return {
        success: true,
        customer,
        vehicle,
        job,
        importRecord
      };
      
    } catch (error) {
      console.error(`  ✗ Error processing ${path.basename(filePath)}:`, error.message);
      
      const importRecord = await this.db.recordBMSImport({
        filename: path.basename(filePath),
        filePath,
        status: 'error',
        error: error.message
      });
      
      return {
        success: false,
        error: error.message,
        importRecord
      };
    }
  }

  generateMockDataFromFilename(filename, xmlContent) {
    // Extract estimate number and other details from XML for more realistic data
    const estimateMatch = xmlContent.match(/<DocumentID>(.*?)<\/DocumentID>/);
    const claimMatch = xmlContent.match(/<ClaimNum>(.*?)<\/ClaimNum>/);
    const vinMatch = xmlContent.match(/<VINNum>(.*?)<\/VINNum>/);
    const makeMatch = xmlContent.match(/<MakeDesc>(.*?)<\/MakeDesc>/);
    const modelMatch = xmlContent.match(/<ModelName>(.*?)<\/ModelName>/);
    const yearMatch = xmlContent.match(/<ModelYear>(.*?)<\/ModelYear>/);
    const customerFirstMatch = xmlContent.match(/<FirstName>(.*?)<\/FirstName>/);
    const customerLastMatch = xmlContent.match(/<LastName>(.*?)<\/LastName>/);
    const totalMatch = xmlContent.match(/<TotalAmt>(.*?)<\/TotalAmt>/);

    // Map filename patterns to mock data
    const patterns = {
      minor_collision: {
        priority: 'normal',
        jobType: 'collision',
        damageDescription: 'Minor collision damage - rear bumper and taillight',
        estimatedAmount: 850,
        deductible: 500
      },
      major_collision: {
        priority: 'high',
        jobType: 'collision',
        damageDescription: 'Major side impact collision - extensive repairs required',
        estimatedAmount: 5200,
        deductible: 1000
      },
      glass_replacement: {
        priority: 'normal',
        jobType: 'glass',
        damageDescription: 'Windshield replacement due to vandalism',
        estimatedAmount: 920,
        deductible: 0
      },
      paint_only: {
        priority: 'low',
        jobType: 'paint',
        damageDescription: 'Paint restoration due to environmental damage',
        estimatedAmount: 1575,
        deductible: 300
      },
      luxury_vehicle: {
        priority: 'urgent',
        jobType: 'collision',
        damageDescription: 'Luxury vehicle collision - premium parts required',
        estimatedAmount: 20879,
        deductible: 2500
      }
    };

    // Find matching pattern
    const patternKey = Object.keys(patterns).find(key => filename.includes(key));
    const pattern = patterns[patternKey] || patterns.minor_collision;

    // Generate customer data
    const customer = {
      customerNumber: `CUST-BMS-${Date.now().toString().slice(-4)}`,
      firstName: customerFirstMatch ? customerFirstMatch[1] : this.getRandomFirstName(),
      lastName: customerLastMatch ? customerLastMatch[1] : this.getRandomLastName(),
      email: `${filename.replace(/_/g, '.')}@email.com`,
      phone: this.generatePhoneNumber(),
      address: this.getRandomAddress(),
      city: 'Toronto',
      state: 'ON',
      zipCode: 'M5V 3A8',
      country: 'Canada',
      customerType: 'individual',
      customerStatus: 'active',
      preferredContact: 'phone',
      emailOptIn: true,
      smsOptIn: false,
      isActive: true,
      createdAt: new Date()
    };

    // Generate vehicle data
    const vehicle = {
      vin: vinMatch ? vinMatch[1] : this.generateMockVIN(),
      licensePlate: this.generateLicensePlate(),
      state: 'ON',
      year: yearMatch ? parseInt(yearMatch[1]) : 2021,
      make: makeMatch ? makeMatch[1] : 'Honda',
      model: modelMatch ? modelMatch[1] : 'Civic',
      trim: 'LX',
      bodyStyle: 'sedan',
      color: this.getRandomColor(),
      mileage: Math.floor(Math.random() * 100000) + 10000,
      mileageUnit: 'kilometers',
      vehicleStatus: 'active',
      isActive: true,
      createdAt: new Date()
    };

    // Generate job data
    const totalAmount = totalMatch ? parseFloat(totalMatch[1]) : pattern.estimatedAmount;
    const laborAmount = totalAmount * 0.4;
    const partsAmount = totalAmount * 0.45;
    const materialsAmount = totalAmount * 0.15;

    const job = {
      jobNumber: `BMS-${Date.now().toString().slice(-6)}`,
      status: 'estimate',
      priority: pattern.priority,
      jobType: pattern.jobType,
      claimNumber: claimMatch ? claimMatch[1] : `CLM-BMS-${Date.now().toString().slice(-4)}`,
      deductible: pattern.deductible,
      totalAmount,
      laborAmount,
      partsAmount,
      materialsAmount,
      customerPay: pattern.deductible,
      insurancePay: totalAmount - pattern.deductible,
      damageDescription: pattern.damageDescription,
      repairDescription: `Repair work based on BMS estimate ${estimateMatch ? estimateMatch[1] : 'N/A'}`,
      isInsurance: pattern.deductible > 0,
      isDRP: false,
      paymentMethod: 'insurance',
      paymentStatus: 'pending',
      estimateStatus: 'pending',
      partsStatus: 'pending',
      checkInDate: new Date(),
      targetDeliveryDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days from now
      notes: `Imported from BMS file: ${filename}.xml`,
      metadata: {
        source: 'bms_import',
        importedFrom: filename + '.xml',
        bmsData: {
          documentId: estimateMatch ? estimateMatch[1] : null,
          claimNumber: claimMatch ? claimMatch[1] : null,
          originalFile: filename + '.xml'
        }
      },
      tags: ['bms-import', pattern.jobType],
      createdAt: new Date()
    };

    return { customer, vehicle, job };
  }

  getRandomFirstName() {
    const names = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jennifer'];
    return names[Math.floor(Math.random() * names.length)];
  }

  getRandomLastName() {
    const names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    return names[Math.floor(Math.random() * names.length)];
  }

  getRandomAddress() {
    const streets = ['Main St', 'Oak Ave', 'First St', 'Second St', 'Park Ave', 'Elm St'];
    const number = Math.floor(Math.random() * 9999) + 100;
    const street = streets[Math.floor(Math.random() * streets.length)];
    return `${number} ${street}`;
  }

  getRandomColor() {
    const colors = ['White', 'Black', 'Silver', 'Gray', 'Red', 'Blue', 'Green'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  generatePhoneNumber() {
    return `416-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  }

  generateLicensePlate() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    return Array.from({length: 3}, () => letters[Math.floor(Math.random() * letters.length)]).join('') +
           Array.from({length: 3}, () => numbers[Math.floor(Math.random() * numbers.length)]).join('');
  }

  generateMockVIN() {
    const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ123456789'; // Excluding I, O, Q
    return Array.from({length: 17}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
}

/**
 * Main population function
 */
async function populateDatabase() {
  console.log('🚀 Starting CollisionOS Database Population\n');
  
  const db = new MockDatabase();
  const bmsService = new MockBMSService(db);
  
  try {
    // Step 1: Generate base sample data
    console.log('📊 Generating base sample data...');
    const sampleData = generateAllSampleData();
    
    // Step 2: Populate shop and admin user
    console.log('\n🏢 Setting up shop and admin user...');
    const shop = await db.createShop(sampleData.shop);
    console.log(`✓ Created shop: ${shop.name}`);
    
    const adminUser = await db.createUser(sampleData.adminUser);
    console.log(`✓ Created admin user: ${adminUser.username}`);
    
    // Step 3: Populate customers
    console.log(`\n👥 Populating ${sampleData.customers.length} customers...`);
    for (const customerData of sampleData.customers) {
      await db.createCustomer(customerData);
    }
    console.log(`✓ Created ${sampleData.customers.length} customers`);
    
    // Step 4: Populate vehicles
    console.log(`\n🚗 Populating ${sampleData.vehicles.length} vehicles...`);
    for (const vehicleData of sampleData.vehicles) {
      await db.createVehicle(vehicleData);
    }
    console.log(`✓ Created ${sampleData.vehicles.length} vehicles`);
    
    // Step 5: Populate jobs
    console.log(`\n🔧 Populating ${sampleData.jobs.length} jobs...`);
    for (const jobData of sampleData.jobs) {
      await db.createJob(jobData);
    }
    console.log(`✓ Created ${sampleData.jobs.length} jobs`);
    
    // Step 6: Populate parts
    console.log(`\n🔩 Populating ${sampleData.parts.length} parts...`);
    for (const partData of sampleData.parts) {
      await db.createPart(partData);
    }
    console.log(`✓ Created ${sampleData.parts.length} parts`);
    
    // Step 7: Import BMS files
    console.log('\n📄 Importing BMS XML files...');
    const bmsDirectory = path.join(__dirname, 'Example BMS');
    
    try {
      const files = await fs.readdir(bmsDirectory);
      const xmlFiles = files.filter(file => file.endsWith('.xml'));
      
      console.log(`Found ${xmlFiles.length} BMS XML files to import:`);
      
      for (const file of xmlFiles) {
        const filePath = path.join(bmsDirectory, file);
        await bmsService.processBMSFile(filePath);
      }
      
      console.log(`✅ Successfully imported ${xmlFiles.length} BMS files`);
      
    } catch (error) {
      console.error('❌ Error reading BMS directory:', error.message);
      console.log('Creating BMS directory and files...');
      
      // The BMS files should already be created by previous steps
      console.log('BMS example files should be available in: data/Example BMS/');
    }
    
    // Step 8: Display final statistics
    console.log('\n📈 Final Database Statistics:');
    console.log('═══════════════════════════════');
    
    const stats = db.getStats();
    const finalData = db.getAllData();
    
    console.log(`Shop: ${stats.shop}`);
    console.log(`Users: ${stats.users}`);
    console.log(`Customers: ${stats.customers}`);
    console.log(`Vehicles: ${stats.vehicles}`);
    console.log(`Jobs: ${stats.jobs}`);
    console.log(`Parts: ${stats.parts}`);
    console.log(`BMS Imports: ${stats.bmsImports}`);
    
    // Calculate financial totals
    const totalJobValue = finalData.jobs.reduce((sum, job) => sum + (job.totalAmount || 0), 0);
    const averageJobValue = totalJobValue / finalData.jobs.length || 0;
    const totalPartsValue = finalData.parts.reduce((sum, part) => sum + (part.sellingPrice * part.currentStock || 0), 0);
    
    console.log('\n💰 Financial Summary:');
    console.log('═══════════════════');
    console.log(`Total Job Value: $${totalJobValue.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`);
    console.log(`Average Job Value: $${averageJobValue.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`);
    console.log(`Total Parts Inventory Value: $${totalPartsValue.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`);
    
    // Job status breakdown
    console.log('\n📊 Job Status Breakdown:');
    console.log('═══════════════════════');
    const jobStatusCounts = finalData.jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(jobStatusCounts).forEach(([status, count]) => {
      console.log(`${status}: ${count}`);
    });
    
    // BMS import results
    console.log('\n📋 BMS Import Results:');
    console.log('═════════════════════');
    const successfulImports = finalData.bmsImports.filter(imp => imp.status === 'success').length;
    const failedImports = finalData.bmsImports.filter(imp => imp.status === 'error').length;
    
    console.log(`Successful: ${successfulImports}`);
    console.log(`Failed: ${failedImports}`);
    
    if (successfulImports > 0) {
      console.log('\nSuccessfully imported BMS files:');
      finalData.bmsImports
        .filter(imp => imp.status === 'success')
        .forEach(imp => {
          console.log(`  ✓ ${imp.filename} - $${imp.dataExtracted?.totalAmount?.toLocaleString('en-CA', { minimumFractionDigits: 2 }) || 'N/A'}`);
        });
    }
    
    if (failedImports > 0) {
      console.log('\nFailed imports:');
      finalData.bmsImports
        .filter(imp => imp.status === 'error')
        .forEach(imp => {
          console.log(`  ✗ ${imp.filename} - ${imp.error}`);
        });
    }
    
    console.log('\n✅ Database population completed successfully!');
    console.log('\n🎯 Next Steps:');
    console.log('1. Start your CollisionOS application');
    console.log('2. Navigate to the BMS Import page');
    console.log('3. Test uploading the BMS XML files from: data/Example BMS/');
    console.log('4. Explore the generated customers, vehicles, and jobs');
    console.log('5. Test the various features with the comprehensive sample data');
    
    // Save data summary to file for reference
    const summary = {
      generatedAt: new Date(),
      stats,
      sampleDataFiles: [
        'data/Example BMS/minor_collision_estimate.xml',
        'data/Example BMS/major_collision_estimate.xml', 
        'data/Example BMS/glass_replacement_estimate.xml',
        'data/Example BMS/paint_only_estimate.xml',
        'data/Example BMS/luxury_vehicle_estimate.xml'
      ],
      financialSummary: {
        totalJobValue,
        averageJobValue,
        totalPartsInventoryValue: totalPartsValue
      },
      jobStatusBreakdown: jobStatusCounts,
      bmsImportSummary: {
        successful: successfulImports,
        failed: failedImports,
        details: finalData.bmsImports
      }
    };
    
    await fs.writeFile(
      path.join(__dirname, 'population-summary.json'), 
      JSON.stringify(summary, null, 2)
    );
    
    console.log('\n📄 Detailed summary saved to: data/population-summary.json');
    
    return {
      success: true,
      data: finalData,
      stats,
      summary
    };
    
  } catch (error) {
    console.error('\n❌ Error during database population:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export for use in other scripts
module.exports = {
  populateDatabase,
  MockDatabase,
  MockBMSService
};

// Run if called directly
if (require.main === module) {
  populateDatabase()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 Population completed successfully!');
      } else {
        console.log('\n💥 Population failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Unexpected error:', error);
      process.exit(1);
    });
}