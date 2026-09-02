import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Eye, Truck, Search, Filter, Calendar, X, MessageSquare, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getAllDeliveryChallans, getDeliveryChallanById } from '../services/deliveryService';
import { ViewDeliveryChallanModal } from '../components/ViewDeliveryChallanModal';
import { Pagination } from '../../../components/common/pagination';

export const DeliveryList = ({ onAddNew }) => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    receiptStatus: '',
    dispatchDate: '',
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const res = await getAllDeliveryChallans();
      if (res?.data) {
        setDeliveries(res.data);
      } else if (Array.isArray(res)) {
        setDeliveries(res);
      }
    } catch (err) {
      console.error('Failed to fetch delivery challans:', err);
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
      receiptStatus: '',
      dispatchDate: '',
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.status || filters.receiptStatus || filters.dispatchDate
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

  // Filtered deliveries list
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((item) => {
      const q = filters.search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (item.challan_no && item.challan_no.toLowerCase().includes(q)) ||
        (item.customer_name && item.customer_name.toLowerCase().includes(q)) ||
        (item.site_engineer_name && item.site_engineer_name.toLowerCase().includes(q)) ||
        (item.customer_phone && String(item.customer_phone).includes(q));

      const matchesStatus =
        !filters.status || item.status === filters.status;

      const matchesReceiptStatus =
        !filters.receiptStatus || item.receipt_status === filters.receiptStatus;

      let matchesDate = true;
      if (filters.dispatchDate) {
        const itemDateStr = getLocalDateString(item.dispatch_date);
        matchesDate = itemDateStr === filters.dispatchDate;
      }

      return matchesSearch && matchesStatus && matchesReceiptStatus && matchesDate;
    });
  }, [deliveries, filters]);

  const handleViewChallan = async (challan) => {
    try {
      setViewLoading(true);
      const res = await getDeliveryChallanById(challan.id);
      if (res?.data) {
        setSelectedChallan(res.data);
      } else {
        setSelectedChallan(challan);
      }
      setIsViewModalOpen(true);
    } catch (err) {
      console.warn('Could not fetch full challan details, using table record:', err);
      setSelectedChallan(challan);
      setIsViewModalOpen(true);
    } finally {
      setViewLoading(false);
    }
  };

  // Pagination calculations
  const totalItems = filteredDeliveries.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedDeliveries = filteredDeliveries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getReceiptStatusBadge = (status) => {
    switch (status) {
      case 'Fully Received':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'Partially Received':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'Short Received':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'Excess Received':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'Damaged Material Reported':
        return 'bg-rose-100 text-rose-800 border border-rose-200';
      case 'Pending Receipt':
      default:
        return 'bg-amber-50 text-amber-700 border border-amber-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Truck size={22} className="text-blue-600" />
            Delivery Challans
          </h1>
          <p className="text-xs text-gray-500">Track outward shipments, dispatch quantities, and site engineer receipts</p>
        </div>

        <button
          onClick={onAddNew}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition cursor-pointer"
        >
          <Plus size={16} /> New Delivery
        </button>
      </div>

      {/* FILTER BAR CARD */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* SEARCH INPUT */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
              Search Challan
            </label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Challan, Customer, Engineer..."
                className="w-full bg-white text-gray-800 text-xs border border-gray-300 rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* DISPATCH STATUS FILTER */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
              Dispatch Status
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full bg-white text-gray-800 text-xs border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Dispatch Statuses</option>
              <option value="Partially Delivered">Partially Delivered</option>
              <option value="Fully Delivered">Fully Delivered</option>
            </select>
          </div>

          {/* RECEIPT STATUS FILTER */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
              Site Receipt Status
            </label>
            <select
              name="receiptStatus"
              value={filters.receiptStatus}
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

          {/* DISPATCH DATE FILTER */}
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

        {/* CLEAR FILTERS */}
        {hasActiveFilters && (
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
            <span className="text-[11px] text-gray-500">
              Filtered: <strong className="text-gray-800">{filteredDeliveries.length}</strong> of {deliveries.length} records
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

      {/* TABLE CARD */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-gray-500">Loading delivery records...</div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500">
            {hasActiveFilters
              ? 'No delivery challans match the selected filters.'
              : 'No delivery challans found.'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[850px]">
                <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Challan No</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Dispatch Date</th>
                    <th className="py-3 px-4 text-right">Ordered Qty</th>
                    <th className="py-3 px-4 text-right">Delivered Qty</th>
                    <th className="py-3 px-4 text-center">Dispatch Status</th>
                    <th className="py-3 px-4 text-center">Site Receipt Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedDeliveries.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/70">
                      <td className="py-3 px-4 font-bold text-blue-600">{item.challan_no}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-800">{item.customer_name}</div>
                        <div className="text-[11px] text-gray-400">{item.customer_phone || '-'}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {formatDate(item.dispatch_date)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="font-mono font-bold text-gray-800 text-sm">{item.total_ordered_qty}</div>
                        <div className="text-[10px] text-gray-400">Total Order</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex flex-col items-end">
                          <div className="font-mono font-bold text-gray-900 text-sm">
                            {item.total_delivered_qty}
                            <span className="text-[10px] text-gray-400 font-normal ml-1">in challan</span>
                          </div>

                          {Number(item.prior_delivered_qty || 0) > 0 && (
                            <div className="text-[10px] text-gray-500 font-medium mt-0.5">
                              Prev sent: <span className="font-mono font-semibold text-gray-700">{item.prior_delivered_qty}</span>
                            </div>
                          )}

                          <div className="mt-1">
                            {item.status === 'Fully Delivered' || item.status === 'Delivered' ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                Total: {item.cumulative_delivered_qty ?? item.total_delivered_qty}/{item.total_ordered_qty} (100%)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                Total: {item.cumulative_delivered_qty ?? item.total_delivered_qty}/{item.total_ordered_qty} ({item.remaining_order_qty ?? Math.max(0, (item.total_ordered_qty || 0) - (item.cumulative_delivered_qty || item.total_delivered_qty || 0))} left)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            item.status === 'Fully Delivered' || item.status === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getReceiptStatusBadge(
                              item.receipt_status
                            )}`}
                          >
                            {item.receipt_status || 'Pending Receipt'}
                          </span>

                          {item.received_by_engineer_name && (
                            <span className="text-[10px] text-gray-400 font-medium">
                              by {item.received_by_engineer_name}
                            </span>
                          )}

                          {item.engineer_remarks && (
                            <div
                              className="mt-0.5 max-w-[200px] bg-amber-50/90 border border-amber-200 text-amber-900 rounded px-2 py-0.5 text-[10px] text-left flex items-start gap-1 shadow-2xs"
                              title={`Site Engineer Message: "${item.engineer_remarks}"`}
                            >
                              <MessageSquare size={10} className="text-amber-600 shrink-0 mt-0.5" />
                              <span className="truncate italic">"{item.engineer_remarks}"</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleViewChallan(item)}
                          title="View Challan Details"
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
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

      {/* View Delivery Challan Modal */}
      <ViewDeliveryChallanModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedChallan(null);
        }}
        challan={selectedChallan}
      />
    </div>
  );
};