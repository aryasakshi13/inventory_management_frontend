// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { X, Search, Send, RefreshCw, User, Building, AlertTriangle } from 'lucide-react';

// const IssueEmployeeModal = ({ isOpen, onClose, availableItems, availableOffices, employeeRegistry, onActionSuccess }) => {
//     const [itemName, setItemName] = useState('');
//     const [qty, setQty] = useState('');
//     const [empId, setEmpId] = useState('');
//     const [empName, setEmpName] = useState('');
    
//     // Branch Autocomplete States
//     const [selectedOfficeId, setSelectedOfficeId] = useState('');
//     const [branchSearchQuery, setBranchSearchQuery] = useState('');
//     const [filteredBranches, setFilteredBranches] = useState([]);
//     const [showBranchDropdown, setShowBranchDropdown] = useState(false);

//     // Employee Autocomplete States
//     const [empSearchQuery, setEmpSearchQuery] = useState('');
//     const [filteredEmployees, setFilteredEmployees] = useState([]);
//     const [showEmpDropdown, setShowEmpDropdown] = useState(false);

//     // 🎯 NEW: Stock validation tracking states
//     const [selectedItemMaxStock, setSelectedItemMaxStock] = useState(null);
//     const [stockValidationError, setStockValidationError] = useState('');

//     const [isSubmitting, setIsSubmitting] = useState(false);
//     const [errorMsg, setErrorMsg] = useState('');

//     // 1. FILTER DIRECTORY: Show only items that have an active stock count > 0
//     const activeInStockItems = availableItems.filter(item => {
//         // Adjust 'Quantity' or 'qty' based on your exact backend column casing payload
//         const stockCount = item.Quantity !== undefined ? item.Quantity : 
//             item.qty !== undefined ? item.qty :
//             item.total_stock !== undefined ? item.total_stock : 1;
//         return parseInt(stockCount) > 0;
//     });

//     // 🔍 2. EMPLOYEE AUTOCOMPLETE: Safe cross-reference lookup
//     const handleEmployeeSearch = (e) => {
//         const value = e.target.value;
//         setEmpSearchQuery(value);
        
//         if (value.trim().length > 0) {
//             const matches = employeeRegistry.filter(emp => {
//                 const currentName = (emp.name || emp.Name || '').toLowerCase();
//                 const currentId = (emp.EmpId || emp.EmpID || emp.id || '').toLowerCase();
//                 return currentName.includes(value.toLowerCase()) || currentId.includes(value.toLowerCase());
//             });
//             setFilteredEmployees(matches);
//             setShowEmpDropdown(true);
//         } else {
//             setShowEmpDropdown(false);
//         }
//     };

//     const selectEmployee = (emp) => {
//         const resolvedId = emp.EmpId || emp.EmpID || emp.id;
//         const resolvedName = emp.name || emp.Name;
        
//         // 🎯 FIXING THE N/A BUG: Inspecting alternative schema naming fields from database rows
//         const resolvedOfficeId = emp.OfficeID || emp.OfficeId || emp.officeId;
//         const resolvedOfficeCode = emp.OfficeCode || emp.Officecode || emp.branch;

//         setEmpId(resolvedId);
//         setEmpName(resolvedName);
//         setEmpSearchQuery(`${resolvedName} (#${resolvedId})`);
//         setShowEmpDropdown(false);

//         // Map employee data directly to your master office names dropdown list
//         if (resolvedOfficeId) {
//             const matchedOffice = availableOffices.find(o => parseInt(o.OfficeID) === parseInt(resolvedOfficeId));
//             if (matchedOffice) {
//                 setSelectedOfficeId(matchedOffice.OfficeID);
//                 setBranchSearchQuery(matchedOffice.OfficeName.toUpperCase());
//                 return;
//             }
//         }

//         if (resolvedOfficeCode && resolvedOfficeCode !== 'N/A') {
//             const matchedOffice = availableOffices.find(o => 
//                 o.OfficeCode?.toLowerCase() === String(resolvedOfficeCode).toLowerCase() ||
//                 o.OfficeName?.toLowerCase().includes(String(resolvedOfficeCode).toLowerCase())
//             );
//             if (matchedOffice) {
//                 setSelectedOfficeId(matchedOffice.OfficeID);
//                 setBranchSearchQuery(matchedOffice.OfficeName.toUpperCase());
//             }
//         }
//     };

