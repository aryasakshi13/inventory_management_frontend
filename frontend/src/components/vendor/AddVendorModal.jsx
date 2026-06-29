// 📄 Path: src/pages/admin/modules/AddVendorModal.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { X, Truck } from 'lucide-react';

const AddVendorModal = ({ isOpen, onClose, onActionSuccess }) => {
    const [formData, setFormData] = useState({
        VendorName: '',
        GSTNumber: '',
        ContactPerson: '',
        ContactNumber: '',
        EmailId: '',
        VendorAddress: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.VendorName.trim() || !formData.GSTNumber.trim()) {
            setError('Vendor Name and GST Number are strict required fields.');
            return;
        }

        try {
            setIsSubmitting(true);
            const res = await axios.post('http://localhost:5001/api/vendor', formData, { withCredentials: true });
            if (res.data.success) {
                onActionSuccess();
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failure deploying vendor profile node data entry.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100">
                {/* Modal Header */}
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Truck size={16} className="text-blue-500" />
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Log New Supplier Node</h3>
                            <p className="text-[10px] text-gray-400 mt-0.5">Log global inventory supply nodes into master database registry</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Form Elements */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-left">
                    {error && <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 font-semibold text-[11px]">{error}</div>}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-bold uppercase text-gray-500 text-[10px] mb-1">Vendor Entity Name *</label>
                            <input type="text" name="VendorName" value={formData.VendorName} onChange={handleChange} required placeholder="e.g. Namami Infotech" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                        </div>
                        <div>
                            <label className="block font-bold uppercase text-gray-500 text-[10px] mb-1">GST Identification Number *</label>
                            <input type="text" name="GSTNumber" value={formData.GSTNumber} onChange={handleChange} required placeholder="e.g. 07AAAAA1111A1Z1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-gray-800" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-bold uppercase text-gray-500 text-[10px] mb-1">Primary Contact Person</label>
                            <input type="text" name="ContactPerson" value={formData.ContactPerson} onChange={handleChange} placeholder="Full Name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block font-bold uppercase text-gray-500 text-[10px] mb-1">Contact Phone Number</label>
                            <input type="text" name="ContactNumber" value={formData.ContactNumber} onChange={handleChange} placeholder="Mobile/Landline" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                        </div>
                    </div>

                    <div>
                        <label className="block font-bold uppercase text-gray-500 text-[10px] mb-1">Email Correspondence Address</label>
                        <input type="email" name="EmailId" value={formData.EmailId} onChange={handleChange} placeholder="supplier@domain.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                        <label className="block font-bold uppercase text-gray-500 text-[10px] mb-1">Corporate Physical Address</label>
                        <textarea name="VendorAddress" value={formData.VendorAddress} onChange={handleChange} rows="2" placeholder="Full head office address location..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                    </div>

                    {/* Footer Trigger Operations */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
                        <button type="button" onClick={onClose} className="h-9 px-4 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold rounded-xl text-[10px] uppercase tracking-wider transition-colors">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="h-9 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition-colors shadow-md shadow-blue-600/10">
                            {isSubmitting ? 'Registering...' : 'Log Vendor Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddVendorModal;