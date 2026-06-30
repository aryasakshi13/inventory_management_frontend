import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const AddStockModel = ({ isOpen, onClose, userRole, currentOfficeId, onSuccess }) => {
    // 🗄️ FETCHED SELECTION STATES
    const [availableItems, setAvailableItems] = useState([]);
    const [availableOffices, setAvailableOffices] = useState([]);
    const [availableVendors, setAvailableVendors] = useState([]);
    const [vendorId, setVendorId] = useState('');

    // 📝 TRANSACTION PARAMETERS
    // const [itemName, setItemName] = useState('');
    const [officeName, setOfficeName] = useState('');
    // const [quantity, setQuantity] = useState('');
    const [purchaseNo, setPurchaseNo] = useState('');
    const [purchaseDate, setPurchaseDate] = useState('');
    const [invoiceDate, setInvoiceDate] = useState('');
    // const [unitCost, setUnitCost] = useState('');

         const [items, setItems] = useState([
        { itemName: '', quantity: '', unitCost: '' }
    ]);


    // 💾 FILE STATE HOOKS
    const [purchaseFile, setPurchaseFile] = useState(null);
    const [invoiceFile, setInvoiceFile] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // DOM pointers to clear native browser file storage
    const purchaseInputRef = useRef(null);
    const invoiceInputRef = useRef(null);

    // Fetch drop-down source directories dynamically from your database references
    const loadDropdownMetadata = async () => {
        try {
            // 1. Fetch available item blueprints from itemmaster
 
            // const itemsRes = await axios.get('https://inventory-manage-q4yr.onrender.com/api/items');
            // if (itemsRes.data.success) {
            //     setAvailableItems(itemsRes.data.data || []);
            // }

            // // 2. Fetch registered office names (Make sure you have this route open on backend)
            // const officesRes = await axios.get('https://inventory-manage-q4yr.onrender.com/api/branch');
            // if (officesRes.data.success) {
            //     setAvailableOffices(officesRes.data.data || []); // Expecting array of { OfficeName }
            // }

              const [itemsRes, officesRes, vendorsRes] = await Promise.all([
                axios.get('https://inventory-manage-q4yr.onrender.com/api/items'),
                axios.get('https://inventory-manage-q4yr.onrender.com/api/branch'),
                axios.get('https://inventory-manage-q4yr.onrender.com/api/vendor?limit=1000')


            ]);
            if (itemsRes.data.success) setAvailableItems(itemsRes.data.data || []);
             if (vendorsRes.data.success) setAvailableVendors(vendorsRes.data.data || []);
            // if (officesRes.data.success) setAvailableOffices(officesRes.data.data || []);

            // if (officesRes.data.success) {
            //     const officeList = officesRes.data.data || [];
            //     setAvailableOffices(officeList);
            // }

            // if (userRole === 'branch admin' && currentOfficeId) {
            //         const matched = officeList.find(o => Number(o.ID) === Number(currentOfficeId) || Number(o.officeId) === Number(currentOfficeId));
            //        if (matched) {
            //             setOfficeName(matched.OfficeName);
            //         } else {
            //             setOfficeName(`Branch ${currentOfficeId}`);
            //         }
            //     }

            if (officesRes.data.success) {
                const officeList = officesRes.data.data || [];
                setAvailableOffices(officeList); // 1. Save data safely to state

                // 2. 🚀 Run the selection engine immediately inside the same scope block!
                if (userRole === 'branch admin' && currentOfficeId) {
                    const matched = officeList.find(
                        o => Number(o.ID) === Number(currentOfficeId) || 
                             Number(o.officeId) === Number(currentOfficeId)
                    );
                    
                    if (matched) {
                        setOfficeName(matched.OfficeName); // 🟢 Will set it to exactly 'AMBALA' now!
                    } else {
                        setOfficeName(`Branch ${currentOfficeId}`);
                    }
                }
            }


        } catch (err) {
            console.error("Failed to load dropdown directories:", err.message);
        }
    };

    const resetFormCompletely = () => {
        // setItemName('');
        setVendorId('');
        setOfficeName('');
        // setQuantity('');
        setPurchaseNo('');
        setPurchaseDate('');
        setInvoiceDate('');
         setItems([{ itemName: '', quantity: '', unitCost: '' }]);


        // setUnitCost('');
        setPurchaseFile(null);
        setInvoiceFile(null);
        setErrorMessage('');
        if (purchaseInputRef.current) purchaseInputRef.current.value = "";
        if (invoiceInputRef.current) invoiceInputRef.current.value = "";
    };

    useEffect(() => {
        if (isOpen) {
            resetFormCompletely();
            loadDropdownMetadata();
        }
    }, [isOpen, userRole, currentOfficeId ]);


    const handleItemRowChange = (index, field, value) => {
        const updateRows = [...items];
        updateRows[index][field] = value;
        setItems(updateRows);
    };

    const addItemRow = () => {
        setItems([...items, { itemName: '', quantity: '', unitCost: '' }]);
    };

    const removeItemRow = (index) => {
        if (items.length === 1) return;
        setItems(items.filter((_, idx) => idx !== index));
    };

    // 🛡️ ROLE PARSING ACCESS CONTROL GUARDRAIL
    if (!isOpen) return null;
    if (userRole !== 'admin' &&  userRole !== 'branch admin') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
                <div className="relative bg-white p-6 rounded-xl max-w-sm text-center shadow-xl z-10 border border-gray-100">
                    <p className="text-sm font-bold text-rose-600 uppercase tracking-wide">Clearance Violation</p>
                    <p className="text-xs text-gray-500 mt-2 font-medium">Access Denied. Logging fresh shipments requires Super Administrator structural permissions.</p>
                    <button onClick={onClose} className="mt-4 px-4 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold">Close Window</button>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        // if (!itemName || !officeName || !quantity) {
        //     setErrorMessage("Item Model Name, Target Branch Office, and Quantity parameters are required.");
        //     return;
        // }

        setErrorMessage('');

        if (!vendorId) {
            setErrorMessage("Vendor Entity choice parameter is strictly required.");
            return;
        }

        //   if (!purchaseNo || !purchaseNo.trim()) {
        //     setErrorMessage("Purchase Order Number (PO) is strictly required to categorize purchased stocks.");
        //     return;
        // }
        
        // if (!purchaseNo || !purchaseNo.trim()) {
        //     setErrorMessage("Purchase Order Number (PO) is strictly required to categorize purchased stocks.");
        //     return;
        // }


    if (userRole === 'admin' && !officeName) {
            setErrorMessage("Target Office Location field parameter is required.");
            return;
        }

        for (let i = 0; i < items.length; i++) {
            if (!items[i].itemName || !items[i].quantity || !items[i].unitCost) {
                setErrorMessage(`Please fill out Item Model, Quantity, and Cost fields completely on entry line #${i + 1}.`);
                return;
            }
        }



        try {
            setIsSubmitting(true);
            setErrorMessage('');

            const formData = new FormData();
            // formData.append('itemName', itemName);
           if (userRole === 'branch admin') {
                formData.append('officeName', officeName || `Branch ${currentOfficeId}`);
            } else {
                formData.append('officeName', officeName);
            } // Str parameter read by backend resolution engine
            // formData.append('quantity', parseInt(quantity) || 0);
            formData.append('purchaseNo', purchaseNo.trim());
            formData.append('vendorId', vendorId);
            formData.append('purchaseDate', purchaseDate || '');
            formData.append('invoiceDate', invoiceDate || '');
            // formData.append('unitCost', parseFloat(unitCost) || 0.00);

            formData.append('items', JSON.stringify(items));

            if (purchaseFile) formData.append('purchaseCopy', purchaseFile);
            if (invoiceFile) formData.append('invoiceCopy', invoiceFile);

            const response = await axios.post('https://inventory-manage-q4yr.onrender.com/api/inventry/add', formData, {
                // headers: {
                //     'Content-Type': 'multipart/form-data',
                //     'x-user-role': userRole,
                //     'x-user-office-id': currentOfficeId
                // }
                   
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data'
                }

            });

            if (response.data.success) {
                resetFormCompletely();
                onSuccess();
                onClose();
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Failed to submit new stock batch.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        // <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        //     <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={resetFormCompletely}></div>

        //     <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
                
        //         <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
        //             <div>
        //                 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Log Shipment Consignment</h3>
        //                 <p className="text-[11px] text-gray-400 mt-0.5">Adding arrival inventory records into physical batch ledger</p>
        //             </div>
        //             <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
        //                 <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        //             </button>
        //         </div>

        //         <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 max-h-[82vh] overflow-y-auto">
        //             {errorMessage && (
        //                 <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-xs font-semibold text-rose-600">
        //                     {errorMessage}
        //                 </div>
        //             )}

        //             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                        
        //                 {/* 🏢 ITEM SELECTION SELECT DROPDOWN */}
        //                 <div className="flex flex-col gap-1.5 sm:col-span-2">
        //                     {/* <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Select Catalog Item Model*</label> */}

        //                     <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Purchase Order No (PO) *</label>
        //                     <input type="text" required value={purchaseNo} onChange={(e) => setPurchaseNo(e.target.value)} placeholder="e.g. PO-2026-004" className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 font-mono font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none" />
        //                     {/* <select
        //                         value={itemName}
        //                         onChange={(e) => setItemName(e.target.value)}
        //                         className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none appearance-none"
        //                     >
        //                         <option value="">-- Choose Item Model From Master Catalog List --</option>
        //                         {availableItems.map((item) => (
        //                             <option key={item.ItemId} value={item.ItemName}>{item.ItemName.toUpperCase()}</option>
        //                         ))}
        //                     </select> */}
        //                 </div>



        //                 {/* 🏢 OFFICE SELECTION SELECT DROPDOWN */}
        //                 <div className="flex flex-col gap-1.5">
        //                     <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Target Office Location *</label>
        //                     <select
        //                         value={officeName}
        //                         onChange={(e) => setOfficeName(e.target.value)}
        //                         className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none appearance-none"
        //                     >
        //                         <option value="">-- Choose Target Office --</option>
        //                         {availableOffices.map((office, idx) => (
        //                             <option key={idx} value={office.OfficeName}>{office.OfficeName.toUpperCase()}</option>
        //                         ))}
        //                     </select>
        //                 </div>

        //                 {/* <div className="flex flex-col gap-1.5">
        //                     <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider"> Quantity *</label>
        //                     <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 font-mono font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none" />
        //                 </div> */}

        //                 {/* <div className="flex flex-col gap-1.5">
        //                     <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Purchase Order No (PO)</label>
        //                     <input type="text" value={purchaseNo} onChange={(e) => setPurchaseNo(e.target.value)} placeholder="e.g. PO-2026-004" className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none" />
        //                 </div> */}

        //                 {/* <div className="flex flex-col gap-1.5">
        //                     <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Unit Cost (₹)</label>
        //                     <input type="text" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 font-mono font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none" />
        //                 </div> */}

        //                 <div className="flex flex-col gap-1.5">
        //                     <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Official Purchase Date</label>
        //                     <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none" />
        //                 </div>

        //                 <div className="flex flex-col gap-1.5">
        //                     <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Billing Invoice Date</label>
        //                     <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none" />
        //                 </div>

        //                  {/* 🔥 🌟 🚀 [UI HIGHLIGHT: ENTIRELY NEW SECTION] THE MULTI-ITEM DYNAMIC REPEATER AREA 🚀 🌟 🔥 */}
        //             <div className="space-y-3 mt-2">
        //                 <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        //                     <label className="text-xs font-black text-gray-700 uppercase tracking-wider">Consignment Allocation Line Items</label>
        //                     {/* ADD ITEM ROW BUTTON */}
        //                     <button type="button" onClick={addItemRow} className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-all rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
        //                         ➕ Add New Item
        //                     </button>
        //                 </div>

        //                  {/* ROW MAPPING BLOCK CONTAINER */}
        //                 {items.map((row, index) => (
        //                     <div key={index} className="flex flex-col sm:flex-row items-end gap-3 p-4 bg-white border border-gray-200 rounded-xl relative hover:shadow-sm transition-all">
                                
        //                         {/* 1. DYNAMIC CATALOG ITEM SELECT DROP-DOWN */}
        //                         <div className="flex flex-col gap-1.5 flex-1 w-full">
        //                             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Catalog Item Model ({index + 1}) *</label>
        //                             <select value={row.itemName} onChange={(e) => handleItemRowChange(index, 'itemName', e.target.value)} className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg text-gray-900 font-semibold focus:border-blue-500 outline-none" >
        //                                 <option value="">-- Select Catalog Item Model --</option>
        //                                 {availableItems.map((item) => (
        //                                     <option key={item.ItemId} value={item.ItemName}>{item.ItemName.toUpperCase()}</option>
        //                                 ))}
        //                             </select>
        //                         </div>

        //                         {/* 2. QTY INPUT ROW ELEMENT */}
        //                         <div className="flex flex-col gap-1.5 w-full sm:w-24">
        //                             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Qty *</label>
        //                             <input type="number" min="1" value={row.quantity} onChange={(e) => handleItemRowChange(index, 'quantity', e.target.value)} placeholder="0" className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg font-mono font-bold text-center focus:border-blue-500 outline-none" />
        //                         </div>

        //                         {/* 3. COST INPUT ROW ELEMENT */}
        //                         <div className="flex flex-col gap-1.5 w-full sm:w-32">
        //                             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Unit Cost (₹) *</label>
        //                             <input type="number" step="0.01" value={row.unitCost} onChange={(e) => handleItemRowChange(index, 'unitCost', e.target.value)} placeholder="0.00" className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg font-mono font-bold focus:border-blue-500 outline-none" />
        //                         </div>

        //                         {/* 4. INDIVIDUAL ROW ACTION TRASH BUTTON CONTROL */}
        //                         {items.length > 1 && (
        //                             <button type="button" onClick={() => removeItemRow(index)} className="p-2 border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shadow-sm mb-0.5">
        //                                 ❌
        //                             </button>
        //                         )}
        //                     </div>
        //                 ))}
        //             </div>



        //                 {/* FILES SELECTION */}
        //                 <div className="flex flex-col gap-1.5">
        //                     <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Purchase PDF Copy</label>
        //                     <div className="relative flex items-center justify-between border border-gray-300 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 transition-all overflow-hidden">
        //                         <span className="text-xs font-medium text-gray-400 truncate max-w-[70%] font-mono">
        //                             {purchaseFile ? purchaseFile.name : 'No PDF file selected'}
        //                         </span>
        //                         <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded transition-colors uppercase select-none">
        //                             Browse
        //                             <input ref={purchaseInputRef} type="file" accept="application/pdf" onChange={(e) => setPurchaseFile(e.target.files[0] || null)} className="hidden" />
        //                         </label>
        //                     </div>
        //                 </div>

        //                 <div className="flex flex-col gap-1.5 sm:col-span-2">
        //                     <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Billing Invoice Document Copy</label>
        //                     <div className="relative flex items-center justify-between border border-gray-300 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 transition-all overflow-hidden">
        //                         <span className="text-xs font-medium text-gray-400 truncate max-w-[80%] font-mono">
        //                             {invoiceFile ? invoiceFile.name : 'No PDF file selected'}
        //                         </span>
        //                         <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded transition-colors uppercase select-none">
        //                             Browse
        //                             <input ref={invoiceInputRef} type="file" accept="application/pdf" onChange={(e) => setInvoiceFile(e.target.files[0] || null)} className="hidden" />
        //                         </label>
        //                     </div>
        //                 </div>

        //             </div>

        //             <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
        //                 <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-lg text-xs transition-colors shadow-sm">
        //                     Cancel
        //                 </button>
        //                 <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5">
        //                     {isSubmitting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
        //                      Submit
        //                 </button>
        //             </div>
        //         </form>
        //     </div>
        // </div>

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>

            {/* ✨ [UI CHANGED HIGHLIGHT]: Max-width container extended up to 'max-w-4xl' for clean grid sizing alignment layouts */}
            <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-10 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 text-left">
                
                {/* Modal Header */}
                <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Log Shipment Consignment</h3>
                        <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase">
                            {userRole === 'admin' ? "Super Admin Terminal Override Panel" : `Authorized Node Instance: ${officeName || 'Resolving...'}`}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>

                


                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto flex-1 text-left">
                    {errorMessage && <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-xs font-semibold text-rose-600">{errorMessage}</div>}

                    {/* METADATA TARGET CONFIGURATIONS PANEL */}
                    <div className="flex flex-col gap-4 bg-slate-50/60 p-4 border border-slate-100 rounded-xl">
                        
                        {/* ROW 1: VENDOR & OPTIONAL HUB OVERRIDE */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-1.5 md:col-span-2">
                                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Select Vendor Source Partner *</label>
                                <select required value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 font-bold focus:border-blue-500 outline-none">
                                    <option value="">-- Choose Vendor from registered Registry --</option>
                                    {availableVendors.map((v) => (
                                        <option key={v.VendorId} value={v.VendorId}>{v.VendorName.toUpperCase()} ({v.GSTNumber})</option>
                                    ))}
                                </select>
                            </div>

                            {userRole === 'admin' && (
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Target Office Location *</label>
                                    <select value={officeName} onChange={(e) => setOfficeName(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 font-semibold focus:border-blue-500 outline-none">
                                        <option value="">-- Choose Target Office --</option>
                                        {availableOffices.map((office, idx) => (
                                            <option key={idx} value={office.OfficeName}>{office.OfficeName.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* 🌟 ROW 2: PURCHASE GRID (PO NO, PURCHASE DATE, BROWSE PDF IN ONE ROW) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Purchase Order No (PO)</label>
                                <input type="text" value={purchaseNo} onChange={(e) => setPurchaseNo(e.target.value)} placeholder="e.g. PO-2026-004" className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 font-mono font-bold focus:border-blue-500 outline-none" />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Official Purchase Date</label>
                                <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 font-semibold focus:border-blue-500 outline-none" />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Purchase PDF Copy</label>
                                <div className="relative flex items-center justify-between border border-gray-300 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 transition-all overflow-hidden">
                                    <span className="text-xs font-medium text-gray-400 truncate max-w-[55%] font-mono">{purchaseFile ? purchaseFile.name : 'No PDF selected'}</span>
                                    <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded transition-colors uppercase select-none">
                                        Browse
                                        <input ref={purchaseInputRef} type="file" accept="application/pdf" onChange={(e) => setPurchaseFile(e.target.files[0] || null)} className="hidden" />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* 🌟 ROW 3: INVOICE GRID (INVOICE DATE, BROWSE PDF IN ONE ROW) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Billing Invoice Date</label>
                                <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 font-semibold focus:border-blue-500 outline-none" />
                            </div>

                            <div className="flex flex-col gap-1.5 md:col-span-2">
                                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Billing Invoice Document Copy</label>
                                <div className="relative flex items-center justify-between border border-gray-300 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 transition-all overflow-hidden">
                                    <span className="text-xs font-medium text-gray-400 truncate max-w-[70%] font-mono">{invoiceFile ? invoiceFile.name : 'No PDF selected'}</span>
                                    <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded transition-colors uppercase select-none">
                                        Browse
                                        <input ref={invoiceInputRef} type="file" accept="application/pdf" onChange={(e) => setInvoiceFile(e.target.files[0] || null)} className="hidden" />
                                    </label>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* DYNAMIC ITEM REPEATER SECTION (Maintained exactly as requested) */}
                    <div className="space-y-3 mt-2">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                            <label className="text-xs font-black text-gray-700 uppercase tracking-wider">Consignment Allocation Line Items</label>
                            <button type="button" onClick={addItemRow} className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-all rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                ➕ Add New Item
                            </button>
                        </div>

                        {items.map((row, index) => (
                            <div key={index} className="flex flex-col sm:flex-row items-end gap-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-gray-300 transition-all">
                                <div className="flex flex-col gap-1.5 flex-1 w-full text-left">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Catalog Item Model ({index + 1}) *</label>
                                    <select value={row.itemName} onChange={(e) => handleItemRowChange(index, 'itemName', e.target.value)} className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg text-gray-900 font-extrabold focus:border-blue-500 outline-none">
                                        <option value="">-- Select Catalog Item Model --</option>
                                        {availableItems.map((item) => <option key={item.ItemId} value={item.ItemName}>{item.ItemName.toUpperCase()}</option>)}
                                    </select>
                                </div>

                                {/* 🟢 UI FIXED: High-Contrast text-gray-900 styling applied to dynamic item rows */}
                                <div className="flex flex-col gap-1.5 w-full sm:w-24 text-left">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Qty *</label>
                                    <input type="number" min="1" placeholder="0" value={row.quantity} onChange={(e) => handleItemRowChange(index, 'quantity', e.target.value)} className="w-full px-3 py-1.5 text-xs border border-gray-300 bg-white rounded-lg text-center font-mono font-black text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none shadow-sm" />
                                </div>

                                {/* 🟢 UI FIXED: High-Contrast text-gray-900 styling applied to unit cost input fields */}
                                <div className="flex flex-col gap-1.5 w-full sm:w-32 text-left">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Unit Cost *</label>
                                    <input type="number" step="0.01" placeholder="0.00" value={row.unitCost} onChange={(e) => handleItemRowChange(index, 'unitCost', e.target.value)} className="w-full px-3 py-1.5 text-xs border border-gray-300 bg-white rounded-lg text-right font-mono font-black text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none shadow-sm" />
                                </div>

                                {/* 🟢 UI FIXED: Premium native SVG icon replacing the generic cross character */}
                                {items.length > 1 && (
                                    <button 
                                        type="button" 
                                        onClick={() => removeItemRow(index)} 
                                        className="p-2 border border-gray-200 hover:border-red-200 bg-white hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-all mb-0.5 shadow-sm active:scale-95"
                                        title="Delete Item Line"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.167 0 00-7.5 0" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </form>

                {/* Sticky Action Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-xs transition-colors shadow-sm">
                        Cancel
                    </button>
                    <button type="submit" onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5 uppercase tracking-wider">
                        {isSubmitting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                        Submit Consignment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddStockModel;



