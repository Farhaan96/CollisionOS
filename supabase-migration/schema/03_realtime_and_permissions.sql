-- CollisionOS Realtime and Advanced Permissions Schema
-- Part 3 of the schema migration - Realtime subscriptions and advanced RLS

-- =====================================================
-- REALTIME CONFIGURATION
-- =====================================================

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE shops;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE job_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE customers;
ALTER PUBLICATION supabase_realtime ADD TABLE vehicles;
ALTER PUBLICATION supabase_realtime ADD TABLE parts;
ALTER PUBLICATION supabase_realtime ADD TABLE job_parts;
ALTER PUBLICATION supabase_realtime ADD TABLE job_labor;
ALTER PUBLICATION supabase_realtime ADD TABLE estimates;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE vendors;

-- =====================================================
-- ADVANCED RLS POLICIES FOR ROLE-BASED ACCESS
-- =====================================================

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION has_permission(user_uuid UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_permissions JSONB;
  user_role TEXT;
BEGIN
  SELECT permissions, role INTO user_permissions, user_role
  FROM users 
  WHERE user_id = user_uuid AND is_active = true;
  
  -- If no user found or inactive, deny access
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Owner and admin have all permissions
  IF user_role IN ('owner', 'admin') THEN
    RETURN TRUE;
  END IF;
  
  -- Check specific permission in JSONB
  RETURN COALESCE((user_permissions ->> permission_name)::BOOLEAN, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's shop
CREATE OR REPLACE FUNCTION get_user_shop()
RETURNS UUID AS $$
DECLARE
  shop_uuid UUID;
BEGIN
  SELECT shop_id INTO shop_uuid
  FROM users 
  WHERE user_id = auth.uid() AND is_active = true;
  
  RETURN shop_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user belongs to shop
CREATE OR REPLACE FUNCTION user_belongs_to_shop(shop_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN shop_uuid = get_user_shop();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ENHANCED RLS POLICIES WITH PERMISSIONS
-- =====================================================

-- Drop existing basic policies and create enhanced ones

-- Enhanced Customers policies
DROP POLICY IF EXISTS "Customers are viewable by shop members" ON customers;
DROP POLICY IF EXISTS "Shop members can manage customers" ON customers;

CREATE POLICY "Customers select policy" ON customers
  FOR SELECT USING (
    user_belongs_to_shop(shop_id) AND 
    has_permission(auth.uid(), 'customers.view')
  );

CREATE POLICY "Customers insert policy" ON customers
  FOR INSERT WITH CHECK (
    user_belongs_to_shop(shop_id) AND 
    has_permission(auth.uid(), 'customers.create')
  );

CREATE POLICY "Customers update policy" ON customers
  FOR UPDATE USING (
    user_belongs_to_shop(shop_id) AND 
    has_permission(auth.uid(), 'customers.edit')
  );

CREATE POLICY "Customers delete policy" ON customers
  FOR DELETE USING (
    user_belongs_to_shop(shop_id) AND 
    has_permission(auth.uid(), 'customers.delete')
  );

-- Enhanced Jobs policies
DROP POLICY IF EXISTS "Jobs are viewable by shop members" ON jobs;
DROP POLICY IF EXISTS "Shop members can manage jobs" ON jobs;

CREATE POLICY "Jobs select policy" ON jobs
  FOR SELECT USING (
    user_belongs_to_shop(shop_id) AND 
    (
      has_permission(auth.uid(), 'jobs.view') OR
      assigned_to = auth.uid() -- Users can always see their assigned jobs
    )
  );

CREATE POLICY "Jobs insert policy" ON jobs
  FOR INSERT WITH CHECK (
    user_belongs_to_shop(shop_id) AND 
    has_permission(auth.uid(), 'jobs.create')
  );

CREATE POLICY "Jobs update policy" ON jobs
  FOR UPDATE USING (
    user_belongs_to_shop(shop_id) AND 
    (
      has_permission(auth.uid(), 'jobs.edit') OR
      (assigned_to = auth.uid() AND has_permission(auth.uid(), 'jobs.view'))
    )
  );

CREATE POLICY "Jobs delete policy" ON jobs
  FOR DELETE USING (
    user_belongs_to_shop(shop_id) AND 
    has_permission(auth.uid(), 'jobs.delete')
  );

-- Enhanced Parts policies
DROP POLICY IF EXISTS "Parts are viewable by shop members" ON parts;
DROP POLICY IF EXISTS "Shop members can manage parts" ON parts;

CREATE POLICY "Parts select policy" ON parts
  FOR SELECT USING (
    user_belongs_to_shop(shop_id) AND 
    has_permission(auth.uid(), 'parts.view')
  );

CREATE POLICY "Parts insert policy" ON parts
  FOR INSERT WITH CHECK (
    user_belongs_to_shop(shop_id) AND 
    has_permission(auth.uid(), 'parts.create')
  );

CREATE POLICY "Parts update policy" ON parts
  FOR UPDATE USING (
    user_belongs_to_shop(shop_id) AND 
    has_permission(auth.uid(), 'parts.edit')
  );

CREATE POLICY "Parts delete policy" ON parts
  FOR DELETE USING (
    user_belongs_to_shop(shop_id) AND 
    has_permission(auth.uid(), 'parts.delete')
  );

-- Enhanced Estimates policies
CREATE POLICY "Estimates select policy" ON estimates
  FOR SELECT USING (
    user_belongs_to_shop(shop_id) AND 
    has_permission(auth.uid(), 'estimates.view')
  );

CREATE POLICY "Estimates insert policy" ON estimates
  FOR INSERT WITH CHECK (
    user_belongs_to_shop(shop_id) AND 
    has_permission(auth.uid(), 'estimates.create')
  );

CREATE POLICY "Estimates update policy" ON estimates
  FOR UPDATE USING (
    user_belongs_to_shop(shop_id) AND 
    (
      has_permission(auth.uid(), 'estimates.edit') OR
      created_by = auth.uid()
    )
  );

CREATE POLICY "Estimates delete policy" ON estimates
  FOR DELETE USING (
    user_belongs_to_shop(shop_id) AND 
    has_permission(auth.uid(), 'estimates.delete')
  );

-- =====================================================
-- REALTIME FILTERS AND SECURITY
-- =====================================================

-- Function to filter realtime updates by shop
CREATE OR REPLACE FUNCTION realtime_shop_filter()
RETURNS TRIGGER AS $$
DECLARE
  user_shop_id UUID;
BEGIN
  -- Get the current user's shop ID
  SELECT shop_id INTO user_shop_id
  FROM users 
  WHERE user_id = auth.uid();
  
  -- Only allow realtime updates for the user's shop
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.shop_id != user_shop_id THEN
    RETURN NULL; -- Don't send realtime update
  END IF;
  
  IF TG_OP = 'DELETE' AND OLD.shop_id != user_shop_id THEN
    RETURN NULL; -- Don't send realtime update
  END IF;
  
  -- Return the row to send realtime update
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- BUSINESS LOGIC FUNCTIONS
-- =====================================================

-- Function to get default permissions for a role
CREATE OR REPLACE FUNCTION get_default_permissions(user_role TEXT)
RETURNS JSONB AS $$
DECLARE
  permissions JSONB := '{
    "dashboard.view": false,
    "dashboard.export": false,
    "customers.view": false,
    "customers.create": false,
    "customers.edit": false,
    "customers.delete": false,
    "customers.export": false,
    "jobs.view": false,
    "jobs.create": false,
    "jobs.edit": false,
    "jobs.delete": false,
    "jobs.assign": false,
    "jobs.export": false,
    "estimates.view": false,
    "estimates.create": false,
    "estimates.edit": false,
    "estimates.delete": false,
    "estimates.approve": false,
    "estimates.export": false,
    "parts.view": false,
    "parts.create": false,
    "parts.edit": false,
    "parts.delete": false,
    "parts.order": false,
    "parts.receive": false,
    "parts.export": false,
    "inventory.view": false,
    "inventory.create": false,
    "inventory.edit": false,
    "inventory.delete": false,
    "inventory.adjust": false,
    "inventory.export": false,
    "financial.view": false,
    "financial.create": false,
    "financial.edit": false,
    "financial.delete": false,
    "financial.approve": false,
    "financial.export": false,
    "quality.view": false,
    "quality.create": false,
    "quality.edit": false,
    "quality.delete": false,
    "quality.approve": false,
    "quality.export": false,
    "users.view": false,
    "users.create": false,
    "users.edit": false,
    "users.delete": false,
    "users.permissions": false,
    "settings.view": false,
    "settings.edit": false,
    "reports.view": false,
    "reports.create": false,
    "reports.export": false,
    "integrations.view": false,
    "integrations.edit": false,
    "backup.view": false,
    "backup.create": false,
    "backup.restore": false
  }';
BEGIN
  CASE user_role
    WHEN 'owner', 'admin' THEN
      -- Owners and admins get all permissions
      SELECT jsonb_object_agg(key, true) INTO permissions
      FROM jsonb_each(permissions);
      
    WHEN 'manager' THEN
      permissions := permissions || '{
        "dashboard.view": true,
        "dashboard.export": true,
        "customers.view": true,
        "customers.create": true,
        "customers.edit": true,
        "customers.export": true,
        "jobs.view": true,
        "jobs.create": true,
        "jobs.edit": true,
        "jobs.assign": true,
        "jobs.export": true,
        "estimates.view": true,
        "estimates.create": true,
        "estimates.edit": true,
        "estimates.approve": true,
        "estimates.export": true,
        "parts.view": true,
        "parts.create": true,
        "parts.edit": true,
        "parts.order": true,
        "parts.receive": true,
        "parts.export": true,
        "inventory.view": true,
        "inventory.create": true,
        "inventory.edit": true,
        "inventory.adjust": true,
        "inventory.export": true,
        "financial.view": true,
        "financial.create": true,
        "financial.edit": true,
        "financial.approve": true,
        "financial.export": true,
        "quality.view": true,
        "quality.create": true,
        "quality.edit": true,
        "quality.approve": true,
        "quality.export": true,
        "users.view": true,
        "users.create": true,
        "users.edit": true,
        "settings.view": true,
        "settings.edit": true,
        "reports.view": true,
        "reports.create": true,
        "reports.export": true,
        "integrations.view": true,
        "integrations.edit": true
      }'::jsonb;
      
    WHEN 'service_advisor' THEN
      permissions := permissions || '{
        "dashboard.view": true,
        "customers.view": true,
        "customers.create": true,
        "customers.edit": true,
        "customers.export": true,
        "jobs.view": true,
        "jobs.create": true,
        "jobs.edit": true,
        "jobs.assign": true,
        "jobs.export": true,
        "estimates.view": true,
        "estimates.create": true,
        "estimates.edit": true,
        "estimates.export": true,
        "parts.view": true,
        "parts.order": true,
        "parts.export": true,
        "inventory.view": true,
        "inventory.export": true,
        "financial.view": true,
        "financial.create": true,
        "financial.edit": true,
        "financial.export": true,
        "quality.view": true,
        "quality.create": true,
        "quality.edit": true,
        "quality.export": true,
        "reports.view": true,
        "reports.export": true
      }'::jsonb;
      
    WHEN 'estimator' THEN
      permissions := permissions || '{
        "dashboard.view": true,
        "customers.view": true,
        "customers.create": true,
        "customers.edit": true,
        "jobs.view": true,
        "jobs.create": true,
        "jobs.edit": true,
        "estimates.view": true,
        "estimates.create": true,
        "estimates.edit": true,
        "estimates.export": true,
        "parts.view": true,
        "parts.order": true,
        "parts.export": true,
        "inventory.view": true,
        "financial.view": true,
        "financial.create": true,
        "financial.edit": true,
        "reports.view": true,
        "reports.export": true
      }'::jsonb;
      
    WHEN 'technician' THEN
      permissions := permissions || '{
        "dashboard.view": true,
        "jobs.view": true,
        "jobs.edit": true,
        "parts.view": true,
        "parts.order": true,
        "inventory.view": true,
        "quality.view": true,
        "quality.create": true,
        "quality.edit": true
      }'::jsonb;
      
    WHEN 'parts_manager' THEN
      permissions := permissions || '{
        "dashboard.view": true,
        "jobs.view": true,
        "parts.view": true,
        "parts.create": true,
        "parts.edit": true,
        "parts.order": true,
        "parts.receive": true,
        "parts.export": true,
        "inventory.view": true,
        "inventory.create": true,
        "inventory.edit": true,
        "inventory.adjust": true,
        "inventory.export": true,
        "financial.view": true,
        "financial.create": true,
        "financial.edit": true,
        "reports.view": true,
        "reports.export": true
      }'::jsonb;
      
    WHEN 'receptionist' THEN
      permissions := permissions || '{
        "dashboard.view": true,
        "customers.view": true,
        "customers.create": true,
        "customers.edit": true,
        "customers.export": true,
        "jobs.view": true,
        "jobs.create": true,
        "jobs.edit": true,
        "financial.view": true,
        "financial.create": true,
        "financial.edit": true
      }'::jsonb;
      
    WHEN 'accountant' THEN
      permissions := permissions || '{
        "dashboard.view": true,
        "customers.view": true,
        "customers.export": true,
        "jobs.view": true,
        "jobs.export": true,
        "financial.view": true,
        "financial.create": true,
        "financial.edit": true,
        "financial.approve": true,
        "financial.export": true,
        "reports.view": true,
        "reports.create": true,
        "reports.export": true
      }'::jsonb;
  END CASE;
  
  RETURN permissions;
