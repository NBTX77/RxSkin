# CONTRIBUTING.md — Development Workflow for RX Skin

> Covers Git workflow, Notion usage, Asana task management, bug reporting, and feature requests.

---

## Overview

This project uses three tools for project management:

| Tool | Purpose |
|------|---------|
| **GitHub** | Source code, version control, code-level issues, PRs |
| **Asana** | Sprint tasks, feature requests, bugs, day-to-day work items |
| **Notion** | Project hub, architecture decisions, research notes, integration docs |

---

## Git Workflow

### Branch Strategy

```
main          ← Always production-ready. Never push directly.
  └─ develop  ← Integration branch. All features merge here first.
       ├─ feat/ticket-drag-drop
       ├─ feat/schedule-week-view
       ├─ fix/mobile-nav-overflow
       └─ chore/update-dependencies
```

### Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| New feature | `feat/{short-description}` | `feat/ticket-filters` |
| Bug fix | `fix/{short-description}` | `fix/ticket-form-validation` |
| Chore / maintenance | `chore/{short-description}` | `chore/update-prisma` |
| Documentation | `docs/{short-description}` | `docs/architecture-update` |
| Refactor | `refactor/{short-description}` | `refactor/cw-client-cleanup` |
| Hotfix to main | `hotfix/{short-description}` | `hotfix/auth-session-expiry` |

### Commit Message Format

This project uses **Conventional Commits**:

```
<type>(<scope>): <short description>

[optional body]

[optional footer: closes #issue-number]
```

**Types:**
- `feat` — new feature
- `fix` — bug fix
- `chore` — maintenance (deps, config, tooling)
- `docs` — documentation only
- `refactor` — code change that doesn't add feature or fix bug
- `test` — adding or updating tests
- `perf` — performance improvement
- `style` — formatting, whitespace (no logic change)

**Examples:**
```
feat(tickets): add inline status update from ticket list

fix(schedule): correct drag-drop touch event on iOS Safari

chore(deps): update next.js to 14.3.0

docs(architecture): add multi-tenant session flow diagram

test(api): add integration tests for POST /api/tickets

feat(auth): implement JWT session with tenant scoping

Closes #42
```

### Pull Request Workflow

1. Create feature branch from `develop`
2. Build the feature with tests
3. Open a PR targeting `develop`
4. PR description must include:
   - What changed and why
   - How to test
   - Screenshots (for UI changes)
   - Link to Asana task
5. PR checklist (automated or manual):
   - [ ] TypeScript compiles without errors
   - [ ] Tests pass
   - [ ] No `.env` or secrets committed
   - [ ] Mobile layout checked at 375px
   - [ ] Asana task linked
6. Merge to `develop` after review
7. Deploy to staging automatically (Vercel preview)
8. When `develop` is stable → merge to `main` → deploys to production

### Hotfix Process

For critical production bugs:
1. Create `hotfix/` branch from `main`
2. Fix and test
3. PR directly to `main`
4. After merge to `main`, also merge to `develop` to keep in sync

### Tags & Releases

Use semantic versioning tags on `main`:
```bash
git tag -a v0.1.0 -m "Phase 1 complete — core ticketing"
git push origin v0.1.0
```

Tag format: `v{major}.{minor}.{patch}`
- Major: Breaking change or new phase release
- Minor: New feature
- Patch: Bug fix

---

## GitHub Issues

### When to Create a GitHub Issue

Create a GitHub Issue for:
- Bugs found during development
- Technical debt / refactor tasks
- Performance issues tied to specific code
- Security vulnerabilities

GitHub Issues are **code-centric**. If a bug is purely functional (feature not working as expected), start in Asana and link to GitHub Issue if code investigation is needed.

### Issue Labels

| Label | When to use |
|-------|-------------|
| `bug` | Something broken |
| `enhancement` | Improvement to existing feature |
| `performance` | Speed/loading issue |
| `security` | Security concern |
| `mobile` | Mobile-specific issue |
| `api` | ConnectWise or integration API issue |
| `blocked` | Cannot progress without external action |
| `good first issue` | Simple, well-scoped issue |

### Issue Template

```markdown
## Summary
Brief description of the issue.

## Expected Behavior
What should happen.

## Actual Behavior
What actually happens.

## Steps to Reproduce
1. Go to...
2. Click...
3. See error

## Environment
- Browser:
- Screen size:
- Logged in as: (role, not username)

## Screenshots
(if applicable)

## Asana Task
Link to related Asana task (if applicable)
```

---

## Asana Project Structure

### Sections (Sprint Board)

```
Backlog → Ready → In Progress → In Review → Done
```

| Section | Meaning |
|---------|---------|
| **Backlog** | Captured but not yet prioritized or scheduled |
| **Ready** | Prioritized, scoped, ready to pick up |
| **In Progress** | Actively being worked on |
| **In Review** | PR open, code review / testing happening |
| **Done** | Merged, tested, complete |

### Task Format

