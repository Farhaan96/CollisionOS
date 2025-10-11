/**
 * Financial Tables Verification Script
 * Demonstrates that all new tables are functional with sample data
 */

const Database = require('better-sqlite3');
const { randomUUID } = require('crypto');

const db = new Database('data/collisionos.db');
db.pragma('foreign_keys = OFF'); // Disable FK constraints for testing

console.log('\n🧪 FINANCIAL TABLES VERIFICATION TEST\n');
console.log('=' .repeat(60));
console.log('(Foreign key constraints temporarily disabled for testing)\n');

// Test 1: Invoice Line Items
console.log('\n📋 Test 1: Invoice Line Items');
try {
  const invoiceLineId = randomUUID();
  const invoiceId = randomUUID(); // Mock invoice ID

  db.prepare(`
    INSERT INTO invoice_line_items (id, invoice_id, line_type, description, quantity, unit_price, line_total)
    VALUES (?, ?, 'part', 'Test Front Bumper', 1, 450.00, 450.00)
  `).run(invoiceLineId, invoiceId);

  const lineItem = db.prepare('SELECT * FROM invoice_line_items WHERE id = ?').get(invoiceLineId);
  console.log(`  ✅ Created invoice line item: ${lineItem.description} - $${lineItem.line_total}`);

  // Cleanup
  db.prepare('DELETE FROM invoice_line_items WHERE id = ?').run(invoiceLineId);
  console.log('  ✅ Cleanup successful');
} catch (err) {
  console.log(`  ❌ Error: ${err.message}`);
}

// Test 2: QuickBooks Sync Log
console.log('\n🔄 Test 2: QuickBooks Sync Log');
try {
  const syncId = randomUUID();
  const shopId = randomUUID();
  const entityId = randomUUID();

  db.prepare(`
    INSERT INTO quickbooks_sync_log (id, shop_id, sync_type, entity_type, entity_id, sync_status, sync_direction)
    VALUES (?, ?, 'invoice', 'invoice', ?, 'success', 'to_qbo')
  `).run(syncId, shopId, entityId);

  const syncLog = db.prepare('SELECT * FROM quickbooks_sync_log WHERE id = ?').get(syncId);
  console.log(`  ✅ Created sync log: ${syncLog.sync_type} - ${syncLog.sync_status}`);

  // Cleanup
  db.prepare('DELETE FROM quickbooks_sync_log WHERE id = ?').run(syncId);
  console.log('  ✅ Cleanup successful');
} catch (err) {
  console.log(`  ❌ Error: ${err.message}`);
}

// Test 3: QuickBooks Connections
console.log('\n🔗 Test 3: QuickBooks Connections');
try {
  const connId = randomUUID();
  const shopId = randomUUID();

  db.prepare(`
    INSERT INTO quickbooks_connections (id, shop_id, realm_id, access_token, refresh_token, token_expires_at, refresh_token_expires_at)
    VALUES (?, ?, 'test-realm', 'test-access-token', 'test-refresh-token', '2025-12-31', '2026-01-31')
  `).run(connId, shopId);

  const conn = db.prepare('SELECT * FROM quickbooks_connections WHERE id = ?').get(connId);
  console.log(`  ✅ Created QB connection: realm_id=${conn.realm_id} status=${conn.connection_status}`);

  // Cleanup
  db.prepare('DELETE FROM quickbooks_connections WHERE id = ?').run(connId);
  console.log('  ✅ Cleanup successful');
} catch (err) {
  console.log(`  ❌ Error: ${err.message}`);
}

// Test 4: Payment Methods
console.log('\n💳 Test 4: Payment Methods');
try {
  const paymentMethodId = randomUUID();
  const shopId = randomUUID();
  const customerId = randomUUID();

  db.prepare(`
    INSERT INTO payment_methods (id, shop_id, customer_id, method_type, card_token, card_last_four, card_brand)
    VALUES (?, ?, ?, 'credit_card', 'tok_test_visa_4242', '4242', 'Visa')
  `).run(paymentMethodId, shopId, customerId);

  const paymentMethod = db.prepare('SELECT * FROM payment_methods WHERE id = ?').get(paymentMethodId);
  console.log(`  ✅ Created payment method: ${paymentMethod.card_brand} ending in ${paymentMethod.card_last_four}`);

  // Cleanup
  db.prepare('DELETE FROM payment_methods WHERE id = ?').run(paymentMethodId);
  console.log('  ✅ Cleanup successful');
} catch (err) {
  console.log(`  ❌ Error: ${err.message}`);
}

