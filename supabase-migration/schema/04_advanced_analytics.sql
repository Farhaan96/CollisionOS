-- ==============================================================
-- CollisionOS Advanced Analytics Schema
-- File: 04_advanced_analytics.sql
-- Description: Advanced analytics capabilities with data warehouse patterns
-- Compatible: Both Supabase (PostgreSQL) and SQLite implementations
-- ==============================================================

-- Enable necessary extensions for PostgreSQL
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        CREATE EXTENSION IF NOT EXISTS "timescaledb" CASCADE;
        CREATE EXTENSION IF NOT EXISTS "pg_partman" CASCADE;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL; -- Ignore errors for SQLite compatibility
END $$;

-- ==============================================================
-- ANALYTICS AGGREGATION TABLES
-- These tables provide pre-calculated metrics for fast reporting
-- ==============================================================

-- Daily business metrics aggregation
CREATE TABLE daily_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
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

-- Indexes for daily_metrics
CREATE UNIQUE INDEX idx_daily_metrics_shop_date ON daily_metrics(shop_id, metric_date);
CREATE INDEX idx_daily_metrics_date ON daily_metrics(metric_date);
CREATE INDEX idx_daily_metrics_shop ON daily_metrics(shop_id);

-- Monthly aggregation rollup table
CREATE TABLE monthly_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
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
    job_growth DECIMAL(5,2) DEFAULT 0.00,
    profit_growth DECIMAL(5,2) DEFAULT 0.00,
    customer_growth DECIMAL(5,2) DEFAULT 0.00,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for monthly_metrics
CREATE UNIQUE INDEX idx_monthly_metrics_shop_year_month ON monthly_metrics(shop_id, metric_year, metric_month);
CREATE INDEX idx_monthly_metrics_year_month ON monthly_metrics(metric_year, metric_month);

-- ==============================================================
-- CUSTOMER ANALYTICS TABLES
-- ==============================================================

-- Customer lifetime value and analytics
CREATE TABLE customer_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Lifetime metrics
    total_jobs INTEGER DEFAULT 0,
    completed_jobs INTEGER DEFAULT 0,
    cancelled_jobs INTEGER DEFAULT 0,
    
    -- Financial metrics
    lifetime_value DECIMAL(12,2) DEFAULT 0.00,
    average_job_value DECIMAL(10,2) DEFAULT 0.00,
    total_spent DECIMAL(12,2) DEFAULT 0.00,
    outstanding_balance DECIMAL(10,2) DEFAULT 0.00,
    
    -- Engagement metrics
    first_job_date TIMESTAMPTZ,
    last_job_date TIMESTAMPTZ,
    days_as_customer INTEGER DEFAULT 0,
    avg_days_between_jobs DECIMAL(8,2) DEFAULT 0.00,
    
    -- Satisfaction metrics
    avg_satisfaction DECIMAL(3,2) DEFAULT 0.00,
    satisfaction_trend DECIMAL(3,2) DEFAULT 0.00, -- Positive/negative trend
    complaints_count INTEGER DEFAULT 0,
    compliments_count INTEGER DEFAULT 0,
    
    -- Predictive metrics
    churn_risk_score DECIMAL(3,2) DEFAULT 0.00, -- 0-1 scale
    next_visit_prediction TIMESTAMPTZ,
    lifetime_value_prediction DECIMAL(12,2) DEFAULT 0.00,
    
    -- Classification
    customer_segment VARCHAR(50), -- VIP, Regular, At-Risk, New, etc.
    acquisition_channel VARCHAR(100),
    
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for customer_analytics
CREATE UNIQUE INDEX idx_customer_analytics_shop_customer ON customer_analytics(shop_id, customer_id);
CREATE INDEX idx_customer_analytics_ltv ON customer_analytics(lifetime_value DESC);
CREATE INDEX idx_customer_analytics_churn ON customer_analytics(churn_risk_score DESC);
CREATE INDEX idx_customer_analytics_segment ON customer_analytics(customer_segment);

-- ==============================================================
-- TECHNICIAN PERFORMANCE ANALYTICS
-- ==============================================================

