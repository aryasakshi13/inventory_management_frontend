// src/features/clients/pages/ClientDetailPage.jsx

import React, { useState } from 'react';
import { CLIENT_TAB_CONFIG } from '../constants/clientconstants';
import { OverviewTab } from '../componenets/tabs/overviewTab';
import { OrdersTab } from '../componenets/tabs/ordersTab';
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// Map tab IDs to components
const TAB_COMPONENTS = {
  overview: OverviewTab,
  orders: OrdersTab,
};



export const ClientDetailPage = ({ clientId = 'CL-101', userRole = 'sales' }) => {

  const navigate = useNavigate();
  // Filter tabs by role
  const visibleTabs = CLIENT_TAB_CONFIG.filter((tab) => tab.allowedRoles.includes(userRole));
  const [activeTabId, setActiveTabId] = useState(visibleTabs[0]?.id || 'overview');

  const ActiveComponent = TAB_COMPONENTS[activeTabId] || OverviewTab;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 mb-4"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      {/* Top Banner */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-xs flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Acme Corporation</h1>
          <p className="text-sm text-gray-500 mt-1">GSTIN: 27AABCU9603R1ZM • Primary Contact: John Doe</p>
        </div>
        <div>
          {userRole === 'sales' && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
              + Add Sales Order
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTabId === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Active Tab */}
      <div>
        <ActiveComponent clientId={clientId} />
      </div>
    </div>
  );
};