-- ==============================================================
-- CollisionOS Advanced Analytics Schema - SQLite Compatible
-- File: analytics_schema_sqlite.sql
-- Description: Analytics capabilities optimized for SQLite
-- ==============================================================

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- ==============================================================
-- ANALYTICS AGGREGATION TABLES
-- ==============================================================

-- Daily business metrics aggregation
CREATE TABLE IF NOT EXISTS daily_metrics (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
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
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for daily_metrics
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_metrics_shop_date ON daily_metrics(shop_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(metric_date);

-- Monthly aggregation rollup table
CREATE TABLE IF NOT EXISTS monthly_metrics (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    metric_year INTEGER NOT NULL,
    metric_month INTEGER NOT NULL CHECK (metric_month >= 1 AND metric_month <= 12),
    
    -- Aggregated metrics
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
    
    -- Growth metrics
    revenue_growth DECIMAL(5,2) DEFAULT 0.00,
    job_growth DECIMAL(5,2) DEFAULT 0.00,
    profit_growth DECIMAL(5,2) DEFAULT 0.00,
    customer_growth DECIMAL(5,2) DEFAULT 0.00,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_metrics_shop_year_month ON monthly_metrics(shop_id, metric_year, metric_month);

-- ==============================================================
-- CUSTOMER ANALYTICS TABLES
-- ==============================================================

-- Customer lifetime value and analytics
CREATE TABLE IF NOT EXISTS customer_analytics (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
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
    first_job_date DATETIME,
    last_job_date DATETIME,
    days_as_customer INTEGER DEFAULT 0,
    avg_days_between_jobs DECIMAL(8,2) DEFAULT 0.00,
    
    -- Satisfaction metrics
    avg_satisfaction DECIMAL(3,2) DEFAULT 0.00,
    satisfaction_trend DECIMAL(3,2) DEFAULT 0.00,
    complaints_count INTEGER DEFAULT 0,
    compliments_count INTEGER DEFAULT 0,
    
    -- Predictive metrics
    churn_risk_score DECIMAL(3,2) DEFAULT 0.00,
    next_visit_prediction DATETIME,
    lifetime_value_prediction DECIMAL(12,2) DEFAULT 0.00,
    
    -- Classification
    customer_segment TEXT,
    acquisition_channel TEXT,
    
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_analytics_shop_customer ON customer_analytics(shop_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_ltv ON customer_analytics(lifetime_value DESC);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_segment ON customer_analytics(customer_segment);

-- ==============================================================
-- TECHNICIAN PERFORMANCE ANALYTICS
-- ==============================================================

-- Technician performance metrics
CREATE TABLE IF NOT EXISTS technician_analytics (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    technician_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric_period TEXT NOT NULL CHECK (metric_period IN ('daily', 'weekly', 'monthly')),
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
    efficiency_rate DECIMAL(5,2) DEFAULT 100.00,
    utilization_rate DECIMAL(5,2) DEFAULT 0.00,
    
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
    skill_score DECIMAL(3,2) DEFAULT 0.00,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tech_analytics_shop_tech_period ON technician_analytics(shop_id, technician_id, metric_period, period_start);

-- ==============================================================
-- PARTS AND INVENTORY ANALYTICS
-- ==============================================================

-- Parts performance and inventory optimization
CREATE TABLE IF NOT EXISTS parts_analytics (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    part_id TEXT NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
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
    abc_class TEXT CHECK (abc_class IN ('A', 'B', 'C')),
    velocity_class TEXT CHECK (velocity_class IN ('Fast', 'Medium', 'Slow')),
    criticality TEXT CHECK (criticality IN ('Critical', 'Important', 'Standard')),
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_parts_analytics_shop_part_date ON parts_analytics(shop_id, part_id, analysis_date);

-- ==============================================================
-- JOB PERFORMANCE ANALYTICS
-- ==============================================================

-- Job workflow and cycle time analysis
CREATE TABLE IF NOT EXISTS job_analytics (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    
    -- Time analysis
    total_cycle_time INTEGER DEFAULT 0,
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
    longest_stage TEXT,
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
    first_time_quality INTEGER DEFAULT 1,
    rework_required INTEGER DEFAULT 0,
    rework_hours DECIMAL(8,2) DEFAULT 0.00,
    customer_satisfaction INTEGER CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5),
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_job_analytics_shop_job ON job_analytics(shop_id, job_id);

-- ==============================================================
-- ANALYTICS CONFIGURATION TABLE
-- ==============================================================

-- Store analytics configuration per shop
CREATE TABLE IF NOT EXISTS analytics_config (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    
    -- Refresh settings
    auto_refresh_enabled INTEGER DEFAULT 1,
    refresh_frequency INTEGER DEFAULT 24, -- hours
    last_refresh DATETIME,
    
    -- Retention settings
    daily_metrics_retention_days INTEGER DEFAULT 730,
    job_analytics_retention_days INTEGER DEFAULT 1095,
    
    -- Forecasting settings
    forecast_enabled INTEGER DEFAULT 1,
    forecast_horizon_months INTEGER DEFAULT 12,
    
    -- Alert settings
    revenue_alert_threshold DECIMAL(5,2) DEFAULT -10.00,
    efficiency_alert_threshold DECIMAL(5,2) DEFAULT 80.00,
    churn_risk_alert_threshold DECIMAL(3,2) DEFAULT 0.70,
    
    -- Export settings
    allowed_exports TEXT DEFAULT 'csv,pdf,excel',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_config_shop ON analytics_config(shop_id);

-- ==============================================================
-- TRIGGERS FOR AUTOMATIC UPDATED_AT MAINTENANCE
-- ==============================================================

-- Updated_at trigger for daily_metrics
CREATE TRIGGER IF NOT EXISTS update_daily_metrics_updated_at 
    AFTER UPDATE ON daily_metrics
    FOR EACH ROW
BEGIN
    UPDATE daily_metrics SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Updated_at trigger for monthly_metrics
CREATE TRIGGER IF NOT EXISTS update_monthly_metrics_updated_at 
    AFTER UPDATE ON monthly_metrics
    FOR EACH ROW
BEGIN
    UPDATE monthly_metrics SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Updated_at trigger for customer_analytics
CREATE TRIGGER IF NOT EXISTS update_customer_analytics_updated_at 
    AFTER UPDATE ON customer_analytics
    FOR EACH ROW
BEGIN
    UPDATE customer_analytics SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Updated_at trigger for technician_analytics
CREATE TRIGGER IF NOT EXISTS update_technician_analytics_updated_at 
    AFTER UPDATE ON technician_analytics
    FOR EACH ROW
BEGIN
    UPDATE technician_analytics SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Updated_at trigger for parts_analytics
CREATE TRIGGER IF NOT EXISTS update_parts_analytics_updated_at 
    AFTER UPDATE ON parts_analytics
    FOR EACH ROW
BEGIN
    UPDATE parts_analytics SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Updated_at trigger for job_analytics
CREATE TRIGGER IF NOT EXISTS update_job_analytics_updated_at 
    AFTER UPDATE ON job_analytics
    FOR EACH ROW
BEGIN
    UPDATE job_analytics SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Updated_at trigger for analytics_config
CREATE TRIGGER IF NOT EXISTS update_analytics_config_updated_at 
    AFTER UPDATE ON analytics_config
    FOR EACH ROW
BEGIN
    UPDATE analytics_config SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ==============================================================
-- REPORTING VIEWS FOR COMMON ANALYTICS QUERIES
-- ==============================================================

-- Revenue performance view (simplified for SQLite)
CREATE VIEW IF NOT EXISTS revenue_performance AS
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
    -- Note: LAG function may not be available in all SQLite versions
    -- This is a simplified version without growth calculation
    0 as daily_growth_rate
FROM daily_metrics dm
WHERE dm.revenue_total > 0;

-- Technician efficiency view
CREATE VIEW IF NOT EXISTS technician_efficiency AS
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

-- Customer segments view (simplified)
CREATE VIEW IF NOT EXISTS customer_segments AS
SELECT 
    c.shop_id,
    c.id as customer_id,
    c.first_name || ' ' || c.last_name as customer_name,
    COUNT(j.id) as total_jobs,
    COALESCE(SUM(j.total_amount), 0) as total_spent,
    COALESCE(AVG(j.total_amount), 0) as avg_job_value,
    MAX(j.created_at) as last_job_date,
    MIN(j.created_at) as first_job_date,
    CASE 
        WHEN MAX(j.created_at) IS NULL THEN 9999
        ELSE CAST((julianday('now') - julianday(MAX(j.created_at))) AS INTEGER)
    END as days_since_last_job,
    CASE 
        WHEN COALESCE(SUM(j.total_amount), 0) > 10000 AND 
             CAST((julianday('now') - julianday(MAX(j.created_at))) AS INTEGER) < 90 THEN 'VIP'
        WHEN COALESCE(SUM(j.total_amount), 0) > 5000 AND 
             CAST((julianday('now') - julianday(MAX(j.created_at))) AS INTEGER) < 180 THEN 'High Value'
        WHEN COUNT(j.id) > 3 AND 
             CAST((julianday('now') - julianday(MAX(j.created_at))) AS INTEGER) < 365 THEN 'Loyal'
        WHEN CAST((julianday('now') - julianday(MAX(j.created_at))) AS INTEGER) > 365 THEN 'At Risk'
        WHEN COUNT(j.id) = 0 THEN 'Prospect'
        ELSE 'Regular'
    END as segment
FROM customers c
LEFT JOIN jobs j ON c.id = j.customer_id
GROUP BY c.shop_id, c.id, c.first_name, c.last_name;

-- ==============================================================
-- INDEXES FOR OPTIMAL QUERY PERFORMANCE
-- ==============================================================

-- Composite indexes for common query patterns (if tables exist)
CREATE INDEX IF NOT EXISTS idx_jobs_shop_status_date ON jobs(shop_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_shop_completion_date ON jobs(shop_id, completion_date);
CREATE INDEX IF NOT EXISTS idx_jobs_customer_shop ON jobs(customer_id, shop_id);
CREATE INDEX IF NOT EXISTS idx_jobs_technician_status ON jobs(assigned_to, status);

-- ==============================================================
-- INITIAL CONFIGURATION
-- ==============================================================

-- Create default analytics configuration for existing shops
-- This will be executed when the migration runs
-- INSERT INTO analytics_config (shop_id) 
-- SELECT id FROM shops WHERE id NOT IN (SELECT shop_id FROM analytics_config);