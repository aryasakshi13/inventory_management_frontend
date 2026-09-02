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
  AlertCircle,
  ClipboardList,
  Check,
  RotateCcw
} from 'lucide-react';
import {
  getProductionTaskById,
  issueMaterialsToProduction,
  recordFinishedGoods,
  updateProductionStatus
} from '../services/productionService';

export const ProductionDetailDrawer = ({ isOpen, taskId, initialTab = 'stage1', onClose, onRefresh }) => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab); // 'stage1', 'stage2', 'stage3'
  const [issuingMaterials, setIssuingMaterials] = useState(false);

  // Record Output State
  const [finishedQtyInput, setFinishedQtyInput] = useState(0);
  const [rejectedQtyInput, setRejectedQtyInput] = useState(0);
  const [outputNotes, setOutputNotes] = useState('');
  const [savingOutput, setSavingOutput] = useState(false);
  const [outputSuccessMsg, setOutputSuccessMsg] = useState('');
  const [isEditingOutput, setIsEditingOutput] = useState(false);

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
        setOutputNotes(res.data.notes || '');
      }
    } catch (err) {
      console.error("Error loading task details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && taskId) {
      setActiveTab(initialTab || 'stage1');
      fetchTaskDetails();
    }
  }, [isOpen, taskId, initialTab]);

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
      setOutputSuccessMsg('');
      await recordFinishedGoods(task.id, {
        finished_quantity: parseInt(finishedQtyInput, 10) || 0,
        rejected_quantity: parseInt(rejectedQtyInput, 10) || 0,
        notes: outputNotes.trim() || null,
        mark_completed: parseInt(finishedQtyInput, 10) >= (task.proposed_quantity || 1)
      });
      setOutputSuccessMsg('Finished goods recorded and added to Store Inventory successfully!');
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
      case 'Material Issued':
        return 'bg-indigo-50 text-indigo-700 border-indigo-300';
      case 'Material Requested':
        return 'bg-amber-50 text-amber-700 border-amber-300';
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

        {/* 3-Stage Navigation Sub-Header Tabs */}
        <div className="flex items-center border-b border-gray-200 bg-white px-4 shrink-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('stage1')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'stage1'
                ? 'border-amber-500 text-amber-700 bg-amber-50/40'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 text-[10px] flex items-center justify-center font-bold">
              1
            </span>
            <span>BOM Material Request</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stage2')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'stage2'
                ? 'border-indigo-500 text-indigo-700 bg-indigo-50/40'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-800 text-[10px] flex items-center justify-center font-bold">
              2
            </span>
            <span>Store Material Dispatch</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stage3')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'stage3'
                ? 'border-emerald-500 text-emerald-700 bg-emerald-50/40'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center justify-center font-bold">
              3
            </span>
            <span>Finished Goods & Scrap</span>
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
          <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-gray-700">
            {/* 🌟 STAGE 1: BOM MATERIAL REQUISITION TAB */}
            {activeTab === 'stage1' && (
              <div className="space-y-4">
                {/* Meta details card */}
                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <ClipboardList size={14} className="text-amber-600" />
                      Stage 1: Production Batch & BOM Requisition
                    </span>
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                      Batch Target: {proposed} Units
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                    <div>
                      <span className="text-gray-400 text-[10px] block font-medium">Project In-charge</span>
                      <span className="font-bold text-gray-900">{task.assigned_to || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block font-medium">Timeline</span>
                      <span className="font-semibold text-gray-800">
                        {task.start_date ? new Date(task.start_date).toLocaleDateString() : 'N/A'} ➔{' '}
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Open'}
                      </span>
                    </div>
                  </div>

                  {task.notes && (
                    <div className="pt-2 border-t border-amber-200/60 text-[11px] text-gray-600">
                      <strong>Notes:</strong> {task.notes}
                    </div>
                  )}
                </div>

                {/* Requested Raw Materials list */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                      <Boxes size={14} className="text-indigo-600" />
                      BOM Materials Required for {proposed} Units
                    </h4>
                    <span className="text-[11px] text-gray-500 font-medium">
                      {items.length} Component Items
                    </span>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200">
                          <th className="py-2.5 px-3">Store Raw Material Item</th>
                          <th className="py-2.5 px-3 text-center">Required Qty</th>
                          <th className="py-2.5 px-3 text-center">Unit</th>
                          <th className="py-2.5 px-3 text-right">Available in Store</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {items.map((it) => (
                          <tr key={it.id}>
                            <td className="py-2.5 px-3 font-semibold text-gray-900">{it.item_name}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-indigo-700">
                              {it.required_qty}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-bold text-[10px]">
                                {it.unit}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span
                                className={`font-semibold ${
                                  (it.current_store_stock || 0) < it.required_qty
                                    ? 'text-rose-600'
                                    : 'text-slate-700'
                                }`}
                              >
                                {it.current_store_stock !== undefined ? `${it.current_store_stock} ${it.unit}` : 'Check Store'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Move to Stage 2 CTA */}
                <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-indigo-900 text-xs">Ready to dispatch materials from Store?</p>
                    <p className="text-[11px] text-indigo-700">Switch to Stage 2 to issue items from store inventory.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('stage2')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition cursor-pointer"
                  >
                    <span>Go to Stage 2: Dispatch</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* 🌟 STAGE 2: STORE MATERIAL DISPATCH TAB (STORE DISPATCH ONLY) */}
            {activeTab === 'stage2' && (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Send size={14} className="text-indigo-600" />
                      Stage 2: Store Material Dispatch & WIP
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                      allMaterialsIssued
                        ? 'bg-emerald-100 text-emerald-800'
                        : someMaterialsIssued
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {allMaterialsIssued ? 'Fully Dispatched from Store' : someMaterialsIssued ? 'Partially Dispatched' : 'Awaiting Store Dispatch'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600">
                    Raw materials are reviewed and dispatched exclusively by the <strong>Warehouse Manager</strong> from the Store module.
                  </p>

                  <div className="pt-1 flex items-center gap-2 text-indigo-800 text-[11px] font-semibold bg-indigo-100/70 p-2.5 rounded-xl border border-indigo-200">
                    <Boxes size={15} className="text-indigo-600 shrink-0" />
                    <span>Store Dispatch is read-only here. To dispatch materials, use the <strong>Store & Warehouse Operations</strong> page.</span>
                  </div>
                </div>

                {/* Items Dispatch Table */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200">
                        <th className="py-2.5 px-3">Item Name</th>
                        <th className="py-2.5 px-3 text-center">Required</th>
                        <th className="py-2.5 px-3 text-center">Dispatched by Store</th>
                        <th className="py-2.5 px-3 text-center">Dispatch Status</th>
                        <th className="py-2.5 px-3 text-right">Available in Store</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((it) => {
                        const isIssued = parseFloat(it.issued_qty) >= parseFloat(it.required_qty);
                        return (
                          <tr key={it.id}>
                            <td className="py-2.5 px-3 font-semibold text-gray-900">{it.item_name}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                              {it.required_qty} {it.unit}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-indigo-700">
                              {it.issued_qty || 0} {it.unit}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isIssued
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : 'bg-amber-50 text-amber-700 border-amber-300'
                                }`}
                              >
                                {isIssued ? 'Dispatched' : 'Pending Store Dispatch'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                              {it.current_store_stock !== undefined ? `${it.current_store_stock} ${it.unit}` : 'N/A'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Move to Stage 3 CTA */}
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-emerald-900 text-xs">Production In Progress / Assembly Complete?</p>
                    <p className="text-[11px] text-emerald-700">Switch to Stage 3 to record finished goods output and scrap.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('stage3')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition cursor-pointer"
                  >
                    <span>Go to Stage 3: Output</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* 🌟 STAGE 3: FINISHED GOODS & DAMAGE/SCRAP LOG TAB */}
            {activeTab === 'stage3' && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Package size={14} className="text-emerald-600" />
                      Stage 3: Production Output & Finished Goods Return
                    </span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                      {finished} / {proposed} Produced ({progressPercent}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          progressPercent >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-medium text-gray-500">
                      <span>Batch Target: <strong>{proposed} Units</strong></span>
                      <span>Finished Goods: <strong className="text-emerald-700">{finished} Units</strong></span>
                      <span>Scrap/Defects: <strong className="text-rose-600">{rejected} Units</strong></span>
                    </div>
                  </div>
                </div>

                {outputSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl font-semibold text-xs flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>{outputSuccessMsg}</span>
                  </div>
                )}

                {/* Output Submission Form OR Awaiting Dispatch Notice OR Recorded Summary Card */}
                {!someMaterialsIssued && !allMaterialsIssued && task.status !== 'Completed' ? (
                  <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-2.5 text-xs">
                    <div className="flex items-center gap-2 text-amber-900 font-bold">
                      <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                      <span>Awaiting Raw Materials Dispatch from Store</span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Finished goods output cannot be recorded yet because raw materials for this work order have <strong>NOT been issued/dispatched from Store inventory</strong>.
                    </p>
                    <p className="text-[11px] text-gray-600">
                      Warehouse Manager must review and dispatch the requested BOM materials from the Store module before assembly output can be recorded.
                    </p>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveTab('stage2')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
                      >
                        <span>Check Store Dispatch Tracking (Stage 2)</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                ) : (finished > 0 || rejected > 0 || (task.status || '').toLowerCase() === 'completed') && !isEditingOutput ? (
                  /* 🌟 Summary View when Output is already recorded */
                  <div className="p-5 bg-white border border-emerald-200 rounded-2xl space-y-4 shadow-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <div>
                          <h4 className="font-bold text-gray-900 text-xs">Finished Goods Output Recorded</h4>
                          <p className="text-[11px] text-gray-500">Output has been credited into Store Inventory</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFinishedQtyInput(finished || proposed);
                          setRejectedQtyInput(rejected || 0);
                          setOutputNotes(task.notes || '');
                          setIsEditingOutput(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-xl font-bold text-xs transition border border-slate-200 cursor-pointer"
                      >
                        <span>✏️ Update Output</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                        <span className="text-[10px] text-emerald-800 font-bold block uppercase">Finished Inwarded</span>
                        <span className="text-sm font-extrabold text-emerald-900">{finished} Units</span>
                      </div>
                      <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                        <span className="text-[10px] text-rose-800 font-bold block uppercase">Damaged / Scrap</span>
                        <span className="text-sm font-extrabold text-rose-900">{rejected} Units</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-600 font-bold block uppercase">Fulfillment</span>
                        <span className="text-sm font-extrabold text-slate-900">{progressPercent}% Completed</span>
                      </div>
                    </div>

                    {task.notes && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[10px] text-gray-500 font-bold uppercase block">Production / QC Remarks</span>
                        <p className="text-xs text-gray-800 whitespace-pre-line font-medium">{task.notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* 🌟 Output Submission Form */
                  <form
                    onSubmit={async (e) => {
                      await handleSaveOutput(e);
                      setIsEditingOutput(false);
                    }}
                    className="p-4 bg-white border border-gray-200 rounded-2xl space-y-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                        <Sparkles size={14} className="text-emerald-600" />
                        {isEditingOutput ? 'Update Finished Goods Record' : 'Record Finished Goods Output & Scrap'}
                      </h4>
                      {isEditingOutput && (
                        <button
                          type="button"
                          onClick={() => setIsEditingOutput(false)}
                          className="text-xs font-semibold text-gray-500 hover:text-gray-700 underline cursor-pointer"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold text-gray-700">
                            Finished Goods Output <span className="text-emerald-600 font-normal">(Store Inward)</span>
                          </label>
                          <span className="text-[10px] text-gray-400 font-bold">Max: {proposed} Units</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max={proposed}
                          required
                          value={finishedQtyInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              setFinishedQtyInput('');
                              return;
                            }
                            const parsed = parseInt(val, 10);
                            const clamped = isNaN(parsed) ? 0 : Math.max(0, Math.min(proposed, parsed));
                            setFinishedQtyInput(clamped);
                            // Auto calculate remaining damage
                            const autoDamage = Math.max(0, proposed - clamped);
                            setRejectedQtyInput(autoDamage);
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl font-bold text-gray-900 text-center focus:bg-white focus:ring-2 focus:ring-emerald-500 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold text-gray-700">
                            Damaged / Scrap Qty <span className="text-rose-500 font-normal">(Defects)</span>
                          </label>
                          <span className="text-[10px] text-rose-500 font-bold">
                            Max: {Math.max(0, proposed - (parseInt(finishedQtyInput, 10) || 0))} Units
                          </span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max={Math.max(0, proposed - (parseInt(finishedQtyInput, 10) || 0))}
                          value={rejectedQtyInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              setRejectedQtyInput('');
                              return;
                            }
                            const currentFinished = parseInt(finishedQtyInput, 10) || 0;
                            const maxDamage = Math.max(0, proposed - currentFinished);
                            const parsed = parseInt(val, 10);
                            const clamped = isNaN(parsed) ? 0 : Math.max(0, Math.min(maxDamage, parsed));
                            setRejectedQtyInput(clamped);
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl font-bold text-rose-700 text-center focus:bg-white focus:ring-2 focus:ring-rose-500 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-700">Production / QC Remarks</label>
                      <textarea
                        rows={2}
                        placeholder="Batch serial numbers, QC test confirmation, or defect reasons..."
                        value={outputNotes}
                        onChange={(e) => setOutputNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl text-gray-900 text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      {isEditingOutput && (
                        <button
                          type="button"
                          onClick={() => setIsEditingOutput(false)}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-xs transition"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={savingOutput}
                        className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition disabled:opacity-50 cursor-pointer text-xs"
                      >
                        {savingOutput ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>{isEditingOutput ? 'Update Finished Goods Record' : 'Save & Credit Finished Goods into Store Stock'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
