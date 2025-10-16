# BMS Estimate Version Tracking & Diff System - Design Document

**Feature**: Automatic version tracking and comparison for BMS estimate revisions
**Priority**: High - Critical for collision repair workflow
**Status**: Implementation in progress
**Date**: October 16, 2025

---

## 🎯 Business Problem

When an insurance company sends a **revised estimate** (supplement), shops need to quickly identify:
1. **What parts were added or removed?**
2. **What prices changed?**
3. **What labor hours were adjusted?**
4. **How much did the total change?**

**Current Pain Point**: When the same claim# uploads a new BMS file, we overwrite the old data and lose track of changes.

**Solution**: Track every version and show a clear diff highlighting what changed.

---

## 🏗️ System Architecture

### Database Tables (Migration: 006_estimate_versions_tracking.sql)

```
estimate_versions
├── id (UUID PK)
├── claim_id (FK → insurance_claims)
├── job_id (FK → jobs)
├── version_number (INTEGER) - 1, 2, 3...
├── estimate_number (TEXT)
├── revision_reason (TEXT) - 'initial', 'supplement', 'correction'
├── uploaded_at (TIMESTAMPTZ)
├── parts_total, labor_total, grand_total (DECIMAL)
├── bms_data (JSONB) - Full snapshot
└── diff_summary (JSONB) - Quick stats
```

```
estimate_line_item_changes
├── id (UUID PK)
├── version_id (FK → estimate_versions)
├── line_number (INTEGER)
├── item_type (TEXT) - 'part', 'labor', 'material'
├── description (TEXT)
├── change_type (TEXT) - 'added', 'removed', 'modified', 'unchanged'
├── previous_quantity, previous_price, previous_extended
├── current_quantity, current_price, current_extended
└── quantity_change, price_change, extended_change
```

### Service Layer (estimateDiffService.js)

**Key Functions**:
1. `compareBMSEstimates(currentBMS, previousBMS)` - Generates detailed diff
2. `saveEstimateVersion(claimId, jobId, bmsData, diff)` - Saves version + diff to database
3. `getEstimateVersionHistory(claimId)` - Get all versions for a claim
4. `getVersionChanges(versionId)` - Get granular line item changes

---

## 📊 Diff Comparison Logic

### Parts Comparison

**Match Key**: `${lineNumber}_${partNumber}_${description}`

**Categories**:
- **Added**: Part exists in current but NOT in previous
- **Removed**: Part exists in previous but NOT in current
- **Modified**: Part exists in both BUT quantity/price/extended changed
- **Unchanged**: Part exists in both with no changes

**Example Diff Output**:
```json
{
  "parts": {
    "added": [
      {
        "lineNumber": 10,
        "description": "Fender - Left Front",
        "partNumber": "FD123",
        "quantity": 1,
        "price": 450.00,
        "extended": 450.00
      }
    ],
    "removed": [],
    "modified": [
      {
        "lineNumber": 1,
        "description": "Bumper Cover",
        "partNumber": "BC789",
        "changes": {
          "price": {
            "from": 500.00,
            "to": 550.00,
            "change": +50.00
          }
        }
      }
    ]
  }
}
```

### Labor Comparison

**Match Key**: `${lineNumber}_${operation}`

**Tracks**: Hours changes (increase/decrease)

### Totals Comparison

**Tracks**:
- Parts total change ($500 → $750 = +$250)
- Labor total change (10 hours → 12 hours = +2 hours)
- Grand total change (with tax)
- Percent change ((750-500)/500 * 100 = 50%)

---

## 🔄 Integration with BMS Workflow

### Current BMS Upload Flow

```
1. Upload BMS file
2. Parse XML
3. Create/find customer
4. Create/find vehicle
5. Create insurance claim
6. Create repair order
7. Create parts records
```

### Enhanced Flow (WITH Version Tracking)

