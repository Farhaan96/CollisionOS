const CollisionRepairDataFactory = require('./CollisionRepairDataFactory');

/**
 * Simple Collision Repair Database Seeder
 * Seeds the database with realistic collision repair workflow data
 * No external dependencies for colors/formatting
 */
class SimpleCollisionRepairSeeder {
    constructor(models) {
        this.models = models;
        this.factory = new CollisionRepairDataFactory();
        this.seedStats = {
            shops: 0,
            users: 0,
            customers: 0,
            vehicles: 0,
            repairOrders: 0,
            parts: 0,
            vendors: 0,
            startTime: Date.now()
        };
    }

    /**
     * Clear all data from collision repair tables
     */
    async clearDatabase() {
        console.log('🗑️  Clearing existing data...');
        
        const tablesToClear = [
            'Parts', 'Jobs', 'Vehicles', 'Customers', 
            'Users', 'Vendors', 'Shops'
        ];

        for (const tableName of tablesToClear) {
            try {
                if (this.models[tableName]) {
                    await this.models[tableName].destroy({ where: {}, force: true });
                    console.log(`  ✓ Cleared ${tableName}`);
                }
            } catch (error) {
                console.log(`  ⚠ Skip ${tableName}: ${error.message}`);
            }
        }
        
        console.log('✅ Database cleared\n');
    }

    /**
     * Seed core collision repair data (shops, users, vendors)
     */
    async seedCoreData() {
        console.log('🏢 Seeding core collision repair data...');

        // Seed shops
        let createdShop;
        if (this.models.Shop) {
            const shopData = this.factory.generateShop(1);
            createdShop = await this.models.Shop.create(shopData);
            this.seedStats.shops = 1;
            console.log(`  ✓ Created shop: ${shopData.name}`);
        }

        // Seed vendors
        if (this.models.Vendor && createdShop) {
            for (let i = 1; i <= 5; i++) {
                const vendorData = this.factory.generateVendor(createdShop.id); // Pass actual shop ID
                await this.models.Vendor.create(vendorData);
                this.seedStats.vendors++;
            }
            console.log(`  ✓ Created ${this.seedStats.vendors} vendors`);
        }

        // Seed users/technicians
        if (this.models.User) {
            for (let i = 1; i <= 10; i++) {
                const userData = { ...this.factory.generateUser(1), id: i };
                await this.models.User.create(userData);
                this.seedStats.users++;
            }
            console.log(`  ✓ Created ${this.seedStats.users} users/technicians\n`);
        }
    }

    /**
     * Seed collision repair workflow data
     */
    async seedWorkflowData(scale = 'small') {
        console.log(`🔄 Seeding collision repair workflow data (${scale} scale)...`);

        const scaleConfig = {
            small: { customers: 20, workflows: 1.2 },
            medium: { customers: 100, workflows: 1.5 },
            large: { customers: 500, workflows: 2.0 }
        };

        const config = scaleConfig[scale] || scaleConfig.small;
        const dataset = this.factory.generateCompleteWorkflow({
            customerCount: config.customers,
            vehiclesPerCustomer: config.workflows,
            claimsPerVehicle: 0.7,
            repairOrdersPerClaim: 0.8,
            partsPerRO: 4,
            vendorCount: 5,
            technicianCount: 10
        });
        
        // Seed customers
        if (this.models.Customer && dataset.customers.length > 0) {
            for (const customerData of dataset.customers) {
                await this.models.Customer.create(customerData);
                this.seedStats.customers++;
            }
            console.log(`  ✓ Created ${this.seedStats.customers} customers`);
        }

        // Seed vehicles
        if (this.models.Vehicle && dataset.vehicles.length > 0) {
            for (const vehicleData of dataset.vehicles) {
                await this.models.Vehicle.create(vehicleData);
                this.seedStats.vehicles++;
            }
            console.log(`  ✓ Created ${this.seedStats.vehicles} vehicles`);
        }

        // Seed repair orders (jobs)
        if (this.models.Job && dataset.repairOrders.length > 0) {
            for (const roData of dataset.repairOrders) {
                // Map to Job model structure
                const jobData = {
                    customer_id: roData.customer_id,
                    vehicle_id: roData.vehicle_id,
                    ro_number: roData.ro_number,
                    description: roData.damage_description,
                    status: roData.status,
                    priority: roData.priority,
                    entry_date: roData.entry_date,
                    promised_date: roData.promised_date,
                    labor_hours: roData.labor_hours,
                    parts_cost: roData.parts_cost,
                    labor_cost: roData.labor_cost,
                    total_estimate: roData.parts_cost + roData.labor_cost,
                    created_at: roData.created_at,
                    updated_at: roData.updated_at
                };
                await this.models.Job.create(jobData);
                this.seedStats.repairOrders++;
            }
            console.log(`  ✓ Created ${this.seedStats.repairOrders} repair orders`);
        }

        // Seed parts
        if (this.models.Part && dataset.parts.length > 0) {
            for (const partData of dataset.parts) {
                await this.models.Part.create(partData);
                this.seedStats.parts++;
            }
            console.log(`  ✓ Created ${this.seedStats.parts} parts\n`);
        }
    }