-- Technician performance metrics
CREATE TABLE technician_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric_period VARCHAR(10) NOT NULL, -- 'daily', 'weekly', 'monthly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Productivity metrics
    jobs_assigned INTEGER DEFAULT 0,
    jobs_completed INTEGER DEFAULT 0,
    jobs_in_progress INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Time metrics
    total_hours_worked DECIMAL(10,2) DEFAULT 0.00,
    billable_hours DECIMAL(10,2) DEFAULT 0.00,
    estimated_hours DECIMAL(10,2) DEFAULT 0.00,
    actual_hours DECIMAL(10,2) DEFAULT 0.00,
    efficiency_rate DECIMAL(5,2) DEFAULT 100.00, -- actual vs estimated
    utilization_rate DECIMAL(5,2) DEFAULT 0.00, -- billable vs total
    
    -- Quality metrics
    quality_checks_passed INTEGER DEFAULT 0,
    quality_checks_failed INTEGER DEFAULT 0,
    rework_hours DECIMAL(8,2) DEFAULT 0.00,
    comebacks INTEGER DEFAULT 0,
    
    -- Revenue metrics
    revenue_generated DECIMAL(12,2) DEFAULT 0.00,
    revenue_per_hour DECIMAL(10,2) DEFAULT 0.00,
    labor_cost DECIMAL(10,2) DEFAULT 0.00,
    profit_contribution DECIMAL(12,2) DEFAULT 0.00,
    
    -- Skill development
    certifications_earned INTEGER DEFAULT 0,
    training_hours DECIMAL(8,2) DEFAULT 0.00,
    skill_score DECIMAL(3,2) DEFAULT 0.00, -- 0-10 scale
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for technician_analytics
CREATE UNIQUE INDEX idx_tech_analytics_shop_tech_period ON technician_analytics(shop_id, technician_id, metric_period, period_start);
CREATE INDEX idx_tech_analytics_efficiency ON technician_analytics(efficiency_rate DESC);
CREATE INDEX idx_tech_analytics_revenue ON technician_analytics(revenue_per_hour DESC);

-- ==============================================================
-- PARTS AND INVENTORY ANALYTICS
-- ==============================================================

-- Parts performance and inventory optimization
CREATE TABLE parts_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    analysis_date DATE NOT NULL,
    
    -- Usage metrics
    quantity_used_30d INTEGER DEFAULT 0,
    quantity_used_90d INTEGER DEFAULT 0,
    quantity_used_12m INTEGER DEFAULT 0,
    avg_monthly_usage DECIMAL(8,2) DEFAULT 0.00,
    
    -- Financial metrics
    total_cost_30d DECIMAL(10,2) DEFAULT 0.00,
    total_revenue_30d DECIMAL(10,2) DEFAULT 0.00,
    margin_30d DECIMAL(10,2) DEFAULT 0.00,
    margin_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Inventory metrics
    current_stock INTEGER DEFAULT 0,
    stock_value DECIMAL(10,2) DEFAULT 0.00,
    days_supply DECIMAL(8,2) DEFAULT 0.00,
    turnover_rate DECIMAL(8,2) DEFAULT 0.00,
    
    -- Vendor performance
    avg_delivery_time DECIMAL(8,2) DEFAULT 0.00,
    order_fill_rate DECIMAL(5,2) DEFAULT 100.00,
    return_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Forecasting
    demand_forecast_30d INTEGER DEFAULT 0,
    demand_forecast_90d INTEGER DEFAULT 0,
    reorder_recommendation INTEGER DEFAULT 0,
    optimal_stock_level INTEGER DEFAULT 0,
    
    -- Classification
    abc_class VARCHAR(1), -- A, B, C based on value/usage
    velocity_class VARCHAR(10), -- Fast, Medium, Slow
    criticality VARCHAR(10), -- Critical, Important, Standard
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for parts_analytics
CREATE UNIQUE INDEX idx_parts_analytics_shop_part_date ON parts_analytics(shop_id, part_id, analysis_date);
CREATE INDEX idx_parts_analytics_abc ON parts_analytics(abc_class);
CREATE INDEX idx_parts_analytics_velocity ON parts_analytics(velocity_class);
CREATE INDEX idx_parts_analytics_margin ON parts_analytics(margin_percentage DESC);

