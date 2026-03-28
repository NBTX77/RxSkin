'use client'

import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { Loader2, ChevronLeft, ChevronRight, User, Building2, Clock, X } from 'lucide-react'
import Link from 'next/link'

interface ScheduleEntry {
  id: number
  ticketId?: number
  ticketSummary?: string
  memberName: string
  start: string
  end: string
  type?: string
  status?: string
  companyName?: string
}

/* ---------- helpers ---------- */
const HOURS = Array.from({ length: 13 }, (_, i) => i + 6) // 6 AM – 6 PM
const MEMBER_COLORS: Record<string, string> = {}
const COLOR_PALETTE = [
  'bg-blue-500/15 border-blue-500/40 text-blue-200',
  'bg-purple-500/15 border-purple-500/40 text-purple-200',
  'bg-teal-500/15 border-teal-500/40 text-teal-200',
  'bg-orange-500/15 border-orange-500/40 text-orange-200',
  'bg-pink-500/15 border-pink-500/40 text-pink-200',
  'bg-emerald-500/15 border-emerald-500/40 text-emerald-200',
]
let colorIdx = 0
function memberColor(name: string) {
  if (!MEMBER_COLORS[name]) {
    MEMBER_COLORS[name] = COLOR_PALETTE[colorIdx % COLOR_PALETTE.length]
    colorIdx++
  }
  return MEMBER_COLORS[name]
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function duration(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const hours = Math.round(ms / (1000 * 60 * 60) * 10) / 10
  return `${hours}h`
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
}

function getWeekDays(date: Date): Date[] {
  const d = new Date(date)
  const day = d.getDay()
  const start = new Date(d)
  start.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  return Array.from({ length: 5 }, (_, i) => {
    const dd = new Date(start)
    dd.setDate(start.getDate() + i)
    return dd
  })
}

function getMonthDays(date: Date): Date[] {
  const year = date.getFullYear()
  const month = date.getMonth()
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startDay = first.getDay() === 0 ? 6 : first.getDay() - 1
  const result: Date[] = []
  for (let i = -startDay; i <= last.getDate() + (6 - (last.getDay() === 0 ? 6 : last.getDay() - 1)); i++) {
    if (result.length >= 42) break
    result.push(new Date(year, month, 1 + i))
  }
  while (result.length > 28 && result[result.length - 7]?.getMonth() !== month) {
    result.splice(-7)
  }
  return result
}

/* ---------- component ---------- */
export default function SchedulePage() {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null)

  const { data: entries = [], isLoading } = useQuery<ScheduleEntry[]>({
    queryKey: ['/api/schedule', selectedDate.toISOString().split('T')[0], viewMode],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('date', selectedDate.toISOString().split('T')[0])
      params.append('view', viewMode)
      const res = await fetch(`/api/schedule?${params}`)
      if (!res.ok) throw new Error('Failed to fetch schedule')
      return res.json()
    },
    staleTime: 10 * 60 * 1000,
  })

  const goToToday = () => setSelectedDate(new Date())

  const navigate = (dir: -1 | 1) => {
    const d = new Date(selectedDate)
    if (viewMode === 'day') d.setDate(d.getDate() + dir)
    else if (viewMode === 'week') d.setDate(d.getDate() + 7 * dir)
    else d.setMonth(d.getMonth() + dir)
    setSelectedDate(d)
  }

  const headerLabel = useMemo(() => {
    if (viewMode === 'day') {
      return selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    }
    if (viewMode === 'week') {
      const days = getWeekDays(selectedDate)
      const s = days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const e = days[4].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      return `${s} – ${e}`
    }
    return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }, [viewMode, selectedDate])

  // Quick stats
  const uniqueMembers = Array.from(new Set(entries.map((e) => e.memberName))).length
  const totalEntries = entries.length

  return (
    <main className="flex-1 overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">Schedule</h1>
              <span className="text-xs text-gray-400">{totalEntries} entries · {uniqueMembers} members</span>
              <button
                onClick={goToToday}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button onClick={() => navigate(-1)} className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm text-gray-300 min-w-[180px] text-center font-medium">{headerLabel}</span>
                <button onClick={() => navigate(1)} className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="flex items-center gap-0.5 bg-gray-800 rounded-lg p-0.5">
                {(['day', 'week', 'month'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors capitalize ${
                      viewMode === mode ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 size={20} className="text-gray-400 animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <Clock size={32} className="mb-2 opacity-50" />
              <p className="text-sm">No schedule entries for this period</p>
              <p className="text-xs mt-1">Try navigating to a different date range</p>
            </div>
          ) : viewMode === 'month' ? (
            <MonthView selectedDate={selectedDate} entries={entries} onSelectEntry={setSelectedEntry} />
          ) : viewMode === 'week' ? (
            <WeekView selectedDate={selectedDate} entries={entries} onSelectEntry={setSelectedEntry} />
          ) : (
            <DayView selectedDate={selectedDate} entries={entries} onSelectEntry={setSelectedEntry} />
          )}
        </div>
      </div>

      {/* Entry detail panel */}
      <EntryDetailPanel entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
    </main>
  )
}

/* ====================== DAY VIEW ====================== */
function DayView({ selectedDate, entries, onSelectEntry }: { selectedDate: Date; entries: ScheduleEntry[]; onSelectEntry: (e: ScheduleEntry) => void }) {
  const dayEntries = entries.filter((e) => isSameDay(new Date(e.start), selectedDate))

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="relative" style={{ minHeight: `${HOURS.length * 64}px` }}>
        {HOURS.map((hour) => (
          <div key={hour} className="absolute w-full border-b border-gray-800/50" style={{ top: `${(hour - 6) * 64}px`, height: '64px' }}>
            <span className="absolute -top-2.5 left-2 text-[10px] text-gray-600 w-12">
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </span>
          </div>
        ))}
        <div className="ml-14 mr-2 relative">
          {dayEntries.map((entry) => {
            const startH = new Date(entry.start).getHours() + new Date(entry.start).getMinutes() / 60
            const endH = new Date(entry.end).getHours() + new Date(entry.end).getMinutes() / 60
            const top = (startH - 6) * 64
            const height = Math.max((endH - startH) * 64, 28)
            return (
              <EntryBlock key={entry.id} entry={entry} style={{ top: `${top}px`, height: `${height}px` }} onClick={() => onSelectEntry(entry)} />
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ====================== WEEK VIEW ====================== */
function WeekView({ selectedDate, entries, onSelectEntry }: { selectedDate: Date; entries: ScheduleEntry[]; onSelectEntry: (e: ScheduleEntry) => void }) {
  const days = getWeekDays(selectedDate)
  const today = new Date()

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="grid grid-cols-[56px_repeat(5,1fr)] border-b border-gray-800">
        <div className="p-2"></div>
        {days.map((day) => {
          const isToday = isSameDay(day, today)
          return (
            <div key={day.toISOString()} className={`p-2 text-center border-l border-gray-800 ${isToday ? 'bg-blue-950/30' : ''}`}>
              <div className="text-[10px] text-gray-500 uppercase">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className={`text-sm font-semibold ${isToday ? 'text-blue-400' : 'text-white'}`}>{day.getDate()}</div>
            </div>
          )
        })}
      </div>

      <div className="relative grid grid-cols-[56px_repeat(5,1fr)]" style={{ minHeight: `${HOURS.length * 64}px` }}>
        <div className="relative">
          {HOURS.map((hour) => (
            <div key={hour} className="absolute w-full" style={{ top: `${(hour - 6) * 64}px` }}>
              <span className="absolute -top-2.5 left-2 text-[10px] text-gray-600">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </span>
            </div>
          ))}
        </div>

        {days.map((day) => {
          const dayEntries = entries.filter((e) => isSameDay(new Date(e.start), day))
          const isToday = isSameDay(day, today)
          return (
            <div key={day.toISOString()} className={`relative border-l border-gray-800 ${isToday ? 'bg-blue-950/10' : ''}`}>
              {HOURS.map((hour) => (
                <div key={hour} className="absolute w-full border-b border-gray-800/40" style={{ top: `${(hour - 6) * 64}px`, height: '64px' }} />
              ))}
              <div className="relative px-0.5">
                {dayEntries.map((entry) => {
                  const startH = new Date(entry.start).getHours() + new Date(entry.start).getMinutes() / 60
                  const endH = new Date(entry.end).getHours() + new Date(entry.end).getMinutes() / 60
                  const top = (startH - 6) * 64
                  const height = Math.max((endH - startH) * 64, 28)
                  return (
                    <EntryBlock key={entry.id} entry={entry} compact style={{ top: `${top}px`, height: `${height}px` }} onClick={() => onSelectEntry(entry)} />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ====================== MONTH VIEW ====================== */
function MonthView({ selectedDate, entries, onSelectEntry }: { selectedDate: Date; entries: ScheduleEntry[]; onSelectEntry: (e: ScheduleEntry) => void }) {
  const days = getMonthDays(selectedDate)
  const today = new Date()
  const currentMonth = selectedDate.getMonth()

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-800">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="p-2 text-center text-[10px] text-gray-500 uppercase font-semibold">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const isToday = isSameDay(day, today)
          const isCurrentMonth = day.getMonth() === currentMonth
          const dayEntries = entries.filter((e) => isSameDay(new Date(e.start), day))
          return (
            <div
              key={i}
              className={`min-h-[80px] border-b border-r border-gray-800/50 p-1 ${
                isCurrentMonth ? '' : 'bg-gray-950/50'
              } ${isToday ? 'bg-blue-950/20' : ''}`}
            >
              <div className={`text-xs font-medium mb-1 ${
                isToday ? 'text-blue-400' : isCurrentMonth ? 'text-gray-400' : 'text-gray-700'
              }`}>
                {day.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayEntries.slice(0, 3).map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => onSelectEntry(entry)}
                    className={`block w-full text-left px-1 py-0.5 rounded text-[10px] truncate border ${memberColor(entry.memberName)} hover:opacity-80 transition-opacity`}
                  >
                    {fmtTime(entry.start)} {entry.memberName}
                  </button>
                ))}
                {dayEntries.length > 3 && (
                  <div className="text-[10px] text-gray-500 pl-1">+{dayEntries.length - 3} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ====================== ENTRY BLOCK ====================== */
function EntryBlock({
  entry,
  compact,
  style,
  onClick,
}: {
  entry: ScheduleEntry
  compact?: boolean
  style: React.CSSProperties
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`absolute left-0 right-0 rounded border overflow-hidden cursor-pointer hover:opacity-80 transition-opacity text-left ${memberColor(entry.memberName)} ${compact ? 'mx-0.5' : ''}`}
      style={style}
    >
      <div className={`h-full ${compact ? 'p-1' : 'p-2'}`}>
        <div className={`font-medium truncate ${compact ? 'text-[10px]' : 'text-xs'}`}>
          {entry.memberName}
          {entry.ticketId ? ` · #${entry.ticketId}` : ''}
        </div>
        {!compact && (
          <>
            <div className="text-[10px] opacity-80 mt-0.5">{fmtTime(entry.start)} – {fmtTime(entry.end)}</div>
            {entry.ticketSummary && (
              <div className="text-[10px] opacity-70 truncate mt-0.5">{entry.ticketSummary}</div>
            )}
            {entry.companyName && (
              <div className="text-[10px] opacity-60 truncate">{entry.companyName}</div>
            )}
          </>
        )}
      </div>
    </button>
  )
}

/* ====================== ENTRY DETAIL PANEL ====================== */
function EntryDetailPanel({ entry, onClose }: { entry: ScheduleEntry | null; onClose: () => void }) {
  if (!entry) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      {/* Panel */}
      <div className="fixed bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 bg-gray-900 border border-gray-800 rounded-t-xl sm:rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-white">Schedule Entry</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded hover:bg-gray-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Member */}
          <div className="flex items-center gap-2">
            <User size={14} className="text-gray-500 shrink-0" />
            <span className="text-sm text-white">{entry.memberName}</span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-gray-500 shrink-0" />
            <span className="text-sm text-white">
              {fmtTime(entry.start)} – {fmtTime(entry.end)} ({duration(entry.start, entry.end)})
            </span>
          </div>

          {/* Date */}
          <div className="text-xs text-gray-400 ml-5">{fmtDate(entry.start)}</div>

          {/* Company */}
          {entry.companyName && (
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-gray-500 shrink-0" />
              <span className="text-sm text-white">{entry.companyName}</span>
            </div>
          )}

          {/* Type / Status */}
          <div className="flex items-center gap-2 flex-wrap">
            {entry.type && (
              <span className="px-2 py-0.5 rounded text-xs font-medium border bg-gray-500/10 text-gray-300 border-gray-500/30">
                {entry.type}
              </span>
            )}
            {entry.status && (
              <span className="px-2 py-0.5 rounded text-xs font-medium border bg-blue-500/10 text-blue-400 border-blue-500/30">
                {entry.status}
              </span>
            )}
          </div>

          {/* Ticket link */}
          {entry.ticketId && (
            <div className="pt-2 border-t border-gray-800">
              <div className="text-xs text-gray-500 mb-1">Linked Ticket</div>
              <Link
                href={`/tickets/${entry.ticketId}`}
                className="block p-3 bg-gray-800/50 border border-gray-700/50 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <span className="text-blue-400 text-sm font-medium">#{entry.ticketId}</span>
                {entry.ticketSummary && (
                  <p className="text-sm text-white mt-0.5">{entry.ticketSummary}</p>
                )}
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
