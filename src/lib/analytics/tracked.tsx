// ============================================================
// <Tracked> HOC — RX Skin
// Wraps any component to automatically track render performance.
// Feeds the UI Component Registry (ui_components table) via the
// performance event pipeline.
//
// Usage:
//   import { Tracked } from '@/lib/analytics/tracked'
//   <Tracked name="TicketCard" page="/tickets">
//     <TicketCard {...props} />
//   </Tracked>
// ============================================================

'use client'

import React, { useEffect, useRef } from 'react'
import { trackPerformance, trackError } from './tracker'

interface TrackedProps {
  /** Component name — must match what AI sees in the registry */
  name: string
  /** Page path (auto-detected if omitted) */
  page?: string
  /** Additional metadata to include with events */
  metadata?: Record<string, unknown>
  children: React.ReactNode
}

/**
 * Wrapper component that automatically tracks render time and errors.
 * The data feeds into the ui_components table for AI analysis.
 */
export function Tracked({ name, page, metadata, children }: TrackedProps) {
  const renderStart = useRef(performance.now())
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!mountedRef.current) {
      const renderTime = Math.round(performance.now() - renderStart.current)
      const pagePath = page ?? (typeof window !== 'undefined' ? window.location.pathname : '')

      trackPerformance(name, renderTime, {
        page: pagePath,
        mountType: 'initial',
        ...metadata,
      })

      mountedRef.current = true
    }
  }, [name, page, metadata])

  return (
    <TrackedErrorBoundary name={name} page={page}>
      {children}
    </TrackedErrorBoundary>
  )
}

// ── Error Boundary for Tracked Components ───────────────

interface ErrorBoundaryProps {
  name: string
  page?: string
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class TrackedErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    const { name, page } = this.props
    const pagePath = page ?? (typeof window !== 'undefined' ? window.location.pathname : '')

    trackError(`component_error:${name}`, name, {
      page: pagePath,
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack?.slice(0, 500),
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          Something went wrong in {this.props.name}
        </div>
      )
    }
    return this.props.children
  }
}
