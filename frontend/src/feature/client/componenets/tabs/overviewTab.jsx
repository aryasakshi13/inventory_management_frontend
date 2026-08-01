// src/features/clients/components/tabs/OverviewTab.jsx
import React from 'react';

export const OverviewTab = ({ clientId }) => (
  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-xs space-y-4">
    <h3 className="text-base font-semibold text-gray-900">Account Overview</h3>
    <p className="text-sm text-gray-600">Client ID: <span className="font-mono font-medium">{clientId}</span></p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <span className="text-xs text-blue-600 font-medium uppercase">Total Orders</span>
        <p className="text-2xl font-bold text-blue-900 mt-1">24</p>
      </div>
      <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
        <span className="text-xs text-emerald-600 font-medium uppercase">Total Revenue</span>
        <p className="text-2xl font-bold text-emerald-900 mt-1">₹4,85,000</p>
      </div>
      <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
        <span className="text-xs text-amber-600 font-medium uppercase">Outstanding Balance</span>
        <p className="text-2xl font-bold text-amber-900 mt-1">₹32,400</p>
      </div>
    </div>
  </div>
);