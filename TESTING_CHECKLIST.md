# Phase 1 Testing Checklist - Interactive Guide

## 🚀 Application Starting

The server and client are starting in separate windows. Please wait 10-15 seconds for them to fully initialize.

---

## ✅ Step-by-Step Testing Guide

### Step 1: Access the Application
1. Open your browser and go to: **http://localhost:3000**
2. If you see a login page, proceed to Step 2
3. If you see errors, check the server console windows

### Step 2: Login
- **Email**: `admin@demoautobody.com`
- **Password**: `admin123`

---

## 🧪 Feature Testing

### Test 1: Production Board ✅

**Navigate to**: `/production-board` or click "Production Board" in the menu

**What to test:**
1. ✅ Verify jobs are displayed in columns (8 stages)
2. ✅ **Drag a job card** from one column to another
3. ✅ Verify the job moves to the new column
4. ✅ Refresh the page - status should persist
5. ✅ Check browser console for errors (F12)

**Expected Result:**
- Jobs can be dragged between all stages
- Status updates immediately
- No console errors

**If issues:**
- Check server console for API errors
- Verify jobs exist in database
- Check network tab in browser DevTools

---

### Test 2: Time Clock System ✅

**Navigate to**: `/time-clock` or click "Time Clock" in the menu

**What to test:**
1. ✅ Click "Clock In" button
   - Verify timer starts counting
   - Status shows "Clocked In"
2. ✅ Click "Clock In on Job"
   - Select a job from dropdown
   - Select labor type
   - Verify clock in succeeds
3. ✅ Click "Start Break"
   - Status changes to "On Break"
4. ✅ Click "End Break"
   - Status returns to "Clocked In"
5. ✅ Click "Clock Out"
   - Add optional notes
   - Verify clock out succeeds
   - Verify shift summary updates

**Expected Result:**
- All time clock operations work correctly
- Shift summary shows accurate hours
- Job-specific clock-in associates time with RO

**If issues:**
- Check if user has technician role
- Verify API endpoints are responding
- Check browser console for errors

---

### Test 3: Invoice Generation ✅

**Navigate to**: `/invoices` or click "Invoices" in the menu

**What to test:**
1. ✅ Click "Generate Invoice" button
2. ✅ Select a completed repair order
   - Status must be: `ready_pickup`, `delivered`, or `complete`
   - If no completed ROs, update a job status first
3. ✅ Select payment terms (e.g., "Net 30 Days")
4. ✅ Click "Generate Invoice"
5. ✅ Verify invoice appears in list
6. ✅ Click download icon (📥) to download PDF
7. ✅ Open PDF and verify it contains correct information

**Expected Result:**
- Invoice generates successfully
- Invoice number format: `INV-YYYY-#####`
- PDF downloads and opens correctly
- Amounts are calculated correctly

**If issues:**
- Ensure job status is complete
- Check if invoice already exists for that RO
- Verify PDF generation endpoint is working

---

### Test 4: Payment Processing ✅

**Navigate to**: `/invoices` → Click on an invoice → Click "Pay" or navigate to `/invoices/:invoiceId/payment`

**What to test:**

**A. Cash Payment:**
1. ✅ Select "Cash" payment type
2. ✅ Enter payment amount (less than or equal to balance)
3. ✅ Add notes (optional)
4. ✅ Click "Record Payment"
5. ✅ Verify payment recorded
6. ✅ Verify invoice balance updates

**B. Check Payment:**
1. ✅ Select "Check" payment type
2. ✅ Enter check number
3. ✅ Enter payment amount
4. ✅ Record payment
5. ✅ Verify payment appears in history

**C. Credit Card Payment** (if Stripe configured):
1. ✅ Select "Credit Card" payment type
2. ✅ Enter test card: `4242 4242 4242 4242`
3. ✅ Enter any future expiry date
4. ✅ Enter any CVC
5. ✅ Complete payment
6. ✅ Verify payment processed

**Expected Result:**
- All payment types work correctly
- Invoice balance updates automatically
- Payment history is tracked

**If issues:**
- Stripe requires API keys (see configuration)
- Check payment API endpoints
- Verify invoice exists

