import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu,
  Plus,
  Search,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  X,
  Layers,
  Hash,
  Boxes,
  Package,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Filter
} from 'lucide-react';
import {
  getAllProductionTasks,
  deleteProductionTask
} from '../services/productionService';
import { CreateProductionModal } from '../components/CreateProductionModal';
import { ProductionDetailDrawer } from '../components/ProductionDetailDrawer';

export const ProductionListPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modals & Drawers
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Fetch Production Tasks
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllProductionTasks({
        search: searchTerm,
        status: statusFilter,
        priority: priorityFilter
      });
      if (res && res.data) {
        setTasks(res.data);
      } else if (Array.isArray(res)) {
        setTasks(res);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error("Error fetching production tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, priorityFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchTasks]);

  // Open Details Drawer
  const handleOpenDrawer = (taskId) => {
    setSelectedTaskId(taskId);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedTaskId(null);
  };

  // Delete Task
  const handleDelete = async (task) => {
    if (
      window.confirm(
        `Are you sure you want to delete production work order "${task.task_id}" (${task.product_name})? This action cannot be undone.`
      )
    ) {
      try {
        await deleteProductionTask(task.id);
        fetchTasks();
      } catch (err) {
        console.error("Error deleting production task:", err);
        alert(err.response?.data?.message || "Failed to delete production task.");
      }
    }
  };

  // KPI Calculations
  const totalOrders = tasks.length;
  const inProduction = tasks.filter((t) => (t.status || '').toLowerCase() === 'in production').length;
  const pendingMaterials = tasks.filter((t) =>
    ['planned', 'material requested'].includes((t.status || '').toLowerCase())
  ).length;
  const completedOrders = tasks.filter((t) => (t.status || '').toLowerCase() === 'completed').length;
  const totalFinishedGoods = tasks.reduce((sum, t) => sum + (parseInt(t.finished_quantity, 10) || 0), 0);
  const totalTargetGoods = tasks.reduce((sum, t) => sum + (parseInt(t.proposed_quantity, 10) || 0), 0);

  // Status Badge Helper
  const getStatusBadge = (st) => {
    switch (st) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'In Production':
        return 'bg-blue-50 text-blue-700 border-blue-300';
      case 'Quality Check':
        return 'bg-purple-50 text-purple-700 border-purple-300';
      case 'Material Issued':
        return 'bg-indigo-50 text-indigo-700 border-indigo-300';
      case 'Material Requested':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'Urgent':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'High':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Low':
        return 'text-slate-600 bg-slate-50 border-slate-200';
      default:
        return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-12">
      {/* 🌟 1. PAGE HEADER */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              Production & Assembly Work Orders
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                {totalOrders} Orders
              </span>
            </h1>
            <p className="text-xs text-gray-500">
              Request components from store stock, assemble products, and track proposed vs finished output
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98] cursor-pointer shrink-0"
        >
          <Plus size={15} />
          <span>New Work Order</span>
        </button>
      </div>

      {/* 🌟 2. KPI METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Layers size={18} />
          </div>
          <div>
            <span className="text-gray-500 text-[11px] font-medium block">Total Work Orders</span>
            <span className="text-lg font-bold text-gray-900 leading-tight">{totalOrders}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Boxes size={18} />
          </div>
          <div>
            <span className="text-gray-500 text-[11px] font-medium block">Pending Store Issue</span>
            <span className="text-lg font-bold text-amber-700 leading-tight">{pendingMaterials}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Cpu size={18} />
          </div>
          <div>
            <span className="text-gray-500 text-[11px] font-medium block">In Active Assembly</span>
            <span className="text-lg font-bold text-indigo-700 leading-tight">{inProduction}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Package size={18} />
          </div>
          <div>
            <span className="text-gray-500 text-[11px] font-medium block">Finished Goods Produced</span>
            <span className="text-lg font-bold text-emerald-700 leading-tight">
              {totalFinishedGoods} <span className="text-xs font-normal text-gray-400">/ {totalTargetGoods}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 🌟 3. SEARCH & FILTERS BAR */}
      <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Search Input with Clear Button */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search task ID, product name, technician..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2 text-xs text-gray-900 font-medium bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder:text-gray-400 transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-200/60 transition cursor-pointer"
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status & Priority Dropdowns */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Planned">Planned</option>
            <option value="Material Requested">Material Requested</option>
            <option value="Material Issued">Material Issued</option>
            <option value="In Production">In Production</option>
            <option value="Quality Check">Quality Check</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="Urgent">🔴 Urgent</option>
            <option value="High">🟠 High</option>
            <option value="Medium">🔵 Medium</option>
            <option value="Low">🟢 Low</option>
          </select>
        </div>
      </div>

      {/* 🌟 4. PRODUCTION TASKS DATA TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse table-fixed">
            <thead className="bg-slate-50 text-gray-600 font-bold uppercase tracking-wider text-[10px] border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-3 w-[6%] text-center">#</th>
                <th className="py-3.5 px-3 w-[12%]">Task ID</th>
                <th className="py-3.5 px-3 w-[26%]">Product / Title</th>
                <th className="py-3.5 px-3 w-[18%]">Progress / Output</th>
                <th className="py-3.5 px-3 w-[12%]">Status</th>
                <th className="py-3.5 px-3 w-[8%] text-center">Priority</th>
                <th className="py-3.5 px-3 w-[10%]">Assigned</th>
                <th className="py-3.5 px-3 w-[8%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      <p className="font-medium text-xs">Loading production work orders...</p>
                    </div>
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Cpu className="w-8 h-8 text-gray-300" />
                      <p className="font-semibold text-gray-600">No production work orders found</p>
                      <p className="text-[11px] text-gray-400">
                        {searchTerm || statusFilter || priorityFilter
                          ? 'Try clearing your filters'
                          : 'Click "+ New Work Order" above to create your first production task'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                tasks.map((t, idx) => {
                  const proposed = parseInt(t.proposed_quantity, 10) || 1;
                  const finished = parseInt(t.finished_quantity, 10) || 0;
                  const percent = Math.min(100, Math.round((finished / proposed) * 100));

                  return (
                    <tr
                      key={t.id}
                      onClick={() => handleOpenDrawer(t.id)}
                      className="hover:bg-slate-50/90 transition-colors cursor-pointer"
                    >
                      {/* Index */}
                      <td className="py-3.5 px-3 text-center font-mono text-gray-400 text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Task ID */}
                      <td className="py-3.5 px-3 truncate">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80 font-mono font-bold text-xs">
                          <Hash className="w-3 h-3 text-blue-500" />
                          {t.task_id}
                        </span>
                      </td>

                      {/* Product Name & Title */}
                      <td className="py-3.5 px-3 truncate">
                        <div className="font-bold text-gray-900 truncate text-xs">{t.product_name}</div>
                        <div className="text-[11px] text-gray-500 truncate">{t.task_title || `Build ${proposed} units`}</div>
                      </td>

                      {/* Output Progress */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-gray-800">
                              {finished} / {proposed} Units
                            </span>
                            <span className={percent >= 100 ? 'text-emerald-700' : 'text-blue-700'}>
                              {percent}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                percent >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-3 truncate">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border truncate ${getStatusBadge(t.status)}`}>
                          {t.status}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${getPriorityBadge(t.priority)}`}>
                          {t.priority}
                        </span>
                      </td>

                      {/* Assigned & Date */}
                      <td className="py-3.5 px-3 truncate">
                        <div className="font-semibold text-gray-900 truncate">{t.assigned_to || 'Unassigned'}</div>
                        <div className="text-[10px] text-gray-400">
                          {t.due_date ? `Due: ${new Date(t.due_date).toLocaleDateString('en-IN')}` : 'No due date'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenDrawer(t.id)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="View / Manage Work Order"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(t)}
                            className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Work Order"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🌟 5. CREATE WORK ORDER MODAL */}
      <CreateProductionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchTasks}
      />

      {/* 🌟 6. PRODUCTION DETAIL DRAWER */}
      <ProductionDetailDrawer
        isOpen={isDrawerOpen}
        taskId={selectedTaskId}
        onClose={handleCloseDrawer}
        onRefresh={fetchTasks}
      />
    </div>
  );
};
