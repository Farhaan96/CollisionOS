-- =====================================================================
-- CollisionOS Supabase Migration - Row Level Security Policies
-- Generated: 2025-01-21
-- Description: RLS policies for shop-level data isolation and multi-tenancy
-- =====================================================================

-- =====================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =====================================================================

-- Core tables
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Collision repair workflow
ALTER TABLE vehicle_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_order_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_imports ENABLE ROW LEVEL SECURITY;

-- Parts and purchasing
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE advanced_parts_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_sourcing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_part_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_system ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_inventory_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_api_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_api_metrics ENABLE ROW LEVEL SECURITY;

-- Production and labor
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_clocks ENABLE ROW LEVEL SECURITY;

-- Financial
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- Communication and documents
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_timeline ENABLE ROW LEVEL SECURITY;

-- Integrations
ALTER TABLE quickbooks_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE quickbooks_sync_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- HELPER FUNCTIONS FOR RLS POLICIES
-- =====================================================================

-- Function to get current user's shop ID from JWT claims
CREATE OR REPLACE FUNCTION auth.current_shop_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'shop_id',
    current_setting('app.current_shop_id', true)
  )::UUID;
$$ LANGUAGE SQL STABLE;

-- Function to get current user's ID from JWT claims
CREATE OR REPLACE FUNCTION auth.current_user_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    current_setting('app.current_user_id', true)
  )::UUID;
$$ LANGUAGE SQL STABLE;

-- Function to get current user's role from JWT claims
CREATE OR REPLACE FUNCTION auth.current_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role',
    current_setting('app.current_user_role', true)
  )::TEXT;
$$ LANGUAGE SQL STABLE;

-- Function to check if user is owner or admin
CREATE OR REPLACE FUNCTION auth.is_owner_or_admin()
RETURNS BOOLEAN AS $$
  SELECT auth.current_user_role() IN ('owner', 'admin', 'manager');
$$ LANGUAGE SQL STABLE;

-- =====================================================================
-- SHOPS TABLE POLICIES
-- =====================================================================

-- Shops can only see their own data
CREATE POLICY "Users can view their own shop"
  ON shops FOR SELECT
  USING (id = auth.current_shop_id());

-- Only owners/admins can update shop info
CREATE POLICY "Owners can update their shop"
  ON shops FOR UPDATE
  USING (id = auth.current_shop_id() AND auth.is_owner_or_admin());

-- =====================================================================
-- USERS TABLE POLICIES
-- =====================================================================

-- Users can view users in their shop
CREATE POLICY "Users can view shop users"
  ON users FOR SELECT
  USING (shop_id = auth.current_shop_id());

-- Only managers/admins can create users
CREATE POLICY "Managers can create users"
  ON users FOR INSERT
  WITH CHECK (shop_id = auth.current_shop_id() AND auth.is_owner_or_admin());

-- Users can update their own profile, managers can update all
CREATE POLICY "Users can update profiles"
  ON users FOR UPDATE
  USING (
    shop_id = auth.current_shop_id() AND
    (id = auth.current_user_id() OR auth.is_owner_or_admin())
  );

-- Only owners can delete users
CREATE POLICY "Owners can delete users"
  ON users FOR DELETE
  USING (shop_id = auth.current_shop_id() AND auth.current_user_role() = 'owner');

-- =====================================================================
-- CUSTOMERS TABLE POLICIES
-- =====================================================================

CREATE POLICY "Users can view shop customers"
  ON customers FOR SELECT
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Users can create customers"
  ON customers FOR INSERT
  WITH CHECK (shop_id = auth.current_shop_id());

CREATE POLICY "Users can update shop customers"
  ON customers FOR UPDATE
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Admins can delete customers"
  ON customers FOR DELETE
  USING (shop_id = auth.current_shop_id() AND auth.is_owner_or_admin());

-- =====================================================================
-- VEHICLES TABLE POLICIES
-- =====================================================================

