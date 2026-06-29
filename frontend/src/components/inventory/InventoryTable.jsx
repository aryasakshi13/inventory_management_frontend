import React from 'react';

// const InventoryTable = ({ data, loading, userRole, onEditClick }) => {
    
//     // 1. LIFECYCLE RENDER STATE A: High-Contrast Synchronizing Loading Indicator Skeletons
//     if (loading) {
//         return (
//             <div className="flex flex-col items-center justify-center py-24 bg-white gap-3 border border-gray-200 rounded-xl shadow-sm">
//                 <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
//                 <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
//                     Synchronizing live branch data structures...
//                 </p>
//             </div>
//         );
//     }

//     // 2. LIFECYCLE RENDER STATE B: Empty Fallback Registry State Frame Layout
//     if (!data || data.length === 0) {
//         return (
//             <div className="text-center py-20 bg-white text-sm font-medium tracking-wide text-gray-400 border border-gray-200 rounded-xl shadow-sm mx-4">
//                 No inventory logs structural nodes discovered within your authorized privilege tier.
//             </div>
//         );
//     }

//     // 🛡️ SECURITY RESOLUTION LAYER: Restrict write access matching dashboard logic controls
//     // Only 'admin' or 'branch admin' keys are permitted to mutate stock assets rows
//     const canModify = userRole === 'admin' || userRole === 'branch admin';

//     return (
//         <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
//             <div className="overflow-x-auto">
//                 <table className="w-full text-left border-collapse">
//                     <thead>
//                         <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-500 text-xs font-bold uppercase tracking-wider">
//                             <th className="py-4 px-6 select-none">Stock Registry ID</th>
//                             <th className="py-4 px-6 select-none">Item Nomenclature</th>
//                             <th className="py-4 px-6 select-none">Warehouse / Office ID</th>
//                             <th className="py-4 px-6 text-center select-none">Available Units</th>
//                             <th className="py-4 px-6 select-none">Last Database Sync</th>
//                             {/* 🛡️ Guard Header UI Cell wrapper block */}
//                             {canModify && <th className="py-4 px-6 text-right select-none">Actions</th>}
//                         </tr>
//                     </thead>
//                     <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
//                         {data.map((row) => (
//                             <tr key={row.id} className="hover:bg-gray-50/40 transition-colors duration-150">
                                
//                                 {/* Serialized Registry ID tracking token tags code format index */}
//                                 <td className="py-4 px-6 text-blue-600 font-mono text-xs font-bold tracking-tight">
//                                     #STK-{String(row.id).padStart(4, '0')}
//                                 </td>
                                
//                                 {/* Item Identity Name String parsing */}
//                                 <td className="py-4 px-6 font-bold text-gray-900 tracking-wide uppercase">
//                                     {row.item}
//                                 </td>
                                
//                                 {/* Relational Branch Scope Mapping ID Component wrapper */}
//                                 <td className="py-4 px-6">
//                                     <span className="inline-flex items-center bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-md border border-gray-200 font-mono">
//                                         Branch ID: {row.officeId}
//                                     </span>
//                                 </td>
                                
//                                 {/* Balanced inventory quantitative dynamic contextual color states tracking tags */}
//                                 <td className="py-4 px-6 text-center">
//                                     <span className={`inline-block font-mono font-bold px-3 py-1 rounded-md text-xs border ${
//                                         row.Quantity > 10 
//                                             ? 'text-emerald-700 bg-emerald-50 border-emerald-200/60' 
//                                             : 'text-amber-700 bg-amber-50 border-amber-200/60'
//                                     }`}>
//                                         {row.Quantity} Units
//                                     </span>
//                                 </td>
                                
//                                 {/* MySQL datetime string localized standard human parsers */}
//                                 <td className="py-4 px-6 text-gray-400 font-mono text-xs tracking-tight">
//                                     {row.UpdateDateTime ? new Date(row.UpdateDateTime).toLocaleString() : 'N/A'}
//                                 </td>

//                                 {/* 🛡️ Guard Row Action Cell visibility blocks wrapper */}
//                                 {canModify && (
//                                     <td className="py-4 px-6 text-right whitespace-nowrap">
//                                         <button
//                                             type="button"
//                                             onClick={() => onEditClick && onEditClick(row)}
//                                             className="inline-flex items-center gap-1.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-2.5 py-1.5 rounded-md text-xs transition-all shadow-sm active:scale-[0.97]"
//                                         >
//                                             <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
//                                             </svg>
//                                             Adjust Stock
//                                         </button>
//                                     </td>
//                                 )}
                                
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>
//         </div>
//     );
// };

