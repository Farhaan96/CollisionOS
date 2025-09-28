-- =============================================
-- CollisionOS Performance Indexes
-- Optimize collision repair workflow queries
-- =============================================

-- Drop existing indexes if they exist (for re-running)
DROP INDEX IF EXISTS idx_repair_orders_ro_number;
DROP INDEX IF EXISTS idx_repair_orders_status_priority;
DROP INDEX IF EXISTS idx_repair_orders_customer_vehicle;
DROP INDEX IF EXISTS idx_repair_orders_claim;
DROP INDEX IF EXISTS idx_repair_orders_shop_date;
DROP INDEX IF EXISTS idx_insurance_claims_claim_number;
DROP INDEX IF EXISTS idx_insurance_claims_company_status;
DROP INDEX IF EXISTS idx_customers_search;
DROP INDEX IF EXISTS idx_customers_phone_email;
DROP INDEX IF EXISTS idx_vehicles_vin;
DROP INDEX IF EXISTS idx_vehicles_plate_search;
DROP INDEX IF EXISTS idx_part_lines_status_workflow;
DROP INDEX IF EXISTS idx_part_lines_ro_supplier;
DROP INDEX IF EXISTS idx_part_lines_part_number;
DROP INDEX IF EXISTS idx_purchase_orders_vendor_status;
DROP INDEX IF EXISTS idx_purchase_orders_po_number;
DROP INDEX IF EXISTS idx_purchase_orders_ro_date;
DROP INDEX IF EXISTS idx_bms_imports_shop_date;
DROP INDEX IF EXISTS idx_documents_entity;

-- =============================================
-- REPAIR ORDERS INDEXES
-- Core collision repair workflow queries
-- =============================================

-- Primary search by RO number (most common lookup)
CREATE INDEX idx_repair_orders_ro_number ON repair_orders (ro_number);

-- Status and priority filtering for dashboard
CREATE INDEX idx_repair_orders_status_priority ON repair_orders (status, priority, opened_at DESC);

-- Customer and vehicle relationships for RO detail
CREATE INDEX idx_repair_orders_customer_vehicle ON repair_orders (customer_id, vehicle_id);

-- Claim relationship for insurance workflow
CREATE INDEX idx_repair_orders_claim ON repair_orders (claim_id);

-- Shop-based date range queries for reporting
CREATE INDEX idx_repair_orders_shop_date ON repair_orders (shop_id, opened_at DESC);

-- Composite index for common search patterns
CREATE INDEX idx_repair_orders_search_composite ON repair_orders (shop_id, status, opened_at DESC)
WHERE status IN ('estimate', 'in_progress', 'parts_pending', 'ready_for_delivery');

-- =============================================
-- INSURANCE CLAIMS INDEXES
-- Insurance workflow optimization
-- =============================================

-- Claim number lookup (primary search)
CREATE INDEX idx_insurance_claims_claim_number ON insurance_claims (claim_number);

-- Insurance company and status filtering
CREATE INDEX idx_insurance_claims_company_status ON insurance_claims (insurance_company_id, claim_status);

-- Date-based claim reporting
CREATE INDEX idx_insurance_claims_date_range ON insurance_claims (incident_date DESC, created_at DESC);

-- =============================================
-- CUSTOMERS INDEXES
-- Customer search and lookup optimization
-- =============================================

-- Full-text search on customer names
CREATE INDEX idx_customers_search ON customers USING gin (
  to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, ''))
);

-- Phone and email lookup (exact matches)
CREATE INDEX idx_customers_phone_email ON customers (phone, email);

-- Name-based partial matching
CREATE INDEX idx_customers_name_partial ON customers (lower(first_name), lower(last_name));

-- =============================================
-- VEHICLES INDEXES
-- Vehicle identification and search
-- =============================================

-- VIN lookup (primary vehicle identifier)
CREATE INDEX idx_vehicles_vin ON vehicles (vin);