//     // 🔍 3. BRANCH AUTOCOMPLETE ENGINE
//     const handleBranchSearch = (e) => {
//         const value = e.target.value;
//         setBranchSearchQuery(value);

//         if (value.trim().length > 0) {
//             const matches = availableOffices.filter(office => {
//                 const officeNameStr = (office.OfficeName || '').toLowerCase();
//                 const officeCodeStr = (office.OfficeCode || '').toLowerCase();
//                 return officeNameStr.includes(value.toLowerCase()) || officeCodeStr.includes(value.toLowerCase());
//             });
//             setFilteredBranches(matches);
//             setShowBranchDropdown(true);
//         } else {
//             setShowBranchDropdown(false);
//         }
//     };

//     const selectBranch = (office) => {
//         setSelectedOfficeId(office.OfficeID);
//         setBranchSearchQuery(office.OfficeName.toUpperCase());
//         setShowBranchDropdown(false);
//     };

//     // 🎯 4. NEW: TRACK CHANGED PRODUCT MODEL TO RECORD MAX AVAILABLE STOCKS
//     const handleItemModelChange = (e) => {
//         const selectedModelName = e.target.value;
//         setItemName(selectedModelName);
//         setQty(''); // Clear typed quantity to prevent stale errors
//         setStockValidationError('');

//         const selectedProductObj = activeInStockItems.find(item => item.ItemName === selectedModelName);
//         if (selectedProductObj) {
//             const maxAvailable = selectedProductObj.Quantity !== undefined ? selectedProductObj.Quantity : selectedProductObj.qty;
//             setSelectedItemMaxStock(parseInt(maxAvailable));
//         } else {
//             setSelectedItemMaxStock(null);
//         }
//     };

//     // 🎯 5. NEW: QUANTITY IN-LINE LIMIT GUARD CHECK ENGINE
//     const handleQuantityInputChange = (e) => {
//         const inputVal = e.target.value;
//         setQty(inputVal);

//         if (!inputVal) {
//             setStockValidationError('');
//             return;
//         }

//         const requestedQty = parseInt(inputVal);

//         if (selectedItemMaxStock !== null && requestedQty > selectedItemMaxStock) {
//             setStockValidationError(`Can't assign item. Total stock available: ${selectedItemMaxStock}. Requested quantity is greater.`);
//         } else {
//             setStockValidationError('');
//         }
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
        
//         // Prevent submissions if inline validation fails
//         if (stockValidationError) return;

//         if (!empId || !selectedOfficeId || !itemName || !qty) {
//             setErrorMsg('Validation Error: Please select valid credentials from both the Employee and Branch drop-down autocomplete filters.');
//             return;
//         }

//         try {
//             setIsSubmitting(true);
//             setErrorMsg('');
            
//             const payload = { 
//                 issueType: 'employee', 
//                 itemName, 
//                 qty: parseInt(qty), 
//                 FromOfficeID: 1, 
//                 ToOfficeID: parseInt(selectedOfficeId), 
//                 empId, 
//                 empName 
//             };

