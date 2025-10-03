# Week 1 Sprint Plan - Production Board Foundation

**Sprint Goal**: Build visual production board with drag-and-drop workflow tracking
**Duration**: 5 days (Monday - Friday)
**Estimated Hours**: 56 hours total

---

## Sprint Overview

By the end of Week 1, CollisionOS will have:
- ✅ Visual Kanban production board with 7 workflow stages
- ✅ Drag-and-drop job movement between stages
- ✅ Real-time updates via Socket.io
- ✅ Basic labor time clock interface
- ✅ Job stage history tracking

---

## Day 1 (Monday) - Planning & Setup

### Morning (4 hours)
- [ ] **Review competitive analysis** (1 hour)
  - Read COMPETITIVE_ANALYSIS_AND_ROADMAP.md
  - Understand critical gaps
  - Confirm Week 1 priorities

- [ ] **Validate with shop owner** (1 hour)
  - Schedule call with 1-2 collision shop owners
  - Show current system screenshots
  - Confirm production board is top priority
  - Get feedback on workflow stages

- [ ] **Set up external services** (2 hours)
  - Create Twilio account ($20 trial credit)
  - Create SendGrid account (free tier - 100 emails/day)
  - Save API keys to .env file
  - Test SMS send with Twilio
  - Test email send with SendGrid

### Afternoon (4 hours)
- [ ] **Test Mitchell BMS import** (2 hours)
  - Navigate to BMS import page
  - Upload 593475061.xml
  - Verify customer/vehicle/claim/RO creation
  - Check parts import (should create part_lines)
  - Document any data fields being ignored

- [ ] **Sprint planning** (2 hours)
  - Create GitHub Issues for each task
  - Set up project board (Kanban columns: To Do, In Progress, Done)
  - Estimate hours for each task
  - Identify blockers or dependencies

**End of Day**: Sprint backlog ready, external services configured

---

## Day 2 (Tuesday) - Production Board Design & API

