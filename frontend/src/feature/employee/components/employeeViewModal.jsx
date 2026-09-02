import React from 'react';
import { Users, X, ShieldCheck, Mail, Phone, UserCheck } from 'lucide-react';

export const EmployeeViewModal = ({ isOpen, onClose, employee }) => {
  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-center items-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 bg-gray-900 text-white">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Users size={16} />
            Employee Profile — {employee.employee_code || 'N/A'}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            <DetailCard 
              label="Employee Code" 
              value={employee.employee_code} 
              icon={<ShieldCheck size={14} className="text-blue-500" />} 
              highlight 
            />

            <DetailCard 
              label="Full Name" 
              value={employee.employee_name} 
              icon={<Users size={14} className="text-gray-500" />} 
            />

            <DetailCard 
              label="Email Address" 
              value={employee.email_id} 
              icon={<Mail size={14} className="text-gray-500" />} 
            />

            <DetailCard 
              label="Mobile Number" 
              value={employee.mobile_number} 
              icon={<Phone size={14} className="text-gray-500" />} 
            />

            <div className="col-span-1 md:col-span-2">
              <DetailCard 
                label="System Role" 
                value={employee.role} 
                icon={<UserCheck size={14} className="text-blue-600" />} 
              />
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 col-span-1 md:col-span-2 flex items-center justify-between">
              <span className="text-gray-500 font-medium text-[11px]">Employee Account Status</span>
              <span
                className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full ${
                  (employee.employee_status === 'Active' || employee.status === 'active')
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {employee.employee_status || employee.status || 'Active'}
              </span>
            </div>

          </div>

          {/* Footer */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-gray-100 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-200 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// Helper card component for consistent layout
const DetailCard = ({ label, value, icon, highlight }) => (
  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-start gap-2.5">
    <div className="mt-0.5">{icon}</div>
    <div className="flex-1 overflow-hidden">
      <span className="block text-gray-500 font-medium text-[11px] mb-0.5">{label}</span>
      <span className={`block font-semibold truncate ${highlight ? 'text-blue-600 font-bold' : 'text-gray-900'}`}>
        {value || '—'}
      </span>
    </div>
  </div>
);