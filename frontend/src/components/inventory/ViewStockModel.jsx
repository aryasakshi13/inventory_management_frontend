import React from 'react';

const ViewStockModal = ({ isOpen, onClose, itemData, userRole }) => {
    if (!isOpen || !itemData) return null;

    // Helper utility to safely format date strings for clean display
    const formatDate = (dateString) => {
        if (!dateString) return <span className="text-gray-400 italic">Not Scheduled</span>;
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };


    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return <span className="text-gray-300">—</span>;
        return new Date(dateTimeString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    // Helper to handle absolute vs relative server upload file asset viewing paths
    const handleViewFile = (filePath) => {
        if (!filePath) return;
        const targetUrl = filePath.startsWith('http') 
            ? filePath 
            : `https://inventory-manage-q4yr.onrender.com/${filePath}`;
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
    };

      const isAdmin = String(userRole).toLowerCase() === 'admin';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
            {/* Backdrop Blur Frame */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            {/* Modal Chassis */}
            <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform transition-all z-10 animate-in fade-in zoom-in-95 duration-150">
                
                {/* Header Section */}
                <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Asset Ledger Details</h3>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">Core Reference Node: #STK-{String(itemData.id).padStart(4, '0')}</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>

                {/* Information Grid Container */}
                <div className="p-6 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-left">
                        
                        {/* 1. STOCK ID */}
                        <div className="border-b border-gray-100 pb-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Registry Tracking ID</span>
                            <span className="text-sm font-mono font-bold text-blue-600">#STK-{String(itemData.id).padStart(4, '0')}</span>
                        </div>

                        {/* 2. ITEM NAME */}
                        <div className="border-b border-gray-100 pb-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Vendor Name </span>
                            <span className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">{itemData.vendorName || itemData.VendorName || itemData.vendor || "N/A"}</span>

                        </div>

                        {/* 3. PURCHASE ORDER NUMBER */}
                       <div className="border-b border-gray-100 pb-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Purchase Order No (PO)</span>
                            <span className="text-sm font-mono font-bold text-gray-700 uppercase tracking-tight">{itemData.purchase_no || '—'}</span>
                        </div>

                        <div className="border-b border-gray-100 pb-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Assigned Warehouse Base</span>
                            <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                                {isAdmin ? (itemData.OfficeName || `Branch ${itemData.officeId}`) : "Local Warehouse Branch"}
                            </span>
                        </div>

                        {/* SECTION 3: Dates */}
                        <div className="border-b border-gray-100 pb-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Purchase Date</span>
                            <span className="text-sm font-medium text-gray-800 font-mono">{formatDate(itemData.purchase_date)}</span>
                        </div>

                        <div className="border-b border-gray-100 pb-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Billing Invoice Date</span>
                            <span className="text-sm font-medium text-gray-800 font-mono">{formatDate(itemData.invoice_date)}</span>
                        </div>

                        {/* SECTION 4: 🟢 NEWLY MOVED CREATOR IDENTITY AND TIMESTAMPS BAR */}
                        <div className="border-b border-gray-100 pb-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Created By</span>
                            <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                                {itemData.creatorName || "Central Corporate"}
                            </span>
                        </div>

                        <div className="border-b border-gray-100 pb-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Last Database Sync Timestamp</span>
                            <span className="text-sm font-medium text-gray-800 font-mono">{formatDateTime(itemData.UpdateDateTime)}</span>
                        </div>

                        {/* ================= DOCUMENT ATTACHMENT VIEWPORT CHECKS ================= */}
                        
                        {/* 📑 PURCHASE DOCUMENT DOWNLOAD BANNER */}
                        <div className="flex flex-col gap-1.5 sm:col-span-1 bg-gray-50 p-3 rounded-xl border border-gray-200">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Purchase Blueprint Verification</span>
                            <div className="flex items-center justify-between gap-2 mt-1">
                                <span className="text-xs font-mono text-gray-600 truncate max-w-[65%]">
                                    {itemData.purchase_pdf ? itemData.purchase_pdf.split('\\').pop() : 'No PDF Logged'}
                                </span>
                                {itemData.purchase_pdf && (
                                    <button type="button" onClick={() => handleViewFile(itemData.purchase_pdf)} className="inline-flex items-center gap-1 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded shadow-sm transition-colors uppercase">
                                        Open Document
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 📑 INVOICE DOCUMENT DOWNLOAD BANNER */}
                        <div className="flex flex-col gap-1.5 sm:col-span-1 bg-gray-50 p-3 rounded-xl border border-gray-200">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Invoice Document Verification</span>
                            <div className="flex items-center justify-between gap-2 mt-1">
                                <span className="text-xs font-mono text-gray-600 truncate max-w-[65%]">
                                    {itemData.invoice_pdf ? itemData.invoice_pdf.split('\\').pop() : 'No PDF Logged'}
                                </span>
                                {itemData.invoice_pdf && (
                                    <button type="button" onClick={() => handleViewFile(itemData.invoice_pdf)} className="inline-flex items-center gap-1 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded shadow-sm transition-colors uppercase">
                                        Open Document
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="sm:col-span-2 mt-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                                Consolidated Batch Manifest Items Breakdown
                            </span>
                            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm max-h-[200px] overflow-y-auto">
                                <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-500 font-bold uppercase border-b border-gray-200 text-[10px] tracking-wider">
                                            <th className="p-3 px-4">Item Name</th>
                                            <th className="p-3 px-4">Category</th>
                                            <th className="p-3 px-4 text-center">Quantity</th>
                                            <th className="p-3 px-4 text-right">Unit Price</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {/* Loops dynamically over allItems array payload safely, falls back to raw item row if flat */}
                                        {(itemData?.allItems && itemData.allItems.length > 0 ? itemData.allItems : [itemData]).map((subItem, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors duration-100">
                                                
                                                {/* A. Nomenclature */}
                                                <td className="p-3 px-4 font-bold text-gray-900 uppercase">
                                                    {subItem.itemName || subItem.item || "—"}
                                                </td>

                                            <td className="p-3 px-4">
                                                <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded font-semibold text-[10px]">
                                                    {/* 🟢 FIXED: Tries reading subItem.category first, then defaults safely */}
                                                    {subItem.category || itemData?.Category || itemData?.category || "General"}
                                                </span>
                                            </td>
                                                                                            
                                                {/* B. Category Tag Label */}
                                                {/* <td className="p-3 px-4">
                                                    <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded font-semibold text-[10px]">
                                                        {subItem.category || itemData?.Category || "General"}
                                                    </span>
                                                </td> */}
                                                
                                                {/* C. Units Count */}
                                                <td className="p-3 px-4 text-center font-mono font-extrabold text-blue-600">
                                                    {subItem.quantity || subItem.Quantity || 0} Units
                                                </td>
                                                
                                                {/* D. Pricing Evaluation */}
                                                <td className="p-3 px-4 text-right font-mono font-extrabold text-emerald-600">
                                                    ₹{(parseFloat(subItem.unitCost || subItem.unit_cost) || 0).toFixed(2)}
                                                </td>

                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>


                    </div>
                </div>

                {/* Footer Utility Bar */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                    <button type="button" onClick={onClose} className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-lg text-xs transition-colors shadow-sm">
                        Close Overview
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ViewStockModal;