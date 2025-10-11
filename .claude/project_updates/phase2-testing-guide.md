# Phase 2 Financial Integration - Testing Guide

**Date**: 2025-10-10
**Status**: Ready for Testing
**Prerequisites**: All backend/frontend components installed

---

## Setup Instructions

### 1. Environment Configuration

Update your `.env` file with real credentials:

```bash
# Stripe Test Keys (Get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_your_actual_test_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_test_key
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# QuickBooks Sandbox (Get from https://developer.intuit.com)
QUICKBOOKS_CLIENT_ID=your_actual_client_id
QUICKBOOKS_CLIENT_SECRET=your_actual_client_secret
QUICKBOOKS_ENVIRONMENT=sandbox
QUICKBOOKS_REDIRECT_URI=http://localhost:3001/api/quickbooks/callback
```

### 2. Database Migration

Run the financial tables migration:

```bash
# If using PostgreSQL/Supabase
psql -U postgres -d collisionos_dev -f server/database/migrations/004_create_financial_tables.sql

# Or use Sequelize sync (development only)
node -e "require('./server/database/models').sequelize.sync()"
```

### 3. Start the Application

```bash
# Terminal 1: Start backend server
npm run dev:server

# Terminal 2: Start frontend
npm run dev:ui

# Terminal 3: (Optional) Start Electron app
npm run dev:electron
```

---

## Test Workflow 1: Invoice → Payment (Stripe)

### Step 1: Create a Test Invoice

**UI Steps:**
1. Navigate to Financial → Invoice Builder
2. Click "New Invoice"
3. Fill in invoice details:
   - Invoice Type: Standard Invoice
   - Customer: Select existing customer
   - Invoice Date: Today
   - Payment Terms: Net 30

4. Add line items:
   - Item 1: Labor - Body Repair - 10 hrs @ $85/hr
   - Item 2: Parts - Front Bumper - 1 @ $450
   - Item 3: Sublet - Windshield Replacement - 1 @ $350

5. Set tax rate: 7.5%
6. Click "Save Draft"
7. Verify totals:
   - Subtotal: $1,650.00
   - Tax (7.5%): $123.75
   - Total: $1,773.75

**API Test:**
```bash
curl -X POST http://localhost:3001/api/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "customer_id": "uuid-here",
    "invoice_type": "standard",
    "invoice_date": "2025-10-10",
    "payment_terms": "net30",
    "subtotal": 1650.00,
    "tax_rate": 7.5,
    "labor_total": 850.00,
    "parts_total": 450.00,
    "sublet_total": 350.00
  }'
```

**Expected Result:**
- Invoice created with status "draft"
- Invoice number auto-generated (INV-2025-00001)
- Balance due = Total amount
- Invoice appears in dashboard "Recent Invoices"

---

### Step 2: Send Invoice to Customer

**UI Steps:**
1. Click "Save & Send" button
2. Verify invoice status changes to "sent"

**API Test:**
```bash
curl -X POST http://localhost:3001/api/invoices/{invoice_id}/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Result:**
- Invoice status: sent
- Email sent to customer (if email configured)
- Invoice appears in customer's portal

---

### Step 3: Record Stripe Payment

**UI Steps:**
1. In Invoice Builder, click "Record Payment"
2. Select payment type: Credit Card
3. Enter payment amount: $1,773.75
4. Enter Stripe test card:
   - Card Number: 4242 4242 4242 4242
   - Exp: 12/25
   - CVC: 123
   - ZIP: 12345

5. Check "Send receipt to customer"
6. Click "Record Payment"

**Stripe Test Cards:**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient Funds: 4000 0000 0000 9995
3D Secure: 4000 0027 6000 3184
```

**Expected Result:**
- Payment intent created in Stripe
- Payment confirmed and recorded
- Processing fee calculated: $51.84 (2.9% + $0.30)
- Net amount: $1,721.91
- Invoice balance updated to $0.00
- Invoice status changes to "paid"
- Payment appears in Payment History table
- Receipt email sent to customer

