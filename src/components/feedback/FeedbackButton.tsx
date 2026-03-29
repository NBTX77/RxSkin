'use client'

import { useState, useEffect } from 'react'
import { MessageSquareText } from 'lucide-react'
import { useFeedback } from './FeedbackProvider'
import { FeedbackModal } from './FeedbackModal'

const HIDDEN_KEY = 'rx-feedback-button-hidden'
const SESSION_KEY = 'rx-feedback-session-id'

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

export function FeedbackButton() {
  const { enabled } = useFeedback()
  const [hidden, setHidden] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [hovered, setHovered] = useState(false)

  // Check localStorage for hidden preference
  useEffect(() => {
    const stored = localStorage.getItem(HIDDEN_KEY)
    setHidden(stored === 'true')
  }, [])

  if (!enabled || hidden) return null

  return (
    <>
      <button
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setModalOpen(true)}
        className="
          fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50
          flex items-center gap-2
          px-3 py-2 rounded-full
          bg-white dark:bg-gray-900
          border border-gray-200 dark:border-gray-700/50
          shadow-lg hover:shadow-xl
          text-gray-700 dark:text-gray-300
          hover:bg-gray-50 dark:hover:bg-gray-800
          transition-all duration-200
          group
        "
        title="Send Feedback"
      >
        <MessageSquareText className="h-4 w-4 text-blue-500 flex-shrink-0" />
        <span
          className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${
            hovered ? 'max-w-[80px] opacity-100' : 'max-w-0 opacity-0 lg:max-w-[80px] lg:opacity-100'
          }`}
        >
          Feedback
        </span>
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
