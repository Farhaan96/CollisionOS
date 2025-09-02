const { performance } = require('perf_hooks');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const models = require('../../server/database/models');
const CollisionRepairDataFactory = require('../../server/database/seeders/CollisionRepairDataFactory');

/**
 * Comprehensive Performance Testing Suite for Collision Repair System
 * Tests database performance under various collision repair workflow scenarios
 */
class CollisionRepairPerformanceTests {
    constructor() {
        this.factory = new CollisionRepairDataFactory();
        this.testResults = {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'test',
            database_type: 'SQLite',
            test_runs: []
        };
    }

    /**
     * Measure execution time of a function
     */
    async measurePerformance(testName, testFunction, iterations = 1) {
        console.log(chalk.blue(`🔬 Running ${testName}${iterations > 1 ? ` (${iterations}x)` : ''}...`));
        
        const results = [];
        
        for (let i = 0; i < iterations; i++) {
            const startTime = performance.now();
            
            try {
                const result = await testFunction();
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                results.push({
                    iteration: i + 1,
                    duration_ms: duration,
                    success: true,
                    result_size: Array.isArray(result) ? result.length : typeof result === 'object' ? Object.keys(result).length : 1
                });
                
            } catch (error) {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                results.push({
                    iteration: i + 1,
                    duration_ms: duration,
                    success: false,
                    error: error.message
                });
                
                console.error(chalk.red(`  ❌ Iteration ${i + 1} failed: ${error.message}`));
            }
        }
        
        // Calculate statistics
        const successfulRuns = results.filter(r => r.success);
        const avgDuration = successfulRuns.reduce((sum, r) => sum + r.duration_ms, 0) / successfulRuns.length;
        const minDuration = Math.min(...successfulRuns.map(r => r.duration_ms));
        const maxDuration = Math.max(...successfulRuns.map(r => r.duration_ms));
        
        const testResult = {
            test_name: testName,
            iterations,
            success_rate: (successfulRuns.length / iterations) * 100,
            avg_duration_ms: avgDuration,
            min_duration_ms: minDuration,
            max_duration_ms: maxDuration,
            total_duration_ms: results.reduce((sum, r) => sum + r.duration_ms, 0),
            results
        };
        
        this.testResults.test_runs.push(testResult);
        
        console.log(chalk.green(`  ✅ ${testName}: ${avgDuration.toFixed(2)}ms avg (${successfulRuns.length}/${iterations} successful)`));
        
        return testResult;
    }

    /**
     * Test customer search performance
     */
    async testCustomerSearchPerformance() {
        return await this.measurePerformance('Customer Search Performance', async () => {
            // Test various search scenarios
            const searches = [
                { where: { first_name: 'John' } },
                { where: { last_name: 'Smith' } },
                { where: { email: { [models.Sequelize.Op.like]: '%gmail.com' } } },
                { where: { phone: { [models.Sequelize.Op.like]: '%555%' } } }
            ];
            
            const results = [];
            for (const search of searches) {
                const customers = await models.Customer.findAll(search);
                results.push(customers);
            }
            
            return results.flat();
        }, 10);
    }

    /**
     * Test repair order workflow queries
     */
    async testRepairOrderWorkflowQueries() {
        return await this.measurePerformance('Repair Order Workflow Queries', async () => {
            // Complex queries typical in collision repair workflows
            const queries = [
                // Active repair orders with customer and vehicle info
                models.Job.findAll({
                    where: { status: ['Approved', 'In Progress'] },
                    include: [
                        { model: models.Customer, as: 'customer' },
                        { model: models.Vehicle, as: 'vehicle' },
                        { model: models.Part, as: 'parts' }
                    ],
                    limit: 50
                }),
                
                // Repair orders by priority
                models.Job.findAll({
                    where: { priority: 'High' },
                    order: [['entry_date', 'DESC']],
                    limit: 25
                }),
                
                // Parts needed for active jobs
                models.Part.findAll({
                    where: { status: ['Needed', 'Ordered'] },
                    include: [{ model: models.Job, as: 'job' }],
                    limit: 100
                })
            ];
            
            const results = await Promise.all(queries);
            return results.flat();
        }, 5);
    }

