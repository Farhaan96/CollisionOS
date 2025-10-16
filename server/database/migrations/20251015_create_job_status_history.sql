-- Migration: Create job_status_history table
-- Date: 2025-10-15
-- Purpose: Track job status changes for audit trail and timeline display

-- Create job_status_history table
CREATE TABLE IF NOT EXISTS job_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL,
  previous_status VARCHAR(50) NOT NULL,
  new_status VARCHAR(50) NOT NULL,
  changed_by UUID NOT NULL,
  notes TEXT,
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  shop_id UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Foreign keys (adjust table names based on your schema)
  CONSTRAINT fk_job_status_history_job
    FOREIGN KEY (job_id)
    REFERENCES jobs(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_job_status_history_user
    FOREIGN KEY (changed_by)
    REFERENCES users(id)
    ON DELETE SET NULL,

  CONSTRAINT fk_job_status_history_shop
    FOREIGN KEY (shop_id)
    REFERENCES shops(id)
    ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_status_history_job_id
  ON job_status_history(job_id);

CREATE INDEX IF NOT EXISTS idx_job_status_history_changed_at
  ON job_status_history(changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_status_history_shop_id
  ON job_status_history(shop_id);

CREATE INDEX IF NOT EXISTS idx_job_status_history_new_status
  ON job_status_history(new_status);

-- Add comments for documentation
COMMENT ON TABLE job_status_history IS 'Audit trail of job status changes for timeline and reporting';
COMMENT ON COLUMN job_status_history.job_id IS 'Reference to the job that changed status';
COMMENT ON COLUMN job_status_history.previous_status IS 'Status before the change';
COMMENT ON COLUMN job_status_history.new_status IS 'Status after the change';
COMMENT ON COLUMN job_status_history.changed_by IS 'User who made the status change';
COMMENT ON COLUMN job_status_history.notes IS 'Optional notes explaining the status change';
COMMENT ON COLUMN job_status_history.changed_at IS 'Timestamp of when the status changed';
COMMENT ON COLUMN job_status_history.shop_id IS 'Shop this status change belongs to';

-- Insert test data (optional - remove in production)
-- This creates sample status history for testing
/*
INSERT INTO job_status_history (job_id, previous_status, new_status, changed_by, notes, changed_at, shop_id)
SELECT
  j.id,
  'estimate',
  'intake',
  j.created_by,
  'Initial intake after estimate approval',
  j.created_at + INTERVAL '1 day',
  j.shop_id
FROM jobs j
WHERE j.status IN ('intake', 'in_production', 'delivered')
LIMIT 10;
*/

-- Rollback script (if needed)
-- DROP TABLE IF EXISTS job_status_history CASCADE;