-- ==============================================================
-- JOB PERFORMANCE AND WORKFLOW ANALYTICS
-- ==============================================================

-- Job workflow and cycle time analysis
CREATE TABLE job_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    
    -- Time analysis
    total_cycle_time INTEGER DEFAULT 0, -- Total days
    estimate_to_start_time INTEGER DEFAULT 0,
    start_to_complete_time INTEGER DEFAULT 0,
    complete_to_delivery_time INTEGER DEFAULT 0,
    
    -- Stage duration (hours)
    intake_duration DECIMAL(8,2) DEFAULT 0.00,
    blueprint_duration DECIMAL(8,2) DEFAULT 0.00,
    parts_ordering_duration DECIMAL(8,2) DEFAULT 0.00,
    repair_duration DECIMAL(8,2) DEFAULT 0.00,
    paint_duration DECIMAL(8,2) DEFAULT 0.00,
    reassembly_duration DECIMAL(8,2) DEFAULT 0.00,
    qc_duration DECIMAL(8,2) DEFAULT 0.00,
    
    -- Bottleneck analysis
    longest_stage VARCHAR(50),
    bottleneck_hours DECIMAL(8,2) DEFAULT 0.00,
    wait_time_total DECIMAL(8,2) DEFAULT 0.00,
    
    -- Efficiency metrics
    estimated_vs_actual_variance DECIMAL(5,2) DEFAULT 0.00,
    resource_utilization DECIMAL(5,2) DEFAULT 0.00,
    
    -- Financial analysis
    estimated_vs_actual_cost DECIMAL(10,2) DEFAULT 0.00,
    cost_variance_percentage DECIMAL(5,2) DEFAULT 0.00,
    profitability_index DECIMAL(5,2) DEFAULT 1.00,
    
    -- Quality metrics
    first_time_quality BOOLEAN DEFAULT true,
    rework_required BOOLEAN DEFAULT false,
    rework_hours DECIMAL(8,2) DEFAULT 0.00,
    customer_satisfaction INTEGER CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for job_analytics
CREATE UNIQUE INDEX idx_job_analytics_shop_job ON job_analytics(shop_id, job_id);
CREATE INDEX idx_job_analytics_cycle_time ON job_analytics(total_cycle_time);
CREATE INDEX idx_job_analytics_profitability ON job_analytics(profitability_index DESC);

-- ==============================================================
-- BUSINESS INTELLIGENCE VIEWS
-- Materialized views for fast reporting (PostgreSQL only)
-- ==============================================================

-- Create materialized views only if PostgreSQL
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        -- Revenue trend analysis
        EXECUTE '
        CREATE MATERIALIZED VIEW revenue_trends AS
        WITH monthly_revenue AS (
            SELECT 
                shop_id,
                DATE_TRUNC(''month'', created_at) as month,
                SUM(total_amount) as revenue,
                COUNT(*) as job_count,
                AVG(total_amount) as avg_job_value
            FROM jobs 
            WHERE status = ''delivered''
            GROUP BY shop_id, DATE_TRUNC(''month'', created_at)
        ),
        revenue_with_growth AS (
            SELECT *,
                LAG(revenue, 1) OVER (PARTITION BY shop_id ORDER BY month) as prev_month_revenue,
                CASE 
                    WHEN LAG(revenue, 1) OVER (PARTITION BY shop_id ORDER BY month) IS NOT NULL 
                    THEN ((revenue - LAG(revenue, 1) OVER (PARTITION BY shop_id ORDER BY month)) 
                          / LAG(revenue, 1) OVER (PARTITION BY shop_id ORDER BY month)) * 100
                    ELSE 0
                END as growth_rate
            FROM monthly_revenue
        )
        SELECT * FROM revenue_with_growth;
        ';

        -- Customer segmentation analysis
        EXECUTE '
        CREATE MATERIALIZED VIEW customer_segments AS
        WITH customer_stats AS (
            SELECT 
                c.shop_id,
                c.id as customer_id,
                c.first_name || '' '' || c.last_name as customer_name,
                COUNT(j.id) as total_jobs,
                SUM(j.total_amount) as total_spent,
                AVG(j.total_amount) as avg_job_value,
                MAX(j.created_at) as last_job_date,
                MIN(j.created_at) as first_job_date,
                EXTRACT(DAYS FROM NOW() - MAX(j.created_at)) as days_since_last_job
            FROM customers c
            LEFT JOIN jobs j ON c.id = j.customer_id
            GROUP BY c.shop_id, c.id, c.first_name, c.last_name
        )
        SELECT *,
            CASE 
                WHEN total_spent > 10000 AND days_since_last_job < 90 THEN ''VIP''
                WHEN total_spent > 5000 AND days_since_last_job < 180 THEN ''High Value''
                WHEN total_jobs > 3 AND days_since_last_job < 365 THEN ''Loyal''
                WHEN days_since_last_job > 365 THEN ''At Risk''
                WHEN total_jobs = 0 THEN ''Prospect''
                ELSE ''Regular''
            END as segment
        FROM customer_stats;
        ';

        -- Create indexes on materialized views
        EXECUTE 'CREATE INDEX idx_revenue_trends_shop_month ON revenue_trends(shop_id, month);';
        EXECUTE 'CREATE INDEX idx_customer_segments_shop_segment ON customer_segments(shop_id, segment);';
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- ==============================================================
-- ANALYTICS FUNCTIONS
-- ==============================================================

