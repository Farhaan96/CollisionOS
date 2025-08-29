/**
 * Test Data Seeder for CollisionOS Supabase Migration
 * Populates the database with comprehensive test data for development and testing
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

class TestDataSeeder {
  constructor() {
    this.configPath = path.join(__dirname, '..', 'supabase-config.json');
    this.logFile = path.join(__dirname, '..', 'seeding-log.txt');
    
    if (!fs.existsSync(this.configPath)) {
      throw new Error('Supabase configuration not found. Please run setup script first.');
    }
    
    const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    this.client = createClient(config.supabaseUrl, config.serviceRoleKey);
    
    this.seedResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    
    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  async seedAllData() {
    this.log('🌱 Starting comprehensive test data seeding...');
    
    try {
      // Seed in dependency order
      await this.seedShops();
      await this.seedUsers();
      await this.seedCustomers();
      await this.seedVehicles();
      await this.seedVendors();
      await this.seedParts();
      await this.seedJobs();
      await this.seedJobParts();
      await this.seedJobLabor();
      await this.seedJobUpdates();
      await this.seedNotifications();
      
      this.log('✅ All test data seeded successfully!', 'success');
      this.generateSeedingReport();
    } catch (error) {
      this.log(`❌ Error seeding test data: ${error.message}`, 'error');
      throw error;
    }
  }

  async seedShops() {
    this.log('📊 Seeding shops...');
    const shopData = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'CollisionOS Test Shop',
      business_name: 'CollisionOS Automotive Services Inc.',
      email: 'test@collisionos.com',
      phone: '+1-555-0123',
      fax: '+1-555-0124',
      website: 'https://test.collisionos.com',
      address: '123 Test Street',
      city: 'Toronto',
      state: 'ON',
      postal_code: 'M5V 3A8',
      country: 'Canada',
      timezone: 'America/Toronto',
      currency: 'CAD',
      tax_number: '123456789RT0001',
      gst_number: '123456789RT0001',
      pst_number: '123456789RT0001',
      hst_number: '123456789RT0001',
      logo: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await this.client
      .from('shops')
      .upsert(shopData, { onConflict: 'id' });

    if (error) throw new Error(`Failed to seed shops: ${error.message}`);
    this.log('✅ Shops seeded');
    this.seedResults.push({ entity: 'shops', count: 1, status: 'success' });
  }

  async seedUsers() {
    this.log('👥 Seeding users...');
    const usersData = [
      {
        user_id: '550e8400-e29b-41d4-a716-446655440002',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'owner@collisionos.com',
        first_name: 'John',
        last_name: 'Smith',
        role: 'owner',
        phone: '+1-555-0001',
        is_active: true,
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        user_id: '550e8400-e29b-41d4-a716-446655440003',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'manager@collisionos.com',
        first_name: 'Sarah',
        last_name: 'Johnson',
        role: 'manager',
        phone: '+1-555-0002',
        is_active: true,
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        user_id: '550e8400-e29b-41d4-a716-446655440004',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'advisor@collisionos.com',
        first_name: 'Mike',
        last_name: 'Davis',
        role: 'service_advisor',
        phone: '+1-555-0003',
        is_active: true,
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        user_id: '550e8400-e29b-41d4-a716-446655440005',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'estimator@collisionos.com',
        first_name: 'Lisa',
        last_name: 'Wilson',
        role: 'estimator',
        phone: '+1-555-0004',
        is_active: true,
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        user_id: '550e8400-e29b-41d4-a716-446655440006',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'tech@collisionos.com',
        first_name: 'David',
        last_name: 'Brown',
        role: 'technician',
        phone: '+1-555-0005',
        is_active: true,
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        user_id: '550e8400-e29b-41d4-a716-446655440007',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'parts@collisionos.com',
        first_name: 'Jennifer',
        last_name: 'Garcia',
        role: 'parts_manager',
        phone: '+1-555-0006',
        is_active: true,
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const { error } = await this.client
      .from('users')
      .upsert(usersData, { onConflict: 'user_id' });

    if (error) throw new Error(`Failed to seed users: ${error.message}`);
    this.log('✅ Users seeded');
    this.seedResults.push({ entity: 'users', count: usersData.length, status: 'success' });
  }

  async seedCustomers() {
    this.log('👤 Seeding customers...');
    const customersData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440008',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        customer_number: 'CUST001',
        first_name: 'Alice',
        last_name: 'Thompson',
        email: 'alice.thompson@email.com',
        phone: '+1-555-1001',
        mobile: '+1-555-1001',
        address: '456 Oak Avenue',
        city: 'Toronto',
        state: 'ON',
        postal_code: 'M5V 2H1',
        country: 'Canada',
        customer_type: 'individual',
        customer_status: 'active',
        preferred_contact: 'phone',
        sms_opt_in: true,
        email_opt_in: true,
        marketing_opt_in: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440009',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        customer_number: 'CUST002',
        first_name: 'Robert',
        last_name: 'Chen',
        email: 'robert.chen@email.com',
        phone: '+1-555-1002',
        mobile: '+1-555-1002',
        address: '789 Pine Street',
        city: 'Toronto',
        state: 'ON',
        postal_code: 'M5V 3K2',
        country: 'Canada',
        customer_type: 'individual',
        customer_status: 'active',
        preferred_contact: 'email',
        sms_opt_in: false,
        email_opt_in: true,
        marketing_opt_in: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        customer_number: 'CUST003',
        first_name: 'Fleet',
        last_name: 'Services',
        email: 'fleet@fleetcorp.com',
        phone: '+1-555-1003',
        mobile: '+1-555-1003',
        address: '321 Business Blvd',
        city: 'Toronto',
        state: 'ON',
        postal_code: 'M5V 4L3',
        country: 'Canada',
        customer_type: 'business',
        customer_status: 'active',
        preferred_contact: 'email',
        sms_opt_in: true,
        email_opt_in: true,
        marketing_opt_in: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440011',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        customer_number: 'CUST004',
        first_name: 'Insurance',
        last_name: 'Corp',
        email: 'claims@insurancecorp.com',
        phone: '+1-555-1004',
        mobile: '+1-555-1004',
        address: '654 Insurance Way',
        city: 'Toronto',
        state: 'ON',
        postal_code: 'M5V 5M4',
        country: 'Canada',
        customer_type: 'insurance',
        customer_status: 'active',
        preferred_contact: 'email',
        sms_opt_in: false,
        email_opt_in: true,
        marketing_opt_in: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440012',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        customer_number: 'CUST005',
        first_name: 'VIP',
        last_name: 'Customer',
        email: 'vip@premium.com',
        phone: '+1-555-1005',
        mobile: '+1-555-1005',
        address: '987 Luxury Lane',
        city: 'Toronto',
        state: 'ON',
        postal_code: 'M5V 6N5',
        country: 'Canada',
        customer_type: 'individual',
        customer_status: 'vip',
        preferred_contact: 'phone',
        sms_opt_in: true,
        email_opt_in: true,
        marketing_opt_in: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const { error } = await this.client
      .from('customers')
      .upsert(customersData, { onConflict: 'id' });

    if (error) throw new Error(`Failed to seed customers: ${error.message}`);
    this.log('✅ Customers seeded');
    this.seedResults.push({ entity: 'customers', count: customersData.length, status: 'success' });
  }

  async seedVehicles() {
    this.log('🚗 Seeding vehicles...');
    const vehiclesData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440013',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        customer_id: '550e8400-e29b-41d4-a716-446655440008',
        vin: '1HGBH41JXMN109186',
        year: 2020,
        make: 'Honda',
        model: 'Civic',
        trim: 'Sport',
        body_style: 'sedan',
        fuel_type: 'gasoline',
        color: 'Blue',
        mileage: 45000,
        mileage_unit: 'miles',
        license_plate: 'ABC123',
        province: 'ON',
        vehicle_status: 'active',
        warranty_type: 'manufacturer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440014',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        customer_id: '550e8400-e29b-41d4-a716-446655440009',
        vin: '5NPE34AF4FH012345',
        year: 2019,
        make: 'Hyundai',
        model: 'Tucson',
        trim: 'Limited',
        body_style: 'suv',
        fuel_type: 'gasoline',
        color: 'Silver',
        mileage: 32000,
        mileage_unit: 'miles',
        license_plate: 'XYZ789',
        province: 'ON',
        vehicle_status: 'active',
        warranty_type: 'manufacturer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440015',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        customer_id: '550e8400-e29b-41d4-a716-446655440010',
        vin: '3VWDX7AJ5DM123456',
        year: 2021,
        make: 'Volkswagen',
        model: 'Golf',
        trim: 'GTI',
        body_style: 'hatchback',
        fuel_type: 'gasoline',
        color: 'White',
        mileage: 28000,
        mileage_unit: 'miles',
        license_plate: 'FLEET1',
        province: 'ON',
        vehicle_status: 'active',
        warranty_type: 'manufacturer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440016',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        customer_id: '550e8400-e29b-41d4-a716-446655440011',
        vin: '1FADP3F22FL123456',
        year: 2018,
        make: 'Ford',
        model: 'Focus',
        trim: 'SE',
        body_style: 'sedan',
        fuel_type: 'gasoline',
        color: 'Red',
        mileage: 65000,
        mileage_unit: 'miles',
        license_plate: 'INS001',
        province: 'ON',
        vehicle_status: 'active',
        warranty_type: 'none',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440017',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        customer_id: '550e8400-e29b-41d4-a716-446655440012',
        vin: 'WBA8E9G50LNT12345',
        year: 2022,
        make: 'BMW',
        model: 'X5',
        trim: 'xDrive40i',
        body_style: 'suv',
        fuel_type: 'gasoline',
        color: 'Black',
        mileage: 15000,
        mileage_unit: 'miles',
        license_plate: 'VIP001',
        province: 'ON',
        vehicle_status: 'active',
        warranty_type: 'manufacturer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const { error } = await this.client
      .from('vehicles')
      .upsert(vehiclesData, { onConflict: 'id' });

    if (error) throw new Error(`Failed to seed vehicles: ${error.message}`);
    this.log('✅ Vehicles seeded');
    this.seedResults.push({ entity: 'vehicles', count: vehiclesData.length, status: 'success' });
  }

  async seedVendors() {
    this.log('🏢 Seeding vendors...');
    const vendorsData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440018',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        vendor_number: 'VEND001',
        name: 'Honda Parts Direct',
        contact_name: 'John Parts',
        email: 'parts@honda.com',
        phone: '+1-555-2001',
        address: '123 Parts Ave',
        city: 'Toronto',
        state: 'ON',
        postal_code: 'M5V 7P1',
        country: 'Canada',
        vendor_type: 'oem',
        vendor_status: 'active',
        payment_terms: 'net_30',
        credit_limit: 50000.00,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440019',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        vendor_number: 'VEND002',
        name: 'AutoZone Supply',
        contact_name: 'Mary Supply',
        email: 'orders@autozone.com',
        phone: '+1-555-2002',
        address: '456 Supply St',
        city: 'Toronto',
        state: 'ON',
        postal_code: 'M5V 8Q2',
        country: 'Canada',
        vendor_type: 'aftermarket',
        vendor_status: 'active',
        payment_terms: 'net_15',
        credit_limit: 25000.00,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440020',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        vendor_number: 'VEND003',
        name: 'PPG Paints',
        contact_name: 'Tom Paint',
        email: 'orders@ppg.com',
        phone: '+1-555-2003',
        address: '789 Paint Rd',
        city: 'Toronto',
        state: 'ON',
        postal_code: 'M5V 9R3',
        country: 'Canada',
        vendor_type: 'paint_supplier',
        vendor_status: 'active',
        payment_terms: 'net_30',
        credit_limit: 15000.00,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440021',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        vendor_number: 'VEND004',
        name: 'Snap-on Tools',
        contact_name: 'Lisa Tools',
        email: 'orders@snapon.com',
        phone: '+1-555-2004',
        address: '321 Tools Way',
        city: 'Toronto',
        state: 'ON',
        postal_code: 'M5V 0S4',
        country: 'Canada',
        vendor_type: 'equipment_supplier',
        vendor_status: 'active',
        payment_terms: 'net_30',
        credit_limit: 10000.00,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const { error } = await this.client
      .from('vendors')
      .upsert(vendorsData, { onConflict: 'id' });

    if (error) throw new Error(`Failed to seed vendors: ${error.message}`);
    this.log('✅ Vendors seeded');
    this.seedResults.push({ entity: 'vendors', count: vendorsData.length, status: 'success' });
  }

  async seedParts() {
    this.log('🔧 Seeding parts...');
    const partsData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440022',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        vendor_id: '550e8400-e29b-41d4-a716-446655440018',
        part_number: 'HON001',
        name: 'Honda Civic Front Bumper',
        description: 'OEM front bumper for 2020 Honda Civic',
        category: 'body',
        part_type: 'oem',
        cost: 450.00,
        price: 675.00,
        markup_percentage: 50.00,
        stock_quantity: 2,
        reorder_point: 1,
        part_status: 'active',
        warranty_type: 'manufacturer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440023',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        vendor_id: '550e8400-e29b-41d4-a716-446655440018',
        part_number: 'HON002',
        name: 'Honda Civic Headlight Assembly',
        description: 'OEM headlight assembly for 2020 Honda Civic',
        category: 'electrical',
        part_type: 'oem',
        cost: 320.00,
        price: 480.00,
        markup_percentage: 50.00,
        stock_quantity: 3,
        reorder_point: 1,
        part_status: 'active',
        warranty_type: 'manufacturer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440024',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        vendor_id: '550e8400-e29b-41d4-a716-446655440018',
        part_number: 'HYU001',
        name: 'Hyundai Tucson Side Mirror',
        description: 'OEM side mirror for 2019 Hyundai Tucson',
        category: 'exterior',
        part_type: 'oem',
        cost: 280.00,
        price: 420.00,
        markup_percentage: 50.00,
        stock_quantity: 1,
        reorder_point: 1,
        part_status: 'active',
        warranty_type: 'manufacturer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440025',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        vendor_id: '550e8400-e29b-41d4-a716-446655440019',
        part_number: 'AFT001',
        name: 'Universal Paint Gun',
        description: 'Professional paint gun for automotive use',
        category: 'paint',
        part_type: 'aftermarket',
        cost: 150.00,
        price: 225.00,
        markup_percentage: 50.00,
        stock_quantity: 5,
        reorder_point: 2,
        part_status: 'active',
        warranty_type: 'vendor',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440026',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        vendor_id: '550e8400-e29b-41d4-a716-446655440020',
        part_number: 'PAI001',
        name: 'PPG Blue Paint',
        description: 'Automotive paint - Blue metallic',
        category: 'paint',
        part_type: 'oem',
        cost: 85.00,
        price: 127.50,
        markup_percentage: 50.00,
        stock_quantity: 10,
        reorder_point: 3,
        part_status: 'active',
        warranty_type: 'manufacturer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const { error } = await this.client
      .from('parts')
      .upsert(partsData, { onConflict: 'id' });

    if (error) throw new Error(`Failed to seed parts: ${error.message}`);
    this.log('✅ Parts seeded');
    this.seedResults.push({ entity: 'parts', count: partsData.length, status: 'success' });
  }

  async seedJobs() {
    this.log('🔨 Seeding jobs...');
    const jobsData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440027',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        job_number: 'JOB001',
        customer_id: '550e8400-e29b-41d4-a716-446655440008',
        vehicle_id: '550e8400-e29b-41d4-a716-446655440013',
        assigned_to: '550e8400-e29b-41d4-a716-446655440005',
        status: 'estimate',
        priority: 'normal',
        job_type: 'collision',
        damage_description: 'Front end collision damage. Bumper, hood, and headlight damaged.',
        notes: 'Customer reported accident on Highway 401. Insurance claim pending.',
        estimated_hours: 12.5,
        target_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: '550e8400-e29b-41d4-a716-446655440003',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440028',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        job_number: 'JOB002',
        customer_id: '550e8400-e29b-41d4-a716-446655440009',
        vehicle_id: '550e8400-e29b-41d4-a716-446655440014',
        assigned_to: '550e8400-e29b-41d4-a716-446655440006',
        status: 'body_structure',
        priority: 'high',
        job_type: 'collision',
        damage_description: 'Side impact damage. Driver door, quarter panel, and wheel damaged.',
        notes: 'Rush job for business customer. Parts ordered and received.',
        estimated_hours: 18.0,
        actual_hours: 8.5,
        start_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        target_delivery_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: '550e8400-e29b-41d4-a716-446655440004',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440029',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        job_number: 'JOB003',
        customer_id: '550e8400-e29b-41d4-a716-446655440010',
        vehicle_id: '550e8400-e29b-41d4-a716-446655440015',
        assigned_to: '550e8400-e29b-41d4-a716-446655440006',
        status: 'quality_control',
        priority: 'normal',
        job_type: 'collision',
        damage_description: 'Rear end collision. Bumper, trunk lid, and taillights damaged.',
        notes: 'Fleet vehicle. Quality check in progress.',
        estimated_hours: 15.0,
        actual_hours: 14.5,
        start_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        target_delivery_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: '550e8400-e29b-41d4-a716-446655440004',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440030',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        job_number: 'JOB004',
        customer_id: '550e8400-e29b-41d4-a716-446655440011',
        vehicle_id: '550e8400-e29b-41d4-a716-446655440016',
        assigned_to: '550e8400-e29b-41d4-a716-446655440006',
        status: 'ready_pickup',
        priority: 'normal',
        job_type: 'collision',
        damage_description: 'Minor front end damage. Bumper and grille replacement.',
        notes: 'Insurance claim approved. Job completed successfully.',
        estimated_hours: 8.0,
        actual_hours: 7.5,
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        completion_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        target_delivery_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: '550e8400-e29b-41d4-a716-446655440005',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440031',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        job_number: 'JOB005',
        customer_id: '550e8400-e29b-41d4-a716-446655440012',
        vehicle_id: '550e8400-e29b-41d4-a716-446655440017',
        assigned_to: '550e8400-e29b-41d4-a716-446655440006',
        status: 'intake',
        priority: 'rush',
        job_type: 'collision',
        damage_description: 'Scratch on passenger door. Minor paint repair needed.',
        notes: 'VIP customer. Express service requested.',
        estimated_hours: 3.0,
        target_delivery_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        is_vip: true,
        created_by: '550e8400-e29b-41d4-a716-446655440004',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const { error } = await this.client
      .from('jobs')
      .upsert(jobsData, { onConflict: 'id' });

    if (error) throw new Error(`Failed to seed jobs: ${error.message}`);
    this.log('✅ Jobs seeded');
    this.seedResults.push({ entity: 'jobs', count: jobsData.length, status: 'success' });
  }

  async seedJobParts() {
    this.log('🔧 Seeding job parts...');
    const jobPartsData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440032',
        job_id: '550e8400-e29b-41d4-a716-446655440027',
        part_id: '550e8400-e29b-41d4-a716-446655440022',
        quantity: 1,
        cost: 450.00,
        price: 675.00,
        markup_percentage: 50.00,
        status: 'ordered',
        notes: 'Front bumper for Honda Civic',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440033',
        job_id: '550e8400-e29b-41d4-a716-446655440027',
        part_id: '550e8400-e29b-41d4-a716-446655440023',
        quantity: 1,
        cost: 320.00,
        price: 480.00,
        markup_percentage: 50.00,
        status: 'ordered',
        notes: 'Headlight assembly',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const { error } = await this.client
      .from('job_parts')
      .upsert(jobPartsData, { onConflict: 'id' });

    if (error) throw new Error(`Failed to seed job parts: ${error.message}`);
    this.log('✅ Job parts seeded');
    this.seedResults.push({ entity: 'job_parts', count: jobPartsData.length, status: 'success' });
  }

  async seedJobLabor() {
    this.log('👷 Seeding job labor...');
    const jobLaborData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440034',
        job_id: '550e8400-e29b-41d4-a716-446655440027',
        operation: 'Remove and replace front bumper',
        hours: 2.5,
        rate: 85.00,
        amount: 212.50,
        notes: 'Standard bumper replacement',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440035',
        job_id: '550e8400-e29b-41d4-a716-446655440027',
        operation: 'Remove and replace headlight assembly',
        hours: 1.0,
        rate: 85.00,
        amount: 85.00,
        notes: 'Headlight replacement',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440036',
        job_id: '550e8400-e29b-41d4-a716-446655440027',
        operation: 'Paint preparation and painting',
        hours: 6.0,
        rate: 85.00,
        amount: 510.00,
        notes: 'Paint and blend work',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440037',
        job_id: '550e8400-e29b-41d4-a716-446655440027',
        operation: 'Quality control and testing',
        hours: 1.0,
        rate: 85.00,
        amount: 85.00,
        notes: 'Final inspection and testing',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const { error } = await this.client
      .from('job_labor')
      .upsert(jobLaborData, { onConflict: 'id' });

    if (error) throw new Error(`Failed to seed job labor: ${error.message}`);
    this.log('✅ Job labor seeded');
    this.seedResults.push({ entity: 'job_labor', count: jobLaborData.length, status: 'success' });
  }

  async seedJobUpdates() {
    this.log('📝 Seeding job updates...');
    const jobUpdatesData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440038',
        job_id: '550e8400-e29b-41d4-a716-446655440027',
        user_id: '550e8400-e29b-41d4-a716-446655440005',
        update_type: 'status_change',
        old_value: 'intake',
        new_value: 'estimate',
        message: 'Job moved to estimate stage',
        created_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440039',
        job_id: '550e8400-e29b-41d4-a716-446655440028',
        user_id: '550e8400-e29b-41d4-a716-446655440006',
        update_type: 'progress',
        old_value: '0%',
        new_value: '45%',
        message: 'Body structure work 45% complete',
        created_at: new Date().toISOString()
      }
    ];

    const { error } = await this.client
      .from('job_updates')
      .upsert(jobUpdatesData, { onConflict: 'id' });

    if (error) throw new Error(`Failed to seed job updates: ${error.message}`);
    this.log('✅ Job updates seeded');
    this.seedResults.push({ entity: 'job_updates', count: jobUpdatesData.length, status: 'success' });
  }

  async seedNotifications() {
    this.log('🔔 Seeding notifications...');
    const notificationsData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440040',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        user_id: '550e8400-e29b-41d4-a716-446655440005',
        type: 'job_assigned',
        title: 'New Job Assigned',
        message: 'You have been assigned to JOB001 - Honda Civic repair',
        is_read: false,
        metadata: { job_id: '550e8400-e29b-41d4-a716-446655440027' },
        created_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440041',
        shop_id: '550e8400-e29b-41d4-a716-446655440001',
        user_id: '550e8400-e29b-41d4-a716-446655440007',
        type: 'parts_low_stock',
        title: 'Low Stock Alert',
        message: 'Honda Civic Front Bumper stock is below reorder point',
        is_read: false,
        metadata: { part_id: '550e8400-e29b-41d4-a716-446655440022' },
        created_at: new Date().toISOString()
      }
    ];

    const { error } = await this.client
      .from('notifications')
      .upsert(notificationsData, { onConflict: 'id' });

    if (error) throw new Error(`Failed to seed notifications: ${error.message}`);
    this.log('✅ Notifications seeded');
    this.seedResults.push({ entity: 'notifications', count: notificationsData.length, status: 'success' });
  }

  generateSeedingReport() {
    this.log('📊 Generating seeding report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      total_entities: this.seedResults.length,
      total_records: this.seedResults.reduce((sum, result) => sum + result.count, 0),
      results: this.seedResults,
      summary: {
        shops: 1,
        users: 6,
        customers: 5,
        vehicles: 5,
        vendors: 4,
        parts: 5,
        jobs: 5,
        job_parts: 2,
        job_labor: 4,
        job_updates: 2,
        notifications: 2
      }
    };

    const reportPath = path.join(__dirname, '..', 'seeding-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log('📋 Seeding report generated:', 'info');
    this.log(`   Total entities: ${report.total_entities}`, 'info');
    this.log(`   Total records: ${report.total_records}`, 'info');
    this.log(`   Report saved to: ${reportPath}`, 'info');
  }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  const seeder = new TestDataSeeder();
  seeder.seedAllData()
    .then(() => {
      console.log('\n🎉 Test data seeding completed successfully!');
      console.log('You can now run the validation tests with: npm run validate');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Seeding failed:', error.message);
      process.exit(1);
    });
}

module.exports = TestDataSeeder;
