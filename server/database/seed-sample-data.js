/**
 * Seed Sample Data for CollisionOS Development
 * Run with: node server/database/seed-sample-data.js
 */

const {
  sequelize,
  Customer,
  VehicleProfile,
  ClaimManagement,
  RepairOrderManagement,
  Shop
} = require('./models');

async function seedSampleData() {
  try {
    console.log('🌱 Starting to seed sample data...\n');

    // Create a sample shop
    const shop = await Shop.findOrCreate({
      where: { id: 'dev-shop' },
      defaults: {
        id: 'dev-shop',
        name: 'Demo Collision Center',
        phone: '555-0100',
        email: 'info@democollision.com',
        address: '123 Main St',
        city: 'Vancouver',
        state: 'BC',
        postalCode: 'V6B 1A1',
        country: 'Canada'
      }
    });
    console.log('✅ Shop created:', shop[0].name);

    // Create sample customers
    const customer1 = await Customer.findOrCreate({
      where: { phone: '604-555-0101' },
      defaults: {
        shopId: 'dev-shop',
        customerNumber: 'CUST-001',
        firstName: 'John',
        lastName: 'Smith',
        phone: '604-555-0101',
        email: 'john.smith@email.com',
        address: '456 Oak Avenue',
        city: 'Vancouver',
        state: 'BC',
        zip: 'V6K 2M1'
      }
    });
    console.log('✅ Customer 1 created:', customer1[0].firstName, customer1[0].lastName);

    const customer2 = await Customer.findOrCreate({
      where: { phone: '604-555-0202' },
      defaults: {
        shopId: 'dev-shop',
        customerNumber: 'CUST-002',
        firstName: 'Sarah',
        lastName: 'Johnson',
        phone: '604-555-0202',
        email: 'sarah.j@email.com',
        address: '789 Elm Street',
        city: 'Burnaby',
        state: 'BC',
        zip: 'V5H 3R2'
      }
    });
    console.log('✅ Customer 2 created:', customer2[0].firstName, customer2[0].lastName);

    // Create sample vehicles
    const vehicle1 = await VehicleProfile.findOrCreate({
      where: { vin: '1HGBH41JXMN109186' },
      defaults: {
        shopId: 'dev-shop',
        customerId: customer1[0].id,
        vin: '1HGBH41JXMN109186',
        year: 2021,
        make: 'Honda',
        model: 'Civic',
        trim: 'EX',
        licensePlate: 'ABC123'
      }
    });
    console.log('✅ Vehicle 1 created:', vehicle1[0].year, vehicle1[0].make, vehicle1[0].model);

    const vehicle2 = await VehicleProfile.findOrCreate({
      where: { vin: '5YJSA1E26HF000001' },
      defaults: {
        shopId: 'dev-shop',
        customerId: customer2[0].id,
        vin: '5YJSA1E26HF000001',
        year: 2022,
        make: 'Tesla',
        model: 'Model S',
        trim: 'Long Range',
        licensePlate: 'EV4567'
      }
    });
    console.log('✅ Vehicle 2 created:', vehicle2[0].year, vehicle2[0].make, vehicle2[0].model);

    // Create sample claims
    const claim1 = await ClaimManagement.findOrCreate({
      where: { claimNumber: 'CLM-2024-001' },
      defaults: {
        shopId: 'dev-shop',
        customerId: customer1[0].id,
        vehicleProfileId: vehicle1[0].id,
        claimNumber: 'CLM-2024-001',
        claimStatus: 'open',
        incidentDate: new Date('2024-01-15'),
        reportedDate: new Date('2024-01-16'),
        claimantName: 'John Smith',
        insurerName: 'ICBC',
        adjusterName: 'Mike Wilson',
        adjusterPhone: '604-555-9999',
        adjusterEmail: 'mike.wilson@icbc.com',
        deductibleAmount: 500.00,
        coverageType: 'Collision'
      }
    });
    console.log('✅ Claim 1 created:', claim1[0].claimNumber);

    const claim2 = await ClaimManagement.findOrCreate({
      where: { claimNumber: 'CLM-2024-002' },
      defaults: {
        shopId: 'dev-shop',
        customerId: customer2[0].id,
        vehicleProfileId: vehicle2[0].id,
        claimNumber: 'CLM-2024-002',
        claimStatus: 'open',
        incidentDate: new Date('2024-01-20'),
        reportedDate: new Date('2024-01-20'),
        claimantName: 'Sarah Johnson',
        insurerName: 'State Farm',
        adjusterName: 'Lisa Chen',
        adjusterPhone: '604-555-8888',
        adjusterEmail: 'lisa.chen@statefarm.com',
        deductibleAmount: 1000.00,
        coverageType: 'Comprehensive'
      }
    });
    console.log('✅ Claim 2 created:', claim2[0].claimNumber);

    // Create sample repair orders
    const ro1 = await RepairOrderManagement.findOrCreate({
      where: { repairOrderNumber: 'RO-2024-001' },
      defaults: {
        shopId: 'dev-shop',
        customerId: customer1[0].id,
        vehicleProfileId: vehicle1[0].id,
        claimManagementId: claim1[0].id,
        repairOrderNumber: 'RO-2024-001',
        roStatus: 'in_progress',
        dateCreated: new Date('2024-01-17'),
        promisedDeliveryDate: new Date('2024-02-01'),
        roNotes: 'Front-end collision repair - bumper, hood, and headlight replacement',
        estimatedTotal: 3500.00
      }
    });
    console.log('✅ Repair Order 1 created:', ro1[0].repairOrderNumber);

    const ro2 = await RepairOrderManagement.findOrCreate({
      where: { repairOrderNumber: 'RO-2024-002' },
      defaults: {
        shopId: 'dev-shop',
        customerId: customer2[0].id,
        vehicleProfileId: vehicle2[0].id,
        claimManagementId: claim2[0].id,
        repairOrderNumber: 'RO-2024-002',
        roStatus: 'estimate',
        isPriority: true,
        dateCreated: new Date('2024-01-22'),
        promisedDeliveryDate: new Date('2024-02-10'),
        roNotes: 'Rear quarter panel damage from parking lot incident',
        estimatedTotal: 5200.00
      }
    });
    console.log('✅ Repair Order 2 created:', ro2[0].repairOrderNumber);

    console.log('\n🎉 Sample data seeded successfully!');
    console.log('\n📊 Summary:');
    console.log('  - 1 Shop');
    console.log('  - 2 Customers');
    console.log('  - 2 Vehicles');
    console.log('  - 2 Claims');
    console.log('  - 2 Repair Orders');
    console.log('\n✅ Database ready for testing!\n');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

// Run the seed function
seedSampleData();
