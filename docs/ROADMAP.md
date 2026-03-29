# ROADMAP.md — RX Skin Feature Roadmap

> Living document. Updated as features are completed, scoped, or reprioritized.
> Track day-to-day tasks in Asana. This file captures the high-level phased plan.

---

## Current Status

**Last Completed Phase:** Phase 1A + Phase 1B + Phase 3 UI Polish + Codebase Review
**Active Priorities:** Credential Vault, Azure AD integration, Graph/Webex BFF routes
**Overall Progress:** ~50% of full vision

---

## Phase 0 — Project Setup ✅ Complete

Foundation work before any feature development.

| Task | Status | Notes |
|------|--------|-------|
| Define project scope | ✅ Done | CLAUDE.md + this roadmap |
| Architecture documented | ✅ Done | docs/ARCHITECTURE.md |
| Integrations researched | ✅ Done | docs/INTEGRATIONS.md |
| CLAUDE.md + INSTRUCTIONS.md written | ✅ Done | |
| GitHub repository created | ✅ Done | https://github.com/NBTX77/RxSkin |
| Notion workspace created | ✅ Done | Project hub, accounts registry |
| Asana project created | ✅ Done | Sprint tasks synced |
| Next.js project scaffolded | ✅ Done | App Router, TypeScript strict |
| `.env.example` populated | ✅ Done | All required keys documented |
| Prisma schema (initial) | ✅ Done | 14 models, 15 tables in Supabase |
| ConnectWise API connection tested | ✅ Done | 172 tickets, 53 projects, 740 companies verified |
| Dev environment confirmed working | ✅ Done | Vercel deployment GREEN at rxtech.app |

---

## Phase 1A — Foundation & Core Experience ✅ Complete

**Goal:** Department-routed portal with tickets, projects, schedule, and ops hub. Connected to live CW data.

### Authentication & Session Management ✅
- [x] NextAuth.js setup with username/password (Phase 1 demo credentials)
- [x] JWT session with `tenantId`, `userId`, `role`
- [x] Protected routes (middleware redirect to /login)
- [x] Logout flow via UserAvatar dropdown

### Dashboard & Navigation ✅
- [x] Department routing — DepartmentProvider, per-dept nav, dept switcher
- [x] Desktop: Collapsible left sidebar (icon rail w-12, expands w-52 on hover)
- [x] Mobile: Bottom nav bar (5 main items)
- [x] Persistent top bar with search (Ctrl+K) + UserAvatar dropdown
- [x] Dark/light theme support (ThemeProvider + class strategy)

### Ticket List & Detail ✅
- [x] Full ticket list UI (search, desktop table, mobile cards)
- [x] Ticket detail page (`/tickets/[id]`) — notes, time entries, mobile-responsive
- [x] Live CW data — ticket notes, time entries, global search
- [x] Remote tools — TicketActions, ComputerPicker, SystemInfoPanel, ScriptRunner

### Projects Board ✅
- [x] API routes (`/api/projects`, `/api/projects/[id]`)
- [x] Department-aware rendering: kanban (IT/SI), financial table (GA), portfolio heatmap (LT), read-only list (AM)
- [x] Project detail overlay
- [x] Project status pipeline (10 New → 20 Handoff → 30 PM → 31/33/34 Work → 50 Complete)

### Schedule / Calendar ✅
- [x] FullCalendar with Day/Week/2-Week/Month/List views
- [x] Drag-drop rescheduling + event resize
- [x] Schedule CRUD API (GET, POST, PATCH, DELETE)
- [x] ScheduleEventDetail overlay
- [x] Dark theme + mobile-responsive

### Ops Hub ✅
- [x] Fleet map (Samsara integration)
- [x] Analytics dashboard
- [x] Schedule hold list

### BFF API Layer ✅
- [x] CW API client + normalizers (tickets, projects, companies, members, schedule)
- [x] Automate BFF routes (computers, scripts)
- [x] Control BFF route (session GUID lookup + launch URL)
- [x] In-memory BFF cache with write-through to DB
- [x] Rate limit handling, response normalization, error handling
- [x] API call instrumentation (all 4 clients: CW, Samsara, Automate, Control)

### Database & Observability ✅
- [x] Supabase PostgreSQL — 15 tables, RLS-ready
- [x] Prisma client singleton, migration management
- [x] Write-through cache (memory → DB → API, survives Vercel cold starts)
- [x] Frontend analytics tracker (batched events, sendBeacon)
- [x] `<Tracked>` HOC + `usePageView` hook
- [x] Cron sync endpoint (Vercel cron every 5 min)

### Admin Panel ✅
- [x] Layout with sidebar nav + orange accent
- [x] Integrations — Credential Vault UI for 10 platforms
- [x] Users — role/dept badges, search/filter, add/disable
- [x] Tenant Settings — company info, board mappings, cache TTLs
- [x] AI & Bots — provider config, 4 bots, chatbot placement
- [x] Analytics — click tracking, heatmaps, AI suggestions
- [x] Audit Log — API calls, credential access, logins, admin actions

### Settings Page ✅
- [x] Tabbed layout: Profile, Appearance, Connections, Notifications
- [x] Theme toggle in Appearance tab

