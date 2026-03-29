import { useState } from "react"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts"
import {
  Bell,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Menu,
  Settings,
  MoreVertical,
  Grid3X3,
  DollarSign,
  Users,
  Zap,
  Target,
  FileText,
} from "lucide-react"

export default function LTDashboard() {
  const [hoveredProject, setHoveredProject] = useState(null)
  const [selectedDept, setSelectedDept] = useState(null)

  // KPI Data
  const kpis = [
    { label: "Open Tickets", value: 173, color: "bg-blue-500", icon: Zap },
    { label: "Active Projects", value: 53, color: "bg-cyan-500", icon: Target },
    { label: "Monthly Revenue", value: "$148K", color: "bg-emerald-500", icon: DollarSign },
    { label: "Utilization Rate", value: "76%", color: "bg-yellow-500", icon: Users },
    { label: "Projects Over Budget", value: 4, color: "bg-red-500", icon: AlertCircle },
    { label: "SLA Compliance", value: "94%", color: "bg-emerald-500", icon: CheckCircle2 },
  ]

  // Department Performance Data
  const departments = [
    {
      id: "it",
      name: "IT Services",
      color: "from-blue-600 to-blue-700",
      accent: "bg-blue-500",
      tickets: 141,
      projects: 16,
      members: 80,
      trend: "up",
      trendValue: "+12%",
    },
    {
      id: "si",
      name: "Systems Integration",
      color: "from-cyan-600 to-cyan-700",
      accent: "bg-cyan-500",
      tickets: 23,
      projects: 23,
      members: 38,
      trend: "neutral",
      trendValue: "+2%",
    },
    {
      id: "am",
      name: "Account Management",
      color: "from-emerald-600 to-emerald-700",
      accent: "bg-emerald-500",
      opportunities: 4,
      agreements: 160,
      members: 17,
      trend: "up",
      trendValue: "+8%",
    },
    {
      id: "ga",
      name: "G&A",
      color: "from-orange-600 to-orange-700",
      accent: "bg-orange-500",
      procurementTickets: 5,
      projects: 14,
      openInvoices: "$287K",
      members: 8,
      trend: "down",
      trendValue: "+18% over",
    },
  ]

  // Project Health Matrix Data
  const projectMatrix = {
    it: [
      { id: "p001", name: "Cloud Migration", status: "on-track" },
      { id: "p002", name: "Security Audit", status: "on-track" },
      { id: "p003", name: "Network Upgrade", status: "watch" },
      { id: "p004", name: "Backup System", status: "on-track" },
      { id: "p005", name: "Disaster Recovery", status: "watch" },
      { id: "p006", name: "Email Migration", status: "on-track" },
    ],
    si: [
      { id: "p007", name: "ERP Implementation", status: "on-track" },
      { id: "p008", name: "CRM Customization", status: "on-track" },
      { id: "p009", name: "API Integration", status: "on-track" },
      { id: "p010", name: "Database Upgrade", status: "watch" },
      { id: "p011", name: "Mobile App Dev", status: "over-budget" },
      { id: "p012", name: "Data Migration", status: "over-budget" },
    ],
    ga: [
      { id: "p013", name: "Vendor Mgmt", status: "over-budget" },
      { id: "p014", name: "Compliance", status: "over-budget" },
      { id: "p015", name: "Procurement", status: "watch" },
    ],
  }

  // Utilization Data
  const utilizationData = [
    { name: "IT", utilization: 76 },
    { name: "SI", utilization: 73 },
    { name: "AM", utilization: 68 },
    { name: "G&A", utilization: 127 },
  ]

  // Recent Highlights
  const highlights = [
    {
      id: 1,
      type: "success",
      icon: CheckCircle2,
      title: "Project #788 completed",
      subtitle: "City of Helotes infrastructure upgrade",
      color: "text-emerald-400",
    },
    {
      id: 2,
      type: "alert",
      icon: AlertCircle,
      title: "G&A projects 127% over budget",
      subtitle: "Requires immediate review and reallocation",
      color: "text-red-400",
    },
    {
      id: 3,
      type: "warning",
      icon: Clock,
      title: "6 incomplete handoffs pending",
      subtitle: "Follow-up required from project managers",
      color: "text-yellow-400",
    },
    {
      id: 4,
      type: "new",
      icon: Plus,
      title: "New MSP agreement signed",
      subtitle: "Hill Electric Services — 36-month contract",
      color: "text-blue-400",
    },
    {
      id: 5,
      type: "critical",
      icon: Clock,
      title: "SLA breach risk — 3 tickets aging >48h",
      subtitle: "Escalate to senior technicians immediately",
      color: "text-orange-400",
    },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case "on-track":
        return "bg-emerald-500 hover:bg-emerald-600"
      case "watch":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "over-budget":
        return "bg-red-500 hover:bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case "on-track":
        return "On Track"
      case "watch":
        return "Watch"
      case "over-budget":
        return "Over Budget"
      default:
        return ""
    }
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* LEFT SIDEBAR */}
      <div className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col p-6">
        {/* Logo */}
        <div className="mb-8">
          <div className="text-2xl font-black tracking-tighter">
            <span className="text-cyan-400">RX</span>
            <span className="text-gray-400 ml-1">SKIN</span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 space-y-1">
          <NavItem
            icon={Target}
            label="Executive Dashboard"
            active
          />
          <NavItem icon={FileText} label="All Tickets" />
          <NavItem icon={Target} label="All Projects" />
          <NavItem icon={Users} label="Departments" />
          <NavItem icon={Zap} label="Utilization" />
          <NavItem icon={DollarSign} label="Financials" />
          <NavItem icon={Grid3X3} label="Client Portfolio" />
          <NavItem icon={Settings} label="Settings" />
        </nav>

        {/* Leadership Badge */}
        <div className="pt-6 border-t border-gray-800">
          <div className="px-3 py-2 bg-gradient-to-r from-cyan-900 to-cyan-800 rounded-lg text-center">
            <div className="text-xs font-semibold text-cyan-300">LEADERSHIP</div>
            <div className="text-xs text-gray-400 mt-1">Executive Access</div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Executive Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">Last refreshed: 2 min ago</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right text-sm">
              <p className="text-gray-300 font-medium">Travis Brown</p>
              <p className="text-gray-500 text-xs">Sr. Director</p>
            </div>
            <div className="relative">
              <Bell className="w-6 h-6 text-gray-400 hover:text-gray-200 cursor-pointer" />
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center">
                5
              </div>
            </div>
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-auto">
          <div className="p-8 space-y-8">
            {/* KPI STRIP */}
            <div className="grid grid-cols-6 gap-4">
              {kpis.map((kpi, idx) => {
                const IconComponent = kpi.icon
                return (
                  <div
                    key={idx}
                    className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`${kpi.color} p-2 rounded-lg`}>
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm font-medium">{kpi.label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{kpi.value}</p>
                  </div>
                )
              })}
            </div>

            {/* DEPARTMENT PERFORMANCE CARDS */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Department Performance</h2>
              <div className="grid grid-cols-4 gap-4">
                {departments.map((dept) => (
                  <div
                    key={dept.id}
                    className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-colors cursor-pointer"
                    onClick={() => setSelectedDept(dept.id)}
                  >
                    {/* Color accent bar */}
                    <div className={`h-1 bg-gradient-to-r ${dept.color}`} />
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-white text-sm">{dept.name}</h3>
                        {dept.trend === "up" && (
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                        )}
                        {dept.trend === "down" && (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        )}
                        {dept.trend === "neutral" && (
                          <div className="w-4 h-4 text-gray-400">→</div>
                        )}
                      </div>

                      <div className="space-y-2 text-xs">
                        {dept.tickets !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Tickets</span>
                            <span className="text-white font-medium">{dept.tickets}</span>
                          </div>
                        )}
                        {dept.procurementTickets !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Procurement</span>
                            <span className="text-white font-medium">{dept.procurementTickets}</span>
                          </div>
                        )}
                        {dept.opportunities !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Opportunities</span>
                            <span className="text-white font-medium">{dept.opportunities}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-400">
                            {dept.projects ? "Projects" : ""}
                          </span>
                          <span className="text-white font-medium">
                            {dept.projects || dept.agreements}
                          </span>
                        </div>
                        {dept.openInvoices && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Open Invoices</span>
                            <span className="text-white font-medium">{dept.openInvoices}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-gray-800">
                          <span className="text-gray-400">Members</span>
                          <span className="text-white font-medium">{dept.members}</span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-800 text-right">
                        <span className={`text-xs font-semibold ${dept.trendValue.includes("over") ? "text-red-400" : "text-emerald-400"}`}>
                          {dept.trendValue}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TWO COLUMN LAYOUT */}
            <div className="grid grid-cols-2 gap-8">
              {/* LEFT: PROJECT HEALTH MATRIX */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Project Health Matrix</h2>
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                  <div className="space-y-6">
                    {/* IT Section */}
                    <div>
                      <h3 className="text-sm font-semibold text-blue-400 mb-3">IT Services (6 projects)</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {projectMatrix.it.map((proj) => (
                          <div
                            key={proj.id}
                            className={`${getStatusColor(proj.status)} rounded p-2 text-xs font-medium text-white text-center cursor-pointer transition-all hover:shadow-lg`}
                            title={`${proj.name} - ${getStatusLabel(proj.status)}`}
                            onMouseEnter={() => setHoveredProject(proj.id)}
                            onMouseLeave={() => setHoveredProject(null)}
                          >
                            {proj.name.split(" ")[0]}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SI Section */}
                    <div>
                      <h3 className="text-sm font-semibold text-cyan-400 mb-3">Systems Integration (6 projects)</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {projectMatrix.si.map((proj) => (
                          <div
                            key={proj.id}
                            className={`${getStatusColor(proj.status)} rounded p-2 text-xs font-medium text-white text-center cursor-pointer transition-all hover:shadow-lg`}
                            title={`${proj.name} - ${getStatusLabel(proj.status)}`}
                            onMouseEnter={() => setHoveredProject(proj.id)}
                            onMouseLeave={() => setHoveredProject(null)}
                          >
                            {proj.name.split(" ")[0]}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* G&A Section */}
                    <div>
                      <h3 className="text-sm font-semibold text-orange-400 mb-3">G&A (3 projects)</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {projectMatrix.ga.map((proj) => (
                          <div
                            key={proj.id}
                            className={`${getStatusColor(proj.status)} rounded p-2 text-xs font-medium text-white text-center cursor-pointer transition-all hover:shadow-lg`}
                            title={`${proj.name} - ${getStatusLabel(proj.status)}`}
                            onMouseEnter={() => setHoveredProject(proj.id)}
                            onMouseLeave={() => setHoveredProject(null)}
                          >
                            {proj.name.split(" ")[0]}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="pt-4 border-t border-gray-800 flex gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded" />
                        <span className="text-gray-400">On Track</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded" />
                        <span className="text-gray-400">Watch</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded" />
                        <span className="text-gray-400">Over Budget</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: UTILIZATION & HIGHLIGHTS */}
              <div className="space-y-8">
                {/* Utilization Chart */}
                <div>
                  <h2 className="text-xl font-bold text-white mb-4">Utilization by Department</h2>
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={utilizationData}>
                        <XAxis dataKey="name" stroke="#6B7280" />
                        <YAxis stroke="#6B7280" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#111827",
                            border: "1px solid #374151",
                            borderRadius: "8px",
                          }}
                          cursor={{ fill: "rgba(0,0,0,0.1)" }}
                        />
                        <Bar dataKey="utilization" radius={[8, 8, 0, 0]}>
                          {utilizationData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.utilization > 100
                                  ? "#ef4444"
                                  : entry.utilization > 80
                                    ? "#eab308"
                                    : "#10b981"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    {/* 100% Reference Line Label */}
                    <div className="text-xs text-gray-500 text-center mt-2">
                      Red dashed line at 100% capacity threshold
                    </div>
                  </div>
                </div>

                {/* Recent Highlights */}
                <div>
                  <h2 className="text-xl font-bold text-white mb-4">Recent Highlights</h2>
                  <div className="space-y-2">
                    {highlights.map((highlight) => {
                      const IconComponent = highlight.icon
                      return (
                        <div
                          key={highlight.id}
                          className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors flex gap-4"
                        >
                          <IconComponent className={`${highlight.color} w-5 h-5 mt-0.5 flex-shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white">{highlight.title}</p>
                            <p className="text-xs text-gray-400 mt-1">{highlight.subtitle}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Nav Item Component
function NavItem({ icon: Icon, label, active = false }) {
  return (
    <button
      className={`w-full px-3 py-2 rounded-lg flex items-center gap-3 transition-colors text-sm font-medium ${
        active
          ? "bg-cyan-600/20 text-cyan-400 border border-cyan-500/30"
          : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  )
}
