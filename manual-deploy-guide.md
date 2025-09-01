# Manual Supabase Schema Deployment Guide

## 🎯 **Your Supabase is Connected!**

Now you just need to deploy the database schema.

## **Step 1: Access Your Supabase Dashboard**

1. Go to: `https://your-project-ref.supabase.co` (replace with your actual Supabase project URL)
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New query"**

## **Step 2: Deploy Schema Files in Order**

### **File 1: Initial Schema**

Copy and paste the contents of `supabase-migration/schema/01_initial_schema.sql`

### **File 2: Jobs and Workflow**

Copy and paste the contents of `supabase-migration/schema/02_jobs_and_workflow.sql`

### **File 3: Realtime and Permissions**

Copy and paste the contents of `supabase-migration/schema/03_realtime_and_permissions.sql`

### **File 4: Advanced Analytics**

Copy and paste the contents of `supabase-migration/schema/04_advanced_analytics.sql`

## **Step 3: Execute Each File**

1. Paste the SQL content
2. Click **"Run"** button
3. Wait for completion
4. Create a new query for the next file
5. Repeat for all 4 files

## **Step 4: Verify Deployment**

After deploying all files, your Supabase dashboard should show:

- **Tables**: 20+ tables (instead of 0)
- **Functions**: Several database functions
- **Database Requests**: Active usage

## **Expected Tables Created:**

- `shops` - Multi-tenant shop management
- `users` - User accounts and authentication
- `customers` - Customer information
- `vehicles` - Vehicle details
- `repair_orders` - Job management
- `parts` - Parts inventory
- `claims` - Insurance claims
- And many more...

## **After Deployment:**

Run this command to verify everything is working:

```bash
node test-connection.js
```

## **Troubleshooting:**

- If you get errors, make sure to run the files in order
- Some statements might fail if tables already exist (that's okay)
- Check the Supabase logs for any specific error messages

## **Next Steps:**

Once deployed, you can:

1. Test the connection: `node test-connection.js`
2. Seed test data: `cd supabase-migration && npm run seed`
3. Start your CollisionOS application

Your Supabase project will be fully configured! 🚀
