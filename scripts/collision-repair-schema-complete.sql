-- ==============================================================
-- CollisionOS Complete Schema Deployment
-- ==============================================================
-- This file contains the complete collision repair schema
-- Execute this in the Supabase SQL Editor to deploy all tables
-- ==============================================================

-- ==============================================================
-- BASIC TABLES
-- ==============================================================

-- Shops table
CREATE TABLE IF NOT EXISTS shops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'technician',
  shop_id UUID REFERENCES shops(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  country VARCHAR(50) DEFAULT 'Canada',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id),
  customer_id UUID REFERENCES customers(id),
  vin VARCHAR(17) UNIQUE,
  year INTEGER,
  make VARCHAR(50),
  model VARCHAR(50),
  trim VARCHAR(100),
  plate VARCHAR(20),
  color VARCHAR(50),
  odometer INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id),
  name VARCHAR(255) NOT NULL,
  site_code VARCHAR(10),
  account_number VARCHAR(50),
  contact_name VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  terms VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insurance companies table
CREATE TABLE IF NOT EXISTS insurance_companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20),
  is_drp BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insurance claims table
CREATE TABLE IF NOT EXISTS insurance_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id),
  insurance_company_id UUID REFERENCES insurance_companies(id),
  customer_id UUID REFERENCES customers(id),
  vehicle_id UUID REFERENCES vehicles(id),
  claim_number VARCHAR(50) UNIQUE NOT NULL,
  claim_status VARCHAR(20) DEFAULT 'open',
  incident_date DATE,
  reported_date DATE,
  adjuster_name VARCHAR(100),
  adjuster_phone VARCHAR(20),
  adjuster_email VARCHAR(255),
  deductible DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Repair orders table
CREATE TABLE IF NOT EXISTS repair_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id),
  claim_id UUID REFERENCES insurance_claims(id),
  customer_id UUID REFERENCES customers(id),
  vehicle_id UUID REFERENCES vehicles(id),
  ro_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'estimate',
  priority VARCHAR(10) DEFAULT 'normal',
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Part lines table
CREATE TABLE IF NOT EXISTS part_lines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id),
  repair_order_id UUID REFERENCES repair_orders(id),
  supplier_id UUID REFERENCES suppliers(id),
  part_number VARCHAR(100),
  description TEXT,
  operation VARCHAR(50),
  brand_type VARCHAR(20),
  status VARCHAR(20) DEFAULT 'needed',
  quantity_needed INTEGER DEFAULT 1,
  quantity_ordered INTEGER DEFAULT 0,
  quantity_received INTEGER DEFAULT 0,
  quantity_installed INTEGER DEFAULT 0,
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id),
  repair_order_id UUID REFERENCES repair_orders(id),
  supplier_id UUID REFERENCES suppliers(id),
  po_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expected_date TIMESTAMP WITH TIME ZONE,
  received_date TIMESTAMP WITH TIME ZONE,
  total_amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BMS imports table
CREATE TABLE IF NOT EXISTS bms_imports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id),
  file_name VARCHAR(255),
  file_size INTEGER,
  import_status VARCHAR(20) DEFAULT 'pending',
  records_processed INTEGER DEFAULT 0,
  records_success INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  import_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================
-- PERFORMANCE INDEXES
-- ==============================================================

-- Repair orders indexes
CREATE INDEX IF NOT EXISTS idx_repair_orders_ro_number ON repair_orders(ro_number);
CREATE INDEX IF NOT EXISTS idx_repair_orders_status ON repair_orders(status);
CREATE INDEX IF NOT EXISTS idx_repair_orders_shop_id ON repair_orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_repair_orders_claim_id ON repair_orders(claim_id);
CREATE INDEX IF NOT EXISTS idx_repair_orders_customer_id ON repair_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_repair_orders_vehicle_id ON repair_orders(vehicle_id);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_shop_id ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Vehicles indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);
CREATE INDEX IF NOT EXISTS idx_vehicles_shop_id ON vehicles(shop_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);

-- Part lines indexes
CREATE INDEX IF NOT EXISTS idx_part_lines_status ON part_lines(status);
CREATE INDEX IF NOT EXISTS idx_part_lines_repair_order_id ON part_lines(repair_order_id);
CREATE INDEX IF NOT EXISTS idx_part_lines_supplier_id ON part_lines(supplier_id);
CREATE INDEX IF NOT EXISTS idx_part_lines_part_number ON part_lines(part_number);

-- Purchase orders indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_shop_id ON purchase_orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);

