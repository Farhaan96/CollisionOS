# CLAUDE.md - CollisionOS Auto Body Shop Management System

This file provides guidance to Claude Code (claude.ai/code) when working with the CollisionOS collision repair management system.

## 🚀 Quick Reference - Streamlined for Speed

**System Status**: ✅ 70% Complete - Production-Ready Foundation Built
**Model**: `claude-sonnet-4-5-20250929`
**Architecture**: **5 core** + 3 lightweight agents

### Core 5 Agents (Use These)

1. **orchestrator** - Complex multi-step tasks (delegates automatically)
2. **architect** - Planning & breakdown (when you need structure)
3. **bms-specialist** - Collision repair domain expert (XML/insurance only)
4. **code-generator** - ALL code (frontend, backend, database, everything)
5. **test-runner** - Testing & validation (ship with confidence)

### Lightweight 3 (On-demand Only)

6. **code-reviewer** - Quick security check (3min, showstoppers only)
7. **debugger** - Fast fixes (10min, get it working)
8. **search-agent** - Codebase search (30sec, find stuff fast)

### Simple Decision Tree

```
Need to build something?     → code-generator
Complex multi-step task?     → orchestrator → delegates to others
BMS/Insurance specific?       → bms-specialist
Something broke?              → debugger
Need to find code?            → search-agent
Ready to ship?                → test-runner
Pre-commit check?             → code-reviewer
```

### Key Files

- `.claude/project_updates/*.md` - Progress (update every 15-30min)
- `.claude/agents/code-generator.md` - Your main workhorse
- `CLAUDE.md` - This file

---

## 📊 Current Project Status (70% Complete)

### ✅ What's Already Built

**Backend APIs (33 Routes)**:
- ✅ Authentication & Users ([server/routes/auth.js](server/routes/auth.js), [server/routes/users.js](server/routes/users.js))
- ✅ Customer & Vehicle CRM ([server/routes/customers.js](server/routes/customers.js), [server/routes/vehicles.js](server/routes/vehicles.js))
- ✅ Estimates & Jobs ([server/routes/estimates.js](server/routes/estimates.js), [server/routes/jobs.js](server/routes/jobs.js), [server/routes/jobsEnhanced.js](server/routes/jobsEnhanced.js))
- ✅ Repair Orders ([server/routes/repairOrders.js](server/routes/repairOrders.js))
- ✅ Parts Management ([server/routes/parts.js](server/routes/parts.js), [server/routes/partsWorkflow.js](server/routes/partsWorkflow.js), [server/routes/partsStatusUpdate.js](server/routes/partsStatusUpdate.js))
- ✅ Purchase Orders ([server/routes/purchaseOrders.js](server/routes/purchaseOrders.js))
- ✅ Automated Parts Sourcing ([server/routes/automatedSourcing.js](server/routes/automatedSourcing.js))
- ✅ Vendors ([server/routes/vendors.js](server/routes/vendors.js))
- ✅ Scheduling ([server/routes/scheduling.js](server/routes/scheduling.js))
- ✅ Technicians & Labor ([server/routes/technicians.js](server/routes/technicians.js), [server/routes/labor.js](server/routes/labor.js))
- ✅ Financial & Invoicing ([server/routes/financial.js](server/routes/financial.js))
- ✅ Dashboard & Analytics ([server/routes/dashboard.js](server/routes/dashboard.js), [server/routes/analytics.js](server/routes/analytics.js))
- ✅ Reports ([server/routes/reports.js](server/routes/reports.js))
- ✅ BMS Integration ([server/routes/bmsApi.js](server/routes/bmsApi.js))
- ✅ Attachments ([server/routes/attachments.js](server/routes/attachments.js))
- ✅ Quality Control ([server/routes/qualityControl.js](server/routes/qualityControl.js), [server/routes/quality.js](server/routes/quality.js))
- ✅ Communications ([server/routes/communication.js](server/routes/communication.js), [server/routes/customerCommunication.js](server/routes/customerCommunication.js))
- ✅ Notifications ([server/routes/notifications.js](server/routes/notifications.js))
- ✅ Inventory ([server/routes/inventory.js](server/routes/inventory.js))
- ✅ Loaner Fleet ([server/routes/loanerFleet.js](server/routes/loanerFleet.js))
- ✅ Production Board ([server/routes/production.js](server/routes/production.js))
- ✅ Integrations Framework ([server/routes/integrations.js](server/routes/integrations.js))
- ✅ AI Capabilities ([server/routes/ai.js](server/routes/ai.js))

