import { useState } from 'react';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  Zap,
  MapPin,
  Phone,
  Settings,
  BarChart3,
  Trello,
  Calendar,
  Map,
  Bell,
  ChevronRight,
  DollarSign,
  TrendingUp,
  Users,
  Briefcase,
} from 'lucide-react';

const mockProjects = [
  {
    id: 1,
    name: 'Acme Corp Security Upgrade',
    company: 'Acme Corp',
    pm: 'Sarah Martinez',
    pmInitial: 'SM',
    budget: 45000,
    spent: 32400,
    tickets: 8,
    stage: 'Assigned to PM',
  },
  {
    id: 2,
    name: 'Downtown Office Access Control',
    company: 'TechHub Inc',
    pm: 'Michael Chen',
    pmInitial: 'MC',
    budget: 28000,
    spent: 27800,
    tickets: 5,
    stage: 'In Service',
  },
  {
    id: 3,
    name: 'Campus Building C Expansion',
    company: 'State University',
    pm: 'Jessica Wong',
    pmInitial: 'JW',
    budget: 120000,
    spent: 98500,
    tickets: 12,
    stage: 'In Service',
  },
  {
    id: 4,
    name: 'New Retail Location Wiring',
    company: 'MegaStore Retail',
    pm: 'David Rodriguez',
    pmInitial: 'DR',
    budget: 16500,
    spent: 8200,
    tickets: 3,
    stage: 'Incomplete Handoff',
  },
  {
    id: 5,
    name: 'Office Reconfiguration Phase 2',
    company: 'Innovation Labs',
    pm: 'Amanda Foster',
    pmInitial: 'AF',
    budget: 35000,
    spent: 18500,
    tickets: 6,
    stage: 'Assigned to PM',
  },
  {
    id: 6,
    name: 'Emergency Backup System Install',
    company: 'Financial Services Co',
    pm: 'Robert Kim',
    pmInitial: 'RK',
    budget: 55000,
    spent: 54800,
    tickets: 9,
    stage: 'Completed',
  },
  {
    id: 7,
    name: 'Data Center Cooling Upgrade',
    company: 'CloudServe Inc',
    pm: 'Sarah Martinez',
    pmInitial: 'SM',
    budget: 85000,
    spent: 12000,
    tickets: 4,
    stage: 'New',
  },
];

const mockTickets = [
  {
    id: 'SI-2847',
    priority: 'high',
    summary: 'NVR offline - Door access failing',
    company: 'Acme Corp',
    status: 'In Progress',
    tech: 'Jason Smith',
    techInitial: 'JS',
    scheduledTime: '09:30 AM - 11:00 AM',
  },
  {
    id: 'SI-2841',
    priority: 'medium',
    summary: 'Install 8x PTZ cameras - Building A',
    company: 'State University',
    status: 'Scheduled',
    tech: 'Marcus Johnson',
    techInitial: 'MJ',
    scheduledTime: '02:00 PM - 04:30 PM',
  },
  {
    id: 'SI-2836',
    priority: 'low',
    summary: 'Cat6 cabling to new office suite',
    company: 'TechHub Inc',
    status: 'Completed',
    tech: 'Lisa Park',
    techInitial: 'LP',
    scheduledTime: '10:00 AM - 12:00 PM',
  },
  {
    id: 'SI-2844',
    priority: 'high',
    summary: 'Door additions (6x) + wiring',
    company: 'Innovation Labs',
    status: 'Waiting',
    tech: 'Jason Smith',
    techInitial: 'JS',
    scheduledTime: 'Pending parts arrival',
  },
];

const kanbanColumns = {
  'New': 3,
  'Incomplete Handoff': 6,
  'Assigned to PM': 17,
  'In Service': 4,
  'Completed': 13,
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high':
      return 'bg-red-900 text-red-100';
    case 'medium':
      return 'bg-yellow-900 text-yellow-100';
    case 'low':
      return 'bg-green-900 text-green-100';
    default:
      return 'bg-gray-700 text-gray-100';
  }
};