//             const res = await axios.post('http://localhost:5001/api/inventry/issue', payload, { withCredentials: true });
//             if (res.data.success) {
//                 onActionSuccess();
//                 onClose();
//             }
//         } catch (err) {
//             setErrorMsg(err.response?.data?.message || 'Issuance transaction failure.');
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     return (
//         <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-semibold text-xs text-gray-600 text-left">
//             <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150 p-5 space-y-4">
//                 <div className="flex items-center justify-between pb-2 border-b border-gray-100">
//                     <h3 className="text-sm font-black text-gray-900 uppercase flex items-center gap-1.5">
//                         <User size={14} className="text-blue-600" /> Release Asset Allocation To Staff
//                     </h3>
//                     <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"><X size={16} /></button>
//                 </div>

//                 {errorMsg && <div className="p-3 bg-red-50 border border-red-200 text-red-600 font-bold rounded-xl shadow-sm">{errorMsg}</div>}

//                 <form onSubmit={handleSubmit} className="space-y-4">
                    
//                     {/* INPUT 1: SEARCH EMPLOYEE AUTOCOMPLETE */}
//                     <div className="space-y-1.5 relative">
//                         <label className="text-gray-500 text-[10px] uppercase block ml-0.5 font-bold">Search Target Employee *</label>
//                         <div className="relative">
//                             <input type="text" value={empSearchQuery} onChange={handleEmployeeSearch} placeholder="Type name or unique ID (e.g. Sakshi)..." className="w-full h-10 pl-9 pr-3 bg-white border border-gray-300 text-gray-900 font-bold rounded-lg text-xs outline-none focus:border-blue-500 transition-colors shadow-sm" required />
//                             <Search size={14} className="absolute left-3 top-3 text-gray-400" />
//                         </div>
//                         {showEmpDropdown && filteredEmployees.length > 0 && (
//                             <div className="absolute w-full bg-white border border-gray-200 mt-1 rounded-xl shadow-xl max-h-40 overflow-y-auto z-50 divide-y divide-gray-100">
//                                 {filteredEmployees.map((emp, idx) => {
//                                     const nameVal = emp.name || emp.Name;
//                                     const idVal = emp.EmpId || emp.EmpID || emp.id;
//                                     const codeVal = emp.OfficeCode || emp.Officecode || 'N/A';
//                                     return (
//                                         <div key={idx} onClick={() => selectEmployee(emp)} className="p-2.5 hover:bg-blue-50 cursor-pointer transition-colors text-left">
//                                             <p className="font-extrabold text-gray-900 uppercase">{nameVal}</p>
//                                             <p className="text-[9px] text-gray-400 mt-0.5 font-mono">ID: #{idVal} | Branch Code: {codeVal}</p>
//                                         </div>
//                                     );
//                                 })}
//                             </div>
//                         )}
//                     </div>

//                     {/* INPUT 2: SEARCH OFFICE BRANCH AUTOCOMPLETE */}
//                     <div className="space-y-1.5 relative">
//                         <label className="text-gray-500 text-[10px] uppercase block ml-0.5 font-bold">Staff Home Office Branch Location *</label>
//                         <div className="relative">
//                             <input type="text" value={branchSearchQuery} onChange={handleBranchSearch} placeholder="Type first letter of branch name (e.g. O)..." className="w-full h-10 pl-9 pr-3 bg-white border border-gray-300 text-gray-900 font-bold rounded-lg text-xs outline-none focus:border-blue-500 transition-colors shadow-sm" required />
//                             <Building size={14} className="absolute left-3 top-3 text-gray-400" />
//                         </div>
//                         {showBranchDropdown && filteredBranches.length > 0 && (
//                             <div className="absolute w-full bg-white border border-gray-200 mt-1 rounded-xl shadow-xl max-h-40 overflow-y-auto z-50 divide-y divide-gray-100">
//                                 {filteredBranches.map((office) => (
//                                     <div key={office.OfficeID} onClick={() => selectBranch(office)} className="p-2.5 hover:bg-blue-50 cursor-pointer transition-colors text-left">
//                                         <p className="font-extrabold text-gray-900 uppercase">{office.OfficeName}</p>
//                                         {office.OfficeCode && <p className="text-[9px] text-gray-400 mt-0.5 font-mono">Code: {office.OfficeCode.toUpperCase()}</p>}
//                                     </div>
//                                 ))}
//                             </div>
//                         )}
//                     </div>

//                     {/* INPUT 3: SPECIFICATION SELECTION (Filtering out stock level === 0) */}
//                     <div className="space-y-1.5">
//                         <label className="text-gray-500 text-[10px] uppercase block ml-0.5 font-bold">Product Specification Model *</label>
//                         <select value={itemName} onChange={handleItemModelChange} className="w-full h-10 px-3 bg-white border border-gray-300 text-gray-900 font-bold rounded-lg text-xs outline-none shadow-sm" required>
//                             <option value="">-- Choose Item Model From Database Directory --</option>
//                             {activeInStockItems.map(item => (
//                                 <option key={item.ItemId} value={item.ItemName}>
//                                     {item.ItemName.toUpperCase()} ({item.Quantity !== undefined ? item.Quantity : item.qty} Left)
//                                 </option>
//                             ))}
//                         </select>
//                     </div>

//                     {/* INPUT 4: QUANTITY UNIT COUNT */}
//                     <div className="space-y-1.5">
//                         <label className="text-gray-500 text-[10px] uppercase block ml-0.5 font-bold">Quantity Unit Count *</label>
//                         <input type="number" min="1" placeholder={selectedItemMaxStock ? `Max available: ${selectedItemMaxStock}` : "e.g. 1"} value={qty} onChange={handleQuantityInputChange} className="w-full h-10 px-3 bg-white border border-gray-300 text-gray-900 font-bold rounded-lg text-sm outline-none shadow-sm" disabled={!itemName} required />
                        
//                         {/* 🎯 LIVE ERROR BOUNDS BANNER MESSAGE */}
//                         {stockValidationError && (
//                             <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 text-amber-700 font-bold rounded-lg text-[10px] flex items-center gap-1.5 animate-in slide-in-from-top-1 duration-150">
//                                 <AlertTriangle size={12} />
//                                 <span>{stockValidationError}</span>
//                             </div>
//                         )}
//                     </div>

//                     <button type="submit" disabled={isSubmitting || !!stockValidationError} className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 uppercase text-[10px] tracking-wider transition-colors disabled:opacity-40 mt-2 shadow-sm">
//                         {isSubmitting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send size={12} />} Finalize Personnel Release Assignment
//                     </button>
//                 </form>
//             </div>
//         </div>
//     );
// };



// export default IssueEmployeeModal;



import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Search, Send, RefreshCw, User, Building, AlertTriangle } from 'lucide-react';

