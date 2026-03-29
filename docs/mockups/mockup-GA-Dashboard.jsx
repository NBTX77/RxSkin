import { useState } from "react";
import {
  DollarSign,
  AlertTriangle,
  Package,
  TrendingUp,
  ShoppingCart,
  Filter,
  Bell,
  Settings,
  ChevronDown,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function GADashboard() {
  const [invoiceFilter, setInvoiceFilter] = useState("All");
  const [expandedInvoice, setExpandedInvoice] = useState(null);

  // Mock data
  const invoices = [
    {
      id: "INV-4521",
      company: "Knight Aerospace",
      amount: 24500,
      dueDate: "2026-03-15",
      status: "Overdue",
      aging: 13,
    },
    {
      id: "INV-4518",
      company: "City of Helotes",
      amount: 8750,
      dueDate: "2026-03-30",
      status: "Sent",
      aging: 0,
    },
    {
      id: "INV-4515",
      company: "SpawGlass",
      amount: 45200,
      dueDate: "2026-03-28",
      status: "Sent",
      aging: 0,
    },
    {
      id: "INV-4512",
      company: "Judson ISD",
      amount: 12800,
      dueDate: "2026-04-05",
      status: "Sent",
      aging: 0,
    },
    {
      id: "INV-4509",
      company: "Transwestern NWT",
      amount: 18400,
      dueDate: "2026-03-10",
      status: "Overdue",
      aging: 18,
    },
    {
      id: "INV-4506",
      company: "Any Baby Can",
      amount: 3200,
      dueDate: "2026-04-10",
      status: "Sent",
      aging: 0,
    },
  ];

  const procurement = [
    {
      id: "PC-2156",
      summary: "Network Switches (24-port)",
      company: "Knight Aerospace",
      status: "Product Ordered",
      statusColor: "yellow",
      requested: "2026-03-20",
    },
    {
      id: "PC-2145",
      summary: "Hikvision Security Cameras (8x)",
      company: "City of Helotes",
      status: "Material Confirmed",
      statusColor: "blue",
      requested: "2026-03-18",
    },
    {
      id: "PC-2134",
      summary: "Cat6a Cabling (1000ft)",
      company: "SpawGlass",
      status: "Product Received",
      statusColor: "green",
      requested: "2026-03-10",
    },
    {
      id: "PC-2123",
      summary: "Laptops - HP EliteBook (5x)",
      company: "Judson ISD",
      status: "Product Requested",
      statusColor: "orange",
      requested: "2026-03-25",
    },
    {
      id: "PC-2112",
      summary: "Server RAM - 32GB (12x)",
      company: "Transwestern NWT",
      status: "Product Ordered",
      statusColor: "yellow",
      requested: "2026-03-22",
    },
  ];

  const projects = [
    {
      name: "Network Migration - G&A",
      board: "G&A",
      budget: 50000,
      actual: 63500,
      variance: -13500,
      utilization: 127,
    },
    {
      name: "SI - Client Infrastructure",
      board: "SI",
      budget: 120000,
      actual: 87600,
      variance: 32400,
      utilization: 73,
    },
    {
      name: "IT - Desktop Refresh",
      board: "IT",
      budget: 85000,
      actual: 40800,
      variance: 44200,
      utilization: 48,
    },
    {
      name: "Procurement - Inventory Stock",
      board: "Procurement",
      budget: 75000,
      actual: 75000,
      variance: 0,
      utilization: 100,
    },
  ];

  const filteredInvoices = invoices.filter((inv) => {
    if (invoiceFilter === "All") return true;
    return inv.status === invoiceFilter;
  });

  const agingColor = (aging, status) => {
    if (status === "Overdue") return "text-red-500";
    if (aging === 0) return "text-green-500";
    return "text-yellow-500";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    if (status === "Overdue") return "bg-red-900/30 text-red-400 border-red-700/50";
    if (status === "Sent") return "bg-blue-900/30 text-blue-400 border-blue-700/50";
    return "bg-gray-700/30 text-gray-400 border-gray-600/50";
  };

  const getProcurementStatusColor = (color) => {
    const colors = {
      orange: "bg-orange-900/30 text-orange-400 border-orange-700/50",
      blue: "bg-blue-900/30 text-blue-400 border-blue-700/50",
      yellow: "bg-yellow-900/30 text-yellow-400 border-yellow-700/50",
      green: "bg-green-900/30 text-green-400 border-green-700/50",
    };
    return colors[color] || colors.blue;
  };

  const getVarianceColor = (variance) => {
    if (variance > 0) return "text-green-500";
    if (variance < 0) return "text-red-500";
    return "text-yellow-500";
  };

  const getUtilizationColor = (util) => {
    if (util > 110) return "bg-red-900/30 text-red-400";
    if (util >= 100) return "bg-yellow-900/30 text-yellow-400";
    return "bg-green-900/30 text-green-400";
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-50">
      {/* Left Sidebar */}
      <div className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-cyan-400">RX</span>
            <span className="text-xs font-semibold text-gray-400 tracking-widest">
              SKIN
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {[
            { label: "My Day", icon: "📋", active: true },
            { label: "Invoices", icon: "📄" },
            { label: "Purchase Orders", icon: "📦" },
            { label: "Agreements", icon: "📋" },
            { label: "Projects", icon: "$", subtitle: "Budget" },
            { label: "Time & Billing", icon: "⏱" },
            { label: "Catalog", icon: "📚" },
            { label: "Procurement Queue", icon: "🛒" },
            { label: "Settings", icon: "⚙" },
          ].map((item) => (
            <button
              key={item.label}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                item.active
                  ? "bg-cyan-900/40 text-cyan-400 border border-cyan-700/50"
                  : "text-gray-300 hover:bg-gray-800/60"
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
              {item.subtitle && (
                <span className="text-xs text-gray-500 ml-1">({item.subtitle})</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2">
            <div className="text-xs font-semibold text-cyan-400">G&A DEPARTMENT</div>
            <div className="text-xs text-gray-400 mt-1">Accounting, Procurement</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-50">My Day</h1>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-400" />
            </button>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg">
              <div className="w-8 h-8 bg-cyan-600 rounded text-xs font-bold flex items-center justify-center">
                SM
              </div>
              <span className="text-sm font-medium">Starr Monroe</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* KPI Strip */}
          <div className="grid grid-cols-5 gap-4 p-6 bg-gradient-to-b from-gray-900 to-gray-950">
            {[
              {
                label: "Open Invoices",
                value: "$287,450",
                icon: DollarSign,
                color: "text-blue-400",
              },
              {
                label: "Overdue Invoices",
                value: "8",
                icon: AlertTriangle,
                color: "text-red-400",
              },
              {
                label: "Open POs",
                value: "3",
                icon: Package,
                color: "text-yellow-400",
              },
              {
                label: "Over Budget",
                value: "4",
                icon: TrendingUp,
                color: "text-red-400",
              },
              {
                label: "Pending Procurement",
                value: "5",
                icon: ShoppingCart,
                color: "text-orange-400",
              },
            ].map((kpi, idx) => {
              const IconComponent = kpi.icon;
              return (
                <div
                  key={idx}
                  className="bg-gray-900/80 border border-gray-800 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-400 uppercase">
                      {kpi.label}
                    </span>
                    <IconComponent className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                  <div className={`text-2xl font-bold ${kpi.color}`}>
                    {kpi.value}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-3 gap-6 p-6">
            {/* Left Column - Invoice Tracker */}
            <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-lg overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-800">
                <h2 className="text-lg font-bold text-gray-50 mb-4">
                  Invoice Tracker
                </h2>
                <div className="flex gap-2">
                  {["All", "Sent", "Overdue", "Paid"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setInvoiceFilter(filter)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        invoiceFilter === filter
                          ? "bg-cyan-600 text-white"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Invoice Table */}
              <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-gray-800">
                  {filteredInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="px-6 py-3 hover:bg-gray-800/50 transition-colors cursor-pointer border-b border-gray-800/50 last:border-b-0"
                      onClick={() =>
                        setExpandedInvoice(
                          expandedInvoice === inv.id ? null : inv.id
                        )
                      }
                    >
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <div className="font-mono font-semibold text-cyan-400 w-24">
                          {inv.id}
                        </div>
                        <div className="flex-1 text-gray-300">{inv.company}</div>
                        <div className="text-right font-semibold text-gray-50 w-32">
                          {formatCurrency(inv.amount)}
                        </div>
                        <div className="text-right text-gray-400 w-24">
                          {inv.dueDate}
                        </div>
                        <div className="w-32">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getStatusColor(
                              inv.status
                            )}`}
                          >
                            {inv.status}
                          </span>
                        </div>
                        <div
                          className={`text-right font-semibold w-16 ${agingColor(
                            inv.aging,
                            inv.status
                          )}`}
                        >
                          {inv.status === "Overdue"
                            ? `${inv.aging}d`
                            : inv.aging === 0
                              ? "Due Today"
                              : "Current"}
                        </div>
                      </div>

                      {expandedInvoice === inv.id && (
                        <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <div className="font-semibold text-gray-300 mb-1">
                                PO Reference
                              </div>
                              <div>PO-2026-{Math.floor(Math.random() * 10000)}</div>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-300 mb-1">
                                Description
                              </div>
                              <div>Professional Services - Q1</div>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-300 mb-1">
                                Terms
                              </div>
                              <div>Net 30</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Split */}
            <div className="flex flex-col gap-6">
              {/* Procurement Pipeline */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-gray-800">
                  <h2 className="text-base font-bold text-gray-50">
                    Procurement Pipeline
                  </h2>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 p-4">
                  {procurement.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-800/40 border border-gray-700 rounded-lg p-3 text-xs hover:bg-gray-800/60 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-mono font-semibold text-cyan-400">
                          {item.id}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium border ${getProcurementStatusColor(
                            item.statusColor
                          )}`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div className="text-gray-300 font-medium mb-1">
                        {item.summary}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {item.company} • Req: {item.requested}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Project Budget Summary */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-gray-800">
                  <h2 className="text-base font-bold text-gray-50">
                    Project Budget
                  </h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div className="divide-y divide-gray-800">
                    {projects.map((proj, idx) => (
                      <div
                        key={idx}
                        className="px-6 py-3 hover:bg-gray-800/50 transition-colors text-xs"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-gray-50 max-w-xs">
                            {proj.name}
                          </div>
                          <div className="text-gray-400">{proj.board}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                          <div>
                            <div className="text-gray-500">Budget</div>
                            <div className="font-semibold text-gray-50">
                              {formatCurrency(proj.budget)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500">Actual</div>
                            <div className="font-semibold text-gray-50">
                              {formatCurrency(proj.actual)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500">Variance</div>
                            <div
                              className={`font-semibold ${getVarianceColor(
                                proj.variance
                              )}`}
                            >
                              {proj.variance > 0 ? "+" : ""}
                              {formatCurrency(proj.variance)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                proj.utilization > 110
                                  ? "bg-red-500"
                                  : proj.utilization >= 100
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                              }`}
                              style={{
                                width: `${Math.min(proj.utilization, 100)}%`,
                              }}
                            />
                          </div>
                          <div
                            className={`font-semibold px-2 py-0.5 rounded text-xs border ${getUtilizationColor(
                              proj.utilization
                            )} border-gray-700`}
                          >
                            {proj.utilization}%
                          </div>
                        </div>
                      </div>
                    ))}
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
