// ============================================================
// Frontend Analytics Tracker — RX Skin
// Client-side event tracking that feeds the Admin Advisor bot.
// All events are batched and sent to /api/analytics/event.
// ============================================================

'use client'

type EventType = 'page_view' | 'click' | 'feature_use' | 'error' | 'performance'

interface AnalyticsEvent {
  eventType: EventType
  eventName: string
  page?: string
  component?: string
  metadata?: Record<string, unknown>
}

// ── Session Management ──────────────────────────────────

let sessionId: string | null = null

function getSessionId(): string {
  if (sessionId) return sessionId
  // Generate a unique session ID per browser tab
  sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  return sessionId
}

// ── Event Queue & Batching ──────────────────────────────

const eventQueue: AnalyticsEvent[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
const FLUSH_INTERVAL_MS = 5_000 // Batch every 5 seconds
const MAX_BATCH_SIZE = 25

/**
 * Track an analytics event. Events are batched and sent periodically.
 */
export function trackEvent(event: AnalyticsEvent): void {
  eventQueue.push({
    ...event,
    page: event.page ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
  })

  // Flush immediately if batch is full
  if (eventQueue.length >= MAX_BATCH_SIZE) {
    flush()
    return
  }

  // Otherwise schedule a flush
  if (!flushTimer) {
    flushTimer = setTimeout(flush, FLUSH_INTERVAL_MS)
  }
}

/**
 * Send all queued events to the server.
 */
function flush(): void {
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }

  if (eventQueue.length === 0) return

  const batch = eventQueue.splice(0, MAX_BATCH_SIZE)
  const payload = {
    sessionId: getSessionId(),
    viewport: typeof window !== 'undefined'
      ? `${window.innerWidth}x${window.innerHeight}`
      : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    events: batch,
  }

  // Use sendBeacon for reliability (survives page unload)
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
    navigator.sendBeacon('/api/analytics/event', blob)
  } else {
    // Fallback to fetch
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {}) // Swallow — analytics must never break the app
  }
}

// ── Convenience Helpers ─────────────────────────────────

/**
 * Track a page view.
 */
export function trackPageView(page: string, metadata?: Record<string, unknown>): void {
  trackEvent({
    eventType: 'page_view',
    eventName: `view:${page}`,
    page,
    metadata,
  })
}

/**
 * Track a user click/interaction.
 */
export function trackClick(
  component: string,
  action: string,
  metadata?: Record<string, unknown>
): void {
  trackEvent({
    eventType: 'click',
    eventName: action,
    component,
    metadata,
  })
}

/**
 * Track feature usage (e.g., "used kanban drag-drop", "ran script").
 */
export function trackFeatureUse(
  featureName: string,
  component?: string,
  metadata?: Record<string, unknown>
): void {
  trackEvent({
    eventType: 'feature_use',
    eventName: featureName,
    component,
    metadata,
  })
}

/**
 * Track a client-side error.
 */
export function trackError(
  errorName: string,
  component?: string,
  metadata?: Record<string, unknown>
): void {
  trackEvent({
    eventType: 'error',
    eventName: errorName,
    component,
    metadata,
  })
}

/**
 * Track component render performance.
 */
export function trackPerformance(
  component: string,
  renderTimeMs: number,
  metadata?: Record<string, unknown>
): void {
  trackEvent({
    eventType: 'performance',
    eventName: `render:${component}`,
    component,
    metadata: { renderTimeMs, ...metadata },
  })
}

// ── Flush on page unload ────────────────────────────────

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flush)
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flush()
    }
  })
}
