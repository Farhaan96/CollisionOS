const {
  sequelize,
  Job,
  Customer,
  Vehicle,
} = require('./server/database/models');
const { Op } = require('sequelize');

async function forceSeedAugustData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    const shopId = '6327a311-82df-4df0-8369-f5168c5e703c'; // Demo Auto Body Shop

    // Get existing data for this shop
    const customers = await Customer.findAll({ where: { shopId }, limit: 1 });
    const vehicles = await Vehicle.findAll({ where: { shopId }, limit: 1 });

    console.log(
      `Found ${customers.length} customers and ${vehicles.length} vehicles for shop`
    );

    if (customers.length === 0 || vehicles.length === 0) {
      console.log('❌ Need customers and vehicles to create jobs');
      return;
    }

    const customer = customers[0];
    const vehicle = vehicles[0];

    // August 2025 date ranges
    const august2025 = {
      start: new Date(2025, 7, 1), // August 1, 2025
      end: new Date(2025, 8, 1), // September 1, 2025
    };

    console.log(
      '📅 August 2025 range:',
      august2025.start,
      'to',
      august2025.end
    );

    // Clear any existing August jobs first
    await Job.destroy({
      where: {
        shopId,
        createdAt: {
          [Op.between]: [august2025.start, august2025.end],
        },
      },
    });

    console.log('🔧 Creating August 2025 sample jobs...');

    const augustJobs = [
      {
        shopId,
        jobNumber: 'J2025-08-001',
        customerId: customer.id,
        vehicleId: vehicle.id,
        status: 'delivered',
        totalAmount: 4500.0,
        laborAmount: 2800.0,
        partsAmount: 1700.0,
        checkInDate: new Date(2025, 7, 5), // August 5, 2025
        actualDeliveryDate: new Date(2025, 7, 15), // August 15, 2025
        cycleTime: 10.0,
        customerSatisfaction: 4.8,
        createdAt: new Date(2025, 7, 5), // August 5, 2025
      },
      {
        shopId,
        jobNumber: 'J2025-08-002',
        customerId: customer.id,
        vehicleId: vehicle.id,
        status: 'body_structure',
        totalAmount: 3200.0,
        laborAmount: 1900.0,
        partsAmount: 1300.0,
        checkInDate: new Date(2025, 7, 10), // August 10, 2025
        cycleTime: 8.5,
        customerSatisfaction: 4.9,
        createdAt: new Date(2025, 7, 10), // August 10, 2025
      },
      {
        shopId,
        jobNumber: 'J2025-08-003',
        customerId: customer.id,
        vehicleId: vehicle.id,
        status: 'paint_prep',
        totalAmount: 5100.0,
        laborAmount: 3100.0,
        partsAmount: 2000.0,
        checkInDate: new Date(2025, 7, 20), // August 20, 2025
        cycleTime: 6.2,
        customerSatisfaction: 4.6,
        createdAt: new Date(2025, 7, 20), // August 20, 2025
      },
    ];

    const createdJobs = await Job.bulkCreate(augustJobs);
    console.log(`✅ Created ${createdJobs.length} August 2025 jobs`);

    // Also create July 2025 jobs for comparison
    const july2025 = {
      start: new Date(2025, 6, 1), // July 1, 2025
      end: new Date(2025, 7, 1), // August 1, 2025
    };

    const julyJobs = [
      {
        shopId,
        jobNumber: 'J2025-07-001',
        customerId: customer.id,
        vehicleId: vehicle.id,
        status: 'delivered',
        totalAmount: 3800.0,
        laborAmount: 2200.0,
        partsAmount: 1600.0,
        checkInDate: new Date(2025, 6, 8), // July 8, 2025
        actualDeliveryDate: new Date(2025, 6, 18), // July 18, 2025
        cycleTime: 10.0,
        customerSatisfaction: 4.7,
        createdAt: new Date(2025, 6, 8), // July 8, 2025
      },
      {
        shopId,
        jobNumber: 'J2025-07-002',
        customerId: customer.id,
        vehicleId: vehicle.id,
        status: 'delivered',
        totalAmount: 2900.0,
        laborAmount: 1700.0,
        partsAmount: 1200.0,
        checkInDate: new Date(2025, 6, 15), // July 15, 2025
        actualDeliveryDate: new Date(2025, 6, 25), // July 25, 2025
        cycleTime: 10.0,
        customerSatisfaction: 4.8,
        createdAt: new Date(2025, 6, 15), // July 15, 2025
      },
    ];

    const createdJulyJobs = await Job.bulkCreate(julyJobs);
    console.log(
      `✅ Created ${createdJulyJobs.length} July 2025 jobs for comparison`
    );

    console.log('✅ August 2025 sample data seeding complete');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await sequelize.close();
  }
}

forceSeedAugustData();
