# CoworkToDo — RX Skin Deep Review Action Items

> **Purpose:** Shared task list between Claude Code (local) and Cowork (cloud) for addressing codebase review findings.
> **Generated:** 2026-03-28 from deep codebase review.
> **Project:** RX Skin — ConnectWise Modern Frontend Portal
> **Repo:** https://github.com/NBTX77/RxSkin

---

## Working Model

- **Claude Code (Local):** File edits, git operations, local testing, Vercel/Supabase MCP actions
- **Cowork (Cloud):** Code generation, refactoring large files, research, architecture decisions, documentation

Both agents should read `CLAUDE.md` at session start and check this file for current priorities.

---

## Critical Issues (Fix Before Production)

### 1. Encrypted Credential Storage
- **Status:** NOT STARTED
- **Priority:** CRITICAL
- **Location:** `rx-skin/src/lib/auth/credentials.ts`
- **Problem:** `getTenantCredentials()` ignores the `tenantId` parameter and returns env vars directly. Phase 1 workaround — must be replaced before multi-tenant.
- **Fix:** Complete the Prisma DB lookup using `TenantCredential` table. Decrypt with existing AES-256-GCM utilities. Remove env var fallback for production builds.
- **Also:** Fix weak key derivation — currently slices first 32 chars of string. Use proper KDF (PBKDF2 or scrypt).

### 2. Login Rate Limiting
- **Status:** NOT STARTED
- **Priority:** CRITICAL
- **Location:** `rx-skin/src/lib/auth/config.ts`, middleware
- **Problem:** No rate limiting on login attempts — brute-force attack possible.
- **Fix:** Add in-memory sliding window rate limiter (IP-based, 5 attempts per 15 min). Consider `upstash/ratelimit` for serverless-friendly implementation.

### 3. CW OData Filter Injection
- **Status:** NOT STARTED
- **Priority:** HIGH
- **Location:** `rx-skin/src/lib/cw/client.ts`
- **Problem:** User search input inserted unescaped into CW OData filter strings. Example: `status/name="${userInput}"` — a crafted input could alter query scope.
- **Fix:** Create `escapeCwFilter(value: string)` utility that escapes double quotes and special OData characters. Apply to all filter-building functions.

### 4. React Error Boundaries
- **Status:** NOT STARTED
- **Priority:** HIGH
- **Location:** `rx-skin/src/components/`
- **Problem:** Zero error boundaries in entire component tree. Unhandled error in Sidebar, TopBar, or GlobalSearch crashes the whole app.
- **Fix:** Add error boundary wrapper around `DashboardShell` children and each major feature section (tickets, projects, schedule, ops, admin). Create a reusable `<ErrorBoundary>` component with fallback UI and error reporting.

### 5. Mock Data Fallback → 503
- **Status:** NOT STARTED
- **Priority:** HIGH
- **Location:** 8 API routes (`/api/projects`, `/api/projects/[id]`, `/api/schedule`, `/api/search`, `/api/tickets`, `/api/tickets/[id]`, `/api/tickets/[id]/notes`, `/api/tickets/[id]/time-entries`)
- **Problem:** Routes return fake/mock data when CW credentials are missing instead of failing. In production, this silently serves wrong data.
- **Fix:** Return `503 Service Unavailable` with `{ code: 'SERVICE_UNAVAILABLE', message: 'ConnectWise API not configured', retryable: false }`. Keep mock data only behind `NODE_ENV === 'development'` check.

---

## High Priority Improvements

### 6. Security Headers
- **Status:** NOT STARTED
- **Priority:** HIGH
- **Location:** `rx-skin/next.config.js` or middleware
- **Fix:** Add CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy via `next.config.js` headers config or middleware.

### 7. Accessibility Fixes
- **Status:** NOT STARTED
- **Priority:** HIGH
- **Locations:**
  - Icon-only buttons missing `aria-label` (TicketListClient, ScheduleCalendar, AnalyticsDashboard refresh buttons, view toggles, back buttons)
  - Modals missing `role="dialog"`, `aria-modal="true"`, focus traps (QuickClosePanel, ComputerPicker, TicketActions)
  - Custom dropdowns missing `aria-haspopup="menu"` and `aria-controls`
  - Search inputs using placeholder-only (no `<label>` elements)
  - Priority dot indicators need `aria-label` not just `title`

### 8. Input Validation Standardization
- **Status:** NOT STARTED
- **Priority:** MEDIUM
- **Problem:** Mix of Zod validation and inline manual checks across API routes.
- **Fix:** Standardize all POST/PATCH routes on Zod schemas. Create shared validators for common patterns (dates, CW IDs, pagination params).

---

## Performance Improvements

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

### 11. React.memo for Card Components
- **Status:** NOT STARTED
- **Priority:** LOW
- **Location:** `TicketCard.tsx`, `ProjectCard.tsx`, `KpiCard.tsx`, `TechCard.tsx`
- **Problem:** Re-render on every parent update despite stable props.
- **Fix:** Wrap with `React.memo()` — simple win for list rendering performance.

---

## Observability & Reliability

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

### 14. Distributed Trace IDs
- **Status:** NOT STARTED
- **Priority:** LOW
- **Location:** `rx-skin/src/lib/instrumentation/`
- **Problem:** No correlation between frontend events, BFF logs, and outbound API calls.
- **Fix:** Generate `x-request-id` in middleware, propagate through all API clients and logger.

---

## TypeScript Cleanup

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

## Incomplete Features (TODOs in Code)

### 17. QuickClosePanel API Wiring
- **Location:** `rx-skin/src/components/tickets/QuickClosePanel.tsx`
- **Problem:** `onConfirm` callback exists but API call is commented out with `// TODO: Wire to real API`

### 18. Ticket Detail Quick Actions
- **Location:** `rx-skin/src/components/tickets/TicketDetail.tsx`
- **Problem:** "Change Status", "Add Time Entry", "Escalate" buttons render but have no click handlers.

### 19. Schedule Date Selection
- **Location:** `rx-skin/src/components/schedule/ScheduleCalendar.tsx`
- **Problem:** Date selection handler only does `console.log` — doesn't create entry.

---

## Architecture Debt

### 20. Multi-Tenant Credential Resolution
- **Status:** NOT STARTED (blocked by #1)
- **Problem:** `getTenantCredentials(tenantId)` ignores param. `getDefaultTenantId()` caches first tenant forever.
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

| Category | Items | Critical | High | Medium | Low |
|----------|-------|----------|------|--------|-----|
| Security | 6 | 2 | 2 | 1 | 1 |
| Accessibility | 1 | 0 | 1 | 0 | 0 |
| Performance | 3 | 0 | 0 | 2 | 1 |
| Reliability | 3 | 0 | 0 | 2 | 1 |
| TypeScript | 2 | 0 | 0 | 1 | 1 |
| Incomplete Features | 3 | 0 | 0 | 3 | 0 |
| Architecture | 3 | 0 | 1 | 1 | 1 |
| **Total** | **22** | **2** | **4** | **10** | **5** |

---

## Suggested Work Order

**Sprint 1 (Critical Security):** Items 1, 2, 3, 5
**Sprint 2 (Stability):** Items 4, 6, 8
**Sprint 3 (UX/Accessibility):** Items 7, 9, 10, 17, 18, 19
**Sprint 4 (Scale/Polish):** Items 11, 12, 13, 15, 16
**Sprint 5 (Architecture):** Items 14, 20, 21, 22

---

*Generated by Claude Code deep review — 2026-03-28*
