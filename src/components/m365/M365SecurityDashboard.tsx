'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useM365Tenant } from './M365TenantProvider'
import { Shield, AlertTriangle, ShieldCheck, ShieldOff, Loader2, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

interface RiskyUser {
  id: string
  displayName: string
  userPrincipalName: string
  riskLevel: string
  riskState: string
  riskLastUpdatedDateTime: string
}

interface SignIn {
  id: string
  userDisplayName: string
  userPrincipalName: string
  appDisplayName: string
  status: { errorCode: number; failureReason: string }
  createdDateTime: string
  location: { city: string; countryOrRegion: string }
}

interface CAPolicy {
  id: string
  displayName: string
  state: string
  createdDateTime: string
  modifiedDateTime: string
}

interface MfaStatus {
  mfaEnabled: number
  mfaDisabled: number
  total: number
}

const riskLevelConfig: Record<string, { label: string; classes: string }> = {
  critical: { label: 'Critical', classes: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  high: { label: 'High', classes: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' },
  medium: { label: 'Medium', classes: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
  low: { label: 'Low', classes: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  hidden: { label: 'Hidden', classes: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' },
  none: { label: 'None', classes: 'bg-gray-100 dark:bg-gray-800 text-gray-500' },
}

const policyStateConfig: Record<string, { label: string; classes: string }> = {
  enabled: { label: 'Enabled', classes: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  disabled: { label: 'Disabled', classes: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' },
  enabledForReportingButNotEnforced: { label: 'Report Only', classes: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
}

type Tab = 'risky-users' | 'sign-ins' | 'ca-policies'

export function M365SecurityDashboard() {
  const { selectedTenantId } = useM365Tenant()
  const [activeTab, setActiveTab] = useState<Tab>('risky-users')
  const tenantParam = selectedTenantId ? `?clientTenantId=${selectedTenantId}` : ''

  const { data: riskyUsersData, isLoading: riskyLoading } = useQuery<{ riskyUsers?: RiskyUser[]; error?: string }>({
    queryKey: ['m365-risky-users', selectedTenantId],
    queryFn: async () => {
      const res = await fetch(`/api/m365/security/risky-users${tenantParam}`)
      if (!res.ok) return { riskyUsers: [] }
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const { data: signInsData, isLoading: signInsLoading } = useQuery<{ signIns?: SignIn[] }>({
    queryKey: ['m365-sign-ins', selectedTenantId],
    queryFn: async () => {
      const res = await fetch(`/api/m365/security/sign-ins${tenantParam}`)
      if (!res.ok) return { signIns: [] }
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const { data: policiesData, isLoading: policiesLoading } = useQuery<{ policies?: CAPolicy[] }>({
    queryKey: ['m365-ca-policies', selectedTenantId],
    queryFn: async () => {
      const res = await fetch(`/api/m365/security/ca-policies${tenantParam}`)
      if (!res.ok) return { policies: [] }
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const { data: mfaData } = useQuery<MfaStatus | null>({
    queryKey: ['m365-mfa-status', selectedTenantId],
    queryFn: async () => {
      const res = await fetch(`/api/m365/security/mfa-status${tenantParam}`)
      if (!res.ok) return null
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const riskyUsers = riskyUsersData?.riskyUsers ?? []
  const signIns = signInsData?.signIns ?? []
  const policies = policiesData?.policies ?? []
  const premiumRequired = riskyUsersData?.error === 'premium_required'

  // KPI calculations
  const failedSignIns = signIns.filter(s => s.status.errorCode !== 0).length
  const enabledPolicies = policies.filter(p => p.state === 'enabled').length

  const tabs: { id: Tab; label: string; icon: typeof Shield }[] = [
    { id: 'risky-users', label: 'Risky Users', icon: AlertTriangle },
    { id: 'sign-ins', label: 'Sign-ins', icon: ShieldCheck },
    { id: 'ca-policies', label: 'CA Policies', icon: Shield },
  ]

  return (
    <div className="space-y-4">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Risky Users</p>
          <p className={`text-2xl font-bold ${riskyUsers.length > 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
            {premiumRequired ? '—' : riskyUsers.length}
          </p>
          {premiumRequired && <p className="text-[10px] text-yellow-500 mt-0.5">P2 required</p>}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Failed Sign-ins</p>
          <p className={`text-2xl font-bold ${failedSignIns > 0 ? 'text-orange-500' : 'text-gray-900 dark:text-white'}`}>
            {failedSignIns}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">recent entries</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">CA Policies</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{enabledPolicies}</p>
          <p className="text-xs text-gray-500 mt-0.5">of {policies.length} enabled</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">MFA Status</p>
          {mfaData ? (
            <>
              <p className={`text-2xl font-bold ${mfaData.mfaEnabled === mfaData.total ? 'text-emerald-500' : 'text-orange-500'}`}>
                {mfaData.mfaEnabled}/{mfaData.total}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">MFA enabled</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-400">—</p>
              <p className="text-xs text-gray-500 mt-0.5">No data</p>
            </>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden">

        {/* Risky Users Tab */}
        {activeTab === 'risky-users' && (
          <>
            {riskyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-blue-500" />
              </div>
            ) : premiumRequired ? (
              <div className="px-5 py-10 text-center space-y-2">
                <ShieldOff size={32} className="text-yellow-500 mx-auto" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Azure AD Premium P2 Required</p>
                <p className="text-xs text-gray-500">Risky user detection requires an Azure AD Premium P2 license.</p>
              </div>
            ) : riskyUsers.length === 0 ? (
              <div className="px-5 py-10 text-center space-y-2">
                <CheckCircle size={32} className="text-emerald-500 mx-auto" />
                <p className="text-sm text-gray-500">No risky users detected</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Risk Level</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">State</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {riskyUsers.map(user => {
                    const lvl = riskLevelConfig[user.riskLevel.toLowerCase()] ?? riskLevelConfig.none
                    let updatedAt = ''
                    try { updatedAt = format(new Date(user.riskLastUpdatedDateTime), 'MMM d, h:mm a') } catch { /* ignore */ }
                    return (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{user.displayName}</p>
                          <p className="text-xs text-gray-500 truncate">{user.userPrincipalName}</p>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${lvl.classes}`}>
                            {lvl.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 hidden md:table-cell capitalize">
                          {user.riskState.replace(/([A-Z])/g, ' $1').trim()}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{updatedAt}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* Sign-ins Tab */}
        {activeTab === 'sign-ins' && (
          <>
            {signInsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-blue-500" />
              </div>
            ) : signIns.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-gray-500">No recent sign-ins</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">App</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Location</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {signIns.slice(0, 20).map(signIn => {
                    const success = signIn.status.errorCode === 0
                    let signInTime = ''
                    try { signInTime = format(new Date(signIn.createdDateTime), 'MMM d, h:mm a') } catch { /* ignore */ }
                    const location = [signIn.location?.city, signIn.location?.countryOrRegion].filter(Boolean).join(', ')
                    return (
                      <tr key={signIn.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[140px]">{signIn.userDisplayName}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[140px]">{signIn.userPrincipalName}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 hidden sm:table-cell truncate max-w-[120px]">
                          {signIn.appDisplayName}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="flex items-center justify-center gap-1">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${success ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span className={`text-xs hidden sm:inline ${success ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                              {success ? 'Success' : 'Failed'}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{location || '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{signInTime}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* CA Policies Tab */}
        {activeTab === 'ca-policies' && (
          <>
            {policiesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-blue-500" />
              </div>
            ) : policies.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-gray-500">No conditional access policies found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {policies.map(policy => {
                  const stateConf = policyStateConfig[policy.state] ?? policyStateConfig.disabled
                  let modifiedAt = ''
                  try { modifiedAt = format(new Date(policy.modifiedDateTime), 'MMM d, yyyy') } catch { /* ignore */ }
                  return (
                    <div key={policy.id} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{policy.displayName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Modified {modifiedAt}</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${stateConf.classes}`}>
                        {stateConf.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
