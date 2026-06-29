// 📄 Path: src/pages/admin/modules/VendorsDirectory.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Truck, Plus, RefreshCw, Layers } from 'lucide-react';
import AddVendorModal from '../../components/vendor/AddVendorModal';

const VendorsDirectory = ({ userRole }) => {
    const [vendors, setVendors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRows, setTotalRows] = useState(0);
    const [rowsPerPage] = useState(30);

    const fetchVendors = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await axios.get(`http://localhost:5001/api/vendor?page=${currentPage}&limit=${rowsPerPage}`, { withCredentials: true });
            if (res.data.success) {
                setVendors(res.data.data || []);
                setTotalPages(res.data.pagination?.totalPages || 1);
                setTotalRows(res.data.pagination?.totalRows || 0);
            }
        } catch (err) {
            console.error("Failed to load vendor directory:", err);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, rowsPerPage]);

    useEffect(() => {
        fetchVendors();
    }, [fetchVendors]);

    const getVisiblePageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    };

    return (
        <div className="space-y-4 bg-gray-50 p-2 text-xs text-gray-600 font-semibold text-left w-full">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden w-full">
                
                {/* Header Container */}
                <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600">
                            <Truck size={14} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Vendor Registry Matrix</h3>
                            <p className="text-[10px] text-gray-400 mt-0.5">Manage supply-side pipeline networks ({totalRows})</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button onClick={fetchVendors} className="p-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-500 transition-colors">
                            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
                        </button>
                        {userRole === 'admin' && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm uppercase tracking-wider text-[10px] transition-colors"
                            >
                                <Plus size={12} /> Add Vendor Node
                            </button>
                        )}
                    </div>
                </div>

                {/* Table Pipeline Layout */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-2 text-gray-400">
                        <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                        <p className="uppercase tracking-wider font-bold text-[9px]">Loading Vendor Subsystems...</p>
                    </div>
                ) : vendors.length === 0 ? (
                    <div className="py-24 text-center text-gray-400 font-bold uppercase tracking-wider text-xs bg-white w-full">
                        No vendor accounts registered in directory index.
                    </div>
                ) : (
                    <div className="overflow-x-auto text-xs w-full bg-white">
                        <table className="w-full text-left border-collapse table-auto min-w-[1000px]">
                            <thead>
                                <tr className="bg-gray-50 text-gray-400 border-b border-gray-200 font-black text-[9px] uppercase tracking-wider">
                                    <th className="p-4 pl-6">Vendor ID</th>
                                    <th className="p-4">Vendor Name</th>
                                    <th className="p-4">GST Number</th>
                                    <th className="p-4">Contact Person</th>
                                    <th className="p-4">Contact Number</th>
                                    <th className="p-4">Email Address</th>
                                    <th className="p-4 pr-6">Address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700 font-semibold">
                                {vendors.map((vendor) => (
                                    <tr key={vendor.VendorId} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 pl-6 font-mono text-blue-600 font-bold text-[11px] whitespace-nowrap">
                                            #VND-{String(vendor.VendorId).padStart(4, '0')}
                                        </td>
                                        <td className="p-4 font-extrabold uppercase text-gray-900 whitespace-nowrap">
                                            {vendor.VendorName}
                                        </td>
                                        <td className="p-4 font-mono text-gray-800 uppercase text-[11px]">
                                            {vendor.GSTNumber}
                                        </td>
                                        <td className="p-4 text-gray-800 whitespace-nowrap">
                                            {vendor.ContactPerson || <span className="text-gray-300 italic">N/A</span>}
                                        </td>
                                        <td className="p-4 text-gray-600 font-mono">
                                            {vendor.ContactNumber || <span className="text-gray-300">——</span>}
                                        </td>
                                        <td className="p-4 text-gray-600 max-w-xs truncate">
                                            {vendor.EmailId || <span className="text-gray-300">——</span>}
                                        </td>
                                        <td className="p-4 pr-6 text-gray-500 max-w-xs truncate" title={vendor.VendorAddress}>
                                            {vendor.VendorAddress || <span className="text-gray-300 italic">N/A</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination Footer Controls */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
                            <div>
                                Page <span className="text-blue-600 font-bold">{currentPage}</span> of <span className="text-gray-800 font-semibold">{totalPages}</span>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto justify-end flex-wrap">
                                <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="px-2.5 py-1.5 border border-gray-200 rounded-md bg-white text-gray-600 disabled:opacity-30 disabled:pointer-events-none font-bold uppercase text-[10px]">First</button>
                                <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} className="px-3 py-1.5 border border-gray-200 rounded-md bg-white text-gray-700 disabled:opacity-30 disabled:pointer-events-none font-bold uppercase text-[10px]">Prev</button>
                                {getVisiblePageNumbers().map((p) => (
                                    <button key={p} onClick={() => setCurrentPage(p)} className={`w-7 h-7 rounded-md border text-center font-bold text-[10px] ${currentPage === p ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'border-gray-200 bg-white text-gray-600'}`}>{p}</button>
                                ))}
                                <button type="button" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} className="px-3 py-1.5 border border-gray-200 rounded-md bg-white text-gray-700 disabled:opacity-30 disabled:pointer-events-none font-bold uppercase text-[10px]">Next</button>
                            </div>
                        </div>

                    </div>
                )}
            </div>

            {showAddModal && (
                <AddVendorModal 
                    isOpen={showAddModal} 
                    onClose={() => setShowAddModal(false)} 
                    onActionSuccess={() => { setCurrentPage(1); fetchVendors(); }} 
                />
            )}
        </div>
    );
};

export default VendorsDirectory;