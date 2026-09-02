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
  Filter,
  Send,
  Sparkles,
  ClipboardList,
  Truck,
  RotateCcw,
  Check,
  FileText,
  ShieldAlert
} from 'lucide-react';
import {
  getAllProductionTasks,
  deleteProductionTask,
  recordFinishedGoods
} from '../services/productionService';
import { CreateProductionModal } from '../components/CreateProductionModal';
import { ProductionDetailDrawer } from '../components/ProductionDetailDrawer';

export const ProductionListPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'store_received', 'output_damage'

  // Modals & Drawers
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerInitialTab, setDrawerInitialTab] = useState('stage1');

  // Record Output & Shortage Report Modal
  const [outputModalTask, setOutputModalTask] = useState(null);
  const [finishedQtyInput, setFinishedQtyInput] = useState(0);
  const [rejectedQtyInput, setRejectedQtyInput] = useState(0);
  const [shortageReason, setShortageReason] = useState('');
  const [outputNotes, setOutputNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Production Tasks
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllProductionTasks({
        search: searchTerm
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
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchTasks]);

  // Open Details Drawer
  const handleOpenDrawer = (taskId, stageTab = 'stage1') => {
    setSelectedTaskId(taskId);
    setDrawerInitialTab(stageTab);
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

  // Save Output & Shortage Report
  const handleSaveOutputAndShortage = async (e) => {
    e.preventDefault();
    if (!outputModalTask) return;
    try {
      setActionLoading(true);
      const fQty = parseInt(finishedQtyInput, 10) || 0;
      const rQty = parseInt(rejectedQtyInput, 10) || 0;
      const targetQty = parseInt(outputModalTask.proposed_quantity, 10) || 1;
      const shortageCount = Math.max(0, targetQty - fQty);

      let combinedNotes = outputNotes.trim();
      if (shortageCount > 0 && shortageReason.trim()) {
        combinedNotes = `[SHORTAGE REPORT: Short by ${shortageCount} units. Reason: ${shortageReason.trim()}] ${combinedNotes}`;
      }

      await recordFinishedGoods(outputModalTask.id, {
        finished_quantity: fQty,
        rejected_quantity: rQty,
        notes: combinedNotes || null,
        mark_completed: fQty >= targetQty
      });

      setOutputModalTask(null);
      await fetchTasks();
    } catch (err) {
      console.error("Error recording output:", err);
      alert(err.response?.data?.message || "Failed to record finished goods output.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter lists for each tab
  const totalOrders = tasks.length;

  // Tab 1: Material Requests (Planned / Pending Store Issue)
  const materialRequestsTasks = tasks.filter((t) =>
    ['planned', 'material requested'].includes((t.status || 'planned').toLowerCase())
  );

  // Tab 2: Received from Store (Tracking items dispatched from store to production)
  const storeReceivedTasks = tasks.filter((t) =>
    ['material requested', 'material issued', 'in production', 'partially issued', 'planned'].includes((t.status || '').toLowerCase())
  );

  // Tab 3: Finished Goods & Damage/Shortage
  const outputDamageTasks = tasks.filter((t) =>
    ['in production', 'completed', 'material issued'].includes((t.status || '').toLowerCase())
  );

  const totalFinishedGoods = tasks.reduce((sum, t) => sum + (parseInt(t.finished_quantity, 10) || 0), 0);
  const totalTargetGoods = tasks.reduce((sum, t) => sum + (parseInt(t.proposed_quantity, 10) || 0), 0);
  const totalScrapCount = tasks.reduce((sum, t) => sum + (parseInt(t.rejected_quantity, 10) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-12 text-xs">
      {/* 🌟 1. PAGE HEADER */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              Production Management
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                {totalOrders} Work Orders
              </span>
            </h1>
            <p className="text-xs text-gray-500">
              Manufacturing lifecycle & floor operations
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

      {/* 🌟 2. THREE SLEEK HORIZONTAL TABS */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
        {/* Tab 1: Material Requests */}
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'requests'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <ClipboardList size={15} />
          <span>1. Material Requests</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'requests'
                ? 'bg-white/20 text-white'
                : 'bg-slate-200/70 text-slate-700'
              }`}
          >
            {materialRequestsTasks.length}
          </span>
        </button>

        {/* Tab 2: Received from Store */}
        <button
          type="button"
          onClick={() => setActiveTab('store_received')}
          className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'store_received'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <Truck size={15} />
          <span>2. Received from Store</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'store_received'
                ? 'bg-white/20 text-white'
                : 'bg-slate-200/70 text-slate-700'
              }`}
          >
            {storeReceivedTasks.length}
          </span>
        </button>

        {/* Tab 3: Finished Goods & Damage Report */}
        <button
          type="button"
          onClick={() => setActiveTab('output_damage')}
          className={`flex-1 min-w-[220px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'output_damage'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <Package size={15} />
          <span>3. Finished Goods & Damage Report</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'output_damage'
                ? 'bg-white/20 text-white'
                : 'bg-slate-200/70 text-slate-700'
              }`}
          >
            {totalFinishedGoods} / {totalTargetGoods}
          </span>
        </button>
      </div>

      {/* 🌟 3. SEARCH & FILTERS BAR */}
      <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Task ID (e.g. PRD-001), product name, project in-charge..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2 text-xs text-gray-900 font-medium bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder:text-gray-400 transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-200/60 transition cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* 🌟 4. TAB 1 CONTENT: MATERIAL REQUESTS (STORE REQUISITIONS) */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 flex flex-col items-center justify-center gap-2 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <p className="font-medium text-xs">Loading material requests...</p>
            </div>
          ) : materialRequestsTasks.length === 0 ? (
            <div className="p-10 text-center text-gray-400 space-y-2">
              <ClipboardList className="w-10 h-10 mx-auto text-gray-300" />
              <p className="text-sm font-bold text-gray-700">No Pending Material Requests</p>
              <p className="text-xs text-gray-400">All created production orders have been processed or none are pending.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <th className="py-3 px-4">Task ID & Date</th>
                    <th className="py-3 px-4">Finished Product</th>
                    <th className="py-3 px-4 text-center">Proposed Goods Quantity</th>
                    <th className="py-3 px-4 text-center">BOM Items Requested</th>
                    <th className="py-3 px-4">Project In-charge</th>
                    <th className="py-3 px-4">Store Request Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {materialRequestsTasks.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => handleOpenDrawer(task.id, 'stage1')}
                      className="hover:bg-amber-50/30 transition-colors cursor-pointer"
                    >
                      {/* Task ID & Date */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                          {task.task_id}
                        </span>
                        <span className="text-[10px] text-gray-400 block mt-1">
                          {task.start_date ? new Date(task.start_date).toLocaleDateString() : 'No date'}
                        </span>
                      </td>

                      {/* Finished Product (Clean column) */}
                      <td className="py-3.5 px-4 font-bold text-gray-900 text-xs">
                        {task.product_name}
                      </td>

                      {/* Proposed Goods Quantity (Clean column) */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800 text-xs">
                        <span className="bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 inline-block">
                          {task.proposed_quantity} Units
                        </span>
                      </td>

                      {/* BOM Items Requested */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 inline-block text-xs">
                          {task.total_items || 0} Components ({task.total_required_qty || 0} Total Qty)
                        </span>
                      </td>

                      {/* Project In-charge */}
                      <td className="py-3.5 px-4 font-medium text-gray-800">
                        {task.assigned_to || 'Unassigned'}
                      </td>

                      {/* Store Request Status */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                          <Clock size={11} /> Pending Store Dispatch
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDrawer(task.id, 'stage1')}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                          >
                            View Request
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(task)}
                            className="p-1 text-gray-400 hover:text-rose-600 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 🌟 5. TAB 2 CONTENT: RECEIVED FROM STORE (DISPATCH TRACKING) */}
      {activeTab === 'store_received' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 flex flex-col items-center justify-center gap-2 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <p className="font-medium text-xs">Loading store dispatch status...</p>
            </div>
          ) : storeReceivedTasks.length === 0 ? (
            <div className="p-10 text-center text-gray-400 space-y-2">
              <Truck className="w-10 h-10 mx-auto text-gray-300" />
              <p className="text-sm font-bold text-gray-700">No Store Dispatches</p>
              <p className="text-xs text-gray-400">No active work orders currently waiting or received from Store.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <th className="py-3 px-4">Task ID & Date</th>
                    <th className="py-3 px-4">Finished Product</th>
                    <th className="py-3 px-4 text-center">Proposed Goods Quantity</th>
                    <th className="py-3 px-4 text-center">Items Received vs Requested</th>
                    <th className="py-3 px-4">Store Dispatch Status</th>
                    <th className="py-3 px-4">Project In-charge</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {storeReceivedTasks.map((task) => {
                    const reqQty = parseFloat(task.total_required_qty) || 0;
                    const issQty = parseFloat(task.total_issued_qty) || 0;
                    const isFullyDispatched = issQty >= reqQty && reqQty > 0;
                    const dispatchPercent = reqQty > 0 ? Math.min(100, Math.round((issQty / reqQty) * 100)) : 0;

                    return (
                      <tr
                        key={task.id}
                        onClick={() => handleOpenDrawer(task.id, 'stage2')}
                        className="hover:bg-indigo-50/30 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-blue-700 text-xs bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {task.task_id}
                          </span>
                          <span className="text-[10px] text-gray-400 block mt-1">
                            {task.start_date ? new Date(task.start_date).toLocaleDateString() : 'No date'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-gray-900 text-xs">
                          {task.product_name}
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-slate-800 text-xs">
                          <span className="bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 inline-block">
                            {task.proposed_quantity} Units
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-block space-y-1">
                            <span className="font-bold text-slate-800 text-xs">
                              {issQty} / {reqQty} units ({dispatchPercent}%)
                            </span>
                            <div className="w-24 bg-gray-200 rounded-full h-1.5 mx-auto overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isFullyDispatched ? 'bg-emerald-500' : 'bg-indigo-600'
                                  }`}
                                style={{ width: `${dispatchPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {isFullyDispatched ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                              <Check size={11} /> Fully Received
                            </span>
                          ) : issQty > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                              Partially Received
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                              Awaiting Dispatch
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-medium text-gray-800">
                          {task.assigned_to || 'Unassigned'}
                        </td>

                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleOpenDrawer(task.id, 'stage2')}
                            className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                          >
                            View Items
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 🌟 6. TAB 3 CONTENT: FINISHED GOODS & DAMAGE / SHORTAGE REPORT */}
      {activeTab === 'output_damage' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 flex flex-col items-center justify-center gap-2 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <p className="font-medium text-xs">Loading output records...</p>
            </div>
          ) : outputDamageTasks.length === 0 ? (
            <div className="p-10 text-center text-gray-400 space-y-2">
              <Package className="w-10 h-10 mx-auto text-gray-300" />
              <p className="text-sm font-bold text-gray-700">No Production Outputs Logged</p>
              <p className="text-xs text-gray-400">When work orders enter production, output and damage reports will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <th className="py-3 px-4">Task ID & Date</th>
                    <th className="py-3 px-4">Finished Product</th>
                    <th className="py-3 px-4 text-center">Proposed Goods Quantity</th>
                    <th className="py-3 px-4 text-center">Finished Goods Produced</th>
                    <th className="py-3 px-4 text-center">Damaged / Defect Qty</th>
                    <th className="py-3 px-4">Shortage / Variance Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {outputDamageTasks.map((task) => {
                    const proposed = parseInt(task.proposed_quantity, 10) || 1;
                    const finished = parseInt(task.finished_quantity, 10) || 0;
                    const rejected = parseInt(task.rejected_quantity, 10) || 0;
                    const shortage = Math.max(0, proposed - finished);
                    const isFullyCompleted = finished >= proposed;

                    return (
                      <tr
                        key={task.id}
                        onClick={() => handleOpenDrawer(task.id, 'stage3')}
                        className="hover:bg-emerald-50/30 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-blue-700 text-xs bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {task.task_id}
                          </span>
                          <span className="text-[10px] text-gray-400 block mt-1">
                            {task.start_date ? new Date(task.start_date).toLocaleDateString() : 'No date'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-gray-900 text-xs">
                          {task.product_name}
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-slate-800 text-xs">
                          <span className="bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 inline-block">
                            {proposed} Units
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-block text-xs">
                            {finished} Units
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {rejected > 0 ? (
                            <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-xs">
                              {rejected} Units
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[11px]">0</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {isFullyCompleted ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                              <Check size={11} /> 100% Target Met
                            </span>
                          ) : shortage > 0 ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                                <AlertTriangle size={11} className="text-amber-600" />
                                Shortage: {shortage} Units
                              </span>
                              <span className="text-[10px] text-gray-500 block">Reported to Store</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400">In Production</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setOutputModalTask(task);
                              setFinishedQtyInput(finished || proposed);
                              setRejectedQtyInput(rejected);
                              setShortageReason('');
                              setOutputNotes(task.notes || '');
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition text-xs shadow-xs"
                          >
                            {isFullyCompleted ? 'Update Output' : '✨ Record Output'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 🌟 7. RECORD OUTPUT & SHORTAGE REPORT MODAL */}
      {outputModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-4 border-b border-gray-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-gray-900 text-xs">Record Finished Goods & Shortage Report</h3>
                  <p className="text-[10px] text-gray-500 font-mono">Task ID: {outputModalTask.task_id}</p>
                </div>
              </div>
              <button
                onClick={() => setOutputModalTask(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveOutputAndShortage} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <p className="font-bold text-emerald-900 text-xs">{outputModalTask.product_name}</p>
                <p className="text-[11px] text-emerald-700">
                  Target Batch Quantity: <strong>{outputModalTask.proposed_quantity} Units</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-gray-700">
                      Finished Goods Output <span className="text-emerald-600 font-normal">(Store Inward)</span>
                    </label>
                    <span className="text-[10px] text-gray-400 font-bold">
                      Max: {outputModalTask.proposed_quantity} Units
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={outputModalTask.proposed_quantity}
                    required
                    value={finishedQtyInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      const proposed = parseInt(outputModalTask.proposed_quantity, 10) || 1;
                      if (val === '') {
                        setFinishedQtyInput('');
                        return;
                      }
                      const parsed = parseInt(val, 10);
                      const clamped = isNaN(parsed) ? 0 : Math.max(0, Math.min(proposed, parsed));
                      setFinishedQtyInput(clamped);
                      // Auto-calculate damaged/scrap as the remaining difference
                      const autoDamage = Math.max(0, proposed - clamped);
                      setRejectedQtyInput(autoDamage);
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl font-bold text-gray-900 text-center focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-gray-700">
                      Damaged / Defect Qty <span className="text-rose-500 font-normal">(Scrapped)</span>
                    </label>
                    <span className="text-[10px] text-rose-500 font-bold">
                      Max: {Math.max(0, (parseInt(outputModalTask.proposed_quantity, 10) || 0) - (parseInt(finishedQtyInput, 10) || 0))} Units
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={Math.max(0, (parseInt(outputModalTask.proposed_quantity, 10) || 0) - (parseInt(finishedQtyInput, 10) || 0))}
                    value={rejectedQtyInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      const proposed = parseInt(outputModalTask.proposed_quantity, 10) || 1;
                      const currentFinished = parseInt(finishedQtyInput, 10) || 0;
                      const maxDamage = Math.max(0, proposed - currentFinished);
                      if (val === '') {
                        setRejectedQtyInput('');
                        return;
                      }
                      const parsed = parseInt(val, 10);
                      const clamped = isNaN(parsed) ? 0 : Math.max(0, Math.min(maxDamage, parsed));
                      setRejectedQtyInput(clamped);
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl font-bold text-rose-700 text-center focus:ring-2 focus:ring-rose-500 text-xs"
                  />
                </div>
              </div>

              {/* Shortage Alert & Reason if Finished < Proposed */}
              {parseInt(finishedQtyInput, 10) < parseInt(outputModalTask.proposed_quantity, 10) && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                    <ShieldAlert size={15} className="text-amber-600" />
                    <span>
                      Shortage Warning: {parseInt(outputModalTask.proposed_quantity, 10) - (parseInt(finishedQtyInput, 10) || 0)} Units Short of Target
                    </span>
                  </div>
                  <label className="block text-[11px] font-semibold text-amber-800">
                    Reason for Shortage / Defect (Reported to Store & Management) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2 PCBA boards failed QC voltage test during assembly"
                    value={shortageReason}
                    onChange={(e) => setShortageReason(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">Production / QC Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Serial numbers, batch testing, or general QC remarks..."
                  value={outputNotes}
                  onChange={(e) => setOutputNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 text-xs focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setOutputModalTask(null)}
                  disabled={actionLoading}
                  className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Save & Credit Finished Stock in Store</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🌟 8. CREATE PRODUCTION MODAL */}
      <CreateProductionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          fetchTasks();
          setIsCreateOpen(false);
        }}
      />

      {/* 🌟 9. PRODUCTION DETAIL DRAWER */}
      <ProductionDetailDrawer
        isOpen={isDrawerOpen}
        taskId={selectedTaskId}
        initialTab={drawerInitialTab}
        onClose={handleCloseDrawer}
        onRefresh={fetchTasks}
      />
    </div>
  );
};
