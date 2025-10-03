# CLAUDE.md - CollisionOS Insurance Collision Repair System

This file provides guidance to Claude Code (claude.ai/code) when working with the CollisionOS collision repair management system.

## 🚀 Quick Reference - Streamlined for Speed

**System Status**: ✅ Optimized for Claude Sonnet 4.5 (30+ hour autonomous sessions)
**Model**: `claude-sonnet-4-5-20250929`
**Architecture**: **5 core** + 3 lightweight (less is more)

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

### What Changed (Senior Dev Simplification)

❌ **Removed**: backend-api, frontend-ui, db-architect, devops
✅ **Why**: Artificial fragmentation. Code is code. One agent handles it all.
✅ **Result**: Faster delegation, better context, less overhead

### Key Files

- `.claude/project_updates/*.md` - Progress (update every 15-30min)
- `.claude/agents/code-generator.md` - Your main workhorse
- `CLAUDE.md` - This file

---

## Project Overview

**CollisionOS** is a specialized desktop application for collision repair shops that process insurance claims. The system provides end-to-end workflow management from BMS (Body Management System) XML ingestion through parts sourcing to job completion.

### Key Architectural Differences from Generic Auto Shop Systems:

- **Insurance-Centric**: 1:1 claim-to-repair-order relationship
- **BMS Integration**: Automated XML parsing from insurance systems
- **Parts Workflow**: Status-based workflow (Needed → Ordered → Received → Installed)
- **Search-First Interface**: Global search by RO#, Claim#, Plate, VIN
- **Vendor Management**: Multi-supplier parts sourcing with KPI tracking

## Agent Orchestration with .claude/agents

### Available Specialized Agents (12 Total)

All agents are configured with **Claude Sonnet 4.5** (`claude-sonnet-4-5-20250929`) for optimal agentic performance.

The `.claude/agents/` folder contains specialized agents for collision repair development:

#### Core Coordination Agents

1. **orchestrator.md** - Master orchestrator (⚡ Entry point for complex tasks)
   - Analyzes tasks and creates execution plans
   - Delegates to specialized agents based on task type
   - Monitors progress and coordinates between agents
   - Handles error recovery and task reassignment
   - Model: `claude-sonnet-4-5-20250929`
   - Tools: All (`"*"`)

2. **architect.md** - Lead software architect
   - Classifies collision repair projects and creates implementation plans
   - Delegates tasks to appropriate subagents for insurance workflows
   - Maintains project updates in `.claude/project_updates/`
   - Model: `claude-sonnet-4-5-20250929`
   - Tools: Read, LS, Grep, Glob, TodoWrite, Task

#### Domain-Specific Agents

3. **bms-specialist.md** - BMS integration expert
   - Expert in XML processing and insurance workflows
   - Handles all BMS-related business logic
   - Maps insurance data to collision repair workflows
   - Model: `claude-sonnet-4-5-20250929`
   - Tools: All (`"*"`)

4. **backend-api.md** - Backend API specialist
   - Designs BMS ingestion APIs and purchase order workflows
   - Supabase Edge Functions for XML parsing
   - Insurance-specific business logic implementation
   - Model: `claude-sonnet-4-5-20250929`
   - Tools: Read, Edit, Write, Grep, Glob, Bash

5. **frontend-ui.md** - Frontend UI engineer
   - Builds collision repair interfaces (RO detail, parts buckets)
   - Search-first navigation and workflow management
   - Multi-select PO creation interfaces
   - Model: `claude-sonnet-4-5-20250929`
   - Tools: Read, Edit, Write, Grep, Glob, Bash

6. **db-architect.md** - Database architect
   - Collision repair schema design with insurance entities
   - Performance optimization for parts workflow queries
   - Migration scripts for claims/RO/parts relationships
   - Model: `claude-sonnet-4-5-20250929`
   - Tools: Read, Edit, Write, Grep, Glob, Bash

#### Support & Quality Agents

