import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const UpdateStockModel = ({ isOpen, onClose, itemData, userRole, currentOfficeId, onSuccess }) => {
    // 📝 MANAGED FORM CONTROL STATES
    
    const [category, setCategory] = useState('');
    const [officeId, setOfficeId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [purchaseDate, setPurchaseDate] = useState('');
    // const [purchasePdf, setPurchasePdf] = useState('');
    const [invoiceDate, setInvoiceDate] = useState('');
    // const [invoicePdf, setInvoicePdf] = useState('');
    const [unitCost, setUnitCost] = useState('');

    const [purchaseFile, setPurchaseFile] = useState(null);
    const [existingPurchasePath, setExistingPurchasePath] = useState('');

    const [invoiceFile, setInvoiceFile] = useState(null);
    const [existingInvoicePath, setExistingInvoicePath] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

     // 🌟 ADDED: DOM REFS & CLEANUP UTILITY
    // ==========================================
    const purchaseInputRef = useRef(null);
    const invoiceInputRef = useRef(null);

    const resetFormCompletely = () => {
        setCategory('');
        setOfficeId('');
        setQuantity('');
        setPurchaseDate('');
        setInvoiceDate('');
        setUnitCost('');
        setPurchaseFile(null);
        setInvoiceFile(null);
        setExistingPurchasePath('');
        setExistingInvoicePath('');
        setErrorMessage('');

        // Force-wipes the browser's native text cache for selected files
        if (purchaseInputRef.current) purchaseInputRef.current.value = "";
        if (invoiceInputRef.current) invoiceInputRef.current.value = "";
    };

    const handleCancelClick = () => {
        resetFormCompletely();
        onClose();
    };

    // Utility function helper to parse SQL Datetime strings safely into HTML date inputs (YYYY-MM-DD)
    const formatSqlDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toISOString().split('T')[0];
    };

    // Synchronize incoming row properties on open trigger calls
    useEffect(() => {
        if (isOpen && itemData) {
             
            if (purchaseInputRef.current) purchaseInputRef.current.value = "";
            if (invoiceInputRef.current) invoiceInputRef.current.value = "";
            setPurchaseFile(null);
            setInvoiceFile(null);

            setCategory(itemData.Category || itemData.category || '');
            setOfficeId(itemData.officeId || '');
            setQuantity(itemData.Quantity || '0');
            setPurchaseDate(formatSqlDate(itemData.purchase_date));
            // setPurchasePdf(itemData.purchase_pdf || '');
            setInvoiceDate(formatSqlDate(itemData.invoice_date));
            // setInvoicePdf(itemData.invoice_pdf || '');
            
            setExistingPurchasePath(itemData.purchase_pdf || '');
            setExistingInvoicePath(itemData.invoice_pdf || '');

            setUnitCost(itemData.unit_cost || '0.00');
            
            setErrorMessage('');
        } else if(!isOpen){
             resetFormCompletely();
        }
    }, [itemData, isOpen]);

    if (!isOpen || !itemData) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            setErrorMessage('');

            // 🎯 CRITICAL SYNC: Packaging properties exactly as req.body destructures it
            // const payload = {
            //     id: itemData.id,
            //     category: category.trim(),
            //     officeId: parseInt(officeId) || 1,
            //     Quantity: parseInt(quantity) || 0,
            //     purchase_date: purchaseDate || null,
            //     purchase_pdf: purchasePdf.trim() || null,
            //     invoice_date: invoiceDate || null,
            //     invoice_pdf: invoicePdf.trim() || null,
            //     unit_cost: parseFloat(unitCost) || 0.00
            // };

             // 🎯 CRITICAL: Use FormData instead of plain JSON for multipart streaming
            const formData = new FormData();
            formData.append('id', itemData.id);
            formData.append('category', category.trim());
            formData.append('officeId', parseInt(officeId) || 1);
            formData.append('Quantity', parseInt(quantity) || 0);
            formData.append('purchase_date', purchaseDate || '');
            formData.append('invoice_date', invoiceDate || '');
            formData.append('unit_cost', parseFloat(unitCost) || 0.00);

            // Append new binary file object if chosen, otherwise pass back the existing path string
            if (purchaseFile) {
                formData.append('purchaseCopy', purchaseFile);
            } else {
                formData.append('purchaseCopy', existingPurchasePath);
            }

            if (invoiceFile) {
                formData.append('invoiceCopy', invoiceFile);
            } else {
                formData.append('invoiceCopy', existingInvoicePath);
            }  

            const response = await axios.post('https://inventory-manage-q4yr.onrender.com/api/inventry/update', formData, {
                headers: {
                     'Content-Type': 'multipart/form-data', 
                    'x-user-role': userRole,
                    'x-user-office-id': currentOfficeId
                }
            });

            if (response.data.success) {
                onSuccess(); // Instantly reload table dataset rows
                onClose();   // Close out view
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Operational asset ledger synchronization failure.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
       <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
                
                {/* Modal Header */}
                <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Modify Record Entry</h3>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">Asset Registry Tracking Node: #STK-{String(itemData.id).padStart(4, '0')}</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 max-h-[82vh] overflow-y-auto">
                    {errorMessage && (
                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-xs font-semibold text-rose-600">
                            {errorMessage}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                        
                        {/* READ-ONLY INPUT TRACKS */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Stock Reference ID</label>
                            <input type="text" value={`#STK-${String(itemData.id).padStart(4, '0')}`} readOnly className="w-full px-3 py-2 text-sm bg-gray-100/80 border border-gray-200 rounded-lg text-gray-500 font-mono font-bold cursor-not-allowed outline-none select-none" />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Item Name (System Locked)</label>
                            <input type="text" value={itemData.item || itemData.itemName || ''} readOnly className="w-full px-3 py-2 text-sm bg-gray-100/80 border border-gray-200 rounded-lg text-gray-500 font-semibold cursor-not-allowed outline-none select-none uppercase" />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Purchase Number (Locked)</label>
                            <input type="text" value={itemData.purchase_no || 'UNASSIGNED'} readOnly className="w-full px-3 py-2 text-sm bg-gray-100/80 border border-gray-200 rounded-lg text-gray-500 font-mono font-bold cursor-not-allowed outline-none select-none" />
                        </div>

                        {/* EDITABLE FIELDS */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Asset Category</label>
                            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none" />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Warehouse / Office ID Target</label>
                            <input type="number" value={officeId} onChange={(e) => setOfficeId(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 font-mono font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none" />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Available Stock Quantity</label>
                            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 font-mono font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none" />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Unit Evaluation Cost</label>
                            <input type="text" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 font-mono font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none" />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Official Purchase Date</label>
                            <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none" />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Billing Invoice Date</label>
                            <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none" />
                        </div>

                        {/* FILE SELECTION AREA: PURCHASE PDF COPY */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Purchase PDF Blueprint Copy</label>
                            <div className="relative flex items-center justify-between border border-gray-300 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 transition-all overflow-hidden">
                                <span className="text-xs font-medium text-gray-500 max-w-[70%] truncate font-mono">
                                    {purchaseFile ? purchaseFile.name : (existingPurchasePath ? existingPurchasePath.split('\\').pop() : 'No PDF attached')}
                                </span>
                                <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded transition-colors uppercase select-none">
                                    Browse
                                    <input 
                                      ref = {purchaseInputRef}
                                     type="file" accept="application/pdf" onChange={(e) => setPurchaseFile(e.target.files[0] || null)} className="hidden" />
                                </label>
                            </div>
                        </div>

                        {/* FILE SELECTION AREA: INVOICE PDF COPY */}
                        <div className="flex flex-col gap-1.5 sm:col-span-2">
                            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Billing Invoice Document Copy</label>
                            <div className="relative flex items-center justify-between border border-gray-300 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 transition-all overflow-hidden">
                                <span className="text-xs font-medium text-gray-500 max-w-[80%] truncate font-mono">
                                    {invoiceFile ? invoiceFile.name : (existingInvoicePath ? existingInvoicePath.split('\\').pop() : 'No PDF attached')}
                                </span>
                                <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded transition-colors uppercase select-none">
                                    Browse
                                    <input
                                     ref ={invoiceInputRef} 
                                    type="file" accept="application/pdf" onChange={(e) => setInvoiceFile(e.target.files[0] || null)} className="hidden" />
                                </label>
                            </div>
                        </div>

                    </div>

                    {/* Action Controls Footer */}
                    <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-lg text-xs transition-colors shadow-sm">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5">
                            {isSubmitting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                            Save System Entries
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateStockModel;