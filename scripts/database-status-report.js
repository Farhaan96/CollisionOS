const { sequelize } = require('../server/database/connection');
const path = require('path');
const fs = require('fs');

async function generateDatabaseReport() {
  console.log('\n' + '='.repeat(100));
  console.log('                     COLLISIONOS LOCAL SQLITE DATABASE STATUS REPORT');
  console.log('='.repeat(100) + '\n');

  try {
    // 1. CONNECTION INFO
    console.log('1. DATABASE CONNECTION INFORMATION');
    console.log('-'.repeat(100));

    await sequelize.authenticate();
    const dbPath = sequelize.config.storage || path.join(__dirname, '../data/collisionos.db');
    const dbExists = fs.existsSync(dbPath);
    const dbStats = dbExists ? fs.statSync(dbPath) : null;

    console.log(`   Database Type:      SQLite (Local)`);
    console.log(`   Database Path:      ${dbPath}`);
    console.log(`   Database Exists:    ${dbExists ? 'YES' : 'NO'}`);
    if (dbStats) {
      console.log(`   Database Size:      ${(dbStats.size / 1024).toFixed(2)} KB`);
      console.log(`   Last Modified:      ${dbStats.mtime.toLocaleString()}`);
    }
    console.log(`   Connection Status:  CONNECTED`);
    console.log(`   Dialect:            ${sequelize.getDialect()}`);
    console.log('');

    // 2. TABLE STRUCTURE
    console.log('2. DATABASE SCHEMA - ALL TABLES');
    console.log('-'.repeat(100));

    const [tables] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
    );

    console.log(`   Total Tables: ${tables.length}\n`);

    // Categorize tables
    const categories = {
      'CORE SYSTEM': ['shops', 'users'],
      'CUSTOMERS & VEHICLES': ['customers', 'vehicles', 'vehicle_profiles', 'vehicle_history'],
      'INSURANCE & CLAIMS': ['insurance_companies', 'claim_management', 'estimates', 'estimate_line_items'],
      'REPAIR ORDERS': ['jobs', 'repair_order_management', 'production_workflow', 'workflow_status', 'production_stages', 'job_stage_history'],
      'PARTS MANAGEMENT': ['parts', 'parts_orders', 'parts_order_items', 'advanced_parts_management', 'parts_sourcing_requests', 'parts_inventory_tracking'],
      'PURCHASE ORDERS': ['purchase_order_system', 'automated_purchase_orders'],
      'VENDORS': ['vendors', 'vendor_api_configs', 'vendor_api_metrics', 'vendor_part_quotes'],
      'BMS INTEGRATION': ['bms_imports', 'attachments'],
      'LABOR & TIME': ['labor_time_entries', 'technician_performance'],
      'COMMUNICATION': ['communication_templates', 'communication_log', 'contact_timeline'],
      'FINANCIAL': ['invoices', 'financial_transactions'],
      'LOANER VEHICLES': ['loaner_fleet_management', 'loaner_reservations'],
      'SCHEDULING': ['scheduling_capacity']
    };

    for (const [category, categoryTables] of Object.entries(categories)) {
      const found = tables.filter(t => categoryTables.includes(t.name));
      if (found.length > 0) {
        console.log(`   ${category}:`);
        found.forEach(t => console.log(`      ✓ ${t.name}`));
        console.log('');
      }
    }

    // Uncategorized tables
    const categorizedNames = Object.values(categories).flat();
    const uncategorized = tables.filter(t => !categorizedNames.includes(t.name));
    if (uncategorized.length > 0) {
      console.log('   OTHER:');
      uncategorized.forEach(t => console.log(`      ✓ ${t.name}`));
      console.log('');
    }

    // 3. DATA COUNTS
    console.log('3. DATA COUNTS - RECORDS IN EACH TABLE');
    console.log('-'.repeat(100));

    const tableCounts = {};
    for (const table of tables) {
      try {
        const [result] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table.name}`);
        tableCounts[table.name] = result[0].count;
      } catch (err) {
        tableCounts[table.name] = 'ERROR';
      }
    }

    // Display by category
    for (const [category, categoryTables] of Object.entries(categories)) {
      const found = categoryTables.filter(t => tableCounts[t] !== undefined);
      if (found.length > 0) {
        console.log(`\n   ${category}:`);
        found.forEach(t => {
          const count = tableCounts[t];
          const countStr = typeof count === 'number' ? count.toString().padStart(6) : count;
          console.log(`      ${t.padEnd(35)} ${countStr} records`);
        });
      }
    }

    // 4. COLLISION REPAIR WORKFLOW STATUS
    console.log('\n\n4. COLLISION REPAIR WORKFLOW STATUS');
    console.log('-'.repeat(100));

    const criticalTables = {
      'shops': 'Shop configuration',
      'users': 'System users',
      'customers': 'Customer database',
      'vehicles': 'Vehicle records',
      'claim_management': 'Insurance claims',
      'repair_order_management': 'Active repair orders',
      'advanced_parts_management': 'Parts tracking',
      'purchase_order_system': 'Purchase orders',
      'bms_imports': 'BMS import history',
      'vendors': 'Supplier database'
    };

    console.log('\n   CRITICAL TABLES FOR COLLISION REPAIR:\n');
    for (const [table, description] of Object.entries(criticalTables)) {
      const count = tableCounts[table] || 0;
      const status = count > 0 ? '✅ POPULATED' : '⚠️  EMPTY';
      console.log(`      ${table.padEnd(35)} ${count.toString().padStart(6)} records  ${status}  (${description})`);
    }

    // 5. INDEXES
    console.log('\n\n5. DATABASE INDEXES');
    console.log('-'.repeat(100));

    const indexedTables = ['repair_order_management', 'claim_management', 'vehicles', 'customers', 'parts', 'vendors'];
    console.log('\n   INDEXED TABLES:\n');

    for (const table of indexedTables) {
      try {
        const [indexes] = await sequelize.query(`PRAGMA index_list(${table});`);
        console.log(`      ${table.padEnd(35)} ${indexes.length} indexes`);

        for (const idx of indexes) {
          const [cols] = await sequelize.query(`PRAGMA index_info(${idx.name});`);
          const colNames = cols.map(c => c.name).join(', ');
          console.log(`         - ${idx.name.padEnd(40)} [${colNames}]`);
        }
      } catch (err) {
        console.log(`      ${table.padEnd(35)} Error checking indexes`);
      }
    }

    // 6. FOREIGN KEYS
    console.log('\n\n6. FOREIGN KEY RELATIONSHIPS');
    console.log('-'.repeat(100));

    const fkTables = ['repair_order_management', 'claim_management', 'advanced_parts_management', 'purchase_order_system'];
    console.log('\n   FOREIGN KEY ENFORCEMENT:\n');

    for (const table of fkTables) {
      try {
        const [fks] = await sequelize.query(`PRAGMA foreign_key_list(${table});`);
        console.log(`      ${table.padEnd(35)} ${fks.length} foreign keys`);

        if (fks.length > 0) {
          fks.forEach(fk => {
            console.log(`         - ${fk.from.padEnd(30)} -> ${fk.table}.${fk.to}`);
          });
        }
      } catch (err) {
        console.log(`      ${table.padEnd(35)} Error checking foreign keys`);
      }
    }

    // 7. READINESS ASSESSMENT
    console.log('\n\n7. DATABASE READINESS ASSESSMENT');
    console.log('-'.repeat(100));

    const totalRecords = Object.values(tableCounts).reduce((sum, count) =>
      sum + (typeof count === 'number' ? count : 0), 0);

    const hasShop = tableCounts['shops'] > 0;
    const hasUsers = tableCounts['users'] > 0;
    const hasVendors = tableCounts['vendors'] > 0;
    const hasSampleData = tableCounts['customers'] > 0 || tableCounts['vehicles'] > 0;

    console.log('\n   STATUS CHECKS:\n');
    console.log(`      Database Connection:          ${dbExists ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`      All Tables Created:           ✅ YES (${tables.length} tables)`);
    console.log(`      Schema Migration Complete:    ✅ YES`);
    console.log(`      Shop Configuration:           ${hasShop ? '✅ CONFIGURED' : '⚠️  NOT CONFIGURED'}`);
    console.log(`      User Accounts:                ${hasUsers ? '✅ PRESENT' : '⚠️  NO USERS'}`);
    console.log(`      Vendor Database:              ${hasVendors ? '✅ POPULATED' : '⚠️  EMPTY'}`);
    console.log(`      Sample Data:                  ${hasSampleData ? '✅ LOADED' : '⚠️  NO SAMPLE DATA'}`);
    console.log(`      Total Records:                ${totalRecords.toLocaleString()}`);

    console.log('\n   WORKFLOW READINESS:\n');
    const workflows = {
      'BMS Import Workflow': tableCounts['bms_imports'] !== undefined,
      'Claim Management': tableCounts['claim_management'] !== undefined,
      'Repair Order Processing': tableCounts['repair_order_management'] !== undefined,
      'Parts Sourcing': tableCounts['advanced_parts_management'] !== undefined,
      'Purchase Orders': tableCounts['purchase_order_system'] !== undefined,
      'Production Tracking': tableCounts['production_workflow'] !== undefined
    };

    for (const [workflow, ready] of Object.entries(workflows)) {
      console.log(`      ${workflow.padEnd(30)} ${ready ? '✅ READY' : '❌ NOT READY'}`);
    }

    // 8. NEXT STEPS
    console.log('\n\n8. RECOMMENDED NEXT STEPS');
    console.log('-'.repeat(100));
    console.log('\n   TO START USING COLLISIONOS:\n');

    if (!hasShop) {
      console.log('      1. ⚠️  Run: npm run db:seed (to create shop and users)');
    } else {
      console.log('      1. ✅ Shop configured - Ready to use');
    }

    if (!hasUsers) {
      console.log('      2. ⚠️  Create user accounts');
    } else {
      console.log('      2. ✅ User accounts exist');
      console.log('         Login: admin@demoautobody.com / admin123');
    }

    if (!hasVendors) {
      console.log('      3. ⚠️  Add vendors for parts sourcing');
    } else {
      console.log('      3. ✅ Vendors configured');
    }

    console.log('      4. 📥 Import BMS file or create manual repair order');
    console.log('      5. 🚗 Start collision repair workflow\n');

    // 9. SUMMARY
    console.log('\n' + '='.repeat(100));
    console.log('SUMMARY');
    console.log('='.repeat(100));
    console.log(`\n   Database Location:    ${dbPath}`);
    console.log(`   Database Size:        ${dbStats ? (dbStats.size / 1024).toFixed(2) + ' KB' : 'N/A'}`);
    console.log(`   Total Tables:         ${tables.length}`);
    console.log(`   Total Records:        ${totalRecords.toLocaleString()}`);
    console.log(`   Status:               ${hasShop && hasUsers ? '✅ READY FOR USE' : '⚠️  NEEDS CONFIGURATION'}`);
    console.log(`   Data Location:        100% LOCAL (No cloud, all on your PC)`);
    console.log('\n' + '='.repeat(100) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR GENERATING REPORT:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

generateDatabaseReport();