**Database**:
- ✅ Comprehensive collision repair schema (SQLite/Supabase)
- ✅ Claims, ROs, Parts, POs, Customers, Vehicles tables
- ✅ Sequelize ORM models with associations
- ✅ Migration system

**Frontend**:
- ✅ Electron desktop app
- ✅ React 18 + Material-UI v7
- ✅ RO Detail Page ([src/pages/RO/RODetailPage.jsx](src/pages/RO/RODetailPage.jsx))
- ✅ RO Search Page ([src/pages/Search/ROSearchPage.jsx](src/pages/Search/ROSearchPage.jsx))
- ✅ VIN Decoder Demo ([src/pages/VINDecoderDemo.jsx](src/pages/VINDecoderDemo.jsx))

### ⏳ Current Blockers (Phase 1 - Immediate)

1. **Frontend field mappings** - RODetailPage.jsx needs backend response structure alignment
2. **Backend API connections** - ROSearchPage.jsx using mock data instead of real API
3. **Minor TypeScript errors** - BMS parser type issues

**Priority**: Fix these first (2-4 hours) to get app fully operational

---

## 🎯 Comprehensive Feature Roadmap (16-Week Plan)

### Phase 1: Stabilization (Week 1-2) - IMMEDIATE ⚡

**Status**: 70% → 100% operational
**Owner**: code-generator, debugger

1. Fix frontend field mappings in [RODetailPage.jsx](src/pages/RO/RODetailPage.jsx)
2. Connect [ROSearchPage.jsx](src/pages/Search/ROSearchPage.jsx) to real backend
3. Resolve TypeScript compilation errors in BMS parser
4. End-to-end testing (BMS → RO → Parts → PO)

**Acceptance Criteria**:
- ✅ App starts without errors
- ✅ All 33 backend APIs tested and working
- ✅ BMS import creates RO with parts
- ✅ Parts drag-drop updates database
- ✅ PO creation from selected parts works

---

### Phase 2: Financial Integration (Week 3-4) 💰

**Priority**: High (Critical for business operations)
**Owner**: code-generator, bms-specialist

#### 2.1 Payment Processing (Week 3)
- [ ] Integrate Stripe or Square for credit card processing
- [ ] Build payment recording UI with multiple payment types
- [ ] Support cash, credit card, check, insurance payments
- [ ] Partial payment and deposit handling
- [ ] Payment receipt generation and email

#### 2.2 Expense Tracking (Week 3)
- [ ] Job-level expense module (sublet, materials, labor)
- [ ] Operating expense tracking (rent, utilities, supplies)
- [ ] Vendor bill management
- [ ] Expense approval workflow
- [ ] Cost allocation to ROs

#### 2.3 Accounting Integration (Week 4)
- [ ] QuickBooks Online API integration
- [ ] Sage 50 import/export functionality
- [ ] Automated transaction sync (invoices, payments, expenses)
- [ ] Chart of accounts mapping
- [ ] Reconciliation reports

**Deliverable**: Complete financial management with external accounting sync

---

### Phase 3: Mobile & Customer Experience (Week 5-7) 📱

**Priority**: High (Customer satisfaction & modern expectations)
**Owner**: code-generator, frontend-ui

#### 3.1 Technician Mobile App (Week 5-6)
- [ ] React Native app (iOS/Android) or Progressive Web App
- [ ] Job list and assignment view (filtered by technician)
- [ ] Time clock - punch in/out on specific jobs
- [ ] Photo upload (damage, progress, completion)
- [ ] Status updates (started, in progress, waiting for parts, completed)
- [ ] Parts requests and inventory lookup
- [ ] Digital inspection forms
- [ ] Offline mode with sync

