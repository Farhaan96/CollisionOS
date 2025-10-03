# CollisionOS - Quick Start Guide

## Database Setup Complete! ✅

Your local SQLite database is **fully configured and ready to use**.

---

## Status Summary

```
Database Location: C:\Users\farha\Desktop\CollisionOS\data\collisionos.db
Database Size:     496 KB
Total Tables:      40
Sample Data:       18 records
Status:           ✅ READY FOR USE
Storage:          100% LOCAL (No cloud, all on your PC)
```

---

## Quick Commands

### Database Management
```bash
npm run db:check      # Quick health check (recommended)
npm run db:report     # Comprehensive status report
npm run db:verify     # Detailed verification
npm run db:migrate    # Reset database (DESTRUCTIVE - drops all data!)
npm run db:seed       # Load sample data
```

### Application
```bash
npm start             # Start backend + frontend
npm run dev           # Start with Electron desktop app
npm run server        # Backend only
npm run client        # Frontend only
```

---

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@demoautobody.com | admin123 |
| Manager | manager@demoautobody.com | manager123 |
| Estimator | estimator@demoautobody.com | estimator123 |
| Technician | technician@demoautobody.com | technician123 |

---

## What's Configured

### ✅ Core System (READY)
- [x] Shop configuration (Demo Auto Body Shop, Toronto)
- [x] User accounts (4 roles: owner, manager, estimator, technician)
- [x] Vendor database (3 suppliers: OEM, Aftermarket, Recycled)
- [x] Parts catalog (3 sample parts)
- [x] Customer database (3 sample customers)
- [x] Vehicle records (2 sample vehicles)

### ⏳ Workflow Tables (EMPTY - Awaiting Data)
- [ ] Insurance claims (import BMS or create manually)
- [ ] Repair orders (linked to claims)
- [ ] Parts tracking (active parts orders)
- [ ] Purchase orders (linked to ROs)
- [ ] BMS imports (XML processing history)

---

## Database Tables (40 Total)

### Collision Repair Core
- `shops` - Shop configuration
- `users` - System users
- `customers` - Customer database
- `vehicles` - Vehicle records
- `claim_management` - Insurance claims **[INSURANCE SPECIFIC]**
- `repair_order_management` - Main RO tracking **[1:1 WITH CLAIMS]**
- `advanced_parts_management` - Parts lifecycle tracking
- `purchase_order_system` - PO management
- `bms_imports` - BMS XML import history **[INSURANCE SPECIFIC]**

### Supporting Tables (31 more)
See `DATABASE_SETUP_REPORT.md` for complete list.

---

## Key Differences from Generic Auto Shop

1. **Insurance-Centric**: 1:1 claim-to-repair-order relationship
2. **BMS Integration**: Automated XML parsing (CCC ONE, Mitchell, Audatex)
3. **Parts Workflow**: Status-based tracking (needed → sourcing → ordered → received → installed)
4. **Adjuster Tracking**: Insurance adjuster contact and approval workflows
5. **Deductible Handling**: Insurance vs customer payment split

---

## Next Steps

### 1. Verify Database
```bash
npm run db:check
```

Expected output:
```
✅ DATABASE STATUS: READY FOR USE
Login: admin@demoautobody.com / admin123
```

### 2. Start Application
```bash
npm start
```

This will start:
- Backend API server on http://localhost:3001
- Frontend React app on http://localhost:3000

### 3. Login
- Navigate to http://localhost:3000
- Login with: `admin@demoautobody.com` / `admin123`

### 4. Test Workflows

#### Option A: Import BMS File
1. Navigate to BMS Import page
2. Upload XML file (CCC ONE, Mitchell, Audatex format)
3. System will create:
   - Customer record
   - Vehicle record
   - Insurance claim
   - Repair order (1:1 with claim)
   - Parts list (status: needed)

#### Option B: Manual Entry
1. Create customer
2. Add vehicle (with VIN)
3. Create insurance claim
4. Create repair order (linked to claim)
5. Add parts to RO
6. Source parts from vendors
7. Create purchase orders
8. Track production workflow

---

## File Locations