const IssueEmployeeModal = ({ 
    isOpen, 
    onClose, 
    availableItems = [], 
    availableOffices = [], 
    employeeRegistry = [], 
    onActionSuccess
}) => {
    const [itemName, setItemName] = useState('');
    const [qty, setQty] = useState('');
    const [empId, setEmpId] = useState('');
    const [empName, setEmpName] = useState('');
    
    const [selectedOfficeId, setSelectedOfficeId] = useState('');
    const [branchSearchQuery, setBranchSearchQuery] = useState('');
    const [filteredBranches, setFilteredBranches] = useState([]);
    const [showBranchDropdown, setShowBranchDropdown] = useState(false);

    const [isSearchingEmployees, setIsSearchingEmployees] = useState(false);

    const [empSearchQuery, setEmpSearchQuery] = useState('');
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [showEmpDropdown, setShowEmpDropdown] = useState(false);

    // 🎯 Live Inventory Balance States
    const [localBranchStock, setLocalBranchStock] = useState([]);
    const [selectedItemMaxStock, setSelectedItemMaxStock] = useState(null);
    const [stockValidationError, setStockValidationError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingStock, setIsLoadingStock] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // ====================================================================
    // 🎯 EFFECTS: Fetch Active Office Stock Level Matrices Natively
    // ====================================================================
    useEffect(() => {
        if (isOpen) {
            const fetchCurrentInventoryPool = async () => {
                try {
                    setIsLoadingStock(true);
                    // 📡 Hits your new backend router path parameter to pull real rows
                    const res = await axios.get('http://localhost:5001/api/inventry/branch-stock/1', { withCredentials: true });
                    if (res.data.success) {
                        setLocalBranchStock(res.data.data || []);
                    }
                } catch (err) {
                    console.error("Failed to load live stock balances for validation:", err);
                } finally {
                    setIsLoadingStock(false);
                }
            };
            fetchCurrentInventoryPool();
        }
    }, [isOpen]);

    // ====================================================================
    // 🎯 ENGINE: Join General Catalogs to Active stockmaster Tables
    // ====================================================================
    const activeInStockItems = availableItems.map(catalogItem => {

        const targetCatalogName = String(catalogItem.ItemName || catalogItem.name || '').toLowerCase().trim();
        // const matchingStockRecord = localBranchStock.find(stock => 
        //     String(stock.item || '').toLowerCase().trim() === String(catalogItem.ItemName || '').toLowerCase().trim()

        const matchingStockRecord = Array.isArray(localBranchStock) && localBranchStock.find(stock => {
            const currentStockName = String(stock.item || stock.itemName || '').toLowerCase().trim();
            return currentStockName === targetCatalogName;
    
       }
        );

        let currentQuantity = 0;
        if (matchingStockRecord) {
            currentQuantity = parseInt(matchingStockRecord.Quantity || matchingStockRecord.quantity || 0);
        } else {
            currentQuantity = parseInt(catalogItem.TotalGlobalStock || 0);
        }
        
        return {
            // ...catalogItem,

            ...catalogItem,
            resolvedName: catalogItem.ItemName || catalogItem.name || 'Unknown Model',
            currentQuantity: currentQuantity
            // currentQuantity: matchingStockRecord ? parseInt(matchingStockRecord.Quantity || 0) : 0
        };
    }).filter(item => item.currentQuantity > 0); // 🚀 DYNAMIC: Only items with items > 0 appear!

    // ====================================================================
    // 🎯 RESOLUTION: Map Coded Strings back to System Office Names
    // ====================================================================
    const selectEmployee = (emp) => {
        // const resolvedId = emp.EmpId || emp.EmpID || emp.id;
        // const resolvedName = emp.name || emp.Name;
         const resolvedId = emp.employee_id;
        const resolvedName = emp.employee_name;
        const resolvedBranchName = emp.branch_name;
        // const resolvedOfficeCode = emp.OfficeCode || emp.Officecode || emp.branch;
        // console.log(emp.branch);

        setEmpId(resolvedId);
        setEmpName(resolvedName);
        setEmpSearchQuery(`${resolvedName} (#${resolvedId})`);
        setShowEmpDropdown(false);

        // if (resolvedOfficeCode) {
        //     // Scan through registration sheets to locate human-readable titles matching the token
        //     const matchedOffice = availableOffices.find(o => 
        //         String(o.OfficeCode || '').toLowerCase().trim() === String(resolvedOfficeCode).toLowerCase().trim() ||
        //         String(o.OfficeName || '').toLowerCase().includes(String(resolvedOfficeCode).toLowerCase().trim())
        //     );

        //     if (matchedOffice) {
        //         setSelectedOfficeId(matchedOffice.OfficeID);
        //         setBranchSearchQuery(matchedOffice.OfficeName.toUpperCase());
        //     } else {
        //         setBranchSearchQuery(`BRANCH CODE: ${String(resolvedOfficeCode).toUpperCase()}`);
        //     }
        // } else {
        //     setBranchSearchQuery("HEADQUARTERS (HQ)");
        //     setSelectedOfficeId(1);
        // }


          if (emp.office_id) {
            setSelectedOfficeId(emp.office_id);
        }
        setBranchSearchQuery(resolvedBranchName.toUpperCase());


    };

    const handleEmployeeSearch = async (e) => {
        const value = e.target.value;
        setEmpSearchQuery(value);
        if (value.trim().length > 0) {
            // const matches = employeeRegistry.filter(emp => {
            //     const nameStr = (emp.name || emp.Name || '').toLowerCase();
            //     const idStr = (emp.EmpId || emp.EmpID || emp.id || '').toLowerCase();
            //     return nameStr.includes(value.toLowerCase()) || idStr.includes(value.toLowerCase());
            // });
            //  if (matches.length > 0) 
                
                // console.log("🔍 Live Employee Row Sample Data Object:", matches[0]);    
        //     setFilteredEmployees(matches);
        //     setShowEmpDropdown(true);
        // } else {
        //     setShowEmpDropdown(false);
        // }



        try {
                setIsSearchingEmployees(true);
                // 📡 Hits your newly registered safe search backend endpoint layout
                const res = await axios.get(`http://localhost:5001/api/auth/search?query=${value}`, { withCredentials: true });
                if (res.data.success) {
                    setFilteredEmployees(res.data.data || []);
                    setShowEmpDropdown(true);
                }
            } catch (err) {
                console.error("Error executing live employee endpoint database search query:", err);
            } finally {
                setIsSearchingEmployees(false);
            }
        } else {
            setFilteredEmployees([]);
            setShowEmpDropdown(false);
        }

    };

    const handleBranchSearch = (e) => {
        const value = e.target.value;
        setBranchSearchQuery(value);
        if (value.trim().length > 0) {
            const matches = availableOffices.filter(office => {
                const nameStr = (office.OfficeName || '').toLowerCase();
                const codeStr = (office.OfficeCode || '').toLowerCase();
                return nameStr.includes(value.toLowerCase()) || codeStr.includes(value.toLowerCase());
            });
            setFilteredBranches(matches);
            setShowBranchDropdown(true);
        } else {
            setShowBranchDropdown(false);
        }
    };

    

    const selectBranch = (office) => {
        setSelectedOfficeId(office.OfficeID);
        setBranchSearchQuery(office.OfficeName.toUpperCase());
        setShowBranchDropdown(false);
    };

    const handleItemModelChange = (e) => {
        const selectedModelName = e.target.value;
        setItemName(selectedModelName);
        setQty(''); 
        setStockValidationError('');

        // 🎯 FIX: Matches against activeInStockItems array variables
        // const productObj = activeInStockItems.find(item => item.ItemName === selectedModelName);
        // setSelectedItemMaxStock(productObj ? productObj.currentQuantity : null);

         const productObj = activeInStockItems.find(item => item.resolvedName === selectedModelName);
        setSelectedItemMaxStock(productObj ? productObj.currentQuantity : null);
    };


    const handleQuantityInputChange = (e) => {
        const inputVal = e.target.value;
        setQty(inputVal);
        if (!inputVal) {
            setStockValidationError('');
            return;
        }
        if (selectedItemMaxStock !== null && parseInt(inputVal) > selectedItemMaxStock) {
            setStockValidationError(`Requested quantity exceeds available branch balance (${selectedItemMaxStock} left).`);
        } else {
            setStockValidationError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (stockValidationError || !empId || !selectedOfficeId || !itemName || !qty) return;

        try {
            setIsSubmitting(true);
            setErrorMsg('');
            
            const payload = { 
                issueType: 'employee', 
                itemName, 
                qty: parseInt(qty), 
                FromOfficeID: 1, 
                ToOfficeID: parseInt(selectedOfficeId), 
                empId, 
                empName 
            };

            const res = await axios.post('http://localhost:5001/api/inventry/issue', payload, { withCredentials: true });
            if (res.data.success) {
                onActionSuccess();
                onClose();
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Transaction submission failure.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-semibold text-xs text-gray-600 text-left">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100 p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <h3 className="text-sm font-black text-gray-900 uppercase flex items-center gap-1.5">
                        <User size={14} className="text-blue-600" /> Release Asset Allocation To Staff
                    </h3>
                    <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"><X size={16} /></button>
                </div>

                {errorMsg && <div className="p-3 bg-red-50 border border-red-200 text-red-600 font-bold rounded-xl">{errorMsg}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* SEARCH TARGET EMPLOYEE INPUT */}
                    <div className="space-y-1.5 relative">
                        <label className="text-gray-500 text-[10px] uppercase block font-bold">Search Target Employee *</label>
                        <div className="relative">
                            <input type="text" value={empSearchQuery} onChange={handleEmployeeSearch} placeholder="Type name or unique ID..." className="w-full h-10 pl-9 pr-3 bg-white border border-gray-300 text-gray-900 font-bold rounded-lg text-xs outline-none focus:border-blue-500 shadow-sm" required />
                            <Search size={14} className="absolute left-3 top-3 text-gray-400" />
                        </div>
                        {showEmpDropdown && filteredEmployees.length > 0 && (
                            // <div className="absolute w-full bg-white border border-gray-200 mt-1 rounded-xl shadow-xl max-h-40 overflow-y-auto z-50 divide-y divide-gray-100">
                                  
                               <div 
                                    className="absolute w-full bg-white border border-gray-200 mt-1 rounded-xl shadow-xl z-50 divide-y divide-gray-100"
                                     style={{ maxHeight: '200px', overflowY: 'auto' }}
                                >

                                    {/* // 🎯 Resolves the dropdown item list to use human-readable titles instead of plain codes
                                    // const codeToken = emp.OfficeCode || emp.Officecode || emp.branch || 'N/A'; */}
                       
                                   {filteredEmployees.map((emp, idx) => (
                                      <div key={idx} onClick={() => selectEmployee(emp)} className="p-2.5 hover:bg-blue-50 cursor-pointer text-left transition-colors">
                                        <p className="font-extrabold text-gray-900 uppercase">{emp.employee_name}</p>
                                        <p className="text-[9px] text-gray-400 mt-0.5 font-mono">
                                            ID: #{emp.employee_id} | Branch: {emp.branch_name.toUpperCase()}
                                        </p> 
                                      </div>
                                     ))}
                               
                                </div>
                           )}
                    </div>

                    {/* DYNAMIC OFFICE BRANCH TEXT INPUT */}
                    <div className="space-y-1.5 relative">
                        <label className="text-gray-500 text-[10px] uppercase block font-bold">Staff Home Office Branch Location *</label>
                        <div className="relative">
                            <input type="text" value={branchSearchQuery} onChange={handleBranchSearch} placeholder="Type branch name or code..." className="w-full h-10 pl-9 pr-3 bg-white border border-gray-300 text-gray-900 font-bold rounded-lg text-xs outline-none focus:border-blue-500 shadow-sm" required />
                            <Building size={14} className="absolute left-3 top-3 text-gray-400" />
                        </div>
                        {showBranchDropdown && filteredBranches.length > 0 && (
                            <div className="absolute w-full bg-white border border-gray-200 mt-1 rounded-xl shadow-xl max-h-40 overflow-y-auto z-50 divide-y divide-gray-100">
                                {filteredBranches.map((office) => (
                                    <div key={office.OfficeID} onClick={() => selectBranch(office)} className="p-2.5 hover:bg-blue-50 cursor-pointer text-left">
                                        <p className="font-extrabold text-gray-900 uppercase">{office.OfficeName}</p>
                                        {office.OfficeCode && <p className="text-[9px] text-gray-400 mt-0.5 font-mono">Code: {office.OfficeCode.toUpperCase()}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* PRODUCT CATALOG SELECTION DROPDOWN */}
                    <div className="space-y-1.5">
                        <label className="text-gray-500 text-[10px] uppercase block font-bold">
                            Product Specification Model {isLoadingStock && '(Syncing Live Stock...)'} *
                        </label>
                        <select value={itemName} onChange={handleItemModelChange} className="w-full h-10 px-3 bg-white border border-gray-300 text-gray-900 font-bold rounded-lg text-xs outline-none shadow-sm" disabled={isLoadingStock} required>
                            <option value="">-- Choose Item Model From Database Directory --</option>
                            {activeInStockItems.map(item => (
                                <option key={item.ItemId || item.id} value={item.resolvedName}>
                                    {/* {item.ItemName.toUpperCase()} ({item.currentQuantity} Available) */}

                                  {item.resolvedName.toUpperCase()} ({item.currentQuantity} Available)  
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* QUANTITY INPUT */}
                    <div className="space-y-1.5">
                        <label className="text-gray-500 text-[10px] uppercase block font-bold">Quantity Unit Count *</label>
                        <input type="number" min="1" placeholder={selectedItemMaxStock ? `Max allowed: ${selectedItemMaxStock}` : "e.g. 1"} value={qty} onChange={handleQuantityInputChange} className="w-full h-10 px-3 bg-white border border-gray-300 text-gray-900 font-bold rounded-lg text-sm outline-none" disabled={!itemName} required />
                        {stockValidationError && (
                            <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 text-amber-700 font-bold rounded-lg text-[10px] flex items-center gap-1.5">
                                <AlertTriangle size={12} />
                                <span>{stockValidationError}</span>
                            </div>
                        )}
                    </div>

                    <button type="submit" disabled={isSubmitting || !!stockValidationError || isLoadingStock} className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 uppercase text-[10px] tracking-wider disabled:opacity-40 shadow-sm mt-2">
                        {isSubmitting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send size={12} />} Finalize Personnel Release Assignment
                    </button>
                </form>
            </div>
        </div>
    );
};

export default IssueEmployeeModal;








//  {filteredEmployees.map((emp, idx) => {
//                                     // const matchedName = availableOffices.find(o => String(o.OfficeCode).toLowerCase().trim() === String(codeToken).toLowerCase().trim())?.OfficeName || codeToken;
//                                      const codeToken = emp.OfficeCode || emp.officeCode || emp.Officecode || emp.branch || emp.office || emp.OfficeID || emp.officeId;
//                                      const matchedOfficeName = availableOffices.find(o => 
//                                         (codeToken && String(o.OfficeCode).toLowerCase().trim() === String(codeToken).toLowerCase().trim()) ||
//                                         (codeToken && String(o.OfficeID).trim() === String(codeToken).trim())
//                                     )?.OfficeName || codeToken || 'Unknown Branch';

//                                     return (
//                                         <div key={idx} onClick={() => selectEmployee(emp)} className="p-2.5 hover:bg-blue-50 cursor-pointer text-left">
//                                             <p className="font-extrabold text-gray-900 uppercase">{emp.name || emp.Name}</p>
//                                             <p className="text-[9px] text-gray-400 mt-0.5 font-mono">
//                                                  {/* ID: #{emp.EmpId || emp.EmpID} | Branch: {matchedName.toUpperCase()} */}

//                                                  ID: #{emp.EmpId || emp.EmpID || emp.id} | Branch: {matchedOfficeName.toUpperCase()}
//                                                 </p> 
//                                         </div>
//                                     );
//                                    }
//                                 )}


