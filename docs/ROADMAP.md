# ROADMAP.md — RX Skin Feature Roadmap

> Living document. Updated as features are completed, scoped, or reprioritized.
> Track day-to-day tasks in Asana. This file captures the high-level phased plan.

---

## Current Status

**Active Phase:** Phase 1 — Foundation & Core Ticketing
**Phase 1 Target Completion:** TBD
**Overall Progress:** 0% (project kickoff)

---

## Phase 0 — Project Setup ✅ In Progress

Foundation work before any feature development.

| Task | Status | Notes |
|------|--------|-------|
| Define project scope | ✅ Done | This roadmap |
| Architecture documented | ✅ Done | docs/ARCHITECTURE.md |
| Integrations researched | ✅ Done | docs/INTEGRATIONS.md |
| CLAUDE.md + INSTRUCTIONS.md written | ✅ Done | |
| GitHub repository created | ⬜ Pending | |
| Notion workspace created | ⬜ Pending | |
| Asana project created | ⬜ Pending | |
| Next.js project scaffolded | ⬜ Pending | |
| `.env.example` populated | ⬜ Pending | |
| Prisma schema (initial) | ⬜ Pending | |
| ConnectWise API connection tested | ⬜ Pending | |
| Dev environment confirmed working | ⬜ Pending | |

---

## Phase 1 — Foundation & Core Ticketing

**Goal:** A working portal where technicians can view, create, edit, and manage service tickets. Mobile-friendly. Authenticated. Connected to real CW data.

### 1.1 Authentication & Session Management
- [ ] NextAuth.js setup with username/password
- [ ] JWT session with `tenantId`, `userId`, `role`
- [ ] Protected routes (middleware redirect to /login)
- [ ] Logout flow
- [ ] Session expiry handling
- [ ] "Remember me" option

