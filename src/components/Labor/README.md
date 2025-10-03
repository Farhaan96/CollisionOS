# Labor Time Clock System

Comprehensive labor tracking system for collision repair technicians to track time on jobs, manage productivity, and provide job costing insights.

## Components

### 1. LaborTimeClock
**Purpose**: Core time clock functionality for technicians to clock in/out and track time on jobs.

**Features**:
- Clock In/Out with large, prominent buttons
- Start/Stop job work with job selection
- Break and Lunch tracking
- Live timer display showing elapsed time
- Shift summary showing:
  - Total hours worked
  - Billable hours
  - Break time
  - Jobs worked
  - Estimated earnings
  - Utilization percentage
- Visual status indicators (working, on break, clocked in)
- Notes capture for time entries

**Usage**:
```jsx
import { LaborTimeClock } from '../components/Labor';

<LaborTimeClock
  technicianId={user.id}
  jobs={assignedJobs}
  onUpdate={(response) => {
    // Handle time clock updates
    console.log('Time entry created:', response);
  }}
/>
```

### 2. JobCostingDashboard
**Purpose**: Display actual vs estimated labor hours and costs for job profitability tracking.

**Features**:
- Summary cards showing:
  - Estimated hours
  - Actual hours
  - Variance (over/under budget)
  - Labor cost comparison
- Visual progress bar with color-coded status
- Alerts for over-budget jobs
- Detailed time entries table with:
  - Technician name
  - Operation type
  - Start/end times
  - Duration
  - Labor cost
  - Notes
- Edit/delete functionality (supervisor only)

**Usage**:
```jsx
import { JobCostingDashboard } from '../components/Labor';

<JobCostingDashboard
  jobId={job.id}
  userRole={user.role} // 'technician', 'supervisor', 'admin'
/>
```

### 3. EnhancedTechnicianConsole
**Purpose**: Complete technician workspace integrating time clock, job management, and productivity tracking.

**Features**:
- Technician profile with stats (hours, efficiency, jobs worked)
- Performance comparison vs shop average
- Tabbed interface:
  - **Time Clock**: Full time tracking functionality
  - **My Jobs**: List of assigned jobs with quick access
  - **Job Costing**: Detailed cost analysis for selected job
  - **Productivity**: Weekly performance metrics and recommendations
- Auto-refresh active sessions
- Real-time updates

**Usage**:
```jsx
import { EnhancedTechnicianConsole } from '../components/Labor';

<EnhancedTechnicianConsole
  technicianId={user.id}
  jobs={assignedJobs}
  currentUser={user}
/>
```

## API Service (laborService.js)

### Methods

#### Clock Operations
```javascript
// Clock in
await laborService.clockOperation({
  operation: 'clock_in',
  notes: 'Starting my shift'
});

// Start job
await laborService.clockOperation({
  operation: 'start_job',
  jobId: 'job-123',
  notes: 'Beginning front bumper replacement'
});

// Stop job
await laborService.clockOperation({
  operation: 'stop_job',
  jobId: 'job-123',
  notes: 'Completed bumper replacement'
});

// Take break
await laborService.clockOperation({
  operation: 'break_start'
});

// End break
await laborService.clockOperation({
  operation: 'break_end'
});

// Clock out
await laborService.clockOperation({
  operation: 'clock_out',
  notes: 'End of shift'
});
```

#### Data Retrieval
```javascript
// Get current status
const status = await laborService.getCurrentStatus(technicianId);

// Get job time entries
const entries = await laborService.getJobTimeEntries(jobId);

// Get productivity data
const productivity = await laborService.getProductivity(
  technicianId,
  startDate,
  endDate
);

// Get job costing
const costing = await laborService.getJobCosting(jobId);

// Get shift summary
const summary = await laborService.getShiftSummary(technicianId);

// Get all active sessions (for shop-wide view)
const sessions = await laborService.getActiveSessions();
```

#### Supervisor Actions
```javascript
// Edit time entry
await laborService.editTimeEntry(entryId, {
  duration: 120, // minutes
  notes: 'Updated notes',
  laborCost: 50.00
});

// Delete time entry
await laborService.deleteTimeEntry(entryId);
```

## Backend API Endpoints

### POST /api/labor/clock-operation
Perform time clock operations (clock in/out, start/stop job, breaks)

**Request**:
```json
{
  "operation": "start_job",
  "jobId": "uuid",
  "notes": "Optional notes"
}
```

**Response**:
```json
{
  "success": true,
  "operation": "start_job",
  "entry": { /* time entry object */ },
  "shiftSummary": {
    "totalHours": 6.5,
    "billableHours": 5.2,
    "breakTime": 0.5,
    "jobsWorked": 3,
    "earnings": 325.00
  },
  "recommendations": [
    {
      "type": "break_reminder",
      "message": "You haven't taken a break in over 4 hours",
      "action": "Take a 15-minute break"
    }
  ]
}
```

### GET /api/labor/technician/:technicianId/current
Get current status for a technician

**Response**:
```json
{
  "clockedIn": true,
  "session": { /* clock-in entry */ },
  "activeJob": { /* active job entry */ },
  "activeBreak": null,
  "shiftSummary": { /* summary object */ }
}
```

### GET /api/labor/entries/:jobId
Get all time entries for a job

