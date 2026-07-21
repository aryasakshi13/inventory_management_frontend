import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Building2, Plus, RefreshCw, Search } from 'lucide-react';
// import AddBranchModal from './AddBranchModal';
import AddBranchModal from '../../components/branch/AddbranchModel';

const BranchMaster = ({ userRole, fetchDatabaseRegistry }) => {
    const [offices, setOffices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRows, setTotalRows] = useState(0);
    const [rowsPerPage] = useState(10);
    const [employees, setEmployees] = useState([]);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // console.log(search);

    useEffect(() => {
    const timer = setTimeout(() => {
        setDebouncedSearch(search);
        setCurrentPage(1); // Optional: reset to first page on new search
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
}, [search]);

    const fetchOffices = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await axios.get(`https://inventory-manage-q4yr.onrender.com/api/branch?page=${currentPage}&limit=${rowsPerPage}&search=${debouncedSearch}`, { withCredentials: true });
            console.log(res.data);
            if (res.data.success) {
                setOffices(res.data.data || []);
                setTotalPages(res.data.pagination?.totalPages || 1);
                setTotalRows(res.data.pagination?.totalRows || 0);
            }
        } catch (err) {
            console.error("Failed to fetch offices:", err);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, rowsPerPage,debouncedSearch]);

    useEffect(() => {
        fetchOffices();
    }, [fetchOffices]);

    const handleAddSuccess = () => {
        if (currentPage !== 1) {
            setCurrentPage(1);
        } else {
            fetchOffices();
        }
    };

    const getVisiblePageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };


    const getAllEmployees = async () => {
        const result = await axios.get(`https://inventory-manage-q4yr.onrender.com/api/auth/employees`);
        setEmployees(result.data.data || []);
    }

    useEffect(() => {
        if (userRole === 'admin') {
            getAllEmployees()
        }
    }, [userRole]);



    return (
        <div className="space-y-4 bg-gray-50 p-2 text-xs text-gray-600 font-semibold text-left w-full">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden w-full">

                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600">
                            <Building2 size={14} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Branch Master</h3>
                            <p className="text-[10px] text-gray-400 mt-0.5">Manage all registered office locations ({totalRows})</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">

                         {/* Search Bar */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search office..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            fetchOffices();
                                        }
                                    }}
                                    className="h-9 w-48 px-3 pr-8 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />

                                {search && (
                                    <button
                                        onClick={() => {
                                            setSearch("");
                                            fetchOffices();
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        ×
                                    </button>
                                )}
                            </div> 
                        <button onClick={fetchOffices} className="p-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-500 transition-colors">
                            <RefreshCw size={12} />
                        </button>
                        {userRole === 'admin' && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm uppercase tracking-wider text-[10px] transition-colors"
                            >
                                <Plus size={12} /> Add Branch
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-2 text-gray-400">
                        <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                        <p className="uppercase tracking-wider font-bold text-[9px]">Loading Branch Directory...</p>
                    </div>
                ) : offices.length === 0 ? (
                    <div className="py-24 text-center text-gray-400 font-bold uppercase tracking-wider text-xs bg-white w-full">
                        No branches registered yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto text-xs w-full bg-white">
                        <table className="w-full text-left border-collapse table-auto min-w-[900px]">
                            <thead>
                                <tr className="bg-gray-50 text-gray-400 border-b border-gray-200 font-black text-[9px] uppercase tracking-wider">
                                    <th className="p-4 pl-6">Office Code</th>
                                    <th className="p-4">Office Name</th>
                                    <th className="p-4">Address</th>
                                    <th className="p-4">Admin Name</th>
                                    <th className="p-4">Admin Email</th>
                                    <th className="p-4 pr-6">Admin Emp ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700 font-semibold">
                                {offices.map((office) => (
                                    <tr key={office.ID} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 pl-6 font-mono text-blue-600 font-bold text-[11px] whitespace-nowrap">
                                            {office.OfficeCode}
                                        </td>
                                        <td className="p-4 font-mono uppercase text-gray-900 whitespace-nowrap">
                                            {office.OfficeName}
                                        </td>
                                        <td className="p-4 text-gray-600 max-w-xs truncate" title={office.OfficeAddress || ''}>
                                            {office.OfficeAddress || <span className="text-gray-400 italic font-normal">N/A</span>}
                                        </td>
                                        <td className="p-4 text-gray-800 whitespace-nowrap">
                                            {office.AdminName || <span className="text-gray-400 italic font-normal">N/A</span>}
                                        </td>
                                        <td className="p-4 text-gray-600 whitespace-nowrap">
                                            {office.AdminMail || <span className="text-gray-400 italic font-normal">N/A</span>}
                                        </td>
                                        <td className="p-4 pr-6 font-mono text-gray-600 whitespace-nowrap">
                                            {office.AdminEmpId || <span className="text-gray-400 font-sans italic font-normal">N/A</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination Controls */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
                            <div>
                                Page <span className="text-blue-600 font-bold">{currentPage}</span> of <span className="text-gray-800 font-semibold">{totalPages}</span>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto justify-end flex-wrap">
                                <button
                                    type="button"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(1)}
                                    className="px-2.5 py-1.5 border border-gray-200 rounded-md bg-white hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:pointer-events-none transition-colors font-bold uppercase text-[10px]"
                                    title="First Page"
                                >
                                    First
                                </button>

                                <button
                                    type="button"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    className="px-3 py-1.5 border border-gray-200 rounded-md bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-30 disabled:pointer-events-none transition-colors font-bold uppercase text-[10px]"
                                >
                                    Prev
                                </button>

                                {getVisiblePageNumbers().map((pageNumber) => (
                                    <button
                                        key={pageNumber}
                                        type="button"
                                        onClick={() => setCurrentPage(pageNumber)}
                                        className={`w-7 h-7 rounded-md border text-center transition-all font-bold text-[10px] ${currentPage === pageNumber
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                                : 'border-gray-200 bg-white hover:bg-gray-100 text-gray-600'
                                            }`}
                                    >
                                        {pageNumber}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    className="px-3 py-1.5 border border-gray-200 rounded-md bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-30 disabled:pointer-events-none transition-colors font-bold uppercase text-[10px]"
                                >
                                    Next
                                </button>

                                <button
                                    type="button"
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    onClick={() => setCurrentPage(totalPages)}
                                    className="px-2.5 py-1.5 border border-gray-200 rounded-md bg-white hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:pointer-events-none transition-colors font-bold uppercase text-[10px]"
                                    title="Last Page"
                                >
                                    Last
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {showAddModal && (
                <AddBranchModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    employees={employees}
                    onActionSuccess={fetchOffices}
                    fetchDatabaseRegistry={fetchDatabaseRegistry}
                />
            )}
        </div>
    );
};

export default BranchMaster;