#### 3.2 Customer Mobile App/Portal (Week 6-7)
- [ ] Customer-facing mobile app (React Native or PWA)
- [ ] Appointment booking interface
- [ ] Real-time repair status tracking
- [ ] Estimate approval workflow
- [ ] Progress photo viewing
- [ ] Two-way messaging with shop
- [ ] Mobile payment processing
- [ ] Review and feedback system
- [ ] Digital document signing

#### 3.3 Two-Way Communications (Week 7)
- [ ] Twilio SMS gateway integration
- [ ] Automated appointment reminders
- [ ] Status update notifications
- [ ] Two-way texting (customer ↔ shop)
- [ ] Message templates library
- [ ] Communication history tracking
- [ ] Bulk messaging capabilities

**Deliverable**: Mobile apps for technicians and customers, SMS communication

---

### Phase 4: Advanced Integrations (Week 8-10) 🔌

**Priority**: Medium-High (Industry-specific, competitive advantage)
**Owner**: bms-specialist, code-generator

#### 4.1 Parts Supplier Integrations (Week 8-9)
- [ ] **CollisionLink (OEConnection)** - OEM parts ordering
  - API authentication and catalog access
  - VIN-based parts lookup
  - Real-time pricing and availability
  - Electronic ordering and tracking
- [ ] **Keystone/LKQ** - Aftermarket parts integration
  - Catalog integration
  - Price comparison
  - Order submission and status tracking
- [ ] **APT (Auto Parts Trading)** - Local supplier integration
  - Custom integration or web scraping
  - Order management
- [ ] **Automated price comparison** across suppliers
- [ ] **PartsTrader** or **OPSTrax** integration (if applicable)

#### 4.2 Insurance & Estimating (Week 9)
- [ ] Enhanced **Mitchell Connect** integration
  - Assignment intake automation
  - Electronic estimate submission
  - Supplement approval workflow
  - Status updates to insurers
- [ ] **CCC ONE** compatibility
  - Estimate import/export
  - Total loss handling
- [ ] **Audatex** support
  - Estimate conversion
- [ ] **CIECA BMS** standards compliance
  - XML validation
  - Standard message formats
- [ ] **ICBC-specific** integration (BC, Canada)
  - Direct repair program compliance
  - ICBC guidelines and procedures

#### 4.3 OEM Repair Information (Week 10)
- [ ] **ALLDATA** API integration
  - VIN-based procedure lookup
  - Repair procedure viewer in app
  - Position statements library
- [ ] **Mitchell TechAdvisor** integration
  - OEM repair procedures (Ford, GM, etc.)
  - Wiring diagrams
  - Calibration requirements
- [ ] **I-CAR RTS** (Repairability Technical Support)
  - Position statement access
  - Repair procedure links
- [ ] In-app OEM procedure viewer with bookmarking

**Deliverable**: Deep industry integrations for parts sourcing and repair procedures

---

### Phase 5: Advanced Features (Week 11-13) ⚙️

**Priority**: Medium (Competitive differentiation)
**Owner**: code-generator, test-runner

#### 5.1 Digital Vehicle Inspection (Week 11)
- [ ] Customizable inspection templates (pre-repair, post-repair, QC)
- [ ] Photo capture with annotation and markup tools
- [ ] Multi-point inspection checklist
- [ ] Customer-facing inspection reports (PDF, web view)
- [ ] Upsell recommendations with pricing
- [ ] Video walkaround support
- [ ] Digital signature capture

#### 5.2 Time Clock & Labor Tracking (Week 11)
- [ ] Technician punch in/out system (job-level)
- [ ] Barcode/QR code scanning for job start/stop
- [ ] Real-time labor hours tracking
- [ ] Efficiency reports (actual vs. estimated labor)
- [ ] Labor cost analysis per RO
- [ ] Payroll system integration (flag hours for payroll)
- [ ] Productivity dashboards

#### 5.3 HR & Employee Management (Week 12)
- [ ] I-CAR certification tracking (upload certificates, expiration dates)
- [ ] Training records and continuing education
- [ ] Time-off request and approval workflow
- [ ] Shift scheduling and calendar
- [ ] Performance review system
- [ ] Skills matrix (painting, welding, electrical, etc.)
- [ ] Employee document storage (W2, contracts)