7. **code-generator.md** - Code generation specialist
   - Creates production-ready code for CollisionOS
   - Follows established patterns and best practices
   - Focuses on BMS integration, React components, API endpoints
   - Model: `claude-sonnet-4-5-20250929`
   - Tools: All (`"*"`)

8. **code-reviewer.md** - Quality assurance specialist
   - Automated code review for quality and security
   - Ensures consistency in CollisionOS codebase
   - Runs after any code generation or modification
   - Model: `claude-sonnet-4-5-20250929`
   - Tools: All (`"*"`)

9. **debugger.md** - Debugging specialist
   - Diagnoses and fixes errors in CollisionOS
   - Focuses on BMS integration, database, and React issues
   - Quick error identification and resolution
   - Model: `claude-sonnet-4-5-20250929`
   - Tools: All (`"*"`)

10. **search-agent.md** - Codebase search specialist
    - High-performance pattern and implementation finding
    - Efficient codebase exploration
    - Dependency discovery and analysis
    - Model: `claude-sonnet-4-5-20250929`
    - Tools: All (`"*"`)

11. **test-runner.md** - Testing specialist
    - Collision repair workflow testing (BMS → RO → PO)
    - Parts sourcing and vendor integration tests
    - Performance testing with collision repair datasets
    - Model: `claude-sonnet-4-5-20250929`
    - Tools: Read, Edit, Write, Grep, Glob, Bash

12. **devops.md** - DevOps engineer
    - Supabase project configuration and deployment
    - BMS ingestion pipeline setup and monitoring
    - Electron app build and distribution
    - Model: `claude-sonnet-4-5-20250929`
    - Tools: Read, Edit, Write, Grep, Glob, Bash

### Collision Repair Specific Workflows

**For complex tasks, use the orchestrator agent** - it will analyze, plan, and delegate automatically:

```javascript
// Use the orchestrator for complex multi-step tasks
Task tool with:
- subagent_type: "orchestrator"
- description: "Implement [feature]"
- prompt: "Analyze [request] and coordinate implementation across agents"
```

**For specific domain tasks:**

1. **BMS Integration**: Use `bms-specialist` for XML parsing, insurance workflows
2. **Backend Development**: Use `backend-api` for API endpoints, Supabase functions
3. **Frontend Development**: Use `frontend-ui` for React components, UI/UX
4. **Database Work**: Use `db-architect` for schema, migrations, optimization
5. **Debugging**: Use `debugger` for error diagnosis and fixes
6. **Code Review**: Use `code-reviewer` after significant changes
7. **Testing**: Use `test-runner` for test execution and validation

**Standard workflow pattern:**
1. **Orchestrator** analyzes and plans
2. **Specialized agents** execute in parallel when possible
3. **Code reviewer** validates changes
4. **Test runner** verifies functionality
5. **Progress tracking** in `.claude/project_updates/`

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

| Agent | Model | Collision Repair Focus | Use For |
|-------|-------|------------------------|---------|
| **orchestrator** | Sonnet 4.5 | Master coordination & planning | Complex multi-step tasks, parallel execution |
| **architect** | Sonnet 4.5 | Architecture & task delegation | Insurance workflow planning, implementation plans |
| **bms-specialist** | Sonnet 4.5 | BMS XML & insurance workflows | XML parsing, insurance business logic, claims processing |
| **backend-api** | Sonnet 4.5 | APIs & server logic | BMS ingestion APIs, PO workflows, Supabase functions |
| **frontend-ui** | Sonnet 4.5 | UI/UX & React components | RO interfaces, parts buckets, search workflows |
| **db-architect** | Sonnet 4.5 | Database & performance | Claims/RO schema, parts query optimization |
| **code-generator** | Sonnet 4.5 | Code creation | Production-ready components, APIs, integrations |
| **code-reviewer** | Sonnet 4.5 | Quality & security | Code review, security checks, best practices |
| **debugger** | Sonnet 4.5 | Error diagnosis & fixes | BMS errors, database issues, React problems |
| **search-agent** | Sonnet 4.5 | Codebase exploration | Pattern finding, dependency discovery |
| **test-runner** | Sonnet 4.5 | Testing & validation | BMS tests, workflow validation, performance testing |
| **devops** | Sonnet 4.5 | Deployment & infrastructure | Supabase deployment, Electron builds, CI/CD |

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