END;
$$ LANGUAGE plpgsql;

-- Function to update user permissions when role changes
CREATE OR REPLACE FUNCTION update_user_permissions()
RETURNS TRIGGER AS $$
BEGIN
  -- If role changed, update permissions
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    NEW.permissions := get_default_permissions(NEW.role);
  END IF;
  
  -- If permissions are empty and this is a new user, set default permissions
  IF NEW.permissions = '{}'::jsonb OR NEW.permissions IS NULL THEN
    NEW.permissions := get_default_permissions(NEW.role);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user permissions
CREATE TRIGGER update_user_permissions_trigger
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_permissions();

-- =====================================================
-- DASHBOARD AND REPORTING FUNCTIONS
-- =====================================================

-- Function to get shop dashboard stats
CREATE OR REPLACE FUNCTION get_shop_dashboard_stats(shop_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  -- Check if user has permission to view dashboard
  IF NOT has_permission(auth.uid(), 'dashboard.view') THEN
    RAISE EXCEPTION 'Insufficient permissions to view dashboard';
  END IF;
  
  -- Check if user belongs to the shop
  IF NOT user_belongs_to_shop(shop_uuid) THEN
    RAISE EXCEPTION 'User does not belong to this shop';
  END IF;
  
  WITH job_stats AS (
    SELECT 
      COUNT(*) as total_jobs,
      COUNT(CASE WHEN status IN ('body_structure', 'paint_prep', 'paint_booth', 'reassembly') THEN 1 END) as active_jobs,
      COUNT(CASE WHEN status = 'ready_pickup' THEN 1 END) as ready_jobs,
      COUNT(CASE WHEN target_delivery_date < NOW() AND status != 'delivered' THEN 1 END) as overdue_jobs,
      COUNT(CASE WHEN status = 'delivered' AND DATE(actual_delivery_date) = CURRENT_DATE THEN 1 END) as delivered_today,
      AVG(CASE WHEN status = 'delivered' THEN cycle_time END) as avg_cycle_time,
      SUM(CASE WHEN status = 'delivered' AND EXTRACT(MONTH FROM actual_delivery_date) = EXTRACT(MONTH FROM NOW()) THEN total_amount END) as revenue_this_month
    FROM jobs 
    WHERE shop_id = shop_uuid
  ),
  customer_stats AS (
    SELECT 
      COUNT(*) as total_customers,
      COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_customers_30d
    FROM customers 
    WHERE shop_id = shop_uuid
  ),
  parts_stats AS (
    SELECT 
      COUNT(CASE WHEN current_stock <= minimum_stock THEN 1 END) as low_stock_parts,
      COUNT(CASE WHEN current_stock <= reorder_point THEN 1 END) as reorder_parts
    FROM parts 
    WHERE shop_id = shop_uuid AND is_active = true
  )
  SELECT jsonb_build_object(
    'jobs', jsonb_build_object(
      'total', js.total_jobs,
      'active', js.active_jobs,
      'ready', js.ready_jobs,
      'overdue', js.overdue_jobs,
      'delivered_today', js.delivered_today,
      'avg_cycle_time', COALESCE(js.avg_cycle_time, 0),
      'revenue_this_month', COALESCE(js.revenue_this_month, 0)
    ),
    'customers', jsonb_build_object(
      'total', cs.total_customers,
      'new_30d', cs.new_customers_30d
    ),
    'parts', jsonb_build_object(
      'low_stock', ps.low_stock_parts,
      'reorder_needed', ps.reorder_parts
    )
  ) INTO stats
  FROM job_stats js
  CROSS JOIN customer_stats cs
  CROSS JOIN parts_stats ps;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SEARCH FUNCTIONS
-- =====================================================

-- Function for global search across entities
CREATE OR REPLACE FUNCTION global_search(
  shop_uuid UUID,
  search_term TEXT,
  entity_types TEXT[] DEFAULT ARRAY['jobs', 'customers', 'vehicles', 'parts']
)
RETURNS JSONB AS $$
DECLARE
  results JSONB := '[]'::jsonb;
  job_results JSONB;
  customer_results JSONB;
  vehicle_results JSONB;
  part_results JSONB;
BEGIN
  -- Check if user belongs to the shop
  IF NOT user_belongs_to_shop(shop_uuid) THEN
    RAISE EXCEPTION 'User does not belong to this shop';
  END IF;
  
  -- Search jobs if requested
  IF 'jobs' = ANY(entity_types) AND has_permission(auth.uid(), 'jobs.view') THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'type', 'job',
        'id', id,
        'title', job_number || ' - ' || COALESCE(damage_description, ''),
        'subtitle', status,
        'url', '/jobs/' || id
      )
    ) INTO job_results
    FROM jobs
    WHERE shop_id = shop_uuid 
      AND (
        job_number ILIKE '%' || search_term || '%' OR
        damage_description ILIKE '%' || search_term || '%' OR
        repair_description ILIKE '%' || search_term || '%' OR
        notes ILIKE '%' || search_term || '%'
      )
    LIMIT 10;
    
    IF job_results IS NOT NULL THEN
      results := results || job_results;
    END IF;
  END IF;
  
  -- Search customers if requested
  IF 'customers' = ANY(entity_types) AND has_permission(auth.uid(), 'customers.view') THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'type', 'customer',
        'id', id,
        'title', first_name || ' ' || last_name,
        'subtitle', COALESCE(email, phone),
        'url', '/customers/' || id
      )
    ) INTO customer_results
    FROM customers
    WHERE shop_id = shop_uuid 
      AND (
        first_name ILIKE '%' || search_term || '%' OR
        last_name ILIKE '%' || search_term || '%' OR
        email ILIKE '%' || search_term || '%' OR
        phone ILIKE '%' || search_term || '%' OR
        customer_number ILIKE '%' || search_term || '%'
      )
    LIMIT 10;
    
    IF customer_results IS NOT NULL THEN
      results := results || customer_results;
    END IF;
  END IF;
  
  -- Search vehicles if requested
  IF 'vehicles' = ANY(entity_types) AND has_permission(auth.uid(), 'jobs.view') THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'type', 'vehicle',
        'id', id,
        'title', year || ' ' || make || ' ' || model,
        'subtitle', 'VIN: ' || vin,
        'url', '/vehicles/' || id
      )
    ) INTO vehicle_results
    FROM vehicles
    WHERE shop_id = shop_uuid 
      AND (
        make ILIKE '%' || search_term || '%' OR
        model ILIKE '%' || search_term || '%' OR
        vin ILIKE '%' || search_term || '%' OR
        license_plate ILIKE '%' || search_term || '%'
      )
    LIMIT 10;
    
    IF vehicle_results IS NOT NULL THEN
      results := results || vehicle_results;
    END IF;
  END IF;
  
  -- Search parts if requested
  IF 'parts' = ANY(entity_types) AND has_permission(auth.uid(), 'parts.view') THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'type', 'part',
        'id', id,
        'title', part_number || ' - ' || description,
        'subtitle', 'Stock: ' || current_stock,
        'url', '/parts/' || id
      )
    ) INTO part_results
    FROM parts
    WHERE shop_id = shop_uuid 
      AND (
        part_number ILIKE '%' || search_term || '%' OR
        description ILIKE '%' || search_term || '%' OR
        oem_part_number ILIKE '%' || search_term || '%'
      )
    LIMIT 10;
    
    IF part_results IS NOT NULL THEN
      results := results || part_results;
    END IF;
  END IF;
  
  RETURN results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- AUDIT AND LOGGING