**API Flow:**
```bash
# 1. Create payment intent
curl -X POST http://localhost:3001/api/payments/stripe/intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 1773.75,
    "invoice_id": "invoice-uuid",
    "customer_id": "customer-uuid"
  }'

# 2. Confirm payment (after Stripe card confirmation)
curl -X POST http://localhost:3001/api/payments/stripe/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "payment_intent_id": "pi_xxx_from_stripe",
    "invoice_id": "invoice-uuid"
  }'
```

---

### Step 4: Verify Dashboard Metrics

**UI Steps:**
1. Navigate to Financial → Dashboard
2. Verify metrics updated:
   - Total Revenue: +$1,773.75
   - Net Profit increased
   - Outstanding decreased by $1,773.75
3. Verify payment appears in "Recent Payments" table

---

## Test Workflow 2: Expense Approval & Payment

### Step 1: Create Job-Level Expense

**UI Steps:**
1. Navigate to Financial → Expense Management
2. Click "New Expense"
3. Fill in expense details:
   - Expense Type: Job Cost
   - Category: Sublet
   - Description: Windshield replacement - SafeLite Auto Glass
   - Amount: $450.00
   - Tax Amount: $33.75
   - Vendor Name: SafeLite Auto Glass
   - Vendor Invoice #: SL-2025-001234
   - Expense Date: Today
   - Due Date: 15 days from today

4. Click "Create"

**API Test:**
```bash
curl -X POST http://localhost:3001/api/expenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "expense_type": "job_cost",
    "category": "sublet",
    "description": "Windshield replacement - SafeLite Auto Glass",
    "amount": 450.00,
    "tax_amount": 33.75,
    "vendor_name": "SafeLite Auto Glass",
    "vendor_invoice_number": "SL-2025-001234",
    "expense_date": "2025-10-10",
    "due_date": "2025-10-25"
  }'
```

**Expected Result:**
- Expense created with approval status: "pending"
- Expense number: EXP-2025-00001
- Total amount: $483.75
- Payment status: "unpaid"
- Appears in expense list

---

### Step 2: Approve Expense

**UI Steps:**
1. In expense list, click three-dot menu on expense
2. Select "Approve"
3. Confirm approval

**API Test:**
```bash
curl -X POST http://localhost:3001/api/expenses/{expense_id}/approve \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Result:**
- Approval status changes to "approved"
- Approved by field populated with current user
- Approval timestamp recorded
- Expense now eligible for payment

---

### Step 3: Record Expense Payment

**UI Steps:**
1. Click three-dot menu on approved expense
2. Select "Record Payment"
3. Enter payment details:
   - Payment Amount: $483.75
   - Payment Method: Check
   - Reference/Check Number: CHK-1234

4. Click "Record Payment"

**API Test:**
```bash
curl -X POST http://localhost:3001/api/expenses/{expense_id}/pay \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 483.75,
    "payment_method": "check",
    "payment_reference": "CHK-1234"
  }'
```

**Expected Result:**
- Payment status changes to "paid"
- Paid amount: $483.75
- Payment date recorded
- Expense appears in dashboard metrics
- Total expenses increased by $483.75

---

### Step 4: Test Rejection Flow

**UI Steps:**
1. Create another expense (follow Step 1)
2. Click three-dot menu → "Reject"
3. Enter rejection reason: "Duplicate entry - already billed"
4. Click "Reject"

**Expected Result:**
- Approval status: "rejected"
- Rejection reason stored
- Cannot record payment
- Can delete rejected expense

---

## Test Workflow 3: QuickBooks Integration

### Step 1: Connect to QuickBooks

**UI Steps:**
1. Navigate to Financial → Settings (create this page)
2. Click "Connect to QuickBooks"
3. Sign in to QuickBooks Sandbox account
4. Authorize CollisionOS
5. Redirected back to settings page

**API Test:**
```bash
# Get auth URL
curl -X GET http://localhost:3001/api/quickbooks/connect \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Returns: { "success": true, "authUrl": "https://appcenter.intuit.com/..." }
# Open authUrl in browser to complete OAuth flow
```

**Expected Result:**
- OAuth flow completes successfully
- QuickBooks connection stored in database
- Connection status shows as "connected"
- Company info displayed
- Last sync time: null

---

### Step 2: Check Connection Status

**API Test:**
```bash
curl -X GET http://localhost:3001/api/quickbooks/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Result:**
```json
{
  "success": true,
  "connected": true,
  "realmId": "123456789",
  "lastSync": null,
  "tokenExpired": false,
  "companyInfo": { ... }
}
```

