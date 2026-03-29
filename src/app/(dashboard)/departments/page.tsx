import { DepartmentsDashboard } from '@/components/departments/DepartmentsDashboard'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export const metadata = { title: 'Departments — RX Skin' }

export default function DepartmentsPage() {
  return (
    <ErrorBoundary section="Departments">
      <DepartmentsDashboard />
    </ErrorBoundary>
  )
}
