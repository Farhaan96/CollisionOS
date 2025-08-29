# CLAUDE.md - CollisionOS Insurance Collision Repair System

This file provides guidance to Claude Code (claude.ai/code) when working with the CollisionOS collision repair management system.

## Project Overview

**CollisionOS** is a specialized desktop application for collision repair shops that process insurance claims. The system provides end-to-end workflow management from BMS (Body Management System) XML ingestion through parts sourcing to job completion.

### Key Architectural Differences from Generic Auto Shop Systems:
- **Insurance-Centric**: 1:1 claim-to-repair-order relationship
- **BMS Integration**: Automated XML parsing from insurance systems
- **Parts Workflow**: Status-based workflow (Needed → Ordered → Received → Installed)
- **Search-First Interface**: Global search by RO#, Claim#, Plate, VIN
- **Vendor Management**: Multi-supplier parts sourcing with KPI tracking

## Agent Orchestration with .claude/agents

### Available Specialized Agents

The `.claude/agents/` folder contains specialized agents for collision repair development:

1. **architect.md** - Lead software architect
   - Classifies collision repair projects and creates implementation plans
   - Delegates tasks to appropriate subagents for insurance workflows
   - Maintains project updates in `.claude/project_updates/`
   - Tools: Read, LS, Grep, Glob, TodoWrite, Task

2. **backend-api.md** - Backend API specialist
   - Designs BMS ingestion APIs and purchase order workflows  
   - Supabase Edge Functions for XML parsing
   - Insurance-specific business logic implementation
   - Tools: Read, Edit, Write, Grep, Glob, Bash

3. **frontend-ui.md** - Frontend UI engineer
   - Builds collision repair interfaces (RO detail, parts buckets)
   - Search-first navigation and workflow management
   - Multi-select PO creation interfaces
   - Tools: Read, Edit, Write, Grep, Glob, Bash

4. **db-architect.md** - Database architect
   - Collision repair schema design with insurance entities
   - Performance optimization for parts workflow queries
   - Migration scripts for claims/RO/parts relationships
   - Tools: Read, Edit, Write, Grep, Glob, Bash

5. **devops.md** - DevOps engineer
   - Supabase project configuration and deployment
   - BMS ingestion pipeline setup and monitoring
   - Electron app build and distribution
   - Tools: Read, Edit, Write, Grep, Glob, Bash

6. **test-runner.md** - Testing specialist
   - Collision repair workflow testing (BMS → RO → PO)
   - Parts sourcing and vendor integration tests
   - Performance testing with collision repair datasets
   - Tools: Read, Edit, Write, Grep, Glob, Bash

### Collision Repair Specific Workflows

When you receive collision repair requests:

1. **Engage the architect agent** for complex insurance workflow changes
2. **The architect will analyze** collision repair requirements and business logic
3. **Task assignments** will be made based on collision repair expertise areas
4. **Progress tracking** through collision repair-specific updates

### Calling the Architect for Collision Repair Tasks

```javascript
Task tool with:
- subagent_type: "architect"
- description: "Collision repair [feature/fix] analysis"
- prompt: "Analyze [collision repair request] considering BMS integration, parts workflow, and insurance requirements. Create implementation plan with agent assignments."
```

### Project Updates Protocol - Collision Repair Focus

All agents maintain progress files in `.claude/project_updates/` with collision repair context:
- `architect_progress.md` - Overall collision repair architecture decisions
- `backend_progress.md` - BMS ingestion, PO APIs, insurance business logic
- `frontend_progress.md` - RO interfaces, parts buckets, search workflows
- `db_progress.md` - Collision repair schema changes and optimizations
- `devops_progress.md` - Supabase deployment and BMS pipeline configuration
- `test_progress.md` - Collision repair workflow validation results

### Update Format for Collision Repair Development

```markdown
## [DATE] [TIME] - [AGENT NAME] - [COLLISION REPAIR ACTION]

### What was done:
- [Collision repair specific changes]
- [BMS/Parts/RO/Claim related modifications]

### Why it was done:
- [Insurance workflow reasoning]
- [Parts sourcing business logic]

### Impact:
- [Effect on BMS ingestion pipeline]
- [Changes to RO/Parts/PO workflows]

### Files Changed:
- `path/to/collision-repair-file.js` - [collision repair description]
- `supabase/functions/bms_ingest.ts` - [BMS integration changes]
```

