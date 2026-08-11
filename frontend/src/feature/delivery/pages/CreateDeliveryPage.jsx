import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Send, ArrowLeft } from 'lucide-react';
import { useDeliveryForm } from '../hooks/useDeliveryForm';
import { fetchSalesOrders } from '../../client/services/salesOrderService';
import { createDeliveryChallan } from '../services/deliveryService';

export const CreateDeliveryPage = ({ onBack, onSuccess }) => {
  const [salesOrders, setSalesOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  const {
    formData,
    items,
    loading,
    error,
    setError,
    setLoading,
    handleHeaderChange,
    addItemRow,
    removeItemRow,
    updateItemRow,
    resetForm,
  } = useDeliveryForm();

  // Fetch all sales orders
  useEffect(() => {
    const loadSalesOrders = async () => {
      try {
        setLoadingOrders(true);
        const res = await fetchSalesOrders();
        if (res?.data) {
          setSalesOrders(res.data);
        } else if (Array.isArray(res)) {
          setSalesOrders(res);
        }
      } catch (err) {
        console.error('Failed to load sales orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    };
    loadSalesOrders();
  }, []);

  // Handle Sales Order selection change
  const handleOrderSelect = (e) => {
    const orderId = e.target.value;
    setSelectedOrderId(orderId);

    if (!orderId) {
      setSelectedOrder(null);
      handleHeaderChange({ target: { name: 'customer_name', value: '' } });
      handleHeaderChange({ target: { name: 'delivery_address', value: '' } });
      return;
    }

    const found = salesOrders.find(
      (o) => String(o.Id || o.id) === String(orderId)
    );

    if (found) {
      setSelectedOrder(found);
      const cName = found.clientName || found.companyName || found.customer_name || '';
      const address = found.shippingAddress || found.billingAddress || '';

      handleHeaderChange({ target: { name: 'customer_name', value: cName } });
      handleHeaderChange({ target: { name: 'delivery_address', value: address } });

      const autoChallanNo = `DC-${found.poNo || found.Id || Date.now()}`;
      handleHeaderChange({ target: { name: 'challan_no', value: autoChallanNo } });
    }
  };

  const handleReset = () => {
    resetForm();
    setSelectedOrderId('');
    setSelectedOrder(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!selectedOrderId) return setError('Please select a Sales Order / PO Number.');
    if (!formData.dispatch_date) return setError('Dispatch date is required.');

    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      const ordered = Number(row.ordered_qty) || 0;
      const delivered = Number(row.delivered_qty) || 0;

      if (!row.item_name.trim()) {
        return setError(`Please select an item at row #${i + 1}`);
      }
      if (ordered <= 0) {
        return setError(`Ordered quantity must be greater than 0 at row #${i + 1}`);
      }
      if (delivered < 0) {
        return setError(`Delivered quantity cannot be negative at row #${i + 1}`);
      }
      if (delivered > ordered) {
        return setError(`Delivered quantity cannot exceed ordered quantity for "${row.item_name}"`);
      }
    }

    const payload = {
      order_id: Number(selectedOrderId) || selectedOrderId,
      dispatch_date: formData.dispatch_date,
      transporter_name: formData.transporter_name || '',
      vehicle_no: formData.vehicle_no || '',
      items: items.map((item) => ({
        product_id: item.product_id ? Number(item.product_id) : null,
        item_name: item.item_name,
        category: item.category || 'General',
        ordered_qty: Number(item.ordered_qty),
        delivered_qty: Number(item.delivered_qty),
      })),
    };

    try {
      setLoading(true);
      const res = await createDeliveryChallan(payload);
      setLoading(false);
      if (res.success) {
        resetForm();
        setSelectedOrderId('');
        setSelectedOrder(null);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to create delivery challan.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              type="button"
              className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-800">Create Delivery Challan</h1>
            <p className="text-xs text-gray-500">Dispatch items and track full or partial fulfillments</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Sales Order & Logistics Info */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Challan Header Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            {/* Sales Order / PO Search & Select Dropdown */}
            <div className="md:col-span-2">
              <label className="block font-medium text-gray-700 mb-1">Select Sales Order / PO Number *</label>
              <select
                value={selectedOrderId}
                onChange={handleOrderSelect}
                className="w-full border border-gray-300 rounded-md p-2 bg-white focus:ring-1 focus:ring-blue-500 text-black font-medium"
              >
                <option value="">
                  {loadingOrders ? 'Loading Sales Orders...' : '-- Select Sales Order / PO --'}
                </option>
                {salesOrders.map((ord) => {
                  const oId = ord.Id || ord.id;
                  const poLabel = ord.poNo ? `(PO: ${ord.poNo})` : '';
                  const clientLabel = ord.clientName || ord.companyName || 'Customer';
                  return (
                    <option key={oId} value={oId}>
                      SO-{oId} {poLabel} - {clientLabel}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Dispatch Date */}
            <div>
              <label className="block font-medium text-gray-700 mb-1">Dispatch Date *</label>
              <input
                type="date"
                name="dispatch_date"
                value={formData.dispatch_date}
                onChange={handleHeaderChange}
                className="w-full border border-gray-300 rounded-md p-2 bg-white focus:ring-1 focus:ring-blue-500 text-black"
              />
            </div>

            {/* Transporter Name */}
            <div>
              <label className="block font-medium text-gray-700 mb-1">Transporter Name</label>
              <input
                type="text"
                name="transporter_name"
                placeholder="Courier / Transport Service"
                value={formData.transporter_name}
                onChange={handleHeaderChange}
                className="w-full border border-gray-300 rounded-md p-2 bg-white focus:ring-1 focus:ring-blue-500 text-black"
              />
            </div>

            {/* Vehicle No */}
            <div>
              <label className="block font-medium text-gray-700 mb-1">Vehicle No</label>
              <input
                type="text"
                name="vehicle_no"
                placeholder="e.g. DL 01 AB 1234"
                value={formData.vehicle_no}
                onChange={handleHeaderChange}
                className="w-full border border-gray-300 rounded-md p-2 bg-white focus:ring-1 focus:ring-blue-500 text-black"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Line Items Table */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Dispatched Items</h2>
            <button
              type="button"
              onClick={addItemRow}
              className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold px-3 py-1.5 rounded-md transition"
            >
              <Plus size={14} /> Add Item Row
            </button>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3 w-8 text-center">#</th>
                  <th className="py-2.5 px-3 min-w-[280px]">Item / Order Product Name</th>
                  <th className="py-2.5 px-3 w-28 text-right">Ordered Qty</th>
                  <th className="py-2.5 px-3 w-28 text-right">Delivered Qty</th>
                  <th className="py-2.5 px-3 w-28 text-right">Remaining Qty</th>
                  <th className="py-2.5 px-3 w-12 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs">
                {items.map((item, idx) => {
                  const ordered = Number(item.ordered_qty) || 0;
                  const delivered = Number(item.delivered_qty) || 0;
                  const remaining = Math.max(0, ordered - delivered);

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/60">
                      <td className="py-2.5 px-3 text-center text-gray-400 font-bold">{idx + 1}</td>

                      {/* Item / Product Selection Dropdown (filtered by selected Sales Order) */}
                      <td className="py-2.5 px-3">
                        <select
                          className="w-full bg-white border border-gray-300 rounded p-1.5 text-gray-800 text-xs focus:ring-1 focus:ring-blue-500"
                          value={item.selected_order_item_key || ''}
                          onChange={(e) => {
                            const selectedKey = e.target.value;
                            if (!selectedKey) {
                              updateItemRow(item.id, 'item_name', '');
                              updateItemRow(item.id, 'product_id', null);
                              updateItemRow(item.id, 'ordered_qty', '');
                              updateItemRow(item.id, 'delivered_qty', '');
                              updateItemRow(item.id, 'selected_order_item_key', '');
                              return;
                            }

                            const orderItems = selectedOrder?.items || [];
                            const foundItem = orderItems.find(
                              (ordItem, idxKey) => `${ordItem.itemId || ordItem.Id || idxKey}` === selectedKey
                            );

                            if (foundItem) {
                              const name = foundItem.itemName || foundItem.name || '';
                              const qty = foundItem.qty || foundItem.quantity || 0;
                              const pId = foundItem.itemId || foundItem.productId || foundItem.product_id || foundItem.Id || foundItem.id || null;
                              updateItemRow(item.id, 'item_name', name);
                              updateItemRow(item.id, 'product_id', pId);
                              updateItemRow(item.id, 'ordered_qty', qty);
                              updateItemRow(item.id, 'delivered_qty', qty);
                              updateItemRow(item.id, 'selected_order_item_key', selectedKey);
                            }
                          }}
                        >
                          <option value="">
                            {!selectedOrderId
                              ? '-- Select Sales Order First --'
                              : (!selectedOrder?.items || selectedOrder.items.length === 0)
                              ? '-- No Items Found in Selected Order --'
                              : '-- Select Item from Order --'}
                          </option>

                          {(selectedOrder?.items || []).map((ordItem, idxKey) => {
                            const itemKey = `${ordItem.itemId || ordItem.Id || idxKey}`;
                            const name = ordItem.itemName || ordItem.name || 'Unnamed Item';
                            const qty = ordItem.qty || ordItem.quantity || 0;
                            const price = ordItem.price ? ` — ₹${ordItem.price}` : '';
                            return (
                              <option key={itemKey} value={itemKey}>
                                {name} (Ordered Qty: {qty}{price})
                              </option>
                            );
                          })}
                        </select>
                      </td>

                      {/* Ordered Quantity (Auto-populated from selected order item, Read Only) */}
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          readOnly
                          placeholder="0"
                          value={item.ordered_qty}
                          className="w-full bg-gray-100 border border-gray-300 rounded p-1.5 text-right font-mono text-gray-700 cursor-not-allowed"
                        />
                      </td>

                      {/* Delivered Quantity */}
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          min="0"
                          max={item.ordered_qty || undefined}
                          placeholder="0"
                          value={item.delivered_qty}
                          onChange={(e) => updateItemRow(item.id, 'delivered_qty', e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded p-1.5 text-right font-mono font-bold text-blue-600"
                        />
                      </td>

                      {/* Calculated Remaining Quantity */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-600">
                        {remaining}
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(item.id)}
                          disabled={items.length === 1}
                          className="p-1 text-gray-400 hover:text-rose-600 disabled:opacity-30 transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Submit Button */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 rounded-md text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-sm disabled:opacity-50 transition"
          >
            <Send size={14} />
            {loading ? 'Submitting...' : 'Save & Dispatch Delivery'}
          </button>
        </div>
      </form>
    </div>
  );
};

