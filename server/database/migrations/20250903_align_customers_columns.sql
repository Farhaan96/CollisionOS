-- Align customers table with API expectations
-- Adds commonly used columns if missing and basic indexes

DO $$ BEGIN
  ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS mobile VARCHAR(20);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS customer_type VARCHAR(50) DEFAULT 'individual';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS customer_status VARCHAR(50) DEFAULT 'active';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(customer_status);
CREATE INDEX IF NOT EXISTS idx_customers_type ON public.customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);