```
1. Upload BMS file
2. Parse XML
3. Create/find customer
4. Create/find vehicle
5. **CHECK: Is this claim# already in database?**
   ├── NO → Create v1 (initial estimate)
   └── YES → Get previous version, compare, create v2+ (supplement)
6. Create insurance claim (or update existing)
7. Create repair order
8. Create parts records
9. **Save estimate version + diff**
10. **Display diff to user (UI highlight)**
```

### Detection Logic

```javascript
// Check if claim exists
const existingClaim = await supabase
  .from('insurance_claims')
  .select('id')
  .eq('claim_number', claimNumber)
  .single();

if (existingClaim) {
  // This is a REVISION - get previous version
  const previousVersion = await getLatestVersion(existingClaim.id);
  const diff = compareBMSEstimates(currentBMS, previousVersion.bms_data);

  // Save as version 2, 3, etc.
  await saveEstimateVersion(
    existingClaim.id,
    jobId,
    currentBMS,
    diff,
    'supplement' // or 'correction'
  );
} else {
  // This is INITIAL estimate
  await saveEstimateVersion(
    newClaim.id,
    jobId,
    currentBMS,
    null, // no diff for v1
    'initial'
  );
}
```

---

## 🎨 UI/UX Design

### Version History Component

**Location**: RO Detail Page → "Estimate History" tab

**Display**:
```
┌─────────────────────────────────────────────────────────┐
│ Estimate Version History                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Version 3 - Supplement (Latest)              Oct 16     │
│ Total: $8,500 (+$1,200 from v2)              ↗️ 16.5%  │
│ • Added 3 parts (+$900)                                 │
│ • Modified 2 parts (+$300)                              │
│ • Labor hours +2.5 hours                                │
│ [View Detailed Changes]                                 │
│                                                          │
│ Version 2 - Supplement                         Oct 10   │
│ Total: $7,300 (+$500 from v1)                ↗️ 7.3%   │
│ [View Changes]                                          │
│                                                          │
│ Version 1 - Initial Estimate                   Oct 5    │
│ Total: $6,800                                           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Diff Detail View

**When user clicks "View Detailed Changes"**:

```
┌─────────────────────────────────────────────────────────┐
│ Changes from Version 2 → Version 3                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Parts Changes                                            │
│ ✅ ADDED (3 items, +$900)                               │
│   • Fender - Left Front (FD123) | Qty: 1 | $450        │
│   • Door Panel (DP456) | Qty: 1 | $300                 │
│   • Trim Clip Pack (TC789) | Qty: 1 | $150             │
│                                                          │
│ 📝 MODIFIED (2 items, +$300)                            │
│   • Bumper Cover (BC001)                                │
│     Price: $500 → $550 (+$50)                          │
│   • Hood (HD002)                                        │
│     Price: $800 → $1,050 (+$250)                       │
│                                                          │
│ ❌ REMOVED (0 items)                                    │
│   (None)                                                 │
│                                                          │
│ Labor Changes                                            │
│ 📝 MODIFIED (1 item, +2.5 hours)                        │
│   • Paint - Refinish                                     │
│     Hours: 10.0 → 12.5 (+2.5)                          │
│                                                          │
│ Summary                                                  │
│ Parts Total: $6,200 → $7,400 (+$1,200)                 │
│ Labor Total: $1,100 → $1,100 (no change)               │
│ Grand Total: $7,300 → $8,500 (+$1,200)                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Visual Highlights

**Color Coding**:
- 🟢 **Green** - Added items
- 🔵 **Blue** - Modified items (with increase arrows ↗️)
- 🔴 **Red** - Removed items
- ⚪ **Gray** - Unchanged items (collapsed by default)

**Badge Indicators**:
- `+$1,200` - Total change in green/red
- `↗️ 16.5%` - Percentage change
- `New` badge on added items
- `Changed` badge on modified items

---

## 🧪 Testing Scenario

### Test Case: Multiple BMS Uploads for Same Claim

