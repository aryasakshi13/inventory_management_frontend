import React from 'react';
import { Eye, Edit } from 'lucide-react';
import { STATUS_STYLES } from '../constants/salesOrderConstants';

export const SalesOrderTable = ({ orders, onSelectOrder, onQuickView, children }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs text-xs">
      <div className="overflow-x-auto">
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200 uppercase text-[10px] font-bold text-gray-500 tracking-wider sticky top-0 z-10 bg-white">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Project Incharge</th>
                <th className="py-3 px-4">PO Date</th>
                {/* <th className="py-3 px-4 text-right">Amount</th> */}
                <th className="py-3 px-4">PO No</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.Id} className="hover:bg-blue-50/30 transition">
                    <td className="py-3 px-4 font-bold text-blue-600 font-mono">{order.Id}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{order.clientName}</td>
                    <td className="py-3 px-4 text-gray-800 font-medium">{order.projectIncharge || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {order.poDate ? new Date(order.poDate).toLocaleDateString('en-GB') : '—'}
                    </td>
                    {/* <td className="py-3 px-4 text-right font-bold text-gray-900">
                      ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                    </td> */}
                    <td className="py-3 px-4 font-mono text-gray-700">{order.poNo || '—'}</td>
                    {/* <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_STYLES[order.status] || 'bg-gray-100'}`}>
                      {order.status}
                    </span>
                  </td> */}

                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-700 border-gray-300'
                          }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onSelectOrder(order)}
                          title="View Full Details"
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => onQuickView(order)}
                          title="Quick View"
                          className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition"
                        >
                          <Edit size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-400">
                    No sales orders found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer area (e.g., pagination) rendered inside same card */}
      {children && <div className="p-3">{children}</div>}
    </div>
  );
};