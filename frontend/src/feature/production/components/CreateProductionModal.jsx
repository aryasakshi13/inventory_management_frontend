import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Cpu,
  Package,
  Layers,
  Calendar,
  User,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Hash,
  Sparkles,
  Boxes,
  Lock
} from 'lucide-react';
import axios from 'axios';
import { getNextTaskId, createProductionTask } from '../services/productionService';

export const CreateProductionModal = ({ isOpen, onClose, onSuccess }) => {
  const [taskId, setTaskId] = useState('PRD-001');
  const [productName, setProductName] = useState('');
  const [productId, setProductId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [proposedQty, setProposedQty] = useState(1);
  const [priority, setPriority] = useState('Medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // Items / Raw Materials list
  const [items, setItems] = useState([
    { store_item_id: '', item_name: '', unit: 'Nos', qty_per_unit: 1, required_qty: 1 }
  ]);

  // Master lists
  const [productsList, setProductsList] = useState([]);
  const [storeItemsList, setStoreItemsList] = useState([]);
  const [bomList, setBomList] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [selectedBomId, setSelectedBomId] = useState('');
  const [availableProductBoms, setAvailableProductBoms] = useState([]);

  const [loadingInitial, setLoadingInitial] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormError('');
      const initData = async () => {
        setLoadingInitial(true);
        try {
          // 1. Get next task ID
          const nextRes = await getNextTaskId();
          if (nextRes?.task_id) setTaskId(nextRes.task_id);

          // 2. Fetch Products
          const prodRes = await axios.get('http://localhost:5001/api/products').catch(() => ({ data: [] }));
          const pData = Array.isArray(prodRes?.data)
            ? prodRes.data
            : Array.isArray(prodRes?.data?.data)
              ? prodRes.data.data
              : [];
          setProductsList(pData);

          // 3. Fetch Store Items
          const storeRes = await axios.get('http://localhost:5001/api/store-items').catch(() => ({ data: [] }));
          const sData = Array.isArray(storeRes?.data)
            ? storeRes.data
            : Array.isArray(storeRes?.data?.data)
              ? storeRes.data.data
              : [];
          setStoreItemsList(sData);

          // 4. Fetch BOMs
          const bomRes = await axios.get('http://localhost:5001/api/bom').catch(() => ({ data: [] }));
          const bData = Array.isArray(bomRes?.data)
            ? bomRes.data
            : Array.isArray(bomRes?.data?.data)
              ? bomRes.data.data
              : [];
          setBomList(bData);

          // 5. Fetch Employees for Project Incharge
          const empRes = await axios.get('http://localhost:5001/api/employees', { withCredentials: true }).catch(() => ({ data: [] }));
          const eData = Array.isArray(empRes?.data)
            ? empRes.data
            : Array.isArray(empRes?.data?.data)
              ? empRes.data.data
              : Array.isArray(empRes?.data?.employees)
                ? empRes.data.employees
                : [];
          setEmployeesList(eData);

        } catch (err) {
          console.error("Error initializing production modal:", err);
        } finally {
          setLoadingInitial(false);
        }
      };
      initData();
    }
  }, [isOpen]);

  // Filter ONLY Project Incharges
  const projectInchargeEmployees = employeesList.filter((emp) => {
    const roleText = (emp.role || '').toLowerCase().trim();
    const desigText = (emp.designation || '').toLowerCase().trim();
    return (
      roleText === 'project incharge' ||
      desigText === 'project incharge' ||
      roleText.includes('project incharge') ||
      desigText.includes('project incharge') ||
      roleText.includes('incharge') ||
      desigText.includes('incharge') ||
      roleText.includes('project lead')
    );
  });

  // Apply BOM items
  const applyBom = (bom, qty) => {
    if (!bom) return;
    setSelectedBomId(bom.id || '');
    try {
      let rawItems = [];
      if (Array.isArray(bom.items) && bom.items.length > 0) {
        rawItems = bom.items;
      } else if (typeof bom.store_items_id === 'string') {
        rawItems = JSON.parse(bom.store_items_id);
      } else if (Array.isArray(bom.store_items_id)) {
        rawItems = bom.store_items_id;
      }

      if (Array.isArray(rawItems) && rawItems.length > 0) {
        const mapped = rawItems.map((bi) => {
          const itemId = Number(bi.item_id || bi.itemId || bi.id || bi.store_item_id);
          const sItem = storeItemsList.find((s) => Number(s.id) === itemId);
          const unitQty = Number(bi.quantity ?? bi.qty ?? bi.qty_per_unit ?? 1) || 1;
          const uomVal = bi.unit || sItem?.unit || sItem?.uom || 'Nos';
          const targetQty = Number(qty) || 1;

          return {
            store_item_id: sItem ? sItem.id : (itemId || ''),
            item_name: bi.item_name || bi.name || sItem?.item_name || 'Component Item',
            unit: uomVal,
            qty_per_unit: unitQty,
            required_qty: Number((unitQty * targetQty).toFixed(2))
          };
        });
        setItems(mapped);
      }
    } catch (e) {
      console.error("Error parsing BOM items:", e);
    }
  };

  // Handle Product Selection
  const handleProductChange = (e) => {
    const val = e.target.value;
    setProductName(val);
    const matched = productsList.find((p) => (p.product_name || p.name) === val);
    if (matched) {
      setProductId(matched.id || '');
      // Check if this product has BOMs
      const prodBoms = bomList.filter(
        (b) => Number(b.product_id) === Number(matched.id) ||
               (b.product_name && b.product_name.toLowerCase() === matched.product_name.toLowerCase())
      );
      setAvailableProductBoms(prodBoms);
      if (prodBoms.length > 0) {
        applyBom(prodBoms[0], proposedQty || 1);
      } else {
        setSelectedBomId('');
      }
    } else {
      setProductId('');
      setAvailableProductBoms([]);
      setSelectedBomId('');
    }

    if (!taskTitle || taskTitle.startsWith('Build')) {
      setTaskTitle(`Build ${proposedQty || 1}x ${val || 'Goods'}`);
    }
  };

  // When proposed quantity changes, recalculate item required quantities
  const handleQtyChange = (newQty) => {
    setProposedQty(newQty);
    const numericQty = parseFloat(newQty) || 0;
    if (productName && (!taskTitle || taskTitle.startsWith('Build'))) {
      setTaskTitle(`Build ${numericQty}x ${productName}`);
    }
    setItems((prev) =>
      prev.map((it) => {
        const uQty = Number(it.qty_per_unit ?? 1) || 1;
        return {
          ...it,
          qty_per_unit: uQty,
          required_qty: Number((uQty * (numericQty || 1)).toFixed(2))
        };
      })
    );
  };

  // Handle Item Row Selection
  const handleItemSelect = (index, storeItemId) => {
    const sItem = storeItemsList.find((s) => String(s.id) === String(storeItemId));
    setItems((prev) => {
      const updated = [...prev];
      const currentQty = parseFloat(proposedQty) || 1;
      if (sItem) {
        const uomVal = sItem.unit || sItem.uom || 'Nos';
        const unitQty = Number(updated[index]?.qty_per_unit ?? 1) || 1;
        updated[index] = {
          ...updated[index],
          store_item_id: sItem.id,
          item_name: sItem.item_name,
          unit: uomVal,
          qty_per_unit: unitQty,
          required_qty: Number((unitQty * currentQty).toFixed(2))
        };
      } else {
        updated[index] = {
          ...updated[index],
          store_item_id: '',
          item_name: storeItemId
        };
      }
      return updated;
    });
  };

  const addItemRow = () => {
    const currentQty = parseFloat(proposedQty) || 1;
    setItems((prev) => [
      ...prev,
      { store_item_id: '', item_name: '', unit: 'Nos', qty_per_unit: 1, required_qty: currentQty }
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartDateChange = (newStart) => {
    setStartDate(newStart);
    if (dueDate && dueDate < newStart) {
      setDueDate(newStart);
    }
  };

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productName.trim()) {
      setFormError('Please select the Product to manufacture.');
      return;
    }

    const finalProposed = parseInt(proposedQty, 10);
    if (!finalProposed || finalProposed <= 0) {
      setFormError('Target Batch Quantity must be at least 1.');
      return;
    }

    const validItems = items.filter((i) => i.item_name && i.item_name.trim() !== '');
    if (validItems.length === 0) {
      setFormError('Please add at least one component raw material item.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');

      await createProductionTask({
        task_id: taskId,
        product_id: productId || null,
        product_name: productName.trim(),
        bom_id: selectedBomId || null,
        task_title: taskTitle.trim() || `Build ${finalProposed}x ${productName.trim()}`,
        proposed_quantity: finalProposed,
        priority,
        assigned_to: assignedTo.trim() || null,
        start_date: startDate || null,
        due_date: dueDate || null,
        notes: notes.trim() || null,
        items: validItems.map((i) => ({
          store_item_id: i.store_item_id || null,
          item_name: i.item_name,
          unit: i.unit || 'Nos',
          required_qty: parseFloat(i.required_qty) || 1
        }))
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Error creating production task:", err);
      setFormError(err.response?.data?.message || 'Failed to create production task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl overflow-hidden my-6 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">New Production Work Order</h3>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-mono font-bold text-xs border border-blue-200">
                  {taskId}
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                Plan manufacturing batch, auto-load BOM components, request store stock, and produce finished goods
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200/60 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {formError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="font-semibold">{formError}</span>
            </div>
          )}

          {/* 1. Target Product & Quantity Section */}
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-xs uppercase tracking-wider">
                <Package size={14} className="text-blue-600" />
                <span>1. Target Finished Product & Batch Quantity</span>
              </div>
              {selectedBomId && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={12} /> BOM Auto-Loaded (BOM #{selectedBomId})
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Product Select Dropdown (Only In-House Manufacturing Products) */}
              <div className="md:col-span-2 space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Product to Manufacture <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={productName}
                  onChange={handleProductChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- Select Product to Manufacture --</option>
                  {productsList
                    .filter((p) => (p.fulfilment_mode || 'site_assembly') === 'in_house_manufacturing')
                    .map((p) => (
                      <option key={p.id || p.product_name} value={p.product_name || p.name}>
                        {p.product_name || p.name}
                      </option>
                    ))}
                </select>

                {productName && (
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {/* Check if finished good exists in store items */}
                    {(() => {
                      const fgItem = storeItemsList.find(
                        (s) => (s.product_id && Number(s.product_id) === Number(productId)) ||
                               (s.item_type === 'finished_good' && s.item_name?.toLowerCase() === productName.toLowerCase())
                      );
                      if (fgItem) {
                        return (
                          <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 font-medium">
                            Current Finished Stock: <b>{fgItem.quantity || 0} {fgItem.unit || 'Nos'}</b>
                          </span>
                        );
                      }
                      return null;
                    })()}

                    {/* BOM status */}
                    {availableProductBoms.length > 1 ? (
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="text-slate-500">Select Recipe BOM:</span>
                        <select
                          value={selectedBomId}
                          onChange={(e) => {
                            const b = availableProductBoms.find((x) => String(x.id) === String(e.target.value));
                            if (b) applyBom(b, proposedQty);
                          }}
                          className="px-2 py-0.5 border border-slate-300 rounded-md bg-white text-xs"
                        >
                          {availableProductBoms.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.bom_name || `BOM #${b.id}`} {b.capacity ? `(${b.capacity})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : availableProductBoms.length === 0 ? (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        No BOM found for this product. You can manually add raw material components below.
                      </span>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Proposed Target Quantity (Positive Numbers Only, Min 1, 0 Not Allowed) */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Target Batch Quantity <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={proposedQty}
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/\D/g, ''); // only numeric digits
                      if (cleanVal === '' || cleanVal === '0') {
                        setProposedQty('');
                      } else {
                        const num = Math.max(1, parseInt(cleanVal, 10));
                        handleQtyChange(num);
                      }
                    }}
                    onBlur={() => {
                      if (!proposedQty || Number(proposedQty) < 1) {
                        handleQtyChange(1);
                      }
                    }}
                    placeholder="1"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-[11px]">
                    Units
                  </span>
                </div>
              </div>
            </div>

            {/* Task Title */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Task Title / Description</label>
              <input
                type="text"
                placeholder="e.g. Build 5x Solar Inverter 5kVA (Batch A)"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 2. Component Raw Materials from Store (BOM Breakdown - Read-Only Formulas) */}
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-xs uppercase tracking-wider">
                <Boxes className="w-4 h-4 text-indigo-600" />
                <span>2. Required Raw Material Store Items (BOM Breakdown)</span>
              </div>
              {availableProductBoms.length === 0 && (
                <button
                  type="button"
                  onClick={addItemRow}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Component Item</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
              <Lock size={12} className="text-gray-400 shrink-0" />
              <span>Raw material components & ratios are strictly fixed from BOM Master for {proposedQty || 1} unit(s).</span>
            </p>

            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-12 gap-2 text-[10px] font-bold text-gray-500 uppercase px-3 py-1 bg-slate-100/70 rounded-lg">
              <div className="col-span-4">Store Component Item</div>
              <div className="col-span-3">Available Store Stock</div>
              <div className="col-span-2 text-center">Qty / Unit (Locked)</div>
              <div className="col-span-2 text-center">Total Req. Qty (Calculated)</div>
              <div className="col-span-1 text-center">Unit (UOM)</div>
            </div>

            <div className="space-y-2">
              {items.map((it, idx) => {
                const matchedStoreItem = storeItemsList.find(
                  (s) => Number(s.id) === Number(it.store_item_id) ||
                         (s.item_name && it.item_name && s.item_name.toLowerCase().trim() === it.item_name.toLowerCase().trim())
                );
                const currentStock = matchedStoreItem ? (matchedStoreItem.quantity ?? 0) : (it.current_store_stock ?? null);
                const isStockShortage = currentStock !== null && currentStock < it.required_qty;
                const displayQtyPerUnit = (it.qty_per_unit !== undefined && it.qty_per_unit !== null && it.qty_per_unit !== '')
                  ? it.qty_per_unit
                  : 1;

                return (
                  <div
                    key={idx}
                    className="p-2.5 bg-white border border-gray-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2 items-center shadow-2xs"
                  >
                    {/* 1. Component Item (Fixed & Locked from BOM) */}
                    <div className="col-span-12 sm:col-span-4">
                      <div className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-gray-900 font-bold text-xs flex items-center justify-between">
                        <span className="truncate">{it.item_name || 'Component Item'}</span>
                        <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 font-bold shrink-0">
                          BOM Locked
                        </span>
                      </div>
                    </div>

                    {/* 2. Available Store Stock Status */}
                    <div className="col-span-6 sm:col-span-3">
                      {currentStock !== null ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold ${isStockShortage ? 'text-rose-600' : 'text-slate-800'}`}>
                            {currentStock} {it.unit} in Store
                          </span>
                          {isStockShortage ? (
                            <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              Low Stock
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Available
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-[10px] italic">Checking stock...</span>
                      )}
                    </div>

                    {/* 3. Qty Per Unit (READ-ONLY / LOCKED FROM BOM) */}
                    <div className="col-span-6 sm:col-span-2 text-center">
                      <div className="px-2.5 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-slate-900 font-bold text-xs">
                        {displayQtyPerUnit}
                      </div>
                    </div>

                    {/* 4. Total Required Qty (READ-ONLY CALCULATED QUANTITY) */}
                    <div className="col-span-6 sm:col-span-2 text-center">
                      <div className="px-2 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 font-bold text-xs">
                        {it.required_qty}
                      </div>
                    </div>

                    {/* 5. Unit (UOM - READ-ONLY BADGE) */}
                    <div className="col-span-6 sm:col-span-1 text-center">
                      <span className="px-2 py-1.5 bg-slate-100 border border-slate-200 rounded-md text-slate-700 font-bold text-[11px] inline-block w-full">
                        {it.unit || 'Nos'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Assignment & Timeline */}
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
            <div className="text-gray-900 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
              <User size={14} className="text-blue-600" />
              <span>3. Project In-charge & Production Timeline</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Project Incharge Dropdown (Only Role: Project Incharge) */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Project In-charge <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                >
                  <option value="">-- Select Project In-charge --</option>
                  {(projectInchargeEmployees.length > 0 ? projectInchargeEmployees : employeesList).map((emp) => {
                    const empName = emp.employee_name || emp.name || `Employee #${emp.id}`;
                    const empRole = emp.designation || emp.role || 'Project Incharge';
                    const empCode = emp.employee_code ? ` (${emp.employee_code})` : '';
                    return (
                      <option key={emp.id || empName} value={empName}>
                        {empName} — {empRole}{empCode}
                      </option>
                    );
                  })}
                </select>
                {projectInchargeEmployees.length === 0 && employeesList.length > 0 && (
                  <p className="text-[10px] text-amber-600">
                    No employees with role 'Project Incharge' found. Listing available staff.
                  </p>
                )}
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onClick={(e) => {
                    try {
                      if (typeof e.target.showPicker === 'function') e.target.showPicker();
                    } catch (err) {}
                  }}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs cursor-pointer"
                />
              </div>

              {/* Target Due Date (Expected Finish Deadline - Cannot be before Start Date) */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Target Due Date (Finish Deadline)
                </label>
                <input
                  type="date"
                  min={startDate || new Date().toISOString().split('T')[0]}
                  value={dueDate}
                  onClick={(e) => {
                    try {
                      if (typeof e.target.showPicker === 'function') e.target.showPicker();
                    } catch (err) {}
                  }}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs cursor-pointer"
                />
                <span className="text-[10px] text-gray-400">
                  Must be on or after {startDate || 'Start Date'}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1 pt-1">
              <label className="block text-xs font-semibold text-gray-700">Production Notes / Specs</label>
              <textarea
                rows={2}
                placeholder="Assembly guidelines, batch instructions, or quality checks..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs resize-none"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Create Production Work Order</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
