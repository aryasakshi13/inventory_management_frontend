import React, { useState } from 'react';
import { Package, Search, Hash, Layers, Building } from 'lucide-react';

const BranchAllocationTable = ({ stockData, availableOffices, userRole, userOfficeId, onOfficeChange }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Text search filter engine
    const filteredStock = stockData.filter(item => 
        item.item?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-0 w-full bg-white animate-in fade-in duration-100 text-xs">
            
            {/* SUB HEADER CONTROL DESK STRIP */}
            <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* ROLE MANAGEMENT ACCESS OVERLAYS */}
                <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                        <Building size={12} /> Target Warehouse Base:
                    </span>
                    {userRole === 'admin' ? (
                        <select 
                            onChange={(e) => onOfficeChange(Number(e.target.value))}
                            className="bg-white border border-gray-300 font-bold rounded-lg px-2.5 py-1.5 text-gray-700 outline-none focus:border-blue-500 text-xs shadow-sm"
                        >
                            {availableOffices.map(off => (
                                <option key={off.OfficeID} value={off.OfficeID}>{off.OfficeName.toUpperCase()}</option>
                            ))}
                        </select>
                    ) : (
                        <span className="bg-blue-50 border border-blue-200 text-blue-700 font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wide text-[9px]">
                            {availableOffices.find(o => parseInt(o.OfficeID) === parseInt(userOfficeId))?.OfficeName || "Local Assigned Terminal"}
                        </span>
                    )}
                </div>

                {/* SEARCH FILTER BOX */}
                <div className="relative max-w-xs w-full">
                    <input 
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Filter branch balances..."
                        className="w-full h-8 pl-8 pr-3 bg-white border border-gray-300 rounded-lg text-xs font-bold outline-none text-gray-800 focus:border-blue-500 shadow-sm"
                    />
                    <Search size={12} className="absolute left-2.5 top-2.5 text-gray-400" />
                </div>
            </div>

            {/* DATA VIEW FRAME */}
            <div className="overflow-x-auto w-full">
                {filteredStock.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-wider bg-white">
                        No stored inventory configurations logged inside this regional warehouse hub.
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse table-auto min-w-[700px]">
                        <thead>
                            <tr className="bg-gray-50 text-gray-400 border-b border-gray-200 font-black text-[9px] uppercase tracking-wider">
                                <th className="p-4 pl-6"><Hash size={11} className="inline mr-1" /> Stock Master Reference ID</th>
                                <th className="p-4"><Package size={11} className="inline mr-1" /> Model Nomenclature Specification</th>
                                <th className="p-4 text-center"><Layers size={11} className="inline mr-1" /> Available Stock Balance</th>
                                <th className="p-4 text-center pr-6">Operational parameters</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700 font-semibold">
                            {filteredStock.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50/40 transition-colors">
                                    {/* Column 1: Record Number */}
                                    <td className="p-4 pl-6 font-mono text-blue-600 font-bold text-[11px]">
                                        #STK-{String(row.id).padStart(4, '0')}
                                    </td>

                                    {/* Column 2: Item Name Text */}
                                    <td className="p-4 text-gray-900 font-extrabold uppercase tracking-wide">
                                        {row.item}
                                    </td>

                                    {/* Column 3: Quantities Pool */}
                                    <td className="p-4 text-center">
                                        <span className={`inline-block font-mono font-bold px-2.5 py-0.5 rounded-md text-[11px] border ${
                                            parseInt(row.Quantity) > 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'
                                        }`}>
                                            {row.Quantity} Units Active
                                        </span>
                                    </td>

                                    {/* Column 4: Balance Status Tag */}
                                    <td className="p-4 text-center pr-6">
                                        <span className="uppercase text-[9px] font-black tracking-widest text-gray-400 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">
                                            {row.status || 'active'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default BranchAllocationTable;