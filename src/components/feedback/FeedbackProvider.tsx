'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { MessageSquareText } from 'lucide-react'
import { FeedbackModal } from './FeedbackModal'

interface FeedbackContextValue {
  /** Whether the feedback system is enabled */
  enabled: boolean
  /** Open the feedback modal programmatically */
  openFeedback: (options?: { component?: string; featureLabel?: string }) => void
}

const FeedbackContext = createContext<FeedbackContextValue>({
  enabled: false,
  openFeedback: () => {},
})

export function useFeedback(): FeedbackContextValue {
  return useContext(FeedbackContext)
}

// Generate or retrieve a session-scoped ID
function getSessionId(): string {
  const key = 'rx-feedback-session-id'
  let id = sessionStorage.getItem(key)
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    sessionStorage.setItem(key, id)
  }
  return id
}

// Walk up DOM looking for data-feedback-component attribute
function detectComponent(target: EventTarget | null): string | undefined {
  let el = target as HTMLElement | null
  while (el && el !== document.body) {
    const comp = el.getAttribute('data-feedback-component')
    if (comp) return comp
    el = el.parentElement
  }
  return undefined
}

interface ContextMenuState {
  x: number
  y: number
  component?: string
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalPosition, setModalPosition] = useState<{ x: number; y: number } | null>(null)
  const [detectedComponent, setDetectedComponent] = useState<string | undefined>()
  const [featureLabel, setFeatureLabel] = useState<string | undefined>()
  const contextMenuRef = useRef<HTMLDivElement>(null)

  // Check feedback settings on mount
  useEffect(() => {
    let cancelled = false
    async function checkSettings() {
      try {
        const res = await fetch('/api/feedback/settings')
        if (res.ok) {
          const data = await res.json() as { enabled?: boolean }
          if (!cancelled) setEnabled(data.enabled ?? true)
        } else {
          // If endpoint doesn't exist yet, default to enabled
          if (!cancelled) setEnabled(true)
        }
      } catch {
        // Network error — default to enabled
        if (!cancelled) setEnabled(true)
      } finally {
        if (!cancelled) setSettingsLoaded(true)
      }
    }
    checkSettings()
    return () => { cancelled = true }
  }, [])

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return

    function handleClick(e: MouseEvent) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    function handleScroll() {
      setContextMenu(null)
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setContextMenu(null)
    }

    document.addEventListener('click', handleClick, true)
    document.addEventListener('scroll', handleScroll, true)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('scroll', handleScroll, true)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [contextMenu])

  // Listen for right-click
  useEffect(() => {
    if (!settingsLoaded || !enabled) return

    function handleContextMenu(e: MouseEvent) {
      const target = e.target as HTMLElement

      // Skip if target is an input, textarea, select, or contentEditable
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return
      }

      // Skip if inside the feedback modal itself
      if (target.closest('[data-feedback-modal]')) return

      e.preventDefault()

      const component = detectComponent(target)
      setContextMenu({ x: e.clientX, y: e.clientY, component })
    }

    document.addEventListener('contextmenu', handleContextMenu)
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [settingsLoaded, enabled])

  const openFeedback = useCallback(
    (options?: { component?: string; featureLabel?: string }) => {
      setDetectedComponent(options?.component)
      setFeatureLabel(options?.featureLabel)
      setModalPosition(null) // Center on screen
      setModalOpen(true)
    },
    []
  )

  function handleContextMenuClick() {
    if (contextMenu) {
      setDetectedComponent(contextMenu.component)
      setFeatureLabel(undefined)
      setModalPosition({ x: contextMenu.x, y: contextMenu.y })
      setModalOpen(true)
      setContextMenu(null)
    }
  }

  const value: FeedbackContextValue = {
    enabled,
    openFeedback,
  }

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      {/* Custom context menu — portal */}
      {contextMenu &&
        createPortal(
          <div
            ref={contextMenuRef}
            className="fixed z-[9999] min-w-[180px] rounded-lg border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100"
            style={{
              left: Math.min(contextMenu.x, window.innerWidth - 200),
              top: Math.min(contextMenu.y, window.innerHeight - 50),
            }}
          >
            <button
              onClick={handleContextMenuClick}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <MessageSquareText className="h-4 w-4 text-blue-500" />
              <span>Send Feedback</span>
            </button>
          </div>,
          document.body
        )}

      {/* Feedback modal */}
      {modalOpen && (
        <FeedbackModal
          onClose={() => setModalOpen(false)}
          position={modalPosition}
          page={typeof window !== 'undefined' ? window.location.pathname : '/'}
          component={detectedComponent}
          featureLabel={featureLabel}
          viewport={
            typeof window !== 'undefined'
              ? `${window.innerWidth}x${window.innerHeight}`
              : undefined
          }
          sessionId={typeof window !== 'undefined' ? getSessionId() : 'unknown'}
        />
      )}
    </FeedbackContext.Provider>
  )
}
