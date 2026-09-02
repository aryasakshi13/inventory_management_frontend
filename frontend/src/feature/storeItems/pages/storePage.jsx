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
  Calendar
} from 'lucide-react';
import axios from 'axios';
import { useStoreItems } from '../hook/useStoreItem';
import { StoreItemsTable } from '../component/StoreItemtable';
import { AddEditStoreModal } from '../component/AddEditstoreModal';
import { exportWarehouseStockReport } from '../../../utils/exportReport';
import { getProductionTaskById, issueMaterialsToProduction, rejectProductionRequisition } from '../../production/services/productionService';

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

  // View Items Modal State
  const [viewItemsModalTask, setViewItemsModalTask] = useState(null);

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
    if (storeTab === 'requisitions' || storeTab === 'logs') {
      fetchStoreProductionData();
    }
  }, [storeTab, fetchStoreProductionData]);

  // Handle Accept / Dispatch Materials from Store
  const handleAcceptDispatch = async (task) => {
    const taskItems = task.items || [];
    const outOfStock = taskItems.find((it) => (parseFloat(it.current_store_stock) || 0) <= 0);
    if (outOfStock) {
      alert(`Cannot accept: Component "${outOfStock.item_name}" has 0 stock in warehouse. Please restock Store inventory first.`);
      return;
    }

    if (!window.confirm(`Accept & Dispatch all required BOM materials for "${task.task_id}" (${task.product_name})? This will deduct the items from Warehouse stock.`)) {
      return;
    }

    try {
      setProcessingId(task.id);
      setStoreActionMsg({ type: '', text: '' });
      await issueMaterialsToProduction(task.id, {});
      setStoreActionMsg({ type: 'success', text: `Materials successfully accepted and dispatched for ${task.task_id}! Warehouse stock has been deducted.` });
      await fetchStoreProductionData();
      refetchItems();
    } catch (err) {
      console.error("Error dispatching from store:", err);
      setStoreActionMsg({ type: 'error', text: err.response?.data?.message || "Failed to dispatch materials from store." });
    } finally {
      setProcessingId(null);
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
  const pendingRequisitions = productionTasks.filter((t) =>
    ['planned', 'material requested', 'partially issued'].includes((t.status || 'planned').toLowerCase())
  );

  const dispatchedAndLogs = productionTasks.filter((t) =>
    ['material issued', 'in production', 'completed', 'material rejected'].includes((t.status || '').toLowerCase()) ||
    parseFloat(t.total_issued_qty) > 0 ||
    parseFloat(t.finished_quantity) > 0
  );

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
          className={`p-3.5 rounded-xl border flex items-center gap-2 font-semibold text-xs animate-in fade-in ${
            storeActionMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          {storeActionMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{storeActionMsg.text}</span>
        </div>
      )}

      {/* 🌟 1. STORE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Package size={22} className="text-blue-600" /> Store & Warehouse Operations
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage inventory items, review production material requests (Accept / Reject), dispatch components, and track finished goods logs.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => exportWarehouseStockReport(items)}
            title="Download Warehouse Stock Report (.xlsx)"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition shadow-sm cursor-pointer"
          >
            <Download size={15} /> Export Report
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-sm cursor-pointer"
          >
            <Plus size={15} /> Add Store Item
          </button>
        </div>
      </div>

      {/* 🌟 2. TOP HORIZONTAL NAVIGATION TABS */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
        {/* Tab 1: Store Inventory Master */}
        <button
          type="button"
          onClick={() => setStoreTab('master')}
          className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            storeTab === 'master'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Package size={15} />
          <span>1. Store Inventory Master</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              storeTab === 'master' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {items.length}
          </span>
        </button>

        {/* Tab 2: Production Material Requisitions */}
        <button
          type="button"
          onClick={() => setStoreTab('requisitions')}
          className={`flex-1 min-w-[220px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            storeTab === 'requisitions'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Send size={15} />
          <span>2. Material Requests to Dispatch</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              storeTab === 'requisitions' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {pendingRequisitions.length}
          </span>
        </button>

        {/* Tab 3: Dispatched History & Production Logs */}
        <button
          type="button"
          onClick={() => setStoreTab('logs')}
          className={`flex-1 min-w-[220px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            storeTab === 'logs'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Truck size={15} />
          <span>3. Dispatch History & Production Logs</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              storeTab === 'logs' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {dispatchedAndLogs.length}
          </span>
        </button>
      </div>

      {/* 🌟 3. TAB 1 CONTENT: STORE INVENTORY MASTER */}
      {storeTab === 'master' && (
        <div className="space-y-4">
          {/* Classification Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedItemType('all')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedItemType === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Package size={14} />
              All Store Items ({metrics.total})
            </button>

            <button
              onClick={() => setSelectedItemType('raw_material')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedItemType === 'raw_material'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
              }`}
            >
              <Layers size={14} />
              Raw Materials / Components ({metrics.rawCount || 0})
            </button>

            <button
              onClick={() => setSelectedItemType('finished_good')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedItemType === 'finished_good'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-200'
              }`}
            >
              <Box size={14} />
              Finished Goods ({metrics.finishedCount || 0})
            </button>

            <button
              onClick={() => setSelectedItemType('consumable')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedItemType === 'consumable'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Wrench size={14} />
              Consumables & Tools ({metrics.consumableCount || 0})
            </button>
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
            onDelete={handleDeleteItem}
            loading={loading}
          />
        </div>
      )}

      {/* 🌟 4. TAB 2 CONTENT: PRODUCTION MATERIAL REQUISITIONS (ACCEPT / REJECT) */}
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
              const outOfStockItems = taskItems.filter((it) => (parseFloat(it.current_store_stock) || 0) <= 0);
              const insufficientItems = taskItems.filter(
                (it) => (parseFloat(it.current_store_stock) || 0) < (parseFloat(it.required_qty) || 0) && (parseFloat(it.current_store_stock) || 0) > 0
              );
              const hasZeroStock = outOfStockItems.length > 0;
              const hasInsufficient = insufficientItems.length > 0;
              const isProcessing = processingId === task.id;

              return (
                <div
                  key={task.id}
                  className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4 hover:border-indigo-300 transition"
                >
                  {/* Task Header & Accept / Reject Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200 text-xs">
                          {task.task_id}
                        </span>
                        <span className="font-bold text-gray-900 text-sm">{task.product_name}</span>
                        <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded">
                          Batch Target: {task.proposed_quantity} Units
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          In-charge: <strong>{task.assigned_to || 'Unassigned'}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Accept & Reject Action Controls */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      {/* Reject Requisition Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setRejectModalTask(task);
                          setRejectionReason(hasZeroStock ? `Component "${outOfStockItems[0]?.item_name}" is Out of Stock in warehouse.` : '');
                        }}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold transition cursor-pointer text-xs"
                      >
                        <XCircle size={14} className="text-rose-600" />
                        <span>Reject Requisition</span>
                      </button>

                      {/* Accept / Issue Materials Button */}
                      {hasZeroStock ? (
                        <div
                          title="Cannot accept: Some required BOM components have 0 stock in warehouse"
                          className="px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-not-allowed"
                        >
                          <AlertCircle size={14} className="text-rose-600" />
                          <span>Accept Blocked (0 Stock)</span>
                        </div>
                      ) : hasInsufficient ? (
                        <div
                          title="Cannot accept: Available warehouse stock is lower than required batch quantity"
                          className="px-3.5 py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-not-allowed"
                        >
                          <AlertTriangle size={14} className="text-amber-600" />
                          <span>Insufficient Stock</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAcceptDispatch(task)}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition disabled:opacity-50 cursor-pointer text-xs"
                        >
                          {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsUp size={13} />}
                          <span>⚡ Accept & Dispatch Materials</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Components Breakdown Table */}
                  <div className="overflow-x-auto rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200">
                          <th className="py-2.5 px-3">Required Raw Material Item</th>
                          <th className="py-2.5 px-3 text-center">Required Qty</th>
                          <th className="py-2.5 px-3 text-center">Available in Store</th>
                          <th className="py-2.5 px-3 text-right">Warehouse Stock Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {taskItems.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-3 px-3 text-center text-gray-400 italic">
                              No component item specifications found.
                            </td>
                          </tr>
                        ) : (
                          taskItems.map((it) => {
                            const req = parseFloat(it.required_qty) || 0;
                            const stock = parseFloat(it.current_store_stock) || 0;
                            const isZero = stock <= 0;
                            const isLow = stock < req;

                            return (
                              <tr key={it.id} className={isZero ? 'bg-rose-50/40' : ''}>
                                <td className="py-2.5 px-3 font-semibold text-gray-900">
                                  {it.item_name}
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold text-indigo-700">
                                  {req} {it.unit}
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                                  <span
                                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                                      isZero
                                        ? 'bg-rose-100 text-rose-700'
                                        : isLow
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    {stock} {it.unit}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-semibold">
                                  {isZero ? (
                                    <span className="text-rose-600 font-bold text-[10px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                      ❌ Out of Stock (0 Available)
                                    </span>
                                  ) : isLow ? (
                                    <span className="text-amber-700 font-bold text-[10px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                      ⚠️ Low Stock ({stock} &lt; {req})
                                    </span>
                                  ) : (
                                    <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                      ✅ Ready to Dispatch
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
                <h3 className="font-bold text-gray-900 text-xs">Dispatched Work Orders & Production Output Logs</h3>
                <p className="text-[11px] text-gray-500">
                  Track finished goods credited back to Store, current production progress, scrap count, and remarks.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
              {dispatchedAndLogs.length} Tracked Orders
            </span>
          </div>

          {loadingProduction ? (
            <div className="p-10 flex flex-col items-center justify-center gap-2 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <p className="font-medium text-xs">Loading production logs...</p>
            </div>
          ) : dispatchedAndLogs.length === 0 ? (
            <div className="p-10 text-center text-gray-400 space-y-2">
              <Truck className="w-10 h-10 mx-auto text-gray-300" />
              <p className="text-sm font-bold text-gray-700">No Dispatched Production Logs Found</p>
              <p className="text-xs text-gray-400">When materials are issued to production, their progress will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <th className="py-3 px-4">Task ID</th>
                    <th className="py-3 px-4">Order Date</th>
                    <th className="py-3 px-4">Finished Product</th>
                    <th className="py-3 px-4 text-center">Batch Target</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Finished Goods Inwarded</th>
                    <th className="py-3 px-4 text-center">Scrap / Defect</th>
                    <th className="py-3 px-4">Remarks & QC Reports</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dispatchedAndLogs.map((task) => {
                    const proposed = parseInt(task.proposed_quantity, 10) || 1;
                    const finished = parseInt(task.finished_quantity, 10) || 0;
                    const rejected = parseInt(task.rejected_quantity, 10) || 0;
                    const statusLower = (task.status || '').toLowerCase();
                    const isRejected = statusLower === 'material rejected';

                    return (
                      <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* 1. Distinct Task ID Column */}
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-700 text-xs">
                          <span className="bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                            {task.task_id}
                          </span>
                        </td>

                        {/* 2. Distinct Order Date Column */}
                        <td className="py-3.5 px-4 text-slate-700 font-medium text-xs whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-slate-400" />
                            <span>{task.start_date ? new Date(task.start_date).toLocaleDateString() : 'No Date'}</span>
                          </div>
                        </td>

                        {/* 3. Finished Product */}
                        <td className="py-3.5 px-4 font-bold text-gray-900 text-xs">
                          {task.product_name}
                        </td>

                        {/* 4. Batch Target */}
                        <td className="py-3.5 px-4 text-center font-bold text-slate-800 text-xs">
                          <span className="bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 inline-block">
                            {proposed} Units
                          </span>
                        </td>

                        {/* 5. Clean Status Badge */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold border inline-block ${
                              isRejected
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : statusLower === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : statusLower === 'in production'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {task.status}
                          </span>
                        </td>

                        {/* 6. Finished Goods Inwarded */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-block text-xs">
                            {finished} Units Inwarded
                          </span>
                        </td>

                        {/* 7. Scrap / Defect */}
                        <td className="py-3.5 px-4 text-center">
                          {rejected > 0 ? (
                            <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-xs">
                              {rejected} Scrapped
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[11px]">0</span>
                          )}
                        </td>

                        {/* 8. Remarks Column */}
                        <td className="py-3.5 px-4">
                          {task.notes ? (
                            <div className="max-w-xs bg-slate-50 p-2 rounded-lg border border-slate-200 text-gray-700 font-medium text-[11px] whitespace-pre-line">
                              {task.notes}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-[11px] italic">No remarks logged</span>
                          )}
                        </td>

                        {/* 9. Action: View Items Icon Only */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setViewItemsModalTask(task)}
                            title="View Dispatched BOM Items"
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

      {/* 🌟 View Dispatched Items Modal */}
      {viewItemsModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden p-5 space-y-4 max-h-[85vh] flex flex-col text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">
                    BOM Components for {viewItemsModalTask.task_id}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Product: <strong>{viewItemsModalTask.product_name}</strong> | Batch Target: <strong>{viewItemsModalTask.proposed_quantity} Units</strong>
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

            <div className="overflow-y-auto flex-1 rounded-xl border border-gray-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200">
                    <th className="py-2.5 px-3">Item Name</th>
                    <th className="py-2.5 px-3 text-center">Required Qty</th>
                    <th className="py-2.5 px-3 text-center">Dispatched Qty</th>
                    <th className="py-2.5 px-3 text-center">Dispatch Status</th>
                    <th className="py-2.5 px-3 text-right">Store Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {(viewItemsModalTask.items || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-gray-400 italic">
                        No component items found.
                      </td>
                    </tr>
                  ) : (
                    (viewItemsModalTask.items || []).map((it) => {
                      const req = parseFloat(it.required_qty) || 0;
                      const iss = parseFloat(it.issued_qty) || 0;
                      const isFullyIssued = iss >= req && req > 0;

                      return (
                        <tr key={it.id}>
                          <td className="py-2.5 px-3 font-semibold text-gray-900">{it.item_name}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                            {req} {it.unit}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-indigo-700">
                            {iss} {it.unit}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isFullyIssued
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
                            {it.current_store_stock !== undefined ? `${it.current_store_stock} ${it.unit}` : 'N/A'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
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