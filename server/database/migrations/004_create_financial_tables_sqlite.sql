-- ============================================================================
-- Migration: Financial Integration Tables (SQLite)
-- Phase 2: Payment Processing, Expense Tracking, QuickBooks Integration
-- Created: 2025-10-10
-- Converted from PostgreSQL to SQLite
-- ============================================================================

-- ============================================================================
-- 1. PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  invoice_id TEXT,

  -- Payment Details
  payment_number TEXT UNIQUE NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('cash', 'credit_card', 'debit_card', 'check', 'insurance', 'wire_transfer', 'ach')),
  payment_method TEXT, -- 'stripe', 'square', 'manual'
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),

  -- Amounts
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  processing_fee NUMERIC(10,2) DEFAULT 0 CHECK (processing_fee >= 0),
  net_amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Payment Gateway Details
  gateway_transaction_id TEXT,
  gateway_reference TEXT,
  gateway_response TEXT, -- JSON string

  -- Check Details
  check_number TEXT,
  check_date TEXT,
  bank_name TEXT,

  -- Credit Card Details (tokenized - PCI compliant)
  card_last_four TEXT,
  card_brand TEXT,
  card_token TEXT, -- Stripe token

  -- Insurance Payment Details
  insurance_company_id TEXT,
  claim_number TEXT,
  eob_reference TEXT, -- Explanation of Benefits

  -- Metadata
  payment_date TEXT NOT NULL DEFAULT (datetime('now')),
  applied_date TEXT,
  notes TEXT,
  receipt_url TEXT,
  receipt_generated_at TEXT,

  -- QuickBooks Integration
  qbo_payment_id TEXT,
  qbo_synced_at TEXT,

  -- Audit Trail
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_shop ON payments(shop_id);
CREATE INDEX IF NOT EXISTS idx_payments_job ON payments(job_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_txn ON payments(gateway_transaction_id);

-- ============================================================================
-- 2. EXPENSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,

  -- Expense Classification
  expense_type TEXT NOT NULL CHECK (expense_type IN ('job_cost', 'operating', 'payroll', 'overhead', 'capital')),
  category TEXT NOT NULL, -- 'sublet', 'materials', 'rent', 'utilities', 'insurance', 'supplies', etc.
  subcategory TEXT,

  -- Job-Related (if applicable)
  job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  is_billable INTEGER DEFAULT 0,
  markup_percentage NUMERIC(5,2) DEFAULT 0,
  billed_amount NUMERIC(10,2),

  -- Expense Details
  expense_number TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  tax_amount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Vendor Information
  vendor_id TEXT,
  vendor_name TEXT,
  vendor_invoice_number TEXT,

  -- Payment Details
  payment_method TEXT, -- 'cash', 'credit_card', 'check', 'ach', 'wire'
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'partial', 'overdue', 'cancelled')),
  paid_amount NUMERIC(10,2) DEFAULT 0 CHECK (paid_amount >= 0),
  payment_reference TEXT,

  -- Dates
  expense_date TEXT NOT NULL,
  due_date TEXT,
  paid_date TEXT,

  -- Approval Workflow
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('draft', 'pending', 'approved', 'rejected')),
  approved_by TEXT,
  approved_at TEXT,
  rejection_reason TEXT,

  -- Accounting Integration
  qbo_expense_id TEXT,
  qbo_synced_at TEXT,
  account_code TEXT,
  account_name TEXT,

  -- Attachments
  receipt_url TEXT,
  attachments TEXT, -- JSON string

  -- Metadata
  notes TEXT,
  tags TEXT, -- JSON array string

  -- Audit Trail
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for expenses
CREATE INDEX IF NOT EXISTS idx_expenses_shop ON expenses(shop_id);
CREATE INDEX IF NOT EXISTS idx_expenses_job ON expenses(job_id);
CREATE INDEX IF NOT EXISTS idx_expenses_vendor ON expenses(vendor_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(expense_type);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_status ON expenses(payment_status);
CREATE INDEX IF NOT EXISTS idx_expenses_approval ON expenses(approval_status);

-- ============================================================================
-- 3. INVOICES TABLE (SKIPPED - Already exists with comprehensive schema)
-- ============================================================================
-- Note: The invoices table already exists in the database with a different schema
-- (uses job_id instead of repair_order_id). Skip recreation to preserve existing data.
-- The existing schema is more comprehensive and includes all required fields.

-- ============================================================================
-- 4. INVOICE LINE ITEMS TABLE
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
  expense_id TEXT REFERENCES expenses(id),

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
-- 5. FINANCIAL TRANSACTIONS TABLE (SKIPPED - Already exists)
-- ============================================================================
-- Note: The financial_transactions table already exists in the database
-- with a comprehensive schema. Skip recreation to preserve existing data.

-- ============================================================================
-- 6. QUICKBOOKS SYNC LOG TABLE
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
-- 7. QUICKBOOKS CONNECTIONS TABLE
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
-- 8. PAYMENT METHODS TABLE (Saved Payment Methods)
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
-- 9. TRIGGERS FOR AUTOMATIC UPDATES (SQLite Version)
-- ============================================================================

-- Trigger to update timestamps on payments
CREATE TRIGGER IF NOT EXISTS trigger_payments_updated_at
AFTER UPDATE ON payments
FOR EACH ROW
BEGIN
  UPDATE payments SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Trigger to update timestamps on expenses
CREATE TRIGGER IF NOT EXISTS trigger_expenses_updated_at
AFTER UPDATE ON expenses
FOR EACH ROW
BEGIN
  UPDATE expenses SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Trigger to update expense payment status when paid_amount changes
CREATE TRIGGER IF NOT EXISTS trigger_update_expense_status
BEFORE UPDATE OF paid_amount ON expenses
FOR EACH ROW
WHEN NEW.paid_amount != OLD.paid_amount
BEGIN
  UPDATE expenses SET
    payment_status = CASE
      WHEN NEW.paid_amount >= NEW.total_amount THEN 'paid'
      WHEN NEW.paid_amount > 0 THEN 'partial'
      ELSE 'unpaid'
    END,
    paid_date = CASE
      WHEN NEW.paid_amount >= NEW.total_amount THEN datetime('now')
      ELSE NULL
    END
  WHERE id = NEW.id;
END;

-- Triggers for invoices and invoice_line_items skipped (tables already exist with different schemas)

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
-- Note: Application layer should handle:
-- 1. UUID generation (using crypto.randomUUID() or similar)
-- 2. Auto-generation of payment_number and expense_number sequences
-- 3. Invoice balance calculations when payments are added/updated
-- 4. Complex business logic previously in PostgreSQL functions
-- ============================================================================