-- License plate search
CREATE INDEX idx_vehicles_plate_search ON vehicles (lower(license_plate));

-- Make/Model/Year filtering for parts compatibility
CREATE INDEX idx_vehicles_ymm ON vehicles (year, make, model);

-- Customer vehicle relationship
CREATE INDEX idx_vehicles_customer ON vehicles (customer_id);

-- =============================================
-- PART LINES INDEXES
-- Parts workflow performance optimization
-- =============================================

-- Status-based parts workflow queries
CREATE INDEX idx_part_lines_status_workflow ON part_lines (status, repair_order_id);

-- RO and supplier relationship for PO creation
CREATE INDEX idx_part_lines_ro_supplier ON part_lines (repair_order_id, supplier_id);

-- Part number lookup for compatibility checks
CREATE INDEX idx_part_lines_part_number ON part_lines (part_number);

-- Parts by status for workflow buckets
CREATE INDEX idx_part_lines_status_bucket ON part_lines (status)
WHERE status IN ('needed', 'sourcing', 'ordered', 'backordered', 'received', 'installed');

-- Supplier performance queries
CREATE INDEX idx_part_lines_supplier_status ON part_lines (supplier_id, status, order_date);

-- =============================================
-- PURCHASE ORDERS INDEXES
-- PO workflow and vendor management
-- =============================================

-- Vendor and status filtering for vendor dashboards
CREATE INDEX idx_purchase_orders_vendor_status ON purchase_orders (vendor_id, status);

-- PO number lookup (structured numbering system)
CREATE INDEX idx_purchase_orders_po_number ON purchase_orders (po_number);

-- RO relationship and date range for reporting
CREATE INDEX idx_purchase_orders_ro_date ON purchase_orders (repair_order_id, created_at DESC);

-- Vendor KPI queries (performance metrics)
CREATE INDEX idx_purchase_orders_vendor_kpi ON purchase_orders (vendor_id, status, created_at, received_date)
WHERE status IN ('sent', 'acknowledged', 'partial', 'received');

-- =============================================
-- BMS IMPORTS INDEXES
-- BMS ingestion and processing tracking
-- =============================================

-- Shop-based import tracking
CREATE INDEX idx_bms_imports_shop_date ON bms_imports (shop_id, import_date DESC);

-- Import status and processing queries
CREATE INDEX idx_bms_imports_status ON bms_imports (import_status, file_name);

-- =============================================
-- DOCUMENTS INDEXES
-- Document management and retrieval
-- =============================================

-- Entity-based document lookup
CREATE INDEX idx_documents_entity ON documents (entity_type, entity_id);

-- Document type and date filtering
CREATE INDEX idx_documents_type_date ON documents (document_type, created_at DESC);

-- =============================================
-- SUPPLIERS INDEXES
-- Vendor management optimization
-- =============================================

-- Supplier name search
CREATE INDEX idx_suppliers_name ON suppliers (lower(name));

-- Supplier code lookup (for PO numbering)
CREATE INDEX idx_suppliers_code ON suppliers (vendor_code) WHERE vendor_code IS NOT NULL;

-- Performance-based supplier filtering
CREATE INDEX idx_suppliers_performance ON suppliers (preferred_supplier, active) WHERE active = true;

-- =============================================
-- INSURANCE COMPANIES INDEXES
-- Insurance workflow support
-- =============================================

-- Company name and short name lookup
CREATE INDEX idx_insurance_companies_names ON insurance_companies (lower(name), lower(short_name));

-- Active companies for dropdown filtering
CREATE INDEX idx_insurance_companies_active ON insurance_companies (active) WHERE active = true;

-- =============================================
-- COMPOSITE SEARCH INDEXES
-- Multi-table search optimization
-- =============================================

-- RO comprehensive search index (covers most search patterns)
CREATE INDEX idx_ro_comprehensive_search ON repair_orders (
  shop_id,
  ro_number,
  status,
  opened_at DESC
) WHERE status != 'delivered';