---

### Test 5: QuickBooks Integration ✅

**Navigate to**: `/quickbooks` or click "QuickBooks" in the menu

**What to test:**
1. ✅ Verify shows "Not Connected" initially
2. ✅ Click "Connect QuickBooks"
   - Should redirect to QuickBooks OAuth page
   - If you have QuickBooks account, authorize
   - If not, just verify redirect works
3. ✅ After connection (if authorized):
   - Verify shows "Connected"
   - Click "Sync Invoices"
   - Verify sync completes
   - Verify last sync time updates
4. ✅ Click "Disconnect"
   - Confirm disconnection
   - Verify status returns to "Not Connected"

**Expected Result:**
- OAuth flow initiates correctly
- Connection status displays accurately
- Invoice sync functionality works (if connected)

**If issues:**
- QuickBooks requires OAuth app setup
- Check environment variables
- Verify QuickBooks API endpoints

---

### Test 6: Job Stage History Tracking ✅

**Navigate to**: `/production-board`

**What to test:**
1. ✅ Drag a job through multiple stages:
   - Estimating → Scheduled → Disassembly → In Repair
2. ✅ Check database (or API) for history entries:
   - Each transition should create a history entry
   - History includes: fromStage, toStage, movementType, duration

**Expected Result:**
- Stage history is created for each transition
- History entries are accurate and complete

**How to verify:**
- Check `job_stage_history` table in database
- Or add API endpoint to view history (future enhancement)

---

## 🔍 API Testing (Optional)

You can also test APIs directly using curl or Postman:

### Production Board:
```bash
# Get production board jobs
curl http://localhost:3002/api/production/board \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

### Time Clock:
```bash
# Get current status
curl http://localhost:3002/api/timeclock/technician/USER_ID/current \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

### Invoices:
```bash
# List invoices
curl http://localhost:3002/api/invoices \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

---

## ✅ Testing Checklist

### Production Board:
- [ ] Jobs load correctly
- [ ] Drag-and-drop works
- [ ] Status updates persist after refresh
- [ ] No console errors

### Time Clock:
- [ ] Clock in/out works
- [ ] Job-specific clock-in works
- [ ] Break management works
- [ ] Shift summary displays correctly

### Invoice Generation:
- [ ] Invoice generates from completed RO
- [ ] PDF downloads successfully
- [ ] Invoice amounts are correct
- [ ] Invoice appears in list

### Payment Processing:
- [ ] Cash payment records correctly
- [ ] Check payment records correctly
- [ ] Credit card payment works (if Stripe configured)
- [ ] Invoice balance updates

### QuickBooks:
- [ ] OAuth connection flow works
- [ ] Status displays correctly
- [ ] Invoice sync works (if connected)
- [ ] Disconnect works

### Job Stage History:
- [ ] History entries created on status change
- [ ] History includes correct data

---

## 🐛 Troubleshooting

### Server Not Starting:
- Check if port 3002 is available
- Check for database connection errors
- Verify `.env.local` file exists

### Frontend Not Loading:
- Check if port 3000 is available
- Verify React app compiles without errors
- Check browser console for errors

### API Errors:
- Check server console for error messages
- Verify authentication is working
- Check database connection

### Features Not Working:
- Verify routes are registered in `server/index.js`
- Check browser network tab for failed requests
- Verify database tables exist

---

## 📊 Test Results

After completing all tests, document your results:

**Date**: _______________
**Tester**: _______________

**Production Board**: ✅ / ❌
**Time Clock**: ✅ / ❌
**Invoice Generation**: ✅ / ❌
**Payment Processing**: ✅ / ❌
**QuickBooks**: ✅ / ❌
**Job Stage History**: ✅ / ❌

**Issues Found**:
- 
- 
- 

**Notes**:
- 
- 

---

## 🎉 Next Steps

Once testing is complete:
1. Document any issues found
2. Fix critical bugs
3. Proceed to Phase 2 (Mobile Apps + Customer Communication)
4. Or continue with Phase 1 refinements

---

**Happy Testing! 🚀**

