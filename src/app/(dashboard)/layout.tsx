import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { GlobalSearch } from '@/components/layout/GlobalSearch'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-950">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <main className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        {/* Page content with padding for mobile nav */}
        <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="h-full w-full">{children}</div>
        </div>
      </main>

      {/* Mobile nav */}
      <MobileNav />

      {/* Global search */}
      <GlobalSearch />
    </div>
  )
}
