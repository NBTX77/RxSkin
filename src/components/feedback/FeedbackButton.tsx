'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageSquarePlus } from 'lucide-react'
import { useFeedback } from './FeedbackProvider'
import { FeedbackModal } from './FeedbackModal'

const POSITION_KEY = 'feedback-button-position'
const SESSION_KEY = 'rx-feedback-session-id'

const BUTTON_SIZE = 44

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

function getDefaultPosition(): { x: number; y: number } {
  if (typeof window === 'undefined') return { x: 0, y: 0 }
  const bottomOffset = window.innerWidth < 1024 ? 80 : 24
  return {
    x: window.innerWidth - BUTTON_SIZE - 16,
    y: window.innerHeight - BUTTON_SIZE - bottomOffset,
  }
}

export function FeedbackButton() {
  const { enabled } = useFeedback()
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [expanded, setExpanded] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const dragStart = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number } | null>(null)
  const totalDrag = useRef(0)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(POSITION_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as { x: number; y: number }
        const x = clamp(parsed.x, 0, window.innerWidth - BUTTON_SIZE)
        const y = clamp(parsed.y, 0, window.innerHeight - BUTTON_SIZE)
        setPosition({ x, y })
      } else {
        setPosition(getDefaultPosition())
      }
    } catch {
      setPosition(getDefaultPosition())
    }
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: position.x,
      posY: position.y,
    }
    totalDrag.current = 0
    setIsDragging(false)
  }, [position])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current) return
    const dx = e.clientX - dragStart.current.mouseX
    const dy = e.clientY - dragStart.current.mouseY
    totalDrag.current = Math.abs(dx) + Math.abs(dy)

    if (totalDrag.current > 4) {
      setIsDragging(true)
      const newX = clamp(dragStart.current.posX + dx, 0, window.innerWidth - BUTTON_SIZE)
      const newY = clamp(dragStart.current.posY + dy, 0, window.innerHeight - BUTTON_SIZE)
      setPosition({ x: newX, y: newY })
    }
  }, [])

  const onPointerUp = useCallback(() => {
    if (!dragStart.current) return
    const wasDrag = totalDrag.current > 4
    dragStart.current = null

    if (wasDrag) {
      // Save final position
      setPosition(prev => {
        try { localStorage.setItem(POSITION_KEY, JSON.stringify(prev)) } catch {}
        return prev
      })
    } else {
      // It was a tap/click
      setExpanded(prev => !prev)
    }
    setTimeout(() => setIsDragging(false), 0)
  }, [])

  const handleFeedbackClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setExpanded(false)
    setModalOpen(true)
  }, [])

  if (!enabled || !mounted) return null

  return (
    <>
      <button
        ref={buttonRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={expanded && !isDragging ? handleFeedbackClick : undefined}
        className={`
          fixed z-50 flex items-center gap-2
          rounded-full shadow-lg
          bg-white/90 dark:bg-gray-900/90
          border border-gray-200 dark:border-gray-700/50
          text-gray-700 dark:text-gray-300
          select-none
          transition-all duration-200
          ${isDragging ? 'cursor-grabbing shadow-xl scale-105' : 'cursor-grab hover:scale-110'}
        `}
        style={{
          left: position.x,
          top: position.y,
          touchAction: 'none',
          width: expanded ? 'auto' : BUTTON_SIZE,
          height: BUTTON_SIZE,
          padding: expanded ? '0 14px' : '0',
          justifyContent: 'center',
        } as React.CSSProperties}
        title={expanded ? undefined : 'Feedback'}
        aria-label="Feedback"
      >
        <MessageSquarePlus className="h-5 w-5 text-blue-500 flex-shrink-0" />
        {expanded && (
          <span className="text-sm font-medium whitespace-nowrap pr-1">
            Feedback
          </span>
        )}
      </button>

      {modalOpen && (
        <FeedbackModal
          onClose={() => setModalOpen(false)}
          position={null}
          page={typeof window !== 'undefined' ? window.location.pathname : '/'}
          viewport={
            typeof window !== 'undefined'
              ? `${window.innerWidth}x${window.innerHeight}`
              : undefined
          }
          sessionId={typeof window !== 'undefined' ? getSessionId() : 'unknown'}
        />
      )}
    </>
  )
}
