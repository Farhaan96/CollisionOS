-- =====================================================================
-- CollisionOS Supabase Migration - Parts Management and Purchase Orders
-- Generated: 2025-01-21
-- Description: Parts workflow, inventory tracking, and purchase order management
-- =====================================================================

-- =====================================================================
-- PARTS TABLE
-- =====================================================================
CREATE TABLE parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  primary_vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,

  -- Part identification
  part_number VARCHAR(100) NOT NULL,
  oem_number VARCHAR(100),
  sku VARCHAR(100),

  -- Part details
  description TEXT NOT NULL,
  category VARCHAR(100),
  subcategory VARCHAR(100),

  -- Part type
  part_type VARCHAR(50) DEFAULT 'oem'
    CHECK (part_type IN ('oem', 'aftermarket', 'used', 'remanufactured', 'generic')),

  -- Pricing
  cost DECIMAL(10, 2) DEFAULT 0.00,
  list_price DECIMAL(10, 2) DEFAULT 0.00,
  retail_price DECIMAL(10, 2) DEFAULT 0.00,
  core_charge DECIMAL(10, 2) DEFAULT 0.00,

  -- Inventory
  quantity_on_hand INTEGER DEFAULT 0,
  quantity_on_order INTEGER DEFAULT 0,
  quantity_allocated INTEGER DEFAULT 0,
  quantity_available INTEGER DEFAULT 0,
  reorder_point INTEGER DEFAULT 0,
  reorder_quantity INTEGER DEFAULT 0,

  -- Physical info
  weight DECIMAL(10, 2),
  weight_unit VARCHAR(10) DEFAULT 'kg',
  dimensions VARCHAR(100),

  -- Location
  bin_location VARCHAR(50),
  shelf_location VARCHAR(50),

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_stocked BOOLEAN DEFAULT false,
  is_special_order BOOLEAN DEFAULT false,

  -- Notes
  notes TEXT,
  internal_notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parts_shop_id ON parts(shop_id);
CREATE INDEX idx_parts_part_number ON parts(part_number);
CREATE INDEX idx_parts_oem_number ON parts(oem_number);
CREATE INDEX idx_parts_category ON parts(category);
CREATE INDEX idx_parts_is_active ON parts(is_active);

