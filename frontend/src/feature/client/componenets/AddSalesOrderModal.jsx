// // src/features/sales/components/AddSalesOrderModal.jsx

// import React, { useState, useEffect } from 'react';
// import { X, Plus, Trash2, Upload, CheckCircle2, Building2, Loader2, FileSpreadsheet, UserCheck } from 'lucide-react';
// import { uploadImageApi } from '../../../services/uploadService';
// import { getProjectIncharges } from '../services/salesOrderService';
// import * as XLSX from 'xlsx';

// export const AddSalesOrderModal = ({
//   isOpen,
//   onClose,
//   client = null, // If passed, locks the form to this specific client
//   clients = [],  // List of all clients for global selection
//   onSubmit,
// }) => {
//   // Mode detection
//   const isClientLocked = Boolean(client && client.id);

//   // Project Incharge State
//   const [projectIncharges, setProjectIncharges] = useState([]);
//   const [selectedProjectIncharge, setSelectedProjectIncharge] = useState('');
//   const [loadingIncharges, setLoadingIncharges] = useState(false);

//   // Client Details State
//   const [selectedClientId, setSelectedClientId] = useState('');
//   const [selectedClientData, setSelectedClientData] = useState(null);
//   const [gstIn, setgstIn] = useState('');
//   const [billingAddress, setBillingAddress] = useState('');

//   // Order Specific Fields
//   const [poNumber, setPoNumber] = useState('');
//   const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
//   const [poCopy, setPoCopy] = useState(null);
//   const [poCopyUrl, setPoCopyUrl] = useState('');
//   const [uploading, setUploading] = useState(false);
//   const [shippingAddress, setShippingAddress] = useState('');
//   const [sameAsBilling, setSameAsBilling] = useState(false);

//   const [clientSearch, setClientSearch] = useState("");
//   const [showDropdown, setShowDropdown] = useState(false);

//   // Fetch Project Incharges (where role == project incharge)
//   useEffect(() => {
//     const fetchIncharges = async () => {
//       try {
//         setLoadingIncharges(true);
//         const res = await getProjectIncharges();
//         if (res && res.success && Array.isArray(res.data)) {
//           setProjectIncharges(res.data);
//         } else if (Array.isArray(res)) {
//           setProjectIncharges(res);
//         }
//       } catch (err) {
//         console.error("Failed to fetch project incharges:", err);
//       } finally {
//         setLoadingIncharges(false);
//       }
//     };

//     if (isOpen) {
//       fetchIncharges();
//     }
//   }, [isOpen]);

//   // Dynamic Multi-Item Array
//   const [items, setItems] = useState([
//     { id: Date.now(), productName: '', brandName: '', capacity: '', qty: 1 }
//   ]);


//   console.log("Billing Address:", billingAddress);
//   console.log("Shipping Address:", shippingAddress);
//   console.log("Same As Billing:", sameAsBilling);

//   // Handle Client Initialization & Switching
//   useEffect(() => {
//     if (isClientLocked) {
//       console.log(client);
//       setSelectedClientId(client.id);
//       setSelectedClientData(client);
//       setgstIn(client.gstIn || '');
//       setBillingAddress(client.billingAddress || client.Address || '');
//     } else if (selectedClientId) {
//       const found = clients.find((c) => c.id === selectedClientId);
//       if (found) {
//         setSelectedClientData(found);
//         setgstIn(found.gstIn || '');
//         setBillingAddress(found.billingAddress || found.Address || '');
//       }
//     } else {
//       setSelectedClientData(null);
//       setgstIn('');
//       setBillingAddress('');
//     }
//   }, [client, selectedClientId, isClientLocked, clients]);

//   // Sync Shipping Address with Billing Address if toggle is checked
//   useEffect(() => {
//     if (sameAsBilling) {
//       setShippingAddress(billingAddress);
//     }
//   }, [sameAsBilling, billingAddress]);

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (showDropdown && !e.target.closest('.client-dropdown')) {
//         setShowDropdown(false);
//       }
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, [showDropdown]);

//   if (!isOpen) return null;

//   const filteredClients = clients.filter((client) =>
//     client.companyName.toLowerCase().includes(clientSearch.toLowerCase())
//   );

//   // Add / Remove Row Handlers
//   const handleAddItemRow = () => {
//     setItems([...items, { id: Date.now() + Math.random(), productName: '', brandName: '', capacity: '', qty: 1 }]);
//   };

//   const handleRemoveItemRow = (id) => {
//     if (items.length === 1) return;
//     setItems(items.filter((item) => item.id !== id));
//   };

//   const handleItemChange = (id, field, value) => {
//     setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
//   };


//   // ===============================
//   // BULK CSV / EXCEL UPLOAD
//   // ===============================
//   const handleBulkUpload = async (e) => {
//     const file = e.target.files?.[0];

//     if (!file) return;

//     try {
//       const fileName = file.name.toLowerCase();

