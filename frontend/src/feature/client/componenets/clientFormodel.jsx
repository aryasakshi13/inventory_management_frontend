// src/features/clients/components/ClientFormModal.jsx

import React, { useState, useEffect } from 'react';
import { EMPTY_CLIENT_FORM } from '../constants/clientconstants';

export const ClientFormModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({ ...EMPTY_CLIENT_FORM, role: EMPTY_CLIENT_FORM.role ?? 'client' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData, role: initialData.role ?? 'client' });
    } else {
      setFormData({ ...EMPTY_CLIENT_FORM, role: EMPTY_CLIENT_FORM.role ?? 'client' });
    }
    setErrors({});
    setTouched({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validateField = (field, value) => {
    let error = '';

    switch (field) {
      case 'companyName':
        if (!value || !value.trim()) {
          error = 'Company name is required.';
        } else if (value.trim().length < 2) {
          error = 'Company name must be at least 2 characters.';
        } else if (!/^[a-zA-Z0-9\s&.,'()_-]+$/.test(value.trim())) {
          error = 'Company name cannot contain slashes (//) or invalid special symbols.';
        } else if (!/[a-zA-Z0-9]/.test(value.trim())) {
          error = 'Company name must contain letters or digits.';
        }
        break;

      case 'gstIn':
        if (!value || !value.trim()) {
          error = 'GSTIN is required.';
        } else {
          const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
          const cleanVal = value.trim().toUpperCase();
          if (cleanVal.length !== 15) {
            error = 'GSTIN must be exactly 15 characters.';
          } else if (!gstRegex.test(cleanVal)) {
            error = 'Invalid GSTIN format (e.g. 22AAAAA0000A1Z5).';
          }
        }
        break;

      case 'contactPerson':
        if (!value || !value.trim()) {
          error = 'Contact person is required.';
        } else if (value.trim().length < 2) {
          error = 'Contact person must be at least 2 characters.';
        } else if (!/^[a-zA-Z\s.]+$/.test(value.trim())) {
          error = 'Contact person can only contain letters, spaces, and dots.';
        }
        break;

      case 'Phone':
        if (!value || !value.trim()) {
          error = 'Phone number is required.';
        } else if (!/^[6-9]\d{9}$/.test(value.trim())) {
          error = 'Please enter a valid 10-digit phone number starting with 6-9.';
        }
        break;

      case 'emailId':
        if (!value || !value.trim()) {
          error = 'Email address is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          error = 'Please enter a valid email address (e.g. name@company.com).';
        }
        break;

      case 'Address':
        if (!value || !value.trim()) {
          error = 'Address is required.';
        } else if (value.trim().length < 5) {
          error = 'Address must be at least 5 characters.';
        }
        break;

      default:
        break;
    }

    return error;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const err = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const validateAll = () => {
    const newErrors = {};
    const fieldsToValidate = ['companyName', 'gstIn', 'contactPerson', 'Phone', 'emailId', 'Address'];

    fieldsToValidate.forEach((f) => {
      const err = validateField(f, formData[f]);
      if (err) newErrors[f] = err;
    });

    setErrors(newErrors);
    setTouched({
      companyName: true,
      gstIn: true,
      contactPerson: true,
      Phone: true,
      emailId: true,
      Address: true,
      role: true,
    });

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    onSubmit({
      ...formData,
      companyName: formData.companyName.trim(),
      gstIn: formData.gstIn.trim().toUpperCase(),
      contactPerson: formData.contactPerson.trim(),
      Phone: formData.Phone.trim(),
      emailId: formData.emailId.trim(),
      Address: formData.Address.trim(),
      role: (formData.role || 'client').toLowerCase(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl p-6">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {initialData ? `Edit ${formData.role === 'vendor' ? 'Vendor' : 'Client'}` : `Add New ${formData.role === 'vendor' ? 'Vendor' : 'Client'}`}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Enter business details, GSTIN, and contact information.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Role & Company & Tax Info */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Entity & Tax Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Entity Role <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800 bg-white font-medium"
                >
                  <option value="client">Client (Customer)</option>
                  <option value="vendor">Vendor (Supplier)</option>
                </select>
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  {formData.role === 'vendor' ? 'Entity acts as supplier/vendor' : 'Entity acts as client/buyer'}
                </span>
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  onBlur={() => handleBlur('companyName')}
                  readOnly={!!initialData}
                  placeholder="e.g. Acme Solar Solutions"
                  className={`w-full border rounded-lg p-2 text-sm focus:ring-2 focus:outline-none text-black ${
                    errors.companyName && touched.companyName
                      ? 'border-rose-500 focus:ring-rose-400 bg-rose-50/30'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.companyName && touched.companyName && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.companyName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  GSTIN <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  maxLength={15}
                  value={formData.gstIn}
                  onChange={(e) => handleChange('gstIn', e.target.value.toUpperCase())}
                  onBlur={() => handleBlur('gstIn')}
                  readOnly={!!initialData}
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  className={`w-full border rounded-lg p-2 text-sm uppercase font-mono focus:ring-2 focus:outline-none text-black ${
                    errors.gstIn && touched.gstIn
                      ? 'border-rose-500 focus:ring-rose-400 bg-rose-50/30'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.gstIn && touched.gstIn ? (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.gstIn}</p>
                ) : (
                  <span className="text-[10px] text-gray-400 mt-0.5 block font-mono">15-digit GSTIN</span>
                )}
              </div>
            </div>
          </div>

          {/* Contact Person & Contact Details */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Primary Contact Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Contact Person <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  value={formData.contactPerson}
                  onChange={(e) => handleChange('contactPerson', e.target.value)}
                  onBlur={() => handleBlur('contactPerson')}
                  placeholder="e.g. Rajesh Sharma"
                  className={`w-full border rounded-lg p-2 text-sm focus:ring-2 focus:outline-none text-black ${
                    errors.contactPerson && touched.contactPerson
                      ? 'border-rose-500 focus:ring-rose-400 bg-rose-50/30'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.contactPerson && touched.contactPerson && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.contactPerson}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  value={formData.Phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    handleChange('Phone', value);
                  }}
                  onBlur={() => handleBlur('Phone')}
                  className={`w-full border rounded-lg p-2 text-sm font-mono focus:ring-2 focus:outline-none text-black ${
                    errors.Phone && touched.Phone
                      ? 'border-rose-500 focus:ring-rose-400 bg-rose-50/30'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.Phone && touched.Phone && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.Phone}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. contact@company.com"
                  value={formData.emailId}
                  onChange={(e) => handleChange('emailId', e.target.value)}
                  onBlur={() => handleBlur('emailId')}
                  className={`w-full border rounded-lg p-2 text-sm focus:ring-2 focus:outline-none text-black ${
                    errors.emailId && touched.emailId
                      ? 'border-rose-500 focus:ring-rose-400 bg-rose-50/30'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.emailId && touched.emailId && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.emailId}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Office / Billing Address
            </h3>
            <textarea
              required
              rows={3}
              placeholder="Enter complete registered office / billing address"
              value={formData.Address}
              onChange={(e) => handleChange('Address', e.target.value)}
              onBlur={() => handleBlur('Address')}
              className={`w-full border rounded-lg p-3 text-sm focus:ring-2 focus:outline-none resize-none text-black ${
                errors.Address && touched.Address
                  ? 'border-rose-500 focus:ring-rose-400 bg-rose-50/30'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.Address && touched.Address && (
              <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.Address}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm transition"
            >
              {initialData ? 'Update Entity' : 'Save Entity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};