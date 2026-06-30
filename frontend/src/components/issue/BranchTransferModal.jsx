import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { X, Send, RefreshCw } from 'lucide-react';

const BranchTransferModal = ({ isOpen, onClose, availableItems, availableOffices, onActionSuccess, userRole, currentOfficeId }) => {
    const [itemName, setItemName] = useState('');
    const [qty, setQty] = useState('');
     const [FromOfficeID, setFromOfficeID] = useState('');
    const [ToOfficeID, setToOfficeID] = useState('');
    const [modeOfTransfer, setModeOfTransfer] = useState('Courier');
    const [docketNumber, setDocketNumber] = useState('');
    const [courierName, setCourierName] = useState('');
    const [courierDate, setCourierDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const isSuperAdmin = String(userRole).toLowerCase() === 'admin';

    // 🟢 AUTO-ASSIGN SOURCE OFFICE: If a Branch Admin opens this modal, automatically set their local office ID
    useEffect(() => {
        if (isOpen) {
            if (!isSuperAdmin && currentOfficeId) {
                setFromOfficeID(String(currentOfficeId));
            } else {
                setFromOfficeID('');
            }
            // Clear destination office when modal changes state visibility
            setToOfficeID('');
        }
    }, [isOpen, isSuperAdmin, currentOfficeId]);


    const handleSubmit = async (e) => {
        e.preventDefault();

         const fallbackUser = JSON.parse(localStorage.getItem('user')) || {};
         const finalFromOfficeID = FromOfficeID || fallbackUser.officeId;

         if(!finalFromOfficeID){
            setErrorMsg("Your origin branch terminal session tracking key is missing. Please re login ");
            return ;
         }

        // if (FromOfficeID && ToOfficeID && parseInt(FromOfficeID) === parseInt(ToOfficeID)) {
        //     setErrorMsg("Source and destination branch cannot be the same.");
        //     return;
        // }

    if (ToOfficeID && parseInt(finalFromOfficeID) === parseInt(ToOfficeID)) {
        setErrorMsg("Source and destination branch cannot be the same.");
        return;
    }



        console.log("🚀 FRONTEND SENDING PAYLOAD:", {
        courierName,
        docketNumber,
        modeOfTransfer,
        FromOfficeID :finalFromOfficeID,
        ToOfficeID
    });  


        try {
            setIsSubmitting(true);
            setErrorMsg('');
            const payload = {
                
                issueType: 'branch', 
                itemName, 
                qty: parseInt(qty), 
                FromOfficeID:parseInt(finalFromOfficeID), 
                ToOfficeID: parseInt(ToOfficeID), 
                modeOfTransfer, 
                docketNumber, 
                courierName, 
                courierDate 
            };
            const res = await axios.post('https://inventory-manage-q4yr.onrender.com/api/inventry/issue', payload, { withCredentials: true });
            if (res.data.success) {
                onActionSuccess();
                onClose();
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Branch transfer tracking assignment failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-semibold text-xs text-gray-600 text-left">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150 space-y-4 p-5">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <h3 className="text-sm font-black text-gray-900 uppercase">Dispatch Inter-Branch Freight Cargo</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"><X size={16} /></button>
                </div>

                {errorMsg && <div className="p-3 bg-red-50 border border-red-200 text-red-600 font-bold rounded-xl">{errorMsg}</div>}

                <form onSubmit={handleSubmit} className="space-y-3.5 overflow-y-auto max-h-[75vh] pr-1">
                    <div className="space-y-1.5">
                        <label className="text-gray-500 text-[10px] uppercase block font-bold">Select Product Specification Model *</label>
                        <select value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full h-10 px-3 bg-white border border-gray-300 text-gray-900 font-bold rounded-lg text-xs outline-none" required>
                            <option value="">-- Choose Item Model --</option>
                            {availableItems.map(item => <option key={item.ItemId} value={item.ItemName}>{item.ItemName.toUpperCase()}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-gray-500 text-[10px] uppercase block font-bold">Quantity Pool Count *</label>
                        <input type="number" min="1" placeholder="e.g. 5" value={qty} onChange={(e) => setQty(e.target.value)} className="w-full h-10 px-3 bg-white border border-gray-300 text-gray-900 font-bold rounded-lg text-sm outline-none" required />
                    </div>

                      <div className="space-y-1.5">
                        <label className="text-gray-500 text-[10px] uppercase block font-bold">Source Origin Terminal Hub *</label>

                        {isSuperAdmin ? (
                            <select value={FromOfficeID} onChange={(e) => setFromOfficeID(e.target.value)} className="w-full h-10 px-3 bg-white border border-gray-300 text-gray-900 font-bold rounded-lg text-xs outline-none" required>
                                <option value="">-- Select Sending Branch Depot --</option>
                                {availableOffices.map(off => (
                                    <option key={off.ID || off.id} value={off.ID || off.id}>{off.OfficeName.toUpperCase()}</option>
                                ))}
                            </select>
                        ) : (
                            <div className="w-full h-10 px-3 bg-gray-50 border border-gray-200 text-gray-500 flex items-center font-extrabold rounded-lg text-xs uppercase tracking-wider">
                                {availableOffices.find(off => String(off.ID || off.id) === String(currentOfficeId))?.OfficeName || "Your Mapped Local Branch Warehouse"}
                            </div>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-gray-500 text-[10px] uppercase block font-bold">Target Destination Terminal Hub *</label>
                        <select value={ToOfficeID} onChange={(e) => setToOfficeID(e.target.value)} className="w-full h-10 px-3 bg-white border border-gray-300 text-gray-900 font-bold rounded-lg text-xs outline-none" required>
                            <option value="">-- Select Receiving Branch Depot --</option>
                            {/* {availableOffices.map(off => parseInt(off.ID) !== 1 && <option key={off.ID} value={off.ID}>{off.OfficeName.toUpperCase()}</option>)} */}

                            {availableOffices.map(off => {
                                const officeKeyId = off.ID || off.id;
                                // 🚀 Blocks sending items to the exact same branch
                                if (String(officeKeyId) === String(FromOfficeID)) return null;
                                return (
                                    <option key={officeKeyId} value={officeKeyId}>
                                        {off.OfficeName.toUpperCase()}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-gray-500 text-[10px] uppercase block font-bold">Logistics Mode of Transfer</label>
                        <input type="text" placeholder="e.g. BlueDart Express Air, Blue Line Fleet" value={modeOfTransfer} onChange={(e) => setModeOfTransfer(e.target.value)} className="w-full h-10 px-3 bg-white border border-gray-300 text-gray-900 font-bold rounded-lg text-xs outline-none" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-gray-500 text-[10px] uppercase block font-bold">Courier Carrier Agency Name</label>
                        <input type="text" placeholder="e.g. DHL Logistics India" value={courierName} onChange={(e) => setCourierName(e.target.value)} className="w-full h-10 px-3 bg-white border border-gray-300 text-gray-900 font-bold rounded-lg text-xs outline-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-gray-500 text-[10px] uppercase block font-bold">Docket / Waybill Number</label>
                            <input type="text" placeholder="e.g. DCK873462" value={docketNumber} onChange={(e) => setDocketNumber(e.target.value)} className="w-full h-10 px-3 bg-white border border-gray-300 text-gray-900 font-bold rounded-lg text-xs font-mono outline-none" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-gray-500 text-[10px] uppercase block font-bold">Logistics Shipment Date</label>
                            <input type="date" value={courierDate} onChange={(e) => setCourierDate(e.target.value)} className="w-full h-10 px-3 bg-white border border-gray-300 text-gray-900 font-bold rounded-lg text-xs outline-none" />
                        </div>
                    </div>

                    <button type="submit" disabled={isSubmitting} className="w-full h-10 bg-gray-900 hover:bg-black text-white font-bold rounded-lg flex items-center justify-center gap-2 uppercase text-[10px] tracking-wider transition-colors disabled:opacity-50 mt-1">
                        {isSubmitting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send size={12} />} Launch Inter-Branch Transit
                    </button>
                </form>
            </div>
        </div>
    );
};

export default BranchTransferModal;