#### 5.4 ADAS & Calibration Tracking (Week 12)
- [ ] ADAS system detection (camera, radar, LiDAR)
- [ ] Calibration requirement identification
- [ ] OEM calibration procedure links
- [ ] Calibration equipment tracking (targets, tools)
- [ ] Pre/post-scan documentation
- [ ] Calibration completion certification
- [ ] Integration with scan tool software (if available)

#### 5.5 Towing Coordination (Week 13)
- [ ] Tow company directory with contact info
- [ ] Tow request workflow (create request, assign company)
- [ ] GPS tracking integration (if available)
- [ ] Tow cost tracking and invoicing
- [ ] Status updates (dispatched, picked up, delivered)
- [ ] Customer notification of tow status

**Deliverable**: Premium features for operational excellence

---

### Phase 6: Scale & Polish (Week 14-16) 🚀

**Priority**: Low-Medium (Growth & UX enhancement)
**Owner**: architect, code-generator, devops

#### 6.1 Multi-Location Support (Week 14)
- [ ] Location management (create, edit, deactivate locations)
- [ ] Per-location data segregation
- [ ] Cross-location visibility (owner/corporate view)
- [ ] Centralized reporting and KPIs
- [ ] Per-location user permissions
- [ ] Location-specific settings (labor rates, tax, vendors)
- [ ] Transfer ROs between locations

#### 6.2 Multi-Language Support (Week 15)
- [ ] i18n framework setup (react-i18next)
- [ ] English (default) + Spanish
- [ ] Optional: French, Punjabi (for Vancouver market)
- [ ] RTL support for future languages
- [ ] Language switcher in UI
- [ ] Localized date/currency formats
- [ ] Translation management workflow

#### 6.3 Performance Optimization (Week 15)
- [ ] Large dataset handling (1000+ ROs, 10000+ parts)
- [ ] Database query optimization (indexes, query plans)
- [ ] Caching strategies (Redis for session data, API responses)
- [ ] Lazy loading and virtualization in UI
- [ ] Offline mode for mobile apps (local storage + sync)
- [ ] CDN for static assets
- [ ] Load testing and bottleneck identification

#### 6.4 UX Polish & Accessibility (Week 16)
- [ ] Onboarding flow for new shops (setup wizard)
- [ ] In-app tutorials and tooltips
- [ ] Contextual help documentation
- [ ] WCAG 2.1 AA compliance (accessibility)
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility
- [ ] High contrast mode
- [ ] User preferences (theme, layout, defaults)

**Deliverable**: Enterprise-ready, multi-location, multilingual system

---

## 🏗️ Project Architecture

### Technology Stack

- **Frontend**: Electron + React 18 + Material-UI v7
- **Backend**: Node.js + Express + Sequelize ORM
- **Database**: SQLite (local) + Supabase/PostgreSQL (cloud)
- **Mobile**: React Native or Progressive Web App (PWA)
- **BMS Integration**: fast-xml-parser with Supabase Edge Functions
- **Authentication**: JWT + role-based access control

### Database Schema - Collision Repair Specific

```sql
-- Core entities with insurance collision repair relationships
claims (claim_id PK, claim_number UNIQUE, insurer_name, customer_id FK, vehicle_id FK)
repair_orders (ro_id PK, ro_number UNIQUE, claim_id FK UNIQUE, stage, opened_at, delivered_at)
customers (customer_id PK, type, first_name, last_name, company_name, contact_info)
vehicles (vehicle_id PK, customer_id FK, vin UNIQUE, year, make, model, trim, plate, colour, odometer)
suppliers (supplier_id PK, name, site_code, account_number, terms, is_active)
purchase_orders (po_id PK, ro_id FK, supplier_id FK, po_number UNIQUE, status, dates, totals)
part_lines (part_line_id PK, ro_id FK, po_id FK, operation, oem_number, brand_type, status, quantities, pricing)
returns (return_id PK, part_line_id FK, supplier_id FK, rma_number, reason, amounts)
documents (bms_document_id PK, bms_version, document_type, created_at, provenance)
```

### System Requirements

