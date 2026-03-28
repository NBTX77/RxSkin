import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth/config'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import { getCWCredentials } from '@/lib/cw/credentials'
import { getCompanies } from '@/lib/cw/client'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')

    const creds = getCWCredentials()
    if (creds) {
      const companies = await getCompanies(creds, search?.trim() || undefined)
      return Response.json(companies)
    } else {
      // No CW credentials — return empty array
      return Response.json([])
    }
  } catch (error) {
    return handleApiError(error)
  }
}
