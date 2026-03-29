import { useState } from 'react';
import {
  Menu,
  Search,
  Home,
  Ticket,
  Kanban,
  FolderOpen,
  Map,
  Calendar,
  AlertCircle,
  BarChart3,
  Settings,
  Bell,
  Clock,
  MessageSquare,
  Zap,
  ChevronDown,
  MapPin,
  User,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Circle,
  Play,
  Pause,
  Square,
  Plus,
} from 'lucide-react';

export default function ITDashboardMockup() {
  const [activeNav, setActiveNav] = useState('my-day');
  const [timerRunning, setTimerRunning] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeFilter, setActiveFilter] = useState('Managed Services');

  const kpiCards = [
    { label: 'My Open Tickets', value: '12', color: 'bg-blue-500', icon: Ticket },
    { label: 'Unassigned (New)', value: '27', color: 'bg-orange-500', icon: AlertTriangle },
    { label: 'In Progress', value: '34', color: 'bg-emerald-500', icon: TrendingUp },
    { label: 'Critical/High', value: '15', color: 'bg-red-500', icon: AlertCircle },
    { label: 'My Active Projects', value: '3', color: 'bg-purple-500', icon: FolderOpen },
  ];

  const tickets = [
    {
      id: '#1365421',
      priority: 'critical',
      status: 'In Progress',
      summary: 'Server down - CRITICAL network outage',
      company: 'Acme Corp',
      tech: 'Travis Brown',
      timeAgo: '14m',
    },
    {
      id: '#1365387',
      priority: 'high',
      status: 'Assigned',
      summary: 'Email sync issue on Exchange - 50+ users affected',
      company: 'CloudTech Solutions',
      tech: 'Sarah Chen',
      timeAgo: '32m',
    },
    {
      id: '#1365156',
      priority: 'medium',
      status: 'Assigned',
      summary: 'Update Windows Server patches - monthly maintenance',
      company: 'Midwest Manufacturing',
      tech: 'Marcus Williams',
      timeAgo: '2h',
    },
    {
      id: '#1365092',
      priority: 'low',
      status: 'New',
      summary: 'Install Adobe Creative Cloud suite - 3 seats',
      company: 'Design Collective LLC',
      tech: 'Unassigned',
      timeAgo: '3h',
    },
  ];

  const scheduleEntries = [
    {
      time: '9:00 AM',
      ticket: '#1365421',
      summary: 'Acme Corp - Network diagnostics',
      company: 'Acme Corp',
    },
    {
      time: '10:30 AM',
      ticket: '#1365387',
      summary: 'CloudTech - Email server maintenance',
      company: 'CloudTech Solutions',
    },
    {
      time: '1:00 PM',
      ticket: '#1365156',
      summary: 'Midwest Mfg - Server patching',
      company: 'Midwest Manufacturing',
    },
    {
      time: '3:00 PM',
      ticket: '#1365092',
      summary: 'Design Collective - Software deployment',
      company: 'Design Collective LLC',
    },
  ];

  const projects = [
    {
      name: 'Network Infrastructure Upgrade',
      company: 'Acme Corp',
      status: 'Assigned to IT Installation',
      hours: { used: 24, total: 40 },
      percent: 60,
    },
    {
      name: 'Disaster Recovery Site Setup',
      company: 'CloudTech Solutions',
      status: 'In Progress',
      hours: { used: 18, total: 50 },
      percent: 36,
    },
    {
      name: 'Unified Communications Migration',
      company: 'Midwest Manufacturing',
      status: 'Planning',
      hours: { used: 8, total: 60 },
      percent: 13,
    },
  ];

  const filters = ['All Boards', 'Managed Services', 'Engineering', 'Alerts', 'Installations'];

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-600 text-red-100',
      high: 'bg-orange-600 text-orange-100',
      medium: 'bg-yellow-600 text-yellow-100',
      low: 'bg-gray-600 text-gray-100',
    };
    return colors[priority] || 'bg-gray-600';
  };

  const getPriorityDot = (priority) => {
    const colors = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-gray-500',
    };
    return colors[priority] || 'bg-gray-500';
  };

  const navItems = [
    { id: 'my-day', label: 'My Day', icon: Home },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'board', label: 'Ticket Board', icon: Kanban },
    { id: 'projects', label: 'Projects', icon: FolderOpen },
    { id: 'fleet', label: 'Fleet Map', icon: Map },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'alerts', label: 'Alerts', icon: AlertCircle },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col overflow-y-auto">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="text-2xl font-black tracking-tighter">
            <span className="text-cyan-400">RX</span>
            <span className="text-gray-300"> SKIN</span>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-gray-800 text-gray-100 pl-10 pr-3 py-2 rounded-lg text-sm placeholder-gray-600 border border-gray-700 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-cyan-500 bg-opacity-20 text-cyan-300 border-l-2 border-cyan-400'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Department Badge */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 rounded-lg">
            <Circle className="w-3 h-3 fill-cyan-400 text-cyan-400" />
            <span className="text-sm font-medium text-gray-300">IT Department</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">My Day</h1>
          </div>

          {/* Timer Widget */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-mono text-gray-100">00:14:32</span>
              <span className="text-sm text-gray-400 font-medium">#1365421</span>
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className="ml-2 p-1 hover:bg-gray-700 rounded transition-colors"
              >
                {timerRunning ? (
                  <Pause className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Play className="w-4 h-4 text-cyan-400" />
                )}
              </button>
              <button className="p-1 hover:bg-gray-700 rounded transition-colors">
                <Square className="w-3 h-3 text-red-400" />
              </button>
            </div>

            {/* User Profile + Notifications */}
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-gray-400 hover:text-gray-200" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center gap-3 pl-4 border-l border-gray-700">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-100">Travis Brown</p>
                  <p className="text-xs text-gray-500">Lead Technician</p>
                </div>
                <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center font-bold text-gray-900">
                  TB
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto bg-gray-950">
          <div className="p-8">
            {/* KPI STRIP */}
            <div className="grid grid-cols-5 gap-4 mb-8">
              {kpiCards.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div
                    key={idx}
                    className="bg-gray-900 rounded-lg border border-gray-800 p-6 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        {card.label}
                      </span>
                      <div className={`${card.color} p-2 rounded-lg`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-100">{card.value}</div>
                  </div>
                );
              })}
            </div>

            {/* MAIN GRID - 60/40 */}
            <div className="grid grid-cols-3 gap-6">
              {/* LEFT COLUMN - TICKET QUEUE */}
              <div className="col-span-2">
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-100">My Ticket Queue</h2>
                    <button className="text-gray-500 hover:text-gray-300">
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex gap-2 mb-6 pb-6 border-b border-gray-800">
                    {filters.map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                          activeFilter === filter
                            ? 'bg-cyan-500 text-gray-900'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  {/* Ticket Cards */}
                  <div className="space-y-4">
                    {tickets.map((ticket, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedTicket(ticket.id)}
                        className={`p-4 rounded-lg border transition-all cursor-pointer ${
                          selectedTicket === ticket.id
                            ? 'bg-gray-800 border-cyan-500 shadow-lg shadow-cyan-500/20'
                            : 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-750'
                        }`}
                      >
                        <div className="flex items-start gap-4 mb-3">
                          <div className={`w-3 h-3 rounded-full mt-1 ${getPriorityDot(ticket.priority)}`}></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-mono text-sm font-bold text-cyan-400">{ticket.id}</span>
                              <span
                                className={`text-xs font-semibold px-2 py-1 rounded ${
                                  ticket.priority === 'critical'
                                    ? 'bg-red-900 text-red-200'
                                    : ticket.priority === 'high'
                                      ? 'bg-orange-900 text-orange-200'
                                      : ticket.priority === 'medium'
                                        ? 'bg-yellow-900 text-yellow-200'
                                        : 'bg-gray-700 text-gray-300'
                                }`}
                              >
                                {ticket.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-200 font-medium">{ticket.summary}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {ticket.company}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {ticket.tech}
                            </span>
                            <span className="text-gray-600">{ticket.timeAgo}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-gray-700 rounded transition-colors">
                              <Clock className="w-4 h-4 text-gray-400 hover:text-gray-200" />
                            </button>
                            <button className="p-2 hover:bg-gray-700 rounded transition-colors">
                              <MessageSquare className="w-4 h-4 text-gray-400 hover:text-gray-200" />
                            </button>
                            <button className="p-2 hover:bg-gray-700 rounded transition-colors">
                              <ChevronDown className="w-4 h-4 text-gray-400 hover:text-gray-200" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="col-span-1 space-y-6">
                {/* TODAY'S SCHEDULE */}
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                  <h2 className="text-lg font-bold text-gray-100 mb-6">Today's Schedule</h2>

                  <div className="space-y-3">
                    {scheduleEntries.map((entry, idx) => (
                      <div key={idx} className="flex gap-4 pb-4 border-b border-gray-800 last:border-0 last:pb-0">
                        <div className="flex-shrink-0 text-xs font-mono font-bold text-cyan-400 w-16">
                          {entry.time}
                        </div>
                        <div className="flex-1 border-l-2 border-cyan-500 pl-4">
                          <p className="text-xs font-mono text-gray-400 mb-1">{entry.ticket}</p>
                          <p className="text-sm text-gray-200 font-medium">{entry.summary}</p>
                          <p className="text-xs text-gray-500 mt-1">{entry.company}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* MY PROJECTS */}
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                  <h2 className="text-lg font-bold text-gray-100 mb-6">My Projects</h2>

                  <div className="space-y-4">
                    {projects.map((project, idx) => (
                      <div key={idx} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors cursor-pointer">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-sm font-bold text-gray-100 mb-1">{project.name}</h3>
                            <p className="text-xs text-gray-500">{project.company}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded font-medium">
                            {project.status}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-2">
                          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                project.percent > 75
                                  ? 'bg-red-500'
                                  : project.percent > 50
                                    ? 'bg-yellow-500'
                                    : 'bg-emerald-500'
                              }`}
                              style={{ width: `${project.percent}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {project.hours.used}h / {project.hours.total}h
                          </p>
                        </div>

                        <button className="w-full text-xs font-semibold text-cyan-400 hover:text-cyan-300 py-2 px-3 rounded-lg border border-gray-700 hover:border-cyan-500 transition-colors mt-3">
                          Log Time
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
