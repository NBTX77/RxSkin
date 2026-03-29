'use client'

import { useState } from 'react'
import { X, Send, ChevronDown, Loader2 } from 'lucide-react'

interface M365ComposeEmailProps {
  onClose: () => void
  replyTo?: {
    id: string
    subject: string
    from: string
    body: string
  }
  forward?: boolean
}

export function M365ComposeEmail({ onClose, replyTo, forward }: M365ComposeEmailProps) {
  const [to, setTo] = useState('')
  const [cc, setCc] = useState('')
  const [showCc, setShowCc] = useState(false)
  const [subject, setSubject] = useState(() => {
    if (!replyTo) return ''
    if (forward) return `FW: ${replyTo.subject.replace(/^(RE:|FW:)\s*/gi, '')}`
    return `RE: ${replyTo.subject.replace(/^RE:\s*/gi, '')}`
  })
  const [body, setBody] = useState(() => {
    if (!replyTo) return ''
    const separator = '\n\n---------- Original Message ----------\n'
    const header = `From: ${replyTo.from}\nSubject: ${replyTo.subject}\n\n`
    return separator + header + replyTo.body
  })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    if (!to.trim() && !replyTo) {
      setError('Please enter at least one recipient.')
      return
    }

    setSending(true)
    setError(null)

    try {
      let res: Response

      if (replyTo && !forward) {
        // Reply
        res = await fetch(`/api/m365/mail/${replyTo.id}/reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            comment: body.split('---------- Original Message ----------')[0].trim(),
          }),
        })
      } else {
        // New message or forward
        const recipients = to.split(',').map(e => e.trim()).filter(Boolean)
        const ccRecipients = cc.split(',').map(e => e.trim()).filter(Boolean)

        res = await fetch('/api/m365/mail/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: recipients,
            cc: ccRecipients.length > 0 ? ccRecipients : undefined,
            subject,
            body: body.split('---------- Original Message ----------')[0].trim(),
            bodyContentType: 'Text',
          }),
        })
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to send email')
      }

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700/50">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {replyTo
              ? forward
                ? 'Forward Message'
                : 'Reply'
              : 'New Message'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* To */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              To
            </label>
            <input
              type="text"
              value={to}
              onChange={e => setTo(e.target.value)}
              placeholder="email@example.com, another@example.com"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              autoFocus={!replyTo}
            />
          </div>

          {/* CC toggle + field */}
          {!showCc ? (
            <button
              onClick={() => setShowCc(true)}
              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <ChevronDown size={12} />
              Add CC
            </button>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                CC
              </label>
              <input
                type="text"
                value={cc}
                onChange={e => setCc(e.target.value)}
                placeholder="cc@example.com"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Subject"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Message
            </label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={10}
              placeholder="Write your message..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-y min-h-[120px]"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700/50">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={14} />
                Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