-- =====================================================

-- Create audit log table
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit_log
CREATE INDEX idx_audit_log_shop ON audit_log (shop_id);
CREATE INDEX idx_audit_log_user ON audit_log (user_id);
CREATE INDEX idx_audit_log_table ON audit_log (table_name);
CREATE INDEX idx_audit_log_record ON audit_log (record_id);
CREATE INDEX idx_audit_log_operation ON audit_log (operation);
CREATE INDEX idx_audit_log_created ON audit_log (created_at);

-- RLS for audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit logs are viewable by shop owners and admins" ON audit_log
  FOR SELECT USING (
    user_belongs_to_shop(shop_id) AND 
    auth.uid() IN (
      SELECT user_id FROM users 
      WHERE shop_id = audit_log.shop_id 
      AND role IN ('owner', 'admin', 'manager')
      AND is_active = true
    )
  );

-- Generic audit function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
  old_values JSONB;
  new_values JSONB;
  changed_fields TEXT[] := ARRAY[]::TEXT[];
  shop_uuid UUID;
BEGIN
  -- Get shop_id from the record
  IF TG_OP = 'DELETE' THEN
    shop_uuid := OLD.shop_id;
    old_values := to_jsonb(OLD);
  ELSE
    shop_uuid := NEW.shop_id;
    new_values := to_jsonb(NEW);
  END IF;
  
  -- For updates, also get old values and changed fields
  IF TG_OP = 'UPDATE' THEN
    old_values := to_jsonb(OLD);
    
    -- Identify changed fields
    SELECT array_agg(key) INTO changed_fields
    FROM jsonb_each(old_values) o
    JOIN jsonb_each(new_values) n ON o.key = n.key
    WHERE o.value IS DISTINCT FROM n.value;
  END IF;
  
  -- Insert audit record
  INSERT INTO audit_log (
    shop_id,
    user_id,
    table_name,
    record_id,
    operation,
    old_values,
    new_values,
    changed_fields
  ) VALUES (
    shop_uuid,
    auth.uid(),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    old_values,
    new_values,
    changed_fields
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for key tables
CREATE TRIGGER audit_jobs_trigger
  AFTER INSERT OR UPDATE OR DELETE ON jobs
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_customers_trigger
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_parts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON parts
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_estimates_trigger
  AFTER INSERT OR UPDATE OR DELETE ON estimates
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();