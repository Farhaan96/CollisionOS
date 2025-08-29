-- CollisionOS Jobs and Workflow Schema
-- Part 2 of the schema migration

-- =====================================================
-- ENUMS FOR JOBS AND WORKFLOW
-- =====================================================

-- Create ENUM types for jobs and workflow
CREATE TYPE job_status AS ENUM (
    'estimate', 'intake', 'blueprint', 'parts_ordering', 'parts_receiving',
    'body_structure', 'paint_prep', 'paint_booth', 'reassembly',
    'quality_control', 'calibration', 'detail', 'ready_pickup',
    'delivered', 'on_hold', 'cancelled'
);

CREATE TYPE job_priority AS ENUM ('low', 'normal', 'high', 'rush', 'urgent');
CREATE TYPE job_type AS ENUM ('collision', 'mechanical', 'paintwork', 'glass', 'detail', 'inspection', 'warranty');
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'paid', 'overdue', 'refunded');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'viewed', 'paid', 'cancelled');
CREATE TYPE estimate_status AS ENUM ('draft', 'sent', 'viewed', 'approved', 'rejected', 'revised');
CREATE TYPE parts_status AS ENUM ('pending', 'ordered', 'backordered', 'received', 'cancelled');
CREATE TYPE quality_status AS ENUM ('pending', 'in_progress', 'passed', 'failed', 'waived');
CREATE TYPE calibration_status AS ENUM ('not_required', 'required', 'completed', 'failed');

