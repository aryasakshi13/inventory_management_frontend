

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Search, Send, RefreshCw, User, Building, AlertTriangle } from 'lucide-react';

const IssueEmployeeModal = ({
    isOpen,
    onClose,
    availableOffices = [],
    employeeRegistry = [],
    onActionSuccess
}) => {
    const [itemName, setItemName] = useState('');
    const [qty, setQty] = useState('');
    const [empId, setEmpId] = useState('');
    const [empName, setEmpName] = useState('');
    const [user, setUser] = useState(null);
    const [availableItems, setAvailableItems] = useState([]);

    const [selectedOfficeId, setSelectedOfficeId] = useState('');
    const [branchSearchQuery, setBranchSearchQuery] = useState('');
    const [filteredBranches, setFilteredBranches] = useState([]);
    const [showBranchDropdown, setShowBranchDropdown] = useState(false);

    const [isSearchingEmployees, setIsSearchingEmployees] = useState(false);

    const [empSearchQuery, setEmpSearchQuery] = useState('');
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [showEmpDropdown, setShowEmpDropdown] = useState(false);

    const getOfficeId = (office) => office?.OfficeID || office?.ID || office?.id || '';
    const getOfficeName = (office) => String(office?.OfficeName || office?.officeName || office?.name || '').trim();
    const getOfficeCode = (office) => String(office?.OfficeCode || office?.officeCode || '').trim();
    const getEmployeeBranchName = (emp) => String(emp?.branch_name || emp?.branchName || emp?.BranchName || emp?.office_name || '').trim();

    // 🎯 Live Inventory Balance States
    const [localBranchStock, setLocalBranchStock] = useState([]);
    const [selectedItemMaxStock, setSelectedItemMaxStock] = useState(null);
    const [stockValidationError, setStockValidationError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingStock, setIsLoadingStock] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');


    useEffect(() => {
        const loggedUser = JSON.parse(localStorage.getItem("user"));

        console.log("Logged User:", loggedUser);

        setUser(loggedUser);
    }, []);



    const fetchItem = async () => {
        try {
            const response = await axios.get(
                // "http://localhost:5001/api/items",
                 "https://inventory-manage-q4yr.onrender.com/api/items",
                {
                    params: {
                        officeId: user?.officeId
                    },
                    withCredentials: true
                }
            );
              setAvailableItems(response.data.data || []);
            // console.log("response of item api",response.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (user?.officeId) {
            fetchItem();
        }
    }, [user]);

    // ====================================================================
    // 🎯 EFFECTS: Fetch Active Office Stock Level Matrices Natively
    // ====================================================================
    useEffect(() => {
        if (isOpen) {
            const fetchCurrentInventoryPool = async () => {
                try {
                    setIsLoadingStock(true);
                    // 📡 Hits your new backend router path parameter to pull real rows
                    const res = await axios.get('https://inventory-manage-q4yr.onrender.com/api/inventry/branch-stock/1', { withCredentials: true });
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
        console.log("Selected Employee:", emp);
        console.log("Available Offices:", availableOffices);

        const resolvedId = emp.employee_id || emp.id || emp.EmpId || emp.empId || '';
        const resolvedName = emp.employee_name || emp.employeeName || emp.name || '';
        const resolvedBranchName = getEmployeeBranchName(emp);

        setEmpId(resolvedId);
        setEmpName(resolvedName);

        setEmpSearchQuery(`${resolvedName} (#${resolvedId})`);
        setShowEmpDropdown(false);

        const matchedOffice = availableOffices.find((office) => {
            const officeName = getOfficeName(office).toLowerCase();
            const officeCode = getOfficeCode(office).toLowerCase();
            const branchName = String(resolvedBranchName).toLowerCase();

            return officeName === branchName || officeCode === branchName;
        });

        if (matchedOffice) {
            setSelectedOfficeId(getOfficeId(matchedOffice));
            setBranchSearchQuery(getOfficeName(matchedOffice));
        } else {
            setSelectedOfficeId("");
            setBranchSearchQuery(resolvedBranchName || "");
        }

        console.log("Resolved Office:", matchedOffice);
    };

    const handleEmployeeSearch = async (e) => {
        const value = e.target.value;
        setEmpSearchQuery(value);
        if (value.trim().length > 0) {
            try {
                setIsSearchingEmployees(true);


                // 📡 Hits your newly registered safe search backend endpoint layout
                // const res = await axios.get(`https://inventory-manage-q4yr.onrender.com/api/auth/search?query=${value}`, { withCredentials: true });

                 const token = localStorage.getItem('authToken');  
                // const res = await axios.get(`http://localhost:5001/api/auth/search?query=${value}`, {
                const res = await axios.get(`https://inventory-manage-q4yr.onrender.com/api/auth/search?query=${value}`, {
                    
                     headers: {
                        Authorization: `Bearer ${token}`,
                    },

                    withCredentials: true
                      
                });

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


    console.log("localStorage:", localStorage);
    console.log("User:", localStorage.getItem("user"));
    console.log("Token:", localStorage.getItem("token"));

    const handleBranchSearch = (e) => {
        const value = e.target.value;
        setBranchSearchQuery(value);
        if (value.trim().length > 0) {
            const matches = availableOffices.filter(office => {
                const nameStr = getOfficeName(office).toLowerCase();
                const codeStr = getOfficeCode(office).toLowerCase();
                return nameStr.includes(value.toLowerCase()) || codeStr.includes(value.toLowerCase());
            });
            setFilteredBranches(matches);
            setShowBranchDropdown(true);
        } else {
            setShowBranchDropdown(false);
        }
    };



    const selectBranch = (office) => {
        setSelectedOfficeId(getOfficeId(office));
        setBranchSearchQuery(getOfficeName(office));
        setShowBranchDropdown(false);

        console.log("Office Selected:", getOfficeId(office));
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
        console.log("🔗 Form Submission Attempt:", { empId, selectedOfficeId, itemName, qty, stockValidationError });

        if (!empId) {
            setErrorMsg("Please select an employee.");
            return;
        }

        if (!selectedOfficeId) {
            setErrorMsg("Please select a branch.");
            return;
        }

        if (!itemName) {
            setErrorMsg("Please select an item.");
            return;
        }

        if (!qty) {
            setErrorMsg("Please enter quantity.");
            return;
        }

        if (stockValidationError) {
            return;
        }

        try {
            setIsSubmitting(true);
            setErrorMsg('');

            const payload = {
                issueType: 'employee',
                itemName,
                qty: parseInt(qty),
                // FromOfficeID: 1,
                FromOfficeID: user?.officeId,
                ToOfficeID: parseInt(selectedOfficeId),
                empId,
                empName
            };


            console.log("🔗 Payload for Issuance Transaction:", payload);

            const token = localStorage.getItem('authToken');
            const baseUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:5001'
                : 'https://inventory-manage-q4yr.onrender.com';


            const res = await axios.post(`${baseUrl}/api/inventry/issue`, payload, {

                headers: {
                    'Authorization': `Bearer ${token}`
                },
                withCredentials: true
            });
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
    //  console.log("all Data", response.data);

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
                                        <p className="font-extrabold text-gray-900 uppercase">{emp.employee_name || emp.name || 'Unknown'}</p>
                                        <p className="text-[9px] text-gray-400 mt-0.5 font-mono">
                                            ID: #{emp.employee_id || emp.id || emp.EmpId || 'N/A'} | Branch: {getEmployeeBranchName(emp).toUpperCase()}
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
                            {activeInStockItems.map(item =>
                            (
                                <option key={item.ItemId || item.id} value={item.resolvedName}>
                                    {item.resolvedName.toUpperCase()} ({item.currentQuantity} Available)
                                </option>
                            )


                            )}
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

