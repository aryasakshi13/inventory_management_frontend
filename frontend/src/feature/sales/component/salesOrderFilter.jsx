import React from 'react';
import { Search, RefreshCw, Plus } from 'lucide-react';
import { ORDER_STATUSES } from '../constants/salesOrderConstants';

export const SalesOrderFilter = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  warehouseFilter,
  setWarehouseFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  resetFilters,
  onOpenCreateModal,
}) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3 text-xs">
      {/* Top Search Bar & Create Action */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search Order ID, Client, or PO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <button
          onClick={onOpenCreateModal}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
        >
          <Plus size={15} /> Create Sales Order
        </button>
      </div>

      
      {(searchQuery ) && (
        <div className="flex justify-end pt-1">
          <button onClick={resetFilters} className="flex items-center gap-1 text-[11px] text-rose-600 font-semibold hover:underline">
            <RefreshCw size={12} /> Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};