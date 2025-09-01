# CollisionOS Supabase Migration - Execution Guide

## Quick Start Commands

```bash
# 1. Setup Supabase project and schema
npm run setup

# 2. Seed test data
npm run seed

# 3. Test seeded data
npm run test-seeded

# 4. Run full validation
npm run validate
```

## Detailed Step-by-Step Execution

### Phase 1: Environment Preparation

#### 1.1 Prerequisites Check

```bash
# Check Node.js version (requires 16+)
node --version

# Check npm version (requires 8+)
npm --version

# Navigate to migration directory
cd supabase-migration

# Install dependencies
npm install
```

#### 1.2 Backup Current Data

```bash
# Create backup of current database
cp ../data/collisionos.db ../data/collisionos_backup_$(date +%Y%m%d_%H%M%S).db

# Verify backup
ls -la ../data/collisionos_backup_*.db
```

### Phase 2: Supabase Project Setup

#### 2.1 Create and Configure Supabase Project

```bash
# Run the setup script
npm run setup
```

This script will:

- Install Supabase CLI if needed
- Guide you through project creation
- Set up authentication configuration
- Apply database schema (3 SQL files)
- Configure Row Level Security (RLS)
- Enable realtime subscriptions
- Create storage buckets
- Generate configuration file

**Expected Output:**

```
🌐 Setting up Supabase project...
✅ Supabase CLI installed
✅ Project created: collisionos-migration
✅ Schema applied successfully
✅ RLS policies configured
✅ Realtime enabled
✅ Storage buckets created
✅ Configuration saved to supabase-config.json
```

#### 2.2 Manual Configuration (if needed)

If the setup script doesn't complete automatically, manually configure:

1. **Authentication Settings**
   - Go to Supabase Dashboard > Authentication > Settings
   - Set Site URL: `http://localhost:3000`
   - Add redirect URLs:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/dashboard`
   - Disable public signups
   - Enable email confirmations

2. **Storage Setup**
   - Go to Storage > Buckets
   - Verify buckets exist:
     - `avatars` (public, 5MB limit)
     - `documents` (private, 50MB limit)
     - `photos` (private, 10MB limit)
     - `attachments` (private, 25MB limit)

### Phase 3: Data Seeding

#### 3.1 Seed Test Data

```bash
# Run the seeding script
npm run seed
```

This script will create:

- **1 Shop**: CollisionOS Test Shop
- **6 Users**: Owner, Manager, Service Advisor, Estimator, Technician, Parts Manager
- **5 Customers**: Individual, Business, Insurance, VIP customers
- **5 Vehicles**: Honda Civic, Hyundai Tucson, VW Golf, Ford Focus, BMW X5
- **4 Vendors**: OEM, Aftermarket, Paint Supplier, Equipment Supplier
- **5 Parts**: Various automotive parts with pricing
- **5 Jobs**: Different statuses (estimate, in-progress, quality control, ready pickup, VIP)
- **2 Job Parts**: Parts assigned to jobs
- **4 Job Labor**: Labor operations for jobs
- **2 Job Updates**: Status and progress updates
- **2 Notifications**: Job assignments and low stock alerts

**Expected Output:**

```
🌱 Starting comprehensive test data seeding...
📊 Seeding shops...
✅ Shops seeded
👥 Seeding users...
✅ Users seeded
👤 Seeding customers...
✅ Customers seeded
🚗 Seeding vehicles...
✅ Vehicles seeded
🏢 Seeding vendors...
✅ Vendors seeded
🔧 Seeding parts...
✅ Parts seeded
🔨 Seeding jobs...
✅ Jobs seeded
🔧 Seeding job parts...
✅ Job parts seeded
👷 Seeding job labor...
✅ Job labor seeded
📝 Seeding job updates...
✅ Job updates seeded
🔔 Seeding notifications...
✅ Notifications seeded
✅ All test data seeded successfully!
📊 Generating seeding report...
📋 Seeding report generated:
   Total entities: 11
   Total records: 37
   Report saved to: seeding-report.json

🎉 Test data seeding completed successfully!
```

#### 3.2 Verify Seeding Results

```bash
# Check the seeding report
cat seeding-report.json

