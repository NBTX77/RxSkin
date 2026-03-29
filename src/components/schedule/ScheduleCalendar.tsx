'use client'

// ============================================================
// ScheduleCalendar — RX Skin
// FullCalendar wrapper with Day/Week/2-Week/Month views,
// drag-and-drop rescheduling, and mobile-responsive layout.
// ============================================================

import { useCallback, useMemo, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import type { EventInput, EventDropArg, DateSelectArg, EventClickArg } from '@fullcalendar/core'
import type { ScheduleEntry } from '@/types'
import { useScheduleEntries, useRescheduleEntry, useCreateScheduleEntry } from '@/hooks/useScheduleEntries'
import { ScheduleEventDetail } from './ScheduleEventDetail'
import { Calendar, ChevronLeft, ChevronRight, RefreshCw, Loader2, X } from 'lucide-react'

type ViewMode = 'timeGridDay' | 'timeGridWeek' | 'dayGridTwoWeek' | 'dayGridMonth' | 'listWeek'

const VIEW_LABELS: Record<ViewMode, string> = {
  timeGridDay: 'Day',
  timeGridWeek: 'Week',
  dayGridTwoWeek: '2 Week',
  dayGridMonth: 'Month',
  listWeek: 'List',
}

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

  // Fetch schedule entries
  const { data: entries = [], isLoading, refetch, isFetching } = useScheduleEntries({
    date: currentDate,
    view: fcViewToApiView(currentView),
  })

  // Mutations
  const reschedule = useRescheduleEntry()
  const createEntry = useCreateScheduleEntry()

  // Convert ScheduleEntry[] → FullCalendar EventInput[]
  const events: EventInput[] = useMemo(
    () =>
      entries.map((entry) => ({
        id: String(entry.id),
        title: entry.ticketSummary || `${entry.memberName} — ${entry.type}`,
        start: entry.start,
        end: entry.end,
        backgroundColor: getEventColor(entry),
        borderColor: getEventColor(entry),
        extendedProps: { entry },
      })),
    [entries]
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

  // Format the title based on current calendar view
  const calendarTitle = calendarRef.current?.getApi()?.view.title ?? ''

  return (
    <div className="space-y-4">
      {/* Header toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-blue-400" />
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Schedule</h1>
          {isFetching && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
          )}
        </div>

        {/* View switcher */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-700 bg-white dark:bg-gray-900 p-1">
          {(Object.entries(VIEW_LABELS) as [ViewMode, string][]).map(([view, label]) => (
            <button
              key={view}
              onClick={() => handleViewChange(view)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                currentView === view
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:bg-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Nav row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="rounded-md border border-gray-700 bg-white dark:bg-gray-900 p-2 text-gray-400 hover:text-gray-900 dark:text-white hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleToday}
            className="rounded-md border border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:bg-gray-800 transition-colors"
          >
            Today
          </button>
          <button
            onClick={handleNext}
            className="rounded-md border border-gray-700 bg-white dark:bg-gray-900 p-2 text-gray-400 hover:text-gray-900 dark:text-white hover:bg-gray-800 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <h2 className="ml-2 text-lg font-medium text-gray-900 dark:text-white">{calendarTitle}</h2>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-md border border-gray-700 bg-white dark:bg-gray-900 p-2 text-gray-400 hover:text-gray-900 dark:text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
          title="Refresh schedule"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Calendar */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-900 p-2 sm:p-4">
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
            <div className="bg-white dark:bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
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
                    className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Member ID</label>
                  <input
                    type="number"
                    value={createMemberId}
                    onChange={(e) => setCreateMemberId(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 transition-colors"
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
