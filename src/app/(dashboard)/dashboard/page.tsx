import { auth } from '@/lib/auth/config'

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Good morning, {session?.user.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-400 text-sm mt-1">Here&apos;s what&apos;s happening today.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open Tickets" value="—" color="blue" />
        <StatCard label="My Tickets Today" value="—" color="purple" />
        <StatCard label="Scheduled Today" value="—" color="green" />
        <StatCard label="Overdue" value="—" color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlaceholderPanel title="My Open Tickets" />
        <PlaceholderPanel title="Today's Schedule" />
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: 'blue' | 'purple' | 'green' | 'red' }) {
  const colorMap = {
    blue: 'bg-blue-950 border-blue-800 text-blue-400',
    purple: 'bg-purple-950 border-purple-800 text-purple-400',
    green: 'bg-green-950 border-green-800 text-green-400',
    red: 'bg-red-950 border-red-800 text-red-400',
  }
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold text-white mt-2">{value}</p>
    </div>
  )
}

function PlaceholderPanel({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <h2 className="text-sm font-semibold text-gray-300 mb-4">{title}</h2>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-gray-800 animate-pulse" />
        ))}
      </div>
      <p className="text-xs text-gray-600 mt-4 text-center">Connect your CW credentials to load live data</p>
    </div>
  )
}
