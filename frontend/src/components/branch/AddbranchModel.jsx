import React, { useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';



const AddBranchModal = ({ isOpen, onClose, employees = [], onActionSuccess }) => {
    const [formData, setFormData] = useState({
        OfficeCode: '',
        OfficeName: '',
        OfficeAddress: '',
        AdminEmpId: '',
        AdminName: '',
        AdminMail: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // const [searchOffice, setSearchOffice] = useState("");

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

      const handleAdminSelectionChange = (e) => {
    const targetedEmpId = e.target.value;

    if (!targetedEmpId) {
        setFormData({
            ...formData,
            AdminEmpId: '',
            AdminName: '',
            AdminMail: ''
        });
        return;
    }

     const matchedProfile = employees.find(emp => String(emp.EmpId) === String(targetedEmpId));

     setFormData({
        ...formData,
        AdminEmpId: targetedEmpId,
        AdminName: matchedProfile ? (matchedProfile.Name || '') : '',
        AdminMail: matchedProfile ? (matchedProfile.Mail || '') : ''
    });
};

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.OfficeCode.trim() || !formData.OfficeName.trim()) {
            setError('Office Code and Office Name are required.');
            return;
        }

        try {
            setIsSubmitting(true);

             const baseUrl = window.location.hostname === 'localhost'
                  ? 'http://localhost:5001'                     // 💻 Local testing ke liye (Aapka backend port)
                   : 'https://inventory-manage-q4yr.onrender.com';


            const res = await axios.post(
                `${baseUrl}/api/branch/offices`,
                formData,
                { withCredentials: true }
            );

            if (res.data.success) {
                onActionSuccess();
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to register branch.');
        } finally {
            setIsSubmitting(false);
        }
    };

//     console.log("Employees:", employees);
//    console.log("Employees Count:", employees?.length);


    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Add New Branch</h3>
                        <p className="text-[10px] text-gray-400 mt-0.5">Register a new office location in the system directory</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
                    {error && (
                        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 font-semibold text-[11px]">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-bold uppercase text-gray-500 text-[10px] mb-1">Office Code *</label>
                            <input
                                type="text"
                                name="OfficeCode"
                                value={formData.OfficeCode}
                                onChange={handleChange}
                                placeholder="e.g. DEL-02"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block font-bold uppercase text-gray-500 text-[10px] mb-1">Office Name *</label>
                            <input
                                type="text"
                                name="OfficeName"
                                value={formData.OfficeName}       
                                onChange={handleChange}
                                placeholder="e.g. Delhi Branch Office"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block font-bold uppercase text-gray-500 text-[10px] mb-1">Office Address</label>
                        <input
                            type="text"
                            name="OfficeAddress"
                            value={formData.OfficeAddress}
                            onChange={handleChange}
                            placeholder="Full address"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                         
                         

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-bold uppercase text-gray-500 text-[10px] mb-1">Admin Emp ID</label>
                            {/* <input
                                type="text"
                                name="AdminEmpId"
                                value={formData.AdminEmpId}
                                onChange={handleChange}
                                placeholder="Optional"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            /> */}

                                <select
                                    name="AdminEmpId"
                                    value={formData.AdminEmpId}
                                    onChange={handleAdminSelectionChange}
                                    className="w-full border border-gray-200 bg-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700"
                                >
                                    <option value="">-- Select Registered Admin --</option>
                                    
 
                                   {employees && employees.length > 0 ? (
                                        employees.map((emp) => {
                                            // Safe profile object parameter evaluation
                                            const currentEmpId = emp.EmpId || emp.empId || emp.ID || emp.id;
                                            const currentEmpName = emp.Name || emp.name;
 
                                            
                                            return (
                                                <option key={currentEmpId} value={currentEmpId}>
                                                    {currentEmpId} - {currentEmpName}
                                                </option>
                                            );
                                        })
                                    ) : (
                                        <option disabled>No employees loaded...</option>
                               )}
                                </select>
                        </div>
                        <div>
                            <label className="block font-bold uppercase text-gray-500 text-[10px] mb-1">Admin Name</label>
                            <input
                                type="text"
                                name="AdminName"
                                value={formData.AdminName}
                                disabled
                                // onChange={handleChange}
                                 
                                // placeholder="Optional"
                                placeholder="Auto-Populated"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />



                        </div>
                    </div>

                    <div>
                        <label className="block font-bold uppercase text-gray-500 text-[10px] mb-1">Admin Email</label>
                        <input
                            type="email"
                            name="AdminMail"
                            value={formData.AdminMail}
                            // onChange={handleChange}
                            disabled
                            placeholder="Auto-Populated"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-9 px-4 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold rounded-xl text-[10px] uppercase tracking-wider transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-9 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition-colors"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Branch'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddBranchModal;