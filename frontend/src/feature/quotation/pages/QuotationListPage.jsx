import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Layers,
  Eye,
  Trash2,
  Package,
  Wrench,
  CheckCircle2,
  Clock,
  Send,
  XCircle,
  TrendingUp,
  Building2,
  Calendar,
  DollarSign
} from 'lucide-react';
import { fetchQuotations, deleteQuotation, updateQuotationStatus } from '../services/quotationService';
import { CreateQuotationModal } from '../components/CreateQuotationModal';
import { ViewQuotationModal } from '../components/ViewQuotationModal';
import { Pagination } from '../../../components/common/pagination';

export const QuotationListPage = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedQuotationId, setSelectedQuotationId] = useState(null);
  const [sourceQuotationForRevision, setSourceQuotationForRevision] = useState(null);

  const loadQuotations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchQuotations({
        search: searchQuery,
        status: statusFilter,
        orderType: typeFilter,
      });
      if (res?.success && Array.isArray(res.data)) {
        setQuotations(res.data);
      }
    } catch (err) {
      console.error('Failed to load quotations:', err);
      setError('Could not load quotations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, [statusFilter, typeFilter]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      loadQuotations();
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleOpenCreate = () => {
    setSourceQuotationForRevision(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenRevision = (quotation) => {
    setSourceQuotationForRevision(quotation);
    setIsCreateModalOpen(true);
  };

  const handleViewQuotation = (quotationId) => {
    setSelectedQuotationId(quotationId);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this quotation?')) return;
    try {
      const res = await deleteQuotation(id);
      if (res?.success) {
        setQuotations((prev) => prev.filter((q) => q.id !== id));
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete quotation.');
    }
  };

  const handleStatusChange = async (id, newStatus, e) => {
    e.stopPropagation();
    try {
      const res = await updateQuotationStatus(id, newStatus);
      if (res?.success) {
        setQuotations((prev) =>
          prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q))
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Metrics
  const totalCount = quotations.length;
  const draftCount = quotations.filter((q) => q.status === 'Draft').length;
  const sentCount = quotations.filter((q) => q.status === 'Sent').length;
  const acceptedCount = quotations.filter((q) => q.status === 'Accepted' || q.status === 'Converted').length;
  const totalValue = quotations.reduce((acc, q) => acc + (Number(q.grand_total) || 0), 0);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(quotations.length / itemsPerPage));
  const paginatedList = quotations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const statusStyles = {
    Draft: 'bg-gray-100 text-gray-700 border-gray-300',
    Sent: 'bg-blue-50 text-blue-700 border-blue-200',
    Accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    Revised: 'bg-amber-50 text-amber-700 border-amber-200',
    Converted: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return '—';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal).split('T')[0];
      return d.toLocaleDateString('en-GB');
    } catch {
      return String(dateVal).split('T')[0] || '—';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-xs pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <FileText className="text-blue-600" size={24} />
            Quotation Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Create, manage, and version client quotations prior to Sales Order generation.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          Create Quotation
        </button>
      </div>

      {/* Summary KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500 uppercase block">Total Quotations</span>
          <span className="text-xl font-bold text-gray-900 block mt-1">{totalCount}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500 uppercase block">Drafts</span>
          <span className="text-xl font-bold text-gray-700 block mt-1">{draftCount}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-600 uppercase block">Sent to Client</span>
          <span className="text-xl font-bold text-blue-700 block mt-1">{sentCount}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase block">Accepted / Won</span>
          <span className="text-xl font-bold text-emerald-700 block mt-1">{acceptedCount}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs col-span-2 lg:col-span-1">
          <span className="text-[11px] font-semibold text-purple-600 uppercase block">Total Pipeline Value</span>
          <span className="text-base font-bold text-purple-900 block mt-1">
            ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Quotation No, Client, Project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          {/* Order Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-xs text-gray-800 font-medium outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="All">All Types</option>
            <option value="in_house">In-House</option>
            <option value="site_assembly">Site Assembly</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-xs text-gray-800 font-medium outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
            <option value="Revised">Revised</option>
            <option value="Converted">Converted</option>
          </select>

          {(searchQuery || statusFilter !== 'All' || typeFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setTypeFilter('All');
              }}
              className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Quotations Data Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#155dfc] text-white border-b border-blue-700 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4 min-w-[130px]">Quotation No</th>
                <th className="py-3.5 px-4 min-w-[80px] text-center">Version</th>
                <th className="py-3.5 px-4 min-w-[180px]">Client / Company</th>
                <th className="py-3.5 px-4 min-w-[130px]">Type</th>
                <th className="py-3.5 px-4 min-w-[120px]">Date</th>
                <th className="py-3.5 px-4 min-w-[120px] text-right">Grand Total</th>
                <th className="py-3.5 px-4 min-w-[130px] text-center">Status</th>
                <th className="py-3.5 px-4 min-w-[120px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400 font-medium">
                    Loading quotations...
                  </td>
                </tr>
              ) : paginatedList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400 font-medium">
                    No quotations found. Click "Create Quotation" to add one.
                  </td>
                </tr>
              ) : (
                paginatedList.map((q) => (
                  <tr
                    key={q.id}
                    onClick={() => handleViewQuotation(q.id)}
                    className="hover:bg-blue-50/40 transition cursor-pointer"
                  >
                    {/* Quotation No */}
                    <td className="py-3.5 px-4 font-bold text-blue-600 font-mono">
                      {q.quotation_number}
                    </td>

                    {/* Version Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        q.is_latest_version
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}>
                        v{q.version}
                        {!q.is_latest_version && ' (old)'}
                      </span>
                    </td>

                    {/* Client Name */}
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-gray-900">{q.client_name || 'Client'}</p>
                      {q.contact_person && (
                        <p className="text-[11px] text-gray-500">{q.contact_person}</p>
                      )}
                    </td>

                    {/* Order Type */}
                    <td className="py-3.5 px-4">
                      {q.order_type === 'in_house' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                          <Package size={11} /> In-House
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                          <Wrench size={11} /> Site Assembly
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 font-mono text-gray-600">
                      {formatDate(q.quotation_date)}
                    </td>

                    {/* Grand Total */}
                    <td className="py-3.5 px-4 text-right font-bold text-gray-900 font-mono">
                      ₹{Number(q.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={q.status}
                        onChange={(e) => handleStatusChange(q.id, e.target.value, e)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border outline-none cursor-pointer ${
                          statusStyles[q.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Revised">Revised</option>
                        <option value="Converted">Converted</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View Button */}
                        <button
                          onClick={() => handleViewQuotation(q.id)}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition cursor-pointer"
                          title="View / Print Quotation"
                        >
                          <Eye size={14} />
                        </button>

                        {/* Create Revision Button */}
                        <button
                          onClick={() => handleOpenRevision(q)}
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition cursor-pointer"
                          title={`Create Revision (v${(Number(q.version) || 1) + 1})`}
                        >
                          <Layers size={14} />
                        </button>

                        {/* Delete Button (Drafts only) */}
                        {q.status === 'Draft' && (
                          <button
                            onClick={(e) => handleDelete(q.id, e)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                            title="Delete Draft"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {quotations.length > itemsPerPage && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <span className="text-gray-500 text-xs">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, quotations.length)} of {quotations.length} quotations
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Create / Revision Modal */}
      {isCreateModalOpen && (
        <CreateQuotationModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setSourceQuotationForRevision(null);
          }}
          onSuccess={() => {
            loadQuotations();
          }}
          sourceQuotation={sourceQuotationForRevision}
        />
      )}

      {/* View / Print Quotation Modal */}
      {isViewModalOpen && selectedQuotationId && (
        <ViewQuotationModal
          isOpen={isViewModalOpen}
          quotationId={selectedQuotationId}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedQuotationId(null);
          }}
          onCreateRevision={(sourceQ) => {
            handleOpenRevision(sourceQ);
          }}
          onStatusUpdated={() => {
            loadQuotations();
          }}
        />
      )}
    </div>
  );
};
