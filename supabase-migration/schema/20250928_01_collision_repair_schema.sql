-- ==============================================================
-- CollisionOS Migration: collision_repair_schema
-- File: 20250928_01_collision_repair_schema.sql
-- Date: 2025-09-28
-- Description: Deploy complete collision repair schema
-- Dependencies: 01_initial_schema.sql, 02_jobs_and_workflow.sql
-- ==============================================================

-- Verify dependencies
DO $$
BEGIN
    -- Check if required tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shops') THEN
        RAISE EXCEPTION 'Foundation schema (01_initial_schema.sql) must be deployed first';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN
        RAISE EXCEPTION 'Workflow schema (02_jobs_and_workflow.sql) must be deployed first';
    END IF;

    RAISE NOTICE 'Dependencies verified - proceeding with collision repair schema deployment';
END $$;

-- Begin collision repair schema deployment
-- ==============================================================
-- CollisionOS Collision Repair Schema for Supabase (PostgreSQL)
-- File: supabase-collision-repair-schema.sql  
-- Description: Complete collision repair tables converted from SQLite
-- ==============================================================

-- ==============================================================
-- COLLISION REPAIR SPECIFIC ENUMS
-- ==============================================================

-- BMS and import related enums
DO $$ BEGIN
    CREATE TYPE file_import_type AS ENUM ('EMS', 'BMS', 'CSV', 'XML', 'JSON');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE import_status AS ENUM ('pending', 'processing', 'success', 'failed', 'partial', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Insurance and claims enums
DO $$ BEGIN
    CREATE TYPE claim_status AS ENUM ('open', 'closed', 'pending', 'denied', 'paid', 'partial_payment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE insurance_type AS ENUM ('liability', 'collision', 'comprehensive', 'uninsured_motorist', 'pip');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Parts workflow enums (collision repair specific)
DO $$ BEGIN
    CREATE TYPE parts_workflow_status AS ENUM ('needed', 'sourcing', 'ordered', 'backordered', 'received', 'installed', 'returned', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Purchase order enums
DO $$ BEGIN
    CREATE TYPE po_status AS ENUM ('draft', 'sent', 'acknowledged', 'shipped', 'delivered', 'complete', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================
-- BMS IMPORTS TABLE
-- Core table for BMS/XML file processing
-- ==============================================================

CREATE TABLE IF NOT EXISTS public.bms_imports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type file_import_type DEFAULT 'BMS',
    file_size BIGINT,
    original_file_name VARCHAR(255),
    file_path VARCHAR(500),
    import_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    status import_status DEFAULT 'pending',
    parsed_data JSONB,
    error_log JSONB,
    created_by UUID NOT NULL REFERENCES public.users(id),
    estimate_id UUID,
    job_id UUID,
    total_records INTEGER DEFAULT 0,
    processed_records INTEGER DEFAULT 0,
    error_records INTEGER DEFAULT 0,
    skipped_records INTEGER DEFAULT 0,
    processing_started TIMESTAMPTZ,
    processing_completed TIMESTAMPTZ,
    processing_duration INTEGER, -- seconds
    data_mapping JSONB,
    validation_errors JSONB,
    bms_version VARCHAR(50),
    bms_provider VARCHAR(100),
    backup_data JSONB,
    can_rollback BOOLEAN DEFAULT false,
    rolled_back BOOLEAN DEFAULT false,
    rollback_date TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for bms_imports
CREATE INDEX IF NOT EXISTS idx_bms_imports_shop_id ON public.bms_imports(shop_id);
CREATE INDEX IF NOT EXISTS idx_bms_imports_status ON public.bms_imports(status);
CREATE INDEX IF NOT EXISTS idx_bms_imports_import_date ON public.bms_imports(import_date);
CREATE INDEX IF NOT EXISTS idx_bms_imports_created_by ON public.bms_imports(created_by);

-- ==============================================================
-- INSURANCE COMPANIES TABLE
-- ==============================================================

CREATE TABLE IF NOT EXISTS public.insurance_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    contact_person VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    fax VARCHAR(20),
    website VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'Canada',
    
    -- DRP Information
    is_drp BOOLEAN DEFAULT false,
    drp_program_name VARCHAR(100),
    drp_contact_person VARCHAR(100),
    drp_contact_email VARCHAR(255),
    drp_contact_phone VARCHAR(20),
    
    -- Rates and Terms
    labor_rate DECIMAL(8,2),
    paint_rate DECIMAL(8,2),
    storage_rate DECIMAL(8,2),
    
    -- Business Terms
    payment_terms VARCHAR(50),
    preferred_estimating_system VARCHAR(50),
    
    -- Integration
    claim_system_url VARCHAR(255),
    api_endpoint VARCHAR(255),
    api_key VARCHAR(255),
    
    -- Performance Metrics
    avg_approval_time INTEGER, -- hours
    avg_payment_time INTEGER, -- days
    satisfaction_rating DECIMAL(3,2),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for insurance_companies
CREATE INDEX IF NOT EXISTS idx_insurance_companies_shop_id ON public.insurance_companies(shop_id);
CREATE INDEX IF NOT EXISTS idx_insurance_companies_name ON public.insurance_companies(name);
CREATE INDEX IF NOT EXISTS idx_insurance_companies_is_drp ON public.insurance_companies(is_drp);
CREATE INDEX IF NOT EXISTS idx_insurance_companies_is_active ON public.insurance_companies(is_active);

-- ==============================================================
-- CLAIMS TABLE (Insurance Claims Management)
-- ==============================================================

CREATE TABLE IF NOT EXISTS public.claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    claim_number VARCHAR(50) NOT NULL,
    insurance_company_id UUID NOT NULL REFERENCES public.insurance_companies(id),
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
    
    -- Claim Details
    incident_date DATE NOT NULL,
    reported_date DATE,
    claim_status claim_status DEFAULT 'open',
    insurance_type insurance_type DEFAULT 'collision',
    
    -- Financial Information
    policy_number VARCHAR(50),
    policy_limit DECIMAL(12,2),
    deductible DECIMAL(10,2),
    coverage_a DECIMAL(12,2), -- Collision
    coverage_b DECIMAL(12,2), -- Comprehensive  
    coverage_c DECIMAL(12,2), -- Liability
    rental_coverage DECIMAL(10,2),
    rental_days INTEGER,
    
    -- Adjuster Information
    adjuster_name VARCHAR(100),
    adjuster_email VARCHAR(255),
    adjuster_phone VARCHAR(20),
    adjuster_company VARCHAR(100),
    
    -- Estimate Information
    initial_estimate_amount DECIMAL(12,2),
    final_estimate_amount DECIMAL(12,2),
    approved_amount DECIMAL(12,2),
    paid_amount DECIMAL(12,2) DEFAULT 0.00,
    
    -- Incident Details
    incident_description TEXT,
    police_report_number VARCHAR(50),
    fault_determination VARCHAR(100),
    other_party_info JSONB,
    
    -- Timeline
    inspection_date DATE,
    approval_date DATE,
    payment_date DATE,
    closed_date DATE,
    
    -- Documents and Photos
    documents JSONB DEFAULT '[]'::jsonb,
    
    -- Notes
    notes TEXT,
    adjuster_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for claims
CREATE UNIQUE INDEX IF NOT EXISTS idx_claims_claim_number ON public.claims(claim_number);
CREATE INDEX IF NOT EXISTS idx_claims_shop_id ON public.claims(shop_id);
CREATE INDEX IF NOT EXISTS idx_claims_insurance_company_id ON public.claims(insurance_company_id);
CREATE INDEX IF NOT EXISTS idx_claims_customer_id ON public.claims(customer_id);
CREATE INDEX IF NOT EXISTS idx_claims_vehicle_id ON public.claims(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_claims_claim_status ON public.claims(claim_status);
CREATE INDEX IF NOT EXISTS idx_claims_incident_date ON public.claims(incident_date);

-- ==============================================================
-- REPAIR ORDERS TABLE (Collision Repair Specific)
-- ==============================================================

CREATE TABLE IF NOT EXISTS public.repair_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    ro_number VARCHAR(50) NOT NULL UNIQUE,
    claim_id UUID REFERENCES public.claims(id), -- 1:1 relationship with claims
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
    job_id UUID REFERENCES public.jobs(id), -- Link to workflow jobs
    
    -- RO Status and Type
    status VARCHAR(50) DEFAULT 'estimate',
    ro_type VARCHAR(50) DEFAULT 'collision', -- 'collision', 'mechanical', 'paintwork'
    priority VARCHAR(20) DEFAULT 'normal',
    
    -- Financial Breakdown (Collision Repair Specific)
    labor_amount DECIMAL(12,2) DEFAULT 0.00,
    parts_amount DECIMAL(12,2) DEFAULT 0.00,
    paint_materials_amount DECIMAL(12,2) DEFAULT 0.00,
    sublet_amount DECIMAL(12,2) DEFAULT 0.00,
    storage_amount DECIMAL(12,2) DEFAULT 0.00,
    rental_amount DECIMAL(12,2) DEFAULT 0.00,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    total_amount DECIMAL(12,2) DEFAULT 0.00,
    
    -- Insurance Split
    insurance_portion DECIMAL(12,2) DEFAULT 0.00,
    customer_portion DECIMAL(12,2) DEFAULT 0.00,
    deductible_amount DECIMAL(12,2) DEFAULT 0.00,
    
    -- Damage and Repair Information
    damage_description TEXT,
    repair_procedures TEXT,
    parts_needed TEXT,
    estimated_completion_date DATE,
    actual_completion_date DATE,
    
    -- Quality and Safety
    pre_repair_inspection JSONB,
    post_repair_inspection JSONB,
    calibration_required BOOLEAN DEFAULT false,
    calibration_completed BOOLEAN DEFAULT false,
    
    -- Workflow Timestamps
    drop_off_date TIMESTAMPTZ,
    started_date TIMESTAMPTZ,
    parts_ordered_date TIMESTAMPTZ,
    parts_received_date TIMESTAMPTZ,
    completion_date TIMESTAMPTZ,
    pickup_date TIMESTAMPTZ,
    
    -- Document Management
    estimate_pdf_path VARCHAR(500),
    invoice_pdf_path VARCHAR(500),
    photos JSONB DEFAULT '[]'::jsonb,
    documents JSONB DEFAULT '[]'::jsonb,
    
    -- Integration and External IDs
    external_ro_id VARCHAR(100),
    bms_import_id UUID REFERENCES public.bms_imports(id),
    
    -- Audit
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for repair_orders
CREATE UNIQUE INDEX IF NOT EXISTS idx_repair_orders_ro_number ON public.repair_orders(ro_number);
CREATE INDEX IF NOT EXISTS idx_repair_orders_shop_id ON public.repair_orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_repair_orders_claim_id ON public.repair_orders(claim_id);
CREATE INDEX IF NOT EXISTS idx_repair_orders_customer_id ON public.repair_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_repair_orders_vehicle_id ON public.repair_orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_repair_orders_status ON public.repair_orders(status);
CREATE INDEX IF NOT EXISTS idx_repair_orders_created_at ON public.repair_orders(created_at);

-- ==============================================================
-- PARTS ORDERS TABLE (Purchase Order Management)
-- ==============================================================

CREATE TABLE IF NOT EXISTS public.parts_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    po_number VARCHAR(50) NOT NULL UNIQUE,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id),
    repair_order_id UUID REFERENCES public.repair_orders(id),
    
    -- Order Details
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_date DATE,
    shipped_date DATE,
    received_date DATE,
    status po_status DEFAULT 'draft',
    
    -- Financial Information
    subtotal DECIMAL(12,2) DEFAULT 0.00,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    shipping_amount DECIMAL(12,2) DEFAULT 0.00,
    total_amount DECIMAL(12,2) DEFAULT 0.00,
    
    -- Shipping Information
    shipping_method VARCHAR(100),
    tracking_number VARCHAR(100),
    shipping_address TEXT,
    
    -- Payment Information
    payment_terms VARCHAR(50),
    payment_method VARCHAR(50),
    paid_amount DECIMAL(12,2) DEFAULT 0.00,
    payment_date DATE,
    
    -- Notes and Communication
    notes TEXT,
    special_instructions TEXT,
    vendor_confirmation TEXT,
    
    -- Integration
    external_po_id VARCHAR(100),
    vendor_po_number VARCHAR(50),
    
    -- Audit
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for parts_orders
CREATE UNIQUE INDEX IF NOT EXISTS idx_parts_orders_po_number ON public.parts_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_parts_orders_shop_id ON public.parts_orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_parts_orders_vendor_id ON public.parts_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_parts_orders_repair_order_id ON public.parts_orders(repair_order_id);
CREATE INDEX IF NOT EXISTS idx_parts_orders_status ON public.parts_orders(status);
CREATE INDEX IF NOT EXISTS idx_parts_orders_order_date ON public.parts_orders(order_date);

-- ==============================================================
-- PARTS ORDER ITEMS TABLE
-- ==============================================================

CREATE TABLE IF NOT EXISTS public.parts_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parts_order_id UUID NOT NULL REFERENCES public.parts_orders(id) ON DELETE CASCADE,
    part_id UUID REFERENCES public.parts(id),
    
    -- Part Details
    part_number VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    oem_part_number VARCHAR(100),
    
    -- Quantities
    quantity_ordered INTEGER NOT NULL,
    quantity_received INTEGER DEFAULT 0,
    quantity_returned INTEGER DEFAULT 0,
    quantity_damaged INTEGER DEFAULT 0,
    
    -- Pricing
    unit_cost DECIMAL(10,2),
    unit_price DECIMAL(10,2),
    line_total DECIMAL(12,2),
    
    -- Status and Workflow
    status parts_workflow_status DEFAULT 'needed',
    received_date DATE,
    installed_date DATE,
    
    -- Part Information
    make VARCHAR(100),
    model VARCHAR(100),
    year_from INTEGER,
    year_to INTEGER,
    color VARCHAR(50),
    
    -- Quality and Returns
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    return_reason TEXT,
    warranty_period INTEGER, -- days
    
    -- Notes
    notes TEXT,
    installation_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for parts_order_items
CREATE INDEX IF NOT EXISTS idx_parts_order_items_parts_order_id ON public.parts_order_items(parts_order_id);
CREATE INDEX IF NOT EXISTS idx_parts_order_items_part_id ON public.parts_order_items(part_id);
CREATE INDEX IF NOT EXISTS idx_parts_order_items_part_number ON public.parts_order_items(part_number);
CREATE INDEX IF NOT EXISTS idx_parts_order_items_status ON public.parts_order_items(status);

-- ==============================================================
-- ESTIMATE LINE ITEMS TABLE
-- ==============================================================

CREATE TABLE IF NOT EXISTS public.estimate_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
    repair_order_id UUID REFERENCES public.repair_orders(id),
    
    -- Line Item Details
    line_number INTEGER NOT NULL,
    item_type VARCHAR(50) NOT NULL, -- 'labor', 'part', 'material', 'sublet', 'other'
    category VARCHAR(100),
    description TEXT NOT NULL,
    
    -- Labor Information
    operation_code VARCHAR(20),
    labor_time DECIMAL(8,2), -- hours
    labor_rate DECIMAL(8,2),
    
    -- Part Information
    part_number VARCHAR(100),
    oem_part_number VARCHAR(100),
    part_type VARCHAR(50), -- 'oem', 'aftermarket', 'recycled', 'remanufactured'
    quantity INTEGER,
    unit_cost DECIMAL(10,2),
    unit_price DECIMAL(10,2),
    
    -- Pricing
    amount DECIMAL(12,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    net_amount DECIMAL(12,2),
    
    -- Paint Information
    paint_time DECIMAL(8,2),
    material_cost DECIMAL(10,2),
    
    -- Flags
    is_included BOOLEAN DEFAULT true,
    is_customer_pay BOOLEAN DEFAULT false,
    is_warranty BOOLEAN DEFAULT false,
    is_supplement BOOLEAN DEFAULT false,
    
    -- Vendor Information
    vendor_id UUID REFERENCES public.vendors(id),
    vendor_quote_number VARCHAR(50),
    
    -- Notes
    notes TEXT,
    internal_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for estimate_line_items
CREATE INDEX IF NOT EXISTS idx_estimate_line_items_estimate_id ON public.estimate_line_items(estimate_id);
CREATE INDEX IF NOT EXISTS idx_estimate_line_items_repair_order_id ON public.estimate_line_items(repair_order_id);
CREATE INDEX IF NOT EXISTS idx_estimate_line_items_item_type ON public.estimate_line_items(item_type);
CREATE INDEX IF NOT EXISTS idx_estimate_line_items_vendor_id ON public.estimate_line_items(vendor_id);

-- ==============================================================
-- ATTACHMENTS TABLE (Photos, Documents, Files)
-- ==============================================================

CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    
    -- Reference Information (polymorphic)
    entity_type VARCHAR(50) NOT NULL, -- 'job', 'estimate', 'repair_order', 'claim', 'customer', 'vehicle'
    entity_id UUID NOT NULL,
    
    -- File Information
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    file_extension VARCHAR(10),
    
    -- Attachment Details
    title VARCHAR(255),
    description TEXT,
    category VARCHAR(50), -- 'photo', 'document', 'estimate', 'invoice', 'blueprint', 'signature'
    subcategory VARCHAR(50), -- 'damage', 'repair', 'before', 'after', 'progress'
    
    -- Photo Metadata
    taken_at TIMESTAMPTZ,
    location VARCHAR(100),
    camera_info JSONB,
    
    -- Document Metadata
    document_type VARCHAR(50),
    document_date DATE,
    
    -- Access Control
    is_public BOOLEAN DEFAULT false,
    is_customer_visible BOOLEAN DEFAULT true,
    
    -- Processing Status
    processing_status VARCHAR(20) DEFAULT 'ready', -- 'uploading', 'processing', 'ready', 'error'
    thumbnail_path VARCHAR(500),
    
    -- Tags and Organization
    tags TEXT[],
    
    -- Upload Information
    uploaded_by UUID REFERENCES public.users(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for attachments
CREATE INDEX IF NOT EXISTS idx_attachments_shop_id ON public.attachments(shop_id);
CREATE INDEX IF NOT EXISTS idx_attachments_entity ON public.attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_attachments_category ON public.attachments(category);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON public.attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_at ON public.attachments(uploaded_at);

-- ==============================================================
-- INVOICES TABLE
-- ==============================================================

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    repair_order_id UUID REFERENCES public.repair_orders(id),
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    claim_id UUID REFERENCES public.claims(id),
    
    -- Invoice Details
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    status invoice_status DEFAULT 'draft',
    
    -- Financial Breakdown
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(12,2) DEFAULT 0.00,
    balance_due DECIMAL(12,2) DEFAULT 0.00,
    
    -- Insurance Information
    insurance_company_id UUID REFERENCES public.insurance_companies(id),
    claim_number VARCHAR(50),
    deductible_amount DECIMAL(10,2),
    insurance_portion DECIMAL(12,2) DEFAULT 0.00,
    customer_portion DECIMAL(12,2) DEFAULT 0.00,
    
    -- Payment Information
    payment_terms VARCHAR(50),
    payment_method VARCHAR(50),
    payment_date DATE,
    payment_reference VARCHAR(100),
    
    -- Document Paths
    pdf_path VARCHAR(500),
    
    -- Notes
    notes TEXT,
    payment_notes TEXT,
    
    -- Audit
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for invoices
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_shop_id ON public.invoices(shop_id);
CREATE INDEX IF NOT EXISTS idx_invoices_repair_order_id ON public.invoices(repair_order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON public.invoices(invoice_date);

-- ==============================================================
-- TRIGGERS FOR UPDATED_AT
-- ==============================================================

-- Add updated_at triggers for all new tables
DO $$ BEGIN
    CREATE TRIGGER update_bms_imports_updated_at BEFORE UPDATE ON public.bms_imports
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_insurance_companies_updated_at BEFORE UPDATE ON public.insurance_companies
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON public.claims
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_repair_orders_updated_at BEFORE UPDATE ON public.repair_orders
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_parts_orders_updated_at BEFORE UPDATE ON public.parts_orders
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_parts_order_items_updated_at BEFORE UPDATE ON public.parts_order_items
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_estimate_line_items_updated_at BEFORE UPDATE ON public.estimate_line_items
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_attachments_updated_at BEFORE UPDATE ON public.attachments
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================
-- RLS POLICIES FOR COLLISION REPAIR TABLES
-- ==============================================================

-- Enable RLS on all new tables
ALTER TABLE public.bms_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all collision repair tables
-- BMS Imports policies
CREATE POLICY "BMS imports are viewable by shop members" ON public.bms_imports
    FOR SELECT USING (user_belongs_to_shop(shop_id));
CREATE POLICY "Shop members can manage BMS imports" ON public.bms_imports
    FOR ALL USING (user_belongs_to_shop(shop_id) AND has_permission(auth.uid(), 'bms.manage'));

-- Insurance Companies policies
CREATE POLICY "Insurance companies are viewable by shop members" ON public.insurance_companies
    FOR SELECT USING (user_belongs_to_shop(shop_id));
CREATE POLICY "Shop members can manage insurance companies" ON public.insurance_companies
    FOR ALL USING (user_belongs_to_shop(shop_id) AND has_permission(auth.uid(), 'insurance.manage'));

-- Claims policies
CREATE POLICY "Claims are viewable by shop members" ON public.claims
    FOR SELECT USING (user_belongs_to_shop(shop_id));
CREATE POLICY "Shop members can manage claims" ON public.claims
    FOR ALL USING (user_belongs_to_shop(shop_id) AND has_permission(auth.uid(), 'claims.manage'));

-- Repair Orders policies
CREATE POLICY "Repair orders are viewable by shop members" ON public.repair_orders
    FOR SELECT USING (user_belongs_to_shop(shop_id));
CREATE POLICY "Shop members can manage repair orders" ON public.repair_orders
    FOR ALL USING (user_belongs_to_shop(shop_id) AND has_permission(auth.uid(), 'repair_orders.manage'));

-- Parts Orders policies
CREATE POLICY "Parts orders are viewable by shop members" ON public.parts_orders
    FOR SELECT USING (user_belongs_to_shop(shop_id));
CREATE POLICY "Shop members can manage parts orders" ON public.parts_orders
    FOR ALL USING (user_belongs_to_shop(shop_id) AND has_permission(auth.uid(), 'parts_orders.manage'));

-- Parts Order Items policies
CREATE POLICY "Parts order items are viewable by shop members" ON public.parts_order_items
    FOR SELECT USING (EXISTS(SELECT 1 FROM public.parts_orders WHERE id = parts_order_id AND user_belongs_to_shop(shop_id)));
CREATE POLICY "Shop members can manage parts order items" ON public.parts_order_items
    FOR ALL USING (EXISTS(SELECT 1 FROM public.parts_orders WHERE id = parts_order_id AND user_belongs_to_shop(shop_id) AND has_permission(auth.uid(), 'parts_orders.manage')));

-- Estimate Line Items policies
CREATE POLICY "Estimate line items are viewable by shop members" ON public.estimate_line_items
    FOR SELECT USING (EXISTS(SELECT 1 FROM public.estimates WHERE id = estimate_id AND user_belongs_to_shop(shop_id)));
CREATE POLICY "Shop members can manage estimate line items" ON public.estimate_line_items
    FOR ALL USING (EXISTS(SELECT 1 FROM public.estimates WHERE id = estimate_id AND user_belongs_to_shop(shop_id) AND has_permission(auth.uid(), 'estimates.manage')));

-- Attachments policies
CREATE POLICY "Attachments are viewable by shop members" ON public.attachments
    FOR SELECT USING (user_belongs_to_shop(shop_id));
CREATE POLICY "Shop members can manage attachments" ON public.attachments
    FOR ALL USING (user_belongs_to_shop(shop_id) AND has_permission(auth.uid(), 'attachments.manage'));

-- Invoices policies
CREATE POLICY "Invoices are viewable by shop members" ON public.invoices
    FOR SELECT USING (user_belongs_to_shop(shop_id));
CREATE POLICY "Shop members can manage invoices" ON public.invoices
    FOR ALL USING (user_belongs_to_shop(shop_id) AND has_permission(auth.uid(), 'invoices.manage'));

-- ==============================================================
-- REALTIME SUBSCRIPTIONS
-- ==============================================================

-- Add new tables to realtime (safe)
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bms_imports;
EXCEPTION
    WHEN undefined_object THEN null;
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.claims;
EXCEPTION
    WHEN undefined_object THEN null;
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.repair_orders;
EXCEPTION
    WHEN undefined_object THEN null;
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.parts_orders;
EXCEPTION
    WHEN undefined_object THEN null;
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================
-- COLLISION REPAIR HELPER FUNCTIONS
-- ==============================================================

-- Function to generate repair order numbers
CREATE OR REPLACE FUNCTION generate_ro_number(shop_uuid UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    next_number INTEGER;
    year_suffix VARCHAR(4);
BEGIN
    year_suffix := EXTRACT(year FROM CURRENT_DATE)::TEXT;
    
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(ro_number FROM 10) AS INTEGER)), 
        0
    ) + 1 INTO next_number
    FROM public.repair_orders 
    WHERE shop_id = shop_uuid 
    AND ro_number ~ '^RO-' || year_suffix || '-\d{4}$';
    
    RETURN 'RO-' || year_suffix || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate PO numbers with RO reference
CREATE OR REPLACE FUNCTION generate_po_number(shop_uuid UUID, ro_num VARCHAR DEFAULT NULL)
RETURNS VARCHAR(50) AS $$
DECLARE
    next_number INTEGER;
    year_month VARCHAR(4);
    vendor_code VARCHAR(4) DEFAULT 'GEN';
BEGIN
    year_month := TO_CHAR(CURRENT_DATE, 'YYMM');
    
    -- If RO number provided, extract sequence
    IF ro_num IS NOT NULL THEN
        SELECT COALESCE(
            MAX(CAST(SUBSTRING(po_number FROM LENGTH(ro_num || '-' || year_month || '-' || vendor_code || '-') + 1) AS INTEGER)), 
            0
        ) + 1 INTO next_number
        FROM public.parts_orders 
        WHERE shop_id = shop_uuid 
        AND po_number LIKE ro_num || '-' || year_month || '-' || vendor_code || '-%';
        
        RETURN ro_num || '-' || year_month || '-' || vendor_code || '-' || LPAD(next_number::TEXT, 3, '0');
    ELSE
        -- Standard PO numbering
        SELECT COALESCE(
            MAX(CAST(SUBSTRING(po_number FROM 12) AS INTEGER)), 
            0
        ) + 1 INTO next_number
        FROM public.parts_orders 
        WHERE shop_id = shop_uuid 
        AND po_number ~ '^PO-' || year_month || '-\d{4}$';
        
        RETURN 'PO-' || year_month || '-' || LPAD(next_number::TEXT, 4, '0');
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================
-- COMPLETION MESSAGE
-- ==============================================================

-- Insert completion log
DO $$
BEGIN
    RAISE NOTICE '✅ CollisionOS Collision Repair Schema deployed successfully!';
    RAISE NOTICE 'Added 9 collision repair tables:';
    RAISE NOTICE '  - bms_imports (BMS/XML processing)';
    RAISE NOTICE '  - insurance_companies (Insurance/DRP management)';
    RAISE NOTICE '  - claims (Insurance claim lifecycle)'; 
    RAISE NOTICE '  - repair_orders (1:1 claim relationship)';
    RAISE NOTICE '  - parts_orders (Purchase order workflow)';
    RAISE NOTICE '  - parts_order_items (PO line items)';
    RAISE NOTICE '  - estimate_line_items (Detailed estimates)';
    RAISE NOTICE '  - attachments (Photos/documents)';
    RAISE NOTICE '  - invoices (Financial management)';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 All tables secured with RLS policies';
    RAISE NOTICE '⚡ Real-time subscriptions enabled';
    RAISE NOTICE '🔧 Helper functions created for numbering';
END $$;
-- ==============================================================
-- POST-DEPLOYMENT VERIFICATION
-- ==============================================================

-- Verify collision repair tables were created
DO $$
DECLARE
    table_count INTEGER;
    tables_created TEXT[];
BEGIN
    -- Count collision repair tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
        'bms_imports', 'insurance_companies', 'claims', 'repair_orders',
        'parts_orders', 'parts_order_items', 'estimate_line_items',
        'attachments', 'invoices'
    );

    -- Get list of created tables
    SELECT ARRAY_AGG(table_name) INTO tables_created
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
        'bms_imports', 'insurance_companies', 'claims', 'repair_orders',
        'parts_orders', 'parts_order_items', 'estimate_line_items',
        'attachments', 'invoices'
    );

    IF table_count = 9 THEN
        RAISE NOTICE '✅ Collision repair schema deployment completed successfully!';
        RAISE NOTICE 'Created % tables: %', table_count, tables_created;
        RAISE NOTICE '';
        RAISE NOTICE '🚀 Next steps:';
        RAISE NOTICE '  1. Deploy BMS ingestion Edge Function';
        RAISE NOTICE '  2. Run sample data seeding';
        RAISE NOTICE '  3. Test BMS XML ingestion pipeline';
        RAISE NOTICE '  4. Configure realtime subscriptions';
    ELSE
        RAISE WARNING 'Incomplete deployment: Only % of 9 expected tables created', table_count;
        RAISE WARNING 'Created tables: %', tables_created;
    END IF;
END $$;

-- Enable Row Level Security on all collision repair tables
ALTER TABLE public.bms_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Grant permissions for authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

RAISE NOTICE '🔒 Row Level Security enabled on all collision repair tables';
RAISE NOTICE '✅ Migration 20250928_01_collision_repair_schema completed successfully!';
