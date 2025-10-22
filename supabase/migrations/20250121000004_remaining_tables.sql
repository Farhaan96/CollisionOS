-- =====================================================================
-- CollisionOS Supabase Migration - Remaining Tables
-- Generated: 2025-01-21
-- Description: Jobs, labor, financial, production, and supporting tables
-- =====================================================================

-- =====================================================================
-- JOBS TABLE (Legacy compatibility)
-- =====================================================================
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,

  -- Job identification
  job_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Job status
  status VARCHAR(50) DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'on_hold', 'completed', 'cancelled')),
  priority VARCHAR(20) DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- Assignment
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Dates
  start_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_shop_id ON jobs(shop_id);
CREATE INDEX idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX idx_jobs_vehicle_id ON jobs(vehicle_id);
CREATE INDEX idx_jobs_status ON jobs(status);

-- =====================================================================
-- PRODUCTION STAGES TABLE
-- =====================================================================
CREATE TABLE production_stages (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,

  -- Stage details
  stage_name VARCHAR(100) NOT NULL,
  stage_code VARCHAR(20) UNIQUE NOT NULL,
  stage_order INTEGER NOT NULL,

  -- Stage settings
  is_active BOOLEAN DEFAULT true,
  requires_technician BOOLEAN DEFAULT true,
  requires_bay BOOLEAN DEFAULT false,
  requires_equipment JSONB DEFAULT '[]',

  -- Estimated duration
  estimated_hours DECIMAL(8, 2),
  color_code VARCHAR(10),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_production_stages_shop_id ON production_stages(shop_id);

-- =====================================================================
-- PRODUCTION WORKFLOW TABLE
-- =====================================================================
CREATE TABLE production_workflow (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  repair_order_id INTEGER NOT NULL REFERENCES repair_order_management(id) ON DELETE CASCADE,
  production_stage_id INTEGER REFERENCES production_stages(id) ON DELETE SET NULL,

  -- Workflow details
  stage_name VARCHAR(100) NOT NULL,
  stage_status VARCHAR(50) DEFAULT 'pending'
    CHECK (stage_status IN ('pending', 'in_progress', 'on_hold', 'completed', 'skipped', 'failed')),
  sequence_order INTEGER NOT NULL,

  -- Assignment
  assigned_technician INTEGER REFERENCES users(id) ON DELETE SET NULL,
  backup_technician INTEGER REFERENCES users(id) ON DELETE SET NULL,
  qc_inspector INTEGER REFERENCES users(id) ON DELETE SET NULL,

  -- Time tracking
  scheduled_start_date TIMESTAMPTZ,
  scheduled_end_date TIMESTAMPTZ,
  actual_start_date TIMESTAMPTZ,
  actual_end_date TIMESTAMPTZ,
  hours_estimated DECIMAL(8, 2) DEFAULT 0.00,
  hours_actual DECIMAL(8, 2) DEFAULT 0.00,

  -- Quality control
  qc_required BOOLEAN DEFAULT false,
  qc_completed BOOLEAN DEFAULT false,
  qc_passed BOOLEAN DEFAULT false,
  qc_notes TEXT,

  -- Notes
  notes TEXT,
  issues TEXT,

  -- Rework tracking
  is_rework BOOLEAN DEFAULT false,
  original_work_order_id INTEGER REFERENCES production_workflow(id) ON DELETE SET NULL,
  rework_reason TEXT,

  -- Audit
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  completed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_production_workflow_shop_id ON production_workflow(shop_id);
CREATE INDEX idx_production_workflow_repair_order_id ON production_workflow(repair_order_id);
CREATE INDEX idx_production_workflow_stage_status ON production_workflow(stage_status);

-- =====================================================================
-- LABOR TIME ENTRIES TABLE
-- =====================================================================
CREATE TABLE labor_time_entries (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  estimate_line_item_id INTEGER REFERENCES estimate_line_items(id) ON DELETE SET NULL,
  technician_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Time entry details
  operation VARCHAR(100),
  description TEXT,
  entry_type VARCHAR(50) DEFAULT 'regular'
    CHECK (entry_type IN ('regular', 'overtime', 'rework', 'warranty', 'goodwill')),

  -- Time tracking
  clock_in_time TIMESTAMPTZ NOT NULL,
  clock_out_time TIMESTAMPTZ,
  hours_worked DECIMAL(8, 2),
  hours_billed DECIMAL(8, 2),

  -- Rates
  labor_rate DECIMAL(10, 2),
  overtime_rate DECIMAL(10, 2),

  -- Status
  status VARCHAR(50) DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'invoiced')),

  -- Rework tracking
  is_rework BOOLEAN DEFAULT false,
  original_time_entry_id INTEGER REFERENCES labor_time_entries(id) ON DELETE SET NULL,

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_labor_time_entries_shop_id ON labor_time_entries(shop_id);
CREATE INDEX idx_labor_time_entries_job_id ON labor_time_entries(job_id);
CREATE INDEX idx_labor_time_entries_technician_id ON labor_time_entries(technician_id);

-- =====================================================================
-- TIME CLOCK TABLE (Technician clock in/out)
-- =====================================================================
CREATE TABLE time_clocks (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ro_id UUID REFERENCES jobs(id) ON DELETE SET NULL,

  -- Clock times
  clock_in_time TIMESTAMPTZ NOT NULL,
  clock_out_time TIMESTAMPTZ,
  total_hours DECIMAL(8, 2),

  -- Entry type
  entry_type VARCHAR(50) DEFAULT 'regular'
    CHECK (entry_type IN ('regular', 'overtime', 'break', 'lunch', 'meeting', 'training')),

  -- Status
  status VARCHAR(50) DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'approved', 'disputed')),

  -- Notes
  notes TEXT,

  -- Audit
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_time_clocks_shop_id ON time_clocks(shop_id);
CREATE INDEX idx_time_clocks_technician_id ON time_clocks(technician_id);
CREATE INDEX idx_time_clocks_clock_in_time ON time_clocks(clock_in_time);

