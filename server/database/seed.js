const { sequelize, Shop, User, Customer, Vehicle, Part, Vendor, Job } = require('./models');
const bcrypt = require('bcrypt');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Don't recreate tables, just seed data
    console.log('📋 Using existing database tables...');

    // Create default shop
    const [shop] = await Shop.findOrCreate({
      where: { email: 'info@demoautobody.com' },
      defaults: {
        name: 'Demo Auto Body Shop',
        businessName: 'Demo Auto Body Shop Ltd.',
        email: 'info@demoautobody.com',
        phone: '(555) 123-4567',
        fax: '(555) 123-4568',
        website: 'https://demoautobody.com',
        address: '123 Main Street',
        city: 'Toronto',
        state: 'Ontario',
        postalCode: 'M5V 3A8',
        country: 'Canada',
        timezone: 'America/Toronto',
        currency: 'CAD',
        gstNumber: '123456789RT0001',
        setupCompleted: true,
        isTrial: false,
        isActive: true,
        trialExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        settings: {
          laborRate: 65.00,
          paintAndMaterialsRate: 45.00,
          workingHours: {
            monday: { start: '08:00', end: '17:00', enabled: true },
            tuesday: { start: '08:00', end: '17:00', enabled: true },
            wednesday: { start: '08:00', end: '17:00', enabled: true },
            thursday: { start: '08:00', end: '17:00', enabled: true },
            friday: { start: '08:00', end: '17:00', enabled: true },
            saturday: { start: '09:00', end: '15:00', enabled: false },
            sunday: { start: '09:00', end: '15:00', enabled: false }
          },
          autoBackup: true,
          backupFrequency: 'daily',
          notifications: {
            email: true,
            sms: false,
            push: true
          }
        }
      }
    });

    console.log('✅ Shop created:', shop.name);

    // Create default users
    const defaultUsers = [
      {
        username: 'admin',
        email: 'admin@demoautobody.com',
        password: await bcrypt.hash('admin123', 10),
        firstName: 'Admin',
        lastName: 'User',
        role: 'owner',
        shopId: shop.id,
        isActive: true,
        emailVerified: true,
        phone: '(555) 123-4567',
        employeeId: 'EMP001',
        hireDate: new Date(),
        hourlyRate: 65.00,
        department: 'Management'
      },
      {
        username: 'manager',
        email: 'manager@demoautobody.com',
        password: await bcrypt.hash('manager123', 10),
        firstName: 'Mike',
        lastName: 'Johnson',
        role: 'manager',
        shopId: shop.id,
        isActive: true,
        emailVerified: true,
        phone: '(555) 123-4568',
        employeeId: 'EMP002',
        hireDate: new Date(),
        hourlyRate: 55.00,
        department: 'Management'
      },
      {
        username: 'estimator',
        email: 'estimator@demoautobody.com',
        password: await bcrypt.hash('estimator123', 10),
        firstName: 'Sarah',
        lastName: 'Wilson',
        role: 'estimator',
        shopId: shop.id,
        isActive: true,
        emailVerified: true,
        phone: '(555) 123-4569',
        employeeId: 'EMP003',
        hireDate: new Date(),
        hourlyRate: 50.00,
        department: 'Estimating'
      },
      {
        username: 'technician',
        email: 'technician@demoautobody.com',
        password: await bcrypt.hash('technician123', 10),
        firstName: 'John',
        lastName: 'Davis',
        role: 'technician',
        shopId: shop.id,
        isActive: true,
        emailVerified: true,
        phone: '(555) 123-4570',
        employeeId: 'EMP004',
        hireDate: new Date(),
        hourlyRate: 45.00,
        department: 'Production'
      }
    ];

    for (const userData of defaultUsers) {
      const [user] = await User.findOrCreate({
        where: { email: userData.email },
        defaults: userData
      });
      console.log(`✅ User created: ${user.firstName} ${user.lastName} (${user.role})`);
    }

    // Create sample vendors
    const vendors = [
      {
        vendorNumber: 'VEND-0001',
        name: 'OEM Parts Direct',
        contactPerson: 'John Smith',
        email: 'john@oempartsdirect.com',
        phone: '(555) 987-6543',
        address: '456 Industrial Blvd',
        city: 'Toronto',
        state: 'Ontario',
        zipCode: 'M5V 2H1',
        vendorType: 'oem',
        paymentTerms: 'net_30',
        creditLimit: 50000.00,
        averageDeliveryTime: 2,
        fillRate: 95.5,
        qualityRating: 9.2
      },
      {
        vendorNumber: 'VEND-0002',
        name: 'Aftermarket Plus',
        contactPerson: 'Jane Doe',
        email: 'jane@aftermarketplus.com',
        phone: '(555) 987-6544',
        address: '789 Auto Parts Way',
        city: 'Toronto',
        state: 'Ontario',
        zipCode: 'M5V 2H2',
        vendorType: 'aftermarket',
        paymentTerms: 'net_15',
        creditLimit: 25000.00,
        averageDeliveryTime: 1,
        fillRate: 88.0,
        qualityRating: 8.5
      },
      {
        vendorNumber: 'VEND-0003',
        name: 'LKQ Recycled Parts',
        contactPerson: 'Bob Wilson',
        email: 'bob@lkq.com',
        phone: '(555) 987-6545',
        address: '321 Salvage Road',
        city: 'Toronto',
        state: 'Ontario',
        zipCode: 'M5V 2H3',
        vendorType: 'recycled',
        paymentTerms: 'immediate',
        creditLimit: 15000.00,
        averageDeliveryTime: 3,
        fillRate: 75.0,
        qualityRating: 7.8
      }
    ];

    for (const vendorData of vendors) {
      const [vendor] = await Vendor.findOrCreate({
        where: { vendorNumber: vendorData.vendorNumber },
        defaults: { ...vendorData, shopId: shop.id }
      });
      console.log(`✅ Vendor created: ${vendor.name}`);
    }

    // Create sample customers
    const customers = [
      {
        customerNumber: 'CUST-0001',
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.johnson@email.com',
        phone: '(555) 111-2222',
        mobile: '(555) 111-2223',
        address: '123 Oak Street',
        city: 'Toronto',
        state: 'Ontario',
        zipCode: 'M5V 1A1',
        customerType: 'individual',
        customerStatus: 'active',
        preferredContact: 'phone',
        smsOptIn: true,
        emailOptIn: true,
        loyaltyPoints: 150,
        referralSource: 'Google Search'
      },
      {
        customerNumber: 'CUST-0002',
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob.smith@email.com',
        phone: '(555) 222-3333',
        address: '456 Maple Avenue',
        city: 'Toronto',
        state: 'Ontario',
        zipCode: 'M5V 1A2',
        customerType: 'individual',
        customerStatus: 'active',
        preferredContact: 'email',
        emailOptIn: true,
        loyaltyPoints: 75,
        referralSource: 'Referral'
      },
      {
        customerNumber: 'CUST-0003',
        companyName: 'ABC Company',
        firstName: 'Carol',
        lastName: 'Davis',
        email: 'carol.davis@abc.com',
        phone: '(555) 333-4444',
        address: '789 Business Blvd',
        city: 'Toronto',
        state: 'Ontario',
        zipCode: 'M5V 1A3',
        customerType: 'business',
        customerStatus: 'vip',
        preferredContact: 'email',
        emailOptIn: true,
        creditLimit: 10000.00,
        paymentTerms: 'net_30',
        loyaltyPoints: 500,
        referralSource: 'Direct'
      }
    ];

    for (const customerData of customers) {
      const [customer] = await Customer.findOrCreate({
        where: { customerNumber: customerData.customerNumber },
        defaults: { ...customerData, shopId: shop.id }
      });
      console.log(`✅ Customer created: ${customer.firstName} ${customer.lastName}`);

      // Create vehicles for each customer
      const vehicles = [
        {
          vin: '1HGBH41JXMN109186',
          licensePlate: 'ABC123',
          state: 'Ontario',
          year: 2020,
          make: 'Honda',
          model: 'Civic',
          trim: 'EX',
          bodyStyle: 'sedan',
          color: 'Blue',
          mileage: 45000,
          mileageUnit: 'kilometers',
          insuranceCompany: 'State Farm',
          policyNumber: 'SF123456',
          vehicleStatus: 'active'
        },
        {
          vin: '2T1BURHE0JC123456',
          licensePlate: 'XYZ789',
          state: 'Ontario',
          year: 2019,
          make: 'Toyota',
          model: 'Camry',
          trim: 'SE',
          bodyStyle: 'sedan',
          color: 'Silver',
          mileage: 62000,
          mileageUnit: 'kilometers',
          insuranceCompany: 'Allstate',
          policyNumber: 'AS789012',
          vehicleStatus: 'active'
        }
      ];

      for (const vehicleData of vehicles) {
        const [vehicle] = await Vehicle.findOrCreate({
          where: { vin: vehicleData.vin },
          defaults: { ...vehicleData, customerId: customer.id, shopId: shop.id }
        });
        console.log(`  ✅ Vehicle created: ${vehicle.year} ${vehicle.make} ${vehicle.model}`);
      }
    }

    // Create sample parts
    const parts = [
      {
        partNumber: 'TOY-52119-06903',
        oemPartNumber: '52119-06903',
        description: 'Front Bumper Cover - Toyota Camry 2018-2024',
        category: 'body',
        partType: 'oem',
        make: 'Toyota',
        model: 'Camry',
        yearFrom: 2018,
        yearTo: 2024,
        currentStock: 5,
        minimumStock: 2,
        reorderPoint: 3,
        reorderQuantity: 10,
        location: 'A1-B2',
        costPrice: 350.00,
        sellingPrice: 450.00,
        markupPercentage: 28.57,
        warrantyPeriod: 24,
        warrantyType: 'manufacturer',
        isCore: false
      },
      {
        partNumber: 'HON-71110-TBA-A00',
        oemPartNumber: '71110-TBA-A00',
        description: 'Right Headlight Assembly - Honda Civic 2016-2021',
        category: 'electrical',
        partType: 'oem',
        make: 'Honda',
        model: 'Civic',
        yearFrom: 2016,
        yearTo: 2021,
        currentStock: 3,
        minimumStock: 1,
        reorderPoint: 2,
        reorderQuantity: 5,
        location: 'C3-D4',
        costPrice: 280.00,
        sellingPrice: 380.00,
        markupPercentage: 35.71,
        warrantyPeriod: 24,
        warrantyType: 'manufacturer',
        isCore: false
      },
      {
        partNumber: 'AFT-12345',
        description: 'Aftermarket Front Bumper Cover - Universal Fit',
        category: 'body',
        partType: 'aftermarket',
        currentStock: 8,
        minimumStock: 3,
        reorderPoint: 5,
        reorderQuantity: 15,
        location: 'E5-F6',
        costPrice: 120.00,
        sellingPrice: 180.00,
        markupPercentage: 50.00,
        warrantyPeriod: 12,
        warrantyType: 'vendor',
        isCore: false
      }
    ];

    for (const partData of parts) {
      const [part] = await Part.findOrCreate({
        where: { partNumber: partData.partNumber },
        defaults: { ...partData, shopId: shop.id }
      });
      console.log(`✅ Part created: ${part.description}`);
    }

    // Create sample jobs
    const allCustomers = await Customer.findAll({ where: { shopId: shop.id } });
    const allVehicles = await Vehicle.findAll({ where: { shopId: shop.id } });
    const technician = await User.findOne({ where: { role: 'technician', shopId: shop.id } });

    const jobs = [
      {
        jobNumber: 'JOB-0001',
        customerId: allCustomers[0]?.id,
        vehicleId: allVehicles[0]?.id,
        assignedTo: technician?.id,
        status: 'body_structure',
        priority: 'normal',
        jobType: 'collision',
        claimNumber: 'CLAIM123456',
        deductible: 500.00,
        totalAmount: 2500.00,
        laborAmount: 1500.00,
        partsAmount: 800.00,
        materialsAmount: 200.00,
        estimatedHours: 25.0,
        description: 'Front Bumper Repair',
        damageDescription: 'Front bumper damage from minor collision',
        estimateDate: new Date(),
        dropOffDate: new Date(),
        targetCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      },
      {
        jobNumber: 'JOB-0002',
        customerId: allCustomers[1]?.id,
        vehicleId: allVehicles[1]?.id,
        assignedTo: technician?.id,
        status: 'paint_prep',
        priority: 'high',
        jobType: 'collision',
        claimNumber: 'CLAIM789012',
        deductible: 1000.00,
        totalAmount: 4500.00,
        laborAmount: 2800.00,
        partsAmount: 1200.00,
        materialsAmount: 500.00,
        estimatedHours: 40.0,
        description: 'Rear Panel Replacement',
        damageDescription: 'Rear panel damage requiring replacement',
        estimateDate: new Date(),
        dropOffDate: new Date(),
        targetCompletionDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days
      },
      {
        jobNumber: 'JOB-0003',
        customerId: allCustomers[2]?.id,
        vehicleId: allVehicles[2]?.id,
        status: 'estimate',
        priority: 'normal',
        jobType: 'paint',
        totalAmount: 1200.00,
        laborAmount: 800.00,
        materialsAmount: 400.00,
        estimatedHours: 12.0,
        description: 'Door Scratch Repair',
        damageDescription: 'Minor scratch on driver door',
        estimateDate: new Date()
      }
    ];

    for (const jobData of jobs) {
      if (jobData.customerId && jobData.vehicleId) {
        const [job] = await Job.findOrCreate({
          where: { jobNumber: jobData.jobNumber },
          defaults: { ...jobData, shopId: shop.id }
        });
        console.log(`✅ Job created: ${job.description}`);
      }
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- 1 Shop created');
    console.log('- 4 Users created (admin, manager, estimator, technician)');
    console.log('- 3 Vendors created');
    console.log('- 3 Customers created');
    console.log('- 6 Vehicles created');
    console.log('- 3 Parts created');
    console.log('\n🔑 Default login credentials:');
    console.log('Admin: admin@demoautobody.com / admin123');
    console.log('Manager: manager@demoautobody.com / manager123');
    console.log('Estimator: estimator@demoautobody.com / estimator123');
    console.log('Technician: technician@demoautobody.com / technician123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

seedDatabase();
