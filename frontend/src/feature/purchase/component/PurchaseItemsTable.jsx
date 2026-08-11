import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { getAllStoreItems } from '../../storeItems/services/storeItemService';

export const PurchaseItemsTable = ({ items, addItemRow, removeItemRow, updateItemRow }) => {
  const [storeItems, setStoreItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);

  useEffect(() => {
    const fetchStoreItems = async () => {
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
        setStoreItems(itemsList);
      } catch (err) {
        console.error('Failed to fetch store items for purchase entry:', err);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchStoreItems();
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs text-xs">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
        <h3 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">Item Details</h3>
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
              <th className="py-2.5 px-3 min-w-[220px]">Item / Product Name</th>
              <th className="py-2.5 px-3 w-24 text-right">Quantity</th>
              <th className="py-2.5 px-3 w-32 text-right">Rate (₹)</th>
              <th className="py-2.5 px-3 w-24 text-right">Tax (%)</th>
              <th className="py-2.5 px-3 w-28 text-right">Discount (₹)</th>
              <th className="py-2.5 px-3 w-36 text-right">Line Total (₹)</th>
              <th className="py-2.5 px-3 w-12 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item, idx) => (
              <tr key={item.id} className="hover:bg-gray-50/60">
                <td className="py-2.5 px-3 text-center text-gray-400 font-bold">{idx + 1}</td>
                <td className="py-2.5 px-3">
                  <select
                    value={item.itemName || ''}
                    onChange={(e) => updateItemRow(item.id, 'itemName', e.target.value)}
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded-md p-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="">
                      {loadingItems ? 'Loading store items...' : '-- Select Store Item --'}
                    </option>
                    {storeItems.map((storeItem) => {
                      const name = storeItem.item_name || storeItem.name;
                      const id = storeItem.id || storeItem._id || name;
                      return (
                        <option key={id} value={name}>
                          {name} {storeItem.category ? `(${storeItem.category})` : ''}
                        </option>
                      );
                    })}
                    {item.itemName && !storeItems.some((s) => (s.item_name || s.name) === item.itemName) && (
                      <option value={item.itemName}>{item.itemName}</option>
                    )}
                  </select>
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItemRow(item.id, 'quantity', e.target.value)}
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded-md p-1.5 text-right"
                  />
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="number"
                    min="0"
                    value={item.rate}
                    onChange={(e) => updateItemRow(item.id, 'rate', e.target.value)}
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded-md p-1.5 text-right font-mono"
                  />
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={item.taxPercent}
                    onChange={(e) => updateItemRow(item.id, 'taxPercent', e.target.value)}
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded-md p-1.5 text-right"
                  />
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="number"
                    min="0"
                    value={item.discount}
                    onChange={(e) => updateItemRow(item.id, 'discount', e.target.value)}
                    className="w-full bg-white text-gray-900 border border-gray-300 rounded-md p-1.5 text-right font-mono"
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