### Morning (4 hours)
- [ ] **Design production board UI** (2 hours)
  - Sketch wireframe (7 columns: Estimate, Blueprinting, Disassembly, Repair, Reassembly, QC, Delivery)
  - Define card layout (RO#, customer name, vehicle, days in stage, assigned tech)
  - Choose color scheme for stages (gradient from blue → green)
  - Plan filters (by technician, bay, date range)

- [ ] **Review existing components** (2 hours)
  - Examine `src/components/Production/ProductionBoardTable.js`
  - Review `src/store/jobStore.js` (Zustand state management)
  - Check existing Socket.io implementation in `src/hooks/useSocket.js`
  - Identify reusable code

### Afternoon (4 hours)
- [ ] **Build job stage transition API** (4 hours)
  - Create endpoint: `PATCH /api/jobs/:id/stage`
  - Accept: `{ stage: 'repair', technicianId: 123, bayId: 2 }`
  - Validate: Job exists, stage is valid, technician exists
  - Update: `jobs.stage`, create `job_stage_history` record
  - Emit Socket.io event: `job:stage:changed`
  - Return: Updated job with history

**Files to modify**:
- `c:\Users\farha\Desktop\CollisionOS\server\routes\repairOrders.js` (add PATCH endpoint)
- `c:\Users\farha\Desktop\CollisionOS\server\database\models\Job.js` (add stage validation)
- `c:\Users\farha\Desktop\CollisionOS\server\database\models\JobStageHistory.js` (create history records)

**End of Day**: API ready for stage transitions

---

## Day 3 (Wednesday) - Production Board UI (Part 1)

### Morning (4 hours)
- [ ] **Set up @dnd-kit** (1 hour)
  - Review @dnd-kit documentation (already installed)
  - Create test component with 3 columns (To Do, Doing, Done)
  - Test drag-and-drop with mock data
  - Verify drop animation works

- [ ] **Build ProductionKanbanBoard component** (3 hours)
  - Create `src/components/Production/ProductionKanbanBoard.jsx`
  - Import @dnd-kit components (DndContext, Droppable, Draggable)
  - Define 7 stage columns with headers
  - Map jobs to stages (group by job.stage)
  - Render job cards in each column

**Component structure**:
```jsx
<DndContext onDragEnd={handleDragEnd}>
  <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto' }}>
    {stages.map(stage => (
      <Droppable key={stage.id} id={stage.id}>
        <StageColumn title={stage.name} jobs={jobsByStage[stage.id]} />
      </Droppable>
    ))}
  </Box>
</DndContext>
```

### Afternoon (4 hours)
- [ ] **Build JobCard component** (2 hours)
  - Create `src/components/Production/JobCard.jsx`
  - Display: RO number, customer name, vehicle (Year Make Model)
  - Display: Days in current stage (calculated from job_stage_history)
  - Display: Assigned technician (avatar + name)
  - Display: Priority indicator (color-coded badge)
  - Add hover effects and click handler

- [ ] **Implement drag handlers** (2 hours)
  - `handleDragEnd(event)` function
  - Extract: draggedJobId, sourceStage, targetStage
  - Call API: `PATCH /api/jobs/:id/stage` with new stage
  - Optimistic update: Move job in local state immediately
  - On success: Emit Socket.io event
  - On error: Revert optimistic update, show error toast

**End of Day**: Kanban board displays jobs, drag-and-drop functional

---

## Day 4 (Thursday) - Production Board UI (Part 2) & Real-time

### Morning (4 hours)
- [ ] **Add Socket.io real-time updates** (2 hours)
  - Connect to `job:stage:changed` event in useEffect
  - On event received: Update jobStore with new job state
  - Test: Open two browser tabs, drag job in one, verify update in other
  - Add visual notification (toast) when job moves

- [ ] **Build production board filters** (2 hours)
  - Add filter bar above board (technician dropdown, date range picker)
  - Filter jobs by assigned technician
  - Filter jobs by date range (job.created_at)
  - Add "Clear filters" button
  - Persist filters in localStorage

### Afternoon (4 hours)
- [ ] **Add stage statistics** (2 hours)
  - Display job count per stage in column headers
  - Calculate average days in stage (query job_stage_history)
  - Show warning if jobs exceed threshold (e.g., >7 days in Repair)
  - Add stage capacity indicator (if configured)

- [ ] **Polish UI/UX** (2 hours)
  - Add loading skeleton for initial load
  - Add empty state ("No jobs in this stage")
  - Add drag preview with opacity effect
  - Add drop zone highlighting
  - Test responsive layout (should scroll horizontally on small screens)

**End of Day**: Production board feature-complete with real-time updates

---

## Day 5 (Friday) - Labor Tracking & Testing

### Morning (4 hours)
- [ ] **Build time clock UI** (3 hours)
  - Create `src/components/Labor/TimeClockWidget.jsx`
  - Display current time and logged-in technician
  - Clock In button → creates LaborTimeEntry with start_time
  - Clock Out button → updates LaborTimeEntry with end_time
  - Show active time entries (currently clocked in)
  - Display total hours today

- [ ] **Build time clock API** (1 hour)
  - Endpoint: `POST /api/labor/clock-in` (technicianId, jobId optional)
  - Endpoint: `POST /api/labor/clock-out` (timeEntryId)
  - Validate: Technician not already clocked in
  - Create/update LaborTimeEntry records
  - Return: Time entry with calculated duration

**Files to modify**:
- `c:\Users\farha\Desktop\CollisionOS\server\routes\jobs.js` (add labor endpoints)
- `c:\Users\farha\Desktop\CollisionOS\server\database\models\LaborTimeEntry.js` (already exists)

### Afternoon (4 hours)
- [ ] **Integration testing** (2 hours)
  - Test: Import BMS file → creates job → appears in Estimate stage
  - Test: Drag job from Estimate → Blueprinting → updates DB
  - Test: Clock in → assign to job → clock out → calculate hours
  - Test: Real-time updates work across multiple tabs
  - Test: Filters work correctly
  - Fix any bugs found

- [ ] **Documentation & demo prep** (2 hours)
  - Update README with production board screenshots
  - Create demo script for Monday review
  - Record 2-minute demo video (Loom/OBS)
  - Update `.claude/project_updates/frontend_progress.md`
  - Commit all code with clear commit messages

**End of Day**: Week 1 sprint complete, production board functional

---

## Acceptance Criteria (Done Definition)

### Production Board
- [x] 7 workflow stages displayed as Kanban columns
- [x] Jobs can be dragged between stages
- [x] Job cards show RO#, customer, vehicle, days in stage, assigned tech
- [x] Stage transitions update database and job_stage_history
- [x] Real-time updates via Socket.io (multi-tab test passes)
- [x] Filters by technician and date range work
- [x] Stage statistics display (job count, average days)

### Labor Tracking
- [x] Time clock widget allows clock in/out
- [x] Labor time entries created in database
- [x] Total hours today displayed
- [x] Cannot clock in twice without clocking out

### Quality
- [x] No console errors in browser
- [x] Mobile responsive (scrolls horizontally on small screens)
- [x] Loading states and empty states implemented
- [x] Error handling with user-friendly messages
- [x] Code committed and pushed to main branch

---

## Technical Specifications

### Database Changes

**No new tables needed** (all models already exist):
- `jobs` table has `stage` column
- `job_stage_history` table tracks transitions
- `labor_time_entries` table for clock in/out

**Add index** for performance:
```sql
CREATE INDEX idx_jobs_stage ON jobs(stage);
CREATE INDEX idx_job_stage_history_job_id ON job_stage_history(job_id);
```

### API Endpoints to Create

1. `PATCH /api/jobs/:id/stage`
   - Request: `{ stage: 'repair', technicianId: 123, bayId: 2 }`
   - Response: `{ id, stage, updated_at, history: {...} }`

2. `GET /api/jobs?stage=repair&technicianId=5`
   - Query params: stage, technicianId, dateFrom, dateTo
   - Response: `{ jobs: [...], count: 15 }`

3. `POST /api/labor/clock-in`
   - Request: `{ technicianId: 5, jobId: 123 }`
   - Response: `{ id, start_time, technician: {...} }`

4. `POST /api/labor/clock-out`
   - Request: `{ timeEntryId: 456 }`
   - Response: `{ id, start_time, end_time, duration_hours: 3.5 }`

### Socket.io Events

- `job:stage:changed` - Emitted when job stage updates
  - Payload: `{ jobId, newStage, technicianId, timestamp }`

- `labor:clock:in` - Emitted when technician clocks in
  - Payload: `{ technicianId, jobId, timestamp }`

- `labor:clock:out` - Emitted when technician clocks out
  - Payload: `{ technicianId, duration, timestamp }`

### Component Files to Create

```
src/components/Production/
├── ProductionKanbanBoard.jsx (main board component)
├── StageColumn.jsx (individual stage column)
├── JobCard.jsx (draggable job card)
└── StageStatistics.jsx (stats header)

src/components/Labor/
└── TimeClockWidget.jsx (clock in/out interface)
```

---

## Dependencies & Setup

### NPM Packages (Already Installed)
- `@dnd-kit/core` - Drag and drop functionality
- `@dnd-kit/sortable` - Sortable lists
- `socket.io-client` - Real-time updates
- `zustand` - State management
- `@mui/material` - UI components

### External Services
- **Twilio** (for Week 2 SMS)
  - Sign up: https://www.twilio.com/try-twilio
  - Get phone number and API credentials
  - Add to .env: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

- **SendGrid** (for Week 2 Email)
  - Sign up: https://signup.sendgrid.com/
  - Get API key
  - Add to .env: `SENDGRID_API_KEY`

---

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| @dnd-kit learning curve | Allocate 1 hour for tutorial/examples on Day 3 |
| Socket.io conflicts with existing code | Test early on Day 4, fallback to polling if needed |
| Job stage validation issues | Define clear stage transition rules upfront |
| Performance with 100+ jobs | Implement pagination (50 jobs per stage max) |

---

## Success Metrics

### Technical
- Production board loads in < 2 seconds with 100 jobs
- Drag-and-drop response time < 100ms
- Socket.io updates appear within 1 second
- Zero console errors

### Functional
- All 7 stages display correctly
- Jobs move smoothly between stages
- Stage history tracked accurately
- Time clock calculates hours correctly

### User Experience
- Demo video shows intuitive workflow
- Shop owner feedback: "This is what we need!"
- No major UI bugs or glitches
- Mobile-responsive layout works

---

## Daily Standup Format

**Every morning at 9 AM** (5-minute check-in):

1. **What did I complete yesterday?**
   - List completed tasks with checkmarks

2. **What am I working on today?**
   - List planned tasks from sprint plan

3. **Any blockers?**
   - Technical issues, missing information, external dependencies

4. **Progress update**:
   - Update `.claude/project_updates/frontend_progress.md`
   - Commit code at end of day

---

## End of Week 1 Demo Script

**Friday 4 PM - 10 minute demo to stakeholders**

1. **Show BMS Import** (2 min)
   - Upload Mitchell XML file
   - Job appears in Estimate stage

2. **Show Production Board** (3 min)
   - Navigate to production board
   - Explain 7 workflow stages
   - Drag job from Estimate → Blueprinting → Repair
   - Show stage history updates
   - Show days-in-stage calculation

3. **Show Real-time Updates** (2 min)
   - Open second browser tab
   - Move job in first tab
   - Show update in second tab

4. **Show Time Clock** (2 min)
   - Clock in as technician
   - Assign to job
   - Clock out
   - Show hours calculated

5. **Q&A** (1 min)
   - Address feedback
   - Discuss Week 2 priorities

---

## Week 2 Preview (Customer Communication & Invoicing)

After Week 1 production board is complete, Week 2 will add:
- SMS/email notification templates
- Automated triggers (job moves to Repair → send customer update)
- Invoice generation with PDF
- Payment recording

**Week 2 Goal**: Shops can communicate with customers and collect payment

---

## Files to Reference

- **Competitive Analysis**: `c:\Users\farha\Desktop\CollisionOS\.claude\COMPETITIVE_ANALYSIS_AND_ROADMAP.md`
- **Executive Summary**: `c:\Users\farha\Desktop\CollisionOS\.claude\EXECUTIVE_SUMMARY.md`
- **Mitchell BMS File**: `c:\Users\farha\Desktop\CollisionOS\Example BMS\593475061.xml`
- **Existing Production Board**: `c:\Users\farha\Desktop\CollisionOS\src\pages\Production\ProductionBoard.js`
- **Job Store**: `c:\Users\farha\Desktop\CollisionOS\src\store\jobStore.js`
- **Socket Hook**: `c:\Users\farha\Desktop\CollisionOS\src\hooks\useSocket.js`

---

## Commit Message Template

```
feat(production): [description]

- What: [what changed]
- Why: [business reason]
- Related: Week 1 Sprint - Production Board

Tested: [how you tested]
```

Example:
```
feat(production): Add drag-and-drop Kanban board for job workflow

- What: Implemented ProductionKanbanBoard with 7 stages using @dnd-kit
- Why: Enable visual workflow tracking for collision repair jobs
- Related: Week 1 Sprint - Production Board

Tested: Manually dragged jobs between stages, verified DB updates and Socket.io events
```

---

## Next Steps After Week 1

1. **Monday Week 2**: Demo review, gather feedback
2. **Tuesday Week 2**: Start customer communication system
3. **By Week 3**: MVP complete (invoicing + payment)
4. **Week 4**: Beta testing with real shop

**Good luck! This week sets the foundation for everything else.**
