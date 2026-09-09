import React, { useState, useEffect } from 'react';
import { X, Save, Package, AlertCircle, Lock, CheckCircle2, XCircle } from 'lucide-react';
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

export const AddEditStoreModal = ({ isOpen, onClose, onSave, editingItem, isSubmitting }) => {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [formData, setFormData] = useState({
    item_name: '',
    category: '',
    unit: 'Nos',
    item_type: 'raw_material',
    product_id: null,
    min_threshold: 10,
    is_active: 1,
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

      fetchCats();
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
        min_threshold: editingItem.min_threshold ?? editingItem.minThreshold ?? 10,
        is_active: editingItem.is_active !== undefined ? (Number(editingItem.is_active) === 0 ? 0 : 1) : 1,
      });
    } else {
      setFormData({ 
        item_name: '', 
        category: '', 
        unit: 'Nos', 
        item_type: 'raw_material', 
        product_id: null,
        min_threshold: 10,
        is_active: 1
      });
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.item_name.trim() || !formData.category.trim()) return;

    onSave({
      ...formData,
      item_name: formData.item_name.trim(),
      category: formData.category.trim(),
      unit: formData.unit || 'Nos',
      uom: formData.unit || 'Nos',
      item_type: editingItem?.item_type || 'raw_material',
      product_id: editingItem?.product_id || null,
      quantity: editingItem ? (Number(editingItem.quantity) || 0) : 0,
      min_threshold: Number(formData.min_threshold) || 0,
      is_active: formData.is_active === 0 ? 0 : 1,
    });
  };

  const isEditing = Boolean(editingItem);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 text-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/80">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-blue-600" />
            <h2 className="font-bold text-gray-900 text-sm">
              {isEditing ? 'Edit Store Item' : 'Add New Store Item'}
            </h2>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg disabled:opacity-50 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Category - Locked / Disabled on Edit */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-gray-700 uppercase text-[10px]">
                Category *
              </label>
              {isEditing && (
                <span className="flex items-center gap-1 text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <Lock size={10} /> Category cannot be changed
                </span>
              )}
            </div>
            <select
              required
              disabled={isEditing}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={`w-full p-2.5 border rounded-xl outline-none text-xs font-medium ${
                isEditing
                  ? 'bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'
              }`}
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
              placeholder="e.g. 4 sq.mm DC Solar Cable / MC4 Connector"
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              className="w-full p-2.5 border border-gray-300 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white"
            />
          </div>

          {/* UOM and Min Alert */}
          <div className="grid grid-cols-2 gap-3">
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
                Min Stock Alert *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.min_threshold}
                onChange={(e) => setFormData({ ...formData, min_threshold: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white"
              />
            </div>
          </div>

          {/* Status: Active / Inactive */}
          <div>
            <label className="block font-bold text-gray-700 uppercase text-[10px] mb-1">
              Status (Active / Inactive) *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_active: 1 })}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  formData.is_active === 1
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-2xs ring-1 ring-emerald-500'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <CheckCircle2 size={14} className={formData.is_active === 1 ? 'text-emerald-600' : 'text-gray-400'} />
                <span>Active</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_active: 0 })}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  formData.is_active === 0
                    ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-2xs ring-1 ring-rose-500'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <XCircle size={14} className={formData.is_active === 0 ? 'text-rose-600' : 'text-gray-400'} />
                <span>Inactive</span>
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer"
            >
              <Save size={14} /> {isSubmitting ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};