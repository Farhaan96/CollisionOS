-- ==============================================================
-- SUPABASE SECURITY FUNCTIONS FOR MULTI-TENANT DATA ISOLATION
-- ==============================================================
-- These functions enforce Row Level Security (RLS) policies
-- to ensure customers can only access their own shop's data

-- Check if current authenticated user belongs to a specific shop
CREATE OR REPLACE FUNCTION user_belongs_to_shop(shop_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Return false if no user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user exists and belongs to the specified shop
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND shop_id = shop_uuid
    AND deleted_at IS NULL  -- Ensure user is not soft-deleted
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has a specific permission
CREATE OR REPLACE FUNCTION has_permission(user_uuid UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Return false if no user specified
  IF user_uuid IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get user's role
  SELECT role INTO user_role
  FROM public.users
  WHERE id = user_uuid
  AND deleted_at IS NULL;
  
  -- If no role found, return false
  IF user_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check permission based on role hierarchy
  CASE user_role
    WHEN 'owner' THEN
      -- Owner has all permissions
      RETURN true;
    WHEN 'admin' THEN
      -- Admin has most permissions except shop management
      RETURN permission_name NOT IN ('shop.delete', 'users.manage_owners');
    WHEN 'manager' THEN
      -- Manager has operational permissions
      RETURN permission_name IN (
        'repair_orders.manage', 'customers.manage', 'vehicles.manage',
        'parts_orders.manage', 'estimates.manage', 'invoices.manage',
        'bms.manage', 'claims.manage', 'attachments.manage'
      );
    WHEN 'technician' THEN
      -- Technician has limited permissions
      RETURN permission_name IN (
        'repair_orders.view', 'customers.view', 'vehicles.view',
        'parts_orders.view', 'attachments.view'
      );
    WHEN 'viewer' THEN
      -- Viewer has read-only permissions
      RETURN permission_name LIKE '%.view';
    ELSE
      -- Unknown role, no permissions
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validate that a user can access specific data within their shop
CREATE OR REPLACE FUNCTION validate_shop_access(table_name TEXT, record_shop_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Return false if no user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Return false if record doesn't belong to any shop
  IF record_shop_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Validate user belongs to the shop that owns this record
  RETURN user_belongs_to_shop(record_shop_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get the shop_id for the current authenticated user
CREATE OR REPLACE FUNCTION get_user_shop_id()
RETURNS UUID AS $$
DECLARE
  user_shop_id UUID;
BEGIN
  -- Return null if no user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get user's shop_id
  SELECT shop_id INTO user_shop_id
  FROM public.users
  WHERE id = auth.uid()
  AND deleted_at IS NULL;
  
  RETURN user_shop_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure function to get repair orders for current user's shop only
CREATE OR REPLACE FUNCTION get_user_repair_orders(
  filters JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE(
  id UUID,
  ro_number VARCHAR(50),
  status repair_status,
  total_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  user_shop_id UUID;
BEGIN
  -- Get current user's shop
  user_shop_id := get_user_shop_id();
  
  -- Return empty if user has no shop access
  IF user_shop_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Return repair orders for user's shop only
  RETURN QUERY
  SELECT 
    ro.id,
    ro.ro_number,
    ro.status,
    ro.total_amount,
    ro.created_at
  FROM public.repair_orders ro
  WHERE ro.shop_id = user_shop_id
  ORDER BY ro.created_at DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log security violations for audit purposes
CREATE OR REPLACE FUNCTION log_security_violation(
  user_id UUID,
  attempted_shop_id UUID,
  table_name TEXT,
  action_type TEXT,
  details JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID AS $$
BEGIN
  -- Insert security violation log
  INSERT INTO public.security_audit_log (
    user_id,
    attempted_shop_id,
    table_name,
    action_type,
    details,
    violation_time
  ) VALUES (
    user_id,
    attempted_shop_id,
    table_name,
    action_type,
    details,
    NOW()
  );
  
  -- Raise notice for monitoring
  RAISE NOTICE 'Security violation: User % attempted % on % for shop %', 
    user_id, action_type, table_name, attempted_shop_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create security audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    attempted_shop_id UUID,
    table_name TEXT NOT NULL,
    action_type TEXT NOT NULL,
    details JSONB DEFAULT '{}'::JSONB,
    violation_time TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for security audit log
CREATE INDEX IF NOT EXISTS idx_security_audit_user_time 
ON public.security_audit_log(user_id, violation_time DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_shop_time 
ON public.security_audit_log(attempted_shop_id, violation_time DESC);

-- Enable RLS on security audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view security logs
CREATE POLICY "Security logs viewable by admins only" ON public.security_audit_log
    FOR SELECT USING (has_permission(auth.uid(), 'security.view'));

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION user_belongs_to_shop(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_permission(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_shop_access(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_shop_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_repair_orders(JSONB) TO authenticated;

-- Grant execute permissions for logging (service role only)
GRANT EXECUTE ON FUNCTION log_security_violation(UUID, UUID, TEXT, TEXT, JSONB) TO service_role;

-- Add comments for documentation
COMMENT ON FUNCTION user_belongs_to_shop(UUID) IS 'Check if current user belongs to specified shop';
COMMENT ON FUNCTION has_permission(UUID, TEXT) IS 'Check if user has specific permission based on role';
COMMENT ON FUNCTION validate_shop_access(TEXT, UUID) IS 'Validate user can access data for their shop';
COMMENT ON FUNCTION get_user_shop_id() IS 'Get shop_id for current authenticated user';
COMMENT ON FUNCTION get_user_repair_orders(JSONB) IS 'Securely get repair orders for current user shop';
COMMENT ON FUNCTION log_security_violation(UUID, UUID, TEXT, TEXT, JSONB) IS 'Log security violations for audit';

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Security functions created successfully';
    RAISE NOTICE '🔒 Multi-tenant data isolation is now enforced';
    RAISE NOTICE '📊 Security audit logging is enabled';
    RAISE NOTICE '';
    RAISE NOTICE 'Functions created:';
    RAISE NOTICE '  - user_belongs_to_shop()';
    RAISE NOTICE '  - has_permission()';
    RAISE NOTICE '  - validate_shop_access()';
    RAISE NOTICE '  - get_user_shop_id()';
    RAISE NOTICE '  - get_user_repair_orders()';
    RAISE NOTICE '  - log_security_violation()';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - security_audit_log';
END $$;