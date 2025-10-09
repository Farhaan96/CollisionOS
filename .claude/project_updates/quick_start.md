# 🚀 QUICK START - Copy & Paste This

**I'm working on CollisionOS - a comprehensive auto body shop management system (React + Node.js + Electron + SQLite/Supabase).**

**Current Status**: ✅ 70% Complete - Production-Ready Foundation Built
**Next Phase**: Phase 1 Stabilization (2-4 hours) → Get app 100% operational

## IMMEDIATE ACTIONS:
1. **Read comprehensive plan**: `Read CLAUDE.md` and `Read COMPREHENSIVE_IMPLEMENTATION_ROADMAP.md`
2. **Review current status**: `Read .claude/project_updates/orchestrator_completion_status.md`
3. **Start Phase 1 Tasks**: Fix frontend/backend integration issues
4. **Follow agent protocols**: Update your progress file after ANY code change

## PHASE 1 TASKS (IMMEDIATE - 2-4 HOURS):
1. **Fix frontend field mappings** in `src/pages/RO/RODetailPage.jsx`
   - Update `ro.customers` → `ro.customer` (lines 349, 378, 388)
   - Update `ro.vehicleProfile` references
2. **Connect ROSearchPage to backend** in `src/pages/Search/ROSearchPage.jsx`
   - Replace mock data with `roService.getRepairOrders()` call
3. **Test end-to-end workflow**: BMS import → RO detail → Parts drag-drop → PO creation

## AGENT ROLES & CAPABILITIES:
- **architect**: Lead coordinator & task delegator (`.claude/project_updates/architect_progress.md`)
- **backend-api**: APIs, server logic, TypeScript fixes, database integration (`.claude/project_updates/backend_progress.md`)
- **frontend-ui**: React components, UI/UX, dependency management, build issues (`.claude/project_updates/frontend_progress.md`)
- **db-architect**: Database schema, migrations, performance, data modeling (`.claude/project_updates/database_progress.md`)
- **devops**: CI/CD, deployment, environment setup, build configuration (`.claude/project_updates/devops_progress.md`)
- **test-runner**: Test creation, bug fixes, test execution, coverage (`.claude/project_updates/testing_progress.md`)

## ARCHITECT COORDINATION PROTOCOL:
1. **Contact architect** with the message above
2. **Receive task assignment** with specific instructions
3. **Execute the task** following the assignment details
4. **Update your progress file** after completion
5. **Report back to architect** if you encounter blockers

## MANDATORY UPDATES:
After ANY code change, update your agent's progress file with timestamp, what was done, why, and impact.

**Start by reading the project updates and contacting the architect agent for task assignment!**