//       // Allow only CSV / Excel
//       if (
//         !fileName.endsWith('.csv') &&
//         !fileName.endsWith('.xlsx') &&
//         !fileName.endsWith('.xls')
//       ) {
//         alert('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
//         e.target.value = '';
//         return;
//       }

//       const buffer = await file.arrayBuffer();

//       const workbook = XLSX.read(buffer, {
//         type: 'array'
//       });

//       // Get first sheet
//       const firstSheetName = workbook.SheetNames[0];

//       if (!firstSheetName) {
//         alert('No worksheet found in the uploaded file.');
//         e.target.value = '';
//         return;
//       }

//       const worksheet = workbook.Sheets[firstSheetName];

//       // Convert Excel/CSV data to JSON
//       const rawData = XLSX.utils.sheet_to_json(worksheet, {
//         defval: ''
//       });

//       if (!rawData.length) {
//         alert('The uploaded file is empty.');
//         e.target.value = '';
//         return;
//       }

//       console.log('Bulk Upload Raw Data:', rawData);

//       // Convert uploaded rows to your item structure
//       const uploadedItems = rawData
//         .map((row, index) => {
//           const productName =
//             row['Product Name'] ??
//             row['product name'] ??
//             row.productName ??
//             row.ProductName ??
//             row.name ??
//             row.Name ??
//             '';

//           const brandName =
//             row['Brand Name'] ??
//             row['brand name'] ??
//             row.brandName ??
//             row.BrandName ??
//             row.brand ??
//             row.Brand ??
//             '';

//           const capacity =
//             row.capacity ??
//             row.Capacity ??
//             row['Capacity'] ??
//             row['capacity'] ??
//             '';

//           const qty =
//             row.qty ??
//             row.Qty ??
//             row.QTY ??
//             row.Quantity ??
//             row.quantity ??
//             0;

//           return {
//             id: Date.now() + Math.random() + index,
//             productName: String(productName).trim(),
//             brandName: String(brandName).trim(),
//             capacity: String(capacity).trim(),
//             qty: Number(qty) || 0
//           };
//         })
//         .filter((item) => item.productName);

//       if (!uploadedItems.length) {
//         alert(
//           'No valid items found. Please make sure your file contains Product Name, Brand Name, Capacity and Qty columns.'
//         );

//         e.target.value = '';
//         return;
//       }

//       // Replace existing rows with uploaded rows
//       setItems(uploadedItems);

//       console.log('Bulk Upload Converted Items:', uploadedItems);

//       alert(`${uploadedItems.length} item(s) uploaded successfully.`);
//     } catch (error) {
//       console.error('Bulk upload failed:', error);

//       alert(
//         'Failed to read the file. Please make sure it is a valid CSV or Excel file.'
//       );
//     } finally {
//       // Allow user to upload the same file again
//       e.target.value = '';
//     }
//   };

  
//   const handlePoCopyChange = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     setPoCopy(file);

//     try {
//       setUploading(true);
//       const res = await uploadImageApi(file, 'sales');
//       if (res && res.url) {
//         setPoCopyUrl(res.url);
//       }
//     } catch (err) {
//       console.error('PO Copy upload failed:', err);
//     } finally {
//       setUploading(false);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     let finalPoCopyUrl = poCopyUrl;

//     if (!finalPoCopyUrl && poCopy && typeof poCopy !== 'string') {
//       try {
//         setUploading(true);
//         const res = await uploadImageApi(poCopy, 'sales');
//         if (res && res.url) {
//           finalPoCopyUrl = res.url;
//         }
//       } catch (err) {
//         console.error('PO Copy upload error on submit:', err);
//       } finally {
//         setUploading(false);
//       }
//     }


//     const formData = new FormData();
//     formData.append(
//       "clientId",
//       selectedClientData?.id || selectedClientId
//     );
//     formData.append(
//       "projectIncharge",
//       selectedProjectIncharge
//     );
//     formData.append(
//       "poNumber",
//       poNumber
//     );
//     formData.append(
//       "poDate",
//       poDate
//     );
//     formData.append(
//       "shippingAddress",
//       shippingAddress
//     );

//     // Send poCopy URL or File
//     if (finalPoCopyUrl) {
//       formData.append("poCopy", finalPoCopyUrl);
//     } else if (poCopy) {
//       formData.append("poCopy", poCopy);
//     }

//     formData.append(
//       "items",
//       JSON.stringify(items)
//     );

//     onSubmit(formData);
//     onClose();
//   };

//   return (
//     <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
//       <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100">

//         {/* Modal Header */}
//         <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/80">
//           <div>
//             <h2 className="text-base font-bold text-gray-900">Create New Sales Order</h2>
//             <p className="text-xs text-gray-500">
//               {isClientLocked
//                 ? `Adding order for ${client.name}`
//                 : 'Select client and fill order details'}
//             </p>
//           </div>
//           <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200/60 transition">
//             <X size={18} />
//           </button>
//         </div>

