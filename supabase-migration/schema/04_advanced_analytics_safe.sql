-- ==============================================================
-- CollisionOS Advanced Analytics Schema (SAFE VERSION)
-- File: 04_advanced_analytics_safe.sql
-- Description: Advanced analytics capabilities with safe creation
-- ==============================================================

-- ==============================================================
-- ANALYTICS AGGREGATION TABLES
-- These tables provide pre-calculated metrics for fast reporting
-- ==============================================================

-- Daily business metrics aggregation
CREATE TABLE IF NOT EXISTS public.daily_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    
    -- Job metrics
    jobs_created INTEGER DEFAULT 0,
    jobs_completed INTEGER DEFAULT 0,
    jobs_in_progress INTEGER DEFAULT 0,
    jobs_on_hold INTEGER DEFAULT 0,
    jobs_cancelled INTEGER DEFAULT 0,
    
    -- Revenue metrics
    revenue_total DECIMAL(12,2) DEFAULT 0.00,
    revenue_labor DECIMAL(12,2) DEFAULT 0.00,
    revenue_parts DECIMAL(12,2) DEFAULT 0.00,
    revenue_materials DECIMAL(12,2) DEFAULT 0.00,
    revenue_sublet DECIMAL(12,2) DEFAULT 0.00,
    
    -- Cost metrics
    cost_parts DECIMAL(12,2) DEFAULT 0.00,
    cost_labor DECIMAL(12,2) DEFAULT 0.00,
    cost_materials DECIMAL(12,2) DEFAULT 0.00,
    cost_sublet DECIMAL(12,2) DEFAULT 0.00,
    
    -- Profit metrics
    gross_profit DECIMAL(12,2) DEFAULT 0.00,
    net_profit DECIMAL(12,2) DEFAULT 0.00,
    profit_margin DECIMAL(5,2) DEFAULT 0.00,
    
    -- Customer metrics
    new_customers INTEGER DEFAULT 0,
    returning_customers INTEGER DEFAULT 0,
    customer_satisfaction_avg DECIMAL(3,2) DEFAULT 0.00,
    
    -- Efficiency metrics
    avg_cycle_time DECIMAL(8,2) DEFAULT 0.00,
    capacity_utilization DECIMAL(5,2) DEFAULT 0.00,
    technician_efficiency DECIMAL(5,2) DEFAULT 100.00,
    
    -- Parts metrics
    parts_ordered INTEGER DEFAULT 0,
    parts_received INTEGER DEFAULT 0,
    parts_backordered INTEGER DEFAULT 0,
    inventory_turnover DECIMAL(8,2) DEFAULT 0.00,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes only if they don't exist
