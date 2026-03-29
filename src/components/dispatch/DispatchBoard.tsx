'use client'

// ============================================================
// DispatchBoard — RX Skin
// FullCalendar resource timeline: techs as rows, time horizontal.
// Supports drag-between-rows (reassign), external drops (schedule),
// and visual capacity indicators per tech.
// ============================================================

import { useCallback, useMemo, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventInput, EventDropArg, EventClickArg } from '@fullcalendar/core'
import type { ScheduleEntry, Member } from '@/types'
import { useScheduleEntries, useCreateScheduleEntry, useRescheduleEntry } from '@/hooks/useScheduleEntries'
import { useMembers, useUnscheduledTickets, useAssignScheduleEntry, calculateMemberHours } from '@/hooks/useDispatch'
import { UnscheduledSidebar } from './UnscheduledSidebar'
import { ScheduleEventDetail } from '@/components/schedule/ScheduleEventDetail'
import { ChevronLeft, ChevronRight, RefreshCw, Loader2 } from 'lucide-react'

type DispatchView = 'resourceTimelineDay' | 'resourceTimelineWeek'

const VIEW_LABELS: Record<DispatchView, string> = {
  resourceTimelineDay: 'Day',
  resourceTimelineWeek: 'Week',
}

function fcViewToApiView(fcView: string): 'day' | 'week' {
  return fcView === 'resourceTimelineWeek' ? 'week' : 'day'
}

function getEventColor(entry: ScheduleEntry): string {
  if (entry.status === 'Schedule Hold') return '#f59e0b'
  if (entry.type === 'Recurring') return '#8b5cf6'
  return '#3b82f6'
}

function getEntry(event: { extendedProps: Record<string, unknown> }): ScheduleEntry | null {
  const entry = event.extendedProps.entry
  if (entry && typeof entry === 'object' && 'id' in entry) return entry as ScheduleEntry
  return null
}

const DEFAULT_CAPACITY = 8