### 1.2 Dashboard / Home
- [ ] Home page with summary widgets:
  - Open tickets count (by priority)
  - My tickets today
  - Schedule overview (today's entries)
  - Recent activity feed
- [ ] Responsive layout (desktop sidebar + mobile bottom nav)
- [ ] Theming: Dark mode + Light mode toggle
- [ ] Loading skeletons for all data widgets

### 1.3 Ticket List
- [ ] Ticket list page with filters:
  - Status (New / In Progress / Resolved / Closed)
  - Board
  - Priority
  - Assigned to (technician)
  - Company
  - Date range
- [ ] Search by ticket number or keyword
- [ ] Sortable columns
- [ ] Pagination (infinite scroll on mobile, paginated on desktop)
- [ ] Quick status update from list (dropdown inline)
- [ ] Bulk actions: assign, close, update status
- [ ] Mobile card layout vs desktop table layout
- [ ] Save filter presets

### 1.4 Ticket Detail
- [ ] Full ticket view:
  - Summary, status, priority, board
  - Assigned technician + company + contact
  - Description / internal notes
  - Time entries
  - Attachments
- [ ] Add note (internal / external toggle)
- [ ] Log time entry (hours + work type)
- [ ] Update status, priority, assignment inline
- [ ] Ticket history / audit log
- [ ] Mobile-optimized layout

### 1.5 Create Ticket
- [ ] New ticket form:
  - Company search (type-ahead)
  - Contact search (filtered by company)
  - Summary
  - Description
  - Board
  - Priority
  - Status
  - Assigned technician
- [ ] "Quick ticket" mode — minimal fields, fast submit
- [ ] Save draft functionality
- [ ] Form validation with clear error messages
- [ ] Mobile-friendly form layout

### 1.6 ConnectWise API Layer (BFF)
- [ ] CW API client (`lib/cw/client.ts`)
- [ ] Auth header injection middleware
- [ ] API routes for:
  - `GET /api/tickets` — list
  - `GET /api/tickets/[id]` — detail
  - `POST /api/tickets` — create
  - `PATCH /api/tickets/[id]` — update
  - `POST /api/tickets/[id]/notes` — add note
  - `GET /api/companies` — list
  - `GET /api/members` — list techs
- [ ] In-memory BFF cache with TTL
- [ ] Rate limit handling (retry on 429)
- [ ] Response normalization
- [ ] Error handling + consistent error shapes

### 1.7 Database (Prisma + PostgreSQL)
- [ ] Prisma schema: Tenant, User, CachedTicket, AuditLog
- [ ] Row-Level Security policies
- [ ] Database seeder for dev data
- [ ] Migration management workflow

### 1.8 Testing
- [ ] Unit tests for CW API client
- [ ] Unit tests for data normalizers
- [ ] Integration tests for all API routes
- [ ] E2E test: login → view ticket → update status
- [ ] E2E test: create ticket end-to-end

---

## Phase 2 — Scheduling & Calendar

**Goal:** Drag-and-drop schedule management. Techs can view and reschedule work visually.

### 2.1 Schedule Views
- [ ] FullCalendar integration
- [ ] Day view
- [ ] Week view
- [ ] 2-Week view (custom — FullCalendar doesn't have this natively)
- [ ] Month view
- [ ] Agenda/list view (mobile default)
- [ ] Filter by technician
- [ ] Color-coded by ticket priority / type

### 2.2 Drag and Drop
- [ ] Drag ticket to reschedule (time change)
- [ ] Resize event to change duration
- [ ] Drag unscheduled ticket from queue onto calendar
- [ ] Optimistic updates (UI responds instantly)
- [ ] Rollback on API failure
- [ ] Touch support (mobile drag and drop)

### 2.3 Unscheduled Ticket Queue
- [ ] Sidebar panel showing unscheduled open tickets
- [ ] Sort by priority, age, company
- [ ] Drag from queue → drop on calendar → creates schedule entry
- [ ] Collapse/expand on mobile

### 2.4 Quick Actions from Calendar
- [ ] Click event → mini-popup with ticket summary + quick actions
- [ ] "Open ticket" → navigate to ticket detail
- [ ] "Mark complete" → update status from calendar
- [ ] "Reassign" → change tech from calendar

### 2.5 Schedule API Layer
- [ ] `GET /api/schedule` — list entries (date range)
- [ ] `POST /api/schedule` — create entry
- [ ] `PATCH /api/schedule/[id]` — reschedule
- [ ] `DELETE /api/schedule/[id]` — remove

### 2.6 Microsoft Graph Integration (M365)
- [ ] Per-tenant Azure AD credentials storage
- [ ] Graph API client (`lib/graph/client.ts`)
- [ ] Company detail page: M365 user list
- [ ] Company detail page: license usage widget
- [ ] Company detail page: Intune device list
- [ ] API routes for Graph data

---

## Phase 3 — Company Hub & Integrations Dashboard

**Goal:** Each client company has a rich dashboard pulling data from all connected tools.

### 3.1 Company List & Search
- [ ] Company list with search
- [ ] Company type filter (managed, prospect, etc.)
- [ ] Quick stats per company card (open tickets, device count)

### 3.2 Company Detail Page
- [ ] Overview tab: contacts, agreements, SLA status
- [ ] Tickets tab: tickets filtered to company
- [ ] Devices tab: CW configurations + Intune devices
- [ ] Network tab: Auvik/Meraki data (if connected)
- [ ] Backup tab: Datto/Acronis status (if connected)
- [ ] M365 tab: users, licenses, compliance

### 3.3 RMM Integration (CW Automate)
- [ ] Automate API client
- [ ] Agent status on company page
- [ ] Alert badges for offline agents
- [ ] Patch compliance widget

### 3.4 Network Monitoring (Auvik)
- [ ] Auvik API client
- [ ] Network health summary on company page
- [ ] Alert count badge
- [ ] "View in Auvik" deep link

### 3.5 Network Monitoring (Meraki)
- [ ] Meraki API client
- [ ] WAN uplink status on company page
- [ ] Connected client count
- [ ] "View in Meraki" deep link

### 3.6 Backup Status (Datto)
- [ ] Datto API client
- [ ] Backup health badge (good / warning / critical)
- [ ] Last backup time
- [ ] "View in Datto" deep link

### 3.7 Backup Status (Acronis)
- [ ] Acronis API client
- [ ] Same health badge pattern as Datto

### 3.8 Firewall Status (Fortinet)
- [ ] Fortinet API client
- [ ] VPN tunnel health
- [ ] CPU/memory status

### 3.9 Phone System (Webex Calling)
- [ ] Webex OAuth flow
- [ ] View call queues per client
- [ ] View/edit call forwarding
- [ ] User extension management

---

## Phase 4 — Advanced Features & External Access

**Goal:** Power-user features, client-facing portal option, and remaining integrations.

### 4.1 Passportal Integration
- [ ] iframe embed per company
- [ ] "Passwords" tab on company detail page
- [ ] Single sign-on linkage if ever supported

### 4.2 Scalepad Integration
- [ ] Webhook receiver for lifecycle events
- [ ] Asset warranty status on company page
- [ ] Expiring warranty alerts
- [ ] CSV export sync (automated)

### 4.3 Reporting & Dashboards
- [ ] Technician utilization report
- [ ] Ticket aging report
- [ ] SLA compliance dashboard
- [ ] Company health scorecard
- [ ] Export to PDF / CSV

### 4.4 Notifications
- [ ] In-app notification center
- [ ] Browser push notifications (opt-in)
- [ ] Email digest (daily/weekly)
- [ ] Webhook triggers for external tools

### 4.5 Time & Billing
- [ ] Time entry summary dashboard
- [ ] Billable vs non-billable breakdown
- [ ] Approval workflow for time entries
- [ ] Export to ConnectWise invoicing

### 4.6 Multi-Tenant / Client Portal
- [ ] Tenant management admin UI
- [ ] Per-tenant branding (logo, colors)
- [ ] Client login — limited view (their own tickets, status)
- [ ] Client approval workflow for completed work

### 4.7 Mobile App (PWA)
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
- IT documentation module (Confluence-style, replacing some Passportal use cases)
- Integration with IT Glue for documentation
- Slack/Teams notifications for ticket updates
- Two-way SMS with clients via Twilio
- Recurring maintenance schedule templates

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| v0.1.0 | TBD | Phase 1 complete — core ticketing |
| v0.2.0 | TBD | Phase 2 complete — scheduling |
| v0.3.0 | TBD | Phase 3 complete — company hub |
| v1.0.0 | TBD | Phase 4 complete — production release |

---

*Last updated: 2026-03-26*
