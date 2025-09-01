# Supabase Integration Setup Guide

This guide will help you set up Supabase integration for CollisionOS.

## Overview

The Supabase integration provides:

- **Modern Authentication**: Replace JWT with Supabase Auth
- **Real-time Updates**: Replace Socket.io with Supabase Realtime
- **Scalable Database**: Replace SQLite/PostgreSQL with Supabase
- **Backwards Compatibility**: Gradual migration support

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Node.js Dependencies**: Already installed via `npm install @supabase/supabase-js`

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Choose your region (closest to your users)
4. Wait for project setup to complete (2-3 minutes)

## Step 2: Get Your Supabase Credentials

From your Supabase dashboard:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon/public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)
   - **service_role key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)

## Step 3: Update Environment Variables

Edit your `.env` file and update the Supabase configuration:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Database Migration Settings
ENABLE_SUPABASE=true
MIGRATION_MODE=legacy
```

## Step 4: Create Database Schema

### Option A: Using Supabase SQL Editor

1. Go to **SQL Editor** in your Supabase dashboard
2. Create a new query and paste the following schema:

```sql
-- Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  department VARCHAR(100),
  shop_id UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  last_logout_at TIMESTAMP WITH TIME ZONE
);

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  vehicle_make VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_year INTEGER,
  vehicle_vin VARCHAR(17),
  description TEXT,
  status VARCHAR(50) DEFAULT 'estimate',
  priority VARCHAR(20) DEFAULT 'normal',
  shop_id UUID NOT NULL,
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  shop_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id),
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  vin VARCHAR(17) UNIQUE,
  color VARCHAR(50),
  license_plate VARCHAR(20),
  shop_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create parts table
CREATE TABLE public.parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  part_number VARCHAR(100),
  description TEXT,
  price DECIMAL(10,2),
  quantity INTEGER DEFAULT 0,
  shop_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create job_status_history table for audit trail
CREATE TABLE public.job_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id),
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES public.users(id),
  notes TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_status_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shop isolation
CREATE POLICY "Users can access their own shop data" ON public.users
  FOR ALL USING (shop_id = (auth.jwt() ->> 'shop_id')::uuid);

CREATE POLICY "Users can access their shop jobs" ON public.jobs
  FOR ALL USING (shop_id = (auth.jwt() ->> 'shop_id')::uuid);

CREATE POLICY "Users can access their shop customers" ON public.customers
  FOR ALL USING (shop_id = (auth.jwt() ->> 'shop_id')::uuid);

CREATE POLICY "Users can access their shop vehicles" ON public.vehicles
  FOR ALL USING (shop_id = (auth.jwt() ->> 'shop_id')::uuid);

CREATE POLICY "Users can access their shop parts" ON public.parts
  FOR ALL USING (shop_id = (auth.jwt() ->> 'shop_id')::uuid);

CREATE POLICY "Users can access their shop job history" ON public.job_status_history
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = job_status_history.job_id
    AND jobs.shop_id = (auth.jwt() ->> 'shop_id')::uuid
  ));

-- Create indexes for better performance
CREATE INDEX idx_users_shop_id ON public.users(shop_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_jobs_shop_id ON public.jobs(shop_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_created_at ON public.jobs(created_at);
CREATE INDEX idx_customers_shop_id ON public.customers(shop_id);
CREATE INDEX idx_vehicles_shop_id ON public.vehicles(shop_id);
CREATE INDEX idx_parts_shop_id ON public.parts(shop_id);
CREATE INDEX idx_job_history_job_id ON public.job_status_history(job_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON public.parts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

3. Run the query to create your schema

### Option B: Using Migration Utilities

You can also use our built-in migration utilities:

```bash
# Check migration status
curl http://localhost:4000/api/migration/status

# The response will show you table analysis and recommendations
```

## Step 5: Enable Real-time Features

In your Supabase dashboard:

1. Go to **Database** → **Replication**
2. Enable replication for tables you want real-time updates:
   - `jobs` (for production board updates)
   - `job_status_history` (for status change notifications)
   - `parts` (for inventory updates)

## Step 6: Configure Authentication

### Option A: Use Supabase Auth (Recommended)

This provides the most features including email verification, password reset, etc.

1. Go to **Authentication** → **Settings**
2. Configure your site URL: `http://localhost:3000` (development)
3. Add any additional redirect URLs you need

### Option B: Use Custom Auth

If you prefer to keep your current auth system, you can disable Supabase Auth and use the hybrid approach.

## Step 7: Test the Integration

1. **Start the server**:

```bash
npm run server
```

2. **Check health endpoint**:

```bash
curl http://localhost:4000/health
```

You should see output like:

```json
{
  "status": "OK",
  "database": {
    "type": "supabase",
    "connected": true
  },
  "realtime": {
    "backend": "supabase",
    "subscriptions": 1
  },
  "supabase": {
    "enabled": true,
    "configured": true
  }
}
```

3. **Test the API**:

```bash
# Get jobs (should work with either auth system)
curl http://localhost:4000/api/jobs
```

## Migration Modes

### Legacy Mode (Default)

- `ENABLE_SUPABASE=false`
- Uses existing SQLite/PostgreSQL database
- Uses Socket.io for real-time
- Uses JWT authentication

### Supabase Mode

- `ENABLE_SUPABASE=true`
- Uses Supabase for all operations
- Uses Supabase Realtime
- Can use Supabase Auth or hybrid auth

### Hybrid Mode (For Migration)

- `ENABLE_SUPABASE=true`
- `MIGRATION_MODE=hybrid`
- Reads from Supabase, falls back to legacy
- Both auth systems supported
- Gradual migration support

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify your Supabase credentials
   - Check your project is not paused
   - Ensure network connectivity

2. **RLS Policy Errors**
   - Make sure RLS policies are created
   - Check that JWT contains `shop_id`
   - Verify user permissions

3. **Real-time Not Working**
   - Enable replication for your tables
   - Check Supabase dashboard for connection issues
   - Verify real-time subscriptions in console

4. **Authentication Issues**
   - Check JWT secrets match
   - Verify Supabase Auth settings
   - Check user creation process

### Debug Commands

```bash
# Check migration status
curl http://localhost:4000/api/migration/status

# Health check with detailed info
curl http://localhost:4000/health

# Check server logs
npm run server # Look for Supabase connection messages
```

### Getting Help

1. **Server Logs**: Check the console output when starting the server
2. **Supabase Dashboard**: Monitor logs and analytics in your project dashboard
3. **API Documentation**: Visit `http://localhost:4000/api-docs` for interactive API docs

## Next Steps

Once Supabase is working:

1. **Data Migration**: Use the migration utilities to move existing data
2. **Frontend Updates**: Update your frontend to use new API features
3. **Testing**: Run your test suite to ensure compatibility
4. **Performance**: Monitor and optimize real-time subscriptions
5. **Security**: Review and customize RLS policies for your needs

## Rollback Plan

If you need to rollback to the legacy system:

1. Set `ENABLE_SUPABASE=false` in `.env`
2. Restart the server
3. The system will automatically use the legacy database
4. All existing functionality will work as before

The integration is designed to be non-destructive and allows easy rollback at any time.
