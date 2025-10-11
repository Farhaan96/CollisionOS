
-- Performance Indexes for CollisionOS
-- These indexes will significantly improve query performance

-- Repair Orders Indexes
CREATE INDEX IF NOT EXISTS idx_repair_orders_shop_status ON repair_orders(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_repair_orders_shop_created ON repair_orders(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_repair_orders_ro_number ON repair_orders(ro_number);
CREATE INDEX IF NOT EXISTS idx_repair_orders_customer ON repair_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_repair_orders_vehicle ON repair_orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_repair_orders_claim ON repair_orders(claim_id);

-- Customers Indexes
CREATE INDEX IF NOT EXISTS idx_customers_shop_name ON customers(shop_id, last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_customers_shop_email ON customers(shop_id, email);
CREATE INDEX IF NOT EXISTS idx_customers_shop_phone ON customers(shop_id, phone);
CREATE INDEX IF NOT EXISTS idx_customers_created ON customers(created_at DESC);

-- Vehicles Indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_shop_vin ON vehicles(shop_id, vin);
CREATE INDEX IF NOT EXISTS idx_vehicles_shop_plate ON vehicles(shop_id, license_plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_make_model ON vehicles(make, model, year);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer ON vehicles(customer_id);

-- Parts Indexes
CREATE INDEX IF NOT EXISTS idx_parts_ro_status ON parts(repair_order_id, status);
CREATE INDEX IF NOT EXISTS idx_parts_shop_status ON parts(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_parts_part_number ON parts(part_number);
CREATE INDEX IF NOT EXISTS idx_parts_supplier ON parts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_parts_created ON parts(created_at DESC);

-- Purchase Orders Indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_shop_status ON purchase_orders(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_shop_created ON purchase_orders(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor ON purchase_orders(vendor_id);

-- Insurance Claims Indexes
CREATE INDEX IF NOT EXISTS idx_insurance_claims_shop_number ON insurance_claims(shop_id, claim_number);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_company ON insurance_claims(insurance_company_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_customer ON insurance_claims(customer_id);

-- Time Clock Indexes
CREATE INDEX IF NOT EXISTS idx_timeclock_user_date ON timeclock(user_id, date);
CREATE INDEX IF NOT EXISTS idx_timeclock_shop_date ON timeclock(shop_id, date);
CREATE INDEX IF NOT EXISTS idx_timeclock_repair_order ON timeclock(repair_order_id);

-- Audit Logs Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_shop_timestamp ON audit_logs(shop_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Composite Indexes for Common Queries
CREATE INDEX IF NOT EXISTS idx_repair_orders_shop_status_priority ON repair_orders(shop_id, status, priority);
CREATE INDEX IF NOT EXISTS idx_parts_ro_status_operation ON parts(repair_order_id, status, operation);
CREATE INDEX IF NOT EXISTS idx_customers_shop_name_email ON customers(shop_id, last_name, email);
