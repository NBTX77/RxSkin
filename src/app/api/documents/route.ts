// GET /api/documents — List folder contents or search documents

import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth/config'
import { listFolderContents, searchDocuments, getItemPath } from '@/lib/graph/client'
import { normalizeDocumentItem, buildBreadcrumb } from '@/lib/graph/normalizers'
import type { BreadcrumbSegment } from '@/types/documents'
import { apiErrors, handleApiError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId') || undefined
    const search = searchParams.get('search') || undefined
    const top = parseInt(searchParams.get('top') || '50', 10)
    const skipToken = searchParams.get('skipToken') || undefined

    if (search) {
      // Search mode
      const rawItems = await searchDocuments(search, { top })
      const items = rawItems.map(normalizeDocumentItem)
      // Sort: folders first, then files, alphabetical
      items.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
        return a.name.localeCompare(b.name)
      })
      return Response.json({
        items,
        breadcrumb: [{ id: null, name: 'Search Results' }],
        hasMore: false,
      })
    }

    // Folder browsing mode
    const result = await listFolderContents(folderId, { top, skipToken })
    const items = result.items.map(normalizeDocumentItem)

    // Sort: folders first, then files
    items.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
      return a.name.localeCompare(b.name)
    })

    // Build breadcrumb
    let breadcrumb: BreadcrumbSegment[] = [{ id: null, name: 'Documents' }]
    if (folderId) {
      // Walk up parent chain to build breadcrumb
      const segments: Array<{ id: string; name: string }> = []
      let currentId: string | undefined = folderId
      while (currentId) {
        try {
          const item = await getItemPath(currentId)
          const name = item.name as string
          const parentRef = item.parentReference as Record<string, unknown> | undefined
          // Stop if we hit the drive root
          if (!parentRef?.id || (parentRef?.path as string)?.endsWith('root:') || !name) break
          segments.unshift({ id: currentId, name })
          currentId = parentRef.id as string
        } catch {
          break
        }
      }
      breadcrumb = buildBreadcrumb(segments)
    }

    // Extract skipToken from nextLink if present
    let nextToken: string | undefined
    if (result.nextLink) {
      const nextUrl = new URL(result.nextLink)
      nextToken = nextUrl.searchParams.get('$skipToken') || undefined
    }

    return Response.json({
      items,
      breadcrumb,
      hasMore: !!result.nextLink,
      nextToken,
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('not configured')) {
      return Response.json({
        items: [],
        breadcrumb: [{ id: null, name: 'Documents' }],
        hasMore: false,
        warning: 'Azure AD credentials are not configured. Add AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, AZURE_AD_TENANT_ID to environment variables.',
      })
    }
    return handleApiError(error)
  }
}
