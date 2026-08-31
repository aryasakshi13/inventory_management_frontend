import React from 'react';
import { Eye, Edit, Trash2, CheckCircle2, AlertTriangle, XCircle, ShoppingCart, Layers, Box, Wrench, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StoreItemsTable = ({ items, onEdit, onDelete, onView, loading }) => {
  const navigate = useNavigate();

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
        return (
          <div className="flex flex-col gap-0.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 w-fit">
              <Box size={10} /> Finished Good
            </span>
            {item.linked_product_name && (
              <span className="text-[10px] text-purple-600 font-medium truncate max-w-[130px]" title={`Linked Product: ${item.linked_product_name}`}>
                🔗 {item.linked_product_name}
              </span>
            )}
          </div>
        );
      case 'consumable':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 w-fit">
            <Wrench size={10} /> Consumable
          </span>
        );
      case 'raw_material':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 w-fit">
            <Layers size={10} /> Raw Material
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs text-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200 uppercase text-[10px] font-bold text-gray-500 tracking-wider">
            <tr>
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">Classification</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Item Name</th>
              <th className="py-3 px-4 text-center">UOM</th>
              <th className="py-3 px-4 text-center">Quantity</th>
              <th className="py-3 px-4 text-center">Min Threshold</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="9" className="py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading store items...</span>
                  </div>
                </td>
              </tr>
            ) : items.length > 0 ? (
              items.map((item, idx) => {
                const itemId = item.id || item._id;
                const threshold = item.min_threshold ?? item.minThreshold ?? 10;
                const quantity = item.quantity ?? 0;
                const status = getItemStatus(quantity, threshold);
                const uomVal = item.unit || item.uom || "Nos";

                return (
                  <tr key={itemId || idx} className="hover:bg-gray-50/70 transition">
                    {/* Index */}
                    <td className="py-3 px-4 text-center font-bold text-gray-400">{idx + 1}</td>

                    {/* Classification */}
                    <td className="py-3 px-4">{renderTypeBadge(item)}</td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 bg-gray-100 border border-gray-200 rounded-md text-gray-700 font-medium text-[11px]">
                        {item.category}
                      </span>
                    </td>

                    {/* Item Name */}
                    <td className="py-3 px-4 font-bold text-gray-900">
                      <div className="flex items-center gap-1.5">
                        {item.item_name || item.name}
                      </div>
                    </td>

                    {/* UOM */}
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 rounded-md text-blue-700 font-semibold text-[11px]">
                        {uomVal}
                      </span>
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

                    {/* Status Badge */}
                    <td className="py-3 px-4">{renderStatusBadge(status)}</td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onView && onView(item)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => onEdit(item)}
                          className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-gray-100 transition"
                          title="Edit Item"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => onDelete(itemId)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-gray-100 transition"
                          title="Delete Item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" className="py-8 text-center text-gray-400">
                  No store items found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};