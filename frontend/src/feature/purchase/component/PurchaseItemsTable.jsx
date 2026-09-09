import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { getAllStoreItems } from '../../storeItems/services/storeItemService';
import { getActiveBrands } from '../../brand/services/brandService';

export const PurchaseItemsTable = ({ items, addItemRow, removeItemRow, updateItemRow, errors = {} }) => {
  const [storeItems, setStoreItems] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(true);

  useEffect(() => {
    const fetchStoreItemsAndBrands = async () => {
      try {
        setLoadingItems(true);
        const data = await getAllStoreItems();
        const itemsList = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.items)
              ? data.items
              : Array.isArray(data?.storeItems)
                ? data.storeItems
                : [];

        // Exclude Finished Goods (only keep Raw Materials & Consumables for Purchase Orders)
        const rawItemsOnly = itemsList.filter((it) => {
          const type = (it.item_type || '').toLowerCase().trim();
          const cat = (it.category || '').toLowerCase().trim();
          const isFinished = type === 'finished_good' || cat === 'finished goods' || cat === 'finished good' || it.product_id;
          return !isFinished;
        });

        setStoreItems(rawItemsOnly);
      } catch (err) {
        console.error('Failed to fetch store items for purchase entry:', err);
      } finally {
        setLoadingItems(false);
      }

      try {
        setLoadingBrands(true);
        const brandRes = await getActiveBrands();
        const brandList = Array.isArray(brandRes)
          ? brandRes
          : Array.isArray(brandRes?.data)
            ? brandRes.data
            : [];
        setBrands(brandList);
      } catch (err) {
        console.error('Failed to fetch brands for purchase entry:', err);
      } finally {
        setLoadingBrands(false);
      }
    };

    fetchStoreItemsAndBrands();
  }, []);

  const handleDigitInput = (id, field, rawValue, allowDecimal = true, maxVal = null) => {
    let val = String(rawValue).replace(/[^0-9.]/g, '');
    if (!allowDecimal) {
      val = val.replace(/\./g, '');
    } else {
      const parts = val.split('.');
      if (parts.length > 2) {
        val = parts[0] + '.' + parts.slice(1).join('');
      }
    }
    if (maxVal !== null && Number(val) > maxVal) {
      val = String(maxVal);
    }
    updateItemRow(id, field, val);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs text-xs space-y-0">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
        <div>
          <h3 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">Item Details</h3>
          {errors.items && (
            <div className="flex items-center gap-1.5 text-rose-600 font-semibold text-xs mt-1">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errors.items}</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={addItemRow}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          <Plus size={14} /> Add Row
        </button>
      </div>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[750px]">
          <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
            <tr>
              <th className="py-2.5 px-3 w-8 text-center">#</th>
              <th className="py-2.5 px-3 min-w-[200px]">Item / Product Name *</th>
              <th className="py-2.5 px-3 min-w-[130px]">Brand</th>
              <th className="py-2.5 px-3 w-24 text-right">Quantity *</th>
              <th className="py-2.5 px-3 w-28 text-right">Rate (₹)</th>
              <th className="py-2.5 px-3 w-20 text-right">Tax (%)</th>
              <th className="py-2.5 px-3 w-24 text-right">Discount (₹)</th>
              <th className="py-2.5 px-3 w-32 text-right">Line Total (₹)</th>
              <th className="py-2.5 px-3 w-12 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item, idx) => (
              <tr key={item.id} className="hover:bg-gray-50/60">
                <td className="py-2.5 px-3 text-center text-gray-400 font-bold">{idx + 1}</td>
                <td className="py-2.5 px-3">
                  <select
                    value={item.item_id || item.itemName || ''}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      const selectedObj = storeItems.find(
                        (s) => String(s.id) === String(selectedVal) || (s.item_name || s.name) === selectedVal
                      );
                      if (selectedObj) {
                        updateItemRow(item.id, 'item', selectedObj);
                      } else {
                        updateItemRow(item.id, 'itemName', selectedVal);
                      }
                    }}
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded-md p-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="">
                      {loadingItems ? 'Loading store items...' : '-- Select Store Item --'}
                    </option>
                    {storeItems.map((storeItem) => {
                      const name = storeItem.item_name || storeItem.name;
                      const id = storeItem.id || storeItem._id;
                      return (
                        <option key={id} value={id}>
                          {name} {storeItem.category ? `(${storeItem.category})` : ''}
                        </option>
                      );
                    })}
                    {item.itemName && !storeItems.some((s) => String(s.id) === String(item.item_id) || (s.item_name || s.name) === item.itemName) && (
                      <option value={item.itemName}>{item.itemName}</option>
                    )}
                  </select>
                </td>
                <td className="py-2.5 px-3">
                  <select
                    value={item.brand || ''}
                    onChange={(e) => updateItemRow(item.id, 'brand', e.target.value)}
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded-md p-1.5 focus:ring-1 focus:ring-blue-500 outline-none text-xs font-medium"
                  >
                    <option value="">
                      {loadingBrands ? 'Loading brands...' : '-- Select Brand --'}
                    </option>
                    {brands.map((b) => {
                      const brandName = b.brand_name || b.name || b.brand;
                      const brandId = b.brand_id || b.id || brandName;
                      return (
                        <option key={brandId} value={brandName}>
                          {brandName}
                        </option>
                      );
                    })}
                    {item.brand && !brands.some((b) => (b.brand_name || b.name || b.brand) === item.brand) && (
                      <option value={item.brand}>{item.brand}</option>
                    )}
                  </select>
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="1"
                    value={item.quantity ?? ''}
                    onChange={(e) => handleDigitInput(item.id, 'quantity', e.target.value, true)}
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded-md p-1.5 text-right font-mono focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={item.rate ?? ''}
                    onChange={(e) => handleDigitInput(item.id, 'rate', e.target.value, true)}
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded-md p-1.5 text-right font-mono focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={item.taxPercent ?? ''}
                    onChange={(e) => handleDigitInput(item.id, 'taxPercent', e.target.value, true, 100)}
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded-md p-1.5 text-right font-mono focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={item.discount ?? ''}
                    onChange={(e) => handleDigitInput(item.id, 'discount', e.target.value, true)}
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded-md p-1.5 text-right font-mono focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-gray-900 font-mono">
                  ₹{(item.lineTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <button
                    type="button"
                    onClick={() => removeItemRow(item.id)}
                    disabled={items.length === 1}
                    className="p-1 text-gray-400 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-gray-400"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};