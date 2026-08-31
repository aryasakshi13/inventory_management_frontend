import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Send, ArrowLeft, PackageCheck, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useDeliveryForm } from '../hooks/useDeliveryForm';
import { fetchSalesOrders } from '../../client/services/salesOrderService';
import { fetchAllBOMPreparations } from '../../bomPreparation/services/bomPreparationService';
import { createDeliveryChallan, fetchOrderDispatchSummary } from '../services/deliveryService';

export const CreateDeliveryPage = ({ onBack, onSuccess }) => {
  const [salesOrders, setSalesOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedOrderSummary, setSelectedOrderSummary] = useState(null);
  const [preparationId, setPreparationId] = useState(null);
  const [orderItemsList, setOrderItemsList] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  
  const {
    formData,
    items,
    populateItems,
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

  // Fetch sales orders and filter to ONLY those with a prepared BOM and remaining balance
  useEffect(() => {
    const loadSalesOrders = async () => {
      try {
        setLoadingOrders(true);
        const [res, prepRes] = await Promise.all([
          fetchSalesOrders(),
          fetchAllBOMPreparations().catch(() => ({ data: [] }))
        ]);

        const ordersList = res?.data ?? (Array.isArray(res) ? res : []);
        const prepsList = prepRes?.data ?? (Array.isArray(prepRes) ? prepRes : []);

        const prepMap = new Map();
        prepsList.forEach((p) => {
          if (p.sales_order_id) {
            prepMap.set(Number(p.sales_order_id), p);
          }
        });

        // Filter to orders with prepared BOM
        const preparedOrdersOnly = ordersList
          .filter((ord) => {
            const ordId = Number(ord.Id || ord.id);
            const prep = prepMap.get(ordId);
            return prep && Array.isArray(prep.items) && prep.items.length > 0;
          })
          .map((ord) => {
            const ordId = Number(ord.Id || ord.id);
            const prep = prepMap.get(ordId);
            return {
              ...ord,
              preparationId: prep.id,
            };
          });

        setSalesOrders(preparedOrdersOnly);
      } catch (err) {
        console.error('Failed to load sales orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    };
    loadSalesOrders();
  }, []);

  // Handle Sales Order selection change & load dispatch summary
  const handleOrderSelect = async (e) => {
    const orderId = e.target.value;
    setSelectedOrderId(orderId);
    setSelectedOrderSummary(null);
    setPreparationId(null);
    setOrderItemsList([]);
    setError(null);

    if (!orderId) {
      handleHeaderChange({ target: { name: 'customer_name', value: '' } });
      handleHeaderChange({ target: { name: 'delivery_address', value: '' } });
      populateItems([]);
      return;
    }

    const found = salesOrders.find(
      (o) => String(o.Id || o.id) === String(orderId)
    );

    if (found) {
      const cName = found.clientName || found.companyName || found.customer_name || '';
      const address = found.shippingAddress || found.billingAddress || '';

      handleHeaderChange({ target: { name: 'customer_name', value: cName } });
      handleHeaderChange({ target: { name: 'delivery_address', value: address } });

      const autoChallanNo = `DC-${found.poNo || found.Id || Date.now()}`;
      handleHeaderChange({ target: { name: 'challan_no', value: autoChallanNo } });
      setPreparationId(found.preparationId || null);
    }

    try {
      setLoadingSummary(true);
      const summaryRes = await fetchOrderDispatchSummary(orderId);
      if (summaryRes?.success && summaryRes.data) {
        const data = summaryRes.data;
        setSelectedOrderSummary(data);
        setPreparationId(data.preparation_id || null);

        const allItems = (data.items || []).map((it, idx) => ({
          key: it.key || `prep-item-${it.item_id}-${idx}`,
          item_id: it.item_id,
          product_id: it.product_id || it.item_id,
          item_name: it.item_name,
          brand: it.brand,
          unit: it.unit,
          category: it.category || 'General',
          required_qty: it.required_qty,
          already_dispatched_qty: it.already_dispatched_qty,
          balance_qty: it.balance_qty,
          warehouse_stock: it.warehouse_stock,
          suggested_dispatch_qty: it.suggested_dispatch_qty,
        }));

        setOrderItemsList(allItems);

        // Auto-populate ALL BOM items as individual rows in the dispatch table
        const allBOMRows = allItems.map((it, idx) => ({
          id: Date.now() + idx + Math.random(),
          item_id: it.item_id,
          product_id: it.product_id,
          item_name: it.item_name,
          brand: it.brand || '',
          unit: it.unit || 'Nos',
          category: it.category,
          required_qty: it.required_qty,
          already_dispatched_qty: it.already_dispatched_qty,
          balance_qty: it.balance_qty,
          warehouse_stock: it.warehouse_stock,
          ordered_qty: it.balance_qty,
          delivered_qty: it.suggested_dispatch_qty ?? (it.warehouse_stock > 0 ? Math.min(it.balance_qty, it.warehouse_stock) : 0),
          selected_order_item_key: it.key,
        }));

        populateItems(allBOMRows);
      }
    } catch (sumErr) {
      console.warn('Could not fetch order dispatch summary:', sumErr);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleReset = () => {
    resetForm();
    setSelectedOrderId('');
    setSelectedOrderSummary(null);
    setPreparationId(null);
    setOrderItemsList([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!selectedOrderId) return setError('Please select a Sales Order / PO Number.');
    if (!formData.dispatch_date) return setError('Dispatch date is required.');

    // Filter items to dispatch (only items with delivered_qty > 0)
    const itemsToDispatch = items.filter((row) => Number(row.delivered_qty) > 0);

    if (itemsToDispatch.length === 0) {
      return setError('Please enter a Dispatch Quantity greater than 0 for at least one item.');
    }

    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      const delivered = Number(row.delivered_qty) || 0;
      const balance = Number(row.balance_qty ?? row.ordered_qty) || 0;
      const stock = Number(row.warehouse_stock ?? Infinity);

      if (delivered > 0) {
        if (!row.item_name?.trim()) {
          return setError(`Please select a valid item at row #${i + 1}`);
        }
        if (balance > 0 && delivered > balance) {
          return setError(`Cannot dispatch ${delivered} units for "${row.item_name}". Remaining balance is only ${balance}.`);
        }
        if (delivered > stock) {
          return setError(`Warehouse stock insufficient for "${row.item_name}". Available stock: ${stock}, Requested: ${delivered}.`);
        }
      }
    }

    const payload = {
      order_id: Number(selectedOrderId) || selectedOrderId,
      preparation_id: preparationId || null,
      dispatch_date: formData.dispatch_date,
      transporter_name: formData.transporter_name || '',
      vehicle_no: formData.vehicle_no || '',
      delivery_items: itemsToDispatch.map((item) => ({
        item_id: Number(item.item_id || item.product_id || item.id) || null,
        ordered_qty: Number(item.required_qty || item.ordered_qty) || 0,
        delivered_qty: Number(item.delivered_qty) || 0,
      })),
    };

    try {
      setLoading(true);
      const res = await createDeliveryChallan(payload);
      setLoading(false);
      if (res.success) {
        resetForm();
        setSelectedOrderId('');
        setSelectedOrderSummary(null);
        setPreparationId(null);
        setOrderItemsList([]);
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
            <h1 className="text-xl font-bold text-gray-800">Create Delivery Challan & Dispatch</h1>
            <p className="text-xs text-gray-500">Supports Partial & Full Dispatches with automated warehouse inventory reduction</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-md flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
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
            <div className="md:col-span-2">
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

            {/* Delivery Address */}
            <div className="md:col-span-2">
              <label className="block font-medium text-gray-700 mb-1">Delivery / Site Address</label>
              <input
                type="text"
                name="delivery_address"
                readOnly
                placeholder="Auto-populated from Sales Order"
                value={formData.delivery_address}
                className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Partial Dispatch Summary Status Cards */}
        {selectedOrderSummary && (
          <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 border border-blue-200 rounded-lg p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-3 border-b border-blue-200/60 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  Partial Dispatch & Fulfillment Status for PO #{selectedOrderSummary.po_number}
                </span>
                <p className="text-[11px] text-gray-600">
                  Customer: <span className="font-semibold text-gray-800">{selectedOrderSummary.customer_name}</span> | Previous Shipments: <span className="font-semibold text-gray-800">{selectedOrderSummary.previous_challans_count}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                  selectedOrderSummary.is_fully_fulfilled
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedOrderSummary.total_dispatched_qty > 0
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {selectedOrderSummary.is_fully_fulfilled ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                  {selectedOrderSummary.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="bg-white p-2.5 rounded-md border border-gray-200">
                <div className="text-gray-500 text-[11px]">Total BOM Required</div>
                <div className="text-base font-bold text-gray-800">
                  {selectedOrderSummary.total_required_qty} <span className="text-xs font-normal text-gray-500">Qty ({selectedOrderSummary.items?.length || 0} Items)</span>
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-md border border-gray-200">
                <div className="text-gray-500 text-[11px]">Already Dispatched</div>
                <div className="text-base font-bold text-indigo-600">
                  {selectedOrderSummary.total_dispatched_qty} <span className="text-xs font-normal text-gray-500">Qty</span>
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-md border border-gray-200">
                <div className="text-gray-500 text-[11px]">Remaining Balance</div>
                <div className="text-base font-bold text-amber-600">
                  {selectedOrderSummary.total_balance_qty} <span className="text-xs font-normal text-gray-500">Qty</span>
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-md border border-gray-200">
                <div className="text-gray-500 text-[11px]">Challan Shipment #</div>
                <div className="text-base font-bold text-emerald-600">Shipment #{selectedOrderSummary.previous_challans_count + 1}</div>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Line Items Table */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Items to Dispatch in this Shipment</h2>
              <p className="text-[11px] text-gray-500">Specify quantity to dispatch. Warehouse stock will be deducted accordingly.</p>
            </div>
            <button
              type="button"
              onClick={addItemRow}
              className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold px-3 py-1.5 rounded-md transition"
            >
              <Plus size={14} /> Add Item Row
            </button>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3 w-8 text-center">#</th>
                  <th className="py-2.5 px-3 min-w-[220px]">Item Name</th>
                  <th className="py-2.5 px-3 w-24 text-right">Required Qty</th>
                  <th className="py-2.5 px-3 w-24 text-right">Already Sent</th>
                  <th className="py-2.5 px-3 w-24 text-right">Balance Qty</th>
                  <th className="py-2.5 px-3 w-28 text-right">Warehouse Stock</th>
                  <th className="py-2.5 px-3 w-32 text-right">Dispatch Qty (Now)</th>
                  <th className="py-2.5 px-3 w-24 text-right">New Balance</th>
                  <th className="py-2.5 px-3 w-12 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs">
                {items.map((item, idx) => {
                  const required = Number(item.required_qty ?? item.ordered_qty) || 0;
                  const alreadySent = Number(item.already_dispatched_qty) || 0;
                  const balance = Number(item.balance_qty ?? Math.max(0, required - alreadySent));
                  const delivered = Number(item.delivered_qty) || 0;
                  const newBalance = Math.max(0, balance - delivered);
                  const stock = Number(item.warehouse_stock ?? 0);
                  const isStockInsufficient = delivered > stock;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/60">
                      <td className="py-2.5 px-3 text-center text-gray-400 font-bold">{idx + 1}</td>

                      {/* Item Selection Dropdown */}
                      <td className="py-2.5 px-3">
                        <select
                          className="w-full bg-white border border-gray-300 rounded p-1.5 text-gray-800 text-xs focus:ring-1 focus:ring-blue-500 font-medium"
                          value={item.selected_order_item_key || ''}
                          onChange={(e) => {
                            const selectedKey = e.target.value;
                            if (!selectedKey) {
                              updateItemRow(item.id, 'item_name', '');
                              updateItemRow(item.id, 'item_id', null);
                              updateItemRow(item.id, 'product_id', null);
                              updateItemRow(item.id, 'required_qty', '');
                              updateItemRow(item.id, 'already_dispatched_qty', '');
                              updateItemRow(item.id, 'balance_qty', '');
                              updateItemRow(item.id, 'ordered_qty', '');
                              updateItemRow(item.id, 'delivered_qty', '');
                              updateItemRow(item.id, 'warehouse_stock', '');
                              updateItemRow(item.id, 'selected_order_item_key', '');
                              return;
                            }

                            const foundItem = orderItemsList.find(
                              (ordItem, idxKey) => (ordItem.key || `${ordItem.item_id || idxKey}`) === selectedKey
                            );

                            if (foundItem) {
                              const name = foundItem.item_name || 'Unnamed Item';
                              const reqQ = foundItem.required_qty || 0;
                              const prevDel = foundItem.already_dispatched_qty || 0;
                              const balQ = foundItem.balance_qty || 0;
                              const stockQ = foundItem.warehouse_stock || 0;
                              const itemId = foundItem.item_id || null;
                              const suggestedDel = Math.min(balQ, stockQ);

                              updateItemRow(item.id, 'item_name', name);
                              updateItemRow(item.id, 'item_id', itemId);
                              updateItemRow(item.id, 'product_id', itemId);
                              updateItemRow(item.id, 'required_qty', reqQ);
                              updateItemRow(item.id, 'already_dispatched_qty', prevDel);
                              updateItemRow(item.id, 'balance_qty', balQ);
                              updateItemRow(item.id, 'ordered_qty', balQ);
                              updateItemRow(item.id, 'delivered_qty', suggestedDel);
                              updateItemRow(item.id, 'warehouse_stock', stockQ);
                              updateItemRow(item.id, 'selected_order_item_key', selectedKey);
                            }
                          }}
                        >
                          <option value="">
                            {!selectedOrderId
                              ? '-- Select Sales Order First --'
                              : orderItemsList.length === 0
                              ? '-- No Prepared BOM Items Found --'
                              : '-- Select Item to Dispatch --'}
                          </option>

                          {orderItemsList.map((ordItem, idxKey) => {
                            const itemKey = ordItem.key || `${ordItem.item_id || idxKey}`;
                            const name = ordItem.item_name || 'Unnamed Item';
                            const brand = ordItem.brand ? ` [${ordItem.brand}]` : '';
                            const unit = ordItem.unit ? ` ${ordItem.unit}` : '';
                            const balLabel = ordItem.balance_qty === 0 ? ' (Fully Dispatched)' : ` (Bal: ${ordItem.balance_qty}${unit} | Stock: ${ordItem.warehouse_stock})`;
                            return (
                              <option key={itemKey} value={itemKey}>
                                {name}{brand}{balLabel}
                              </option>
                            );
                          })}
                        </select>
                      </td>

                      {/* Required Qty (Total BOM Required) */}
                      <td className="py-2.5 px-3 text-right font-mono text-gray-700 font-medium">
                        {required}
                      </td>

                      {/* Already Sent Qty */}
                      <td className="py-2.5 px-3 text-right font-mono text-indigo-600 font-medium">
                        {alreadySent}
                      </td>

                      {/* Remaining Balance Qty */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-600">
                        {balance}
                      </td>

                      {/* Warehouse Stock Available */}
                      <td className="py-2.5 px-3 text-right font-mono font-medium">
                        <span className={`px-1.5 py-0.5 rounded text-[11px] ${
                          stock <= 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {stock} in stock
                        </span>
                      </td>

                      {/* Current Dispatch Qty Input */}
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          min="0"
                          max={balance || undefined}
                          placeholder="0"
                          value={item.delivered_qty}
                          onChange={(e) => updateItemRow(item.id, 'delivered_qty', e.target.value)}
                          className={`w-full bg-white border rounded p-1.5 text-right font-mono font-bold text-blue-600 focus:ring-1 ${
                            isStockInsufficient ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        />
                        {isStockInsufficient && (
                          <div className="text-[10px] text-rose-600 font-medium mt-0.5 text-right">
                            Exceeds Stock ({stock})
                          </div>
                        )}
                      </td>

                      {/* Calculated New Balance After This Dispatch */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                        {newBalance}
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

        {/* Section 4: Submit Button */}
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


