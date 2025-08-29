# CollisionOS Project Primer

## 🚀 Quick Start for New Agents

**Copy and paste this entire section into any new chat to prime the agent:**

---

## PROJECT OVERVIEW
**CollisionOS** is a comprehensive auto body shop management desktop application built with:
- **Frontend**: React 18 + Material-UI v5 + Electron
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite + Supabase integration
- **Architecture**: Multi-agent development system

## 🎯 IMMEDIATE ACTIONS REQUIRED

### 1. READ PROJECT STATUS
```bash
# Read all project updates to understand current state
Read all files in .claude/project_updates/ to understand:
- What has been done
- Why it was done  
- Current blockers
- Next steps needed
```

### 2. COORDINATE WITH ARCHITECT
```bash
# Contact the architect agent to:
- Get current task assignments
- Understand project priorities
- Receive specific work assignments
- Coordinate with other subagents
```

### 3. FOLLOW AGENT PROTOCOLS
- **EVERY** code change must be documented in your agent's progress file
- **EVERY** 15 minutes of work requires an update
- **BEFORE** ending session, update progress file
- Use the standardized update format in your agent configuration

## 📋 CURRENT CRITICAL ISSUES

### Backend Issues (backend-api agent)
- TypeScript compilation errors in `server/services/import/bms_parser.ts`
- Decimal type usage errors (lines 73, 80, 81, 91, 92, 99, 107)
- XMLParser type usage error (line 115)
- Unknown error type handling (line 181)

### Frontend Issues (frontend-ui agent)
- Missing `@mui/x-data-grid` dependency
- Missing `@mui/x-date-pickers` dependency
- Import path issues in `src/services/bmsService.js`
- Frontend compilation failures

### App Startup Issues
- Server crashes due to TypeScript errors
- Frontend fails to compile due to missing dependencies
- Electron app cannot start properly

## 🏗️ AGENT ROLES & RESPONSIBILITIES

### architect
- **File**: `.claude/project_updates/architect_progress.md`
- **Role**: Lead software architect, task delegation, project coordination
- **Tools**: Read, LS, Grep, Glob, TodoWrite, Task

### backend-api
- **File**: `.claude/project_updates/backend_progress.md`
- **Role**: REST/GraphQL APIs, database wiring, authentication
- **Tools**: Read, Edit, Write, Grep, Glob, Bash

### frontend-ui
- **File**: `.claude/project_updates/frontend_progress.md`
- **Role**: React components, UI/UX, Electron renderer
- **Tools**: Read, Edit, Write, Grep, Glob, Bash

### db-architect
- **File**: `.claude/project_updates/database_progress.md`
- **Role**: Database schema, migrations, performance
- **Tools**: Read, Edit, Write, Grep, Glob, Bash

### devops
- **File**: `.claude/project_updates/devops_progress.md`
- **Role**: CI/CD, containerization, deployment
- **Tools**: Read, Edit, Write, Grep, Glob, Bash

### test-runner
- **File**: `.claude/project_updates/testing_progress.md`
- **Role**: Test execution, bug fixes, coverage
- **Tools**: Read, Edit, Write, Grep, Glob, Bash

## 📝 MANDATORY UPDATE FORMAT

After ANY code change, update your agent's progress file with:

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
- [Next steps required]

### Files Changed:
- `path/to/file.js` - [brief description]

### Session Context:
- [Current session goals]
- [Progress made in this session]
```

## 🚨 URGENT PRIORITIES

1. **Fix TypeScript compilation errors** (backend-api)
2. **Install missing MUI dependencies** (frontend-ui)
3. **Resolve import path issues** (frontend-ui)
4. **Get app running successfully** (all agents)

## 📞 COORDINATION COMMANDS

```bash
# To get current project status
Read .claude/project_updates/architect_progress.md

# To see what each agent is working on
Read .claude/project_updates/*_progress.md

# To understand current blockers
Read .claude/project_updates/backend_progress.md
Read .claude/project_updates/frontend_progress.md
```

---

**Remember**: Always coordinate with the architect agent first, then update your progress file after any work!