## Development Commands - Collision Repair Focused

### Development Environment
```bash
npm run dev:electron     # Start collision repair desktop app
npm run dev:functions    # Start Supabase edge functions (BMS ingestion)
npm run dev:api         # Start Express API server (PO workflows)
```

### Database Management - Collision Repair Schema
```bash
npm run db:gen          # Generate collision repair schema and deploy to Supabase
npm run db:migrate      # Run collision repair database migrations
npm run db:seed         # Load sample collision repair data
npm run seed:bms        # Process sample BMS XML files
```

### Testing - Collision Repair Workflows
```bash
npm test                    # Run collision repair unit tests
npm run test:bms           # Test BMS XML parsing and ingestion
npm run test:po            # Test purchase order workflow
npm run test:e2e          # Run collision repair end-to-end tests
npm run test:performance   # Test with large parts datasets
```

### Code Quality
```bash
npm run typecheck    # TypeScript checking (collision repair types)
npm run lint         # ESLint with collision repair rules
npm run format       # Prettier formatting
```

## Project Structure - Collision Repair System

### Frontend (`app-desktop/src/`)
- `components/CollisionRepair/` - RO detail, parts buckets, search
- `components/BMS/` - BMS file upload and processing UI
- `components/PurchaseOrders/` - PO creation and management
- `components/Vendors/` - Supplier management interfaces
- `pages/RO/` - Repair order detail pages
- `pages/Search/` - Global search interface
- `services/bms.js` - BMS ingestion API client
- `services/parts.js` - Parts workflow API client
- `services/po.js` - Purchase order API client

### Backend (`supabase/`)
- `functions/bms_ingest/` - Edge function for XML parsing
- `migrations/` - Collision repair database schema
- `types.ts` - TypeScript definitions for collision repair entities

### API (`api/` if needed)
- `routes/po.js` - Purchase order workflow endpoints
- `routes/parts.js` - Parts status and sourcing APIs
- `middleware/bms.js` - BMS validation and processing

### Scripts (`scripts/`)
- `db-gen.js` - Collision repair schema generation
- `seed-bms.js` - Sample BMS file processing
- `vendor-setup.js` - Supplier configuration utilities

## Current Feature Status - Collision Repair System

### ✅ Foundation Complete (Generic → Collision Repair)
- [x] README.md updated with collision repair architecture
- [x] CLAUDE.md updated with collision repair workflows
- [x] Agent coordination established for collision repair tasks
- [x] Project structure defined for collision repair system

### 🔧 Implementation Tasks (8-Task Plan)

#### Task 1: Foundation & Scaffolding ⏳
- [ ] Monorepo structure with app-desktop, supabase, api packages
- [ ] Supabase project setup and configuration
- [ ] Development script framework

#### Task 2: Database Schema 📋
- [ ] Collision repair PostgreSQL schema design
- [ ] Claims, RO, parts, suppliers, PO tables
- [ ] Migration scripts and performance indexes
- [ ] Enums for part status and brand types

#### Task 3: BMS Integration 🔌
- [ ] Supabase Edge Function for XML parsing
- [ ] fast-xml-parser integration with removeNSPrefix
- [ ] BMS-to-database mapping (documents → customers → vehicles → claims → ROs → parts)
- [ ] Sample BMS file processing

#### Task 4: Purchase Order APIs 🛒
- [ ] PO creation endpoints with numbering system
- [ ] Parts receiving workflow APIs
- [ ] Returns handling for quantity mismatches
- [ ] Vendor code generation utilities

