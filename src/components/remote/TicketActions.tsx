'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Ticket, AutomateComputer } from '@/types'
import { ComputerPicker } from './ComputerPicker'
import { SystemInfoPanel } from './SystemInfoPanel'
import { ScriptRunner } from './ScriptRunner'
import {
  Monitor, Play, Info, ScreenShare, ChevronDown,
  Loader2, ExternalLink,
} from 'lucide-react'

interface TicketActionsProps {
  ticket: Ticket
}

type ActionMode = 'remote' | 'script' | 'info' | null

/**
 * TicketActions — the right-click / remote tools panel for a ticket.
 * Flow: Select action → Pick computer → Execute action.
 */
export function TicketActions({ ticket }: TicketActionsProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [selectedComputer, setSelectedComputer] = useState<AutomateComputer | null>(null)
  const [actionMode, setActionMode] = useState<ActionMode>(null)
  // Launch URL lookup for selected computer
  const { data: controlData, isLoading: controlLoading } = useQuery({
    queryKey: ['control-session', selectedComputer?.computerName],
    queryFn: async () => {
      const res = await fetch(`/api/control?computerName=${encodeURIComponent(selectedComputer!.computerName)}`)
      if (!res.ok) return null
      return res.json()
    },
    enabled: !!selectedComputer && actionMode === 'remote',
    staleTime: 30_000,
  })

  const handleAction = useCallback((mode: ActionMode) => {
    setActionMode(mode)
    if (!selectedComputer) {
      // Need to pick a computer first
      setShowPicker(true)
    } else if (mode === 'remote') {
      // Already have a computer, fetch the launch URL
      // Query will trigger automatically
    }
  }, [selectedComputer])

  const handleComputerSelected = useCallback((computer: AutomateComputer) => {
    setSelectedComputer(computer)
    setShowPicker(false)

    // Now that we have a computer, execute the pending action
    if (actionMode === 'remote') {
      // Launch URL query will fire from useQuery
    }
    // For script and info, panels open based on selectedComputer + actionMode state
  }, [actionMode])

  const launchRemote = useCallback(() => {
    if (controlData?.launchUrl) {
      window.open(controlData.launchUrl, '_blank')
    }
  }, [controlData])

  return (
    <>
      {/* Remote Tools section in sidebar */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Remote Tools
        </h3>

        {/* Selected computer display */}
        {selectedComputer && (
          <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${selectedComputer.status === 'Online' ? 'bg-green-500' : 'bg-gray-600'}`} />
            <span className="text-xs text-white font-medium truncate flex-1">{selectedComputer.computerName}</span>
            <button
              onClick={() => { setSelectedComputer(null); setActionMode(null) }}
              className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
            >
              Change
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-1.5">
          {/* Remote Control */}
          <button
            onClick={() => {
              if (selectedComputer && controlData?.launchUrl) {
                launchRemote()
              } else {
                handleAction('remote')
              }
            }}
            disabled={actionMode === 'remote' && controlLoading}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
          >
            {actionMode === 'remote' && controlLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ScreenShare size={14} />
            )}
            Remote Control
            {selectedComputer && controlData?.launchUrl && (
              <ExternalLink size={10} className="ml-auto text-gray-600" />
            )}
          </button>

          {/* Run Script */}
          <button
            onClick={() => handleAction('script')}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-blue-400 hover:bg-blue-500/10 transition-colors"
          >
            <Play size={14} />
            Run Script
          </button>

          {/* System Info */}
          <button
            onClick={() => handleAction('info')}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-purple-400 hover:bg-purple-500/10 transition-colors"
          >
            <Info size={14} />
            System Info
          </button>

          {/* Pick Computer */}
          <button
            onClick={() => setShowPicker(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-gray-400 hover:bg-gray-800 transition-colors"
          >
            <Monitor size={14} />
            {selectedComputer ? 'Change Computer' : 'Select Computer'}
            <ChevronDown size={12} className="ml-auto" />
          </button>
        </div>
      </div>

      {/* Computer Picker Panel */}
      <ComputerPicker
        companyName={ticket.company}
        isOpen={showPicker}
        onClose={() => { setShowPicker(false); if (!selectedComputer) setActionMode(null) }}
        onSelect={handleComputerSelected}
      />

      {/* System Info Panel */}
      {selectedComputer && (
        <SystemInfoPanel
          computer={selectedComputer}
          isOpen={actionMode === 'info' && !!selectedComputer}
          onClose={() => setActionMode(null)}
        />
      )}

      {/* Script Runner Panel */}
      {selectedComputer && (
        <ScriptRunner
          computer={selectedComputer}
          isOpen={actionMode === 'script' && !!selectedComputer}
          onClose={() => setActionMode(null)}
        />
      )}
    </>
  )
}
