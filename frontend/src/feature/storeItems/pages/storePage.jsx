import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  Download,
  Layers,
  Box,
  Wrench,
  Boxes,
  Send,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Check,
  X,
  Loader2,
  FileText,
  ChevronDown,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Calendar,
  Lock,
  History,
  RotateCcw,
  Sparkles,
  TrendingUp,
  ClipboardList
} from 'lucide-react';
import axios from 'axios';
import { useStoreItems } from '../hook/useStoreItem';
import { StoreItemsTable } from '../component/StoreItemtable';
import { AddEditStoreModal } from '../component/AddEditstoreModal';
import { exportWarehouseStockReport } from '../../../utils/exportReport';
import { getProductionTaskById, issueMaterialsToProduction, rejectProductionRequisition } from '../../production/services/productionService';

// Format quantities cleanly (remove unwanted float precision like 6.029999999999999)
const formatQty = (num) => {
  if (num === undefined || num === null) return '0';
  const n = parseFloat(num);
  if (isNaN(n)) return '0';
  return Number.isInteger(n) ? n.toString() : parseFloat(n.toFixed(2)).toString();
};

// Format date nicely (e.g. 09 Sep 2026, 11:30 AM)
const formatDate = (dateStr) => {
  if (!dateStr) return 'Recent';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Recent';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const StorePage = () => {
  const {
    items,
    categories,
    metrics,
    loading,
    isSubmitting,
    error,
    refetchItems,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    selectedItemType,
    setSelectedItemType,
    resetFilters,
    isModalOpen,
    editingItem,
    handleOpenCreate,
    handleOpenEdit,
    handleCloseModal,
    handleSaveItem,
    handleDeleteItem,
  } = useStoreItems();

  // Active Store Tab: 'master', 'requisitions', 'logs'
  const [storeTab, setStoreTab] = useState('master');

  // Production Tasks for Store Tabs
  const [productionTasks, setProductionTasks] = useState([]);
  const [loadingProduction, setLoadingProduction] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [storeActionMsg, setStoreActionMsg] = useState({ type: '', text: '' });

  // Rejection Modal State
  const [rejectModalTask, setRejectModalTask] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Partial Issue Modal State
  const [partialIssueTask, setPartialIssueTask] = useState(null);
  const [partialIssueQtys, setPartialIssueQtys] = useState({});
  const [isPartialSubmitting, setIsPartialSubmitting] = useState(false);

  // View Store Item Modal State
  const [viewingItem, setViewingItem] = useState(null);

  // View Items Modal State & Tab
  const [viewItemsModalTask, setViewItemsModalTask] = useState(null);
  const [viewModalTab, setViewModalTab] = useState('summary'); // 'summary' | 'history'

  // View Output Report Modal State & Filters
  const [viewOutputReportTask, setViewOutputReportTask] = useState(null);
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('all');

  // Fetch Production Tasks with detailed items
  const fetchStoreProductionData = useCallback(async () => {
    try {
      setLoadingProduction(true);
      const prodUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:5001/api/production'
        : 'https://www.namami-infotech.com/inventory/api/production';
      const res = await axios.get(prodUrl, { withCredentials: true }).catch(() => ({ data: [] }));
      const allTasks = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
          ? res.data.data
          : [];

      // Fetch detailed items for tasks
      const detailed = await Promise.all(
        allTasks.map(async (t) => {
          try {
            const dRes = await getProductionTaskById(t.id);
            return dRes?.data || t;
          } catch {
            return t;
          }
        })
      );
      setProductionTasks(detailed);
    } catch (err) {
      console.error("Error fetching store production data:", err);
    } finally {
      setLoadingProduction(false);
    }
  }, []);

  useEffect(() => {
    if (storeTab === 'requisitions' || storeTab === 'logs' || storeTab === 'reports') {
      fetchStoreProductionData();
    }
    refetchItems();
  }, [storeTab, fetchStoreProductionData, refetchItems]);

  // Handle Full Issue / Dispatch Materials from Store
  const handleAcceptDispatch = async (task) => {
    const taskItems = task.items || [];
    const outOfStock = taskItems.find((it) => {
      const remaining = Math.max(0, (parseFloat(it.required_qty) || 0) - (parseFloat(it.issued_qty) || 0));
      return remaining > 0 && (parseFloat(it.current_store_stock) || 0) <= 0;
    });
    if (outOfStock) {
      alert(`Cannot issue: Component "${outOfStock.item_name}" has 0 stock in warehouse. Use "Partial Issue" to dispatch available items or restock Store first.`);
      return;
    }

    if (!window.confirm(`Issue all remaining required BOM materials for "${task.task_id}" (${task.product_name})? This will deduct the items from Warehouse stock.`)) {
      return;
    }

    try {
      setProcessingId(task.id);
      setStoreActionMsg({ type: '', text: '' });
      await issueMaterialsToProduction(task.id, {});
      setStoreActionMsg({ type: 'success', text: `Materials successfully issued for ${task.task_id}! Warehouse stock has been deducted.` });
      await fetchStoreProductionData();
      refetchItems();
    } catch (err) {
      console.error("Error dispatching from store:", err);
      setStoreActionMsg({ type: 'error', text: err.response?.data?.message || "Failed to dispatch materials from store." });
    } finally {
      setProcessingId(null);
    }
  };

  // Open Partial Issue Modal
  const handleOpenPartialIssue = (task) => {
    const initialQtys = {};
    (task.items || []).forEach((it) => {
      const req = parseFloat(it.required_qty) || 0;
      const issued = parseFloat(it.issued_qty) || 0;
      const remaining = Math.max(0, req - issued);
      const stock = Math.max(0, parseFloat(it.current_store_stock) || 0);
      // Auto pre-fill with dispatchable quantity (up to remaining needed and available stock)
      initialQtys[it.id] = Math.min(remaining, stock);
    });
    setPartialIssueQtys(initialQtys);
    setPartialIssueTask(task);
  };

  // Confirm Partial Issue
  const handleConfirmPartialIssue = async (e) => {
    if (e) e.preventDefault();
    if (!partialIssueTask) return;

    const itemsToIssue = [];
    const taskItems = partialIssueTask.items || [];

    for (const it of taskItems) {
      const qty = parseFloat(partialIssueQtys[it.id]) || 0;
      if (qty > 0) {
        const req = parseFloat(it.required_qty) || 0;
        const issued = parseFloat(it.issued_qty) || 0;
        const remaining = Math.max(0, req - issued);
        const stock = parseFloat(it.current_store_stock) || 0;

        if (qty > stock) {
          alert(`Cannot dispatch ${qty} ${it.unit} for "${it.item_name}": only ${stock} available in warehouse.`);
          return;
        }
        if (qty > remaining) {
          alert(`Cannot dispatch ${qty} ${it.unit} for "${it.item_name}": only ${remaining} remaining needed.`);
          return;
        }

        itemsToIssue.push({
          item_id: it.id,
          issue_qty: qty,
        });
      }
    }

    if (itemsToIssue.length === 0) {
      alert("Please enter a dispatch quantity greater than 0 for at least one item.");
      return;
    }

    try {
      setIsPartialSubmitting(true);
      setStoreActionMsg({ type: '', text: '' });
      await issueMaterialsToProduction(partialIssueTask.id, { issue_items: itemsToIssue });
      setStoreActionMsg({
        type: 'success',
        text: `Partial materials successfully dispatched for ${partialIssueTask.task_id}! Warehouse stock has been deducted.`
      });
      setPartialIssueTask(null);
      await fetchStoreProductionData();
      refetchItems();
    } catch (err) {
      console.error("Error submitting partial issue:", err);
      setStoreActionMsg({
        type: 'error',
        text: err.response?.data?.message || "Failed to dispatch partial materials."
      });
    } finally {
      setIsPartialSubmitting(false);
    }
  };

  // Handle Reject Requisition
  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectModalTask) return;
    try {
      setIsRejecting(true);
      setStoreActionMsg({ type: '', text: '' });
      await rejectProductionRequisition(rejectModalTask.id, {
        rejection_reason: rejectionReason.trim() || 'Materials unavailable in Store'
      });
      setStoreActionMsg({
        type: 'success',
        text: `Requisition for ${rejectModalTask.task_id} has been Rejected and returned to Production floor.`
      });
      setRejectModalTask(null);
      setRejectionReason('');
      await fetchStoreProductionData();
    } catch (err) {
      console.error("Error rejecting requisition:", err);
      setStoreActionMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to reject material requisition.'
      });
    } finally {
      setIsRejecting(false);
    }
  };

  // Filter Tasks for Requisitions and Logs
  const pendingRequisitions = productionTasks.filter((t) => {
    const status = (t.status || 'planned').toLowerCase();
    if (status === 'completed' || status === 'material rejected') return false;
    const taskItems = t.items || [];
    const hasUnfulfilled = taskItems.length === 0 || taskItems.some((it) => (parseFloat(it.issued_qty) || 0) < (parseFloat(it.required_qty) || 0));
    return ['planned', 'material requested', 'partially issued'].includes(status) || hasUnfulfilled;
  });

  const dispatchedAndLogs = productionTasks.filter((t) =>
    ['material issued', 'in production', 'completed', 'material rejected', 'partially issued'].includes((t.status || '').toLowerCase()) ||
    parseFloat(t.total_issued_qty) > 0 ||
    parseFloat(t.finished_quantity) > 0
  );

  // Helper to parse notes for scrap, damaged items, and return to store details
  const parseTaskReportDetails = (notes = '') => {
    let remarksText = notes || '';
    let scrapText = '';
    let returnText = '';

    const scrapMatch = remarksText.match(/\[(?:RAW MATERIALS\s+)?SCRAP DETAILS\]:\s*([^\n\[]+)/i);
    if (scrapMatch) {
      scrapText = scrapMatch[1].trim();
    }

    const returnMatch = remarksText.match(/\[STORE RETURN DETAILS\]:\s*([^\n\[]+)/i);
    if (returnMatch) {
      returnText = returnMatch[1].trim();
    }

    remarksText = remarksText
      .replace(/\[(?:RAW MATERIALS\s+)?SCRAP DETAILS\]:[^\n\[]*/gi, '')
      .replace(/\[STORE RETURN DETAILS\]:[^\n\[]*/gi, '')
      .replace(/\[REQUISITION REJECTED BY STORE\]:[^\n\[]*/gi, '')
      .trim();

    return { remarksText, scrapText, returnText };
  };

  // Filter Tasks for Tab 4: Finished Goods & Damage Reports
  const outputReports = productionTasks.filter((t) => {
    const fin = parseFloat(t.finished_quantity) || 0;
    const rej = parseFloat(t.rejected_quantity) || 0;
    const notes = t.notes || '';
    const hasDetails = notes.includes('SCRAP DETAILS') || notes.includes('STORE RETURN DETAILS') || notes.includes('damaged') || notes.includes('returned');
    return fin > 0 || rej > 0 || hasDetails || (t.status || '').toLowerCase() === 'completed';
  });

  const filteredOutputReports = outputReports.filter((task) => {
    const q = reportSearchQuery.trim().toLowerCase();
    const { remarksText, scrapText, returnText } = parseTaskReportDetails(task.notes);

    const matchesSearch = !q || (
      (task.task_id || '').toLowerCase().includes(q) ||
      (task.product_name || '').toLowerCase().includes(q) ||
      (task.assigned_to || '').toLowerCase().includes(q) ||
      remarksText.toLowerCase().includes(q) ||
      scrapText.toLowerCase().includes(q) ||
      returnText.toLowerCase().includes(q)
    );

    const matchesStatus = reportStatusFilter === 'all' || (
      reportStatusFilter === 'completed' ? (task.status || '').toLowerCase() === 'completed' :
      reportStatusFilter === 'in_production' ? (task.status || '').toLowerCase() === 'in production' :
      true
    );

    return matchesSearch && matchesStatus;
  });

  const reportMetrics = {
    totalReports: outputReports.length,
    totalFinishedUnits: outputReports.reduce((acc, t) => acc + (parseFloat(t.finished_quantity) || 0), 0),
    totalDefectUnits: outputReports.reduce((acc, t) => acc + (parseFloat(t.rejected_quantity) || 0), 0),
    totalReturnEvents: outputReports.filter((t) => (t.notes || '').includes('STORE RETURN DETAILS')).length,
  };

  // Flatten tasks into individual dispatch history event rows for Tab 3
  const dispatchHistoryEntries = [];
  dispatchedAndLogs.forEach((task) => {
    const logs = Array.isArray(task.dispatch_logs) && task.dispatch_logs.length > 0
      ? task.dispatch_logs
      : null;

    if (logs && logs.length > 0) {
      // logs are in chronological order (log 0 is 1st partial issue, log 1 is 2nd partial issue, etc.)
      logs.forEach((log, idx) => {
        const items = Array.isArray(log.items_summary) ? log.items_summary : [];
        const isPartial = (log.dispatch_type || '').toLowerCase().includes('partial') || ((task.status || '').toLowerCase() === 'partially issued' && idx === logs.length - 1);

        // Only include logs up to this specific delivery event (Slice history)
        const logsUpToThisDelivery = logs.slice(0, idx + 1);

        // Calculate cumulative issued quantities up to this delivery for the summary view
        const cumulativeIssuedMap = {};
        logsUpToThisDelivery.forEach((l) => {
          (l.items_summary || []).forEach((it) => {
            const key = it.item_name || it.item_id;
            cumulativeIssuedMap[key] = (cumulativeIssuedMap[key] || 0) + (parseFloat(it.qty) || 0);
          });
        });

        const itemsUpToThisDelivery = (task.items || []).map((it) => {
          const key = it.item_name || it.id;
          const cumulativeIssued = cumulativeIssuedMap[key] !== undefined
            ? cumulativeIssuedMap[key]
            : (parseFloat(it.issued_qty) || 0);
          return {
            ...it,
            issued_qty: cumulativeIssued
          };
        });

        const taskForThisEntry = {
          ...task,
          items: itemsUpToThisDelivery,
          dispatch_logs: logsUpToThisDelivery,
          current_dispatch_title: log.dispatch_type || `Partial Issue #${idx + 1}`,
          current_log_index: idx + 1,
          total_logs_count: logs.length
        };

        const batchSentQty = items.reduce((acc, it) => acc + (parseFloat(it.qty) || 0), 0);
        const totalCumulativeIssued = itemsUpToThisDelivery.reduce((acc, it) => acc + (parseFloat(it.issued_qty) || 0), 0);
        const totalRequiredQty = (task.items || []).reduce((acc, it) => acc + (parseFloat(it.required_qty) || 0), 0);

        const isFullyDispatchedUpToHere = totalRequiredQty > 0 && totalCumulativeIssued >= (totalRequiredQty - 0.0001);
        const batchStatus = isFullyDispatchedUpToHere ? 'Fully Dispatched' : 'Partially Issued';

        dispatchHistoryEntries.push({
          id: `log-${task.id}-${log.id || idx}`,
          task_id: task.task_id,
          product_name: task.product_name,
          proposed_quantity: task.proposed_quantity,
          dispatch_type: log.dispatch_type || `Partial Issue #${idx + 1}`,
          dispatched_by: log.dispatched_by || task.assigned_to || 'Store Manager',
          date: log.created_at || task.start_date || task.created_at,
          items: items,
          batchSentQty,
          totalCumulativeIssued,
          totalRequiredQty,
          notes: log.notes || task.notes || '',
          status: batchStatus,
          taskForThisEntry: taskForThisEntry,
          isLogEntry: true
        });
      });
    } else {
      // Legacy task or task without explicit logs (e.g. Material Rejected)
      const isRejected = (task.status || '').toLowerCase() === 'material rejected';
      const taskItems = task.items || [];
      const totalIssued = taskItems.reduce((acc, it) => acc + (parseFloat(it.issued_qty) || 0), 0);
      const totalRequired = taskItems.reduce((acc, it) => acc + (parseFloat(it.required_qty) || 0), 0);

      dispatchHistoryEntries.push({
        id: `task-${task.id}`,
        task_id: task.task_id,
        product_name: task.product_name,
        proposed_quantity: task.proposed_quantity,
        dispatch_type: isRejected ? 'Rejected' : (parseFloat(task.total_issued_qty) > 0 ? 'Full Issue' : 'Planned'),
        dispatched_by: task.assigned_to || 'Store Manager',
        date: task.start_date || task.created_at,
        items: taskItems.filter(i => (parseFloat(i.issued_qty) || 0) > 0).map(i => ({ item_name: i.item_name, qty: i.issued_qty, unit: i.unit })),
        batchSentQty: totalIssued,
        totalCumulativeIssued: totalIssued,
        totalRequiredQty: totalRequired,
        notes: task.notes || '',
        status: task.status,
        taskForThisEntry: task,
        isLogEntry: false
      });
    }
  });

  // Sort by date descending (latest first)
  dispatchHistoryEntries.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  return (
    <div className="space-y-4 sm:space-y-5 max-w-7xl mx-auto text-xs">
      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            onClick={refetchItems}
            className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 font-semibold rounded-lg text-[11px] transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Action Notification Alert */}
      {storeActionMsg.text && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2 font-semibold text-xs animate-in fade-in ${storeActionMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
            }`}
        >
          {storeActionMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{storeActionMsg.text}</span>
        </div>
      )}

      {/* 🌟 1. PAGE TABS - BOM / BOQ Style */}
      <div className="bg-white border border-slate-200 px-4 sm:px-6 pt-3 sm:pt-4 rounded-xl shadow-xs">
        <div className="flex gap-4 sm:gap-8 overflow-x-auto">
          {/* TAB 1: STORE INVENTORY MASTER */}
          <button
            type="button"
            onClick={() => setStoreTab('master')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${storeTab === 'master'
                ? 'text-blue-600 border-blue-600 font-semibold'
                : 'text-slate-500 border-transparent hover:text-slate-800'
              }`}
          >
            <span>Store Inventory Master</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${storeTab === 'master' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                }`}
            >
              {items.length}
            </span>
          </button>

          {/* TAB 2: MATERIAL REQUEST TO DISPATCH */}
          <button
            type="button"
            onClick={() => setStoreTab('requisitions')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${storeTab === 'requisitions'
                ? 'text-blue-600 border-blue-600 font-semibold'
                : 'text-slate-500 border-transparent hover:text-slate-800'
              }`}
          >
            <span>Material Request to Dispatch</span>
            {pendingRequisitions.length > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                {pendingRequisitions.length}
              </span>
            ) : (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${storeTab === 'requisitions' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                  }`}
              >
                0
              </span>
            )}
          </button>

          {/* TAB 3: DISPATCH HISTORY & PRODUCTION LOGS */}
          <button
            type="button"
            onClick={() => setStoreTab('logs')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${storeTab === 'logs'
                ? 'text-blue-600 border-blue-600 font-semibold'
                : 'text-slate-500 border-transparent hover:text-slate-800'
              }`}
          >
            <span>Dispatch History & Production Logs</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${storeTab === 'logs' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                }`}
            >
              {dispatchedAndLogs.length}
            </span>
          </button>

          {/* TAB 4: FINISHED GOODS & DAMAGE REPORTS */}
          <button
            type="button"
            onClick={() => setStoreTab('reports')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${storeTab === 'reports'
                ? 'text-blue-600 border-blue-600 font-semibold'
                : 'text-slate-500 border-transparent hover:text-slate-800'
              }`}
          >
            <span>Finished Goods & Damage Reports</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${storeTab === 'reports' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                }`}
            >
              {outputReports.length}
            </span>
          </button>
        </div>
      </div>

      {/* 🌟 2. TAB 1 CONTENT: STORE INVENTORY MASTER */}
      {storeTab === 'master' && (
        <div className="space-y-4">
          {/* Classification Filter Tabs & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedItemType('all')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${selectedItemType === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
              >
                <Package size={14} />
                All Store Items ({metrics.total})
              </button>

              <button
                type="button"
                onClick={() => setSelectedItemType('raw_material')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${selectedItemType === 'raw_material'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
                  }`}
              >
                <Layers size={14} />
                Raw Materials / Components ({metrics.rawCount || 0})
              </button>

              <button
                type="button"
                onClick={() => setSelectedItemType('finished_good')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${selectedItemType === 'finished_good'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-200'
                  }`}
              >
                <Box size={14} />
                Finished Goods ({metrics.finishedCount || 0})
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => exportWarehouseStockReport(items)}
                title="Download Warehouse Stock Report (.xlsx)"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition shadow-xs cursor-pointer text-xs"
              >
                <Download size={14} /> Export Report
              </button>

              <button
                type="button"
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-xs cursor-pointer text-xs"
              >
                <Plus size={14} /> Add Store Item
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Search Item</label>
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search item name, product link, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-1.5 border border-gray-300 rounded-lg text-gray-900 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-1.5 border border-gray-300 rounded-lg text-gray-900 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              >
                <option value="">All Statuses</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg font-semibold text-gray-700 transition cursor-pointer"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Reset Filters
              </button>
            </div>
          </div>

          {/* Table */}
          <StoreItemsTable
            items={items}
            onEdit={handleOpenEdit}
            onView={(item) => setViewingItem(item)}
            loading={loading}
          />
        </div>
      )}

      {/* 🌟 4. TAB 2 CONTENT: PRODUCTION MATERIAL REQUISITIONS (REJECT / ISSUE / PARTIAL ISSUE) */}
      {storeTab === 'requisitions' && (
        <div className="space-y-4">
          {loadingProduction ? (
            <div className="p-12 bg-white rounded-2xl border border-gray-200 text-center text-gray-400 flex flex-col items-center gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
              <span className="font-semibold">Loading material requisitions & checking warehouse stocks...</span>
            </div>
          ) : pendingRequisitions.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-gray-200 text-center text-gray-400 space-y-2">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
              <p className="text-sm font-bold text-gray-700">All Material Requests Fulfilled</p>
              <p className="text-xs text-gray-400">There are no pending raw material requisitions from the Production floor.</p>
            </div>
          ) : (
            pendingRequisitions.map((task) => {
              const taskItems = task.items || [];
              const isTaskPartiallyIssued =
                (task.status || '').toLowerCase() === 'partially issued' ||
                taskItems.some((it) => (parseFloat(it.issued_qty) || 0) > 0);

              const outOfStockItems = taskItems.filter((it) => {
                const req = parseFloat(it.required_qty) || 0;
                const iss = parseFloat(it.issued_qty) || 0;
                const rem = Math.max(0, req - iss);
                return rem > 0 && (parseFloat(it.current_store_stock) || 0) <= 0;
              });

              const insufficientItems = taskItems.filter((it) => {
                const req = parseFloat(it.required_qty) || 0;
                const iss = parseFloat(it.issued_qty) || 0;
                const rem = Math.max(0, req - iss);
                const stock = parseFloat(it.current_store_stock) || 0;
                return rem > 0 && stock > 0 && stock < rem;
              });

              const hasZeroStock = outOfStockItems.length > 0;
              const hasInsufficient = insufficientItems.length > 0;
              const isProcessing = processingId === task.id;

              return (
                <div
                  key={task.id}
                  className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4 hover:border-indigo-300 transition"
                >
                  {/* Task Header & Reject / Issue / Partial Issue Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono font-bold text-blue-700 text-xs whitespace-nowrap bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {task.task_id}
                        </span>
                        <span className="font-bold text-gray-900 text-sm">{task.product_name}</span>
                        <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                          • Batch Target: {task.proposed_quantity} Units
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          • In-charge: <strong>{task.assigned_to || 'Unassigned'}</strong>
                        </span>

                        {isTaskPartiallyIssued && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock size={12} className="text-amber-600" />
                            Partially Issued
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 3 Action Buttons: Reject, Issue (Full), Partial Issue */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      {/* 1. Reject Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setRejectModalTask(task);
                          setRejectionReason(hasZeroStock ? `Component "${outOfStockItems[0]?.item_name}" is Out of Stock in warehouse.` : '');
                        }}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold transition cursor-pointer text-xs"
                      >
                        <XCircle size={14} className="text-rose-600" />
                        <span>Reject</span>
                      </button>

                      {/* 2. Issue Button (Full Dispatch) - Disabled once Partial Issue has started */}
                      {isTaskPartiallyIssued ? (
                        <div
                          title="This requisition is already partially issued. Use 'Partial Issue' to dispatch remaining quantities."
                          className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl font-semibold text-xs flex items-center gap-1.5 cursor-not-allowed select-none"
                        >
                          <Lock size={12} className="text-slate-400" />
                          <span>Issue (Locked)</span>
                        </div>
                      ) : hasZeroStock ? (
                        <div
                          title="Cannot full issue: Some required BOM components have 0 stock. Use 'Partial Issue' instead."
                          className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-not-allowed opacity-80"
                        >
                          <AlertCircle size={13} className="text-rose-600" />
                          <span>Issue (0 Stock)</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAcceptDispatch(task)}
                          disabled={isProcessing}
                          title="Issue all required BOM materials at once"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition disabled:opacity-50 cursor-pointer text-xs"
                        >
                          {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 size={14} />}
                          <span>Issue</span>
                        </button>
                      )}

                      {/* 3. Partial Issue Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenPartialIssue(task)}
                        disabled={isProcessing}
                        title="Issue custom / partial quantities for required items"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition disabled:opacity-50 cursor-pointer text-xs"
                      >
                        <Layers size={14} />
                        <span>Partial Issue</span>
                      </button>
                    </div>
                  </div>

                  {/* Components Breakdown Table with Partial Tracking */}
                  <div className="overflow-x-auto rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200">
                          <th className="py-2.5 px-3">Required Raw Material Item</th>
                          <th className="py-2.5 px-3 text-center">Ordered / Req. Qty</th>
                          <th className="py-2.5 px-3 text-center">Dispatched Qty</th>
                          <th className="py-2.5 px-3 text-center">Remaining to Issue</th>
                          <th className="py-2.5 px-3 text-center">Available in Store</th>
                          <th className="py-2.5 px-3 text-right">Dispatch Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {taskItems.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-3 px-3 text-center text-gray-400 italic">
                              No component item specifications found.
                            </td>
                          </tr>
                        ) : (
                          taskItems.map((it) => {
                            const req = parseFloat(it.required_qty) || 0;
                            const iss = parseFloat(it.issued_qty) || 0;
                            const rem = Math.max(0, req - iss);
                            const stock = parseFloat(it.current_store_stock) || 0;
                            const isFullyIssued = iss >= req && req > 0;
                            const isZero = rem > 0 && stock <= 0;
                            const isLow = rem > 0 && stock > 0 && stock < rem;

                            return (
                              <tr key={it.id} className={isZero ? 'bg-rose-50/30' : isFullyIssued ? 'bg-emerald-50/20' : ''}>
                                <td className="py-2.5 px-3 font-semibold text-gray-900">
                                  {it.item_name}
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                                  {formatQty(req)} {it.unit}
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold text-indigo-700">
                                  {formatQty(iss)} {it.unit}
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold">
                                  <span className={`px-2 py-0.5 rounded text-[11px] ${rem === 0 ? 'text-gray-400 font-normal' : 'text-amber-700 bg-amber-50 font-bold border border-amber-200'}`}>
                                    {formatQty(rem)} {it.unit}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                                  <span
                                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${stock <= 0
                                        ? 'bg-rose-100 text-rose-700'
                                        : stock < rem
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-emerald-100 text-emerald-800'
                                      }`}
                                  >
                                    {formatQty(stock)} {it.unit}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-semibold">
                                  {isFullyIssued ? (
                                    <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                      ✅ Fully Dispatched
                                    </span>
                                  ) : isZero ? (
                                    <span className="text-rose-600 font-bold text-[10px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                      ❌ Out of Stock (0 In Store)
                                    </span>
                                  ) : isLow ? (
                                    <span className="text-amber-700 font-bold text-[10px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                      ⚠️ Partial Stock ({stock}/{rem})
                                    </span>
                                  ) : iss > 0 ? (
                                    <span className="text-blue-700 font-bold text-[10px] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                      ⚡ Partially Dispatched ({iss}/{req})
                                    </span>
                                  ) : (
                                    <span className="text-slate-600 font-bold text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                      🕒 Pending Dispatch
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 🌟 5. TAB 3 CONTENT: DISPATCH HISTORY & PRODUCTION LOGS */}
      {storeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-emerald-50/40 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              <div>
                <h3 className="font-bold text-gray-900 text-xs">Dispatched Work Orders & Material Logs History</h3>
                <p className="text-[11px] text-gray-500">
                  Track every full and partial material dispatch batch, quantities issued, timestamps, and current order status.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
              {dispatchHistoryEntries.length} Tracked Dispatches
            </span>
          </div>

          {loadingProduction ? (
            <div className="p-10 flex flex-col items-center justify-center gap-2 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <p className="font-medium text-xs">Loading dispatch logs...</p>
            </div>
          ) : dispatchHistoryEntries.length === 0 ? (
            <div className="p-10 text-center text-gray-400 space-y-2">
              <Truck className="w-10 h-10 mx-auto text-gray-300" />
              <p className="text-sm font-bold text-gray-700">No Dispatched Production Logs Found</p>
              <p className="text-xs text-gray-400">When materials are issued to production, their progress will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 whitespace-nowrap">Task ID</th>
                    <th className="py-3 px-4 whitespace-nowrap">Dispatch Event</th>
                    <th className="py-3 px-4 whitespace-nowrap">Dispatch Date & Time</th>
                    <th className="py-3 px-4 whitespace-nowrap">Finished Product</th>
                    <th className="py-3 px-4 whitespace-nowrap">Dispatch Summary</th>
                    <th className="py-3 px-4 whitespace-nowrap">Batch Status</th>
                    <th className="py-3 px-4 whitespace-nowrap">Dispatched By</th>
                    <th className="py-3 px-4 text-center whitespace-nowrap w-16">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dispatchHistoryEntries.map((entry) => {
                    const statusLower = (entry.status || '').toLowerCase();
                    const isRejected = statusLower === 'material rejected';
                    const isPartial = statusLower === 'partially issued' || entry.dispatch_type.toLowerCase().includes('partial');

                    return (
                      <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* 1. Task ID */}
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-700 text-xs whitespace-nowrap">
                          {entry.task_id}
                        </td>

                        {/* 2. Dispatch Event Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border inline-flex items-center gap-1 ${isRejected
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : isPartial
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                          >
                            ⚡ {entry.dispatch_type}
                          </span>
                        </td>

                        {/* 3. Dispatch Date & Time */}
                        <td className="py-3.5 px-4 text-slate-700 font-medium text-xs whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-slate-400" />
                            <span>{formatDate(entry.date)}</span>
                          </div>
                        </td>

                        {/* 4. Finished Product */}
                        <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                          <span className="font-bold text-gray-900 block">{entry.product_name}</span>
                          <span className="text-[10px] text-gray-400 font-semibold block">Target: {entry.proposed_quantity} Units</span>
                        </td>

                        {/* 5. Dispatch Summary (e.g. 2 / 4 Units, 4 / 4 Units) - Clickable with rich tooltip */}
                        <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                          {entry.totalRequiredQty > 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                setViewItemsModalTask(entry.taskForThisEntry);
                                setViewModalTab('history');
                              }}
                              className="inline-flex items-center gap-1.5 cursor-pointer hover:opacity-85 transition group text-left"
                              title={`Dispatched: ${formatQty(entry.totalCumulativeIssued)} / ${formatQty(entry.totalRequiredQty)} Units\nBatch Dispatched: +${formatQty(entry.batchSentQty)}\n\nItems Breakdown:\n${(entry.items || []).map((it) => `• ${it.item_name}: +${formatQty(it.qty)} ${it.unit} (${formatQty(it.new_total_issued || it.qty)}/${formatQty(it.required_qty || 0)} ${it.unit})`).join('\n')}\n\n👉 Click to view complete history breakdown`}
                            >
                              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 inline-flex items-center gap-1 text-[11px] group-hover:bg-indigo-100 transition shadow-2xs">
                                {formatQty(entry.totalCumulativeIssued)} / {formatQty(entry.totalRequiredQty)} Units
                              </span>
                              {entry.batchSentQty > 0 && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 group-hover:bg-emerald-100 transition">
                                  +{formatQty(entry.batchSentQty)}
                                </span>
                              )}
                            </button>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">—</span>
                          )}
                        </td>

                        {/* 6. Status Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-block ${isRejected
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : entry.status === 'Fully Dispatched' || statusLower === 'completed' || statusLower === 'in production'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}
                          >
                            {entry.status}
                          </span>
                        </td>

                        {/* 7. Dispatched By */}
                        <td className="py-3.5 px-4 text-slate-700 font-semibold text-xs whitespace-nowrap">
                          {entry.dispatched_by}
                        </td>

                        {/* 8. Action: View Details Icon */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setViewItemsModalTask(entry.taskForThisEntry);
                              setViewModalTab('history');
                            }}
                            title="View Dispatch History up to this delivery"
                            className="p-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-bold rounded-lg transition text-xs border border-slate-300 shadow-2xs cursor-pointer inline-flex items-center justify-center"
                          >
                            <Eye size={15} />
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

      {/* 🌟 5. TAB 4 CONTENT: FINISHED GOODS & DAMAGE / RETURN REPORTS */}
      {storeTab === 'reports' && (
        <div className="space-y-4">
          {/* Top KPI Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <FileText size={20} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase block">Total Output Reports</span>
                <span className="text-base font-extrabold text-gray-900">{reportMetrics.totalReports}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase block">Finished Goods (Inwarded)</span>
                <span className="text-base font-extrabold text-emerald-700">{reportMetrics.totalFinishedUnits} Units</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <AlertTriangle size={20} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase block">Scrapped / Defects (FG)</span>
                <span className="text-base font-extrabold text-rose-700">{reportMetrics.totalDefectUnits} Units</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <RotateCcw size={20} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase block">Returned to Store Events</span>
                <span className="text-base font-extrabold text-blue-700">{reportMetrics.totalReturnEvents} Batches</span>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Search Output Reports</label>
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search task ID, product name, damaged items, returned items, remarks..."
                  value={reportSearchQuery}
                  onChange={(e) => setReportSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-gray-900 outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Production Status</label>
              <select
                value={reportStatusFilter}
                onChange={(e) => setReportStatusFilter(e.target.value)}
                className="w-full p-1.5 border border-gray-300 rounded-lg text-gray-900 outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="in_production">In Production</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setReportSearchQuery('');
                  setReportStatusFilter('all');
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg font-semibold text-gray-700 transition cursor-pointer"
              >
                <RefreshCw size={13} className={loadingProduction ? "animate-spin" : ""} /> Reset Filters
              </button>
            </div>
          </div>

          {/* Reports Table */}
          {loadingProduction ? (
            <div className="p-12 bg-white rounded-2xl border border-gray-200 text-center text-gray-400 flex flex-col items-center gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-purple-600" />
              <span className="font-semibold">Loading Finished Goods & Damage reports...</span>
            </div>
          ) : filteredOutputReports.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-gray-200 text-center text-gray-400 space-y-2">
              <FileText className="w-12 h-12 mx-auto text-gray-300" />
              <p className="text-sm font-bold text-gray-700">No Finished Goods or Damage Reports Found</p>
              <p className="text-xs text-gray-400">Production output reports, damaged component logs, and returned items will appear here once submitted.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200">
                    <th className="py-3 px-3">Task ID</th>
                    <th className="py-3 px-3">Product Name</th>
                    <th className="py-3 px-3 text-center">Batch Target</th>
                    <th className="py-3 px-3 text-center">Finished Goods</th>
                    <th className="py-3 px-3 text-center">Damaged Units</th>
                    <th className="py-3 px-3 text-center">Damaged Items (BOM)</th>
                    <th className="py-3 px-3 text-center">Returned to Store</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredOutputReports.map((task) => {
                    const fin = parseFloat(task.finished_quantity) || 0;
                    const proposed = parseFloat(task.proposed_quantity) || 1;
                    const rawRej = parseFloat(task.rejected_quantity) || 0;
                    const rej = rawRej > 0 ? rawRej : Math.max(0, proposed - fin);
                    const { remarksText, scrapText, returnText } = parseTaskReportDetails(task.notes);
                    const scrapCount = scrapText ? scrapText.split(',').length : 0;
                    const returnCount = returnText ? returnText.split(',').length : 0;

                    return (
                      <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* 1. Task ID */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-xs">
                            {task.task_id}
                          </span>
                        </td>

                        {/* 2. Product Name */}
                        <td className="py-3 px-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{task.product_name}</span>
                            <span className="text-[10px] text-gray-400">By: {task.assigned_to || 'Production Team'}</span>
                          </div>
                        </td>

                        {/* 3. Batch Target */}
                        <td className="py-3 px-3 text-center font-bold text-slate-700 whitespace-nowrap">
                          {proposed} Units
                        </td>

                        {/* 4. Finished Goods (Store Inward) */}
                        <td className="py-3 px-3 text-center whitespace-nowrap font-bold text-emerald-700">
                          {fin} Units
                        </td>

                        {/* 5. Damaged FG (Defects) */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`font-bold ${rej > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                            {rej} Units
                          </span>
                        </td>

                        {/* 6. Damaged Raw Materials - Just number */}
                        <td className="py-3 px-3 text-center whitespace-nowrap font-bold">
                          {scrapCount > 0 ? (
                            <span className="text-rose-600 text-xs">{scrapCount}</span>
                          ) : (
                            <span className="text-gray-400 font-medium">0</span>
                          )}
                        </td>

                        {/* 7. Returned to Store Raw Materials - Just number */}
                        <td className="py-3 px-3 text-center whitespace-nowrap font-bold">
                          {returnCount > 0 ? (
                            <span className="text-blue-600 text-xs">{returnCount}</span>
                          ) : (
                            <span className="text-gray-400 font-medium">0</span>
                          )}
                        </td>

                        {/* 8. Status */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            (task.status || '').toLowerCase() === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {task.status}
                          </span>
                        </td>

                        {/* 9. Action: View Details */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setViewOutputReportTask(task)}
                            title="View Complete Finished Goods, Damage Report & Remarks"
                            className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg transition border border-purple-200 cursor-pointer text-xs"
                          >
                            <Eye size={13} />
                            <span>View</span>
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

      {/* 🌟 View Dispatched Items & Dispatch History Modal */}
      {viewItemsModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl overflow-hidden p-5 space-y-4 max-h-[88vh] flex flex-col text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
                  <Boxes size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 text-sm">
                      BOM Material Dispatch & History
                    </h3>
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                      {viewItemsModalTask.task_id}
                    </span>
                    {viewItemsModalTask.current_dispatch_title && (
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 text-[11px] inline-flex items-center gap-1">
                        ⚡ {viewItemsModalTask.current_dispatch_title}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Product: <strong>{viewItemsModalTask.product_name}</strong> | Batch Target: <strong>{viewItemsModalTask.proposed_quantity} Units</strong> | Status: <strong className="text-indigo-700">{viewItemsModalTask.status}</strong>
                    {viewItemsModalTask.current_log_index && viewItemsModalTask.total_logs_count > 1 && (
                      <span className="ml-2 text-indigo-600 font-bold">
                        (Showing Event {viewItemsModalTask.current_log_index} of {viewItemsModalTask.total_logs_count})
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewItemsModalTask(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Inner Tabs Switcher: Summary vs Dispatch Logs History */}
            <div className="flex items-center gap-3 border-b border-gray-200 shrink-0">
              <button
                type="button"
                onClick={() => setViewModalTab('summary')}
                className={`pb-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${viewModalTab === 'summary'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
              >
                <Boxes size={13} />
                <span>Raw Materials Summary</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-semibold">
                  {(viewItemsModalTask.items || []).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setViewModalTab('history')}
                className={`pb-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${viewModalTab === 'history'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
              >
                <History size={13} />
                <span>Dispatch Logs & Batch History</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${(viewItemsModalTask.dispatch_logs || []).length > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                  {(viewItemsModalTask.dispatch_logs || []).length}
                </span>
              </button>
            </div>

            {/* Modal Body: Tab 1 (Summary Breakdown) */}
            {viewModalTab === 'summary' && (
              <div className="overflow-y-auto flex-1 rounded-xl border border-gray-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200">
                      <th className="py-2.5 px-3">Item Name</th>
                      <th className="py-2.5 px-3 text-center">Ordered / Req. Qty</th>
                      <th className="py-2.5 px-3 text-center">Total Dispatched</th>
                      <th className="py-2.5 px-3 text-center">Remaining Needed</th>
                      <th className="py-2.5 px-3 text-center">Dispatch Status</th>
                      <th className="py-2.5 px-3 text-right">Store Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {(viewItemsModalTask.items || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-gray-400 italic">
                          No component items found.
                        </td>
                      </tr>
                    ) : (
                      (viewItemsModalTask.items || []).map((it) => {
                        const req = parseFloat(it.required_qty) || 0;
                        const iss = parseFloat(it.issued_qty) || 0;
                        const rem = Math.max(0, req - iss);
                        const isFullyIssued = iss >= req && req > 0;

                        return (
                          <tr key={it.id}>
                            <td className="py-2.5 px-3 font-semibold text-gray-900">{it.item_name}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                              {formatQty(req)} {it.unit}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-indigo-700">
                              {formatQty(iss)} {it.unit}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold">
                              <span className={`px-2 py-0.5 rounded text-[11px] ${rem === 0 ? 'text-gray-400 font-normal' : 'text-amber-700 bg-amber-50 font-bold border border-amber-200'}`}>
                                {formatQty(rem)} {it.unit}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isFullyIssued
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : iss > 0
                                      ? 'bg-blue-50 text-blue-700 border-blue-300'
                                      : 'bg-amber-50 text-amber-700 border-amber-300'
                                  }`}
                              >
                                {isFullyIssued ? 'Fully Dispatched' : iss > 0 ? 'Partially Dispatched' : 'Pending'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                              {it.current_store_stock !== undefined ? `${formatQty(it.current_store_stock)} ${it.unit}` : 'N/A'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Modal Body: Tab 2 (Dispatch Logs & Batch History) */}
            {viewModalTab === 'history' && (
              <div className="overflow-y-auto flex-1 space-y-3">
                {(!viewItemsModalTask.dispatch_logs || viewItemsModalTask.dispatch_logs.length === 0) ? (
                  <div className="p-8 text-center text-gray-400 bg-slate-50 rounded-xl border border-gray-200 space-y-2">
                    <History className="w-8 h-8 mx-auto text-gray-300" />
                    <p className="font-bold text-gray-700 text-xs">No Individual Batch Dispatch Logs Found</p>
                    <p className="text-[11px] text-gray-500">
                      Materials may have been issued in a single direct batch or before logs tracking was enabled. Cumulative quantities are shown in the Summary tab.
                    </p>
                  </div>
                ) : (
                  viewItemsModalTask.dispatch_logs.map((log, idx) => {
                    const items = Array.isArray(log.items_summary) ? log.items_summary : [];
                    const logDate = formatDate(log.created_at);

                    return (
                      <div
                        key={log.id || idx}
                        className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2 hover:border-indigo-200 transition"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200/80 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-indigo-800 bg-indigo-100/70 px-2 py-0.5 rounded text-[11px] border border-indigo-200">
                              ⚡ {log.dispatch_type || `Dispatch #${idx + 1}`}
                            </span>
                            <span className="text-[11px] text-gray-500 font-medium">
                              Dispatched by: <strong className="text-gray-800">{log.dispatched_by || 'Store Manager'}</strong>
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                            <Calendar size={11} /> {logDate}
                          </span>
                        </div>

                        {/* Items dispatched in this specific batch */}
                        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-100/70 text-[10px] font-bold text-gray-500 uppercase border-b border-slate-200">
                                <th className="py-2 px-3">Item Dispatched</th>
                                <th className="py-2 px-3 text-center">Sent In This Batch</th>
                                <th className="py-2 px-3 text-center">New Total Dispatched / Ordered</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {items.length === 0 ? (
                                <tr>
                                  <td colSpan={3} className="py-2 px-3 text-center text-gray-400 italic text-[11px]">
                                    No item breakdown details recorded for this log.
                                  </td>
                                </tr>
                              ) : (
                                items.map((it, iIdx) => (
                                  <tr key={iIdx}>
                                    <td className="py-2 px-3 font-semibold text-gray-900">{it.item_name}</td>
                                    <td className="py-2 px-3 text-center font-bold text-indigo-700 bg-indigo-50/40">
                                      + {formatQty(it.qty)} {it.unit}
                                    </td>
                                    <td className="py-2 px-3 text-center text-gray-600 font-medium">
                                      {it.new_total_issued !== undefined && it.required_qty !== undefined
                                        ? `${formatQty(it.new_total_issued)} / ${formatQty(it.required_qty)} ${it.unit}`
                                        : `${formatQty(it.qty)} ${it.unit}`}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-gray-100 shrink-0">
              <button
                type="button"
                onClick={() => setViewItemsModalTask(null)}
                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 Partial Material Issue Modal */}
      {partialIssueTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col text-xs">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-200 bg-slate-50/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
                  <Layers size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 text-sm">
                      Partial Material Dispatch
                    </h3>
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                      {partialIssueTask.task_id}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Product: <strong className="text-gray-800">{partialIssueTask.product_name}</strong> | Batch Target: <strong className="text-gray-800">{partialIssueTask.proposed_quantity} Units</strong> | In-charge: <strong>{partialIssueTask.assigned_to || 'Unassigned'}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPartialIssueTask(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200/60 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Actions Helper Bar */}
            <div className="px-5 py-2.5 bg-indigo-50/50 border-b border-indigo-100 flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="text-indigo-900 font-semibold flex items-center gap-1.5">
                <Boxes size={14} className="text-indigo-600" />
                Specify how many units of each component to dispatch in this batch:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const newQtys = {};
                    (partialIssueTask.items || []).forEach((it) => {
                      const req = parseFloat(it.required_qty) || 0;
                      const iss = parseFloat(it.issued_qty) || 0;
                      const rem = Math.max(0, req - iss);
                      const stock = Math.max(0, parseFloat(it.current_store_stock) || 0);
                      newQtys[it.id] = Math.min(rem, stock);
                    });
                    setPartialIssueQtys(newQtys);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-[11px] transition cursor-pointer"
                >
                  ⚡ Fill All Available
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newQtys = {};
                    (partialIssueTask.items || []).forEach((it) => {
                      newQtys[it.id] = 0;
                    });
                    setPartialIssueQtys(newQtys);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-600 border border-gray-300 rounded-lg font-semibold text-[11px] transition cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Components Input Table */}
            <div className="overflow-y-auto flex-1 p-5">
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200">
                      <th className="py-2.5 px-3">Component Raw Material</th>
                      <th className="py-2.5 px-3 text-center">Ordered / Req. Qty</th>
                      <th className="py-2.5 px-3 text-center">Already Dispatched</th>
                      <th className="py-2.5 px-3 text-center">Remaining Needed</th>
                      <th className="py-2.5 px-3 text-center">Store Stock</th>
                      <th className="py-2.5 px-3 text-center min-w-[180px]">Dispatch Qty Now</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {(partialIssueTask.items || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-gray-400 italic">
                          No BOM component specifications found for this task.
                        </td>
                      </tr>
                    ) : (
                      (partialIssueTask.items || []).map((it) => {
                        const req = parseFloat(it.required_qty) || 0;
                        const iss = parseFloat(it.issued_qty) || 0;
                        const rem = Math.max(0, req - iss);
                        const stock = parseFloat(it.current_store_stock) || 0;
                        const currentVal = partialIssueQtys[it.id] ?? '';
                        const parsedVal = parseFloat(currentVal) || 0;
                        const maxAllowed = Math.min(rem, stock);
                        const isZeroStock = stock <= 0 && rem > 0;
                        const isExceedingStock = parsedVal > stock;
                        const isExceedingReq = parsedVal > rem;

                        return (
                          <tr key={it.id} className={isZeroStock ? 'bg-rose-50/30' : rem === 0 ? 'bg-emerald-50/20' : ''}>
                            {/* Component Name */}
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-gray-900 block">{it.item_name}</span>
                              {it.item_code && (
                                <span className="text-[10px] text-gray-400 font-mono">{it.item_code}</span>
                              )}
                            </td>

                            {/* Ordered / Required */}
                            <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                              {req} {it.unit}
                            </td>

                            {/* Dispatched */}
                            <td className="py-2.5 px-3 text-center font-bold text-indigo-700">
                              {iss} {it.unit}
                            </td>

                            {/* Remaining */}
                            <td className="py-2.5 px-3 text-center font-bold">
                              <span className={`px-2 py-0.5 rounded text-[11px] ${rem === 0 ? 'text-gray-400 font-normal' : 'text-amber-700 bg-amber-50 font-bold border border-amber-200'}`}>
                                {rem} {it.unit}
                              </span>
                            </td>

                            {/* Store Stock */}
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${stock <= 0
                                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                    : stock < rem
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  }`}
                              >
                                {stock} {it.unit}
                              </span>
                            </td>

                            {/* Dispatch Qty Input */}
                            <td className="py-2.5 px-3 text-center">
                              {rem === 0 ? (
                                <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-1 rounded border border-emerald-200 inline-block">
                                  ✅ Fully Dispatched
                                </span>
                              ) : (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <input
                                      type="number"
                                      min="0"
                                      max={maxAllowed}
                                      step="any"
                                      disabled={isZeroStock}
                                      value={currentVal}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setPartialIssueQtys((prev) => ({
                                          ...prev,
                                          [it.id]: val === '' ? '' : Math.max(0, parseFloat(val) || 0)
                                        }));
                                      }}
                                      placeholder={isZeroStock ? "0 (Out of stock)" : "Enter qty"}
                                      className={`w-28 p-1.5 text-center font-bold border rounded-lg outline-none text-xs ${isExceedingStock || isExceedingReq
                                          ? 'border-rose-500 bg-rose-50 text-rose-700 focus:ring-1 focus:ring-rose-500'
                                          : isZeroStock
                                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'border-indigo-300 bg-indigo-50/30 text-indigo-900 focus:ring-1 focus:ring-indigo-500'
                                        }`}
                                    />
                                    <span className="text-gray-500 font-medium text-[11px]">{it.unit}</span>

                                    {!isZeroStock && maxAllowed > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPartialIssueQtys((prev) => ({
                                            ...prev,
                                            [it.id]: maxAllowed
                                          }));
                                        }}
                                        title={`Set max available (${maxAllowed} ${it.unit})`}
                                        className="px-1.5 py-1 bg-slate-100 hover:bg-indigo-100 text-indigo-700 border border-slate-300 rounded text-[10px] font-bold transition cursor-pointer"
                                      >
                                        Max
                                      </button>
                                    )}
                                  </div>

                                  {isExceedingStock && (
                                    <p className="text-[10px] text-rose-600 font-semibold">
                                      Exceeds store stock ({stock})
                                    </p>
                                  )}
                                  {isExceedingReq && !isExceedingStock && (
                                    <p className="text-[10px] text-amber-600 font-semibold">
                                      Exceeds remaining needed ({rem})
                                    </p>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-gray-200 bg-slate-50/80 flex items-center justify-between shrink-0">
              <div className="text-xs text-gray-600">
                {(() => {
                  const itemsWithQty = (partialIssueTask.items || []).filter(
                    (it) => (parseFloat(partialIssueQtys[it.id]) || 0) > 0
                  );
                  return (
                    <span>
                      Items to dispatch now: <strong className="text-indigo-700 font-bold">{itemsWithQty.length} components</strong>
                    </span>
                  );
                })()}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPartialIssueTask(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPartialIssue}
                  disabled={isPartialSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isPartialSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Dispatching Materials...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Confirm & Dispatch Materials</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-rose-700 font-bold">
                <XCircle size={18} />
                <span>Reject Material Requisition</span>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalTask(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Rejecting BOM requisition for <strong>{rejectModalTask.task_id}</strong> ({rejectModalTask.product_name}). Please state the reason for Production floor notice:
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Rejection Reason / Remarks</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Raw material lot damaged / stock out of inventory..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalTask(null)}
                  className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRejecting}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5"
                >
                  {isRejecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle size={14} />}
                  <span>Confirm Reject</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🌟 View Store Item Details Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden p-5 space-y-4 text-xs animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Package size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">
                    {viewingItem.item_name || viewingItem.name}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Category: <strong>{viewingItem.category || 'General'}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Classification</span>
                <span className="font-bold text-gray-800 capitalize">
                  {viewingItem.item_type ? viewingItem.item_type.replace('_', ' ') : 'Raw Material'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">UOM (Unit)</span>
                <span className="font-bold text-gray-800 text-[12px]">
                  {viewingItem.unit || viewingItem.uom || 'Nos'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Available Stock</span>
                <span className={`text-sm font-black ${(viewingItem.quantity || 0) <= 0
                    ? 'text-rose-600'
                    : (viewingItem.quantity || 0) <= (viewingItem.min_threshold ?? viewingItem.minThreshold ?? 10)
                      ? 'text-amber-600'
                      : 'text-emerald-700'
                  }`}>
                  {viewingItem.quantity ?? 0} {viewingItem.unit || viewingItem.uom || 'Nos'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Min Stock Alert</span>
                <span className="font-semibold text-gray-700">
                  {viewingItem.min_threshold ?? viewingItem.minThreshold ?? 10} {viewingItem.unit || viewingItem.uom || 'Nos'}
                </span>
              </div>

              {/* Stock Status */}
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Stock Status</span>
                {(() => {
                  const qty = viewingItem.quantity ?? 0;
                  const thr = viewingItem.min_threshold ?? viewingItem.minThreshold ?? 10;
                  if (qty <= 0) {
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle size={10} /> Out of Stock
                      </span>
                    );
                  }
                  if (qty <= thr) {
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertTriangle size={10} /> Low Stock
                      </span>
                    );
                  }
                  return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={10} /> In Stock
                    </span>
                  );
                })()}
              </div>

              {/* Active / Inactive Status */}
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Item Status</span>
                {(viewingItem.is_active !== undefined ? (Number(viewingItem.is_active) === 0 ? false : true) : true) ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={10} /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <XCircle size={10} /> Inactive
                  </span>
                )}
              </div>

              {viewingItem.linked_product_name && (
                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Linked Finished Product</span>
                  <span className="font-bold text-purple-700">
                    🔗 {viewingItem.linked_product_name}
                  </span>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  const toEdit = viewingItem;
                  setViewingItem(null);
                  handleOpenEdit(toEdit);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition cursor-pointer border border-blue-200"
              >
                <Plus size={13} className="rotate-45" /> Edit Item
              </button>

              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 View Finished Goods & Damage Report Details Modal */}
      {viewOutputReportTask && (() => {
        const fin = parseFloat(viewOutputReportTask.finished_quantity) || 0;
        const proposed = parseFloat(viewOutputReportTask.proposed_quantity) || 1;
        const rawRej = parseFloat(viewOutputReportTask.rejected_quantity) || 0;
        const rej = rawRej > 0 ? rawRej : Math.max(0, proposed - fin);
        const { remarksText, scrapText, returnText } = parseTaskReportDetails(viewOutputReportTask.notes);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden p-5 space-y-4 max-h-[90vh] flex flex-col text-xs">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-100">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-sm">
                        Finished Goods & Damage Report
                      </h3>
                      <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-xs">
                        {viewOutputReportTask.task_id}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Product: <strong className="text-gray-900">{viewOutputReportTask.product_name}</strong> | In-charge: <strong>{viewOutputReportTask.assigned_to || 'Production Floor'}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewOutputReportTask(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto flex-1 space-y-3.5 pr-1">
                {/* Summary Metrics Cards */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Batch Target</span>
                    <span className="text-sm font-extrabold text-slate-800">{proposed} Units</span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-emerald-800 font-bold uppercase block">Finished Inwarded</span>
                    <span className="text-sm font-extrabold text-emerald-900">{fin} Units</span>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                    <span className="text-[10px] text-rose-800 font-bold uppercase block">FG Scrapped / Defects</span>
                    <span className="text-sm font-extrabold text-rose-900">{rej} Units</span>
                  </div>
                </div>

                {/* Damaged Raw Material Components */}
                <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
                    <AlertTriangle size={14} className="text-rose-600 shrink-0" />
                    <span>Damaged / Scrapped Raw Material Components:</span>
                  </div>
                  {scrapText ? (
                    <div className="space-y-1 pl-4">
                      {scrapText.split(',').map((item, idx) => (
                        <div key={idx} className="text-rose-900 font-semibold text-xs flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                          <span>{item.trim()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-rose-700/70 italic text-[11px] pl-4">No raw material component scrap reported.</p>
                  )}
                </div>

                {/* Returned to Store Raw Materials */}
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-blue-800 font-bold text-xs">
                      <RotateCcw size={14} className="text-blue-600 shrink-0" />
                      <span>Returned to Store Inventory (Stock Credited):</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      ✓ Credited
                    </span>
                  </div>
                  {returnText ? (
                    <div className="space-y-1 pl-4">
                      {returnText.split(',').map((item, idx) => (
                        <div key={idx} className="text-blue-900 font-semibold text-xs flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                          <span>{item.trim()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-blue-700/70 italic text-[11px] pl-4">No components were returned to store.</p>
                  )}
                </div>

                {/* Production / QC Remarks */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Production / QC Remarks</span>
                  <p className="text-gray-800 font-medium whitespace-pre-line text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                    {remarksText || 'No custom remarks provided for this batch output.'}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end pt-2 border-t border-gray-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewOutputReportTask(null)}
                  className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add / Edit Modal */}
      <AddEditStoreModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveItem}
        editingItem={editingItem}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};