- **OS**: Windows 10+, macOS 10.14+, Ubuntu 18.04+
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 10GB available space
- **Network**: Broadband internet for Supabase/cloud features
- **Display**: 1920x1080 minimum resolution

---

## 📝 Development Commands

### Development Environment

```bash
npm run dev                 # Start desktop app (Electron + React + Express)
npm run dev:electron        # Start collision repair desktop app
npm run dev:ui              # Start React frontend only
npm run dev:server          # Start Express API server only
npm run dev:functions       # Start Supabase edge functions (BMS ingestion)
```

### Database Management

```bash
npm run db:migrate          # Run collision repair database migrations
npm run db:seed             # Load sample collision repair data
npm run db:check            # Quick database health check
npm run db:verify           # Comprehensive database verification
```

### Testing

```bash
npm test                    # Run collision repair unit tests
npm run test:bms           # Test BMS XML parsing and ingestion
npm run test:e2e           # Run collision repair end-to-end tests
npm run test:comprehensive  # Run full test suite
npm run test:performance   # Test with large parts datasets
```

### Code Quality

```bash
npm run typecheck          # TypeScript checking
npm run lint               # ESLint
npm run format             # Prettier formatting
```

---

## 🎯 Feature Prioritization Matrix

### Critical Path (Must-Have for Launch)
1. **Phase 1: Stabilization** - Without this, nothing works ⚡
2. **Payment Processing** - Can't invoice without payments 💰
3. **Accounting Integration** - Business compliance requirement 📊

### High Business Value
4. **Customer Mobile App** - Modern customer expectations 📱
5. **Two-Way SMS** - Customer communication efficiency 💬
6. **Parts Supplier Integrations** - Core workflow efficiency 🔧
7. **Time Clock** - Labor cost tracking ⏰

### Competitive Advantage
8. **Digital Vehicle Inspection** - Upsell opportunities 📋
9. **Mitchell Connect** - Insurance workflow requirement 🏢
10. **Technician Mobile App** - Shop floor efficiency 🔨

### Nice-to-Have
11. **Multi-Language** - Market expansion 🌍
12. **Multi-Location** - Growth enabler 📍
13. **ADAS Calibration** - Premium service tracking 📡

---

## 📋 Current Implementation Status

### ✅ Implemented (70% Complete)

**User Management**:
- ✅ Role-based authentication (owner, manager, receptionist, technician, customer)
- ✅ User CRUD operations
- ✅ Shop-level permissions

**Core Workflow**:
- ✅ Customer & Vehicle CRM
- ✅ Estimating & Quotes
- ✅ Work Orders / Repair Orders
- ✅ Parts Management with status workflow
- ✅ Purchase Orders with auto-numbering
- ✅ Scheduling & Calendar
- ✅ Invoicing (basic)

**Advanced Features**:
- ✅ BMS XML Integration
- ✅ Dashboard & KPIs
- ✅ Analytics & Reporting
- ✅ Document Attachments
- ✅ Quality Control
- ✅ Technician Management
- ✅ Labor Tracking (basic)
- ✅ Loaner Fleet
- ✅ Inventory Management
- ✅ Communications (basic)
- ✅ Notifications
- ✅ Automated Parts Sourcing (framework)

### ❌ Not Implemented (30% Remaining)

**Mobile Apps**:
- ❌ Technician mobile app (iOS/Android)
- ❌ Customer mobile app/portal
- ❌ Progressive Web App (PWA)

**Financial**:
- ❌ Payment processing (Stripe/Square)
- ❌ Expense tracking (job-level and operating)
- ❌ QuickBooks integration
- ❌ Sage 50 integration

**Integrations**:
- ❌ CollisionLink (OEConnection) parts ordering
- ❌ Keystone/LKQ integration
- ❌ APT integration
- ❌ Two-way SMS (Twilio)
- ❌ ALLDATA repair procedures
- ❌ Mitchell TechAdvisor

**Advanced Features**:
- ❌ Digital Vehicle Inspection (DVI)
- ❌ Time clock (punch in/out on jobs)
- ❌ HR module (certifications, time-off)
- ❌ ADAS calibration tracking
- ❌ Towing coordination
- ❌ Online customer booking
- ❌ Multi-location support
- ❌ Multi-language support

