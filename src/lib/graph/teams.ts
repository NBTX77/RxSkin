import { graphFetch } from './client'
import type { M365Chat, M365ChatMessage, M365Presence } from '@/types/m365'

export async function listChats(token: string, options?: { top?: number }): Promise<{ chats: M365Chat[]; nextLink?: string }> {
  const top = options?.top ?? 50
  const path = `/me/chats?$expand=lastMessagePreview&$top=${top}`
  const data = await graphFetch(path, { token })
  return {
    chats: (data.value as unknown as M365Chat[]) || [],
    nextLink: (data['@odata.nextLink'] as string) || undefined,
  }
}

export async function getChatMessages(token: string, chatId: string, options?: { top?: number }): Promise<{ messages: M365ChatMessage[]; nextLink?: string }> {
  const top = options?.top ?? 50
  const path = `/me/chats/${chatId}/messages?$top=${top}`
  const data = await graphFetch(path, { token })
  return {
    messages: (data.value as unknown as M365ChatMessage[]) || [],
    nextLink: (data['@odata.nextLink'] as string) || undefined,
  }
}

export async function sendChatMessage(token: string, chatId: string, content: string): Promise<M365ChatMessage> {
  const path = `/me/chats/${chatId}/messages`
  const data = await graphFetch(path, {
    token,
    method: 'POST',
    body: JSON.stringify({ body: { contentType: 'text', content } }),
  })
  return data as unknown as M365ChatMessage
}

export async function batchPresence(token: string, userIds: string[]): Promise<M365Presence[]> {
  const path = '/communications/getPresencesByUserId'
  const data = await graphFetch(path, {
    token,
    method: 'POST',
    body: JSON.stringify({ ids: userIds }),
  })
  return (data.value as unknown as M365Presence[]) || []
}
