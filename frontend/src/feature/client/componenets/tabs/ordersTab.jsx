// src/features/clients/components/tabs/OrdersTab.jsx
import React from 'react';

export const OrdersTab = ({ clientId }) => (
  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-xs">
    <h3 className="text-base font-semibold text-gray-900 mb-4">Sales Order History</h3>
    <table className="w-full text-left text-sm">
      <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase">
        <tr>
          <th className="p-3">Order ID</th>
          <th className="p-3">Date</th>
          <th className="p-3">Amount</th>
          <th className="p-3">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        <tr>
          <td className="p-3 font-mono font-medium text-blue-600">SO-2026-88</td>
          <td className="p-3 text-gray-600">2026-02-18</td>
          <td className="p-3 font-medium">₹1,20,000</td>
          <td className="p-3"><span className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-800">Delivered</span></td>
        </tr>
      </tbody>
    </table>
  </div>
);