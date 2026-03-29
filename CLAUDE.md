# CLAUDE.md — RX Skin: ConnectWise Modern Frontend Portal

> **Master project file for AI-assisted development.**
> Read this first at the start of every session. It contains the full project context, tech stack, architectural decisions, and workflow rules.

---

## Project Identity

| Field | Value |
|-------|-------|
| **Project Name** | RX Skin |
| **Purpose** | Modern, mobile-first frontend (reskin) for ConnectWise Manage — built for MSP technician productivity |
| **Owner** | RX Technology — Travis Brown |
| **Primary Developer** | Travis Brown + AI (Claude / Cowork) |
| **Dev Environment** | Claude Cowork (Linux VM, Node.js available) |
| **Target Hosting** | Vercel — https://rxtech.app (production) |
| **Current Phase** | Phase 1A Complete — Department Routing + Projects Board + Schedule + Ops Hub |
| **Git Repository** | https://github.com/NBTX77/RxSkin |
| **Notion Hub** | https://www.notion.so/32ffac121d4981c6bda6d0163795af05 |
| **Asana Project** | TBD (to be created) |

---

## What This Project Is

RX Skin is a **full replacement frontend UI** for ConnectWise Manage. It does NOT modify ConnectWise itself — it calls the ConnectWise REST API and presents a completely reimagined interface built for speed, mobile use, and MSP multi-integration workflows.

Think: the power of ConnectWise, with the UX of a modern SaaS product.

### Core Goals
- Make ticket logging fast, smooth, and zero-friction
- Drag-and-drop ticket scheduling with Day / Week / 2-Week / Month views
- Mobile-first design — full feature parity on phones and tablets
- Multi-tenant architecture from day one (internal first, client-accessible later)
- Progressive integration hub: start with ConnectWise, grow to cover the full MSP toolchain

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Next.js 14+ (App Router) | SSR, Server Components, API routes as BFF, Vercel-native |
| **Language** | TypeScript (strict) | Type safety, autocomplete, refactor confidence |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first, fast iteration, consistent component library |
| **State / Data** | TanStack Query (React Query v5) | Smart caching, request deduplication, stale-while-revalidate |
| **Scheduler** | FullCalendar React | Professional drag-drop calendar with Day/Week/Month views |
| **Drag & Drop** | dnd-kit | Lightweight, accessible, touch-friendly |
| **Auth** | NextAuth.js (next-auth v5) | Session management, JWT, multi-tenant credential injection |
| **Database** | PostgreSQL (Supabase or self-hosted) | Multi-tenant RLS, fast queries, audit logs |
| **ORM** | Prisma | Type-safe DB access, migration management |
| **Icons** | Lucide React | Clean, consistent, lightweight |
| **Testing** | Vitest + React Testing Library + Playwright (E2E) | Unit, integration, and E2E coverage |
| **Deployment** | Vercel (preferred) / Docker-ready | CI/CD per branch, preview URLs, edge functions |

---

## Architecture Overview

```
Browser (React / Next.js App)
    ↕ (HTTPS, JWT)
Next.js API Routes (BFF Layer — server-side only)
    ├── Auth middleware (tenant resolution, credential injection)
    ├── Cache layer (in-memory LRU, optional Redis)
    ├── Request deduplication
    └── Rate limit management
         ↕
ConnectWise REST API  |  Microsoft Graph  |  Future integrations
```

The BFF (Backend for Frontend) layer is **critical**:
- API credentials are NEVER exposed to the browser
- All CW API calls are tenant-aware and rate-limited from the server
- Responses are normalized and cached before reaching the React app

Full architecture details: `docs/ARCHITECTURE.md`
Full auth architecture: `docs/AUTH_ARCHITECTURE.md`

---

## ConnectWise Integration

- **API Version:** REST (v2022.1+)
- **Auth:** API Key authentication (Basic Auth with Base64 encoded `publicKey:privateKey`)
- **Rate Limit:** ~40 req/sec per API member — managed by BFF cache layer
- **Key endpoints used:** `service/tickets`, `schedule/entries`, `company/companies`, `time/entries`, `system/configurations`
- **Credentials:** Stored encrypted in database (`tenants.cw_api_key`, `tenants.cw_api_secret`) — NEVER in `.env` checked into Git

---

## Multi-Tenant Design

- **Phase 1:** Single-tenant (RX Technology internal)
- **Phase 2:** Multi-tenant (manage multiple client companies from one portal)
- Database uses `tenant_id` on every table + PostgreSQL RLS policies from day one
- Tenant switching via JWT token issued by NextAuth
- Each tenant has their own stored CW API credentials
- Cache keys always namespaced: `[tenantId, resource, id]`

---

## Integrations Roadmap

