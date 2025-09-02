#!/usr/bin/env node

/**
 * Collision Repair Database Seeding Script
 * Seeds the database with realistic collision repair test data
 * 
 * Usage:
 *   node scripts/seed-collision-repair-data.js [scale] [options]
 * 
 * Scale options: small, medium, large, enterprise
 * Options: --clear-first, --no-clear, --verbose
 */

const path = require('path');
const { Command } = require('commander');

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

// Import database models and seeder
const models = require('../server/database/models');
const CollisionRepairSeeder = require('../server/database/seeders/CollisionRepairSeeder');

// Command line interface
const program = new Command();

program
    .name('seed-collision-repair-data')
    .description('Seed CollisionOS database with realistic collision repair test data')
    .argument('[scale]', 'Data scale: small, medium, large, enterprise', 'medium')
    .option('-c, --clear-first', 'Clear existing data before seeding', true)
    .option('-n, --no-clear', 'Do not clear existing data')
    .option('-v, --verbose', 'Verbose output')
    .option('-r, --report-only', 'Generate seeding report without seeding')
    .action(async (scale, options) => {
        try {
            console.log(chalk.cyan.bold('🚗 CollisionOS Test Data Seeding\n'));

            // Validate scale parameter
            const validScales = ['small', 'medium', 'large', 'enterprise'];
            if (!validScales.includes(scale)) {
                console.error(chalk.red(`❌ Invalid scale: ${scale}`));
                console.log(chalk.gray(`Available scales: ${validScales.join(', ')}`));
                process.exit(1);
            }

            // Display configuration
            console.log(chalk.blue('📋 Configuration:'));
            console.log(chalk.white(`  • Scale: ${scale}`));
            console.log(chalk.white(`  • Clear first: ${options.clearFirst ? 'Yes' : 'No'}`));
            console.log(chalk.white(`  • Verbose: ${options.verbose ? 'Yes' : 'No'}`));
            console.log(chalk.white(`  • Database: SQLite (data/collisionos.db)`));

            // Show expected data volumes
            const dataVolumes = {
                small: { customers: '~100', vehicles: '~120', repairOrders: '~85', parts: '~400' },
                medium: { customers: '~500', vehicles: '~1,000', repairOrders: '~450', parts: '~2,700' },
                large: { customers: '~2,000', vehicles: '~5,000', repairOrders: '~1,800', parts: '~10,800' },
                enterprise: { customers: '~10,000', vehicles: '~30,000', repairOrders: '~9,000', parts: '~54,000' }
            };

            console.log(chalk.blue('\n📈 Expected Data Volume:'));
            const volume = dataVolumes[scale];
            console.log(chalk.white(`  • Customers: ${volume.customers}`));
            console.log(chalk.white(`  • Vehicles: ${volume.vehicles}`));
            console.log(chalk.white(`  • Repair Orders: ${volume.repairOrders}`));
            console.log(chalk.white(`  • Parts: ${volume.parts}`));
            console.log();

            if (options.reportOnly) {
                console.log(chalk.yellow('📊 Report-only mode: No data will be seeded\n'));
                return;
            }

            // Confirm before proceeding with large datasets
            if (['large', 'enterprise'].includes(scale)) {
                console.log(chalk.yellow('⚠️  Large dataset detected. This may take several minutes.'));
                console.log(chalk.yellow('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n'));
                
                await new Promise(resolve => setTimeout(resolve, 5000));
            }

            // Initialize seeder
            const seeder = new CollisionRepairSeeder(models);

            // Run seeding process
            const report = await seeder.seedCollisionRepairData({
                scale,
                clearFirst: options.clearFirst
            });

            // Display success message with performance info
            console.log(chalk.green.bold('🎉 Seeding completed successfully!'));
            console.log(chalk.cyan('\n📊 Performance Metrics:'));
            console.log(chalk.white(`  • Total duration: ${report.summary.total_duration_readable}`));
            console.log(chalk.white(`  • Records per second: ${report.performance_metrics.records_per_second}`));
            console.log(chalk.white(`  • Workflow completion: ${report.performance_metrics.workflow_completion_rate}`));
            console.log(chalk.white(`  • Customer engagement: ${report.performance_metrics.customer_engagement_rate}`));

            console.log(chalk.cyan('\n🗂️  Ready for Testing:'));
            console.log(chalk.white(`  • BMS Import Testing: Upload XML files to create new repair orders`));
            console.log(chalk.white(`  • Production Board: View and manage repair order workflows`));
            console.log(chalk.white(`  • Parts Management: Track parts ordering and receiving`));
            console.log(chalk.white(`  • Customer Management: Search and manage customer information`));
            console.log(chalk.white(`  • Performance Testing: Database ready for load testing`));

            console.log(chalk.gray('\n💡 Next Steps:'));
            console.log(chalk.gray(`  • npm run server (start backend)`));
            console.log(chalk.gray(`  • npm run client (start frontend)`));
            console.log(chalk.gray(`  • npm run test:e2e (run E2E tests)`));
            console.log(chalk.gray(`  • npm run test:performance (run performance tests)`));

        } catch (error) {
            console.error(chalk.red('\n❌ Seeding failed:'));
            console.error(chalk.red(error.message));
            
            if (options.verbose) {
                console.error(chalk.gray('\nStack trace:'));
                console.error(chalk.gray(error.stack));
            }
            
            process.exit(1);
        }
    });

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk.red('\n❌ Unhandled Promise Rejection:'));
    console.error(chalk.red(reason));
    process.exit(1);
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n⚠️  Seeding interrupted by user'));
    process.exit(0);
});

// Run the program
if (require.main === module) {
    program.parse();
}