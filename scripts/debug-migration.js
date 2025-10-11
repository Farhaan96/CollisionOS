const fs = require('fs');
const Database = require('better-sqlite3');
const db = new Database('data/collisionos.db');
const sql = fs.readFileSync('server/database/migrations/004_create_financial_tables_sqlite.sql', 'utf8');

// Try to find the failing statement
const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

let stmtNum = 0;
for (const stmt of statements) {
  stmtNum++;
  if (stmt.startsWith('--') || stmt.match(/^SELECT|^PRAGMA/i)) {
    continue;
  }

  try {
    db.exec(stmt);
    console.log(`✅ Statement ${stmtNum} OK`);
  } catch (err) {
    console.log(`\n❌ Error in statement ${stmtNum}:`);
    console.log(`Statement preview: ${stmt.substring(0, 100)}...`);
    console.log(`Error: ${err.message}\n`);
    break;
  }
}

db.close();