---

## Phase 3 UI Polish ✅ Complete (2026-03-29)

**Goal:** 15 aesthetic and UX improvements across the entire app.

| Task | Status |
|------|--------|
| Priority + status badges (pill style with dot indicators) | ✅ Done |
| Loading skeletons (ticket list, project kanban, schedule) | ✅ Done |
| Collapsible sidebar (icon rail default, hover expand overlay) | ✅ Done |
| Row hover effects + subtle animations | ✅ Done |
| Project stage badges (color-coded pipeline) | ✅ Done |
| Empty state illustrations (tickets, projects, schedule) | ✅ Done |
| Breadcrumb navigation (ticket detail, project detail) | ✅ Done |
| Accessibility pass (focus rings, aria labels, keyboard nav) | ✅ Done |
| Error boundaries with retry | ✅ Done |
| Light mode theme support (full color mapping) | ✅ Done |
| Time-based greeting in dashboard | ✅ Done |
| Collapsible sidebar persistence | ✅ Done |
| Department switcher (admin/LT only, popover on logo) | ✅ Done |
| Kanban column width fix | ✅ Done |
| Toolbar merge + column drag | ✅ Done |

---

## Phase 1B — Cross-Cutting Features ✅ Complete (2026-03-29)

**Goal:** High-value features used across IT and SI departments — timer, quick close, dispatch, team workload.

| Task | Status | Notes |
|------|--------|-------|
| Timer Widget | ✅ Done | Floating timer, TimeTrackerProvider context, localStorage persistence, idle detection, auto-pause on tab away |
| Quick Close Workflow | ✅ Done | Batch close API (POST /api/tickets/[id]/close), enhanced QuickClosePanel with time presets, work type, client notification toggle |
| Dispatch Board | ✅ Done | /dispatch route, FullCalendar resource timeline, drag-assign techs, unscheduled ticket sidebar, capacity indicators |
| Team Visibility | ✅ Done | /team route, tech workload grid, capacity bars (green/yellow/red), WorkloadSummary KPIs, department filter |

---

## Current Priorities — In Progress

These are the next items to be built, in priority order.

### Credential Vault (Security — Critical)
- [ ] Migrate env var credentials to encrypted DB (`TenantCredential` table)
- [ ] AES-256-GCM encryption for all stored credentials
- [ ] `getTenantCredentials(tenantId, platform)` resolver
- [ ] Admin UI already built — needs backend wiring

### Azure AD Integration (Auth — High)
- [ ] Register multi-tenant Azure AD app
- [ ] NextAuth Azure AD provider (replaces demo credentials)
- [ ] Single sign-on for all RX Technology techs

### Microsoft Graph BFF Routes (Integration — High)
- [ ] Graph API client (`lib/graph/client.ts`)
- [ ] Mail (read, send)
- [ ] Calendar (read/write)
- [ ] Presence (online status)
- [ ] Teams chat (read)

### Webex BFF Routes (Integration — High)
- [ ] Webex API client
- [ ] Messaging (read, send)
- [ ] Call history
- [ ] Click-to-call
- [ ] Queue stats

### User OAuth2 Connection Flow
- [ ] Settings → Connect Microsoft 365 (per-user OAuth2)
- [ ] Settings → Connect Webex (per-user OAuth2)
- [ ] Token storage in `UserOAuthToken` table (encrypted, auto-refresh)

### CW Home SSO
- [ ] Configure Azure AD as external IdP in CW Home
- [ ] ScreenConnect launch URLs work seamlessly with SSO

---

## Phase 1C — SI Department Experience (Planned)

**Goal:** Full Systems Integration department workflow — project-first kanban, job scheduling, materials tracking.

- [ ] SI-specific project kanban (primary view)
- [ ] Service queue for SI boards
- [ ] Job scheduler (SI-specific calendar views)
- [ ] Fleet map integration for SI field techs
- [ ] Materials tracking

### Department Dashboard Mockups (Created, Not Built)
5 interactive React mockups exist in `docs/mockups/`:
- `mockup-IT-Dashboard.jsx` — tickets + projects + timer
- `mockup-SI-Dashboard.jsx` — project kanban + service queue
- `mockup-AM-Dashboard.jsx` — accounts + company 360
- `mockup-GA-Dashboard.jsx` — invoices + POs + financials
- `mockup-LT-Dashboard.jsx` — exec dashboard + portfolio

Build specs created in `docs/planning/`. Implementation not started.

---

## Phase 2A — Account Management (Planned)

**Goal:** AM department experience — Company 360 view, agreements, opportunity pipeline.

- [ ] My Accounts view
- [ ] Company 360 page (contacts, agreements, SLA, tickets, devices)
- [ ] Agreement management
- [ ] Opportunity pipeline (CW Opportunities board)
- [ ] Client health scorecard

---

## Phase 2B — Accounting / Procurement (Planned)

**Goal:** G&A department experience — invoices, POs, project financials, time & billing.

- [ ] Invoice list and detail
- [ ] Purchase order management
- [ ] Project financials view (budget vs actual)
- [ ] Time & billing dashboard
- [ ] Agreement billing management
- [ ] Product catalog

