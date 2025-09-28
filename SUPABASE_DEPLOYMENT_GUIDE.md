# CollisionOS Supabase Deployment Guide

Complete guide for deploying the CollisionOS collision repair management system to Supabase.

## 🎯 Overview

This guide walks through deploying a production-ready Supabase project for collision repair shops, including:

- **Database Schema**: Collision repair specific tables and relationships
- **BMS Integration**: Edge Functions for insurance XML processing
- **Security**: Row Level Security (RLS) with shop isolation
- **Real-time**: Live updates for parts workflow
- **Storage**: Secure file handling for BMS files and photos

## 📋 Prerequisites

### Required Software
```bash
# Supabase CLI
npm install -g @supabase/cli

# Node.js 18+ and npm
node --version  # Should be 18+
npm --version

# Git (for version control)
git --version
```

### Required Accounts
- [Supabase Account](https://supabase.com) (Pro plan recommended for production)
- GitHub account (for version control and CI/CD)

### Environment Setup
```bash
# Clone the repository
git clone <your-collision-os-repo>
cd CollisionOS

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local
```

## 🚀 Quick Start (Automated)

For a fully automated setup, run the configuration script:

```bash
# Run the comprehensive setup script
node scripts/configure-supabase-project.js

# Deploy Edge Functions
node scripts/deploy-edge-functions.js

# Test the deployment
npm run test:bms-integration
```

## 📝 Manual Deployment Steps

### Step 1: Create Supabase Project

1. **Create New Project**
   ```bash
   # Login to Supabase
   supabase login

   # Create new project
   supabase projects create "CollisionOS Production" --region us-east-1
   ```

2. **Get Project Credentials**
   - Project URL: `https://your-project-ref.supabase.co`
   - Anon Key: From Settings > API
   - Service Role Key: From Settings > API (keep secure!)

3. **Update Environment**
   ```bash
   # Update .env.local with your credentials
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

### Step 2: Initialize Local Development

```bash
# Initialize Supabase locally
supabase init

# Link to your remote project
supabase link --project-ref your-project-ref

# Start local development
supabase start
```

### Step 3: Deploy Database Schema

```bash
# Deploy collision repair schema
supabase db push

# Or manually apply the schema
supabase db reset --linked
```

**Schema includes:**
- ✅ 13 collision repair tables (shops, customers, vehicles, claims, ROs, parts, etc.)
- ✅ Collision repair specific enums and types
- ✅ Indexes for performance optimization
- ✅ Foreign key relationships for data integrity

### Step 4: Apply Security Policies

```bash
# Deploy Row Level Security policies
supabase db push --include-all

# The RLS policies provide:
# - Shop-based data isolation
# - Role-based access control
# - BMS data protection
# - Parts workflow security
```

### Step 5: Deploy Edge Functions

```bash
# Deploy BMS ingestion function
supabase functions deploy bms_ingest

# Configure function secrets
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
supabase secrets set JWT_SECRET="your_jwt_secret_here"
```

### Step 6: Configure Storage Buckets

```bash
# Create storage buckets for collision repair files
supabase storage create-bucket bms-files --public=false
supabase storage create-bucket ro-photos --public=false
supabase storage create-bucket documents --public=false
```

### Step 7: Seed Sample Data

```bash
# Load collision repair seed data
node scripts/create-collision-repair-seed.js

# Apply seed data to database
supabase db reset --linked
```

### Step 8: Configure Real-time

Enable real-time subscriptions for workflow updates:

```sql
-- Enable real-time for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE repair_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE part_lines;
ALTER PUBLICATION supabase_realtime ADD TABLE purchase_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE bms_imports;
```

### Step 9: Test Deployment

```bash
# Test BMS integration
npm run test:bms-integration

# Test collision repair workflow
node scripts/test-collision-repair-workflow.js

# Run comprehensive tests
npm run test:production-ready
```

## 🔧 Configuration Files

### Supabase Configuration (`supabase/config.toml`)

```toml
project_id = "collision-os"

[api]
port = 54321
schemas = ["public", "storage", "graphql_public"]
max_rows = 1000

[db]
port = 54322
major_version = 15

[auth]
site_url = "https://your-domain.com"
enable_signup = true
jwt_expiry = 3600

[edge_functions]
bms_ingestion_timeout = 30
max_file_size = "10MiB"
allowed_file_types = ["application/xml", "text/xml"]

[functions.bms_ingest]
verify_cors = true
```

### Environment Variables (`.env.local`)

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Frontend Configuration
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here

# Development Configuration
DEV_SHOP_ID=550e8400-e29b-41d4-a716-446655440000
DEV_USER_ID=440e8400-e29b-41d4-a716-446655440000

# Security
JWT_SECRET=your_secure_jwt_secret_minimum_32_characters_long
SESSION_SECRET=your_session_secret_minimum_32_characters_long

# Server Configuration
PORT=3002
NODE_ENV=production
```

## 🔒 Security Configuration

### Row Level Security (RLS)

The deployment includes comprehensive RLS policies:

```sql
-- Shop Isolation: Users only see their shop's data
CREATE POLICY "shop_isolation" ON repair_orders
  FOR SELECT USING (shop_id = auth.user_shop_id());

-- Role-based Access: Different permissions by role
CREATE POLICY "parts_management" ON part_lines
  FOR UPDATE USING (auth.can_manage_parts());

-- BMS Data Protection: Sensitive data access
CREATE POLICY "bms_restricted" ON bms_imports
  FOR SELECT USING (auth.user_role() IN ('admin', 'estimator'));
```

### Authentication Setup

```bash
# Configure auth providers (optional)
supabase auth update --enable-signup=true
supabase auth update --site-url="https://your-domain.com"

# Set up social providers if needed
supabase auth update --provider=google --secret="your_google_secret"
```

## 📊 Database Schema Overview

### Core Tables

```
shops (1) ←→ (many) users
shops (1) ←→ (many) customers
customers (1) ←→ (many) vehicles
vehicles (1) ←→ (many) insurance_claims
insurance_claims (1) ←→ (1) repair_orders
repair_orders (1) ←→ (many) part_lines
repair_orders (1) ←→ (many) purchase_orders
suppliers (1) ←→ (many) purchase_orders
part_lines (1) ←→ (0..1) returns
```

### Key Features

- **1:1 Claim-to-RO Relationship**: Insurance industry standard
- **Parts Workflow States**: needed → sourcing → ordered → received → installed
- **BMS Import Tracking**: Complete audit trail for insurance data
- **Multi-vendor Support**: OEM, LKQ, Aftermarket suppliers
- **Document Management**: Secure file storage with access control

## 🚀 Edge Functions

### BMS Ingestion Function

**Endpoint:** `/functions/v1/bms_ingest`

**Features:**
- Multi-format XML parsing (State Farm, Intact, Aviva)
- Atomic transaction processing
- Error handling and validation
- Automatic workflow creation

**Sample Request:**
```javascript
const response = await fetch('/functions/v1/bms_ingest', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseAnonKey}`
  },
  body: JSON.stringify({
    data: xmlContent,
    format: 'xml',
    shop_id: 'your-shop-id',
    user_id: 'your-user-id',
    file_name: 'honda_civic_sf_001234.xml',
    auto_create_ro: true
  })
});
```

## 📱 Frontend Integration

### Supabase Client Setup

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// Real-time subscription for parts workflow
const subscription = supabase
  .channel('parts-workflow')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'part_lines'
  }, (payload) => {
    // Update UI when parts status changes
    updatePartsDisplay(payload.new);
  })
  .subscribe();
```