---

### Step 3: Sync Invoice to QuickBooks

**UI Steps:**
1. Go to Invoice Builder
2. Open an invoice (from Workflow 1)
3. Click "Sync to QuickBooks" button
4. Wait for sync confirmation

**API Test:**
```bash
curl -X POST http://localhost:3001/api/quickbooks/sync/invoice/{invoice_id} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Result:**
- Invoice synced to QuickBooks
- QBO Invoice ID stored in database
- Sync log entry created with status "success"
- Toast notification: "Invoice synced successfully"
- Sync button changes to "Synced ✓"

---

### Step 4: Sync Payment to QuickBooks

**Prerequisites:** Invoice must be synced first

**UI Steps:**
1. In Payment History table
2. Click "Sync to QuickBooks" on a payment
3. Wait for confirmation

**API Test:**
```bash
curl -X POST http://localhost:3001/api/quickbooks/sync/payment/{payment_id} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Result:**
- Payment synced to QuickBooks
- QBO Payment ID stored
- Payment linked to QBO Invoice
- Sync log entry created
- Invoice marked as paid in QuickBooks

---

### Step 5: View Sync Log

**UI Steps:**
1. In QuickBooks settings page
2. View sync history table
3. Verify sync entries show:
   - Entity type (invoice/payment)
   - Sync status (success/failed)
   - QBO ID
   - Timestamp
   - Error message (if failed)

---

### Step 6: Test Sync Error Handling

**Test Scenario:** Sync payment without syncing invoice first

**API Test:**
```bash
# Try to sync payment for invoice that hasn't been synced
curl -X POST http://localhost:3001/api/quickbooks/sync/payment/{payment_id} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Result:**
- Error response: "Invoice must be synced to QuickBooks first"
- Sync log entry with status "failed"
- Error message stored in sync log
- User sees error toast notification

---

### Step 7: Disconnect from QuickBooks

**API Test:**
```bash
curl -X POST http://localhost:3001/api/quickbooks/disconnect \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Result:**
- Connection marked as inactive
- Status shows "disconnected"
- Sync buttons disabled
- Can reconnect anytime

---

## Test Workflow 4: Refund Processing

### Step 1: Process Full Refund

**UI Steps:**
1. In Payment History table
2. Click refund icon on a completed payment
3. Enter refund details:
   - Refund Amount: (full amount pre-filled)
   - Refund Reason: "Customer requested refund"

4. Click "Process Refund"

**API Test:**
```bash
curl -X POST http://localhost:3001/api/payments/{payment_id}/refund \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 1773.75,
    "reason": "Customer requested refund"
  }'
```

**Expected Result:**
- Refund processed in Stripe
- Payment status changes to "refunded"
- Invoice balance increases by refund amount
- Invoice status changes back to "partial" or "sent"
- Refund appears in Payment History
- Dashboard metrics updated

---

### Step 2: Process Partial Refund

**UI Steps:**
1. Click refund icon on a payment
2. Change refund amount to $500.00
3. Enter reason: "Partial credit for damages"
4. Click "Process Refund"

**Expected Result:**
- Partial refund processed
- Payment shows refunded amount
- Invoice balance increases by $500.00
- Invoice status: "partial"
- Can process additional refunds up to remaining amount

