import React from 'react';
import { UserCheck, Calendar, Hash, Tag } from 'lucide-react';

const EmployeeAllocationTable = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="py-24 text-center text-gray-400 font-bold uppercase tracking-wider text-xs bg-white">
                No historic staff allocations recorded inside corporate ledger registries.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto text-xs w-full bg-white animate-in fade-in duration-100">
            <table className="w-full text-left border-collapse table-auto min-w-[900px]">
                <thead>
                    <tr className="bg-gray-50 text-gray-400 border-b border-gray-200 font-black text-[9px] uppercase tracking-wider">
                        <th className="p-4 pl-6 flex items-center gap-1"><Hash size={11} /> Allocation ID</th>
                        <th className="p-4">Personnel Profile</th>
                        <th className="p-4">Assigned  Node</th>
                        <th className="p-4">Item Model SpecifiOfficecation</th>
                        <th className="p-4 text-center">Units Issued</th>
                        <th className="p-4 pr-6">Timestamp Released</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 font-semibold">
                    {data.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/40 transition-colors">
                            {/* Column 1: Record ID Trace */}
                            <td className="p-4 pl-6 font-mono text-blue-600 font-bold text-[11px]">
                                #ALC-{String(idx + 1).padStart(4, '0')}
                            </td>

                            {/* Column 2: Employee Profile */}
                            <td className="p-4">
                                <div className="text-gray-900 font-extrabold uppercase tracking-wide flex items-center gap-1">
                                    <UserCheck size={12} className="text-gray-400" /> {row.name || 'Staff Member'}
                                </div>
                                <div className="text-[9px] text-gray-400 font-mono mt-0.5">ID Ref: #{row.EmpID}</div>
                            </td>

                            {/* Column 3: Office Node details */}
                            <td className="p-4">
                                <div className="text-gray-800 font-bold">Office ID: {row.OfficeID}</div>
                                <div className="text-[9px] text-gray-400 font-mono uppercase mt-0.5">Code: {row.OfficeCode || 'N/A'}</div>
                            </td>

                            {/* Column 4: Product Description String */}
                            <td className="p-4 text-gray-900 font-black uppercase tracking-wide">
                                {row.Item}
                            </td>

                            {/* Column 5: Quantity Count */}
                            <td className="p-4 font-mono font-bold text-center text-gray-900 text-[11px]">
                                {row.Quantity}
                            </td>

                            {/* Column 6: Date Time Log */}
                            <td className="p-4 pr-6 font-mono text-gray-400 text-[10px] whitespace-nowrap">
                                <div className="flex items-center gap-1 justify-end sm:justify-start">
                                    <Calendar size={11} />
                                    {row.DateTime ? new Date(row.DateTime).toLocaleString() : 'N/A'}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default EmployeeAllocationTable;