-- Function to calculate customer lifetime value
CREATE OR REPLACE FUNCTION calculate_customer_ltv(customer_uuid UUID, shop_uuid UUID)
RETURNS DECIMAL(12,2) AS $$
DECLARE
    total_revenue DECIMAL(12,2) := 0;
    months_active INTEGER := 0;
    avg_monthly_revenue DECIMAL(12,2) := 0;
    predicted_lifespan INTEGER := 36; -- Default 3 years
    ltv DECIMAL(12,2) := 0;
BEGIN
    -- Calculate historical metrics
    SELECT 
        COALESCE(SUM(total_amount), 0),
        GREATEST(1, EXTRACT(MONTHS FROM AGE(MAX(created_at), MIN(created_at))))
    INTO total_revenue, months_active
    FROM jobs 
    WHERE customer_id = customer_uuid 
    AND shop_id = shop_uuid 
    AND status = 'delivered';
    
    -- Calculate average monthly revenue
    IF months_active > 0 THEN
        avg_monthly_revenue := total_revenue / months_active;
    END IF;
    
    -- Predict LTV (simplified model)
    ltv := avg_monthly_revenue * predicted_lifespan;
    
    RETURN COALESCE(ltv, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate churn risk
CREATE OR REPLACE FUNCTION calculate_churn_risk(customer_uuid UUID, shop_uuid UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    days_since_last_job INTEGER := 0;
    avg_days_between_jobs DECIMAL(8,2) := 0;
    satisfaction_score DECIMAL(3,2) := 5.0;
    churn_risk DECIMAL(3,2) := 0;
BEGIN
    -- Days since last job
    SELECT COALESCE(EXTRACT(DAYS FROM NOW() - MAX(created_at)), 9999)
    INTO days_since_last_job
    FROM jobs 
    WHERE customer_id = customer_uuid AND shop_id = shop_uuid;
    
    -- Average days between jobs
    WITH job_intervals AS (
        SELECT 
            created_at - LAG(created_at) OVER (ORDER BY created_at) as interval_days
        FROM jobs 
        WHERE customer_id = customer_uuid AND shop_id = shop_uuid
        ORDER BY created_at
    )
    SELECT COALESCE(AVG(EXTRACT(DAYS FROM interval_days)), 365)
    INTO avg_days_between_jobs
    FROM job_intervals
    WHERE interval_days IS NOT NULL;
    
    -- Average satisfaction
    SELECT COALESCE(AVG(customer_satisfaction), 5.0)
    INTO satisfaction_score
    FROM jobs 
    WHERE customer_id = customer_uuid 
    AND shop_id = shop_uuid 
    AND customer_satisfaction IS NOT NULL;
    
    -- Calculate risk (0-1 scale)
    churn_risk := LEAST(1.0, 
        (days_since_last_job / (avg_days_between_jobs * 1.5)) * 0.6 +
        ((5.0 - satisfaction_score) / 4.0) * 0.4
    );
    
    RETURN churn_risk;
END;
$$ LANGUAGE plpgsql;

-- Function to update daily metrics
CREATE OR REPLACE FUNCTION update_daily_metrics(target_date DATE, shop_uuid UUID)
RETURNS VOID AS $$
DECLARE
    metrics_record daily_metrics%ROWTYPE;
BEGIN
    -- Calculate all metrics for the date
    WITH job_metrics AS (
        SELECT 
            COUNT(*) FILTER (WHERE DATE(created_at) = target_date) as jobs_created,
            COUNT(*) FILTER (WHERE DATE(completion_date) = target_date) as jobs_completed,
            COUNT(*) FILTER (WHERE status IN ('body_structure', 'paint_prep', 'paint_booth', 'reassembly')) as jobs_in_progress,
            COUNT(*) FILTER (WHERE status = 'on_hold') as jobs_on_hold,
            COUNT(*) FILTER (WHERE status = 'cancelled' AND DATE(updated_at) = target_date) as jobs_cancelled,
            COALESCE(SUM(total_amount) FILTER (WHERE DATE(completion_date) = target_date), 0) as revenue_total,
            COALESCE(SUM(labor_amount) FILTER (WHERE DATE(completion_date) = target_date), 0) as revenue_labor,
            COALESCE(SUM(parts_amount) FILTER (WHERE DATE(completion_date) = target_date), 0) as revenue_parts,
            COALESCE(AVG(cycle_time) FILTER (WHERE DATE(completion_date) = target_date), 0) as avg_cycle_time
        FROM jobs 
        WHERE shop_id = shop_uuid
    ),
    customer_metrics AS (
        SELECT 
            COUNT(*) FILTER (WHERE DATE(created_at) = target_date) as new_customers,
            COUNT(DISTINCT customer_id) FILTER (WHERE DATE(created_at) = target_date AND customer_id IN (
                SELECT customer_id FROM jobs WHERE shop_id = shop_uuid AND created_at < target_date
            )) as returning_customers,
            COALESCE(AVG(customer_satisfaction) FILTER (WHERE DATE(completion_date) = target_date), 0) as satisfaction_avg
        FROM customers c
        LEFT JOIN jobs j ON c.id = j.customer_id
        WHERE c.shop_id = shop_uuid
    )
    SELECT 
        jm.jobs_created, jm.jobs_completed, jm.jobs_in_progress, jm.jobs_on_hold, jm.jobs_cancelled,
        jm.revenue_total, jm.revenue_labor, jm.revenue_parts, jm.avg_cycle_time,
        cm.new_customers, cm.returning_customers, cm.satisfaction_avg
    INTO 
        metrics_record.jobs_created, metrics_record.jobs_completed, metrics_record.jobs_in_progress, 
        metrics_record.jobs_on_hold, metrics_record.jobs_cancelled,
        metrics_record.revenue_total, metrics_record.revenue_labor, metrics_record.revenue_parts,
        metrics_record.avg_cycle_time, metrics_record.new_customers, metrics_record.returning_customers,
        metrics_record.customer_satisfaction_avg
    FROM job_metrics jm
    CROSS JOIN customer_metrics cm;
    
    -- Upsert the record
    INSERT INTO daily_metrics (
        shop_id, metric_date, jobs_created, jobs_completed, jobs_in_progress, 
        jobs_on_hold, jobs_cancelled, revenue_total, revenue_labor, revenue_parts,
        avg_cycle_time, new_customers, returning_customers, customer_satisfaction_avg
    ) VALUES (
        shop_uuid, target_date, metrics_record.jobs_created, metrics_record.jobs_completed, 
        metrics_record.jobs_in_progress, metrics_record.jobs_on_hold, metrics_record.jobs_cancelled,
        metrics_record.revenue_total, metrics_record.revenue_labor, metrics_record.revenue_parts,
        metrics_record.avg_cycle_time, metrics_record.new_customers, metrics_record.returning_customers,
        metrics_record.customer_satisfaction_avg
    )
    ON CONFLICT (shop_id, metric_date) DO UPDATE SET
        jobs_created = EXCLUDED.jobs_created,
        jobs_completed = EXCLUDED.jobs_completed,
        jobs_in_progress = EXCLUDED.jobs_in_progress,
        jobs_on_hold = EXCLUDED.jobs_on_hold,
        jobs_cancelled = EXCLUDED.jobs_cancelled,
        revenue_total = EXCLUDED.revenue_total,
        revenue_labor = EXCLUDED.revenue_labor,
        revenue_parts = EXCLUDED.revenue_parts,
        avg_cycle_time = EXCLUDED.avg_cycle_time,
        new_customers = EXCLUDED.new_customers,
        returning_customers = EXCLUDED.returning_customers,
        customer_satisfaction_avg = EXCLUDED.customer_satisfaction_avg,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ==============================================================
-- REPORTING VIEWS FOR COMMON ANALYTICS QUERIES
-- ==============================================================

-- Revenue performance view
CREATE VIEW revenue_performance AS
SELECT 
    dm.shop_id,
    dm.metric_date,
    dm.revenue_total,
    dm.jobs_completed,
    CASE 
        WHEN dm.jobs_completed > 0 
        THEN dm.revenue_total / dm.jobs_completed 
        ELSE 0 
    END as revenue_per_job,
    LAG(dm.revenue_total, 1) OVER (
        PARTITION BY dm.shop_id ORDER BY dm.metric_date
    ) as prev_day_revenue,
    CASE 
        WHEN LAG(dm.revenue_total, 1) OVER (PARTITION BY dm.shop_id ORDER BY dm.metric_date) > 0
        THEN ((dm.revenue_total - LAG(dm.revenue_total, 1) OVER (PARTITION BY dm.shop_id ORDER BY dm.metric_date)) 
              / LAG(dm.revenue_total, 1) OVER (PARTITION BY dm.shop_id ORDER BY dm.metric_date)) * 100
        ELSE 0
    END as daily_growth_rate
FROM daily_metrics dm
WHERE dm.revenue_total > 0;

-- Technician efficiency view
CREATE VIEW technician_efficiency AS
SELECT 
    u.id as technician_id,
    u.first_name || ' ' || u.last_name as technician_name,
    u.shop_id,
    COUNT(j.id) as total_jobs,
    AVG(j.efficiency) as avg_efficiency,
    SUM(j.actual_hours) as total_hours,
    SUM(j.total_amount) as revenue_generated,
    CASE 
        WHEN SUM(j.actual_hours) > 0 
        THEN SUM(j.total_amount) / SUM(j.actual_hours)
        ELSE 0
    END as revenue_per_hour
FROM users u
LEFT JOIN jobs j ON u.id = j.assigned_to
WHERE u.role IN ('technician', 'estimator')
AND j.status = 'delivered'
GROUP BY u.id, u.first_name, u.last_name, u.shop_id;

-- ==============================================================
-- TRIGGERS FOR AUTOMATIC METRICS CALCULATION
-- ==============================================================

-- Function to update analytics when jobs change
CREATE OR REPLACE FUNCTION update_analytics_on_job_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update daily metrics for completion date
    IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
        PERFORM update_daily_metrics(CURRENT_DATE, NEW.shop_id);
    END IF;
    
    -- Update customer analytics
    IF NEW.status = 'delivered' THEN
        INSERT INTO customer_analytics (shop_id, customer_id, lifetime_value, churn_risk_score)
        VALUES (
            NEW.shop_id, 
            NEW.customer_id, 
            calculate_customer_ltv(NEW.customer_id, NEW.shop_id),
            calculate_churn_risk(NEW.customer_id, NEW.shop_id)
        )
        ON CONFLICT (shop_id, customer_id) DO UPDATE SET
            lifetime_value = calculate_customer_ltv(NEW.customer_id, NEW.shop_id),
            churn_risk_score = calculate_churn_risk(NEW.customer_id, NEW.shop_id),
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for job analytics updates
CREATE TRIGGER update_analytics_trigger
    AFTER INSERT OR UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_on_job_change();

-- ==============================================================
-- RLS POLICIES FOR ANALYTICS TABLES
-- ==============================================================

-- Enable RLS on all analytics tables
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for daily_metrics
CREATE POLICY "Daily metrics are viewable by shop members" ON daily_metrics
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );

-- Policies for customer_analytics
CREATE POLICY "Customer analytics viewable by shop members" ON customer_analytics
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        )
    );

