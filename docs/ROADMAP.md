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
| **Phase 3 (Advanced)** | Scheduled + webhook triggers, parallel execution, data transforms | Designed |
| **Phase 4 (Scale)** | Temporal.io migration, anomaly detection, multi-tenant sharing | Designed |

---

## Phase 17 — SmileBack CSAT/NPS Integration (Planned — 2026-03-29)

**Goal:** Integrate SmileBack customer satisfaction data (CSAT + NPS) throughout the dashboard. Surface on tickets, per-tech, per-company, executive dashboard, and Account Management CBR views.

| Task | Description | Status |
|------|------------|--------|
| Task 68 | SmileBack BFF client + types + normalizers | Pending |
| Task 69 | SmileBack BFF API routes (5 endpoints + batch) | Pending |
| Task 70 | SmileBack React hooks (TanStack Query) | Pending |
| Task 71 | Ticket detail — survey response card | Pending |
| Task 72 | Ticket list — survey badge icons | Pending |
| Task 73 | Executive dashboard — CSAT/NPS KPI cards + charts | Pending |
| Task 74 | Tech performance — CSAT per tech on /team + My Day | Pending |
| Task 75 | CBR dashboard — per-client CSAT/NPS for AMs | Pending |
| Task 76 | SmileBack webhook receiver + local DB cache | Pending |
| Task 77 | Admin integration card (Credential Vault) | Pending |
| Task 78 | Deploy + update all documentation | Pending |

### Key Design Decisions
- SmileBack API is **read-only** — data flows SmileBack → RX Skin (never the other way)
- BFF cache: 5 min for reviews, 10 min for summaries
- Webhook receiver stores survey responses in local `SurveyResponse` Prisma table for fast access
- CSAT integrated into ScalePad health score at 20% weight for CBR reports
- Batch endpoint for ticket list badges (avoids N+1 API calls)
---

## Phase 18 — Cisco Meraki MSP Dashboard (Planned — 2026-03-29)

**Goal:** Build a full Meraki network monitoring dashboard inside the IT department section. One API key covers all customer organizations. Dashboard surfaces device health, WAN uplinks, wireless stats, alerts, licensing, and firmware status across all managed orgs.

| Task | Description | Status |
|------|------------|--------|
| Task 79 | Meraki BFF client + TypeScript types (Bearer auth, 429 retry, Link header pagination) | Pending |
| Task 80 | Meraki BFF API routes (14 endpoints + dashboard aggregation) | Pending |
| Task 81 | Meraki React hooks (TanStack Query, 13 hooks) | Pending |
| Task 82 | Meraki dashboard page + sidebar nav (7 tabs: Overview, Devices, Networks, Alerts, WAN, Wireless, Licensing) | Pending |
| Task 83 | Meraki device detail overlay (switch ports, appliance uplinks, AP SSIDs) | Pending |
| Task 84 | Meraki network detail view (clients, wireless stats, device list) | Pending |
| Task 85 | Meraki org selector + cross-org aggregation | Pending |
| Task 86 | Meraki webhook receiver (HMAC-SHA256 verification) | Pending |
| Task 87 | Meraki admin integration card (Credential Vault) | Pending |
| Task 88 | Meraki cron sync + BFF cache layer | Pending |
| Task 89 | Deploy + update all documentation | Pending |

### Key Design Decisions
- **Single API key = all orgs** — MSP pattern; one Bearer token covers every customer organization
- **Org-level endpoints preferred** — `/organizations/{orgId}/devices/statuses` instead of per-device calls (10x more efficient)
- **Rate limit per-org** — 10 req/sec per org; stagger requests across orgs for MSP scale
- **RFC 5988 pagination** — Link headers, NOT JSON body metadata; must parse response headers
- **IT + LT sidebar nav** — `/meraki` route visible to IT and Leadership departments
- **Cache TTLs:** Device statuses 5min, orgs 1hr, licensing 24hr, alerts 2min
- **Webhook receiver** for real-time device offline/online alerts (reduces polling)
- **Cross-CW integration planned** — Map Meraki orgId → CW companyId for client-level network health
- **Dummy data mode (toggleable)** — All API routes fall back to realistic mock data when credentials aren't configured OR when demo mode is explicitly enabled via Admin → Integrations → Meraki card. Demo toggle persists in localStorage + cookie (server-readable). Amber "DEMO" badge shown in dashboard header when active.
- **Admin credential management** — Meraki API key configurable from Admin → Integrations (existing PlatformDef pattern). Test connection validates against `GET /organizations`. No env vars required — admin UI is the primary config path.
