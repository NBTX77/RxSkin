# RX Skin - Architecture

## Overview
RX Skin is a full replacement frontend for ConnectWise Manage, built with Next.js 14+ App Router. It calls the CW REST API through a Backend-for-Frontend (BFF) layer.

## System Diagram
Browser (React/Next.js) -> Next.js API Routes (BFF) -> ConnectWise REST API / Samsara Fleet API / Future Integrations

## BFF Layer
Security boundary between browser and external APIs. Credentials never exposed to browser. All calls tenant-aware, rate-limited, cached server-side. Location: src/app/api/.

## API Routes
- /api/tickets - Ticket list with filtering (GET), detail + status (GET/PATCH)
- /api/tickets/[id]/notes - Notes (GET/POST)
- /api/fleet - Merged fleet data from Samsara + CW (GET)
- /api/fleet/trails - GPS breadcrumb polylines (GET)
- /api/analytics - Ops analytics (GET)
- /api/samsara/* - Raw vehicle/driver/HOS data (GET)
- /api/companies, /api/members, /api/schedule, /api/search

## Floating Card UI Pattern
All overlays: bg-gray-900/90 backdrop-blur-xl rounded-xl shadow-2xl. Draggable via useDraggable hook. z-index: sidebar 1100, map cards 1000, profile 1050.

## Theme System
html.light/html.dark class toggle via ThemeProvider. CSS remaps in globals.css. Never use dark: Tailwind prefix.

## Caching
- BFF: In-memory LRU (src/lib/cache/bff-cache.ts), 30s TTL
- Dedup: src/lib/cache/dedup.ts, inflight collapse
- Client: TanStack Query, 30s staleTime

Last updated: 2026-03-28
