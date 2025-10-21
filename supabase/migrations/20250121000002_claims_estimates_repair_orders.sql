-- =====================================================================
-- CollisionOS Supabase Migration - Claims, Estimates, and Repair Orders
-- Generated: 2025-01-21
-- Description: Core collision repair workflow tables
-- =====================================================================

-- =====================================================================
-- VEHICLE PROFILES TABLE (Enhanced vehicle management)
-- =====================================================================
CREATE TABLE vehicle_profiles (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- VIN and basic info
  vin VARCHAR(17) UNIQUE NOT NULL,
  year INTEGER NOT NULL,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  trim VARCHAR(100),
  body_style VARCHAR(50),

  -- Registration
  license_plate VARCHAR(20),
  plate_state VARCHAR(50),
  registration_expiry DATE,

  -- Appearance
  exterior_color VARCHAR(50),
  interior_color VARCHAR(50),
  paint_code VARCHAR(50),
  odometer INTEGER,

  -- VIN decode data
  vin_decoded JSONB,
  decoded_at TIMESTAMPTZ,

  -- Audit
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicle_profiles_shop_id ON vehicle_profiles(shop_id);
CREATE INDEX idx_vehicle_profiles_customer_id ON vehicle_profiles(customer_id);
CREATE INDEX idx_vehicle_profiles_vin ON vehicle_profiles(vin);

-- =====================================================================
-- CLAIM MANAGEMENT TABLE
-- =====================================================================
CREATE TABLE claim_management (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_profile_id INTEGER NOT NULL REFERENCES vehicle_profiles(id) ON DELETE CASCADE,
  insurance_company_id INTEGER REFERENCES insurance_companies(id) ON DELETE SET NULL,

  -- Claim identification
  claim_number VARCHAR(50) UNIQUE NOT NULL,
  policy_number VARCHAR(50),

  -- Claim details
  claim_type VARCHAR(50) DEFAULT 'collision'
    CHECK (claim_type IN ('collision', 'comprehensive', 'liability', 'uninsured', 'hail', 'vandalism', 'other')),
  claim_status VARCHAR(50) DEFAULT 'pending'
    CHECK (claim_status IN ('pending', 'approved', 'denied', 'under_review', 'supplement_requested',
                           'supplement_approved', 'closed', 'cancelled')),

  -- Important dates
  loss_date DATE NOT NULL,
  claim_filed_date DATE,
  claim_approved_date DATE,
  claim_closed_date DATE,

  -- Financial info
  deductible DECIMAL(10, 2) DEFAULT 0.00,
  deductible_collected BOOLEAN DEFAULT false,
  total_loss BOOLEAN DEFAULT false,
  acv_amount DECIMAL(12, 2),
  settlement_amount DECIMAL(12, 2),

  -- Adjuster info
  adjuster_name VARCHAR(100),
  adjuster_phone VARCHAR(20),
  adjuster_email VARCHAR(255),
  adjuster_notes TEXT,

  -- Claim details
  loss_description TEXT,
  damage_description TEXT,
  liability_decision VARCHAR(50),
  liability_percentage INTEGER,

  -- Police report
  police_report_filed BOOLEAN DEFAULT false,
  police_report_number VARCHAR(50),
  police_department VARCHAR(100),

  -- Coverage info
  coverage_types JSONB DEFAULT '[]',
  coverage_limits JSONB DEFAULT '{}',

  -- Notes
  claim_notes TEXT,
  internal_notes TEXT,

  -- Audit
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_claim_management_shop_id ON claim_management(shop_id);
CREATE INDEX idx_claim_management_customer_id ON claim_management(customer_id);
CREATE INDEX idx_claim_management_claim_number ON claim_management(claim_number);
CREATE INDEX idx_claim_management_claim_status ON claim_management(claim_status);

-- =====================================================================
-- ESTIMATES TABLE
-- =====================================================================
CREATE TABLE estimates (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
  job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
  insurance_company_id INTEGER REFERENCES insurance_companies(id) ON DELETE SET NULL,

  -- Estimate identification
  estimate_number VARCHAR(50) UNIQUE NOT NULL,

  -- Estimate details
  estimate_type VARCHAR(50) DEFAULT 'repair'
    CHECK (estimate_type IN ('repair', 'supplement', 'sublet', 'inspection')),
  estimate_status VARCHAR(50) DEFAULT 'draft'
    CHECK (estimate_status IN ('draft', 'pending', 'sent', 'approved', 'rejected', 'expired', 'converted')),

  -- Important dates
  estimate_date DATE NOT NULL,
  expiry_date DATE,
  approved_date DATE,

  -- Financial totals
  parts_total DECIMAL(12, 2) DEFAULT 0.00,
  labor_total DECIMAL(12, 2) DEFAULT 0.00,
  materials_total DECIMAL(12, 2) DEFAULT 0.00,
  sublet_total DECIMAL(12, 2) DEFAULT 0.00,

  subtotal DECIMAL(12, 2) DEFAULT 0.00,
  tax_amount DECIMAL(10, 2) DEFAULT 0.00,
  total_amount DECIMAL(12, 2) DEFAULT 0.00,

  -- BMS import info
  bms_imported BOOLEAN DEFAULT false,
  bms_import_date TIMESTAMPTZ,
  bms_document_path VARCHAR(500),

  -- Notes
  description TEXT,
  notes TEXT,
  internal_notes TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_estimates_shop_id ON estimates(shop_id);
CREATE INDEX idx_estimates_customer_id ON estimates(customer_id);
CREATE INDEX idx_estimates_vehicle_id ON estimates(vehicle_id);
CREATE INDEX idx_estimates_estimate_number ON estimates(estimate_number);
CREATE INDEX idx_estimates_estimate_status ON estimates(estimate_status);

-- =====================================================================
-- ESTIMATE LINE ITEMS TABLE
-- =====================================================================
CREATE TABLE estimate_line_items (
  id SERIAL PRIMARY KEY,
  estimate_id INTEGER NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,

  -- Line item details
  line_type VARCHAR(50) NOT NULL
    CHECK (line_type IN ('part', 'labor', 'material', 'sublet', 'fee', 'discount')),
  operation VARCHAR(50)
    CHECK (operation IN ('replace', 'repair', 'r&i', 'r&r', 'refinish', 'blend', 'align', 'calibrate', 'other')),

  -- Item description
  description TEXT NOT NULL,
  part_number VARCHAR(100),
  part_type VARCHAR(50),

  -- Quantities
  quantity DECIMAL(10, 2) DEFAULT 1.00,
  unit_price DECIMAL(12, 2) DEFAULT 0.00,
  labor_hours DECIMAL(8, 2) DEFAULT 0.00,
  labor_rate DECIMAL(10, 2) DEFAULT 0.00,

  -- Pricing
  list_price DECIMAL(12, 2) DEFAULT 0.00,
  discount_percent DECIMAL(5, 2) DEFAULT 0.00,
  discount_amount DECIMAL(12, 2) DEFAULT 0.00,
  total_amount DECIMAL(12, 2) DEFAULT 0.00,

  -- Part details (if applicable)
  oem_part BOOLEAN DEFAULT false,
  aftermarket_part BOOLEAN DEFAULT false,
  used_part BOOLEAN DEFAULT false,
  remanufactured_part BOOLEAN DEFAULT false,

  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  is_optional BOOLEAN DEFAULT false,
  is_included BOOLEAN DEFAULT true,

  -- Notes
  notes TEXT,

  -- Sequence for ordering
  sequence_number INTEGER,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_estimate_line_items_estimate_id ON estimate_line_items(estimate_id);
CREATE INDEX idx_estimate_line_items_line_type ON estimate_line_items(line_type);

-- =====================================================================
-- REPAIR ORDER MANAGEMENT TABLE (Core workflow)
-- =====================================================================
CREATE TABLE repair_order_management (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_profile_id INTEGER NOT NULL REFERENCES vehicle_profiles(id) ON DELETE CASCADE,
  claim_management_id INTEGER NOT NULL REFERENCES claim_management(id) ON DELETE CASCADE,
  estimate_id INTEGER REFERENCES estimates(id) ON DELETE SET NULL,

  -- RO identification
  repair_order_number VARCHAR(50) UNIQUE NOT NULL,
  internal_reference_number VARCHAR(50),

  -- RO status and workflow
  ro_status VARCHAR(50) DEFAULT 'draft'
    CHECK (ro_status IN ('draft', 'estimate_pending', 'estimate_approved', 'parts_ordered', 'parts_hold',
                        'in_production', 'quality_control', 'supplement_pending', 'supplement_approved',
                        'customer_approval', 'ready_for_delivery', 'completed', 'delivered', 'invoiced',
                        'paid', 'archived', 'cancelled')),
  previous_status VARCHAR(50),
  status_change_date TIMESTAMPTZ,
  status_change_reason TEXT,
  status_changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

  -- Important dates
  date_created TIMESTAMPTZ DEFAULT NOW(),
  date_estimate_approved TIMESTAMPTZ,
  date_parts_ordered TIMESTAMPTZ,
  date_production_started TIMESTAMPTZ,
  date_qc_completed TIMESTAMPTZ,
  promised_delivery_date TIMESTAMPTZ,
  actual_delivery_date TIMESTAMPTZ,

  -- Hold management
  is_on_hold BOOLEAN DEFAULT false,
  hold_start_date TIMESTAMPTZ,
  hold_end_date TIMESTAMPTZ,
  hold_reason VARCHAR(50)
    CHECK (hold_reason IN ('parts_delay', 'insurance_approval', 'customer_approval', 'supplement_review',
                          'sublet_delay', 'technician_unavailable', 'equipment_down', 'material_shortage',
                          'quality_issue', 'customer_request', 'payment_issue', 'other')),
  hold_description TEXT,
  hold_days INTEGER DEFAULT 0,

  -- SLA management
  sla_type VARCHAR(50) DEFAULT 'standard'
    CHECK (sla_type IN ('standard', 'priority', 'express', 'fleet', 'insurance_sla')),
  target_completion_days INTEGER,
  is_overdue BOOLEAN DEFAULT false,
  overdue_by INTEGER DEFAULT 0,
  sla_risk_level VARCHAR(20) DEFAULT 'green'
    CHECK (sla_risk_level IN ('green', 'yellow', 'red', 'critical')),

  -- Status badges and flags
  is_rush BOOLEAN DEFAULT false,
  is_priority BOOLEAN DEFAULT false,
  requires_special_handling BOOLEAN DEFAULT false,
  has_complications BOOLEAN DEFAULT false,
  complication_details TEXT,

  -- Assignment and responsibility
  primary_technician INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_estimator INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_sales_rep INTEGER REFERENCES users(id) ON DELETE SET NULL,
  qc_inspector INTEGER REFERENCES users(id) ON DELETE SET NULL,

  -- Financial summary
  estimated_total DECIMAL(12, 2) DEFAULT 0.00,
  approved_total DECIMAL(12, 2) DEFAULT 0.00,
  invoiced_total DECIMAL(12, 2) DEFAULT 0.00,
  paid_amount DECIMAL(12, 2) DEFAULT 0.00,
  balance_due DECIMAL(12, 2) DEFAULT 0.00,

  -- Cost breakdown
  parts_cost DECIMAL(12, 2) DEFAULT 0.00,
  labor_cost DECIMAL(12, 2) DEFAULT 0.00,
  materials_cost DECIMAL(12, 2) DEFAULT 0.00,
  sublet_cost DECIMAL(12, 2) DEFAULT 0.00,

  -- Tax breakdown
  taxable_amount DECIMAL(12, 2) DEFAULT 0.00,
  pst_amount DECIMAL(10, 2) DEFAULT 0.00,
  gst_amount DECIMAL(10, 2) DEFAULT 0.00,
  hst_amount DECIMAL(10, 2) DEFAULT 0.00,
  total_taxes DECIMAL(10, 2) DEFAULT 0.00,

  -- Customer payment info
  customer_portion_due DECIMAL(12, 2) DEFAULT 0.00,
  insurance_portion_due DECIMAL(12, 2) DEFAULT 0.00,
  deductible_amount DECIMAL(10, 2) DEFAULT 0.00,
  deductible_collected BOOLEAN DEFAULT false,

  -- Supplement tracking
  supplement_count INTEGER DEFAULT 0,
  total_supplement_amount DECIMAL(12, 2) DEFAULT 0.00,
  last_supplement_date TIMESTAMPTZ,
  supplements_pending BOOLEAN DEFAULT false,

  -- Parts status
  parts_ordered_count INTEGER DEFAULT 0,
  parts_received_count INTEGER DEFAULT 0,
  parts_pending_count INTEGER DEFAULT 0,
  parts_backordered_count INTEGER DEFAULT 0,
  all_parts_received BOOLEAN DEFAULT false,
  next_part_expected_date TIMESTAMPTZ,

  -- Production tracking
  production_stage VARCHAR(100),
  production_percent_complete INTEGER DEFAULT 0 CHECK (production_percent_complete >= 0 AND production_percent_complete <= 100),
  hours_estimated DECIMAL(8, 2) DEFAULT 0.00,
  hours_actual DECIMAL(8, 2) DEFAULT 0.00,
  efficiency_ratio DECIMAL(5, 2),

  -- Quality control
  qc_required BOOLEAN DEFAULT true,
  qc_completed BOOLEAN DEFAULT false,
  qc_date TIMESTAMPTZ,
  qc_passed BOOLEAN DEFAULT false,
  qc_notes TEXT,
  requires_rework BOOLEAN DEFAULT false,
  rework_reason TEXT,

  -- Customer communication
  last_customer_contact TIMESTAMPTZ,
  next_scheduled_contact TIMESTAMPTZ,
  customer_satisfaction_score INTEGER CHECK (customer_satisfaction_score >= 1 AND customer_satisfaction_score <= 5),

  -- ADAS and calibration
  requires_adas_calibration BOOLEAN DEFAULT false,
  adas_calibration_completed BOOLEAN DEFAULT false,
  adas_calibration_date TIMESTAMPTZ,
  adas_calibration_notes TEXT,

  -- Environmental and safety
  hazardous_materials_present BOOLEAN DEFAULT false,
  hazmat_details TEXT,
  safety_precautions TEXT,

  -- Storage information
  storage_location VARCHAR(100),
  internal_storage_charges DECIMAL(10, 2) DEFAULT 0.00,

  -- External services (sublets)
  requires_sublets BOOLEAN DEFAULT false,
  sublet_services_description TEXT,
  sublet_costs_approved BOOLEAN DEFAULT false,

  -- Document management
  estimate_document_path VARCHAR(500),
  photo_count INTEGER DEFAULT 0,
  has_before_photos BOOLEAN DEFAULT false,
  has_after_photos BOOLEAN DEFAULT false,
  has_progress_photos BOOLEAN DEFAULT false,

  -- Warranty and follow-up
  warranty_provided BOOLEAN DEFAULT true,
  warranty_period INTEGER,
  warranty_start_date TIMESTAMPTZ,
  warranty_end_date TIMESTAMPTZ,

  -- Notes and comments
  ro_notes TEXT,
  internal_notes TEXT,
  customer_instructions TEXT,
  estimator_notes TEXT,
  technician_notes TEXT,

  -- Compliance and tracking
  compliance_checklist TEXT,
  compliance_complete BOOLEAN DEFAULT false,

  -- Audit
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_repair_order_management_shop_id ON repair_order_management(shop_id);
CREATE INDEX idx_repair_order_management_customer_id ON repair_order_management(customer_id);
CREATE INDEX idx_repair_order_management_ro_number ON repair_order_management(repair_order_number);
CREATE INDEX idx_repair_order_management_ro_status ON repair_order_management(ro_status);
CREATE INDEX idx_repair_order_management_claim_id ON repair_order_management(claim_management_id);
CREATE INDEX idx_repair_order_management_promised_delivery ON repair_order_management(promised_delivery_date);

-- =====================================================================
-- BMS IMPORTS TABLE (XML import tracking)
-- =====================================================================
CREATE TABLE bms_imports (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  estimate_id INTEGER REFERENCES estimates(id) ON DELETE SET NULL,
  job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,

  -- Import details
  import_source VARCHAR(50) NOT NULL,
  import_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255),
  file_path VARCHAR(500),
  file_size INTEGER,

  -- BMS data
  bms_version VARCHAR(20),
  bms_format VARCHAR(50),
  raw_xml TEXT,
  parsed_data JSONB,

  -- Import status
  import_status VARCHAR(50) DEFAULT 'pending'
    CHECK (import_status IN ('pending', 'processing', 'completed', 'failed', 'partial')),
  error_message TEXT,
  warnings JSONB DEFAULT '[]',

  -- Processing info
  records_processed INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  processing_duration_ms INTEGER,

  -- Audit
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bms_imports_shop_id ON bms_imports(shop_id);
CREATE INDEX idx_bms_imports_estimate_id ON bms_imports(estimate_id);
CREATE INDEX idx_bms_imports_import_status ON bms_imports(import_status);

-- =====================================================================
-- UPDATE TRIGGERS
-- =====================================================================
CREATE TRIGGER update_vehicle_profiles_updated_at BEFORE UPDATE ON vehicle_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claim_management_updated_at BEFORE UPDATE ON claim_management
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_estimates_updated_at BEFORE UPDATE ON estimates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_estimate_line_items_updated_at BEFORE UPDATE ON estimate_line_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repair_order_management_updated_at BEFORE UPDATE ON repair_order_management
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bms_imports_updated_at BEFORE UPDATE ON bms_imports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
