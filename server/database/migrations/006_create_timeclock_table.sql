-- Migration: Create time_clock table for punch in/out tracking
-- Description: Real-time time tracking for technicians with RO-level granularity
-- Features: QR code scanning, break tracking, efficiency calculation, payroll integration

-- Create time_clock table
CREATE TABLE IF NOT EXISTS time_clock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ro_id UUID REFERENCES jobs(id) ON DELETE SET NULL,

  -- Time tracking
  clock_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  clock_out TIMESTAMP WITH TIME ZONE,
  break_start TIMESTAMP WITH TIME ZONE,
  break_end TIMESTAMP WITH TIME ZONE,

  -- Calculated fields
  total_hours DECIMAL(8, 2),
  break_hours DECIMAL(6, 2) DEFAULT 0.0,
  net_hours DECIMAL(8, 2),

  -- Labor details
  labor_type VARCHAR(50) CHECK (labor_type IN (
    'body', 'paint', 'frame', 'mechanical', 'electrical',
    'glass', 'detail', 'prep', 'quality_control', 'other'
  )),
  hourly_rate DECIMAL(8, 2),
  labor_cost DECIMAL(10, 2),

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'clocked_in' CHECK (status IN (
    'clocked_in', 'on_break', 'clocked_out', 'cancelled'
  )),

  -- Work details
  work_description TEXT,
  notes TEXT,

  -- Entry method
  entry_method VARCHAR(20) DEFAULT 'manual' CHECK (entry_method IN (
    'manual', 'qr_code', 'barcode', 'mobile_app', 'web_app'
  )),

  -- Location tracking
  bay_number VARCHAR(10),

  -- Efficiency tracking
  estimated_hours DECIMAL(8, 2),
  actual_vs_estimated DECIMAL(8, 2),
  efficiency_rating DECIMAL(5, 2), -- percentage

  -- Approval workflow
  requires_approval BOOLEAN DEFAULT FALSE,
  approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approval_date TIMESTAMP WITH TIME ZONE,

  -- Payroll integration
  payroll_processed BOOLEAN DEFAULT FALSE,
  payroll_date TIMESTAMP WITH TIME ZONE,
  payroll_period VARCHAR(20),
  flagged_for_payroll BOOLEAN DEFAULT TRUE,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_clock_shop_technician ON time_clock(shop_id, technician_id);
CREATE INDEX IF NOT EXISTS idx_time_clock_technician_status ON time_clock(technician_id, status);
CREATE INDEX IF NOT EXISTS idx_time_clock_ro ON time_clock(ro_id);
CREATE INDEX IF NOT EXISTS idx_time_clock_clock_in ON time_clock(clock_in);
CREATE INDEX IF NOT EXISTS idx_time_clock_status ON time_clock(status);
CREATE INDEX IF NOT EXISTS idx_time_clock_payroll ON time_clock(payroll_processed, flagged_for_payroll);

-- Create function to automatically update total_hours and net_hours
CREATE OR REPLACE FUNCTION update_timeclock_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.clock_out IS NOT NULL THEN
    -- Calculate total hours
    NEW.total_hours := EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 3600;

    -- Calculate net hours (total - break)
    NEW.net_hours := NEW.total_hours - COALESCE(NEW.break_hours, 0);

    -- Calculate labor cost
    IF NEW.hourly_rate IS NOT NULL AND NEW.net_hours IS NOT NULL THEN
      NEW.labor_cost := ROUND((NEW.hourly_rate * NEW.net_hours)::numeric, 2);
    END IF;

    -- Calculate efficiency if estimated hours are available
    IF NEW.estimated_hours IS NOT NULL AND NEW.net_hours IS NOT NULL AND NEW.net_hours > 0 THEN
      NEW.actual_vs_estimated := NEW.net_hours - NEW.estimated_hours;
      NEW.efficiency_rating := ROUND(((NEW.estimated_hours / NEW.net_hours) * 100)::numeric, 2);
    END IF;

    -- Update status
    NEW.status := 'clocked_out';
  END IF;

  -- Calculate break hours if both break_start and break_end are set
  IF NEW.break_start IS NOT NULL AND NEW.break_end IS NOT NULL THEN
    NEW.break_hours := EXTRACT(EPOCH FROM (NEW.break_end - NEW.break_start)) / 3600;
  END IF;

  -- Set approval date if approved
  IF NEW.approved = TRUE AND OLD.approved = FALSE THEN
    NEW.approval_date := NOW();
  END IF;

  -- Update updated_at timestamp
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic hour calculation
DROP TRIGGER IF EXISTS trigger_update_timeclock_hours ON time_clock;
CREATE TRIGGER trigger_update_timeclock_hours
  BEFORE UPDATE ON time_clock
  FOR EACH ROW
  EXECUTE FUNCTION update_timeclock_hours();

-- Comments for documentation
COMMENT ON TABLE time_clock IS 'Real-time time tracking for technicians with RO-level granularity and payroll integration';
COMMENT ON COLUMN time_clock.entry_method IS 'How the technician clocked in (manual, QR code, barcode, mobile app, web app)';
COMMENT ON COLUMN time_clock.efficiency_rating IS 'Percentage efficiency based on estimated vs actual hours (100% = on time)';
COMMENT ON COLUMN time_clock.flagged_for_payroll IS 'Whether this entry should be included in payroll calculations';
COMMENT ON COLUMN time_clock.metadata IS 'Additional flexible data storage for custom fields';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON time_clock TO collisionos_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO collisionos_user;
