import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
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
  ChevronUp,
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
  ClipboardList,
  MoreVertical
} from 'lucide-react';
import axios from 'axios';
import { useStoreItems } from '../hook/useStoreItem';
import { StoreItemsTable } from '../component/StoreItemtable';
import { AddEditStoreModal } from '../component/AddEditstoreModal';
import {
  exportWarehouseStockReport,
  exportDamagedItemsDetailedReport,
  exportDamagedItemsSummaryReport,
  exportReturnedItemsReport
} from '../../../utils/exportReport';
import { getProductionTaskById, issueMaterialsToProduction, rejectProductionRequisition, acceptFinishedGoodsInward, acceptReturnedMaterials } from '../../production/services/productionService';
import { Pagination } from '../../../components/common/pagination';

// Format quantities cleanly (remove unwanted float precision like 6.029999999999999)
const formatQty = (num) => {
  if (num === undefined || num === null) return '0';
  const n = parseFloat(num);
  return isNaN(n) ? '0' : Number(n.toFixed(3)).toString();
};

// Format Timestamp Helper
const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const formatDate = (dateStr) => formatDateTime(dateStr);

// Helper to get first day of current month (YYYY-MM-DD)
const getFirstDayOfMonth = () => {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${month}-01`;
};

// Helper to get current day (YYYY-MM-DD)
const getTodayDate = () => {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};

export const StorePage = () => {
  const location = useLocation();
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

  // Initialize status or itemType filter from navigation state (e.g. from Dashboard click)
  useEffect(() => {
    if (location.state?.itemType) {
      setSelectedItemType(location.state.itemType);
      setSelectedStatus('');
      setSelectedCategory('');
      setSearchQuery('');
      setStoreTab('master');
    } else if (location.state?.status) {
      setSelectedStatus(location.state.status);
      setSelectedItemType('all');
      setSelectedCategory('');
      setSearchQuery('');
      setStoreTab('master');
    }
  }, [location.key, location.state, setSelectedStatus, setSelectedItemType, setSelectedCategory, setSearchQuery]);

  // Active Store Tab: 'master', 'requisitions', 'logs', 'finished-goods', 'damage-returns'
  const [storeTab, setStoreTab] = useState('master');

  // Synchronize storeTab based on current route path or location.state
  useEffect(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('material-requests') || location.state?.tab === 'requisitions') {
      setStoreTab('requisitions');
    } else if (path.includes('dispatch-history') || location.state?.tab === 'logs') {
      setStoreTab('logs');
    } else if (path.includes('finished-goods') || location.state?.tab === 'finished-goods') {
      setStoreTab('finished-goods');
    } else if (path.includes('damage-returns') || path.includes('damage-reports') || location.state?.tab === 'damage-returns' || location.state?.tab === 'reports') {
      setStoreTab('damage-returns');
    } else if (path.includes('store-master') || path.endsWith('/store') || location.state?.tab === 'master') {
      setStoreTab('master');
    }
  }, [location.pathname, location.state]);

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

  // View Output Report Modal State
  const [viewOutputReportTask, setViewOutputReportTask] = useState(null);

  // Finished Goods Tab Filter & Pagination State
  const [fgSearchQuery, setFgSearchQuery] = useState('');
  const [fgStatusFilter, setFgStatusFilter] = useState('all');
  const [fgPage, setFgPage] = useState(1);

  // Damage & Returns Dual-Tab, Filter & Pagination State
  const [drActiveTab, setDrActiveTab] = useState('damage'); // 'damage' | 'returns'
  const [damageSearchQuery, setDamageSearchQuery] = useState('');
  const [damageFromDate, setDamageFromDate] = useState(getFirstDayOfMonth);
  const [damageToDate, setDamageToDate] = useState(getTodayDate);
  const [damagePage, setDamagePage] = useState(1);
  const [expandedDamageId, setExpandedDamageId] = useState(null);

  const [returnSearchQuery, setReturnSearchQuery] = useState('');
  const [returnFromDate, setReturnFromDate] = useState(getFirstDayOfMonth);
  const [returnToDate, setReturnToDate] = useState(getTodayDate);
  const [returnStatusFilter, setReturnStatusFilter] = useState('all');
  const [returnPage, setReturnPage] = useState(1);
  const [expandedReturnId, setExpandedReturnId] = useState(null);

  // Collapsible rows for Material Requests
  const [expandedReqId, setExpandedReqId] = useState(null);

  // Pagination states for submenus
  const [reqPage, setReqPage] = useState(1);
  const [logsPage, setLogsPage] = useState(1);
  const itemsPerPage = 10;

  const toggleExpandReq = (id) => {
    setExpandedReqId((prev) => (prev === id ? null : id));
  };

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
    if (storeTab === 'requisitions' || storeTab === 'logs' || storeTab === 'finished-goods' || storeTab === 'damage-returns') {
      fetchStoreProductionData();
    }
    refetchItems();
  }, [storeTab, fetchStoreProductionData, refetchItems]);

  // Handle Accept Finished Goods Inward to Store Inventory
  const handleAcceptFinishedGoods = async (task) => {
    const fin = parseFloat(task.finished_quantity) || 0;
    if (fin <= 0) {
      alert(`No finished goods recorded yet for task "${task.task_id}".`);
      return;
    }
    if (!window.confirm(`Accept and inward ${fin} units of "${task.product_name}" into Store inventory? This will increment the Finished Goods stock.`)) {
      return;
    }
    try {
      setProcessingId(task.id);
      setStoreActionMsg({ type: '', text: '' });
      await acceptFinishedGoodsInward(task.id);
      setStoreActionMsg({ type: 'success', text: `Successfully accepted and inwarded ${fin} units of "${task.product_name}" into Store inventory!` });
      await fetchStoreProductionData();
      refetchItems();
    } catch (err) {
      console.error("Error accepting finished goods inward:", err);
      setStoreActionMsg({ type: 'error', text: err.response?.data?.message || "Failed to accept finished goods into store." });
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Accept Returned Materials to Store Inventory
  const handleAcceptReturns = async (task) => {
    const { returnText } = parseTaskReportDetails(task.notes);
    if (!returnText) {
      alert(`No returned components recorded for task "${task.task_id}".`);
      return;
    }
    if (!window.confirm(`Accept returned components for task "${task.task_id}" back into Store inventory?\n\nReturned Items:\n${returnText}`)) {
      return;
    }
    try {
      setProcessingId(task.id);
      setStoreActionMsg({ type: '', text: '' });
      await acceptReturnedMaterials(task.id);
      setStoreActionMsg({ type: 'success', text: `Successfully accepted returned materials for "${task.task_id}" and credited back to Store stock!` });
      await fetchStoreProductionData();
      refetchItems();
    } catch (err) {
      console.error("Error accepting returned materials:", err);
      setStoreActionMsg({ type: 'error', text: err.response?.data?.message || "Failed to accept returned materials." });
    } finally {
      setProcessingId(null);
    }
  };

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

  // 1. Finished Goods Dataset
  const rawFinishedGoodsTasks = productionTasks.filter((t) => {
    const fin = parseFloat(t.finished_quantity) || 0;
    return fin > 0 || (t.status || '').toLowerCase() === 'completed';
  });

  const filteredFinishedGoodsTasks = rawFinishedGoodsTasks.filter((task) => {
    const q = fgSearchQuery.trim().toLowerCase();
    const isInwardAccepted = (task.notes || '').includes('[STORE FG INWARD ACCEPTED]');

    const matchesSearch = !q || (
      (task.task_id || '').toLowerCase().includes(q) ||
      (task.product_name || '').toLowerCase().includes(q) ||
      (task.assigned_to || '').toLowerCase().includes(q)
    );

    const matchesStatus = fgStatusFilter === 'all' || (
      fgStatusFilter === 'accepted' ? isInwardAccepted :
        fgStatusFilter === 'pending' ? !isInwardAccepted :
          true
    );

    return matchesSearch && matchesStatus;
  });

  const fgMetrics = {
    totalReports: rawFinishedGoodsTasks.length,
    totalFinishedUnits: rawFinishedGoodsTasks.reduce((acc, t) => acc + (parseFloat(t.finished_quantity) || 0), 0),
    totalDefectUnits: rawFinishedGoodsTasks.reduce((acc, t) => {
      const fin = parseFloat(t.finished_quantity) || 0;
      const proposed = parseFloat(t.proposed_quantity) || 1;
      const rawRej = parseFloat(t.rejected_quantity) || 0;
      return acc + (rawRej > 0 ? rawRej : Math.max(0, proposed - fin));
    }, 0),
    inwardedCount: rawFinishedGoodsTasks.filter(t => (t.notes || '').includes('[STORE FG INWARD ACCEPTED]')).length,
    pendingInwardCount: rawFinishedGoodsTasks.filter(t => !(t.notes || '').includes('[STORE FG INWARD ACCEPTED]')).length,
  };

  // Helper to parse detailed list of damaged raw material items per task
  const parseDamagedItemsList = (task) => {
    const list = [];
    const { scrapText } = parseTaskReportDetails(task.notes);
    if (scrapText) {
      const entries = scrapText.split(',').map((s) => s.trim()).filter(Boolean);
      entries.forEach((entry) => {
        const parts = entry.split(':');
        if (parts.length >= 2) {
          const name = parts[0].trim();
          const rest = parts[1].trim();
          const qtyMatch = rest.match(/([\d.]+)/);
          const unitMatch = rest
            .replace(/[\d.]+/g, '')
            .replace(/\/?\s*(?:damaged|scrapped|defective)\b/gi, '')
            .replace(/[\/\s]+$/, '')
            .trim();
          list.push({
            item_name: name,
            qty: qtyMatch ? parseFloat(qtyMatch[1]) : rest,
            unit: unitMatch || 'Units',
            type: 'Damaged Raw Material',
            source: 'BOM Component'
          });
        } else {
          list.push({
            item_name: entry.replace(/damaged|scrapped/gi, '').trim(),
            qty: '—',
            unit: '—',
            type: 'Damaged Raw Material',
            source: 'BOM Component'
          });
        }
      });
    }
    return list;
  };

  // Helper to parse detailed list of returned items per task
  const parseReturnedItemsList = (task) => {
    const list = [];
    const { returnText } = parseTaskReportDetails(task.notes);
    if (returnText) {
      const entries = returnText.split(',').map((s) => s.trim()).filter(Boolean);
      entries.forEach((entry) => {
        const parts = entry.split(':');
        if (parts.length >= 2) {
          const name = parts[0].trim();
          const rest = parts[1].trim();
          const qtyMatch = rest.match(/([\d.]+)/);
          const unitMatch = rest
            .replace(/[\d.]+/g, '')
            .replace(/\/?\s*(?:returned|to|store)\b/gi, '')
            .replace(/[\/\s]+$/, '')
            .trim();
          list.push({
            item_name: name,
            qty: qtyMatch ? parseFloat(qtyMatch[1]) : rest,
            unit: unitMatch || 'Units',
            type: 'Returned Material',
            source: 'Unused Production Floor Stock'
          });
        } else {
          list.push({
            item_name: entry.replace(/returned to store/gi, '').trim(),
            qty: '—',
            unit: '—',
            type: 'Returned Material',
            source: 'Production Floor'
          });
        }
      });
    }
    return list;
  };

  // 2A. Damaged Items Dataset (Only tasks with damaged raw materials)
  const rawDamagedTasks = productionTasks.filter((t) => {
    const { scrapText } = parseTaskReportDetails(t.notes);
    return !!scrapText;
  });

  const filteredDamagedTasks = rawDamagedTasks.filter((task) => {
    const q = damageSearchQuery.trim().toLowerCase();
    const taskDateStr = task.completion_date || task.updated_at || task.created_at;
    if (taskDateStr) {
      const taskDate = new Date(taskDateStr);
      if (damageFromDate) {
        const from = new Date(damageFromDate);
        from.setHours(0, 0, 0, 0);
        if (taskDate < from) return false;
      }
      if (damageToDate) {
        const to = new Date(damageToDate);
        to.setHours(23, 59, 59, 999);
        if (taskDate > to) return false;
      }
    }
    if (!q) return true;
    const items = parseDamagedItemsList(task);
    const itemMatch = items.some((it) => it.item_name.toLowerCase().includes(q));
    return (
      (task.task_id || '').toLowerCase().includes(q) ||
      (task.product_name || '').toLowerCase().includes(q) ||
      (task.assigned_to || '').toLowerCase().includes(q) ||
      itemMatch
    );
  });

  const paginatedDamagedTasks = filteredDamagedTasks.slice(
    (damagePage - 1) * itemsPerPage,
    damagePage * itemsPerPage
  );

  // Aggregated Item-wise Damaged Items for Summary Export & Metrics
  const aggregatedDamagedItems = useMemo(() => {
    const itemMap = {};

    filteredDamagedTasks.forEach((task) => {
      const taskDateStr = task.completion_date || task.updated_at || task.created_at;
      const items = parseDamagedItemsList(task);
      items.forEach((it) => {
        const key = it.item_name.toLowerCase().trim();
        const qtyNum = typeof it.qty === 'number' ? it.qty : parseFloat(it.qty) || 0;

        if (!itemMap[key]) {
          itemMap[key] = {
            item_name: it.item_name,
            total_qty: 0,
            unit: it.unit || 'Units',
            type: it.type || 'Damaged Raw Material',
            tasks: new Set(),
            latest_date: taskDateStr,
          };
        }

        itemMap[key].total_qty += qtyNum;
        if (task.task_id) itemMap[key].tasks.add(task.task_id);
        if (taskDateStr && (!itemMap[key].latest_date || new Date(taskDateStr) > new Date(itemMap[key].latest_date))) {
          itemMap[key].latest_date = taskDateStr;
        }
      });
    });

    const list = Object.values(itemMap).map((it) => ({
      ...it,
      task_count: it.tasks.size,
      task_ids: Array.from(it.tasks),
    }));

    list.sort((a, b) => b.total_qty - a.total_qty);
    return list;
  }, [filteredDamagedTasks]);

  const damageMetrics = {
    totalReports: filteredDamagedTasks.length,
    totalDamagedTypes: aggregatedDamagedItems.length,
    totalDamagedQty: aggregatedDamagedItems.reduce((acc, it) => acc + (parseFloat(it.total_qty) || 0), 0),
  };

  // 2B. Returned Items Dataset
  const rawReturnedTasks = productionTasks.filter((t) => {
    const { returnText } = parseTaskReportDetails(t.notes);
    return !!returnText;
  });

  const filteredReturnedTasks = rawReturnedTasks.filter((task) => {
    const q = returnSearchQuery.trim().toLowerCase();
    const taskDateStr = task.completion_date || task.updated_at || task.created_at;
    if (taskDateStr) {
      const taskDate = new Date(taskDateStr);
      if (returnFromDate) {
        const from = new Date(returnFromDate);
        from.setHours(0, 0, 0, 0);
        if (taskDate < from) return false;
      }
      if (returnToDate) {
        const to = new Date(returnToDate);
        to.setHours(23, 59, 59, 999);
        if (taskDate > to) return false;
      }
    }
    const isAccepted = (task.notes || '').includes('[STORE RETURNS ACCEPTED]');
    const matchesStatus = returnStatusFilter === 'all' || (
      returnStatusFilter === 'accepted' ? isAccepted :
        returnStatusFilter === 'pending' ? !isAccepted : true
    );
    if (!matchesStatus) return false;
    if (!q) return true;
    const items = parseReturnedItemsList(task);
    const itemMatch = items.some((it) => it.item_name.toLowerCase().includes(q));
    return (
      (task.task_id || '').toLowerCase().includes(q) ||
      (task.product_name || '').toLowerCase().includes(q) ||
      (task.assigned_to || '').toLowerCase().includes(q) ||
      itemMatch
    );
  });

  const paginatedReturnedTasks = filteredReturnedTasks.slice(
    (returnPage - 1) * itemsPerPage,
    returnPage * itemsPerPage
  );

  const returnMetrics = {
    totalReturnBatches: filteredReturnedTasks.length,
    pendingReturns: filteredReturnedTasks.filter((t) => !(t.notes || '').includes('[STORE RETURNS ACCEPTED]')).length,
    acceptedReturns: filteredReturnedTasks.filter((t) => (t.notes || '').includes('[STORE RETURNS ACCEPTED]')).length,
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

  // Reset pagination on list changes
  useEffect(() => { setReqPage(1); }, [pendingRequisitions.length]);
  useEffect(() => { setLogsPage(1); }, [dispatchHistoryEntries.length]);
  useEffect(() => { setFgPage(1); }, [fgSearchQuery, fgStatusFilter, filteredFinishedGoodsTasks.length]);
  useEffect(() => { setDamagePage(1); }, [damageSearchQuery, damageFromDate, damageToDate, filteredDamagedTasks.length]);
  useEffect(() => { setReturnPage(1); }, [returnSearchQuery, returnStatusFilter, returnFromDate, returnToDate, filteredReturnedTasks.length]);

  // Paginated slices for all sub-menu tables
  const paginatedRequisitions = pendingRequisitions.slice((reqPage - 1) * itemsPerPage, reqPage * itemsPerPage);
  const paginatedLogs = dispatchHistoryEntries.slice((logsPage - 1) * itemsPerPage, logsPage * itemsPerPage);
  const paginatedFinishedGoods = filteredFinishedGoodsTasks.slice((fgPage - 1) * itemsPerPage, fgPage * itemsPerPage);

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

      {/* 🌟 1. STORE MASTER VIEW */}
      {storeTab === 'master' && (
        <div className="space-y-4">
          {/* Page Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200/80">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Store Master</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {items.length} Items
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Manage raw materials, components and finished goods inventory</p>
            </div>
          </div>

          {/* Classification Filter Tabs & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedItemType('all')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${selectedItemType === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
              >
                <Package size={14} />
                All Items ({metrics.total})
              </button>

              <button
                type="button"
                onClick={() => setSelectedItemType('raw_material')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${selectedItemType === 'raw_material'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
                  }`}
              >
                <Layers size={14} />
                Raw Materials ({metrics.rawCount || 0})
              </button>

              <button
                type="button"
                onClick={() => setSelectedItemType('finished_good')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${selectedItemType === 'finished_good'
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

      {/* 🌟 2. MATERIAL REQUESTS TABLE VIEW */}
      {storeTab === 'requisitions' && (
        <div className="space-y-4">
          {/* Page Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200/80">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Material Requests</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  {pendingRequisitions.length} Pending
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Review, issue and dispatch raw material requisitions for production orders
              </p>
            </div>
          </div>

          {loadingProduction ? (
            <div className="p-12 bg-white rounded-2xl border border-gray-200 text-center text-gray-400 flex flex-col items-center gap-2 shadow-2xs">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
              <span className="font-semibold text-xs">Loading material requisitions & checking warehouse stock...</span>
            </div>
          ) : pendingRequisitions.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-gray-200 text-center text-gray-400 space-y-2 shadow-2xs">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
              <p className="text-sm font-bold text-gray-700">All Material Requests Fulfilled</p>
              <p className="text-xs text-gray-400">There are no pending raw material requisitions from the Production floor.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden flex flex-col">
              <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-50 z-10 border-b border-gray-200 shadow-2xs">
                    <tr className="text-[10px] font-bold text-gray-500 uppercase">
                      <th className="py-3 px-3.5 w-12 text-center bg-slate-50">#</th>
                      <th className="py-3 px-3.5 whitespace-nowrap bg-slate-50">Task / Request ID</th>
                      <th className="py-3 px-3.5 whitespace-nowrap bg-slate-50">Product Name</th>
                      <th className="py-3 px-3.5 text-center whitespace-nowrap bg-slate-50">Batch Target</th>
                      <th className="py-3 px-3.5 whitespace-nowrap bg-slate-50">In-Charge</th>
                      <th className="py-3 px-3.5 text-center whitespace-nowrap bg-slate-50">Required Items</th>
                      <th className="py-3 px-3.5 text-center whitespace-nowrap bg-slate-50">Status</th>
                      <th className="py-3 px-3.5 text-center whitespace-nowrap w-24 bg-slate-50">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {paginatedRequisitions.map((task, idx) => {
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
                      const isExpanded = expandedReqId === task.id;

                      return (
                        <React.Fragment key={task.id}>
                          <tr
                            onClick={() => {
                              setViewItemsModalTask(task);
                              setViewModalTab('summary');
                            }}
                            className={`hover:bg-indigo-50/40 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/20' : ''}`}
                            title="Click row to view requisition & issue materials"
                          >
                            <td className="py-3 px-3.5 text-center text-gray-400 font-medium">{(reqPage - 1) * itemsPerPage + idx + 1}</td>
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                                {task.task_id}
                              </span>
                            </td>
                            <td className="py-3 px-3.5">
                              <span className="font-bold text-gray-900 block">{task.product_name}</span>
                              <span className="text-[10px] text-gray-400">Order Ref: {task.order_id || 'Production Batch'}</span>
                            </td>
                            <td className="py-3 px-3.5 text-center font-bold text-slate-700 whitespace-nowrap">
                              {task.proposed_quantity} Units
                            </td>
                            <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">
                              <span className="font-semibold text-gray-800">{task.assigned_to || 'Unassigned'}</span>
                            </td>
                            <td className="py-3 px-3.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => toggleExpandReq(task.id)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                                  hasZeroStock
                                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                    : hasInsufficient
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                                }`}
                                title="Click to view required BOM items breakdown"
                              >
                                <span>{taskItems.length} Items</span>
                                {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              </button>
                            </td>
                            <td className="py-3 px-3.5 text-center whitespace-nowrap">
                              {isTaskPartiallyIssued ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  <Clock size={11} className="text-amber-600" />
                                  Partially Issued
                                </span>
                              ) : hasZeroStock ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-300">
                                  <AlertCircle size={11} className="text-rose-600" />
                                  Out of Stock
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  <Clock size={11} />
                                  Pending Issue
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => {
                                  setViewItemsModalTask(task);
                                  setViewModalTab('summary');
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer shadow-2xs"
                                title="View requisition details & issue materials"
                              >
                                <Eye size={13} />
                                <span>View</span>
                              </button>
                            </td>
                          </tr>

                          {/* Collapsible Row for Component Breakdown */}
                          {isExpanded && (
                            <tr className="bg-slate-50/80">
                              <td colSpan={8} className="p-3 pl-8">
                                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-2xs">
                                  <div className="p-2.5 bg-slate-100/70 border-b border-gray-200 flex items-center justify-between">
                                    <span className="font-bold text-gray-800 text-[11px]">
                                      BOM Component Breakdown for {task.product_name} ({task.proposed_quantity} Units)
                                    </span>
                                    <span className="text-[10px] text-gray-500">
                                      {taskItems.length} required components
                                    </span>
                                  </div>
                                  <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                      <tr className="bg-slate-50 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200">
                                        <th className="py-2 px-3">Raw Material / Component</th>
                                        <th className="py-2 px-3 text-center">Required Qty</th>
                                        <th className="py-2 px-3 text-center">Dispatched Qty</th>
                                        <th className="py-2 px-3 text-center">Remaining</th>
                                        <th className="py-2 px-3 text-center">Store Stock</th>
                                        <th className="py-2 px-3 text-right">Stock Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                      {taskItems.map((item, iIdx) => {
                                        const req = parseFloat(item.required_qty) || 0;
                                        const iss = parseFloat(item.issued_qty) || 0;
                                        const rem = Math.max(0, req - iss);
                                        const stock = parseFloat(item.current_store_stock) || 0;
                                        const isFullyIssued = rem <= 0;
                                        const isZero = rem > 0 && stock <= 0;
                                        const isLow = rem > 0 && stock > 0 && stock < rem;

                                        return (
                                          <tr key={iIdx} className="hover:bg-slate-50/50">
                                            <td className="py-2 px-3 font-semibold text-gray-900">
                                              {item.item_name}
                                              <span className="text-[10px] text-gray-400 block">{item.category || item.unit || 'Item'}</span>
                                            </td>
                                            <td className="py-2 px-3 text-center font-bold text-slate-700">
                                              {formatQty(req)} {item.unit}
                                            </td>
                                            <td className="py-2 px-3 text-center font-bold text-emerald-700">
                                              {formatQty(iss)} {item.unit}
                                            </td>
                                            <td className="py-2 px-3 text-center font-bold">
                                              <span className={rem > 0 ? 'text-amber-700' : 'text-gray-400'}>
                                                {formatQty(rem)} {item.unit}
                                              </span>
                                            </td>
                                            <td className="py-2 px-3 text-center font-bold">
                                              <span className={isZero ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-800'}>
                                                {formatQty(stock)} {item.unit}
                                              </span>
                                            </td>
                                            <td className="py-2 px-3 text-right">
                                              {isFullyIssued ? (
                                                <span className="text-emerald-700 font-bold text-[10px]">✅ Dispatched</span>
                                              ) : isZero ? (
                                                <span className="text-rose-600 font-bold text-[10px]">❌ Out of Stock</span>
                                              ) : isLow ? (
                                                <span className="text-amber-700 font-bold text-[10px]">⚠️ Low Stock</span>
                                              ) : iss > 0 ? (
                                                <span className="text-blue-700 font-bold text-[10px]">⚡ Partial</span>
                                              ) : (
                                                <span className="text-slate-600 font-semibold text-[10px]">🕒 Pending</span>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={reqPage}
                totalPages={Math.ceil(pendingRequisitions.length / itemsPerPage) || 1}
                totalItems={pendingRequisitions.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setReqPage}
              />
            </div>
          )}
        </div>
      )}

      {/* 🌟 3. DISPATCH LOGS VIEW */}
      {storeTab === 'logs' && (
        <div className="space-y-4">
          {/* Page Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200/80">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Dispatch Logs</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {dispatchHistoryEntries.length} Records
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Dispatched work orders and material dispatch history logs
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden flex flex-col">

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
            <>
              <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-50 z-10 border-b border-gray-200 shadow-2xs text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 whitespace-nowrap bg-slate-50">Task ID</th>
                      <th className="py-3 px-4 whitespace-nowrap bg-slate-50">Dispatch Event</th>
                      <th className="py-3 px-4 whitespace-nowrap bg-slate-50">Dispatch Date & Time</th>
                      <th className="py-3 px-4 whitespace-nowrap bg-slate-50">Finished Product</th>
                      <th className="py-3 px-4 whitespace-nowrap bg-slate-50">Dispatch Summary</th>
                      <th className="py-3 px-4 whitespace-nowrap bg-slate-50">Batch Status</th>
                      <th className="py-3 px-4 whitespace-nowrap bg-slate-50">Dispatched By</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap w-16 bg-slate-50">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedLogs.map((entry) => {
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
              <Pagination
                currentPage={logsPage}
                totalPages={Math.ceil(dispatchHistoryEntries.length / itemsPerPage) || 1}
                totalItems={dispatchHistoryEntries.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setLogsPage}
              />
            </>
          )}
          </div>
        </div>
      )}

      {/* 🌟 4. TAB 4 CONTENT: FINISHED GOODS (ONLY FINISHED GOODS & ACCEPT INWARD) */}
      {storeTab === 'finished-goods' && (
        <div className="space-y-4">
          {/* Page Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200/80">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Finished Goods</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  {fgMetrics.totalReports} Batches Produced
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Review and accept completed finished goods produced by Production into Warehouse stock
              </p>
            </div>
          </div>

          {/* Top KPI Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Box size={20} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase block">Output Batches</span>
                <span className="text-base font-extrabold text-gray-900">{fgMetrics.totalReports}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase block">Finished Units</span>
                <span className="text-base font-extrabold text-emerald-700">{fgMetrics.totalFinishedUnits} Units</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <AlertTriangle size={20} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase block">Defective Units</span>
                <span className="text-base font-extrabold text-rose-700">{fgMetrics.totalDefectUnits} Units</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Check size={20} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase block">Inwarded in Store</span>
                <span className="text-base font-extrabold text-blue-700">{fgMetrics.inwardedCount} Batches</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Clock size={20} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase block">Pending Inward</span>
                <span className="text-base font-extrabold text-amber-700">{fgMetrics.pendingInwardCount} Batches</span>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Search Finished Goods</label>
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search task ID, finished product name, in-charge..."
                  value={fgSearchQuery}
                  onChange={(e) => setFgSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-gray-900 outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Inward Status</label>
              <select
                value={fgStatusFilter}
                onChange={(e) => setFgStatusFilter(e.target.value)}
                className="w-full p-1.5 border border-gray-300 rounded-lg text-gray-900 outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              >
                <option value="all">All Inward Statuses</option>
                <option value="pending">Pending Inward</option>
                <option value="accepted">Accepted / Inwarded</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setFgSearchQuery('');
                  setFgStatusFilter('all');
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg font-semibold text-gray-700 transition cursor-pointer"
              >
                <RefreshCw size={13} className={loadingProduction ? "animate-spin" : ""} /> Reset Filters
              </button>
            </div>
          </div>

          {/* Finished Goods Table */}
          {loadingProduction ? (
            <div className="p-12 bg-white rounded-2xl border border-gray-200 text-center text-gray-400 flex flex-col items-center gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-purple-600" />
              <span className="font-semibold">Loading Finished Goods...</span>
            </div>
          ) : filteredFinishedGoodsTasks.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-gray-200 text-center text-gray-400 space-y-2">
              <Box className="w-12 h-12 mx-auto text-gray-300" />
              <p className="text-sm font-bold text-gray-700">No Finished Goods Found</p>
              <p className="text-xs text-gray-400">When production completes batches, finished goods will appear here for store inward acceptance.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs flex flex-col">
              <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-50 z-10 border-b border-gray-200 shadow-2xs">
                    <tr className="text-[10px] font-bold text-gray-500 uppercase">
                      <th className="py-3 px-3.5 w-12 text-center bg-slate-50">#</th>
                      <th className="py-3 px-3.5 whitespace-nowrap bg-slate-50">Task ID</th>
                      <th className="py-3 px-3.5 whitespace-nowrap bg-slate-50">Finished Product</th>
                      <th className="py-3 px-3.5 text-center whitespace-nowrap bg-slate-50">Batch Target</th>
                      <th className="py-3 px-3.5 text-center whitespace-nowrap bg-slate-50">Produced Output</th>
                      <th className="py-3 px-3.5 text-center whitespace-nowrap bg-slate-50">Defective Units</th>
                      <th className="py-3 px-3.5 whitespace-nowrap bg-slate-50">Produced Date</th>
                      <th className="py-3 px-3.5 text-center whitespace-nowrap bg-slate-50">Production Status</th>
                      <th className="py-3 px-3.5 text-center whitespace-nowrap bg-slate-50">Store Inward</th>
                      <th className="py-3 px-3.5 text-center whitespace-nowrap w-20 bg-slate-50">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {paginatedFinishedGoods.map((task, idx) => {
                      const fin = parseFloat(task.finished_quantity) || 0;
                      const proposed = parseFloat(task.proposed_quantity) || 1;
                      const rawRej = parseFloat(task.rejected_quantity) || 0;
                      const rej = rawRej > 0 ? rawRej : ((task.status || '').toLowerCase() === 'completed' ? Math.max(0, proposed - fin) : 0);
                      const isInwardAccepted = (task.notes || '').includes('[STORE FG INWARD ACCEPTED]');
                      const isCompleted = (task.status || '').toLowerCase() === 'completed';
                      const isProcessing = processingId === task.id;

                      return (
                        <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-3.5 text-center text-gray-400 font-medium">
                            {(fgPage - 1) * itemsPerPage + idx + 1}
                          </td>
                          <td className="py-3.5 px-3.5 font-mono font-bold text-purple-700 whitespace-nowrap">
                            {task.task_id}
                          </td>
                          <td className="py-3.5 px-3.5">
                            <span className="font-bold text-gray-900 block">{task.product_name}</span>
                            <span className="text-[10px] text-gray-400">By: {task.assigned_to || 'Production Team'}</span>
                          </td>
                          <td className="py-3.5 px-3.5 text-center font-bold text-slate-700 whitespace-nowrap">
                            {proposed} Units
                          </td>
                          <td className="py-3.5 px-3.5 text-center whitespace-nowrap font-bold text-emerald-700">
                            {fin} Units
                          </td>
                          <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                            <span className={`font-bold ${rej > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {rej > 0 ? `${rej} Units` : '0'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5 text-slate-600 whitespace-nowrap text-xs">
                            {formatDate(task.completion_date || task.updated_at || task.created_at)}
                          </td>
                          <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${isCompleted
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              }`}>
                              {task.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                            {isInwardAccepted ? (
                              <span className="text-emerald-700 font-bold text-xs inline-flex items-center gap-1">
                                <CheckCircle2 size={13} className="text-emerald-600" />
                                Inwarded (+{fin} Units)
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAcceptFinishedGoods(task)}
                                disabled={isProcessing}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                              >
                                <CheckCircle2 size={13} />
                                <span>{isProcessing ? 'Inwarding...' : 'Accept Inward'}</span>
                              </button>
                            )}
                          </td>
                          <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setViewOutputReportTask(task)}
                              title="View Output Details"
                              className="p-1.5 bg-slate-100 hover:bg-purple-50 hover:text-purple-600 text-slate-700 font-bold rounded-lg transition text-xs border border-slate-300 shadow-2xs cursor-pointer inline-flex items-center justify-center"
                            >
                              <Eye size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={fgPage}
                totalPages={Math.ceil(filteredFinishedGoodsTasks.length / itemsPerPage) || 1}
                totalItems={filteredFinishedGoodsTasks.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setFgPage}
              />
            </div>
          )}
        </div>
      )}

      {/* 🌟 5. TAB 5 CONTENT: DAMAGE & RETURNS TO STORE (2 SEPARATE TABS) */}
      {storeTab === 'damage-returns' && (
        <div className="space-y-4">
          {/* Page Heading & Sub-Tab Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200/80">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Damage & Returns</h1>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Review damaged/scrap production items and accept returned materials back into Store inventory
              </p>
            </div>

            {/* Sub-Tab Switcher: Damaged Items vs Returned Items */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setDrActiveTab('damage')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  drActiveTab === 'damage'
                    ? 'bg-white text-rose-700 shadow-xs border border-gray-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-slate-200/50'
                }`}
              >
                <AlertTriangle size={14} className={drActiveTab === 'damage' ? 'text-rose-600' : 'text-gray-400'} />
                <span>Damaged Items</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  drActiveTab === 'damage' ? 'bg-rose-100 text-rose-800' : 'bg-gray-200 text-gray-700'
                }`}>
                  {rawDamagedTasks.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDrActiveTab('returns')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  drActiveTab === 'returns'
                    ? 'bg-white text-blue-700 shadow-xs border border-gray-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-slate-200/50'
                }`}
              >
                <RotateCcw size={14} className={drActiveTab === 'returns' ? 'text-blue-600' : 'text-gray-400'} />
                <span>Returned Items</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  drActiveTab === 'returns' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-700'
                }`}>
                  {rawReturnedTasks.length}
                </span>
                {returnMetrics.pendingReturns > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Pending returns awaiting Store acceptance" />
                )}
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 🔴 SUB-TAB 1: DAMAGED ITEMS */}
          {/* ========================================================= */}
          {drActiveTab === 'damage' && (
            <div className="space-y-4">
              {/* Top Header & Download Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-2xs">
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                    Damaged / Scrapped Raw Materials Report
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    View incident-wise scrapped BOM materials or export detailed / aggregated summary reports.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() =>
                      exportDamagedItemsDetailedReport(filteredDamagedTasks, {
                        from: damageFromDate,
                        to: damageToDate,
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs transition cursor-pointer shadow-2xs hover:shadow-xs"
                    title="Export task-by-task damaged materials breakdown to Excel"
                  >
                    <Download size={13} />
                    <span>Download Details Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      exportDamagedItemsSummaryReport(aggregatedDamagedItems, {
                        from: damageFromDate,
                        to: damageToDate,
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs transition cursor-pointer shadow-xs hover:shadow-md"
                    title="Export item-wise aggregated scrap totals for the selected period to Excel"
                  >
                    <Download size={13} />
                    <span>Download Summary Report</span>
                  </button>
                </div>
              </div>

              {/* Metrics Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                    <FileText size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-gray-500 uppercase block">Damage Reports / Batches</span>
                    <span className="text-base font-extrabold text-gray-900">{damageMetrics.totalReports}</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-gray-500 uppercase block">Unique Damaged Items</span>
                    <span className="text-base font-extrabold text-rose-700">{damageMetrics.totalDamagedTypes} Types</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Wrench size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-gray-500 uppercase block">Total Scrapped Qty in Period</span>
                    <span className="text-base font-extrabold text-amber-700">{damageMetrics.totalDamagedQty.toLocaleString()} Units</span>
                  </div>
                </div>
              </div>

              {/* Filter Bar with Calendar Date Pickers */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Search Damaged Items</label>
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search task ID, associated product, damaged item name..."
                        value={damageSearchQuery}
                        onChange={(e) => {
                          setDamageSearchQuery(e.target.value);
                          setDamagePage(1);
                        }}
                        className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-gray-900 outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">From Date</label>
                    <input
                      type="date"
                      value={damageFromDate}
                      onChange={(e) => {
                        setDamageFromDate(e.target.value);
                        setDamagePage(1);
                      }}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-gray-900 outline-none focus:ring-1 focus:ring-rose-500 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">To Date</label>
                    <input
                      type="date"
                      value={damageToDate}
                      onChange={(e) => {
                        setDamageToDate(e.target.value);
                        setDamagePage(1);
                      }}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-gray-900 outline-none focus:ring-1 focus:ring-rose-500 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <button
                      type="button"
                      onClick={() => {
                        setDamageSearchQuery('');
                        setDamageFromDate(getFirstDayOfMonth());
                        setDamageToDate(getTodayDate());
                        setDamagePage(1);
                      }}
                      className="w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-[11px] border border-gray-300 transition cursor-pointer"
                      title="Reset filters to this month"
                    >
                      <RefreshCw size={11} className={loadingProduction ? "animate-spin" : ""} /> Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Damaged Items Detailed Table */}
              {loadingProduction ? (
                <div className="p-12 bg-white rounded-2xl border border-gray-200 text-center text-gray-400 flex flex-col items-center gap-2">
                  <Loader2 className="w-7 h-7 animate-spin text-rose-600" />
                  <span className="font-semibold">Loading Damaged Items...</span>
                </div>
              ) : filteredDamagedTasks.length === 0 ? (
                <div className="p-12 bg-white rounded-2xl border border-gray-200 text-center text-gray-400 space-y-2">
                  <AlertTriangle className="w-12 h-12 mx-auto text-gray-300" />
                  <p className="text-sm font-bold text-gray-700">No Damaged Items Found</p>
                  <p className="text-xs text-gray-400">
                    {damageFromDate || damageToDate || damageSearchQuery
                      ? "No records match your selected date range or search keyword. Try clearing filters."
                      : "When raw materials or components are marked damaged/scrapped, they will appear here."}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs flex flex-col">
                  <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-slate-50 z-10 border-b border-gray-200 shadow-2xs">
                        <tr className="text-[10px] font-bold text-gray-500 uppercase">
                          <th className="py-3 px-3.5 w-12 text-center bg-slate-50">#</th>
                          <th className="py-3 px-3.5 whitespace-nowrap bg-slate-50">Task ID</th>
                          <th className="py-3 px-3.5 whitespace-nowrap bg-slate-50">Product / Task</th>
                          <th className="py-3 px-3.5 whitespace-nowrap bg-slate-50">Damaged Items Summary</th>
                          <th className="py-3 px-3.5 whitespace-nowrap bg-slate-50">Reported Date</th>
                          <th className="py-3 px-3.5 text-center whitespace-nowrap w-28 bg-slate-50">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {paginatedDamagedTasks.map((task, idx) => {
                          const isExpanded = expandedDamageId === task.id;
                          const damagedItems = parseDamagedItemsList(task);

                          return (
                            <React.Fragment key={task.id}>
                              <tr className={`hover:bg-slate-50/70 transition-colors ${isExpanded ? 'bg-rose-50/20' : ''}`}>
                                <td className="py-3.5 px-3.5 text-center text-gray-400 font-medium">
                                  {(damagePage - 1) * itemsPerPage + idx + 1}
                                </td>
                                <td className="py-3.5 px-3.5 font-mono font-bold text-rose-700 whitespace-nowrap">
                                  {task.task_id}
                                </td>
                                <td className="py-3.5 px-3.5">
                                  <span className="font-bold text-gray-900 block">{task.product_name}</span>
                                  <span className="text-[10px] text-gray-400">By: {task.assigned_to || 'Production Team'}</span>
                                </td>
                                <td className="py-3.5 px-3.5 text-slate-700 whitespace-nowrap">
                                  <span className="font-bold text-slate-800">
                                    {damagedItems.length} Damaged Item(s)
                                  </span>
                                </td>
                                <td className="py-3.5 px-3.5 text-slate-600 whitespace-nowrap text-xs">
                                  {formatDate(task.completion_date || task.updated_at || task.created_at)}
                                </td>
                                <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedDamageId(isExpanded ? null : task.id)}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer border ${
                                      isExpanded
                                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                                        : 'bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-gray-300'
                                    }`}
                                  >
                                    <span>{isExpanded ? 'Collapse' : 'View Items'}</span>
                                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                  </button>
                                </td>
                              </tr>

                              {/* Collapsible Damaged Items Sub-Table */}
                              {isExpanded && (
                                <tr className="bg-rose-50/30">
                                  <td colSpan={6} className="p-4 border-t border-b border-rose-200/60">
                                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                                      <div className="px-4 py-2.5 bg-slate-50 border-b border-gray-200 flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-800">
                                          Damaged / Scrapped Raw Materials ({damagedItems.length} Items)
                                        </span>
                                        <span className="text-[11px] text-gray-500 font-medium">Task: {task.task_id}</span>
                                      </div>
                                      <table className="w-full text-left border-collapse text-xs">
                                        <thead className="bg-slate-50 border-b border-gray-200">
                                          <tr className="text-[10px] font-bold text-gray-500 uppercase">
                                            <th className="py-2.5 px-3.5 w-10 text-center">#</th>
                                            <th className="py-2.5 px-3.5">Damaged Item Name</th>
                                            <th className="py-2.5 px-3.5 text-center">Damaged / Scrap Qty</th>
                                            <th className="py-2.5 px-3.5 text-center">Unit</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                          {damagedItems.map((item, dIdx) => (
                                            <tr key={dIdx} className="hover:bg-slate-50/60">
                                              <td className="py-2.5 px-3.5 text-center text-gray-400 font-medium">{dIdx + 1}</td>
                                              <td className="py-2.5 px-3.5 font-bold text-gray-900">{item.item_name}</td>
                                              <td className="py-2.5 px-3.5 text-center font-bold text-rose-600">{item.qty}</td>
                                              <td className="py-2.5 px-3.5 text-center text-slate-600">{item.unit}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    currentPage={damagePage}
                    totalPages={Math.ceil(filteredDamagedTasks.length / itemsPerPage) || 1}
                    totalItems={filteredDamagedTasks.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setDamagePage}
                  />
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 🔵 SUB-TAB 2: RETURNED ITEMS TO STORE */}
          {/* ========================================================= */}
          {drActiveTab === 'returns' && (
            <div className="space-y-4">
              {/* Top Header & Download Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-2xs">
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                    Returned Items from Production
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Accept unused raw material returns back into store stock and export returns records.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    exportReturnedItemsReport(filteredReturnedTasks, {
                      from: returnFromDate,
                      to: returnToDate,
                    })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold text-xs transition cursor-pointer shadow-2xs hover:shadow-xs"
                  title="Export returned materials records to Excel"
                >
                  <Download size={13} />
                  <span>Download Returns Report</span>
                </button>
              </div>

              {/* Top Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <RotateCcw size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-gray-500 uppercase block">Total Return Batches</span>
                    <span className="text-base font-extrabold text-gray-900">{returnMetrics.totalReturnBatches}</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Clock size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-gray-500 uppercase block">Pending Store Acceptance</span>
                    <span className="text-base font-extrabold text-amber-700">{returnMetrics.pendingReturns} Batches</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-gray-500 uppercase block">Accepted in Store</span>
                    <span className="text-base font-extrabold text-emerald-700">{returnMetrics.acceptedReturns} Batches</span>
                  </div>
                </div>
              </div>

              {/* Filter Bar with Calendar Date Pickers */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Search Returned Items</label>
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search task, product, item..."
                        value={returnSearchQuery}
                        onChange={(e) => {
                          setReturnSearchQuery(e.target.value);
                          setReturnPage(1);
                        }}
                        className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Acceptance Status</label>
                    <select
                      value={returnStatusFilter}
                      onChange={(e) => {
                        setReturnStatusFilter(e.target.value);
                        setReturnPage(1);
                      }}
                      className="w-full p-1.5 border border-gray-300 rounded-lg text-gray-900 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending Acceptance</option>
                      <option value="accepted">Accepted in Store</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">From Date</label>
                    <input
                      type="date"
                      value={returnFromDate}
                      onChange={(e) => {
                        setReturnFromDate(e.target.value);
                        setReturnPage(1);
                      }}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-gray-900 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">To Date</label>
                    <input
                      type="date"
                      value={returnToDate}
                      onChange={(e) => {
                        setReturnToDate(e.target.value);
                        setReturnPage(1);
                      }}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-gray-900 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReturnSearchQuery('');
                        setReturnStatusFilter('all');
                        setReturnFromDate(getFirstDayOfMonth());
                        setReturnToDate(getTodayDate());
                        setReturnPage(1);
                      }}
                      className="w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-[11px] border border-gray-300 transition cursor-pointer"
                      title="Reset filters to this month"
                    >
                      <RefreshCw size={11} className={loadingProduction ? "animate-spin" : ""} /> Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Returned Items Table */}
              {loadingProduction ? (
                <div className="p-12 bg-white rounded-2xl border border-gray-200 text-center text-gray-400 flex flex-col items-center gap-2">
                  <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                  <span className="font-semibold">Loading Returned Items...</span>
                </div>
              ) : filteredReturnedTasks.length === 0 ? (
                <div className="p-12 bg-white rounded-2xl border border-gray-200 text-center text-gray-400 space-y-2">
                  <RotateCcw className="w-12 h-12 mx-auto text-gray-300" />
                  <p className="text-sm font-bold text-gray-700">No Returned Items Found</p>
                  <p className="text-xs text-gray-400">When unused materials are returned from production, they will appear here for store acceptance.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs flex flex-col">
                  <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-slate-50 z-10 border-b border-gray-200 shadow-2xs">
                        <tr className="text-[10px] font-bold text-gray-500 uppercase">
                          <th className="py-3 px-3.5 w-12 text-center bg-slate-50">#</th>
                          <th className="py-3 px-3.5 whitespace-nowrap bg-slate-50">Task ID</th>
                          <th className="py-3 px-3.5 whitespace-nowrap bg-slate-50">Finished Product</th>
                          <th className="py-3 px-3.5 whitespace-nowrap bg-slate-50">Returned Items Summary</th>
                          <th className="py-3 px-3.5 whitespace-nowrap bg-slate-50">Returned Date</th>
                          <th className="py-3 px-3.5 text-center whitespace-nowrap bg-slate-50">Store Inward Status</th>
                          <th className="py-3 px-3.5 text-center whitespace-nowrap w-28 bg-slate-50">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {paginatedReturnedTasks.map((task, idx) => {
                          const isExpanded = expandedReturnId === task.id;
                          const returnedItems = parseReturnedItemsList(task);
                          const isReturnsAccepted = (task.notes || '').includes('[STORE RETURNS ACCEPTED]');
                          const isProcessing = processingId === task.id;

                          return (
                            <React.Fragment key={task.id}>
                              <tr className={`hover:bg-slate-50/70 transition-colors ${isExpanded ? 'bg-blue-50/20' : ''}`}>
                                <td className="py-3.5 px-3.5 text-center text-gray-400 font-medium">
                                  {(returnPage - 1) * itemsPerPage + idx + 1}
                                </td>
                                <td className="py-3.5 px-3.5 font-mono font-bold text-blue-700 whitespace-nowrap">
                                  {task.task_id}
                                </td>
                                <td className="py-3.5 px-3.5">
                                  <span className="font-bold text-gray-900 block">{task.product_name}</span>
                                  <span className="text-[10px] text-gray-400">By: {task.assigned_to || 'Production Team'}</span>
                                </td>
                                <td className="py-3.5 px-3.5 text-slate-700 max-w-xs">
                                  <span className="font-bold text-blue-800 block">
                                    {returnedItems.length} Returned Item(s)
                                  </span>
                                  <span className="text-[11px] text-gray-500 truncate block">
                                    {returnedItems.map(it => `${it.item_name} (${it.qty} ${it.unit})`).join(', ')}
                                  </span>
                                </td>
                                <td className="py-3.5 px-3.5 text-slate-600 whitespace-nowrap text-xs">
                                  {formatDate(task.completion_date || task.updated_at || task.created_at)}
                                </td>
                                <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                                  {isReturnsAccepted ? (
                                    <span className="text-emerald-700 font-bold text-xs inline-flex items-center gap-1">
                                      <CheckCircle2 size={13} className="text-emerald-600" />
                                      Accepted in Store
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleAcceptReturns(task)}
                                      disabled={isProcessing}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                      <CheckCircle2 size={13} />
                                      <span>{isProcessing ? 'Accepting...' : 'Accept'}</span>
                                    </button>
                                  )}
                                </td>
                                <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedReturnId(isExpanded ? null : task.id)}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer border ${
                                      isExpanded
                                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                                        : 'bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border-gray-300'
                                    }`}
                                  >
                                    <span>{isExpanded ? 'Collapse' : 'View Items'}</span>
                                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                  </button>
                                </td>
                              </tr>

                              {/* Collapsible Returned Items Sub-Table */}
                              {isExpanded && (
                                <tr className="bg-blue-50/30">
                                  <td colSpan={7} className="p-4 border-t border-b border-blue-200/60">
                                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                                      <div className="px-4 py-2.5 bg-slate-50 border-b border-gray-200 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold text-gray-800">
                                            Returned Items to Store ({returnedItems.length} Items)
                                          </span>
                                          {isReturnsAccepted ? (
                                            <span className="text-emerald-700 font-bold text-[11px] inline-flex items-center gap-1">
                                              <CheckCircle2 size={12} /> Stock Credited
                                            </span>
                                          ) : (
                                            <span className="text-amber-700 font-bold text-[11px] inline-flex items-center gap-1">
                                              <Clock size={12} /> Pending Store Acceptance
                                            </span>
                                          )}
                                        </div>
                                        {!isReturnsAccepted && (
                                          <button
                                            type="button"
                                            onClick={() => handleAcceptReturns(task)}
                                            disabled={isProcessing}
                                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                                          >
                                            <CheckCircle2 size={13} />
                                            <span>{isProcessing ? 'Accepting...' : 'Accept All Returned Items'}</span>
                                          </button>
                                        )}
                                      </div>
                                      <table className="w-full text-left border-collapse text-xs">
                                        <thead className="bg-slate-50 border-b border-gray-200">
                                          <tr className="text-[10px] font-bold text-gray-500 uppercase">
                                            <th className="py-2.5 px-3.5 w-10 text-center">#</th>
                                            <th className="py-2.5 px-3.5">Item Name</th>
                                            <th className="py-2.5 px-3.5 text-center">Returned Qty</th>
                                            <th className="py-2.5 px-3.5 text-center">Unit</th>
                                            <th className="py-2.5 px-3.5">Stock Impact</th>
                                            <th className="py-2.5 px-3.5 text-center">Store Status</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                          {returnedItems.map((item, rIdx) => (
                                            <tr key={rIdx} className="hover:bg-slate-50/60">
                                              <td className="py-2.5 px-3.5 text-center text-gray-400 font-medium">{rIdx + 1}</td>
                                              <td className="py-2.5 px-3.5 font-bold text-gray-900">{item.item_name}</td>
                                              <td className="py-2.5 px-3.5 text-center font-bold text-blue-700">+{item.qty}</td>
                                              <td className="py-2.5 px-3.5 text-center text-slate-600">{item.unit}</td>
                                              <td className="py-2.5 px-3.5 text-slate-700 font-medium">Increases Warehouse Stock</td>
                                              <td className="py-2.5 px-3.5 text-center font-bold text-xs">
                                                {isReturnsAccepted ? (
                                                  <span className="text-emerald-700">Credited to Store</span>
                                                ) : (
                                                  <span className="text-amber-700">Pending Acceptance</span>
                                                )}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    currentPage={returnPage}
                    totalPages={Math.ceil(filteredReturnedTasks.length / itemsPerPage) || 1}
                    totalItems={filteredReturnedTasks.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setReturnPage}
                  />
                </div>
              )}
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
                      Material Requisition Review
                    </h3>
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                      {viewItemsModalTask.task_id}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Product: <strong>{viewItemsModalTask.product_name}</strong> | Batch Target: <strong>{viewItemsModalTask.proposed_quantity} Units</strong> | Status: <strong className="text-indigo-700">{viewItemsModalTask.status}</strong>
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

            {/* Modal Body: Raw Materials Breakdown Table */}
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

            {/* Modal Footer */}
            {(() => {
              const taskItems = viewItemsModalTask.items || [];
              const isTaskPartiallyIssued =
                (viewItemsModalTask.status || '').toLowerCase() === 'partially issued' ||
                taskItems.some((it) => (parseFloat(it.issued_qty) || 0) > 0);

              const hasRemainingToIssue = taskItems.some((it) => {
                const req = parseFloat(it.required_qty) || 0;
                const iss = parseFloat(it.issued_qty) || 0;
                return req - iss > 0;
              });

              const outOfStockItems = taskItems.filter((it) => {
                const req = parseFloat(it.required_qty) || 0;
                const iss = parseFloat(it.issued_qty) || 0;
                const rem = Math.max(0, req - iss);
                return rem > 0 && (parseFloat(it.current_store_stock) || 0) <= 0;
              });

              const hasZeroStock = outOfStockItems.length > 0;
              const isProcessing = processingId === viewItemsModalTask.id;
              const isActionable = hasRemainingToIssue && !['completed', 'material rejected'].includes((viewItemsModalTask.status || '').toLowerCase());

              if (!isActionable) {
                return (
                  <div className="flex justify-end pt-2 border-t border-gray-100 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewItemsModalTask(null)}
                      className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                );
              }

              return (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-gray-200 shrink-0 bg-slate-50/70 -mx-5 -mb-5 p-4 rounded-b-2xl">
                  <div className="flex items-center gap-2 text-xs">
                    {hasZeroStock ? (
                      <span className="text-rose-600 font-bold flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                        <AlertCircle size={14} className="text-rose-600" />
                        <span>{outOfStockItems.length} Component(s) Out of Stock</span>
                      </span>
                    ) : isTaskPartiallyIssued ? (
                      <span className="text-amber-800 font-bold flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        <Clock size={14} className="text-amber-600" />
                        <span>Partially Issued Request</span>
                      </span>
                    ) : (
                      <span className="text-emerald-800 font-bold flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span>All components available in Warehouse</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 flex-wrap">
                    {/* Reject Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const taskToReject = viewItemsModalTask;
                        setViewItemsModalTask(null);
                        setRejectModalTask(taskToReject);
                        setRejectionReason(hasZeroStock ? `Component "${outOfStockItems[0]?.item_name}" is Out of Stock in warehouse.` : '');
                      }}
                      disabled={isProcessing}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      title="Reject this material requisition"
                    >
                      <XCircle size={14} />
                      <span>Reject</span>
                    </button>

                    {/* Partial Issue Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const taskToPartial = viewItemsModalTask;
                        setViewItemsModalTask(null);
                        handleOpenPartialIssue(taskToPartial);
                      }}
                      disabled={isProcessing}
                      className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      title="Dispatch specific quantity of available items"
                    >
                      <Layers size={14} />
                      <span>Partial Issue</span>
                    </button>

                    {/* Full Issue Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const taskToDispatch = viewItemsModalTask;
                        setViewItemsModalTask(null);
                        handleAcceptDispatch(taskToDispatch);
                      }}
                      disabled={isTaskPartiallyIssued || hasZeroStock || isProcessing}
                      className={`px-4 py-1.5 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs ${
                        isTaskPartiallyIssued || hasZeroStock
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-emerald-200'
                      }`}
                      title={isTaskPartiallyIssued ? 'Task is partially issued. Use Partial Issue for remaining items.' : hasZeroStock ? 'Cannot full issue: components are out of stock' : 'Issue all remaining required BOM materials'}
                    >
                      <CheckCircle2 size={14} />
                      <span>Issue (Full)</span>
                    </button>

                    {/* Close Button */}
                    <button
                      type="button"
                      onClick={() => setViewItemsModalTask(null)}
                      className="px-3.5 py-1.5 bg-gray-200/70 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              );
            })()}
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