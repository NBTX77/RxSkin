'use client'

// ============================================================
// ScheduleCalendar — RX Skin
// FullCalendar wrapper with Day/Week/2-Week/Month views,
// drag-and-drop rescheduling, department + member filtering,
// and mobile-responsive layout.
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import type { EventInput, EventDropArg, DateSelectArg, EventClickArg } from '@fullcalendar/core'
import type { ScheduleEntry, Member } from '@/types'
import { useScheduleEntries, useRescheduleEntry, useCreateScheduleEntry } from '@/hooks/useScheduleEntries'
import { useDepartment } from '@/components/department/DepartmentProvider'
import { ScheduleEventDetail } from './ScheduleEventDetail'
import { ChevronLeft, ChevronRight, RefreshCw, Loader2, X, Filter, ChevronDown } from 'lucide-react'

type ViewMode = 'timeGridDay' | 'timeGridWeek' | 'dayGridTwoWeek' | 'dayGridMonth' | 'listWeek'

const VIEW_LABELS: Record<ViewMode, string> = {
  timeGridDay: 'Day',
  timeGridWeek: 'Week',
  dayGridTwoWeek: '2 Week',
  dayGridMonth: 'Month',
  listWeek: 'List',
}

const DEPT_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Depts' },
  { value: 'IT', label: 'IT' },
  { value: 'SI', label: 'SI' },
  { value: 'AM', label: 'AM' },
  { value: 'GA', label: 'G&A' },
  { value: 'LT', label: 'Leadership' },
]

// Map FullCalendar view names to our API view param
function fcViewToApiView(fcView: string): 'day' | 'week' | 'twoWeek' | 'month' {
  switch (fcView) {
    case 'timeGridDay':
      return 'day'
    case 'timeGridWeek':
    case 'listWeek':
      return 'week'
    case 'dayGridTwoWeek':
      return 'twoWeek'
    case 'dayGridMonth':
      return 'month'
    default:
      return 'week'
  }
}

// Priority-based event colors
function getEventColor(entry: ScheduleEntry): string {
  if (entry.status === 'Schedule Hold') return '#f59e0b' // amber
  if (entry.type === 'Recurring') return '#8b5cf6' // purple
  return '#3b82f6' // blue default
}

/** Extract ScheduleEntry from FullCalendar event's extendedProps (set in events memo). */
function getEntry(event: { extendedProps: Record<string, unknown> }): ScheduleEntry | null {
  const entry = event.extendedProps.entry
  if (entry && typeof entry === 'object' && 'id' in entry) return entry as ScheduleEntry
  return null
}

