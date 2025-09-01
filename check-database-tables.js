const { sequelize } = require('./server/database/models');

async function checkDatabaseTables() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Get list of all tables in the database
    const queryInterface = sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();

    console.log(`\n📊 Found ${tables.length} tables in the database:`);
    tables.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table}`);
    });

    // Check if specific tables exist
    const requiredTables = [
      'shops',
      'users',
      'customers',
      'vehicles',
      'jobs',
      'labor_time_entries',
      'estimates',
      'estimate_line_items',
      'parts_orders',
      'parts_order_items',
      'attachments',
      'insurance_companies',
      'invoices',
      'vehicle_history',
      'workflow_statuses',
    ];

    console.log(`\n🔍 Checking for required tables:`);
    for (const table of requiredTables) {
      const exists = tables.includes(table);
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    }
  } catch (error) {
    console.error('❌ Error checking database tables:', error);
  } finally {
    await sequelize.close();
  }
}

checkDatabaseTables();
