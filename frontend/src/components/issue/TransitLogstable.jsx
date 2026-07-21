import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const TransitLogsTable = ({ data, userRole, availableOffices = [], availableItems = [], onUpdateStatus, isApprovalView = false  }) => {

    console.log("🔥 ENTRY AUDIT - Table loaded with data length:", data?.length, " | isApprovalView:", isApprovalView);

     console.log("availableOffices received by TransitLogsTable:", availableOffices);
     console.log(">>>>>>>>Hiiiiiiii");

    if (!data || data.length === 0) {
        return (
            <div className="py-24 text-center text-gray-400 font-bold uppercase tracking-wider text-xs bg-white w-full">
                No active historical branch transfer transactions recorded in this log view.
            </div>
        );
    }

    // const isAdmin = userRole === 'admin';

    return (
        <div className="overflow-x-auto text-xs w-full bg-white animate-in fade-in duration-100">
            <table className="w-full text-left border-collapse table-auto min-w-[1300px]">
                <thead>
                    <tr className="bg-gray-50 text-gray-400 border-b border-gray-200 font-black text-[9px] uppercase tracking-wider">
                        <th className="p-4 pl-6">ID / Batch Code</th>
                        {/* {isAdmin && <th className="p-4">From Office Name</th>} */}

                        <th className="p-4">From Office Name</th>
                        {!isApprovalView && <th className="p-4">To Office Name</th>}
                        <th className="p-4">Item Name</th>
                        <th className="p-4 text-center">Quantity</th>

                        {!isApprovalView && (
                         <>
                                {/* {isAdmin && <th className="p-4">Mode of Transfer</th>}
                                {isAdmin && <th className="p-4">Courier Name</th>}
                                {isAdmin && <th className="p-4">Docket Number</th>}
                                {isAdmin && <th className="p-4">Courier Date</th>} */}

                                 <th className="p-4">Mode of Transfer</th>
                                    <th className="p-4">Courier Name</th>
                                    <th className="p-4">Docket Number</th>
                                    <th className="p-4">Courier Date</th>
                          </>
                        )}
                        <th className="p-4 text-center pr-6">Operational Status / Actions</th>
                    </tr>
                </thead>
                
                <tbody className="divide-y divide-gray-100 text-gray-700 font-semibold">
                  
                    {data.map((tx, idx) => {

                    //     if (idx === 0) {
                    //     console.group("🎯 LIVE BUTTON RENDERING AUDIT");
                    //     console.log("1. What value is 'isApprovalView' receiving?:", isApprovalView, `(Type: ${typeof isApprovalView})`);
                    //     console.log("2. Current row finalStatus value:", finalStatus);
                    //     console.log("3. Evaluated Button Condition (isApprovalView && Pending):", (isApprovalView && (finalStatus === 'Pending' || finalStatus === 'PENDING')));
                    //     console.groupEnd();
                    // }

                        // 1. Resolve BatchId with safe database property fallbacks (matching your exact screenshot)
                        const batchCode = tx.BatchId || tx.batchId || tx.BatchID || `#TRN-${tx.id || idx}`;

                        // 2. Resolve FromOfficeID and ToOfficeID values safely
                        const fromId = tx.FromOfficeID ?? tx.fromOfficeId ?? tx.FromOfficeId;
                        const toId = tx.ToOfficeID ?? tx.toOfficeId ?? tx.ToOfficeId;

                        // 3. Map Numeric Office IDs to complete strings from your master lookup array
                        const resolvedFromBranch = availableOffices.find(o => parseInt(o.ID) === parseInt(fromId))?.OfficeName 
                            ||  tx.FromOfficeName
                            || (fromId ? `Office #${fromId}` : "HQ / Main Depot");

                        const resolvedToBranch = availableOffices.find(o => parseInt(o.ID) === parseInt(toId))?.OfficeName 
                            || tx.ToOfficeName
                            || (toId ? `Office #${toId}` : "Unknown Branch");

                        // 4. Map the numeric Item ID to its human-readable text name from availableItems catalog
                        // const rawItemField = tx.Item ?? tx.item;
                        // const resolvedItemName = availableItems.find(i => parseInt(i.ItemId || i.id) === parseInt(rawItemField))?.ItemName 
                        //     || rawItemField 
                        //     || "N/A";

                          const resolvedItemName = tx.item || tx.ItemName || tx.Item || "N/A";

                        // 5. Safe quantity field fallback extraction
                        const finalQty = tx.Quantity ?? tx.qty ?? 0;

                        // 6. Safe extraction of metadata fields
                        const finalMode = tx.ModeOfTransfer || tx.modeOfTransfer || 'By Hand';
                        const finalCourier = tx.CourierName || tx.courierName || '';
                        const finalDocket = tx.DocketNumber || tx.docketNumber || '';
                        const finalDate = tx.CourierDate || tx.Date || tx.date;
                        const finalStatus = tx.Status || tx.status || 'Pending';

                        console.log(finalCourier);
                        console.log(finalDocket);

                        return (
                            <tr key={batchCode || idx} className="hover:bg-gray-50/50 transition-colors">
                                {/* Batch ID */}
                                <td className="p-4 pl-6 font-mono text-blue-600 font-bold text-[11px] whitespace-nowrap">
                                    {batchCode}
                                </td>

                                {/* From Office Name */}
                                {/* {isAdmin && ( */}

                               
                                    <td className="p-4 font-mono uppercase text-gray-900 whitespace-nowrap">
                                        {resolvedFromBranch}
                                    </td>
                              

                                {/* To Office Name */}
                                  {!isApprovalView && ( <td className="p-4 font-mono uppercase text-gray-900 whitespace-nowrap">
                                    {resolvedToBranch}
                                </td>  )}

                                {/* Item Name resolved via master lookup dictionary */}
                                <td className="p-4 font-black  font-mono uppercase text-gray-900 tracking-wide whitespace-nowrap">
                                    {resolvedItemName}
                                </td>

                                {/* Quantity */}
                                <td className="p-4 font-mono font-bold text-center text-gray-900 text-[11px]">
                                    {finalQty}
                                </td>

                                 {!isApprovalView && (
                                    <>
                                        <td className="p-4 uppercase tracking-wide text-gray-800 font-bold whitespace-nowrap">
                                            {finalMode}
                                        </td>
                                        <td className="p-4 uppercase text-gray-600 whitespace-nowrap">
                                            {!finalCourier || finalCourier.trim() === '' ? <span className="text-gray-400 italic font-normal">N/A</span> : finalCourier}
                                        </td>
                                        <td className="p-4 font-mono text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                            {!finalDocket || finalDocket.trim() === '' ? <span className="text-gray-400 font-sans italic font-normal">N/A</span> : finalDocket}
                                        </td>
                                        <td className="p-4 font-mono text-gray-400 text-[10px] whitespace-nowrap">
                                            {finalDate ? new Date(finalDate).toLocaleDateString() : 'N/A'}
                                        </td>
                                    </>
                                )}

                                {/* Status / Action Triggers */}
                                {/* <td className="p-4 pr-6 text-center whitespace-nowrap">
                                    {userRole === 'branch admin' && finalStatus === 'Pending' ? (
                                        <div className="flex justify-center items-center gap-1.5">
                                            <button 
                                                type="button" 
                                                onClick={() => onUpdateStatus('accept', batchCode)} 
                                                className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[9px] uppercase tracking-wide flex items-center gap-1 shadow-sm transition-colors"
                                            >
                                                Accept
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => onUpdateStatus('reject', batchCode)} 
                                                className="h-7 px-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[9px] uppercase tracking-wide flex items-center gap-1 shadow-sm transition-colors"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    ) : (
                                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-[9px] border font-black uppercase tracking-wider ${
                                            finalStatus === 'Pending' ? 'text-amber-700 bg-amber-50 border-amber-200' : finalStatus === 'Accepted' || finalStatus === 'Delivered' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border-red-200'
                                        }`}>{finalStatus}</span>
                                    )}
                                </td> */}

                                  {/* 🟢 RESTORED STANDARD STATUS ROW DESIGN */}
                                      <td className="p-4 pr-6 text-center whitespace-nowrap">
                                    {/* 🔓 UNIFIED APPROVAL INTERFACE: Both Admin and Branch Admin can see action options if pending */}
                                    {isApprovalView && (finalStatus === 'Pending' || finalStatus === 'PENDING') ? (
                                        <div className="flex justify-center items-center gap-1.5">
                                            <button 
                                                type="button" 
                                                onClick={() => onUpdateStatus('accept', batchCode)} 
                                                className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[9px] uppercase tracking-wide flex items-center gap-1 shadow-sm transition-colors"
                                            >
                                                Accept
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => onUpdateStatus('reject', batchCode)} 
                                                className="h-7 px-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[9px] uppercase tracking-wide flex items-center gap-1 shadow-sm transition-colors"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    ) : (
                                       
                                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-[9px] border font-black uppercase tracking-wider ${
                                            finalStatus === 'Pending' || finalStatus === 'PENDING'
                                                ? 'text-amber-700 bg-amber-50 border-amber-200'
                                                : finalStatus === 'Delivered' || finalStatus === 'DELIVERED' || finalStatus === 'Accepted' || finalStatus === 'ACCEPTED'
                                                ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                                                : 'text-red-700 bg-red-50 border-red-200'
                                        }`}>
                                            {finalStatus === 'Pending' || finalStatus === 'PENDING' ? 'PENDING' : finalStatus === 'Rejected' || finalStatus === 'REJECTED' ? 'REJECTED' : 'DELIVERED'}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default TransitLogsTable;