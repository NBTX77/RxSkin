<!-- STATUS: Audited 2026-03-29. Fleet map implemented (FleetMap.tsx). Analytics dashboard stub exists (AnalyticsDashboard.tsx). Tech sidebar partially built (TechSidebar.tsx). Schedule holds partially built (ScheduleHoldList.tsx). Steps 1-4 partial, steps 5-10 not started. -->
# OPS HUB — Master Build Prompt for RX Skin Integration

> **Paste this entire prompt into a new Claude session to build the Ops Hub feature into the existing RX Skin Next.js project.**
> This prompt contains the full specification: scope, architecture, design tokens, component breakdown, API contracts, and file placement.

---

## Context: What You Are Building

You are adding an **Ops Hub** section to the existing **RX Skin** Next.js application — a modern ConnectWise Manage frontend portal. The Ops Hub replaces a standalone vanilla JS dashboard currently running at `ops.rxtech.app` with a fully integrated React/Next.js implementation inside the existing RxSkin codebase.

The RxSkin project lives at: `rx-skin/` (Next.js 14 App Router, TypeScript strict, Tailwind CSS, shadcn/ui patterns).

**Read `CLAUDE.md` at the project root first** — it has the full tech stack, architecture rules, and AI assistant instructions.

---

## Scope

### What to Build (Everything Except Schedule)

The ops.rxtech.app site has 3 views. **Schedule is already built in RxSkin** — skip it. Build:

1. **Fleet Map** — Real-time vehicle/technician tracking on an interactive map
2. **Analytics** — KPI dashboard with charts for ticket status, priority distribution, and tech workload
3. **Tech Profile Panel** — Slide-out panel showing driver details, open tickets, HOS info
4. **Schedule Hold Sidebar** — Panel showing unscheduled/held tickets that can be dragged onto the schedule
5. **All supporting features**: context menus, drag-drop from schedule hold sidebar, toast notifications, right-click actions, modal dialogs

### What NOT to Build
- Calendar/dispatch schedule view (already exists at `/schedule`)
- Login/auth (already exists)
- The BFF pattern itself (already exists in `src/lib/cw/client.ts`)

---

## Navigation: Where Ops Lives

### Sidebar Integration

Add a single **"Ops"** item to the existing sidebar navigation with an expandable sub-menu. When clicked, it expands to show sub-views:

```
My Day          (existing)
Tickets         (existing)
Schedule        (existing)
Companies       (existing)
▼ Ops           ← NEW (expandable)
  ├─ Fleet Map
  ├─ Analytics
  └─ Schedule Holds
Settings        (existing)
```

**Sidebar files to modify:**
- `src/components/layout/Sidebar.tsx` — Add "Ops" with expandable children
- `src/components/layout/MobileNav.tsx` — Add "Ops" icon (use `Radio` or `Radar` from lucide-react)

**Existing sidebar pattern** (from `Sidebar.tsx`):
```tsx
const navItems = [
  { href: '/dashboard', label: 'My Day', icon: Sun },
  { href: '/tickets', label: 'Tickets', icon: Ticket },
  { href: '/schedule', label: 'Schedule', icon: Calendar },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/settings', label: 'Settings', icon: Settings },
]
```

Add a new pattern for expandable items. Use `ChevronDown`/`ChevronRight` for the toggle. The "Ops" parent item uses the `Radar` icon from lucide-react. Sub-items are indented and use smaller icons.

**Active state logic**: The Ops parent should show active styling if `pathname.startsWith('/ops')`. Sub-items highlight individually.

### Routes

```
/ops              → Redirects to /ops/fleet-map (default view)
/ops/fleet-map    → Fleet Map view
/ops/analytics    → Analytics dashboard
/ops/holds        → Schedule Hold management
```

---

## File Structure (New Files to Create)

