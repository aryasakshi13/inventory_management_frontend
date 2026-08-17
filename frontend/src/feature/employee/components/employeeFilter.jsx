import React from 'react';
import { Search } from 'lucide-react';

export const EmployeeFilter = ({
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  roles = [],
}) => {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
        <input
          type="text"
          placeholder="Search Code, Name, or Email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2  text-gray-700 border border-gray-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>

      <div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full py-2 px-3 border border-gray-300  text-gray-800 rounded-md bg-white focus:ring-1 focus:ring-blue-500 outline-none"
        >
          <option value="">-- All System Roles --</option>
          {roles.map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>

      <div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full py-2 px-3 border border-gray-300 rounded-md bg-white text-gray-800 focus:ring-1 focus:ring-blue-500 outline-none"
        >
          <option value="">-- All Statuses --</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>
    </div>
  );
};
