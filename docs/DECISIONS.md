# Architectural Decisions Log

> Key technical decisions for the RX Skin project, with rationale.

---

## 1. Next.js App Router (2026-03-26)

**Decision:** Use Next.js 14+ with App Router

**Why:** SSR, Server Components, API routes as BFF, Vercel-native deployment, file-based routing

---

## 2. BFF Pattern (2026-03-26)

**Decision:** All external API calls go through Next.js API routes (Backend for Frontend)

**Why:** API key security (never exposed to browser), rate limit management, response normalization, caching layer, tenant-aware credential injection

---

## 3. FullCalendar over react-big-calendar (2026-03-28)

**Decision:** Use FullCalendar React for schedule views

**Why:** Professional mobile drag-drop, Day/Week/2-Week/Month/List views out of box, event resize, good dark mode support, MIT license

---

## 4. PostgreSQL + RLS over per-tenant DBs (2026-03-26)

**Decision:** Single PostgreSQL database with Row Level Security

**Why:** Simpler operations, scales to thousands of tenants, tenant_id on every table, Supabase provides managed Postgres with RLS policies built in

---

## 5. Multi-tenant from Day One (2026-03-26)

**Decision:** Design for multi-tenancy even though Phase 1 is single-tenant

**Why:** Retrofitting multi-tenancy is extremely painful. tenant_id in every query, cache keys namespaced, credentials per tenant — all easier to build in from the start

---

## 6. React Flow for Middleware Workflows (2026-03-28)

**Decision:** Use React Flow (xyflow) for visual workflow editor

**Why:** MIT licensed, node-based canvas fits the integration pipeline UX, integrates cleanly with Next.js + Tailwind + shadcn/ui ecosystem

---

## 7. BullMQ for Workflow Execution Phase 1 (2026-03-28)

**Decision:** Use BullMQ on Redis for workflow execution engine

**Why:** Much simpler than Temporal.io for Phase 1, proven Redis-backed job queue, supports DAG workflows, can migrate to Temporal later if scale demands it

---

## 8. Two-Tier Auth Model (2026-03-28)

**Decision:** Service account credentials (Tier 1) + per-user OAuth2 (Tier 2)

**Why:** Most integrations (CW, Automate, Control, Auvik, SentinelOne) use org-level API keys. Only Microsoft Graph and Webex require per-user consent. Two tiers keep the common case simple.

---

## 9. Azure AD as Primary IdP (2026-03-28)

**Decision:** Register one multi-tenant Azure AD app for auth + Graph API

**Why:** Single sign-on for all techs, enables Graph API access, CW Home SSO compatibility

---

## 10. Collapsible Sidebar (2026-03-29)

**Decision:** Icon rail (w-12) by default, expands to w-52 on hover (overlay, not push)

**Why:** Maximizes content area for data-dense views (kanban, calendar, tables). Overlay prevents layout shift. Fixed-width icon slots keep alignment stable.

---

## 11. Department-Based Architecture (2026-03-28)

**Decision:** Route users to department-specific dashboards and nav based on CW member defaultDepartment

**Why:** 5 departments (IT, SI, AM, GA, LT) have fundamentally different workflows. A single dashboard can't serve a technician and an accountant equally. Per-dept nav, board filtering, and view defaults reduce cognitive load.

---

## 12. Floating Timer Widget with React Context (2026-03-29)

**Decision:** TimeTrackerProvider as React Context with localStorage persistence, not server-side state

**Why:** Timer needs sub-second UI updates (every 1s tick). Server round-trips would add latency. localStorage survives page refreshes and tab closes. visibilitychange API handles idle detection. Time entry is only POSTed to CW when the user stops the timer — not on every tick.

---

## 13. Batch Close API Pattern (2026-03-29)

**Decision:** Single POST /api/tickets/[id]/close endpoint orchestrates status + time + note + notification

**Why:** Closing a ticket in CW requires 3-4 separate API calls (status PATCH, time entry POST, note POST, client notification). A batch endpoint gives the frontend one call with one loading state, and the server handles partial failures gracefully (returns per-action success/failure).

---

## 14. FullCalendar Resource Timeline for Dispatch (2026-03-29)

**Decision:** Use @fullcalendar/resource-timeline for the dispatch board instead of a custom grid

**Why:** Resource timeline provides drag-between-rows (reassign tech), external event drops (schedule unscheduled tickets), and resize — all out of box. Building this from scratch with dnd-kit would take weeks. Same FullCalendar ecosystem as the existing schedule page.