```
src/
├── app/(dashboard)/ops/
│   ├── layout.tsx                    # Ops section layout (optional header/tabs)
│   ├── page.tsx                      # Redirect to /ops/fleet-map
│   ├── fleet-map/
│   │   └── page.tsx                  # Fleet Map page
│   ├── analytics/
│   │   └── page.tsx                  # Analytics page
│   └── holds/
│       └── page.tsx                  # Schedule Holds page
├── app/api/
│   ├── fleet/
│   │   ├── route.ts                  # GET fleet data (Samsara vehicles + CW tickets merged)
│   │   └── [vehicleId]/route.ts      # GET single vehicle detail
│   ├── samsara/
│   │   ├── vehicles/route.ts         # GET Samsara vehicle list + locations
│   │   ├── drivers/route.ts          # GET Samsara driver list + HOS
│   │   └── hos/route.ts              # GET HOS clocks/violations
│   └── analytics/
│       └── route.ts                  # GET aggregated analytics data
├── components/ops/
│   ├── FleetMap.tsx                  # Main map component (react-leaflet)
│   ├── TechSidebar.tsx              # Left sidebar with tech cards + filters
│   ├── TechCard.tsx                 # Individual technician card
│   ├── TechProfilePanel.tsx         # Slide-out right panel for tech details
│   ├── MapMarker.tsx                # Custom map marker component
│   ├── AnalyticsDashboard.tsx       # KPI grid + charts
│   ├── KpiCard.tsx                  # Individual KPI stat card
│   ├── StatusDonut.tsx              # Doughnut chart for ticket status
│   ├── PriorityDonut.tsx            # Doughnut chart for priority distribution
│   ├── WorkloadBars.tsx             # Bar chart for tech workload
│   ├── ScheduleHoldList.tsx         # Schedule hold ticket list
│   ├── ScheduleHoldCard.tsx         # Individual hold card (draggable)
│   ├── OpsHeader.tsx                # View-level header with sync controls
│   ├── ContextMenu.tsx              # Right-click context menu
│   └── EntryTypeFilter.tsx          # Toggleable filter pills
├── hooks/
│   ├── useFleetData.ts              # TanStack Query hook for fleet data
│   ├── useAnalytics.ts             # TanStack Query hook for analytics
│   ├── useScheduleHolds.ts         # TanStack Query hook for schedule holds
│   └── useSamsara.ts               # TanStack Query hook for Samsara API
├── lib/
│   ├── samsara/
│   │   └── client.ts                # Samsara API client (server-side only)
│   └── fleet/
│       └── merge.ts                 # Logic to merge Samsara + CW data
└── types/
    └── ops.ts                       # Ops-specific TypeScript types
```

---

## Design System & Visual Theme

### Philosophy

Match the existing RxSkin dark-mode-first design. The ops views from ops.rxtech.app use a similar dark palette — adapt it to use the exact same Tailwind classes and CSS variable system already in `globals.css`.

### Color Mapping (ops.rxtech.app → RxSkin Tailwind)

| ops.rxtech.app Variable | Hex | RxSkin Tailwind Equivalent |
|---|---|---|
| `--bg: #0d1117` | Background | `bg-gray-950` (mapped to `#0a0a0a` in RxSkin) |
| `--surface: #161b22` | Surface cards | `bg-gray-900` |
| `--border: #30363d` | Borders | `border-gray-800` |
| `--text: #e6edf3` | Primary text | `text-white` |
| `--muted: #8b949e` | Muted text | `text-gray-400` |
| `--accent: #58a6ff` | Interactive | `text-blue-400` / `bg-blue-600` |
| `--danger: #f85149` | Red | `text-red-400` |
| `--warn: #d29922` | Amber | `text-yellow-400` |
| `--ok: #3fb950` | Green | `text-green-400` |

### Light Mode

The existing `globals.css` already has comprehensive light-mode overrides using `html.light` selector that remaps all gray-* and color-* classes. **All new components MUST use the same Tailwind class conventions** (e.g., `bg-gray-900` for surfaces, `text-gray-400` for muted, `border-gray-800` for borders) so light mode works automatically.

