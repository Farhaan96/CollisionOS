# Quick Supabase Setup Guide for Existing Project

## 🎯 You Don't Need to Start Fresh!

Your Supabase project is fine - it just needs the CollisionOS schema and configuration.

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy these values:
   - **Project URL** (looks like `https://your-project-ref.supabase.co`)
   - **anon/public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)
   - **service_role key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)

## Step 2: Update Your Environment File

### Server-Side Environment (.env)

Add these lines to your `.env` file (server-side only):

```env
# Supabase Configuration (Server-Side)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Enable Supabase
ENABLE_SUPABASE=true
```

### Client-Side Environment (.env.local or .env.production)

For your React/Next.js app, create a separate environment file:

```env
# Supabase Configuration (Client-Side - Safe to expose)
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

**⚠️ SECURITY WARNING:**

- The `SUPABASE_SERVICE_ROLE_KEY` should NEVER be exposed to users
- Only use the `SUPABASE_ANON_KEY` in client-side code
- The service role key bypasses Row Level Security (RLS)
- Keep the service role key only on your server

## Step 3: Deploy the Schema

### Option A: Using Admin Script (Recommended)

Run this command to deploy the CollisionOS database schema:

```bash
node admin-setup-supabase.js
```

### Option B: Manual Deployment

If you prefer to deploy manually:

1. Go to your Supabase Dashboard → SQL Editor
2. Copy and paste the contents of these files in order:
   - `supabase-migration/schema/01_initial_schema.sql`
   - `supabase-migration/schema/02_jobs_and_workflow.sql`
   - `supabase-migration/schema/03_realtime_and_permissions.sql`
   - `supabase-migration/schema/04_advanced_analytics.sql`

This will create all the necessary tables with proper Row Level Security (RLS) policies.

## Step 4: Verify the Connection

### Test User Connection (Safe)

Test that the client-side connection works:

```bash
node configure-supabase.js
```

### Test Admin Connection (Server-Side Only)

Test admin operations (requires service role key):

```bash
node admin-setup-supabase.js
```

## Step 5: Seed Test Data (Optional)

If you want to add sample data for testing:

```bash
cd supabase-migration
npm run seed
```

## What This Will Do

✅ **Create Database Tables**: Customers, vehicles, repair orders, parts, claims, etc.
✅ **Set Up Authentication**: User management and shop isolation
✅ **Enable Real-time Features**: Live updates and notifications
✅ **Configure Storage**: File uploads for photos and documents
✅ **Set Up Analytics**: Performance tracking and reporting

## Expected Results

After setup, your Supabase dashboard should show:

- **Tables**: 20+ tables (instead of 0)
- **Functions**: Several database functions
- **Database Requests**: Active usage when you run tests
- **Auth Requests**: Authentication activity
- **Storage Requests**: File upload activity

## Troubleshooting

If you encounter issues:

1. **Check Credentials**: Make sure your Supabase URL and keys are correct
2. **Manual Schema**: If the script fails, copy the SQL files from `supabase-migration/schema/` and run them manually in the Supabase SQL Editor
3. **Test Connection**: Use `node configure-supabase.js` to diagnose connection issues

## Next Steps

Once configured:

1. Start your CollisionOS application
2. Run your tests
3. You should see activity in your Supabase dashboard
4. The "Tables 0" should change to show your actual table count

Your project is ready to go! 🚀
