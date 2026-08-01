// src/features/clients/components/ClientFilters.jsx

import React from 'react';
import { CLIENT_STATUSES } from '../constants/clientconstants';

export const ClientFilters = ({ searchQuery, setSearchQuery, statusFilter, setStatusFilter }) => {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex flex-wrap gap-4 justify-between items-center">
      <div className="flex-1 min-w-[260px]">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Company Name, Contact, or GSTIN..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          {CLIENT_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>

        {(searchQuery || statusFilter) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('');
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};