//         {/* Modal Form Body */}
//         <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">

//           {/* Section 0: Project Incharge Selection (Placed First) */}
//           <div className="bg-blue-50/60 p-4 border border-blue-200 rounded-xl space-y-2 shadow-xs">
//             <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
//               <UserCheck size={16} className="text-blue-600" />
//               <span>Choose Project Incharge *</span>
//             </div>
//             <select
//               value={selectedProjectIncharge}
//               onChange={(e) => setSelectedProjectIncharge(e.target.value)}
//               required
//               className="w-full p-2.5 border border-blue-300 text-black font-medium rounded-lg bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
//             >
//               <option value="">-- Choose Project Incharge --</option>
//               {loadingIncharges ? (
//                 <option value="" disabled>Loading Project Incharges...</option>
//               ) : (
//                 projectIncharges.map((emp) => (
//                   <option key={emp.EmpId || emp.ID || emp.Name} value={emp.Name}>
//                     {emp.Name} {emp.EmpId ? `(${emp.EmpId})` : ''} {emp.OfficeName ? `- ${emp.OfficeName}` : ''}
//                   </option>
//                 ))
//               )}
//             </select>
//           </div>

//           {/* Section 1: Client Selection & Information */}
//           <div className="bg-gray-50/70 p-4 border border-gray-200 rounded-xl space-y-4">
//             <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
//               <Building2 size={15} className="text-blue-600" />
//               <span>Client Details</span>
//             </div>

//             {isClientLocked ? (
//               /* Locked Client Summary View */
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-3.5 border border-gray-200 rounded-lg">
//                 <div>
//                   <span className="text-[10px] font-semibold text-gray-400 uppercase block">Client Name</span>
//                   <span className="text-xs font-bold text-gray-900">{client.name}</span>
//                 </div>
//                 <div>
//                   <span className="text-[10px] font-semibold text-gray-400 uppercase block">GST Number</span>
//                   <span className="text-xs font-mono text-gray-800">{gstIn || 'N/A'}</span>
//                 </div>
//                 <div>
//                   <span className="text-[10px] font-semibold text-gray-400 uppercase block">Billing Address</span>
//                   <span className="text-xs text-gray-700 truncate block" title={billingAddress}>{billingAddress || 'N/A'}</span>
//                 </div>
//               </div>
//             ) : (

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div className="relative client-dropdown">
//                   <label className="block font-semibold text-gray-700 mb-1">Select Client *</label>
//                   <button
//                     type="button"
//                     onClick={() => setShowDropdown(!showDropdown)}
//                     className="w-full p-2.5 border text-black border-gray-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-blue-500 flex justify-between items-center"
//                   >
//                     <span className={selectedClientData ? 'text-black' : 'text-gray-400'}>
//                       {selectedClientData ? selectedClientData.companyName : '-- Choose Client --'}
//                     </span>
//                     <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//                     </svg>
//                   </button>

//                   {showDropdown && (
//                     <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
//                       <input
//                         type="text"
//                         value={clientSearch}
//                         onChange={(e) => setClientSearch(e.target.value)}
//                         placeholder="Search client..."
//                         autoFocus
//                         className="w-full p-2 border-b border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
//                       />
//                       <ul className="max-h-44 overflow-y-auto">
//                         {filteredClients.length > 0 ? (
//                           filteredClients.map((c) => (
//                             <li key={c.id}>
//                               <button
//                                 type="button"
//                                 onClick={() => {
//                                   setSelectedClientId(c.id);
//                                   setSelectedClientData(c);
//                                   setShowDropdown(false);
//                                   setClientSearch('');
//                                 }}
//                                 className={`w-full text-left px-3 py-2 text-xs hover:bg-blue-50 ${selectedClientId === c.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-800'
//                                   }`}
//                               >
//                                 {c.companyName}
//                               </button>
//                             </li>
//                           ))
//                         ) : (
//                           <li className="px-3 py-2 text-xs text-gray-400">No clients found</li>
//                         )}
//                       </ul>
//                     </div>
//                   )}
//                 </div>

//                 {/* GST Number */}
//                 <div>
//                   <label className="block font-semibold text-gray-700 mb-1">GST Number</label>
//                   <input
//                     type="text"
//                     value={gstIn}
//                     onChange={(e) => setgstIn(e.target.value)}
//                     placeholder="e.g. 07AAAAA0000A1Z5"
//                     className="w-full p-2.5 text-black border border-gray-300 rounded-lg bg-white text-xs font-mono uppercase"
//                   />
//                 </div>