**DO NOT add new CSS variables or custom colors.** Use the existing Tailwind palette.

### Typography

- Font: System default (already set in `globals.css` as Arial, Helvetica, sans-serif)
- Headers: `text-lg font-semibold text-white` or `text-xl font-bold text-white`
- Body: `text-sm text-gray-400`
- Badges/pills: `text-xs font-medium`
- Use the same `font-semibold`, `font-medium` patterns as the existing ticket list

### Component Styling Patterns (Match Existing)

**Cards/Surfaces:**
```tsx
<div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
```

**Stat cards (match MyDayClient pattern):**
```tsx
<div className="bg-blue-500/5 border border-gray-800 rounded-xl p-4">
  <div className="text-blue-400 text-sm font-medium">Label</div>
  <div className="text-2xl font-bold text-white mt-1">42</div>
</div>
```

**Buttons:**
```tsx
// Primary
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">

// Ghost
<button className="px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg text-sm transition-colors">
```

**Active nav item:**
```tsx
<div className="bg-blue-600/15 text-blue-400 border border-blue-500/20 rounded-lg px-3 py-2.5">
```

**Status pills:**
```tsx
// Critical (red)
<span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Critical</span>

// High (orange)
<span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">High</span>

// Medium (yellow)
<span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Medium</span>

// Low (green)
<span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Low</span>

// Schedule Hold (amber special)
<span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">Schedule Hold</span>

// Multi-Tech
<span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">Multi-Tech</span>

// Low HOS (danger)
<span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Low HOS</span>
```

**Dispatch entry type colors:**
```
On-Site  → blue-400 (#58a6ff)
Remote   → green-400 (#3fb950)
Meeting  → purple-400
Schedule Hold → yellow-400 / amber
Recurring → gray-400
```

---

## Component Specifications

### 1. Fleet Map (`FleetMap.tsx`)

**Library:** `react-leaflet` (wraps Leaflet in React components — best for Next.js SSR compatibility)

Install: `npm install react-leaflet leaflet @types/leaflet`

**Map tiles:** CartoDB Dark Matter (`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`)

**Features:**
- Full-width map filling the content area (minus tech sidebar)
- Custom markers for each technician vehicle:
  - Marker icon is a colored circle with initials or van emoji
  - Color based on status: green (normal), orange (low HOS), red (critical), blue (dispatched), purple (multi-tech)
  - Rotated to show vehicle heading (if available from Samsara)
- Click marker → open Tech Profile Panel (slide from right)
- Popup on hover showing: tech name, truck, speed, current ticket
- Auto-center map on all visible markers with padding
- Zoom controls in top-right
- Refresh button in header to re-fetch fleet data

**Layout:**
```
┌──────────────────────────────────────────────────┐
│ OpsHeader: "Fleet Map" | Last sync | Refresh btn │
├────────────┬─────────────────────────────────────┤
│ TechSidebar│                                      │
│ (280px)    │         Leaflet Map                  │
│ - Search   │         (flex-1)                     │
│ - Stats    │                                      │
│ - Filter   │                                      │
│ - TechCards│                                      │
│            │                                      │
└────────────┴─────────────────────────────────────┘
                                    ┌──────────────┐
                                    │TechProfile   │
                                    │Panel (slide) │
                                    │(360px)       │
                                    └──────────────┘
```

**IMPORTANT: Leaflet + Next.js SSR**
Leaflet does not support SSR. You MUST dynamically import the map component:
```tsx
import dynamic from 'next/dynamic'
const FleetMap = dynamic(() => import('@/components/ops/FleetMap'), { ssr: false })
```
Also import Leaflet CSS in the page or layout:
```tsx
import 'leaflet/dist/leaflet.css'
```

### 2. Tech Sidebar (`TechSidebar.tsx`)

**Position:** Fixed left panel within the Fleet Map view (NOT the main app sidebar — this is a view-specific sidebar).