---

## Test Workflow 5: Dashboard Analytics

### Step 1: Test Date Range Filtering

**UI Steps:**
1. Navigate to Financial Dashboard
2. Test each date range:
   - Today
   - Last 7 Days
   - This Month
   - Last 30 Days
   - This Year

3. Verify metrics update correctly for each range

**Expected Behavior:**
- Metrics recalculate based on date range
- Tables show only records within range
- Summary totals match detailed data

---

### Step 2: Verify Overdue Alerts

**Setup:**
1. Create invoice with due date in the past
2. Create expense with due date in the past

**UI Steps:**
1. View dashboard
2. Verify overdue sections appear:
   - Overdue Invoices card (red alert)
   - Overdue Expenses card (red alert)
3. Click through to invoice/expense details

**Expected Result:**
- Overdue items highlighted
- Count shown in alert badge
- Sorted by due date (oldest first)
- Click navigates to detail page

---

### Step 3: Test Metric Calculations

**Verify:**
- Revenue = Sum of all paid invoices
- Expenses = Sum of all paid expenses
- Profit = Revenue - Expenses
- Outstanding = Sum of unpaid invoice balances

**Manual Check:**
1. Note dashboard metrics
2. Create new invoice and mark as paid
3. Refresh dashboard
4. Verify revenue increased by exact amount
5. Repeat for expenses

---

## Error Testing Scenarios

### 1. Payment Validation Errors

**Test Cases:**
```bash
# Test: Amount exceeds balance
POST /api/payments with amount > invoice.balanceDue
Expected: 400 error "Payment amount cannot exceed balance due"

# Test: Negative amount
POST /api/payments with amount = -100
Expected: 400 error "Payment amount must be greater than zero"

# Test: Missing required fields
POST /api/payments without payment_type
Expected: 400 error with validation errors
```

---

### 2. Expense Approval Errors

**Test Cases:**
```bash
# Test: Approve already approved expense
POST /api/expenses/{id}/approve on approved expense
Expected: 400 error "Expense cannot be approved"

# Test: Pay unapproved expense
POST /api/expenses/{id}/pay on pending expense
Expected: 400 error "Can only pay approved expenses"

# Test: Edit approved expense
PUT /api/expenses/{id} on approved expense
Expected: 400 error "Cannot update approved or rejected expenses"
```

---

### 3. Invoice Validation Errors

**Test Cases:**
```bash
# Test: Create invoice without line items
POST /api/invoices with empty line_items
Expected: 400 error "At least one line item is required"

# Test: Void invoice with payments
POST /api/invoices/{id}/void on paid invoice
Expected: 400 error "Cannot void invoice with payments"

# Test: Delete invoice with payments
DELETE /api/invoices/{id} on invoice with payments
Expected: 400 error "Cannot delete invoice with payments"
```

---

### 4. Stripe Integration Errors

**Test Cases:**
```bash
# Test: Invalid card number
Use card 4000 0000 0000 0002 (decline)
Expected: Payment fails with error "Your card was declined"

# Test: Insufficient funds
Use card 4000 0000 0000 9995
Expected: Payment fails with error "Your card has insufficient funds"

# Test: Expired card
Use exp date in the past
Expected: Payment fails with error "Your card has expired"
```

---

### 5. QuickBooks Sync Errors

**Test Cases:**
```bash
# Test: Sync without connection
POST /api/quickbooks/sync/invoice/{id} when not connected
Expected: 400 error "QuickBooks not connected"

# Test: Sync already synced invoice
POST /api/quickbooks/sync/invoice/{id} twice
Expected: Should update existing QBO invoice

# Test: Sync with expired token
Wait for token to expire, then sync
Expected: Automatic token refresh, then successful sync
```

---

## Performance Testing

### 1. Load Testing

