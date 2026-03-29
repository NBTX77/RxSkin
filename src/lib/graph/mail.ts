import { graphFetch } from './client';
import type { M365Message } from '@/types/m365';

// ============================================================
// Microsoft Graph — Mail Domain Module
// All functions use delegated (per-user) OAuth tokens.
// ============================================================

const MESSAGE_SELECT = [
  'id',
  'subject',
  'bodyPreview',
  'from',
  'toRecipients',
  'ccRecipients',
  'receivedDateTime',
  'isRead',
  'hasAttachments',
  'importance',
].join(',');

const MESSAGE_SELECT_WITH_BODY = `${MESSAGE_SELECT},body`;

/**
 * List inbox messages for the authenticated user.
 */
export async function listInboxMessages(
  token: string,
  options?: { top?: number; filter?: string; skipToken?: string }
): Promise<{ messages: M365Message[]; nextLink?: string }> {
  const params = new URLSearchParams();
  params.set('$select', MESSAGE_SELECT);
  params.set('$orderby', 'receivedDateTime desc');
  params.set('$top', String(options?.top ?? 25));

  if (options?.filter) {
    params.set('$filter', options.filter);
  }
  if (options?.skipToken) {
    params.set('$skipToken', options.skipToken);
  }

  const data = await graphFetch(
    `/me/mailFolders/inbox/messages?${params.toString()}`,
    { token }
  );

  return {
    messages: (data.value as unknown as M365Message[]) ?? [],
    nextLink: (data['@odata.nextLink'] as string) || undefined,
  };
}

/**
 * Get a single message by ID, including the full body.
 */
export async function getMessage(
  token: string,
  messageId: string
): Promise<M365Message> {
  const params = new URLSearchParams();
  params.set('$select', MESSAGE_SELECT_WITH_BODY);

  const data = await graphFetch(
    `/me/messages/${messageId}?${params.toString()}`,
    { token }
  );

  return data as unknown as M365Message;
}

/**
 * Send a new email on behalf of the authenticated user.
 */
export async function sendMail(
  token: string,
  payload: {
    subject: string;
    body: { contentType: string; content: string };
    toRecipients: { emailAddress: { address: string; name?: string } }[];
    ccRecipients?: { emailAddress: { address: string; name?: string } }[];
    saveToSentItems?: boolean;
  }
): Promise<void> {
  await graphFetch('/me/sendMail', {
    token,
    method: 'POST',
    body: JSON.stringify({
      message: {
        subject: payload.subject,
        body: payload.body,
        toRecipients: payload.toRecipients,
        ccRecipients: payload.ccRecipients,
      },
      saveToSentItems: payload.saveToSentItems ?? true,
    }),
  });
}

/**
 * Reply to an existing message with a comment.
 */
export async function replyToMessage(
  token: string,
  messageId: string,
  comment: string
): Promise<void> {
  await graphFetch(`/me/messages/${messageId}/reply`, {
    token,
    method: 'POST',
    body: JSON.stringify({ comment }),
  });
}

/**
 * Permanently delete a message.
 */
export async function deleteMessage(
  token: string,
  messageId: string
): Promise<void> {
  await graphFetch(`/me/messages/${messageId}`, {
    token,
    method: 'DELETE',
  });
}

/**
 * Mark a message as read or unread.
 */
export async function markAsRead(
  token: string,
  messageId: string,
  isRead: boolean
): Promise<void> {
  await graphFetch(`/me/messages/${messageId}`, {
    token,
    method: 'PATCH',
    body: JSON.stringify({ isRead }),
  });
}