**Width:** 280px on desktop, full-width sheet on mobile

**Sections:**
1. **Search** — `<input>` with magnifying glass icon, live-filters tech cards
2. **Quick stats row** — 4 mini-stat badges: Field Techs | Dispatched | Low HOS | Sched Holds
3. **Filter pills** — All | Critical | High | In Progress | Multi-Tech | Low HOS
4. **Tech card list** — Scrollable list of `TechCard` components

**Filter behavior:**
- `All` = show everyone
- `Critical` = tech has a critical-priority ticket assigned
- `High` = high-priority ticket
- `In Progress` = has an active dispatch entry right now
- `Multi-Tech` = assigned to a multi-tech ticket
- `Low HOS` = HOS remaining < 2 hours (red), < 4 hours (amber)

### 3. Tech Card (`TechCard.tsx`)

Each card shows:
- Avatar circle with initials (left)
- Name (bold), truck name (muted, below)
- Speed indicator (right): e.g., "45 mph" — green if moving, gray if 0
- Pills: priority, multi-tech, low HOS (conditional)
- Today's dispatch preview: first 1-2 entries with times
- Click → opens TechProfilePanel

**Styling:**
```tsx
<div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 cursor-pointer hover:bg-gray-800 hover:border-gray-600 transition-colors">
```

### 4. Tech Profile Panel (`TechProfilePanel.tsx`)

**Position:** Slides in from the right edge, 360px wide, full height, over the map.

**Sections:**
1. **Header**: Close button, tech name, avatar
2. **Quick metrics row**: Truck | Location | Speed | HOS remaining (with color)
3. **Open tickets list**: Cards showing ticket #, summary, priority, company
4. **Today's schedule**: Timeline of dispatch entries

**Animation:** Use Tailwind `transition-transform duration-300` with `translate-x-full` → `translate-x-0`.

### 5. Analytics Dashboard (`AnalyticsDashboard.tsx`)

**Library:** `recharts` (already in the RxSkin tech stack — React-native charting, works with SSR)

Install: `npm install recharts`

**Layout:**
```
┌──────────────────────────────────────────┐
│ OpsHeader: "Analytics" | Refresh         │
├──────────┬──────────┬──────────┬─────────┤
│ KPI:     │ KPI:     │ KPI:     │ KPI:    │
│ Open     │ In       │ High/    │ Multi-  │
│ Tickets  │ Progress │ Critical │ Tech    │
├──────────┴──────────┼──────────┴─────────┤
│ Status Donut        │ Priority Donut     │
│ (Recharts PieChart) │ (Recharts PieChart)│
├─────────────────────┴────────────────────┤
│ Tech Workload Bars (Recharts BarChart)   │
│ (horizontal, sorted by count, top 8)     │
└──────────────────────────────────────────┘
```

**KPI Cards:**
- **Open Tickets** — Total count, with sub-breakdown by board (Service, Security, Communication)
- **In Progress** — Tickets with status "In Progress"
- **High/Critical** — Count of high + critical priority tickets
- **Multi-Tech** — Tickets with >1 resource assigned

**Charts:**
- **Status Donut**: Slices for each ticket status (New, In Progress, Waiting, Closed, etc.)
- **Priority Donut**: Slices for Critical (red), High (orange), Medium (yellow), Low (green)
- **Workload Bars**: Horizontal bar chart showing top 8 techs by assigned ticket count

**Filtering:** All analytics filtered to SI team members only (Systems Integration boards).

**Recharts color tokens:**
```tsx
const COLORS = {
  blue: '#58a6ff',
  green: '#3fb950',
  orange: '#f0883e',
  red: '#f85149',
  purple: '#bc8cff',
  yellow: '#d29922',
  gray: '#8b949e',
}
```

### 6. Schedule Hold List (`ScheduleHoldList.tsx`)

A dedicated view showing tickets in "Schedule Hold" status that need to be dispatched.

