'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useM365Tenant } from './M365TenantProvider'
import type { M365Group } from '@/types/m365'
import { ChevronRight, ChevronDown, Users, X, Plus, Loader2, ShieldCheck, Mail, Lock } from 'lucide-react'

interface GroupMember {
  id: string
  displayName: string
  userPrincipalName: string
}

function getGroupType(group: M365Group): string {
  if (group.groupTypes.includes('Unified')) return 'Microsoft 365'
  if (group.securityEnabled && group.mailEnabled) return 'Mail-enabled Security'
  if (group.securityEnabled) return 'Security'
  if (group.mailEnabled) return 'Distribution'
  return 'Other'
}

function getGroupTypeStyle(type: string): string {
  switch (type) {
    case 'Microsoft 365':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
    case 'Security':
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
    case 'Mail-enabled Security':
      return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
    case 'Distribution':
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
  }
}

function getGroupIcon(type: string) {
  switch (type) {
    case 'Microsoft 365':
      return <Users size={14} />
    case 'Security':
    case 'Mail-enabled Security':
      return <ShieldCheck size={14} />
    case 'Distribution':
      return <Mail size={14} />
    default:
      return <Lock size={14} />
  }
}

export function M365GroupList() {
  const { selectedTenantId } = useM365Tenant()
  const queryClient = useQueryClient()
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)
  const [addMemberGroupId, setAddMemberGroupId] = useState<string | null>(null)
  const [newMemberId, setNewMemberId] = useState('')

  const tenantParam = selectedTenantId ? `&clientTenantId=${selectedTenantId}` : ''

  const { data, isLoading, isError } = useQuery<{ groups: M365Group[] }>({
    queryKey: ['m365-groups', selectedTenantId],
    queryFn: async () => {
      const res = await fetch(`/api/m365/groups?${tenantParam.replace('&', '')}`)
      if (!res.ok) throw new Error('Failed to fetch groups')
      return res.json()
    },
    staleTime: 60_000,
  })

  const groups = data?.groups ?? []

  // Fetch members for expanded group
  const { data: membersData, isLoading: membersLoading } = useQuery<{ members: GroupMember[] }>({
    queryKey: ['m365-group-members', selectedTenantId, expandedGroupId],
    queryFn: async () => {
      const res = await fetch(`/api/m365/groups/${expandedGroupId}/members?${tenantParam.replace('&', '')}`)
      if (!res.ok) throw new Error('Failed to fetch members')
      return res.json()
    },
    enabled: !!expandedGroupId,
    staleTime: 30_000,
  })

  const members = membersData?.members ?? []

  // Add member mutation
  const addMember = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const res = await fetch(`/api/m365/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, clientTenantId: selectedTenantId }),
      })
      if (!res.ok) throw new Error('Failed to add member')
      return res.json()
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['m365-group-members', selectedTenantId, vars.groupId] })
      setNewMemberId('')
      setAddMemberGroupId(null)
    },
  })

  // Remove member mutation
  const removeMember = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const res = await fetch(`/api/m365/groups/${groupId}/members/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientTenantId: selectedTenantId }),
      })
      if (!res.ok) throw new Error('Failed to remove member')
      return res.json()
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['m365-group-members', selectedTenantId, vars.groupId] })
    },
  })

  const toggleGroup = (groupId: string) => {
    setExpandedGroupId(prev => (prev === groupId ? null : groupId))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-blue-500" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-red-500">Failed to load groups. Check API connection and try again.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-lg overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="w-8 px-2" />
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Group Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Description</th>
              <th className="w-20 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {groups.map(group => {
              const type = getGroupType(group)
              const isExpanded = expandedGroupId === group.id
              return (
                <GroupRow
                  key={group.id}
                  group={group}
                  type={type}
                  isExpanded={isExpanded}
                  members={isExpanded ? members : []}
                  membersLoading={isExpanded && membersLoading}
                  addMemberGroupId={addMemberGroupId}
                  newMemberId={newMemberId}
                  onToggle={() => toggleGroup(group.id)}
                  onSetAddMemberGroupId={setAddMemberGroupId}
                  onNewMemberIdChange={setNewMemberId}
                  onAddMember={(userId) => addMember.mutate({ groupId: group.id, userId })}
                  onRemoveMember={(userId) => removeMember.mutate({ groupId: group.id, userId })}
                  addMemberPending={addMember.isPending}
                />
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
        {groups.map(group => {
          const type = getGroupType(group)
          const isExpanded = expandedGroupId === group.id
          return (
            <div key={group.id}>
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-gray-400">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{group.displayName}</p>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getGroupTypeStyle(type)}`}>
                        {getGroupIcon(type)}
                        {type}
                      </span>
                    </div>
                    {group.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{group.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{group.memberCount ?? '?'} members</p>
                  </div>
                </div>
              </button>

              {/* Expanded members */}
              {isExpanded && (
                <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                  {membersLoading ? (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 size={14} className="animate-spin text-blue-500" />
                      <span className="text-xs text-gray-500">Loading members...</span>
                    </div>
                  ) : (
                    <MemberList
                      members={members}
                      groupId={group.id}
                      addMemberGroupId={addMemberGroupId}
                      newMemberId={newMemberId}
                      onSetAddMemberGroupId={setAddMemberGroupId}
                      onNewMemberIdChange={setNewMemberId}
                      onAddMember={(userId) => addMember.mutate({ groupId: group.id, userId })}
                      onRemoveMember={(userId) => removeMember.mutate({ groupId: group.id, userId })}
                      addMemberPending={addMember.isPending}
                    />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {groups.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No groups found</p>
        </div>
      )}
    </div>
  )
}

// ── Desktop group row with expandable members ──────────────

interface GroupRowProps {
  group: M365Group
  type: string
  isExpanded: boolean
  members: GroupMember[]
  membersLoading: boolean
  addMemberGroupId: string | null
  newMemberId: string
  onToggle: () => void
  onSetAddMemberGroupId: (id: string | null) => void
  onNewMemberIdChange: (val: string) => void
  onAddMember: (userId: string) => void
  onRemoveMember: (userId: string) => void
  addMemberPending: boolean
}

function GroupRow({
  group,
  type,
  isExpanded,
  members,
  membersLoading,
  addMemberGroupId,
  newMemberId,
  onToggle,
  onSetAddMemberGroupId,
  onNewMemberIdChange,
  onAddMember,
  onRemoveMember,
  addMemberPending,
}: GroupRowProps) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
      >
        <td className="px-2 text-gray-400">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </td>
        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{group.displayName}</td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getGroupTypeStyle(type)}`}>
            {getGroupIcon(type)}
            {type}
          </span>
        </td>
        <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
          {group.memberCount ?? '?'}
        </td>
        <td className="px-4 py-3 text-gray-500 truncate max-w-[200px] hidden lg:table-cell">
          {group.description || '--'}
        </td>
        <td className="px-4 py-3">
          <button
            onClick={e => {
              e.stopPropagation()
              onSetAddMemberGroupId(addMemberGroupId === group.id ? null : group.id)
            }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <span className="flex items-center gap-1">
              <Plus size={12} /> Add
            </span>
          </button>
        </td>
      </tr>

      {/* Expanded member list */}
      {isExpanded && (
        <tr>
          <td colSpan={6} className="bg-gray-50 dark:bg-gray-800/50 px-6 py-3">
            {membersLoading ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 size={14} className="animate-spin text-blue-500" />
                <span className="text-xs text-gray-500">Loading members...</span>
              </div>
            ) : (
              <MemberList
                members={members}
                groupId={group.id}
                addMemberGroupId={addMemberGroupId}
                newMemberId={newMemberId}
                onSetAddMemberGroupId={onSetAddMemberGroupId}
                onNewMemberIdChange={onNewMemberIdChange}
                onAddMember={onAddMember}
                onRemoveMember={onRemoveMember}
                addMemberPending={addMemberPending}
              />
            )}
          </td>
        </tr>
      )}
    </>
  )
}

// ── Shared member list component ───────────────────────────

interface MemberListProps {
  members: GroupMember[]
  groupId: string
  addMemberGroupId: string | null
  newMemberId: string
  onSetAddMemberGroupId: (id: string | null) => void
  onNewMemberIdChange: (val: string) => void
  onAddMember: (userId: string) => void
  onRemoveMember: (userId: string) => void
  addMemberPending: boolean
}

function MemberList({
  members,
  groupId,
  addMemberGroupId,
  newMemberId,
  onSetAddMemberGroupId,
  onNewMemberIdChange,
  onAddMember,
  onRemoveMember,
  addMemberPending,
}: MemberListProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Members ({members.length})
        </p>
        <button
          onClick={() => onSetAddMemberGroupId(addMemberGroupId === groupId ? null : groupId)}
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
        >
          <Plus size={12} /> Add Member
        </button>
      </div>

      {/* Add member input */}
      {addMemberGroupId === groupId && (
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newMemberId}
            onChange={e => onNewMemberIdChange(e.target.value)}
            placeholder="User ID or UPN"
            className="flex-1 px-2.5 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-700/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
            onKeyDown={e => {
              if (e.key === 'Enter' && newMemberId.trim()) {
                onAddMember(newMemberId.trim())
              }
            }}
          />
          <button
            onClick={() => {
              if (newMemberId.trim()) onAddMember(newMemberId.trim())
            }}
            disabled={addMemberPending || !newMemberId.trim()}
            className="px-2.5 py-1.5 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addMemberPending ? <Loader2 size={12} className="animate-spin" /> : 'Add'}
          </button>
        </div>
      )}

      {members.length === 0 && (
        <p className="text-xs text-gray-500 py-2">No members</p>
      )}

      {members.map(member => (
        <div
          key={member.id}
          className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700/50 group"
        >
          <div className="min-w-0">
            <p className="text-sm text-gray-900 dark:text-white truncate">{member.displayName}</p>
            <p className="text-xs text-gray-500 truncate">{member.userPrincipalName}</p>
          </div>
          <button
            onClick={() => onRemoveMember(member.id)}
            className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
          >
            <span title="Remove member"><X size={14} /></span>
          </button>
        </div>
      ))}
    </div>
  )
}