# Check the seeding log
tail -f seeding-log.txt
```

### Phase 4: Data Testing

#### 4.1 Test Seeded Data

```bash
# Run comprehensive data tests
npm run test-seeded
```

This script will test:

- **Data Existence**: All entities have correct record counts
- **Data Validation**: Field values match expected data
- **Relationships**: Foreign key relationships work correctly
- **Business Logic**: Pricing calculations, workflow progression
- **Data Integrity**: Foreign key constraints, referential integrity
- **Complex Queries**: Multi-table joins and aggregations
- **Performance**: Query response times under 1 second
- **Realtime**: Subscription functionality

**Expected Output:**

```
🧪 Starting comprehensive seeded data testing...
✅ Test passed: Shop Data Validation (45ms)
✅ Test passed: User Data Validation (67ms)
✅ Test passed: Customer Data Validation (52ms)
✅ Test passed: Vehicle Data Validation (48ms)
✅ Test passed: Vendor Data Validation (43ms)
✅ Test passed: Parts Data Validation (55ms)
✅ Test passed: Jobs Data Validation (61ms)
✅ Test passed: Job Parts Data Validation (39ms)
✅ Test passed: Job Labor Data Validation (42ms)
✅ Test passed: Job Updates Data Validation (38ms)
✅ Test passed: Notifications Data Validation (41ms)
✅ Test passed: Customer-Vehicle Relationships (89ms)
✅ Test passed: Job-Customer-Vehicle Relationships (76ms)
✅ Test passed: Parts-Vendor Relationships (71ms)
✅ Test passed: Job-Parts Relationships (68ms)
✅ Test passed: User Role Permissions (54ms)
✅ Test passed: Job Workflow Progression (58ms)
✅ Test passed: Financial Calculations (82ms)
✅ Test passed: Data Integrity (95ms)
✅ Test passed: Complex Queries (124ms)
✅ Test passed: Performance Queries (156ms)
✅ Test passed: Realtime Subscriptions (234ms)
✅ All seeded data tests completed!
📊 Generating test report...
📋 Test report generated:
   Total tests: 23
   Passed: 23
   Failed: 0
   Success rate: 100.00%
   Total duration: 1456ms
   Report saved to: test-report.json

🎉 All seeded data tests completed successfully!
```

#### 4.2 Review Test Results

```bash
# Check the test report
cat test-report.json

# Check the test log
tail -f test-results.txt
```

### Phase 5: Full System Validation

#### 5.1 Run Complete Validation Suite

```bash
# Run the full validation script
npm run validate
```

This script will test:

- **Database Structure**: Table existence, indexes, constraints
- **RLS Policies**: Row Level Security enforcement
- **Authentication**: User roles and permissions
- **Business Functions**: Custom database functions
- **Realtime**: Subscription and notification systems
- **Performance**: Query optimization and response times

#### 5.2 Export and Migrate Real Data (Optional)

```bash
# Export current data from existing database
npm run export

# Migrate data to Supabase
npm run migrate

# Run full validation again
npm run validate
```

### Phase 6: Application Integration

#### 6.1 Update Application Configuration

1. **Update Supabase Client**

   ```javascript
   // src/services/supabaseClient.js
   import { createClient } from '@supabase/supabase-js';

   const supabaseUrl = 'YOUR_SUPABASE_URL';
   const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

   export const supabase = createClient(supabaseUrl, supabaseAnonKey);
   ```

2. **Update Environment Variables**
   ```bash
   # .env
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

#### 6.2 Test Application Integration

```bash
# Start the application
cd ..
npm start

# Test login with seeded users:
# - owner@collisionos.com
# - manager@collisionos.com
# - advisor@collisionos.com
# - estimator@collisionos.com
# - tech@collisionos.com
# - parts@collisionos.com
```

### Phase 7: Monitoring and Verification

#### 7.1 Monitor System Performance

```bash
# Check Supabase dashboard for:
# - Database performance
# - API usage
# - Storage usage
# - Authentication events
# - Realtime connections
```

#### 7.2 Verify Business Operations

