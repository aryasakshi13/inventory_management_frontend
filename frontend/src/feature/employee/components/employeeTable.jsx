import React from 'react';
import { Eye, Edit3, ShieldCheck, Mail, Phone } from 'lucide-react';

export const EmployeeTable = ({ 
  employees, 
  loading, 
  onEdit, 
  onView,
  onToggleStatus,
  statusUpdatingId,
  children
}) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-xs">
      {loading ? (
        <div className="p-8 text-center text-xs text-gray-500">Loading employees from server...</div>
      ) : employees.length === 0 ? (
        <div className="p-8 text-center text-xs text-gray-500">No employee records found matching filter.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-50 text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-4">Emp Code</th>
                <th className="py-3.5 px-4">Employee Details</th>
                <th className="py-3.5 px-4">System Role</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.map((emp) => {
                const isActive = (emp.employee_status === 'Active' || emp.status === 'active');
                const isUpdating = statusUpdatingId === emp.id;

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      <span className="bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {emp.employee_code}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900 text-xs">{emp.employee_name}</div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail size={12} className="text-gray-400" /> {emp.email_id}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone size={12} className="text-gray-400" /> {emp.mobile_number}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md text-xs border border-slate-200">
                        <ShieldCheck size={13} className="text-blue-600" />
                        {emp.role}
                      </span>
                    </td>

                    {/* Status with Modern Toggle Switch */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => onToggleStatus && onToggleStatus(emp.id, isActive ? 'Active' : 'Inactive')}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isActive ? 'bg-emerald-500' : 'bg-slate-300'
                          } ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
                          title={isActive ? 'Click to make Inactive' : 'Click to make Active'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                              isActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span
                          className={`text-xs font-semibold ${
                            isActive ? 'text-emerald-700' : 'text-slate-500'
                          }`}
                        >
                          {isUpdating ? 'Saving...' : (isActive ? 'Active' : 'Inactive')}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end items-center gap-1">
                        {/* VIEW BUTTON */}
                        <button
                          onClick={() => onView(emp)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                        
                        {/* EDIT BUTTON */}
                        <button
                          onClick={() => onEdit(emp)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Edit Employee"
                        >
                          <Edit3 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {children && !loading && employees.length > 0 && (
        <div className="border-t border-gray-200 bg-white">
          {children}
        </div>
      )}
    </div>
  );
};
