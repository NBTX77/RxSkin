'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useM365Tenant } from './M365TenantProvider'
import { PasswordResetDialog } from './PasswordResetDialog'
import type { M365User } from '@/types/m365'
import {
  X,
  Mail,
  Briefcase,
  Building2,
  Shield,
  Key,
  UserX,
  UserCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react'

interface M365UserDetailProps {
  user: M365User
  onClose: () => void
}

export function M365UserDetail({ user, onClose }: M365UserDetailProps) {
  const { selectedTenantId } = useM365Tenant()
  const [showPasswordReset, setShowPasswordReset] = useState(false)

  const toggleAccount = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/m365/users/${user.id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountEnabled: !user.accountEnabled,
          clientTenantId: selectedTenantId,
        }),
      })
      if (!res.ok) throw new Error('Failed to toggle account')
      return res.json()
    },
  })

  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return (parts[0]?.[0] ?? '?').toUpperCase()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700/50 shadow-xl overflow-y-auto animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">User Details</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Profile section */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-bold">
              {getInitials(user.displayName)}
            </div>
            <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">{user.displayName}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <Mail size={12} className="text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{user.userPrincipalName}</span>
            </div>
            <span className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              user.accountEnabled
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}>
              {user.accountEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {/* Info grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Profile Information</h4>
            <div className="space-y-2">
              <InfoRow icon={<Briefcase size={14} />} label="Job Title" value={user.jobTitle} />
              <InfoRow icon={<Building2 size={14} />} label="Department" value={user.department} />
              <InfoRow icon={<Mail size={14} />} label="Mail" value={user.mail} />
              <InfoRow
                icon={<Shield size={14} />}
                label="MFA Status"
                value={user.mfaRegistered === true ? 'Registered' : user.mfaRegistered === false ? 'Not Registered' : 'Unknown'}
              />
            </div>
          </div>

          {/* Group memberships (placeholder) */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Group Memberships</h4>
            <div className="bg-gray-50 dark:bg-gray-800/80 rounded-lg p-3">
              <p className="text-xs text-gray-500 text-center py-2">
                Group membership data will load from Graph API
              </p>
            </div>
          </div>

          {/* Assigned licenses (placeholder) */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Assigned Licenses ({user.assignedLicenses.length})
            </h4>
            <div className="space-y-1.5">
              {user.assignedLicenses.length > 0 ? (
                user.assignedLicenses.map((lic, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/80 rounded-lg"
                  >
                    <Key size={12} className="text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate font-mono">
                      {lic.skuId}
                    </span>
                  </div>
                ))
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800/80 rounded-lg p-3">
                  <p className="text-xs text-gray-500 text-center">No licenses assigned</p>
                </div>
              )}
            </div>
          </div>

          {/* Auth methods (placeholder) */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Authentication Methods</h4>
            <div className="bg-gray-50 dark:bg-gray-800/80 rounded-lg p-3">
              <p className="text-xs text-gray-500 text-center py-2">
                Auth method data will load from Graph API
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</h4>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowPasswordReset(true)}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Key size={14} />
                Reset Password
              </button>
              <button
                onClick={() => toggleAccount.mutate()}
                disabled={toggleAccount.isPending}
                className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  user.accountEnabled
                    ? 'border border-red-300 dark:border-red-700/50 text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'border border-emerald-300 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                } disabled:opacity-50`}
              >
                {toggleAccount.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : user.accountEnabled ? (
                  <UserX size={14} />
                ) : (
                  <UserCheck size={14} />
                )}
                {user.accountEnabled ? 'Disable Account' : 'Enable Account'}
              </button>
            </div>

            {toggleAccount.isError && (
              <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-red-600 dark:text-red-400 text-xs">
                <AlertCircle size={14} />
                <span>Failed to update account status</span>
              </div>
            )}

            {toggleAccount.isSuccess && (
              <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded text-emerald-600 dark:text-emerald-400 text-xs">
                <UserCheck size={14} />
                <span>Account status updated successfully</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password reset dialog */}
      {showPasswordReset && (
        <PasswordResetDialog
          userId={user.id}
          userName={user.displayName}
          onClose={() => setShowPasswordReset(false)}
        />
      )}
    </>
  )
}

// ── Info row helper ────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-gray-800/80 rounded-lg">
      <span className="text-gray-400 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-gray-900 dark:text-white truncate">
          {value || <span className="text-gray-400 dark:text-gray-600">--</span>}
        </p>
      </div>
    </div>
  )
}
