const fs = require('fs');
const path = require('path');
const progress = require('progress');

// Import chalk with fallback for version compatibility
let chalk;
try {
    chalk = require('chalk');
} catch (err) {
    // Fallback if chalk import fails
    const fallbackChalk = (text) => text;
    chalk = {
        cyan: { bold: fallbackChalk },
        blue: fallbackChalk,
        white: fallbackChalk,
        gray: fallbackChalk,
        red: fallbackChalk,
        yellow: fallbackChalk,
        green: { bold: fallbackChalk }
    };
}
const CollisionRepairDataFactory = require('./CollisionRepairDataFactory');

/**
 * Comprehensive Collision Repair Database Seeder
 * Seeds the database with realistic collision repair workflow data
 */
class CollisionRepairSeeder {
    constructor(models) {
        this.models = models;
        this.factory = new CollisionRepairDataFactory();
        this.seedStats = {
            shops: 0,
            users: 0,
            customers: 0,
            vehicles: 0,
            claims: 0,
            repairOrders: 0,
            parts: 0,
            vendors: 0,
            production_workflows: 0,
            contact_timelines: 0,
            startTime: Date.now()
        };
    }

    /**
     * Clear all data from collision repair tables
     */
    async clearDatabase() {
        console.log(chalk.yellow('🗑️  Clearing existing data...'));
        
        const tablesToClear = [
            'Parts', 'Jobs', 'Vehicles', 'Customers', 
            'Users', 'Vendors', 'Shops', 'BmsImports',
            'ContactTimeline', 'VehicleProfiles', 'ClaimManagement',
            'RepairOrderManagement', 'ProductionWorkflow', 'SchedulingCapacity',
            'LoanerFleetManagement', 'LoanerReservations', 'AdvancedPartsManagement',
            'PurchaseOrderSystem', 'Estimates', 'EstimateLineItems'
        ];

        for (const tableName of tablesToClear) {
            try {
                if (this.models[tableName]) {
                    await this.models[tableName].destroy({ where: {}, force: true });
                    console.log(chalk.gray(`  ✓ Cleared ${tableName}`));
                }
            } catch (error) {
                console.log(chalk.gray(`  ⚠ Skip ${tableName}: ${error.message}`));
            }
        }
        
        console.log(chalk.green('✅ Database cleared\n'));
    }

    /**
     * Seed core collision repair data (shops, users, vendors)
     */
    async seedCoreData() {
        console.log(chalk.blue('🏢 Seeding core collision repair data...'));

        // Seed shops
        if (this.models.Shop) {
            const shopData = this.factory.generateShop(1);
            await this.models.Shop.create(shopData);
            this.seedStats.shops = 1;
            console.log(chalk.green(`  ✓ Created shop: ${shopData.name}`));
        }

        // Seed vendors
        if (this.models.Vendor) {
            const vendorBar = new progress('  Vendors [:bar] :percent :etas', {
                complete: '█', incomplete: '░', width: 30, total: 10
            });

            for (let i = 1; i <= 10; i++) {
                const vendorData = { ...this.factory.generateVendor(), id: i };
                await this.models.Vendor.create(vendorData);
                vendorBar.tick();
                this.seedStats.vendors++;
            }
            console.log(chalk.green(`  ✓ Created ${this.seedStats.vendors} vendors\n`));
        }

        // Seed users/technicians
        if (this.models.User) {
            const userBar = new progress('  Users [:bar] :percent :etas', {
                complete: '█', incomplete: '░', width: 30, total: 15
            });

            for (let i = 1; i <= 15; i++) {
                const userData = { ...this.factory.generateUser(1), id: i };
                await this.models.User.create(userData);
                userBar.tick();
                this.seedStats.users++;
            }
            console.log(chalk.green(`  ✓ Created ${this.seedStats.users} users/technicians\n`));
        }
    }