    /**
     * Test parts management performance
     */
    async testPartsManagementPerformance() {
        return await this.measurePerformance('Parts Management Performance', async () => {
            // Parts workflow queries
            const queries = [
                // Parts by status aggregation
                models.Part.findAll({
                    attributes: [
                        'status',
                        [models.Sequelize.fn('COUNT', '*'), 'count'],
                        [models.Sequelize.fn('SUM', models.Sequelize.col('unit_cost')), 'total_cost']
                    ],
                    group: ['status']
                }),
                
                // Parts by vendor performance
                models.Part.findAll({
                    include: [{
                        model: models.Vendor,
                        as: 'vendor',
                        attributes: ['name', 'vendor_code']
                    }],
                    where: { status: 'Received' },
                    limit: 50
                }),
                
                // Parts ordered in last 30 days
                models.Part.findAll({
                    where: {
                        created_at: {
                            [models.Sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        }
                    },
                    order: [['created_at', 'DESC']],
                    limit: 100
                })
            ];
            
            const results = await Promise.all(queries);
            return results.flat();
        }, 5);
    }

    /**
     * Test BMS import simulation performance
     */
    async testBMSImportPerformance() {
        return await this.measurePerformance('BMS Import Simulation', async () => {
            // Simulate BMS import workflow
            const bmsData = this.factory.generateCompleteWorkflow({
                customerCount: 10,
                vehiclesPerCustomer: 1,
                claimsPerVehicle: 1,
                repairOrdersPerClaim: 1,
                partsPerRO: 5
            });
            
            // Simulate database operations for BMS import
            const operations = [];
            
            // Customer lookup/creation simulation
            for (const customer of bmsData.customers.slice(0, 5)) {
                operations.push(
                    models.Customer.findOrCreate({
                        where: { email: customer.email },
                        defaults: customer
                    })
                );
            }
            
            // Vehicle creation simulation
            for (const vehicle of bmsData.vehicles.slice(0, 5)) {
                operations.push(
                    models.Vehicle.findOrCreate({
                        where: { vin: vehicle.vin },
                        defaults: vehicle
                    })
                );
            }
            
            const results = await Promise.all(operations);
            return results;
        }, 3);
    }

    /**
     * Test database stress under concurrent operations
     */
    async testConcurrentOperationsStress() {
        return await this.measurePerformance('Concurrent Operations Stress Test', async () => {
            // Simulate concurrent operations typical in busy shop
            const concurrentOperations = [
                // Customer searches
                models.Customer.findAll({ limit: 10 }),
                models.Customer.findAll({ where: { state: 'CA' }, limit: 5 }),
                
                // Vehicle searches
                models.Vehicle.findAll({ where: { make: 'Toyota' }, limit: 10 }),
                models.Vehicle.findAll({ where: { year: { [models.Sequelize.Op.gte]: 2020 } }, limit: 10 }),
                
                // Job status updates simulation
                models.Job.findAll({ where: { status: 'In Progress' }, limit: 5 }),
                models.Job.findAll({ where: { priority: 'High' }, limit: 5 }),
                
                // Parts queries
                models.Part.findAll({ where: { status: 'Needed' }, limit: 20 }),
                models.Part.findAll({ where: { status: 'Ordered' }, limit: 15 }),
                
                // Vendor queries
                models.Vendor.findAll({ where: { is_active: true } }),
                models.Vendor.findAll({ where: { rating: { [models.Sequelize.Op.gte]: 4.0 } } })
            ];
            
            const results = await Promise.all(concurrentOperations);
            return results.flat();
        }, 3);
    }

    /**
     * Test large dataset query performance
     */
    async testLargeDatasetQueries() {
        return await this.measurePerformance('Large Dataset Queries', async () => {
            // Queries that would be used in reporting and analytics
            const queries = [
                // All customers with vehicle count
                models.Customer.findAll({
                    attributes: {
                        include: [
                            [models.Sequelize.fn('COUNT', models.Sequelize.col('vehicles.id')), 'vehicle_count']
                        ]
                    },
                    include: [{
                        model: models.Vehicle,
                        as: 'vehicles',
                        attributes: []
                    }],
                    group: ['Customer.id'],
                    limit: 100
                }),
                
                // Jobs with parts count and total cost
                models.Job.findAll({
                    attributes: {
                        include: [
                            [models.Sequelize.fn('COUNT', models.Sequelize.col('parts.id')), 'parts_count'],
                            [models.Sequelize.fn('SUM', models.Sequelize.col('parts.unit_cost')), 'parts_total_cost']
                        ]
                    },
                    include: [{
                        model: models.Part,
                        as: 'parts',
                        attributes: []
                    }],
                    group: ['Job.id'],
                    limit: 50
                }),
                
                // Full text search simulation
                models.Job.findAll({
                    where: {
                        [models.Sequelize.Op.or]: [
                            { description: { [models.Sequelize.Op.like]: '%collision%' } },
                            { ro_number: { [models.Sequelize.Op.like]: '%RO%' } }
                        ]
                    },
                    limit: 25
                })
            ];
            
            const results = await Promise.all(queries);
            return results.flat();
        }, 3);
    }

    /**
     * Generate performance report
     */
    generatePerformanceReport() {
        const reportPath = path.join(__dirname, '../test-reports', `collision-repair-performance-${Date.now()}.json`);
        const reportDir = path.dirname(reportPath);
        
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }
        
        // Calculate overall statistics
        const allTests = this.testResults.test_runs;
        const totalTests = allTests.length;
        const avgSuccessRate = allTests.reduce((sum, test) => sum + test.success_rate, 0) / totalTests;
        const avgDuration = allTests.reduce((sum, test) => sum + test.avg_duration_ms, 0) / totalTests;
        
        // Add summary to results
        this.testResults.summary = {
            total_tests: totalTests,
            overall_success_rate: avgSuccessRate,
            average_duration_ms: avgDuration,
            total_test_time_ms: allTests.reduce((sum, test) => sum + test.total_duration_ms, 0),
            performance_grade: this.calculatePerformanceGrade(avgDuration, avgSuccessRate)
        };
        
        // Save detailed report
        fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
        
        return { report: this.testResults, reportPath };
    }

