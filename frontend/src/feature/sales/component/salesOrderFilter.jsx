import React from 'react';
import { Search, Plus, Download } from 'lucide-react';

export const SalesOrderFilter = ({
  searchQuery,
  setSearchQuery,
  hasActiveFilters,
  onClearAll,
  onOpenCreateModal,
  onDownloadReport,
}) => {
  return (
    <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex flex-wrap gap-3 justify-between items-center text-xs">
      {/* Global Search Bar (Search by Client Name Only) */}
      <div className="flex-1 min-w-[280px] max-w-md relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by Client Name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 text-xs font-bold"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="px-3.5 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold transition shrink-0"
          >
            Clear All Filters
          </button>
        )}

        <button
          type="button"
          onClick={onDownloadReport}
          title="Download Sales Orders Report (Excel)"
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition shadow-xs"
        >
          <Download size={15} /> Download Report
        </button>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition shadow-xs"
        >
          <Plus size={15} /> Create Sales Order
        </button>
      </div>
    </div>
  );
};