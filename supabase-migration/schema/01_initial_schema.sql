-- ==============================================================
-- CollisionOS Supabase Migration - Initial Schema
-- File: 01_initial_schema.sql
-- Description: Core tables and basic structure
-- ==============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ==============================================================
-- ENUMS AND TYPES
-- ==============================================================

-- Create user roles enum
CREATE TYPE user_role AS ENUM (
    'owner',
    'manager',
    'service_advisor',
    'estimator',
    'technician',
    'parts_manager',
    'receptionist',
    'accountant',
    'admin'
);

-- Create customer enums
CREATE TYPE customer_type AS ENUM ('individual', 'business', 'insurance', 'fleet');
CREATE TYPE customer_status AS ENUM ('active', 'inactive', 'prospect', 'vip');
CREATE TYPE preferred_contact AS ENUM ('phone', 'email', 'sms', 'mail');
CREATE TYPE payment_terms AS ENUM ('immediate', 'net_15', 'net_30', 'net_60');

-- Create vehicle enums
CREATE TYPE body_style AS ENUM (
    'sedan', 'suv', 'truck', 'coupe', 'convertible', 
    'wagon', 'hatchback', 'van', 'motorcycle', 'other'
);
CREATE TYPE fuel_type AS ENUM (
    'gasoline', 'diesel', 'hybrid', 'electric', 
    'plug_in_hybrid', 'hydrogen', 'other'
);
CREATE TYPE vehicle_status AS ENUM (
    'active', 'inactive', 'totaled', 'sold', 'stolen', 'recovered'
);
CREATE TYPE warranty_type AS ENUM (
    'manufacturer', 'extended', 'certified_pre_owned', 'none'
);
CREATE TYPE mileage_unit AS ENUM ('miles', 'kilometers');

-- Create vendor enums
CREATE TYPE vendor_type AS ENUM (
    'oem', 'aftermarket', 'recycled', 'remanufactured',
    'paint_supplier', 'equipment_supplier', 'service_provider', 'other'
);
CREATE TYPE vendor_status AS ENUM ('active', 'inactive', 'suspended', 'blacklisted');
CREATE TYPE integration_type AS ENUM ('manual', 'api', 'edi', 'web_portal');

-- Create parts enums
CREATE TYPE part_category AS ENUM (
    'body', 'mechanical', 'electrical', 'interior', 
    'exterior', 'paint', 'glass', 'tire', 'wheel', 
    'accessory', 'other'
);
CREATE TYPE part_type AS ENUM (
    'oem', 'aftermarket', 'recycled', 'remanufactured', 'generic', 'custom'
);
CREATE TYPE part_status AS ENUM (
    'active', 'discontinued', 'backordered', 'obsolete', 'recalled'
);
CREATE TYPE part_warranty_type AS ENUM ('manufacturer', 'vendor', 'shop', 'none');

-- Create audit enum
CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- ==============================================================
-- SHOPS TABLE
-- Core table for multi-tenant architecture
-- ==============================================================

CREATE TABLE public.shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    fax VARCHAR(20),
    website VARCHAR(255),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) NOT NULL DEFAULT 'Canada',
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/Toronto',
    currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
    tax_number VARCHAR(50),
    gst_number VARCHAR(50),
    pst_number VARCHAR(50),
    hst_number VARCHAR(50),
    logo VARCHAR(255),
    settings JSONB DEFAULT '{
        "laborRate": 65.00,
        "paintAndMaterialsRate": 45.00,
        "workingHours": {
            "monday": {"start": "08:00", "end": "17:00", "enabled": true},
            "tuesday": {"start": "08:00", "end": "17:00", "enabled": true},
            "wednesday": {"start": "08:00", "end": "17:00", "enabled": true},
            "thursday": {"start": "08:00", "end": "17:00", "enabled": true},
            "friday": {"start": "08:00", "end": "17:00", "enabled": true},
            "saturday": {"start": "09:00", "end": "15:00", "enabled": false},
            "sunday": {"start": "09:00", "end": "15:00", "enabled": false}
        },
        "autoBackup": true,
        "backupFrequency": "daily",
        "notifications": {
            "email": true,
            "sms": false,
            "push": true
        },
        "integrations": {
            "cccOne": {"enabled": false, "apiKey": "", "endpoint": ""},
            "mitchell": {"enabled": false, "apiKey": "", "endpoint": ""},
            "audatex": {"enabled": false, "apiKey": "", "endpoint": ""},
            "webEst": {"enabled": false, "apiKey": "", "endpoint": ""}
        }
    }'::jsonb,
    subscription JSONB DEFAULT '{
        "plan": "starter",
        "status": "active",
        "startDate": null,
        "endDate": null,
        "maxUsers": 5,
        "maxJobs": 50,
        "features": ["basic_dashboard", "job_management", "customer_management"]
    }'::jsonb,
    license_key VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_trial BOOLEAN NOT NULL DEFAULT true,
    trial_expires_at TIMESTAMPTZ,
    last_backup TIMESTAMPTZ,
    setup_completed BOOLEAN NOT NULL DEFAULT false,
    onboarding_step INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for shops table