```
CollisionOS/
├── data/
│   └── collisionos.db              ← YOUR DATABASE (496 KB)
├── server/
│   ├── database/
│   │   ├── connection.js           ← Database config
│   │   ├── migrate.js              ← Migration script
│   │   ├── seed.js                 ← Sample data loader
│   │   └── models/                 ← 40+ model definitions
│   └── index.js                    ← API server
├── scripts/
│   ├── quick-db-check.js           ← Health check script
│   ├── database-status-report.js   ← Comprehensive report
│   └── verify-database.js          ← Verification script
├── DATABASE_SETUP_REPORT.md        ← Complete technical documentation
└── QUICK_START.md                  ← This file
```

---

## Backup Recommendations

### Manual Backup
```bash
# Copy database file
cp data/collisionos.db data/backups/collisionos_backup_$(date +%Y%m%d).db
```

### Before Major Changes
```bash
# Backup before migration or major updates
cp data/collisionos.db data/collisionos_pre_migration.db
```

### Automated Daily Backup (Recommended)
Add to your system's scheduled tasks:
```bash
# Windows Task Scheduler or cron job
0 2 * * * cp C:\Users\farha\Desktop\CollisionOS\data\collisionos.db C:\Users\farha\Desktop\CollisionOS\data\backups\collisionos_$(date +\%Y\%m\%d).db
```

---

## Troubleshooting

### Database Connection Issues
```bash
# Check database exists
ls -l data/collisionos.db

# Verify database integrity
npm run db:check

# Reset database (DESTRUCTIVE)
npm run db:migrate && npm run db:seed
```

### Migration Issues
If you see "table already exists" errors:
```bash
# This is normal if database already exists
# Migration script uses force: true to drop/recreate tables
```

### Seeding Warnings
```
Warning: Unknown attributes (description, estimateDate, etc.)
```
**Not critical** - Sample data still loads successfully. This is a schema mismatch in the legacy Job model (being phased out).

---

## Sample Data Details

### Shop
- Name: Demo Auto Body Shop
- Location: Toronto, Ontario, Canada
- Labor Rate: $65/hour
- Paint Rate: $45/hour

### Vendors
1. **OEM Parts Direct** (VEND-0001) - OEM parts, 95.5% fill rate
2. **Aftermarket Plus** (VEND-0002) - Aftermarket, 88% fill rate
3. **LKQ Recycled Parts** (VEND-0003) - Used/recycled, 75% fill rate

### Customers
- Alice Johnson (individual)
- Bob Smith (individual)
- Carol Davis (ABC Company - business VIP)

### Vehicles
- 2020 Honda Civic (VIN: 1HGBH41JXMN109186)
- 2019 Toyota Camry (VIN: 2T1BURHE0JC123456)

---

## Getting Help

### Documentation
- `DATABASE_SETUP_REPORT.md` - Complete technical documentation
- `CLAUDE.md` - Project overview and architecture
- `README.md` - General project information

### Database Scripts
- `npm run db:check` - Quick health check
- `npm run db:report` - Full status report
- `npm run db:verify` - Detailed verification

### Issues
If you encounter problems:
1. Run `npm run db:check` to verify database status
2. Check `DATABASE_SETUP_REPORT.md` for detailed information
3. Review error messages in console

---

## Important Notes

⚠️ **Data is 100% Local**
- All data stored in SQLite file on your PC
- No cloud/Supabase dependencies
- Database file: `data/collisionos.db`

⚠️ **Migration is Destructive**
- `npm run db:migrate` drops ALL existing data
- Always backup before migration
- Safe for development, dangerous in production

✅ **Seeding is Safe**
- `npm run db:seed` uses findOrCreate pattern
- Won't duplicate data
- Can be run multiple times safely

---

## Ready to Start!

Your database is **fully configured**. You can now:

1. ✅ Start the application (`npm start`)
2. ✅ Login with admin credentials
3. 📥 Import BMS file or create manual repair orders
4. 🚗 Begin collision repair workflows

**Database Status:** ✅ OPERATIONAL
**Login:** admin@demoautobody.com / admin123
**Location:** `C:\Users\farha\Desktop\CollisionOS\data\collisionos.db`

---

*Report Generated: 2025-10-01*
*Database Version: 1.0*
*Total Tables: 40*
*Status: READY FOR USE*
