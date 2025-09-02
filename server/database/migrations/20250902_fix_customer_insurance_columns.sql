-- =====================================================
-- CollisionOS Customer Insurance Columns Fix
-- Migration: 20250902_fix_customer_insurance_columns
-- Created: 2025-09-02
-- Description: Add missing insurance-related columns to customers table
-- =====================================================

-- Add missing insurance-related columns to customers table
ALTER TABLE customers 
ADD COLUMN primary_insurance_company VARCHAR(100);

ALTER TABLE customers 
ADD COLUMN policy_number VARCHAR(50);

ALTER TABLE customers 
ADD COLUMN deductible DECIMAL(8,2);

-- Add comments for documentation
COMMENT ON COLUMN customers.primary_insurance_company IS 'Primary insurance company for collision repair claims';
COMMENT ON COLUMN customers.policy_number IS 'Insurance policy number';  
COMMENT ON COLUMN customers.deductible IS 'Insurance deductible amount';

-- Update existing records to have NULL for these fields (which is acceptable)
-- No data update needed since these are new optional columns

-- Create index for performance on insurance company lookups
CREATE INDEX IF NOT EXISTS idx_customers_insurance_company 
ON customers(primary_insurance_company);

-- Create index for policy number lookups  
CREATE INDEX IF NOT EXISTS idx_customers_policy_number 
ON customers(policy_number);