| Integration | Status | Priority | API Available |
|------------|--------|----------|---------------|
| ConnectWise Manage | Phase 1 | Critical | ✅ REST API |
| Microsoft Graph (M365) | Phase 2 | High | ✅ REST API |
| CW Automate | Phase 2 | High | ✅ REST API (MCP connected) |
| CW Control (ScreenConnect) | Phase 2 | High | ✅ REST API — control.rxtech.com |
| Auvik | Phase 3 | Medium | ✅ REST API |
| Meraki | Phase 3 | Medium | ✅ REST API |
| Datto BCDR | Phase 3 | Medium | ✅ REST API |
| Acronis | Phase 3 | Medium | ✅ REST API |
| Fortinet | Phase 3 | Medium | ✅ REST API |
| Webex (Calling + Messaging) | Phase 2 | High | ✅ REST API + OAuth2 |
| SentinelOne | Phase 2 | High | ✅ REST API (MCP connected) |
| Passportal | Phase 3 | Medium | ✅ API Key + HMAC (MCP connected) |
| Scalepad | Phase 3 | Medium | ✅ API Key (MCP connected, partner-only) |

Full integration details: `docs/INTEGRATIONS.md`

---

## ConnectWise Control (ScreenConnect) Integration

- **Server:** `https://control.rxtech.com`
- **Auth:** Basic Auth (Base64 `username:password`) — stored in BFF env vars
- **Purpose:** One-click remote control from ticket right-click menu

### Session GUID Retrieval
- **Endpoint:** `POST /Services/PageService.ashx/GetHostSessionInfo`
- **Body:** `[2, ["All Machines"], "searchFilter", null, limit]` (2 = Access sessions)
- **Returns:** Sessions with GUID, computer name, online status

### Launch URL Pattern
```
https://control.rxtech.com/Host#Access/All%20Machines//<SESSION-GUID>/Join
```

### Data Chain (Ticket → Remote Session)
1. CW Manage ticket → company name
2. Automate API → computers for that company (filtered by `Client.Name`)
3. Control API → match computer name to session GUID
4. Construct launch URL → open in new browser tab

### BFF Environment Variables
```
SCREENCONNECT_BASE_URL=https://control.rxtech.com
SCREENCONNECT_USERNAME=
SCREENCONNECT_PASSWORD=
```

## Unified Authentication Architecture (Decided 2026-03-28)

RX Skin uses a **two-tier auth model** so techs log in once and access all platforms:

### Tier 1: Service Account Credentials (Per-Tenant, Stored in DB)
CW Manage, Automate, Control, Passportal, ScalePad, Datto, Auvik, SentinelOne — all use org-level API keys/tokens. One set per tenant, encrypted with AES-256-GCM in `TenantCredential` table. BFF injects credentials on every API call.

### Tier 2: User-Delegated OAuth2 (Per-User)
Microsoft Graph and Webex require per-user OAuth2 consent. User connects once in Settings → tokens stored encrypted in `UserOAuthToken` table → auto-refreshed by BFF.

### Key Decisions
- **Azure AD as primary IdP** — register one multi-tenant Azure AD app for NextAuth login + Graph API
- **Credential Vault** — all integration credentials stored encrypted in PostgreSQL, resolved by `getTenantCredentials(tenantId, platform)`
- **Graph scopes (delegated):** `Mail.Read Mail.Send Calendars.ReadWrite Presence.Read.All Chat.Read`
- **Webex scopes:** `spark:calling spark:messages_read spark:messages_write spark:people_read spark-admin:calling_cdr_read`
- **CW Home SSO with Azure AD** — recommended to configure so ScreenConnect launch URLs work seamlessly

Full auth architecture: `docs/AUTH_ARCHITECTURE.md`

---

## UI Architecture (Decided 2026-03-28)

### Navigation Pattern
- **Desktop:** Collapsible left sidebar — icon rail (w-12) by default, expands to w-52 on hover (overlay, not push). Department label shown under "RX Skin" branding. Dept switcher popover on RX logo click (admin/LT only).
- **Mobile:** Bottom nav bar (5 main items) — stays for primary pages
- **Both:** Persistent top bar with search icon (Ctrl+K) + **UserAvatar dropdown** pinned to top-right
- **UserAvatar dropdown:** Profile & Settings link, Admin Panel link (admin-only), Sign Out
- **Theme toggle:** Moved from sidebar/mobile nav into Settings → Appearance tab

### User Settings Page (`/settings`) — Tabbed Layout
| Tab | Contents |
|-----|----------|
| **Profile** | Avatar, name, email, role, department, CW connection status |
| **Appearance** | Light/dark theme toggle, compact mode, display preferences |
| **Connections** | Connect Microsoft 365 (OAuth2), Connect Webex (OAuth2) — per-user |
| **Notifications** | Email notification prefs, in-app notifications, desktop push, sound alerts |

### Admin Panel (`/admin`) — Admin Role Only
Left sidebar nav within admin section. Orange accent color to distinguish from main UI.