**Features:**
- List of `ScheduleHoldCard` components
- Each card shows: ticket #, summary, company, priority, assigned member
- Cards are draggable (using `dnd-kit` — already in tech stack)
- Search/filter bar at top
- Sort by: Priority, Date Entered, Company

### 7. OpsHeader (`OpsHeader.tsx`)

Consistent header bar across all Ops sub-views.

```tsx
<div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-4">
  <div>
    <h1 className="text-xl font-bold text-white">{title}</h1>
    <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
  </div>
  <div className="flex items-center gap-3">
    {/* Live status pill */}
    <span className="flex items-center gap-2 text-xs text-green-400">
      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      Connected
    </span>
    {/* Last sync */}
    <span className="text-xs text-gray-500">Last sync: {time}</span>
    {/* Refresh button */}
    <button onClick={onRefresh} className="...ghost button styles...">
      <RefreshCw size={16} />
    </button>
  </div>
</div>
```

### 8. Context Menu (`ContextMenu.tsx`)

Right-click on dispatch entries or tech cards reveals:
- **View Details** → Opens detail modal
- **Edit Schedule** → Opens edit modal
- **Open in ConnectWise** → `window.open()` to CW ticket URL

Use a portal-rendered absolutely-positioned div. Close on click-outside or Escape.

---

## API Architecture (New BFF Routes)

All API routes go in `src/app/api/` and follow the existing BFF pattern from `src/lib/cw/client.ts`. **Never expose API keys to the browser.**

### New API Routes

#### `GET /api/fleet` — Merged Fleet Data
Calls Samsara (vehicles, locations, HOS) + ConnectWise (tickets, members, schedule) and merges them into a unified fleet response.

**Response:**
```json
{
  "ok": true,
  "techs": [
    {
      "id": "samsara-driver-id",
      "name": "John Smith",
      "memberId": 42,
      "memberIdentifier": "jsmith",
      "truckName": "Van 12",
      "vehicleId": "samsara-vehicle-id",
      "lat": 30.2672,
      "lng": -97.7431,
      "speed": 45,
      "heading": 180,
      "hosPct": 72,
      "hosRemaining": "5h 45m",
      "hosColor": "green",
      "currentTicket": { "id": 12345, "summary": "Network install", "priority": "High" },
      "dispatch": [
        { "id": 1, "name": "Network Install - ABC Corp", "start": "08:00", "end": "12:00", "type": "On-Site" }
      ],
      "scheduledHold": []
    }
  ],
  "schedHoldTickets": [
    { "id": 67890, "summary": "Server migration", "company": "XYZ Inc", "priority": "Medium", "member": "jsmith" }
  ],
  "lastSync": "2026-03-27T14:30:00Z"
}
```

#### `GET /api/fleet/[vehicleId]` — Single Vehicle Detail
Returns detailed info for the tech profile panel.

#### `GET /api/samsara/vehicles` — Samsara Vehicle List + Locations
Calls Samsara `fleet/vehicles` and `fleet/vehicles/locations` endpoints.

#### `GET /api/samsara/drivers` — Samsara Driver List
Calls Samsara `fleet/drivers` endpoint.

#### `GET /api/samsara/hos` — HOS Clocks
Calls Samsara `fleet/hos/clocks` endpoint for remaining drive time.

#### `GET /api/analytics` — Aggregated Analytics
Calls CW tickets endpoint with SI board filters, aggregates counts for KPIs and chart data.

**Response:**
```json
{
  "ok": true,
  "kpis": {
    "openTickets": { "total": 47, "byBoard": { "Service": 28, "Security": 12, "Communication": 7 } },
    "inProgress": 15,
    "highCritical": 8,
    "multiTech": 3
  },
  "statusBreakdown": [
    { "status": "New", "count": 12 },
    { "status": "In Progress", "count": 15 }
  ],
  "priorityBreakdown": [
    { "priority": "Critical", "count": 2, "color": "#f85149" },
    { "priority": "High", "count": 6, "color": "#f0883e" }
  ],
  "techWorkload": [
    { "name": "John Smith", "count": 8 },
    { "name": "Jane Doe", "count": 6 }
  ]
}
```

