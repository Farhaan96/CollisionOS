-- =====================================================================
-- CollisionOS Supabase Migration - Core Tables
-- Generated: 2025-01-21
-- Description: Core foundation tables for shops, users, customers, vehicles
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- SHOPS TABLE
-- =====================================================================
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  business_number VARCHAR(50),
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  country VARCHAR(50) DEFAULT 'Canada',
  timezone VARCHAR(50) DEFAULT 'America/Vancouver',
  currency VARCHAR(10) DEFAULT 'CAD',

  -- Business settings
  labor_rate DECIMAL(10, 2) DEFAULT 100.00,
  paint_labor_rate DECIMAL(10, 2) DEFAULT 100.00,
  body_labor_rate DECIMAL(10, 2) DEFAULT 100.00,
  mechanical_labor_rate DECIMAL(10, 2) DEFAULT 100.00,

  -- Tax settings
  tax_number VARCHAR(50),
  pst_rate DECIMAL(5, 2) DEFAULT 0.00,
  gst_rate DECIMAL(5, 2) DEFAULT 5.00,
  hst_rate DECIMAL(5, 2) DEFAULT 0.00,

  -- Logo and branding
  logo_url VARCHAR(500),
  primary_color VARCHAR(10) DEFAULT '#1976d2',
  secondary_color VARCHAR(10) DEFAULT '#dc004e',

  -- Settings JSON
  settings JSONB DEFAULT '{}',
  business_hours JSONB DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT true,
  subscription_tier VARCHAR(50) DEFAULT 'basic',
  subscription_status VARCHAR(50) DEFAULT 'active',

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shops_is_active ON shops(is_active);
CREATE INDEX idx_shops_subscription ON shops(subscription_tier, subscription_status);