-- Parts workflow composite index
CREATE INDEX idx_parts_workflow_composite ON part_lines (
  repair_order_id,
  status,
  supplier_id,
  order_date
) WHERE status IN ('needed', 'ordered', 'received');

-- =============================================
-- PARTIAL INDEXES FOR ACTIVE DATA
-- Optimize for current workflow data
-- =============================================

-- Active ROs only (exclude completed/delivered)
CREATE INDEX idx_repair_orders_active ON repair_orders (shop_id, status, priority, opened_at DESC)
WHERE status IN ('estimate', 'in_progress', 'parts_pending', 'ready_for_delivery');

-- Current parts needing attention
CREATE INDEX idx_part_lines_active ON part_lines (repair_order_id, status, supplier_id)
WHERE status IN ('needed', 'sourcing', 'ordered', 'backordered');

-- Open purchase orders
CREATE INDEX idx_purchase_orders_open ON purchase_orders (vendor_id, status, created_at DESC)
WHERE status IN ('draft', 'sent', 'acknowledged', 'partial');

-- =============================================
-- PERFORMANCE ANALYSIS VIEWS
-- Support for KPI dashboard queries
-- =============================================

-- Create materialized view for vendor performance (refreshed nightly)
CREATE MATERIALIZED VIEW vendor_performance_summary AS
SELECT
  s.id as vendor_id,
  s.name as vendor_name,
  s.vendor_code,
  COUNT(po.id) as total_pos,
  COUNT(CASE WHEN po.status = 'received' THEN 1 END) as completed_pos,
  AVG(CASE WHEN po.received_date IS NOT NULL
    THEN EXTRACT(days FROM po.received_date - po.created_at)
    END) as avg_delivery_days,
  SUM(po.total_amount) as total_spend,
  COUNT(CASE WHEN po.status = 'received' AND po.received_date <= po.requested_delivery_date
    THEN 1 END)::float / NULLIF(COUNT(CASE WHEN po.status = 'received' THEN 1 END), 0) * 100 as on_time_rate,
  COUNT(pl.id) as total_parts,
  COUNT(CASE WHEN pl.status = 'received' THEN 1 END) as received_parts,
  COUNT(CASE WHEN pl.status = 'received' THEN 1 END)::float / NULLIF(COUNT(pl.id), 0) * 100 as fill_rate
FROM suppliers s
LEFT JOIN purchase_orders po ON s.id = po.vendor_id
LEFT JOIN part_lines pl ON s.id = pl.supplier_id
WHERE s.active = true
GROUP BY s.id, s.name, s.vendor_code;

-- Index on materialized view
CREATE INDEX idx_vendor_performance_summary ON vendor_performance_summary (vendor_id, total_spend DESC);

-- =============================================
-- QUERY PERFORMANCE STATISTICS
-- Enable query performance monitoring
-- =============================================

-- Enable statistics collection for query optimization
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- =============================================
-- INDEX MAINTENANCE NOTES
-- =============================================

/*
MAINTENANCE SCHEDULE:
1. REINDEX weekly during low-traffic hours
2. REFRESH MATERIALIZED VIEW vendor_performance_summary nightly
3. ANALYZE tables after bulk BMS imports
4. Monitor pg_stat_statements for slow queries

EXPECTED PERFORMANCE IMPROVEMENTS:
- RO search: < 10ms (was 100-500ms)
- Parts workflow queries: < 5ms (was 50-200ms)
- Vendor KPI dashboard: < 50ms (was 500-2000ms)
- BMS search/lookup: < 20ms (was 100-800ms)

DISK SPACE IMPACT:
- Estimated additional 15-25% of table sizes
- Monitor with: SELECT schemaname, tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid)) FROM pg_stat_user_indexes ORDER BY pg_relation_size(indexrelid) DESC;
*/