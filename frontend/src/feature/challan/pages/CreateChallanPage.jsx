import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Send,
  FileText,
  AlertCircle,
  Truck,
  User,
  Calendar,
  MapPin,
  Package,
  CheckCircle2,
  Factory,
  Wrench,
  Info,
} from 'lucide-react';
import { getAvailableDeliveries, getDeliveryById, createChallan } from '../services/challanService';

export const CreateChallanPage = ({ onBack, onSuccess }) => {
  const dateInputRef = useRef(null);
  const [challanType, setChallanType] = useState('site_material'); // 'site_material' | 'in_house'
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [challanNo, setChallanNo] = useState(`DC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`);
  const [challanDate, setChallanDate] = useState(new Date().toISOString().substring(0, 10));
  const [remarks, setRemarks] = useState('Goods dispatched in sound condition for delivery/installation.');

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    try {
      setLoadingDeliveries(true);
      const res = await getAvailableDeliveries();
      const list = res?.data ?? (Array.isArray(res) ? res : []);
      // Sort newest delivery first
      const sorted = [...list].sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
      setDeliveries(sorted);
    } catch (err) {
      console.error('Failed to load deliveries:', err);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  const handleTypeChange = (type) => {
    setChallanType(type);
    setSelectedDeliveryId('');
    setSelectedDelivery(null);
    setError(null);
    setChallanNo(`DC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`);
  };

  // Filter deliveries based on selected mode and exclude deliveries that already have a challan
  const filteredDeliveries = deliveries.filter((del) => {
    if (del.has_challan) return false;
    const isInHouse =
      del.delivery_type === 'in_house' ||
      del.order_type === 'in_house' ||
      del.receipt_status === 'Direct Delivery';
    if (challanType === 'site_material') return !isInHouse;
    if (challanType === 'in_house') return isInHouse;
    return true;
  });

  const handleDeliverySelect = async (e) => {
    const delId = e.target.value;
    setSelectedDeliveryId(delId);
    setSelectedDelivery(null);
    setError(null);

    if (!delId) return;

    try {
      setLoadingDetails(true);
      const foundInList = deliveries.find((d) => String(d.id) === String(delId));
      const res = await getDeliveryById(delId);
      const fullDelivery = res?.data || foundInList || {};

      setSelectedDelivery(fullDelivery);

      // Auto-generate a clean Challan No with DC- prefix based on Delivery No (e.g., DL-po-88799 -> DC-po-88799)
      const rawNo = fullDelivery.challan_no || '';
      const cleanSuffix = rawNo.replace(/^(DL|DN|DC|CH)-/i, '');
      if (cleanSuffix) {
        setChallanNo(`DC-${cleanSuffix}`);
      } else {
        setChallanNo(`DC-${new Date().getFullYear()}-${delId.toString().padStart(4, '0')}`);
      }

      if (fullDelivery.dispatch_date) {
        const dStr =
          typeof fullDelivery.dispatch_date === 'string'
            ? fullDelivery.dispatch_date.substring(0, 10)
            : new Date(fullDelivery.dispatch_date).toISOString().substring(0, 10);
        setChallanDate(dStr);
      }
    } catch (err) {
      console.error('Failed to fetch delivery details:', err);
      const fallback = deliveries.find((d) => String(d.id) === String(delId));
      setSelectedDelivery(fallback || null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const parts = dateStr.substring(0, 10).split('-');
      return `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}/${parts[0]}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-IN');
  };

  const deliveryItems = selectedDelivery?.items || selectedDelivery?.delivery_items || [];
  const totalDeliveredQty = deliveryItems.reduce(
    (acc, curr) => acc + Number(curr.delivered_qty ?? curr.this_challan_qty ?? curr.qty ?? 0),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedDelivery) {
      setError('Please select a Delivery Number first.');
      return;
    }

    if (!challanNo?.trim()) {
      setError('Challan Number is required.');
      return;
    }

    if (deliveryItems.length === 0) {
      setError('The selected delivery does not have any items.');
      return;
    }

    // Prepare payload
    const payload = {
      delivery_id: selectedDelivery.id,
      delivery_no: selectedDelivery.challan_no || `DL-${selectedDelivery.id}`,
      order_id: selectedDelivery.order_id || null,
      preparation_id: selectedDelivery.preparation_id || null,
      challan_type: challanType,
      challan_no: challanNo.trim().toUpperCase().startsWith('DC-')
        ? challanNo.trim()
        : `DC-${challanNo.trim()}`,
      dispatch_date: challanDate || selectedDelivery.dispatch_date,
      status: selectedDelivery.status || 'Partially Delivered',
      receipt_status: selectedDelivery.receipt_status || (challanType === 'in_house' ? 'Direct Delivery' : 'Pending Receipt'),
      customer_name: selectedDelivery.customer_name || null,
      customer_phone: selectedDelivery.customer_phone || null,
      delivery_address: selectedDelivery.delivery_address || null,
      transporter_name: selectedDelivery.transporter_name || null,
      vehicle_no: selectedDelivery.vehicle_no || null,
      site_engineer_name: selectedDelivery.site_engineer_name || null,
      site_engineer_phone: selectedDelivery.site_engineer_phone || null,
      delivery_items: deliveryItems.map((it) => ({
        item_id: it.item_id || it.id,
        item_name: it.item_name || 'Item',
        category: it.category || 'General',
        unit: it.unit || 'Nos',
        brand: it.brand || '',
        ordered_qty: Number(it.ordered_qty) || Number(it.delivered_qty ?? it.qty ?? 0),
        delivered_qty: Number(it.delivered_qty ?? it.this_challan_qty ?? it.qty ?? 0),
        remarks: it.remarks || remarks || 'Sound Condition',
      })),
      remarks: remarks?.trim() || null,
    };

    try {
      setSubmitting(true);
      const res = await createChallan(payload);
      setSubmitting(false);
      if (res.success || res.data) {
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setSubmitting(false);
      setError(err.response?.data?.message || 'Failed to generate challan.');
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
              className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FileText size={22} className="text-blue-600" />
              Generate Delivery Challan
            </h1>
            <p className="text-xs text-gray-500">
              Select delivery type and choose a dispatched Delivery Number (DL No) to generate an official Delivery Challan (DC No)
            </p>
          </div>
        </div>
      </div>

      {/* CHALLAN TYPE SELECTION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Type 1: Site Challan */}
        <div
          onClick={() => handleTypeChange('site_material')}
          className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer shadow-xs ${
            challanType === 'site_material'
              ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500/30'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-lg ${
                  challanType === 'site_material'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                <Wrench size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Site Challan (Items)</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Generate challan for site assembly projects delivering raw materials & BOM components
                </p>
              </div>
            </div>
            {challanType === 'site_material' && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={12} /> Active
              </span>
            )}
          </div>
        </div>

        {/* Type 2: Direct Product Challan */}
        <div
          onClick={() => handleTypeChange('in_house')}
          className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer shadow-xs ${
            challanType === 'in_house'
              ? 'border-purple-600 bg-purple-50/40 ring-1 ring-purple-500/30'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-lg ${
                  challanType === 'in_house'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-100 text-purple-700'
                }`}
              >
                <Factory size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Direct Product Challan</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Generate challan for in-house manufactured finished goods delivering directly to client
                </p>
              </div>
            </div>
            {challanType === 'in_house' && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={12} /> Active
              </span>
            )}
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
        {/* Section 1: Delivery Selection & Header Info */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <Truck size={16} className={challanType === 'in_house' ? 'text-purple-600' : 'text-blue-600'} />
            1. Select {challanType === 'in_house' ? 'Direct Delivery Number' : 'Site Delivery Number'} & Challan Info
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Delivery Number Dropdown */}
            <div className="md:col-span-2">
              <label className="block font-bold text-gray-700 mb-1">
                Select {challanType === 'in_house' ? 'Direct Product Delivery (DL No)' : 'Site Delivery (DL No)'} *
              </label>
              <select
                value={selectedDeliveryId}
                onChange={handleDeliverySelect}
                required
                className={`w-full border-2 rounded-md p-2.5 text-gray-900 font-semibold focus:ring-1 text-xs ${
                  challanType === 'in_house'
                    ? 'border-purple-400 focus:border-purple-600 bg-purple-50/20 focus:ring-purple-500'
                    : 'border-blue-400 focus:border-blue-600 bg-blue-50/20 focus:ring-blue-500'
                }`}
              >
                <option value="">
                  {loadingDeliveries
                    ? 'Loading Deliveries...'
                    : filteredDeliveries.length === 0
                    ? `-- No pending ${challanType === 'in_house' ? 'Direct Deliveries' : 'Site Deliveries'} available --`
                    : `-- Choose ${challanType === 'in_house' ? 'Direct Delivery (DL-...)' : 'Site Delivery (DL-...)'} --`}
                </option>
                {filteredDeliveries.map((del) => {
                  const poText = del.poNumber || del.po_number ? ` | PO: ${del.poNumber || del.po_number}` : (del.order_id ? ` | SO #${del.order_id}` : '');
                  const clientText = del.customer_name ? ` - ${del.customer_name}` : '';
                  const totalQty = del.total_delivered_qty ? ` (${del.total_delivered_qty} Qty)` : '';
                  return (
                    <option key={del.id} value={del.id}>
                      {del.challan_no || `DL-${del.id}`}{poText}{clientText}{totalQty}
                    </option>
                  );
                })}
              </select>
              {filteredDeliveries.length === 0 && !loadingDeliveries && (
                <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                  <Info size={13} />{' '}
                  {deliveries.some((d) =>
                    challanType === 'in_house'
                      ? d.delivery_type === 'in_house' || d.order_type === 'in_house' || d.receipt_status === 'Direct Delivery'
                      : d.delivery_type !== 'in_house' && d.order_type !== 'in_house' && d.receipt_status !== 'Direct Delivery'
                  )
                    ? 'All deliveries in this category have already been issued official challans.'
                    : 'No dispatched deliveries found for this category. Please create a Delivery in the Delivery Module first.'}
                </p>
              )}
            </div>

            {/* Challan Number */}
            <div>
              <label className="block font-bold text-gray-700 mb-1">Generated Challan Number (DC No) *</label>
              <input
                type="text"
                name="challanNo"
                required
                value={challanNo}
                onChange={(e) => setChallanNo(e.target.value)}
                placeholder="e.g. DC-po-88799"
                className="w-full border border-gray-300 rounded-md p-2.5 bg-white focus:ring-1 focus:ring-blue-500 text-blue-700 font-mono font-bold text-xs"
              />
            </div>

            {/* Challan Date */}
            <div>
              <label className="block font-medium text-gray-700 mb-1">Challan Date *</label>
              <input
                ref={dateInputRef}
                type="date"
                required
                value={challanDate}
                onChange={(e) => setChallanDate(e.target.value)}
                onClick={(e) => e.currentTarget?.showPicker?.()}
                className="w-full border border-gray-300 rounded-md p-2 bg-white focus:ring-1 focus:ring-blue-500 text-black font-medium cursor-pointer"
              />
            </div>

            {/* Remarks */}
            <div className="md:col-span-2">
              <label className="block font-medium text-gray-700 mb-1">Challan Remarks / Declaration</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Declaration or specific delivery remarks"
                className="w-full border border-gray-300 rounded-md p-2 bg-white focus:ring-1 focus:ring-blue-500 text-black"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Auto-populated Delivery Metadata (Read Only) */}
        {selectedDelivery && (
          <div className="bg-gradient-to-r from-blue-50/70 via-slate-50 to-indigo-50/50 p-5 rounded-lg border border-blue-200 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-blue-900 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              2. Auto-Populated Delivery & Consignee Details (Read-Only)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-2xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Customer / Consignee</span>
                <span className="font-bold text-gray-900 text-sm block mt-0.5">{selectedDelivery.customer_name || 'N/A'}</span>
                {selectedDelivery.customer_phone && (
                  <span className="text-[11px] text-gray-500 block mt-0.5">Phone: {selectedDelivery.customer_phone}</span>
                )}
              </div>

              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-2xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Reference SO / PO</span>
                <span className="font-bold text-blue-700 text-sm block mt-0.5">
                  {selectedDelivery.poNumber || selectedDelivery.po_number || (selectedDelivery.order_id ? `SO #${selectedDelivery.order_id}` : '-')}
                </span>
                <span className="text-[11px] text-gray-500 block mt-0.5">
                  Dispatch Date: {formatDate(selectedDelivery.dispatch_date)}
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-2xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Transporter Name</span>
                <span className="font-bold text-gray-800 text-sm block mt-0.5">
                  {selectedDelivery.transporter_name || 'Self / By Hand'}
                </span>
                <span className="text-[11px] text-gray-500 block mt-0.5 font-mono">
                  Vehicle: {selectedDelivery.vehicle_no || 'N/A'}
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-2xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Delivery Address</span>
                <span className="font-medium text-gray-700 text-[11px] block mt-0.5 leading-snug line-clamp-2" title={selectedDelivery.delivery_address}>
                  {selectedDelivery.delivery_address || 'Address not specified'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Read-Only Delivery Line Items Table */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <Package size={16} className={challanType === 'in_house' ? 'text-purple-600' : 'text-blue-600'} />
                3. Delivery Items (Auto-Loaded & Read-Only)
              </h2>
              <p className="text-[11px] text-gray-500">
                All dispatched items from the selected delivery are locked and included automatically.
              </p>
            </div>
            {selectedDelivery && (
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                {deliveryItems.length} Items Dispatched
              </span>
            )}
          </div>

          {!selectedDelivery ? (
            <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500">
              Please select a Delivery Number above to load its dispatched items.
            </div>
          ) : deliveryItems.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500">
              No items found in the selected delivery.
            </div>
          ) : (
            <div className="overflow-x-auto w-full border border-gray-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 min-w-[220px]">Item Description</th>
                    <th className="py-2.5 px-3 w-32">Category</th>
                    <th className="py-2.5 px-3 w-20 text-center">Unit</th>
                    <th className="py-2.5 px-3 w-28 text-right bg-blue-50/60 text-blue-900">Dispatched Qty</th>
                    <th className="py-2.5 px-3 w-44">Status / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {deliveryItems.map((item, idx) => {
                    const qty = Number(item.delivered_qty ?? item.this_challan_qty ?? item.qty ?? 0);
                    return (
                      <tr key={item.id || idx} className="hover:bg-gray-50/60">
                        <td className="py-2.5 px-3 text-center text-gray-400 font-bold">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-gray-900">{item.item_name}</div>
                          {item.brand && (
                            <div className="text-[10px] text-gray-500">Brand: {item.brand}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">{item.category || 'General'}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-gray-700">{item.unit || 'Nos'}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700 bg-blue-50/20 text-sm">
                          {qty}
                        </td>
                        <td className="py-2.5 px-3 text-gray-500 text-[11px]">
                          {item.remarks || 'Dispatched (Sound Condition)'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-100 font-bold text-xs border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={4} className="py-2.5 px-3 text-right text-gray-800 uppercase text-[10px]">
                      Total Quantity in this Challan
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700 text-sm bg-blue-50/40">
                      {totalDeliveredQty}
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 text-[10px]">
                      {deliveryItems.length} Total Lines
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Section 4: Submit Actions */}
        <div className="flex justify-end gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 rounded-md text-xs font-semibold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || !selectedDelivery}
            className={`flex items-center gap-2 px-5 py-2.5 text-white rounded-md text-xs font-semibold shadow-sm disabled:opacity-50 transition cursor-pointer ${
              challanType === 'in_house'
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Send size={14} />
            {submitting ? 'Generating Challan...' : 'Create & Generate Challan'}
          </button>
        </div>
      </form>
    </div>
  );
};
