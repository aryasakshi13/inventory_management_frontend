// src/features/clients/components/ClientFormModal.jsx

import React, { useState, useEffect } from 'react';
import { EMPTY_CLIENT_FORM } from '../constants/clientconstants';

export const ClientFormModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState(EMPTY_CLIENT_FORM);


  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData(EMPTY_CLIENT_FORM);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (type, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl p-6">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h2 className="text-xl font-bold text-gray-900">{initialData ? 'Edit Client' : 'Add New Client'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company & Tax Info */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Company & Tax Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Company Name *</label>
                <input
                  required
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  readOnly={!!initialData}
                  className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">GSTIN *</label>
                <input
                  required
                  value={formData.gstIn}
                  onChange={(e) => handleChange('gstIn', e.target.value.toUpperCase())}
                    readOnly={!!initialData}
                  className="w-full border rounded-lg p-2 text-sm uppercase font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                />
              </div>
            </div>
          </div>

          {/* Contact Person */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Primary Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Contact Person *</label>
                <input
                  required
                  value={formData.contactPerson}
                  onChange={(e) => handleChange('contactPerson', e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  pattern="[0-9]{10}"
                  value={formData.Phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    handleChange("Phone", value);
                  }}
                  onInvalid={(e) =>
                    e.target.setCustomValidity("Please enter a valid 10-digit phone number.")
                  }
                  onInput={(e) => e.target.setCustomValidity("")}
                  className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  pattern="^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
                  value={formData.emailId}
                  onChange={(e) => handleChange("emailId", e.target.value)}
                  onInvalid={(e) =>
                    e.target.setCustomValidity("Please enter a valid email address.")
                  }
                  onInput={(e) => e.target.setCustomValidity("")}
                  className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                />
              </div>

            </div>
          </div>

          {/* Address Details */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Address
            </h3>

            <textarea
              required
              rows={3}
              placeholder="Enter complete address"
              value={formData.Address}
              onChange={(e) => handleChange("Address", e.target.value)}
              className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none text-black"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              {initialData ? 'Update Client' : 'Save Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};