-- Insurance claims indexes
CREATE INDEX IF NOT EXISTS idx_insurance_claims_claim_number ON insurance_claims(claim_number);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_shop_id ON insurance_claims(shop_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_customer_id ON insurance_claims(customer_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_vehicle_id ON insurance_claims(vehicle_id);

-- BMS imports indexes
CREATE INDEX IF NOT EXISTS idx_bms_imports_shop_id ON bms_imports(shop_id);
CREATE INDEX IF NOT EXISTS idx_bms_imports_status ON bms_imports(import_status);
CREATE INDEX IF NOT EXISTS idx_bms_imports_import_date ON bms_imports(import_date);

-- ==============================================================
-- ROW LEVEL SECURITY
-- ==============================================================

-- Enable RLS on all tables
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_imports ENABLE ROW LEVEL SECURITY;

-- ==============================================================
-- DEMO DATA
-- ==============================================================

-- Insert demo shop
INSERT INTO shops (name, address, phone, email, is_active) VALUES
('Demo Auto Body Shop', '123 Main St, City, State 12345', '(555) 123-4567', 'info@demoautobody.com', true)
ON CONFLICT DO NOTHING;

-- Get the shop ID for demo data
DO $$
DECLARE
    demo_shop_id UUID;
BEGIN
    SELECT id INTO demo_shop_id FROM shops WHERE name = 'Demo Auto Body Shop' LIMIT 1;
    
    -- Insert demo users
    INSERT INTO users (username, email, first_name, last_name, role, shop_id, is_active) VALUES
    ('admin', 'admin@demoautobody.com', 'Admin', 'User', 'owner', demo_shop_id, true),
    ('manager', 'manager@demoautobody.com', 'Manager', 'User', 'manager', demo_shop_id, true),
    ('technician', 'tech@demoautobody.com', 'Technician', 'User', 'technician', demo_shop_id, true)
    ON CONFLICT (username) DO NOTHING;
    
    -- Insert demo suppliers
    INSERT INTO suppliers (shop_id, name, site_code, account_number, contact_name, phone, email, terms, is_active) VALUES
    (demo_shop_id, 'OEM Parts Direct', 'OEM', 'DEMO001', 'John Smith', '(555) 111-1111', 'orders@oemparts.com', 'Net 30', true),
    (demo_shop_id, 'Aftermarket Parts Co', 'AM', 'DEMO002', 'Jane Doe', '(555) 222-2222', 'sales@amparts.com', 'Net 15', true)
    ON CONFLICT DO NOTHING;
    
    -- Insert demo insurance companies
    INSERT INTO insurance_companies (shop_id, name, code, is_drp, is_active) VALUES
    (demo_shop_id, 'ICBC', 'ICBC', true, true),
    (demo_shop_id, 'State Farm', 'SF', false, true)
    ON CONFLICT DO NOTHING;
    
    -- Insert demo customers
    INSERT INTO customers (shop_id, first_name, last_name, email, phone, address, city, state, zip_code, country) VALUES
    (demo_shop_id, 'John', 'Smith', 'john.smith@email.com', '(555) 123-4567', '123 Main St', 'Vancouver', 'BC', 'V6B 1A1', 'Canada'),
    (demo_shop_id, 'Sarah', 'Johnson', 'sarah.johnson@email.com', '(555) 234-5678', '456 Oak Ave', 'Vancouver', 'BC', 'V6B 2B2', 'Canada')
    ON CONFLICT DO NOTHING;
    
    -- Insert demo vehicles
    INSERT INTO vehicles (shop_id, customer_id, vin, year, make, model, trim, plate, color, odometer) VALUES
    (demo_shop_id, (SELECT id FROM customers WHERE first_name = 'John' AND last_name = 'Smith' LIMIT 1), '1HGBH41JXMN109186', 2021, 'Honda', 'Civic', 'LX', 'ABC123', 'Silver', 25000),
    (demo_shop_id, (SELECT id FROM customers WHERE first_name = 'Sarah' AND last_name = 'Johnson' LIMIT 1), '2FMDK3GC9EBA12345', 2020, 'Ford', 'Focus', 'SE', 'XYZ789', 'Blue', 35000)
    ON CONFLICT (vin) DO NOTHING;
    
    -- Insert demo insurance claims
    INSERT INTO insurance_claims (shop_id, insurance_company_id, customer_id, vehicle_id, claim_number, claim_status, incident_date, reported_date, adjuster_name, adjuster_phone, adjuster_email, deductible) VALUES
    (demo_shop_id, (SELECT id FROM insurance_companies WHERE name = 'ICBC' LIMIT 1), (SELECT id FROM customers WHERE first_name = 'John' AND last_name = 'Smith' LIMIT 1), (SELECT id FROM vehicles WHERE vin = '1HGBH41JXMN109186' LIMIT 1), 'ICBC-2024-001', 'open', '2024-01-15', '2024-01-16', 'Mike Johnson', '(555) 333-4444', 'mike.johnson@icbc.com', 500.00),
    (demo_shop_id, (SELECT id FROM insurance_companies WHERE name = 'State Farm' LIMIT 1), (SELECT id FROM customers WHERE first_name = 'Sarah' AND last_name = 'Johnson' LIMIT 1), (SELECT id FROM vehicles WHERE vin = '2FMDK3GC9EBA12345' LIMIT 1), 'SF-2024-002', 'open', '2024-01-20', '2024-01-21', 'Lisa Brown', '(555) 444-5555', 'lisa.brown@statefarm.com', 1000.00)
    ON CONFLICT (claim_number) DO NOTHING;
    
    -- Insert demo repair orders
    INSERT INTO repair_orders (shop_id, claim_id, customer_id, vehicle_id, ro_number, status, priority, opened_at) VALUES
    (demo_shop_id, (SELECT id FROM insurance_claims WHERE claim_number = 'ICBC-2024-001' LIMIT 1), (SELECT id FROM customers WHERE first_name = 'John' AND last_name = 'Smith' LIMIT 1), (SELECT id FROM vehicles WHERE vin = '1HGBH41JXMN109186' LIMIT 1), 'RO-2024-001', 'in_progress', 'normal', '2024-01-16T09:00:00Z'),
    (demo_shop_id, (SELECT id FROM insurance_claims WHERE claim_number = 'SF-2024-002' LIMIT 1), (SELECT id FROM customers WHERE first_name = 'Sarah' AND last_name = 'Johnson' LIMIT 1), (SELECT id FROM vehicles WHERE vin = '2FMDK3GC9EBA12345' LIMIT 1), 'RO-2024-002', 'estimate', 'high', '2024-01-21T10:30:00Z')
    ON CONFLICT (ro_number) DO NOTHING;
    
    -- Insert demo part lines
    INSERT INTO part_lines (shop_id, repair_order_id, supplier_id, part_number, description, operation, brand_type, status, quantity_needed, unit_cost, total_cost) VALUES
    (demo_shop_id, (SELECT id FROM repair_orders WHERE ro_number = 'RO-2024-001' LIMIT 1), (SELECT id FROM suppliers WHERE name = 'OEM Parts Direct' LIMIT 1), 'HONDA-FRONT-BUMPER-2021', 'Front Bumper Assembly - Honda Civic 2021', 'Replace', 'OEM', 'needed', 1, 450.00, 450.00),
    (demo_shop_id, (SELECT id FROM repair_orders WHERE ro_number = 'RO-2024-001' LIMIT 1), (SELECT id FROM suppliers WHERE name = 'Aftermarket Parts Co' LIMIT 1), 'AM-FRONT-GRILLE-2021', 'Front Grille - Aftermarket', 'Replace', 'Aftermarket', 'ordered', 1, 125.00, 125.00),
    (demo_shop_id, (SELECT id FROM repair_orders WHERE ro_number = 'RO-2024-002' LIMIT 1), (SELECT id FROM suppliers WHERE name = 'OEM Parts Direct' LIMIT 1), 'FORD-REAR-TAIL-LIGHT-2020', 'Rear Tail Light Assembly - Ford Focus 2020', 'Replace', 'OEM', 'needed', 1, 280.00, 280.00)
    ON CONFLICT DO NOTHING;
    
    -- Insert demo purchase orders
    INSERT INTO purchase_orders (shop_id, repair_order_id, supplier_id, po_number, status, order_date, expected_date, total_amount) VALUES
    (demo_shop_id, (SELECT id FROM repair_orders WHERE ro_number = 'RO-2024-001' LIMIT 1), (SELECT id FROM suppliers WHERE name = 'Aftermarket Parts Co' LIMIT 1), 'RO-2024-001-2401-AM-001', 'ordered', '2024-01-16T14:30:00Z', '2024-01-20T09:00:00Z', 125.00)
    ON CONFLICT (po_number) DO NOTHING;
    
END $$;

-- ==============================================================
-- COMPLETION MESSAGE
-- ==============================================================

DO $$
BEGIN
    RAISE NOTICE '✅ CollisionOS Schema Deployment Completed Successfully!';
    RAISE NOTICE '📊 Created 11 tables with full collision repair workflow';
    RAISE NOTICE '⚡ Added performance indexes for optimal query speed';
    RAISE NOTICE '🔒 Enabled Row Level Security on all tables';
    RAISE NOTICE '🎯 Seeded demo data for testing';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next steps:';
    RAISE NOTICE '  1. Test the application - all APIs should now work';
    RAISE NOTICE '  2. Upload a BMS file to test the import workflow';
    RAISE NOTICE '  3. Create repair orders and test the parts workflow';
    RAISE NOTICE '  4. Test purchase order creation and management';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 CollisionOS is now ready for production use!';
END $$;