### GET /api/labor/job-costing/:jobId
Get job costing comparison (actual vs estimated)

**Response**:
```json
{
  "jobId": "uuid",
  "jobNumber": "JOB-2024-001",
  "estimatedHours": 8.0,
  "actualHours": 9.5,
  "estimatedCost": 400.00,
  "actualCost": 475.00,
  "variance": 1.5,
  "costVariance": 75.00,
  "isOverBudget": true,
  "efficiency": 84.21
}
```

### GET /api/labor/productivity/:technicianId
Get productivity metrics for a technician

**Query Parameters**:
- `startDate`: ISO 8601 date string
- `endDate`: ISO 8601 date string

**Response**:
```json
{
  "technicianId": "uuid",
  "period": {
    "start": "2025-01-15T00:00:00Z",
    "end": "2025-01-22T00:00:00Z"
  },
  "metrics": {
    "totalHours": 40.0,
    "billableHours": 32.5,
    "productiveHours": 32.5,
    "breakTime": 2.5,
    "overtimeHours": 0,
    "jobsWorked": 8,
    "averageHourlyRate": 28.50,
    "totalEarnings": 926.25,
    "efficiency": 92.5,
    "utilization": 81.25
  },
  "dailyBreakdown": [ /* array of daily stats */ ],
  "comparison": {
    "shopAverage": {
      "utilization": 72.5,
      "efficiency": 83.2
    },
    "industryBenchmark": {
      "utilization": 75,
      "efficiency": 85
    },
    "performance": {
      "utilizationVsShop": 8.75,
      "efficiencyVsIndustry": 7.5
    }
  },
  "recommendations": [ /* array of recommendations */ ]
}
```

### GET /api/labor/active-sessions
Get all active labor sessions for the shop

### PUT /api/labor/entries/:id
Edit a time entry (supervisor only)

### DELETE /api/labor/entries/:id
Delete a time entry (supervisor only)

## Business Logic

### Labor Operations Flow

```
Clock In → [Clocked In] → Start Job → [Working on Job] → Stop Job → [Clocked In]
                       ↓
                    Break/Lunch → [On Break] → End Break → [Clocked In]
                       ↓
                  Clock Out → [Off Duty]
```

### Validations
- Must clock in before starting job work
- Cannot clock in if already clocked in
- Cannot start multiple jobs simultaneously (auto-stops previous job)
- Cannot clock out without stopping active job work
- Breaks are unpaid time (hourlyRate = 0)

### Time Calculations
- Duration calculated in minutes
- Labor cost = (duration / 60) * hourlyRate * skillMultiplier
- Skill multipliers based on technician certifications and job type
- Overtime calculated after 8 hours

### Recommendations Engine
- Break reminder if >4 hours without break
- Overtime alert when approaching 8 hours
- Utilization warnings if below shop average
- Efficiency suggestions based on industry benchmarks

## User Roles

### Technician
- Clock in/out
- Start/stop job work
- Take breaks/lunch
- View own time entries
- View own productivity
- Cannot edit/delete entries

### Supervisor/Manager/Admin
- All technician permissions
- View all technicians' time
- Edit time entries
- Delete time entries
- View shop-wide active sessions
- Access all productivity reports

## Integration Points

### Production Board
- Shows which technician is working on each job
- Displays active timer for jobs in progress

### Job Costing
- Real-time profitability tracking
- Variance alerts for over-budget jobs
- Historical cost analysis

### Payroll
- Export time entries for payroll processing
- Calculate regular vs overtime hours
- Track earnings by technician

## Testing Multi-Technician Scenarios

### Scenario 1: Multiple Techs on Same Job
```javascript
// Tech 1 starts job
await laborService.clockOperation({
  operation: 'start_job',
  jobId: 'job-123'
});

// Tech 2 starts same job
await laborService.clockOperation({
  operation: 'start_job',
  jobId: 'job-123'
});

// Both entries tracked separately
// Job costing aggregates all technician time
```

### Scenario 2: Job Handoff
```javascript
// Tech 1 stops job
await laborService.clockOperation({
  operation: 'stop_job',
  jobId: 'job-123',
  notes: 'Completed body work, ready for paint'
});

// Tech 2 (painter) starts job
await laborService.clockOperation({
  operation: 'start_job',
  jobId: 'job-123',
  notes: 'Starting paint prep'
});

// Seamless handoff with audit trail
```

### Scenario 3: Break Coverage
```javascript
// Tech 1 goes on break
await laborService.clockOperation({
  operation: 'break_start',
  notes: 'Taking 15-minute break'
});

// Shop can see Tech 1 is unavailable
// Other techs can pick up urgent work
```

## Performance Considerations

- Auto-refresh active sessions every 30 seconds
- Client-side timer for live elapsed time display
- Efficient database queries with proper indexes
- Caching of productivity calculations
- Real-time updates via Socket.io broadcasts

## Future Enhancements

1. **Mobile App**: iOS/Android app for clock in/out
2. **Geofencing**: Verify technician is on-site
3. **Photo Documentation**: Attach photos to time entries
4. **Voice Notes**: Record verbal notes during work
5. **Barcode Scanning**: Scan job cards to start work
6. **Predictive Analytics**: AI-based job time estimation
7. **Skill-Based Routing**: Auto-assign jobs based on skills
8. **Training Integration**: Link certifications to labor rates