CREATE POLICY "Users can view shop vehicles"
  ON vehicles FOR SELECT
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Users can create vehicles"
  ON vehicles FOR INSERT
  WITH CHECK (shop_id = auth.current_shop_id());

CREATE POLICY "Users can update shop vehicles"
  ON vehicles FOR UPDATE
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Admins can delete vehicles"
  ON vehicles FOR DELETE
  USING (shop_id = auth.current_shop_id() AND auth.is_owner_or_admin());

-- =====================================================================
-- INSURANCE COMPANIES TABLE POLICIES
-- =====================================================================

CREATE POLICY "Users can view shop insurance companies"
  ON insurance_companies FOR SELECT
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Managers can manage insurance companies"
  ON insurance_companies FOR ALL
  USING (shop_id = auth.current_shop_id() AND auth.is_owner_or_admin());

-- =====================================================================
-- VENDORS TABLE POLICIES
-- =====================================================================

CREATE POLICY "Users can view shop vendors"
  ON vendors FOR SELECT
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Managers can manage vendors"
  ON vendors FOR ALL
  USING (shop_id = auth.current_shop_id() AND auth.is_owner_or_admin());

-- =====================================================================
-- REPAIR ORDER MANAGEMENT POLICIES (Critical - shop isolation)
-- =====================================================================

CREATE POLICY "Users can view shop repair orders"
  ON repair_order_management FOR SELECT
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Users can create repair orders"
  ON repair_order_management FOR INSERT
  WITH CHECK (shop_id = auth.current_shop_id());

CREATE POLICY "Users can update shop repair orders"
  ON repair_order_management FOR UPDATE
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Admins can delete repair orders"
  ON repair_order_management FOR DELETE
  USING (shop_id = auth.current_shop_id() AND auth.is_owner_or_admin());

-- =====================================================================
-- ESTIMATES AND CLAIMS POLICIES
-- =====================================================================

CREATE POLICY "Users can view shop estimates"
  ON estimates FOR SELECT
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Users can manage estimates"
  ON estimates FOR ALL
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Users can view shop claims"
  ON claim_management FOR SELECT
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Users can manage claims"
  ON claim_management FOR ALL
  USING (shop_id = auth.current_shop_id());

-- =====================================================================
-- PARTS MANAGEMENT POLICIES
-- =====================================================================

CREATE POLICY "Users can view shop parts"
  ON parts FOR SELECT
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Users can manage parts"
  ON parts FOR ALL
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Users can view shop parts management"
  ON advanced_parts_management FOR SELECT
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Users can manage shop parts"
  ON advanced_parts_management FOR ALL
  USING (shop_id = auth.current_shop_id());

-- =====================================================================
-- PURCHASE ORDER POLICIES
-- =====================================================================

CREATE POLICY "Users can view shop purchase orders"
  ON purchase_order_system FOR SELECT
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Users can manage purchase orders"
  ON purchase_order_system FOR ALL
  USING (shop_id = auth.current_shop_id());

-- =====================================================================
-- LABOR AND PRODUCTION POLICIES
-- =====================================================================

CREATE POLICY "Users can view shop jobs"
  ON jobs FOR SELECT
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Users can manage jobs"
  ON jobs FOR ALL
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Technicians can view their time entries"
  ON labor_time_entries FOR SELECT
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Technicians can create time entries"
  ON labor_time_entries FOR INSERT
  WITH CHECK (
    shop_id = auth.current_shop_id() AND
    (technician_id = auth.current_user_id() OR auth.is_owner_or_admin())
  );

CREATE POLICY "Users can manage labor entries"
  ON labor_time_entries FOR UPDATE
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Technicians can clock in/out"
  ON time_clocks FOR ALL
  USING (
    shop_id = auth.current_shop_id() AND
    (technician_id = auth.current_user_id() OR auth.is_owner_or_admin())
  );

-- =====================================================================
-- FINANCIAL POLICIES (Restricted access)
-- =====================================================================

