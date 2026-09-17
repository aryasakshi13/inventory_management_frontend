import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Eye, Truck, Search, Filter, Calendar, X, MessageSquare, AlertTriangle, CheckCircle2, Package, Factory } from 'lucide-react';
import { getAllDeliveryChallans, getDeliveryChallanById } from '../services/deliveryService';
import { ViewDeliveryChallanModal } from '../components/ViewDeliveryChallanModal';
import { Pagination } from '../../../components/common/pagination';

export const DeliveryList = ({ onAddNew }) => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);

  // Tabs: 'site_material' (Site Assembly / BOM Delivery) vs 'in_house' (In-House / Direct Product Delivery)
  const [activeTab, setActiveTab] = useState('site_material');

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

  // Tab count metrics
  const siteMaterialCount = useMemo(() => {
    return deliveries.filter(
      (d) => d.delivery_type !== 'in_house' && d.receipt_status !== 'Direct Delivery'
    ).length;
  }, [deliveries]);

  const inHouseCount = useMemo(() => {
    return deliveries.filter(
      (d) => d.delivery_type === 'in_house' || d.receipt_status === 'Direct Delivery'
    ).length;
  }, [deliveries]);

  // Filtered deliveries list according to active tab and search filters
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((item) => {
      const isInHouse = item.delivery_type === 'in_house' || item.receipt_status === 'Direct Delivery';
      if (activeTab === 'site_material' && isInHouse) return false;
      if (activeTab === 'in_house' && !isInHouse) return false;

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
  }, [deliveries, filters, activeTab]);

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
      case 'Accepted':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'Partially Received':
      case 'Accepted with Remarks':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'Short Received':
        return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'Excess Received':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'Damaged Material Reported':
        return 'bg-rose-100 text-rose-800 border border-rose-200';
      case 'Direct Delivery':
        return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      case 'Pending Receipt':
      default:
        return 'bg-amber-50 text-amber-700 border border-amber-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Truck size={22} className="text-blue-600" />
            Deliveries
          </h1>
          <p className="text-xs text-gray-500">Track outward shipments, dispatch quantities, and delivery status</p>
        </div>

        <button
          onClick={onAddNew}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition cursor-pointer"
        >
          <Plus size={16} /> New Delivery
        </button>
      </div>

      {/* 2 MAIN TABS: Site Material vs In-House / Direct Delivery */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => { setActiveTab('site_material'); setCurrentPage(1); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition cursor-pointer ${
              activeTab === 'site_material'
                ? 'bg-white text-blue-600 shadow-sm border border-gray-200/60'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Package size={15} />
            <span>Site Delivery (Items)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'site_material' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-700'
            }`}>
              {siteMaterialCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('in_house'); setCurrentPage(1); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition cursor-pointer ${
              activeTab === 'in_house'
                ? 'bg-white text-blue-600 shadow-sm border border-gray-200/60'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Factory size={15} />
            <span>Direct Product Delivery (Finished Goods)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'in_house' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-200 text-gray-700'
            }`}>
              {inHouseCount}
            </span>
          </button>
        </div>

        <span className="text-xs text-gray-500">
          Showing <strong className="text-gray-800 font-semibold">{filteredDeliveries.length}</strong> {activeTab === 'in_house' ? 'direct product' : 'site material'} shipments
        </span>
      </div>

      {/* FILTER BAR CARD */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* SEARCH INPUT */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
              Search Delivery
            </label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Delivery No, Customer, Phone..."
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

          {/* RECEIPT STATUS FILTER / DELIVERY MODE */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
              {activeTab === 'in_house' ? 'Delivery Mode' : 'Site Receipt Status'}
            </label>
            {activeTab === 'in_house' ? (
              <div className="w-full bg-gray-50 text-indigo-700 font-semibold text-xs border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                <Factory size={13} /> Direct Customer Delivery
              </div>
            ) : (
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
            )}
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
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 transition cursor-pointer"
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
              ? 'No deliveries match the selected filters.'
              : activeTab === 'in_house'
              ? 'No direct product deliveries found.'
              : 'No site material deliveries found.'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[850px]">
                <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Delivery No</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Dispatch Date</th>
                    <th className="py-3 px-4 text-right">
                      {activeTab === 'in_house' ? 'Ordered Product Qty' : 'Ordered Qty'}
                    </th>
                    <th className="py-3 px-4 text-right">
                      {activeTab === 'in_house' ? 'Dispatched Product Qty' : 'Delivered Qty'}
                    </th>
                    <th className="py-3 px-4 text-center">Dispatch Status</th>
                    <th className="py-3 px-4 text-center">
                      {activeTab === 'in_house' ? 'Delivery Mode' : 'Site Receipt Status'}
                    </th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedDeliveries.map((item) => {
                    const totalOrd = Number(item.total_ordered_qty || item.order_total_ordered_qty || 0);
                    const cumDel = Number(item.cumulative_delivered_qty ?? item.total_delivered_qty ?? 0);
                    const isOrderFullyDelivered =
                      item.status === 'Fully Delivered' ||
                      item.status === 'Delivered' ||
                      (totalOrd > 0 && cumDel >= totalOrd);

                    return (
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
                        <div className="font-mono font-bold text-gray-800 text-sm">{totalOrd}</div>
                        <div className="text-[10px] text-gray-400">
                          {activeTab === 'in_house' ? 'Total Products' : 'Total Order'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex flex-col items-end">
                          <div className="font-mono font-bold text-gray-900 text-sm">
                            {item.total_delivered_qty}
                            <span className="text-[10px] text-gray-400 font-normal ml-1">in delivery</span>
                          </div>

                          {Number(item.prior_delivered_qty || 0) > 0 && (
                            <div className="text-[10px] text-gray-500 font-medium mt-0.5">
                              Prev sent: <span className="font-mono font-semibold text-gray-700">{item.prior_delivered_qty}</span>
                            </div>
                          )}

                          <div className="mt-1">
                            {isOrderFullyDelivered ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                Total: {Math.min(cumDel, totalOrd)}/{totalOrd} (100%)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                Total: {cumDel}/{totalOrd} ({Math.max(0, totalOrd - cumDel)} left)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isOrderFullyDelivered
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {isOrderFullyDelivered ? 'Fully Delivered' : (item.status || 'Partially Delivered')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.delivery_type === 'in_house' || item.receipt_status === 'Direct Delivery' ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1">
                              <Factory size={11} /> Direct Delivery
                            </span>
                            <span className="text-[10px] text-gray-400">Manufactured Product</span>
                          </div>
                        ) : (
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
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleViewChallan(item)}
                          title="View Delivery Details"
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                        >
                          <Eye size={16} />
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