---

## 🔧 Agent Orchestration

### Available Specialized Agents (8 Total)

All agents are configured with **Claude Sonnet 4.5** (`claude-sonnet-4-5-20250929`) for optimal agentic performance.

#### Core Agents (Use These)

1. **orchestrator** - Master orchestrator (⚡ Entry point for complex tasks)
   - Analyzes tasks and creates execution plans
   - Delegates to specialized agents based on task type
   - Monitors progress and coordinates between agents
   - Model: `claude-sonnet-4-5-20250929`
   - Tools: All (`"*"`)

2. **architect** - Lead software architect
   - Classifies projects and creates implementation plans
   - Delegates tasks to appropriate subagents
   - Maintains project updates in `.claude/project_updates/`
   - Model: `claude-sonnet-4-5-20250929`
   - Tools: Read, LS, Grep, Glob, TodoWrite, Task

3. **bms-specialist** - BMS integration expert
   - Expert in XML processing and insurance workflows
   - Handles all BMS-related business logic
   - Model: `claude-sonnet-4-5-20250929`
   - Tools: All (`"*"`)

4. **code-generator** - Full-stack code generation
   - Creates production-ready code (frontend, backend, database)
   - Follows established patterns and best practices
   - Model: `claude-sonnet-4-5-20250929`
   - Tools: All (`"*"`)

5. **test-runner** - Testing & validation
   - Test creation, execution, and coverage
   - Workflow validation
   - Model: `claude-sonnet-4-5-20250929`
   - Tools: Read, Edit, Write, Grep, Glob, Bash

#### Support Agents (On-Demand)

6. **code-reviewer** - Quality assurance
   - Code review, security checks, best practices
   - Model: `claude-sonnet-4-5-20250929`
   - Tools: All (`"*"`)

7. **debugger** - Fast error fixes
   - Error diagnosis and resolution
   - Model: `claude-sonnet-4-5-20250929`
   - Tools: All (`"*"`)

8. **search-agent** - Codebase search
   - Pattern finding, dependency discovery
   - Model: `claude-sonnet-4-5-20250929`
   - Tools: All (`"*"`)

### Standard Workflow Pattern
1. **Orchestrator** analyzes and plans
2. **Specialized agents** execute in parallel when possible
3. **Code reviewer** validates changes
4. **Test runner** verifies functionality
5. **Progress tracking** in `.claude/project_updates/`

---

## 📂 Project Structure

```
CollisionOS/
├── .claude/
│   ├── agents/              # Agent configurations
│   ├── project_updates/     # Progress tracking files
│   └── settings.local.json  # Claude Code settings
├── server/
│   ├── routes/              # 33 API route files
│   ├── models/              # Sequelize models
│   ├── services/            # Business logic (BMS parser, etc.)
│   ├── middleware/          # Auth, validation, security
│   └── database/            # Migrations, seeds
├── src/
│   ├── pages/               # React pages (RO, Search, etc.)
│   ├── components/          # React components
│   ├── services/            # API clients (roService, bmsService, etc.)
│   └── utils/               # Helper functions
├── electron/                # Electron main process
├── mobile-app/              # (Future) React Native mobile app
├── supabase/                # Supabase edge functions & migrations
├── tests/                   # E2E, integration, unit tests
└── package.json             # Dependencies & scripts
```

---

## 🎓 Important Guidelines

### DO:
- Always consider insurance workflow requirements
- Maintain 1:1 claim-to-RO relationship integrity
- Test BMS ingestion with realistic XML samples
- Optimize for parts workflow performance
- Update progress files after changes

### DON'T:
- Break the BMS ingestion pipeline
- Skip testing collision repair workflows
- Ignore vendor integration requirements
- Create generic auto shop features without insurance context

### ALWAYS:
- Check collision repair business logic before changes
- Test BMS XML parsing with various formats
- Validate parts workflow state transitions
- Consider multi-vendor scenarios
- Document collision repair-specific decisions
- Coordinate through the architect for complex changes

---

## 🚀 Getting Started (Quick Start)

### Prerequisites
- Node.js 18+ and npm
- Supabase account (for cloud features)
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/collision-os.git
cd collision-os