## Claude Sonnet 4.5 Configuration & 30+ Hour Agentic Sessions

### System Configuration (✅ Optimized)

**Model**: All 12 agents use `claude-sonnet-4-5-20250929` (Sonnet 4.5)
- Specified in each agent's frontmatter
- Global default in `.claude/settings.local.json`
- Best coding model in the world (as of Sept 2025)

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

**Context Management**: Enabled for unlimited sessions
- Environment variable: `CLAUDE_CODE_ENABLE_CONTEXT_MANAGEMENT=1`
- Automatic context window tracking
- File-based memory storage

**Checkpoints**: Enabled for save/rollback
- Environment variable: `CLAUDE_CODE_ENABLE_CHECKPOINTS=1`
- Save progress before major changes
- Rollback capability for long-running tasks

**Memory Tools**: Enabled for unlimited context
- Environment variable: `CLAUDE_CODE_ENABLE_MEMORY=1`
- File-based storage across sessions
- Effectively unlimited context preservation

### Performance Capabilities

**Multi-Agent Orchestration**:
- ⚡ **4 concurrent agents** executing in parallel
- 🎯 **90.2% performance improvement** with orchestrator-worker pattern
- 💰 **40-60% cost reduction** using tiered model approach
- 🔄 **Automatic subagent delegation** when beneficial

**Hook Optimization** (`.claude/hooks/loop-detector.ps1`):
- ⚡ **300ms cooldown** (62.5% faster than default)
- 📈 **15 restarts/minute** allowed (87.5% more tolerant)
- 🛡️ **10 consecutive failures** threshold (66% more resilient)
- 🔧 **50 agent operations** per session window (150% increase)

**Session Duration**:
- 🕐 **30+ hours** of autonomous coding capability
- 💾 **Checkpoints** every 2-3 hours recommended
- 🔄 **Seamless continuation** across context windows
- 📊 **State persistence** via `.claude/project_updates/`

### Incremental Progress Strategy
- **Focus on steady advances** on a few things at a time rather than attempting everything at once
- **Use checkpoints** to save state before major changes
- **Execute tasks across multiple context windows** when needed, saving state between windows
- **Maintain orientation** by regularly updating `.claude/project_updates/` files

### Multi-Agent Orchestration
- **Orchestrator-Worker Pattern**: Orchestrator agent delegates to specialized workers
- **Parallel Execution**: Enable up to 4 concurrent agents for independent tasks
- **Subagent Delegation**: Agents proactively delegate when tasks benefit from specialization
- **Context Sharing**: Use `.claude/project_updates/` for cross-agent communication

### Extended Thinking Mode
- Enable extended thinking for complex coding tasks
- Sonnet 4.5 performs significantly better on coding when extended thinking is active
- Use for: BMS XML parsing logic, complex state management, architectural decisions

### Test-Driven Development Pattern
1. Write tests based on input/output pairs
2. Run tests and confirm they fail initially
3. Write code to pass tests without modifying tests
4. Continue until all tests pass
5. Iterate for edge cases and optimizations

### Prompt Engineering for Long Sessions
- **Artifacts for big code**: Use code blocks for large implementations
- **Explicit update vs rewrite rules**: Specify when to edit vs recreate
- **Tool-first research loop**: Search, analyze, then implement
- **Progressive enhancement**: Start simple, iterate to complex

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

### Quality Gates
- Code review after significant changes
- Test execution before committing
- Security checks for sensitive operations
- Performance validation for critical paths

# important-instruction-reminders

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
