# CollisionOS Supabase Migration Guide

This guide provides step-by-step instructions for migrating CollisionOS from the current Sequelize/PostgreSQL architecture to Supabase.

## Prerequisites

Before starting the migration, ensure you have:

- Node.js 16+ and npm 8+
- Access to the current CollisionOS database
- Supabase account with project creation permissions
- Administrator access to the current system
- Backup of the current database

## Migration Overview

The migration process consists of 5 main phases:

1. **Setup and Planning** (Day 1)
2. **Data Export** (Day 2)
3. **Supabase Configuration** (Day 3)
4. **Data Migration** (Day 4)
5. **Validation and Go-Live** (Day 5)

## Phase 1: Setup and Planning

### 1.1 Install Migration Tools

```bash
cd supabase-migration
npm install
```

### 1.2 Environment Setup

Create a backup of your current database:

```bash
# For PostgreSQL
pg_dump -h localhost -U your_username your_database > backup_$(date +%Y%m%d).sql

# For SQLite
cp path/to/collisionos.db backup_collisionos_$(date +%Y%m%d).db
```

### 1.3 Review Current System

Document your current:

- Number of shops, users, customers, jobs
- Current server specifications
- Peak usage times
- Critical business processes

## Phase 2: Data Export

### 2.1 Export Existing Data

Run the data export script to extract all data from your current database:

```bash
npm run export
```

This will:

- Connect to your existing database
- Export all tables to JSON and SQL formats
- Generate a complete data summary
- Create import-ready SQL scripts

### 2.2 Verify Export

Check the exported data in `data-export/exported-data/`:

- Review `export-summary.json` for record counts
- Spot-check a few JSON files for data accuracy
- Verify no sensitive data is exposed

## Phase 3: Supabase Configuration

### 3.1 Create Supabase Project

Run the setup script to create and configure your Supabase project:

```bash
npm run setup
```

The script will:

- Install Supabase CLI if needed
- Guide you through project creation
- Set up authentication configuration
- Apply database schema
- Configure Row Level Security
- Enable realtime subscriptions

### 3.2 Manual Configuration

Complete these steps in the Supabase Dashboard:

#### Authentication Settings

1. Go to Authentication > Settings
2. Set Site URL to your domain
3. Add redirect URLs for your app
4. Disable public signups (business app)
5. Enable email confirmations

#### Database Configuration

1. Review the applied schema in Database > Tables
2. Verify RLS policies are in place
3. Check database functions are created
4. Confirm indexes are optimized

#### Storage Setup

1. Create buckets for file uploads:
   - `avatars` (public)
   - `documents` (private)
   - `photos` (private)
   - `attachments` (private)

## Phase 4: Data Migration

### 4.1 Run Migration

Execute the data migration script:

```bash
npm run migrate
```

The script will:

- Validate Supabase connection
- Temporarily disable RLS for migration
- Migrate data in dependency order
- Handle user authentication setup
- Re-enable RLS
- Validate data integrity

### 4.2 Monitor Progress

Watch for:

- Migration success rates per table
- Any foreign key constraint violations
- User authentication setup issues
- Data transformation errors

### 4.3 Handle Issues

Common issues and solutions:

**User Email Conflicts:**

- Some users may not have valid emails
- Script creates placeholder emails
- Update real emails after migration

**Data Type Mismatches:**

- Review any transformation errors
- Manually fix problematic records
- Re-run migration for specific tables

## Phase 5: Validation and Testing

### 5.1 Run Validation Suite

Execute comprehensive validation tests:

```bash
npm run validate
```

This tests:

- Database structure integrity
- RLS policy effectiveness
- Authentication functionality
- Realtime subscriptions
- Business logic functions
- Query performance

### 5.2 Application Testing

Update your application to use Supabase:

#### Frontend Changes

1. Replace API calls with Supabase client
2. Update authentication hooks
3. Implement realtime subscriptions
4. Test all user workflows

#### Backend Changes

1. Replace Express routes with Edge Functions (if needed)
2. Update authentication middleware
3. Migrate any custom business logic
4. Update deployment scripts

### 5.3 User Acceptance Testing

Before go-live:

1. Test all user roles and permissions
2. Verify data accuracy across all modules
3. Test realtime updates and notifications
4. Performance test under load
5. Test backup and recovery procedures

## Phase 6: Go-Live Process

### 6.1 Pre-Go-Live Checklist

- [ ] All validation tests pass
- [ ] User acceptance testing complete
- [ ] Performance benchmarks met
- [ ] Backup procedures tested
- [ ] Rollback plan prepared
- [ ] User communication sent
- [ ] Support team briefed

### 6.2 Go-Live Steps

1. **Maintenance Window** (Recommended: 2-4 hours)
   - Put current system in maintenance mode
   - Run final data sync if needed
   - Switch DNS/application config to Supabase
   - Monitor system health

2. **Post Go-Live**
   - Monitor application performance
   - Check error logs
   - Verify real-time functionality
   - Confirm user authentication
   - Monitor database performance

### 6.3 Rollback Procedure (if needed)

If issues arise within 4 hours of go-live:

1. Switch back to original database
2. Restore from backup if necessary
3. Update DNS/application config
4. Notify users of temporary rollback
5. Investigate and fix issues
6. Plan re-migration

## Post-Migration Tasks

### Immediate (Week 1)

- Monitor system performance daily
- Address any user-reported issues
- Optimize slow queries
- Fine-tune RLS policies
- Update documentation

### Short-term (Month 1)

- Implement additional Supabase features
- Optimize real-time subscriptions
- Set up monitoring and alerting
- Train team on Supabase management
- Plan feature enhancements

### Long-term (Months 2-6)

- Migrate to Edge Functions if applicable
- Implement advanced security features
- Optimize for global performance
- Add new Supabase-specific features
- Regular performance reviews

## Troubleshooting

### Common Migration Issues

**Connection Timeouts**

```bash
# Increase timeout in migration scripts
# Check network connectivity to Supabase
```

**RLS Policy Errors**

```bash
# Verify user context is set correctly
# Check policy conditions
# Test with service role key
```

**Performance Issues**

```bash
# Check query execution plans
# Verify indexes are in place
# Monitor connection pool usage
```

**Authentication Problems**

```bash
# Verify JWT settings
# Check user metadata
# Confirm email validation
```

### Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Migration Scripts README](./README.md)
- [Validation Results](./validation-results.json)
- [Support Email](mailto:support@collisionos.com)

## Success Metrics

Track these metrics to ensure successful migration:

**Performance**

- Page load times < 2 seconds
- Query response times < 100ms
- Realtime latency < 50ms
- 99.9% uptime

**User Experience**

- Zero data loss
- All features working as expected
- User satisfaction maintained
- Support ticket volume normal

**Business Continuity**

- No disruption to daily operations
- All integrations functioning
- Reports generating correctly
- Backups completing successfully

---

## Need Help?

If you encounter issues during migration:

1. Check the logs in your migration directory
2. Review the validation results
3. Consult the troubleshooting section
4. Contact the development team
5. Use the rollback procedure if necessary

Remember: This migration is designed to improve performance, security, and developer experience while maintaining all existing functionality.
