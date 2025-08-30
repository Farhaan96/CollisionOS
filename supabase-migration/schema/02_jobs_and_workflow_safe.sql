-- ==============================================================
-- CollisionOS Jobs and Workflow Schema (SAFE VERSION)
-- File: 02_jobs_and_workflow_safe.sql
-- Description: Job management, estimates, work orders with safe creation
-- ==============================================================

-- =====================================================
-- ENUMS FOR JOBS AND WORKFLOW (Safe Creation)
-- =====================================================

-- Create ENUM types for jobs and workflow (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE job_status AS ENUM (
        'estimate', 'intake', 'blueprint', 'parts_ordering', 'parts_receiving',
        'body_structure', 'paint_prep', 'paint_booth', 'reassembly',
        'quality_control', 'calibration', 'detail', 'ready_pickup',
        'delivered', 'on_hold', 'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_priority AS ENUM ('low', 'normal', 'high', 'rush', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_type AS ENUM ('collision', 'mechanical', 'paintwork', 'glass', 'detail', 'inspection', 'warranty');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'paid', 'overdue', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'viewed', 'paid', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE estimate_status AS ENUM ('draft', 'sent', 'viewed', 'approved', 'rejected', 'revised');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE parts_status AS ENUM ('pending', 'ordered', 'backordered', 'received', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE quality_status AS ENUM ('pending', 'in_progress', 'passed', 'failed', 'waived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE calibration_status AS ENUM ('not_required', 'required', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- JOBS TABLE (Core workflow entity)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  job_number VARCHAR(20) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
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
  
  -- Photos and documentation
  photos JSONB DEFAULT '[]'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  
  -- Integration data
  external_id VARCHAR(100),
  external_system VARCHAR(50),
  sync_status VARCHAR(20) DEFAULT 'pending',
  
  -- Metadata
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes only if they don't exist
DO $$ BEGIN
    CREATE UNIQUE INDEX idx_jobs_job_number ON public.jobs(job_number);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_jobs_shop_id ON public.jobs(shop_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_jobs_customer_id ON public.jobs(customer_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_jobs_vehicle_id ON public.jobs(vehicle_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_jobs_assigned_to ON public.jobs(assigned_to);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_jobs_status ON public.jobs(status);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_jobs_priority ON public.jobs(priority);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_jobs_job_type ON public.jobs(job_type);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_jobs_payment_status ON public.jobs(payment_status);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_jobs_created_at ON public.jobs(created_at);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- ESTIMATES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.estimates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  estimate_number VARCHAR(20) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  
  -- Estimate details
  estimate_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  status estimate_status DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  is_final BOOLEAN DEFAULT false,
  
  -- Financial breakdown
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  labor_amount DECIMAL(12,2) DEFAULT 0.00,
  parts_amount DECIMAL(12,2) DEFAULT 0.00,
  materials_amount DECIMAL(12,2) DEFAULT 0.00,
  sublet_amount DECIMAL(12,2) DEFAULT 0.00,
  tax_amount DECIMAL(12,2) DEFAULT 0.00,
  discount_amount DECIMAL(12,2) DEFAULT 0.00,
  
  -- Labor rates
  labor_rate DECIMAL(8,2),
  paint_rate DECIMAL(8,2),
  materials_rate DECIMAL(8,2),
  
  -- Insurance information
  insurance_company VARCHAR(100),
  claim_number VARCHAR(50),
  policy_number VARCHAR(50),
  deductible DECIMAL(10,2),
  customer_pay DECIMAL(10,2),
  insurance_pay DECIMAL(10,2),
  
  -- Notes and descriptions
  damage_description TEXT,
  repair_description TEXT,
  notes TEXT,
  customer_notes TEXT,
  internal_notes TEXT,
  
  -- Approval information
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMPTZ,
  customer_signature TEXT,
  customer_signature_date TIMESTAMPTZ,
  
  -- Integration
  external_id VARCHAR(100),
  external_system VARCHAR(50),
  
  -- Metadata
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes only if they don't exist
DO $$ BEGIN
    CREATE UNIQUE INDEX idx_estimates_estimate_number ON public.estimates(estimate_number);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_estimates_job_id ON public.estimates(job_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_estimates_shop_id ON public.estimates(shop_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_estimates_customer_id ON public.estimates(customer_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_estimates_status ON public.estimates(status);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_estimates_estimate_date ON public.estimates(estimate_date);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- WORK ORDERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  work_order_number VARCHAR(20) NOT NULL UNIQUE,
  
  -- Work order details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructions TEXT,
  priority job_priority DEFAULT 'normal',
  status VARCHAR(50) DEFAULT 'pending',
  
  -- Assignment
  assigned_to UUID REFERENCES public.users(id),
  assigned_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Time tracking
  estimated_hours DECIMAL(8,2),
  actual_hours DECIMAL(8,2),
  
  -- Financial
  labor_amount DECIMAL(12,2) DEFAULT 0.00,
  parts_amount DECIMAL(12,2) DEFAULT 0.00,
  materials_amount DECIMAL(12,2) DEFAULT 0.00,
  
  -- Notes
  notes TEXT,
  internal_notes TEXT,
  
  -- Metadata
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes only if they don't exist
DO $$ BEGIN
    CREATE UNIQUE INDEX idx_work_orders_work_order_number ON public.work_orders(work_order_number);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_work_orders_job_id ON public.work_orders(job_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_work_orders_shop_id ON public.work_orders(shop_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_work_orders_assigned_to ON public.work_orders(assigned_to);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_work_orders_status ON public.work_orders(status);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- JOB PHOTOS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.job_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  
  -- Photo details
  photo_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  file_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  
  -- Photo metadata
  category VARCHAR(100), -- 'damage', 'repair', 'before', 'after', 'progress'
  description TEXT,
  tags TEXT[],
  
  -- Location and timing
  taken_at TIMESTAMPTZ,
  location VARCHAR(100),
  
  -- Upload information
  uploaded_by UUID REFERENCES public.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes only if they don't exist
DO $$ BEGIN
    CREATE INDEX idx_job_photos_job_id ON public.job_photos(job_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_job_photos_shop_id ON public.job_photos(shop_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_job_photos_category ON public.job_photos(category);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_job_photos_uploaded_by ON public.job_photos(uploaded_by);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- JOB NOTES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.job_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  
  -- Note details
  title VARCHAR(255),
  content TEXT NOT NULL,
  note_type VARCHAR(50) DEFAULT 'general', -- 'general', 'progress', 'issue', 'customer', 'internal'
  priority VARCHAR(20) DEFAULT 'normal',
  
  -- Assignment
  assigned_to UUID REFERENCES public.users(id),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Visibility
  is_internal BOOLEAN DEFAULT false,
  is_urgent BOOLEAN DEFAULT false,
  
  -- Metadata
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes only if they don't exist
DO $$ BEGIN
    CREATE INDEX idx_job_notes_job_id ON public.job_notes(job_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_job_notes_shop_id ON public.job_notes(shop_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_job_notes_note_type ON public.job_notes(note_type);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_job_notes_assigned_to ON public.job_notes(assigned_to);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_job_notes_created_at ON public.job_notes(created_at);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to generate job numbers
CREATE OR REPLACE FUNCTION generate_job_number(shop_uuid UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
    next_number INTEGER;
    year_suffix VARCHAR(4);
BEGIN
    year_suffix := EXTRACT(year FROM CURRENT_DATE)::TEXT;
    
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(job_number FROM 9) AS INTEGER)), 
        0
    ) + 1 INTO next_number
    FROM public.jobs 
    WHERE shop_id = shop_uuid 
    AND job_number ~ '^JOB-' || year_suffix || '-\d{4}$';
    
    RETURN 'JOB-' || year_suffix || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate estimate numbers
CREATE OR REPLACE FUNCTION generate_estimate_number(shop_uuid UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
    next_number INTEGER;
    year_suffix VARCHAR(4);
BEGIN
    year_suffix := EXTRACT(year FROM CURRENT_DATE)::TEXT;
    
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(estimate_number FROM 10) AS INTEGER)), 
        0
    ) + 1 INTO next_number
    FROM public.estimates 
    WHERE shop_id = shop_uuid 
    AND estimate_number ~ '^EST-' || year_suffix || '-\d{4}$';
    
    RETURN 'EST-' || year_suffix || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate work order numbers
CREATE OR REPLACE FUNCTION generate_work_order_number(shop_uuid UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
    next_number INTEGER;
    year_suffix VARCHAR(4);
BEGIN
    year_suffix := EXTRACT(year FROM CURRENT_DATE)::TEXT;
    
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(work_order_number FROM 12) AS INTEGER)), 
        0
    ) + 1 INTO next_number
    FROM public.work_orders 
    WHERE shop_id = shop_uuid 
    AND work_order_number ~ '^WO-' || year_suffix || '-\d{4}$';
    
    RETURN 'WO-' || year_suffix || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated_at triggers for new tables (only if they don't exist)
DO $$ BEGIN
    CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_estimates_updated_at BEFORE UPDATE ON public.estimates
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON public.work_orders
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_job_photos_updated_at BEFORE UPDATE ON public.job_photos
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_job_notes_updated_at BEFORE UPDATE ON public.job_notes
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
