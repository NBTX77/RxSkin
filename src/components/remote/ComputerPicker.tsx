'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { AutomateComputer } from '@/types'
import {
  Monitor, Server, Laptop, Wifi, WifiOff, Search,
  Cpu, HardDrive, RefreshCw, X,
} from 'lucide-react'

interface ComputerPickerProps {
  companyName: string
  isOpen: boolean
  onClose: () => void
  onSelect: (computer: AutomateComputer) => void
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  Server: <Server size={14} className="text-purple-400" />,
  Workstation: <Monitor size={14} className="text-blue-400" />,
  Laptop: <Laptop size={14} className="text-cyan-400" />,
}

export function ComputerPicker({ companyName, isOpen, onClose, onSelect }: ComputerPickerProps) {
  const [search, setSearch] = useState('')

  const { data: computers = [], isLoading, refetch } = useQuery<AutomateComputer[]>({
    queryKey: ['automate-computers', companyName],
    queryFn: async () => {
      const res = await fetch(`/api/automate/computers?clientName=${encodeURIComponent(companyName)}`)
      if (!res.ok) return []
      return res.json()
    },
    enabled: isOpen && !!companyName,
    staleTime: 30_000,
  })

  if (!isOpen) return null

  const filtered = search
    ? computers.filter(c =>
        c.computerName.toLowerCase().includes(search.toLowerCase()) ||
        c.localIP.includes(search)
      )
    : computers

  const online = filtered.filter(c => c.status === 'Online')
  const offline = filtered.filter(c => c.status !== 'Online')

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md z-50 bg-gray-950 border-l border-gray-800 shadow-2xl animate-in slide-in-from-right duration-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-sm font-semibold text-white">Select Computer</h2>
            <p className="text-xs text-gray-500 mt-0.5">{companyName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-800">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or IP..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
        </div>

        {/* Computer list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {isLoading ? (
            <div className="space-y-2 px-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-900 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-600 py-8 text-sm">
              {computers.length === 0 ? 'No computers found for this company' : 'No matches'}
            </p>
          ) : (
            <>
              {online.length > 0 && (
                <>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2 pt-2 pb-1">
                    Online ({online.length})
                  </p>
                  {online.map(computer => (
                    <ComputerRow key={computer.id} computer={computer} onSelect={onSelect} />
                  ))}
                </>
              )}
              {offline.length > 0 && (
                <>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2 pt-3 pb-1">
                    Offline ({offline.length})
                  </p>
                  {offline.map(computer => (
                    <ComputerRow key={computer.id} computer={computer} onSelect={onSelect} />
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-800 text-xs text-gray-600">
          {computers.length} computer{computers.length !== 1 ? 's' : ''} managed
        </div>
      </div>
    </>
  )
}

function ComputerRow({
  computer,
  onSelect,
}: {
  computer: AutomateComputer
  onSelect: (c: AutomateComputer) => void
}) {
  const isOnline = computer.status === 'Online'
  const icon = TYPE_ICON[computer.type] ?? <Monitor size={14} className="text-gray-400" />
  const memUsedPct = computer.totalMemoryGB > 0
    ? Math.round(((computer.totalMemoryGB - computer.freeMemoryGB) / computer.totalMemoryGB) * 100)
    : 0

  return (
    <button
      onClick={() => onSelect(computer)}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-900 transition-colors text-left group"
    >
      {/* Status + Type icon */}
      <div className="relative flex-shrink-0">
        <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
          {icon}
        </div>
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-950 ${isOnline ? 'bg-green-500' : 'bg-gray-600'}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">{computer.computerName}</span>
          {computer.isRebootNeeded && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-orange-500/20 text-orange-400 font-medium flex-shrink-0">
              Reboot
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[11px] text-gray-500">{computer.localIP}</span>
          {isOnline && (
            <>
              <span className="text-[11px] text-gray-600 flex items-center gap-1">
                <Cpu size={10} /> {computer.cpuUsage}%
              </span>
              <span className="text-[11px] text-gray-600 flex items-center gap-1">
                <HardDrive size={10} /> {memUsedPct}%
              </span>
            </>
          )}
        </div>
      </div>

      {/* Online indicator */}
      <div className="flex-shrink-0">
        {isOnline ? (
          <Wifi size={14} className="text-green-500" />
        ) : (
          <WifiOff size={14} className="text-gray-600" />
        )}
      </div>
    </button>
  )
}