CREATE POLICY "Authorized users can view shop invoices"
  ON invoices FOR SELECT
  USING (
    shop_id = auth.current_shop_id() AND
    auth.current_user_role() IN ('owner', 'admin', 'manager', 'accountant', 'service_advisor')
  );

CREATE POLICY "Authorized users can manage invoices"
  ON invoices FOR ALL
  USING (
    shop_id = auth.current_shop_id() AND
    auth.current_user_role() IN ('owner', 'admin', 'manager', 'accountant')
  );

CREATE POLICY "Authorized users can view payments"
  ON payments FOR SELECT
  USING (
    shop_id = auth.current_shop_id() AND
    auth.current_user_role() IN ('owner', 'admin', 'manager', 'accountant', 'receptionist')
  );

CREATE POLICY "Authorized users can record payments"
  ON payments FOR ALL
  USING (
    shop_id = auth.current_shop_id() AND
    auth.current_user_role() IN ('owner', 'admin', 'manager', 'accountant', 'receptionist')
  );

-- =====================================================================
-- DOCUMENTS AND ATTACHMENTS POLICIES
-- =====================================================================

CREATE POLICY "Users can view shop attachments"
  ON attachments FOR SELECT
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Users can upload attachments"
  ON attachments FOR INSERT
  WITH CHECK (shop_id = auth.current_shop_id());

CREATE POLICY "Users can update shop attachments"
  ON attachments FOR UPDATE
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Admins can delete attachments"
  ON attachments FOR DELETE
  USING (shop_id = auth.current_shop_id() AND auth.is_owner_or_admin());

-- =====================================================================
-- COMMUNICATION POLICIES
-- =====================================================================

CREATE POLICY "Users can view shop communication templates"
  ON communication_templates FOR SELECT
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Managers can manage templates"
  ON communication_templates FOR ALL
  USING (shop_id = auth.current_shop_id() AND auth.is_owner_or_admin());

CREATE POLICY "Users can view shop communication logs"
  ON communication_logs FOR SELECT
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Users can create communication logs"
  ON communication_logs FOR INSERT
  WITH CHECK (shop_id = auth.current_shop_id());

-- =====================================================================
-- BMS IMPORT POLICIES
-- =====================================================================

CREATE POLICY "Users can view shop BMS imports"
  ON bms_imports FOR SELECT
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Users can create BMS imports"
  ON bms_imports FOR INSERT
  WITH CHECK (shop_id = auth.current_shop_id());

-- =====================================================================
-- INTEGRATION POLICIES (Restricted)
-- =====================================================================

CREATE POLICY "Admins can manage QuickBooks connections"
  ON quickbooks_connections FOR ALL
  USING (
    shop_id = auth.current_shop_id() AND
    auth.current_user_role() IN ('owner', 'admin', 'accountant')
  );

CREATE POLICY "Admins can view QuickBooks sync logs"
  ON quickbooks_sync_logs FOR SELECT
  USING (
    shop_id = auth.current_shop_id() AND
    auth.current_user_role() IN ('owner', 'admin', 'accountant')
  );

-- =====================================================================
-- VENDOR API POLICIES (Restricted)
-- =====================================================================

CREATE POLICY "Managers can manage vendor API configs"
  ON vendor_api_configs FOR ALL
  USING (
    shop_id = auth.current_shop_id() AND
    auth.current_user_role() IN ('owner', 'admin', 'manager', 'parts_manager')
  );

CREATE POLICY "Users can view API metrics"
  ON vendor_api_metrics FOR SELECT
  USING (shop_id = auth.current_shop_id());

-- =====================================================================
-- GENERIC POLICIES FOR REMAINING TABLES
-- =====================================================================

-- Estimate line items
CREATE POLICY "Users can manage estimate line items"
  ON estimate_line_items FOR ALL
  USING (
    estimate_id IN (
      SELECT id FROM estimates WHERE shop_id = auth.current_shop_id()
    )
  );

