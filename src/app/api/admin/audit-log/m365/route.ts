export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const actions = await prisma.m365AuditAction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return NextResponse.json({ actions })
  } catch (error) {
    console.error('Failed to fetch M365 audit actions:', error)
    return NextResponse.json({ actions: [] })
  }
}
