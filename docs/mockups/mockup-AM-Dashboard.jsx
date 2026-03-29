'use client';

import { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Search,
  ChevronDown,
  Bell,
  Settings,
  Activity,
  FileText,
  Target,
  BarChart3,
  Users,
  Zap,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Dot,
} from 'lucide-react';

export default function AMDashboard() {
  const [activeNav, setActiveNav] = useState('myDay');
  const [sortBy, setSortBy] = useState('revenue');
  const [expandedAccount, setExpandedAccount] = useState(null);

  // Mock data
  const kpis = [
    { label: 'Active Opportunities', value: '4', color: 'bg-blue-900 border-blue-700', textColor: 'text-blue-400', icon: Target },
    { label: 'Pipeline Value', value: '$142K', color: 'bg-green-900 border-green-700', textColor: 'text-green-400', icon: TrendingUp },
    { label: 'Agreements Expiring (30d)', value: '3', color: 'bg-orange-900 border-orange-700', textColor: 'text-orange-400', icon: AlertCircle },
    { label: 'Incomplete Handoffs', value: '6', color: 'bg-red-900 border-red-700', textColor: 'text-red-400', icon: Clock },
  ];

  const accounts = [
    {
      id: 1,
      name: 'Knight Aerospace',
      industry: 'Manufacturing / Defense',
      status: 'Active MSP',
      statusColor: 'bg-green-950 text-green-300 border border-green-800',
      openTickets: 2,
      activeProjects: 1,
      lastTouch: '2h ago',
      healthScore: 'green',
    },
    {
      id: 2,
      name: 'City of Helotes',
      industry: 'Government / Municipal',
      status: 'Active MSA',
      statusColor: 'bg-blue-950 text-blue-300 border border-blue-800',
      openTickets: 5,
      activeProjects: 2,
      lastTouch: '1d ago',
      healthScore: 'yellow',
    },
    {
      id: 3,
      name: 'St. Michael Catholic School',
      industry: 'Education / K-12',
      status: 'Active MSP',
      statusColor: 'bg-green-950 text-green-300 border border-green-800',
      openTickets: 1,
      activeProjects: 0,
      lastTouch: '3d ago',
      healthScore: 'green',
    },
    {
      id: 4,
      name: 'Westlake Law Partners',
      industry: 'Professional Services / Legal',
      status: 'Expiring Soon',
      statusColor: 'bg-orange-950 text-orange-300 border border-orange-800',
      openTickets: 8,
      activeProjects: 1,
      lastTouch: '4h ago',
      healthScore: 'red',
    },
    {
      id: 5,
      name: 'Texas AirSystems',
      industry: 'HVAC / Trades',
      status: 'Active MSP',
      statusColor: 'bg-green-950 text-green-300 border border-green-800',
      openTickets: 0,
      activeProjects: 1,
      lastTouch: '2d ago',
      healthScore: 'green',
    },
  ];

  const opportunities = [
    { id: 1, company: 'Knight Aerospace', summary: 'WiFi 6 Network Upgrade', value: '$48K', closeDate: 'Apr 15', rep: 'Sarah Chen' },
    { id: 2, company: 'Westlake Law Partners', summary: 'Cybersecurity Assessment', value: '$15K', closeDate: 'Apr 22', rep: 'Marcus Reid' },
    { id: 3, company: 'City of Helotes', summary: 'Data Center Migration', value: '$78K', closeDate: 'May 5', rep: 'Sarah Chen' },
    { id: 4, company: 'St. Michael Catholic School', summary: 'Backup & Disaster Recovery', value: '$22K', closeDate: 'Apr 30', rep: 'Alex Patel' },
  ];

  const kanban = {
    'New': [opportunities[0]],
    'Assigned': [opportunities[1], opportunities[2]],
    'In Progress': [opportunities[3]],
  };

  const activities = [
    { id: 1, icon: CheckCircle2, text: 'Ticket #136567 closed for Knight Aerospace', time: '2h ago', color: 'text-green-400' },
    { id: 2, icon: FileText, text: 'New agreement created for City of Helotes', time: '5h ago', color: 'text-blue-400' },
    { id: 3, icon: CheckCircle2, text: 'Project #788 completed for Texas AirSystems', time: '1d ago', color: 'text-green-400' },
    { id: 4, icon: AlertCircle, text: 'Renewal reminder: Westlake Law Partners (30 days)', time: '1d ago', color: 'text-orange-400' },
    { id: 5, icon: Zap, text: 'New opportunity assigned: Secure Cloud Backup for St. Michael', time: '2d ago', color: 'text-cyan-400' },
    { id: 6, icon: Activity, text: 'AR completed quarterly business review with City of Helotes', time: '3d ago', color: 'text-purple-400' },
  ];

  const healthScoreDot = (score) => {
    const colors = {
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
    };
    return colors[score];
  };

  const navItems = [
    { id: 'myDay', label: 'My Day', icon: Calendar },
    { id: 'myAccounts', label: 'My Accounts', icon: Users },
    { id: 'agreements', label: 'Agreements', icon: FileText },
    { id: 'opportunities', label: 'Opportunities', icon: Target },
    { id: 'projects', label: 'Projects', icon: CheckCircle2 },
    { id: 'clientHealth', label: 'Client Health', icon: BarChart3 },
    { id: 'activityFeed', label: 'Activity Feed', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* Left Sidebar */}
      <div className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-gray-800">
          <div className="text-xl font-bold tracking-wider">
            <span className="text-cyan-400">RX</span>
            <span className="text-white"> SKIN</span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-800'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-gray-100'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer Badge */}
        <div className="px-3 py-4 border-t border-gray-800">
          <div className="bg-gray-800 rounded-lg px-3 py-2 text-center text-xs font-semibold text-gray-300">
            Account Management
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Day</h1>
          <div className="flex items-center gap-6">
            <button className="relative text-gray-300 hover:text-gray-100 transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-gray-800">
              <div className="text-right">
                <p className="text-sm font-semibold">Alisa Richter</p>
                <p className="text-xs text-gray-400">Account Manager</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center font-bold">
                AR
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8">
            {/* KPI Strip */}
            <div className="grid grid-cols-4 gap-4">
              {kpis.map((kpi, idx) => {
                const Icon = kpi.icon;
                return (
                  <div
                    key={idx}
                    className={`${kpi.color} border rounded-lg p-4 flex flex-col gap-2`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={18} className={kpi.textColor} />
                      <p className="text-xs font-medium text-gray-400">{kpi.label}</p>
                    </div>
                    <p className={`text-2xl font-bold ${kpi.textColor}`}>{kpi.value}</p>
                  </div>
                );
              })}
            </div>

            {/* Main Content Grid: Accounts + Pipeline */}
            <div className="grid grid-cols-3 gap-6">
              {/* Left Column: My Accounts (60%) */}
              <div className="col-span-2 space-y-4">
                <div>
                  <h2 className="text-lg font-bold mb-4">My Accounts</h2>

                  {/* Search & Sort */}
                  <div className="flex gap-3 mb-4">
                    <div className="flex-1 relative">
                      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search accounts..."
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-600"
                      />
                    </div>
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-cyan-600 appearance-none pr-8 cursor-pointer"
                      >
                        <option value="revenue">Sort by Revenue</option>
                        <option value="risk">Sort by Risk</option>
                        <option value="activity">Sort by Activity</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Account Cards */}
                <div className="space-y-3">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      onClick={() => setExpandedAccount(expandedAccount === account.id ? null : account.id)}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 cursor-pointer transition-all group"
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-base font-bold group-hover:text-cyan-400 transition-colors">{account.name}</p>
                          <p className="text-xs text-gray-400">{account.industry}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-4 ${account.statusColor}`}>
                          {account.status}
                        </span>
                      </div>

                      {/* Stats Row */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex gap-6">
                          <div>
                            <p className="text-gray-400">Open Tickets</p>
                            <p className="font-semibold text-gray-100">{account.openTickets}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Active Projects</p>
                            <p className="font-semibold text-gray-100">{account.activeProjects}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Last Touch</p>
                            <p className="font-semibold text-gray-100">{account.lastTouch}</p>
                          </div>
                        </div>

                        {/* Health Score Dot */}
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${healthScoreDot(account.healthScore)}`}></div>
                          <span className="text-gray-400 capitalize">{account.healthScore}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Opportunity Pipeline (40%) */}
              <div>
                <h2 className="text-lg font-bold mb-4">Opportunity Pipeline</h2>

                <div className="space-y-4">
                  {Object.entries(kanban).map(([stage, opps]) => (
                    <div key={stage} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-400">{stage}</p>
                        <span className="bg-gray-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-300">
                          {opps.length}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {opps.map((opp) => (
                          <div key={opp.id} className="bg-gray-800 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-all">
                            <p className="text-sm font-semibold text-gray-100 truncate">{opp.company}</p>
                            <p className="text-xs text-gray-400 truncate mb-2">{opp.summary}</p>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-bold text-cyan-400">{opp.value}</p>
                              <p className="text-xs text-gray-500">Close: {opp.closeDate}</p>
                            </div>
                            <p className="text-xs text-gray-400">Rep: {opp.rep}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Recent Activity Feed</h2>

              <div className="space-y-3">
                {activities.map((activity, idx) => {
                  const ActivityIcon = activity.icon;
                  return (
                    <div key={activity.id} className="flex gap-4 pb-3 border-b border-gray-800 last:border-b-0">
                      <div className={`mt-1 flex-shrink-0 ${activity.color}`}>
                        <ActivityIcon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200">{activity.text}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
