-- =====================================================
-- Migration: Create time_clock table (SQLite)
-- Description: Real-time time tracking for technicians with RO-level granularity
-- Features: QR code scanning, break tracking, efficiency calculation, payroll integration
-- Converted from PostgreSQL to SQLite
-- =====================================================

-- Create time_clock table
CREATE TABLE IF NOT EXISTS time_clock (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  technician_id TEXT NOT NULL,
  ro_id TEXT,

  -- Time tracking
  clock_in TEXT NOT NULL DEFAULT (datetime('now')),
  clock_out TEXT,
  break_start TEXT,
  break_end TEXT,

  -- Calculated fields
  total_hours NUMERIC(8, 2),
  break_hours NUMERIC(6, 2) DEFAULT 0.0,
  net_hours NUMERIC(8, 2),

  -- Labor details
  labor_type TEXT CHECK (labor_type IN (
    'body', 'paint', 'frame', 'mechanical', 'electrical',
    'glass', 'detail', 'prep', 'quality_control', 'other'
  )),
  hourly_rate NUMERIC(8, 2),
  labor_cost NUMERIC(10, 2),

  -- Status
  status TEXT NOT NULL DEFAULT 'clocked_in' CHECK (status IN (
    'clocked_in', 'on_break', 'clocked_out', 'cancelled'
  )),

  -- Work details
  work_description TEXT,
  notes TEXT,

  -- Entry method
  entry_method TEXT DEFAULT 'manual' CHECK (entry_method IN (
    'manual', 'qr_code', 'barcode', 'mobile_app', 'web_app'
  )),

  -- Location tracking
  bay_number TEXT,

  -- Efficiency tracking
  estimated_hours NUMERIC(8, 2),
  actual_vs_estimated NUMERIC(8, 2),
  efficiency_rating NUMERIC(5, 2), -- percentage

  -- Approval workflow
  requires_approval INTEGER DEFAULT 0,
  approved INTEGER DEFAULT 0,
  approved_by TEXT,
  approval_date TEXT,

  -- Payroll integration
  payroll_processed INTEGER DEFAULT 0,
  payroll_date TEXT,
  payroll_period TEXT,
  flagged_for_payroll INTEGER DEFAULT 1,

  -- Metadata
  metadata TEXT DEFAULT '{}', -- JSON string
  created_by TEXT,
  updated_by TEXT,

  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  -- Foreign key constraints
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ro_id) REFERENCES jobs(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_clock_shop_technician ON time_clock(shop_id, technician_id);
CREATE INDEX IF NOT EXISTS idx_time_clock_technician_status ON time_clock(technician_id, status);
CREATE INDEX IF NOT EXISTS idx_time_clock_ro ON time_clock(ro_id);
CREATE INDEX IF NOT EXISTS idx_time_clock_clock_in ON time_clock(clock_in);
CREATE INDEX IF NOT EXISTS idx_time_clock_status ON time_clock(status);
CREATE INDEX IF NOT EXISTS idx_time_clock_payroll ON time_clock(payroll_processed, flagged_for_payroll);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC CALCULATIONS (SQLite Version)
-- =====================================================

-- Trigger to automatically calculate hours when clock_out is set
CREATE TRIGGER IF NOT EXISTS trigger_timeclock_calculate_hours
AFTER UPDATE OF clock_out, break_start, break_end ON time_clock
FOR EACH ROW
WHEN NEW.clock_out IS NOT NULL
BEGIN
  -- Calculate break hours if both break times are set
  UPDATE time_clock SET
    break_hours = CASE
      WHEN NEW.break_start IS NOT NULL AND NEW.break_end IS NOT NULL
      THEN ROUND((julianday(NEW.break_end) - julianday(NEW.break_start)) * 24, 2)
      ELSE COALESCE(break_hours, 0)
    END,
    -- Calculate total hours
    total_hours = ROUND((julianday(NEW.clock_out) - julianday(NEW.clock_in)) * 24, 2),
    -- Calculate net hours (total - break)
    net_hours = ROUND(
      (julianday(NEW.clock_out) - julianday(NEW.clock_in)) * 24 -
      CASE
        WHEN NEW.break_start IS NOT NULL AND NEW.break_end IS NOT NULL
        THEN (julianday(NEW.break_end) - julianday(NEW.break_start)) * 24
        ELSE COALESCE(break_hours, 0)
      END,
      2
    ),
    -- Calculate labor cost
    labor_cost = CASE
      WHEN NEW.hourly_rate IS NOT NULL
      THEN ROUND(
        NEW.hourly_rate * (
          (julianday(NEW.clock_out) - julianday(NEW.clock_in)) * 24 -
          CASE
            WHEN NEW.break_start IS NOT NULL AND NEW.break_end IS NOT NULL
            THEN (julianday(NEW.break_end) - julianday(NEW.break_start)) * 24
            ELSE COALESCE(break_hours, 0)
          END
        ),
        2
      )
      ELSE labor_cost
    END,
    -- Calculate actual vs estimated
    actual_vs_estimated = CASE
      WHEN NEW.estimated_hours IS NOT NULL
      THEN ROUND(
        (
          (julianday(NEW.clock_out) - julianday(NEW.clock_in)) * 24 -
          CASE
            WHEN NEW.break_start IS NOT NULL AND NEW.break_end IS NOT NULL
            THEN (julianday(NEW.break_end) - julianday(NEW.break_start)) * 24
            ELSE COALESCE(break_hours, 0)
          END
        ) - NEW.estimated_hours,
        2
      )
      ELSE actual_vs_estimated
    END,
    -- Calculate efficiency rating
    efficiency_rating = CASE
      WHEN NEW.estimated_hours IS NOT NULL AND
           ((julianday(NEW.clock_out) - julianday(NEW.clock_in)) * 24 -
            CASE
              WHEN NEW.break_start IS NOT NULL AND NEW.break_end IS NOT NULL
              THEN (julianday(NEW.break_end) - julianday(NEW.break_start)) * 24
              ELSE COALESCE(break_hours, 0)
            END) > 0
      THEN ROUND(
        (NEW.estimated_hours /
         ((julianday(NEW.clock_out) - julianday(NEW.clock_in)) * 24 -
          CASE
            WHEN NEW.break_start IS NOT NULL AND NEW.break_end IS NOT NULL
            THEN (julianday(NEW.break_end) - julianday(NEW.break_start)) * 24
            ELSE COALESCE(break_hours, 0)
          END)
        ) * 100,
        2
      )
      ELSE efficiency_rating
    END,
    -- Update status
    status = 'clocked_out',
    -- Update timestamp
    updated_at = datetime('now')
  WHERE id = NEW.id;
END;

-- Trigger to set approval date when approved changes to true
CREATE TRIGGER IF NOT EXISTS trigger_timeclock_approval_date
AFTER UPDATE OF approved ON time_clock
FOR EACH ROW
WHEN NEW.approved = 1 AND OLD.approved = 0
BEGIN
  UPDATE time_clock SET
    approval_date = datetime('now'),
    updated_at = datetime('now')
  WHERE id = NEW.id;
END;

-- Trigger to update timestamps
CREATE TRIGGER IF NOT EXISTS trigger_timeclock_updated_at
AFTER UPDATE ON time_clock
FOR EACH ROW
BEGIN
  UPDATE time_clock SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify table creation
SELECT 'Time clock table created successfully' as status;

-- Count time clock entries (should be 0 initially)
SELECT COUNT(*) as timeclock_count FROM time_clock;

-- =====================================================
-- NOTES
-- =====================================================
-- Application layer should handle:
-- 1. UUID/ID generation for primary keys
-- 2. Complex payroll calculations
-- 3. Integration with external payroll systems
-- 4. QR code generation for job scanning
-- 5. Real-time updates via WebSocket/SSE
-- =====================================================
