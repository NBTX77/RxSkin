// GET /api/documents/breadcrumb?itemId=xxx — Resolve folder ancestry

import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getItemPath } from '@/lib/graph/client'
import { buildBreadcrumb } from '@/lib/graph/normalizers'
import { apiErrors, handleApiError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    if (!itemId) return apiErrors.badRequest('itemId is required')

    const segments: Array<{ id: string; name: string }> = []
    let currentId: string | undefined = itemId

    while (currentId) {
      try {
        const item = await getItemPath(currentId)
        const name = item.name as string
        const parentRef = item.parentReference as Record<string, unknown> | undefined
        if (!parentRef?.id || (parentRef?.path as string)?.endsWith('root:') || !name) break
        segments.unshift({ id: currentId, name })
        currentId = parentRef.id as string
      } catch {
        break
      }
    }

    const breadcrumb = buildBreadcrumb(segments)

    return Response.json({ breadcrumb })
  } catch (error) {
    return handleApiError(error)
  }
}
