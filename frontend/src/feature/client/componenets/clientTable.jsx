// src/features/clients/components/ClientTable.jsx

import React from 'react';
import { CLIENT_STATUSES } from '../constants/clientconstants';

export const ClientTable = ({ clients, onRowClick, onEditClick, children }) => {
  const getStatusBadge = (statusValue) => {
    const config = CLIENT_STATUSES.find((s) => s.value === statusValue);
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${config?.badgeClass || 'bg-gray-100 text-gray-800'}`}>
        {config?.label || statusValue}
      </span>
    );
  };

  if (clients.length === 0) {
    return (
      <div className="bg-white  rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500 text-sm">No clients found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">

      <div className="h-[55vh] overflow-auto">

        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0 z-10 bg-white">
            <tr>
              <th className="p-4">Client / Company</th>
              <th className="p-4">Contact Person</th>
              <th className="p-4">Phone NUmber</th>
              <th className="p-4">Address</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.map((client) => (
              <tr
                key={client.id}
                onClick={() => onRowClick(client)}
                className="hover:bg-blue-50/40 cursor-pointer transition-colors"
              >
                <td className="p-4 font-semibold text-gray-900">{client.companyName}</td>
                <td className="p-4 text-gray-600">{client.contactPerson}
                  {/* <div>{client.contactPerson}</div> */} 
                </td>
                <td className="p-4 font-mono text-xs text-gray-600">{client.Phone}</td>
                <td className="p-4 text-gray-600">{client.Address || 'N/A'}</td>
                <td className="p-4">{getStatusBadge(client.status)}</td>
                <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onEditClick(client)}
                    className="text-xs text-blue-600 font-medium hover:underline"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer area (e.g., pagination) rendered inside same card */}
      {children && <div className="shrink-0 border-t border-gray-200 bg-white p-3">{children}</div>}
    </div>
  );
};