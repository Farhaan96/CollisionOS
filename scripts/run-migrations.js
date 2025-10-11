/**
 * SQLite Migration Runner Script
 * Executes SQLite migration files against the CollisionOS database
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', 'data', 'collisionos.db');
const MIGRATIONS_DIR = path.join(__dirname, '..', 'server', 'database', 'migrations');

// Migration files to execute (in order)
const MIGRATIONS = [
  '004_create_financial_tables_sqlite_v2.sql',
  '005_create_signatures_table_sqlite.sql',
  '006_create_timeclock_table_sqlite.sql'
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runMigrations() {
  log('\n=== SQLite Migration Runner ===\n', 'bold');

  // Check if database exists
  if (!fs.existsSync(DB_PATH)) {
    log(`❌ Database not found at: ${DB_PATH}`, 'red');
    process.exit(1);
  }

  log(`📊 Database: ${DB_PATH}`, 'cyan');

  // Open database connection
  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON'); // Enable foreign key constraints

  let totalTables = 0;
  let totalIndexes = 0;
  let totalTriggers = 0;
  const filesProcessed = [];

  try {
    // Execute each migration
    for (const migrationFile of MIGRATIONS) {
      const migrationPath = path.join(MIGRATIONS_DIR, migrationFile);

      if (!fs.existsSync(migrationPath)) {
        log(`⚠️  Migration file not found: ${migrationFile}`, 'yellow');
        continue;
      }

      log(`\n📄 Executing: ${migrationFile}`, 'cyan');

      // Read migration SQL
      const sql = fs.readFileSync(migrationPath, 'utf8');

      let tables = 0;
      let indexes = 0;
      let triggers = 0;

      // Execute entire SQL file at once (better-sqlite3 handles multiple statements)
      try {
        // Use db.exec() which handles multiple statements properly
        db.exec(sql);

        // Count created objects by parsing SQL
        const createTableMatches = sql.match(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(\w+)/gi) || [];
        const createIndexMatches = sql.match(/CREATE (?:UNIQUE )?INDEX(?:\s+IF NOT EXISTS)?/gi) || [];
        const createTriggerMatches = sql.match(/CREATE TRIGGER(?:\s+IF NOT EXISTS)?/gi) || [];

        tables = createTableMatches.length;
        indexes = createIndexMatches.length;
        triggers = createTriggerMatches.length;

        // Log table names
        createTableMatches.forEach(match => {
          const tableName = match.match(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(\w+)/i)?.[1];
          if (tableName) {
            log(`  ✓ Created table: ${tableName}`, 'green');
          }
        });

        if (indexes > 0) {
          log(`  ✓ Created ${indexes} indexes`, 'green');
        }
        if (triggers > 0) {
          log(`  ✓ Created ${triggers} triggers`, 'green');
        }

      } catch (err) {
        // Check if error is about object already existing
        if (err.message.includes('already exists')) {
          log(`  ℹ️  Some objects already exist (skipped)`, 'yellow');
        } else {
          log(`  ❌ Error: ${err.message}`, 'red');
          throw err;
        }
      }

      totalTables += tables;
      totalIndexes += indexes;
      totalTriggers += triggers;

      filesProcessed.push({
        file: migrationFile,
        tables,
        indexes,
        triggers,
        lineCount: sql.split('\n').length
      });

      log(`  ✅ Migration completed: ${tables} tables, ${indexes} indexes, ${triggers} triggers`, 'green');
    }

    // Verify tables created
    log('\n📋 Verifying database structure...', 'cyan');

    const allTables = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table'
      ORDER BY name
    `).all();

    log(`\n✅ Total tables in database: ${allTables.length}`, 'green');

    // Count financial tables
    const financialTables = [
      'payments', 'expenses', 'invoices', 'invoice_line_items',
      'financial_transactions', 'quickbooks_sync_log',
      'quickbooks_connections', 'payment_methods',
      'signatures', 'time_clock'
    ];

    const createdTables = allTables
      .filter(t => financialTables.includes(t.name))
      .map(t => t.name);

    log('\n📊 Financial system tables:', 'cyan');
    createdTables.forEach(name => {
      log(`  ✓ ${name}`, 'green');
    });

    // Summary report
    log('\n' + '='.repeat(60), 'bold');
    log('MIGRATION SUMMARY', 'bold');
    log('='.repeat(60), 'bold');

    filesProcessed.forEach(file => {
      log(`\n📄 ${file.file}`, 'cyan');
      log(`  - Lines: ${file.lineCount}`, 'reset');
      log(`  - Tables: ${file.tables}`, 'green');
      log(`  - Indexes: ${file.indexes}`, 'green');
      log(`  - Triggers: ${file.triggers}`, 'green');
    });

    log('\n' + '='.repeat(60), 'bold');
    log(`✅ TOTAL: ${totalTables} tables, ${totalIndexes} indexes, ${totalTriggers} triggers`, 'green');
    log('='.repeat(60) + '\n', 'bold');

  } catch (error) {
    log(`\n❌ Migration failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run migrations
runMigrations();
