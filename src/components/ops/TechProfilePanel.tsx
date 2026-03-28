'use client'

import { X, MapPin, Gauge, Clock, Truck } from 'lucide-react'
import type { FleetTech } from '@/types/ops'

interface TechProfilePanelProps {
  tech: FleetTech | null
  onClose: () => void
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function PriorityPill({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    Critical: 'bg-red-500/10 text-red-400 border-red-500/20',
    'Priority 1 - Critical': 'bg-red-500/10 text-red-400 border-red-500/20',
    High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'Priority 2 - High': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    Low: 'bg-green-500/10 text-green-400 border-green-500/20',
  }
  const cls = colors[priority] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${cls}`}>
      {priority}
    </span>
  )
}

export function TechProfilePanel({ tech, onClose }: TechProfilePanelProps) {
  const isOpen = tech !== null

  return (
    <>
      {/* Backdrop on mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full z-50 bg-gray-900 border-l border-gray-800 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } w-full sm:w-[360px]`}
      >
        {tech && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border ${
                  tech.hosColor === 'red'
                    ? 'bg-red-500/20 border-red-500/40'
                    : tech.hosColor === 'yellow'
                    ? 'bg-yellow-500/20 border-yellow-500/40'
                    : 'bg-blue-500/20 border-blue-500/40'
                }`}>
                  <span className="text-white">{getInitials(tech.name)}</span>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">{tech.name}</h2>
                  <p className="text-xs text-gray-500">{tech.memberIdentifier || 'Unknown ID'}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick metrics */}
            <div className="grid grid-cols-2 gap-3 p-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-gray-500" />
                <div>
                  <div className="text-xs text-gray-500">Truck</div>
                  <div className="text-sm text-white">{tech.truckName}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-gray-500" />
                <div>
                  <div className="text-xs text-gray-500">Location</div>
                  <div className="text-sm text-white">
                    {tech.lat.toFixed(4)}, {tech.lng.toFixed(4)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Gauge size={14} className="text-gray-500" />
                <div>
                  <div className="text-xs text-gray-500">Speed</div>
                  <div className={`text-sm ${tech.speed > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                    {tech.speed > 0 ? `${tech.speed} mph` : 'Parked'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-gray-500" />
                <div>
                  <div className="text-xs text-gray-500">HOS Remaining</div>
                  <div className={`text-sm font-medium ${
                    tech.hosColor === 'red' ? 'text-red-400' :
                    tech.hosColor === 'yellow' ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {tech.hosRemaining} ({tech.hosPct}%)
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Open Tickets */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Active Ticket</h3>
                {tech.currentTicket ? (
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">#{tech.currentTicket.id}</span>
                      <PriorityPill priority={tech.currentTicket.priority} />
                    </div>
                    <p className="text-sm text-white">{tech.currentTicket.summary}</p>
                    {tech.currentTicket.company && (
                      <p className="text-xs text-gray-500 mt-1">{tech.currentTicket.company}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No active ticket</p>
                )}
              </div>

              {/* Schedule Hold Tickets */}
              {tech.scheduledHold.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2">Schedule Holds ({tech.scheduledHold.length})</h3>
                  <div className="space-y-2">
                    {tech.scheduledHold.map((hold) => (
                      <div key={hold.id} className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">#{hold.id}</span>
                          <PriorityPill priority={hold.priority} />
                        </div>
                        <p className="text-sm text-white">{hold.summary}</p>
                        {hold.company && (
                          <p className="text-xs text-gray-500 mt-1">{hold.company}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Today's Schedule */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Today&apos;s Schedule ({tech.dispatch.length})</h3>
                {tech.dispatch.length > 0 ? (
                  <div className="space-y-2">
                    {tech.dispatch.map((d) => {
                      const typeColors: Record<string, string> = {
                        'On-Site': 'border-l-blue-400',
                        'Remote': 'border-l-green-400',
                        'Meeting': 'border-l-purple-400',
                        'Schedule Hold': 'border-l-yellow-400',
                        'Recurring': 'border-l-gray-400',
                      }
                      return (
                        <div
                          key={d.id}
                          className={`bg-gray-800/50 border border-gray-700/50 border-l-2 ${typeColors[d.type] ?? 'border-l-gray-400'} rounded-lg p-3`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {d.start} — {d.end}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              d.status === 'In Progress'
                                ? 'bg-green-500/10 text-green-400'
                                : d.status === 'Completed'
                                ? 'bg-gray-500/10 text-gray-400'
                                : 'bg-blue-500/10 text-blue-400'
                            }`}>
                              {d.status ?? d.type}
                            </span>
                          </div>
                          <p className="text-sm text-white mt-1">{d.name}</p>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No entries scheduled</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}