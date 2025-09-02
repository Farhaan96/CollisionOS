#!/usr/bin/env node

/**
 * Simple Collision Repair Database Seeding Test
 * Tests the seeding functionality without complex CLI features
 */

const models = require('../server/database/models');
const SimpleCollisionRepairSeeder = require('../server/database/seeders/SimpleCollisionRepairSeeder');

async function testCollisionRepairSeeding() {
    console.log('🚗 Testing CollisionOS Data Seeding...\n');
    
    try {
        // Test database connection
        await models.sequelize.authenticate();
        console.log('✅ Database connection verified');

        // Initialize seeder
        const seeder = new SimpleCollisionRepairSeeder(models);
        
        // Run seeding with small dataset
        console.log('📊 Starting small dataset seeding...');
        
        const report = await seeder.seedCollisionRepairData({
            scale: 'small',
            clearFirst: true
        });

        console.log('\n🎉 Seeding Test Completed Successfully!');
        console.log('\n📊 Results Summary:');
        console.log(`• Shops: ${report.collision_repair_data.shops}`);
        console.log(`• Users: ${report.collision_repair_data.users_technicians}`);
        console.log(`• Vendors: ${report.collision_repair_data.vendors}`);
        console.log(`• Customers: ${report.collision_repair_data.customers}`);
        console.log(`• Vehicles: ${report.collision_repair_data.vehicles}`);
        console.log(`• Repair Orders: ${report.collision_repair_data.repair_orders}`);
        console.log(`• Parts: ${report.collision_repair_data.parts}`);
        console.log(`• Total Records: ${report.performance_metrics.total_records}`);
        console.log(`• Duration: ${report.summary.total_duration_readable}`);

        console.log('\n💡 Database is ready for testing collision repair workflows!');

        return report;

    } catch (error) {
        console.error('\n❌ Seeding test failed:', error.message);
        console.error('Stack:', error.stack);
        throw error;
    } finally {
        // Close database connection
        if (models.sequelize) {
            await models.sequelize.close();
        }
    }
}

// Run the test
if (require.main === module) {
    testCollisionRepairSeeding()
        .then(() => {
            console.log('\n✅ All seeding tests passed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Seeding test failed:', error.message);
            process.exit(1);
        });
}

module.exports = testCollisionRepairSeeding;