Every Asana task should have:
- **Title:** Clear and actionable (e.g., "Build ticket list with filters")
- **Phase tag:** Phase 1, Phase 2, etc.
- **Priority:** High / Medium / Low
- **Assignee:** Travis or AI (Claude)
- **Due date:** If time-sensitive
- **Description:** What needs to be built, acceptance criteria
- **GitHub Issue link:** If code-level issue exists
- **Subtasks:** Break large tasks into subtasks for tracking

### Task Types

| Type | Description |
|------|-------------|
| **Feature** | New functionality from the roadmap |
| **Bug** | Something broken in an existing feature |
| **Chore** | Setup, maintenance, config work |
| **Research** | Investigation needed before building |
| **Design** | UI/UX design work |

### Feature Request Workflow

When a new feature idea comes up:
1. Create an Asana task in **Backlog** section
2. Tag as "Feature Request"
3. Add a description: what it is, why it's valuable, rough estimate
4. Discuss → if approved, assign to a phase in `docs/ROADMAP.md`
5. Move to **Ready** when scoped and phase is confirmed
6. Start work when phase is active

### Bug Workflow

1. Bug discovered → Create Asana task in **Backlog**
2. Add steps to reproduce, expected vs actual behavior, severity
3. If critical (production broken) → immediately move to **In Progress**
4. Create `fix/` branch in GitHub
5. Create GitHub Issue and link to Asana task
6. Fix, test, PR
7. Mark Asana task **Done** when PR merged

---

## Notion Workspace

### Structure

```
RX Skin — Project Hub
├── 📋 Overview & Status         ← Project status at a glance
├── 🏗️ Architecture              ← Links to docs + decisions log
├── 🔌 Integration Notes          ← API research, quirks, notes per platform
├── 🗺️ Roadmap (high level)       ← Mirror of ROADMAP.md for visibility
├── 📓 Decision Log               ← Architectural decisions + reasoning
├── 🐛 Bug Tracker               ← Known issues + status
├── 🔑 Accounts & Credentials     ← Links to where creds are stored (NOT the creds themselves)
└── 📚 Research                   ← API research, vendor comparisons, notes
```

### What Goes in Notion vs GitHub Docs

| Content | Where |
|---------|-------|
| Architecture diagrams | `docs/ARCHITECTURE.md` (source of truth) AND Notion (for visibility) |
| API research & quirks | `docs/INTEGRATIONS.md` (source of truth) + Notion for notes |
| Decisions log | `docs/ARCHITECTURE.md` decision table + Notion page |
| Sprint tasks | Asana only |
| Code-level bugs | GitHub Issues + Asana |
| Vendor notes / conversations | Notion only |
| Roadmap | `docs/ROADMAP.md` (source of truth) + Notion for team visibility |

### Keeping Notion in Sync

After any major architectural decision:
1. Update `docs/ARCHITECTURE.md`
2. Add decision to Notion Decision Log
3. Update Notion project status if phase changed

---

## Versioning & Backup Strategy

### Git as Backup

All code is backed up through Git. Never rely on the Cowork workspace alone.

- Push to GitHub at the end of every session
- Feature branches pushed to remote (not just local)
- `main` branch is always deployable and tagged at each release

### Database Backups

- **Development:** Local PostgreSQL — export weekly with `pg_dump`
- **Production:** Supabase automated daily backups (included in plan) OR self-hosted with cron `pg_dump` to cloud storage
- Keep at minimum 7 days of daily backups
- Test restore quarterly

### .env and Secrets Backup

- `.env.local` is NEVER in Git
- Store encrypted copy in a password manager (Passportal, 1Password, etc.)
- Share `.env.example` in Git to document all required variables

### Code Versioning

- Every phase release gets a Git tag (`v0.1.0`, `v0.2.0`, etc.)
- GitHub Releases created for each tag with changelog
- Changelog auto-generated from Conventional Commits using `conventional-changelog` or similar

---

## Development Environment Setup

### Prerequisites

```bash
node --version   # 20+
npm --version    # 10+
git --version    # 2.40+
```

### First Time Setup

```bash
# Clone repo
git clone https://github.com/[org]/rx-skin.git
cd rx-skin

# Install dependencies
npm install

# Copy env template
cp .env.example .env.local
# Fill in .env.local with real values

# Run database migrations
npx prisma migrate dev

# Seed development data
npx prisma db seed

# Start dev server
npm run dev
```

### Running Tests

```bash
npm run test          # Unit + integration tests (Vitest)
npm run test:e2e      # End-to-end tests (Playwright)
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Useful Scripts

```bash
npm run dev           # Start development server (localhost:3000)
npm run build         # Production build
npm run lint          # ESLint check
npm run type-check    # TypeScript check
npm run db:studio     # Open Prisma Studio (visual DB browser)
npm run db:migrate    # Run pending migrations
npm run db:reset      # Reset DB + reseed (dev only)
```

---

*Last updated: 2026-03-26*
