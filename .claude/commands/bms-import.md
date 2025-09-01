# Process BMS XML File

Process a BMS (Body Management System) XML file for import into CollisionOS.

## Task
Use the BMS Specialist agent to:
1. Parse the XML file at: $ARGUMENTS
2. Validate all required fields
3. Map data to CollisionOS schema
4. Create/update customer, vehicle, claim, and RO records
5. Generate part lines with initial status
6. Run validation tests
7. Report import results

## Success Criteria
- All data successfully imported
- No validation errors
- Database relationships maintained
- Parts workflow initialized
- Import logged for audit