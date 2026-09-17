import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  MapPin,
  Calendar,
  X,
  Eye,
  RefreshCw,
  Package,
} from 'lucide-react';
import { getMaterialReceipts } from '../services/deliveryService';
import { VerifyMaterialReceiptModal } from '../components/VerifyMaterialReceiptModal';
import { Pagination } from '../../../components/common/pagination';

export const MaterialReceiptPage = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dispatchDate: '',
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const res = await getMaterialReceipts();
      if (res?.data) {
        setReceipts(res.data);
      } else if (Array.isArray(res)) {
        setReceipts(res);
      }
    } catch (err) {
      console.error('Failed to fetch material receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
      dispatchDate: '',
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.status || filters.dispatchDate
  );

  const getLocalDateString = (dateInput) => {
    if (!dateInput) return '';
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
      return dateInput.substring(0, 10);
    }
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const parts = dateStr.substring(0, 10).split('-');
      return `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}/${parts[0]}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-IN');
  };

  // Filtered receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter((item) => {
      const q = filters.search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (item.challan_no && item.challan_no.toLowerCase().includes(q)) ||
        (item.po_number && item.po_number.toLowerCase().includes(q)) ||
        (item.customer_name && item.customer_name.toLowerCase().includes(q)) ||
        (item.site_engineer_name && item.site_engineer_name.toLowerCase().includes(q));

      const matchesStatus =
        !filters.status || item.receipt_status === filters.status;

      let matchesDate = true;
      if (filters.dispatchDate) {
        const itemDateStr = getLocalDateString(item.dispatch_date);
        matchesDate = itemDateStr === filters.dispatchDate;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [receipts, filters]);

  const handleOpenVerify = (receipt) => {
    setSelectedReceipt(receipt);
    setIsVerifyModalOpen(true);
  };

  // Statistics
  const pendingCount = receipts.filter(
    (r) => !r.receipt_status || r.receipt_status === 'Pending' || r.receipt_status === 'Pending Receipt'
  ).length;
  const acceptedCount = receipts.filter(
    (r) => r.receipt_status && r.receipt_status !== 'Pending' && r.receipt_status !== 'Pending Receipt'
  ).length;

  // Pagination calculations
  const totalItems = filteredReceipts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedReceipts = filteredReceipts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getReceiptBadge = (status) => {
    switch (status) {
      case 'Fully Received':
        return {
          className: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
          icon: <CheckCircle2 size={12} />,
          text: 'Fully Received',
        };
      case 'Partially Received':
        return {
          className: 'bg-blue-100 text-blue-800 border border-blue-200',
          icon: <CheckCircle2 size={12} />,
          text: 'Partially Received',
        };
      case 'Short Received':
        return {
          className: 'bg-amber-100 text-amber-800 border border-amber-200',
          icon: <AlertTriangle size={12} />,
          text: 'Short Received',
        };
      case 'Excess Received':
        return {
          className: 'bg-purple-100 text-purple-800 border border-purple-200',
          icon: <CheckCircle2 size={12} />,
          text: 'Excess Received',
        };
      case 'Damaged Material Reported':
        return {
          className: 'bg-rose-100 text-rose-800 border border-rose-200',
          icon: <AlertTriangle size={12} />,
          text: 'Damaged Material Reported',
        };
      case 'Pending Receipt':
      case 'Pending':
      default:
        return {
          className: 'bg-amber-50 text-amber-700 border border-amber-200',
          icon: <Clock size={12} />,
          text: 'Pending Receipt',
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardCheck size={24} className="text-blue-600" />
            Material Receipts & Site Inward Acceptance
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Verify materials received at project site, match line item quantities, and record site engineer acceptances.
          </p>
        </div>

        <button
          onClick={fetchReceipts}
          className="flex items-center gap-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold px-3 py-2 rounded-lg shadow-xs transition"
          title="Refresh List"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Summary KPI Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Total Dispatches
            </span>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{receipts.length}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Package size={22} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
              Pending Acceptance
            </span>
            <p className="text-2xl font-bold text-amber-700 mt-0.5">{pendingCount}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
              Site Verified & Accepted
            </span>
            <p className="text-2xl font-bold text-emerald-700 mt-0.5">{acceptedCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {/* Filter Bar Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search Input */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
              Search Receipt
            </label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search Delivery No, PO, Customer, Engineer..."
                className="w-full bg-white text-gray-800 text-xs border border-gray-300 rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
              Receipt Status (Section 9.2)
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full bg-white text-gray-800 text-xs border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Receipt Statuses</option>
              <option value="Pending Receipt">Pending Receipt</option>
              <option value="Partially Received">Partially Received</option>
              <option value="Fully Received">Fully Received</option>
              <option value="Short Received">Short Received</option>
              <option value="Excess Received">Excess Received</option>
              <option value="Damaged Material Reported">Damaged Material Reported</option>
            </select>
          </div>

          {/* Dispatch Date Filter */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
              Dispatch Date
            </label>
            <input
              type="date"
              name="dispatchDate"
              value={filters.dispatchDate}
              onChange={handleFilterChange}
              className="w-full bg-white text-gray-800 text-xs border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Clear Filters Indicator */}
        {hasActiveFilters && (
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
            <span className="text-[11px] text-gray-500">
              Filtered: <strong className="text-gray-800">{filteredReceipts.length}</strong> of {receipts.length} dispatches
            </span>
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 transition"
            >
              <X size={14} /> Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-gray-500">Loading material receipts...</div>
        ) : filteredReceipts.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500">
            {hasActiveFilters
              ? 'No material receipts match the selected filters.'
              : 'No dispatched delivery records found.'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[850px]">
                <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Delivery No</th>
                    <th className="py-3 px-4">Project / PO</th>
                    <th className="py-3 px-4">Customer & Site</th>
                    <th className="py-3 px-4">Assigned Site Engineer</th>
                    <th className="py-3 px-4">Dispatch Date</th>
                    <th className="py-3 px-4 text-center">Items</th>
                    <th className="py-3 px-4 text-right">Dispatched Qty</th>
                    <th className="py-3 px-4 text-center">Receipt Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedReceipts.map((item) => {
                    const isAccepted =
                      item.receipt_status &&
                      item.receipt_status !== 'Pending' &&
                      item.receipt_status !== 'Pending Receipt';
                    const badge = getReceiptBadge(item.receipt_status);

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/70">
                        <td className="py-3 px-4 font-bold text-blue-600">
                          {item.challan_no}
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-800">
                          {item.po_number || `SO #${item.order_id}`}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-800">{item.customer_name}</div>
                          <div className="text-[11px] text-gray-400 truncate max-w-[180px]" title={item.delivery_address}>
                            {item.delivery_address}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-900 flex items-center gap-1">
                            <User size={13} className="text-blue-600" />
                            {item.site_engineer_name || 'Not Assigned'}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {item.site_engineer_phone || '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {formatDate(item.dispatch_date)}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-medium text-gray-700">
                          {item.total_items_count || (item.items ? item.items.length : 0)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                          {item.total_dispatched_qty}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${badge.className}`}
                          >
                            {badge.icon}
                            {badge.text}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleOpenVerify(item)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition ${
                              isAccepted
                                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                            title={isAccepted ? 'View / Edit Receipt Verification' : 'Verify & Match Quantities'}
                          >
                            {isAccepted ? (
                              <>
                                <Eye size={13} /> View
                              </>
                            ) : (
                              <>
                                <ClipboardCheck size={13} /> Verify Receipt
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Verify & Match Modal */}
      <VerifyMaterialReceiptModal
        isOpen={isVerifyModalOpen}
        onClose={() => {
          setIsVerifyModalOpen(false);
          setSelectedReceipt(null);
        }}
        receipt={selectedReceipt}
        onSuccess={() => {
          fetchReceipts();
        }}
      />
    </div>
  );
};