    /**
     * Generate seed summary report
     */
    generateSeedReport() {
        const duration = Date.now() - this.seedStats.startTime;
        const report = {
            summary: {
                total_duration_ms: duration,
                total_duration_readable: `${Math.round(duration / 1000)}s`,
                timestamp: new Date().toISOString()
            },
            collision_repair_data: {
                shops: this.seedStats.shops,
                users_technicians: this.seedStats.users,
                vendors: this.seedStats.vendors,
                customers: this.seedStats.customers,
                vehicles: this.seedStats.vehicles,
                repair_orders: this.seedStats.repairOrders,
                parts: this.seedStats.parts
            },
            performance_metrics: {
                total_records: this.seedStats.shops + this.seedStats.users + this.seedStats.vendors + 
                              this.seedStats.customers + this.seedStats.vehicles + 
                              this.seedStats.repairOrders + this.seedStats.parts,
                records_per_second: Math.round((this.seedStats.shops + this.seedStats.users + this.seedStats.vendors + 
                                               this.seedStats.customers + this.seedStats.vehicles + 
                                               this.seedStats.repairOrders + this.seedStats.parts) / (duration / 1000))
            }
        };

        return report;
    }

    /**
     * Run complete collision repair seeding process
     */
    async seedCollisionRepairData(options = {}) {
        const { scale = 'small', clearFirst = true } = options;

        try {
            console.log('🚗 CollisionOS Database Seeding Started\n');
            
            if (clearFirst) {
                await this.clearDatabase();
            }

            await this.seedCoreData();
            await this.seedWorkflowData(scale);

            const report = this.generateSeedReport();

            console.log('✅ Collision Repair Seeding Complete!\n');
            console.log('📊 Seeding Summary:');
            console.log(`  • Shops: ${report.collision_repair_data.shops}`);
            console.log(`  • Technicians: ${report.collision_repair_data.users_technicians}`);
            console.log(`  • Vendors: ${report.collision_repair_data.vendors}`);
            console.log(`  • Customers: ${report.collision_repair_data.customers}`);
            console.log(`  • Vehicles: ${report.collision_repair_data.vehicles}`);
            console.log(`  • Repair Orders: ${report.collision_repair_data.repair_orders}`);
            console.log(`  • Parts: ${report.collision_repair_data.parts}`);
            console.log(`  • Duration: ${report.summary.total_duration_readable}`);
            console.log(`  • Total Records: ${report.performance_metrics.total_records}`);
            console.log(`  • Records/sec: ${report.performance_metrics.records_per_second}\n`);

            return report;

        } catch (error) {
            console.error('❌ Seeding failed:', error.message);
            throw error;
        }
    }
}

module.exports = SimpleCollisionRepairSeeder;