CREATE INDEX idx_shops_name ON public.shops(name);
CREATE INDEX idx_shops_email ON public.shops(email);
CREATE INDEX idx_shops_is_active ON public.shops(is_active);
CREATE INDEX idx_shops_setup_completed ON public.shops(setup_completed);

-- ==============================================================
-- USERS TABLE
-- User management with role-based permissions
-- ==============================================================

CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role user_role NOT NULL DEFAULT 'technician',
    permissions JSONB DEFAULT '{}'::jsonb,
    phone VARCHAR(20),
    mobile VARCHAR(20),
    employee_id VARCHAR(20) UNIQUE,
    hire_date DATE,
    termination_date DATE,
    hourly_rate DECIMAL(10,2),
    commission_rate DECIMAL(5,2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_online BOOLEAN NOT NULL DEFAULT false,
    last_login TIMESTAMPTZ,
    last_activity TIMESTAMPTZ,
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    avatar VARCHAR(255),
    signature TEXT,
    notes TEXT,
    preferences JSONB DEFAULT '{}'::jsonb,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMPTZ,
    email_verification_token VARCHAR(255),
    email_verified BOOLEAN DEFAULT false,
    login_attempts INTEGER DEFAULT 0,
    lock_until TIMESTAMPTZ,
    department VARCHAR(50),
    supervisor_id UUID REFERENCES public.users(id),
    emergency_contact JSONB,
    certifications JSONB DEFAULT '[]'::jsonb,
    skills JSONB DEFAULT '[]'::jsonb,
    availability JSONB DEFAULT '{}'::jsonb,
    max_jobs INTEGER DEFAULT 5,
    current_jobs INTEGER DEFAULT 0,
    efficiency DECIMAL(5,2) DEFAULT 100.00,
    quality_score DECIMAL(5,2) DEFAULT 100.00,
    customer_satisfaction DECIMAL(5,2) DEFAULT 100.00,
    total_hours DECIMAL(10,2) DEFAULT 0.00,
    overtime_hours DECIMAL(10,2) DEFAULT 0.00,
    vacation_days INTEGER DEFAULT 0,
    sick_days INTEGER DEFAULT 0,
    personal_days INTEGER DEFAULT 0,
    clock_in_time TIMESTAMPTZ,
    clock_out_time TIMESTAMPTZ,
    is_clocked_in BOOLEAN DEFAULT false,
    current_location VARCHAR(100),
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    session_token VARCHAR(255),
    refresh_token VARCHAR(255),
    token_expires_at TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked BOOLEAN DEFAULT false,
    lock_reason VARCHAR(255),
    unlock_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for users table
CREATE UNIQUE INDEX idx_users_username ON public.users(username);
CREATE UNIQUE INDEX idx_users_email ON public.users(email);
CREATE UNIQUE INDEX idx_users_employee_id ON public.users(employee_id) WHERE employee_id IS NOT NULL;
CREATE INDEX idx_users_shop_id ON public.users(shop_id);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_is_active ON public.users(is_active);
CREATE INDEX idx_users_is_online ON public.users(is_online);
CREATE INDEX idx_users_last_login ON public.users(last_login);
CREATE INDEX idx_users_supervisor_id ON public.users(supervisor_id);
CREATE INDEX idx_users_department ON public.users(department);

-- ==============================================================
-- CUSTOMERS TABLE
-- Customer management
-- ==============================================================

CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    customer_number VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'Canada',
    date_of_birth DATE,
    driver_license VARCHAR(50),
    preferred_contact preferred_contact DEFAULT 'phone',
    sms_opt_in BOOLEAN DEFAULT false,
    email_opt_in BOOLEAN DEFAULT true,
    marketing_opt_in BOOLEAN DEFAULT false,
    customer_type customer_type DEFAULT 'individual',
    customer_status customer_status DEFAULT 'active',
    company_name VARCHAR(255),
    tax_id VARCHAR(50),
    credit_limit DECIMAL(12,2) DEFAULT 0.00,
    payment_terms payment_terms DEFAULT 'immediate',
    loyalty_points INTEGER DEFAULT 0,
    referral_source VARCHAR(100),
    notes TEXT,
    first_visit_date TIMESTAMPTZ,
    last_visit_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for customers table
CREATE UNIQUE INDEX idx_customers_customer_number ON public.customers(customer_number);
CREATE INDEX idx_customers_shop_id ON public.customers(shop_id);
CREATE INDEX idx_customers_name ON public.customers(first_name, last_name);
CREATE INDEX idx_customers_email ON public.customers(email);
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_customers_customer_type ON public.customers(customer_type);
CREATE INDEX idx_customers_customer_status ON public.customers(customer_status);
CREATE INDEX idx_customers_is_active ON public.customers(is_active);

-- ==============================================================
-- VEHICLES TABLE
-- Vehicle management and VIN tracking
-- ==============================================================

CREATE TABLE public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    vin VARCHAR(17) NOT NULL UNIQUE CHECK (length(vin) = 17),
    license_plate VARCHAR(20),
    state VARCHAR(50),
    year INTEGER NOT NULL CHECK (year >= 1900 AND year <= EXTRACT(year FROM CURRENT_DATE) + 1),
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    trim VARCHAR(100),
    body_style body_style,
    color VARCHAR(50),
    color_code VARCHAR(20),
    engine_size VARCHAR(50),
    engine_type VARCHAR(50),
    transmission VARCHAR(50),
    fuel_type fuel_type,
    mileage INTEGER,
    mileage_unit mileage_unit DEFAULT 'kilometers',
    insurance_company VARCHAR(100),
    policy_number VARCHAR(50),
    claim_number VARCHAR(50),
    deductible DECIMAL(10,2),
    vehicle_status vehicle_status DEFAULT 'active',
    last_service_date DATE,
    next_service_date DATE,
    service_interval INTEGER,
    warranty_expiry DATE,
    warranty_type warranty_type,
    features JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for vehicles table
CREATE UNIQUE INDEX idx_vehicles_vin ON public.vehicles(vin);
CREATE INDEX idx_vehicles_customer_id ON public.vehicles(customer_id);
CREATE INDEX idx_vehicles_shop_id ON public.vehicles(shop_id);
CREATE INDEX idx_vehicles_make_model ON public.vehicles(make, model);
CREATE INDEX idx_vehicles_year ON public.vehicles(year);
CREATE INDEX idx_vehicles_license_plate ON public.vehicles(license_plate);
CREATE INDEX idx_vehicles_vehicle_status ON public.vehicles(vehicle_status);
CREATE INDEX idx_vehicles_is_active ON public.vehicles(is_active);

-- ==============================================================
-- VENDORS TABLE
-- Vendor and supplier management
-- ==============================================================

CREATE TABLE public.vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    vendor_number VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
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
    vendor_type vendor_type DEFAULT 'aftermarket',
    vendor_status vendor_status DEFAULT 'active',
    tax_id VARCHAR(50),
    business_license VARCHAR(50),
    payment_terms payment_terms DEFAULT 'net_30',
    credit_limit DECIMAL(12,2),
    current_balance DECIMAL(12,2) DEFAULT 0.00,
    average_delivery_time INTEGER, -- in days
    fill_rate DECIMAL(5,2), -- percentage
    return_rate DECIMAL(5,2), -- percentage
    quality_rating DECIMAL(3,1), -- 1-10 scale
    api_endpoint VARCHAR(255),
    api_key VARCHAR(255),
    integration_type integration_type DEFAULT 'manual',
    specializations JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    preferences JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for vendors table
CREATE UNIQUE INDEX idx_vendors_vendor_number ON public.vendors(vendor_number);
CREATE INDEX idx_vendors_shop_id ON public.vendors(shop_id);
CREATE INDEX idx_vendors_name ON public.vendors(name);
CREATE INDEX idx_vendors_vendor_type ON public.vendors(vendor_type);
CREATE INDEX idx_vendors_vendor_status ON public.vendors(vendor_status);
CREATE INDEX idx_vendors_is_active ON public.vendors(is_active);

-- ==============================================================
-- PARTS TABLE
-- Parts inventory and management
-- ==============================================================

CREATE TABLE public.parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    part_number VARCHAR(100) NOT NULL,
    oem_part_number VARCHAR(100),
    description TEXT NOT NULL,
    category part_category NOT NULL,
    subcategory VARCHAR(100),
    part_type part_type NOT NULL DEFAULT 'oem',
    make VARCHAR(100),
    model VARCHAR(100),
    year_from INTEGER,
    year_to INTEGER,
    weight DECIMAL(8,2),
    dimensions JSONB,
    color VARCHAR(50),
    current_stock INTEGER NOT NULL DEFAULT 0,
    minimum_stock INTEGER NOT NULL DEFAULT 0,
    maximum_stock INTEGER,
    reorder_point INTEGER,
    reorder_quantity INTEGER,
    location VARCHAR(100),
    bin_number VARCHAR(50),
    shelf_number VARCHAR(50),
    cost_price DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    markup_percentage DECIMAL(5,2),
    primary_vendor_id UUID REFERENCES public.vendors(id),
    vendor_part_number VARCHAR(100),
    warranty_period INTEGER,
    warranty_type part_warranty_type,
    is_core BOOLEAN DEFAULT false,
    core_value DECIMAL(10,2),
    core_return_required BOOLEAN DEFAULT false,
    part_status part_status DEFAULT 'active',
    is_active BOOLEAN DEFAULT true,
    last_order_date DATE,
    last_received_date DATE,
    last_sold_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for parts table
CREATE INDEX idx_parts_shop_id ON public.parts(shop_id);
CREATE INDEX idx_parts_part_number ON public.parts(part_number);
CREATE INDEX idx_parts_oem_part_number ON public.parts(oem_part_number);
CREATE INDEX idx_parts_category ON public.parts(category);
CREATE INDEX idx_parts_part_type ON public.parts(part_type);
CREATE INDEX idx_parts_make_model ON public.parts(make, model);
CREATE INDEX idx_parts_year_range ON public.parts(year_from, year_to);
CREATE INDEX idx_parts_vendor_id ON public.parts(primary_vendor_id);
CREATE INDEX idx_parts_part_status ON public.parts(part_status);
CREATE INDEX idx_parts_is_active ON public.parts(is_active);
CREATE INDEX idx_parts_stock_levels ON public.parts(current_stock, minimum_stock);

-- ==============================================================
-- AUDIT TRAIL TABLE
-- Track all changes across the system
-- ==============================================================

CREATE TABLE public.audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action audit_action NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    user_id UUID REFERENCES public.users(id),
    user_email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for audit_trail table
CREATE INDEX idx_audit_trail_shop_id ON public.audit_trail(shop_id);
CREATE INDEX idx_audit_trail_table_record ON public.audit_trail(table_name, record_id);
CREATE INDEX idx_audit_trail_timestamp ON public.audit_trail(timestamp);
CREATE INDEX idx_audit_trail_user_id ON public.audit_trail(user_id);

-- ==============================================================
-- FUNCTIONS
-- ==============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate customer numbers
CREATE OR REPLACE FUNCTION generate_customer_number(shop_uuid UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
    next_number INTEGER;
BEGIN
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(customer_number FROM 6) AS INTEGER)), 
        0
    ) + 1 INTO next_number
    FROM public.customers 
    WHERE shop_id = shop_uuid 
    AND customer_number ~ '^CUST-\d{4}$';
    
    RETURN 'CUST-' || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate vendor numbers
CREATE OR REPLACE FUNCTION generate_vendor_number(shop_uuid UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
    next_number INTEGER;
BEGIN
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(vendor_number FROM 6) AS INTEGER)), 
        0
    ) + 1 INTO next_number
    FROM public.vendors 
    WHERE shop_id = shop_uuid 
    AND vendor_number ~ '^VEND-\d{4}$';
    
    RETURN 'VEND-' || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ==============================================================
-- TRIGGERS
-- ==============================================================

-- Updated_at triggers for all tables
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON public.shops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON public.parts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();