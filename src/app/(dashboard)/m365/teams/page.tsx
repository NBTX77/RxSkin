'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { M365Chat } from '@/types/m365'
import { M365TeamsChat } from '@/components/m365/M365TeamsChat'
import { M365ChatThread } from '@/components/m365/M365ChatThread'
import { PresenceBatchProvider } from '@/components/m365/PresenceIndicator'
import { MessageSquare, X } from 'lucide-react'

export default function TeamsPage() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['m365', 'teams', 'chats'],
    queryFn: async () => {
      const res = await fetch('/api/m365/teams/chats?top=20')
      if (res.status === 403) {
        const body = await res.json()
        if (body.error === 'microsoft_not_connected') {
          throw new M365NotConnectedError()
        }
      }
      if (!res.ok) throw new Error('Failed to load chats')
      return res.json() as Promise<{ chats: M365Chat[]; nextLink?: string }>
    },
  })

  const chats = data?.chats ?? []
  const selectedChat = chats.find(c => c.id === selectedChatId)

  // Derive chat display name for the thread header
  function getChatDisplayName(chat: M365Chat): string {
    if (chat.topic) return chat.topic
    if (chat.members && chat.members.length > 0) {
      return chat.members.map(m => m.displayName).join(', ')
    }
    return 'Chat'
  }

  // 403 — Microsoft not connected
  if (error instanceof M365NotConnectedError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] px-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
          <MessageSquare size={28} className="text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Connect Microsoft 365
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-sm mb-4">
          Connect your Microsoft account in Settings to access Teams chats, presence, and messaging.
        </p>
        <a
          href="/settings"
          className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Go to Settings
        </a>
      </div>
    )
  }

  return (
    <PresenceBatchProvider>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Page header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900">
          <MessageSquare size={20} className="text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Teams Chat</h1>
        </div>

        {/* Main content — split layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat list — left panel (desktop) or full width (mobile, when no chat selected) */}
          <div
            className={`border-r border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 flex-shrink-0 overflow-hidden flex flex-col ${
              selectedChatId
                ? 'hidden md:flex md:w-[30%] lg:w-[28%]'
                : 'w-full md:w-[30%] lg:w-[28%]'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-16 px-4">
                <p className="text-sm text-red-500 text-center">Failed to load chats</p>
              </div>
            ) : (
              <M365TeamsChat
                chats={chats}
                selectedId={selectedChatId ?? undefined}
                onSelect={(id) => setSelectedChatId(id)}
              />
            )}
          </div>

          {/* Chat thread — right panel (desktop) or full width (mobile, when chat selected) */}
          <div
            className={`flex-1 bg-gray-50 dark:bg-gray-950 ${
              selectedChatId
                ? 'flex flex-col'
                : 'hidden md:flex md:flex-col items-center justify-center'
            }`}
          >
            {selectedChatId && selectedChat ? (
              <M365ChatThread
                chatId={selectedChatId}
                chatName={getChatDisplayName(selectedChat)}
                onBack={() => setSelectedChatId(null)}
              />
            ) : (
              /* Empty state — shown on desktop when no chat is selected */
              <div className="flex flex-col items-center justify-center h-full px-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <MessageSquare size={28} className="text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Select a chat
                </p>
                <p className="text-xs text-gray-500 text-center max-w-xs">
                  Choose a conversation from the left to view messages
                </p>
              </div>
            )}
          </div>

          {/* Mobile: close overlay when chat is selected (optional X button top-right) */}
          {selectedChatId && (
            <button
              onClick={() => setSelectedChatId(null)}
              className="md:hidden fixed top-4 right-4 z-50 p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 shadow-lg"
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </PresenceBatchProvider>
  )
}

// Custom error class for 403 Microsoft not connected
class M365NotConnectedError extends Error {
  constructor() {
    super('Microsoft 365 not connected')
    this.name = 'M365NotConnectedError'
  }
}