export function ScheduleCalendar() {
  const calendarRef = useRef<FullCalendar>(null)
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0])
  const [currentView, setCurrentView] = useState<ViewMode>('timeGridWeek')
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEntry | null>(null)
  const [createForm, setCreateForm] = useState<{ start: string; end: string } | null>(null)
  const [createTicketId, setCreateTicketId] = useState('')
  const [createMemberId, setCreateMemberId] = useState('')
  const [createSubmitting, setCreateSubmitting] = useState(false)

  // Department context
  const { department: userDept, isLeadership } = useDepartment()

  // Department filter — defaults to user's dept (LT defaults to 'all')
  const [deptFilter, setDeptFilter] = useState<string>(isLeadership ? 'all' : userDept)

  // Member filter state
  const [selectedMembers, setSelectedMembers] = useState<number[]>([])
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Reset member selection when department changes
  useEffect(() => {
    setSelectedMembers([])
  }, [deptFilter])

  // Fetch members list for member filter
  const { data: allMembers = [] } = useQuery<Member[]>({
    queryKey: ['members'],
    queryFn: async () => {
      const res = await fetch('/api/members')
      if (!res.ok) throw new Error('Failed to fetch members')
      return res.json()
    },
    staleTime: 10 * 60 * 1000, // 10 min
  })

  // Filter members by selected department
  const filteredMembers = useMemo(() => {
    if (deptFilter === 'all') return allMembers
    return allMembers.filter(m => m.department === deptFilter)
  }, [allMembers, deptFilter])

  // Fetch schedule entries with department filter
  const { data: entries = [], isLoading, refetch, isFetching } = useScheduleEntries({
    date: currentDate,
    view: fcViewToApiView(currentView),
    department: deptFilter === 'all' ? undefined : deptFilter,
  })

  // Mutations
  const reschedule = useRescheduleEntry()
  const createEntry = useCreateScheduleEntry()

  // Apply client-side member filter
  const filteredEntries = useMemo(() => {
    if (selectedMembers.length === 0) return entries
    return entries.filter(entry => selectedMembers.includes(entry.memberId))
  }, [entries, selectedMembers])

  // Convert ScheduleEntry[] → FullCalendar EventInput[]
  const events: EventInput[] = useMemo(
    () =>
      filteredEntries.map((entry) => ({
        id: String(entry.id),
        title: entry.ticketSummary || `${entry.memberName} — ${entry.type}`,
        start: entry.start,
        end: entry.end,
        backgroundColor: getEventColor(entry),
        borderColor: getEventColor(entry),
        extendedProps: { entry },
      })),
    [filteredEntries]
  )

  // Handle drag-and-drop rescheduling
  const handleEventDrop = useCallback(
    (info: EventDropArg) => {
      const entry = getEntry(info.event)
      const newStart = info.event.start?.toISOString()
      const newEnd = info.event.end?.toISOString()

      if (!entry || !newStart || !newEnd) {
        info.revert()
        return
      }

      reschedule.mutate(
        { entryId: entry.id, start: newStart, end: newEnd },
        {
          onError: () => {
            info.revert() // Revert on failure
          },
        }
      )
    },
    [reschedule]
  )

  // Handle event resize (extend/shorten duration)
  const handleEventResize = useCallback(
    (info: { event: EventDropArg['event']; revert: () => void }) => {
      const entry = getEntry(info.event)
      const newStart = info.event.start?.toISOString()
      const newEnd = info.event.end?.toISOString()

      if (!entry || !newStart || !newEnd) {
        info.revert()
        return
      }

      reschedule.mutate(
        { entryId: entry.id, start: newStart, end: newEnd },
        {
          onError: () => {
            info.revert()
          },
        }
      )
    },
    [reschedule]
  )

  // Handle clicking an event to view details
  const handleEventClick = useCallback((info: EventClickArg) => {
    const entry = getEntry(info.event)
    if (entry) setSelectedEvent(entry)
  }, [])

  // Handle date selection — open create entry form
  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    setCreateForm({ start: selectInfo.startStr, end: selectInfo.endStr })
    setCreateTicketId('')
    setCreateMemberId('')
  }, [])

  // Navigation handlers
  const handlePrev = () => {
    calendarRef.current?.getApi().prev()
    syncDate()
  }

  const handleNext = () => {
    calendarRef.current?.getApi().next()
    syncDate()
  }

  const handleToday = () => {
    calendarRef.current?.getApi().today()
    syncDate()
  }

  const handleViewChange = (view: ViewMode) => {
    setCurrentView(view)
    calendarRef.current?.getApi().changeView(view)
    syncDate()
  }

  const syncDate = () => {
    setTimeout(() => {
      const api = calendarRef.current?.getApi()
      if (api) {
        const d = api.getDate()
        setCurrentDate(d.toISOString().split('T')[0])
      }
    }, 0)
  }

  const toggleMember = (memberId: number) => {
    setSelectedMembers(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    )
  }

  // Format the title based on current calendar view
  const calendarTitle = calendarRef.current?.getApi()?.view.title ?? ''

  return (
    <div className="space-y-2" data-feedback-component="Schedule">
      {/* Unified toolbar — single row on desktop, wraps on mobile */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Left group: nav + date title */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            className="rounded-md border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleToday}
            className="rounded-md border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Today
          </button>
          <button
            onClick={handleNext}
            className="rounded-md border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <h2 className="ml-1 text-sm font-medium text-gray-900 dark:text-white sm:text-base whitespace-nowrap">
            {calendarTitle}
          </h2>
        </div>

        {/* Spacer — pushes right group on desktop */}
        <div className="hidden sm:flex flex-1" />

        {/* Department filter */}
        <div className="relative">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="appearance-none rounded-md border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 pl-2 pr-7 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {DEPT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
        </div>

        {/* Member filter — desktop: inline multi-select chips, mobile: behind Filter button */}
        <div className="hidden sm:block relative">
          <MemberFilterDropdown
            members={filteredMembers}
            selectedMembers={selectedMembers}
            onToggle={toggleMember}
            onClear={() => setSelectedMembers([])}
          />
        </div>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="sm:hidden rounded-md border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
        >
          <Filter className="h-3 w-3" />
          Filter
          {selectedMembers.length > 0 && (
            <span className="bg-blue-500 text-white text-[10px] rounded-full px-1 min-w-[16px] text-center">
              {selectedMembers.length}
            </span>
          )}
        </button>

        {/* View switcher */}
        <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-0.5">
          {(Object.entries(VIEW_LABELS) as [ViewMode, string][]).map(([view, label]) => (
            <button
              key={view}
              onClick={() => handleViewChange(view)}
              className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                currentView === view
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-md border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          title="Refresh schedule"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Mobile filters panel — collapsible */}
      {showMobileFilters && (
        <div className="sm:hidden rounded-lg border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Filter by member ({filteredMembers.length})
            </span>
            {selectedMembers.length > 0 && (
              <button
                onClick={() => setSelectedMembers([])}
                className="text-xs text-blue-500 hover:text-blue-400"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {filteredMembers.map(member => (
              <button
                key={member.id}
                onClick={() => toggleMember(member.id)}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  selectedMembers.includes(member.id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {member.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected member chips — show inline on desktop when members are selected */}
      {selectedMembers.length > 0 && (
        <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-500">Showing:</span>
          {selectedMembers.map(id => {
            const member = allMembers.find(m => m.id === id)
            return member ? (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 text-xs font-medium"
              >
                {member.name}
                <button
                  onClick={() => toggleMember(id)}
                  className="hover:text-blue-800 dark:hover:text-blue-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ) : null
          })}
          <button
            onClick={() => setSelectedMembers([])}
            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Clear
          </button>
        </div>
      )}

      {/* Calendar */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-2 sm:p-4 overflow-x-auto min-w-0">
        {isLoading ? (
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="rx-calendar">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView={currentView}
              headerToolbar={false} // We use our own toolbar
              events={events}
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={false}
              nowIndicator={true}
              slotMinTime="06:00:00"
              slotMaxTime="20:00:00"
              slotDuration="00:30:00"
              expandRows={true}
              height="auto"
              contentHeight={600}
              allDaySlot={false}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              eventClick={handleEventClick}
              select={handleDateSelect}
              views={{
                dayGridTwoWeek: {
                  type: 'dayGrid',
                  duration: { weeks: 2 },
                  buttonText: '2 Week',
                },
              }}
              eventContent={(arg) => (
                <div className="flex flex-col overflow-hidden px-1 py-0.5">
                  <span className="truncate text-xs font-medium">
                    {arg.event.title}
                  </span>
                  {arg.event.extendedProps.entry?.companyName && (
                    <span className="truncate text-[10px] opacity-75">
                      {arg.event.extendedProps.entry.companyName}
                    </span>
                  )}
                </div>
              )}
              datesSet={(dateInfo) => {
                const midDate = new Date(
                  (dateInfo.start.getTime() + dateInfo.end.getTime()) / 2
                )
                setCurrentDate(midDate.toISOString().split('T')[0])
              }}
            />
          </div>
        )}
      </div>

      {/* Event detail overlay */}
      {selectedEvent && (
        <ScheduleEventDetail
          entry={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {/* Create entry dialog */}
      {createForm && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={() => setCreateForm(null)} />
          <div role="dialog" aria-modal="true" aria-label="Create schedule entry" className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-sm z-50">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">New Schedule Entry</h3>
                <button onClick={() => setCreateForm(null)} aria-label="Close" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                  <X size={16} />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div className="text-xs text-gray-500">
                  {new Date(createForm.start).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  {' — '}
                  {new Date(createForm.end).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Ticket ID</label>
                  <input
                    type="number"
                    value={createTicketId}
                    onChange={(e) => setCreateTicketId(e.target.value)}
                    placeholder="e.g. 12345"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Member ID</label>
                  <input
                    type="number"
                    value={createMemberId}
                    onChange={(e) => setCreateMemberId(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  disabled={!createTicketId || !createMemberId || createSubmitting}
                  onClick={async () => {
                    setCreateSubmitting(true)
                    createEntry.mutate(
                      {
                        ticketId: parseInt(createTicketId, 10),
                        memberId: parseInt(createMemberId, 10),
                        start: createForm.start,
                        end: createForm.end,
                      },
                      {
                        onSuccess: () => {
                          setCreateForm(null)
                          setCreateSubmitting(false)
                        },
                        onError: () => {
                          setCreateSubmitting(false)
                        },
                      }
                    )
                  }}
                  className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 transition-colors"
                >
                  {createSubmitting ? 'Creating...' : 'Create Entry'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Member Filter Dropdown (Desktop) ─────────────────────────

interface MemberFilterDropdownProps {
  members: Member[]
  selectedMembers: number[]
  onToggle: (id: number) => void
  onClear: () => void
}

function MemberFilterDropdown({ members, selectedMembers, onToggle, onClear }: MemberFilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const filtered = useMemo(() => {
    if (!search) return members
    const q = search.toLowerCase()
    return members.filter(m => m.name.toLowerCase().includes(q))
  }, [members, search])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-md border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
      >
        <Filter className="h-3 w-3" />
        Members
        {selectedMembers.length > 0 && (
          <span className="bg-blue-500 text-white text-[10px] rounded-full px-1 min-w-[16px] text-center">
            {selectedMembers.length}
          </span>
        )}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 rounded-lg border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 shadow-xl z-50">
          {/* Search */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-800">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search members..."
              className="w-full px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700/50 text-gray-900 dark:text-white text-xs placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 dark:border-gray-800">
            <span className="text-[10px] text-gray-500">{filtered.length} members</span>
            {selectedMembers.length > 0 && (
              <button onClick={onClear} className="text-[10px] text-blue-500 hover:text-blue-400">
                Clear all
              </button>
            )}
          </div>
          {/* Member list */}
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.map(member => (
              <button
                key={member.id}
                onClick={() => onToggle(member.id)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
                  selectedMembers.includes(member.id)
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
                  selectedMembers.includes(member.id)
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {selectedMembers.includes(member.id) && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="truncate">{member.name}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-gray-500">No members found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
