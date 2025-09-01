/**
 * Data Migration Script for Supabase
 * Migrates existing data from current database to Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const DataExporter = require('../data-export/export-script');

class DataMigrator {
  constructor() {
    this.configPath = path.join(__dirname, '..', 'supabase-config.json');
    this.exportPath = path.join(
      __dirname,
      '..',
      'data-export',
      'exported-data'
    );
    this.logFile = path.join(__dirname, '..', 'migration-log.txt');

    // Load Supabase configuration
    if (!fs.existsSync(this.configPath)) {
      throw new Error(
        'Supabase configuration not found. Please run setup script first.'
      );
    }

    const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));

    // Initialize Supabase client with service role key for admin operations
    this.supabase = createClient(config.supabaseUrl, config.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.config = config;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;

    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  async validateSupabaseConnection() {
    try {
      this.log('Validating Supabase connection...');

      const { data, error } = await this.supabase
        .from('shops')
        .select('count')
        .limit(1);

      if (error) {
        throw new Error(`Connection failed: ${error.message}`);
      }

      this.log('Supabase connection validated successfully', 'success');
      return true;
    } catch (error) {
      this.log(
        `Supabase connection validation failed: ${error.message}`,
        'error'
      );
      return false;
    }
  }

  async exportExistingData() {
    try {
      this.log('Starting data export from existing database...');

      const exporter = new DataExporter();
      const summary = await exporter.exportAllData();

      this.log(
        `Data export completed: ${summary.totalRecords} records from ${summary.totalTables} tables`,
        'success'
      );
      return summary;
    } catch (error) {
      this.log(`Data export failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async disableRLS() {
    try {
      this.log('Temporarily disabling Row Level Security...');

      const tables = [
        'shops',
        'users',
        'customers',
        'vehicles',
        'parts',
        'vendors',
        'jobs',
        'job_parts',
        'job_labor',
        'job_updates',
        'estimates',
        'notifications',
      ];

      for (const table of tables) {
        await this.supabase.rpc('exec_sql', {
          sql: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`,
        });
      }

      this.log('RLS disabled for migration', 'success');
    } catch (error) {
      this.log(`Failed to disable RLS: ${error.message}`, 'warning');
      // Continue anyway as this might not be critical
    }
  }

  async enableRLS() {
    try {
      this.log('Re-enabling Row Level Security...');

      const tables = [
        'shops',
        'users',
        'customers',
        'vehicles',
        'parts',
        'vendors',
        'jobs',
        'job_parts',
        'job_labor',
        'job_updates',
        'estimates',
        'notifications',
      ];

      for (const table of tables) {
        await this.supabase.rpc('exec_sql', {
          sql: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`,
        });
      }

      this.log('RLS re-enabled', 'success');
    } catch (error) {
      this.log(`Failed to re-enable RLS: ${error.message}`, 'error');
      throw error;
    }
  }

  async migrateTable(tableName, batchSize = 100) {
    try {
      const dataFile = path.join(this.exportPath, `${tableName}.json`);

      if (!fs.existsSync(dataFile)) {
        this.log(`No data file found for ${tableName}, skipping...`, 'warning');
        return { success: 0, failed: 0 };
      }

      const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      this.log(`Starting migration for ${tableName}: ${data.length} records`);

      let success = 0;
      let failed = 0;

      // Process data in batches
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(data.length / batchSize);

        this.log(
          `Processing ${tableName} batch ${batchNum}/${totalBatches} (${batch.length} records)`
        );

        try {
          // Special handling for users table (needs to sync with auth.users)
          if (tableName === 'users') {
            await this.migrateUsers(batch);
          } else {
            const { error } = await this.supabase
              .from(tableName)
              .upsert(batch, { onConflict: 'id' });

            if (error) {
              throw error;
            }
          }

          success += batch.length;
          this.log(`Batch ${batchNum} completed successfully`);

          // Small delay to avoid overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          failed += batch.length;
          this.log(`Batch ${batchNum} failed: ${error.message}`, 'error');

          // Try individual records in failed batch
          for (const record of batch) {
            try {
              if (tableName === 'users') {
                await this.migrateUser(record);
              } else {
                const { error: recordError } = await this.supabase
                  .from(tableName)
                  .upsert([record], { onConflict: 'id' });

                if (recordError) throw recordError;
              }

              success++;
              failed--;
            } catch (recordError) {
              this.log(
                `Record ${record.id} failed: ${recordError.message}`,
                'error'
              );
            }
          }
        }
      }

      this.log(
        `${tableName} migration completed: ${success} success, ${failed} failed`,
        'success'
      );
      return { success, failed };
    } catch (error) {
      this.log(
        `Table migration failed for ${tableName}: ${error.message}`,
        'error'
      );
      throw error;
    }
  }

  async migrateUsers(users) {
    // Users need special handling because they integrate with Supabase Auth
    for (const user of users) {
      await this.migrateUser(user);
    }
  }

  async migrateUser(user) {
    try {
      // First, create the auth user if it doesn't exist
      const { data: authUser, error: authError } =
        await this.supabase.auth.admin.createUser({
          user_id: user.user_id,
          email: user.email || `${user.username}@placeholder.com`,
          password: 'temporary-password-' + Math.random().toString(36),
          email_confirm: true,
          user_metadata: {
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
          },
        });

      if (authError && !authError.message.includes('already exists')) {
        throw authError;
      }

      // Then insert/update the user profile
      const { error: profileError } = await this.supabase
        .from('users')
        .upsert([user], { onConflict: 'user_id' });

      if (profileError) {
        throw profileError;
      }
    } catch (error) {
      // Log but don't fail the entire migration for individual user errors
      this.log(
        `User ${user.user_id} (${user.username}) migration failed: ${error.message}`,
        'warning'
      );
      throw error;
    }
  }

  async validateMigration() {
    try {
      this.log('Validating migrated data...');

      const validation = {};

      // Check record counts for each table
      const tables = [
        'shops',
        'users',
        'customers',
        'vehicles',
        'parts',
        'vendors',
        'jobs',
      ];

      for (const table of tables) {
        // Get count from exported data
        const dataFile = path.join(this.exportPath, `${table}.json`);
        let exportedCount = 0;

        if (fs.existsSync(dataFile)) {
          const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
          exportedCount = data.length;
        }

        // Get count from Supabase
        const { count: supabaseCount, error } = await this.supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          this.log(`Failed to count ${table}: ${error.message}`, 'error');
          validation[table] = { status: 'error', error: error.message };
        } else {
          const match = exportedCount === supabaseCount;
          validation[table] = {
            status: match ? 'success' : 'mismatch',
            exported: exportedCount,
            migrated: supabaseCount,
            match,
          };

          if (match) {
            this.log(`${table}: ✓ ${supabaseCount} records`, 'success');
          } else {
            this.log(
              `${table}: ⚠ Expected ${exportedCount}, got ${supabaseCount}`,
              'warning'
            );
          }
        }
      }

      return validation;
    } catch (error) {
      this.log(`Validation failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async setupDefaultShopUser() {
    try {
      this.log('Setting up default administrative user...');

      // Get the first shop
      const { data: shops, error: shopsError } = await this.supabase
        .from('shops')
        .select('*')
        .limit(1);

      if (shopsError || !shops || shops.length === 0) {
        throw new Error('No shops found for admin user setup');
      }

      const shop = shops[0];

      // Check if there's already an owner
      const { data: owners, error: ownersError } = await this.supabase
        .from('users')
        .select('*')
        .eq('shop_id', shop.id)
        .eq('role', 'owner');

      if (ownersError) {
        throw ownersError;
      }

      if (owners && owners.length > 0) {
        this.log('Owner user already exists, skipping setup', 'info');
        return;
      }

      // Create admin user
      const adminEmail = 'admin@collisionos.com';
      const adminPassword = 'admin123!'; // Should be changed after first login

      const { data: adminUser, error: adminError } =
        await this.supabase.auth.admin.createUser({
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
          user_metadata: {
            first_name: 'System',
            last_name: 'Administrator',
          },
        });

      if (adminError) {
        throw adminError;
      }

      // Create user profile
      const { error: profileError } = await this.supabase.from('users').insert([
        {
          user_id: adminUser.user.id,
          shop_id: shop.id,
          username: 'admin',
          first_name: 'System',
          last_name: 'Administrator',
          role: 'owner',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (profileError) {
        throw profileError;
      }

      this.log(
        `Default admin user created: ${adminEmail} / ${adminPassword}`,
        'success'
      );
      this.log(
        'IMPORTANT: Change the admin password after first login!',
        'warning'
      );
    } catch (error) {
      this.log(`Failed to setup admin user: ${error.message}`, 'error');
      throw error;
    }
  }

  async createMigrationSummary(results) {
    const summary = {
      migrationDate: new Date().toISOString(),
      supabaseProject: this.config.projectRef,
      results: results,
      totalRecords: Object.values(results).reduce(
        (sum, r) => sum + (r.success || 0),
        0
      ),
      totalErrors: Object.values(results).reduce(
        (sum, r) => sum + (r.failed || 0),
        0
      ),
      tablesProcessed: Object.keys(results).length,
    };

    const summaryFile = path.join(__dirname, '..', 'migration-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

    this.log('Migration summary saved to migration-summary.json', 'success');
    return summary;
  }

  async run() {
    const startTime = Date.now();

    try {
      this.log('Starting data migration to Supabase...');

      // Validate connection
      if (!(await this.validateSupabaseConnection())) {
        throw new Error('Supabase connection validation failed');
      }

      // Export existing data
      await this.exportExistingData();

      // Disable RLS for migration
      await this.disableRLS();

      // Migrate tables in dependency order
      const migrationOrder = [
        'shops',
        'users', // Special handling needed
        'customers',
        'vehicles',
        'vendors',
        'parts',
        'jobs',
        'job_parts',
        'job_labor',
        'estimates',
        'notifications',
      ];

      const results = {};

      for (const tableName of migrationOrder) {
        try {
          results[tableName] = await this.migrateTable(tableName);
        } catch (error) {
          this.log(`Failed to migrate ${tableName}: ${error.message}`, 'error');
          results[tableName] = {
            success: 0,
            failed: 'unknown',
            error: error.message,
          };
        }
      }

      // Re-enable RLS
      await this.enableRLS();

      // Validate migration
      const validation = await this.validateMigration();

      // Setup admin user if needed
      await this.setupDefaultShopUser();

      // Create summary
      const summary = await this.createMigrationSummary(results);

      const duration = (Date.now() - startTime) / 1000;

      this.log(
        `Migration completed in ${duration.toFixed(2)} seconds`,
        'success'
      );
      this.log(`Total records migrated: ${summary.totalRecords}`, 'success');

      if (summary.totalErrors > 0) {
        this.log(`Total errors: ${summary.totalErrors}`, 'warning');
      }

      this.log('Next steps:', 'info');
      this.log('1. Test the application with Supabase', 'info');
      this.log('2. Verify all data and functionality', 'info');
      this.log('3. Update application configuration', 'info');
      this.log('4. Plan production cutover', 'info');

      return summary;
    } catch (error) {
      this.log(`Migration failed: ${error.message}`, 'error');

      // Try to re-enable RLS even if migration failed
      try {
        await this.enableRLS();
      } catch (rlsError) {
        this.log(`Failed to re-enable RLS: ${rlsError.message}`, 'error');
      }

      throw error;
    }
  }
}

// Run migration if script is executed directly
if (require.main === module) {
  const migrator = new DataMigrator();

  migrator
    .run()
    .then(summary => {
      console.log('\n✅ Migration completed successfully!');
      console.log('📊 Summary:', summary);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Migration failed:', error.message);
      process.exit(1);
    });
}

module.exports = DataMigrator;