**Test Large Dataset:**
```bash
# Create 100 invoices
for i in {1..100}; do
  curl -X POST http://localhost:3001/api/invoices \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{...invoice data...}"
done

# Test dashboard load time
# Expected: < 2 seconds

# Test invoice list pagination
# Expected: 20 items per page, < 1 second
```

---

### 2. Concurrent Operations

**Test Simultaneous Payments:**
```bash
# Open 5 browser tabs
# Record payments on same invoice simultaneously
# Expected: Proper locking, no double payments
```

---

## Accessibility Testing

### 1. Keyboard Navigation

**Test:**
- Tab through payment form
- Enter/Space to submit
- Escape to close dialogs
- Arrow keys in dropdowns

**Expected:**
- All interactive elements reachable
- Clear focus indicators
- Logical tab order

---

### 2. Screen Reader

**Test with NVDA/JAWS:**
- Form labels announced
- Error messages read aloud
- Button purposes clear
- Table headers associated

---

## Security Testing

### 1. Authentication

**Test:**
```bash
# Access API without token
curl http://localhost:3001/api/invoices

# Expected: 401 Unauthorized
```

---

### 2. Authorization

**Test:**
```bash
# Try to access another shop's data
curl -X GET http://localhost:3001/api/invoices/{other_shop_invoice_id} \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: 404 Not Found (shop isolation)
```

---

### 3. Input Sanitization

**Test:**
```bash
# SQL injection attempt
POST /api/invoices with malicious SQL in notes field

# XSS attempt
POST /api/invoices with <script> in description

# Expected: Input sanitized, no execution
```

---

## Regression Testing Checklist

After any code changes, verify:

- [ ] Can create invoice with line items
- [ ] Can record Stripe payment
- [ ] Can record cash/check payment
- [ ] Can process refund
- [ ] Invoice balance updates correctly
- [ ] Dashboard metrics accurate
- [ ] Can create expense
- [ ] Can approve/reject expense
- [ ] Can record expense payment
- [ ] QuickBooks OAuth flow works
- [ ] Can sync invoice to QBO
- [ ] Can sync payment to QBO
- [ ] Sync log tracks operations
- [ ] Error messages user-friendly
- [ ] Loading states shown
- [ ] Success notifications appear
- [ ] Date filters work correctly
- [ ] Overdue detection accurate

---

## Test Data Cleanup

After testing, clean up test data:

```sql
-- Delete test payments
DELETE FROM payments WHERE created_at > '2025-10-10';

-- Delete test invoices
DELETE FROM invoices WHERE created_at > '2025-10-10';

-- Delete test expenses
DELETE FROM expenses WHERE created_at > '2025-10-10';

-- Delete sync logs
DELETE FROM quickbooks_sync_log WHERE created_at > '2025-10-10';

-- Or truncate all (development only)
TRUNCATE TABLE payments, invoices, expenses, quickbooks_sync_log CASCADE;
```

---

## Bug Reporting Template

When you find a bug, report using this format:

```markdown
**Title:** Brief description

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. Navigate to...
2. Click...
3. Enter...

**Expected Result:**
What should happen

**Actual Result:**
What actually happens

**Environment:**
- Browser: Chrome 120
- OS: Windows 11
- Server: localhost:3001

**Screenshots:**
[Attach if applicable]

**Console Errors:**
[Copy from browser console]

**API Response:**
[Copy from network tab]
```

---

## Success Criteria

Phase 2 testing is complete when:

✅ All 5 test workflows pass without errors
✅ All error scenarios handled gracefully
✅ Dashboard metrics calculate correctly
✅ Stripe integration works end-to-end
✅ QuickBooks OAuth and sync functional
✅ No console errors during normal operation
✅ All UI components responsive
✅ Loading states and error messages clear
✅ Accessibility requirements met
✅ Security tests pass
✅ Performance acceptable (<2s load times)

---

**Ready to Begin Testing!** 🚀

Start with Workflow 1 and work through each scenario systematically.