---

## Phase 2C — Middleware Workflow Engine (Designed, Not Built)

**Goal:** Visual middleware workflow system in Admin Console for cross-system integration pipelines and automation.

Architecture fully designed (2026-03-28). Research document: `RX-Skin-Middleware-Workflow-Research.docx`.

### Engine Phases
| Sub-Phase | Scope | Status |
|-----------|-------|--------|
| **Phase 1 (MVP)** | React Flow canvas, workflow CRUD, BullMQ execution, manual triggers, DAG validation | Designed |
| **Phase 2 (AI)** | Claude API for NLP workflow creation, 5-10 MSP templates, AI error diagnosis | Designed |
| **Phase 3 (Advanced)** | Scheduled + webhook triggers, parallel execution, data transforms, pattern mining | Designed |
| **Phase 4 (Scale)** | Temporal.io migration (if needed), anomaly detection, execution heatmaps | Designed |

### Key Decisions
- Visual editor: React Flow (xyflow)
- Execution engine: BullMQ on Redis (Phase 1), Temporal.io considered for Phase 3+
- Node types: Trigger (green), Action (blue), Condition (orange), Transform (purple), Error Handler (red)
- Admin routes: `/admin/workflows`, `/admin/workflows/[id]/edit`, `/admin/workflows/templates`, `/admin/workflows/map`
- Security: Credentials never exposed to frontend, tenant-scoped RLS, RBAC (admin creates, tech triggers)

---

## Phase 3 — Leadership Dashboard (Planned)

**Goal:** Executive KPIs, portfolio heatmap, utilization metrics, cross-department drill-down.

- [ ] Exec dashboard with summary KPIs
- [ ] Project portfolio heatmap (all departments)
- [ ] Technician utilization report
- [ ] Financial overview (revenue, margins, billing)
- [ ] Department drill-down views

---

## Phase 4 — Company Hub & Full Integrations (Planned)

**Goal:** Rich per-company dashboard pulling data from all connected tools.

### Company Detail Page
- [ ] Overview tab: contacts, agreements, SLA status
- [ ] Tickets tab: filtered to company
- [ ] Devices tab: CW configurations + Intune devices
- [ ] Network tab: Auvik/Meraki data
- [ ] Backup tab: Datto/Acronis status
- [ ] M365 tab: users, licenses, compliance

### Additional Integrations
- [ ] Auvik API client + network health on company page
- [ ] Meraki API client + WAN status
- [ ] Datto API client + backup health
- [ ] Acronis API client + backup health
- [ ] Fortinet API client + VPN/firewall status
- [ ] SentinelOne integration
- [ ] Passportal integration (password vault per company)
- [ ] ScalePad integration (asset lifecycle, warranties)

---

## Phase 5 — Advanced Features & External Access (Future)

### Reporting & Dashboards
- [ ] Ticket aging report
- [ ] SLA compliance dashboard
- [ ] Company health scorecard
- [ ] Export to PDF / CSV

### Notifications
- [ ] In-app notification center
- [ ] Browser push notifications
- [ ] Email digest (daily/weekly)

### Time & Billing
- [ ] Time entry summary dashboard
- [ ] Billable vs non-billable breakdown
- [ ] Approval workflow

### Multi-Tenant / Client Portal
- [ ] Tenant management admin UI
- [ ] Per-tenant branding (logo, colors)
- [ ] Client login — limited view (their own tickets)
- [ ] Client approval workflow

### Mobile App (PWA)
- [ ] Progressive Web App configuration
- [ ] Offline mode: view cached tickets
- [ ] Push notifications on mobile
- [ ] Add to home screen prompt

---

## Backlog (Unscheduled)

Ideas captured for future consideration — not yet assigned to a phase.

- AI-powered ticket classification and routing
- Natural language ticket creation (voice → ticket)
- Automated ticket dispatch by technician skill/availability
- Client satisfaction surveys linked to ticket resolution
- IT documentation module (Confluence-style)
- Integration with IT Glue for documentation
- Slack/Teams notifications for ticket updates
- Two-way SMS with clients via Twilio
- Recurring maintenance schedule templates

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| v0.1.0 | 2026-03-26 | Phase 0 complete — project scaffolded, CW API connected |
| v0.1.1 | 2026-03-27 | Ticket list, detail, BFF routes, admin panel |
| v0.1.2 | 2026-03-28 | Department routing, projects board, schedule, observability |
| v0.1.3 | 2026-03-28 | Schedule calendar, cron sync, UI contrast fixes, live CW data |
| v0.2.0 | 2026-03-29 | Phase 3 UI polish complete (15 tasks), collapsible sidebar, light mode, skeletons |
| v0.2.1 | 2026-03-29 | Codebase review cleanup, known issues resolved, test infrastructure |
| v0.3.0 | 2026-03-29 | Phase 1B features: timer widget, quick close, dispatch board, team workload |
| v0.4.0 | TBD | Credential Vault + Azure AD + Graph/Webex integration |
| v1.0.0 | TBD | Full production release |

---

*Last updated: 2026-03-29*