| Section | Route | Purpose |
|---------|-------|---------|
| **Overview** | `/admin` | Dashboard cards linking to all admin sections |
| **Integrations** | `/admin/integrations` | Credential Vault UI — add/edit/test API keys for all 10 platforms (Tier 1 + Tier 2) |
| **Users** | `/admin/users` | User list with role/dept/status, add/edit/disable users, role assignment |
| **Tenant Settings** | `/admin/tenant` | Company info, CW board mappings, cache TTLs, rate limits, database info |
| **AI & Bots** | `/admin/ai` | Configure AI provider + API key, enable/disable bots (RX Assistant, Admin Advisor, Ticket Triage, Insights Engine), chatbot placement options |
| **Analytics** | `/admin/analytics` | Click tracking, scroll depth, heatmaps, dead zone detection, session recording, AI-powered improvement suggestions with approve/reject workflow |
| **Audit Log** | `/admin/audit-log` | All API calls, credential access events, logins, admin actions — filterable |

### AI Integration Architecture
- **AI Provider:** Configurable (Anthropic Claude default, OpenAI optional)
- **AI API key:** Stored encrypted in admin settings, used for all bot features
- **Behavior Analytics → AI Pipeline:** Click tracking, heatmaps, and dead zone data feed into the Admin Advisor bot
- **Admin Advisor workflow:** AI analyzes usage data → generates suggestions → admin reviews → approves/rejects → approved changes can be implemented
- **Chatbot placement options:** Floating bubble (bottom-right), inline in ticket detail sidebar, Ctrl+K natural language integration

---

## Project Structure (Current)

```
rx-skin/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth pages (login, etc.)
│   ├── (dashboard)/              # Protected app pages
│   │   ├── tickets/              # Ticket list + detail
│   │   │   └── [id]/             # Ticket detail (notes, time, remote tools)
│   │   ├── projects/             # ★ Department-aware project views
│   │   ├── schedule/             # Calendar scheduler views
│   │   ├── companies/            # Client company views
│   │   ├── ops/                  # Fleet map, analytics, holds
│   │   ├── settings/             # ★ Tabbed user settings (Profile, Appearance, Connections, Notifications)
│   │   └── admin/                # ★ Admin Panel (admin-only, orange accent)
│   │       ├── integrations/     # Credential Vault UI (10 platforms)
│   │       ├── users/            # User management (roles, depts)
│   │       ├── tenant/           # Tenant config (boards, cache, rate limits)
│   │       ├── ai/               # AI & Bots config (4 bots, chatbot placement)
│   │       ├── analytics/        # Behavior tracking, heatmaps, AI suggestions
│   │       └── audit-log/        # API calls, credential access, login events
│   └── api/                      # BFF API routes
│       ├── auth/                 # NextAuth endpoints
│       ├── tickets/              # Ticket CRUD + notes + time entries
│       ├── projects/             # ★ Project list + detail + update
│       ├── schedule/             # Schedule entries
│       ├── automate/             # CW Automate (RMM) — computers, scripts
│       ├── control/              # ScreenConnect — session GUID + launch URL
│       ├── fleet/                # Samsara fleet data
│       ├── samsara/              # Samsara drivers, vehicles, HOS
│       ├── analytics/            # Behavior analytics data
│       ├── members/              # CW member lookup
│       └── search/               # Global search
├── components/                   # Shared UI components
│   ├── dashboard/                # MyDayClient
│   ├── tickets/                  # TicketListClient, TicketDetail, TicketCard, QuickClosePanel
│   ├── projects/                 # ★ ProjectKanban, FinancialTable, PortfolioView, etc.
│   ├── remote/                   # ★ TicketActions, ComputerPicker, SystemInfoPanel, ScriptRunner
│   ├── ops/                      # FleetMap, TechSidebar, AnalyticsDashboard, ScheduleHoldList, etc.
│   ├── department/               # ★ DepartmentProvider context
│   ├── layout/                   # ★ Sidebar, MobileNav, TopBar, UserAvatar, GlobalSearch
│   └── theme/                    # ThemeProvider
├── lib/                          # Utilities and core logic
│   ├── cw/                       # ConnectWise API client + normalizers
│   ├── automate/                 # CW Automate API client
│   ├── control/                  # ScreenConnect API client
│   ├── samsara/                  # Samsara fleet API client
│   ├── cache/                    # BFF cache + deduplication + write-through
│   ├── auth/                     # Auth config + credential helpers
│   ├── api/                      # Error handlers
│   ├── fleet/                    # Fleet data merge utilities
│   ├── db/                       # Prisma client singleton
│   ├── instrumentation/          # API call logger + tenant context
│   └── analytics/                # Frontend event tracker + <Tracked> HOC
├── prisma/                       # Database schema + migrations
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript types (dept codes, projects, tickets, etc.)
├── docs/                         # All project documentation (consolidated)
│   ├── ARCHITECTURE.md           # System architecture
│   ├── AUTH_ARCHITECTURE.md      # Two-tier auth design
│   ├── INTEGRATIONS.md           # Integration specs (CW, Graph, Webex, etc.)
│   ├── API_STRATEGY.md           # API design patterns
│   ├── ROADMAP.md                # Feature roadmap
│   ├── CONTRIBUTING.md           # Contribution guidelines
│   ├── DIAGRAMS.md               # Architecture diagrams
│   ├── mockups/                  # ★ Department dashboard mockups (5 JSX files)
│   ├── analysis/                 # ★ Department analysis documents (docx)
│   └── planning/                 # ★ Feature plans and build prompts
├── .env.example                  # Template — never commit .env
└── auth.ts                       # NextAuth v5 re-export (required by middleware)
```

