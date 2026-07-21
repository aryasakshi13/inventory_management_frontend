import React from 'react';


const InventoryTable = ({ data, loading, userRole,onViewClick, inventoryTab, onEditClick }) => {
    
    // 1. LOADING LIFECYCLE STATE
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 bg-white gap-3 border border-gray-200 rounded-xl shadow-sm">
                <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Synchronizing database ledger lines...
                </p>
            </div>
        );
    }

    // 2. EMPTY LIFECYCLE STATE
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-20 bg-white text-sm font-medium tracking-wide text-gray-400 border border-gray-200 rounded-xl shadow-sm mx-4">
                No active inventory rows found for your authorized privilege tier.
            </div>
        );
    }

    // 🛡️ ROLE ACCESS CONTROL SECURITY GUARD
    const normalRole = String(userRole).toLowerCase();
    // const canModify = userRole === 'admin' || userRole === 'branch admin';
     const canModify = normalRole === 'admin' || normalRole === 'branch admin';

     const isTransitView = inventoryTab === 'transferred';

     let extraItemsCount = 0;

    return (
        <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-500 text-xs font-bold uppercase tracking-wider">
                            <th className="py-4 px-4 select-none">ID</th>
                            <th className="py-4 px-4 select-none">Category</th>
                            <th className="py-4 px-5 select-none">Item Name</th>
                            {!isTransitView && (
                                <>
                                    <th className="py-4 px-4 select-none">Purchase No</th>
                                    {/* ⚠️ This line below is causing your crash because extraItemsCount doesn't exist here! */}
                                    {extraItemsCount > 0 && <th className="py-4 px-4 select-none">Purchase Date</th>}
                                </>
                            )}
                           {normalRole === 'admin' && <th className="py-4 px-4 select-none">Office Name</th>}

                        

                           <th className="py-4 px-4 select-none">Created By</th>
                            <th className="py-4 px-4 text-center select-none">Quantity</th>
                               
                               {/* {!isTransitView && (
                                  <>
                                    <th className="py-4 px-4 select-none">Purchase No</th>
                                    <th className="py-4 px-4 select-none">Purchase Date</th>

                                 </>
                            )} 
                                
                            <th className="py-4 px-5 select-none">Updated Time</th> */}

                            
                            { !isTransitView && canModify && <th className="py-4 px-6 text-right select-none">Actions</th>}
                            
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs text-gray-600">
                        {data.map((row) => {

                            const dynamicExtraCount = row.allItems ? row.allItems.length - 1 : 0;

                            return(
                            <tr key={row.id} className="hover:bg-gray-50/40 transition-colors duration-150">
                                
                               
                                <td className="py-4 px-4 text-black font-mono ">
                                    #STK-{String(row.id).padStart(4, '0')}
                                </td>
                                

                            
                                <td className="py-4 px-4 text-gray-700">
                                    {row.Category ? (
                                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 font-medium">
                                            {row.Category}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 italic">Unassigned</span>
                                    )}
                                </td>

                             
                                    <td className="py-4 px-5">
                                        <div className="flex flex-col gap-0.5">
                                            <span className=" text-gray-900 uppercase">
                                                {row.item || 'N/A'}
                                            </span>
                                            { dynamicExtraCount > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => onViewClick && onViewClick(row)}
                                                    className="w-fit text-left text-[10px] font-extrabold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded transition-all mt-0.5 active:scale-95"
                                                >
                                                    + {dynamicExtraCount} More Item{dynamicExtraCount > 1 ? 's' : ''}
                                                </button>
                                            )}
                                        </div>
                                    </td>

                                    {!isTransitView && (
                                    <td className="py-4 px-4 font-mono text-gray-800 tracking-tight uppercase">
                                        {row.purchase_no || <span className="text-gray-300">—</span>}
                                    </td>
                                )}


                                {normalRole === 'admin' && (
                                    <td className="py-4 px-4 font-mono font-medium text-gray-800 uppercase">
                                        {row.OfficeName || row.officeName || `Branch ${row.officeId}`}
                                    </td>
                                )}

                                 {console.log("row", row)}
                               
                                <td className="py-4 px-4">
                                 
                                        <span className="text-gray-900 uppercase text-[11px] tracking-wide">
                                            {row.creatorName || "Central Corporate"}
                                        </span>
                                  
                                </td>
                          
                                <td className="py-4 px-4 text-center">
                                    <span className={`inline-block font-mono font-bold px-2.5 py-1 rounded-md text-xs border ${
                                        parseInt(row.Quantity) > 10 
                                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200/60' 
                                            : 'text-amber-700 bg-amber-50 border-amber-200/60'
                                    }`}>
                                        {row.Quantity} Units
                                    </span>
                                </td>
               
                                 {!isTransitView && (
                                 <td className="py-4 px-6 text-right whitespace-nowrap">
                                    <div className="inline-flex items-center gap-1.5">
                                
                                        <button
                                            type="button"
                                            onClick={() => onViewClick && onViewClick(row)}
                                            title="View Details"
                                           className="p-2 border border-gray-300 hover:border-emerald-500/40 bg-white hover:bg-emerald-50 text-gray-500 hover:text-emerald-700 rounded-lg transition-all shadow-sm active:scale-[0.95]"
                                           >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </button>

                                      

                                        
                                    </div>
                                </td>
                                 )}
                            </tr>
                            )
                       })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};



export default InventoryTable;