-- =====================================================================
-- INVOICES TABLE (Legacy)
-- =====================================================================
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  insurance_company_id INTEGER REFERENCES insurance_companies(id) ON DELETE SET NULL,

  -- Invoice identification
  invoice_number VARCHAR(50) UNIQUE NOT NULL,

  -- Invoice details
  invoice_date DATE NOT NULL,
  due_date DATE,
  paid_date DATE,

  -- Financial
  subtotal DECIMAL(12, 2) DEFAULT 0.00,
  tax_amount DECIMAL(10, 2) DEFAULT 0.00,
  total_amount DECIMAL(12, 2) DEFAULT 0.00,
  paid_amount DECIMAL(12, 2) DEFAULT 0.00,
  balance_due DECIMAL(12, 2) DEFAULT 0.00,

  -- Status
  status VARCHAR(50) DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled')),

  -- Notes
  notes TEXT,

  -- Revision tracking
  original_invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,

  -- Audit
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_shop_id ON invoices(shop_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);

-- =====================================================================
-- INVOICES ENHANCED TABLE (Phase 2)
-- =====================================================================
CREATE TABLE invoices_enhanced (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  repair_order_id INTEGER REFERENCES repair_order_management(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  insurance_company_id INTEGER REFERENCES insurance_companies(id) ON DELETE SET NULL,

  -- Invoice details
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  terms VARCHAR(50),

  -- Financial breakdown
  parts_total DECIMAL(12, 2) DEFAULT 0.00,
  labor_total DECIMAL(12, 2) DEFAULT 0.00,
  materials_total DECIMAL(12, 2) DEFAULT 0.00,
  sublet_total DECIMAL(12, 2) DEFAULT 0.00,
  fees_total DECIMAL(12, 2) DEFAULT 0.00,
  subtotal DECIMAL(12, 2) DEFAULT 0.00,
  tax_amount DECIMAL(10, 2) DEFAULT 0.00,
  total_amount DECIMAL(12, 2) DEFAULT 0.00,

  -- Payment tracking
  paid_amount DECIMAL(12, 2) DEFAULT 0.00,
  balance_due DECIMAL(12, 2) DEFAULT 0.00,

  -- Status
  status VARCHAR(50) DEFAULT 'draft',

  -- Notes
  notes TEXT,

  -- Audit
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_enhanced_shop_id ON invoices_enhanced(shop_id);
CREATE INDEX idx_invoices_enhanced_repair_order_id ON invoices_enhanced(repair_order_id);

-- =====================================================================
-- PAYMENTS TABLE
-- =====================================================================
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  repair_order_id INTEGER REFERENCES repair_order_management(id) ON DELETE CASCADE,
  invoice_id INTEGER REFERENCES invoices_enhanced(id) ON DELETE SET NULL,

  -- Payment details
  payment_number VARCHAR(50) UNIQUE,
  payment_date DATE NOT NULL,
  payment_amount DECIMAL(12, 2) NOT NULL,

  -- Payment method
  payment_method VARCHAR(50) NOT NULL
    CHECK (payment_method IN ('cash', 'check', 'credit_card', 'debit_card', 'etransfer',
                              'insurance_direct', 'financing', 'other')),

  -- Payment details
  reference_number VARCHAR(100),
  transaction_id VARCHAR(100),
  check_number VARCHAR(50),
  card_last_four VARCHAR(4),

  -- Payment breakdown
  deductible_amount DECIMAL(10, 2) DEFAULT 0.00,
  insurance_payment DECIMAL(10, 2) DEFAULT 0.00,
  customer_payment DECIMAL(10, 2) DEFAULT 0.00,

  -- Status
  payment_status VARCHAR(50) DEFAULT 'completed'
    CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'disputed')),

  -- Notes
  notes TEXT,

  -- Audit
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_shop_id ON payments(shop_id);
CREATE INDEX idx_payments_repair_order_id ON payments(repair_order_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);

