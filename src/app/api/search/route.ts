// GET /api/search?q=term — Global unified search across tickets, companies, members, projects

import { auth } from '@/lib/auth/config'
import { getTenantCredentials } from '@/lib/auth/credentials'
import { apiErrors, handleApiError } from '@/lib/api/errors'
import type { CWCredentials } from '@/lib/cw/client'
import { escapeCwFilterValue } from '@/lib/cw/client'

export const dynamic = 'force-dynamic'

interface SearchResult {
  id: number
  type: 'ticket' | 'company' | 'member' | 'project'
  title: string
  subtitle: string
  href: string
}

interface GroupedResults {
  tickets: SearchResult[]
  companies: SearchResult[]
  members: SearchResult[]
  projects: SearchResult[]
}

function isCWConfigured(): boolean {
  return !!(process.env.CW_BASE_URL && process.env.CW_PUBLIC_KEY && process.env.CW_PRIVATE_KEY)
}

function buildAuthHeader(creds: CWCredentials): string {
  const raw = `${creds.companyId}+${creds.publicKey}:${creds.privateKey}`
  return `Basic ${Buffer.from(raw).toString('base64')}`
}

async function cwSearch<T>(creds: CWCredentials, path: string): Promise<T[]> {
  const url = `${creds.baseUrl}${path}`
  const res = await fetch(url, {
    headers: {
      'Authorization': buildAuthHeader(creds),
      'clientId': creds.clientId,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  })
  if (!res.ok) return []
  return res.json()
}

async function searchTickets(creds: CWCredentials, q: string): Promise<SearchResult[]> {
  const escaped = escapeCwFilterValue(q)
  const idNum = parseInt(q, 10)
  const idCondition = !isNaN(idNum) ? ` OR id=${idNum}` : ''
  const conditions = `summary contains "${escaped}"${idCondition}`
  const params = new URLSearchParams({
    conditions,
    pageSize: '5',
    orderBy: 'lastUpdated desc',
    fields: 'id,summary,company,status',
  })
  const raw = await cwSearch<Record<string, unknown>>(creds, `/service/tickets?${params}`)
  return raw.map((t) => ({
    id: Number(t.id),
    type: 'ticket' as const,
    title: String(t.summary ?? ''),
    subtitle: `#${t.id} · ${(t.company as Record<string, unknown>)?.name ?? 'Unknown'}`,
    href: `/tickets/${t.id}`,
  }))
}

async function searchCompanies(creds: CWCredentials, q: string): Promise<SearchResult[]> {
  const escaped = escapeCwFilterValue(q)
  const params = new URLSearchParams({
    conditions: `name contains "${escaped}"`,
    pageSize: '5',
    orderBy: 'name asc',
    fields: 'id,name,identifier,city,state',
  })
  const raw = await cwSearch<Record<string, unknown>>(creds, `/company/companies?${params}`)
  return raw.map((c) => ({
    id: Number(c.id),
    type: 'company' as const,
    title: String(c.name ?? ''),
    subtitle: [c.city, c.state].filter(Boolean).join(', ') || 'Company',
    href: `/companies`,
  }))
}

async function searchMembers(creds: CWCredentials, q: string): Promise<SearchResult[]> {
  const escaped = escapeCwFilterValue(q)
  const params = new URLSearchParams({
    conditions: `(firstName contains "${escaped}" OR lastName contains "${escaped}") AND inactiveFlag=false`,
    pageSize: '3',
    fields: 'id,firstName,lastName,title,identifier',
  })
  const raw = await cwSearch<Record<string, unknown>>(creds, `/system/members?${params}`)
  return raw.map((m) => ({
    id: Number(m.id),
    type: 'member' as const,
    title: `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim(),
    subtitle: String(m.title ?? 'Technician'),
    href: `/team`,
  }))
}

async function searchProjects(creds: CWCredentials, q: string): Promise<SearchResult[]> {
  const escaped = escapeCwFilterValue(q)
  const params = new URLSearchParams({
    conditions: `name contains "${escaped}"`,
    pageSize: '5',
    orderBy: 'id desc',
    fields: 'id,name,status,company',
  })
  const raw = await cwSearch<Record<string, unknown>>(creds, `/project/projects?${params}`)
  return raw.map((p) => ({
    id: Number(p.id),
    type: 'project' as const,
    title: String(p.name ?? ''),
    subtitle: (p.company as Record<string, unknown>)?.name
      ? String((p.company as Record<string, unknown>).name)
      : 'Project',
    href: `/projects`,
  }))
}

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return apiErrors.unauthorized()

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') ?? '').trim()

    if (q.length < 2) {
      return Response.json({ tickets: [], companies: [], members: [], projects: [] })
    }

    if (!isCWConfigured()) {
      return Response.json(
        { code: 'SERVICE_UNAVAILABLE', message: 'ConnectWise API not configured', retryable: false },
        { status: 503 }
      )
    }

    const { tenantId } = session.user
    const creds = await getTenantCredentials(tenantId)

    // Query all four entity types in parallel
    const [ticketsResult, companiesResult, membersResult, projectsResult] = await Promise.allSettled([
      searchTickets(creds, q),
      searchCompanies(creds, q),
      searchMembers(creds, q),
      searchProjects(creds, q),
    ])

    const results: GroupedResults = {
      tickets: ticketsResult.status === 'fulfilled' ? ticketsResult.value : [],
      companies: companiesResult.status === 'fulfilled' ? companiesResult.value : [],
      members: membersResult.status === 'fulfilled' ? membersResult.value : [],
      projects: projectsResult.status === 'fulfilled' ? projectsResult.value : [],
    }

    return Response.json(results)
  } catch (error) {
    return handleApiError(error)
  }
}
