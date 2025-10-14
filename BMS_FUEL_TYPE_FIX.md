# BMS Upload Fuel Type Fix - Implementation Summary

## Problem Identified

BMS files were being uploaded successfully, but the workflow was failing at vehicle creation with the error:

```
Error creating vehicle: {
  code: '22P02',
  details: null,
  hint: null,
  message: 'invalid input value for enum fuel_type: "X"'
}
```

### Root Cause

The BMS parser was extracting raw fuel type codes from XML files (e.g., "X" for unknown) but not mapping them to the valid Supabase PostgreSQL enum values.

**Valid Supabase fuel_type enum values:**
- `gasoline`
- `diesel`
- `hybrid`
- `electric`
- `plug_in_hybrid`
- `hydrogen`
- `other`

**Raw BMS fuel type codes** (like "X", "G", "D", "E") were being passed directly to the database, causing enum constraint violations.

---

## Solution Implemented

### 1. Added Fuel Type Mapping Function

**File:** `server/services/bmsService.js` (lines 485-520)

```javascript
/**
 * Map raw fuel type from BMS to valid Supabase enum value
 * Valid values: 'gasoline', 'diesel', 'hybrid', 'electric', 'plug_in_hybrid', 'hydrogen', 'other'
 */
mapFuelType(rawFuelType) {
  if (!rawFuelType) return null;

  const fuelTypeUpper = String(rawFuelType).toUpperCase().trim();

  // Map common BMS fuel type codes to Supabase enum values
  const fuelTypeMap = {
    'G': 'gasoline',
    'GAS': 'gasoline',
    'GASOLINE': 'gasoline',
    'PETROL': 'gasoline',
    'D': 'diesel',
    'DIESEL': 'diesel',
    'E': 'electric',
    'ELECTRIC': 'electric',
    'EV': 'electric',
    'H': 'hybrid',
    'HYBRID': 'hybrid',
    'HEV': 'hybrid',
    'P': 'plug_in_hybrid',
    'PHEV': 'plug_in_hybrid',
    'PLUG-IN HYBRID': 'plug_in_hybrid',
    'PLUG IN HYBRID': 'plug_in_hybrid',
    'HYDROGEN': 'hydrogen',
    'FUEL CELL': 'hydrogen',
    'X': null, // Unknown - will be set to NULL in database
    'UNKNOWN': null,
    'N/A': null
  };

  return fuelTypeMap[fuelTypeUpper] || null; // Default to null if unknown
}
```

**Key Features:**
- Handles single-letter codes (G, D, E, H, P, X)
- Handles full text descriptions (GASOLINE, DIESEL, ELECTRIC, etc.)
- Returns `null` for unknown values (X, UNKNOWN, N/A) instead of failing
- Case-insensitive matching

### 2. Updated Vehicle Data Normalization

**File:** `server/services/bmsService.js` (line 554)

```javascript
normalizeVehicleData(vehicleData) {
  if (!vehicleData) return null;

  return {
    // ... other fields ...
    fuelType: this.mapFuelType(vehicleData.fuelType), // Map to valid enum value
    // ... other fields ...
  };
}
```

### 3. Updated Vehicle Creation with Admin Client

**File:** `server/services/bmsService.js` (line 1426)

```javascript
const mappedVehicleData = {
  // ... other fields ...
  fuel_type: this.mapFuelType(vehicleData.fuelType), // Use mapper for valid enum value
  // ... other fields ...
};
```

---

## Complete BMS Workflow (After Fix)

### Successful Flow

1. **File Upload** → `POST /api/import/bms`
2. **XML Parsing** → Extract customer, vehicle, claim, parts data
3. **Fuel Type Mapping** → Convert "X" → `null`, "G" → "gasoline", etc.
4. **Customer Creation** → Create or find existing customer in Supabase
5. **Vehicle Creation** → Create vehicle with valid fuel_type enum (no error!)
6. **Job Creation** → Create repair order/job
7. **Parts Creation** → Create all part lines with status='needed'
8. **API Response** → Return complete data to UI for refresh

