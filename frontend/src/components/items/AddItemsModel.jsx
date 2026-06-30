import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, RefreshCw, Layers, ShieldAlert } from 'lucide-react';

const AddItemClassModal = ({ isOpen, onClose, userRole, onSuccess }) => {
    const [itemName, setItemName] = useState('');
    const [category, setCategory] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            setItemName('');
            setCategory('');
            setErrorMessage('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // 🔒 LIGHT PRIVILEGE GUARDRAIL SCREEN
    if (userRole !== 'admin') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}></div>
                <div className="relative bg-white border border-red-200 p-6 rounded-2xl max-w-sm text-center shadow-xl z-10 animate-in fade-in zoom-in-95 duration-150">
                    <div className="w-10 h-10 bg-red-50 border border-red-100 text-red-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <ShieldAlert size={20} />
                    </div>
                    <p className="text-sm font-bold text-red-600 uppercase tracking-wide">Privilege Violation</p>
                    <p className="text-xs text-gray-500 mt-2 font-semibold leading-relaxed">
                        Access Denied. Registering brand new hardware model specifications into the global catalog requires master developer administrative clearance.
                    </p>
                    <button onClick={onClose} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all w-full uppercase tracking-wider">
                        Dismiss Warning
                    </button>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!itemName.trim() || !category.trim()) {
            setErrorMessage("Both Item Model Name and Category classifications are mandatory parameters.");
            return;
        }

        try {
            setIsSubmitting(true);
            setErrorMessage('');

            const response = await axios.post('https://inventory-manage-q4yr.onrender.com/api/items/add', {
                itemName: itemName.trim(),
                category: category.trim()
            }, {
                withCredentials: true
            });

            if (response.data.success) {
                onSuccess(); 
                onClose();   
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Operation failed to complete.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Smooth Light Shadow Overlay Backdrop */}
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative bg-white border border-gray-200 w-full max-w-md rounded-2xl shadow-xl p-6 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150 text-xs text-gray-600">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none">
                    <X size={18} />
                </button>

                <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-100">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                        <Layers size={16} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Register Product Class</h3>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">Initialize a new configuration within the master index</p>
                    </div>
                </div>

                {errorMessage && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-2.5 rounded-lg text-center font-bold mb-4">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5 text-left">
                        <label className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Item Model Nomenclature *</label>
                        <input 
                            type="text" 
                            value={itemName} 
                            onChange={(e) => setItemName(e.target.value)} 
                            placeholder="e.g. Dell Latitude 5440" 
                            className="w-full h-10 px-3 bg-white border border-gray-300 text-gray-900 font-bold rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-sm outline-none" 
                            required 
                        />
                    </div>

                    <div className="space-y-1.5 text-left">
                        <label className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Primary Category Assignment *</label>
                        <input 
                            type="text" 
                            value={category} 
                            onChange={(e) => setCategory(e.target.value)} 
                            placeholder="e.g. Laptops" 
                            className="w-full h-10 px-3 bg-white border border-gray-300 text-gray-900 font-bold rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-sm outline-none" 
                            required 
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-lg uppercase tracking-wider text-[10px] transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 uppercase tracking-wider text-[10px] disabled:opacity-50"
                        >
                            {isSubmitting && <RefreshCw className="w-3 h-3 anonymity-spin animate-spin" />}
                            Register Specification
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddItemClassModal;