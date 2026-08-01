// src/features/clients/components/ClientQuickDrawer.jsx

import React from 'react';

export const ClientQuickDrawer = ({ isOpen, client, onClose, onViewFullProfile }) => {
  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
        <div>
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <div>
              <h3 className="font-bold text-lg text-gray-900">{client.companyName}</h3>
              <p className="text-xs text-gray-400 font-mono">ID: {client.id}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg p-1">✕</button>
          </div>

          <div className="space-y-5 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Primary Contact</span>
              <p className="font-medium text-gray-900">{client.contactPerson}</p>
              <p className="text-xs text-gray-600 mt-1">{client.email}</p>
              <p className="text-xs text-gray-600">{client.phone}</p>
            </div>

            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Tax Identifiers</span>
              <p className="text-xs text-gray-700">GSTIN: <span className="font-mono font-medium text-gray-900">{client.gstIn}</span></p>
            </div>

            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Billing Location</span>
              <p className="text-xs text-gray-700 leading-relaxed">
                {/* {client.billingAddress?.street}, {client.billingAddress?.city}, {client.billingAddress?.state} - {client.billingAddress?.pincode} */}
                {client.Address}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 flex gap-3">
          <button
            onClick={() => onViewFullProfile(client.id)}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Open Full Detail View →
          </button>
        </div>
      </div>
    </div>
  );
};