export function DispatchBoard() {
  const calendarRef = useRef<FullCalendar>(null)
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0])
  const [currentView, setCurrentView] = useState<DispatchView>('resourceTimelineDay')
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEntry | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Data hooks
  const { data: entries = [], isLoading: entriesLoading, refetch, isFetching } = useScheduleEntries({
    date: currentDate,
    view: fcViewToApiView(currentView),
  })

  const { data: members = [], isLoading: membersLoading } = useMembers()

  // Calculate which ticket IDs are already scheduled
  const scheduledTicketIds = useMemo(() => {
    const ids = new Set<number>()
    for (const e of entries) {
      if (e.ticketId) ids.add(e.ticketId)
    }
    return ids
  }, [entries])

  const { data: unscheduledTickets = [], isLoading: ticketsLoading } = useUnscheduledTickets(scheduledTicketIds)

  // Mutations
  const reschedule = useRescheduleEntry()
  const createEntry = useCreateScheduleEntry()
  const assignEntry = useAssignScheduleEntry()

  // Member hours for capacity indicators
  const memberHours = useMemo(
    () => calculateMemberHours(entries, currentDate),
    [entries, currentDate]
  )

  // Build FullCalendar resources from members
  const resources = useMemo(
    () =>
      members.map((m) => ({
        id: String(m.id),
        title: m.name,
        extendedProps: { member: m },
      })),
    [members]
  )

  // Build FullCalendar events
  const events: EventInput[] = useMemo(
    () =>
      entries.map((entry) => ({
        id: String(entry.id),
        resourceId: String(entry.memberId),
        title: entry.ticketSummary || `${entry.memberName} - ${entry.type}`,
        start: entry.start,
        end: entry.end,
        backgroundColor: getEventColor(entry),
        borderColor: getEventColor(entry),
        extendedProps: { entry },
      })),
    [entries]
  )

  // Drag between rows = reassign tech (+ optional time change)
  const handleEventDrop = useCallback(
    (info: EventDropArg) => {
      const entry = getEntry(info.event)
      const newStart = info.event.start?.toISOString()
      const newEnd = info.event.end?.toISOString()
      const newResourceId = info.event.getResources()[0]?.id

      if (!entry || !newStart || !newEnd) {
        info.revert()
        return
      }

      const newMemberId = newResourceId ? parseInt(newResourceId, 10) : undefined

      // If resource changed, use assignEntry; otherwise just reschedule time
      if (newMemberId && newMemberId !== entry.memberId) {
        assignEntry.mutate(
          { entryId: entry.id, memberId: newMemberId, start: newStart, end: newEnd },
          { onError: () => info.revert() }
        )
      } else {
        reschedule.mutate(
          { entryId: entry.id, start: newStart, end: newEnd },
          { onError: () => info.revert() }
        )
      }
    },
    [assignEntry, reschedule]
  )

  // Resize = change duration
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
        { onError: () => info.revert() }
      )
    },
    [reschedule]
  )

  // External drop from sidebar = create new schedule entry
  const handleEventReceive = useCallback(
    (info: { event: { extendedProps: Record<string, unknown>; getResources: () => { id: string }[]; start: Date | null; end: Date | null; remove: () => void }; revert: () => void }) => {
      const ticketId = info.event.extendedProps.ticketId as number
      const resourceId = info.event.getResources()[0]?.id
      const memberId = resourceId ? parseInt(resourceId, 10) : 0
      const start = info.event.start?.toISOString()
      const end = info.event.end?.toISOString()

      if (!ticketId || !memberId || !start || !end) {
        info.revert()
        return
      }

      // Remove the temporary FC event — the real one will appear after mutation success + refetch
      info.event.remove()

      createEntry.mutate(
        { ticketId, memberId, start, end },
        {
          onError: () => {
            // Nothing to revert since we already removed the temp event
          },
        }
      )
    },
    [createEntry]
  )

  const handleEventClick = useCallback((info: EventClickArg) => {
    const entry = getEntry(info.event)
    if (entry) setSelectedEvent(entry)
  }, [])

  // Nav handlers
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

  const handleViewChange = (view: DispatchView) => {
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

  const calendarTitle = calendarRef.current?.getApi()?.view.title ?? ''
  const isLoading = entriesLoading || membersLoading

  return (
    <div className="flex -m-4 lg:-m-6 h-[calc(100vh-3.5rem)] min-h-0">
      {/* Unscheduled tickets sidebar */}
      <UnscheduledSidebar
        tickets={unscheduledTickets}
        isLoading={ticketsLoading}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main timeline area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="rounded-md border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleToday}
              className="rounded-md border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="rounded-md border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <h2 className="ml-2 text-lg font-medium text-gray-900 dark:text-white">{calendarTitle}</h2>
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-1">
              {(Object.entries(VIEW_LABELS) as [DispatchView, string][]).map(([view, label]) => (
                <button
                  key={view}
                  onClick={() => handleViewChange(view)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    currentView === view
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="rounded-md border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div className="flex-1 overflow-auto">
          <div className="rx-calendar rx-dispatch-calendar h-full min-w-0 p-1 sm:p-2">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <FullCalendar
                ref={calendarRef}
                plugins={[resourceTimelinePlugin, interactionPlugin]}
                initialView={currentView}
                schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
                headerToolbar={false}
                resources={resources}
                events={events}
                editable={true}
                droppable={true}
                eventResourceEditable={true}
                weekends={false}
                nowIndicator={true}
                slotMinTime="06:00:00"
                slotMaxTime="20:00:00"
                slotDuration="00:30:00"
                snapDuration="00:15:00"
                height="100%"
                resourceAreaWidth="200px"
                resourceAreaHeaderContent="Technicians"
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
                eventReceive={handleEventReceive}
                eventClick={handleEventClick}
                resourceLabelContent={(arg) => {
                  const member = arg.resource.extendedProps.member as Member | undefined
                  if (!member) return { html: `<span>${arg.resource.title}</span>` }

                  const hours = memberHours.get(member.id) ?? 0
                  const capacity = DEFAULT_CAPACITY
                  const pct = Math.min((hours / capacity) * 100, 100)

                  const parts = member.name.trim().split(/\s+/)
                  const initials = parts.length > 1
                    ? (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
                    : (parts[0]?.charAt(0) ?? '?').toUpperCase()

                  let barColor = 'bg-green-500'
                  let textColor = 'text-green-400'
                  if (hours > capacity) { barColor = 'bg-red-500'; textColor = 'text-red-400' }
                  else if (hours >= capacity * 0.75) { barColor = 'bg-yellow-500'; textColor = 'text-yellow-400' }

                  return {
                    html: `
                      <div class="dispatch-resource-label flex items-center gap-2 px-2 py-1.5 min-w-0 w-full">
                        <div class="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
                          <span class="text-[10px] font-bold text-white">${initials}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="text-xs font-medium text-gray-900 dark:text-white truncate">${member.name}</p>
                          <div class="flex items-center gap-1.5 mt-0.5">
                            <div class="flex-1 h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                              <div class="h-full rounded-full ${barColor}" style="width:${pct}%"></div>
                            </div>
                            <span class="text-[10px] tabular-nums font-medium ${textColor} whitespace-nowrap">${hours.toFixed(1)}/${capacity}h</span>
                          </div>
                        </div>
                      </div>
                    `
                  }
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
            )}
          </div>
        </div>
      </div>

      {/* Event detail overlay */}
      {selectedEvent && (
        <ScheduleEventDetail
          entry={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  )
}
