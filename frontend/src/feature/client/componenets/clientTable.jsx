// src/features/clients/components/ClientTable.jsx

import React, { useState, useEffect, useRef } from 'react';
import { CLIENT_STATUSES } from '../constants/clientconstants';

export const ClientTable = ({
  clients,
  inlineFilters = {},
  setInlineFilter,
  clearInlineFilters,
  onRowClick,
  onEditClick,
  children,
}) => {
  const [activePopup, setActivePopup] = useState(null);
  const popupRef = useRef(null);

  // Click outside to close popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setActivePopup(null);
      }
    };
    if (activePopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activePopup]);

  const togglePopup = (colName, e) => {
    e.stopPropagation();
    setActivePopup((prev) => (prev === colName ? null : colName));
  };

  const getStatusBadge = (statusValue) => {
    const config = CLIENT_STATUSES.find((s) => s.value === statusValue);
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config?.badgeClass || 'bg-gray-100 text-gray-800'}`}>
        {config?.label || statusValue}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const cleanRole = String(role || '').toLowerCase().trim();
    const isVendor = cleanRole === 'vendor';
    const isClient = cleanRole === 'client';

    if (isVendor) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-purple-100 text-purple-800 border-purple-200">
          Vendor
        </span>
      );
    }

    if (isClient) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-blue-100 text-blue-800 border-blue-200">
          Client
        </span>
      );
    }

    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-gray-100 text-gray-500 border-gray-200">
        No Role
      </span>
    );
  };

  const renderHeaderCell = (colName, title, placeholder, minWidth = 'min-w-[140px]', isCenter = false) => {
    const isOpen = activePopup === colName;
    const value = inlineFilters[colName] || '';
    const hasValue = Boolean(value);

    return (
      <th className={`p-3.5 ${minWidth} text-white relative ${isCenter ? 'text-center' : ''}`}>
        <div className={`flex items-center ${isCenter ? 'justify-center' : 'justify-start'} gap-1.5`}>
          <span>{title}</span>
          <button
            type="button"
            onClick={(e) => togglePopup(colName, e)}
            className={`p-0.5 rounded transition inline-flex items-center justify-center shrink-0 ${
              isOpen || hasValue
                ? 'text-yellow-300 font-bold hover:text-white'
                : 'text-blue-200 hover:text-white'
            }`}
            title={`Filter by ${placeholder}`}
          >
            {isOpen ? (
              <span className="text-xs font-bold leading-none px-0.5">✕</span>
            ) : (
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill={hasValue ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
            )}
          </button>
        </div>

        {/* Search input directly under column header */}
        {isOpen && (
          <div
            ref={popupRef}
            className={`absolute top-[calc(100%-2px)] z-50 bg-white border border-gray-300 rounded shadow-lg p-1 min-w-[180px] text-black font-normal ${
              isCenter ? 'left-1/2 -translate-x-1/2' : 'left-3.5'
            }`}
          >
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded px-2 py-1">
              <input
                type="text"
                autoFocus
                value={value}
                onChange={(e) => setInlineFilter(colName, e.target.value)}
                placeholder={`Search ${placeholder}...`}
                className="w-full text-xs bg-transparent text-gray-800 placeholder-gray-400 outline-none"
              />
              {hasValue && (
                <button
                  type="button"
                  onClick={() => setInlineFilter(colName, '')}
                  className="text-gray-400 hover:text-gray-600 text-xs ml-1 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}
      </th>
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="h-[55vh] overflow-auto relative">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#155dfc] text-white border-b border-blue-700 text-xs font-semibold uppercase tracking-wider sticky top-0 z-20">
            <tr>
              {/* Company Name */}
              {renderHeaderCell('companyName', 'Company Name', 'Company', 'min-w-[180px]')}

              {/* Role */}
              {renderHeaderCell('role', 'Role', 'Role', 'min-w-[110px]')}

              {/* GSTIN */}
              {renderHeaderCell('gstIn', 'GSTIN', 'GSTIN', 'min-w-[150px]')}

              {/* Contact Person */}
              {renderHeaderCell('contactPerson', 'Contact Person', 'Contact Person', 'min-w-[160px]')}

              {/* Phone Number */}
              <th className="p-3.5 min-w-[120px] text-white">
                <span>Phone Number</span>
              </th>

              {/* Address */}
              <th className="p-3.5 min-w-[160px] text-white">
                <span>Address</span>
              </th>

              {/* Status */}
              {renderHeaderCell('status', 'Status', 'Status', 'min-w-[120px]', true)}

              {/* Actions */}
              <th className="p-3.5 w-20 text-right text-white">
                <span>Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-xs text-gray-500">
                  No records found matching your filters.
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => onRowClick(client)}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                >
                  <td className="p-3.5 font-semibold text-gray-900 max-w-[200px] truncate" title={client.companyName}>
                    {client.companyName}
                  </td>
                  <td className="p-3.5">{getRoleBadge(client.role)}</td>
                  <td className="p-3.5 font-mono text-xs font-semibold text-gray-700 max-w-[150px] truncate" title={client.gstIn}>
                    {client.gstIn || <span className="text-gray-400 font-normal">-</span>}
                  </td>
                  <td className="p-3.5 text-gray-700 font-medium max-w-[150px] truncate" title={client.contactPerson}>
                    {client.contactPerson}
                  </td>
                  <td className="p-3.5 font-mono text-xs text-gray-600">{client.Phone}</td>
                  <td className="p-3.5 text-gray-600 max-w-[180px] truncate" title={client.Address}>
                    {client.Address || 'N/A'}
                  </td>
                  <td className="p-3.5 text-center">{getStatusBadge(client.status)}</td>
                  <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onEditClick(client)}
                      className="text-xs text-blue-600 font-semibold hover:underline"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer area (e.g., pagination) rendered inside same card */}
      {children && <div className="shrink-0 border-t border-gray-200 bg-white p-3">{children}</div>}
    </div>
  );
};