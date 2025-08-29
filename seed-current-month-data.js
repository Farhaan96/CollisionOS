const { sequelize, Job, Customer, Vehicle } = require('./server/database/models');
const { Op } = require('sequelize');

async function seedCurrentMonthData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    const shopId = '6327a311-82df-4df0-8369-f5168c5e703c'; // Demo Auto Body Shop
    
    // Get existing data for this shop
    const customers = await Customer.findAll({ where: { shopId }, limit: 1 });
    const vehicles = await Vehicle.findAll({ where: { shopId }, limit: 1 });
    
    console.log(`Found ${customers.length} customers and ${vehicles.length} vehicles for shop`);
    
    if (customers.length === 0 || vehicles.length === 0) {
      console.log('❌ Need customers and vehicles to create jobs');
      return;
    }

    const customer = customers[0];
    const vehicle = vehicles[0];
    
    // Check if we already have current month jobs
    const now = new Date();
    const currentMonth = {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1)
    };
    
    const existingJobs = await Job.findAll({
      where: {
        shopId,
        createdAt: {
          [Op.between]: [currentMonth.start, currentMonth.end]
        }
      }
    });
    
    console.log(`Found ${existingJobs.length} jobs for current month`);
    
    if (existingJobs.length === 0) {
      console.log('🔧 Creating current month sample jobs...');
      
      const sampleJobs = [
        {
          shopId,
          jobNumber: `J${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-001`,
          customerId: customer.id,
          vehicleId: vehicle.id,
          status: 'body_structure',
          totalAmount: 4500.00,
          laborAmount: 2800.00,
          partsAmount: 1700.00,
          checkInDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          cycleTime: 5.2,
          customerSatisfaction: 4.8,
          createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        },
        {
          shopId,
          jobNumber: `J${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-002`,
          customerId: customer.id,
          vehicleId: vehicle.id,
          status: 'delivered',
          totalAmount: 3200.00,
          laborAmount: 1900.00,
          partsAmount: 1300.00,
          checkInDate: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
          actualDeliveryDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          cycleTime: 10.0,
          customerSatisfaction: 4.9,
          createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) // 14 days ago
        },
        {
          shopId,
          jobNumber: `J${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-003`,
          customerId: customer.id,
          vehicleId: vehicle.id,
          status: 'paint_prep',
          totalAmount: 5100.00,
          laborAmount: 3100.00,
          partsAmount: 2000.00,
          checkInDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          cycleTime: 3.1,
          customerSatisfaction: 4.6,
          createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
        }
      ];

      const createdJobs = await Job.bulkCreate(sampleJobs);
      console.log(`✅ Created ${createdJobs.length} current month jobs`);
      
      // Also create some last month jobs for comparison
      const lastMonth = {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 1)
      };
      
      const lastMonthJobs = [
        {
          shopId,
          jobNumber: `J${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}-001`,
          customerId: customer.id,
          vehicleId: vehicle.id,
          status: 'delivered',
          totalAmount: 3800.00,
          laborAmount: 2200.00,
          partsAmount: 1600.00,
          checkInDate: new Date(lastMonth.start.getTime() + 2 * 24 * 60 * 60 * 1000),
          actualDeliveryDate: new Date(lastMonth.end.getTime() - 3 * 24 * 60 * 60 * 1000),
          cycleTime: 8.5,
          customerSatisfaction: 4.7,
          createdAt: new Date(lastMonth.start.getTime() + 1 * 24 * 60 * 60 * 1000)
        },
        {
          shopId,
          jobNumber: `J${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}-002`,
          customerId: customer.id,
          vehicleId: vehicle.id,
          status: 'delivered',
          totalAmount: 2900.00,
          laborAmount: 1700.00,
          partsAmount: 1200.00,
          checkInDate: new Date(lastMonth.start.getTime() + 10 * 24 * 60 * 60 * 1000),
          actualDeliveryDate: new Date(lastMonth.end.getTime() - 5 * 24 * 60 * 60 * 1000),
          cycleTime: 6.2,
          customerSatisfaction: 4.8,
          createdAt: new Date(lastMonth.start.getTime() + 8 * 24 * 60 * 60 * 1000)
        }
      ];
      
      const createdLastMonthJobs = await Job.bulkCreate(lastMonthJobs);
      console.log(`✅ Created ${createdLastMonthJobs.length} last month jobs for comparison`);
    }
    
    console.log('✅ Sample data seeding complete');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await sequelize.close();
  }
}

seedCurrentMonthData();