**Workspace Root (`CW- Rx Skin/`)**
```
├── CLAUDE.md                     # THIS FILE — master project doc
├── todo.md                       # ★ Shared task list (Claude Code + Cowork) — aesthetic improvement build prompts
├── INSTRUCTIONS.md               # AI session instructions
└── rx-skin/                      # Main Next.js application — the ONLY git repo (NBTX77/RxSkin)
    # NOTE: rx-ops-hub was deleted 2026-03-28. Ops Hub features are folded into rx-skin.
```

---

## Git Workflow

- **Main branch:** `main` — always deployable
- **Development branch:** `develop` — integration branch
- **Feature branches:** `feat/ticket-drag-drop`, `feat/schedule-week-view`, etc.
- **Bug branches:** `fix/ticket-form-validation`
- **Commit format:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`)
- **PRs:** All features merge via PR to `develop` → reviewed → merged to `main`
- **Tags:** Semantic versioning (`v0.1.0`, `v1.0.0`, etc.)
- **Never commit:** `.env`, API keys, secrets, `node_modules`

---

## Project Management

| Tool | Use |
|------|-----|
| **Asana** | Sprint tasks, feature requests, bug tracking, day-to-day work items |
| **Notion** | Project hub, architecture docs, decisions log, integration notes, API research |
| **GitHub Issues** | Code-linked bugs and technical issues (linked to Asana tasks) |
| **GitHub Projects** | Kanban board tied to GitHub Issues |

---

## Environment Variables

All secrets stored in `.env.local` (never committed). See `.env.example` for required keys.

Required variables:
```
# ConnectWise
CW_BASE_URL=
CW_CLIENT_ID=
CW_PUBLIC_KEY=
CW_PRIVATE_KEY=
CW_COMPANY_ID=

# Database
DATABASE_URL=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Microsoft Graph + Azure AD (multi-tenant app)
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
AZURE_AD_TENANT_ID=                    # RX Technology tenant

# Webex
WEBEX_CLIENT_ID=
WEBEX_CLIENT_SECRET=
WEBEX_REDIRECT_URI=https://rxtech.app/api/auth/callback/webex

# ConnectWise Control / ScreenConnect
SCREENCONNECT_BASE_URL=https://control.rxtech.com
SCREENCONNECT_USERNAME=
SCREENCONNECT_PASSWORD=

# Credential Vault Encryption
CREDENTIAL_ENCRYPTION_KEY=             # 256-bit key for AES-256-GCM
```

---

## Cowork ↔ Claude Code Collaboration Model

RX Skin is built using a **two-AI workflow**. Read this before every session.

### Who Does What

| Role | Tool | Responsibilities |
|------|------|-----------------|
| **Cowork** (cloud) | Claude desktop app | Planning, architecture decisions, task spec writing, design direction, research, doc updates, Asana/Notion sync |
| **Claude Code** (local, on Travis's machine) | CLI in `rx-skin/` directory | All file creation/editing, running `next build`, git commits, pushing to GitHub |

### The Shared Task Log: `todo.md`

`todo.md` lives one level up from this file, at the workspace root (`CW- Rx Skin/todo.md`). It is the **single source of truth** for what needs to be built.

- **Cowork writes tasks** into `todo.md` — with full specs, file paths, and implementation details
- **Claude Code reads `todo.md`** at the start of each local session, works through tasks top to bottom, and marks each one complete when done
- **Task status markers:**
  - `[ ]` — pending, not started
  - `[~]` — in progress (Claude Code is working on it)
  - `[x]` — complete (code written, build passes, committed)
- Claude Code should **commit each task separately** with a conventional commit message, then mark it `[x]` in `todo.md` and commit that update too
- Cowork will add new tasks to `todo.md` between sessions — Claude Code picks them up next time it runs

### Rules for Claude Code

1. **Always read `../todo.md` first** — it has the current task queue. Do not ask Travis what to work on — read the task list.
2. **Never commit secrets or credentials** — use `.env.local` only
3. **BFF layer is sacred** — CW API calls are always server-side only
4. **Tenant ID must be in every query** — never skip tenant scoping
5. **TypeScript strict mode** — no `any` types without explicit justification
6. **Mobile-first** — every component must work on 375px width
7. **Performance budget:** First contentful paint < 1.5s; API calls < 300ms cached
8. **All API routes + dashboard layout need `export const dynamic = 'force-dynamic'`** or `next build` fails
9. **Run `next build` after each task** to confirm TypeScript is clean before committing
10. **Document architectural decisions** in `docs/ARCHITECTURE.md` as you make them
11. When in doubt about CW API behavior — check `docs/INTEGRATIONS.md` first, then CW developer docs
12. **NEVER write hardcoded dark-only classes** — always use the light/dark pattern. See Theming Rules below.

### After Completing Each Task

1. Run `next build` — confirm it passes with no TypeScript errors
2. Git commit the code: `feat: <task name>`
3. Update `../todo.md` — change `[ ]` to `[x]`, move task to "Completed Tasks" section
4. Git commit the todo update: `chore: mark task X complete in todo.md`
5. Push both commits to `main`

**Never mark a task complete if the build fails or TypeScript errors exist.**

---

## Theming Rules — MANDATORY for All New Components

RX Skin supports light and dark mode. `ThemeProvider` toggles a `dark` class on `<html>`. Tailwind's `darkMode: 'class'` strategy means `dark:` prefixes only activate when that class is present.

**The rule: base styles = light mode. `dark:` = dark override. Always.**

```tsx
// ✅ CORRECT — theme-aware
<div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50">
  <p className="text-gray-900 dark:text-white">Title</p>
  <p className="text-gray-600 dark:text-gray-400">Subtitle</p>
