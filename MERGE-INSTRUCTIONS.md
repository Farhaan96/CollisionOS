# Quick Merge Instructions - 5 Feature Branches

## Prerequisites
```bash
# Ensure you're on main and up to date
git checkout main
git pull origin main

# Create backup
git branch backup-before-merge main
```

---

## Phase 1: Critical Bug Fix (DO THIS FIRST) ⚡

```bash
git merge --no-ff origin/claude/review-financial-section-011CUU59jhmpx2U7wm4FDHq1
git push origin main
```

**What it fixes:**
- Missing `Invoice.recordPayment()` method (runtime error)
- Labor cost calculation (was random numbers)
- Parts cost calculation (was random numbers)

**Test:**
```bash
npm run dev:server
# Try recording a payment in the UI
```

---

## Phase 2: Feature Additions (DO IN ORDER)

### 2a. BMS Auto-PO Feature
```bash
git merge --no-ff origin/claude/improve-bms-parts-upload-011CUU4fibWkuvMvrjta8dAn
git push origin main
```

**What it adds:**
- Automatic PO creation from BMS uploads
- Supplier mapping service

**Test:**
```bash
npm run dev:server
# Upload a BMS file, verify POs created automatically
```

---

### 2b. Jobs/RO Field Mappings
```bash
git merge --no-ff origin/claude/organize-jobs-bms-011CUU4qKH5xZ6juSUntkydZ
git push origin main
```

**What it improves:**
- Better field consistency
- Frontend-backend alignment

**Test:**
```bash
npm run dev:server
# Check RO detail page, verify fields display correctly
```

---

### 2c. Loaner Fleet Management
```bash
git merge --no-ff origin/claude/refactor-tools-section-011CUU5CDZ8fvhrMpQ21E8Wd
git push origin main
```

**What it adds:**
- Complete loaner fleet CRUD
- 14 new API endpoints
- Reservation system

**Test:**
```bash
npm run dev:server
# Go to Tools > Loaner Fleet, verify CRUD operations work
```

---

## Phase 3: CRM/Calendar (REQUIRES MANUAL WORK) ⚠️

```bash
git merge origin/claude/review-crm-calendar-011CUU4wDCsyDUfpCxNwi62F
```

**Expected:** Conflict in `package.json`

**Resolution Steps:**

1. **Open package.json in your editor**
   - Look for conflict markers: `<<<<<<<`, `=======`, `>>>>>>>`

2. **Keep both sets of dependencies**
   - Accept all dependencies from both branches
   - Remove conflict markers
   - Ensure valid JSON

3. **Regenerate package-lock.json**
   ```bash
   npm install
   ```

4. **Complete the merge**
   ```bash
   git add package.json package-lock.json
   git commit -m "Merge CRM and Calendar improvements - resolve package.json conflicts"
   git push origin main
   ```

5. **Test thoroughly**
   ```bash
   npm run dev:server
   # Test CRM customer tabs
   # Test calendar appointment booking
   ```

---

## Final Testing Checklist

After all merges complete:

```bash
# 1. Install all dependencies
npm install

# 2. Type check
npm run typecheck

# 3. Start server
npm run dev:server

# 4. Test each feature
# - [ ] Payment recording works (financial fix)
# - [ ] BMS upload creates POs automatically
# - [ ] RO fields display correctly
# - [ ] Loaner fleet CRUD works
# - [ ] CRM tabs load properly
# - [ ] Calendar appointments work

# 5. Check for errors
# Open browser console - should see no errors
```

---

## Rollback Plan (If Needed)

If something goes wrong:

```bash
# Reset to backup
git reset --hard backup-before-merge
git push origin main --force

# Or cherry-pick successful merges
git cherry-pick <commit-hash>
```

---

## Success Criteria

✅ All 5 branches merged
✅ Server starts without errors
✅ Payment recording works
✅ BMS auto-PO creation works
✅ Loaner fleet operations work
✅ CRM and calendar enhancements work
✅ No console errors in browser

---

## Time Estimate

- Phase 1: 2 minutes
- Phase 2: 6 minutes (2 min each)
- Phase 3: 10-15 minutes (conflict resolution)
- Testing: 20 minutes
- **Total: ~40 minutes**

---

## Need Help?

See detailed report: `branch-testing-report.md`
