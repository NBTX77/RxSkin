// GET /api/documents/:itemId — Get single file metadata including download URL

import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getItemMetadata } from '@/lib/graph/client'
import { normalizeDocumentItem } from '@/lib/graph/normalizers'
import { apiErrors, handleApiError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const { itemId } = await params
    if (!itemId) return apiErrors.badRequest('itemId is required')

    const raw = await getItemMetadata(itemId)
    const item = normalizeDocumentItem(raw)

    return Response.json({ item })
  } catch (error) {
    return handleApiError(error)
  }
}
