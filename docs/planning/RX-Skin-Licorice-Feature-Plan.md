<!-- STATUS: Audited 2026-03-29. Features 5 (Rich Cards) largely done via TicketCard.tsx. Feature 6 (Search) partially done via GlobalSearch.tsx. Features 1,2,3,4,7 not started. Timer widget is high priority — appears in IT, SI, and Licorice specs. -->
# RX Skin — Licorice-Inspired Feature Plan

**Date:** March 26, 2026
**Author:** Travis Brown / Claude
**Status:** Draft for Review

---

## What is Licorice?

Licorice.io is a "next-generation interface for your existing PSA" — it sits on top of ConnectWise Manage (or Autotask) and replaces the technician-facing UI entirely. Techs live in Licorice full-time. The PSA stays for back-office (invoicing, quotes, project planning). Their core claim: techs average 612 clicks/day in ConnectWise vs 192 in Licorice — a 68% reduction.

RX Skin is doing the same thing, but we own the entire stack. That gives us more control over what we build and how deep the integration goes.

---

## Key Licorice Patterns Worth Stealing

### 1. "My Day" — The Technician's Home Base

**What Licorice Does:**
Every tech lands on a personalized daily view that shows what's scheduled, what's in progress, and what needs attention. It's a calendar + task list + timer all in one screen. No clicking around to figure out "what should I work on."

**What RX Skin Should Build:**

- **My Day Dashboard** — replaces the generic dashboard with a tech-specific daily view
- Top section: today's scheduled jobs in a compact timeline (8am–6pm horizontal bar)
- Middle section: active ticket cards showing key info at a glance
- Bottom section: unscheduled tickets assigned to this tech (the backlog)
- One-click to "start working" on any ticket — timer starts, status updates
- The whole page answers: "What am I doing right now? What's next?"

**Implementation:**
- New route: `/my-day` (becomes the default landing page for techs)
- Server component fetches today's schedule entries + assigned tickets via BFF
- Client components for interactive cards with drag reordering
- TanStack Query with 30-second polling for real-time updates

---

### 2. Drag-and-Drop Everywhere

**What Licorice Does:**
- Drag tickets between techs on the schedule board to reassign
- ALT+drag to quickly create a follow-up appointment from any ticket
- Right-click to copy or move a job to another tech (auto-notifies them)
- Drag from the unscheduled backlog onto the calendar to schedule
- Drag to reorder priority within your own queue

**What RX Skin Should Build:**

**A. Dispatch Board (Manager View)**
- Full-width calendar with tech columns (like a Gantt chart rotated)
- Each tech is a column; time runs vertically
- Drag tickets between columns = reassign to different tech
- Drag ticket edges = resize duration
- Drop from unscheduled sidebar onto any tech's column = schedule it
- Visual capacity indicators (green/yellow/red) per tech

**B. My Day (Tech View)**
- Drag to reorder tickets in personal queue
- Drag from backlog to calendar = self-schedule
- ALT+drag (or long-press on mobile) = create follow-up
- Right-click context menu: reassign, escalate, copy to another tech

**C. Ticket List**
- Drag ticket rows to reorder priority
- Drag to a "schedule" drop zone = open quick-schedule modal
- Multi-select + drag = bulk reassign

**Implementation:**
- `dnd-kit` (already in our stack) for all drag interactions
- `@dnd-kit/sortable` for list reordering
- Custom drag overlays showing ticket summary card while dragging
- Drop zone indicators with visual feedback (highlight, expand)
- Touch support via `dnd-kit` sensors (pointer + touch + keyboard)
- Optimistic updates via TanStack Query mutation + rollback on failure

---

### 3. Auto Time Tracking — Zero-Effort Timesheets

**What Licorice Does:**
Licorice detects when a tech is working a job and logs time automatically. No manual start/stop. SLA timers auto-start and auto-stop. They claim 105–112% billable time capture (meaning techs actually record MORE than their target, without being nagged).

**What RX Skin Should Build:**

- **Active Work Timer** — persistent floating widget (bottom-right corner)
  - Shows: current ticket #, title, elapsed time, client name
  - One click to pause/resume
  - Auto-starts when tech opens a ticket detail or clicks "Start Work"
  - Auto-pauses after configurable idle period (e.g., 5 min no interaction)
  - Auto-stops when tech starts a different ticket
- **Quick Time Entry** — when closing a ticket or switching tasks
  - Pre-filled with tracked duration
  - Tech just confirms or adjusts before submitting
  - One click to post the time entry to ConnectWise
- **SLA Timer Display** — on every ticket card
  - Visual countdown: green → yellow → red as SLA approaches
  - Auto-calculated from CW SLA configuration

**Implementation:**
- React context provider wrapping the dashboard layout
- `TimeTracker` component with `useRef` for high-precision elapsed time
- Persist active timer state in localStorage (survives page refresh)
- BFF endpoint: `POST /api/time-entries` → CW `time/entries` API
- SLA data pulled from CW `service/SLAs` endpoint