</div>

// ❌ WRONG — dark-only, breaks light mode
<div className="bg-gray-900 border border-gray-700/50">
  <p className="text-white">Title</p>
  <p className="text-gray-400">Subtitle</p>
</div>
```

### Standard Color Mappings

| Purpose | Light mode class | Dark mode class |
|---------|-----------------|-----------------|
| Page background | `bg-gray-50` | `dark:bg-gray-950` |
| Card / panel | `bg-white` | `dark:bg-gray-900` |
| Secondary card | `bg-gray-50` | `dark:bg-gray-800/80` |
| Input background | `bg-white` | `dark:bg-gray-800` |
| Primary text | `text-gray-900` | `dark:text-white` |
| Secondary text | `text-gray-600` | `dark:text-gray-400` |
| Muted / placeholder | `text-gray-500` | `dark:text-gray-500` |
| Primary border | `border-gray-200` | `dark:border-gray-700/50` |
| Secondary border | `border-gray-100` | `dark:border-gray-800` |
| Input border | `border-gray-300` | `dark:border-gray-700/50` |
| Row hover | `hover:bg-gray-50` | `dark:hover:bg-gray-800/50` |
| Table divider | `divide-gray-100` | `dark:divide-gray-800` |
| Sidebar | `bg-white` | `dark:bg-gray-900` |

### What Does NOT Need `dark:` Variants
- Accent/status colors (`text-blue-400`, `text-red-400`, `text-green-400`, etc.) — readable in both modes
- Opacity-based badge backgrounds (`bg-blue-500/10`, `bg-red-950`) — work in both modes
- Pure utility classes (`rounded-xl`, `flex`, `gap-3`, `p-4`) — no color involved

> **Why this rule exists:** The entire app was originally built dark-only with no `dark:` prefixes. When light mode was toggled, every component stayed gray. Task 10 in `todo.md` was created to fix this retroactively. Don't create more debt.

---

## Key Contacts & Accounts

| Resource | Details |
|----------|---------|
| **Project Owner** | Travis Brown — travislbrown@gmail.com |
| **ConnectWise Manage** | RX Technology production instance |
| **GitHub** | https://github.com/NBTX77/RxSkin |
| **Vercel** | https://rxtech.app (production) |
| **Supabase / DB** | rxtech-app (rymoaztiblxwltwydtll), us-west-2, 15 tables |

---

## Department-Based Architecture (Decided 2026-03-28)

RX Skin serves 5 departments, each with a tailored dashboard and nav. User's department is determined at login from their CW member `defaultDepartment` field.

| Dept Code | Name | CW Boards | Members | Key Screens |
|-----------|------|-----------|---------|-------------|
| **IT** | MSP & Engineers | Managed Services, Engineering, Alerts/Monitoring, IT Installations | 80 | Tickets, Ticket Kanban, Projects, Fleet Map, Calendar, Alerts, Timer |
| **SI** | Systems Integration | SI (Service), SI (Security), SI (Communication) | 38 | Project Kanban (primary), Service Queue, Job Scheduler, Fleet Map, Materials |
| **AM** | Account Management | Opportunities | 17 | My Accounts, Company 360, Agreements, Opportunity Pipeline, Client Health |
| **GA** | Accounting/Procurement | Procurement | 8 | Invoices, POs, Project Financials, Time & Billing, Agreements, Catalog |
| **LT** | Leadership Team | All boards (cross-dept) | Exec | Exec Dashboard, Project Portfolio, Utilization, Financials, Dept Drill-Down |

### Projects Board (Critical)
- 53 open projects: 23 SI (13,595 budget hrs), 16 IT (154 hrs), 14 G&A (2,467 hrs)
- Projects Board renders differently per department: IT/SI get kanban (work mode), AM gets read-only status, GA gets financial table, LT gets portfolio heatmap
- Project status pipeline: 10 New → 20 Incomplete Handoff → 30 Assigned to PM → 31/33/34 Work Stages → 50 Completed
- All projects use ActualRates billing — time tracking accuracy is critical
- Project-to-ticket linkage must work both directions

### Implementation Phases
- **Phase 1A:** Department routing + IT experience (tickets + projects + timer)
- **Phase 1B:** SI department + full project kanban
- **Phase 2A:** Account Management (Company 360, agreements, opportunities)
- **Phase 2B:** G&A / Accounting (invoices, POs, project financials)
- **Phase 3:** Leadership Dashboard (exec KPIs, portfolio heatmap, utilization)

### Department Mockups
Interactive React mockups in `rx-skin/docs/mockups/`: `mockup-IT-Dashboard.jsx`, `mockup-SI-Dashboard.jsx`, `mockup-AM-Dashboard.jsx`, `mockup-GA-Dashboard.jsx`, `mockup-LT-Dashboard.jsx`

---

## Status

- [x] Project defined and scoped
- [x] Architecture documented
- [x] Integration research complete
- [x] GitHub repository created — https://github.com/NBTX77/RxSkin
- [x] Next.js project scaffolded — `C:\Users\TBrown\Desktop\rx-skin\`
- [x] Login page built and working (stub credentials)
- [x] Dashboard, tickets, schedule, companies, settings page shells
- [x] Full ticket list UI (search, desktop table, mobile cards)
- [x] BFF API routes wired to ConnectWise
- [x] Production build clean (`next build` passes, TypeScript clean)
- [x] Vercel MCP connected
- [x] Supabase MCP connected
- [x] Git installed on Windows dev machine
- [x] Code pushed to GitHub (NBTX77/RxSkin)
- [x] Deployed to Vercel — https://rxtech.app (production)
- [x] Login working with Phase 1 demo credentials (admin@rxtech.app / RxSkin2026!)
- [x] Department architecture analysis complete — 5 depts mapped to CW boards/members
- [x] Projects Board deep dive — 53 projects analyzed, status pipeline mapped, per-dept rendering spec
- [x] Department dashboard mockups created (IT, SI, AM, GA, LT)
- [x] ScreenConnect integration researched — control.rxtech.com, GUID retrieval via Control API, launch URL pattern confirmed
- [x] Ticket detail page (`/tickets/[id]`) — notes, time entries, mobile-responsive
- [x] Remote tools built — TicketActions, ComputerPicker, SystemInfoPanel, ScriptRunner components
- [x] Automate BFF routes — `/api/automate/computers`, `/api/automate/scripts` (GET + POST)
- [x] Control BFF route — `/api/control` (session GUID lookup + launch URL)
- [x] Automate + Control API clients — `lib/automate/client.ts`, `lib/control/client.ts`
- [x] Unified auth architecture designed — two-tier model (service accounts + user OAuth2)
- [x] Microsoft Graph + Webex integration researched — scopes, endpoints, multi-tenant Azure AD app
- [x] Auth architecture document written — `docs/AUTH_ARCHITECTURE.md`
- [x] Top bar + UserAvatar dropdown — pinned top-right, profile/settings/admin/sign-out
- [x] Tabbed Settings page — Profile, Appearance (theme toggle), Connections (M365/Webex OAuth), Notifications
- [x] Admin Panel built — layout with sidebar nav + 6 sections
- [x] Admin Integrations — Credential Vault UI for all 10 platforms (Tier 1 + Tier 2)
- [x] Admin Users — user list, role/dept badges, search/filter, add/disable
- [x] Admin Tenant Settings — company info, CW board mappings, cache TTLs, rate limits
- [x] Admin AI & Bots — AI provider config, 4 bots (RX Assistant, Admin Advisor, Ticket Triage, Insights Engine), chatbot placement
- [x] Admin Analytics — click tracking, heatmaps, dead zones, AI improvement suggestions with approve/reject workflow
- [x] Admin Audit Log — API calls, credential access, logins, admin actions with filters
- [x] CW API credentials configured in Vercel — CW_BASE_URL, CW_CLIENT_ID, CW_PUBLIC_KEY, CW_PRIVATE_KEY, CW_COMPANY_ID (all environments)
- [x] Auth env vars configured in Vercel — NEXTAUTH_SECRET, AUTH_TRUST_HOST, ADMIN_EMAIL, ADMIN_PASSWORD
- [x] Samsara env vars configured in Vercel — SAMSARA_API_TOKEN, SAMSARA_BASE_URL
- [x] Vercel build passing — `force-dynamic` fix applied to all 18 API routes + dashboard layout (commits c16ab15, ccf0033)
- [x] Notion project hub updated — status, roadmap, accounts registry all current
- [x] Supabase database created + Prisma migrations run — rxtech-app project (rymoaztiblxwltwydtll), 8 tables + _prisma_migrations, RX Technology tenant + admin user seeded
- [x] DATABASE_URL configured in Vercel (all environments) — pooler connection via aws-0-us-west-2.pooler.supabase.com:6543
- [x] Prisma migration file saved to codebase — `prisma/migrations/20260328000000_init/migration.sql`
- [x] ConnectWise API connection tested with live data — 172 tickets, 53 projects, 740 companies, 100+ members verified
- [x] BFF normalizer fixes — ticket `resources` field (CW returns string, not array), project `department` mapping (CW full names → RX dept codes via `cwDeptToRxDept`)
- [x] Asana project tasks updated — 10 tasks marked complete (Phase 0 + Phase 1A + 1B tickets)
- [x] Department routing — DepartmentProvider, dept-aware sidebar with per-dept nav, department switcher
- [x] Projects Board — API routes (`/api/projects`, `/api/projects/[id]`), kanban, financial table, portfolio, read-only list, detail overlay
- [x] Department-aware Projects page — renders kanban (IT/SI), financial table (GA), portfolio heatmap (LT), read-only list (AM)
- [x] Observability DB tables — api_call_logs, analytics_events, ui_components, project_cache, company_cache, cache_sync_state (6 new tables, 15 total)
- [x] Prisma client singleton — `src/lib/db/prisma.ts` (shared across hot reloads)
- [x] API call instrumentation — all 4 API clients (CW, Samsara, Automate, Control) log every outbound call with timing, status, errors
- [x] Write-through cache — projects + companies persist to DB, survive Vercel cold starts, 3-tier read path (memory → DB → API)
- [x] Frontend analytics tracker — batched event queue with sendBeacon, page view/click/feature/error/performance tracking
- [x] `<Tracked>` HOC — wraps components for automatic render performance + error tracking, feeds UI component registry
- [x] `usePageView` hook — drop-in page view tracking for any route
- [x] Analytics event endpoint — `POST /api/analytics/event` (bulk insert + UI registry updates)
- [x] Cron sync endpoint — `GET /api/cron/sync` (Vercel cron every 5 min, warms project/company/ticket cache)
- [x] Tenant context resolver — `getDefaultTenantId()` for Phase 1 single-tenant instrumentation
- [x] Middleware Workflow Engine — deep research complete, architecture designed, feature proposal delivered (2026-03-28)
- [ ] **Middleware Workflow Engine Phase 1 (MVP)** — React Flow canvas in `/admin/workflows`, workflow CRUD API routes, BullMQ execution engine, manual triggers, DAG validation, execution history view
- [ ] **Middleware Workflow Engine Phase 2 (AI)** — Claude API for NLP workflow creation, 5–10 MSP templates (alert-to-ticket, security incident, client onboarding), AI error diagnosis, deploy approval gate
- [ ] **Middleware Workflow Engine Phase 3 (Advanced)** — Scheduled + webhook triggers, parallel execution, data transform nodes, pattern mining from audit logs, workflow map view (`/admin/workflows/map`)
- [ ] **Middleware Workflow Engine Phase 4 (Scale)** — Temporal.io migration (if needed), anomaly detection, execution heatmaps, multi-tenant workflow sharing
- [x] Schedule / calendar view — FullCalendar with Day/Week/2-Week/Month/List views, drag-drop rescheduling, event resize, dark theme, mobile-responsive
- [x] Schedule CRUD API — GET (list with date range + 2-week view), POST (create entry), PATCH `/schedule/[id]` (reschedule), DELETE `/schedule/[id]`
- [x] ScheduleEventDetail overlay — floating card with time, tech, company, linked ticket, delete action
- [x] `useScheduleEntries` + `useRescheduleEntry` + `useCreateScheduleEntry` + `useDeleteScheduleEntry` hooks
- [x] CRON_SECRET configured in Vercel (all environments)
- [x] Deep codebase review complete — 42 components, 22 API routes, 19 lib modules, 14 Prisma models audited (2026-03-28)
- [x] todo.md created — aesthetic improvement build prompts for Claude Code
- [x] Git repo cleaned — 34 garbage temp objects removed via `git gc`, fsmonitor + untrackedcache enabled, credential helper set to manager
- [x] Asana updated — FullCalendar + drag-drop tasks marked complete, 7 new tasks created from todo.md (critical/high security items)
- [x] Notion project hub updated — v0.1.3 version entry, schedule/observability/DB/review status rows added, Phase 2 calendar marked done
- [x] UI contrast + responsive fixes deployed — gray-700/50 borders, kanban column widths, TopBar bg-gray-900/95, fleet map min-height
- [x] Live CW data wired — ticket notes, time entries, global search (replaced mock data)
- [x] Instrumentation modules pushed to GitHub — api-logger.ts, tenant-context.ts, prisma.ts
- [x] Prisma schema committed to repo — `prisma/schema.prisma` (14 models, 384 lines)
- [x] Build script updated — `prisma generate && next build` (fixes Vercel @prisma/client init)
- [x] Vercel deployment GREEN — commit 690392e, all UI + data + instrumentation changes live at rxtech.app
- [x] Phase 3 aesthetic improvements complete (todo.md Tasks 1–15) — badge system, virtualized table, error boundaries, breadcrumbs, collapsible sidebar, dept switcher on logo, kanban overflow fix, drag-to-reorder columns, full light mode (52 files)
- [x] Codebase review cleanup complete — 9/9 sections of CODE-REVIEW-CLEANUP-PROMPT.md executed, QA bugs reconciled, stale files deleted, docs updated
- [x] Known issues resolved — PostCSS ESM/CJS fix, test infrastructure (Vitest + Playwright), calendar clipping fix, mock-data removal
- [x] Timer Widget — floating real-time timer, TimeTrackerProvider context, localStorage persistence, idle detection, auto-pause on tab away (commit 7efc316)
- [x] Quick Close Workflow — batch close API (POST /api/tickets/[id]/close), enhanced QuickClosePanel with time presets, work type dropdown, client notification toggle (commit f9611e5)
- [x] Dispatch Board — /dispatch route, FullCalendar resource timeline, drag-assign techs, unscheduled ticket sidebar, capacity indicators (commit b838594)
- [x] Team Visibility — /team route, tech workload grid, capacity bars, WorkloadSummary KPIs, department filter (commit 402fc47)
- [ ] Credential Vault — migrate env var creds to encrypted DB (`TenantCredential` table)
- [ ] Azure AD multi-tenant app registration + NextAuth provider
- [ ] Microsoft Graph BFF routes (mail, calendar, presence, Teams)
- [ ] Webex BFF routes (messaging, call history, click-to-call, queue stats)
- [ ] User OAuth2 connection flow (Settings → Connect M365 / Connect Webex)
- [ ] CW Home SSO configured with Azure AD as external IdP

## Middleware Workflow Engine (Decided 2026-03-28)

Major upcoming feature: a visual middleware workflow system in the Admin Console for configuring cross-system integration pipelines, automation rules, and event-driven triggers across all 10+ connected platforms.

### Architecture Decisions
- **Visual Editor:** React Flow (xyflow) — node-based canvas, MIT licensed, aligns with Next.js + Tailwind + shadcn/ui
- **Execution Engine:** BullMQ on Redis (Phase 1); Temporal.io considered for Phase 3+
- **AI Integration:** Claude API for natural language workflow creation, error diagnosis, pattern mining from audit logs
- **Database:** 4 new Prisma models — `Workflow`, `WorkflowExecution`, `WorkflowStepLog`, `WorkflowTemplate`
- **Node Types:** Trigger (green), Action (blue), Condition (orange), Transform (purple), Error Handler (red)

### Admin Routes
| Route | Purpose |
|-------|---------|
| `/admin/workflows` | Workflow list with status badges, success rate, last run |
| `/admin/workflows/[id]/edit` | React Flow visual editor canvas |
| `/admin/workflows/new?mode=ai` | Natural language → AI generates workflow → review → deploy |
| `/admin/workflows/templates` | Pre-built MSP templates (alert-to-ticket, security incident, etc.) |
| `/admin/workflows/[id]/runs` | Execution history with step-by-step trace |
| `/admin/workflows/map` | Read-only bird's-eye view of all active integration connections |

### BFF API Routes
`/api/workflows` (CRUD), `/api/workflows/:id/validate`, `/api/workflows/:id/test`, `/api/workflows/:id/run`, `/api/workflows/:id/runs`, `/api/workflows/ai/generate`, `/api/workflows/templates`

### Priority MSP Templates
- **P0:** Alert-to-Ticket (Automate/Auvik → CW Manage), Security Incident Response (SentinelOne → Automate → CW → Webex)
- **P1:** Client Onboarding Cascade, Ticket Enrichment (auto-fetch computers + remote sessions), Backup Failure Runbook
- **P2:** Contract Renewal Notification (ScalePad → CW → Graph)

### Security
- Credentials never exposed to frontend — workflow definitions reference credential IDs; BFF resolves via `getTenantCredentials()`
- Tenant-scoped with PostgreSQL RLS
- RBAC: ADMIN creates/edits, TECHNICIAN views/triggers
- Approval gate in Phase 2 before workflow activation

Full research document: `RX-Skin-Middleware-Workflow-Research.docx` in workspace root.

---

## Known Dev Environmen