#!/usr/bin/env node

/**
 * Add Demo Data for AI Assistant Testing
 * Creates sample collision repair data to showcase intelligent responses
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

async function addDemoData() {
  console.log('🏗️  Adding demo data for AI Assistant testing...\n');

  // Initialize Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const shopId = randomUUID();
    console.log(`🆔 Demo Shop ID: ${shopId}`);

    // 1. Create demo shop
    console.log('1️⃣ Creating demo shop...');
    const { error: shopError } = await supabase.from('shops').upsert({
      id: shopId,
      name: 'Demo Collision Center',
      address: '123 Main St',
      city: 'Demo City',
      state: 'DC',
      postal_code: '12345',
      phone: '(555) 123-4567',
      email: 'demo@collisioncenter.com',
    });

    if (shopError) {
      console.log('   ❌ Shop creation error:', shopError);
    } else {
      console.log('   ✅ Demo shop created');
    }

    // 2. Create demo customers
    console.log('2️⃣ Creating demo customers...');
    const customerIds = [randomUUID(), randomUUID(), randomUUID()];
    const customers = [
      {
        id: customerIds[0],
        shop_id: shopId,
        customer_number: 'CUST-001',
        first_name: 'John',
        last_name: 'Smith',
        phone: '(555) 111-0001',
        email: 'john.smith@email.com',
      },
      {
        id: customerIds[1],
        shop_id: shopId,
        customer_number: 'CUST-002',
        first_name: 'Sarah',
        last_name: 'Johnson',
        phone: '(555) 111-0002',
        email: 'sarah.johnson@email.com',
      },
      {
        id: customerIds[2],
        shop_id: shopId,
        customer_number: 'CUST-003',
        first_name: 'Mike',
        last_name: 'Wilson',
        phone: '(555) 111-0003',
        email: 'mike.wilson@email.com',
      },
    ];

    const { error: customersError } = await supabase
      .from('customers')
      .upsert(customers);

    if (customersError) {
      console.log('   ❌ Customers creation error:', customersError);
    } else {
      console.log('   ✅ Demo customers created');
    }

    // 3. Create demo vehicles
    console.log('3️⃣ Creating demo vehicles...');
    const vehicleIds = [randomUUID(), randomUUID(), randomUUID()];
    const vehicles = [
      {
        id: vehicleIds[0],
        shop_id: shopId,
        customer_id: customerIds[0],
        year: 2022,
        make: 'Honda',
        model: 'Civic',
        vin: 'JH4KA7561PC123456',
        license_plate: 'ABC123',
      },
      {
        id: vehicleIds[1],
        shop_id: shopId,
        customer_id: customerIds[1],
        year: 2021,
        make: 'Toyota',
        model: 'Camry',
        vin: 'JT2BF22K4X0123457',
        license_plate: 'XYZ789',
      },
      {
        id: vehicleIds[2],
        shop_id: shopId,
        customer_id: customerIds[2],
        year: 2020,
        make: 'Ford',
        model: 'F-150',
        vin: '1FTFW1ET5LFC12458',
        license_plate: 'DEMO01',
      },
    ];

    const { error: vehiclesError } = await supabase
      .from('vehicles')
      .upsert(vehicles);

    if (vehiclesError) {
      console.log('   ❌ Vehicles creation error:', vehiclesError);
    } else {
      console.log('   ✅ Demo vehicles created');
    }

    // 4. Create demo repair orders
    console.log('4️⃣ Creating demo repair orders...');
    const today = new Date();
    const thisWeek = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    const lastWeek = new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000); // 8 days ago

    const repairOrderIds = [randomUUID(), randomUUID(), randomUUID()];
    const repairOrders = [
      {
        id: repairOrderIds[0],
        shop_id: shopId,
        customer_id: customerIds[0],
        vehicle_id: vehicleIds[0],
        ro_number: 'RO-2024-0234',
        status: 'in_progress',
        total_amount: 4500.0,
        labor_amount: 2800.0,
        parts_amount: 1700.0,
        created_at: thisWeek.toISOString(),
        drop_off_date: thisWeek.toISOString(),
        estimated_completion_date: new Date(
          today.getTime() + 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        id: repairOrderIds[1],
        shop_id: shopId,
        customer_id: customerIds[1],
        vehicle_id: vehicleIds[1],
        ro_number: 'RO-2024-0235',
        status: 'parts_ordered',
        total_amount: 6750.0,
        labor_amount: 3200.0,
        parts_amount: 3550.0,
        created_at: thisWeek.toISOString(),
        drop_off_date: thisWeek.toISOString(),
        estimated_completion_date: new Date(
          today.getTime() + 5 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        id: repairOrderIds[2],
        shop_id: shopId,
        customer_id: customerIds[2],
        vehicle_id: vehicleIds[2],
        ro_number: 'RO-2024-0230',
        status: 'completed',
        total_amount: 8200.0,
        labor_amount: 4800.0,
        parts_amount: 3400.0,
        created_at: lastWeek.toISOString(),
        drop_off_date: lastWeek.toISOString(),
        completion_date: new Date(
          today.getTime() - 1 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
    ];

    const { error: rosError } = await supabase
      .from('repair_orders')
      .upsert(repairOrders);

    if (rosError) {
      console.log('   ❌ ROs creation error:', rosError);
    } else {
      console.log('   ✅ Demo repair orders created');
    }

    // 5. Test the intelligent assistant with real data
    console.log('\n🧠 Testing AI Assistant with Demo Data:');

    const {
      IntelligentCollisionAssistant,
    } = require('./server/services/intelligentAssistant');
    const assistant = new IntelligentCollisionAssistant();

    const testQueries = [
      'Show me repair orders from this week',
      'Find Honda vehicles',
      'What is our average cycle time?',
      'Show me customer John Smith',
    ];

    for (const query of testQueries) {
      console.log(`\n   Query: "${query}"`);
      try {
        const response = await assistant.processIntelligentQuery(
          query,
          shopId,
          'demo-user'
        );
        console.log(`   ✅ Response: ${response.message}`);
        if (response.results && response.results.length > 0) {
          console.log(`   📊 Found ${response.results.length} results`);
        }
        if (response.insights && response.insights.length > 0) {
          console.log(`   💡 Insights: ${response.insights[0]}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    console.log('\n🎉 Demo data setup complete!');
    console.log('\n📋 Demo Data Summary:');
    console.log('   • 1 demo shop (Demo Collision Center)');
    console.log(
      '   • 3 demo customers (John Smith, Sarah Johnson, Mike Wilson)'
    );
    console.log('   • 3 demo vehicles (Honda Civic, Toyota Camry, Ford F-150)');
    console.log(
      '   • 3 demo repair orders (various statuses and time periods)'
    );

    console.log('\n🤖 Try these AI queries in your app:');
    console.log('   • "Show me repair orders from this week"');
    console.log('   • "Find Honda Civic repairs"');
    console.log('   • "What\'s our average cycle time?"');
    console.log('   • "Show me customer John Smith"');
    console.log('   • "Which repairs are pending parts?"');
  } catch (error) {
    console.error('❌ Error adding demo data:', error);
    process.exit(1);
  }
}

// Run demo data setup
addDemoData();
