# CollisionOS Workflow Completion - Orchestration Plan

**Date**: 2025-10-01
**Orchestrator**: Master Agent
**Objective**: Complete remaining collision repair workflows to achieve fully functional status

## Current State Analysis

### ✅ **What's Working**:
1. **Database**: 40 tables operational with SQLite
   - RepairOrderManagement model (complete)
   - AdvancedPartsManagement model (complete)
   - PurchaseOrderSystem model (complete)
   - All associations defined

2. **Backend APIs**: Partial implementation
   - Parts routes (/api/parts) - 70% complete
   - Purchase Orders (/api/pos) - 80% complete
   - Repair Orders (/api/repair-orders) - 50% complete

3. **Frontend**: UI components built
   - RODetailPage.jsx - Drag-drop UI ready
   - ROSearchPage.jsx - Search interface ready
   - roService.js - API service layer complete

### ❌ **What's Missing**:

1. **Backend API Endpoints** (Priority 1):
   - `GET /api/repair-orders/:id` - Get RO with all related data
   - `GET /api/repair-orders/:id/parts` - Get parts grouped by status
   - `PUT /api/parts/:id/status` - Update part workflow status
   - `GET /api/repair-orders/search` - Multi-field search (RO#, Claim#, VIN, Plate)
   - `GET /api/repair-orders/metrics` - Dashboard KPIs

2. **Parts Workflow Integration** (Priority 2):
   - Connect drag-drop UI to backend status updates
   - Real-time status bucket updates
   - Multi-select part operations

3. **Purchase Order Flow** (Priority 3):
   - PO creation from selected parts
   - PO receiving workflow
   - Quantity tracking and returns

4. **Integration Testing** (Priority 4):
   - End-to-end BMS → RO → Parts → PO workflow
   - Search functionality validation
   - Data integrity checks

## Execution Strategy

### **Phase 1: Backend API Completion** (Code Generator)
**Agent**: code-generator
**Time**: 30-45 minutes
**Tasks**:
1. Implement missing repair order API endpoints
2. Build parts workflow status update endpoints
3. Create search API with multi-field support
4. Add dashboard metrics endpoint

**Deliverables**:
- `C:\Users\farha\Desktop\CollisionOS\server\routes\repairOrders.js` (complete)
- `C:\Users\farha\Desktop\CollisionOS\server\routes\partsWorkflow.js` (complete)

### **Phase 2: Frontend Integration** (Code Generator)
**Agent**: code-generator
**Time**: 20-30 minutes
**Tasks**:
1. Update RODetailPage to use correct backend endpoints
2. Connect drag-drop workflow to API
3. Wire up search functionality
4. Implement PO creation dialog

**Deliverables**:
- Working drag-drop parts workflow
- Functional RO search
- PO creation from parts

### **Phase 3: Testing & Validation** (Test Runner)
**Agent**: test-runner
**Time**: 15-20 minutes
**Tasks**:
1. Test BMS import → RO creation
2. Test parts workflow (status changes)
3. Test PO creation and receiving
4. Validate search functionality

**Deliverables**:
- Test results report
- Issue identification

### **Phase 4: Bug Fixes & Polish** (Debugger)
**Agent**: debugger
**Time**: 15-20 minutes (as needed)
**Tasks**:
1. Fix any issues found in testing
2. Optimize database queries
3. Handle edge cases

## Delegation Plan

### **Task 1: Backend API Implementation**
```
Delegate to: code-generator
Priority: URGENT
Description: Build missing repair order and parts workflow API endpoints
Input Files:
- C:\Users\farha\Desktop\CollisionOS\server\routes\repairOrders.js
- C:\Users\farha\Desktop\CollisionOS\server\routes\partsWorkflow.js
- C:\Users\farha\Desktop\CollisionOS\server\database\models\index.js

Requirements:
1. GET /api/repair-orders/:id - Return RO with claims, customer, vehicle, parts
2. GET /api/repair-orders/:id/parts - Return parts grouped by status
3. PUT /api/parts/:id/status - Update part status with audit trail
4. GET /api/repair-orders/search?q= - Search by RO#, Claim#, VIN, Plate, Customer
5. GET /api/repair-orders/metrics - Return dashboard KPIs

Models to use:
- RepairOrderManagement
- AdvancedPartsManagement
- ClaimManagement
- Customer
- Vehicle
```

### **Task 2: Parts Workflow Connection**
```
Delegate to: code-generator
Priority: HIGH
Description: Connect drag-drop parts workflow to backend APIs
Input Files:
- C:\Users\farha\Desktop\CollisionOS\src\pages\RO\RODetailPage.jsx
- C:\Users\farha\Desktop\CollisionOS\src\services\roService.js

Requirements:
1. Ensure handleDragEnd calls correct API endpoint
2. Update parts state after successful API response
3. Show real-time toast notifications
4. Handle API errors gracefully
```

### **Task 3: Search Implementation**
```
Delegate to: code-generator
Priority: HIGH
Description: Connect RO search page to backend search API
Input Files:
- C:\Users\farha\Desktop\CollisionOS\src\pages\Search\ROSearchPage.jsx
- C:\Users\farha\Desktop\CollisionOS\src\components\Search\CollisionRepairSearchBar.js

Requirements:
1. Call GET /api/repair-orders/search with query
2. Display results in proper format
3. Handle navigation to RO detail
4. Show "no results" state
```

### **Task 4: Integration Testing**
```
Delegate to: test-runner
Priority: MEDIUM
Description: Run end-to-end workflow tests

Test Scenarios:
1. BMS Import → RO Creation → Parts Visible
2. Drag part from "Needed" to "Ordered" → Status updates
3. Search by RO# → Navigate to detail page
4. Create PO from selected parts → PO created successfully
5. Receive PO items → Parts status updates to "Received"
```

## Success Criteria

1. ✅ BMS file import creates RO with parts
2. ✅ Parts visible in RO detail page grouped by status
3. ✅ Drag-drop updates part status in database
4. ✅ Search works for RO#, Claim#, VIN, License Plate
5. ✅ PO can be created from selected parts
6. ✅ PO receiving updates part status
7. ✅ Dashboard metrics show correct KPIs

## Risk Mitigation

1. **API Connection Issues**: Test each endpoint independently
2. **Data Model Mismatches**: Verify Sequelize associations
3. **Performance Issues**: Add database indexes if needed
4. **Real-time Updates**: Implement optimistic UI updates

## Timeline

- **Phase 1**: 30-45 min (Backend APIs)
- **Phase 2**: 20-30 min (Frontend Integration)
- **Phase 3**: 15-20 min (Testing)
- **Phase 4**: 15-20 min (Bug Fixes)
- **Total**: 80-115 minutes (~1.5-2 hours)

## Next Steps

1. Start with code-generator for backend API completion
2. Test each endpoint as it's built
3. Move to frontend integration
4. Run comprehensive tests
5. Document any remaining gaps
