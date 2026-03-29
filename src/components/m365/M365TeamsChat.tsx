'use client'

import type { M365Chat } from '@/types/m365'
import { MessageSquare } from 'lucide-react'

interface M365TeamsChatProps {
  chats: M365Chat[]
  selectedId?: string
  onSelect: (id: string) => void
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

function getChatDisplayName(chat: M365Chat): string {
  if (chat.chatType === 'meeting' && chat.topic) return chat.topic
  if (chat.chatType === 'group' && chat.topic) return chat.topic
  if (chat.chatType === 'oneOnOne' && chat.members && chat.members.length > 0) {
    // For oneOnOne, show the other person's name (first member that isn't the current user)
    // Since we don't know the current user here, show the first member
    return chat.members.map(m => m.displayName).join(', ')
  }
  if (chat.members && chat.members.length > 0) {
    return chat.members.map(m => m.displayName).join(', ')
  }
  return chat.topic || 'Chat'
}

function getChatTypeLabel(chatType: M365Chat['chatType']): string | null {
  if (chatType === 'meeting') return 'Meeting'
  if (chatType === 'group') return 'Group'
  return null
}

export function M365TeamsChat({ chats, selectedId, onSelect }: M365TeamsChatProps) {
  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
          <MessageSquare size={20} className="text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">No chats</p>
        <p className="text-xs text-gray-500 mt-1">No Teams chats found</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
      {chats.map((chat) => {
        const isSelected = chat.id === selectedId
        const displayName = getChatDisplayName(chat)
        const typeLabel = getChatTypeLabel(chat.chatType)
        const lastMessage = chat.lastMessagePreview
        const lastPreview = lastMessage?.body?.content
          ? lastMessage.body.content.replace(/<[^>]*>/g, '').slice(0, 60)
          : null
        const lastSender = lastMessage?.from?.user?.displayName
        const lastTime = lastMessage?.createdDateTime

        return (
          <button
            key={chat.id}
            onClick={() => onSelect(chat.id)}
            className={`w-full text-left px-3 py-3 transition-colors ${
              isSelected
                ? 'bg-blue-50 dark:bg-blue-600/10 border-l-2 border-l-blue-500'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-2 border-l-transparent'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {/* Avatar / icon */}
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <MessageSquare size={16} className="text-indigo-600 dark:text-indigo-400" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {displayName}
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {typeLabel && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium">
                        {typeLabel}
                      </span>
                    )}
                    {lastTime && (
                      <span className="text-[11px] text-gray-500">
                        {formatRelativeTime(lastTime)}
                      </span>
                    )}
                  </div>
                </div>

                {lastPreview && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-0.5">
                    {lastSender ? `${lastSender}: ` : ''}
                    {lastPreview}
                  </p>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