-- =====================================================================
-- EXPENSES TABLE
-- =====================================================================
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  repair_order_id INTEGER REFERENCES repair_order_management(id) ON DELETE SET NULL,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,

  -- Expense details
  expense_number VARCHAR(50) UNIQUE,
  expense_date DATE NOT NULL,
  expense_amount DECIMAL(12, 2) NOT NULL,

  -- Expense type
  expense_type VARCHAR(50) NOT NULL
    CHECK (expense_type IN ('sublet', 'materials', 'equipment_rental', 'shipping', 'storage',
                           'towing', 'calibration', 'other_job_cost', 'operating_expense')),

  -- Expense category
  category VARCHAR(100),
  subcategory VARCHAR(100),

  -- Description
  description TEXT NOT NULL,

  -- Payment info
  payment_method VARCHAR(50),
  invoice_number VARCHAR(50),
  paid_date DATE,

  -- Approval
  requires_approval BOOLEAN DEFAULT false,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,

  -- Billable to customer
  is_billable BOOLEAN DEFAULT true,
  markup_percent DECIMAL(5, 2) DEFAULT 0.00,
  billed_amount DECIMAL(12, 2),

  -- Notes
  notes TEXT,

  -- Audit
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_shop_id ON expenses(shop_id);
CREATE INDEX idx_expenses_repair_order_id ON expenses(repair_order_id);
CREATE INDEX idx_expenses_expense_type ON expenses(expense_type);