### Samsara API Client (`src/lib/samsara/client.ts`)

Build a new Samsara client mirroring the CW client pattern:

```typescript
// Server-side only — NEVER import in client components
export interface SamsaraCredentials {
  apiToken: string
  baseUrl: string // https://api.samsara.com/v1
}

async function samsaraFetch<T>(creds: SamsaraCredentials, path: string): Promise<T> {
  const res = await fetch(`${creds.baseUrl}${path}`, {
    headers: { 'Authorization': `Bearer ${creds.apiToken}` }
  })
  if (!res.ok) throw new Error(`Samsara API error: ${res.status}`)
  return res.json()
}

export async function getVehicles(creds: SamsaraCredentials) { ... }
export async function getVehicleLocations(creds: SamsaraCredentials) { ... }
export async function getDrivers(creds: SamsaraCredentials) { ... }
export async function getHosClocks(creds: SamsaraCredentials) { ... }
```

**Environment variables to add to `.env.local`:**
```
SAMSARA_API_TOKEN=
SAMSARA_BASE_URL=https://api.samsara.com
```

---

## TypeScript Types (`src/types/ops.ts`)

```typescript
// ── Fleet / Samsara ──────────────────────────────
export interface FleetTech {
  id: string
  name: string
  memberId: number
  memberIdentifier: string
  truckName: string
  vehicleId: string
  lat: number
  lng: number
  speed: number
  heading?: number
  hosPct: number
  hosRemaining: string
  hosColor: 'green' | 'yellow' | 'red'
  currentTicket?: FleetTicketRef
  dispatch: FleetDispatchEntry[]
  scheduledHold: FleetTicketRef[]
}

export interface FleetTicketRef {
  id: number
  summary: string
  priority: string
  company?: string
}

export interface FleetDispatchEntry {
  id: number
  name: string
  start: string
  end: string
  type: 'On-Site' | 'Remote' | 'Meeting' | 'Schedule Hold' | 'Recurring'
  status?: string
}

export interface FleetData {
  techs: FleetTech[]
  schedHoldTickets: ScheduleHoldTicket[]
  lastSync: string
}

export interface ScheduleHoldTicket {
  id: number
  summary: string
  company: string
  priority: string
  member: string
  dateEntered: string
}

// ── Analytics ────────────────────────────────────
export interface AnalyticsData {
  kpis: {
    openTickets: { total: number; byBoard: Record<string, number> }
    inProgress: number
    highCritical: number
    multiTech: number
  }
  statusBreakdown: Array<{ status: string; count: number }>
  priorityBreakdown: Array<{ priority: string; count: number; color: string }>
  techWorkload: Array<{ name: string; count: number }>
}

// ── Filter / UI State ────────────────────────────
export type TechFilter = 'all' | 'critical' | 'high' | 'inProgress' | 'multiTech' | 'lowHos'
export type EntryType = 'On-Site' | 'Remote' | 'Meeting' | 'Schedule Hold' | 'Recurring'
```

---

## TanStack Query Hooks

### `useFleetData.ts`
```typescript
import { useQuery } from '@tanstack/react-query'
import type { FleetData } from '@/types/ops'

export function useFleetData() {
  return useQuery<FleetData>({
    queryKey: ['fleet', 'data'],
    queryFn: () => fetch('/api/fleet').then(r => r.json()),
    refetchInterval: 30_000, // Auto-refresh every 30s
    staleTime: 15_000,
  })
}
```

### `useAnalytics.ts`
```typescript
export function useAnalytics() {
  return useQuery<AnalyticsData>({
    queryKey: ['analytics'],
    queryFn: () => fetch('/api/analytics').then(r => r.json()),
    staleTime: 60_000, // 1 min
  })
}
```

