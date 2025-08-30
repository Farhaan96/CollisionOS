-- ==============================================================
-- CollisionOS AI Assistant Database Functions
-- Helper functions to support AI assistant queries
-- ==============================================================

-- Function to calculate average cycle time
CREATE OR REPLACE FUNCTION calculate_average_cycle_time(shop_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE(avg_cycle_time DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    AVG(EXTRACT(epoch FROM (completion_date - drop_off_date)) / 86400)::DECIMAL(8,2) as avg_cycle_time
  FROM public.repair_orders
  WHERE shop_id = shop_uuid
    AND drop_off_date IS NOT NULL
    AND completion_date IS NOT NULL
    AND drop_off_date >= (CURRENT_DATE - INTERVAL '1 day' * days_back);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate monthly revenue
CREATE OR REPLACE FUNCTION calculate_monthly_revenue(shop_uuid UUID)
RETURNS TABLE(total_revenue DECIMAL, labor_revenue DECIMAL, parts_revenue DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    SUM(total_amount)::DECIMAL(12,2) as total_revenue,
    SUM(labor_amount)::DECIMAL(12,2) as labor_revenue,
    SUM(parts_amount)::DECIMAL(12,2) as parts_revenue
  FROM public.repair_orders
  WHERE shop_id = shop_uuid
    AND EXTRACT(month FROM created_at) = EXTRACT(month FROM CURRENT_DATE)
    AND EXTRACT(year FROM created_at) = EXTRACT(year FROM CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending parts summary
CREATE OR REPLACE FUNCTION get_pending_parts_summary(shop_uuid UUID)
RETURNS TABLE(
  pending_orders INTEGER,
  total_value DECIMAL,
  oldest_order_days INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as pending_orders,
    SUM(total_amount)::DECIMAL(12,2) as total_value,
    MAX(EXTRACT(epoch FROM (CURRENT_DATE - order_date)) / 86400)::INTEGER as oldest_order_days
  FROM public.parts_orders
  WHERE shop_id = shop_uuid
    AND status IN ('ordered', 'backordered', 'shipped');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get shop performance metrics
CREATE OR REPLACE FUNCTION get_shop_performance_metrics(shop_uuid UUID)
RETURNS TABLE(
  total_ros INTEGER,
  completed_ros INTEGER,
  avg_cycle_time DECIMAL,
  pending_parts INTEGER,
  overdue_ros INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM public.repair_orders WHERE shop_id = shop_uuid) as total_ros,
    (SELECT COUNT(*)::INTEGER FROM public.repair_orders WHERE shop_id = shop_uuid AND status = 'completed') as completed_ros,
    (SELECT AVG(EXTRACT(epoch FROM (completion_date - drop_off_date)) / 86400)::DECIMAL(8,2) 
     FROM public.repair_orders 
     WHERE shop_id = shop_uuid AND completion_date IS NOT NULL AND drop_off_date IS NOT NULL) as avg_cycle_time,
    (SELECT COUNT(*)::INTEGER FROM public.parts_orders WHERE shop_id = shop_uuid AND status IN ('ordered', 'backordered')) as pending_parts,
    (SELECT COUNT(*)::INTEGER FROM public.repair_orders 
     WHERE shop_id = shop_uuid 
     AND estimated_completion_date < CURRENT_DATE 
     AND status NOT IN ('completed', 'delivered')) as overdue_ros;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search across multiple entities
CREATE OR REPLACE FUNCTION ai_search_entities(
  shop_uuid UUID,
  search_term TEXT,
  entity_types TEXT[] DEFAULT ARRAY['vehicles', 'customers', 'repair_orders']
)
RETURNS TABLE(
  entity_type TEXT,
  entity_id UUID,
  title TEXT,
  description TEXT,
  relevance_score INTEGER
) AS $$
BEGIN
  -- Search vehicles
  IF 'vehicles' = ANY(entity_types) THEN
    RETURN QUERY
    SELECT 
      'vehicle'::TEXT as entity_type,
      v.id as entity_id,
      (v.year::TEXT || ' ' || v.make || ' ' || v.model) as title,
      ('VIN: ' || v.vin || ' - Owner: ' || c.first_name || ' ' || c.last_name) as description,
      (CASE 
        WHEN LOWER(v.make || ' ' || v.model) LIKE LOWER('%' || search_term || '%') THEN 10
        WHEN LOWER(v.vin) LIKE LOWER('%' || search_term || '%') THEN 8
        ELSE 5
      END) as relevance_score
    FROM public.vehicles v
    JOIN public.customers c ON v.customer_id = c.id
    WHERE v.shop_id = shop_uuid
      AND (
        LOWER(v.make || ' ' || v.model) LIKE LOWER('%' || search_term || '%')
        OR LOWER(v.vin) LIKE LOWER('%' || search_term || '%')
        OR LOWER(v.license_plate) LIKE LOWER('%' || search_term || '%')
      );
  END IF;

  -- Search customers
  IF 'customers' = ANY(entity_types) THEN
    RETURN QUERY
    SELECT 
      'customer'::TEXT as entity_type,
      c.id as entity_id,
      (c.first_name || ' ' || c.last_name) as title,
      ('Phone: ' || COALESCE(c.phone, 'N/A') || ' - Email: ' || COALESCE(c.email, 'N/A')) as description,
      (CASE 
        WHEN LOWER(c.first_name || ' ' || c.last_name) LIKE LOWER('%' || search_term || '%') THEN 10
        WHEN LOWER(c.email) LIKE LOWER('%' || search_term || '%') THEN 8
        WHEN c.phone LIKE '%' || search_term || '%' THEN 8
        ELSE 5
      END) as relevance_score
    FROM public.customers c
    WHERE c.shop_id = shop_uuid
      AND (
        LOWER(c.first_name || ' ' || c.last_name) LIKE LOWER('%' || search_term || '%')
        OR LOWER(c.email) LIKE LOWER('%' || search_term || '%')
        OR c.phone LIKE '%' || search_term || '%'
      );
  END IF;

  -- Search repair orders
  IF 'repair_orders' = ANY(entity_types) THEN
    RETURN QUERY
    SELECT 
      'repair_order'::TEXT as entity_type,
      ro.id as entity_id,
      ro.ro_number as title,
      ('Status: ' || ro.status || ' - Customer: ' || c.first_name || ' ' || c.last_name) as description,
      (CASE 
        WHEN LOWER(ro.ro_number) LIKE LOWER('%' || search_term || '%') THEN 10
        WHEN LOWER(ro.status) LIKE LOWER('%' || search_term || '%') THEN 6
        ELSE 3
      END) as relevance_score
    FROM public.repair_orders ro
    JOIN public.customers c ON ro.customer_id = c.id
    WHERE ro.shop_id = shop_uuid
      AND (
        LOWER(ro.ro_number) LIKE LOWER('%' || search_term || '%')
        OR LOWER(ro.status) LIKE LOWER('%' || search_term || '%')
        OR LOWER(ro.damage_description) LIKE LOWER('%' || search_term || '%')
      );
  END IF;

  -- Order by relevance
  RETURN QUERY
  SELECT * FROM (
    SELECT DISTINCT entity_type, entity_id, title, description, relevance_score 
    FROM (VALUES (NULL::TEXT, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::INTEGER)) AS dummy
    WHERE FALSE  -- This ensures the main RETURN QUERY above gets executed
  ) sub
  ORDER BY relevance_score DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION calculate_average_cycle_time(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_monthly_revenue(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_parts_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_shop_performance_metrics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION ai_search_entities(UUID, TEXT, TEXT[]) TO authenticated;

-- Create indexes to optimize AI queries
CREATE INDEX IF NOT EXISTS idx_repair_orders_cycle_time ON public.repair_orders(shop_id, drop_off_date, completion_date) WHERE drop_off_date IS NOT NULL AND completion_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_repair_orders_monthly ON public.repair_orders(shop_id, created_at) WHERE EXTRACT(month FROM created_at) = EXTRACT(month FROM CURRENT_DATE);
CREATE INDEX IF NOT EXISTS idx_parts_orders_status ON public.parts_orders(shop_id, status, order_date);
CREATE INDEX IF NOT EXISTS idx_vehicles_search ON public.vehicles(shop_id, make, model, vin);
CREATE INDEX IF NOT EXISTS idx_customers_search ON public.customers(shop_id, first_name, last_name, email, phone);

-- Create a view for AI assistant to get common shop metrics
CREATE OR REPLACE VIEW ai_shop_metrics AS
SELECT 
  s.id as shop_id,
  s.name as shop_name,
  COUNT(ro.id) as total_repair_orders,
  COUNT(CASE WHEN ro.status = 'completed' THEN 1 END) as completed_repair_orders,
  COUNT(CASE WHEN ro.estimated_completion_date < CURRENT_DATE AND ro.status NOT IN ('completed', 'delivered') THEN 1 END) as overdue_repair_orders,
  COUNT(po.id) as total_parts_orders,
  COUNT(CASE WHEN po.status IN ('ordered', 'backordered') THEN 1 END) as pending_parts_orders,
  AVG(CASE WHEN ro.completion_date IS NOT NULL AND ro.drop_off_date IS NOT NULL 
       THEN EXTRACT(epoch FROM (ro.completion_date - ro.drop_off_date)) / 86400 END) as avg_cycle_time_days,
  SUM(ro.total_amount) as total_revenue,
  SUM(ro.labor_amount) as labor_revenue,
  SUM(ro.parts_amount) as parts_revenue
FROM public.shops s
LEFT JOIN public.repair_orders ro ON s.id = ro.shop_id
LEFT JOIN public.parts_orders po ON s.id = po.shop_id
GROUP BY s.id, s.name;

-- Grant access to the view
GRANT SELECT ON ai_shop_metrics TO authenticated;

-- Create RLS policy for the view
ALTER VIEW ai_shop_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AI metrics are viewable by shop members" ON ai_shop_metrics
  FOR SELECT USING (user_belongs_to_shop(shop_id));

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '🤖 AI Assistant database functions deployed successfully!';
    RAISE NOTICE 'Available functions:';
    RAISE NOTICE '  - calculate_average_cycle_time(shop_uuid, days_back)';
    RAISE NOTICE '  - calculate_monthly_revenue(shop_uuid)';
    RAISE NOTICE '  - get_pending_parts_summary(shop_uuid)';
    RAISE NOTICE '  - get_shop_performance_metrics(shop_uuid)';
    RAISE NOTICE '  - ai_search_entities(shop_uuid, search_term, entity_types)';
    RAISE NOTICE '  - ai_shop_metrics view for dashboard data';
END $$;