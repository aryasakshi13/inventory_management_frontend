import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, CheckCircle2, AlertTriangle, XCircle, ShoppingCart, Layers, Box, Wrench, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Pagination } from '../../../components/common/pagination';

export const StoreItemsTable = ({ items = [], onEdit, onDelete, onView, loading }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  // Helper function to calculate status automatically based on quantity vs threshold
  const getItemStatus = (qty, threshold) => {
    const quantity = qty ?? 0;
    const thresh = threshold ?? 10;
    if (quantity <= 0) return 'Out of Stock';
    if (quantity <= thresh) return 'Low Stock';
    return 'In Stock';
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'In Stock':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} /> In Stock
          </span>
        );
      case 'Low Stock':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle size={12} /> Low Stock
          </span>
        );
      case 'Out of Stock':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={12} /> Out of Stock
          </span>
        );
      default:
        return null;
    }
  };

  const renderTypeBadge = (item) => {
    const type = item.item_type || 'raw_material';
    switch (type) {
      case 'finished_good':
        return <span className="font-medium text-slate-700">Finished Good</span>;
      case 'consumable':
        return <span className="font-medium text-slate-700">Consumable</span>;
      case 'raw_material':
      default:
        return <span className="font-medium text-slate-700">Raw Material</span>;
    }
  };

  const renderActiveBadge = (isActive) => {
    const active = isActive !== undefined ? (Number(isActive) === 0 ? false : true) : true;
    if (active) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={10} /> Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle size={10} /> Inactive
      </span>
    );
  };

  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs text-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead className="bg-gray-50 border-b border-gray-200 uppercase text-[10px] font-bold text-gray-500 tracking-wider">
            <tr>
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">Classification</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Item Name</th>
              <th className="py-3 px-4 text-center">UOM</th>
              <th className="py-3 px-4 text-center">Quantity</th>
              <th className="py-3 px-4 text-center">Min Threshold</th>
              <th className="py-3 px-4">Stock Status</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="10" className="py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading store items...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedItems.length > 0 ? (
              paginatedItems.map((item, idx) => {
                const itemId = item.id || item._id;
                const threshold = item.min_threshold ?? item.minThreshold ?? 10;
                const quantity = item.quantity ?? 0;
                const status = getItemStatus(quantity, threshold);
                const uomVal = item.unit || item.uom || "Nos";
                const displayIndex = (currentPage - 1) * itemsPerPage + idx + 1;

                return (
                  <tr key={itemId || idx} className="hover:bg-gray-50/70 transition">
                    {/* Index */}
                    <td className="py-3 px-4 text-center font-bold text-gray-400">{displayIndex}</td>

                    {/* Classification */}
                    <td className="py-3 px-4">{renderTypeBadge(item)}</td>

                    {/* Category - Normal Clean Text */}
                    <td className="py-3 px-4 font-medium text-gray-700">
                      {item.category || '-'}
                    </td>

                    {/* Item Name */}
                    <td className="py-3 px-4 font-bold text-gray-900">
                      <div className="flex items-center gap-1.5">
                        {item.item_name || item.name}
                      </div>
                    </td>

                    {/* UOM - Normal Clean Text */}
                    <td className="py-3 px-4 text-center font-medium text-gray-600">
                      {uomVal}
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-4 text-center font-bold">
                      <span className={quantity <= threshold ? 'text-amber-600 font-bold' : 'text-gray-900'}>
                        {quantity}
                      </span>
                    </td>

                    {/* Minimum Threshold */}
                    <td className="py-3 px-4 text-center font-medium text-gray-600">
                      {threshold}
                    </td>

                    {/* Stock Status Badge */}
                    <td className="py-3 px-4">{renderStatusBadge(status)}</td>

                    {/* Active / Inactive Status */}
                    <td className="py-3 px-4 text-center">{renderActiveBadge(item.is_active)}</td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onView && onView(item)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit && onEdit(item)}
                          className="p-1.5 text-gray-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
                          title="Edit Item"
                        >
                          <Edit size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="10" className="py-8 text-center text-gray-400">
                  No store items found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!loading && totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}
    </div>
  );
};