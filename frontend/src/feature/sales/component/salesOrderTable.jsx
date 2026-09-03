import React, { useState, useEffect, useRef } from 'react';
import { Eye, Edit } from 'lucide-react';
import { STATUS_STYLES } from '../constants/salesOrderConstants';

export const SalesOrderTable = ({
  orders,
  inlineFilters = {},
  setInlineFilter,
  clearInlineFilters,
  onSelectOrder,
  onQuickView,
  children,
  onStatusChange,
  userRole,
}) => {
  const normalizedRole = (userRole || '').trim().toLowerCase();
  const canConfirmOrder = ['store manager', 'admin', 'super admin'].includes(normalizedRole);
  const isStoreManager = normalizedRole === 'store manager';
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

  const renderHeaderCell = (colName, title, placeholder, minWidth = 'min-w-[130px]', isCenter = false) => {
    const isOpen = activePopup === colName;
    const value = inlineFilters[colName] || '';
    const hasValue = Boolean(value);

    return (
      <th className={`py-3 px-4 ${minWidth} text-white relative ${isCenter ? 'text-center' : ''}`}>
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
              isCenter ? 'left-1/2 -translate-x-1/2' : 'left-4'
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
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs text-xs flex flex-col">
      <div className="overflow-x-auto">
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#155dfc] text-white border-b border-blue-700 uppercase text-[11px] font-bold tracking-wider sticky top-0 z-20">
              <tr>
                {renderHeaderCell('orderId', 'Order ID', 'Order ID', 'min-w-[120px]')}
                {renderHeaderCell('clientName', 'Client Name', 'Client Name', 'min-w-[180px]')}
                {renderHeaderCell('projectIncharge', 'Project Incharge', 'Project Incharge', 'min-w-[160px]')}
                {renderHeaderCell('poDate', 'PO Date', 'PO Date', 'min-w-[130px]')}
                {renderHeaderCell('poNo', 'PO No', 'PO Number', 'min-w-[140px]')}
                {renderHeaderCell('status', 'Status', 'Status (Pending/Confirmed)', 'min-w-[130px]', true)}
                <th className="py-3 px-4 text-center text-white min-w-[90px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.Id} className="hover:bg-blue-50/40 transition cursor-pointer" onClick={() => onSelectOrder(order)}>
                    <td className="py-3 px-4 font-bold text-blue-600 font-mono">SO-{order.Id}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900 max-w-[200px] truncate" title={order.clientName}>
                      {order.clientName}
                    </td>
                    <td className="py-3 px-4 text-gray-800 font-medium max-w-[160px] truncate" title={order.projectIncharge}>
                      {order.projectIncharge || '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-mono">
                      {order.poDate ? new Date(order.poDate).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-700 max-w-[140px] truncate" title={order.poNo}>
                      {order.poNo || '—'}
                    </td>

                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      {canConfirmOrder && order.status === 'Pending' ? (
                        <select
                          value={order.status}
                          onChange={(e) => onStatusChange(order.Id, e.target.value)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border outline-none cursor-pointer ${
                            STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-700 border-gray-300'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-700 border-gray-300'
                          }`}
                        >
                          {order.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onSelectOrder(order)}
                          title="View Full Details"
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                        >
                          <Eye size={15} />
                        </button>

                        {!isStoreManager && (
                          <button
                            onClick={() => onQuickView(order)}
                            title="Quick View"
                            className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition"
                          >
                            <Edit size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400 text-xs">
                    No sales orders found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer area (e.g., pagination) rendered inside same card */}
      {children && <div className="border-t border-gray-200 bg-white p-3">{children}</div>}
    </div>
  );
};