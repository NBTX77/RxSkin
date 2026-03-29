import { graphFetch } from './client';
import type { M365Event } from '@/types/m365';

// ============================================================
// Microsoft Graph — Calendar Domain Module
// All functions use delegated (per-user) OAuth tokens.
// ============================================================

const EVENT_SELECT = [
  'id',
  'subject',
  'start',
  'end',
  'location',
  'organizer',
  'attendees',
  'isOnlineMeeting',
  'onlineMeeting',
  'bodyPreview',
].join(',');

/**
 * List calendar events for the authenticated user.
 * Uses `/me/calendarView` when start/end dates are provided (recommended),
 * otherwise falls back to `/me/events`.
 */
export async function listEvents(
  token: string,
  options?: {
    startDateTime?: string;
    endDateTime?: string;
    top?: number;
    skipToken?: string;
  }
): Promise<{ events: M365Event[]; nextLink?: string }> {
  const params = new URLSearchParams();
  params.set('$select', EVENT_SELECT);
  params.set('$orderby', 'start/dateTime');
  params.set('$top', String(options?.top ?? 50));

  if (options?.skipToken) {
    params.set('$skipToken', options.skipToken);
  }

  let basePath: string;

  if (options?.startDateTime && options?.endDateTime) {
    basePath = '/me/calendarView';
    params.set('startDateTime', options.startDateTime);
    params.set('endDateTime', options.endDateTime);
  } else {
    basePath = '/me/events';
  }

  const data = await graphFetch(`${basePath}?${params.toString()}`, { token });

  return {
    events: (data.value as unknown as M365Event[]) ?? [],
    nextLink: (data['@odata.nextLink'] as string) || undefined,
  };
}

/**
 * Create a new calendar event.
 */
export async function createEvent(
  token: string,
  event: {
    subject: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    location?: { displayName: string };
    attendees?: {
      emailAddress: { address: string; name?: string };
      type?: 'required' | 'optional' | 'resource';
    }[];
    body?: { contentType: string; content: string };
    isOnlineMeeting?: boolean;
  }
): Promise<M365Event> {
  const data = await graphFetch('/me/events', {
    token,
    method: 'POST',
    body: JSON.stringify(event),
  });

  return data as unknown as M365Event;
}

/**
 * Update an existing calendar event (partial update).
 */
export async function updateEvent(
  token: string,
  eventId: string,
  updates: Partial<{
    subject: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    location: { displayName: string };
    attendees: {
      emailAddress: { address: string; name?: string };
      type?: 'required' | 'optional' | 'resource';
    }[];
    body: { contentType: string; content: string };
    isOnlineMeeting: boolean;
  }>
): Promise<void> {
  await graphFetch(`/me/events/${eventId}`, {
    token,
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

/**
 * Delete a calendar event.
 */
export async function deleteEvent(
  token: string,
  eventId: string
): Promise<void> {
  await graphFetch(`/me/events/${eventId}`, {
    token,
    method: 'DELETE',
  });
}
