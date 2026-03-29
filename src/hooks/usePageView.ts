// ============================================================
// usePageView — RX Skin
// Automatically tracks page views when a route loads.
// Drop into any page component's top-level for instant tracking.
//
// Usage:
//   usePageView('/tickets')
// ============================================================

'use client'

import { useEffect } from 'react'
import { trackPageView } from '@/lib/analytics/tracker'

/**
 * Track a page view on mount. Safe to call in any client component.
 */
export function usePageView(
  page?: string,
  metadata?: Record<string, unknown>
): void {
  useEffect(() => {
    const pagePath =
      page ?? (typeof window !== 'undefined' ? window.location.pathname : '/')
    trackPageView(pagePath, metadata)
    // Only fire on mount — not on metadata changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])
}
