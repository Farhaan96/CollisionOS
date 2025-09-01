/**
 * Enhanced Data Migration Script for Supabase
 * Includes comprehensive error handling, rollback capabilities, and performance optimization
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EnhancedDataMigrator {
  constructor() {
    this.configPath = path.join(__dirname, '..', 'supabase-config.json');
    this.exportPath = path.join(
      __dirname,
      '..',
      'data-export',
      'exported-data'
    );
    this.logFile = path.join(__dirname, '..', 'enhanced-migration-log.txt');
    this.backupPath = path.join(__dirname, '..', 'migration-backups');

    // Ensure backup directory exists
    if (!fs.existsSync(this.backupPath)) {
      fs.mkdirSync(this.backupPath, { recursive: true });
    }

    // Load configuration
    if (!fs.existsSync(this.configPath)) {
      throw new Error(
        'Supabase configuration not found. Please run setup script first.'
      );
    }

    const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));

    // Initialize Supabase clients
    this.supabase = createClient(config.supabaseUrl, config.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    this.config = config;
    this.migrationId = crypto.randomUUID();
    this.rollbackOperations = [];
    this.migrationState = {
      phase: 'initializing',
      startTime: new Date(),
      tablesCompleted: [],
      tablesFailures: [],
      recordsMigrated: 0,
      recordsFailed: 0,
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${this.migrationId}] ${type.toUpperCase()}: ${message}`;

    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  async createBackup() {
    this.log('Creating pre-migration backup...');

    const backupData = {};
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
      try {
        const { data, error } = await this.supabase.from(table).select('*');

        if (!error) {
          backupData[table] = data;
          this.log(`Backed up ${data?.length || 0} records from ${table}`);
        }
      } catch (error) {
        this.log(`Failed to backup ${table}: ${error.message}`, 'warning');
      }
    }

    const backupFile = path.join(
      this.backupPath,
      `backup-${this.migrationId}.json`
    );
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

    this.log(`Backup created: ${backupFile}`, 'success');
    return backupFile;
  }

  async validatePreMigration() {
    this.log('Running pre-migration validation...');

    // Check Supabase connection
    try {
      const { data, error } = await this.supabase
        .from('_realtime')
        .select('*')
        .limit(1);
      if (error && !error.message.includes('does not exist')) {
        throw new Error(`Supabase connection failed: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`Pre-migration validation failed: ${error.message}`);
    }

    // Check required tables exist
    const requiredTables = ['shops', 'users', 'customers', 'vehicles', 'jobs'];
    for (const table of requiredTables) {
      const { error } = await this.supabase.from(table).select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        throw new Error(`Required table ${table} not found: ${error.message}`);
      }
    }

    // Check data export exists
    if (!fs.existsSync(this.exportPath)) {
      throw new Error(
        'Export data directory not found. Please run data export first.'
      );
    }

    this.log('Pre-migration validation passed', 'success');
  }

  async migrateTableWithRetry(tableName, batchSize = 100, maxRetries = 3) {
    const dataFile = path.join(this.exportPath, `${tableName}.json`);

    if (!fs.existsSync(dataFile)) {
      this.log(`No data file found for ${tableName}, skipping...`, 'warning');
      return { success: 0, failed: 0 };
    }

    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    this.log(`Starting migration for ${tableName}: ${data.length} records`);

    let success = 0;
    let failed = 0;
    let retryCount = 0;

    while (retryCount <= maxRetries) {
      try {
        // Process data in batches with rate limiting
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);
          const batchNum = Math.floor(i / batchSize) + 1;
          const totalBatches = Math.ceil(data.length / batchSize);

          this.log(
            `Processing ${tableName} batch ${batchNum}/${totalBatches} (${batch.length} records), retry ${retryCount}`
          );

          try {
            // Special handling for different tables
            if (tableName === 'users') {
              await this.migrateUsersBatch(batch);
            } else {
              const { error } = await this.supabase
                .from(tableName)
                .upsert(batch, {
                  onConflict: 'id',
                  ignoreDuplicates: false,
                });

              if (error) throw error;
            }

            success += batch.length;
            this.migrationState.recordsMigrated += batch.length;

            // Rate limiting - small delay between batches
            if (batchNum < totalBatches) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          } catch (batchError) {
            this.log(
              `Batch ${batchNum} failed: ${batchError.message}`,
              'error'
            );

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
                this.migrationState.recordsMigrated++;
              } catch (recordError) {
                failed++;
                this.migrationState.recordsFailed++;
                this.log(
                  `Record ${record.id} failed: ${recordError.message}`,
                  'error'
                );
              }
            }
          }
        }

        // If we get here, migration succeeded
        break;
      } catch (tableError) {
        retryCount++;
        if (retryCount > maxRetries) {
          this.log(
            `Table ${tableName} migration failed after ${maxRetries} retries: ${tableError.message}`,
            'error'
          );
          failed += data.length;
          this.migrationState.recordsFailed += data.length;
          this.migrationState.tablesFailures.push(tableName);
          break;
        } else {
          this.log(
            `Retrying ${tableName} migration (attempt ${retryCount + 1}/${maxRetries + 1})`,
            'warning'
          );
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before retry
        }
      }
    }

    if (failed === 0) {
      this.migrationState.tablesCompleted.push(tableName);
    }

    this.log(
      `${tableName} migration completed: ${success} success, ${failed} failed`,
      'success'
    );
    return { success, failed };
  }

  async migrateUsersBatch(users) {
    // Enhanced user migration with auth integration
    for (const user of users) {
      await this.migrateUser(user);
    }
  }

  async migrateUser(user) {
    try {
      // Check if auth user already exists
      let authUser = null;
      try {
        const { data: existingUser } =
          await this.supabase.auth.admin.getUserById(user.id || user.user_id);
        authUser = existingUser?.user;
      } catch (error) {
        // User doesn't exist in auth, continue with creation
      }

      // Create auth user if it doesn't exist
      if (!authUser) {
        const email =
          user.email || `${user.username}@placeholder.collisionos.com`;
        const { data: authData, error: authError } =
          await this.supabase.auth.admin.createUser({
            user_id: user.id || user.user_id,
            email: email,
            password: this.generateSecurePassword(),
            email_confirm: true,
            user_metadata: {
              first_name: user.first_name,
              last_name: user.last_name,
              username: user.username,
              migrated: true,
            },
          });

        if (authError && !authError.message.includes('already exists')) {
          throw authError;
        }

        this.log(`Created auth user for ${user.username} (${email})`);
      }

      // Prepare user profile data
      const profileData = {
        ...user,
        id: user.id || user.user_id,
        user_id: user.id || user.user_id, // Ensure both fields are set
      };

      // Remove any conflicting fields
      delete profileData.password_hash; // Don't migrate old passwords

      // Insert/update user profile
      const { error: profileError } = await this.supabase
        .from('users')
        .upsert([profileData], { onConflict: 'user_id' });

      if (profileError) {
        throw profileError;
      }
    } catch (error) {
      this.log(
        `User ${user.username} migration failed: ${error.message}`,
        'error'
      );
      throw error;
    }
  }

  generateSecurePassword() {
    return (
      'CollisionOS-Migrated-' + crypto.randomBytes(8).toString('hex') + '!'
    );
  }

  async performRollback() {
    this.log('Starting rollback procedure...', 'warning');

    const backupFile = path.join(
      this.backupPath,
      `backup-${this.migrationId}.json`
    );

    if (!fs.existsSync(backupFile)) {
      throw new Error('Backup file not found - cannot perform rollback');
    }

    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

    // Clear migrated data and restore from backup
    for (const [tableName, tableData] of Object.entries(backupData)) {
      try {
        this.log(`Rolling back ${tableName}...`);

        // Delete all records (use with extreme caution)
        await this.supabase
          .from(tableName)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        // Restore from backup
        if (tableData.length > 0) {
          const { error } = await this.supabase
            .from(tableName)
            .insert(tableData);

          if (error) {
            this.log(
              `Failed to restore ${tableName}: ${error.message}`,
              'error'
            );
          } else {
            this.log(
              `Restored ${tableData.length} records to ${tableName}`,
              'success'
            );
          }
        }
      } catch (error) {
        this.log(`Rollback failed for ${tableName}: ${error.message}`, 'error');
      }
    }

    this.log('Rollback completed', 'warning');
  }

  async validateMigration() {
    this.log('Running post-migration validation...');

    const validation = {};
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
      try {
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
          validation[table] = { status: 'error', error: error.message };
        } else {
          const match = exportedCount === supabaseCount;
          validation[table] = {
            status: match ? 'success' : 'mismatch',
            exported: exportedCount,
            migrated: supabaseCount,
            match,
          };
        }
      } catch (error) {
        validation[table] = { status: 'error', error: error.message };
      }
    }

    return validation;
  }

  async testRealtimeConnections() {
    this.log('Testing real-time connections...');

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Real-time connection test timed out'));
      }, 10000);

      const channel = this.supabase
        .channel('migration-test')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'jobs' },
          payload => {
            clearTimeout(timeout);
            this.supabase.removeChannel(channel);
            this.log('Real-time connection test passed', 'success');
            resolve(true);
          }
        )
        .subscribe(status => {
          if (status === 'SUBSCRIBED') {
            // Trigger a test update
            setTimeout(() => {
              this.supabase
                .from('jobs')
                .select('id')
                .limit(1)
                .then(({ data }) => {
                  if (data && data.length > 0) {
                    this.supabase
                      .from('jobs')
                      .update({ updated_at: new Date().toISOString() })
                      .eq('id', data[0].id)
                      .then(() => {});
                  } else {
                    clearTimeout(timeout);
                    this.supabase.removeChannel(channel);
                    resolve(true); // No data to test with, but subscription works
                  }
                });
            }, 1000);
          } else if (status === 'CHANNEL_ERROR') {
            clearTimeout(timeout);
            reject(new Error('Real-time subscription failed'));
          }
        });
    });
  }

  async run(options = {}) {
    const {
      includeBackup = true,
      includeValidation = true,
      includeRealtimeTest = true,
      batchSize = 100,
    } = options;

    const startTime = Date.now();

    try {
      this.log('Starting enhanced data migration to Supabase...');
      this.migrationState.phase = 'validating';

      // Pre-migration validation
      await this.validatePreMigration();

      // Create backup if requested
      if (includeBackup) {
        this.migrationState.phase = 'backing_up';
        await this.createBackup();
      }

      // Migration phase
      this.migrationState.phase = 'migrating';
      this.log('Beginning data migration...');

      // Define migration order (respects foreign key dependencies)
      const migrationOrder = [
        'shops',
        'users',
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
          this.log(`Starting migration for ${tableName}...`);
          results[tableName] = await this.migrateTableWithRetry(
            tableName,
            batchSize
          );
        } catch (error) {
          this.log(`Failed to migrate ${tableName}: ${error.message}`, 'error');
          results[tableName] = {
            success: 0,
            failed: 'unknown',
            error: error.message,
          };
        }
      }

      // Validation phase
      if (includeValidation) {
        this.migrationState.phase = 'validating';
        const validation = await this.validateMigration();
        results.validation = validation;
      }

      // Real-time testing
      if (includeRealtimeTest) {
        this.migrationState.phase = 'testing_realtime';
        try {
          await this.testRealtimeConnections();
          results.realtimeTest = { status: 'passed' };
        } catch (error) {
          this.log(`Real-time test failed: ${error.message}`, 'warning');
          results.realtimeTest = { status: 'failed', error: error.message };
        }
      }

      // Complete migration
      this.migrationState.phase = 'completed';
      this.migrationState.endTime = new Date();

      const duration = (Date.now() - startTime) / 1000;
      const summary = {
        migrationId: this.migrationId,
        migrationDate: new Date().toISOString(),
        duration: duration,
        state: this.migrationState,
        results: results,
        totalRecords: this.migrationState.recordsMigrated,
        totalErrors: this.migrationState.recordsFailed,
        tablesCompleted: this.migrationState.tablesCompleted.length,
        tablesFailed: this.migrationState.tablesFailures.length,
      };

      // Save migration summary
      const summaryFile = path.join(
        __dirname,
        '..',
        `enhanced-migration-summary-${this.migrationId}.json`
      );
      fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

      this.log(
        `Enhanced migration completed in ${duration.toFixed(2)} seconds`,
        'success'
      );
      this.log(`Total records migrated: ${summary.totalRecords}`, 'success');
      this.log(`Summary saved: ${summaryFile}`, 'success');

      if (summary.totalErrors > 0) {
        this.log(`Total errors: ${summary.totalErrors}`, 'warning');
      }

      return summary;
    } catch (error) {
      this.migrationState.phase = 'failed';
      this.migrationState.endTime = new Date();

      this.log(`Enhanced migration failed: ${error.message}`, 'error');

      // Offer rollback option
      if (includeBackup) {
        this.log(
          'Backup is available. Use performRollback() method to restore previous state.',
          'warning'
        );
      }

      throw error;
    }
  }
}

// Export the class and provide CLI interface
if (require.main === module) {
  const migrator = new EnhancedDataMigrator();

  // Parse CLI arguments
  const args = process.argv.slice(2);
  const options = {
    includeBackup: !args.includes('--no-backup'),
    includeValidation: !args.includes('--no-validation'),
    includeRealtimeTest: !args.includes('--no-realtime-test'),
    batchSize:
      parseInt(
        args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1]
      ) || 100,
  };

  if (args.includes('--rollback')) {
    // Rollback mode
    const migrationId = args
      .find(arg => arg.startsWith('--migration-id='))
      ?.split('=')[1];
    if (!migrationId) {
      console.error(
        '❌ Migration ID required for rollback (--migration-id=<id>)'
      );
      process.exit(1);
    }

    migrator.migrationId = migrationId;
    migrator
      .performRollback()
      .then(() => {
        console.log('✅ Rollback completed');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Rollback failed:', error.message);
        process.exit(1);
      });
  } else {
    // Normal migration mode
    migrator
      .run(options)
      .then(summary => {
        console.log('\n🎉 Enhanced migration completed successfully!');
        console.log('📊 Summary:');
        console.log(`   Migration ID: ${summary.migrationId}`);
        console.log(`   Duration: ${summary.duration}s`);
        console.log(`   Records: ${summary.totalRecords}`);
        console.log(`   Tables completed: ${summary.tablesCompleted}`);

        if (summary.totalErrors > 0) {
          console.log(`   ⚠️ Errors: ${summary.totalErrors}`);
          process.exit(1);
        } else {
          process.exit(0);
        }
      })
      .catch(error => {
        console.error('\n❌ Enhanced migration failed:', error.message);
        console.error(
          '📋 Use --rollback --migration-id=<id> to restore if needed'
        );
        process.exit(1);
      });
  }
}

module.exports = EnhancedDataMigrator;
