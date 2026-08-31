// src/features/clients/components/ClientFilters.jsx

import React from 'react';

export const ClientFilters = ({
  searchQuery,
  setSearchQuery,
  hasActiveFilters,
  onClearAll,
}) => {
  return (
    <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-xs flex flex-wrap gap-3 justify-between items-center">
      <div className="flex-1 min-w-[260px] relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Company Name..."
          className="w-full border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearAll}
          className="px-3.5 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold transition shrink-0"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
};