//                 {/* Billing Address */}
//                 <div>
//                   <label className="block font-semibold text-black text-gray-700 mb-1">Billing Address</label>
//                   <input
//                     type="text"
//                     value={billingAddress}
//                     onChange={(e) => setBillingAddress(e.target.value)}
//                     placeholder="Enter billing address"
//                     className="w-full p-2.5 text-black border border-gray-300 rounded-lg bg-white text-xs"
//                   />
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Section 2: Order Metadata & PO Information */}
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//             {/* PO Number */}
//             <div>
//               <label className="block font-semibold text-gray-700 mb-1">PO Number *</label>
//               <input
//                 type="text"
//                 placeholder="e.g. PO-99823"
//                 value={poNumber}
//                 onChange={(e) => setPoNumber(e.target.value)}
//                 required
//                 className="w-full text-black p-2.5 border border-gray-300 rounded-lg text-xs"
//               />
//             </div>

//             {/* PO Date */}
//             <div>
//               <label className="block font-semibold text-gray-700 mb-1">PO Date *</label>
//               <input
//                 type="date"
//                 value={poDate}
//                 onChange={(e) => setPoDate(e.target.value)}
//                 required
//                 className="w-full text-black p-2.5 border border-gray-300 rounded-lg text-xs"
//               />
//             </div>

//             {/* PO Copy File Upload */}
//             <div className="md:col-span-2">
//               <label className="block font-semibold text-gray-700 mb-1">Upload PO Copy (PDF / Image)</label>
//               <label className="flex items-center justify-center gap-2 p-2 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-lg cursor-pointer bg-gray-50 hover:bg-blue-50/30 transition text-xs text-gray-600">
//                 {uploading ? (
//                   <Loader2 size={14} className="animate-spin text-blue-600" />
//                 ) : (
//                   <Upload size={14} className="text-gray-500" />
//                 )}
//                 <span className="truncate max-w-[200px]">
//                   {uploading
//                     ? 'Uploading image...'
//                     : poCopyUrl
//                       ? 'PO Image Uploaded'
//                       : poCopy
//                         ? poCopy.name
//                         : 'Choose PO document...'}
//                 </span>
//                 <input
//                   type="file"
//                   accept=".pdf,.png,.jpg,.jpeg,image/*"
//                   onChange={handlePoCopyChange}
//                   className="hidden"
//                 />
//               </label>
//               {poCopyUrl && (
//                 <a
//                   href={poCopyUrl}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="text-xs text-blue-600 underline mt-1 block truncate"
//                 >
//                   View Uploaded PO Document
//                 </a>
//               )}
//             </div>
//           </div>

//           {/* Section 3: Shipping Address */}
//           <div>
//             <div className="flex justify-between items-center mb-1">
//               <label className="block font-semibold text-gray-700">Shipping Address *</label>
//               <label className="flex items-center gap-1.5 text-xs text-blue-600 font-medium cursor-pointer">

//                 <input
//                   type="checkbox"
//                   checked={sameAsBilling}
//                   onChange={(e) => {
//                     const checked = e.target.checked;

//                     setSameAsBilling(checked);

//                     if (checked) {
//                       setShippingAddress(billingAddress);
//                     } else {
//                       setShippingAddress("");
//                     }
//                   }}
//                 />
//                 Same as Billing Address
//               </label>
//             </div>
//             <textarea
//               rows="2"
//               placeholder="Enter delivery address..."
//               value={shippingAddress}
//               disabled={sameAsBilling}
//               onChange={(e) => {
//                 setShippingAddress(e.target.value)

//                 if (sameAsBilling) {
//                   setSameAsBilling(false);
//                 }

//               }}

//               required
//               className="w-full text-black p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
//             ></textarea>
//           </div>

//           {/* Section 4: Dynamic Multi-Item Line Items */}
//           <div className="space-y-3">
            

//             <div className="flex justify-between items-center">
//               <div>
//                 <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
//                   Line Items
//                 </h3>

//                 <p className="text-[11px] text-gray-500">
//                   Add product items and set quantity & prices.
//                 </p>
//               </div>

//               <div className="flex items-center gap-2">

//                 {/* =========================
//                           BULK UPLOAD
//                       ========================== */}
//                 <label
//                   htmlFor="bulk-item-upload"
//                   className="flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
//                 >
//                   <FileSpreadsheet size={14} />

//                   Bulk Upload

//                   <input
//                     id="bulk-item-upload"
//                     type="file"
//                     accept=".csv,.xlsx,.xls"
//                     onChange={handleBulkUpload}
//                     className="hidden"
//                   />
//                 </label>

//                 {/* =========================
//                         ADD ITEM ROW
//                     ========================== */}
//                 <button
//                   type="button"
//                   onClick={handleAddItemRow}
//                   className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg transition"
//                 >
//                   <Plus size={14} />

//                   Add Item Row
//                 </button>

//               </div>
//             </div>



//             {/* Item Table Header */}
//             <div className="grid grid-cols-12 gap-3 text-gray-500 font-semibold px-1 text-[11px] uppercase">
//               <span className="col-span-4">Product Name *</span>
//               <span className="col-span-3">Brand Name *</span>
//               <span className="col-span-3">Capacity *</span>
//               <span className="col-span-1 text-center">Qty *</span>
             
