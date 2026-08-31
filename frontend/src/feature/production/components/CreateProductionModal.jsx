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
  Boxes
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
  const [selectedBomId, setSelectedBomId] = useState('');

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
        } catch (err) {
          console.error("Error initializing production modal:", err);
        } finally {
          setLoadingInitial(false);
        }
      };
      initData();
    }
  }, [isOpen]);

  // Handle Product Selection
  const handleProductChange = (e) => {
    const val = e.target.value;
    setProductName(val);
    const matched = productsList.find((p) => (p.product_name || p.name) === val);
    if (matched) {
      setProductId(matched.id || '');
      // Check if this product has a BOM
      const prodBoms = bomList.filter((b) => Number(b.product_id) === Number(matched.id));
      if (prodBoms.length > 0) {
        applyBom(prodBoms[0], proposedQty);
      }
    }
    if (!taskTitle || taskTitle.startsWith('Build')) {
      setTaskTitle(`Build ${proposedQty}x ${val || 'Goods'}`);
    }
  };

  // Apply BOM items
  const applyBom = (bom, qty) => {
    setSelectedBomId(bom.id || '');
    try {
      let rawItems = [];
      if (typeof bom.store_items_id === 'string') {
        rawItems = JSON.parse(bom.store_items_id);
      } else if (Array.isArray(bom.store_items_id)) {
        rawItems = bom.store_items_id;
      }

      if (Array.isArray(rawItems) && rawItems.length > 0) {
        const mapped = rawItems.map((bi) => {
          const sItem = storeItemsList.find((s) => s.id === (bi.id || bi.store_item_id));
          const unitQty = parseFloat(bi.quantity || bi.qty || 1);
          return {
            store_item_id: bi.id || bi.store_item_id || sItem?.id || '',
            item_name: bi.item_name || bi.name || sItem?.item_name || 'Component Item',
            unit: bi.unit || sItem?.unit || 'Nos',
            qty_per_unit: unitQty,
            required_qty: unitQty * parseFloat(qty || 1)
          };
        });
        setItems(mapped);
      }
    } catch (e) {
      console.error("Error parsing BOM items:", e);
    }
  };

  // When proposed quantity changes, recalculate item required quantities
  const handleQtyChange = (newQty) => {
    const q = Math.max(1, parseInt(newQty, 10) || 1);
    setProposedQty(q);
    if (productName && (!taskTitle || taskTitle.startsWith('Build'))) {
      setTaskTitle(`Build ${q}x ${productName}`);
    }
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        required_qty: (parseFloat(it.qty_per_unit) || 1) * q
      }))
    );
  };

  // Handle Item Row Changes
  const handleItemSelect = (index, storeItemId) => {
    const sItem = storeItemsList.find((s) => String(s.id) === String(storeItemId));
    setItems((prev) => {
      const updated = [...prev];
      if (sItem) {
        updated[index] = {
          ...updated[index],
          store_item_id: sItem.id,
          item_name: sItem.item_name,
          unit: sItem.unit || 'Nos',
          required_qty: (parseFloat(updated[index].qty_per_unit) || 1) * proposedQty
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

  const handleItemQtyPerUnitChange = (index, val) => {
    const unitQ = Math.max(0.01, parseFloat(val) || 1);
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        qty_per_unit: unitQ,
        required_qty: unitQ * proposedQty
      };
      return updated;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      { store_item_id: '', item_name: '', unit: 'Nos', qty_per_unit: 1, required_qty: proposedQty }
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productName.trim()) {
      setFormError('Please select or specify the Product to manufacture.');
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
        task_title: taskTitle.trim() || `Build ${proposedQty}x ${productName.trim()}`,
        proposed_quantity: proposedQty,
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
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl overflow-hidden my-6 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
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
                Plan goods manufacturing, request store stock components, and track finished output
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
            <div className="flex items-center gap-2 text-gray-900 font-bold text-xs uppercase tracking-wider">
              <Package size={14} className="text-blue-600" />
              <span>1. Target Finished Product & Target Quantity</span>
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
                  <div className="flex items-center gap-2 mt-1">
                    {/* Check if finished good exists in store items */}
                    {(() => {
                      const fgItem = storeItemsList.find(
                        (s) => (s.product_id && s.product_id === productId) ||
                               (s.item_type === 'finished_good' && s.item_name?.toLowerCase() === productName.toLowerCase())
                      );
                      if (fgItem) {
                        return (
                          <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                            Current Finished Stock: <b>{fgItem.quantity || 0} {fgItem.unit || 'Nos'}</b>
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>

              {/* Proposed Quantity */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Proposed Target Quantity <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={proposedQty}
                    onChange={(e) => handleQtyChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-[11px]">
                    Units
                  </span>
                </div>
              </div>
            </div>

            {/* Task Title & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 space-y-1">
                <label className="block text-xs font-semibold text-gray-700">Task Title / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Build 5x Gaming Laptop (Batch A)"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Low">🟢 Low</option>
                  <option value="Medium">🔵 Medium</option>
                  <option value="High">🟠 High</option>
                  <option value="Urgent">🔴 Urgent</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Component Raw Materials from Store */}
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-xs uppercase tracking-wider">
                <Boxes size={14} className="text-indigo-600" />
                <span>2. Required Raw Material Store Items (BOM Breakdown)</span>
              </div>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold rounded-lg transition cursor-pointer"
              >
                <Plus size={13} /> Add Item
              </button>
            </div>

            <p className="text-[11px] text-gray-500">
              Items needed to produce <strong>{proposedQty}</strong> unit(s) of this product. When requested, Store will issue stock directly into production.
            </p>

            <div className="space-y-2">
              {items.map((it, idx) => {
                const matchedStoreItem = storeItemsList.find((s) => s.id === it.store_item_id);
                const currentStock = matchedStoreItem ? matchedStoreItem.quantity ?? 0 : null;
                const isStockShortage = currentStock !== null && currentStock < it.required_qty;

                return (
                  <div
                    key={idx}
                    className="p-2.5 bg-white border border-gray-200 rounded-xl grid grid-cols-12 gap-2 items-center"
                  >
                    {/* Item Select / Search */}
                    <div className="col-span-5 space-y-1">
                      <select
                        value={it.store_item_id || it.item_name}
                        onChange={(e) => handleItemSelect(idx, e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">-- Select Store Component --</option>
                        {storeItemsList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.item_name} (In Stock: {s.quantity ?? 0} {s.unit || s.uom || ''})
                          </option>
                        ))}
                      </select>
                      {currentStock !== null && (
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="text-gray-500">Available Stock: <strong>{currentStock}</strong> {it.unit}</span>
                          {isStockShortage && (
                            <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                              Shortage!
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Qty Per Unit */}
                    <div className="col-span-2 space-y-0.5">
                      <label className="text-[10px] text-gray-500 font-semibold block">Qty / Unit</label>
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        value={it.qty_per_unit}
                        onChange={(e) => handleItemQtyPerUnitChange(idx, e.target.value)}
                        className="w-full px-2 py-1 bg-slate-50 border border-gray-300 rounded-lg text-gray-900 font-bold text-center"
                      />
                    </div>

                    {/* Total Required Qty */}
                    <div className="col-span-3 space-y-0.5">
                      <label className="text-[10px] text-indigo-600 font-bold block">Total Req. Qty</label>
                      <div className="px-2 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 font-bold text-center">
                        {it.required_qty} {it.unit}
                      </div>
                    </div>

                    {/* Unit */}
                    <div className="col-span-1">
                      <label className="text-[10px] text-gray-400 block">Unit</label>
                      <span className="text-[11px] text-gray-600 font-medium">{it.unit}</span>
                    </div>

                    {/* Delete Row */}
                    <div className="col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        disabled={items.length <= 1}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Assignment & Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Assigned Technician / Lead</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full pl-8.5 pr-3 py-2 bg-slate-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Target Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-700">Production Notes / Specs</label>
            <textarea
              rows={2}
              placeholder="Assembly instructions, serial number range, or special guidelines..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