### What Gets Created

```javascript
{
  success: true,
  importId: "uuid",
  message: "BMS file processed successfully",
  data: {
    createdCustomer: { id, first_name, last_name, ... },
    createdVehicle: { id, vin, year, make, model, fuel_type: "gasoline", ... },
    createdJob: { id, ro_number, status: "intake", ... },
    createdParts: [
      { id, part_description, part_status: "needed", ... },
      ...
    ],
    autoCreationSuccess: true,
    ecosystemComplete: true
  },
  jobId: "job-uuid"
}
```

---

## Testing Recommendations

### Test Case 1: Unknown Fuel Type (X)

**BMS XML:**
```xml
<Powertrain>
  <FuelType>X</FuelType>
</Powertrain>
```

**Expected Result:**
- Vehicle created successfully
- `fuel_type` = `NULL` in database
- No error thrown

### Test Case 2: Gasoline (G)

**BMS XML:**
```xml
<Powertrain>
  <FuelType>G</FuelType>
</Powertrain>
```

**Expected Result:**
- Vehicle created successfully
- `fuel_type` = `gasoline` in database

### Test Case 3: Electric (E or ELECTRIC)

**BMS XML:**
```xml
<Powertrain>
  <FuelType>ELECTRIC</FuelType>
</Powertrain>
```

**Expected Result:**
- Vehicle created successfully
- `fuel_type` = `electric` in database

### Test Case 4: Missing Fuel Type

**BMS XML:**
```xml
<Powertrain>
  <!-- No FuelType element -->
</Powertrain>
```

**Expected Result:**
- Vehicle created successfully
- `fuel_type` = `NULL` in database
- No error thrown

---

## Files Modified

1. **server/services/bmsService.js**
   - Added `mapFuelType()` method (lines 485-520)
   - Updated `normalizeVehicleData()` to use mapper (line 554)
   - Updated `findOrCreateVehicleWithAdmin()` to use mapper (line 1426)

---

## Impact Assessment

### Before Fix
- ❌ Vehicle creation failed with enum constraint error
- ❌ Job not created
- ❌ Parts not created
- ❌ Workflow incomplete
- ❌ UI does not refresh

### After Fix
- ✅ Vehicle created successfully (fuel_type mapped or NULL)
- ✅ Job created with proper foreign keys
- ✅ Parts created with status='needed'
- ✅ Complete workflow executes
- ✅ UI receives proper data for refresh

---

## Related Issues Fixed

This fix also resolves:

1. **Null handling** - Properly handles missing or unknown fuel types
2. **Case sensitivity** - Works with uppercase, lowercase, or mixed case
3. **Multiple formats** - Supports both single-letter codes and full text
4. **Database constraints** - Ensures only valid enum values reach the database

---

## Future Enhancements

If needed, the fuel type mapper can be extended to support:

1. **Additional BMS providers** (CCC ONE, Audatex specific codes)
2. **Regional variations** (Canadian vs US terminology)
3. **New fuel types** (if enum is extended with new values)
4. **Logging/analytics** (track frequency of unknown fuel types)

---

## Deployment Notes

- No database migration required (uses existing enum)
- No environment variable changes
- Backward compatible (existing data unaffected)
- Safe to deploy immediately

---

## Verification Steps

After deployment, verify:

1. Upload BMS file with fuel_type="X" → should succeed
2. Check database: `SELECT fuel_type FROM vehicles WHERE id = 'new-vehicle-id'` → should show NULL
3. Upload BMS file with fuel_type="G" → should succeed
4. Check database: fuel_type should show "gasoline"
5. Verify UI refreshes with new job data

---

**Status:** ✅ FIXED - Ready for testing and deployment
**Date:** 2025-10-13
**Priority:** High (blocking BMS import workflow)
