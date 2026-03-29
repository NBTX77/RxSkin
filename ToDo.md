# ToDo — RX Skin Deep Review Action Items

> **Purpose:** Shared task list between Claude Code (local) and Cowork (cloud) for addressing codebase review findings.
> **Generated:** 2026-03-28 from deep codebase review.
> **Last Updated:** 2026-03-28 — Sprint 1–5 complete (except 3 deferred items).
> **Project:** RX Skin — ConnectWise Modern Frontend Portal
> **Repo:** https://github.com/NBTX77/RxSkin

---

## Working Model

- **Claude Code (Local):** File edits, git operations, local testing, Vercel/Supabase MCP actions
- **Cowork (Cloud):** Code generation, refactoring large files, research, architecture decisions, documentation

Both agents should read `CLAUDE.md` at session start and check this file for current priorities.

---

## Progress Overview

| Sprint | Items | Status |
|--------|-------|--------|
| **Sprint 1 (Critical Security)** | 1, 2, 3, 5 | ✅ COMPLETE |
| **Sprint 2 (Stability)** | 4, 6, 8 | ✅ COMPLETE |
| **Sprint 3 (UX/Accessibility)** | 7, 10, 17, 18, 19 | ✅ COMPLETE |
| **Sprint 4 (Scale/Polish)** | 11, 13, 15 | ✅ COMPLETE |
| **Sprint 5 (Architecture)** | 14, 22 | ✅ COMPLETE |
| **Deferred** | 9, 12, 16, 20, 21 | ⏳ BACKLOG |

**Completed:** 17/22 items (77%)
**Commits:** `8f71b03` (Sprint 1+2), `f2ca716` (Sprint 3–5) — both pushed to `main`.

---

## Completed Items

### Sprint 1 — Critical Security ✅

#### 1. Encrypted Credential Storage — DONE ✓
- Rewrote `credentials.ts` with PBKDF2 key derivation (100k iterations), 3-tier credential resolution (TenantCredential table → Tenant table → env var fallback in dev only).
- **Files:** `src/lib/auth/credentials.ts`

#### 2. Login Rate Limiting — DONE ✓
- Added IP-based sliding window rate limiter (5 attempts/15 min) to NextAuth authorize callback. Auto-purges stale entries every 5 min.
- **Files:** `src/lib/auth/config.ts`

#### 3. CW OData Filter Injection — DONE ✓
- Created `escapeCwFilter()` utility that escapes backslashes and double quotes. Applied to all 10+ string filter interpolations in CW client.
- **Files:** `src/lib/cw/client.ts`

#### 5. Mock Data Fallback → 503 — DONE ✓
- All 8 API routes now return `503 Service Unavailable` when CW credentials are missing. Removed ~250 lines of inline mock data.
- **Files:** 8 API route files in `src/app/api/`

### Sprint 2 — Stability ✅

#### 4. React Error Boundaries — DONE ✓
- Created reusable `<ErrorBoundary>` with fallback UI and "Try again" button. Wrapped all DashboardShell sections.
- **Files:** `src/components/ui/ErrorBoundary.tsx`, `src/components/layout/DashboardShell.tsx`

#### 6. Security Headers — DONE ✓
- Added CSP, X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, Permissions-Policy via `next.config.js`.
- **Files:** `next.config.js`

#### 8. Input Validation Standardization — DONE ✓
- Added Zod schemas to 3 POST/PATCH routes: schedule create, schedule reschedule, analytics events.
- **Files:** `src/app/api/schedule/route.ts`, `src/app/api/schedule/[id]/route.ts`, `src/app/api/analytics/event/route.ts`

### Sprint 3 — UX/Accessibility ✅

#### 7. Accessibility Fixes — DONE ✓ (f2ca716)
- 24 accessibility issues fixed across 10 components:
  - `role="dialog"` + `aria-modal="true"` on all modals (QuickClosePanel, ComputerPicker, ScriptRunner, ScheduleEventDetail, GlobalSearch, ProjectDetailOverlay)
  - `aria-label` on all icon-only buttons (OpsHeader refresh, close buttons, view toggles)
  - `sr-only` labels on all search inputs (GlobalSearch, TechSidebar, ComputerPicker, ScriptRunner, TicketListClient)
  - Priority dots: `role="img" aria-label="Priority: ${priority}"` replacing `title` attribute
- **Files:** 10 component files

#### 10. Code Splitting / Lazy Loading — DONE ✓ (f2ca716)
- ScheduleCalendar and AnalyticsDashboard wrapped with `next/dynamic` for lazy loading.
- FleetMap already used `next/dynamic` — no changes needed.
- **Files:** `src/app/(dashboard)/schedule/page.tsx`, `src/app/(dashboard)/ops/analytics/page.tsx`

#### 17. QuickClosePanel API Wiring — DONE ✓ (f2ca716)
- `onConfirm` now calls: PATCH `/api/tickets/{id}` (close status) + POST `/api/tickets/{id}/notes` (resolution note) + POST `/api/tickets/{id}/time-entries` (log time).
- Added POST handler to notes route with Zod validation.
- Added POST handler to time-entries route with Zod validation.
- Added `createTimeEntry()` to CW client.
- **Files:** `src/components/tickets/TicketDetail.tsx`, `src/app/api/tickets/[id]/notes/route.ts`, `src/app/api/tickets/[id]/time-entries/route.ts`, `src/lib/cw/client.ts`