-- =====================================================================
-- ADVANCED PARTS MANAGEMENT TABLE
-- =====================================================================
CREATE TABLE advanced_parts_management (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  repair_order_id INTEGER REFERENCES repair_order_management(id) ON DELETE CASCADE,
  estimate_line_item_id INTEGER REFERENCES estimate_line_items(id) ON DELETE SET NULL,
  parts_order_id INTEGER REFERENCES parts_orders(id) ON DELETE SET NULL,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,

  -- Part identification
  part_number VARCHAR(100) NOT NULL,
  oem_number VARCHAR(100),
  description TEXT NOT NULL,
  operation VARCHAR(50),

  -- Part type
  part_type VARCHAR(50) DEFAULT 'oem'
    CHECK (part_type IN ('oem', 'aftermarket', 'used', 'remanufactured', 'reconditioned', 'lkq')),

  -- Quantities
  quantity_ordered DECIMAL(10, 2) DEFAULT 1.00,
  quantity_received DECIMAL(10, 2) DEFAULT 0.00,
  quantity_returned DECIMAL(10, 2) DEFAULT 0.00,
  quantity_installed DECIMAL(10, 2) DEFAULT 0.00,

  -- Pricing
  unit_cost DECIMAL(12, 2) DEFAULT 0.00,
  unit_price DECIMAL(12, 2) DEFAULT 0.00,
  total_cost DECIMAL(12, 2) DEFAULT 0.00,
  total_price DECIMAL(12, 2) DEFAULT 0.00,
  core_charge DECIMAL(10, 2) DEFAULT 0.00,

  -- Part status workflow
  part_status VARCHAR(50) DEFAULT 'needed'
    CHECK (part_status IN ('needed', 'sourcing', 'quoted', 'ordered', 'backordered',
                          'in_transit', 'received', 'inspected', 'installed',
                          'returned', 'cancelled', 'warranty_claim')),

  -- Important dates
  date_needed TIMESTAMPTZ,
  date_sourced TIMESTAMPTZ,
  date_ordered TIMESTAMPTZ,
  date_expected TIMESTAMPTZ,
  date_received TIMESTAMPTZ,
  date_inspected TIMESTAMPTZ,
  date_installed TIMESTAMPTZ,
  date_returned TIMESTAMPTZ,

  -- Vendor/source info
  vendor_quote_number VARCHAR(50),
  vendor_invoice_number VARCHAR(50),
  vendor_part_number VARCHAR(100),
  vendor_eta VARCHAR(100),

  -- Tracking info
  tracking_number VARCHAR(100),
  shipping_carrier VARCHAR(50),
  shipping_method VARCHAR(50),

  -- Quality and inspection
  inspection_required BOOLEAN DEFAULT false,
  inspection_completed BOOLEAN DEFAULT false,
  inspection_passed BOOLEAN DEFAULT false,
  inspection_notes TEXT,

  -- Warranty info
  warranty_months INTEGER,
  warranty_miles INTEGER,
  warranty_start_date TIMESTAMPTZ,
  warranty_end_date TIMESTAMPTZ,

  -- Return info
  is_returnable BOOLEAN DEFAULT true,
  return_reason VARCHAR(50),
  return_notes TEXT,
  rma_number VARCHAR(50),

  -- Notes
  sourcing_notes TEXT,
  receiving_notes TEXT,
  installation_notes TEXT,
  general_notes TEXT,

  -- Status tracking
  status_changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  sourced_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ordered_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  received_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  inspected_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  installed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  returned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

  -- Audit
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_advanced_parts_shop_id ON advanced_parts_management(shop_id);
CREATE INDEX idx_advanced_parts_repair_order_id ON advanced_parts_management(repair_order_id);
CREATE INDEX idx_advanced_parts_part_status ON advanced_parts_management(part_status);
CREATE INDEX idx_advanced_parts_vendor_id ON advanced_parts_management(vendor_id);

-- =====================================================================
-- PARTS SOURCING REQUESTS TABLE (Automated sourcing)
-- =====================================================================
CREATE TABLE parts_sourcing_requests (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  repair_order_id INTEGER REFERENCES repair_order_management(id) ON DELETE CASCADE,
  estimate_line_item_id INTEGER REFERENCES estimate_line_items(id) ON DELETE SET NULL,
  claim_management_id INTEGER REFERENCES claim_management(id) ON DELETE SET NULL,

  -- Request details
  request_number VARCHAR(50) UNIQUE NOT NULL,
  part_number VARCHAR(100) NOT NULL,
  oem_number VARCHAR(100),
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) DEFAULT 1.00,

  -- Part preferences
  preferred_part_type VARCHAR(50)
    CHECK (preferred_part_type IN ('oem', 'aftermarket', 'used', 'any')),
  max_price DECIMAL(12, 2),
  target_delivery_date TIMESTAMPTZ,

  -- Request status
  request_status VARCHAR(50) DEFAULT 'pending'
    CHECK (request_status IN ('pending', 'sourcing', 'quoted', 'approved', 'ordered', 'cancelled', 'failed')),

  -- Automated sourcing
  auto_source_enabled BOOLEAN DEFAULT true,
  vendors_contacted INTEGER DEFAULT 0,
  quotes_received INTEGER DEFAULT 0,

  -- Selected vendor/quote
  selected_vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
  selected_quote_id INTEGER REFERENCES vendor_part_quotes(id) ON DELETE SET NULL,
  selected_at TIMESTAMPTZ,

  -- Approval workflow
  requires_approval BOOLEAN DEFAULT false,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,

  -- Notes
  notes TEXT,
  sourcing_notes TEXT,

  -- Audit
  requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parts_sourcing_requests_shop_id ON parts_sourcing_requests(shop_id);
CREATE INDEX idx_parts_sourcing_requests_request_number ON parts_sourcing_requests(request_number);
CREATE INDEX idx_parts_sourcing_requests_request_status ON parts_sourcing_requests(request_status);

-- =====================================================================
-- VENDOR PART QUOTES TABLE
-- =====================================================================
CREATE TABLE vendor_part_quotes (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  sourcing_request_id INTEGER NOT NULL REFERENCES parts_sourcing_requests(id) ON DELETE CASCADE,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Quote details
  quote_number VARCHAR(50),
  vendor_part_number VARCHAR(100),
  part_description TEXT,

  -- Part type
  part_type VARCHAR(50)
    CHECK (part_type IN ('oem', 'aftermarket', 'used', 'remanufactured')),

  -- Pricing
  unit_price DECIMAL(12, 2) NOT NULL,
  quantity DECIMAL(10, 2) DEFAULT 1.00,
  total_price DECIMAL(12, 2) NOT NULL,
  core_charge DECIMAL(10, 2) DEFAULT 0.00,
  shipping_cost DECIMAL(10, 2) DEFAULT 0.00,
  tax_amount DECIMAL(10, 2) DEFAULT 0.00,
  total_cost DECIMAL(12, 2) NOT NULL,

  -- Availability
  in_stock BOOLEAN DEFAULT false,
  stock_quantity INTEGER,
  estimated_delivery_days INTEGER,
  estimated_delivery_date TIMESTAMPTZ,

  -- Warranty
  warranty_months INTEGER,
  warranty_miles INTEGER,
  warranty_description TEXT,

  -- Quote status
  quote_status VARCHAR(50) DEFAULT 'pending'
    CHECK (quote_status IN ('pending', 'valid', 'selected', 'rejected', 'expired', 'cancelled')),
  is_selected BOOLEAN DEFAULT false,

  -- Quality metrics
  quality_grade VARCHAR(10),
  vendor_rating DECIMAL(3, 2),

  -- API source info
  api_source VARCHAR(50),
  api_response JSONB,

  -- Notes
  notes TEXT,

  -- Audit
  received_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  analyzed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendor_part_quotes_shop_id ON vendor_part_quotes(shop_id);
CREATE INDEX idx_vendor_part_quotes_sourcing_request_id ON vendor_part_quotes(sourcing_request_id);
CREATE INDEX idx_vendor_part_quotes_vendor_id ON vendor_part_quotes(vendor_id);
CREATE INDEX idx_vendor_part_quotes_quote_status ON vendor_part_quotes(quote_status);

-- =====================================================================
-- PURCHASE ORDER SYSTEM TABLE
-- =====================================================================
CREATE TABLE purchase_order_system (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  repair_order_id INTEGER REFERENCES repair_order_management(id) ON DELETE CASCADE,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- PO identification
  po_number VARCHAR(50) UNIQUE NOT NULL,
  vendor_po_number VARCHAR(50),

  -- PO details
  po_type VARCHAR(50) DEFAULT 'parts'
    CHECK (po_type IN ('parts', 'materials', 'sublet', 'equipment', 'other')),

  -- PO status
  po_status VARCHAR(50) DEFAULT 'draft'
    CHECK (po_status IN ('draft', 'pending_approval', 'approved', 'rejected', 'sent',
                        'acknowledged', 'in_transit', 'partially_received', 'received',
                        'completed', 'cancelled', 'on_hold')),

  -- Important dates
  po_date TIMESTAMPTZ DEFAULT NOW(),
  required_date TIMESTAMPTZ,
  expected_delivery_date TIMESTAMPTZ,
  actual_delivery_date TIMESTAMPTZ,
  sent_date TIMESTAMPTZ,
  acknowledged_date TIMESTAMPTZ,

  -- Financial totals
  subtotal DECIMAL(12, 2) DEFAULT 0.00,
  shipping_cost DECIMAL(10, 2) DEFAULT 0.00,
  tax_amount DECIMAL(10, 2) DEFAULT 0.00,
  total_amount DECIMAL(12, 2) DEFAULT 0.00,

  -- Shipping info
  shipping_method VARCHAR(100),
  shipping_carrier VARCHAR(50),
  tracking_number VARCHAR(100),

  -- Delivery address
  delivery_address TEXT,
  delivery_city VARCHAR(100),
  delivery_state VARCHAR(50),
  delivery_zip_code VARCHAR(20),
  delivery_country VARCHAR(50) DEFAULT 'Canada',
  delivery_instructions TEXT,

  -- Payment terms
  payment_terms VARCHAR(50),
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'unpaid',

  -- Approval workflow
  requires_approval BOOLEAN DEFAULT false,
  approval_status VARCHAR(50),
  approval_notes TEXT,

  -- Notes
  po_notes TEXT,
  internal_notes TEXT,
  vendor_notes TEXT,

  -- Parent/child PO relationship
  parent_order_id INTEGER REFERENCES purchase_order_system(id) ON DELETE SET NULL,
  is_supplement BOOLEAN DEFAULT false,

  -- Status tracking
  status_changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  rejected_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  sent_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  inspected_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  authorized_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  buyer_assigned INTEGER REFERENCES users(id) ON DELETE SET NULL,

  -- Audit
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchase_order_system_shop_id ON purchase_order_system(shop_id);
CREATE INDEX idx_purchase_order_system_po_number ON purchase_order_system(po_number);
CREATE INDEX idx_purchase_order_system_po_status ON purchase_order_system(po_status);
CREATE INDEX idx_purchase_order_system_vendor_id ON purchase_order_system(vendor_id);
CREATE INDEX idx_purchase_order_system_repair_order_id ON purchase_order_system(repair_order_id);

-- =====================================================================
-- AUTOMATED PURCHASE ORDERS TABLE
-- =====================================================================
CREATE TABLE automated_purchase_orders (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  sourcing_request_id INTEGER REFERENCES parts_sourcing_requests(id) ON DELETE SET NULL,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  selected_quote_id INTEGER REFERENCES vendor_part_quotes(id) ON DELETE SET NULL,
  repair_order_id INTEGER REFERENCES repair_order_management(id) ON DELETE CASCADE,
  claim_management_id INTEGER REFERENCES claim_management(id) ON DELETE SET NULL,

  -- PO identification
  po_number VARCHAR(50) UNIQUE NOT NULL,
  vendor_confirmation_number VARCHAR(50),

  -- PO status
  po_status VARCHAR(50) DEFAULT 'pending'
    CHECK (po_status IN ('pending', 'submitted', 'confirmed', 'in_transit', 'delivered',
                        'completed', 'cancelled', 'failed')),

  -- Automation info
  auto_generated BOOLEAN DEFAULT true,
  auto_submitted BOOLEAN DEFAULT false,
  api_submitted BOOLEAN DEFAULT false,
  api_response JSONB,

  -- Important dates
  created_at_timestamp TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  expected_delivery_date TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Financial
  total_amount DECIMAL(12, 2) DEFAULT 0.00,

  -- Tracking
  tracking_number VARCHAR(100),
  shipping_carrier VARCHAR(50),

  -- Notes
  notes TEXT,
  api_notes TEXT,

  -- Audit
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  sent_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  cancelled_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_automated_purchase_orders_shop_id ON automated_purchase_orders(shop_id);
CREATE INDEX idx_automated_purchase_orders_po_number ON automated_purchase_orders(po_number);
CREATE INDEX idx_automated_purchase_orders_po_status ON automated_purchase_orders(po_status);

-- =====================================================================
-- PARTS INVENTORY TRACKING TABLE
-- =====================================================================
CREATE TABLE parts_inventory_tracking (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  part_id UUID REFERENCES parts(id) ON DELETE SET NULL,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,

  -- Inventory transaction
  transaction_type VARCHAR(50) NOT NULL
    CHECK (transaction_type IN ('purchase', 'sale', 'return', 'adjustment', 'transfer', 'damage', 'loss', 'found')),
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  reference_number VARCHAR(100),

  -- Quantities
  quantity_before INTEGER DEFAULT 0,
  quantity_change INTEGER NOT NULL,
  quantity_after INTEGER DEFAULT 0,

  -- Financial
  unit_cost DECIMAL(10, 2),
  total_cost DECIMAL(12, 2),

  -- Location
  from_location VARCHAR(100),
  to_location VARCHAR(100),

  -- Notes
  notes TEXT,
  reason TEXT,

  -- Audit
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parts_inventory_tracking_shop_id ON parts_inventory_tracking(shop_id);
CREATE INDEX idx_parts_inventory_tracking_part_id ON parts_inventory_tracking(part_id);
CREATE INDEX idx_parts_inventory_tracking_transaction_type ON parts_inventory_tracking(transaction_type);

-- =====================================================================
-- VENDOR API CONFIGURATION TABLE
-- =====================================================================
CREATE TABLE vendor_api_configs (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- API configuration
  api_type VARCHAR(50) NOT NULL
    CHECK (api_type IN ('collision_link', 'lkq', 'keystone', 'partstec', 'custom', 'other')),
  api_endpoint VARCHAR(500) NOT NULL,
  api_version VARCHAR(20),

  -- Authentication
  auth_type VARCHAR(50) DEFAULT 'api_key'
    CHECK (auth_type IN ('api_key', 'oauth', 'basic', 'token', 'none')),
  api_key VARCHAR(255),
  api_secret VARCHAR(255),
  username VARCHAR(100),
  password VARCHAR(255),
  oauth_token VARCHAR(500),
  oauth_refresh_token VARCHAR(500),

  -- Configuration
  config_settings JSONB DEFAULT '{}',
  request_timeout_seconds INTEGER DEFAULT 30,
  retry_attempts INTEGER DEFAULT 3,
  rate_limit_per_minute INTEGER,

  -- Status
  is_enabled BOOLEAN DEFAULT true,
  is_test_mode BOOLEAN DEFAULT false,

  -- Health monitoring
  last_successful_call TIMESTAMPTZ,
  last_failed_call TIMESTAMPTZ,
  total_calls INTEGER DEFAULT 0,
  successful_calls INTEGER DEFAULT 0,
  failed_calls INTEGER DEFAULT 0,

  -- Testing
  last_test_date TIMESTAMPTZ,
  last_test_result VARCHAR(50),
  last_test_message TEXT,

  -- Notes
  notes TEXT,

  -- Audit
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  last_tested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendor_api_configs_shop_id ON vendor_api_configs(shop_id);
CREATE INDEX idx_vendor_api_configs_vendor_id ON vendor_api_configs(vendor_id);
CREATE INDEX idx_vendor_api_configs_is_enabled ON vendor_api_configs(is_enabled);

-- =====================================================================
-- VENDOR API METRICS TABLE
-- =====================================================================
CREATE TABLE vendor_api_metrics (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  api_config_id INTEGER REFERENCES vendor_api_configs(id) ON DELETE SET NULL,
  sourcing_request_id INTEGER REFERENCES parts_sourcing_requests(id) ON DELETE SET NULL,

  -- API call details
  api_method VARCHAR(20) NOT NULL,
  api_endpoint VARCHAR(500) NOT NULL,
  request_payload JSONB,
  response_payload JSONB,

  -- Performance metrics
  response_time_ms INTEGER,
  http_status_code INTEGER,
  success BOOLEAN DEFAULT false,

  -- Error tracking
  error_code VARCHAR(50),
  error_message TEXT,

  -- Timestamp
  called_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendor_api_metrics_shop_id ON vendor_api_metrics(shop_id);
CREATE INDEX idx_vendor_api_metrics_vendor_id ON vendor_api_metrics(vendor_id);
CREATE INDEX idx_vendor_api_metrics_called_at ON vendor_api_metrics(called_at);

-- =====================================================================
-- UPDATE TRIGGERS
-- =====================================================================
CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON parts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advanced_parts_management_updated_at BEFORE UPDATE ON advanced_parts_management
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parts_sourcing_requests_updated_at BEFORE UPDATE ON parts_sourcing_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_part_quotes_updated_at BEFORE UPDATE ON vendor_part_quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_order_system_updated_at BEFORE UPDATE ON purchase_order_system
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automated_purchase_orders_updated_at BEFORE UPDATE ON automated_purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parts_inventory_tracking_updated_at BEFORE UPDATE ON parts_inventory_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_api_configs_updated_at BEFORE UPDATE ON vendor_api_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
