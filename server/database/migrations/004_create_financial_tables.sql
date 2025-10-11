-- Migration: Financial Integration Tables
-- Phase 2: Payment Processing, Expense Tracking, QuickBooks Integration
-- Created: 2025-10-10

-- ============================================================================
-- 1. PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL,
  repair_order_id UUID REFERENCES repair_orders(id) ON DELETE SET NULL,
  invoice_id UUID,

  -- Payment Details
  payment_number VARCHAR(50) UNIQUE NOT NULL,
  payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('cash', 'credit_card', 'debit_card', 'check', 'insurance', 'wire_transfer', 'ach')),
  payment_method VARCHAR(50), -- 'stripe', 'square', 'manual'
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),

  -- Amounts
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  processing_fee DECIMAL(10,2) DEFAULT 0 CHECK (processing_fee >= 0),
  net_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Payment Gateway Details
  gateway_transaction_id VARCHAR(255),
  gateway_reference VARCHAR(255),
  gateway_response JSONB,

  -- Check Details
  check_number VARCHAR(50),
  check_date DATE,
  bank_name VARCHAR(255),

  -- Credit Card Details (tokenized - PCI compliant)
  card_last_four VARCHAR(4),
  card_brand VARCHAR(50),
  card_token VARCHAR(255), -- Stripe token

  -- Insurance Payment Details
  insurance_company_id UUID,
  claim_number VARCHAR(100),
  eob_reference VARCHAR(100), -- Explanation of Benefits

  -- Metadata
  payment_date TIMESTAMP NOT NULL DEFAULT NOW(),
  applied_date TIMESTAMP,
  notes TEXT,
  receipt_url VARCHAR(500),
  receipt_generated_at TIMESTAMP,

  -- QuickBooks Integration
  qbo_payment_id VARCHAR(100),
  qbo_synced_at TIMESTAMP,

  -- Audit Trail
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_shop ON payments(shop_id);
CREATE INDEX IF NOT EXISTS idx_payments_ro ON payments(repair_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_txn ON payments(gateway_transaction_id);

COMMENT ON TABLE payments IS 'Payment transactions for collision repair invoices';
COMMENT ON COLUMN payments.payment_type IS 'Type of payment: cash, credit_card, check, insurance, etc.';
COMMENT ON COLUMN payments.payment_status IS 'Current status of payment processing';
COMMENT ON COLUMN payments.net_amount IS 'Amount after processing fees';

-- ============================================================================
-- 2. EXPENSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL,

  -- Expense Classification
  expense_type VARCHAR(50) NOT NULL CHECK (expense_type IN ('job_cost', 'operating', 'payroll', 'overhead', 'capital')),
  category VARCHAR(100) NOT NULL, -- 'sublet', 'materials', 'rent', 'utilities', 'insurance', 'supplies', etc.
  subcategory VARCHAR(100),

  -- Job-Related (if applicable)
  repair_order_id UUID REFERENCES repair_orders(id) ON DELETE SET NULL,
  is_billable BOOLEAN DEFAULT false,
  markup_percentage DECIMAL(5,2) DEFAULT 0,
  billed_amount DECIMAL(10,2),

  -- Expense Details
  expense_number VARCHAR(50) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Vendor Information
  vendor_id UUID,
  vendor_name VARCHAR(255),
  vendor_invoice_number VARCHAR(100),

  -- Payment Details
  payment_method VARCHAR(50), -- 'cash', 'credit_card', 'check', 'ach', 'wire'
  payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'partial', 'overdue', 'cancelled')),
  paid_amount DECIMAL(10,2) DEFAULT 0 CHECK (paid_amount >= 0),
  payment_reference VARCHAR(100),

  -- Dates
  expense_date DATE NOT NULL,
  due_date DATE,
  paid_date DATE,

  -- Approval Workflow
  approval_status VARCHAR(50) DEFAULT 'pending' CHECK (approval_status IN ('draft', 'pending', 'approved', 'rejected')),
  approved_by UUID,
  approved_at TIMESTAMP,
  rejection_reason TEXT,

  -- Accounting Integration
  qbo_expense_id VARCHAR(100),
  qbo_synced_at TIMESTAMP,
  account_code VARCHAR(50),
  account_name VARCHAR(255),

  -- Attachments
  receipt_url VARCHAR(500),
  attachments JSONB,

  -- Metadata
  notes TEXT,
  tags VARCHAR(255)[],

  -- Audit Trail
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for expenses
CREATE INDEX IF NOT EXISTS idx_expenses_shop ON expenses(shop_id);
CREATE INDEX IF NOT EXISTS idx_expenses_ro ON expenses(repair_order_id);
CREATE INDEX IF NOT EXISTS idx_expenses_vendor ON expenses(vendor_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(expense_type);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_status ON expenses(payment_status);
CREATE INDEX IF NOT EXISTS idx_expenses_approval ON expenses(approval_status);

COMMENT ON TABLE expenses IS 'Business expenses including job costs and operating expenses';
COMMENT ON COLUMN expenses.expense_type IS 'Classification: job_cost, operating, payroll, overhead, capital';
COMMENT ON COLUMN expenses.is_billable IS 'Whether this expense can be billed to customer';

-- ============================================================================
-- 3. INVOICES TABLE (Enhanced from existing)
-- ============================================================================
-- Check if invoices table exists, if not create it
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL,
  repair_order_id UUID REFERENCES repair_orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,

  -- Invoice Details
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_type VARCHAR(50) DEFAULT 'standard' CHECK (invoice_type IN ('standard', 'estimate', 'supplement', 'final', 'credit_memo')),
  invoice_status VARCHAR(50) DEFAULT 'draft' CHECK (invoice_status IN ('draft', 'pending', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled', 'void')),

  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  balance_due DECIMAL(10,2) NOT NULL,

  -- Breakdown
  labor_total DECIMAL(10,2) DEFAULT 0,
  parts_total DECIMAL(10,2) DEFAULT 0,
  sublet_total DECIMAL(10,2) DEFAULT 0,
  materials_total DECIMAL(10,2) DEFAULT 0,
  misc_total DECIMAL(10,2) DEFAULT 0,

  -- Insurance Details
  insurance_company_id UUID,
  claim_number VARCHAR(100),
  deductible_amount DECIMAL(10,2) DEFAULT 0,
  insurance_portion DECIMAL(10,2) DEFAULT 0,
  customer_portion DECIMAL(10,2),

  -- Dates
  invoice_date DATE NOT NULL,
  due_date DATE,
  paid_date DATE,
  sent_date DATE,

  -- Payment Terms
  payment_terms VARCHAR(50) DEFAULT 'net30' CHECK (payment_terms IN ('due_on_receipt', 'net15', 'net30', 'net45', 'net60', 'custom')),
  custom_terms_days INTEGER,

  -- Notes & Terms
  notes TEXT,
  customer_notes TEXT,
  terms_conditions TEXT,

  -- QuickBooks Integration
  qbo_invoice_id VARCHAR(100),
  qbo_sync_token VARCHAR(50),
  qbo_synced_at TIMESTAMP,
  qbo_last_error TEXT,

  -- Metadata
  pdf_url VARCHAR(500),
  pdf_generated_at TIMESTAMP,

  -- Audit Trail
  created_by UUID,
  sent_by UUID,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for invoices
CREATE INDEX IF NOT EXISTS idx_invoices_shop ON invoices(shop_id);
CREATE INDEX IF NOT EXISTS idx_invoices_ro ON invoices(repair_order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(invoice_status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_insurance ON invoices(insurance_company_id);

-- ============================================================================
-- 4. INVOICE LINE ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

  -- Line Item Details
  line_type VARCHAR(50) NOT NULL CHECK (line_type IN ('labor', 'part', 'sublet', 'material', 'misc', 'discount', 'tax')),
  description TEXT NOT NULL,

  -- Related Records
  part_id UUID,
  labor_operation_id UUID,
  expense_id UUID REFERENCES expenses(id),

  -- Quantities
  quantity DECIMAL(10,3) DEFAULT 1,
  unit_of_measure VARCHAR(20) DEFAULT 'ea',

  -- Pricing
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  line_total DECIMAL(10,2) NOT NULL,

  -- Tax
  is_taxable BOOLEAN DEFAULT true,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,

  -- Metadata
  sort_order INTEGER DEFAULT 0,
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_type ON invoice_line_items(line_type);

-- ============================================================================
-- 5. FINANCIAL TRANSACTIONS TABLE (Double-Entry Ledger)
-- ============================================================================
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL,

  -- Transaction Details
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('payment', 'expense', 'refund', 'adjustment', 'deposit', 'withdrawal')),
  transaction_date TIMESTAMP NOT NULL,

  -- Related Records
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  repair_order_id UUID REFERENCES repair_orders(id) ON DELETE SET NULL,

  -- Double-Entry Bookkeeping
  debit_account VARCHAR(100) NOT NULL,
  credit_account VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'USD',

  -- Description
  description TEXT NOT NULL,
  notes TEXT,
  reference_number VARCHAR(100),

  -- QuickBooks Sync
  qbo_transaction_id VARCHAR(100),
  qbo_synced_at TIMESTAMP,

  -- Audit Trail
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for financial transactions
CREATE INDEX IF NOT EXISTS idx_fin_trans_shop ON financial_transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_fin_trans_date ON financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_fin_trans_type ON financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_fin_trans_payment ON financial_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_fin_trans_expense ON financial_transactions(expense_id);
CREATE INDEX IF NOT EXISTS idx_fin_trans_debit ON financial_transactions(debit_account);
CREATE INDEX IF NOT EXISTS idx_fin_trans_credit ON financial_transactions(credit_account);

COMMENT ON TABLE financial_transactions IS 'Double-entry accounting transactions for all financial activity';

-- ============================================================================
-- 6. QUICKBOOKS SYNC LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS quickbooks_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL,

  -- Sync Details
  sync_type VARCHAR(50) NOT NULL CHECK (sync_type IN ('invoice', 'payment', 'expense', 'customer', 'vendor', 'account', 'tax_rate')),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  local_updated_at TIMESTAMP,

  -- QuickBooks Reference
  qbo_id VARCHAR(100),
  qbo_sync_token VARCHAR(50),
  qbo_updated_at TIMESTAMP,

  -- Sync Status
  sync_status VARCHAR(50) NOT NULL CHECK (sync_status IN ('pending', 'in_progress', 'success', 'failed', 'conflict', 'skipped')),
  sync_direction VARCHAR(20) NOT NULL CHECK (sync_direction IN ('to_qbo', 'from_qbo', 'bidirectional')),

  -- Error Handling
  error_code VARCHAR(50),
  error_message TEXT,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_retry_at TIMESTAMP,
  next_retry_at TIMESTAMP,

  -- Audit Trail
  synced_at TIMESTAMP DEFAULT NOW(),
  synced_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for QuickBooks sync log
CREATE INDEX IF NOT EXISTS idx_qbo_sync_shop ON quickbooks_sync_log(shop_id);
CREATE INDEX IF NOT EXISTS idx_qbo_sync_entity ON quickbooks_sync_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_qbo_sync_status ON quickbooks_sync_log(sync_status);
CREATE INDEX IF NOT EXISTS idx_qbo_sync_type ON quickbooks_sync_log(sync_type);
CREATE INDEX IF NOT EXISTS idx_qbo_sync_retry ON quickbooks_sync_log(next_retry_at) WHERE sync_status = 'failed' AND retry_count < max_retries;

COMMENT ON TABLE quickbooks_sync_log IS 'Tracks synchronization status with QuickBooks Online';

-- ============================================================================
-- 7. QUICKBOOKS CONNECTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS quickbooks_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL UNIQUE,

  -- OAuth Details
  realm_id VARCHAR(100) NOT NULL, -- QuickBooks Company ID
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP NOT NULL,
  refresh_token_expires_at TIMESTAMP NOT NULL,

  -- Company Information
  company_name VARCHAR(255),
  company_country VARCHAR(3),
  company_currency VARCHAR(3),

  -- Sync Configuration
  auto_sync_enabled BOOLEAN DEFAULT true,
  sync_frequency VARCHAR(20) DEFAULT 'realtime' CHECK (sync_frequency IN ('realtime', 'hourly', 'daily', 'manual')),
  last_full_sync_at TIMESTAMP,

  -- Account Mappings (JSONB for flexibility)
  account_mappings JSONB,

  -- Status
  connection_status VARCHAR(50) DEFAULT 'active' CHECK (connection_status IN ('active', 'disconnected', 'expired', 'error')),
  last_error TEXT,

  -- Audit Trail
  connected_at TIMESTAMP DEFAULT NOW(),
  connected_by UUID,
  disconnected_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qbo_conn_shop ON quickbooks_connections(shop_id);
CREATE INDEX IF NOT EXISTS idx_qbo_conn_status ON quickbooks_connections(connection_status);

COMMENT ON TABLE quickbooks_connections IS 'QuickBooks Online OAuth connections per shop';

-- ============================================================================
-- 8. PAYMENT METHODS TABLE (Saved Payment Methods)
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL,
  customer_id UUID NOT NULL,

  -- Payment Method Details
  method_type VARCHAR(50) NOT NULL CHECK (method_type IN ('credit_card', 'debit_card', 'bank_account')),
  is_default BOOLEAN DEFAULT false,

  -- Card Details (tokenized)
  card_token VARCHAR(255) NOT NULL, -- Stripe payment method ID
  card_last_four VARCHAR(4),
  card_brand VARCHAR(50),
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  card_holder_name VARCHAR(255),

  -- Bank Account Details (tokenized)
  bank_token VARCHAR(255),
  bank_name VARCHAR(255),
  account_last_four VARCHAR(4),
  account_type VARCHAR(20),
  routing_number_last_four VARCHAR(4),

  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'invalid', 'removed')),

  -- Metadata
  nickname VARCHAR(100),
  billing_address JSONB,

  -- Audit Trail
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_shop ON payment_methods(shop_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_customer ON payment_methods(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(customer_id, is_default) WHERE is_default = true;

COMMENT ON TABLE payment_methods IS 'Tokenized payment methods for recurring customers';

-- ============================================================================
-- 9. TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update invoice balance when payments are added/updated
CREATE OR REPLACE FUNCTION update_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE invoices
  SET
    paid_amount = COALESCE((
      SELECT SUM(amount)
      FROM payments
      WHERE invoice_id = NEW.invoice_id
        AND payment_status = 'completed'
    ), 0),
    balance_due = total_amount - COALESCE((
      SELECT SUM(amount)
      FROM payments
      WHERE invoice_id = NEW.invoice_id
        AND payment_status = 'completed'
    ), 0),
    invoice_status = CASE
      WHEN total_amount - COALESCE((
        SELECT SUM(amount)
        FROM payments
        WHERE invoice_id = NEW.invoice_id
          AND payment_status = 'completed'
      ), 0) <= 0 THEN 'paid'
      WHEN COALESCE((
        SELECT SUM(amount)
        FROM payments
        WHERE invoice_id = NEW.invoice_id
          AND payment_status = 'completed'
      ), 0) > 0 THEN 'partial'
      ELSE invoice_status
    END,
    paid_date = CASE
      WHEN total_amount - COALESCE((
        SELECT SUM(amount)
        FROM payments
        WHERE invoice_id = NEW.invoice_id
          AND payment_status = 'completed'
      ), 0) <= 0 THEN NOW()
      ELSE paid_date
    END,
    updated_at = NOW()
  WHERE id = NEW.invoice_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_balance
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  WHEN (NEW.invoice_id IS NOT NULL)
  EXECUTE FUNCTION update_invoice_balance();

-- Update expense paid amount
CREATE OR REPLACE FUNCTION update_expense_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.paid_amount >= NEW.total_amount THEN
    NEW.payment_status := 'paid';
    NEW.paid_date := NOW();
  ELSIF NEW.paid_amount > 0 THEN
    NEW.payment_status := 'partial';
  ELSE
    NEW.payment_status := 'unpaid';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_expense_status
  BEFORE INSERT OR UPDATE OF paid_amount ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_expense_payment_status();

-- Auto-generate payment/expense numbers
CREATE SEQUENCE IF NOT EXISTS payment_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS expense_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_payment_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_number IS NULL OR NEW.payment_number = '' THEN
    NEW.payment_number := 'PAY-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('payment_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_gen_payment_number
  BEFORE INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION generate_payment_number();

CREATE OR REPLACE FUNCTION generate_expense_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expense_number IS NULL OR NEW.expense_number = '' THEN
    NEW.expense_number := 'EXP-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('expense_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_gen_expense_number
  BEFORE INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION generate_expense_number();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration
DO $$
BEGIN
  RAISE NOTICE 'Financial tables migration completed successfully';
  RAISE NOTICE 'Created tables: payments, expenses, invoices (enhanced), invoice_line_items, financial_transactions, quickbooks_sync_log, quickbooks_connections, payment_methods';
  RAISE NOTICE 'Created triggers: update_invoice_balance, update_expense_payment_status, generate_payment_number, generate_expense_number';
END $$;
