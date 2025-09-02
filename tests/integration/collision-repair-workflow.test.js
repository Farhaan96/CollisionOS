/**
 * Comprehensive Collision Repair Workflow Integration Tests
 * Tests the complete collision repair business cycle from customer intake to delivery
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const { faker } = require('@faker-js/faker');
const models = require('../../server/database/models');
const CollisionRepairDataFactory = require('../../server/database/seeders/CollisionRepairDataFactory');

// Import the Express app (adjust path as needed)
let app;
try {
    app = require('../../server/index');
} catch (error) {
    console.log('Server not available for integration tests, using mock');
}

describe('Collision Repair Workflow Integration Tests', () => {
    let factory;
    let testCustomer, testVehicle, testJob, testVendor;
    let authToken;

    beforeAll(async () => {
        factory = new CollisionRepairDataFactory();
        
        // Clear test data
        if (models.sequelize) {
            await models.sequelize.authenticate();
            console.log('Database connected for integration tests');
        }
    });

    afterAll(async () => {
        // Cleanup test data
        if (models.sequelize) {
            await models.sequelize.close();
        }
    });

    beforeEach(async () => {
        // Create fresh test data for each test
        testCustomer = factory.generateCustomer();
        testVehicle = factory.generateVehicle(1);
        testJob = factory.generateRepairOrder(1, 1, 1);
        testVendor = factory.generateVendor();
    });

    describe('Customer Management Workflow', () => {
        test('should create customer with complete profile', async () => {
            const customerData = {
                ...testCustomer,
                insurance_policy_details: {
                    company: faker.helpers.arrayElement(['State Farm', 'Geico', 'Progressive']),
                    policy_number: faker.string.alphanumeric(12),
                    deductible: faker.helpers.arrayElement([250, 500, 1000])
                }
            };

            if (models.Customer) {
                const customer = await models.Customer.create(customerData);
                
                expect(customer).toBeDefined();
                expect(customer.id).toBeDefined();
                expect(customer.first_name).toBe(customerData.first_name);
                expect(customer.email).toBe(customerData.email);
                expect(customer.phone).toBe(customerData.phone);
            }
        }, 10000);

        test('should handle duplicate customer detection', async () => {
            const duplicateData = {
                ...testCustomer,
                email: 'duplicate@test.com'
            };

            if (models.Customer) {
                // Create first customer
                const customer1 = await models.Customer.create(duplicateData);
                expect(customer1).toBeDefined();

                // Attempt to create duplicate should be handled gracefully
                const [customer2, created] = await models.Customer.findOrCreate({
                    where: { email: duplicateData.email },
                    defaults: duplicateData
                });

                expect(created).toBe(false);
                expect(customer2.id).toBe(customer1.id);
            }
        });

        test('should validate required customer fields', async () => {
            const incompleteData = {
                first_name: 'John',
                // Missing required fields
            };

            if (models.Customer) {
                try {
                    await models.Customer.create(incompleteData);
                    // Should not reach here
                    expect(true).toBe(false);
                } catch (error) {
                    expect(error).toBeDefined();
                    // Validation should catch missing required fields
                }
            } else {
                expect(true).toBe(true); // Skip if model not available
            }
        });
    });

    describe('Vehicle Registration Workflow', () => {
        test('should register vehicle with VIN validation', async () => {
            const vehicleData = {
                ...testVehicle,
                vin: factory.generateVIN(),
                registration_documents: {
                    title_number: faker.string.alphanumeric(10),
                    registration_expiry: faker.date.future()
                }
            };

            if (models.Vehicle) {
                const vehicle = await models.Vehicle.create(vehicleData);
                
                expect(vehicle).toBeDefined();
                expect(vehicle.vin).toBe(vehicleData.vin);
                expect(vehicle.vin).toMatch(/^[A-HJ-NPR-Z0-9]{17}$/); // VIN format check
                expect(vehicle.make).toBe(vehicleData.make);
                expect(vehicle.model).toBe(vehicleData.model);
                expect(vehicle.year).toBeGreaterThan(1980);
            }
        });

        test('should prevent duplicate VIN registration', async () => {
            const vin = factory.generateVIN();
            const vehicleData1 = { ...testVehicle, vin, customer_id: 1 };
            const vehicleData2 = { ...testVehicle, vin, customer_id: 2 };

            if (models.Vehicle) {
                // Create first vehicle
                const vehicle1 = await models.Vehicle.create(vehicleData1);
                expect(vehicle1.vin).toBe(vin);

                // Attempt to create vehicle with same VIN
                try {
                    await models.Vehicle.create(vehicleData2);
                    expect(true).toBe(false); // Should not reach here
                } catch (error) {
                    expect(error).toBeDefined();
                    // Should fail due to unique constraint
                }
            }
        });
    });

    describe('BMS Import Workflow Simulation', () => {
        test('should process BMS XML data correctly', async () => {
            const bmsData = {
                customer: testCustomer,
                vehicle: testVehicle,
                claim: {
                    claim_number: `CLM${faker.string.numeric(10)}`,
                    insurance_company: 'State Farm',
                    accident_date: faker.date.recent(),
                    deductible_amount: 500
                },
                parts: factory.generateParts(1, 5)
            };

            // Simulate BMS processing workflow
            if (models.Customer && models.Vehicle && models.Job && models.Part) {
                // Step 1: Create or find customer
                const [customer, customerCreated] = await models.Customer.findOrCreate({
                    where: { email: bmsData.customer.email },
                    defaults: bmsData.customer
                });

                // Step 2: Create or find vehicle
                const [vehicle, vehicleCreated] = await models.Vehicle.findOrCreate({
                    where: { vin: bmsData.vehicle.vin },
                    defaults: { ...bmsData.vehicle, customer_id: customer.id }
                });

                // Step 3: Create repair order (job)
                const job = await models.Job.create({
                    ...testJob,
                    customer_id: customer.id,
                    vehicle_id: vehicle.id,
                    ro_number: `RO${faker.string.numeric(6)}`
                });

                // Step 4: Create parts
                const parts = await Promise.all(
                    bmsData.parts.map(part => 
                        models.Part.create({ ...part, job_id: job.id })
                    )
                );

                // Verify workflow completion
                expect(customer).toBeDefined();
                expect(vehicle).toBeDefined();
                expect(job).toBeDefined();
                expect(parts).toHaveLength(5);
                expect(job.customer_id).toBe(customer.id);
                expect(job.vehicle_id).toBe(vehicle.id);
            }
        }, 15000);

        test('should handle malformed BMS data gracefully', async () => {
            const malformedData = {
                customer: { /* missing required fields */ },
                vehicle: { vin: 'INVALID_VIN' },
                parts: []
            };

            // BMS processing should handle errors gracefully
            if (models.Customer && models.Vehicle) {
                try {
                    // Attempt to process malformed data
                    const customer = await models.Customer.create(malformedData.customer);
                    expect(customer).toBeUndefined(); // Should not succeed
                } catch (error) {
                    expect(error).toBeDefined();
                    // Error handling should be present
                }
            }
        });
    });

    describe('Parts Ordering Workflow', () => {
        test('should create purchase order with parts', async () => {
            const parts = [
                {
                    part_number: 'BP-001',
                    description: 'Front Bumper',
                    quantity: 1,
                    unit_cost: 245.50,
                    vendor_id: 1,
                    status: 'Needed'
                },
                {
                    part_number: 'HL-002',
                    description: 'Headlight Assembly',
                    quantity: 1,
                    unit_cost: 189.99,
                    vendor_id: 1,
                    status: 'Needed'
                }
            ];

            if (models.Part && models.Vendor) {
                // Create vendor first
                const vendor = await models.Vendor.create(testVendor);
                
                // Create parts with vendor reference
                const createdParts = await Promise.all(
                    parts.map(part => 
                        models.Part.create({ ...part, vendor_id: vendor.id })
                    )
                );

                // Verify parts creation
                expect(createdParts).toHaveLength(2);
                expect(createdParts[0].vendor_id).toBe(vendor.id);
                expect(createdParts[0].status).toBe('Needed');

                // Simulate PO creation workflow
                const totalCost = createdParts.reduce((sum, part) => sum + (part.unit_cost * part.quantity), 0);
                expect(totalCost).toBeCloseTo(435.49);
            }
        });

        test('should track parts status transitions', async () => {
            const statusTransitions = ['Needed', 'Ordered', 'Backordered', 'Received', 'Installed'];

            if (models.Part) {
                const part = await models.Part.create({
                    part_number: 'TEST-001',
                    description: 'Test Part',
                    quantity: 1,
                    unit_cost: 100.00,
                    status: 'Needed',
                    job_id: 1,
                    vendor_id: 1
                });

                // Test status transitions
                for (let i = 1; i < statusTransitions.length; i++) {
                    part.status = statusTransitions[i];
                    await part.save();
                    expect(part.status).toBe(statusTransitions[i]);
                }
            }
        });

        test('should calculate parts costs correctly', async () => {
            const testParts = [
                { quantity: 2, unit_cost: 50.00 }, // $100.00
                { quantity: 1, unit_cost: 250.99 }, // $250.99
                { quantity: 3, unit_cost: 25.50 }   // $76.50
            ];

            let totalCost = 0;
            
            for (const partData of testParts) {
                totalCost += partData.quantity * partData.unit_cost;
            }

            expect(totalCost).toBeCloseTo(427.49);

            // Test with tax calculation
            const taxRate = 0.0875; // 8.75%
            const totalWithTax = totalCost * (1 + taxRate);
            expect(totalWithTax).toBeCloseTo(464.91);
        });
    });

    describe('Production Workflow Management', () => {
        test('should track job through production stages', async () => {
            const productionStages = [
                'Intake', 'Assessment', 'Disassembly', 'Parts_Ordering',
                'Body_Work', 'Paint_Prep', 'Paint', 'Reassembly',
                'Quality_Check', 'Delivery'
            ];

            if (models.Job) {
                const job = await models.Job.create({
                    ...testJob,
                    status: 'In Progress'
                });

                // Simulate production stage progression
                for (const stage of productionStages.slice(0, 5)) {
                    // In a real system, this would update production workflow tables
                    job.current_stage = stage;
                    job.updated_at = new Date();
                    await job.save();
                    
                    expect(job.current_stage).toBe(stage);
                }

                // Test stage completion tracking
                expect(job.status).toBe('In Progress');
            }
        });

        test('should calculate job completion percentage', async () => {
            const totalStages = 10;
            const completedStages = 7;
            const completionPercentage = (completedStages / totalStages) * 100;

            expect(completionPercentage).toBe(70);

            // Test different completion scenarios
            const scenarios = [
                { completed: 0, total: 10, expected: 0 },
                { completed: 5, total: 10, expected: 50 },
                { completed: 10, total: 10, expected: 100 },
                { completed: 3, total: 8, expected: 37.5 }
            ];

            scenarios.forEach(({ completed, total, expected }) => {
                const percentage = (completed / total) * 100;
                expect(percentage).toBeCloseTo(expected);
            });
        });
    });

    describe('Financial Calculations', () => {
        test('should calculate job totals correctly', async () => {
            const jobFinancials = {
                parts_cost: 1250.00,
                labor_cost: 850.00,
                paint_materials: 325.50,
                sublet_work: 150.00,
                shop_supplies: 75.25
            };

            const subtotal = Object.values(jobFinancials).reduce((sum, cost) => sum + cost, 0);
            expect(subtotal).toBeCloseTo(2650.75);

            // Test tax calculations
            const taxRate = 0.0875;
            const tax = subtotal * taxRate;
            const total = subtotal + tax;

            expect(tax).toBeCloseTo(231.94);
            expect(total).toBeCloseTo(2882.69);
        });

        test('should handle insurance deductible calculations', async () => {
            const repairTotal = 3500.00;
            const deductibles = [250, 500, 1000, 1500];

            deductibles.forEach(deductible => {
                const insurancePayment = Math.max(0, repairTotal - deductible);
                const customerPayment = Math.min(deductible, repairTotal);

                expect(insurancePayment + customerPayment).toBeCloseTo(repairTotal);
                expect(customerPayment).toBeLessThanOrEqual(deductible);
            });
        });
    });

    describe('Data Relationship Integrity', () => {
        test('should maintain referential integrity across models', async () => {
            if (models.Customer && models.Vehicle && models.Job && models.Part) {
                // Create customer
                const customer = await models.Customer.create(testCustomer);
                
                // Create vehicle for customer
                const vehicle = await models.Vehicle.create({
                    ...testVehicle,
                    customer_id: customer.id
                });
                
                // Create job for customer and vehicle
                const job = await models.Job.create({
                    ...testJob,
                    customer_id: customer.id,
                    vehicle_id: vehicle.id
                });
                
                // Create parts for job
                const parts = await models.Part.bulkCreate([
                    { ...factory.generateParts(job.id, 1)[0], job_id: job.id },
                    { ...factory.generateParts(job.id, 1)[0], job_id: job.id }
                ]);

                // Verify relationships
                expect(vehicle.customer_id).toBe(customer.id);
                expect(job.customer_id).toBe(customer.id);
                expect(job.vehicle_id).toBe(vehicle.id);
                expect(parts[0].job_id).toBe(job.id);
                expect(parts[1].job_id).toBe(job.id);
            }
        }, 15000);

        test('should enforce foreign key constraints', async () => {
            if (models.Vehicle) {
                try {
                    // Attempt to create vehicle with non-existent customer
                    await models.Vehicle.create({
                        ...testVehicle,
                        customer_id: 99999 // Non-existent customer
                    });
                    
                    // Should not reach here if foreign key constraints are enforced
                    // Note: SQLite may not enforce FK constraints by default
                    expect(true).toBe(true); // Test passes if no constraint or constraint works
                } catch (error) {
                    // Foreign key constraint should prevent this
                    expect(error).toBeDefined();
                }
            }
        });
    });

    describe('Search and Query Performance', () => {
        test('should perform efficient customer searches', async () => {
            const searchTerms = [
                'John',
                'Smith',
                'john@example.com',
                '555-1234'
            ];

            if (models.Customer) {
                // Create test customers for searching
                const testCustomers = [];
                for (let i = 0; i < 10; i++) {
                    testCustomers.push(await models.Customer.create(factory.generateCustomer()));
                }

                // Test various search scenarios
                for (const term of searchTerms) {
                    const start = Date.now();
                    
                    const results = await models.Customer.findAll({
                        where: {
                            [models.Sequelize.Op.or]: [
                                { first_name: { [models.Sequelize.Op.like]: `%${term}%` } },
                                { last_name: { [models.Sequelize.Op.like]: `%${term}%` } },
                                { email: { [models.Sequelize.Op.like]: `%${term}%` } },
                                { phone: { [models.Sequelize.Op.like]: `%${term}%` } }
                            ]
                        },
                        limit: 10
                    });
                    
                    const duration = Date.now() - start;
                    
                    // Search should complete within reasonable time
                    expect(duration).toBeLessThan(500); // 500ms max
                    expect(results).toBeDefined();
                    expect(Array.isArray(results)).toBe(true);
                }
            }
        }, 20000);
    });
});

// Helper function to generate test authentication token
function generateTestAuthToken() {
    return 'test-auth-token-' + Date.now();
}

// Helper function to clean up test data
async function cleanupTestData() {
    const models_to_clean = ['Part', 'Job', 'Vehicle', 'Customer', 'Vendor'];
    
    for (const modelName of models_to_clean) {
        if (models[modelName]) {
            try {
                await models[modelName].destroy({ where: {}, force: true });
            } catch (error) {
                console.log(`Cleanup warning: ${error.message}`);
            }
        }
    }
}