#### 18. Ticket Detail Quick Actions — DONE ✓ (f2ca716)
- **Change Status:** Inline dropdown with 6 statuses (New, In Progress, Waiting on Client, Scheduled, Resolved, Closed) — patches via JSON Patch API.
- **Add Time Entry:** Inline form with hours input + notes field, posts to `/api/tickets/{id}/time-entries`.
- **Escalate:** Sets priority to Critical + adds internal note. Disabled when already Critical.
- **Add Note:** Wired to POST `/api/tickets/{id}/notes` with internal flag from checkbox.
- Removed unused `QuickAction` stub component.
- **Files:** `src/components/tickets/TicketDetail.tsx`

#### 19. Schedule Date Selection — DONE ✓ (f2ca716)
- Date selection on calendar opens create entry dialog with ticket ID + member ID inputs.
- Uses existing `useCreateScheduleEntry` hook from `hooks/useScheduleEntries.ts`.
- **Files:** `src/components/schedule/ScheduleCalendar.tsx`

### Sprint 4 — Scale/Polish ✅

#### 11. React.memo for Card Components — DONE ✓ (f2ca716)
- Wrapped 6 card components with `React.memo`: TicketCard, TechCard, ProjectCard, ScheduleHoldCard, StatCard, KpiCard.
- **Files:** 6 component files

#### 13. Request Retry with Backoff — DONE ✓ (f2ca716)
- `cwFetch` now retries up to 3 times on 429 (rate limit) and 5xx server errors.
- Exponential backoff with jitter (500ms base). Rate limit errors use `Retry-After` header value.
- **Files:** `src/lib/cw/client.ts`

#### 15. Remove `any` Types — DONE ✓ (f2ca716)
- Eliminated all 5 `any` instances in the codebase:
  - NextAuth callbacks: proper `JWT`, `Session`, `User` types replacing `any` params.
  - Automate normalizers: `Record<string, unknown>` + `prop()`/`sub()` helpers for PascalCase/camelCase API field access.
  - Control normalizer: `Record<string, unknown>` with explicit field casts.
- **Files:** `src/lib/auth/config.ts`, `src/lib/automate/client.ts`, `src/lib/control/client.ts`

### Sprint 5 — Architecture (Partial) ✅

#### 14. Distributed Trace IDs — DONE ✓ (f2ca716)
- Middleware generates compact trace ID per request (base36 timestamp + random suffix).
- Attached to response as `x-trace-id` header for request correlation.
- **Files:** `src/middleware.ts`

#### 22. CORS Configuration — DONE ✓ (f2ca716)
- Added API-specific CORS headers in `next.config.js` restricting `/api/*` to same-origin (`NEXTAUTH_URL` or `https://rxtech.app`).
- Methods: GET, POST, PATCH, DELETE, OPTIONS. Max-Age: 86400.
- **Files:** `next.config.js`

---

## Deferred Items (Backlog)

### 9. List Virtualization
- **Priority:** MEDIUM
- **Blocked:** Requires `npm install @tanstack/react-virtual` (can't run in current env)
- **Location:** `src/components/tickets/TicketListClient.tsx`
- **Fix:** Add `@tanstack/react-virtual` for ticket list, note list, time entry list. Or implement server-side pagination.

### 12. Batch API Call Logging
- **Priority:** MEDIUM
- **Location:** `src/lib/instrumentation/api-logger.ts`
- **Problem:** Individual Prisma insert per API call. At scale, creates DB write pressure.
- **Fix:** Batch inserts (flush every 5s or 25 events, similar to analytics tracker pattern).

### 16. Unsafe Type Casts
- **Priority:** LOW
- **Examples:** `(process.env.DEV_DEPARTMENT as DepartmentCode)`, `info.event.extendedProps.entry as ScheduleEntry`
- **Fix:** Add runtime validation or type guards.

### 20. Multi-Tenant Credential Resolution
- **Priority:** MEDIUM (unblocked by Item #1)
- **Problem:** `getDefaultTenantId()` caches first tenant forever. Production needs per-request tenant resolution from JWT session.
- **Fix:** Resolve tenant from JWT session, look up encrypted credentials in DB per request.

### 21. JWT Session Refresh
- **Priority:** MEDIUM
- **Problem:** 8-hour JWT with no refresh mechanism. No explicit logout invalidation.
- **Fix:** Implement refresh token rotation or sliding session window.

---

## Summary Metrics

| Category | Items | Done | Remaining |
|----------|-------|------|-----------|
| Security | 6 | 6 | 0 |
| Stability | 2 | 2 | 0 |
| Performance | 3 | 2 | 1 (virtualization) |
| Reliability | 3 | 1 | 2 (batch logging, type casts) |
| TypeScript | 2 | 1 | 1 (unsafe casts) |
| Incomplete Features | 3 | 3 | 0 |
| Architecture | 3 | 2 | 1 (multi-tenant creds) |
| **Total** | **22** | **17** | **5** |

---

*Generated by Claude Code deep review — 2026-03-28*
*Sprint 1+2: commit 8f71b03 — Sprint 3–5: commit f2ca716*