//               <span className="col-span-1 text-center">Action</span>
//             </div>

//             {/* Item Rows */}
//             <div className="space-y-2">
//               {items.map((item, index) => {
//                 return (
//                   <div key={item.id} className="grid grid-cols-12 gap-3 items-center bg-gray-50 p-2.5 rounded-lg border border-gray-200">
//                     {/* Product Name */}
//                     <div className="col-span-4">
//                       <input
//                         type="text"
//                         placeholder={`Product #${index + 1} Name`}
//                         value={item.productName || item.name || ''}
//                         onChange={(e) => handleItemChange(item.id, 'productName', e.target.value)}
//                         required
//                         className="w-full text-black p-2 border border-gray-300 rounded-md text-xs bg-white"
//                       />
//                     </div>

//                     {/* Brand Name */}
//                     <div className="col-span-3">
//                       <input
//                         type="text"
//                         placeholder="Brand Name"
//                         value={item.brandName || ''}
//                         onChange={(e) => handleItemChange(item.id, 'brandName', e.target.value)}
//                         required
//                         className="w-full text-black p-2 border border-gray-300 rounded-md text-xs bg-white"
//                       />
//                     </div>

//                     {/* Capacity */}
//                     <div className="col-span-3">
//                       <input
//                         type="text"
//                         placeholder="Capacity (e.g. 30 KVA, 30 Ton)"
//                         value={item.capacity || ''}
//                         onChange={(e) => handleItemChange(item.id, 'capacity', e.target.value)}
//                         required
//                         className="w-full text-black p-2 border border-gray-300 rounded-md text-xs bg-white"
//                       />
//                     </div>

//                     {/* Qty */}
//                     <div className="col-span-1">
//                       <input
//                         type="number"
//                         min="1"
//                         value={item.qty}
//                         onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
//                         required
//                         className="w-full text-black p-2 border border-gray-300 rounded-md text-xs text-center bg-white"
//                       />
//                     </div>

                  

//                     {/* Remove Action */}
//                     <div className="col-span-1 flex justify-center">
//                       <button
//                         type="button"
//                         onClick={() => handleRemoveItemRow(item.id)}
//                         disabled={items.length === 1}
//                         className={`p-1.5 rounded-md ${items.length === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:bg-red-50'
//                           }`}
//                       >
//                         <Trash2 size={14} />
//                       </button>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>


//           {/* Footer Actions */}
//           <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-semibold text-xs transition"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-xs shadow-xs transition"
//             >
//               <CheckCircle2 size={15} /> Save Sales Order
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };




// src/features/sales/components/AddSalesOrderModal.jsx

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload, CheckCircle2, Building2, Loader2, FileSpreadsheet, UserCheck, Wrench, Calendar, MapPin } from 'lucide-react';
import { uploadImageApi } from '../../../services/uploadService';
import { getProjectIncharges } from '../services/salesOrderService';
import * as XLSX from 'xlsx';

