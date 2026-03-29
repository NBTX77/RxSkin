'use client'

export const dynamic = 'force-dynamic'

import { CBRClientDetail } from '@/components/cbr/CBRClientDetail'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { useParams } from 'next/navigation'

export default function CBRClientPage() {
  const params = useParams()
  const clientId = params.clientId as string
  return (
    <ErrorBoundary>
      <CBRClientDetail clientId={clientId} />
    </ErrorBoundary>
  )
}
