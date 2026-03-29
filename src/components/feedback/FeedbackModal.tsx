'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  ThumbsUp,
  ThumbsDown,
  Camera,
  CheckCircle2,
  Loader2,
  ChevronDown,
} from 'lucide-react'
import type { FeedbackRating, FeedbackCategory, FeedbackSubmission } from '@/types/feedback'

interface FeedbackModalProps {
  onClose: () => void
  position: { x: number; y: number } | null // null = center on screen
  page: string
  component?: string
  featureLabel?: string
  viewport?: string
  sessionId: string
}

const CATEGORIES: { value: FeedbackCategory; label: string }[] = [
  { value: 'bug', label: 'Bug' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'ux_issue', label: 'UX Issue' },
  { value: 'performance', label: 'Performance' },
  { value: 'other', label: 'Other' },
]

export function FeedbackModal({
  onClose,
  position,
  page,
  component,
  featureLabel: initialFeatureLabel,
  viewport,
  sessionId,
}: FeedbackModalProps) {
  const [rating, setRating] = useState<FeedbackRating | null>(null)
  const [category, setCategory] = useState<FeedbackCategory>('bug')
  const [comment, setComment] = useState('')
  const [editingLabel, setEditingLabel] = useState(false)
  const [featureLabel, setFeatureLabel] = useState(initialFeatureLabel ?? '')
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [capturingScreenshot, setCapturingScreenshot] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const modalRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Detect mobile
  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    function handleResize() {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Auto-close after success
  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(onClose, 1500)
      return () => clearTimeout(timer)
    }
  }, [submitted, onClose])

  // Click outside to close
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) {
        onClose()
      }
    },
    [onClose]
  )

  // Escape to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Calculate position (desktop only)
  function getPositionStyle(): React.CSSProperties {
    if (isMobile || !position) return {}

    const modalWidth = 320
    const modalHeight = 420
    const padding = 16

    let left = position.x
    let top = position.y

    // Keep on screen
    if (left + modalWidth + padding > window.innerWidth) {
      left = window.innerWidth - modalWidth - padding
    }
    if (left < padding) left = padding
    if (top + modalHeight + padding > window.innerHeight) {
      top = window.innerHeight - modalHeight - padding
    }
    if (top < padding) top = padding

    return { left, top }
  }

  async function handleCaptureScreenshot() {
    setCapturingScreenshot(true)
    try {
      // Dynamic import — gracefully handle if module doesn't exist yet
      const mod = await import('@/lib/feedback/screenshot').catch(() => null)
      if (mod && typeof mod.captureScreenshot === 'function') {
        const dataUrl = await mod.captureScreenshot() as string
        setScreenshotUrl(dataUrl)
      } else {
        // Screenshot capture not available yet — show inline message
        console.warn('Screenshot capture module not available')
      }
    } catch {
      console.warn('Failed to capture screenshot')
    } finally {
      setCapturingScreenshot(false)
    }
  }

  async function handleSubmit() {
    if (!rating) return

    setSubmitting(true)
    try {
      const payload: FeedbackSubmission = {
        rating,
        category,
        comment: comment.trim() || undefined,
        screenshotUrl: screenshotUrl ?? undefined,
        page,
        component,
        featureLabel: featureLabel.trim() || undefined,
        viewport,
        department: undefined, // Will be resolved server-side
        sessionId,
        userAgent: navigator.userAgent,
      }

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setSubmitted(true)
      }
    } catch {
      // Silently fail — feedback is non-critical
    } finally {
      setSubmitting(false)
    }
  }

  const contextDisplay = [page, component].filter(Boolean).join(' > ')

  const content = (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={`fixed inset-0 z-[9998] ${
        isMobile ? 'flex items-end' : ''
      }`}
      data-feedback-modal
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40" />

      {/* Modal */}
      <div
        ref={modalRef}
        className={`
          relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50
          shadow-2xl
          ${
            isMobile
              ? 'w-full rounded-t-2xl animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto'
              : 'w-[320px] rounded-xl animate-in fade-in zoom-in-95 duration-150'
          }
          ${!isMobile && !position ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}
          ${!isMobile && position ? 'fixed' : ''}
        `}
        style={!isMobile && position ? getPositionStyle() : undefined}
      >
        {/* Success state */}
        {submitted ? (
          <div className="flex flex-col items-center justify-center gap-3 p-8">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Thanks for your feedback!
            </p>
          </div>
        ) : (
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Send Feedback
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Rating row */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-gray-500 dark:text-gray-500 mr-1">
                How is this?
              </span>
              <button
                onClick={() => setRating('positive')}
                className={`p-2 rounded-lg border transition-all ${
                  rating === 'positive'
                    ? 'border-green-400 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400'
                    : 'border-gray-200 dark:border-gray-700/50 text-gray-400 hover:text-green-500 hover:border-green-300 dark:hover:border-green-700'
                }`}
              >
                <ThumbsUp className="h-5 w-5" />
              </button>
              <button
                onClick={() => setRating('negative')}
                className={`p-2 rounded-lg border transition-all ${
                  rating === 'negative'
                    ? 'border-red-400 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                    : 'border-gray-200 dark:border-gray-700/50 text-gray-400 hover:text-red-500 hover:border-red-300 dark:hover:border-red-700'
                }`}
              >
                <ThumbsDown className="h-5 w-5" />
              </button>
            </div>

            {/* Category dropdown */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Category
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
                  className="w-full appearance-none rounded-lg border border-gray-300 dark:border-gray-700/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Comment textarea */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Comment
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 2000))}
                placeholder="What's on your mind?"
                rows={3}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm px-3 py-2 placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              <div className="text-right text-[10px] text-gray-400 mt-0.5">
                {comment.length}/2000
              </div>
            </div>

            {/* Context bar */}
            <div className="mb-3">
              {editingLabel ? (
                <input
                  autoFocus
                  value={featureLabel}
                  onChange={(e) => setFeatureLabel(e.target.value)}
                  onBlur={() => setEditingLabel(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setEditingLabel(false)
                  }}
                  placeholder="Feature label (optional)"
                  className="w-full text-xs rounded border border-gray-300 dark:border-gray-700/50 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                />
              ) : (
                <button
                  onClick={() => setEditingLabel(true)}
                  className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors truncate max-w-full text-left"
                  title="Click to add a feature label"
                >
                  {featureLabel || contextDisplay || page}
                </button>
              )}
            </div>

            {/* Screenshot + Submit row */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCaptureScreenshot}
                disabled={capturingScreenshot}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700/50 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors disabled:opacity-50"
              >
                {capturingScreenshot ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
                {screenshotUrl ? 'Retake' : 'Screenshot'}
              </button>

              {/* Screenshot thumbnail */}
              {screenshotUrl && (
                <div className="h-8 w-12 rounded border border-gray-200 dark:border-gray-700/50 overflow-hidden flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={screenshotUrl}
                    alt="Screenshot preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="flex-1" />

              <button
                onClick={handleSubmit}
                disabled={!rating || submitting}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