// import React from 'react';

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
                                
                                {/* 1. ID (`row.id`) */}
                                <td className="py-4 px-4 text-blue-600 font-mono font-bold">
                                    #STK-{String(row.id).padStart(4, '0')}
                                </td>
                                

                                {/* 3. CATEGORY (`row.Category`) */}
                                <td className="py-4 px-4 text-gray-700">
                                    {row.Category ? (
                                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 font-medium">
                                            {row.Category}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 italic">Unassigned</span>
                                    )}
                                </td>

                                {/* 3. BATCH PURCHASE NO TARGET CELL */}
                                        {/* <td className="py-4 px-4 font-mono text-gray-800 font-semibold tracking-tight uppercase">
                                            {row.purchase_no || <span className="text-gray-300">—</span>}
                                        </td> */}

                                

                                {/* 2. ITEM NAME (`row.item` / `row.itemName`) */}
                                {/* <td className="py-4 px-5 font-bold text-gray-900 uppercase">
                                    {row.item || row.itemName || 'N/A'}
                                </td> */}

                                  

                                   {/* 3. ITEM NAME COLUMN WITH INTERACTIVE MULTI-ROW "+" TRIGGER */}
                                    <td className="py-4 px-5">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-bold text-gray-900 uppercase">
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
                                    <td className="py-4 px-4 font-mono text-gray-800 font-semibold tracking-tight uppercase">
                                        {row.purchase_no || <span className="text-gray-300">—</span>}
                                    </td>
                                )}


                                
                                {/* 4. OFFICE ID (`row.officeId`) */}
                                {normalRole === 'admin' && (
                                    <td className="py-4 px-4 font-mono font-medium text-gray-800 uppercase">
                                        {row.OfficeName || row.officeName || `Branch ${row.officeId}`}
                                    </td>
                                )}

                                <td className="py-4 px-4">
                                    
                                        {/* High-contrast, bold Employee Name */}
                                        <span className="text-gray-900 font-bold uppercase text-[11px] tracking-wide">
                                            {row.creatorName || "Central Corporate"}
                                        </span>
                                  
                                </td>
                                
                                {/* 5. QUANTITY (`row.Quantity`) */}
                                <td className="py-4 px-4 text-center">
                                    <span className={`inline-block font-mono font-bold px-2.5 py-1 rounded-md text-xs border ${
                                        parseInt(row.Quantity) > 10 
                                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200/60' 
                                            : 'text-amber-700 bg-amber-50 border-amber-200/60'
                                    }`}>
                                        {row.Quantity} Units
                                    </span>
                                </td>
               
                                {/* 6. PURCHASE NO (`row.purchase_no`) */}
                           
                                
                                {/* 8. UPDATED TIME (`row.UpdateDateTime`) */}
                                {/* <td className="py-4 px-5 text-gray-400 font-mono tracking-tight">
                                    {row.UpdateDateTime ? new Date(row.UpdateDateTime).toLocaleString() : 'N/A'}
                                </td> */}

                                {/* 🛠️ CONDITIONAL ROW ACTIONS */}
                                 {!isTransitView && (
                                 <td className="py-4 px-6 text-right whitespace-nowrap">
                                    <div className="inline-flex items-center gap-1.5">
                                        
                                        {/* 👁️ ICON-ONLY VIEW BUTTON */}
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

                                        {/* ➕ ADD STOCK BUTTON (Hidden from Employees) */}
                                        {/* {canModify && (
                                            <button
                                                type="button"
                                                onClick={() => onAddStockClick && onAddStockClick(row)}
                                                title="Add Stock"
                                                className="p-2 border border-gray-300 hover:border-indigo-500/40 bg-white hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 rounded-lg transition-all shadow-sm active:scale-[0.95]"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </button>
                                        )} */}

                                        {/* ✏️ ICON-ONLY ADJUST STOCK BUTTON */}
                                        {canModify && (
                                            <button
                                                type="button"
                                                onClick={() => onEditClick && onEditClick(row)}
                                                title="Adjust Stock Quantity"
                                                className="p-2 border border-gray-300 hover:border-blue-500/40 bg-white hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded-lg transition-all shadow-sm active:scale-[0.95]"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        )}
                                        
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