-- =====================================================================
-- ATTACHMENTS TABLE
-- =====================================================================
CREATE TABLE attachments (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  estimate_id INTEGER REFERENCES estimates(id) ON DELETE SET NULL,

  -- Attachment details
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_url VARCHAR(500),
  file_type VARCHAR(100),
  file_size INTEGER,
  mime_type VARCHAR(100),

  -- Attachment category
  attachment_type VARCHAR(50) DEFAULT 'photo'
    CHECK (attachment_type IN ('photo', 'document', 'estimate', 'invoice', 'contract',
                               'insurance_doc', 'signature', 'video', 'other')),

  -- Photo specific
  photo_category VARCHAR(50)
    CHECK (photo_category IN ('damage_before', 'damage_during', 'damage_after', 'vin',
                              'odometer', 'interior', 'exterior', 'parts', 'other')),

  -- Metadata
  title VARCHAR(255),
  description TEXT,
  tags JSONB DEFAULT '[]',

  -- Status
  is_public BOOLEAN DEFAULT false,

  -- Audit
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attachments_shop_id ON attachments(shop_id);
CREATE INDEX idx_attachments_customer_id ON attachments(customer_id);
CREATE INDEX idx_attachments_job_id ON attachments(job_id);
CREATE INDEX idx_attachments_attachment_type ON attachments(attachment_type);

-- =====================================================================
-- SIGNATURES TABLE
-- =====================================================================
CREATE TABLE signatures (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  repair_order_id INTEGER REFERENCES repair_order_management(id) ON DELETE SET NULL,

  -- Signature details
  signature_type VARCHAR(50) NOT NULL
    CHECK (signature_type IN ('estimate_approval', 'work_authorization', 'delivery', 'waiver', 'other')),
  signature_data TEXT NOT NULL,
  signature_image_url VARCHAR(500),

  -- Signer info
  signer_name VARCHAR(255) NOT NULL,
  signer_title VARCHAR(100),
  signed_at TIMESTAMPTZ DEFAULT NOW(),

  -- IP and device tracking
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_info JSONB,

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_signatures_shop_id ON signatures(shop_id);
CREATE INDEX idx_signatures_repair_order_id ON signatures(repair_order_id);

-- =====================================================================
-- COMMUNICATION TEMPLATES TABLE
-- =====================================================================
CREATE TABLE communication_templates (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,

  -- Template details
  template_name VARCHAR(100) NOT NULL,
  template_type VARCHAR(50) NOT NULL
    CHECK (template_type IN ('email', 'sms', 'letter', 'notification')),

  -- Content
  subject VARCHAR(255),
  body TEXT NOT NULL,
  html_body TEXT,

  -- Variables
  variables JSONB DEFAULT '[]',

  -- Trigger
  trigger_event VARCHAR(100),
  auto_send BOOLEAN DEFAULT false,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_communication_templates_shop_id ON communication_templates(shop_id);

-- =====================================================================
-- COMMUNICATION LOGS TABLE
-- =====================================================================
CREATE TABLE communication_logs (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  template_id INTEGER REFERENCES communication_templates(id) ON DELETE SET NULL,

  -- Communication details
  communication_type VARCHAR(50) NOT NULL
    CHECK (communication_type IN ('email', 'sms', 'phone', 'in_person', 'letter', 'other')),
  direction VARCHAR(20) NOT NULL
    CHECK (direction IN ('inbound', 'outbound')),

  -- Content
  subject VARCHAR(255),
  message TEXT,
  recipient VARCHAR(255),
  sender VARCHAR(255),

  -- Status
  status VARCHAR(50) DEFAULT 'sent'
    CHECK (status IN ('draft', 'pending', 'sent', 'delivered', 'read', 'failed')),

  -- Timestamps
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_communication_logs_shop_id ON communication_logs(shop_id);
CREATE INDEX idx_communication_logs_customer_id ON communication_logs(customer_id);

-- =====================================================================
-- CONTACT TIMELINE TABLE
-- =====================================================================
CREATE TABLE contact_timeline (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  template_id INTEGER REFERENCES communication_templates(id) ON DELETE SET NULL,

  -- Event details
  event_type VARCHAR(50) NOT NULL,
  event_description TEXT,
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Contact method
  contact_method VARCHAR(50),
  contact_direction VARCHAR(20),

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contact_timeline_shop_id ON contact_timeline(shop_id);
CREATE INDEX idx_contact_timeline_customer_id ON contact_timeline(customer_id);

-- =====================================================================
-- FINANCIAL TRANSACTIONS TABLE
-- =====================================================================
CREATE TABLE financial_transactions (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
  insurance_company_id INTEGER REFERENCES insurance_companies(id) ON DELETE SET NULL,

  -- Transaction details
  transaction_type VARCHAR(50) NOT NULL
    CHECK (transaction_type IN ('income', 'expense', 'refund', 'adjustment')),
  transaction_date DATE NOT NULL,
  transaction_amount DECIMAL(12, 2) NOT NULL,

  -- Description
  description TEXT NOT NULL,
  category VARCHAR(100),

  -- Payment method
  payment_method VARCHAR(50),
  reference_number VARCHAR(100),

  -- Status
  status VARCHAR(50) DEFAULT 'completed',

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_financial_transactions_shop_id ON financial_transactions(shop_id);
CREATE INDEX idx_financial_transactions_transaction_type ON financial_transactions(transaction_type);

-- =====================================================================
-- QUICKBOOKS CONNECTION TABLE
-- =====================================================================
CREATE TABLE quickbooks_connections (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,

  -- QuickBooks credentials
  realm_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Connection status
  is_connected BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  sync_status VARCHAR(50),

  -- Settings
  auto_sync_enabled BOOLEAN DEFAULT false,
  sync_interval_minutes INTEGER DEFAULT 60,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quickbooks_connections_shop_id ON quickbooks_connections(shop_id);

-- =====================================================================
-- QUICKBOOKS SYNC LOGS TABLE
-- =====================================================================
CREATE TABLE quickbooks_sync_logs (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,

  -- Sync details
  sync_type VARCHAR(50) NOT NULL,
  sync_direction VARCHAR(20) NOT NULL,
  records_processed INTEGER DEFAULT 0,
  records_success INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,

  -- Status
  status VARCHAR(50) NOT NULL,
  error_message TEXT,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_quickbooks_sync_logs_shop_id ON quickbooks_sync_logs(shop_id);

-- =====================================================================
-- UPDATE TRIGGERS
-- =====================================================================
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_stages_updated_at BEFORE UPDATE ON production_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_workflow_updated_at BEFORE UPDATE ON production_workflow
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_labor_time_entries_updated_at BEFORE UPDATE ON labor_time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_clocks_updated_at BEFORE UPDATE ON time_clocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_enhanced_updated_at BEFORE UPDATE ON invoices_enhanced
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attachments_updated_at BEFORE UPDATE ON attachments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communication_templates_updated_at BEFORE UPDATE ON communication_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quickbooks_connections_updated_at BEFORE UPDATE ON quickbooks_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
