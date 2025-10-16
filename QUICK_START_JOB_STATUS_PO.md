# Quick Start Guide - Job Status & Purchase Orders

## Setup (5 minutes)

### 1. Run Database Migration
```bash
# If using Supabase
supabase migration up

# If using local PostgreSQL
psql -d collisionos -f server/database/migrations/20251015_create_job_status_history.sql

# Or via npm script (if configured)
npm run db:migrate
```

### 2. Add Routes to Your Router
```javascript
// src/App.jsx or your router file
import POListPage from './pages/PurchaseOrder/POListPage';
import PODetailPage from './pages/PurchaseOrder/PODetailPage';

// Add routes
<Route path="/purchase-orders" element={<POListPage />} />
<Route path="/purchase-orders/:poId" element={<PODetailPage />} />
```

### 3. Test the Endpoints
```bash
# Start your development server
npm run dev

# Test job status update (requires authentication)
curl -X PATCH http://localhost:3000/api/jobs/JOB123/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "in_production", "notes": "Starting body work"}'

# Test get job history
curl http://localhost:3000/api/jobs/JOB123/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Usage Examples

### 1. Add Job Status Selector to Job Detail Page

```jsx
import JobStatusSelector from '../../components/Jobs/JobStatusSelector';

function JobDetailPage() {
  const [job, setJob] = useState(null);

  return (
    <Box>
      <Typography variant="h4">{job.jobNumber}</Typography>

      {/* Add the status selector */}
      <JobStatusSelector
        jobId={job.id}
        currentStatus={job.status}
        onStatusChanged={(updatedJob) => {
          setJob(updatedJob); // Update local state
          // Or reload the full job data
          // loadJob();
        }}
      />
    </Box>
  );
}
```

### 2. Create PO from Parts

```jsx
import POCreationDialog from '../../components/PurchaseOrder/POCreationDialog';

function PartsWorkflow() {
  const [selectedParts, setSelectedParts] = useState([]);
  const [poDialogOpen, setPODialogOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setPODialogOpen(true)}
        disabled={selectedParts.length === 0}
      >
        Create Purchase Order
      </Button>

      <POCreationDialog
        open={poDialogOpen}
        onClose={() => setPODialogOpen(false)}
        selectedParts={selectedParts}
        roNumber={ro.ro_number}
        shopId={ro.shop_id}
        onPOCreated={(po) => {
          toast.success(`PO ${po.po_number} created!`);
          // Refresh parts list
          loadParts();
        }}
      />
    </>
  );
}
```

### 3. Navigate to PO List/Detail

```jsx
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();

  return (
    <>
      {/* View all POs */}
      <Button onClick={() => navigate('/purchase-orders')}>
        View Purchase Orders
      </Button>

      {/* View specific PO */}
      <Button onClick={() => navigate(`/purchase-orders/${poId}`)}>
        View PO Details
      </Button>

      {/* View PO and open receiving tab */}
      <Button onClick={() => navigate(`/purchase-orders/${poId}?tab=receive`)}>
        Receive Parts
      </Button>
    </>
  );
}
```

---

## API Reference

### Job Status

**Update Status:**
```javascript
import { jobService } from '../services/jobService';

const result = await jobService.updateStatus(
  'job-123',           // jobId
  'in_production',     // newStatus
  'Starting repairs'   // notes (optional)
);

if (result.success) {
  console.log('Updated:', result.job);
} else {
  console.error('Error:', result.error);
}
```

**Get History:**
```javascript
const history = await jobService.getJobHistory('job-123');

if (history.success) {
  history.history.forEach(entry => {
    console.log(`${entry.previousStatus} → ${entry.newStatus}`);
    console.log(`Changed by: ${entry.changedBy} at ${entry.changedAt}`);
    console.log(`Notes: ${entry.notes}`);
  });
}
```

### Purchase Orders

**Create PO:**
```javascript
import poService from '../services/poService';

const result = await poService.createPOFromParts({
  part_line_ids: ['part-1', 'part-2', 'part-3'],
  vendor_id: 'vendor-456',
  ro_number: 'RO-2024-001',
  delivery_date: new Date().toISOString(),
  notes: 'Rush order - needed for Monday',
  expedite: true,
  shop_id: 'shop-789'
});
```

**List POs:**
```javascript
const result = await poService.getPurchaseOrders({
  page: 1,
  limit: 20,
  status: 'partial',       // Optional filter
  vendor_id: 'vendor-456', // Optional filter
  ro_number: 'RO-2024-001' // Optional filter
});

