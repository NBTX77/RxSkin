'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import type { AutomateComputer, AutomateScript } from '@/types'
import {
  Search, Play, X, Folder, AlertTriangle, CheckCircle2, Loader2,
} from 'lucide-react'

interface ScriptRunnerProps {
  computer: AutomateComputer
  isOpen: boolean
  onClose: () => void
}

// Well-known scripts for quick actions
const QUICK_ACTIONS = [
  { id: 6, label: 'Reboot Computer', icon: '🔄', danger: true },
  { id: 20, label: 'Disk Cleanup', icon: '🧹' },
  { id: 42, label: 'Install Patches', icon: '🛡️' },
  { id: 30, label: 'Update AV Definitions', icon: '🦠' },
]

export function ScriptRunner({ computer, isOpen, onClose }: ScriptRunnerProps) {
  const [search, setSearch] = useState('')
  const [confirmScript, setConfirmScript] = useState<AutomateScript | null>(null)

  const { data: scripts = [], isLoading } = useQuery<AutomateScript[]>({
    queryKey: ['automate-scripts', search],
    queryFn: async () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : ''
      const res = await fetch(`/api/automate/scripts${params}`)
      if (!res.ok) return []
      return res.json()
    },
    enabled: isOpen,
    staleTime: 5 * 60_000,
  })

  const runMutation = useMutation({
    mutationFn: async (scriptId: number) => {
      const res = await fetch('/api/automate/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId,
          computerIds: [computer.id],
        }),
      })
      if (!res.ok) throw new Error('Failed to run script')
      return res.json()
    },
    onSuccess: () => {
      setConfirmScript(null)
      // Auto-close after short delay to show success
      setTimeout(onClose, 1500)
    },
  })

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={onClose} />

      <div role="dialog" aria-modal="true" aria-label="Run Script" className="fixed inset-y-0 right-0 w-full max-w-md z-50 bg-gray-50 dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800 shadow-2xl animate-in slide-in-from-right duration-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Run Script</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Target: <span className="text-gray-600 dark:text-gray-400">{computer.computerName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:text-white hover:bg-gray-800 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Success banner */}
        {runMutation.isSuccess && (
          <div className="px-5 py-3 bg-green-500/10 border-b border-green-500/20 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-green-400" />
            <span className="text-xs text-green-300">Script queued successfully</span>
          </div>
        )}

        {/* Quick actions */}
        <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((qa) => (
              <button
                key={qa.id}
                onClick={() => setConfirmScript({ id: qa.id, name: qa.label, description: '', folder: '', hasParameters: false, parameters: [] })}
                disabled={runMutation.isPending}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  qa.danger
                    ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20'
                    : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800'
                }`}
              >
                <span>{qa.icon}</span>
                {qa.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <label htmlFor="script-search" className="sr-only">Search scripts</label>
            <input
              id="script-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search all scripts..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Script list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {isLoading ? (
            <div className="space-y-2 px-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-14 bg-white dark:bg-gray-900 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : scripts.length === 0 ? (
            <p className="text-center text-gray-600 py-8 text-sm">
              {search ? 'No scripts match your search' : 'No scripts available'}
            </p>
          ) : (
            scripts.map(script => (
              <button
                key={script.id}
                onClick={() => setConfirmScript(script)}
                disabled={runMutation.isPending}
                className="w-full flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-white dark:bg-gray-900 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Play size={12} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-900 dark:text-white block truncate">{script.name}</span>
                  {script.folder && (
                    <span className="text-[11px] text-gray-600 flex items-center gap-1 mt-0.5">
                      <Folder size={10} /> {script.folder}
                    </span>
                  )}
                  {script.description && (
                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{script.description}</p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Confirm dialog */}
        {confirmScript && (
          <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white font-medium">Run &ldquo;{confirmScript.name}&rdquo;?</p>
                <p className="text-xs text-gray-500 mt-1">
                  This will execute on <span className="text-gray-700 dark:text-gray-300">{computer.computerName}</span>
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => runMutation.mutate(confirmScript.id)}
                    disabled={runMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 transition-colors"
                  >
                    {runMutation.isPending ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Play size={12} />
                    )}
                    {runMutation.isPending ? 'Running...' : 'Run Script'}
                  </button>
                  <button
                    onClick={() => setConfirmScript(null)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
