-- ============================================================================
-- Migration: Financial Integration Tables - Phase 2 (SQLite)
-- Creates only missing tables (payments, expenses, invoices, financial_transactions already exist)
-- Created: 2025-10-10
-- ============================================================================

-- ============================================================================
-- 1. INVOICE LINE ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

  -- Line Item Details
  line_type TEXT NOT NULL CHECK (line_type IN ('labor', 'part', 'sublet', 'material', 'misc', 'discount', 'tax')),
  description TEXT NOT NULL,

  -- Related Records
  part_id TEXT,
  labor_operation_id TEXT,
  expense_id TEXT,

  -- Quantities
  quantity NUMERIC(10,3) DEFAULT 1,
  unit_of_measure TEXT DEFAULT 'ea',

  -- Pricing
  unit_price NUMERIC(10,2) NOT NULL,
  discount_percentage NUMERIC(5,2) DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  line_total NUMERIC(10,2) NOT NULL,

  -- Tax
  is_taxable INTEGER DEFAULT 1,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,

  -- Metadata
  sort_order INTEGER DEFAULT 0,
  notes TEXT,

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_type ON invoice_line_items(line_type);

-- ============================================================================
-- 2. QUICKBOOKS SYNC LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS quickbooks_sync_log (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,

  -- Sync Details
  sync_type TEXT NOT NULL CHECK (sync_type IN ('invoice', 'payment', 'expense', 'customer', 'vendor', 'account', 'tax_rate')),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  local_updated_at TEXT,

  -- QuickBooks Reference
  qbo_id TEXT,
  qbo_sync_token TEXT,
  qbo_updated_at TEXT,

  -- Sync Status
  sync_status TEXT NOT NULL CHECK (sync_status IN ('pending', 'in_progress', 'success', 'failed', 'conflict', 'skipped')),
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('to_qbo', 'from_qbo', 'bidirectional')),

  -- Error Handling
  error_code TEXT,
  error_message TEXT,
  error_details TEXT, -- JSON string
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_retry_at TEXT,
  next_retry_at TEXT,

  -- Audit Trail
  synced_at TEXT DEFAULT (datetime('now')),
  synced_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for QuickBooks sync log
CREATE INDEX IF NOT EXISTS idx_qbo_sync_shop ON quickbooks_sync_log(shop_id);
CREATE INDEX IF NOT EXISTS idx_qbo_sync_entity ON quickbooks_sync_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_qbo_sync_status ON quickbooks_sync_log(sync_status);
CREATE INDEX IF NOT EXISTS idx_qbo_sync_type ON quickbooks_sync_log(sync_type);
CREATE INDEX IF NOT EXISTS idx_qbo_sync_retry ON quickbooks_sync_log(next_retry_at, sync_status, retry_count);

-- ============================================================================
-- 3. QUICKBOOKS CONNECTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS quickbooks_connections (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL UNIQUE,

  -- OAuth Details
  realm_id TEXT NOT NULL, -- QuickBooks Company ID
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TEXT NOT NULL,
  refresh_token_expires_at TEXT NOT NULL,

  -- Company Information
  company_name TEXT,
  company_country TEXT,
  company_currency TEXT,

  -- Sync Configuration
  auto_sync_enabled INTEGER DEFAULT 1,
  sync_frequency TEXT DEFAULT 'realtime' CHECK (sync_frequency IN ('realtime', 'hourly', 'daily', 'manual')),
  last_full_sync_at TEXT,

  -- Account Mappings (JSON for flexibility)
  account_mappings TEXT, -- JSON string

  -- Status
  connection_status TEXT DEFAULT 'active' CHECK (connection_status IN ('active', 'disconnected', 'expired', 'error')),
  last_error TEXT,

  -- Audit Trail
  connected_at TEXT DEFAULT (datetime('now')),
  connected_by TEXT,
  disconnected_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_qbo_conn_shop ON quickbooks_connections(shop_id);
CREATE INDEX IF NOT EXISTS idx_qbo_conn_status ON quickbooks_connections(connection_status);

-- ============================================================================
-- 4. PAYMENT METHODS TABLE (Saved Payment Methods)
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,

  -- Payment Method Details
  method_type TEXT NOT NULL CHECK (method_type IN ('credit_card', 'debit_card', 'bank_account')),
  is_default INTEGER DEFAULT 0,

  -- Card Details (tokenized)
  card_token TEXT NOT NULL, -- Stripe payment method ID
  card_last_four TEXT,
  card_brand TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  card_holder_name TEXT,

  -- Bank Account Details (tokenized)
  bank_token TEXT,
  bank_name TEXT,
  account_last_four TEXT,
  account_type TEXT,
  routing_number_last_four TEXT,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'invalid', 'removed')),

  -- Metadata
  nickname TEXT,
  billing_address TEXT, -- JSON string

  -- Audit Trail
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  last_used_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_shop ON payment_methods(shop_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_customer ON payment_methods(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(customer_id, is_default) WHERE is_default = 1;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Trigger to update timestamps on quickbooks_connections
CREATE TRIGGER IF NOT EXISTS trigger_qbo_conn_updated_at
AFTER UPDATE ON quickbooks_connections
FOR EACH ROW
BEGIN
  UPDATE quickbooks_connections SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Trigger to update timestamps on payment_methods
CREATE TRIGGER IF NOT EXISTS trigger_payment_methods_updated_at
AFTER UPDATE ON payment_methods
FOR EACH ROW
BEGIN
  UPDATE payment_methods SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
SELECT 'Financial tables migration completed - 4 new tables created' as status;
