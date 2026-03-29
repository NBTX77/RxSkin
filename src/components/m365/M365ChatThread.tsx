'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { M365ChatMessage } from '@/types/m365'
import { Send, ArrowLeft } from 'lucide-react'

interface M365ChatThreadProps {
  chatId: string
  currentUserId?: string
  onBack?: () => void
  chatName?: string
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()

  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  if (isToday) return time
  if (isYesterday) return `Yesterday ${time}`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` ${time}`
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

export function M365ChatThread({ chatId, currentUserId, onBack, chatName }: M365ChatThreadProps) {
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const queryClient = useQueryClient()
  const prevMessageCountRef = useRef(0)

  const { data, isLoading, error } = useQuery({
    queryKey: ['m365', 'teams', 'messages', chatId],
    queryFn: async () => {
      const res = await fetch(`/api/m365/teams/chats/${chatId}/messages?top=50`)
      if (!res.ok) throw new Error('Failed to load messages')
      return res.json() as Promise<{ messages: M365ChatMessage[]; nextLink?: string }>
    },
    refetchInterval: 15000,
  })

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/m365/teams/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error('Failed to send message')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['m365', 'teams', 'messages', chatId] })
      queryClient.invalidateQueries({ queryKey: ['m365', 'teams', 'chats'] })
    },
  })

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const messages = data?.messages ?? []

  useEffect(() => {
    if (messages.length > 0 && messages.length !== prevMessageCountRef.current) {
      prevMessageCountRef.current = messages.length
      scrollToBottom()
    }
  }, [messages.length, scrollToBottom])

  // Also scroll to bottom on initial load
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
    }
    // Only run on initial load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading])

  const handleSend = () => {
    const text = newMessage.trim()
    if (!text || sendMutation.isPending) return
    setNewMessage('')
    sendMutation.mutate(text)
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Auto-resize textarea
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  // Messages come in reverse chronological from Graph API, so reverse them
  const sortedMessages = [...messages]
    .filter(m => m.messageType === 'message')
    .sort((a, b) => new Date(a.createdDateTime).getTime() - new Date(b.createdDateTime).getTime())

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {chatName || 'Chat'}
          </h3>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-sm text-red-500">Failed to load messages</p>
          </div>
        )}

        {!isLoading && sortedMessages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No messages yet</p>
          </div>
        )}

        {sortedMessages.map((msg) => {
          const isOwn = currentUserId ? msg.from?.user?.id === currentUserId : false
          const senderName = msg.from?.user?.displayName ?? 'Unknown'
          const bodyText = stripHtml(msg.body?.content ?? '')

          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              {!isOwn && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                    {getInitials(senderName)}
                  </span>
                </div>
              )}

              {/* Bubble */}
              <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                {!isOwn && (
                  <p className="text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-0.5 px-1">
                    {senderName}
                  </p>
                )}
                <div
                  className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${
                    isOwn
                      ? 'bg-blue-600 text-white rounded-tr-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-md'
                  }`}
                >
                  {bodyText}
                </div>
                <p className={`text-[10px] text-gray-500 mt-0.5 px-1 ${isOwn ? 'text-right' : ''}`}>
                  {formatMessageTime(msg.createdDateTime)}
                </p>
              </div>
            </div>
          )
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Compose bar */}
      <div className="border-t border-gray-200 dark:border-gray-700/50 px-4 py-3 bg-white dark:bg-gray-900">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sendMutation.isPending}
            className="flex-shrink-0 p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
        {sendMutation.isError && (
          <p className="text-xs text-red-500 mt-1.5">Failed to send message. Try again.</p>
        )}
      </div>
    </div>
  )
}