---

## SI Team Filtering

The ops dashboard filters everything to **Systems Integration** team members only. The CW boards used:
- `systems integration (service)`
- `systems integration (security)`
- `systems integration (communication)`

Use the existing `getTickets` function from `src/lib/cw/client.ts` with board name conditions. For members, filter by those who appear on SI boards.

---

## Mobile Responsiveness

Every component MUST work at 375px width (per CLAUDE.md rules).

**Fleet Map mobile:**
- TechSidebar becomes a bottom sheet (collapsible)
- Map takes full screen
- TechProfilePanel becomes a full-screen modal

**Analytics mobile:**
- KPI cards: 2x2 grid instead of 4-column
- Charts: Stack vertically, full width
- Workload bars: Horizontal scroll if needed

**Schedule Holds mobile:**
- Full-width card list
- Drag-drop disabled on touch (use tap-to-assign instead)

---

## Implementation Order

Build in this sequence so each step is testable:

1. **Types + Samsara client** — `types/ops.ts`, `lib/samsara/client.ts`
2. **API routes** — `/api/fleet`, `/api/samsara/*`, `/api/analytics`
3. **Sidebar update** — Add expandable "Ops" nav item to `Sidebar.tsx` and `MobileNav.tsx`
4. **Ops layout + routing** — `app/(dashboard)/ops/layout.tsx`, page redirects
5. **OpsHeader** — Reusable header component
6. **Analytics view** — KPI cards + Recharts (no Samsara dependency, just CW data)
7. **Fleet Map** — Leaflet map + markers + TechSidebar
8. **Tech Profile Panel** — Slide-out panel
9. **Schedule Holds** — Hold list + drag-drop
10. **Context menus + modals** — Right-click actions, detail/edit modals
11. **Polish** — Toast notifications, loading states, error boundaries, mobile refinement

---

## Packages to Install

```bash
npm install react-leaflet leaflet recharts
npm install -D @types/leaflet
```

(`@tanstack/react-query` and `dnd-kit` should already be installed. Verify with `npm ls`.)

---

## Key Rules (From CLAUDE.md — Enforce These)

1. **BFF layer is sacred** — All API calls server-side only. Never import `lib/samsara/client.ts` or `lib/cw/client.ts` in client components.
2. **TypeScript strict** — No `any` types without explicit justification.
3. **Mobile-first** — Every component works at 375px.
4. **Performance budget** — First contentful paint < 1.5s; API calls < 300ms cached.
5. **Existing patterns** — Use the same Tailwind classes, component structure, and naming conventions as existing RxSkin files.
6. **Light mode** — Use standard Tailwind gray/color classes so `globals.css` light-mode overrides apply automatically.
7. **No new CSS variables** — Work within the existing color system.
8. **Dynamic imports** — Leaflet map MUST use `next/dynamic` with `{ ssr: false }`.

---

## Environment Variables Needed

Add to `.env.local` (never commit):
```
SAMSARA_API_TOKEN=<your-samsara-api-token>
SAMSARA_BASE_URL=https://api.samsara.com
```

CW credentials are already configured in `.env.local`.

---

## Testing Checklist

After each major component is built, verify:

- [ ] `next build` passes with zero TypeScript errors
- [ ] Sidebar shows "Ops" with expandable sub-items
- [ ] `/ops` redirects to `/ops/fleet-map`
- [ ] Fleet Map renders with dark tiles and markers
- [ ] Tech sidebar filters work (search + filter pills)
- [ ] Tech Profile Panel slides in/out smoothly
- [ ] Analytics KPI numbers match CW data
- [ ] Charts render with correct colors
- [ ] All views work at 375px mobile width
- [ ] Light mode toggle works on all Ops views
- [ ] No Samsara/CW API keys visible in browser network tab
- [ ] Auto-refresh pulls new fleet data every 30s

---

*Generated: 2026-03-27 — RX Skin Ops Hub Build Specification*
