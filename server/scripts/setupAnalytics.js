#!/usr/bin/env node

/**
 * Analytics Setup Script
 * Sets up analytics tables and populates initial data
 * Compatible with both Supabase and SQLite
 */

const path = require('path');
const fs = require('fs').promises;
const { databaseService } = require('../services/databaseService');
const { getSupabaseClient, isSupabaseEnabled } = require('../config/supabase');

class AnalyticsSetup {
    constructor() {
        this.useSupabase = isSupabaseEnabled;
        this.logMessages = [];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
        console.log(logMessage);
        this.logMessages.push(logMessage);
    }

    async run() {
        try {
            this.log('Starting analytics setup...');
            
            // Step 1: Create analytics tables
            await this.setupTables();
            
            // Step 2: Create indexes for performance
            await this.createIndexes();
            
            // Step 3: Set up default configurations
            await this.setupDefaultConfigurations();
            
            // Step 4: Populate initial analytics data
            await this.populateInitialData();
            
            // Step 5: Create analytics views (if supported)
            await this.createAnalyticsViews();
            
            this.log('Analytics setup completed successfully!');
            
            return {
                success: true,
                logs: this.logMessages
            };
        } catch (error) {
            this.log(`Analytics setup failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async setupTables() {
        this.log('Setting up analytics tables...');
        
        if (this.useSupabase) {
            await this.setupSupabaseTables();
        } else {
            await this.setupSQLiteTables();
        }
        
        this.log('Analytics tables created successfully');
    }

    async setupSupabaseTables() {
        const supabase = getSupabaseClient(true); // Use admin client
        
        // Read and execute the Supabase analytics schema
        const schemaPath = path.join(__dirname, '../../supabase-migration/schema/04_advanced_analytics.sql');
        const schema = await fs.readFile(schemaPath, 'utf8');
        
        // Split schema into individual statements and execute
        const statements = schema
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        for (const statement of statements) {
            try {
                if (statement.includes('CREATE') || statement.includes('ALTER') || statement.includes('INSERT')) {
                    // Use RPC to execute DDL statements
                    const { error } = await supabase.rpc('exec_sql', { sql_text: statement });
                    if (error) {
                        this.log(`Warning: ${error.message}`, 'warn');
                    }
                }
            } catch (error) {
                this.log(`Warning: Could not execute statement: ${error.message}`, 'warn');
            }
        }
    }

    async setupSQLiteTables() {
        const { sequelize } = require('../database/models');
        
        // Read and execute the SQLite analytics schema
        const schemaPath = path.join(__dirname, '../database/migrations/analytics_schema_sqlite.sql');
        const schema = await fs.readFile(schemaPath, 'utf8');
        
        // Execute schema using raw queries
        const statements = schema
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('PRAGMA'));
        
        for (const statement of statements) {
            try {
                if (statement.includes('CREATE') || statement.includes('ALTER') || statement.includes('INSERT')) {
                    await sequelize.query(statement);
                }
            } catch (error) {
                this.log(`Warning: Could not execute statement: ${error.message}`, 'warn');
            }
        }
    }

    async createIndexes() {
        this.log('Creating performance indexes...');
        
        const indexes = [
            // Job-related indexes for analytics queries
            'CREATE INDEX IF NOT EXISTS idx_jobs_analytics_dates ON jobs(shop_id, created_at, completion_date, status)',
            'CREATE INDEX IF NOT EXISTS idx_jobs_analytics_revenue ON jobs(shop_id, total_amount, status) WHERE total_amount > 0',
            'CREATE INDEX IF NOT EXISTS idx_jobs_analytics_technician ON jobs(assigned_to, status, efficiency) WHERE assigned_to IS NOT NULL',
            
            // Customer analytics indexes
            'CREATE INDEX IF NOT EXISTS idx_customers_analytics ON customers(shop_id, customer_type, created_at, is_active)',
            
            // Parts analytics indexes
            'CREATE INDEX IF NOT EXISTS idx_parts_analytics ON parts(shop_id, current_stock, minimum_stock, cost_price, selling_price)',
            'CREATE INDEX IF NOT EXISTS idx_job_parts_analytics ON job_parts(part_id, created_at, status, total_price, quantity_needed)',
        ];

        if (this.useSupabase) {
            const supabase = getSupabaseClient(true);
            for (const indexSQL of indexes) {
                try {
                    const { error } = await supabase.rpc('exec_sql', { sql_text: indexSQL });
                    if (error && !error.message.includes('already exists')) {
                        this.log(`Index creation warning: ${error.message}`, 'warn');
                    }
                } catch (error) {
                    this.log(`Index creation warning: ${error.message}`, 'warn');
                }
            }
        } else {
            const { sequelize } = require('../database/models');
            for (const indexSQL of indexes) {
                try {
                    await sequelize.query(indexSQL);
                } catch (error) {
                    if (!error.message.includes('already exists')) {
                        this.log(`Index creation warning: ${error.message}`, 'warn');
                    }
                }
            }
        }
        
        this.log('Performance indexes created');
    }

    async setupDefaultConfigurations() {
        this.log('Setting up default analytics configurations...');
        
        try {
            // Get all active shops
            const shops = await databaseService.query('shops', {
                where: { is_active: true },
                select: 'id, name'
            });
            
            this.log(`Found ${shops.length} active shops`);
            
            for (const shop of shops) {
                try {
                    // Check if configuration already exists
                    const existing = await databaseService.query('analytics_config', {
                        where: { shop_id: shop.id }
                    });
                    
                    if (existing.length === 0) {
                        // Create default configuration
                        const config = {
                            shop_id: shop.id,
                            auto_refresh_enabled: true,
                            refresh_frequency: 24, // hours
                            daily_metrics_retention_days: 730, // 2 years
                            job_analytics_retention_days: 1095, // 3 years
                            forecast_enabled: true,
                            forecast_horizon_months: 12,
                            revenue_alert_threshold: -10.00,
                            efficiency_alert_threshold: 80.00,
                            churn_risk_alert_threshold: 0.70,
                            allowed_exports: this.useSupabase ? ['csv', 'pdf', 'excel'] : 'csv,pdf,excel'
                        };
                        
                        await databaseService.insert('analytics_config', config);
                        this.log(`Created analytics configuration for shop: ${shop.name}`);
                    } else {
                        this.log(`Analytics configuration already exists for shop: ${shop.name}`);
                    }
                } catch (error) {
                    this.log(`Warning: Could not create configuration for shop ${shop.name}: ${error.message}`, 'warn');
                }
            }
        } catch (error) {
            this.log(`Warning: Could not setup default configurations: ${error.message}`, 'warn');
        }
    }

    async populateInitialData() {
        this.log('Populating initial analytics data...');
        
        try {
            // Get all active shops
            const shops = await databaseService.query('shops', {
                where: { is_active: true },
                select: 'id'
            });
            
            for (const shop of shops) {
                await this.populateShopAnalytics(shop.id);
            }
            
            this.log('Initial analytics data populated');
        } catch (error) {
            this.log(`Warning: Could not populate initial data: ${error.message}`, 'warn');
        }
    }

    async populateShopAnalytics(shopId) {
        try {
            // Generate daily metrics for the last 30 days
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - 30);
            
            for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
                await this.generateDailyMetrics(shopId, new Date(date));
            }
            
            // Generate customer analytics
            await this.generateCustomerAnalytics(shopId);
            
            this.log(`Populated analytics data for shop: ${shopId}`);
        } catch (error) {
            this.log(`Warning: Could not populate analytics for shop ${shopId}: ${error.message}`, 'warn');
        }
    }

    async generateDailyMetrics(shopId, targetDate) {
        try {
            const dateStr = targetDate.toISOString().split('T')[0];
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);
            
            // Check if metrics already exist for this date
            const existing = await databaseService.query('daily_metrics', {
                where: { shop_id: shopId, metric_date: dateStr }
            });
            
            if (existing.length > 0) {
                return; // Skip if already exists
            }
            
            // Get jobs data for the date
            const jobsCreated = await databaseService.query('jobs', {
                where: {
                    shop_id: shopId,
                    created_at: { gte: startOfDay, lte: endOfDay }
                }
            });
            
            const jobsCompleted = await databaseService.query('jobs', {
                where: {
                    shop_id: shopId,
                    status: 'delivered',
                    completion_date: { gte: startOfDay, lte: endOfDay }
                }
            });
            
            const jobsInProgress = await databaseService.query('jobs', {
                where: {
                    shop_id: shopId,
                    status: { in: ['body_structure', 'paint_prep', 'paint_booth', 'reassembly'] }
                }
            });
            
            // Calculate metrics
            const revenueTotal = jobsCompleted.reduce((sum, job) => sum + (parseFloat(job.total_amount) || 0), 0);
            const revenueLabor = jobsCompleted.reduce((sum, job) => sum + (parseFloat(job.labor_amount) || 0), 0);
            const revenueParts = jobsCompleted.reduce((sum, job) => sum + (parseFloat(job.parts_amount) || 0), 0);
            const avgCycleTime = jobsCompleted.length > 0 ? 
                jobsCompleted.reduce((sum, job) => sum + (job.cycle_time || 0), 0) / jobsCompleted.length : 0;
            
            // Get customer metrics
            const newCustomers = await databaseService.query('customers', {
                where: {
                    shop_id: shopId,
                    created_at: { gte: startOfDay, lte: endOfDay }
                }
            });
            
            // Create daily metrics record
            const metricsData = {
                shop_id: shopId,
                metric_date: dateStr,
                jobs_created: jobsCreated.length,
                jobs_completed: jobsCompleted.length,
                jobs_in_progress: jobsInProgress.length,
                revenue_total: revenueTotal,
                revenue_labor: revenueLabor,
                revenue_parts: revenueParts,
                avg_cycle_time: avgCycleTime,
                new_customers: newCustomers.length
            };
            
            await databaseService.insert('daily_metrics', metricsData);
        } catch (error) {
            // Log but don't throw - we want to continue with other dates
            this.log(`Could not generate daily metrics for ${targetDate.toDateString()}: ${error.message}`, 'warn');
        }
    }

    async generateCustomerAnalytics(shopId) {
        try {
            const customers = await databaseService.query('customers', {
                where: { shop_id: shopId, is_active: true }
            });
            
            for (const customer of customers) {
                const jobs = await databaseService.query('jobs', {
                    where: { customer_id: customer.id, shop_id: shopId }
                });
                
                const completedJobs = jobs.filter(j => j.status === 'delivered');
                const totalSpent = completedJobs.reduce((sum, j) => sum + (parseFloat(j.total_amount) || 0), 0);
                const avgJobValue = completedJobs.length > 0 ? totalSpent / completedJobs.length : 0;
                
                // Calculate days since last job
                const lastJobDate = jobs.length > 0 ? 
                    new Date(Math.max(...jobs.map(j => new Date(j.created_at)))) : null;
                const daysSinceLastJob = lastJobDate ? 
                    Math.floor((Date.now() - lastJobDate.getTime()) / (1000 * 60 * 60 * 24)) : 9999;
                
                // Simple churn risk calculation
                let churnRisk = 0;
                if (daysSinceLastJob > 365) churnRisk = 0.8;
                else if (daysSinceLastJob > 180) churnRisk = 0.5;
                else if (daysSinceLastJob > 90) churnRisk = 0.3;
                
                // Customer segmentation
                let segment = 'Regular';
                if (totalSpent > 10000 && daysSinceLastJob < 90) segment = 'VIP';
                else if (totalSpent > 5000 && daysSinceLastJob < 180) segment = 'High Value';
                else if (jobs.length > 3 && daysSinceLastJob < 365) segment = 'Loyal';
                else if (daysSinceLastJob > 365) segment = 'At Risk';
                else if (jobs.length === 0) segment = 'Prospect';
                
                // Calculate lifetime value (simplified)
                const lifetimeValue = avgJobValue * Math.max(1, jobs.length) * (daysSinceLastJob < 90 ? 3 : 2);
                
                const analyticsData = {
                    shop_id: shopId,
                    customer_id: customer.id,
                    total_jobs: jobs.length,
                    completed_jobs: completedJobs.length,
                    lifetime_value: lifetimeValue,
                    average_job_value: avgJobValue,
                    total_spent: totalSpent,
                    days_as_customer: daysSinceLastJob < 9999 ? daysSinceLastJob : 0,
                    churn_risk_score: churnRisk,
                    customer_segment: segment,
                    first_job_date: jobs.length > 0 ? new Date(Math.min(...jobs.map(j => new Date(j.created_at)))) : null,
                    last_job_date: lastJobDate
                };
                
                // Check if analytics already exist
                const existing = await databaseService.query('customer_analytics', {
                    where: { shop_id: shopId, customer_id: customer.id }
                });
                
                if (existing.length > 0) {
                    await databaseService.update('customer_analytics', analyticsData, { id: existing[0].id });
                } else {
                    await databaseService.insert('customer_analytics', analyticsData);
                }
            }
        } catch (error) {
            this.log(`Could not generate customer analytics: ${error.message}`, 'warn');
        }
    }

    async createAnalyticsViews() {
        this.log('Creating analytics views...');
        
        if (!this.useSupabase) {
            // For SQLite, the views are already created in the schema
            this.log('Analytics views created with schema');
            return;
        }
        
        // For Supabase, refresh materialized views if they exist
        try {
            const supabase = getSupabaseClient(true);
            
            const refreshCommands = [
                'REFRESH MATERIALIZED VIEW CONCURRENTLY revenue_trends',
                'REFRESH MATERIALIZED VIEW CONCURRENTLY customer_segments'
            ];
            
            for (const command of refreshCommands) {
                try {
                    const { error } = await supabase.rpc('exec_sql', { sql_text: command });
                    if (error && !error.message.includes('does not exist')) {
                        this.log(`View refresh warning: ${error.message}`, 'warn');
                    }
                } catch (error) {
                    this.log(`View refresh warning: ${error.message}`, 'warn');
                }
            }
            
            this.log('Analytics views refreshed');
        } catch (error) {
            this.log(`Warning: Could not refresh analytics views: ${error.message}`, 'warn');
        }
    }
}

// Main execution
async function main() {
    const setup = new AnalyticsSetup();
    
    try {
        const result = await setup.run();
        
        if (result.success) {
            console.log('\n✅ Analytics setup completed successfully!');
            console.log('\nNext steps:');
            console.log('1. Set up scheduled jobs to refresh analytics data');
            console.log('2. Configure analytics permissions for users');
            console.log('3. Test analytics endpoints');
            
            process.exit(0);
        }
    } catch (error) {
        console.error('\n❌ Analytics setup failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Export for use as module
module.exports = { AnalyticsSetup };

// Run if called directly
if (require.main === module) {
    main();
}