-- Policies for technician_analytics (technicians can see their own data)
CREATE POLICY "Technician analytics policy" ON technician_analytics
    FOR SELECT USING (
        shop_id IN (
            SELECT shop_id FROM users WHERE id = auth.uid()
        ) AND (
            technician_id = auth.uid() OR
            auth.uid() IN (
                SELECT id FROM users 
                WHERE shop_id = technician_analytics.shop_id 
                AND role IN ('owner', 'manager', 'admin')
            )
        )
    );

-- Updated_at triggers for analytics tables
CREATE TRIGGER update_daily_metrics_updated_at BEFORE UPDATE ON daily_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_metrics_updated_at BEFORE UPDATE ON monthly_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_analytics_updated_at BEFORE UPDATE ON customer_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_technician_analytics_updated_at BEFORE UPDATE ON technician_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parts_analytics_updated_at BEFORE UPDATE ON parts_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_analytics_updated_at BEFORE UPDATE ON job_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================
-- INDEXES FOR OPTIMAL QUERY PERFORMANCE
-- ==============================================================

-- Composite indexes for common query patterns
CREATE INDEX idx_jobs_shop_status_date ON jobs(shop_id, status, created_at);
CREATE INDEX idx_jobs_shop_completion_date ON jobs(shop_id, completion_date) WHERE completion_date IS NOT NULL;
CREATE INDEX idx_jobs_customer_shop ON jobs(customer_id, shop_id);
CREATE INDEX idx_jobs_technician_status ON jobs(assigned_to, status) WHERE assigned_to IS NOT NULL;

