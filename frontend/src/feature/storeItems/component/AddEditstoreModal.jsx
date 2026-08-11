import React, { useState, useEffect } from 'react';
import { X, Save, Package } from 'lucide-react';

export const AddEditStoreModal = ({ isOpen, onClose, onSave, editingItem, isSubmitting }) => {
  const [formData, setFormData] = useState({
    item_name: '',
    category: '',
    min_threshold: 10,
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        item_name: editingItem.item_name || editingItem.name || '',
        category: editingItem.category || '',
        min_threshold: editingItem.min_threshold ?? editingItem.minThreshold ?? 10,
      });
    } else {
      setFormData({ item_name: '', category: '', min_threshold: 10 });
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.item_name.trim() || !formData.category.trim()) return;
    onSave({
      ...formData,
      min_threshold: Number(formData.min_threshold),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 text-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
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
           <div>
            <label className="block font-bold text-gray-700 uppercase text-[10px] mb-1">
              Category *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Electronics, Hardware"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          
          <div>
            <label className="block font-bold text-gray-700 uppercase text-[10px] mb-1">
              Item Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Wireless Mouse"
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 uppercase text-[10px] mb-1">
              Min Threshold Alert *
            </label>
            <input
              type="number"
              min="1"
              required
              value={formData.min_threshold}
              onChange={(e) => setFormData({ ...formData, min_threshold: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={14} /> {isSubmitting ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};