    /**
     * Seed collision repair workflow data
     */
    async seedWorkflowData(scale = 'medium') {
        console.log(chalk.blue(`🔄 Seeding collision repair workflow data (${scale} scale)...`));

        const dataset = this.factory.generatePerformanceTestData(scale);
        
        // Seed customers
        if (this.models.Customer && dataset.customers.length > 0) {
            const customerBar = new progress('  Customers [:bar] :percent :etas', {
                complete: '█', incomplete: '░', width: 30, total: dataset.customers.length
            });

            for (const customerData of dataset.customers) {
                await this.models.Customer.create(customerData);
                customerBar.tick();
                this.seedStats.customers++;
            }
            console.log(chalk.green(`  ✓ Created ${this.seedStats.customers} customers`));
        }

        // Seed vehicles
        if (this.models.Vehicle && dataset.vehicles.length > 0) {
            const vehicleBar = new progress('  Vehicles [:bar] :percent :etas', {
                complete: '█', incomplete: '░', width: 30, total: dataset.vehicles.length
            });

            for (const vehicleData of dataset.vehicles) {
                await this.models.Vehicle.create(vehicleData);
                vehicleBar.tick();
                this.seedStats.vehicles++;
            }
            console.log(chalk.green(`  ✓ Created ${this.seedStats.vehicles} vehicles`));
        }

        // Seed repair orders (jobs)
        if (this.models.Job && dataset.repairOrders.length > 0) {
            const jobBar = new progress('  Repair Orders [:bar] :percent :etas', {
                complete: '█', incomplete: '░', width: 30, total: dataset.repairOrders.length
            });

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
                    total_estimate: roData.parts_cost + roData.labor_cost + roData.paint_materials_cost,
                    created_at: roData.created_at,
                    updated_at: roData.updated_at
                };
                await this.models.Job.create(jobData);
                jobBar.tick();
                this.seedStats.repairOrders++;
            }
            console.log(chalk.green(`  ✓ Created ${this.seedStats.repairOrders} repair orders`));
        }

        // Seed parts
        if (this.models.Part && dataset.parts.length > 0) {
            const partBar = new progress('  Parts [:bar] :percent :etas', {
                complete: '█', incomplete: '░', width: 30, total: dataset.parts.length
            });

            for (const partData of dataset.parts) {
                await this.models.Part.create(partData);
                partBar.tick();
                this.seedStats.parts++;
            }
            console.log(chalk.green(`  ✓ Created ${this.seedStats.parts} parts`));
        }

        console.log();
    }

    /**
     * Seed advanced collision repair models
     */
    async seedAdvancedModels() {
        console.log(chalk.blue('⚙️  Seeding advanced collision repair models...'));

        // Seed Contact Timeline data
        if (this.models.ContactTimeline && this.seedStats.customers > 0) {
            const timelineEntries = [];
            
            // Generate 3-5 contact entries per customer
            for (let customerId = 1; customerId <= Math.min(this.seedStats.customers, 100); customerId++) {
                const entryCount = Math.floor(Math.random() * 3) + 3; // 3-5 entries
                
                for (let i = 0; i < entryCount; i++) {
                    timelineEntries.push({
                        customer_id: customerId,
                        contact_type: ['phone', 'email', 'text', 'in_person'][Math.floor(Math.random() * 4)],
                        direction: ['inbound', 'outbound'][Math.floor(Math.random() * 2)],
                        subject: `${['Initial Contact', 'Status Update', 'Parts Update', 'Delivery Notice', 'Follow-up'][Math.floor(Math.random() * 5)]}`,
                        message_content: 'Auto-generated contact entry for testing',
                        contact_datetime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random within 30 days
                        duration_minutes: Math.floor(Math.random() * 20) + 5,
                        outcome: ['successful', 'voicemail', 'busy', 'answered'][Math.floor(Math.random() * 4)],
                        follow_up_required: Math.random() > 0.7,
                        created_at: new Date(),
                        updated_at: new Date()
                    });
                }
            }

            if (timelineEntries.length > 0) {
                await this.models.ContactTimeline.bulkCreate(timelineEntries);
                this.seedStats.contact_timelines = timelineEntries.length;
                console.log(chalk.green(`  ✓ Created ${this.seedStats.contact_timelines} contact timeline entries`));
            }
        }

        // Seed Production Workflow data
        if (this.models.ProductionWorkflow && this.seedStats.repairOrders > 0) {
            const workflowEntries = [];
            
            const productionStages = [
                'Intake', 'Assessment', 'Disassembly', 'Parts_Ordering',
                'Frame_Repair', 'Body_Work', 'Paint_Prep', 'Prime',
                'Base_Coat', 'Clear_Coat', 'Polish', 'Reassembly',
                'Inspection', 'Quality_Check', 'Delivery'
            ];

            // Generate workflow entries for each repair order
            for (let jobId = 1; jobId <= Math.min(this.seedStats.repairOrders, 50); jobId++) {
                const stageCount = Math.floor(Math.random() * 8) + 5; // 5-12 stages
                
                for (let i = 0; i < stageCount; i++) {
                    const stage = productionStages[i % productionStages.length];
                    const startTime = new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000);
                    
                    workflowEntries.push({
                        job_id: jobId,
                        stage_name: stage,
                        stage_status: ['Not_Started', 'In_Progress', 'Completed', 'On_Hold'][Math.floor(Math.random() * 4)],
                        assigned_technician_id: Math.floor(Math.random() * Math.min(this.seedStats.users, 15)) + 1,
                        planned_start_date: startTime,
                        actual_start_date: Math.random() > 0.3 ? startTime : null,
                        estimated_duration_hours: Math.floor(Math.random() * 8) + 1,
                        actual_duration_hours: Math.random() > 0.5 ? Math.floor(Math.random() * 10) + 1 : null,
                        stage_notes: `Auto-generated stage entry for ${stage} testing`,
                        quality_check_passed: Math.random() > 0.1,
                        created_at: new Date(),
                        updated_at: new Date()
                    });
                }
            }

            if (workflowEntries.length > 0) {
                await this.models.ProductionWorkflow.bulkCreate(workflowEntries);
                this.seedStats.production_workflows = workflowEntries.length;
                console.log(chalk.green(`  ✓ Created ${this.seedStats.production_workflows} production workflow entries`));
            }
        }

        console.log();
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
                parts: this.seedStats.parts,
                contact_timeline_entries: this.seedStats.contact_timelines,
                production_workflow_entries: this.seedStats.production_workflows
            },
            performance_metrics: {
                records_per_second: Math.round((Object.values(this.seedStats).reduce((a, b) => typeof b === 'number' ? a + b : a, 0)) / (duration / 1000)),
                workflow_completion_rate: this.seedStats.repairOrders > 0 ? `${Math.round((this.seedStats.production_workflows / this.seedStats.repairOrders) * 100)}%` : '0%',
                customer_engagement_rate: this.seedStats.customers > 0 ? `${Math.round((this.seedStats.contact_timelines / this.seedStats.customers) * 100)}%` : '0%'
            }
        };

        // Save report to file
        const reportPath = path.join(__dirname, '../../test-data-reports', `collision-repair-seed-${Date.now()}.json`);
        const reportDir = path.dirname(reportPath);
        
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        return { report, reportPath };
    }

    /**
     * Run complete collision repair seeding process
     */
    async seedCollisionRepairData(options = {}) {
        const { scale = 'medium', clearFirst = true } = options;

        try {
            console.log(chalk.cyan.bold('🚗 CollisionOS Database Seeding Started\n'));
            
            if (clearFirst) {
                await this.clearDatabase();
            }

            await this.seedCoreData();
            await this.seedWorkflowData(scale);
            await this.seedAdvancedModels();

            const { report, reportPath } = this.generateSeedReport();

            console.log(chalk.green.bold('✅ Collision Repair Seeding Complete!\n'));
            console.log(chalk.cyan('📊 Seeding Summary:'));
            console.log(chalk.white(`  • Shops: ${report.collision_repair_data.shops}`));
            console.log(chalk.white(`  • Technicians: ${report.collision_repair_data.users_technicians}`));
            console.log(chalk.white(`  • Vendors: ${report.collision_repair_data.vendors}`));
            console.log(chalk.white(`  • Customers: ${report.collision_repair_data.customers}`));
            console.log(chalk.white(`  • Vehicles: ${report.collision_repair_data.vehicles}`));
            console.log(chalk.white(`  • Repair Orders: ${report.collision_repair_data.repair_orders}`));
            console.log(chalk.white(`  • Parts: ${report.collision_repair_data.parts}`));
            console.log(chalk.white(`  • Contact Timeline: ${report.collision_repair_data.contact_timeline_entries}`));
            console.log(chalk.white(`  • Production Workflows: ${report.collision_repair_data.production_workflow_entries}`));
            console.log(chalk.white(`  • Duration: ${report.summary.total_duration_readable}`));
            console.log(chalk.white(`  • Records/sec: ${report.performance_metrics.records_per_second}`));
            console.log(chalk.gray(`  • Report saved: ${reportPath}\n`));

            return report;

        } catch (error) {
            console.error('❌ Seeding failed:', error.message);
            throw error;
        }
    }
}

module.exports = CollisionRepairSeeder;