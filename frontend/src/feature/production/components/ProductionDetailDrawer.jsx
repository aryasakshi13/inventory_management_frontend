import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  Package,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Loader2,
  Calendar,
  User,
  Layers,
  ArrowRight,
  TrendingUp,
  Tag,
  Hash,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import {
  getProductionTaskById,
  issueMaterialsToProduction,
  recordFinishedGoods,
  updateProductionStatus
} from '../services/productionService';

export const ProductionDetailDrawer = ({ isOpen, taskId, onClose, onRefresh }) => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [issuingMaterials, setIssuingMaterials] = useState(false);

  // Record Output Modal State
  const [showOutputModal, setShowOutputModal] = useState(false);
  const [finishedQtyInput, setFinishedQtyInput] = useState(0);
  const [rejectedQtyInput, setRejectedQtyInput] = useState(0);
  const [outputNotes, setOutputNotes] = useState('');
  const [savingOutput, setSavingOutput] = useState(false);

  // Status updating state
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchTaskDetails = async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      const res = await getProductionTaskById(taskId);
      if (res?.data) {
        setTask(res.data);
        setFinishedQtyInput(res.data.finished_quantity || 0);
        setRejectedQtyInput(res.data.rejected_quantity || 0);
      }
    } catch (err) {
      console.error("Error loading task details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskDetails();
    }
  }, [isOpen, taskId]);

  if (!isOpen) return null;

  // Handle Full Store Material Issue
  const handleIssueAllMaterials = async () => {
    if (!window.confirm("Issue all required raw materials from Store Inventory to Production? This will automatically deduct the quantities from Store stock.")) {
      return;
    }
    try {
      setIssuingMaterials(true);
      await issueMaterialsToProduction(task.id, {});
      await fetchTaskDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error issuing materials:", err);
      alert(err.response?.data?.message || "Failed to issue materials from store.");
    } finally {
      setIssuingMaterials(false);
    }
  };

  // Handle Save Output
  const handleSaveOutput = async (e) => {
    e.preventDefault();
    try {
      setSavingOutput(true);
      await recordFinishedGoods(task.id, {
        finished_quantity: parseInt(finishedQtyInput, 10) || 0,
        rejected_quantity: parseInt(rejectedQtyInput, 10) || 0,
        notes: outputNotes.trim() || null,
        mark_completed: parseInt(finishedQtyInput, 10) >= (task.proposed_quantity || 1)
      });
      setShowOutputModal(false);
      await fetchTaskDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error recording finished goods:", err);
      alert(err.response?.data?.message || "Failed to record finished goods output.");
    } finally {
      setSavingOutput(false);
    }
  };

  // Handle Status Change
  const handleStatusChange = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      await updateProductionStatus(task.id, newStatus);
      await fetchTaskDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Calculations
  const proposed = task?.proposed_quantity || 1;
  const finished = task?.finished_quantity || 0;
  const rejected = task?.rejected_quantity || 0;
  const progressPercent = Math.min(100, Math.round((finished / proposed) * 100));

  const items = task?.items || [];
  const allMaterialsIssued = items.length > 0 && items.every((i) => parseFloat(i.issued_qty) >= parseFloat(i.required_qty));
  const someMaterialsIssued = items.some((i) => parseFloat(i.issued_qty) > 0);

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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-800 border border-blue-200">
                  {task?.task_id || taskId}
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(task?.status)}`}>
                  {task?.status || 'Loading...'}
                </span>
              </div>
              <h2 className="text-base font-bold text-gray-900 mt-1">
                {task?.product_name || 'Production Work Order'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 gap-2 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold">Loading production order details...</p>
          </div>
        ) : !task ? (
          <div className="flex-1 flex items-center justify-center p-8 text-gray-400 text-xs">
            Task details could not be found.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-gray-700">
            {/* 1. Production Overview Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-blue-600" />
                  Production Progress & Output
                </span>
                <span className="text-xs font-bold text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  {finished} / {proposed} Units ({progressPercent}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progressPercent >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-medium text-gray-500">
                  <span>Target: <strong>{proposed} Units</strong></span>
                  <span>Finished Goods: <strong className="text-emerald-700">{finished} Units</strong></span>
                  <span>Scrap/Defects: <strong className="text-rose-600">{rejected} Units</strong></span>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setShowOutputModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition cursor-pointer"
                >
                  <Package size={13} />
                  <span>Record Finished Goods Output</span>
                </button>

                {!allMaterialsIssued && (
                  <button
                    type="button"
                    onClick={handleIssueAllMaterials}
                    disabled={issuingMaterials}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    {issuingMaterials ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send size={13} />}
                    <span>Issue All Store Materials</span>
                  </button>
                )}

                {/* Status Dropdown Switcher */}
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-500 font-medium">Status:</span>
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updatingStatus}
                    className="px-2.5 py-1 bg-white border border-gray-300 rounded-lg font-bold text-gray-800 text-xs focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="Planned">Planned</option>
                    <option value="Material Requested">Material Requested</option>
                    <option value="Material Issued">Material Issued</option>
                    <option value="In Production">In Production</option>
                    <option value="Quality Check">Quality Check</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Order Metadata Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white border border-gray-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Priority</span>
                <span className="text-xs font-bold text-gray-900 mt-0.5 block">{task.priority}</span>
              </div>
              <div className="p-3 bg-white border border-gray-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Assigned Lead</span>
                <span className="text-xs font-semibold text-gray-900 mt-0.5 block truncate">
                  {task.assigned_to || 'Unassigned'}
                </span>
              </div>
              <div className="p-3 bg-white border border-gray-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Start Date</span>
                <span className="text-xs font-semibold text-gray-900 mt-0.5 block">
                  {task.start_date ? new Date(task.start_date).toLocaleDateString('en-IN') : '—'}
                </span>
              </div>
              <div className="p-3 bg-white border border-gray-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Due Date</span>
                <span className="text-xs font-semibold text-gray-900 mt-0.5 block">
                  {task.due_date ? new Date(task.due_date).toLocaleDateString('en-IN') : '—'}
                </span>
              </div>
            </div>

            {/* 3. Component Raw Material Items (Store Stock Request & Issue Table) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Boxes size={14} className="text-indigo-600" />
                  Store Raw Materials & Components ({items.length})
                </h3>
                <span className="text-[11px] text-gray-500 font-medium">
                  Status: {allMaterialsIssued ? (
                    <strong className="text-emerald-700">All Issued</strong>
                  ) : someMaterialsIssued ? (
                    <strong className="text-indigo-700">Partially Issued</strong>
                  ) : (
                    <strong className="text-amber-700">Pending Store Issue</strong>
                  )}
                </span>
              </div>

              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-3">Component Item</th>
                      <th className="py-2.5 px-3 text-center">Req. Qty</th>
                      <th className="py-2.5 px-3 text-center">Issued Qty</th>
                      <th className="py-2.5 px-3 text-center">Store Stock</th>
                      <th className="py-2.5 px-3 text-right">Item Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((it) => {
                      const isFullyIssued = parseFloat(it.issued_qty) >= parseFloat(it.required_qty);
                      const isPartially = parseFloat(it.issued_qty) > 0 && !isFullyIssued;
                      const hasStock = it.current_store_stock !== null && it.current_store_stock >= (it.required_qty - it.issued_qty);

                      return (
                        <tr key={it.id} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 font-semibold text-gray-900">
                            <div>{it.item_name}</div>
                            {it.store_category && (
                              <span className="text-[10px] text-gray-400 font-normal">{it.store_category}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-gray-900 font-mono">
                            {it.required_qty} {it.unit}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold font-mono">
                            <span className={isFullyIssued ? 'text-emerald-700' : isPartially ? 'text-indigo-600' : 'text-amber-600'}>
                              {it.issued_qty} {it.unit}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-medium font-mono text-gray-600">
                            {it.current_store_stock !== null ? (
                              <span className={hasStock ? 'text-emerald-700' : 'text-rose-600 font-bold'}>
                                {it.current_store_stock} {it.unit}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                                isFullyIssued
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : isPartially
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {isFullyIssued ? 'Issued' : isPartially ? 'Partial' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Notes Section */}
            {task.notes && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-gray-700 text-[10px] uppercase">Notes / Instructions:</span>
                <p className="text-gray-600 leading-relaxed">{task.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-gray-500">
            Created: {task?.created_at ? new Date(task.created_at).toLocaleDateString('en-IN') : '—'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Record Output Modal */}
      {showOutputModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-blue-600" />
                <h4 className="text-sm font-bold text-gray-900">Record Finished Goods Output</h4>
              </div>
              <button
                onClick={() => setShowOutputModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveOutput} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-blue-900">
                <p className="font-semibold text-xs">Product: {task?.product_name}</p>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  Target Planned Quantity: <strong>{task?.proposed_quantity} Units</strong>
                </p>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-gray-700">Total Finished Goods Assembled</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={finishedQtyInput}
                  onChange={(e) => setFinishedQtyInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl text-gray-900 font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-gray-700">Scrap / Defective Units</label>
                <input
                  type="number"
                  min="0"
                  value={rejectedQtyInput}
                  onChange={(e) => setRejectedQtyInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl text-gray-900 font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-gray-700">Assembly / Quality Notes</label>
                <textarea
                  rows={2}
                  placeholder="Testing passed, QC verified, or remarks..."
                  value={outputNotes}
                  onChange={(e) => setOutputNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowOutputModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingOutput}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition disabled:opacity-50"
                >
                  {savingOutput ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>Save Output</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
