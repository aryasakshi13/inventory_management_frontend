// 📄 File Path: src/pages/admin/modules/InventoryItems.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InventoryTable from "../../components/inventory/InventoryTable";
import UpdateStockModel from '../../components/inventory/UpdateStockModel';
import ViewStockModal from '../../components/inventory/ViewStockModel';
import AddStockModel from '../../components/inventory/AddStockModel';

const InventoryItems = ({ user, userRole}) => {
    const [stockList, setStockList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [inventoryTab, setInventoryTab] = useState('purchased');

    const [groupedStockList, setGroupedStockList] = useState([]);
    
    // console.log("Group stock list",groupedStockList);
    

      // 🔢 PAGINATION STATE CONTROLLERS
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [rowsPerPage] = useState(30);
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

     const [isViewModalOpen, setIsViewModalOpen] = useState(false);
     const [viewingItem, setViewingItem] = useState(null);

    // 🔒 DEFENSIVE CONTEXT PARSING: 
    // Safely reads your exact database object property casings out of localStorage
    const userBranchId = user?.OfficeID || user?.officeId || user?.OfficeId || 1;
    const userBranchCode = user?.OfficeCode || user?.officeCode || 'HQ';

    //  const handleViewItem = (itemRow) => {
    //     setViewingItem(itemRow);
    //     setIsViewModalOpen(true);
    // };

//     const groupInventoryByPO = (rawData) => {
//        const groups = {};

//         rawData.forEach(row => {

//           const rawPo = row.purchase_no ? String(row.purchase_no).trim() : '';
//         const isBlankPO = rawPo === '' || rawPo === '—' || rawPo === '-';
        
//         // 🎯 BULLETPROOF DETECTOR: It's a transfer if source_type says so, 
//         // OR if the PO number explicitly starts with "TRANSFER_"
//         // const isTransfer = row.source_type === 'transfer' || rawPo.toUpperCase().startsWith('TRANSFER_');
         
//         const isTransfer = String(row.source_type).toLowerCase() === 'transfer' || 
//                            rawPo.toUpperCase().startsWith('TRANSFER');


//         const groupingKey = isTransfer 
//             ? `TRANSIT-ROW-REF-${row.id}`  // If it's a transfer, keep it isolated by its row ID
//             : isBlankPO 
//                 ? `DIRECT-BATCH-ID-${row.id}` // If it's a purchase but has no PO, keep it separate by its row ID
//                 : rawPo;

//         if (!groups[groupingKey]) {
//             groups[groupingKey] = {
//                 ...row,

//                 source_type: isTransfer ? 'transfer' : 'purchase',
//                 allItems: [], 
//                 totalQuantity: 0
//             };
//         }
        
//         groups[groupingKey].allItems.push({
//             id: row.id,
//             itemName: row.item,
//             category: row.Category,
//             quantity: parseInt(row.Quantity) || 0,
//             unitCost: row.unit_cost,
//              purchase_no: row.purchase_no, // 🎯 PRESERVE CHILD PERMISSIONS
//              source_type: row.source_type 
//         });
        
//         groups[groupingKey].totalQuantity += parseInt(row.Quantity) || 0;

//         });

//         return Object.values(groups);
// };


const groupInventoryByPO = (rawData) => {
  const groups = {};

  rawData.forEach((row) => {
    const purchaseNo = String(row.purchase_no || "").trim();

    // If purchase_no is empty, keep this row separate
    const key = purchaseNo ? purchaseNo : `ROW-${row.id}`;

    if (!groups[key]) {
      groups[key] = {
        ...row,
        allItems: [],
        totalQuantity: 0,
      };
    }

    groups[key].allItems.push({
      id: row.id,
      itemName: row.item,
      category: row.Category,
      quantity: Number(row.Quantity) || 0,
      unitCost: row.unit_cost,
      purchase_no: row.purchase_no,
      source_type: row.source_type,
    });

    groups[key].totalQuantity += Number(row.Quantity) || 0;
  });

  return Object.values(groups);
};

// 🟢 HOW TO USE IT IN YOUR FETCH EFFECT:
// const aggregatedData = groupInventoryByPO(response.data.data);
// setInventoryData(aggregatedData);      



    const syncInventoryWithBackend = async () => {
        try {
            setIsLoading(true);

             const token = localStorage.getItem('authToken');
            //  console.log( "Token is >>>", token);

             if (!token) {
                console.warn("⚠️ Auth Token storage mein nahi mila! Pehle Login kijiye.");
                setIsLoading(false);
                return; 
            }
            
            // Fires GET request using role-based query headers matching your backend guards
            // const response = await axios.get(`https://inventory-manage-q4yr.onrender.com/api/inventry?page=1&limit=50`, {

                const baseUrl = window.location.hostname === 'localhost' 
                ? 'http://localhost:5001' 
                : 'https://inventory-manage-q4yr.onrender.com';

            //  const response = await axios.get(`http://localhost:5001/api/inventry?page=1&limit=50`, {
                 const response = await axios.get(`${baseUrl}/api/inventry?page=1&limit=50`, {

                headers: {
                    'Authorization': `Bearer ${token}` 
                },
                  withCredentials: true
            });

             
             console.log("Stock data",response.data);
            
            if (response.data.success) {
                const rawRows = response.data.data || [];
                // setStockList(response.data.data || []);
                 setStockList(rawRows);


                 const processedBatches = groupInventoryByPO(rawRows);


                   console.log("🔥 FRONTEND RECEIVED GROUPS:", processedBatches);
                    setGroupedStockList(processedBatches);
                    
                    setTotalPages(Math.ceil(processedBatches.length / rowsPerPage) || 1);
            }
        } catch (error) {
            console.error("Data syncing failed:", error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        syncInventoryWithBackend();
    }, [currentPage, userRole, userBranchId]);
    
    const getVisiblePageNumbers = () => {
        const pages = [];
        const maxVisible = 5; 
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            if (i >= 1) pages.push(i);
        }
        return pages;
    };


    const isSuperAdmin = userRole === 'admin';

     const handleViewItem = (itemRow) => {
        // console.log("Viewing full row properties:", itemRow);
        setViewingItem(itemRow);
        setIsViewModalOpen(true);

    };

    const handleAddStockTrigger = (itemRow) => {
        // console.log("Preparing pop-up layout initialization for Item:", itemRow.item);
        // This is ready for your Add Stock popup toggle state trigger later
          setSelectedItem(itemRow);      
         setIsEditModalOpen(true);

    };

    const handleAdjustStockTrigger = (itemRow) => {
        setSelectedItem(itemRow);      // Save selected row data
        setIsEditModalOpen(true);      // Open edit popup modal
    };

    return (
        // <div className="bg-[#0B0F19] w-full min-h-screen p-6">
         <div className="bg-gray-50 w-full min-h-screen p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div>

                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                        {isSuperAdmin 
                            ? "Global Inventory Items Directory" 
                            : `Branch Inventory Ledger (${userBranchCode})`
                        }
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        {isSuperAdmin 
                            ? "Super Admin Access: Reviewing master logs across all active warehouse hubs."
                            : `Authorized access tier showing asset rows assigned specifically to Office ID: ${userBranchId}.`
                        }
                    </p>
                </div>
                   {(userRole === 'admin' || userRole === 'branch admin') &&  inventoryTab === 'purchased' && (
                    <button
                        type="button"
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-all active:scale-[0.98] focus:outline-none"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                         Add Stock
                    </button>
                )}
                 
            </div>

             <div className="flex border-b border-gray-200 bg-white px-6 gap-6 text-xs mb-4 rounded-xl shadow-sm">
                <button
                    type="button"
                    onClick={() => setInventoryTab('purchased')}
                    className={`py-3 font-bold uppercase tracking-wide transition-all border-b-2 outline-none ${
                        inventoryTab === 'purchased'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-400 hover:text-gray-500'
                    }`}
                >
                    Purchased Master Stocks
                </button>
                <button
                    type="button"
                    onClick={() => setInventoryTab('transferred')}
                    className={`py-3 font-bold uppercase tracking-wide transition-all border-b-2 outline-none ${
                        inventoryTab === 'transferred'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-400 hover:text-gray-500'
                    }`}
                >
                    Received Branch Transits
                </button>
            </div>




            {/* UNIFIED CONTAINER FOR TABLE & PAGINATION FOOTER */}
            <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

       

               <InventoryTable 
                data={groupedStockList.filter(row => {
                   
                        const currentRole = String(userRole).toLowerCase();
                         const isOwnBranch = parseInt(row.officeId) === parseInt(userBranchId);

                       
                        const rawPo = String(row.purchase_no || '').toUpperCase();
                           const hasTransferPO = rawPo.startsWith('TRANSFER') || 
                                              (row.allItems && row.allItems.some(item => 
                                                  String(item.purchase_no || '').toUpperCase().startsWith('TRANSFER')
                                              )); 
                       
                        const isActualTransfer = row.source_type === 'transfer' || hasTransferPO;

                        const isPurchase = !isActualTransfer;

                         if (rawPo.startsWith('TRANSFER') || row.id === 56) {
                            console.log("🔍 FRONTEND DATA ANALYSIS:", {
                                item: row.item,
                                officeId: row.officeId,
                                userBranchId: userBranchId,
                                isOwnBranch: isOwnBranch,
                                currentRole: currentRole,
                                isActualTransfer: isActualTransfer,
                                activeTab: inventoryTab
                            });
                        }

                          let belongsInPurchasedTab = false;

                         if (currentRole === 'admin') {
                            // 🌟 Super Admin sees ALL supplier purchases globally in the Purchased tab
                            // belongsInPurchasedTab = row.source_type === 'purchase';
                            belongsInPurchasedTab = isPurchase;
                        } else {
                            // 🌟 Branch Admins ONLY see items bought by their own specific branch
                            // belongsInPurchasedTab = row.source_type === 'purchase' && isOwnBranch;
                            belongsInPurchasedTab = isPurchase && isOwnBranch;
                        }
                        
                      
 
                        return inventoryTab === 'purchased' 
                           ? belongsInPurchasedTab 
                            : !belongsInPurchasedTab; 

                })}
                loading={isLoading} 
                userRole={userRole}
                inventoryTab={inventoryTab}
                onViewClick={handleViewItem}
                onEditClick={handleAdjustStockTrigger} 
            />





            {/* 2. 📊 ENTERPRISE LIGHT THEME PAGINATION BAR */}
                {!isLoading && stockList.length > 0 && (
                    <div className="p-4 border-t border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
                        <div>
                            Page <span className="text-blue-600 font-bold">{currentPage}</span> of <span className="text-gray-900 font-semibold">{totalPages}</span>
                        </div>
                        
                        <div className="flex gap-1.5 w-full sm:w-auto justify-end select-none">
                            {/* FIRST PAGE BUTTON */}
                            <button 
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(1)}
                                className="px-2.5 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:pointer-events-none transition-all font-semibold shadow-sm"
                            >
                                First
                            </button>

                            {/* PREVIOUS PAGE BUTTON */}
                            <button 
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                className="px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:pointer-events-none transition-all font-semibold shadow-sm"
                            >
                                Prev
                            </button>

                            {/* DYNAMIC DIGIT BUTTONS */}
                            {getVisiblePageNumbers().map((pageNumber) => (
                                <button
                                    key={pageNumber}
                                    type="button"
                                    onClick={() => setCurrentPage(pageNumber)}
                                    className={`w-8 h-8 rounded-md border text-center transition-all font-bold ${
                                        currentPage === pageNumber
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                            : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
                                    }`}
                                >
                                    {pageNumber}
                                </button>
                            ))}

                            {/* NEXT PAGE BUTTON */}
                            <button 
                                type="button"
                                disabled={currentPage === totalPages || totalPages === 0}
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                className="px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:pointer-events-none transition-all font-semibold shadow-sm"
                            >
                                Next
                            </button>

                            {/* LAST PAGE BUTTON */}
                            <button 
                                type="button"
                                disabled={currentPage === totalPages || totalPages === 0}
                                onClick={() => setCurrentPage(totalPages)}
                                className="px-2.5 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:pointer-events-none transition-all font-semibold shadow-sm"
                            >
                                Last
                            </button>
                        </div>
                    </div>
                )} ;

            </div>

             <AddStockModel
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                userRole={userRole}
                currentOfficeId={userBranchId}
                onSuccess={syncInventoryWithBackend}
            />
             
             <UpdateStockModel 
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedItem(null);
                }}
                itemData={selectedItem}
                userRole={userRole}
                currentOfficeId={userBranchId}
                onSuccess={syncInventoryWithBackend}
            />
             
             <ViewStockModal 
                    isOpen={isViewModalOpen}
                    onClose={() => {
                        setIsViewModalOpen(false);
                        setViewingItem(null);
                    }}
                    itemData={viewingItem}
                    userRole={userRole}
          />


        </div>
    );
};

export default InventoryItems;