const getPriorityDot = (priority) => {
  switch (priority) {
    case 'high':
      return 'bg-red-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'low':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

const getBudgetColor = (spent, budget) => {
  const percentage = (spent / budget) * 100;
  if (percentage > 100) return 'bg-red-600';
  if (percentage >= 80) return 'bg-yellow-600';
  return 'bg-emerald-600';
};

const getStageColor = (stage) => {
  switch (stage) {
    case 'New':
      return 'bg-blue-900 text-blue-100';
    case 'Incomplete Handoff':
      return 'bg-orange-900 text-orange-100';
    case 'Assigned to PM':
      return 'bg-purple-900 text-purple-100';
    case 'In Service':
      return 'bg-cyan-900 text-cyan-100';
    case 'Completed':
      return 'bg-emerald-900 text-emerald-100';
    default:
      return 'bg-gray-700 text-gray-100';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'In Progress':
      return 'bg-blue-900 text-blue-100';
    case 'Scheduled':
      return 'bg-purple-900 text-purple-100';
    case 'Completed':
      return 'bg-emerald-900 text-emerald-100';
    case 'Waiting':
      return 'bg-orange-900 text-orange-100';
    default:
      return 'bg-gray-700 text-gray-100';
  }
};

const KPICard = ({ icon: Icon, label, value, subtext, color }) => (
  <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-gray-400 text-sm font-medium">{label}</p>
        <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
        {subtext && <p className="text-gray-500 text-xs mt-1">{subtext}</p>}
      </div>
      <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-').replace(/^bg-/, 'bg-').split(' ')[0]}/20`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
  </div>
);

const ProjectCard = ({ project }) => {
  const percentage = (project.spent / project.budget) * 100;
  return (
    <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-all hover:shadow-lg cursor-pointer min-w-64 flex-shrink-0">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{project.name}</p>
          <p className="text-xs text-gray-400">{project.company}</p>
        </div>
        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getStageColor(project.stage)}`}>
          {project.stage}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
          {project.pmInitial}
        </div>
        <p className="text-xs text-gray-300">{project.pm}</p>
      </div>

      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <p className="text-xs text-gray-400">Budget Utilization</p>
          <p className="text-xs font-semibold text-gray-300">${project.spent.toLocaleString()} / ${project.budget.toLocaleString()}</p>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${getBudgetColor(project.spent, project.budget)}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-700">
        <div className="flex items-center gap-1">
          <Briefcase className="w-4 h-4 text-gray-500" />
          <p className="text-xs text-gray-400">{project.tickets} tickets</p>
        </div>
        <div className={`text-xs font-medium ${percentage > 100 ? 'text-red-400' : percentage >= 80 ? 'text-yellow-400' : 'text-emerald-400'}`}>
          {percentage.toFixed(0)}%
        </div>
      </div>
    </div>
  );
};

const TicketCard = ({ ticket }) => (
  <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-all hover:shadow-lg cursor-pointer">
    <div className="flex items-start gap-3 mb-2">
      <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${getPriorityDot(ticket.priority)}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{ticket.id}</p>
        <p className="text-xs text-gray-300 truncate">{ticket.summary}</p>
      </div>
      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap flex-shrink-0 ${getStatusColor(ticket.status)}`}>
        {ticket.status}
      </span>
    </div>

    <div className="space-y-2 text-xs">
      <div className="flex items-center gap-2 text-gray-400">
        <MapPin className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{ticket.company}</span>
      </div>
      <div className="flex items-center gap-2 text-gray-400">
        <Users className="w-4 h-4 flex-shrink-0" />
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {ticket.techInitial}
          </div>
          <span>{ticket.tech}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-gray-400">
        <Clock className="w-4 h-4 flex-shrink-0" />
        <span>{ticket.scheduledTime}</span>
      </div>
    </div>
  </div>
);

export default function SIDashboard() {
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [scrollPosition, setScrollPosition] = useState(0);

  const filterOptions = ['All', 'Scheduled', 'In Progress', 'Completed', 'Waiting'];

  const filteredTickets =
    selectedFilter === 'All'
      ? mockTickets
      : mockTickets.filter((t) => t.status === selectedFilter);

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* Left Sidebar */}
      <div className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            RX SKIN
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {[
            { icon: Clock, label: 'My Day', active: true },
            { icon: Phone, label: 'Service Queue', active: false },
            { icon: Trello, label: 'Project Board', active: false },
            { icon: Calendar, label: 'Job Scheduler', active: false },
            { icon: Map, label: 'Fleet Map', active: false },
            { icon: Briefcase, label: 'Material Tracking', active: false },
            { icon: BarChart3, label: 'Analytics', active: false },
            { icon: Settings, label: 'Settings', active: false },
          ].map(({ icon: Icon, label, active }) => (
            <button
              key={label}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                active
                  ? 'bg-cyan-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </nav>

        {/* Department Badge */}
        <div className="p-4 border-t border-gray-800">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-3 text-center">
            <p className="text-xs font-semibold text-white">SI DEPARTMENT</p>
            <p className="text-xs text-gray-100 mt-1">Systems Integration</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">My Day</h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-gray-800 px-4 py-2 rounded-lg">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-mono text-gray-300">
                01:23:45 - Project #782
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-400 hover:text-gray-200 cursor-pointer" />
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold">
                JS
              </div>
              <span className="text-sm text-gray-400">Jason Smith</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-5 gap-4">
              <KPICard
                icon={Phone}
                label="Active Service Calls"
                value="20"
                color="text-blue-400"
              />
              <KPICard
                icon={TrendingUp}
                label="Active Projects"
                value="23"
                color="text-cyan-400"
              />
              <KPICard
                icon={Briefcase}
                label="In PM Stage"
                value="17"
                color="text-yellow-400"
              />
              <KPICard
                icon={DollarSign}
                label="Budget Utilization"
                value="73%"
                subtext="All projects"
                color="text-emerald-400"
              />
              <KPICard
                icon={AlertCircle}
                label="Overdue/Waiting"
                value="3"
                color="text-red-400"
              />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-55 gap-6">
              {/* Left: Project Pipeline */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Trello className="w-5 h-5 text-cyan-400" />
                    Project Pipeline
                  </h3>
                </div>

                {/* Kanban Board */}
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 overflow-x-auto">
                  <div className="flex gap-4 min-w-min">
                    {Object.entries(kanbanColumns).map(([column, count]) => (
                      <div key={column} className="flex flex-col w-80 flex-shrink-0">
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-sm text-gray-200">{column}</h4>
                            <span className="bg-gray-800 text-gray-300 text-xs font-bold rounded-full px-2.5 py-0.5">
                              {count}
                            </span>
                          </div>
                          <div className="bg-gray-800 rounded-lg h-0.5" />
                        </div>

                        <div className="space-y-3">
                          {mockProjects
                            .filter((p) => p.stage === column)
                            .slice(0, 2)
                            .map((project) => (
                              <ProjectCard key={project.id} project={project} />
                            ))}
                          {mockProjects.filter((p) => p.stage === column).length > 2 && (
                            <div className="flex items-center justify-center py-2 text-xs text-gray-500">
                              +{mockProjects.filter((p) => p.stage === column).length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4 flex flex-col">
                {/* Service Queue */}
                <div className="space-y-3">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Phone className="w-5 h-5 text-cyan-400" />
                    Service Queue
                  </h3>

                  {/* Filter Pills */}
                  <div className="flex gap-2 flex-wrap">
                    {filterOptions.map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setSelectedFilter(filter)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          selectedFilter === filter
                            ? 'bg-cyan-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  {/* Tickets */}
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {filteredTickets.map((ticket) => (
                      <TicketCard key={ticket.id} ticket={ticket} />
                    ))}
                  </div>
                </div>

                {/* Fleet Map Preview */}
                <div className="mt-auto">
                  <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                      <Map className="w-4 h-4 text-cyan-400" />
                      Fleet Map
                    </h4>

                    {/* Map Placeholder */}
                    <div className="relative w-full h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 overflow-hidden">
                      {/* Simplified map with tech locations */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-full h-full">
                          {/* Dot 1 */}
                          <div className="absolute top-6 left-8 w-3 h-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50" />
                          {/* Dot 2 */}
                          <div className="absolute top-16 right-12 w-3 h-3 bg-cyan-500 rounded-full shadow-lg shadow-cyan-500/50" />
                          {/* Dot 3 */}
                          <div className="absolute bottom-8 left-1/2 w-3 h-3 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50" />
                          {/* Dot 4 */}
                          <div className="absolute bottom-12 right-8 w-3 h-3 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/50" />

                          {/* Grid overlay (subtle) */}
                          <div
                            className="absolute inset-0 opacity-5"
                            style={{
                              backgroundImage:
                                'linear-gradient(0deg, transparent 24%, rgba(255,255,255,.05) 25%, rgba(255,255,255,.05) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.05) 75%, rgba(255,255,255,.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255,255,255,.05) 25%, rgba(255,255,255,.05) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.05) 75%, rgba(255,255,255,.05) 76%, transparent 77%, transparent)',
                              backgroundSize: '50px 50px',
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-gray-400">
                        <span className="font-semibold text-gray-300">4 techs</span> in field |{' '}
                        <span className="font-semibold text-yellow-400">2 en route</span>
                      </p>
                      <button className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1">
                        View Full Map <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
