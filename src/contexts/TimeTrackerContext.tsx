'use client'

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'

// ── Types ────────────────────────────────────────────────────

interface TimerState {
  activeTicketId: number | null
  ticketSummary: string
  elapsedSeconds: number
  isRunning: boolean
  isPaused: boolean
  startTime: number | null // timestamp when timer started
}

interface TimeTrackerContextValue extends TimerState {
  startTimer: (ticketId: number, summary: string) => void
  stopTimer: () => number // returns elapsed seconds
  pauseTimer: () => void
  resumeTimer: () => void
  resetTimer: () => void
}

// ── LocalStorage key ─────────────────────────────────────────

const STORAGE_KEY = 'rx-skin-timer-state'

function loadState(): TimerState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as TimerState
    // Recalculate elapsed if timer was running when page closed
    if (parsed.isRunning && parsed.startTime) {
      const additionalSeconds = Math.floor((Date.now() - parsed.startTime) / 1000)
      parsed.elapsedSeconds += additionalSeconds
      parsed.startTime = Date.now()
    }
    return parsed
  } catch {
    return null
  }
}

function saveState(state: TimerState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage full or unavailable
  }
}

function clearState(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

// ── Default state ────────────────────────────────────────────

const DEFAULT_STATE: TimerState = {
  activeTicketId: null,
  ticketSummary: '',
  elapsedSeconds: 0,
  isRunning: false,
  isPaused: false,
  startTime: null,
}

// ── Context ──────────────────────────────────────────────────

const TimeTrackerContext = createContext<TimeTrackerContextValue | null>(null)

export function useTimeTracker(): TimeTrackerContextValue {
  const ctx = useContext(TimeTrackerContext)
  if (!ctx) {
    throw new Error('useTimeTracker must be used within a TimeTrackerProvider')
  }
  return ctx
}

// ── Provider ─────────────────────────────────────────────────

export function TimeTrackerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TimerState>(DEFAULT_STATE)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(false)

  // Restore state from localStorage on mount
  useEffect(() => {
    const saved = loadState()
    if (saved && saved.activeTicketId !== null) {
      setState(saved)
    }
    mountedRef.current = true
  }, [])

  // Start/stop the interval based on isRunning
  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      intervalRef.current = setInterval(() => {
        setState((prev) => {
          const next = { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 }
          saveState(next)
          return next
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [state.isRunning, state.isPaused])

  // Idle detection: auto-pause on tab hidden, auto-resume on visible
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        // Tab is hidden -- auto-pause if running
        setState((prev) => {
          if (prev.isRunning && !prev.isPaused) {
            const next = { ...prev, isPaused: true }
            saveState(next)
            return next
          }
          return prev
        })
      } else {
        // Tab is visible -- auto-resume if was paused by visibility
        setState((prev) => {
          if (prev.isRunning && prev.isPaused) {
            const next = { ...prev, isPaused: false, startTime: Date.now() }
            saveState(next)
            return next
          }
          return prev
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const startTimer = useCallback((ticketId: number, summary: string) => {
    const next: TimerState = {
      activeTicketId: ticketId,
      ticketSummary: summary,
      elapsedSeconds: 0,
      isRunning: true,
      isPaused: false,
      startTime: Date.now(),
    }
    setState(next)
    saveState(next)
  }, [])

  const stopTimer = useCallback((): number => {
    let elapsed = 0
    setState((prev) => {
      elapsed = prev.elapsedSeconds
      clearState()
      return DEFAULT_STATE
    })
    return elapsed
  }, [])

  const pauseTimer = useCallback(() => {
    setState((prev) => {
      if (!prev.isRunning || prev.isPaused) return prev
      const next = { ...prev, isPaused: true }
      saveState(next)
      return next
    })
  }, [])

  const resumeTimer = useCallback(() => {
    setState((prev) => {
      if (!prev.isRunning || !prev.isPaused) return prev
      const next = { ...prev, isPaused: false, startTime: Date.now() }
      saveState(next)
      return next
    })
  }, [])

  const resetTimer = useCallback(() => {
    clearState()
    setState(DEFAULT_STATE)
  }, [])

  const value: TimeTrackerContextValue = {
    ...state,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
  }

  return (
    <TimeTrackerContext.Provider value={value}>
      {children}
    </TimeTrackerContext.Provider>
  )
}