-- Vehicle profiles
CREATE POLICY "Users can manage vehicle profiles"
  ON vehicle_profiles FOR ALL
  USING (shop_id = auth.current_shop_id());

-- Production stages
CREATE POLICY "Users can view production stages"
  ON production_stages FOR SELECT
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Managers can manage production stages"
  ON production_stages FOR ALL
  USING (shop_id = auth.current_shop_id() AND auth.is_owner_or_admin());

-- Production workflow
CREATE POLICY "Users can view production workflow"
  ON production_workflow FOR SELECT
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Users can manage production workflow"
  ON production_workflow FOR ALL
  USING (shop_id = auth.current_shop_id());

-- Parts sourcing
CREATE POLICY "Users can view parts sourcing requests"
  ON parts_sourcing_requests FOR SELECT
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Users can manage parts sourcing"
  ON parts_sourcing_requests FOR ALL
  USING (shop_id = auth.current_shop_id());

-- Vendor quotes
CREATE POLICY "Users can view vendor quotes"
  ON vendor_part_quotes FOR SELECT
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Users can manage vendor quotes"
  ON vendor_part_quotes FOR ALL
  USING (shop_id = auth.current_shop_id());

-- Automated purchase orders
CREATE POLICY "Users can view automated POs"
  ON automated_purchase_orders FOR SELECT
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Users can manage automated POs"
  ON automated_purchase_orders FOR ALL
  USING (shop_id = auth.current_shop_id());

-- Parts inventory tracking
CREATE POLICY "Users can view inventory tracking"
  ON parts_inventory_tracking FOR SELECT
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Users can manage inventory tracking"
  ON parts_inventory_tracking FOR ALL
  USING (shop_id = auth.current_shop_id());

-- Signatures
CREATE POLICY "Users can view signatures"
  ON signatures FOR SELECT
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Users can create signatures"
  ON signatures FOR INSERT
  WITH CHECK (shop_id = auth.current_shop_id());

-- Contact timeline
CREATE POLICY "Users can view contact timeline"
  ON contact_timeline FOR SELECT
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Users can create contact events"
  ON contact_timeline FOR INSERT
  WITH CHECK (shop_id = auth.current_shop_id());

-- Financial transactions
CREATE POLICY "Authorized users can view transactions"
  ON financial_transactions FOR SELECT
  USING (
    shop_id = auth.current_shop_id() AND
    auth.current_user_role() IN ('owner', 'admin', 'manager', 'accountant')
  );

CREATE POLICY "Authorized users can manage transactions"
  ON financial_transactions FOR ALL
  USING (
    shop_id = auth.current_shop_id() AND
    auth.current_user_role() IN ('owner', 'admin', 'manager', 'accountant')
  );

-- Expenses
CREATE POLICY "Users can view shop expenses"
  ON expenses FOR SELECT
  USING (shop_id = auth.current_shop_id());

CREATE POLICY "Users can manage expenses"
  ON expenses FOR ALL
  USING (shop_id = auth.current_shop_id());

-- Enhanced invoices
CREATE POLICY "Authorized users can view enhanced invoices"
  ON invoices_enhanced FOR SELECT
  USING (
    shop_id = auth.current_shop_id() AND
    auth.current_user_role() IN ('owner', 'admin', 'manager', 'accountant', 'service_advisor')
  );

CREATE POLICY "Authorized users can manage enhanced invoices"
  ON invoices_enhanced FOR ALL
  USING (
    shop_id = auth.current_shop_id() AND
    auth.current_user_role() IN ('owner', 'admin', 'manager', 'accountant')
  );

-- =====================================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================================

COMMENT ON FUNCTION auth.current_shop_id() IS 'Returns the current users shop ID from JWT claims';
COMMENT ON FUNCTION auth.current_user_id() IS 'Returns the current users ID from JWT claims';
COMMENT ON FUNCTION auth.current_user_role() IS 'Returns the current users role from JWT claims';
COMMENT ON FUNCTION auth.is_owner_or_admin() IS 'Checks if current user is owner, admin, or manager';