1. **Customer Management**
   - Create new customer
   - Add vehicle to customer
   - Update customer information

2. **Job Management**
   - Create new job
   - Assign parts to job
   - Add labor operations
   - Update job status

3. **Parts Management**
   - Add new parts
   - Update inventory
   - Create purchase orders

4. **User Management**
   - Test role-based access
   - Verify permissions
   - Test authentication flow

## Troubleshooting

### Common Issues and Solutions

#### 1. Setup Script Fails

```bash
# Check Supabase CLI installation
npx supabase --version

# Reinstall if needed
npm uninstall -g supabase
npm install -g supabase

# Check configuration
cat supabase-config.json
```

#### 2. Seeding Script Fails

```bash
# Check Supabase connection
node -e "
const { createClient } = require('@supabase/supabase-js');
const config = require('./supabase-config.json');
const client = createClient(config.supabaseUrl, config.serviceRoleKey);
client.from('shops').select('*').limit(1).then(console.log).catch(console.error);
"

# Check schema
node -e "
const { createClient } = require('@supabase/supabase-js');
const config = require('./supabase-config.json');
const client = createClient(config.supabaseUrl, config.serviceRoleKey);
client.rpc('get_schema_info').then(console.log).catch(console.error);
"
```

#### 3. Test Script Fails

```bash
# Check seeded data
node -e "
const { createClient } = require('@supabase/supabase-js');
const config = require('./supabase-config.json');
const client = createClient(config.supabaseUrl, config.serviceRoleKey);
Promise.all([
  client.from('shops').select('count'),
  client.from('users').select('count'),
  client.from('customers').select('count'),
  client.from('vehicles').select('count'),
  client.from('jobs').select('count')
]).then(results => console.log('Record counts:', results.map(r => r.data?.[0]?.count || 0)));
"
```

#### 4. Performance Issues

```bash
# Check query performance
node -e "
const { createClient } = require('@supabase/supabase-js');
const config = require('./supabase-config.json');
const client = createClient(config.supabaseUrl, config.serviceRoleKey);
const start = Date.now();
client.from('jobs').select('*').eq('shop_id', '550e8400-e29b-41d4-a716-446655440001').then(() => {
  console.log('Query time:', Date.now() - start, 'ms');
});
"
```

## Success Criteria

### Performance Targets

- ✅ All queries complete in < 100ms
- ✅ Complex joins complete in < 200ms
- ✅ Concurrent queries complete in < 1 second
- ✅ Realtime subscriptions connect in < 500ms

### Data Integrity

- ✅ All foreign key relationships valid
- ✅ No orphaned records
- ✅ Business logic calculations correct
- ✅ Data types and constraints enforced

### Functionality

- ✅ All CRUD operations work
- ✅ Role-based access control enforced
- ✅ Realtime updates function
- ✅ File uploads work
- ✅ Authentication flow complete

### Business Logic

- ✅ Job workflow progression valid
- ✅ Financial calculations accurate
- ✅ Inventory management functional
- ✅ Customer-vehicle relationships maintained
- ✅ Parts-vendor relationships intact

## Next Steps

### Immediate (Week 1)

1. Monitor system performance daily
2. Address any user-reported issues
3. Optimize slow queries
4. Fine-tune RLS policies
5. Update application documentation

### Short-term (Month 1)

1. Implement additional Supabase features
2. Optimize real-time subscriptions
3. Set up monitoring and alerting
4. Train team on Supabase management
5. Plan feature enhancements

### Long-term (Months 2-6)

1. Migrate to Edge Functions if applicable
2. Implement advanced security features
3. Optimize for global performance
4. Add new Supabase-specific features
5. Regular performance reviews

---

## Support and Resources

- **Documentation**: [Supabase Docs](https://supabase.com/docs)
- **Migration Guide**: `MIGRATION_GUIDE.md`
- **Setup Plan**: `SUPABASE_SETUP_AND_TESTING_PLAN.md`
- **Test Reports**: `test-report.json`, `seeding-report.json`
- **Logs**: `seeding-log.txt`, `test-results.txt`, `validation-log.txt`

For additional support, check the troubleshooting section or contact the development team.