# Install dependencies
npm install

# Set up environment
copy env.example .env
# Edit .env with your Supabase credentials

# Initialize database
npm run db:migrate
npm run db:seed

# Start development
npm run dev
```

### Next Steps After Installation

1. **Phase 1 Stabilization** (2-4 hours)
   - Fix frontend field mappings
   - Connect search page to backend
   - Test end-to-end workflow

2. **Phase 2 Financial Integration** (2 weeks)
   - Implement payment processing
   - Add expense tracking
   - Integrate QuickBooks

3. **Phase 3 Mobile Apps** (3 weeks)
   - Build technician mobile app
   - Create customer portal
   - Add SMS communication

---

## 📊 Session Best Practices

### Multi-Agent Orchestration
- **Orchestrator-Worker Pattern**: Orchestrator delegates to specialized workers
- **Parallel Execution**: Up to 4 concurrent agents for independent tasks
- **Subagent Delegation**: Agents proactively delegate when beneficial
- **Context Sharing**: Use `.claude/project_updates/` for cross-agent communication

### Session Management
1. **Start**: Review all `.claude/project_updates/` files for context
2. **During**: Update progress files every 15-30 minutes
3. **Before context limit**: Create checkpoint and save state
4. **Continuation**: Load checkpoint state in fresh context window
5. **End**: Comprehensive update of all relevant progress files

### Performance Optimization
- **Parallel tool calls**: Batch independent operations in single message
- **Context caching**: Leverage file-based memory for repeated access
- **Progressive search**: Start broad, narrow based on results
- **Efficient hooks**: Reduced cooldowns (300ms) for agent coordination

---

## 🔐 Claude Sonnet 4.5 Configuration

**Model**: All agents use `claude-sonnet-4-5-20250929` (Sonnet 4.5)

**Settings Location**: `.claude/settings.local.json`
```json
{
  "model": "claude-sonnet-4-5-20250929",
  "maxTokens": 8192,
  "temperature": 1.0,
  "agentOrchestration": {
    "enableParallelExecution": true,
    "maxConcurrentAgents": 4,
    "enableSubagentDelegation": true,
    "contextWindowManagement": "automatic",
    "enableExtendedThinking": true
  }
}
```

**Session Duration**:
- 🕐 **30+ hours** of autonomous coding capability
- 💾 **Checkpoints** every 2-3 hours recommended
- 🔄 **Seamless continuation** across context windows
- 📊 **State persistence** via `.claude/project_updates/`

---

## 📝 Sample BMS XML Processing

When working with BMS integration:

```xml
<!-- Sample BMS XML structure -->
<Estimate>
  <Customer>
    <FirstName>John</FirstName>
    <LastName>Smith</LastName>
    <Phone>555-1234</Phone>
  </Customer>
  <Vehicle>
    <VIN>1G1BC5SM5H7123456</VIN>
    <Year>2017</Year>
    <Make>Chevrolet</Make>
    <Model>Malibu</Model>
  </Vehicle>
  <Claim>
    <ClaimNumber>CLM-2024-001</ClaimNumber>
    <Insurer>State Farm</Insurer>
  </Claim>
  <RepairOrder>
    <RONumber>RO-2024-001</RONumber>
  </RepairOrder>
  <Parts>
    <Part>
      <Operation>Replace</Operation>
      <Description>Front Bumper Cover</Description>
      <OEMNumber>84044368</OEMNumber>
      <Quantity>1</Quantity>
    </Part>
  </Parts>
</Estimate>
```

---

## 📋 Important Reminders

- Focus on collision repair workflows and insurance industry requirements
- Always consider BMS integration implications when making changes
- Maintain database relationships specific to collision repair business logic
- Test parts workflow state transitions thoroughly
- Document collision repair business context in all changes
- Coordinate complex collision repair changes through the architect agent
- **Use incremental progress** - steady advances on few things at a time
- **Leverage checkpoints** - save state before major changes
- **Enable extended thinking** - for complex coding tasks
- **Parallel execution** - coordinate multiple agents for efficiency

---

**This configuration ensures coordinated collision repair development with clear task ownership, insurance workflow focus, and progress tracking across all specialized agents.**
