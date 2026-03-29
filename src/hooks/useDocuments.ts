'use client'

import { useQuery } from '@tanstack/react-query'
import type { DocumentListResponse, DocumentItem } from '@/types/documents'

export function useDocumentList(folderId?: string, search?: string) {
  return useQuery<DocumentListResponse>({
    queryKey: ['documents', folderId || 'root', search || ''],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (folderId) params.set('folderId', folderId)
      if (search) params.set('search', search)
      const res = await fetch(`/api/documents?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load documents')
      return res.json()
    },
    staleTime: 2 * 60 * 1000,
    retry: 2,
  })
}

export function useDocumentDetail(itemId: string | null) {
  return useQuery<{ item: DocumentItem }>({
    queryKey: ['document', itemId],
    queryFn: async () => {
      const res = await fetch(`/api/documents/${itemId}`)
      if (!res.ok) throw new Error('Failed to load document')
      return res.json()
    },
    enabled: !!itemId,
    staleTime: 5 * 60 * 1000,
  })
}