### Authentication Integration

```javascript
// Login with email/password
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@collisionshop.com',
  password: 'secure_password'
});

// Get current user and shop
const { data: userData } = await supabase
  .from('users')
  .select('*, shops(*)')
  .eq('auth_user_id', user.id)
  .single();
```

## 🧪 Testing

### Local Testing

```bash
# Test database schema
npm run test:unit

# Test BMS integration
npm run test:bms-integration

# Test complete workflow
node scripts/test-collision-repair-workflow.js
```

### Production Testing

```bash
# Test against production database
npm run test:production

# Load testing
npm run test:performance

# Security testing
npm run test:security
```

## 📈 Monitoring & Maintenance

### Performance Monitoring

1. **Database Performance**
   - Monitor query performance in Supabase Dashboard
   - Review slow query logs
   - Optimize indexes for collision repair queries

2. **Edge Function Monitoring**
   - Monitor function execution times
   - Track error rates and success rates
   - Set up alerts for function failures

3. **Real-time Monitoring**
   - Monitor real-time connection counts
   - Track subscription performance
   - Monitor bandwidth usage

### Maintenance Tasks

```bash
# Weekly database maintenance
ANALYZE; -- Update table statistics
VACUUM; -- Reclaim storage space

# Monthly backup verification
pg_dump production_db > backup_$(date +%Y%m%d).sql

# Quarterly security review
# Review RLS policies
# Update dependencies
# Rotate secrets
```

## 🚨 Troubleshooting

### Common Issues

1. **BMS Ingestion Failures**
   ```bash
   # Check function logs
   supabase functions logs bms_ingest

   # Test with sample XML
   curl -X POST "your-project-url/functions/v1/bms_ingest" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer your-anon-key" \
     -d @test-bms-payload.json
   ```

2. **RLS Policy Issues**
   ```sql
   -- Test user permissions
   SELECT auth.user_shop_id();
   SELECT auth.user_role();
   SELECT check_user_permission('create_ro');
   ```

3. **Real-time Connection Issues**
   ```javascript
   // Debug real-time connections
   supabase.channel('debug').subscribe((status) => {
     console.log('Real-time status:', status);
   });
   ```

### Error Messages

| Error | Solution |
|-------|----------|
| `RLS policy violation` | Check user shop_id and role permissions |
| `Function timeout` | Optimize BMS processing or increase timeout |
| `Storage upload failed` | Verify bucket permissions and file size limits |
| `Real-time connection failed` | Check auth status and subscription limits |

## 📞 Support

### Resources

- [Supabase Documentation](https://supabase.com/docs)
- [CollisionOS GitHub Issues](your-repo/issues)
- [Collision Repair Workflow Guide](COLLISION_REPAIR_WORKFLOW.md)

### Contact

- **Technical Issues**: Create GitHub issue with detailed error logs
- **Security Concerns**: Email security@your-domain.com
- **Feature Requests**: Use GitHub discussions

---

## ✅ Deployment Checklist

### Pre-deployment
- [ ] Supabase CLI installed and authenticated
- [ ] Environment variables configured
- [ ] Database schema validated
- [ ] BMS Edge Function tested locally

### Deployment
- [ ] Supabase project created
- [ ] Database schema deployed
- [ ] RLS policies applied
- [ ] Edge Functions deployed
- [ ] Storage buckets configured
- [ ] Real-time enabled

### Post-deployment
- [ ] Seed data loaded
- [ ] BMS integration tested
- [ ] Frontend connected
- [ ] Security policies verified
- [ ] Performance benchmarked
- [ ] Monitoring configured

### Production Readiness
- [ ] Backup strategy implemented
- [ ] Error monitoring setup
- [ ] Load testing completed
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Team training completed

---

**🎉 Congratulations!** Your CollisionOS system is now deployed and ready for collision repair workflow management.

*Last updated: $(date +%Y-%m-%d)*