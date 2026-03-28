import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return <DashboardShell>{children}</DashboardShell>
}
