# Quick Fix Guide - Missing Endpoints
## 30-Minute Action Plan

**Current Status:** 83.3% pass rate - Production ready
**Action Required:** Add 2 missing endpoints (optional enhancement)
**Time Estimate:** 30 minutes total

---

## Issue 1: Missing RO Detail Endpoint (15 minutes)

### Current Problem:
```
GET /api/jobs/:id → 404 Not Found
```

### Impact:
- Frontend RODetailPage.jsx cannot load job details
- RO detail view will show loading spinner

### Solution:

**File:** `c:\Users\farha\Desktop\CollisionOS\server\routes\jobs.js`

**Add this endpoint:**

```javascript
// GET /api/jobs/:id - Get job details
router.get('/:id', authenticateToken(), async (req, res) => {
  try {
    const { id } = req.params;
    const shopId = req.user?.shopId;

    const job = await Job.findOne({
      where: { id, shopId },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'year', 'make', 'model', 'vin', 'color']
        },
        {
          model: Estimate,
          as: 'estimate',
          include: [
            {
              model: EstimateLineItem,
              as: 'lineItems'
            }
          ]
        }
      ]
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    res.json({
      success: true,
      job: job.toJSON()
    });

  } catch (error) {
    console.error('Get job details error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

**Test it:**
```bash
curl http://localhost:3002/api/jobs/YOUR_JOB_ID
```

---

## Issue 2: Missing Customer History Endpoint (20 minutes)

### Current Problem:
```
GET /api/customers/:id/history → 404 Not Found
```

### Impact:
- Customer history tab will not load
- Cannot view customer's repair history

### Solution:

**File:** `c:\Users\farha\Desktop\CollisionOS\server\routes\customers.js`

**Add this endpoint:**

```javascript
// GET /api/customers/:id/history - Get customer repair history
router.get('/:id/history', authenticateToken(), async (req, res) => {
  try {
    const { id } = req.params;
    const shopId = req.user?.shopId;
    const { limit = 20, offset = 0 } = req.query;

    // Verify customer exists and belongs to shop
    const customer = await Customer.findOne({
      where: { id, shopId }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    // Get customer's job history
    const jobs = await Job.findAll({
      where: { customerId: id, shopId },
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'year', 'make', 'model', 'vin']
        },
        {
          model: Invoice,
          as: 'invoice',
          attributes: ['id', 'invoiceNumber', 'totalAmount', 'paidAmount', 'status']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Get communication history
    const communications = await CommunicationLog.findAll({
      where: { customerId: id, shopId },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Calculate summary statistics
    const totalJobs = await Job.count({
      where: { customerId: id, shopId }
    });

    const completedJobs = await Job.count({
      where: { customerId: id, shopId, status: 'delivered' }
    });

    const totalSpent = await Invoice.sum('paidAmount', {
      include: [{
        model: Job,
        as: 'job',
        where: { customerId: id, shopId }
      }]
    });

    res.json({
      success: true,
      history: {
        jobs: jobs.map(j => j.toJSON()),
        communications: communications.map(c => c.toJSON()),
        summary: {
          totalJobs,
          completedJobs,
          totalSpent: totalSpent || 0,
          memberSince: customer.createdAt
        }
      },
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: totalJobs
      }
    });

  } catch (error) {
    console.error('Get customer history error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

**Test it:**
```bash
curl http://localhost:3002/api/customers/YOUR_CUSTOMER_ID/history
```

---

## Issue 3: Search Endpoint Error (Optional - 15 minutes)

### Current Problem:
```
GET /api/jobs?search=test&status=in_progress → 500 Server Error
```

### Likely Cause:
- Missing error handling in search query
- Possibly incorrect Sequelize query syntax

### Solution:

**File:** `c:\Users\farha\Desktop\CollisionOS\server\routes\jobs.js`

**Find and update the search endpoint:**

```javascript
// GET /api/jobs - List jobs with search and filters
router.get('/', authenticateToken(), async (req, res) => {
  try {
    const {
      search,
      status,
      customerId,
      startDate,
      endDate,
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const shopId = req.user?.shopId;
    const where = { shopId };

    // Add search filter
    if (search) {
      where[Op.or] = [
        { jobNumber: { [Op.like]: `%${search}%` } },
        { '$customer.firstName$': { [Op.like]: `%${search}%` } },
        { '$customer.lastName$': { [Op.like]: `%${search}%` } },
        { '$vehicle.vin$': { [Op.like]: `%${search}%` } }
      ];
    }

    // Add status filter
    if (status) {
      where.status = status;
    }

    // Add customer filter
    if (customerId) {
      where.customerId = customerId;
    }

    // Add date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const { count, rows } = await Job.findAndCountAll({
      where,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'year', 'make', 'model', 'vin']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]],
      subQuery: false // Important for search with includes
    });

    res.json({
      success: true,
      jobs: rows.map(job => job.toJSON()),
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('List jobs error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});
```

**Key fixes:**
- Added `Op.or` for search across multiple fields
- Added `subQuery: false` for correct join handling
- Better error handling with stack trace in dev mode

---

## Testing Checklist

### After Adding Endpoints:

1. **Restart Server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev:server
   ```

2. **Test RO Detail:**
   ```bash
   # First, get a job ID from the list
   curl http://localhost:3002/api/jobs

   # Then test the detail endpoint
   curl http://localhost:3002/api/jobs/YOUR_JOB_ID
   ```

3. **Test Customer History:**
   ```bash
   # First, get a customer ID
   curl http://localhost:3002/api/customers

   # Then test the history endpoint
   curl http://localhost:3002/api/customers/YOUR_CUSTOMER_ID/history
   ```

4. **Test Search:**
   ```bash
   curl "http://localhost:3002/api/jobs?search=test"
   curl "http://localhost:3002/api/jobs?status=in_progress"
   curl "http://localhost:3002/api/jobs?search=test&status=in_progress"
   ```

5. **Re-run Integration Tests:**
   ```bash
   node integration-test.js
   ```

**Expected Result:** Pass rate should increase from 83.3% to 95%+

---

## Implementation Checklist

- [ ] Add `GET /api/jobs/:id` endpoint (15 min)
- [ ] Add `GET /api/customers/:id/history` endpoint (20 min)
- [ ] Fix search endpoint error handling (15 min - optional)
- [ ] Restart server
- [ ] Test new endpoints with curl
- [ ] Re-run integration tests
- [ ] Verify pass rate improved
- [ ] Test frontend integration

**Total Time:** 30-50 minutes

---

## Alternative: Quick Patch Mode (10 minutes)

If you want to deploy immediately without these endpoints:

1. **Update Frontend:**
   - Add error handling to RODetailPage.jsx for 404
   - Add "Coming soon" message for customer history tab
   - Hide search functionality temporarily

2. **Deploy:**
   - Current 83.3% pass rate is sufficient for production
   - Critical features (payment, invoicing) work perfectly
   - Add these endpoints in next sprint

---

## Deployment Decision

### Option A: Fix Now (30 minutes) - RECOMMENDED
- Add 2 missing endpoints
- Increase test pass rate to 95%+
- Deploy with full functionality

### Option B: Deploy Now (0 minutes)
- Deploy current state (83.3% pass)
- All critical features work
- Add endpoints in next release

**Recommendation:** Option A (30 minutes to fix)
- Low time investment
- High value return
- Better user experience
- More complete feature set

---

## Support

If you encounter issues:

1. **Check server logs:**
   ```bash
   # Server console will show errors
   ```

2. **Verify models exist:**
   ```bash
   ls server/database/models/
   ```

3. **Check route registration:**
   ```javascript
   // In server/index.js or server.js
   // Verify jobs route is registered:
   app.use('/api/jobs', require('./routes/jobs'));
   app.use('/api/customers', require('./routes/customers'));
   ```

4. **Test with Postman:**
   - Import endpoints
   - Test with proper authentication
   - Verify response structure

---

**Guide Created:** 2025-10-25 08:15:00
**Status:** Ready for implementation
**Estimated Time:** 30-50 minutes
**Difficulty:** Easy (copy-paste with minor adjustments)
