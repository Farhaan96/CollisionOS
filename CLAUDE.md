# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Agent Orchestration with .claude/agents

### Available Specialized Agents

The `.claude/agents/` folder contains specialized agents for different tasks:

1. **architect.md** - Lead software architect
   - Classifies projects and creates implementation plans
   - Delegates tasks to appropriate subagents
   - Maintains project updates in `.claude/project_updates/`
   - Tools: Read, LS, Grep, Glob, TodoWrite, Task

2. **backend-api.md** - Backend API specialist
   - Designs and implements REST/GraphQL APIs
   - Database integration and authentication
   - Integration testing
   - Tools: Read, Edit, Write, Grep, Glob, Bash

3. **frontend-ui.md** - Frontend UI engineer
   - Builds React/Next/Electron UIs
   - Responsive and accessible components
   - Frontend testing (RTL/Vitest)
   - Tools: Read, Edit, Write, Grep, Glob, Bash

4. **db-architect.md** - Database architect
   - Database schema design and migrations
   - Performance optimization and indexing
   - Data modeling and seed data
   - Tools: Read, Edit, Write, Grep, Glob, Bash

5. **devops.md** - DevOps engineer
   - CI/CD pipelines and deployment
   - Environment setup and configuration
   - Containerization and staging deploys
   - Tools: Read, Edit, Write, Grep, Glob, Bash

6. **test-runner.md** - Testing specialist
   - Runs tests and fixes failures
   - Preserves test intent while fixing
   - Test coverage and quality assurance
   - Tools: Read, Edit, Write, Grep, Glob, Bash

### How to Use the Architect Agent

When you receive a complex request:

1. **Engage the architect agent** using the Task tool with `subagent_type="architect"`
2. **The architect will**:
   - Read project updates from `.claude/project_updates/`
   - Analyze the request and current project state
   - Create a detailed implementation plan
   - Assign specific tasks to appropriate agents
3. **You then execute the plan** by calling each agent as directed
4. **Track progress** using TodoWrite tool

### Calling the Architect

```javascript
Task tool with:
- subagent_type: "architect"
- description: "Brief task description"
- prompt: "Analyze [request] and create implementation plan with task assignments"
```

### Calling Specialized Agents After Architect's Plan

```javascript
Task tool with:
- subagent_type: "[agent-name]" // e.g., "backend-api", "frontend-ui", "test-runner"
- description: "Specific task from architect's plan"
- prompt: "[Detailed instructions from architect's assignment]"
```

### Project Updates Protocol

All agents maintain progress files in `.claude/project_updates/`:
- `architect_progress.md` - Overall project decisions and task assignments
- `backend_progress.md` - Backend API changes and decisions
- `frontend_progress.md` - Frontend UI changes and decisions
- `db_progress.md` - Database changes and migrations
- `devops_progress.md` - Deployment and infrastructure changes
- `test_progress.md` - Test results and coverage updates

### Update Format (Used by All Agents)

```markdown
## [DATE] [TIME] - [AGENT NAME] - [ACTION TYPE]

### What was done:
- [Specific changes made]
- [Files modified/created/deleted]

### Why it was done:
- [Business/technical reasoning]
- [Problem solved]

### Impact:
- [What this enables/prevents]
- [Dependencies created/resolved]

### Files Changed:
- `path/to/file1.js` - [brief description]
- `path/to/file2.js` - [brief description]
```

## Workflow Examples

### Example 1: Complex Feature Implementation

```
User: "Implement a new BMS import feature with UI and testing"

1. You → Architect: "Create implementation plan for BMS import feature"
2. Architect analyzes and returns:
   - Task 1: Backend API for BMS parsing (backend-api)
   - Task 2: Upload UI component (frontend-ui)
   - Task 3: Database schema for BMS data (db-architect)
   - Task 4: Integration tests (test-runner)

3. You execute the plan:
   - Call backend-api agent with Task 1 details
   - Call frontend-ui agent with Task 2 details
   - Call db-architect agent with Task 3 details
   - Call test-runner agent with Task 4 details
```

### Example 2: Bug Fixing and Testing

```
User: "Fix all TypeScript errors and ensure tests pass"

1. You → Architect: "Analyze TypeScript errors and create fix plan"
2. Architect returns prioritized fixes:
   - Critical: Backend compilation errors (backend-api)
   - High: Frontend type issues (frontend-ui)
   - Medium: Test failures (test-runner)

3. You execute fixes in priority order
```

