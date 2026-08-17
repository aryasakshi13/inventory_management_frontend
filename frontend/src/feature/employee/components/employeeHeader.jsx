import React from 'react';
import { Users, Plus } from 'lucide-react';

export const EmployeeHeader = ({ onAddNew }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Users size={22} className="text-blue-600" />
          Employee Management
        </h1>
        <p className="text-xs text-gray-500">
          Maintain employee profiles, role assignments, and site access
        </p>
      </div>

      <button
        onClick={onAddNew}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-sm transition"
      >
        <Plus size={16} /> Add New Employee
      </button>
    </div>
  );
};