-- =====================================================
-- JOBS TABLE (Core workflow entity)
-- =====================================================

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  job_number VARCHAR(20) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  assigned_to UUID REFERENCES users(user_id) ON DELETE SET NULL,
  bay_id UUID, -- Will be created later if needed
  
  -- Status and workflow
  status job_status NOT NULL DEFAULT 'estimate',
  priority job_priority DEFAULT 'normal',
  job_type job_type NOT NULL DEFAULT 'collision',
  
  -- Insurance and claims
  insurance_id UUID, -- Will be created later if needed
  claim_id UUID, -- Will be created later if needed
  claim_number VARCHAR(50),
  deductible DECIMAL(10,2),
  customer_pay DECIMAL(10,2),
  insurance_pay DECIMAL(10,2),
  
  -- Financial breakdown
  total_amount DECIMAL(12,2),
  labor_amount DECIMAL(12,2),
  parts_amount DECIMAL(12,2),
  materials_amount DECIMAL(12,2),
  sublet_amount DECIMAL(12,2),
  tax_amount DECIMAL(12,2),
  profit_margin DECIMAL(5,2),
  
  -- Time tracking
  estimated_hours DECIMAL(8,2),
  actual_hours DECIMAL(8,2),
  efficiency DECIMAL(5,2),
  cycle_time INTEGER, -- Days
  target_delivery_date TIMESTAMPTZ,
  actual_delivery_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  completion_date TIMESTAMPTZ,
  check_in_date TIMESTAMPTZ,
  check_out_date TIMESTAMPTZ,
  
  -- Descriptions and notes
  damage_description TEXT,
  repair_description TEXT,
  notes TEXT,
  internal_notes TEXT,
  customer_notes TEXT,
  
  -- Flags and classifications
  is_drp BOOLEAN DEFAULT false,
  drp_program VARCHAR(100),
  is_warranty BOOLEAN DEFAULT false,
  warranty_type VARCHAR(50),
  is_rush BOOLEAN DEFAULT false,
  is_express BOOLEAN DEFAULT false,
  is_vip BOOLEAN DEFAULT false,
  is_insurance BOOLEAN DEFAULT false,
  is_customer_pay BOOLEAN DEFAULT false,
  is_cash BOOLEAN DEFAULT false,
  is_financed BOOLEAN DEFAULT false,
  
  -- Payment information
  payment_method VARCHAR(50),
  payment_status payment_status DEFAULT 'pending',
  invoice_status invoice_status DEFAULT 'draft',
  estimate_status estimate_status DEFAULT 'draft',
  parts_status parts_status DEFAULT 'pending',
  quality_status quality_status DEFAULT 'pending',
  calibration_status calibration_status DEFAULT 'not_required',
  
  -- Supplements
  supplement_count INTEGER DEFAULT 0,
  supplement_amount DECIMAL(12,2) DEFAULT 0.00,
  last_supplement_date TIMESTAMPTZ,
  
  -- Documentation
  photos_required BOOLEAN DEFAULT false,
  photos_taken BOOLEAN DEFAULT false,
  photos_count INTEGER DEFAULT 0,
  documents_required BOOLEAN DEFAULT false,
  documents_received BOOLEAN DEFAULT false,
  documents_count INTEGER DEFAULT 0,
  
  -- Authorization
  authorization_received BOOLEAN DEFAULT false,
  authorization_date TIMESTAMPTZ,
  authorization_method VARCHAR(50),
  authorization_by VARCHAR(100),
  
  -- Services
  rental_required BOOLEAN DEFAULT false,
  rental_provided BOOLEAN DEFAULT false,
  rental_start_date TIMESTAMPTZ,
  rental_end_date TIMESTAMPTZ,
  rental_cost DECIMAL(10,2),
  
  tow_required BOOLEAN DEFAULT false,
  tow_provided BOOLEAN DEFAULT false,
  tow_cost DECIMAL(10,2),
  
  sublet_required BOOLEAN DEFAULT false,
  sublet_count INTEGER DEFAULT 0,
  sublet_total DECIMAL(12,2) DEFAULT 0.00,
  
  -- Quality and feedback
  customer_satisfaction INTEGER CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5),
  customer_feedback TEXT,
  come_back BOOLEAN DEFAULT false,
  come_back_reason TEXT,
  come_back_date TIMESTAMPTZ,
  warranty_claim BOOLEAN DEFAULT false,
  warranty_claim_date TIMESTAMPTZ,
  warranty_claim_reason TEXT,
  
  -- Flexible fields
  tags JSONB DEFAULT '[]',
  custom_fields JSONB DEFAULT '{}',
  workflow JSONB DEFAULT '{}',
  timeline JSONB DEFAULT '[]',
  history JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  
  -- System fields
  is_archived BOOLEAN DEFAULT false,
  archived_date TIMESTAMPTZ,
  archived_by UUID REFERENCES users(user_id),
  created_by UUID REFERENCES users(user_id),
  updated_by UUID REFERENCES users(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for jobs
CREATE INDEX idx_jobs_shop_id ON jobs (shop_id);
CREATE INDEX idx_jobs_number ON jobs (job_number);
CREATE INDEX idx_jobs_customer ON jobs (customer_id);
CREATE INDEX idx_jobs_vehicle ON jobs (vehicle_id);
CREATE INDEX idx_jobs_assigned_to ON jobs (assigned_to);
CREATE INDEX idx_jobs_status ON jobs (status);
CREATE INDEX idx_jobs_priority ON jobs (priority);
CREATE INDEX idx_jobs_type ON jobs (job_type);
CREATE INDEX idx_jobs_claim ON jobs (claim_number);
CREATE INDEX idx_jobs_delivery ON jobs (target_delivery_date);
CREATE INDEX idx_jobs_check_in ON jobs (check_in_date);
CREATE INDEX idx_jobs_payment_status ON jobs (payment_status);
CREATE INDEX idx_jobs_archived ON jobs (is_archived);

-- Full-text search index
CREATE INDEX idx_jobs_search ON jobs USING gin(
  to_tsvector('english', 
    COALESCE(job_number, '') || ' ' ||
    COALESCE(damage_description, '') || ' ' ||
    COALESCE(repair_description, '') || ' ' ||
    COALESCE(notes, '')
  )
);

-- RLS for jobs
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jobs are viewable by shop members" ON jobs
  FOR SELECT USING (
    shop_id IN (
      SELECT shop_id FROM users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Shop members can manage jobs" ON jobs
  FOR ALL USING (
    shop_id IN (
      SELECT shop_id FROM users WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- JOB UPDATES TABLE (Audit trail for job changes)
-- =====================================================

CREATE TABLE job_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id),
  update_type VARCHAR(50) NOT NULL, -- 'status_change', 'assignment', 'notes', etc.
  old_value TEXT,
  new_value TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for job_updates
CREATE INDEX idx_job_updates_job ON job_updates (job_id);
CREATE INDEX idx_job_updates_shop ON job_updates (shop_id);
CREATE INDEX idx_job_updates_user ON job_updates (user_id);
CREATE INDEX idx_job_updates_type ON job_updates (update_type);
CREATE INDEX idx_job_updates_created ON job_updates (created_at);

-- RLS for job_updates
ALTER TABLE job_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Job updates are viewable by shop members" ON job_updates
  FOR SELECT USING (
    shop_id IN (
      SELECT shop_id FROM users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Job updates are insertable by shop members" ON job_updates
  FOR INSERT WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM users WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- JOB PARTS TABLE (Parts used in jobs)
-- =====================================================

CREATE TABLE job_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  part_id UUID REFERENCES parts(id) ON DELETE SET NULL,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  
  -- Part details (stored separately in case part is deleted)
  part_number VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category part_category NOT NULL,
  part_type part_type NOT NULL,
  
  -- Quantity and pricing
  quantity_needed INTEGER NOT NULL DEFAULT 1,
  quantity_ordered INTEGER DEFAULT 0,
  quantity_received INTEGER DEFAULT 0,
  unit_cost DECIMAL(10,2),
  unit_price DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  total_price DECIMAL(10,2),
  
  -- Status and tracking
  status parts_status DEFAULT 'pending',
  vendor_id UUID REFERENCES vendors(id),
  order_date TIMESTAMPTZ,
  expected_date TIMESTAMPTZ,
  received_date TIMESTAMPTZ,
  
  -- Additional details
  notes TEXT,
  is_core BOOLEAN DEFAULT false,
  core_value DECIMAL(10,2),
  warranty_period INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for job_parts
CREATE INDEX idx_job_parts_job ON job_parts (job_id);
CREATE INDEX idx_job_parts_part ON job_parts (part_id);
CREATE INDEX idx_job_parts_shop ON job_parts (shop_id);
CREATE INDEX idx_job_parts_vendor ON job_parts (vendor_id);
CREATE INDEX idx_job_parts_status ON job_parts (status);

-- RLS for job_parts
ALTER TABLE job_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Job parts are viewable by shop members" ON job_parts
  FOR SELECT USING (
    shop_id IN (
      SELECT shop_id FROM users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Shop members can manage job parts" ON job_parts
  FOR ALL USING (
    shop_id IN (
      SELECT shop_id FROM users WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- JOB LABOR TABLE (Labor operations for jobs)
-- =====================================================

CREATE TABLE job_labor (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES users(user_id),
  
  -- Labor details
  operation_code VARCHAR(50),
  description TEXT NOT NULL,
  category VARCHAR(100),
  
  -- Time and pricing
  estimated_hours DECIMAL(8,2) NOT NULL,
  actual_hours DECIMAL(8,2),
  hourly_rate DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  
  -- Status and tracking
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Quality control
  quality_check BOOLEAN DEFAULT false,
  quality_passed BOOLEAN,
  quality_notes TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for job_labor
CREATE INDEX idx_job_labor_job ON job_labor (job_id);
CREATE INDEX idx_job_labor_shop ON job_labor (shop_id);
CREATE INDEX idx_job_labor_technician ON job_labor (technician_id);
CREATE INDEX idx_job_labor_status ON job_labor (status);

-- RLS for job_labor
ALTER TABLE job_labor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Job labor is viewable by shop members" ON job_labor
  FOR SELECT USING (
    shop_id IN (
      SELECT shop_id FROM users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Shop members can manage job labor" ON job_labor
  FOR ALL USING (
    shop_id IN (
      SELECT shop_id FROM users WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- ESTIMATES TABLE
-- =====================================================

CREATE TABLE estimates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  estimate_number VARCHAR(20) NOT NULL UNIQUE,
  
  -- Estimate details
  version INTEGER DEFAULT 1,
  status estimate_status DEFAULT 'draft',
  estimate_type VARCHAR(50) DEFAULT 'repair', -- repair, supplement, revised
  
  -- Financial breakdown
  labor_total DECIMAL(12,2) DEFAULT 0.00,
  parts_total DECIMAL(12,2) DEFAULT 0.00,
  materials_total DECIMAL(12,2) DEFAULT 0.00,
  sublet_total DECIMAL(12,2) DEFAULT 0.00,
  subtotal DECIMAL(12,2) DEFAULT 0.00,
  tax_amount DECIMAL(12,2) DEFAULT 0.00,
  total_amount DECIMAL(12,2) DEFAULT 0.00,
  
  -- Discounts and adjustments
  discount_amount DECIMAL(12,2) DEFAULT 0.00,
  discount_percentage DECIMAL(5,2) DEFAULT 0.00,
  adjustment_amount DECIMAL(12,2) DEFAULT 0.00,
  adjustment_reason TEXT,
  
  -- Insurance information
  deductible DECIMAL(10,2),
  customer_pay DECIMAL(10,2),
  insurance_pay DECIMAL(10,2),
  
  -- Dates and timeline
  estimated_completion_date TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  approved_date TIMESTAMPTZ,
  sent_date TIMESTAMPTZ,
  
  -- Notes and descriptions
  summary TEXT,
  notes TEXT,
  internal_notes TEXT,
  terms_conditions TEXT,
  
  -- Document management
  document_path VARCHAR(255),
  photos JSONB DEFAULT '[]',
  attachments JSONB DEFAULT '[]',
  
  -- System fields
  created_by UUID NOT NULL REFERENCES users(user_id),
  approved_by UUID REFERENCES users(user_id),
  sent_by UUID REFERENCES users(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for estimates
CREATE INDEX idx_estimates_job ON estimates (job_id);
CREATE INDEX idx_estimates_shop ON estimates (shop_id);
CREATE INDEX idx_estimates_number ON estimates (estimate_number);
CREATE INDEX idx_estimates_status ON estimates (status);
CREATE INDEX idx_estimates_created_by ON estimates (created_by);

-- RLS for estimates
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Estimates are viewable by shop members" ON estimates
  FOR SELECT USING (
    shop_id IN (
      SELECT shop_id FROM users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Shop members can manage estimates" ON estimates
  FOR ALL USING (
    shop_id IN (
      SELECT shop_id FROM users WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Notification content
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'info', 'warning', 'error', 'success'
  category VARCHAR(50), -- 'job', 'part', 'customer', 'system', etc.
  
  -- Related entities
  related_id UUID, -- ID of related job, customer, etc.
  related_type VARCHAR(50), -- 'job', 'customer', 'part', etc.
  
  -- Status and delivery
  is_read BOOLEAN DEFAULT false,
  is_sent BOOLEAN DEFAULT false,
  delivery_method VARCHAR(20) DEFAULT 'in_app', -- 'in_app', 'email', 'sms'
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Create indexes for notifications
CREATE INDEX idx_notifications_shop ON notifications (shop_id);
CREATE INDEX idx_notifications_user ON notifications (user_id);
CREATE INDEX idx_notifications_type ON notifications (type);
CREATE INDEX idx_notifications_read ON notifications (is_read);
CREATE INDEX idx_notifications_sent ON notifications (is_sent);
CREATE INDEX idx_notifications_scheduled ON notifications (scheduled_for);

-- RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (
    user_id = auth.uid() OR (
      user_id IS NULL AND shop_id IN (
        SELECT shop_id FROM users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON parts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_parts_updated_at BEFORE UPDATE ON job_parts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_labor_updated_at BEFORE UPDATE ON job_labor
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_estimates_updated_at BEFORE UPDATE ON estimates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate sequential numbers
CREATE OR REPLACE FUNCTION generate_sequential_number(
  table_name TEXT,
  prefix TEXT,
  shop_id_val UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  last_number INTEGER;
  new_number TEXT;
  query TEXT;
BEGIN
  -- Build dynamic query based on whether shop_id is needed
  IF shop_id_val IS NOT NULL THEN
    query := format('SELECT COALESCE(MAX(CAST(SUBSTRING(%I FROM ''^%s-(\d+)$'') AS INTEGER)), 0) FROM %I WHERE shop_id = $1',
                    table_name || '_number', prefix, table_name);
    EXECUTE query INTO last_number USING shop_id_val;
  ELSE
    query := format('SELECT COALESCE(MAX(CAST(SUBSTRING(%I FROM ''^%s-(\d+)$'') AS INTEGER)), 0) FROM %I',
                    table_name || '_number', prefix, table_name);
    EXECUTE query INTO last_number;
  END IF;
  
  new_number := prefix || '-' || LPAD((last_number + 1)::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate job numbers
CREATE OR REPLACE FUNCTION generate_job_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.job_number IS NULL OR NEW.job_number = '' THEN
    NEW.job_number := generate_sequential_number('jobs', 'JOB', NEW.shop_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate job numbers
CREATE TRIGGER generate_job_number_trigger
  BEFORE INSERT ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION generate_job_number();

-- Function to track job status changes
CREATE OR REPLACE FUNCTION track_job_status_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO job_updates (
      job_id,
      shop_id,
      user_id,
      update_type,
      old_value,
      new_value,
      description
    ) VALUES (
      NEW.id,
      NEW.shop_id,
      COALESCE(NEW.updated_by, auth.uid()),
      'status_change',
      OLD.status::TEXT,
      NEW.status::TEXT,
      'Job status changed from ' || OLD.status || ' to ' || NEW.status
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to track job status changes
CREATE TRIGGER track_job_status_changes_trigger
  AFTER UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION track_job_status_changes();

-- Function to update job timestamps based on status
CREATE OR REPLACE FUNCTION update_job_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Set check_in_date when status moves to intake or later
  IF NEW.status IN ('intake', 'blueprint', 'parts_ordering', 'parts_receiving', 'body_structure', 'paint_prep', 'paint_booth', 'reassembly', 'quality_control', 'calibration', 'detail', 'ready_pickup', 'delivered')
     AND OLD.status = 'estimate' AND NEW.check_in_date IS NULL THEN
    NEW.check_in_date := NOW();
  END IF;
  
  -- Set start_date when work begins
  IF NEW.status IN ('body_structure', 'paint_prep', 'paint_booth', 'reassembly', 'quality_control', 'calibration', 'detail', 'ready_pickup', 'delivered')
     AND OLD.status NOT IN ('body_structure', 'paint_prep', 'paint_booth', 'reassembly', 'quality_control', 'calibration', 'detail', 'ready_pickup', 'delivered')
     AND NEW.start_date IS NULL THEN
    NEW.start_date := NOW();
  END IF;
  
  -- Set completion_date when delivered
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    NEW.completion_date := NOW();
    NEW.actual_delivery_date := NOW();
    NEW.check_out_date := NOW();
    
    -- Calculate cycle time if check_in_date exists
    IF NEW.check_in_date IS NOT NULL THEN
      NEW.cycle_time := EXTRACT(EPOCH FROM (NOW() - NEW.check_in_date)) / 86400; -- Days
    END IF;
  END IF;
  
  -- Calculate efficiency if both estimated and actual hours exist
  IF NEW.estimated_hours IS NOT NULL AND NEW.actual_hours IS NOT NULL AND NEW.actual_hours > 0 THEN
    NEW.efficiency := (NEW.estimated_hours / NEW.actual_hours) * 100;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update job timestamps
CREATE TRIGGER update_job_timestamps_trigger
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_job_timestamps();