DO $$ BEGIN
    CREATE UNIQUE INDEX idx_daily_metrics_shop_date ON public.daily_metrics(shop_id, metric_date);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_daily_metrics_date ON public.daily_metrics(metric_date);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_daily_metrics_shop ON public.daily_metrics(shop_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Monthly aggregation rollup table
CREATE TABLE IF NOT EXISTS public.monthly_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    metric_year INTEGER NOT NULL,
    metric_month INTEGER NOT NULL CHECK (metric_month >= 1 AND metric_month <= 12),
    
    -- Aggregated from daily metrics
    total_jobs INTEGER DEFAULT 0,
    completed_jobs INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0.00,
    total_costs DECIMAL(12,2) DEFAULT 0.00,
    total_profit DECIMAL(12,2) DEFAULT 0.00,
    avg_profit_margin DECIMAL(5,2) DEFAULT 0.00,
    
    -- Calculated metrics
    jobs_per_day DECIMAL(8,2) DEFAULT 0.00,
    revenue_per_job DECIMAL(10,2) DEFAULT 0.00,
    revenue_per_day DECIMAL(10,2) DEFAULT 0.00,
    
    -- Growth metrics (compared to previous month)
    revenue_growth DECIMAL(5,2) DEFAULT 0.00,
    jobs_growth DECIMAL(5,2) DEFAULT 0.00,
    profit_growth DECIMAL(5,2) DEFAULT 0.00,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes only if they don't exist
DO $$ BEGIN
    CREATE UNIQUE INDEX idx_monthly_metrics_shop_year_month ON public.monthly_metrics(shop_id, metric_year, metric_month);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_monthly_metrics_year_month ON public.monthly_metrics(metric_year, metric_month);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================
-- PERFORMANCE TRACKING TABLES
-- ==============================================================

-- Technician performance tracking
CREATE TABLE IF NOT EXISTS public.technician_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    performance_date DATE NOT NULL,
    
    -- Job metrics
    jobs_assigned INTEGER DEFAULT 0,
    jobs_completed INTEGER DEFAULT 0,
    jobs_on_time INTEGER DEFAULT 0,
    jobs_late INTEGER DEFAULT 0,
    
    -- Time metrics
    total_hours_worked DECIMAL(8,2) DEFAULT 0.00,
    billable_hours DECIMAL(8,2) DEFAULT 0.00,
    overtime_hours DECIMAL(8,2) DEFAULT 0.00,
    
    -- Quality metrics
    quality_score DECIMAL(5,2) DEFAULT 100.00,
    customer_satisfaction DECIMAL(5,2) DEFAULT 100.00,
    rework_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Efficiency metrics
    efficiency_rating DECIMAL(5,2) DEFAULT 100.00,
    productivity_score DECIMAL(5,2) DEFAULT 100.00,
    
    -- Financial metrics
    revenue_generated DECIMAL(12,2) DEFAULT 0.00,
    labor_cost DECIMAL(12,2) DEFAULT 0.00,
    profit_contribution DECIMAL(12,2) DEFAULT 0.00,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes only if they don't exist
DO $$ BEGIN
    CREATE UNIQUE INDEX idx_technician_performance_tech_date ON public.technician_performance(technician_id, performance_date);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_technician_performance_shop ON public.technician_performance(shop_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================
-- CUSTOMER ANALYTICS
-- ==============================================================

-- Customer lifetime value tracking
CREATE TABLE IF NOT EXISTS public.customer_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    
    -- Lifetime metrics
    total_jobs INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0.00,
    avg_job_value DECIMAL(10,2) DEFAULT 0.00,
    first_job_date DATE,
    last_job_date DATE,
    
    -- Frequency metrics
    jobs_per_year DECIMAL(8,2) DEFAULT 0.00,
    days_between_jobs DECIMAL(8,2) DEFAULT 0.00,
    
    -- Loyalty metrics
    loyalty_score DECIMAL(5,2) DEFAULT 0.00,
    retention_probability DECIMAL(5,2) DEFAULT 0.00,
    customer_tier VARCHAR(20) DEFAULT 'bronze', -- bronze, silver, gold, platinum
    
    -- Satisfaction metrics
    avg_satisfaction DECIMAL(3,2) DEFAULT 0.00,
    complaints_count INTEGER DEFAULT 0,
    referrals_count INTEGER DEFAULT 0,
    
    -- Financial metrics
    lifetime_value DECIMAL(12,2) DEFAULT 0.00,
    acquisition_cost DECIMAL(10,2) DEFAULT 0.00,
    profit_margin DECIMAL(5,2) DEFAULT 0.00,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes only if they don't exist
DO $$ BEGIN
    CREATE UNIQUE INDEX idx_customer_analytics_customer ON public.customer_analytics(customer_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_customer_analytics_shop ON public.customer_analytics(shop_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_customer_analytics_tier ON public.customer_analytics(customer_tier);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================
-- INVENTORY ANALYTICS
-- ==============================================================

-- Parts performance tracking
CREATE TABLE IF NOT EXISTS public.parts_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    part_id UUID NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
    
    -- Usage metrics
    total_ordered INTEGER DEFAULT 0,
    total_used INTEGER DEFAULT 0,
    total_returned INTEGER DEFAULT 0,
    
    -- Financial metrics
    total_cost DECIMAL(12,2) DEFAULT 0.00,
    total_revenue DECIMAL(12,2) DEFAULT 0.00,
    total_profit DECIMAL(12,2) DEFAULT 0.00,
    avg_markup DECIMAL(5,2) DEFAULT 0.00,
    
    -- Performance metrics
    turnover_rate DECIMAL(8,2) DEFAULT 0.00,
    days_in_stock DECIMAL(8,2) DEFAULT 0.00,
    stockout_count INTEGER DEFAULT 0,
    overstock_count INTEGER DEFAULT 0,
    
    -- Vendor metrics
    primary_vendor_id UUID REFERENCES public.vendors(id),
    vendor_performance DECIMAL(5,2) DEFAULT 100.00,
    delivery_time_avg DECIMAL(8,2) DEFAULT 0.00,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes only if they don't exist
DO $$ BEGIN
    CREATE UNIQUE INDEX idx_parts_analytics_part ON public.parts_analytics(part_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_parts_analytics_shop ON public.parts_analytics(shop_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================
-- REPORTING VIEWS
-- ==============================================================

-- Create a comprehensive dashboard view
CREATE OR REPLACE VIEW public.dashboard_metrics AS
SELECT 
    s.id as shop_id,
    s.name as shop_name,
    
    -- Current day metrics
    COALESCE(dm.jobs_created, 0) as today_jobs_created,
    COALESCE(dm.jobs_completed, 0) as today_jobs_completed,
    COALESCE(dm.revenue_total, 0.00) as today_revenue,
    COALESCE(dm.new_customers, 0) as today_new_customers,
    
    -- Current month metrics
    COALESCE(mm.total_jobs, 0) as month_total_jobs,
    COALESCE(mm.total_revenue, 0.00) as month_total_revenue,
    COALESCE(mm.total_profit, 0.00) as month_total_profit,
    COALESCE(mm.avg_profit_margin, 0.00) as month_avg_profit_margin,
    
    -- Growth metrics
    COALESCE(mm.revenue_growth, 0.00) as revenue_growth_pct,
    COALESCE(mm.jobs_growth, 0.00) as jobs_growth_pct,
    
    -- Efficiency metrics
    COALESCE(dm.avg_cycle_time, 0.00) as avg_cycle_time,
    COALESCE(dm.capacity_utilization, 0.00) as capacity_utilization,
    COALESCE(dm.technician_efficiency, 100.00) as technician_efficiency
    
FROM public.shops s
LEFT JOIN public.daily_metrics dm ON s.id = dm.shop_id AND dm.metric_date = CURRENT_DATE
LEFT JOIN public.monthly_metrics mm ON s.id = mm.shop_id 
    AND mm.metric_year = EXTRACT(YEAR FROM CURRENT_DATE)
    AND mm.metric_month = EXTRACT(MONTH FROM CURRENT_DATE)
WHERE s.is_active = true;

-- ==============================================================
-- ANALYTICS FUNCTIONS
-- ==============================================================

-- Function to calculate daily metrics
CREATE OR REPLACE FUNCTION calculate_daily_metrics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    -- Insert or update daily metrics for all shops
    INSERT INTO public.daily_metrics (
        shop_id, metric_date, jobs_created, jobs_completed, jobs_in_progress,
        jobs_on_hold, jobs_cancelled, revenue_total, revenue_labor, revenue_parts,
        revenue_materials, revenue_sublet, cost_parts, cost_labor, cost_materials,
        cost_sublet, gross_profit, net_profit, profit_margin, new_customers,
        returning_customers, customer_satisfaction_avg, avg_cycle_time,
        capacity_utilization, technician_efficiency, parts_ordered,
        parts_received, parts_backordered, inventory_turnover
    )
    SELECT 
        s.id as shop_id,
        target_date as metric_date,
        
        -- Job counts
        COUNT(CASE WHEN j.created_at::DATE = target_date THEN 1 END) as jobs_created,
        COUNT(CASE WHEN j.completion_date::DATE = target_date THEN 1 END) as jobs_completed,
        COUNT(CASE WHEN j.status IN ('intake', 'blueprint', 'parts_ordering', 'parts_receiving', 
                                    'body_structure', 'paint_prep', 'paint_booth', 'reassembly', 
                                    'quality_control', 'calibration', 'detail') THEN 1 END) as jobs_in_progress,
        COUNT(CASE WHEN j.status = 'on_hold' THEN 1 END) as jobs_on_hold,
        COUNT(CASE WHEN j.status = 'cancelled' THEN 1 END) as jobs_cancelled,
        
        -- Revenue calculations
        COALESCE(SUM(j.total_amount), 0.00) as revenue_total,
        COALESCE(SUM(j.labor_amount), 0.00) as revenue_labor,
        COALESCE(SUM(j.parts_amount), 0.00) as revenue_parts,
        COALESCE(SUM(j.materials_amount), 0.00) as revenue_materials,
        COALESCE(SUM(j.sublet_amount), 0.00) as revenue_sublet,
        
        -- Cost calculations (simplified - would need actual cost data)
        COALESCE(SUM(j.parts_amount * 0.6), 0.00) as cost_parts, -- Assuming 60% cost
        COALESCE(SUM(j.labor_amount * 0.7), 0.00) as cost_labor, -- Assuming 70% cost
        COALESCE(SUM(j.materials_amount * 0.5), 0.00) as cost_materials, -- Assuming 50% cost
        COALESCE(SUM(j.sublet_amount * 0.8), 0.00) as cost_sublet, -- Assuming 80% cost
        
        -- Profit calculations
        COALESCE(SUM(j.total_amount - (j.parts_amount * 0.6 + j.labor_amount * 0.7 + 
                                      j.materials_amount * 0.5 + j.sublet_amount * 0.8)), 0.00) as gross_profit,
        COALESCE(SUM(j.total_amount - (j.parts_amount * 0.6 + j.labor_amount * 0.7 + 
                                      j.materials_amount * 0.5 + j.sublet_amount * 0.8)), 0.00) as net_profit,
        CASE 
            WHEN SUM(j.total_amount) > 0 THEN 
                (SUM(j.total_amount - (j.parts_amount * 0.6 + j.labor_amount * 0.7 + 
                                      j.materials_amount * 0.5 + j.sublet_amount * 0.8)) / SUM(j.total_amount)) * 100
            ELSE 0.00 
        END as profit_margin,
        
        -- Customer metrics
        COUNT(DISTINCT CASE WHEN c.created_at::DATE = target_date THEN c.id END) as new_customers,
        COUNT(DISTINCT CASE WHEN c.created_at::DATE < target_date AND j.created_at::DATE = target_date THEN c.id END) as returning_customers,
        4.5 as customer_satisfaction_avg, -- Placeholder
        
        -- Efficiency metrics
        5.2 as avg_cycle_time, -- Placeholder
        85.0 as capacity_utilization, -- Placeholder
        95.0 as technician_efficiency, -- Placeholder
        
        -- Parts metrics (placeholders)
        0 as parts_ordered,
        0 as parts_received,
        0 as parts_backordered,
        12.5 as inventory_turnover -- Placeholder
        
    FROM public.shops s
    LEFT JOIN public.jobs j ON s.id = j.shop_id AND j.created_at::DATE = target_date
    LEFT JOIN public.customers c ON s.id = c.shop_id
    WHERE s.is_active = true
    GROUP BY s.id
    
    ON CONFLICT (shop_id, metric_date) 
    DO UPDATE SET
        jobs_created = EXCLUDED.jobs_created,
        jobs_completed = EXCLUDED.jobs_completed,
        jobs_in_progress = EXCLUDED.jobs_in_progress,
        jobs_on_hold = EXCLUDED.jobs_on_hold,
        jobs_cancelled = EXCLUDED.jobs_cancelled,
        revenue_total = EXCLUDED.revenue_total,
        revenue_labor = EXCLUDED.revenue_labor,
        revenue_parts = EXCLUDED.revenue_parts,
        revenue_materials = EXCLUDED.revenue_materials,
        revenue_sublet = EXCLUDED.revenue_sublet,
        cost_parts = EXCLUDED.cost_parts,
        cost_labor = EXCLUDED.cost_labor,
        cost_materials = EXCLUDED.cost_materials,
        cost_sublet = EXCLUDED.cost_sublet,
        gross_profit = EXCLUDED.gross_profit,
        net_profit = EXCLUDED.net_profit,
        profit_margin = EXCLUDED.profit_margin,
        new_customers = EXCLUDED.new_customers,
        returning_customers = EXCLUDED.returning_customers,
        customer_satisfaction_avg = EXCLUDED.customer_satisfaction_avg,
        avg_cycle_time = EXCLUDED.avg_cycle_time,
        capacity_utilization = EXCLUDED.capacity_utilization,
        technician_efficiency = EXCLUDED.technician_efficiency,
        parts_ordered = EXCLUDED.parts_ordered,
        parts_received = EXCLUDED.parts_received,
        parts_backordered = EXCLUDED.parts_backordered,
        inventory_turnover = EXCLUDED.inventory_turnover,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ==============================================================
-- ENABLE RLS ON NEW TABLES
-- ==============================================================

-- Enable RLS on analytics tables
DO $$ BEGIN
    ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.monthly_metrics ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.technician_performance ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.customer_analytics ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.parts_analytics ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================
-- RLS POLICIES FOR ANALYTICS TABLES
-- ==============================================================

-- Daily metrics policies
DO $$ BEGIN
    CREATE POLICY "Users can view their shop's daily metrics" ON public.daily_metrics
        FOR SELECT USING (user_belongs_to_shop(shop_id));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Monthly metrics policies
DO $$ BEGIN
    CREATE POLICY "Users can view their shop's monthly metrics" ON public.monthly_metrics
        FOR SELECT USING (user_belongs_to_shop(shop_id));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Technician performance policies
DO $$ BEGIN
    CREATE POLICY "Users can view technician performance for their shop" ON public.technician_performance
        FOR SELECT USING (user_belongs_to_shop(shop_id));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Customer analytics policies
DO $$ BEGIN
    CREATE POLICY "Users can view customer analytics for their shop" ON public.customer_analytics
        FOR SELECT USING (user_belongs_to_shop(shop_id));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Parts analytics policies
DO $$ BEGIN
    CREATE POLICY "Users can view parts analytics for their shop" ON public.parts_analytics
        FOR SELECT USING (user_belongs_to_shop(shop_id));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================
-- TRIGGERS
-- ==============================================================

-- Updated_at triggers for new tables
DO $$ BEGIN
    CREATE TRIGGER update_daily_metrics_updated_at BEFORE UPDATE ON public.daily_metrics
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_monthly_metrics_updated_at BEFORE UPDATE ON public.monthly_metrics
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_technician_performance_updated_at BEFORE UPDATE ON public.technician_performance
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_customer_analytics_updated_at BEFORE UPDATE ON public.customer_analytics
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_parts_analytics_updated_at BEFORE UPDATE ON public.parts_analytics
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
