import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Truck, Users, Database, Plus, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

// 🎯 Component Imports (Matching your verified filenames character-for-character)
import TransitLogsTable from '../../components/issue/TransitLogstable';
import EmployeeAllocationTable from '../../components/issue/EmployeeAllocationTable';
// import BranchAllocationTable from '../../components/issue/BranchAllocationTable';
import IssueEmployeeModal from '../../components/issue/IssueEmployeeModal';
import BranchTransferModal from '../../components/issue/BranchTransferModal';

const IssueMaster = ({ userRole, userOfficeId, forcedInitialTab, context }) => {



    // 🛑 TEMP DEBUG GROUP — ADD THIS HERE:
    console.group("🕵️‍♂️ OFFICE ID TRACE AUDIT");
    console.log("1. Received prop 'userOfficeId':", userOfficeId, `(Type: ${typeof userOfficeId})`);
    console.log("2. Window LocalStorage raw 'user':", window.localStorage.getItem('user'));
    console.groupEnd();


    // Shared state engines
    const [branchTransfersLog, setBranchTransfersLog] = useState([]);
    const [employeeIssuesLog, setEmployeeIssuesLog] = useState([]);
    const [selectedBranchStock, setSelectedBranchStock] = useState([]);
    
    // Static system registries (Cached single-fetch)
    const [availableItems, setAvailableItems] = useState([]);
    const [availableOffices, setAvailableOffices] = useState([]);
    const [employeeRegistry, setEmployeeRegistry] = useState([]);

    // UI Panel Control Triggers
    // const [activeSubTab, setActiveSubTab] = useState('branchTransfers');
    //  const [activeSubTab, setActiveSubTab] = useState('inStock');
    const [activeSubTab, setActiveSubTab] = useState(forcedInitialTab || 'branchTransfers');
    const [currentSelectedOfficeId, setCurrentSelectedOfficeId] = useState(userOfficeId || 0);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [showBranchModal, setShowBranchModal] = useState(false);
    const [isLoadingLogs, setIsLoadingLogs] = useState(true);
    const [msg, setMsg] = useState({ type: '', text: '' });

      
    useEffect(() => {
        if (forcedInitialTab) {
            setActiveSubTab(forcedInitialTab);
        }
    }, [forcedInitialTab]);

    // Sync static lookup lists once on initialization
    useEffect(() => {
        const fetchSystemRegistries = async () => {
            try {
                 
                

                const [itemsRes, empRes, officesRes] = await Promise.all([
                    axios.get('https://inventory-manage-q4yr.onrender.com/api/items', { withCredentials: true }),
                    axios.get('https://inventory-manage-q4yr.onrender.com/api/auth/employees?limit=500', { withCredentials: true }),
                    axios.get('https://inventory-manage-q4yr.onrender.com/api/branch?limit=1000', { withCredentials: true })
                ]);
                if (itemsRes.data.success) setAvailableItems(itemsRes.data.data || []);
                setEmployeeRegistry(empRes.data.data || []);

                 if (officesRes.data.success) setAvailableOffices(officesRes.data.data || []);
                
                // Static template fallback index
                // setAvailableOffices([
                //     { OfficeID: 1, OfficeName: "Headquarters (HQ)" },
                //     { OfficeID: 2, OfficeName: "Okhla Branch Terminal" },
                //     { OfficeID: 3, OfficeName: "Mohali Tech Hub" },
                //     { OfficeID: 4, OfficeName: "Delhi Branch Office" }
                // ]);
             

            } catch (err) {
                console.error("Registry initialization failed:", err);
            }
        };
        fetchSystemRegistries();
    }, []);

    // Memoized core transactional live tracking update queries
    const syncActiveLedgers = useCallback(async () => {
        try {
            setIsLoadingLogs(true);
            
            // console.log("================ 🛠️ BRAND PROFILE CONTEXT AUDIT ================");
            // console.log("RAW PROP - userRole:", userRole, `(Type: ${typeof userRole})`);
            // console.log("RAW PROP - userOfficeId:", userOfficeId, `(Type: ${typeof userOfficeId})`);
            // console.log("STATE VARIABLE - currentSelectedOfficeId:", currentSelectedOfficeId);

             const activeOfficeTarget = parseInt(userOfficeId || currentSelectedOfficeId || 0);

            //  console.log("RESOLVED INTEGER FACILITY KEY (activeOfficeTarget):", activeOfficeTarget);
            // console.log("PAGE RENDER CONTEXT:", context);
            // console.log("================================================================");
            


            const [transferRes, issueHistoryRes, stockRes] = await Promise.all([
              axios.get('https://inventory-manage-q4yr.onrender.com/api/inventry/transfers-log', { withCredentials: true }),
                axios.get('https://inventory-manage-q4yr.onrender.com/api/inventry/issued-history', { withCredentials: true }).catch(() => ({ data: { data: [] } })),


                // axios.get(`https://inventory-manage-q4yr.onrender.com/api/inventry/branch-stock/${userRole === 'branch admin' ? userOfficeId : currentSelectedOfficeId}`, { withCredentials: true }).catch(() => ({ data: { data: [] } }))

             axios.get(`https://inventory-manage-q4yr.onrender.com/api/inventry/branch-stock/${userRole === 'branch admin' ? userOfficeId : 878}`, { 
                            headers: {
                              'Authorization': `Bearer ${localStorage.getItem('authToken')}` // 🌟 Fix: This unblocks the stock layout verification!
                             },
                            
                                withCredentials: true 
                            }).catch(() => ({ data: { data: [] } }))
                            ]);

            const rawTransfers = transferRes.data.transfers || transferRes.data.data || [];


            console.log(`📥 API PAYLOAD DOWNLOADED: Total ${rawTransfers.length} global records fetched.`);

            // 🎯 FIXED: Create a stable office target key fallback chain to prevent NaN comparisons
           

            //  // 🎯 IN LOGS ARRAY: Filter rows arriving TO this department location ID
            // const incomingData = rawTransfers.filter(tx => parseInt(tx.ToOfficeID) === parseInt(userOfficeId));
            
            // // 🎯 OUT LOGS ARRAY: Filter rows departing FROM this department location ID
            // const outgoingData = rawTransfers.filter(tx => parseInt(tx.FromOfficeID) === parseInt(userOfficeId));


            // setBranchTransfersLog(userRole === 'branch admin' 
            //     ? rawTransfers.filter(tx => parseInt(tx.ToOfficeID) === parseInt(userOfficeId))
            //     : rawTransfers
            // );

            // const targetedOfficeId = parseInt(userOfficeId);
            
            // if (activeSubTab === 'inStock') {
            //     setBranchTransfersLog(incomingData);
            // } else if (activeSubTab === 'outStock') {
            //     setBranchTransfersLog(outgoingData);
            // } else {
            //     setBranchTransfersLog(rawTransfers); // Fallback architecture
            // }



        //      if (userRole === 'branch admin' || context === 'stockTransfers') {
        //     const filteredTransfers = rawTransfers.filter(tx => {
        //         const toOfficeId = parseInt(tx.ToOfficeID || tx.toOfficeId);
        //         const fromOfficeId = parseInt(tx.FromOfficeID || tx.fromOfficeId);
                
        //         // Keep the row if it's arriving to or departing from this office
        //         return toOfficeId === targetedOfficeId || fromOfficeId === targetedOfficeId;
        //     });
        //     setBranchTransfersLog(filteredTransfers);
        // } else {
        //     // Global admin default context view sees everything
        //     setBranchTransfersLog(rawTransfers);
        // }

        //     setEmployeeIssuesLog(issueHistoryRes.data.data || []);

            //  const myOfficeTransfers = rawTransfers.filter(tx => {
            //     const toId = parseInt(tx.ToOfficeID || tx.toOfficeId);
            //     const fromId = parseInt(tx.FromOfficeID || tx.fromOfficeId);
            //     return toId === targetedOfficeId || fromId === targetedOfficeId;
            // });

                if (context === 'stockTransfers') {
                // Both Admin and Branch Admin filter logs strictly by active branch context location
                const myOfficeTransfers = rawTransfers.filter(tx => {
                    const toId = parseInt(tx.ToOfficeID || tx.toOfficeId);
                    const fromId = parseInt(tx.FromOfficeID || tx.fromOfficeId);
                    return toId === activeOfficeTarget || fromId === activeOfficeTarget;
                });
                setBranchTransfersLog(myOfficeTransfers);
            } else {
                if (userRole === 'branch admin') {
                    const myOfficeTransfers = rawTransfers.filter(tx => {
                        const toId = parseInt(tx.ToOfficeID || tx.toOfficeId);
                        const fromId = parseInt(tx.FromOfficeID || tx.fromOfficeId);
                        return toId === activeOfficeTarget || fromId === activeOfficeTarget;
                    });
                    setBranchTransfersLog(myOfficeTransfers);
                } else {
                    setBranchTransfersLog(rawTransfers);
                }
            }   


            // const uniqueOfficesMap = new Map();
            // rawTransfers.forEach(tx => {
            //     // Collect FromOffice details
            //     if (tx.FromOfficeID && tx.FromOfficeName) {
            //         uniqueOfficesMap.set(parseInt(tx.FromOfficeID), {
            //             OfficeID: parseInt(tx.FromOfficeID),
            //             OfficeName: tx.FromOfficeName,
            //             OfficeCode: tx.FromOfficeCode || ''
            //         });
            //     }
            //     // Collect ToOffice details
            //     if (tx.ToOfficeID && tx.ToOfficeName) {
            //         uniqueOfficesMap.set(parseInt(tx.ToOfficeID), {
            //             OfficeID: parseInt(tx.ToOfficeID),
            //             OfficeName: tx.ToOfficeName,
            //             OfficeCode: tx.ToOfficeCode || ''
            //         });
            //     }
            // });
            // setAvailableOffices(Array.from(uniqueOfficesMap.values()));

            //  setBranchTransfersLog(myOfficeTransfers);
            setEmployeeIssuesLog(issueHistoryRes.data.data || []);
            setSelectedBranchStock(stockRes.data.data || []);
        } catch (err) {
            console.error("Data syncing metrics failure:", err);
        } finally {
            setIsLoadingLogs(false);
        }
    }, [userRole, userOfficeId, currentSelectedOfficeId, context]);

    

    useEffect(() => {
        syncActiveLedgers();
    }, [syncActiveLedgers]);

    const handleActionUpdateStatus = async (endpoint, batchId) => {
        try {
            setMsg({ type: '', text: '' });
            
            const token = localStorage.getItem('authToken');
            const baseUrl = window.location.hostname === 'localhost' 
                ? 'http://localhost:5001' 
                : 'https://inventory-manage-q4yr.onrender.com';

            const res = await axios.post(`${baseUrl}/api/inventry/${endpoint}`, { batchId }, {
                
                headers: { 
                    'Authorization': `Bearer ${token}` 
                },
                withCredentials: true 
            });
            if (res.data.success) {
                setMsg({ type: 'success', text: res.data.message });
                syncActiveLedgers();
            }
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Operation failed.' });
        }
    };

// const isStockTransferView = forcedInitialTab === 'branchTransfers' || forcedInitialTab === 'inStock' || forcedInitialTab === 'outStock';

   const isStockTransfersModule = activeSubTab === 'branchTransfers' || activeSubTab === 'inStock' || activeSubTab === 'outStock';

    const currentOfficeFilterKey = parseInt(userOfficeId || currentSelectedOfficeId || 0);
   const stockInTransfers = branchTransfersLog.filter(tx => parseInt(tx.ToOfficeID) === parseInt(userOfficeId));
    const stockOutTransfers = branchTransfersLog.filter(tx => parseInt(tx.FromOfficeID) === parseInt(userOfficeId));


      console.group("🕵️‍♂️ OPERATION LOG TRACING AUDIT");
        console.log("Your Active Logged In Office ID Key:", currentOfficeFilterKey);
        console.log("Total Raw Array items in branchTransfersLog:", branchTransfersLog.length);

    if (branchTransfersLog.length > 0) {
        console.log("Target Keys of Row Index 0 -> FromOfficeID:", branchTransfersLog[0].FromOfficeID, " | toOfficeId:", branchTransfersLog[0].toOfficeId);
    }
    console.groupEnd();



    if (branchTransfersLog.length > 0) {
    console.group("🚨 MANUAL FREIGHT ROUTING AUDIT");
    console.log("Logged-In Branch ID (Filter Key):", currentOfficeFilterKey);
    
    // This prints your transfers out as a readable table in your console!
    console.table(branchTransfersLog.map((tx, index) => ({
        index: index,
        Record_ID: tx.id || tx.ID,
        FromOffice: tx.FromOfficeID || tx.fromOfficeId,
        ToOffice: tx.ToOfficeID || tx.toOfficeId,
        Status: tx.Status || tx.status,
        Matches_FromOffice: String(tx.FromOfficeID || tx.fromOfficeId) === String(currentOfficeFilterKey),
        Matches_ToOffice: String(tx.ToOfficeID || tx.toOfficeId) === String(currentOfficeFilterKey)
    })));
    console.groupEnd();
}


    return (
        <div className="space-y-4 bg-gray-50 p-2 text-xs text-gray-600 font-semibold text-left w-full">
            {msg.text && (
                <div className={`p-3 rounded-xl border flex items-center gap-2 shadow-sm ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
                    {msg.type === 'success' ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                    <span className="font-bold">{msg.text}</span>
                </div>
            )}

            {/* FULL WIDTH LEDGER FRAME */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden w-full">
                
                {/* SYSTEM LEVEL ACTIONS HEADER CONTAINER STRIP */}
                <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600">
                            {/* {activeSubTab === 'branchTransfers' ? <Truck size={14} /> : <Users size={14} />} */}

                            {/* {isEmployeeSectionScope ? <Users size={14} /> : <Truck size={14} />} */}

                              {isStockTransfersModule ? <Truck size={14} /> : <Users size={14} />}
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                                {/* Corporate Stock Release Master */}
                                 {/* {isEmployeeSectionScope ? <Users size={14} /> : <Truck size={14} />} */}
                                 {isStockTransfersModule ? "Corporate Stock Transfer Master" : "Staff Asset Allocation Master"}
                                </h3>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                                {/* Manage historical transits, local stock tracking balances, and personnel allocations */}
                                  {/* {isEmployeeSectionScope ? "Track items deployed directly into company personnel arrays" : "Manage historical transits, local stock tracking balances, and personnel allocations"}
                                    
                             */}

                                {isStockTransfersModule ? "Manage historical transits, local stock tracking balances, and personnel allocations" : "Track items deployed directly to company staff members"}

                                </p>
                        </div>
                    </div>

                    {/* DYNAMIC TOP RIGHT MODAL LAUNCH BUTTON CONTROLS (Only visible to Admin) */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        {/* Refresh Button */}
                        <button onClick={syncActiveLedgers} className="p-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-500 transition-colors">
                            <RefreshCw size={12} />
                        </button>
                        
                        {/* 🌟 ALLOW BOTH ADMIN AND BRANCH ADMIN TO ACCESS THE BUTTONS */}
                        {/* {(userRole === 'admin' || userRole === 'branch admin') && ( */}
                        { (userRole === 'admin' || userRole === 'branch admin') && (
                           (context === 'stockTransfers' || !context) && (
                           
                           <>
                               
                                {/* {(context === 'stockTransfers' || !context) && (
                                
                                <button type="button" onClick={() => setShowBranchModal(true)} className="h-9 px-3.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm uppercase tracking-wider text-[10px] transition-colors">
                                    Stock Out
                                </button>
                                )}
                                
                                {(context === 'stockTransfers' || !context) && (
                                <button type="button" onClick={() => setShowStaffModal(true)} className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm uppercase tracking-wider text-[10px] transition-colors">
                                    Issue to Staff
                                </button>
                                )} */}

                                  <button type="button" onClick={() => {/* Add your Stock In handler function here when ready */}} className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm uppercase tracking-wider text-[10px] transition-colors">
                                    Stock In
                                </button>
                                
                                <button type="button" onClick={() => setShowBranchModal(true)} className="h-9 px-3.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm uppercase tracking-wider text-[10px] transition-colors">
                                    Stock Out
                                </button>
                                
                                <button type="button" onClick={() => setShowStaffModal(true)} className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm uppercase tracking-wider text-[10px] transition-colors">
                                    Issue to Staff
                                </button>

                            </>
                            ) 
                        )}
                    </div>

                </div>

                {/* DYNAMIC GRID VIEW SEGMENT SWITCHER TABS ROW BAR */}
                <div className="flex border-b border-gray-100 bg-gray-50/50 px-4 pt-2 text-[10px] uppercase">
                    {context === 'stockTransfers' ? (
                     <>
            {/* 📥 Renders uniformly as "Stock In" for both Admin and Branch Admin */}
            <button 
                type="button"
                onClick={() => setActiveSubTab('inStock')} 
                className={`py-2 px-4 border-b-2 font-black transition-all ${activeSubTab === 'inStock' || activeSubTab === 'branchTransfers' ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg' : 'border-transparent text-gray-400'}`}
            >
                {/* Stock In ({branchTransfersLog.filter(tx => parseInt(tx.ToOfficeID) === parseInt(userOfficeId)).length}) */}

                 Stock In ({stockInTransfers.length})
            </button>
            
            {/* 📦 Renders uniformly as "Stock Out" for both Admin and Branch Admin */}
            <button 
                type="button"
                onClick={() => setActiveSubTab('outStock')} 
                className={`py-2 px-4 border-b-2 font-black transition-all ${activeSubTab === 'outStock' ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg' : 'border-transparent text-gray-400'}`}
            >
                {/* Stock Out ({branchTransfersLog.filter(tx => parseInt(tx.FromOfficeID) === parseInt(userOfficeId)).length}) 
                */}

                Stock Out ({stockOutTransfers.length}) 
            </button>
          </>
         ) :(
            <>
                 <button onClick={() => setActiveSubTab('branchTransfers')} className={`py-2 px-4 border-b-2 font-black transition-all ${activeSubTab === 'branchTransfers' ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg' : 'border-transparent text-gray-400'}`}>
                        {/* {userRole === 'admin' ? 'Inter-Branch Transits Master Log' : 'Incoming Branch Freight Manifests'} ({branchTransfersLog.length}) */}

                         Incoming Branch Freight Manifests ({branchTransfersLog.length})   
                    </button> 

                    {(userRole === 'admin' || userRole === 'branch admin') && (
                        <button onClick={() => setActiveSubTab('employeeIssues')} className={`py-2 px-4 border-b-2 font-black transition-all ${activeSubTab === 'employeeIssues' ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg' : 'border-transparent text-gray-400'}`}>
                            Staff Allocations History Log ({employeeIssuesLog.length})
                        </button>
                    )}

              </>  
                    )}

                </div>
                     
                     {/* {isEmployeeSectionScope ? (
                        <button className="py-2 px-4 border-b-2 font-black border-blue-600 text-blue-600 bg-white rounded-t-lg">
                            Staff Allocations History Log ({employeeIssuesLog.length})
                        </button>


                    ) : (
                        <>
                            <button onClick={() => setActiveSubTab('inStock')} className={`py-2 px-4 border-b-2 font-black transition-all ${activeSubTab === 'inStock' ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg' : 'border-transparent text-gray-400'}`}>
                                In Stock
                            </button>
                            <button onClick={() => setActiveSubTab('outStock')} className={`py-2 px-4 border-b-2 font-black transition-all ${activeSubTab === 'outStock' ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg' : 'border-transparent text-gray-400'}`}>
                                Out Stock
                            </button>
                        </>
                    )} */}

                    {/* {isStockTransfersModule ? (
                        <button className="py-2 px-4 border-b-2 font-black border-blue-600 text-blue-600 bg-white rounded-t-lg">
                            {userRole === 'admin' ? 'Inter-Branch Transits Master Log' : 'Incoming Branch Freight Manifests'} ({branchTransfersLog.length})
                        </button>
                    ) : (
                        <button className="py-2 px-4 border-b-2 font-black border-blue-600 text-blue-600 bg-white rounded-t-lg">
                            Staff Allocations History Log ({employeeIssuesLog.length})
                        </button>
                    )} */}

                

                {/* RENDER GRID COMPONENT ROUTERS */}
                {/* {isLoadingLogs ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-2 text-gray-400">
                        <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                        <p className="uppercase tracking-wider font-bold text-[9px]">Syncing Enterprise Inventories...</p>
                    </div>
                ) : activeSubTab === 'branchTransfers' ? (
                    <TransitLogsTable data={branchTransfersLog} userRole={userRole} availableOffices={availableOffices} availableItems={availableItems}  onUpdateStatus={handleActionUpdateStatus} />
                ) 
                // : activeSubTab === 'branchWarehouseStock' ? (
                //     <BranchAllocationTable stockData={selectedBranchStock} availableOffices={availableOffices} userRole={userRole} userOfficeId={userOfficeId} onOfficeChange={setCurrentSelectedOfficeId} />
                //  ) 
                
                : (
                    <EmployeeAllocationTable data={employeeIssuesLog} />
                )} */}
                 
                 {isLoadingLogs ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-2 text-gray-400">
                        <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                        <p className="uppercase tracking-wider font-bold text-[9px]">Syncing Enterprise Inventories...</p>
                    </div>
          ) : context === 'stockTransfers' ? (
    /* ======================================================================
       📦 1. STOCK TRANSFERS VIEW CONTEXT (FOR BOTH ADMIN & BRANCH ADMIN)
       ====================================================================== */
     activeSubTab === 'outStock' ? (
        
         
        <TransitLogsTable 
            // data={branchTransfersLog.filter(tx => parseInt(tx.FromOfficeID) === parseInt(userOfficeId))} 
             data={stockOutTransfers}
            userRole={userRole} 
            availableOffices={availableOffices} 
            availableItems={availableItems} 
            onUpdateStatus={handleActionUpdateStatus}
            isApprovalView={false} 
        />


    ) : (
        /* 📥 INBOUND STOCK IN SUB-TAB (The migrated approval table) */
        <TransitLogsTable 
            // data={branchTransfersLog.filter(tx => parseInt(tx.ToOfficeID) === parseInt(userOfficeId))}
             data={stockInTransfers}
            userRole={userRole} 
            availableOffices={availableOffices} 
            availableItems={availableItems} 
            onUpdateStatus={handleActionUpdateStatus} 
            isApprovalView={true}
        />
    )
) : (
    /* ======================================================================
       👥 2. ITEM ISSUE VIEW CONTEXT (FOR BOTH ADMIN & BRANCH ADMIN)
       ====================================================================== */
    activeSubTab === 'branchTransfers' ? (
        /* 🚛 TAB 1: INTER-BRANCH TRANSITS MASTER LOG */
        <TransitLogsTable 
            // data={branchTransfersLog} 
             data={stockOutTransfers}
            userRole={userRole} 
            availableOffices={availableOffices} 
            availableItems={availableItems} 
            onUpdateStatus={handleActionUpdateStatus} 
            isApprovalView={false}
        />
    ) : (
        /* 👤 TAB 2: STAFF ALLOCATIONS HISTORY LOG (#ALC-0001, #ALC-0002) */
        <EmployeeAllocationTable data={employeeIssuesLog} />
    )
)}

  </div>

            {/* DYNAMIC MODALS POPUPS LAUNCH PAD */}
            {showStaffModal && (
                <IssueEmployeeModal isOpen={showStaffModal} onClose={() => setShowStaffModal(false)} availableItems={availableItems} availableOffices={availableOffices} employeeRegistry={employeeRegistry} onActionSuccess={syncActiveLedgers} />
            )}
            {showBranchModal && (
                <BranchTransferModal isOpen={showBranchModal} onClose={() => setShowBranchModal(false)} availableItems={availableItems} availableOffices={availableOffices} onActionSuccess={syncActiveLedgers} />
            )}
        </div>
    );
};

export default IssueMaster;



