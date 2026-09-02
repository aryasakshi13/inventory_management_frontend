import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, Package, Wrench, Layers, Box, Info, AlertCircle, Factory } from 'lucide-react';
import { getActiveCategories } from '../../brand/services/categoryService';

const UOM_OPTIONS = [
  "Nos",
  "Meter",
  "Set",
  "Kg",
  "Ltr",
  "Pcs",
  "Box",
  "Pkt",
  "Roll",
  "Pair",
  "Sq.Ft",
  "Cu.Mtr"
];

const ITEM_TYPE_OPTIONS = [
  { value: 'raw_material', label: 'Raw Material', desc: 'Components / parts (product_id: null)' },
  { value: 'finished_good', label: 'Finished Good', desc: 'Produced goods (linked to Product Master)' },
  { value: 'consumable', label: 'Consumable', desc: 'General supplies & tools (product_id: null)' }
];

export const AddEditStoreModal = ({ isOpen, onClose, onSave, editingItem, isSubmitting }) => {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [productsList, setProductsList] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [formData, setFormData] = useState({
    item_name: '',
    category: '',
    unit: 'Nos',
    item_type: 'raw_material',
    product_id: null,
    quantity: 0,
    min_threshold: 10,
  });

  useEffect(() => {
    if (isOpen) {
      // Fetch Categories
      const fetchCats = async () => {
        try {
          setLoadingCategories(true);
          const res = await getActiveCategories();
          const catList = Array.isArray(res)
            ? res
            : Array.isArray(res?.data)
              ? res.data
              : [];
          setCategories(catList);
        } catch (err) {
          console.error("Failed to load categories:", err);
        } finally {
          setLoadingCategories(false);
        }
      };

      // Fetch Products (for Finished Good linking)
      const fetchProducts = async () => {
        try {
          setLoadingProducts(true);
          const prodUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:5001/api/products'
            : 'https://www.namami-infotech.com/inventory/api/products';
          const res = await axios.get(prodUrl, { withCredentials: true });
          const pList = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.data?.data)
              ? res.data.data
              : [];
          setProductsList(pList);
        } catch (err) {
          console.error("Failed to load products for store items modal:", err);
        } finally {
          setLoadingProducts(false);
        }
      };

      fetchCats();
      fetchProducts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        item_name: editingItem.item_name || editingItem.name || '',
        category: editingItem.category || '',
        unit: editingItem.unit || editingItem.uom || 'Nos',
        item_type: editingItem.item_type || 'raw_material',
        product_id: editingItem.product_id || null,
        quantity: editingItem.quantity ?? 0,
        min_threshold: editingItem.min_threshold ?? editingItem.minThreshold ?? 10,
      });
    } else {
      setFormData({ 
        item_name: '', 
        category: '', 
        unit: 'Nos', 
        item_type: 'raw_material', 
        product_id: null,
        quantity: 0, 
        min_threshold: 10 
      });
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const handleTypeChange = (typeVal) => {
    setFormData((prev) => ({
      ...prev,
      item_type: typeVal,
      // If switching away from finished_good, reset product_id to null
      product_id: typeVal === 'finished_good' ? prev.product_id : null
    }));
  };

  const handleProductSelect = (pId) => {
    const matched = productsList.find((p) => String(p.id) === String(pId));
    setFormData((prev) => ({
      ...prev,
      product_id: pId ? Number(pId) : null,
      item_name: matched ? matched.product_name : prev.item_name
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.item_name.trim() || !formData.category.trim()) return;

    onSave({
      ...formData,
      unit: formData.unit || 'Nos',
      uom: formData.unit || 'Nos',
      item_type: formData.item_type || 'raw_material',
      product_id: formData.item_type === 'finished_good' ? (formData.product_id ? Number(formData.product_id) : null) : null,
      quantity: Number(formData.quantity) || 0,
      min_threshold: Number(formData.min_threshold),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 text-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/80">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-blue-600" />
            <h2 className="font-bold text-gray-900 text-sm">
              {editingItem ? 'Edit Store Item' : 'Add New Store Item'}
            </h2>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg disabled:opacity-50">
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Item Type Selector */}
          <div>
            <label className="block font-bold text-gray-700 uppercase text-[10px] mb-1.5">
              Item Classification *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ITEM_TYPE_OPTIONS.map((opt) => {
                const isSelected = formData.item_type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleTypeChange(opt.value)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? opt.value === 'finished_good'
                          ? 'border-purple-600 bg-purple-50/80 text-purple-900 font-bold shadow-2xs'
                          : 'border-blue-600 bg-blue-50/80 text-blue-900 font-bold shadow-2xs'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {opt.value === 'finished_good' ? (
                        <Box size={14} className="text-purple-600 shrink-0" />
                      ) : opt.value === 'consumable' ? (
                        <Wrench size={14} className="text-slate-600 shrink-0" />
                      ) : (
                        <Layers size={14} className="text-blue-600 shrink-0" />
                      )}
                      <span className="text-xs font-bold">{opt.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Product Link Notice */}
          {formData.item_type === 'finished_good' ? (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-purple-900 uppercase text-[10px]">
                  Linked Product Master (Optional / Recommended)
                </label>
                <span className="text-[10px] text-purple-600 font-medium">product_id map</span>
              </div>
              <select
                value={formData.product_id || ''}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="w-full p-2 border border-purple-300 rounded-lg text-gray-900 outline-none focus:ring-2 focus:ring-purple-500 bg-white font-medium text-xs"
              >
                <option value="">-- Direct Finished Good (Or select Product) --</option>
                {productsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.product_name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-purple-700 leading-tight">
                Selecting a product links this finished stock directly to production orders & delivery fulfillment.
              </p>
            </div>
          ) : (
            <div className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center gap-2 text-blue-700 text-[11px]">
              <Info size={14} className="shrink-0 text-blue-500" />
              <span>
                Raw materials & consumables are shared components across multiple BOMs (<b>product_id = null</b>).
              </span>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block font-bold text-gray-700 uppercase text-[10px] mb-1">
              Category *
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full p-2.5 border border-gray-300 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-xs"
            >
              <option value="">
                {loadingCategories ? 'Loading categories...' : '-- Select Category --'}
              </option>
              {categories.map((c) => {
                const name = c.category_name || c.name;
                const id = c.category_id || c.id || name;
                return (
                  <option key={id} value={name}>
                    {name}
                  </option>
                );
              })}
              {formData.category && !categories.some((c) => (c.category_name || c.name) === formData.category) && (
                <option value={formData.category}>{formData.category}</option>
              )}
            </select>
          </div>

          {/* Item Name */}
          <div>
            <label className="block font-bold text-gray-700 uppercase text-[10px] mb-1">
              Item Name *
            </label>
            <input
              type="text"
              required
              placeholder={formData.item_type === 'finished_good' ? "e.g. 5kVA Solar Inverter" : "e.g. 4 sq.mm DC Solar Cable / MC4 Connector"}
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              className="w-full p-2.5 border border-gray-300 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block font-bold text-gray-700 uppercase text-[10px] mb-1">
                UOM *
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-xs"
              >
                {UOM_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase text-[10px] mb-1">
                Stock Qty
              </label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase text-[10px] mb-1">
                Min Alert *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.min_threshold}
                onChange={(e) => setFormData({ ...formData, min_threshold: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              <Save size={14} /> {isSubmitting ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};