-- =====================================================================
-- USERS TABLE
-- =====================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,

  -- Authentication
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,

  -- Personal info
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  mobile VARCHAR(20),
  avatar VARCHAR(255),

  -- Role and permissions
  role VARCHAR(50) NOT NULL DEFAULT 'technician'
    CHECK (role IN ('owner', 'manager', 'service_advisor', 'estimator',
                   'technician', 'parts_manager', 'receptionist', 'accountant', 'admin')),
  permissions JSONB DEFAULT '{}',

  -- Employment info
  employee_id VARCHAR(20) UNIQUE,
  hire_date DATE,
  termination_date DATE,
  hourly_rate DECIMAL(10, 2),
  commission_rate DECIMAL(5, 2),
  department VARCHAR(50),
  supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Work status
  is_active BOOLEAN DEFAULT true,
  is_online BOOLEAN DEFAULT false,
  last_login TIMESTAMPTZ,
  last_activity TIMESTAMPTZ,

  -- Time tracking
  is_clocked_in BOOLEAN DEFAULT false,
  clock_in_time TIMESTAMPTZ,
  clock_out_time TIMESTAMPTZ,
  total_hours DECIMAL(10, 2) DEFAULT 0.00,
  overtime_hours DECIMAL(10, 2) DEFAULT 0.00,

  -- Leave tracking
  vacation_days INTEGER DEFAULT 0,
  sick_days INTEGER DEFAULT 0,
  personal_days INTEGER DEFAULT 0,

  -- Performance metrics
  efficiency DECIMAL(5, 2) DEFAULT 100.00,
  quality_score DECIMAL(5, 2) DEFAULT 100.00,
  customer_satisfaction DECIMAL(5, 2) DEFAULT 100.00,
  max_jobs INTEGER DEFAULT 5,
  current_jobs INTEGER DEFAULT 0,

  -- Preferences
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(10) DEFAULT 'en',
  preferences JSONB DEFAULT '{}',

  -- Security
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMPTZ,
  email_verification_token VARCHAR(255),
  email_verified BOOLEAN DEFAULT false,

  -- Account security
  login_attempts INTEGER DEFAULT 0,
  failed_login_attempts INTEGER DEFAULT 0,
  account_locked BOOLEAN DEFAULT false,
  lock_until TIMESTAMPTZ,
  lock_reason VARCHAR(255),
  unlock_at TIMESTAMPTZ,

  -- Session management
  session_token VARCHAR(255),
  refresh_token VARCHAR(255),
  token_expires_at TIMESTAMPTZ,

  -- Device tracking
  current_location VARCHAR(100),
  device_info JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- Professional info
  signature TEXT,
  notes TEXT,
  emergency_contact JSONB,
  certifications JSONB DEFAULT '[]',
  skills JSONB DEFAULT '[]',
  availability JSONB DEFAULT '{}',

  -- Audit
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_shop_id ON users(shop_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_supervisor_id ON users(supervisor_id);
CREATE INDEX idx_users_employee_id ON users(employee_id);

-- =====================================================================
-- CUSTOMERS TABLE
-- =====================================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,

  -- Identification
  customer_number VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  driver_license VARCHAR(50),
  date_of_birth DATE,

  -- Address
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  country VARCHAR(50) DEFAULT 'Canada',

  -- Communication preferences
  preferred_contact VARCHAR(20) DEFAULT 'phone'
    CHECK (preferred_contact IN ('phone', 'email', 'sms', 'mail')),
  sms_opt_in BOOLEAN DEFAULT false,
  email_opt_in BOOLEAN DEFAULT true,
  marketing_opt_in BOOLEAN DEFAULT false,

  -- Classification
  customer_type VARCHAR(20) DEFAULT 'individual'
    CHECK (customer_type IN ('individual', 'business', 'insurance', 'fleet')),
  customer_status VARCHAR(20) DEFAULT 'active'
    CHECK (customer_status IN ('active', 'inactive', 'prospect', 'vip')),

  -- Insurance info (collision repair specific)
  primary_insurance_company VARCHAR(100),
  policy_number VARCHAR(50),
  deductible DECIMAL(8, 2),

  -- Business customer fields
  company_name VARCHAR(255),
  tax_id VARCHAR(50),

  -- Financial
  credit_limit DECIMAL(12, 2) DEFAULT 0.00,
  payment_terms VARCHAR(20) DEFAULT 'immediate'
    CHECK (payment_terms IN ('immediate', 'net_15', 'net_30', 'net_60')),

  -- Loyalty and marketing
  loyalty_points INTEGER DEFAULT 0,
  referral_source VARCHAR(100),

  -- Notes and history
  notes TEXT,
  first_visit_date TIMESTAMPTZ,
  last_visit_date TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_shop_id ON customers(shop_id);
CREATE INDEX idx_customers_customer_number ON customers(customer_number);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_is_active ON customers(is_active);
CREATE INDEX idx_customers_customer_type ON customers(customer_type);
CREATE INDEX idx_customers_customer_status ON customers(customer_status);

-- =====================================================================
-- VEHICLES TABLE
-- =====================================================================
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- Vehicle identification
  vin VARCHAR(17) UNIQUE,
  year INTEGER NOT NULL,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  trim VARCHAR(100),
  body_style VARCHAR(50),
  engine VARCHAR(100),
  transmission VARCHAR(100),

  -- Registration
  license_plate VARCHAR(20),
  plate_state VARCHAR(50),
  registration_expiry DATE,

  -- Appearance
  exterior_color VARCHAR(50),
  interior_color VARCHAR(50),
  paint_code VARCHAR(50),

  -- Status and usage
  odometer INTEGER,
  odometer_unit VARCHAR(10) DEFAULT 'km',
  fuel_type VARCHAR(20),

  -- Insurance info
  insurance_company VARCHAR(100),
  insurance_policy VARCHAR(50),
  insurance_expiry DATE,

  -- Decoded VIN data
  vin_decoded JSONB,
  decoded_at TIMESTAMPTZ,

  -- Vehicle details
  vehicle_type VARCHAR(50),
  weight_class VARCHAR(20),
  drive_type VARCHAR(20),
  fuel_capacity DECIMAL(8, 2),

  -- Features and equipment
  features JSONB DEFAULT '[]',
  has_adas BOOLEAN DEFAULT false,
  adas_systems JSONB DEFAULT '[]',

  -- Notes
  notes TEXT,
  special_instructions TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_shop_id ON vehicles(shop_id);
CREATE INDEX idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX idx_vehicles_vin ON vehicles(vin);
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX idx_vehicles_year_make_model ON vehicles(year, make, model);
CREATE INDEX idx_vehicles_is_active ON vehicles(is_active);

-- =====================================================================
-- INSURANCE COMPANIES TABLE
-- =====================================================================
CREATE TABLE insurance_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,

  -- Company info
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  website VARCHAR(255),

  -- Contact info
  phone VARCHAR(20),
  email VARCHAR(255),
  fax VARCHAR(20),

  -- Address
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  country VARCHAR(50) DEFAULT 'Canada',

  -- DRP (Direct Repair Program) info
  is_drp BOOLEAN DEFAULT false,
  drp_number VARCHAR(50),
  drp_agreement_date DATE,
  drp_tier VARCHAR(50),

  -- Claims processing
  claims_email VARCHAR(255),
  claims_phone VARCHAR(20),
  claims_portal_url VARCHAR(500),
  claims_portal_credentials JSONB,

  -- Payment terms
  payment_terms VARCHAR(50),
  payment_method VARCHAR(50),
  discount_rate DECIMAL(5, 2) DEFAULT 0.00,

  -- BMS integration
  supports_bms BOOLEAN DEFAULT false,
  bms_format VARCHAR(50),
  bms_version VARCHAR(20),

  -- Settings
  settings JSONB DEFAULT '{}',
  notes TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_preferred BOOLEAN DEFAULT false,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_insurance_companies_shop_id ON insurance_companies(shop_id);
CREATE INDEX idx_insurance_companies_name ON insurance_companies(name);
CREATE INDEX idx_insurance_companies_is_drp ON insurance_companies(is_drp);
CREATE INDEX idx_insurance_companies_is_active ON insurance_companies(is_active);

-- =====================================================================
-- VENDORS TABLE
-- =====================================================================
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,

  -- Vendor identification
  vendor_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  vendor_type VARCHAR(50) DEFAULT 'parts'
    CHECK (vendor_type IN ('parts', 'sublet', 'material', 'equipment', 'service', 'other')),

  -- Contact info
  contact_name VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),

  -- Address
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  country VARCHAR(50) DEFAULT 'Canada',

  -- Account info
  account_number VARCHAR(50),
  tax_id VARCHAR(50),

  -- Payment terms
  payment_terms VARCHAR(50) DEFAULT 'net_30',
  payment_method VARCHAR(50),
  discount_rate DECIMAL(5, 2) DEFAULT 0.00,
  credit_limit DECIMAL(12, 2) DEFAULT 0.00,

  -- Parts vendor specific
  parts_catalog_type VARCHAR(50),
  parts_catalog_credentials JSONB,
  supports_api BOOLEAN DEFAULT false,
  api_endpoint VARCHAR(500),
  api_credentials JSONB,

  -- Shipping info
  shipping_method VARCHAR(100),
  average_delivery_days INTEGER DEFAULT 2,
  minimum_order_amount DECIMAL(10, 2) DEFAULT 0.00,
  shipping_fee DECIMAL(10, 2) DEFAULT 0.00,
  free_shipping_threshold DECIMAL(10, 2),

  -- Preferences
  is_preferred BOOLEAN DEFAULT false,
  quality_rating DECIMAL(3, 2) DEFAULT 5.00,
  service_rating DECIMAL(3, 2) DEFAULT 5.00,

  -- Settings
  settings JSONB DEFAULT '{}',
  notes TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendors_shop_id ON vendors(shop_id);
CREATE INDEX idx_vendors_vendor_number ON vendors(vendor_number);
CREATE INDEX idx_vendors_vendor_type ON vendors(vendor_type);
CREATE INDEX idx_vendors_is_active ON vendors(is_active);
CREATE INDEX idx_vendors_is_preferred ON vendors(is_preferred);

-- =====================================================================
-- UPDATE TRIGGERS FOR TIMESTAMPS
-- =====================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_companies_updated_at BEFORE UPDATE ON insurance_companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================================
COMMENT ON TABLE shops IS 'Collision repair shops/organizations';
COMMENT ON TABLE users IS 'Shop employees and system users';
COMMENT ON TABLE customers IS 'Customers with collision repair context';
COMMENT ON TABLE vehicles IS 'Customer vehicles with VIN decoding and ADAS tracking';
COMMENT ON TABLE insurance_companies IS 'Insurance companies with DRP and BMS integration';
COMMENT ON TABLE vendors IS 'Parts suppliers and sublet vendors with API integration';
