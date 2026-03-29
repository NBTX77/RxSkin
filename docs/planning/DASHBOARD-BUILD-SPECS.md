# Department Dashboard Build Specs
> Generated from mockups at docs/mockups/. Each spec translates an interactive React mockup into production components.
> All mockups are dark-only — production code MUST follow light/dark theming rules from CLAUDE.md.
> Audited 2026-03-29.

---

## IT Dashboard (mockup-IT-Dashboard.jsx)
**Route:** `/dashboard` (default for IT dept)
**Components:**
- `src/components/dashboard/ITDashboard.tsx` — main container (replaces or extends MyDayClient for IT users)
- `src/components/dashboard/TicketQueue.tsx` — filterable ticket list with board tabs (All/Managed Services/Engineering/Alerts/Installations)
- `src/components/dashboard/ScheduleSidebar.tsx` — today's schedule entries with ticket refs
- `src/components/dashboard/ActiveProjects.tsx` — project cards with progress bars + "Log Time" button
- `src/components/dashboard/TimerWidget.tsx` — floating real-time timer (active ticket #, elapsed, pause/resume)
**Data:** `/api/tickets` (filtered by assigned member + board), `/api/schedule` (today), `/api/projects` (assigned), `/api/time-entries` (active)
**Mockup KPIs:** My Open Tickets (12), Unassigned/New (27), In Progress (34), Critical/High (15), My Active Projects (3)

---

## SI Dashboard (mockup-SI-Dashboard.jsx)
**Route:** `/dashboard` (default for SI dept)
**Components:**
- `src/components/dashboard/SIDashboard.tsx` — main container
- `src/components/dashboard/ProjectPipeline.tsx` — horizontal kanban (New→Incomplete Handoff→Assigned to PM→In Service→Completed) with PM avatar, budget bars, stage badges
- `src/components/dashboard/ServiceQueue.tsx` — SI service ticket cards with priority/company/tech/scheduled time
- `src/components/dashboard/FleetMapPreview.tsx` — compact fleet map showing "4 techs in field | 2 en route"
- `src/components/dashboard/MaterialTracking.tsx` — material/parts status per project
**Data:** `/api/projects` (SI boards), `/api/tickets` (SI Service/Security/Communication boards), `/api/fleet` (vehicle locations)
**Mockup KPIs:** Active Service Calls (20), Active Projects (23), In PM Stage (17), Budget Utilization (73%), Overdue/Waiting (3)

---

## AM Dashboard (mockup-AM-Dashboard.jsx)
**Route:** `/dashboard` (default for AM dept)
**Components:**
- `src/components/dashboard/AMDashboard.tsx` — main container
- `src/components/dashboard/MyAccounts.tsx` — account list with search/sort, health score dots (green/yellow/red)
- `src/components/dashboard/OpportunityPipeline.tsx` — kanban (New/Assigned/In Progress) for CW opportunities
- `src/components/dashboard/AgreementExpirations.tsx` — upcoming agreement expirations with countdown
- `src/components/dashboard/ActivityFeed.tsx` — recent actions across accounts
**Data:** `/api/companies` (assigned accounts), CW opportunities API, `/api/agreements` (new BFF route needed)
**Mockup KPIs:** Active Opportunities (4), Pipeline Value ($420K), Agreements Expiring (7), Incomplete Handoffs (3)

---

## GA Dashboard (mockup-GA-Dashboard.jsx)
**Route:** `/dashboard` (default for GA dept)
**Components:**
- `src/components/dashboard/GADashboard.tsx` — main container
- `src/components/dashboard/InvoiceTracker.tsx` — invoice list with filter pills (All/Sent/Overdue/Paid), aging indicators
- `src/components/dashboard/ProcurementPipeline.tsx` — procurement ticket cards (Requested→Ordered→Confirmed→Received)
- `src/components/dashboard/BudgetSummary.tsx` — project budget/actual/variance with utilization bars
- `src/components/dashboard/POManagement.tsx` — purchase order list
**Data:** CW invoices API (new BFF route), CW purchase orders API (new BFF route), `/api/projects` (budget data)
**Mockup KPIs:** Open Invoices ($287K), Overdue Invoices (8), Open POs (3), Over Budget (4), Pending Procurement (5)

---

## LT Executive Dashboard (mockup-LT-Dashboard.jsx)
**Route:** `/dashboard` (default for LT dept)
**Components:**
- `src/components/executive/ExecutiveDashboard.tsx` — main container
- `src/components/executive/KpiStrip.tsx` — 6 KPI cards (Open Tickets, Active Projects, Monthly Revenue, Utilization Rate, Projects Over Budget, SLA Compliance)
- `src/components/executive/DepartmentPerformanceCards.tsx` — 4 dept cards with trend indicators, clickable drill-down
- `src/components/executive/ProjectHealthMatrix.tsx` — color-coded heatmap (on-track/watch/over-budget) grouped by dept
- `src/components/executive/UtilizationChart.tsx` — recharts BarChart with 100% threshold line
- `src/components/executive/RecentHighlights.tsx` — activity feed (completions, budget alerts, SLA, escalations)
**Data:** Aggregates from all other dept endpoints + `/api/schedule` (utilization calc)
**Mockup KPIs:** Open Tickets (173), Active Projects (53), Monthly Revenue ($148K), Utilization Rate (76%), Projects Over Budget (4), SLA Compliance (94%)

---

## Cross-Cutting: Timer Widget (appears in IT, SI, and Licorice specs)
**Reference:** Licorice Feature Plan § Auto Time Tracking
**Architecture:** TimeTrackerProvider (React Context) → TimerWidget (floating) → BFF POST /api/time-entries
**Priority:** Build once, use across IT and SI dashboards
**Key features:** Start/pause/resume, active ticket #, elapsed time display, localStorage persistence, idle detection, auto-start on ticket open
