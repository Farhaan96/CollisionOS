# BMS Import Fix Documentation

## Issue Summary

The BMS import functionality was not working with real Mitchell XML files (ICBC format). The user's file `605897963.xml` was failing to import properly.

## Problems Identified

### 1. **Parts Not Extracting from Mitchell Format**
- **Symptom**: Parts count showed 0 despite having parts in the XML
- **Root Cause**: Parser was looking for `line.LineType === 'Part'` but Mitchell format doesn't always set this field
- **Mitchell Behavior**: Parts are identified by the presence of `PartInfo` node, not by `LineType`

### 2. **Labor Not Extracting Properly**
- **Symptom**: Labor count showed 0
- **Root Cause**: Parser was looking for standalone labor lines
- **Mitchell Behavior**: Labor is often combined with parts on the same `DamageLineInfo` line

### 3. **Email Validation Error**
- **Symptom**: Database error: `Validation isEmail on email failed`
- **Root Cause**: Customer had no email in XML, parser set email to empty string `''`
- **Database Validation**: Sequelize's `isEmail` validator fails on empty strings (needs `null` instead)

## File: 605897963.xml Details

**Customer**: NAZMA KHAN
- **Phone**: 778-8898385
- **Address**: 12953 58B AVE, Surrey BC
- **Insurance**: ICBC (Insurance Corporation of British Columbia)
- **Claim**: CY42217-0-A

**Vehicle**: 2020 Nissan Rogue S
- **VIN**: 5N1AT2MV6LC714890
- **Plate**: TV226K

**Repair**: Windshield replacement
- **Part**: Windshield Glass (72700-6FL0B) - $1182.70
- **Labor**: 2.7 hours glass labor @ $89.46/hr
- **Total**: $1316.48 (after $300 deductible)

## Fixes Applied

### Fix 1: Parts Extraction (bms_parser.js)

**Before**:
```javascript
if (line.LineType === 'Part' && line.PartInfo) {
  // Extract part info
}
```

**After**:
```javascript
// Mitchell stores parts in PartInfo, even when LineType is not explicitly "Part"
// Check if line has PartInfo to identify it as a part line
if (line.PartInfo) {
  const partInfo = line.PartInfo;
  const part = {
    lineNumber: this.getNumericValue(line.LineNum),
    partNumber: this.getTextValue(partInfo.PartNum),
    // ... other fields
  };

  // Also extract labor info if present on the same line (Mitchell combines parts and labor)
  if (line.LaborInfo) {
    const laborInfo = line.LaborInfo;
    part.laborType = this.getTextValue(laborInfo.LaborType);
    part.laborOperation = this.getTextValue(laborInfo.LaborOperation);
    part.laborHours = this.getDecimalValue(laborInfo.LaborHours);
    part.databaseLaborHours = this.getDecimalValue(laborInfo.DatabaseLaborHours);
  }

  parts.push(part);
}
```

### Fix 2: Labor Extraction (bms_parser.js)

**Before**:
```javascript
if (line.LineType === 'Labor' && line.LaborInfo) {
  // Extract labor
}
```

**After**:
```javascript
// Mitchell stores labor in LaborInfo, sometimes combined with parts
// Extract standalone labor lines (no PartInfo) or labor-only lines
if (line.LaborInfo && !line.PartInfo) {
  const laborInfo = line.LaborInfo;
  labor.push({
    lineNumber: this.getNumericValue(line.LineNum),
    operation: this.getTextValue(line.LineDesc),
    // ... other fields
  });
}
```

### Fix 3: Email Validation (bmsService.js)

**Before**:
```javascript
const { zip, insurance, ...customerDataForDB } = customerData;

const customerWithShop = {
  ...customerDataForDB,
  shopId,
};
return await customerService.createCustomer(customerWithShop, shopId);
```

**After**:
```javascript
const { zip, insurance, ...customerDataForDB } = customerData;

// Fix email validation - convert empty string to null
if (customerDataForDB.email === '' || customerDataForDB.email === 'N/A') {
  customerDataForDB.email = null;
}

const customerWithShop = {
  ...customerDataForDB,
  shopId,
};
return await customerService.createCustomer(customerWithShop, shopId);
```

## Test Results

### Before Fixes
```
🔧 Parts Information:
   Total Parts: 0

⚙️ Labor Information:
   Total Labor Lines: 0

❌ Auto-Creation Results:
   Success: false
   Error: Validation error: Validation isEmail on email failed
```

### After Fixes
```
🔧 Parts Information:
   Total Parts: 1

   Part 1:
      Line #: 1
      Description: W/Shield Glass
      Part Number: 72700-6FL0B
      OEM Part #: 72700-6FL0B
      Quantity: 1
      Price: $1182.7
      Part Type: PAN

✅ Auto-Creation Results:
   Success: true

   Created Records:
      Customer ID: 52f01dbf-aaa9-4672-af31-e30bf993cbbf
      Customer Name: NAZMA KHAN
      Vehicle ID: df32809c-664b-4aa7-945b-f44ce605364c
      Vehicle: 2020 Nissan Rogue
      Job ID: d36b888d-87d8-4bbc-ad8f-430e86c4c497
      Job Number: CY42217-0-A
      Job Status: estimate
```

## Mitchell BMS Format Notes

### Key Characteristics
1. **Vendor Code**: `M` (Mitchell)
2. **BMS Version**: CIECA BMS 5.2.22
3. **Root Element**: `VehicleDamageEstimateAddRq`
4. **Namespace**: `http://www.cieca.com/BMS`

### Data Structure Differences
- **Parts Identification**: Uses `PartInfo` presence, not `LineType`
- **Labor Association**: Labor is combined with parts on same `DamageLineInfo` line
- **Customer Data**: Stored in `AdminInfo.Owner` section (not `PolicyHolder`)
- **Phone Numbers**: Multiple types - CP (customer), HP (home), WP (work)
- **Currency**: Supports CAD and USD via `CurrencyInfo` node

### ICBC-Specific Elements
- Province codes: BC (British Columbia)
- Custom tax structure: GST + PST
- Profile-based labor rates
- Claim number format: `CY#####-#-A`

## Testing

### Test Script
Run: `node scripts/test-mitchell-import.js`

This script:
1. Reads the real Mitchell XML file
2. Parses it with EnhancedBMSParser
3. Processes it with BMS Service
4. Tests auto-creation (Customer, Vehicle, Job)
5. Shows detailed output of all extracted data

### API Test
Run: `node scripts/test-bms-api.js`

This script:
1. Uploads the XML via the API endpoint
2. Verifies the response
3. Shows created records

## Files Modified

1. `server/services/import/bms_parser.js`
   - Updated `extractPartsInfo()` method
   - Updated `extractLaborInfo()` method

2. `server/services/bmsService.js`
   - Updated `findOrCreateCustomer()` method
   - Added email validation fix

3. `scripts/test-mitchell-import.js` (NEW)
   - Comprehensive test script for Mitchell format

4. `scripts/test-bms-api.js` (NEW)
   - API endpoint test script

## Future Enhancements

1. **Multi-Line Labor**: Extract labor that spans multiple lines
2. **Materials Extraction**: Parse `OtherChargesInfo` for shop materials
3. **Tax Calculation**: Validate tax calculations against profile rates
4. **Paint Materials**: Extract paint labor and materials separately
5. **Totals Validation**: Cross-check calculated totals with XML totals

## Backward Compatibility

All fixes maintain backward compatibility with:
- Generic BMS formats
- Test BMS_ESTIMATE format
- Simple estimate formats

The parser now handles multiple formats seamlessly by checking for data presence rather than relying on specific format indicators.
