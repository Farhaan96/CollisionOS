-- ==============================================================
-- CollisionOS Realtime and Permissions Schema (SAFE VERSION)
-- File: 03_realtime_and_permissions_safe.sql
-- Description: RLS policies, real-time features, and security with safe creation
-- ==============================================================

-- =====================================================
-- REALTIME CONFIGURATION (Safe)
-- =====================================================

-- Enable realtime for key tables (only if publication exists)
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shops;
EXCEPTION
    WHEN undefined_object THEN null;
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
EXCEPTION
    WHEN undefined_object THEN null;
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
EXCEPTION
    WHEN undefined_object THEN null;
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
EXCEPTION
    WHEN undefined_object THEN null;
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
EXCEPTION
    WHEN undefined_object THEN null;
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.parts;
EXCEPTION
    WHEN undefined_object THEN null;
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.estimates;
EXCEPTION
    WHEN undefined_object THEN null;
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vendors;
EXCEPTION
    WHEN undefined_object THEN null;
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- SECURITY FUNCTIONS
-- =====================================================

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION has_permission(user_uuid UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_permissions JSONB;
  user_role TEXT;
BEGIN
  SELECT permissions, role INTO user_permissions, user_role
  FROM public.users 
  WHERE id = user_uuid AND is_active = true;
  
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
  FROM public.users 
  WHERE id = auth.uid() AND is_active = true;
  
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
-- ENABLE RLS ON ALL TABLES
-- =====================================================

-- Enable RLS on all tables (only if not already enabled)
DO $$ BEGIN
    ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.job_photos ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.job_notes ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- BASIC RLS POLICIES (Safe Creation)
-- =====================================================

-- Shops policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Shops are viewable by shop members" ON public.shops;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Shops are viewable by shop members" ON public.shops
        FOR SELECT USING (user_belongs_to_shop(id));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Shop owners can manage their shop" ON public.shops
        FOR ALL USING (user_belongs_to_shop(id) AND has_permission(auth.uid(), 'shop.manage'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users are viewable by shop members" ON public.users;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users are viewable by shop members" ON public.users
        FOR SELECT USING (user_belongs_to_shop(shop_id));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Shop managers can manage users" ON public.users
        FOR ALL USING (user_belongs_to_shop(shop_id) AND has_permission(auth.uid(), 'users.manage'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Customers policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Customers are viewable by shop members" ON public.customers;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Customers are viewable by shop members" ON public.customers
        FOR SELECT USING (user_belongs_to_shop(shop_id));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Shop members can manage customers" ON public.customers
        FOR ALL USING (user_belongs_to_shop(shop_id) AND has_permission(auth.uid(), 'customers.manage'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Vehicles policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Vehicles are viewable by shop members" ON public.vehicles;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Vehicles are viewable by shop members" ON public.vehicles
        FOR SELECT USING (user_belongs_to_shop(shop_id));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Shop members can manage vehicles" ON public.vehicles
        FOR ALL USING (user_belongs_to_shop(shop_id) AND has_permission(auth.uid(), 'vehicles.manage'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Vendors policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Vendors are viewable by shop members" ON public.vendors;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Vendors are viewable by shop members" ON public.vendors
        FOR SELECT USING (user_belongs_to_shop(shop_id));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Shop members can manage vendors" ON public.vendors
        FOR ALL USING (user_belongs_to_shop(shop_id) AND has_permission(auth.uid(), 'vendors.manage'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Parts policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Parts are viewable by shop members" ON public.parts;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Parts are viewable by shop members" ON public.parts
        FOR SELECT USING (user_belongs_to_shop(shop_id));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Shop members can manage parts" ON public.parts
        FOR ALL USING (user_belongs_to_shop(shop_id) AND has_permission(auth.uid(), 'parts.manage'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Jobs policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Jobs are viewable by shop members" ON public.jobs;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Jobs are viewable by shop members" ON public.jobs
        FOR SELECT USING (user_belongs_to_shop(shop_id));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Shop members can manage jobs" ON public.jobs
        FOR ALL USING (user_belongs_to_shop(shop_id) AND has_permission(auth.uid(), 'jobs.manage'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Estimates policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Estimates are viewable by shop members" ON public.estimates;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Estimates are viewable by shop members" ON public.estimates
        FOR SELECT USING (user_belongs_to_shop(shop_id));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Shop members can manage estimates" ON public.estimates
        FOR ALL USING (user_belongs_to_shop(shop_id) AND has_permission(auth.uid(), 'estimates.manage'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Work orders policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Work orders are viewable by shop members" ON public.work_orders;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Work orders are viewable by shop members" ON public.work_orders
        FOR SELECT USING (user_belongs_to_shop(shop_id));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Shop members can manage work orders" ON public.work_orders
        FOR ALL USING (user_belongs_to_shop(shop_id) AND has_permission(auth.uid(), 'work_orders.manage'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Job photos policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Job photos are viewable by shop members" ON public.job_photos;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Job photos are viewable by shop members" ON public.job_photos
        FOR SELECT USING (user_belongs_to_shop(shop_id));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Shop members can manage job photos" ON public.job_photos
        FOR ALL USING (user_belongs_to_shop(shop_id) AND has_permission(auth.uid(), 'job_photos.manage'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Job notes policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Job notes are viewable by shop members" ON public.job_notes;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Job notes are viewable by shop members" ON public.job_notes
        FOR SELECT USING (user_belongs_to_shop(shop_id));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Shop members can manage job notes" ON public.job_notes
        FOR ALL USING (user_belongs_to_shop(shop_id) AND has_permission(auth.uid(), 'job_notes.manage'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Audit trail policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Audit trail is viewable by shop members" ON public.audit_trail;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Audit trail is viewable by shop members" ON public.audit_trail
        FOR SELECT USING (user_belongs_to_shop(shop_id));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Notification details
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
  category VARCHAR(50), -- 'job', 'customer', 'parts', 'system'
  
  -- Action details
  action_url VARCHAR(500),
  action_text VARCHAR(100),
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes only if they don't exist
DO $$ BEGIN
    CREATE INDEX idx_notifications_shop_id ON public.notifications(shop_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enable RLS on notifications
DO $$ BEGIN
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Notifications policies
DO $$ BEGIN
    CREATE POLICY "Users can view their own notifications" ON public.notifications
        FOR SELECT USING (user_id = auth.uid() AND user_belongs_to_shop(shop_id));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update their own notifications" ON public.notifications
        FOR UPDATE USING (user_id = auth.uid() AND user_belongs_to_shop(shop_id));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated_at trigger for notifications
DO $$ BEGIN
    CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
