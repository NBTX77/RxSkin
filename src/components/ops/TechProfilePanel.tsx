'use client'

import { X, MapPin, Gauge, Clock, Truck, GripVertical } from 'lucide-react'
import { useDraggable } from '@/hooks/useDraggable'
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
  const { position, isDragging, onDragStart } = useDraggable({
    storageKey: 'rx-tech-profile-pos',
    defaultPosition: { x: typeof window !== 'undefined' ? window.innerWidth - 380 : 800, y: 80 },
  })

  if (!isOpen || !tech) return null

  return (
    <>
      {/* Backdrop on mobile */}
      <div
        className="lg:hidden fixed inset-0 bg-black/50 z-[1050]"
        onClick={onClose}
      />

      {/* Mobile: bottom sheet, Desktop: floating draggable card */}
      {/* Mobile version */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[1060] bg-gray-900 border-t border-gray-800 rounded-t-xl shadow-2xl max-h-[80vh] overflow-y-auto">
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
        <TechProfileContent tech={tech} />
      </div>

      {/* Desktop: floating draggable card */}
      <div
        style={{ left: position.x, top: position.y, cursor: isDragging ? 'grabbing' : undefined }}
        className={`hidden lg:flex flex-col fixed z-[1050] w-[360px] max-h-[calc(100vh-100px)] bg-gray-900/95 backdrop-blur-xl border border-gray-700/40 rounded-xl shadow-2xl overflow-hidden ${isDragging ? 'select-none' : ''}`}
      >
        {/* Drag handle header */}
        <div className="flex items-center gap-1.5 px-2 py-2 border-b border-gray-700/30 flex-shrink-0">
          <div
            onMouseDown={onDragStart}
            onTouchStart={onDragStart}
            className="flex items-center justify-center w-6 h-6 rounded cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 transition-colors"
            title="Drag to reposition"
          >
            <GripVertical size={12} />
          </div>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border flex-shrink-0 ${
              tech.hosColor === 'red'
                ? 'bg-red-500/20 border-red-500/40'
                : tech.hosColor === 'yellow'
                ? 'bg-yellow-500/20 border-yellow-500/40'
                : 'bg-blue-500/20 border-blue-500/40'
            }`}>
              <span className="text-white">{getInitials(tech.name)}</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white truncate">{tech.name}</h2>
              <p className="text-[10px] text-gray-500">{tech.memberIdentifier || 'Unknown ID'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-6 h-6 rounded text-gray-500 hover:text-white hover:bg-gray-800/50 transition-colors"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>

        <TechProfileContent tech={tech} />
      </div>
    </>
  )
}

/** Shared content used by both mobile and desktop views */
function TechProfileContent({ tech }: { tech: FleetTech }) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Quick metrics */}
      <div className="grid grid-cols-2 gap-2.5 p-3 border-b border-gray-700/30">
        <div className="flex items-center gap-2">
          <Truck size={13} className="text-gray-500" />
          <div>
            <div className="text-[10px] text-gray-500">Truck</div>
            <div className="text-xs text-white">{tech.truckName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={13} className="text-gray-500" />
          <div>
            <div className="text-[10px] text-gray-500">Location</div>
            <div className="text-xs text-white">
              {tech.lat.toFixed(4)}, {tech.lng.toFixed(4)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Gauge size={13} className="text-gray-500" />
          <div>
            <div className="text-[10px] text-gray-500">Speed</div>
            <div className={`text-xs ${tech.speed > 0 ? 'text-green-400' : 'text-gray-400'}`}>
              {tech.speed > 0 ? `${tech.speed} mph` : 'Parked'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-gray-500" />
          <div>
            <div className="text-[10px] text-gray-500">HOS Remaining</div>
            <div className={`text-xs font-medium ${
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
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Active Ticket */}
        <div>
          <h3 className="text-xs font-semibold text-white mb-1.5">Active Ticket</h3>
          {tech.currentTicket ? (
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-500">#{tech.currentTicket.id}</span>
                <PriorityPill priority={tech.currentTicket.priority} />
              </div>
              <p className="text-xs text-white">{tech.currentTicket.summary}</p>
              {tech.currentTicket.company && (
                <p className="text-[10px] text-gray-500 mt-1">{tech.currentTicket.company}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No active ticket</p>
          )}
        </div>

        {/* Schedule Hold Tickets */}
        {tech.scheduledHold.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-white mb-1.5">Schedule Holds ({tech.scheduledHold.length})</h3>
            <div className="space-y-1.5">
              {tech.scheduledHold.map((hold) => (
                <div key={hold.id} className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-500">#{hold.id}</span>
                    <PriorityPill priority={hold.priority} />
                  </div>
                  <p className="text-xs text-white">{hold.summary}</p>
                  {hold.company && (
                    <p className="text-[10px] text-gray-500 mt-1">{hold.company}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Today's Schedule */}
        <div>
          <h3 className="text-xs font-semibold text-white mb-1.5">Today&apos;s Schedule ({tech.dispatch.length})</h3>
          {tech.dispatch.length > 0 ? (
            <div className="space-y-1.5">
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
                    className={`bg-gray-800/50 border border-gray-700/50 border-l-2 ${typeColors[d.type] ?? 'border-l-gray-400'} rounded-lg p-2.5`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500">
                        {d.start} — {d.end}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        d.status === 'In Progress'
                          ? 'bg-green-500/10 text-green-400'
                          : d.status === 'Completed'
                          ? 'bg-gray-500/10 text-gray-400'
                          : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {d.status ?? d.type}
                      </span>
                    </div>
                    <p className="text-xs text-white mt-1">{d.name}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No entries scheduled</p>
          )}
        </div>
      </div>
    </div>
  )
}
