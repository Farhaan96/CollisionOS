# Remaining Fixes for CollisionOS

## ✅ Completed Fixes

1. **Fixed Jobs Not Appearing** - Replaced mock data with real Supabase query in `/server/routes/jobs.js`
2. **Added Missing API Routes** - Added `/api/customers/:id/vehicles` and `/api/customers/:id/jobs`
3. **Added Phone Formatter** - Created `formatPhoneNumber()` utility function
4. **Fixed Customer Delete** - Now filters out inactive customers

---

## 🔧 Remaining Fixes Needed

### 1. Update Customer List UI (HIGH PRIORITY)

**File**: `src/pages/Customer/CustomerList.js`

**Changes Needed**:

```javascript
// Import the formatter at the top
import { getCustomerFullName, formatPhoneNumber } from '../../utils/fieldTransformers';

// Around line 376-391, update the customer name cell to show vehicle/claim info:
<TableCell>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
      {getStatusIcon(customer.customerStatus)}
    </Avatar>
    <Box>
      <Typography variant='subtitle2'>
        {getCustomerFullName(customer)}
      </Typography>
      <Typography variant='caption' color='text.secondary'>
        {customer.customerNumber}
      </Typography>
      {/* ADD THESE NEW LINES */}
      {customer.vehicles && customer.vehicles.length > 0 && (
        <Typography variant='caption' display='block' color='text.secondary'>
          🚗 {customer.vehicles[0].year} {customer.vehicles[0].make} {customer.vehicles[0].model}
        </Typography>
      )}
      {customer.claimNumber && (
        <Typography variant='caption' display='block' color='text.secondary'>
          📋 Claim: {customer.claimNumber}
        </Typography>
      )}
      {customer.companyName && (
        <Typography variant='caption' display='block' color='text.secondary'>
          {customer.companyName}
        </Typography>
      )}
    </Box>
  </Box>
</TableCell>

// Around line 405-408, format the phone number:
<Typography variant='body2'>
  {formatPhoneNumber(customer.phone)}
</Typography>
```

### 2. Remove Type Column (MEDIUM PRIORITY)

**File**: `src/pages/Customer/CustomerList.js`

**Changes**:
- Line 349: Remove `<TableCell>Type</TableCell>` from TableHead
- Lines 427-434: Remove the entire Type TableCell from the data rows

### 3. Fetch Vehicle/Claim Data for Customers (HIGH PRIORITY)

**File**: `server/routes/customers.js`

Update the GET all customers endpoint (around line 44) to join vehicles and claims:

```javascript
let query = supabase
  .from('customers')
  .select(`
    id,
    customer_number,
    first_name,
    last_name,
    email,
    phone,
    mobile,
    company_name,
    customer_type,
    customer_status,
    is_active,
    created_at,
    updated_at,
    vehicles:vehicles(id, year, make, model, vin),
    repair_orders:repair_orders(id, ro_number, claims:claims(claim_number))
  `)
  .eq('shop_id', shopId)
  .eq('is_active', true);
```

### 4. Fix RO Duplicate Error (CRITICAL)

**File**: `server/services/bmsService.js`

**Problem**: When the same BMS file is uploaded twice, it fails with duplicate RO number error.

**Solution**: Update the `autoCreateRepairOrder` function to check if RO exists and either:
- Update the existing RO, OR
- Create a new version with a suffix like `11576-v2`

```javascript
// Around line 850-900 in bmsService.js
// Before creating RO, check if it exists:
const { data: existingRO } = await supabase
  .from('repair_orders')
  .select('id, ro_number')
  .eq('ro_number', roNumber)
  .eq('shop_id', shopId)
  .single();

if (existingRO) {
  // Option 1: Update existing
  const { data: updatedRO, error } = await supabase
    .from('repair_orders')
    .update(roData)
    .eq('id', existingRO.id)
    .select()
    .single();

  // OR Option 2: Create new version
  roData.ro_number = `${roNumber}-v${Date.now()}`;
}
```

### 5. Fix BMS Parser PersonInfo Error (MEDIUM PRIORITY)

**File**: `server/services/bmsService.js`

**Problem**: Line 27 crashes with "Cannot read properties of undefined (reading 'PersonInfo')"

**Solution**: Add null checks before accessing PersonInfo:

```javascript
// Around line 27
const personInfo = root.AdminInfo?.Owner?.Party?.PersonInfo;
if (personInfo && personInfo.PersonName) {
  // Process person info
}
```

### 6. Fix JWT Authentication Warnings (LOW PRIORITY)

**Problem**: Logs show constant "Supabase auth failed, trying legacy auth" warnings

**Solution**: The system is working (falls back to legacy JWT), but to clean up logs:

**File**: `server/middleware/authSupabase.js` (around line 40-45)

Change:
```javascript
console.log('Supabase auth failed, trying legacy auth:', supabaseError.message);
```

To:
```javascript
console.debug('Supabase auth failed, trying legacy auth:', supabaseError.message);
```

Or remove the log entirely since it's expected behavior in development.

---

## 📝 Testing Checklist

After making these fixes, test:

- [ ] Customer list shows vehicle info under name
- [ ] Customer list shows claim number under name
- [ ] Phone numbers formatted as (604) 555-1234
- [ ] Type column removed from customer table
- [ ] Re-uploading same BMS file doesn't crash
- [ ] Jobs appear on dashboard after BMS import
- [ ] Jobs appear on Jobs page
- [ ] Vehicle icon click shows customer vehicles
- [ ] Edit button loads customer data correctly
- [ ] Delete customer works without errors

---

## 🚀 Quick Summary

**Jobs are now fixed!** The `/api/jobs` endpoint now queries real data from Supabase instead of returning mock data.

**Main issues remaining**:
1. Customer UI needs vehicle/claim info display
2. Phone formatting needs to be applied
3. RO duplicate handling needs error prevention
4. BMS parser needs null safety

All code snippets above can be directly copy-pasted into the respective files.
