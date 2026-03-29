# ToDo — RX Skin Deep Review Action Items

> **Purpose:** Shared task list between Claude Code (local) and Cowork (cloud) for addressing codebase review findings.
> **Generated:** 2026-03-28 from deep codebase review.
> **Last Updated:** 2026-03-28 — Sprint 1 + Sprint 2 complete.
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
| **Sprint 1 (Critical Security)** | 1, 2, 3, 5 | COMPLETE |
| **Sprint 2 (Stability)** | 4, 6, 8 | COMPLETE |
| **Sprint 3 (UX/Accessibility)** | 7, 9, 10, 17, 18, 19 | NOT STARTED |
| **Sprint 4 (Scale/Polish)** | 11, 12, 13, 15, 16 | NOT STARTED |
| **Sprint 5 (Architecture)** | 14, 20, 21, 22 | NOT STARTED |

**Completed:** 7/22 items (32%) — all Critical + High security items resolved.
**Commit:** `8f71b03` — pushed to `main` on 2026-03-28.

---

## Completed Items

### 1. Encrypted Credential Storage — DONE ✓ (2026-03-28)
- **What was done:** Rewrote `credentials.ts` with PBKDF2 key derivation (100k iterations), 3-tier credential resolution (TenantCredential table → Tenant table → env var fallback in dev only).
- **Files:** `src/lib/auth/credentials.ts`

### 2. Login Rate Limiting — DONE ✓ (2026-03-28)
- **What was done:** Added IP-based sliding window rate limiter (5 attempts/15 min) to NextAuth authorize callback. Auto-purges stale entries every 5 min. Clears on successful login.
- **Files:** `src/lib/auth/config.ts`

### 3. CW OData Filter Injection — DONE ✓ (2026-03-28)
- **What was done:** Created `escapeCwFilter()` utility that escapes backslashes and double quotes. Applied to all 10+ string filter interpolations in CW client.
- **Files:** `src/lib/cw/client.ts`

### 4. React Error Boundaries — DONE ✓ (2026-03-28)
- **What was done:** Created reusable `<ErrorBoundary>` class component with fallback UI and "Try again" button. Wrapped Sidebar, TopBar, page content, MobileNav, and GlobalSearch in DashboardShell.
- **Files:** `src/components/ui/ErrorBoundary.tsx`, `src/components/layout/DashboardShell.tsx`

### 5. Mock Data Fallback → 503 — DONE ✓ (2026-03-28)
- **What was done:** All 8 API routes now return `503 Service Unavailable` with `{ code: 'SERVICE_UNAVAILABLE', message: 'ConnectWise API not configured', retryable: false }` when CW credentials are missing. Removed ~250 lines of inline mock data from project routes. Removed mock-data imports from 6 routes.
- **Files:** 8 API route files in `src/app/api/`

### 6. Security Headers — DONE ✓ (2026-03-28)
- **What was done:** Added CSP, X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy (strict-origin-when-cross-origin), Permissions-Policy (camera/mic/geo/payment denied), frame-ancestors 'none' via `next.config.js` headers.
- **Files:** `next.config.js`

### 8. Input Validation Standardization — DONE ✓ (2026-03-28)
- **What was done:** Added Zod schemas to the 3 POST/PATCH routes that lacked them: `POST /api/schedule` (createScheduleSchema), `PATCH /api/schedule/[id]` (rescheduleSchema with refine), `POST /api/analytics/event` (eventBatchSchema with nested eventSchema).
- **Files:** `src/app/api/schedule/route.ts`, `src/app/api/schedule/[id]/route.ts`, `src/app/api/analytics/event/route.ts`

---

## Sprint 3 — UX/Accessibility (Next Up)

### 7. Accessibility Fixes
- **Status:** NOT STARTED
- **Priority:** HIGH
- **Locations:**
  - Icon-only buttons missing `aria-label` (TicketListClient, ScheduleCalendar, AnalyticsDashboard refresh buttons, view toggles, back buttons)
  - Modals missing `role="dialog"`, `aria-modal="true"`, focus traps (QuickClosePanel, ComputerPicker, TicketActions)
  - Custom dropdowns missing `aria-haspopup="menu"` and `aria-controls`
  - Search inputs using placeholder-only (no `<label>` elements)
  - Priority dot indicators need `aria-label` not just `title`

### 9. List Virtualization
- **Status:** NOT STARTED
- **Priority:** MEDIUM
- **Location:** `rx-skin/src/components/tickets/TicketListClient.tsx` and similar
- **Problem:** All tickets/notes rendered to DOM at once — no pagination or virtualization.
- **Fix:** Add `react-window` or `@tanstack/react-virtual` for ticket list, note list, time entry list. Or implement server-side pagination.