#### Task 5: RO Detail Interface 🖥️
- [ ] Search-first navigation (RO#, Claim#, Plate, VIN)
- [ ] RO detail page with claim/customer/vehicle chips
- [ ] Parts status buckets with drag-and-drop
- [ ] Multi-select PO creation workflow

#### Task 6: PO Management Interface 📦
- [ ] Vendor-specific PO views
- [ ] Inline parts receiving with quantity tracking
- [ ] KPI dashboards (lead time, fill rate, return rate)
- [ ] PO numbering display and tracking

#### Task 7: Testing & Validation 🧪
- [ ] BMS ingestion pipeline testing
- [ ] End-to-end collision repair workflow tests
- [ ] Parts sourcing and PO workflow validation
- [ ] Performance testing with realistic datasets

#### Task 8: Performance Optimization ⚡
- [ ] Database indexing for collision repair queries
- [ ] Query optimization for large parts datasets
- [ ] UI performance with multiple ROs and parts
- [ ] BMS ingestion performance validation

### 📝 Not Yet Implemented (Future Enhancements)
- VIN decoding integration
- Insurance company API connections
- Mobile app for technicians
- Advanced reporting and analytics
- Multi-location support

## Architecture - Collision Repair Specific

### Database Relationships
```
insurance_claims (1) ←→ (1) repair_orders
repair_orders (1) ←→ (many) part_lines  
repair_orders (1) ←→ (many) purchase_orders
suppliers (1) ←→ (many) purchase_orders
suppliers (1) ←→ (many) part_lines
part_lines (1) ←→ (0..1) returns
customers (1) ←→ (many) vehicles
vehicles (1) ←→ (many) claims
```

### BMS Integration Flow
```
XML Upload → Edge Function → XML Parser → Database Upserts:
1. documents (provenance tracking)
2. customers (contact information)  
3. vehicles (VIN, YMMT, plate)
4. claims (claim_number, insurer)
5. repair_orders (RO_number, 1:1 with claim)
6. part_lines (operations, parts, status=needed)
```

### Parts Workflow States
```
needed → sourcing → ordered → backordered → received → installed → returned → cancelled
```

### PO Numbering System
```
${ro_number}-${YYMM}-${vendorCode}-${seq}
Example: R12345-2412-LKQU-001
```

## Important Guidelines for Collision Repair Development

### DO:
- Always consider insurance workflow requirements
- Maintain 1:1 claim-to-RO relationship integrity
- Test BMS ingestion with realistic XML samples
- Optimize for parts workflow performance
- Follow collision repair industry standards
- Update collision repair progress files after changes

### DON'T:
- Break the BMS ingestion pipeline
- Modify core collision repair entities without architect review
- Skip testing collision repair workflows
- Ignore vendor integration requirements
- Create generic auto shop features

### ALWAYS:
- Check collision repair business logic before changes
- Test BMS XML parsing with various formats
- Validate parts workflow state transitions
- Consider multi-vendor scenarios
- Document collision repair-specific decisions
- Coordinate through the architect for complex changes

## Agent Capability Matrix - Collision Repair Focus

| Agent | Collision Repair Focus | Use For |
|-------|----------------------|---------|
| architect | Collision repair architecture & coordination | Insurance workflow planning, BMS integration architecture |
| backend-api | BMS ingestion, PO APIs, insurance business logic | XML parsing, parts workflow APIs, vendor integrations |
| frontend-ui | RO interfaces, parts buckets, search workflows | Collision repair UI, parts management, PO creation |
| db-architect | Collision repair schema, parts workflow optimization | Claims/RO relationships, parts query performance |
| devops | Supabase deployment, BMS pipeline, Electron build | BMS ingestion infrastructure, collision repair deployments |
| test-runner | Collision repair workflow testing | BMS ingestion tests, parts workflow validation |

## Session Best Practices - Collision Repair Development

1. **Start of Session**: Review collision repair progress updates
2. **During Work**: Focus on insurance workflow implications
3. **Complex Tasks**: Always engage architect for collision repair changes
4. **BMS Changes**: Test with sample XML files immediately
5. **End of Session**: Update collision repair progress with business context
6. **Handoff**: Document collision repair workflow impacts

## Sample BMS XML Processing

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

This configuration ensures coordinated collision repair development with clear task ownership, insurance workflow focus, and progress tracking across all specialized agents.

# important-instruction-reminders
- Focus on collision repair workflows and insurance industry requirements
- Always consider BMS integration implications when making changes
- Maintain database relationships specific to collision repair business logic
- Test parts workflow state transitions thoroughly
- Document collision repair business context in all changes
- Coordinate complex collision repair changes through the architect agent