    /**
     * Calculate performance grade based on metrics
     */
    calculatePerformanceGrade(avgDuration, successRate) {
        if (successRate < 80) return 'F';
        if (avgDuration > 1000) return 'D';
        if (avgDuration > 500) return 'C';
        if (avgDuration > 200) return 'B';
        return 'A';
    }

    /**
     * Run complete performance test suite
     */
    async runPerformanceTestSuite() {
        console.log(chalk.cyan.bold('🚀 CollisionOS Performance Testing Suite\n'));
        
        try {
            // Verify database connection
            await models.sequelize.authenticate();
            console.log(chalk.green('✅ Database connection verified\n'));
            
            // Run all performance tests
            await this.testCustomerSearchPerformance();
            await this.testRepairOrderWorkflowQueries();
            await this.testPartsManagementPerformance();
            await this.testBMSImportPerformance();
            await this.testConcurrentOperationsStress();
            await this.testLargeDatasetQueries();
            
            // Generate and display report
            const { report, reportPath } = this.generatePerformanceReport();
            
            console.log(chalk.green.bold('\n✅ Performance Testing Complete!\n'));
            console.log(chalk.cyan('📊 Performance Summary:'));
            console.log(chalk.white(`  • Total Tests: ${report.summary.total_tests}`));
            console.log(chalk.white(`  • Success Rate: ${report.summary.overall_success_rate.toFixed(1)}%`));
            console.log(chalk.white(`  • Avg Duration: ${report.summary.average_duration_ms.toFixed(2)}ms`));
            console.log(chalk.white(`  • Performance Grade: ${report.summary.performance_grade}`));
            console.log(chalk.white(`  • Total Test Time: ${(report.summary.total_test_time_ms / 1000).toFixed(2)}s`));
            console.log(chalk.gray(`  • Report: ${reportPath}\n`));
            
            // Performance recommendations
            this.displayPerformanceRecommendations(report);
            
            return report;
            
        } catch (error) {
            console.error(chalk.red('❌ Performance testing failed:'), error.message);
            throw error;
        }
    }

    /**
     * Display performance recommendations
     */
    displayPerformanceRecommendations(report) {
        console.log(chalk.yellow('💡 Performance Recommendations:'));
        
        const avgDuration = report.summary.average_duration_ms;
        
        if (avgDuration > 500) {
            console.log(chalk.yellow('  • Consider adding database indexes for frequently queried fields'));
            console.log(chalk.yellow('  • Review query optimization for complex joins'));
        }
        
        if (report.summary.overall_success_rate < 95) {
            console.log(chalk.yellow('  • Investigate failed test cases for reliability issues'));
            console.log(chalk.yellow('  • Consider adding error handling and retry logic'));
        }
        
        if (avgDuration < 100) {
            console.log(chalk.green('  • Excellent performance! Database is well optimized'));
        }
        
        console.log(chalk.gray('  • Monitor performance regularly as data volume grows'));
        console.log(chalk.gray('  • Consider implementing query result caching for frequently accessed data\n'));
    }
}

// Export for use in other modules
module.exports = CollisionRepairPerformanceTests;

// Run if executed directly
if (require.main === module) {
    const performanceTests = new CollisionRepairPerformanceTests();
    performanceTests.runPerformanceTestSuite()
        .then(() => {
            console.log(chalk.green('🎉 All performance tests completed successfully!'));
            process.exit(0);
        })
        .catch((error) => {
            console.error(chalk.red('❌ Performance tests failed:'), error);
            process.exit(1);
        });
}