### 10. Code Splitting / Lazy Loading
- **Status:** NOT STARTED
- **Priority:** MEDIUM
- **Location:** `rx-skin/src/components/`
- **Problem:** FullCalendar (~200KB), Leaflet/FleetMap, Recharts all eagerly loaded.
- **Fix:** Wrap with `React.lazy()` + `<Suspense>` — load only when user navigates to schedule, fleet map, or analytics pages.

### 17. QuickClosePanel API Wiring
- **Status:** NOT STARTED
- **Location:** `rx-skin/src/components/tickets/QuickClosePanel.tsx`
- **Problem:** `onConfirm` callback exists but API call is commented out with `// TODO: Wire to real API`

### 18. Ticket Detail Quick Actions
- **Status:** NOT STARTED
- **Location:** `rx-skin/src/components/tickets/TicketDetail.tsx`
- **Problem:** "Change Status", "Add Time Entry", "Escalate" buttons render but have no click handlers.

### 19. Schedule Date Selection
- **Status:** NOT STARTED
- **Location:** `rx-skin/src/components/schedule/ScheduleCalendar.tsx`
- **Problem:** Date selection handler only does `console.log` — doesn't create entry.

---

## Sprint 4 — Scale/Polish

### 11. React.memo for Card Components
- **Status:** NOT STARTED
- **Priority:** LOW
- **Location:** `TicketCard.tsx`, `ProjectCard.tsx`, `KpiCard.tsx`, `TechCard.tsx`
- **Problem:** Re-render on every parent update despite stable props.
- **Fix:** Wrap with `React.memo()` — simple win for list rendering performance.

### 12. Batch API Call Logging
- **Status:** NOT STARTED
- **Priority:** MEDIUM
- **Location:** `rx-skin/src/lib/instrumentation/api-logger.ts`
- **Problem:** Individual Prisma insert per API call. At scale, this creates DB write pressure.
- **Fix:** Batch inserts (flush every 5s or 25 events, similar to analytics tracker pattern).

### 13. Request Retry with Backoff
- **Status:** NOT STARTED
- **Priority:** MEDIUM
- **Location:** All API clients (`lib/cw/`, `lib/automate/`, `lib/control/`, `lib/samsara/`)
- **Problem:** No retry logic for transient failures (network timeouts, 502/503).
- **Fix:** Add exponential backoff retry (max 3 attempts, 1s/2s/4s delays) for retryable errors.

### 15. Remove `any` Types
- **Status:** NOT STARTED
- **Priority:** MEDIUM
- **Count:** ~44 instances across components + lib
- **Worst offenders:**
  - `lib/automate/client.ts` — `normalizeComputer(raw: any)`
  - `lib/control/client.ts` — `normalizeSession(raw: any)`
  - Various components with loose event handler typing
- **Fix:** Replace with proper interfaces. Create `RawAutomateComputer`, `RawControlSession` types for API responses.

### 16. Unsafe Type Casts
- **Status:** NOT STARTED
- **Priority:** LOW
- **Examples:**
  - `(process.env.DEV_DEPARTMENT as DepartmentCode)` — should validate
  - `info.event.extendedProps.entry as ScheduleEntry` — should narrow
- **Fix:** Add runtime validation or type guards.

---

## Sprint 5 — Architecture

### 14. Distributed Trace IDs
- **Status:** NOT STARTED
- **Priority:** LOW
- **Location:** `rx-skin/src/lib/instrumentation/`
- **Problem:** No correlation between frontend events, BFF logs, and outbound API calls.
- **Fix:** Generate `x-request-id` in middleware, propagate through all API clients and logger.

### 20. Multi-Tenant Credential Resolution
- **Status:** UNBLOCKED (Item #1 complete — DB lookup now works)
- **Problem:** `getDefaultTenantId()` caches first tenant forever. Production needs per-request tenant resolution from JWT session.
- **Fix:** Resolve tenant from JWT session, look up encrypted credentials in DB per request.

### 21. JWT Session Refresh
- **Status:** NOT STARTED
- **Priority:** MEDIUM
- **Problem:** 8-hour JWT with no refresh mechanism. No explicit logout invalidation.
- **Fix:** Implement refresh token rotation or sliding session window.

### 22. CORS Configuration
- **Status:** NOT STARTED
- **Priority:** LOW (single-domain deployment)
- **Fix:** Add explicit CORS headers in `next.config.js` for API routes.

---

## Summary Metrics

| Category | Items | Done | Remaining |
|----------|-------|------|-----------|
| Security | 6 | 5 | 1 (a11y) |
| Stability | 2 | 2 | 0 |
| Performance | 3 | 0 | 3 |
| Reliability | 3 | 0 | 3 |
| TypeScript | 2 | 0 | 2 |
| Incomplete Features | 3 | 0 | 3 |
| Architecture | 3 | 0 | 3 |
| **Total** | **22** | **7** | **15** |

---

*Generated by Claude Code deep review — 2026-03-28*
*Sprint 1+2 completed by Claude Code — commit 8f71b03*