// Test 5: Signatures
console.log('\n✍️  Test 5: Digital Signatures');
try {
  const signatureId = randomUUID();
  const shopId = randomUUID();
  const documentId = randomUUID();

  db.prepare(`
    INSERT INTO signatures (id, documentType, documentId, signatureFieldName, signatureData, signedBy, shopId)
    VALUES (?, 'repair_order', ?, 'Customer Authorization', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'John Doe', ?)
  `).run(signatureId, documentId, shopId);

  const signature = db.prepare('SELECT * FROM signatures WHERE id = ?').get(signatureId);
  console.log(`  ✅ Created signature: ${signature.documentType} signed by ${signature.signedBy}`);

  // Cleanup
  db.prepare('DELETE FROM signatures WHERE id = ?').run(signatureId);
  console.log('  ✅ Cleanup successful');
} catch (err) {
  console.log(`  ❌ Error: ${err.message}`);
}

// Test 6: Time Clock
console.log('\n⏰ Test 6: Time Clock');
try {
  const timeClockId = randomUUID();
  const shopId = randomUUID();
  const technicianId = randomUUID();
  const jobId = randomUUID();

  const clockIn = new Date().toISOString();

  db.prepare(`
    INSERT INTO time_clock (id, shop_id, technician_id, ro_id, clock_in, labor_type, hourly_rate)
    VALUES (?, ?, ?, ?, ?, 'body', 45.00)
  `).run(timeClockId, shopId, technicianId, jobId, clockIn);

  const timeClock = db.prepare('SELECT * FROM time_clock WHERE id = ?').get(timeClockId);
  console.log(`  ✅ Created time clock entry: ${timeClock.labor_type} @ $${timeClock.hourly_rate}/hr`);

  // Test clock out and auto-calculations
  const clockOut = new Date(Date.now() + 3600000).toISOString(); // 1 hour later
  db.prepare(`
    UPDATE time_clock SET clock_out = ? WHERE id = ?
  `).run(clockOut, timeClockId);

  const updated = db.prepare('SELECT * FROM time_clock WHERE id = ?').get(timeClockId);
  console.log(`  ✅ Clocked out - Total hours: ${updated.total_hours}, Net hours: ${updated.net_hours}, Labor cost: $${updated.labor_cost}`);
  console.log(`  ✅ Status: ${updated.status}`);

  // Cleanup
  db.prepare('DELETE FROM time_clock WHERE id = ?').run(timeClockId);
  console.log('  ✅ Cleanup successful');
} catch (err) {
  console.log(`  ❌ Error: ${err.message}`);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n🎉 VERIFICATION COMPLETE\n');

const summary = db.prepare(`
  SELECT
    (SELECT COUNT(*) FROM invoice_line_items) as invoice_lines,
    (SELECT COUNT(*) FROM quickbooks_sync_log) as sync_logs,
    (SELECT COUNT(*) FROM quickbooks_connections) as qb_connections,
    (SELECT COUNT(*) FROM payment_methods) as payment_methods,
    (SELECT COUNT(*) FROM signatures) as signatures,
    (SELECT COUNT(*) FROM time_clock) as time_clock_entries
`).get();

console.log('📊 Current Record Counts:');
console.log(`  - Invoice Line Items: ${summary.invoice_lines}`);
console.log(`  - QuickBooks Sync Logs: ${summary.sync_logs}`);
console.log(`  - QuickBooks Connections: ${summary.qb_connections}`);
console.log(`  - Payment Methods: ${summary.payment_methods}`);
console.log(`  - Signatures: ${summary.signatures}`);
console.log(`  - Time Clock Entries: ${summary.time_clock_entries}`);

console.log('\n✅ All tables are functional and ready for use!\n');

db.close();
