import React from 'react';
import { Edit3, Trash2, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';

export const EmployeeTable = ({ employees, loading, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {loading ? (
        <div className="p-8 text-center text-xs text-gray-500">Loading employees from server...</div>
      ) : employees.length === 0 ? (
        <div className="p-8 text-center text-xs text-gray-500">No employee records found matching filter.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Emp Code</th>
                <th className="py-3 px-4">Employee Details</th>
                <th className="py-3 px-4">Role & Dept</th>
                <th className="py-3 px-4">Branch / Location</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50/70">
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">
                    {emp.employee_code}
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-gray-800">{emp.employee_name}</div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Mail size={12} /> {emp.email_id}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone size={12} /> {emp.mobile_number}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 font-semibold text-gray-700">
                      <ShieldCheck size={13} className="text-blue-500" />
                      {emp.role}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {emp.department || 'N/A'} {emp.designation ? `(${emp.designation})` : ''}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1 text-gray-600">
                      <MapPin size={12} className="text-gray-400" />
                      {emp.location_branch || 'Not Assigned'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        emp.employee_status === 'Active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {emp.employee_status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center items-center gap-1">
                      <button
                        onClick={() => onEdit(emp)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Edit Employee"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => onDelete(emp.id)}
                        className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                        title="Delete Employee"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};