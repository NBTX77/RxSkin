'use client'

export const dynamic = 'force-dynamic'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { M365TenantProvider } from '@/components/m365/M365TenantProvider'
import { M365MailInbox } from '@/components/m365/M365MailInbox'
import { M365ComposeEmail } from '@/components/m365/M365ComposeEmail'
import type { M365Message } from '@/types/m365'
import {
  Loader2,
  Mail,
  ArrowLeft,
  Reply,
  Forward,
  Trash2,
  MailOpen,
  AlertCircle,
} from 'lucide-react'

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function M365MailContent() {
  const queryClient = useQueryClient()
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [showCompose, setShowCompose] = useState(false)
  const [composeReplyTo, setComposeReplyTo] = useState<{
    id: string
    subject: string
    from: string
    body: string
  } | undefined>(undefined)
  const [composeForward, setComposeForward] = useState(false)

  // Fetch message list
  const {
    data: messagesData,
    isLoading: listLoading,
    isError: listError,
    error: listErrorObj,
  } = useQuery<{ messages: M365Message[]; nextLink: string | null }>({
    queryKey: ['m365-mail'],
    queryFn: async () => {
      const res = await fetch('/api/m365/mail?top=25')
      if (res.status === 403) {
        throw new Error('M365_NOT_CONNECTED')
      }
      if (!res.ok) throw new Error('Failed to fetch mail')
      return res.json()
    },
    staleTime: 30_000,
  })

  const messages = messagesData?.messages ?? []

  // Fetch selected message detail
  const {
    data: selectedMessage,
    isLoading: detailLoading,
  } = useQuery<M365Message>({
    queryKey: ['m365-mail', selectedMessageId],
    queryFn: async () => {
      const res = await fetch(`/api/m365/mail/${selectedMessageId}`)
      if (!res.ok) throw new Error('Failed to fetch message')
      return res.json()
    },
    enabled: !!selectedMessageId,
    staleTime: 60_000,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const res = await fetch(`/api/m365/mail/${messageId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete message')
    },
    onSuccess: () => {
      setSelectedMessageId(null)
      queryClient.invalidateQueries({ queryKey: ['m365-mail'] })
    },
  })

  // Mark unread mutation
  const markUnreadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const res = await fetch(`/api/m365/mail/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: false }),
      })
      if (!res.ok) throw new Error('Failed to update message')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['m365-mail'] })
    },
  })

  const handleSelect = useCallback((id: string) => {
    setSelectedMessageId(id)
  }, [])

  const handleCompose = useCallback(() => {
    setComposeReplyTo(undefined)
    setComposeForward(false)
    setShowCompose(true)
  }, [])

  const handleReply = useCallback(() => {
    if (!selectedMessage) return
    setComposeReplyTo({
      id: selectedMessage.id,
      subject: selectedMessage.subject,
      from: selectedMessage.from?.emailAddress?.address || '',
      body: selectedMessage.body?.content || selectedMessage.bodyPreview || '',
    })
    setComposeForward(false)
    setShowCompose(true)
  }, [selectedMessage])

  const handleForward = useCallback(() => {
    if (!selectedMessage) return
    setComposeReplyTo({
      id: selectedMessage.id,
      subject: selectedMessage.subject,
      from: selectedMessage.from?.emailAddress?.address || '',
      body: selectedMessage.body?.content || selectedMessage.bodyPreview || '',
    })
    setComposeForward(true)
    setShowCompose(true)
  }, [selectedMessage])

  const handleCloseCompose = useCallback(() => {
    setShowCompose(false)
    setComposeReplyTo(undefined)
    setComposeForward(false)
    queryClient.invalidateQueries({ queryKey: ['m365-mail'] })
  }, [queryClient])

  // Check for M365 not connected error
  const isNotConnected = listError && listErrorObj instanceof Error && listErrorObj.message === 'M365_NOT_CONNECTED'

  // Not connected state
  if (isNotConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
          <Mail size={28} className="text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Connect Microsoft 365
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-sm mb-4">
          Connect your Microsoft 365 account to access your email inbox directly from RX Skin.
        </p>
        <a
          href="/settings"
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Go to Settings
        </a>
      </div>
    )
  }

  // Generic error state
  if (listError && !isNotConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
          <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Failed to load mail</p>
        <p className="text-xs text-gray-500">Check your connection and try again.</p>
      </div>
    )
  }

  // Loading state
  if (listLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <>
      <div className="flex h-[calc(100vh-8rem)] border border-gray-200 dark:border-gray-700/50 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
        {/* Left panel: message list */}
        <div className={`w-full lg:w-2/5 border-r border-gray-200 dark:border-gray-700/50 flex flex-col ${
          selectedMessageId ? 'hidden lg:flex' : 'flex'
        }`}>
          {/* List header */}
          <div className="px-3 py-3 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Inbox</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {messages.filter(m => !m.isRead).length} unread
            </p>
          </div>

          <M365MailInbox
            messages={messages}
            selectedId={selectedMessageId ?? undefined}
            onSelect={handleSelect}
            onCompose={handleCompose}
          />
        </div>

        {/* Right panel: message preview */}
        <div className={`w-full lg:w-3/5 flex flex-col ${
          selectedMessageId ? 'flex' : 'hidden lg:flex'
        }`}>
          {!selectedMessageId ? (
            // Empty state
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <Mail size={20} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">Select a message to read</p>
            </div>
          ) : detailLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 size={20} className="animate-spin text-blue-500" />
            </div>
          ) : selectedMessage ? (
            <>
              {/* Mobile back button + action bar */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => setSelectedMessageId(null)}
                  className="lg:hidden flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>

                <div className="flex items-center gap-1 ml-auto">
                  <button
                    onClick={handleReply}
                    className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Reply"
                  >
                    <Reply size={16} />
                  </button>
                  <button
                    onClick={handleForward}
                    className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Forward"
                  >
                    <Forward size={16} />
                  </button>
                  <button
                    onClick={() => markUnreadMutation.mutate(selectedMessage.id)}
                    disabled={markUnreadMutation.isPending}
                    className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Mark unread"
                  >
                    <MailOpen size={16} />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(selectedMessage.id)}
                    disabled={deleteMutation.isPending}
                    className="p-2 rounded-md text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Message content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Subject */}
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedMessage.subject || '(No subject)'}
                </h1>

                {/* Metadata */}
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-gray-500 w-10 flex-shrink-0 pt-0.5">From</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {selectedMessage.from?.emailAddress?.name || selectedMessage.from?.emailAddress?.address}
                      {selectedMessage.from?.emailAddress?.name && (
                        <span className="text-gray-500 ml-1 text-xs">
                          &lt;{selectedMessage.from.emailAddress.address}&gt;
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-gray-500 w-10 flex-shrink-0 pt-0.5">To</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedMessage.toRecipients?.map(r =>
                        r.emailAddress.name || r.emailAddress.address
                      ).join(', ') || '--'}
                    </span>
                  </div>

                  {selectedMessage.ccRecipients && selectedMessage.ccRecipients.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium text-gray-500 w-10 flex-shrink-0 pt-0.5">CC</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {selectedMessage.ccRecipients.map(r =>
                          r.emailAddress.name || r.emailAddress.address
                        ).join(', ')}
                      </span>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-gray-500 w-10 flex-shrink-0 pt-0.5">Date</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {formatDateTime(selectedMessage.receivedDateTime)}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <hr className="border-gray-200 dark:border-gray-700/50" />

                {/* Body */}
                {selectedMessage.body?.contentType === 'html' ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 [&_a]:text-blue-600 dark:[&_a]:text-blue-400"
                    dangerouslySetInnerHTML={{ __html: selectedMessage.body.content }}
                  />
                ) : (
                  <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {selectedMessage.body?.content || selectedMessage.bodyPreview || '(No content)'}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Compose modal */}
      {showCompose && (
        <M365ComposeEmail
          onClose={handleCloseCompose}
          replyTo={composeReplyTo}
          forward={composeForward}
        />
      )}
    </>
  )
}

export default function M365MailPage() {
  return (
    <M365TenantProvider>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Mail</h1>
          <p className="text-sm text-gray-500 mt-0.5">Microsoft 365 inbox</p>
        </div>

        {/* Content */}
        <M365MailContent />
      </div>
    </M365TenantProvider>
  )
}