-- Partial indexes for better performance
CREATE INDEX idx_jobs_delivered ON jobs(shop_id, completion_date) WHERE status = 'delivered';
CREATE INDEX idx_jobs_active ON jobs(shop_id, status) WHERE status IN ('body_structure', 'paint_prep', 'paint_booth', 'reassembly');
CREATE INDEX idx_parts_low_stock ON parts(shop_id, current_stock, minimum_stock) WHERE current_stock <= minimum_stock;

-- ==============================================================
-- ANALYTICS CONFIGURATION TABLE
-- ==============================================================

-- Store analytics configuration per shop
CREATE TABLE analytics_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    
    -- Refresh settings
    auto_refresh_enabled BOOLEAN DEFAULT true,
    refresh_frequency INTEGER DEFAULT 24, -- hours
    last_refresh TIMESTAMPTZ,
    
    -- Retention settings
    daily_metrics_retention_days INTEGER DEFAULT 730, -- 2 years
    job_analytics_retention_days INTEGER DEFAULT 1095, -- 3 years
    
    -- Forecasting settings
    forecast_enabled BOOLEAN DEFAULT true,
    forecast_horizon_months INTEGER DEFAULT 12,
    
    -- Alert settings
    revenue_alert_threshold DECIMAL(5,2) DEFAULT -10.00, -- % drop
    efficiency_alert_threshold DECIMAL(5,2) DEFAULT 80.00, -- % minimum
    churn_risk_alert_threshold DECIMAL(3,2) DEFAULT 0.70, -- risk score
    
    -- Export settings
    allowed_exports TEXT[] DEFAULT ARRAY['csv', 'pdf', 'excel'],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index and RLS for analytics_config
CREATE UNIQUE INDEX idx_analytics_config_shop ON analytics_config(shop_id);

ALTER TABLE analytics_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Analytics config viewable by shop owners" ON analytics_config
    FOR ALL USING (
        shop_id IN (
            SELECT shop_id FROM users 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'admin', 'manager')
        )
    );

-- Trigger for analytics_config
CREATE TRIGGER update_analytics_config_updated_at BEFORE UPDATE ON analytics_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();