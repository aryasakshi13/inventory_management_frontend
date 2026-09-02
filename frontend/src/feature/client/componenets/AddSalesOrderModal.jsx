import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload, Download, CheckCircle2, Building2, Loader2, FileSpreadsheet, UserCheck, Wrench, AlertCircle } from 'lucide-react';
import { uploadImageApi } from '../../../services/uploadService';
import { getProjectIncharges, getProducts } from '../services/salesOrderService';
import { getClients } from '../services/clientService';
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

  // Available clients fetched with role === 'client' strictly
  const [availableClients, setAvailableClients] = useState([]);

  // Project Incharge State (Default NA for factory products / direct sales)
  const [projectIncharges, setProjectIncharges] = useState([]);
  const [selectedProjectIncharge, setSelectedProjectIncharge] = useState('NA');
  const [loadingIncharges, setLoadingIncharges] = useState(false);

  // Products Dropdown State
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

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

  // Project & Site Fields
  const [projectName, setProjectName] = useState('');
  const [siteContactPerson, setSiteContactPerson] = useState('');
  const [siteContactNumber, setSiteContactNumber] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [remarks, setRemarks] = useState('');

  // Delivery & Logistics
  const [shippingAddress, setShippingAddress] = useState('');
  const [sameAsBilling, setSameAsBilling] = useState(false);

  const [clientSearch, setClientSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Dynamic Multi-Item Array
  const [items, setItems] = useState([
    { id: Date.now(), productName: '', productId: '', description: '', qty: 1 }
  ]);

  // Validation Errors State
  const [errors, setErrors] = useState({});

  // Fetch Project Incharges, Products & strictly role='client' clients
  useEffect(() => {
    const fetchData = async () => {
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

      try {
        setLoadingProducts(true);
        const res = await getProducts();
        if (res && res.success && Array.isArray(res.data)) {
          setProducts(res.data);
        } else if (Array.isArray(res)) {
          setProducts(res);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoadingProducts(false);
      }

      if (!isClientLocked) {
        try {
          const res = await getClients({ role: 'client', limit: 100 });
          const rawClients = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
          // STRICT filter: ONLY role === 'client' (role must NOT be null, undefined, or other)
          const validClients = rawClients.filter((c) => {
            const r = (c?.role ?? '').toString().trim().toLowerCase();
            return r === 'client';
          });
          setAvailableClients(validClients);
        } catch (err) {
          console.error("Failed to fetch clients in modal:", err);
        }
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, isClientLocked]);

  // Merge availableClients and passed clients prop, strictly filtering role === 'client'
  const allClientOptions = (availableClients.length > 0 ? availableClients : (clients || [])).filter((c) => {
    const role = (c?.role ?? '').toString().trim().toLowerCase();
    return role === 'client';
  });

  // Handle Client Initialization & Switching
  useEffect(() => {
    if (isClientLocked) {
      setSelectedClientId(client.id);
      setSelectedClientData(client);
      setgstIn(client.gstIn || '');
      setBillingAddress(client.billingAddress || client.Address || '');
    } else if (selectedClientId) {
      const found = allClientOptions.find((c) => c.id === selectedClientId);
      if (found) {
        setSelectedClientData(found);
        setgstIn(found.gstIn || '');
        setBillingAddress(found.billingAddress || found.Address || '');
      } else {
        setSelectedClientData(null);
        setSelectedClientId('');
        setgstIn('');
        setBillingAddress('');
      }
    } else {
      setSelectedClientData(null);
      setgstIn('');
      setBillingAddress('');
    }
  }, [client, selectedClientId, isClientLocked, allClientOptions]);

  // Ensure Dispatch/Expected Date is not before PO Date
  useEffect(() => {
    if (poDate && expectedDeliveryDate && expectedDeliveryDate < poDate) {
      setExpectedDeliveryDate(poDate);
    }
  }, [poDate, expectedDeliveryDate]);

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

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter clients to STRICTLY include only records where role is 'client' (strictly excluding null, undefined, vendor, etc.)
  const filteredClients = allClientOptions.filter((c) => {
    const matchesSearch = (c?.companyName || '').toLowerCase().includes(clientSearch.toLowerCase());
    return matchesSearch;
  });

  // Add / Remove Row Handlers
  const handleAddItemRow = () => {
    setItems((prev) => [...prev, { id: Date.now() + Math.random(), productName: '', productId: '', description: '', qty: 1 }]);
  };

  const handleRemoveItemRow = (id) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleItemFieldsChange = (id, fieldsObj) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...fieldsObj } : item)));
  };

  // ===============================
  // DOWNLOAD SAMPLE FORMAT
  // ===============================
  const handleDownloadSample = () => {
    const sampleData = [
      {
        'Product Name': products.length > 0 ? products[0].product_name : 'Solar PV Module',
        'Description': 'Mono PERC 540 Wp Half Cut',
        'Qty': 10
      },
      {
        'Product Name': products.length > 1 ? products[1].product_name : 'Solar Grid Inverter',
        'Description': '10 kW Three Phase Dual MPPT',
        'Qty': 1
      },
      {
        'Product Name': products.length > 2 ? products[2].product_name : 'ACDB / DCDB Box',
        'Description': 'IP65 Weatherproof Enclosure 4 In 4 Out',
        'Qty': 2
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample_Items');
    XLSX.writeFile(workbook, 'sales_order_items_sample.xlsx');
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
          const description =
            row.Description ?? row.description ?? row['Description'] ?? row['description'] ?? row.capacity ?? row.Capacity ?? row['Capacity'] ?? '';
          const qty =
            row.qty ?? row.Qty ?? row.QTY ?? row.Quantity ?? row.quantity ?? 0;

          const matchedProd = products.find(p => p.product_name.toLowerCase() === String(productName).trim().toLowerCase());

          return {
            id: Date.now() + Math.random() + index,
            productName: matchedProd ? matchedProd.product_name : String(productName).trim(),
            productId: matchedProd ? matchedProd.id : '',
            description: String(description).trim(),
            qty: Number(qty) || 0
          };
        })
        .filter((item) => item.productName);

      if (!uploadedItems.length) {
        alert('No valid items found. Please make sure your file contains Product Name, Description and Qty columns.');
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

  const validateForm = () => {
    const newErrors = {};

    if (!selectedClientData && !selectedClientId) {
      newErrors.client = "Please select a client.";
    }

    // Project Name Validation
    const cleanProject = projectName.trim();
    if (!cleanProject) {
      newErrors.projectName = "Project Name is required.";
    } else if (cleanProject.length < 3) {
      newErrors.projectName = "Project Name must be at least 3 characters.";
    } else if (cleanProject.includes('//') || cleanProject.includes('\\')) {
      newErrors.projectName = "Project Name cannot contain slashes.";
    } else if (!/^[a-zA-Z0-9\s&.,'()_-]+$/.test(cleanProject)) {
      newErrors.projectName = "Project Name contains invalid special characters.";
    }

    // Site Contact Person Validation
    if (siteContactPerson.trim() && !/^[a-zA-Z\s.]+$/.test(siteContactPerson.trim())) {
      newErrors.siteContactPerson = "Contact person name can only contain letters, spaces, and dots.";
    }

    // Site Contact Phone Validation
    if (siteContactNumber.trim()) {
      if (!/^[6-9]\d{9}$/.test(siteContactNumber.trim())) {
        newErrors.siteContactNumber = "Please enter a valid 10-digit mobile number starting with 6-9.";
      }
    }

    // PO Number Validation
    const cleanPo = poNumber.trim();
    if (!cleanPo) {
      newErrors.poNumber = "PO Number is required.";
    } else if (cleanPo.length < 3) {
      newErrors.poNumber = "PO Number must be at least 3 characters.";
    } else if (cleanPo.includes('//') || cleanPo.includes('\\')) {
      newErrors.poNumber = "PO Number cannot contain double slashes.";
    } else if (!/^[a-zA-Z0-9/_-]+$/.test(cleanPo)) {
      newErrors.poNumber = "PO Number can only contain letters, numbers, hyphens, underscores, and slashes.";
    }

    // Expected Delivery Date Validation
    if (expectedDeliveryDate && poDate && expectedDeliveryDate < poDate) {
      newErrors.expectedDeliveryDate = "Dispatch / Expected Delivery Date cannot be earlier than PO Date.";
    }

    // Line Items Validation & Duplicate Check
    if (!items || items.length === 0) {
      newErrors.items = "Please add at least one line item.";
    } else {
      const seenProducts = new Set();
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const prodName = (it.productName || '').trim();
        const qty = Number(it.qty) || 0;

        if (!prodName) {
          newErrors.items = `Row ${i + 1}: Please select a Product Name.`;
          break;
        }
        if (qty <= 0) {
          newErrors.items = `Row ${i + 1}: Quantity must be at least 1.`;
          break;
        }

        const key = prodName.toLowerCase();
        if (seenProducts.has(key)) {
          newErrors.items = `Duplicate product found: "${prodName}". Each product should only be added once per sales order.`;
          break;
        }
        seenProducts.add(key);

        // 0-Stock check for finished products
        const matchedProd = products.find((p) => (p.product_name || '').toLowerCase().trim() === key);
        if (matchedProd && Number(matchedProd.store_stock || 0) <= 0) {
          newErrors.items = `Cannot create Sales Order: Product "${prodName}" has 0 finished stock in Store (Out of Stock). Please produce it in Production first.`;
          break;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

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

    // Map line items for backend compatibility
    const formattedItems = items.map((it) => ({
      ...it,
      capacity: '',
      description: '',
    }));

    const formData = new FormData();
    formData.append("clientId", selectedClientData?.id || selectedClientId);
    formData.append("assignedEngineerId", selectedProjectIncharge);
    formData.append("poNumber", poNumber);
    formData.append("poDate", poDate);

    // Project Details
    formData.append("projectName", projectName);
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

    formData.append("items", JSON.stringify(formattedItems));

    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
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
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200/60 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">

          {/* Section 0: Project Incharge / Engineer Selection */}
          <div className="bg-blue-50/60 p-4 border border-blue-200 rounded-xl space-y-2 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
              <UserCheck size={16} className="text-blue-600" />
              <span>Project Incharge / Engineer</span>
            </div>
            <select
              value={selectedProjectIncharge}
              onChange={(e) => {
                setSelectedProjectIncharge(e.target.value);
                if (errors.projectIncharge) setErrors((prev) => ({ ...prev, projectIncharge: null }));
              }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-gray-900 font-medium cursor-pointer"
            >
              <option value="NA">NA</option>
              <option value="" className="text-gray-500">
                {loadingIncharges ? "Loading Incharges..." : "-- Select Incharge --"}
              </option>

              {!loadingIncharges && projectIncharges.length > 0 ? (
                projectIncharges.map((emp) => (
                  <option
                    key={emp.id}
                    value={emp.id}
                    className="text-gray-900"
                  >
                    {emp.employee_name}
                    {emp.employee_code
                      ? ` (${emp.employee_code})`
                      : ""}
                    {emp.location_branch
                      ? ` - ${emp.location_branch}`
                      : ""}
                  </option>
                ))
              ) : !loadingIncharges ? (
                <option value="" disabled className="text-gray-500">
                  No Site Engineers Found
                </option>
              ) : null}
            </select>
          </div>

          {/* Section 1: Client Selection & Information */}
          <div className="bg-gray-50/70 p-4 border border-gray-200 rounded-xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
              <Building2 size={15} className="text-blue-600" />
              <span>Client Details (Clients Only)</span>
            </div>

            {isClientLocked ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-3.5 border border-gray-200 rounded-lg">
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase block">Client Name</span>
                  <span className="text-xs font-bold text-gray-900">{client.companyName || client.name}</span>
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
                    className={`w-full p-2.5 border text-black rounded-lg bg-white text-xs focus:ring-2 focus:ring-blue-500 flex justify-between items-center ${
                      errors.client ? 'border-rose-400 bg-rose-50/20' : 'border-gray-300'
                    }`}
                  >
                    <span className={selectedClientData ? 'text-black font-medium' : 'text-gray-400'}>
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
                                  if (errors.client) setErrors((prev) => ({ ...prev, client: null }));
                                }}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-blue-50 ${selectedClientId === c.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-800'}`}
                              >
                                {c.companyName}
                              </button>
                            </li>
                          ))
                        ) : (
                          <li className="px-3 py-2 text-xs text-gray-400">No client records found</li>
                        )}
                      </ul>
                    </div>
                  )}
                  {errors.client && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle size={12} /> {errors.client}
                    </p>
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

          {/* Section 2: Project & Site Execution Details */}
          <div className="p-4 border border-gray-200 rounded-xl space-y-4 bg-gray-50/40">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
              <Wrench size={15} className="text-blue-600" />
              <span>Project & Site Details</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  placeholder="e.g. 50kW Rooftop - Apex Hospital"
                  value={projectName}
                  onChange={(e) => {
                    // Prevent special characters like @, #, $, %, slashes live
                    const rawVal = e.target.value;
                    const sanitizedVal = rawVal.replace(/[^a-zA-Z0-9\s&.,'()_-]/g, '').replace(/[/\\~`!@#$%^*+={}[\]|:;"<>?]/g, '');
                    setProjectName(sanitizedVal);

                    if (!sanitizedVal.trim()) {
                      setErrors((prev) => ({ ...prev, projectName: "Project Name is required." }));
                    } else if (sanitizedVal.trim().length < 3) {
                      setErrors((prev) => ({ ...prev, projectName: "Project Name must be at least 3 characters." }));
                    } else {
                      setErrors((prev) => ({ ...prev, projectName: null }));
                    }
                  }}
                  onBlur={() => {
                    if (!projectName.trim()) {
                      setErrors((prev) => ({ ...prev, projectName: "Project Name is required." }));
                    } else if (projectName.trim().length < 3) {
                      setErrors((prev) => ({ ...prev, projectName: "Project Name must be at least 3 characters." }));
                    }
                  }}
                  required
                  className={`w-full text-black p-2.5 border rounded-lg text-xs bg-white ${
                    errors.projectName ? 'border-rose-400 bg-rose-50/20' : 'border-gray-300'
                  }`}
                />
                {errors.projectName && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle size={12} /> {errors.projectName}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Site Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Sharma"
                  value={siteContactPerson}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^a-zA-Z\s.]/g, '');
                    setSiteContactPerson(val);
                    if (val.trim() && !/^[a-zA-Z\s.]+$/.test(val.trim())) {
                      setErrors((prev) => ({ ...prev, siteContactPerson: "Letters, spaces, and dots only." }));
                    } else {
                      setErrors((prev) => ({ ...prev, siteContactPerson: null }));
                    }
                  }}
                  className={`w-full text-black p-2.5 border rounded-lg text-xs bg-white ${
                    errors.siteContactPerson ? 'border-rose-400 bg-rose-50/20' : 'border-gray-300'
                  }`}
                />
                {errors.siteContactPerson && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle size={12} /> {errors.siteContactPerson}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Site Contact Phone</label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  value={siteContactNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setSiteContactNumber(val);
                    if (val && !/^[6-9]\d{0,9}$/.test(val)) {
                      setErrors((prev) => ({ ...prev, siteContactNumber: "Must start with 6, 7, 8, or 9." }));
                    } else if (val && val.length > 0 && val.length < 10) {
                      setErrors((prev) => ({ ...prev, siteContactNumber: "Must be exactly 10 digits." }));
                    } else {
                      setErrors((prev) => ({ ...prev, siteContactNumber: null }));
                    }
                  }}
                  className={`w-full text-black p-2.5 border rounded-lg text-xs bg-white ${
                    errors.siteContactNumber ? 'border-rose-400 bg-rose-50/20' : 'border-gray-300'
                  }`}
                />
                {errors.siteContactNumber && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle size={12} /> {errors.siteContactNumber}
                  </p>
                )}
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
                onChange={(e) => {
                  // Prevent invalid characters live: only alphanumeric, hyphens, underscores, single slashes
                  const rawVal = e.target.value;
                  const sanitizedVal = rawVal.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/\/{2,}/g, '/');
                  setPoNumber(sanitizedVal);

                  if (!sanitizedVal.trim()) {
                    setErrors((prev) => ({ ...prev, poNumber: "PO Number is required." }));
                  } else if (sanitizedVal.trim().length < 3) {
                    setErrors((prev) => ({ ...prev, poNumber: "PO Number must be at least 3 characters." }));
                  } else {
                    setErrors((prev) => ({ ...prev, poNumber: null }));
                  }
                }}
                onBlur={() => {
                  if (!poNumber.trim()) {
                    setErrors((prev) => ({ ...prev, poNumber: "PO Number is required." }));
                  } else if (poNumber.trim().length < 3) {
                    setErrors((prev) => ({ ...prev, poNumber: "PO Number must be at least 3 characters." }));
                  }
                }}
                required
                className={`w-full text-black p-2.5 border rounded-lg text-xs bg-white ${
                  errors.poNumber ? 'border-rose-400 bg-rose-50/20' : 'border-gray-300'
                }`}
              />
              {errors.poNumber && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle size={12} /> {errors.poNumber}
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">PO Date *</label>
              <input
                type="date"
                value={poDate}
                onClick={(e) => {
                  try {
                    e.target.showPicker();
                  } catch (err) {}
                }}
                onChange={(e) => {
                  const newPoDate = e.target.value;
                  setPoDate(newPoDate);
                  if (expectedDeliveryDate && expectedDeliveryDate < newPoDate) {
                    setExpectedDeliveryDate(newPoDate);
                  }
                }}
                required
                className="w-full text-black p-2.5 border border-gray-300 rounded-lg text-xs cursor-pointer bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Expected Delivery / Dispatch Date</label>
              <input
                type="date"
                value={expectedDeliveryDate}
                min={poDate || ''}
                onClick={(e) => {
                  try {
                    e.target.showPicker();
                  } catch (err) {}
                }}
                onChange={(e) => {
                  setExpectedDeliveryDate(e.target.value);
                  if (errors.expectedDeliveryDate) setErrors((prev) => ({ ...prev, expectedDeliveryDate: null }));
                }}
                className={`w-full text-black p-2.5 border rounded-lg text-xs cursor-pointer bg-white ${
                  errors.expectedDeliveryDate ? 'border-rose-400 bg-rose-50/20' : 'border-gray-300'
                }`}
              />
              {errors.expectedDeliveryDate && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle size={12} /> {errors.expectedDeliveryDate}
                </p>
              )}
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
                  Select product items and set quantity & description.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-800 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg transition"
                  title="Download sample format Excel file"
                >
                  <Download size={14} />
                  Download Sample
                </button>

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

            {errors.items && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{errors.items}</span>
              </div>
            )}

            {/* Item Table Header */}
            <div className="grid grid-cols-12 gap-3 text-gray-500 font-semibold px-1 text-[11px] uppercase">
              <span className="col-span-9">Product Name *</span>
              <span className="col-span-2 text-center">Qty *</span>
              <span className="col-span-1 text-center">Action</span>
            </div>

            {/* Item Rows */}
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-3 items-center bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                  {/* Product Name Dropdown */}
                  <div className="col-span-9">
                    <select
                      value={item.productName || ''}
                      onChange={(e) => {
                        const selectedName = e.target.value;
                        const matched = products.find(p => p.product_name === selectedName);
                        handleItemFieldsChange(item.id, {
                          productName: selectedName,
                          productId: matched ? matched.id : ''
                        });
                        // Automatically set Project Incharge to NA for manufactured / direct products
                        if (selectedName) {
                          setSelectedProjectIncharge('NA');
                        }
                      }}
                      required
                      className="w-full text-black p-2 border border-gray-300 rounded-md text-xs bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">
                        {loadingProducts ? "Loading products..." : "-- Select Product --"}
                      </option>
                      {products.map((p) => (
                        <option
                          key={p.id}
                          value={p.product_name}
                          className="text-gray-900"
                        >
                          {p.product_name} (Stock: {p.store_stock ?? 0})
                        </option>
                      ))}
                      {/* Preserve custom name if bulk uploaded and not in list */}
                      {item.productName && !products.some(p => p.product_name === item.productName) && (
                        <option value={item.productName}>
                          {item.productName}
                        </option>
                      )}
                    </select>
                  </div>

                  {/* Qty */}
                  <div className="col-span-2">
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

                  {/* 0-Stock Warning Banner under row */}
                  {item.productName && (() => {
                    const matched = products.find(p => (p.product_name || '').toLowerCase().trim() === (item.productName || '').toLowerCase().trim());
                    if (matched && Number(matched.store_stock || 0) <= 0) {
                      return (
                        <div className="col-span-12 px-2.5 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-700 font-semibold flex items-center gap-1.5">
                          <AlertCircle size={13} className="text-rose-600 shrink-0" />
                          <span>Finished Stock is <strong>0 in Store</strong>. Is product ki pehle <strong>Production</strong> karein, tabhi Sales Order add ho sakta hai.</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
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