## Development Commands

### Development Environment
```bash
npm run dev           # Start full development environment
npm run dev:ui        # Start UI only
npm run dev:server    # Start server only
npm run electron-dev  # Start Electron app
```

### Testing
```bash
npm test                  # Run all tests
npm run test:playwright   # Run E2E tests
npm run test:e2e:smoke   # Run smoke test suite
npm run test:coverage    # Run with coverage
```

### Code Quality
```bash
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint checking
npm run format       # Prettier formatting
```

### Building & Deployment
```bash
npm run build              # Build React app
npm run electron-pack      # Build Electron app
npm run build:analyze      # Analyze bundle size
```

## Project Structure

### Frontend (`src/`)
- `components/` - React components by feature
- `contexts/` - React contexts (auth, theme)
- `hooks/` - Custom React hooks
- `pages/` - Page components
- `services/` - API service layer
- `store/` - Zustand state management
- `utils/` - Utility functions

### Backend (`server/`)
- `routes/` - Express route handlers
- `models/` - Database models
- `services/` - Business logic
- `middleware/` - Auth, validation, security
- `database/` - Configuration and migrations

### Testing (`tests/`)
- `unit/` - Unit tests
- `integration/` - Integration tests
- `e2e/` - End-to-end tests

### Agent Configuration (`.claude/`)
- `agents/` - Agent definition files
- `project_updates/` - Progress tracking files
- `hooks/` - Custom hooks for agent behavior
- `settings.local.json` - Local agent settings

## Current Feature Status

### ✅ Implemented
- Authentication (JWT, roles, MFA)
- Dashboard with KPIs
- Customer management
- Production board (Kanban)
- Parts management
- Theme system
- Real-time updates (Socket.io)

### 🔧 Known Issues
1. **BMS Import** - File upload not accessible
2. **Dashboard Metrics** - KPI loading inconsistencies
3. **Production Board** - Stage display issues
4. **Parts Search** - Incomplete filter functionality

### 📝 Not Implemented
- VIN decoding
- Labor time tracking
- Customer portal
- Mobile app
- Multi-shop support
- Advanced scheduling

## Architecture

### Database
- Primary: Supabase (PostgreSQL)
- Fallback: SQLite for offline mode
- Real-time: Socket.io + Supabase

### State Management
- Global: Zustand
- Auth/Theme: React Context
- Server state: React Query

### Security
- JWT authentication
- Role-based access control
- Input sanitization
- Rate limiting
- CORS configured

## Important Guidelines

### DO:
- Always engage architect for complex tasks
- Read project updates before starting work
- Update progress files after changes
- Use TodoWrite to track task progress
- Test changes before marking complete
- Follow existing code patterns

### DON'T:
- Skip the architect for multi-step tasks
- Duplicate work already done
- Create files unless necessary
- Make breaking changes without planning
- Forget to update progress files

### ALWAYS:
- Check `.claude/project_updates/` first
- Use the appropriate specialized agent
- Maintain backward compatibility
- Document architectural decisions
- Coordinate through the architect

## Agent Capability Matrix

| Agent | Primary Focus | Use For |
|-------|--------------|---------|
| architect | Planning & Coordination | Task breakdown, delegation, architecture decisions |
| backend-api | Server & APIs | REST/GraphQL endpoints, auth, database integration |
| frontend-ui | UI Components | React components, styling, user interactions |
| db-architect | Database | Schema design, migrations, performance |
| devops | Infrastructure | CI/CD, deployment, environment setup |
| test-runner | Testing | Test execution, fixing, coverage |

## Testing Specific Workflows

When asked to test the application:
1. First engage architect to create a testing plan
2. Architect will assign specific test scenarios to test-runner
3. Test-runner executes tests and reports results
4. Other agents fix issues found during testing
5. Repeat until all tests pass

## Session Best Practices

1. **Start of Session**: Read all project updates
2. **During Work**: Update progress files frequently
3. **Complex Tasks**: Always use architect first
4. **End of Session**: Final progress update with summary
5. **Handoff**: Leave clear notes for next session

This configuration ensures coordinated development with clear task ownership and progress tracking across all agents.