**Step 1**: Upload initial BMS (Claim# ABC-123)
```
Result:
- Creates customer, vehicle, claim, RO, parts
- Saves as estimate_versions.version_number = 1
- revision_reason = 'initial'
- No diff (this is the first version)
```

**Step 2**: Upload revised BMS (Same Claim# ABC-123, different parts)
```
Detection:
- System finds existing claim ABC-123
- Fetches version 1 from estimate_versions

Comparison:
- Compares new BMS vs version 1 BMS data
- Generates diff: added parts, removed parts, modified parts

Result:
- Creates estimate_versions.version_number = 2
- revision_reason = 'supplement'
- Saves diff_summary JSON
- Saves granular changes in estimate_line_item_changes
```

**Step 3**: User views RO Detail
```
UI Display:
- Shows "2 versions available" badge
- Clicking opens version history panel
- Shows diff highlighting what changed from v1 → v2
```

---

## 📋 Implementation Checklist

### Phase 1: Database & Service Layer ✅
- [x] Create 006_estimate_versions_tracking.sql migration
- [x] Create estimateDiffService.js with compare logic
- [x] Implement compareBMSEstimates() function
- [x] Implement saveEstimateVersion() function
- [x] Implement getEstimateVersionHistory() function

### Phase 2: Integration with BMS Workflow ⏳
- [ ] Modify bmsService.js to detect existing claims
- [ ] Add version comparison before creating records
- [ ] Integrate estimateDiffService into BMS upload
- [ ] Add revision_reason detection (initial vs supplement)

### Phase 3: API Endpoints ⏳
- [ ] GET /api/estimates/:claimId/versions - List all versions
- [ ] GET /api/estimates/versions/:versionId - Get specific version
- [ ] GET /api/estimates/versions/:versionId/changes - Get detailed diff
- [ ] GET /api/estimates/versions/:versionId/compare/:otherVersionId - Compare any two versions

### Phase 4: Frontend UI Components ⏳
- [ ] EstimateVersionHistory.jsx - Version timeline component
- [ ] EstimateVersionDiff.jsx - Diff viewer component
- [ ] EstimateVersionBadge.jsx - "2 versions" indicator
- [ ] Integrate into RODetailPage.jsx

### Phase 5: Testing & Validation ⏳
- [ ] Run 006 migration on Supabase
- [ ] Test BMS upload with duplicate claim numbers
- [ ] Verify version creation and diff generation
- [ ] Test UI components with real data

---

## 🚀 Benefits

### For Shop Staff
1. **Instant Visibility**: See what changed without manual comparison
2. **Audit Trail**: Track every revision sent by insurance
3. **Communication**: Easily explain changes to customer ("Insurance approved 3 more parts")

### For Management
1. **Supplement Tracking**: Monitor how often insurers revise estimates
2. **Revenue Impact**: Track total estimate increases over time
3. **Dispute Resolution**: Historical record of all estimate changes

### For Insurance Coordination
1. **Transparency**: Clear record of what insurer requested/approved
2. **Compliance**: Audit trail for regulatory requirements
3. **Billing Accuracy**: Ensure final invoice matches latest approved estimate

---

## 💡 Future Enhancements

1. **Email Notifications**: Alert when new supplement received
2. **Auto-Approval Workflow**: Route supplements >$X to manager
3. **Comparison Reports**: Generate PDF showing before/after
4. **Analytics Dashboard**: Average # of supplements per claim, time between revisions
5. **Mitchell Integration**: Auto-detect supplement reason from BMS metadata

---

## 🎯 Success Metrics

- **Adoption**: % of shops using version tracking feature
- **Time Savings**: Reduced time to review supplement changes (5 min → 30 sec)
- **Accuracy**: Fewer billing disputes due to clear change tracking
- **User Satisfaction**: Positive feedback on ease of understanding changes

---

**Status**: ✅ Design Complete | ⏳ Implementation 40% Complete
**Next Step**: Integrate estimateDiffService into BMS upload workflow