export const AddSalesOrderModal = ({
  isOpen,
  onClose,
  client = null, // If passed, locks the form to this specific client
  clients = [],  // List of all clients for global selection
  onSubmit,
}) => {
  // Mode detection
  const isClientLocked = Boolean(client && client.id);

  // Project Incharge State
  const [projectIncharges, setProjectIncharges] = useState([]);
  const [selectedProjectIncharge, setSelectedProjectIncharge] = useState('');
  const [loadingIncharges, setLoadingIncharges] = useState(false);

  // Client Details State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedClientData, setSelectedClientData] = useState(null);
  const [gstIn, setgstIn] = useState('');
  const [billingAddress, setBillingAddress] = useState('');

  // Order Specific Fields
  const [poNumber, setPoNumber] = useState('');
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [poCopy, setPoCopy] = useState(null);
  const [poCopyUrl, setPoCopyUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // New Project & Site Fields
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('On-Grid');
  const [siteContactPerson, setSiteContactPerson] = useState('');
  const [siteContactNumber, setSiteContactNumber] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [remarks, setRemarks] = useState('');

  // Delivery & Logistics
  const [shippingAddress, setShippingAddress] = useState('');
  const [sameAsBilling, setSameAsBilling] = useState(false);

  const [clientSearch, setClientSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch Project Incharges (where role == project incharge)
  useEffect(() => {
    const fetchIncharges = async () => {
      try {
        setLoadingIncharges(true);
        const res = await getProjectIncharges();
        if (res && res.success && Array.isArray(res.data)) {
          setProjectIncharges(res.data);
        } else if (Array.isArray(res)) {
          setProjectIncharges(res);
        }
      } catch (err) {
        console.error("Failed to fetch project incharges:", err);
      } finally {
        setLoadingIncharges(false);
      }
    };

    if (isOpen) {
      fetchIncharges();
    }
  }, [isOpen]);

  // Dynamic Multi-Item Array
  const [items, setItems] = useState([
    { id: Date.now(), productName: '', brandName: '', capacity: '', qty: 1 }
  ]);

  // Handle Client Initialization & Switching
  useEffect(() => {
    if (isClientLocked) {
      setSelectedClientId(client.id);
      setSelectedClientData(client);
      setgstIn(client.gstIn || '');
      setBillingAddress(client.billingAddress || client.Address || '');
    } else if (selectedClientId) {
      const found = clients.find((c) => c.id === selectedClientId);
      if (found) {
        setSelectedClientData(found);
        setgstIn(found.gstIn || '');
        setBillingAddress(found.billingAddress || found.Address || '');
      }
    } else {
      setSelectedClientData(null);
      setgstIn('');
      setBillingAddress('');
    }
  }, [client, selectedClientId, isClientLocked, clients]);

  // Sync Shipping Address with Billing Address if toggle is checked
  useEffect(() => {
    if (sameAsBilling) {
      setShippingAddress(billingAddress);
    }
  }, [sameAsBilling, billingAddress]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showDropdown && !e.target.closest('.client-dropdown')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  if (!isOpen) return null;

  const filteredClients = clients.filter((client) =>
    client.companyName.toLowerCase().includes(clientSearch.toLowerCase())
  );

  // Add / Remove Row Handlers
  const handleAddItemRow = () => {
    setItems([...items, { id: Date.now() + Math.random(), productName: '', brandName: '', capacity: '', qty: 1 }]);
  };

  const handleRemoveItemRow = (id) => {
    if (items.length === 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  // ===============================
  // BULK CSV / EXCEL UPLOAD
  // ===============================
  const handleBulkUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileName = file.name.toLowerCase();

      if (
        !fileName.endsWith('.csv') &&
        !fileName.endsWith('.xlsx') &&
        !fileName.endsWith('.xls')
      ) {
        alert('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
        e.target.value = '';
        return;
      }

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        alert('No worksheet found in the uploaded file.');
        e.target.value = '';
        return;
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!rawData.length) {
        alert('The uploaded file is empty.');
        e.target.value = '';
        return;
      }

      const uploadedItems = rawData
        .map((row, index) => {
          const productName =
            row['Product Name'] ?? row['product name'] ?? row.productName ?? row.ProductName ?? row.name ?? row.Name ?? '';
          const brandName =
            row['Brand Name'] ?? row['brand name'] ?? row.brandName ?? row.BrandName ?? row.brand ?? row.Brand ?? '';
          const capacity =
            row.capacity ?? row.Capacity ?? row['Capacity'] ?? row['capacity'] ?? '';
          const qty =
            row.qty ?? row.Qty ?? row.QTY ?? row.Quantity ?? row.quantity ?? 0;

          return {
            id: Date.now() + Math.random() + index,
            productName: String(productName).trim(),
            brandName: String(brandName).trim(),
            capacity: String(capacity).trim(),
            qty: Number(qty) || 0
          };
        })
        .filter((item) => item.productName);

      if (!uploadedItems.length) {
        alert('No valid items found. Please make sure your file contains Product Name, Brand Name, Capacity and Qty columns.');
        e.target.value = '';
        return;
      }

      setItems(uploadedItems);
      alert(`${uploadedItems.length} item(s) uploaded successfully.`);
    } catch (error) {
      console.error('Bulk upload failed:', error);
      alert('Failed to read the file. Please make sure it is a valid CSV or Excel file.');
    } finally {
      e.target.value = '';
    }
  };

  const handlePoCopyChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPoCopy(file);

    try {
      setUploading(true);
      const res = await uploadImageApi(file, 'sales');
      if (res && res.url) {
        setPoCopyUrl(res.url);
      }
    } catch (err) {
      console.error('PO Copy upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let finalPoCopyUrl = poCopyUrl;

    if (!finalPoCopyUrl && poCopy && typeof poCopy !== 'string') {
      try {
        setUploading(true);
        const res = await uploadImageApi(poCopy, 'sales');
        if (res && res.url) {
          finalPoCopyUrl = res.url;
        }
      } catch (err) {
        console.error('PO Copy upload error on submit:', err);
      } finally {
        setUploading(false);
      }
    }

    const formData = new FormData();
    formData.append("clientId", selectedClientData?.id || selectedClientId);
    formData.append("projectIncharge", selectedProjectIncharge);
    formData.append("poNumber", poNumber);
    formData.append("poDate", poDate);
    
    // Append Newly Added Requirements
    formData.append("projectName", projectName);
    formData.append("projectType", projectType);
    formData.append("siteContactPerson", siteContactPerson);
    formData.append("siteContactNumber", siteContactNumber);
    formData.append("expectedDeliveryDate", expectedDeliveryDate);
    formData.append("remarks", remarks);
    formData.append("shippingAddress", shippingAddress);

    if (finalPoCopyUrl) {
      formData.append("poCopy", finalPoCopyUrl);
    } else if (poCopy) {
      formData.append("poCopy", poCopy);
    }

    formData.append("items", JSON.stringify(items));

    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100">

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/80">
          <div>
            <h2 className="text-base font-bold text-gray-900">Create New Sales Order</h2>
            <p className="text-xs text-gray-500">
              {isClientLocked
                ? `Adding order for ${client.name}`
                : 'Select client and fill order details'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200/60 transition">
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">

          {/* Section 0: Project Incharge / Engineer Selection */}
          <div className="bg-blue-50/60 p-4 border border-blue-200 rounded-xl space-y-2 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
              <UserCheck size={16} className="text-blue-600" />
              <span>Choose Project Incharge / Engineer *</span>
            </div>
            <select
              value={selectedProjectIncharge}
              onChange={(e) => setSelectedProjectIncharge(e.target.value)}
              required
              className="w-full p-2.5 border border-blue-300 text-black font-medium rounded-lg bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">-- Choose Project Incharge --</option>
              {loadingIncharges ? (
                <option value="" disabled>Loading Project Incharges...</option>
              ) : (
                projectIncharges.map((emp) => (
                  <option key={emp.EmpId || emp.ID || emp.Name} value={emp.Name}>
                    {emp.Name} {emp.EmpId ? `(${emp.EmpId})` : ''} {emp.OfficeName ? `- ${emp.OfficeName}` : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Section 1: Client Selection & Information */}
          <div className="bg-gray-50/70 p-4 border border-gray-200 rounded-xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
              <Building2 size={15} className="text-blue-600" />
              <span>Client Details</span>
            </div>

            {isClientLocked ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-3.5 border border-gray-200 rounded-lg">
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase block">Client Name</span>
                  <span className="text-xs font-bold text-gray-900">{client.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase block">GST Number</span>
                  <span className="text-xs font-mono text-gray-800">{gstIn || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase block">Billing Address</span>
                  <span className="text-xs text-gray-700 truncate block" title={billingAddress}>{billingAddress || 'N/A'}</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative client-dropdown">
                  <label className="block font-semibold text-gray-700 mb-1">Select Client *</label>
                  <button
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-full p-2.5 border text-black border-gray-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-blue-500 flex justify-between items-center"
                  >
                    <span className={selectedClientData ? 'text-black' : 'text-gray-400'}>
                      {selectedClientData ? selectedClientData.companyName : '-- Choose Client --'}
                    </span>
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showDropdown && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        placeholder="Search client..."
                        autoFocus
                        className="w-full p-2 border-b border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <ul className="max-h-44 overflow-y-auto">
                        {filteredClients.length > 0 ? (
                          filteredClients.map((c) => (
                            <li key={c.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedClientId(c.id);
                                  setSelectedClientData(c);
                                  setShowDropdown(false);
                                  setClientSearch('');
                                }}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-blue-50 ${selectedClientId === c.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-800'}`}
                              >
                                {c.companyName}
                              </button>
                            </li>
                          ))
                        ) : (
                          <li className="px-3 py-2 text-xs text-gray-400">No clients found</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {/* GST Number */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">GST Number</label>
                  <input
                    type="text"
                    value={gstIn}
                    onChange={(e) => setgstIn(e.target.value)}
                    placeholder="e.g. 07AAAAA0000A1Z5"
                    className="w-full p-2.5 text-black border border-gray-300 rounded-lg bg-white text-xs font-mono uppercase"
                  />
                </div>

                {/* Billing Address */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Billing Address</label>
                  <input
                    type="text"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    placeholder="Enter billing address"
                    className="w-full p-2.5 text-black border border-gray-300 rounded-lg bg-white text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Project & Site Execution Details (ADDED) */}
          <div className="p-4 border border-gray-200 rounded-xl space-y-4 bg-gray-50/40">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
              <Wrench size={15} className="text-blue-600" />
              <span>Project & Site Details</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  placeholder="e.g. 50kW Rooftop - Apex Hospital"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                  className="w-full text-black p-2.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Project Type *</label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="w-full text-black p-2.5 border border-gray-300 rounded-lg text-xs bg-white"
                >
                  <option value="On-Grid">On-Grid Solar System</option>
                  <option value="Off-Grid">Off-Grid Solar System</option>
                  <option value="Hybrid">Hybrid Solar System</option>
                  <option value="Solar Water Pump">Solar Water Pump</option>
                  <option value="Commercial Rooftop">Commercial Rooftop</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Site Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Sharma"
                  value={siteContactPerson}
                  onChange={(e) => setSiteContactPerson(e.target.value)}
                  className="w-full text-black p-2.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Site Contact Phone</label>
                <input
                  type="text"
                  placeholder="e.g. +91 9876543210"
                  value={siteContactNumber}
                  onChange={(e) => setSiteContactNumber(e.target.value)}
                  className="w-full text-black p-2.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Order Metadata & PO Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">PO Number *</label>
              <input
                type="text"
                placeholder="e.g. PO-99823"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                required
                className="w-full text-black p-2.5 border border-gray-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">PO Date *</label>
              <input
                type="date"
                value={poDate}
                onChange={(e) => setPoDate(e.target.value)}
                required
                className="w-full text-black p-2.5 border border-gray-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Expected Delivery Date</label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full text-black p-2.5 border border-gray-300 rounded-lg text-xs"
              />
            </div>

            {/* PO Copy File Upload */}
            <div className="md:col-span-3">
              <label className="block font-semibold text-gray-700 mb-1">Upload PO Copy (PDF / Image)</label>
              <label className="flex items-center justify-center gap-2 p-2.5 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-lg cursor-pointer bg-gray-50 hover:bg-blue-50/30 transition text-xs text-gray-600">
                {uploading ? (
                  <Loader2 size={14} className="animate-spin text-blue-600" />
                ) : (
                  <Upload size={14} className="text-gray-500" />
                )}
                <span className="truncate max-w-[200px]">
                  {uploading
                    ? 'Uploading image...'
                    : poCopyUrl
                      ? 'PO Image Uploaded'
                      : poCopy
                        ? poCopy.name
                        : 'Choose PO document...'}
                </span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,image/*"
                  onChange={handlePoCopyChange}
                  className="hidden"
                />
              </label>
              {poCopyUrl && (
                <a
                  href={poCopyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 underline mt-1 block truncate"
                >
                  View Uploaded PO Document
                </a>
              )}
            </div>
          </div>

          {/* Section 4: Delivery / Shipping Address & Remarks */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block font-semibold text-gray-700">Project / Site Address (Shipping) *</label>
                <label className="flex items-center gap-1.5 text-xs text-blue-600 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsBilling}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSameAsBilling(checked);
                      if (checked) {
                        setShippingAddress(billingAddress);
                      } else {
                        setShippingAddress("");
                      }
                    }}
                  />
                  Same as Billing Address
                </label>
              </div>
              <textarea
                rows="2"
                placeholder="Enter complete installation site address..."
                value={shippingAddress}
                disabled={sameAsBilling}
                onChange={(e) => {
                  setShippingAddress(e.target.value);
                  if (sameAsBilling) setSameAsBilling(false);
                }}
                required
                className="w-full text-black p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Remarks / Order Notes</label>
              <textarea
                rows="2"
                placeholder="Add special instructions or delivery details..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full text-black p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
          </div>

          {/* Section 5: Dynamic Multi-Item Line Items */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Line Items
                </h3>
                <p className="text-[11px] text-gray-500">
                  Add product items and set quantity & capacities.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label
                  htmlFor="bulk-item-upload"
                  className="flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  <FileSpreadsheet size={14} />
                  Bulk Upload
                  <input
                    id="bulk-item-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleBulkUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg transition"
                >
                  <Plus size={14} /> Add Item Row
                </button>
              </div>
            </div>

            {/* Item Table Header */}
            <div className="grid grid-cols-12 gap-3 text-gray-500 font-semibold px-1 text-[11px] uppercase">
              <span className="col-span-4">Product Name *</span>
              <span className="col-span-3">Brand Name *</span>
              <span className="col-span-3">Capacity *</span>
              <span className="col-span-1 text-center">Qty *</span>
              <span className="col-span-1 text-center">Action</span>
            </div>

            {/* Item Rows */}
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-3 items-center bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                  {/* Product Name */}
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder={`Product #${index + 1} Name`}
                      value={item.productName || item.name || ''}
                      onChange={(e) => handleItemChange(item.id, 'productName', e.target.value)}
                      required
                      className="w-full text-black p-2 border border-gray-300 rounded-md text-xs bg-white"
                    />
                  </div>

                  {/* Brand Name */}
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Brand Name"
                      value={item.brandName || ''}
                      onChange={(e) => handleItemChange(item.id, 'brandName', e.target.value)}
                      required
                      className="w-full text-black p-2 border border-gray-300 rounded-md text-xs bg-white"
                    />
                  </div>

                  {/* Capacity */}
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Capacity (e.g. 540 Wp, 10 kW)"
                      value={item.capacity || ''}
                      onChange={(e) => handleItemChange(item.id, 'capacity', e.target.value)}
                      required
                      className="w-full text-black p-2 border border-gray-300 rounded-md text-xs bg-white"
                    />
                  </div>

                  {/* Qty */}
                  <div className="col-span-1">
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                      required
                      className="w-full text-black p-2 border border-gray-300 rounded-md text-xs text-center bg-white"
                    />
                  </div>

                  {/* Remove Action */}
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(item.id)}
                      disabled={items.length === 1}
                      className={`p-1.5 rounded-md ${items.length === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:bg-red-50'}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-semibold text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-xs shadow-xs transition"
            >
              <CheckCircle2 size={15} /> Save Sales Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};