console.log('POs:', result.data);
console.log('Total:', result.pagination.total);
```

**Get PO Details:**
```javascript
const result = await poService.getPurchaseOrder('po-123');

console.log('PO:', result.data);
console.log('Parts:', result.parts);
console.log('Vendor:', result.vendor);
console.log('History:', result.receiving_history);
```

**Receive Parts:**
```javascript
const result = await poService.receivePOParts('po-123', {
  received_parts: [
    {
      part_line_id: 'part-1',
      quantity_received: 3,
      condition: 'good',
      notes: ''
    },
    {
      part_line_id: 'part-2',
      quantity_received: 1,
      condition: 'damaged',
      notes: 'Box crushed in shipping'
    }
  ],
  delivery_note: 'Delivered by UPS',
  received_by: 'user-123'
});
```

---

## Status Workflows

### Valid Job Status Transitions

```
estimate → intake, estimating, cancelled
estimating → awaiting_approval, cancelled
awaiting_approval → approved, rejected, cancelled
approved → awaiting_parts, in_production, cancelled
intake → estimating, awaiting_parts, in_production, cancelled
awaiting_parts → in_production, cancelled
in_production → body_structure, paint_prep, paint_booth, reassembly, quality_check, ready, cancelled
body_structure → paint_prep, quality_check, cancelled
paint_prep → paint_booth, quality_check, cancelled
paint_booth → reassembly, quality_check, cancelled
reassembly → quality_check, ready, cancelled
quality_check → ready, in_production, cancelled
ready → delivered
delivered → closed
cancelled → (none)
closed → (none)
```

### PO Status Flow

```
draft → sent → acknowledged → partial → fully_received → closed
       └──────────────────────────────→ cancelled
```

---

## Common Issues & Solutions

### Issue: "Invalid transition" error

**Solution:** Check the valid transitions for the current status. You can only move to allowed next statuses.

```javascript
// Example: Can't go from 'estimate' to 'delivered' directly
// Must follow: estimate → intake → ... → delivered

// Correct approach:
await jobService.updateStatus(jobId, 'intake');        // ✅
await jobService.updateStatus(jobId, 'in_production'); // ✅
// ... continue through workflow
```

### Issue: PO creation fails with "parts missing IDs"

**Solution:** Ensure your parts objects have an `id` field:

```javascript
const parts = [
  {
    id: 'part-123',        // ✅ Required!
    part_number: 'ABC123',
    description: 'Front bumper',
    quantity: 1,
    unit_cost: 450.00
  }
];
```

### Issue: Receiving dialog doesn't show parts

**Solution:** Only parts with status 'ordered' or 'backordered' appear. Check part statuses.

### Issue: "Job not found" error

**Solution:** Verify:
1. Job ID is correct
2. User has access to that shop
3. Authentication token is valid

---

## Testing Checklist

### Job Status
- [ ] Can update status to valid next status
- [ ] Cannot update to invalid status
- [ ] Notes field saves correctly
- [ ] History displays all changes
- [ ] Real-time updates work
- [ ] Confirmation shows for critical statuses

### Purchase Orders
- [ ] Can create PO from parts
- [ ] PO number generates correctly
- [ ] Parts status updates to 'ordered'
- [ ] Can view PO list with filters
- [ ] Can view PO details
- [ ] Can receive parts (full quantity)
- [ ] Can receive parts (partial quantity)
- [ ] Damaged parts require notes
- [ ] PO status updates correctly

---

## Performance Tips

1. **Lazy Load History:** Only load job history when user clicks "View History"
2. **Paginate PO List:** Use pagination instead of loading all POs
3. **Cache Vendor List:** Vendors don't change often, cache in localStorage
4. **Debounce Search:** Wait 300ms after user stops typing before searching
5. **Optimistic Updates:** Update UI immediately, sync with server after

---

## Need Help?

- **Documentation:** See `JOB_STATUS_AND_PO_IMPLEMENTATION.md`
- **API Docs:** Navigate to `/api-docs` (Swagger UI)
- **Backend Code:** `server/routes/jobsEnhanced.js`
- **Frontend Components:** `src/components/Jobs/` and `src/pages/PurchaseOrder/`
- **Services:** `src/services/jobService.js` and `src/services/poService.js`

---

## What's Next?

1. **Email Integration:** Add "Email to Vendor" functionality
2. **Print Templates:** Create PDF templates for PO printing
3. **Mobile App:** Add receiving workflow to mobile app
4. **Analytics:** Track average time in each status
5. **Notifications:** Alert when parts arrive or status changes
