import React from 'react';
import { Users, X } from 'lucide-react';

export const EmployeeModal = ({
  isOpen,
  editingId,
  formData,
  formError,
  submitting,
  roles = [],
  onChange,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  const inputClass =
    'w-full border border-gray-300 rounded p-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500';

  const selectClass =
    'w-full border border-gray-300 rounded p-2 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 bg-gray-900 text-white">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Users size={16} />
            {editingId ? 'Edit Employee Profile' : 'Register New Employee'}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-5 space-y-4 text-xs">
          
          {/* Error */}
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Employee Code */}
            {/* <div>
              <label className="block font-medium text-gray-700 mb-1">
                Employee Code *
              </label>

              <input
                type="text"
                name="employee_code"
                placeholder="e.g. EMP-1001"
                value={formData.employee_code}
                onChange={onChange}
                className={inputClass}
              />
            </div> */}

            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Employee Code {editingId ? '' : '(Auto-generated)'}
              </label>

              <input
                type="text"
                name="employee_code"
                placeholder={editingId ? '' : 'Auto-generating...'}
                value={formData.employee_code || ''}
                readOnly
                disabled
                className={`${inputClass} bg-gray-100 text-gray-600 font-semibold cursor-not-allowed`}
              />
              {!editingId && (
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  Code format is auto-assigned (e.g. EMP0001)
                </span>
              )}
            </div>

            {/* Full Name */}
           <div>
              <label className="block font-medium text-gray-700 mb-1">
                Full Name *
              </label>

              <input
                type="text"
                name="employee_name"
                placeholder="Full Name"
                value={formData.employee_name || ''}
                onChange={onChange}
                readOnly={!!editingId}
                required
                className={`${inputClass} ${editingId
                    ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                    : ''
                  }`}
              />

              {editingId && (
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  Employee name cannot be changed.
                </span>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Email Address *
              </label>

              <input
                type="email"
                name="email_id"
                placeholder="email@company.com"
                value={formData.email_id}
                required
                onChange={onChange}
                className={inputClass}
              />
            </div>

            {/* Mobile Number */}
           <div>
              <label className="block font-medium text-gray-700 mb-1">
                Mobile Number *
              </label>

              <input
                type="text"
                name="mobile_number"
                placeholder="Mobile Number"
                value={formData.mobile_number || ''}
                required
                onChange={(e) => {
                  const value = e.target.value;

                  // Allow only numbers and maximum 10 digits
                  if (/^\d{0,10}$/.test(value)) {
                    onChange(e);
                  }
                }}
                maxLength={10}
                inputMode="numeric"
                className={inputClass}
              />

              <span className="text-[10px] text-gray-400 mt-0.5 block">
                Enter exactly 10 digits
              </span>
            </div>

            {/* System Role */}
            <div>
              <label className="block font-medium text-gray-700 mb-1">
                System Role *
              </label>

              <select
                name="role"
                value={formData.role}
                onChange={onChange}
                required
                className={selectClass}
              >
                <option value="">-- Select a Role --</option>
                {roles.map((role) => (
                  <option
                    key={role}
                    value={role}
                    className="text-gray-900 bg-white"
                  >
                    {role}
                  </option>
                ))}
              </select>
            </div>

            {/* Location / Branch */}
            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Location / Branch
              </label>

              <input
                type="text"
                name="location_branch"
                placeholder="e.g. Delhi Branch"
                value={formData.location_branch}
                onChange={onChange}
                required
                className={inputClass}
              />
            </div>

            {/* Department */}
            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Department
              </label>

              <input
                type="text"
                name="department"
                placeholder="e.g. Operations"
                value={formData.department}
                required
                onChange={onChange}
                className={inputClass}
              />
            </div>

            {/* Designation */}
            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Designation
              </label>

              <input
                type="text"
                name="designation"
                placeholder="e.g. Store Executive"
                value={formData.designation}
                onChange={onChange}
                required
                className={inputClass}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Status *
              </label>

              <select
                name="employee_status"
                value={formData.employee_status}
                onChange={onChange}
                className={selectClass}
                required
              >
                <option
                  value="Active"
                  className="text-gray-900 bg-white"
                >
                  Active
                </option>

                <option
                  value="Inactive"
                  className="text-gray-900 bg-white"
                >
                  Inactive
                </option>
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="block font-medium text-gray-700 mb-1">
                {editingId
                  ? 'Password (Blank = Keep Unchanged)'
                  : 'Password *'}
              </label>

              <input
                type="password"
                name="password_hash"
                placeholder="••••••••"
                value={formData.password_hash}
                onChange={onChange}
                className={inputClass}
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 font-semibold hover:bg-gray-100 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {submitting
                ? 'Saving...'
                : editingId
                ? 'Update Employee'
                : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};