---

### 4. Minimal Clicks to Close — The "Quick Close" Flow

**What Licorice Does:**
One click in Licorice performs several updates in the PSA. Closing a ticket handles status change, time entry, notes, and notification — all from one action. Their mantra: reduce 612 clicks to 192.

**What RX Skin Should Build:**

**Quick Close Workflow (3 clicks max):**

1. **Click 1: "Close Ticket" button** on the ticket card or detail page
2. **Slide-over panel appears** with pre-filled fields:
   - Resolution note (text area — required, but can be brief)
   - Time entry (pre-filled from auto-tracker)
   - Status dropdown (defaults to "Completed")
   - Notify client checkbox (default: on)
3. **Click 2: Confirm** — one button submits everything

That's it. Two clicks if the auto-tracked time is correct.

**Behind the scenes, one "Close" action triggers:**
- Status → Completed (or Resolved, configurable per board)
- Time entry posted with resolution note
- Internal note added with close summary
- Client notification email (if enabled)
- SLA timer stopped
- Ticket removed from My Day view

**Also build these quick actions on every ticket card:**
- **Quick Note** — inline text field, press Enter to post (no modal)
- **Quick Status** — dropdown right on the card, changes instantly
- **Quick Assign** — type-ahead tech picker, one selection to reassign
- **Quick Schedule** — date/time picker popover, one confirm to schedule

**Implementation:**
- Slide-over panel component (shadcn Sheet)
- Batch API endpoint: `POST /api/tickets/[id]/close` that orchestrates multiple CW API calls server-side
- Optimistic UI — ticket disappears from list immediately, rolls back if API fails
- Keyboard shortcuts: `Ctrl+Enter` to confirm close, `Esc` to cancel

---

### 5. Rich Ticket Cards — See Everything at a Glance

**What Licorice Does:**
Their UI shows "exactly the right information when you need it" — a single pane of glass combining data from multiple sources. Techs can "see and understand everything instantly."

**What RX Skin Should Build:**

**Ticket Card (List/Board View) — shows without clicking:**
- Ticket # + Title (bold, truncated)
- Client company name + contact name
- Priority indicator (color-coded left border: Critical=red, High=orange, Normal=blue, Low=gray)
- Current status badge (color-coded pill)
- SLA countdown (if active)
- Assigned tech avatar
- Age indicator ("2h ago" / "3 days")
- Last note preview (first 80 chars, gray text)
- Source icon (email, phone, portal, alert)

**Ticket Detail (Expanded View) — one click from card:**
- Full ticket info in a split layout:
  - Left panel (60%): notes/activity feed (chronological, with internal/external toggle)
  - Right panel (40%): ticket metadata, SLA, related config items, contact info
- Inline note entry at the top of the activity feed (always visible, never buried)
- Quick action bar pinned to top: Start Timer | Add Note | Schedule | Reassign | Close
- Related tickets section (same client, same config item)
- Attached files with preview thumbnails

**Implementation:**
- Ticket card: reusable `<TicketCard>` component with configurable display density (compact/comfortable/full)
- Ticket detail: route `/tickets/[id]` with parallel data fetching (ticket + notes + time entries + config items)
- Activity feed: merged timeline of notes, time entries, status changes, assignments
- TanStack Query for each data slice with independent cache invalidation

---

### 6. Fluid Search — Find Anything Fast

**What Licorice Does:**
A search panel that auto-detects whether you're looking for a company, person, ticket number, or freeform text. Uses smart AND/OR logic. Claims 75% less effort than traditional PSA search.

**What RX Skin Should Build:**

- **Global Search Bar** — always accessible via `Ctrl+K` (or `/` shortcut)
- Command palette style (like VS Code, Spotlight, Linear)
- Type anything: ticket number, client name, tech name, keyword
- Results grouped by category: Tickets, Companies, Contacts, Config Items
- Recent searches preserved
- Inline preview on hover/arrow-key navigation
- Search-as-you-type with debounced API calls

**Implementation:**
- `cmdk` library (or build with shadcn Command component)
- BFF search endpoint that fans out to multiple CW API endpoints in parallel
- LRU cache for search results (short TTL, 30 seconds)
- Keyboard navigation with `aria-activedescendant` for accessibility

---

### 7. Team Visibility — The 50,000ft View

**What Licorice Does:**
Managers get real-time visibility into who's working on what, who's overloaded, and who has capacity. Calendar sharing lets techs see each other's schedules.

**What RX Skin Should Build:**

- **Team Board** — grid view: techs as rows, time as columns
  - See all tech schedules side-by-side
  - Color-coded capacity: green (under 70%), yellow (70-90%), red (over 90%)
  - Click any tech's row to expand and see their ticket details
  - Drag tickets between tech rows to reassign
