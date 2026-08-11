import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { getPurchaseOrders } from '../services/purchaseService';
import { ViewPurchaseModal } from '../component/viewPurchaseModal';

export const PurchaseListPage = ({ onOpenCreate }) => {

  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

const handleViewPurchase = (purchase) => {
  setSelectedPurchase(purchase);
  setIsViewModalOpen(true);
};
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 10,
    totalRows: 0,
    totalPages: 1,
  });


  const fetchPurchases = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getPurchaseOrders({
        page: currentPage,
        limit,
        search: searchQuery,
        fromDate: startDate,
        toDate: endDate,
      });

      console.log('Purchase API Response:', response);

      if (response?.success) {
        setPurchases(response.data || []);

         setPagination(
         response.pagination || {
          currentPage: currentPage,
          limit,
          totalRows: 0,
          totalPages: 1,
        }
      );

      } else {
        setError(response?.message || 'Failed to fetch purchase entries.');
        setPurchases([]);
      }
    } catch (error) {
      console.error('Error fetching purchase entries:', error);

      setError(
        error?.response?.data?.message ||
        'Failed to fetch purchase entries.'
      );

      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  // Call API when page loads
  useEffect(() => {
    fetchPurchases();
  }, [currentPage, searchQuery, startDate, endDate]);


  // NOTE: filtering and pagination will be handled by the backend.
  // Keep the inputs so they can be sent with requests; for now show full list.
  const filteredPurchases = purchases;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Action Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Purchase Bills</h1>
          <p className="text-xs text-gray-500">View and manage all incoming purchase invoices</p>
        </div>
        <button
          onClick={onOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
        >
          <Plus size={15} /> New Purchase Entry
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Search</label>
          <input
            type="text"
            placeholder="Vendor name or Bill No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg text-black"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg text-black"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg text-black"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={() => { setSearchQuery(''); setStartDate(''); setEndDate(''); }}
            className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-xs hover:bg-gray-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs text-xs">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200 uppercase text-[10px] font-bold text-gray-500 tracking-wider">
            <tr>
              <th className="py-3 px-4">Bill No</th>
              <th className="py-3 px-4">Vendor Name</th>
              <th className="py-3 px-4">Invoice No</th>
              <th className="py-3 px-4">Invoice Date</th>
              <th className="py-3 px-4 text-right">Total Amount</th>
              <th className="py-3 px-4">Created At</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPurchases.map((purchase) => (
              <tr key={purchase.bill_no} className="hover:bg-blue-50/20">
                <td className="py-3 px-4 font-bold text-blue-600 font-mono">{purchase.bill_no}</td>
                <td className="py-3 px-4 font-semibold text-gray-900">{purchase.vendor_name}</td>
                <td className="py-3 px-4 text-gray-600 font-mono">{purchase.invoice_no}</td>
                <td className="py-3 px-4 text-gray-600">{purchase.invoice_date
                  ? purchase.invoice_date.split('T')[0]
                  : '-'}</td>
                <td className="py-3 px-4 text-right font-bold text-gray-900 font-mono">
                  ₹{Number(purchase.grand_total || 0).toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4 text-gray-500">{purchase.created_at
                  ? new Date(purchase.created_at).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })
                  : '-'}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button 
                       onClick={() => handleViewPurchase(purchase)} 
                       className="p-1.5 text-gray-500 hover:text-blue-600 rounded-md"
                       title="View Details"
                       >
                        
                      <Eye size={15} />
                    </button>
                    <button className="p-1.5 text-gray-500 hover:text-emerald-600 rounded-md">
                      <Edit size={15} />
                    </button>
                    <button className="p-1.5 text-gray-500 hover:text-rose-600 rounded-md">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>  
      </div>

      <ViewPurchaseModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        purchase={selectedPurchase}
      />
    </div>
  );
};
