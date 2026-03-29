'use client'

import type { M365Message } from '@/types/m365'
import { Paperclip, Plus, Inbox } from 'lucide-react'

interface M365MailInboxProps {
  messages: M365Message[]
  selectedId?: string
  onSelect: (id: string) => void
  onCompose: () => void
}

function formatRelativeTime(dateString: string): string {
  const now = Date.now()
  const date = new Date(dateString).getTime()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay === 1) return 'Yesterday'
  if (diffDay < 7) return `${diffDay}d ago`
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function M365MailInbox({ messages, selectedId, onSelect, onCompose }: M365MailInboxProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
          <Inbox size={20} className="text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">No messages</p>
        <p className="text-xs text-gray-500 mt-1">Your inbox is empty</p>
        <button
          onClick={onCompose}
          className="mt-4 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <Plus size={14} />
          Compose
        </button>
      </div>
    )
  }

  return (
    <div className="relative h-full flex flex-col">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
        {messages.map((msg) => {
          const isSelected = msg.id === selectedId
          const isUnread = !msg.isRead
          const senderName = msg.from?.emailAddress?.name || msg.from?.emailAddress?.address || 'Unknown'
          const preview = msg.bodyPreview?.length > 80
            ? msg.bodyPreview.slice(0, 80) + '...'
            : msg.bodyPreview || ''

          return (
            <button
              key={msg.id}
              onClick={() => onSelect(msg.id)}
              className={`w-full text-left px-3 py-3 transition-colors ${
                isSelected
                  ? 'bg-blue-50 dark:bg-blue-600/10 border-l-2 border-l-blue-500'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {/* Unread indicator */}
                <div className="flex-shrink-0 mt-2 w-2">
                  {isUnread && (
                    <span className="block w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm truncate ${
                      isUnread
                        ? 'font-semibold text-gray-900 dark:text-white'
                        : 'font-medium text-gray-700 dark:text-gray-300'
                    }`}>
                      {senderName}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {msg.hasAttachments && (
                        <Paperclip size={12} className="text-gray-400" />
                      )}
                      <span className="text-[11px] text-gray-500">
                        {formatRelativeTime(msg.receivedDateTime)}
                      </span>
                    </div>
                  </div>

                  <p className={`text-sm truncate mt-0.5 ${
                    isUnread
                      ? 'font-medium text-gray-900 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {msg.subject || '(No subject)'}
                  </p>

                  <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-0.5">
                    {preview || '(No preview available)'}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Compose FAB */}
      <button
        onClick={onCompose}
        className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center hover:shadow-xl"
        title="Compose new email"
      >
        <Plus size={20} />
      </button>
    </div>
  )
}