- **Quick Reassign on Absence** — if a tech is marked out
  - Their tickets surface with a "Reassign" badge
  - One-click to redistribute to available techs
- **Workload Summary** — compact dashboard widget
  - Tickets per tech (bar chart)
  - Average response time
  - SLA compliance percentage

**Implementation:**
- Route: `/dispatch` (manager/admin only, role-gated)
- FullCalendar resource timeline view (techs as resources)
- BFF endpoint aggregating schedule entries + ticket assignments for all techs
- WebSocket or polling (30s) for near-real-time updates

---

## Implementation Phases

### Phase 1A: Foundation (Current Sprint — Extend)
**What we have:** Ticket list, page shells, BFF layer, auth
**Add now:**
1. Rich ticket cards (replace skeleton rows with real card components)
2. Ticket detail page (`/tickets/[id]`) with split layout
3. Quick actions on ticket cards (status, note, assign)
4. Global search (`Ctrl+K`)

### Phase 1B: Technician Productivity
1. My Day dashboard (`/my-day`)
2. Active work timer (floating widget)
3. Quick Close workflow (slide-over panel)
4. Quick Note inline entry
5. Keyboard shortcuts throughout

### Phase 1C: Scheduling & Drag-Drop
1. Personal calendar on My Day (FullCalendar day view)
2. Drag from backlog to calendar = schedule
3. Drag to reorder personal queue
4. ALT+drag / long-press = follow-up appointment

### Phase 2A: Dispatch & Team Views
1. Dispatch board (`/dispatch`) — resource timeline
2. Drag between tech columns = reassign
3. Capacity indicators
4. Absence/reassignment workflow

### Phase 2B: Polish & Automation
1. Auto time tracking (detect active ticket, log elapsed)
2. SLA countdown timers on cards
3. Activity feed (merged timeline)
4. Notification system (in-app + optional push)

---

## Technical Architecture Notes

### Drag-and-Drop Strategy
- **Library:** `dnd-kit` (already in stack)
- **Sensors:** PointerSensor + TouchSensor + KeyboardSensor
- **Collision detection:** closestCenter for grids, closestCorners for calendar drops
- **Accessibility:** Full keyboard DnD support, ARIA live regions for announcements
- **Performance:** `useDraggable` with `transform` CSS (no layout thrashing)
- **Optimistic updates:** Mutate TanStack Query cache immediately, rollback on API error

### Timer Architecture
- React Context: `TimeTrackerProvider` wraps dashboard layout
- `useRef` for `setInterval` — avoids re-renders every second
- `requestAnimationFrame` for display updates (smooth, battery-friendly)
- State persisted to `localStorage` — survives refresh
- Background tab detection via `document.visibilityState` — pause tracking on tab away (configurable)

### Batch API Pattern
- Single BFF endpoint orchestrates multiple CW API calls
- Example: `POST /api/tickets/[id]/close` calls:
  1. `PATCH /service/tickets/{id}` (status change)
  2. `POST /time/entries` (time entry)
  3. `POST /service/tickets/{id}/notes` (resolution note)
- All-or-nothing: if any call fails, return error + rollback
- Response includes updated ticket data for cache invalidation

### Search Architecture
- BFF endpoint: `GET /api/search?q={term}`
- Parallel fan-out to: `service/tickets`, `company/companies`, `company/contacts`
- Results merged, scored by relevance, cached (30s TTL)
- Debounce: 200ms on client, request deduplication on server

---

## Priority Ranking

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Rich ticket cards | High | Low | 1 |
| Ticket detail page | High | Medium | 2 |
| Quick actions (status, note, assign) | High | Low | 3 |
| Global search (Ctrl+K) | High | Medium | 4 |
| My Day dashboard | High | Medium | 5 |
| Quick Close workflow | Very High | Medium | 6 |
| Active work timer | High | Medium | 7 |
| Personal calendar + drag scheduling | High | High | 8 |
| Dispatch board | Medium | High | 9 |
| Auto time tracking | Medium | High | 10 |
| Team visibility / capacity | Medium | Medium | 11 |

---

## What We're NOT Copying from Licorice

- **Standalone PSA mode** — we're always connected to ConnectWise, that's the point
- **Their pricing/licensing model** — this is internal tooling
- **Patent-pending behavioral science UI** — we'll build our own UX patterns that make sense for RX Technology's specific workflows
- **2-year history sync** — we'll pull what we need in real-time from CW API + cache aggressively

---

## Next Immediate Actions

1. Build the `<TicketCard>` component with real data layout
2. Build `/tickets/[id]` detail page with split layout
3. Add quick action buttons to ticket cards
4. Wire up `Ctrl+K` global search
5. Connect real ConnectWise API credentials to test with live data

---

*This plan is a living document. Update as we build and learn what works best for RX Technology's techs.*
