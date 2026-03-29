'use client'

import { useState, useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useM365Tenant } from './M365TenantProvider'
import { X, Copy, Check, Key, Loader2, AlertCircle, ShieldCheck } from 'lucide-react'

interface PasswordResetDialogProps {
  userId: string
  userName: string
  onClose: () => void
}

function generateTempPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const special = '!@#$%&*'

  const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)]

  // Ensure at least 1 of each type
  const required = [pick(upper), pick(lower), pick(digits), pick(special)]

  // Fill remaining with mixed chars
  const allChars = upper + lower + digits + special
  const remaining = Array.from({ length: 8 }, () => pick(allChars))

  // Shuffle all together
  const combined = [...required, ...remaining]
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[combined[i], combined[j]] = [combined[j], combined[i]]
  }

  return combined.join('')
}

export function PasswordResetDialog({ userId, userName, onClose }: PasswordResetDialogProps) {
  const { selectedTenantId } = useM365Tenant()
  const [forceChange, setForceChange] = useState(true)
  const [copied, setCopied] = useState(false)

  const tempPassword = useMemo(() => generateTempPassword(), [])

  const resetPassword = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/m365/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword: tempPassword,
          forceChangeOnNextLogin: forceChange,
          clientTenantId: selectedTenantId,
        }),
      })
      if (!res.ok) throw new Error('Failed to reset password')
      return res.json()
    },
  })

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = tempPassword
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <>
      {/* Backdrop (above the slide-over) */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 z-[60]"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700/50">
            <div className="flex items-center gap-2">
              <Key size={16} className="text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Reset Password</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Confirmation text */}
            {!resetPassword.isSuccess && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Reset password for <span className="font-medium text-gray-900 dark:text-white">{userName}</span>?
              </p>
            )}

            {/* Success state */}
            {resetPassword.isSuccess && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">Password reset successfully</p>
                </div>
                <p className="text-xs text-gray-500">
                  Share this temporary password with the user. {forceChange ? 'They will be required to change it on next login.' : ''}
                </p>
              </div>
            )}

            {/* Temporary password display */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Temporary Password
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700/50 rounded-lg">
                  <code className="text-sm font-mono text-gray-900 dark:text-white select-all">{tempPassword}</code>
                </div>
                <button
                  onClick={handleCopy}
                  className={`p-3 rounded-lg border transition-colors ${
                    copied
                      ? 'border-emerald-300 dark:border-emerald-700/50 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                      : 'border-gray-300 dark:border-gray-700/50 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {/* Force change checkbox */}
            {!resetPassword.isSuccess && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceChange}
                  onChange={e => setForceChange(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500/40 bg-white dark:bg-gray-800"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Force password change on next login
                </span>
              </label>
            )}

            {/* Error state */}
            {resetPassword.isError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  Failed to reset password. Please try again.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-700/50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {resetPassword.isSuccess ? 'Close' : 'Cancel'}
            </button>
            {!resetPassword.isSuccess && (
              <button
                onClick={() => resetPassword.mutate()}
                disabled={resetPassword.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {resetPassword.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Key size={14} />
                    Reset Password
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
