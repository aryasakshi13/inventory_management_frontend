import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  Truck,
  User,
  MapPin,
  Calendar,
  MessageSquare,
  Package,
} from 'lucide-react';
import { acceptDeliveryReceipt } from '../services/deliveryService';

export const VerifyMaterialReceiptModal = ({
  isOpen,
  onClose,
  receipt,
  onSuccess,
}) => {
  if (!isOpen || !receipt) return null;

  const [items, setItems] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Fully Received');
  const [isDamagedReported, setIsDamagedReported] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const computeStatusFromItems = (itemRows, damaged) => {
    if (damaged) return 'Damaged Material Reported';
    const totalDisp = itemRows.reduce((s, r) => s + (Number(r.dispatched_qty) || 0), 0);
    const totalRec = itemRows.reduce((s, r) => s + (Number(r.received_qty) || 0), 0);

    if (totalRec === 0 && totalDisp > 0) return 'Pending Receipt';
    const hasDiff = itemRows.some(
      (r) => Number(r.received_qty) !== Number(r.dispatched_qty)
    );
    if (!hasDiff && totalRec === totalDisp) return 'Fully Received';
    if (totalRec < totalDisp) return 'Short Received';
    if (totalRec > totalDisp) return 'Excess Received';
    return 'Partially Received';
  };

  useEffect(() => {
    if (receipt) {
      const rawItems = receipt.items || receipt.delivery_items || [];
      const previousReceived = receipt.received_items || [];

      const initialRows = rawItems.map((it, idx) => {
        const itemId = Number(it.item_id || it.itemId || it.id);
        const dispatched = Number(it.dispatched_qty ?? it.delivered_qty ?? it.qty ?? 0);
        
        // Find if already previously saved
        const prevMatch = previousReceived.find(
          (p) => Number(p.item_id || p.itemId) === itemId
        );

        return {
          id: idx + 1,
          item_id: itemId,
          item_name: it.item_name || `Item #${itemId}`,
          category: it.category || 'General',
          brand: it.brand || it.item_brand || '',
          unit: it.unit || 'Nos',
          dispatched_qty: dispatched,
          received_qty: prevMatch ? Number(prevMatch.received_qty) : dispatched,
          item_remarks: prevMatch ? prevMatch.item_remarks || '' : '',
        };
      });

      setItems(initialRows);
      setRemarks(receipt.engineer_remarks || '');
      
      const currentReceiptStatus = receipt.receipt_status || 'Pending Receipt';
      const initialDamaged = currentReceiptStatus === 'Damaged Material Reported';
      setIsDamagedReported(initialDamaged);

      if (currentReceiptStatus && currentReceiptStatus !== 'Pending' && currentReceiptStatus !== 'Pending Receipt') {
        setSelectedStatus(currentReceiptStatus);
      } else {
        setSelectedStatus(computeStatusFromItems(initialRows, initialDamaged));
      }

      setError(null);
    }
  }, [receipt]);

  const handleQtyChange = (index, value) => {
    const numericValue = value === '' ? '' : Math.max(0, Number(value));
    const updated = items.map((row, i) =>
      i === index ? { ...row, received_qty: numericValue } : row
    );
    setItems(updated);
    setSelectedStatus(computeStatusFromItems(updated, isDamagedReported));
  };

  const handleDamagedToggle = (checked) => {
    setIsDamagedReported(checked);
    setSelectedStatus(computeStatusFromItems(items, checked));
  };

  const handleItemRemarksChange = (index, value) => {
    setItems((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, item_remarks: value } : row
      )
    );
  };

  const hasAnyDifference = items.some(
    (it) => Number(it.received_qty) !== Number(it.dispatched_qty)
  );

  const handleAccept = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Validate quantities
      const sanitizedItems = items.map((it) => ({
        item_id: it.item_id,
        item_name: it.item_name,
        brand: it.brand,
        unit: it.unit,
        dispatched_qty: Number(it.dispatched_qty) || 0,
        received_qty: Number(it.received_qty) || 0,
        item_remarks: it.item_remarks || '',
      }));

      const payload = {
        status: selectedStatus,
        remarks: remarks ? remarks.trim() : '',
        received_items: sanitizedItems,
        engineer_name: receipt.site_engineer_name || 'Site Engineer',
        engineer_id: receipt.site_engineer_id || null,
      };

      const res = await acceptDeliveryReceipt(receipt.id, payload);
      if (res?.success) {
        if (onSuccess) onSuccess(res.data);
        onClose();
      } else {
        setError(res?.message || 'Failed to accept material delivery.');
      }
    } catch (err) {
      console.error('Acceptance error:', err);
      setError(err?.response?.data?.message || err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const isAlreadyAccepted =
    receipt.receipt_status &&
    receipt.receipt_status !== 'Pending' &&
    receipt.receipt_status !== 'Pending Receipt';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-xs">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 border border-blue-400/40 rounded-xl text-blue-300">
              <ClipboardCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">
                  Material Receipt Verification
                </h2>
                <span className="bg-blue-600 text-white font-mono px-2 py-0.5 rounded text-[11px]">
                  {receipt.challan_no}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isAlreadyAccepted
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {receipt.receipt_status || 'Pending Verification'}
                </span>
              </div>
              <p className="text-slate-300 text-[11px] mt-0.5">
                Verify physical material received at site and accept the dispatch.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Project & Dispatch Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
            <div>
              <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider block">
                Project / Order
              </span>
              <p className="font-semibold text-gray-900 text-xs mt-0.5">
                {receipt.po_number || `SO #${receipt.order_id}`}
              </p>
              <p className="text-gray-600 text-[11px]">{receipt.customer_name}</p>
            </div>

            <div>
              <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider block">
                Site Location & Dispatch
              </span>
              <p className="font-medium text-gray-800 text-[11px] truncate mt-0.5" title={receipt.delivery_address}>
                {receipt.delivery_address || 'Site Address N/A'}
              </p>
              <p className="text-gray-500 text-[11px]">
                Dispatched: <strong className="text-gray-700">{receipt.dispatch_date}</strong>
              </p>
            </div>

            <div>
              <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider block">
                Assigned Site Engineer
              </span>
              <p className="font-bold text-blue-700 text-xs mt-0.5">
                {receipt.site_engineer_name || 'Not Assigned'}
              </p>
              <p className="text-gray-500 text-[11px]">
                {receipt.site_engineer_phone || receipt.site_engineer_email || '-'}
              </p>
            </div>
          </div>

          {/* Items Quantity Matching Table */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Package size={14} className="text-blue-600" />
                Match Dispatched vs Received Quantities ({items.length} items)
              </h3>
              <span className="text-[11px] text-gray-500">
                Tip: Edit 'Received Qty' if partial or damaged items received
              </span>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3 w-8 text-center">#</th>
                    <th className="py-2.5 px-3 min-w-[180px]">Item Description</th>
                    <th className="py-2.5 px-3 w-16 text-center">Unit</th>
                    <th className="py-2.5 px-3 w-28 text-right bg-blue-50/50">Dispatched</th>
                    <th className="py-2.5 px-3 w-32 text-center bg-emerald-50/50">Received Qty</th>
                    <th className="py-2.5 px-3 w-24 text-center">Match</th>
                    <th className="py-2.5 px-3 min-w-[140px]">Item Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((it, idx) => {
                    const isMatched = Number(it.received_qty) === Number(it.dispatched_qty);
                    const isShort = Number(it.received_qty) < Number(it.dispatched_qty);

                    return (
                      <tr key={it.id || idx} className="hover:bg-gray-50/70">
                        <td className="py-2.5 px-3 text-center text-gray-400 font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-gray-800">{it.item_name}</div>
                          {it.brand && (
                            <span className="text-[10px] text-gray-400">Brand: {it.brand}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center text-gray-500 font-mono">
                          {it.unit || 'Nos'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700 bg-blue-50/30">
                          {it.dispatched_qty}
                        </td>
                        <td className="py-2 px-3 text-center bg-emerald-50/30">
                          <input
                            type="number"
                            min="0"
                            value={it.received_qty}
                            onChange={(e) => handleQtyChange(idx, e.target.value)}
                            disabled={isAlreadyAccepted}
                            className="w-24 text-center font-mono font-bold bg-white text-gray-900 border border-gray-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isMatched ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 size={11} /> Matched
                            </span>
                          ) : isShort ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <AlertTriangle size={11} /> Short ({Number(it.dispatched_qty) - Number(it.received_qty)})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                              Extra ({Number(it.received_qty) - Number(it.dispatched_qty)})
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={it.item_remarks}
                            onChange={(e) => handleItemRemarksChange(idx, e.target.value)}
                            disabled={isAlreadyAccepted}
                            placeholder="Condition / remark (optional)"
                            className="w-full text-xs bg-white text-gray-800 border border-gray-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 9.2 Receipt Status & Damaged Material Reporting */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="w-full sm:w-1/2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Receipt Status (Section 9.2)
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  disabled={isAlreadyAccepted}
                  className="w-full bg-white text-gray-900 font-semibold text-xs border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="Fully Received">Fully Received (100% matched)</option>
                  <option value="Partially Received">Partially Received</option>
                  <option value="Short Received">Short Received (Items/Qty missing)</option>
                  <option value="Excess Received">Excess Received (Extra items/qty)</option>
                  <option value="Damaged Material Reported">Damaged Material Reported</option>
                  <option value="Pending Receipt">Pending Receipt</option>
                </select>
              </div>

              {!isAlreadyAccepted && (
                <label className="flex items-center gap-2 cursor-pointer pt-2 sm:pt-4 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg hover:bg-rose-100/70 transition">
                  <input
                    type="checkbox"
                    checked={isDamagedReported}
                    onChange={(e) => handleDamagedToggle(e.target.checked)}
                    className="h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                  />
                  <span>⚠️ Report Damaged Material</span>
                </label>
              )}
            </div>

            {/* Engineer Message / Verification Remarks */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <MessageSquare size={14} className="text-blue-600" />
                Site Engineer Remarks / Acceptance Message
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                disabled={isAlreadyAccepted}
                placeholder="Enter site verification notes (e.g. 'All materials received in good condition', or damage/shortage details)..."
                className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 disabled:bg-gray-100"
              />
              {receipt.received_at && (
                <p className="text-[10px] text-gray-500 mt-1">
                  Accepted by <strong>{receipt.received_by_engineer_name || receipt.site_engineer_name}</strong> on {new Date(receipt.received_at).toLocaleString('en-IN')}.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-[11px] text-gray-500">
            {selectedStatus === 'Fully Received' ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 size={13} /> Status: Fully Received (All item quantities matched).
              </span>
            ) : selectedStatus === 'Damaged Material Reported' ? (
              <span className="text-rose-700 font-semibold flex items-center gap-1">
                <AlertTriangle size={13} /> Status: Damaged Material Reported.
              </span>
            ) : (
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <AlertTriangle size={13} /> Status: {selectedStatus}.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg font-medium transition text-xs"
            >
              Close
            </button>

            {!isAlreadyAccepted && (
              <button
                onClick={handleAccept}
                disabled={submitting}
                type="button"
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition text-xs shadow-sm disabled:opacity-50"
              >
                <CheckCircle2 size={15} /> Confirm & Save Receipt Status
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
