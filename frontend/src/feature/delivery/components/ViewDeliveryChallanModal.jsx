import React from 'react';
import { X, Printer, Truck, Calendar, MapPin, User, Phone, CheckCircle2, Clock } from 'lucide-react';

export const ViewDeliveryChallanModal = ({ isOpen, onClose, challan }) => {
  if (!isOpen || !challan) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const parts = dateStr.substring(0, 10).split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const items = challan.items || challan.delivery_items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-xs">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Truck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">
                  Delivery Challan: <span className="text-blue-600">{challan.challan_no}</span>
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                    challan.status === 'Fully Delivered' || challan.status === 'Delivered'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {challan.status === 'Fully Delivered' || challan.status === 'Delivered' ? (
                    <CheckCircle2 size={12} />
                  ) : (
                    <Clock size={12} />
                  )}
                  {challan.status}
                </span>
              </div>
              <p className="text-gray-500 text-[11px]">
                Dispatched on: <span className="font-semibold text-gray-700">{formatDate(challan.dispatch_date)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
            >
              <Printer size={14} /> Print
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Header Metadata Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Customer & Destination Info */}
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2">
              <h3 className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 text-blue-600">
                <User size={13} /> Customer & Destination
              </h3>
              <div className="space-y-1 text-gray-600 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer:</span>
                  <span className="font-semibold text-gray-800 text-right">{challan.customer_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone:</span>
                  <span className="font-semibold text-gray-800">{challan.customer_phone || '-'}</span>
                </div>
                <div className="flex justify-between items-start pt-0.5">
                  <span className="text-gray-500 shrink-0">Site Address:</span>
                  <span className="font-medium text-gray-800 text-right pl-2 truncate max-w-[140px]" title={challan.delivery_address}>
                    {challan.delivery_address || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Logistics & Dispatch Info */}
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2">
              <h3 className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 text-blue-600">
                <Truck size={13} /> Logistics & Transport
              </h3>
              <div className="space-y-1 text-gray-600 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">SO Ref:</span>
                  <span className="font-semibold text-gray-800">SO #{challan.order_id || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Transporter:</span>
                  <span className="font-semibold text-gray-800">{challan.transporter_name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vehicle No:</span>
                  <span className="font-mono font-semibold text-gray-800">{challan.vehicle_no || '-'}</span>
                </div>
              </div>
            </div>

            {/* Site Engineer & Material Receipt Info */}
            <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100 space-y-2">
              <h3 className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 text-blue-700">
                <User size={13} /> Assigned Site Engineer
              </h3>
              <div className="space-y-1 text-gray-600 text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Incharge:</span>
                  <span className="font-bold text-gray-900">{challan.site_engineer_name || 'Not Assigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone:</span>
                  <span className="font-semibold text-gray-800">{challan.site_engineer_phone || '-'}</span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-gray-500">Site Receipt:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      challan.receipt_status === 'Fully Received'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : challan.receipt_status === 'Partially Received'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : challan.receipt_status === 'Short Received'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : challan.receipt_status === 'Excess Received'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : challan.receipt_status === 'Damaged Material Reported'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {challan.receipt_status || 'Pending Receipt'}
                  </span>
                </div>
                {challan.engineer_remarks && (
                  <div className="mt-1 pt-1 border-t border-blue-200/60 text-[10px] text-gray-600">
                    <strong className="text-gray-700">Remarks:</strong> {challan.engineer_remarks}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Prominent Site Verification & Engineer Remarks Banner */}
          {challan.receipt_status && challan.receipt_status !== 'Pending Receipt' && challan.receipt_status !== 'Pending' && (
            <div
              className={`p-4 rounded-xl border flex flex-col gap-2 ${
                challan.receipt_status === 'Damaged Material Reported'
                  ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                  : challan.receipt_status === 'Short Received' || challan.receipt_status === 'Partially Received'
                  ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <span className="p-1.5 rounded-lg bg-white/80 border border-current shadow-2xs">
                    {challan.receipt_status === 'Damaged Material Reported' ? (
                      '⚠️'
                    ) : challan.receipt_status === 'Fully Received' ? (
                      '✅'
                    ) : (
                      '📦'
                    )}
                  </span>
                  <span>Site Receipt Status: {challan.receipt_status}</span>
                </div>
                <div className="text-[11px] opacity-80">
                  Verified by{' '}
                  <strong>{challan.received_by_engineer_name || challan.site_engineer_name}</strong>
                  {challan.received_at && (
                    <span> on {new Date(challan.received_at).toLocaleString('en-IN')}</span>
                  )}
                </div>
              </div>

              {challan.engineer_remarks && (
                <div className="mt-1 p-2.5 bg-white/90 rounded-lg border border-current/20 text-xs shadow-2xs">
                  <div className="font-bold text-[10px] uppercase tracking-wider opacity-75 mb-0.5">
                    Site Engineer Message:
                  </div>
                  <div className="italic font-medium">"{challan.engineer_remarks}"</div>
                </div>
              )}
            </div>
          )}

          {/* Order Fulfillment Overview Bar */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 p-3.5 rounded-xl border border-blue-100 flex flex-wrap justify-between items-center gap-3">
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Overall Order Fulfillment
              </div>
              <div className="text-xs font-semibold text-gray-800 mt-0.5">
                PO/SO Ref: <span className="text-blue-600 font-bold">{challan.po_number || `SO #${challan.order_id}`}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
              <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-2xs">
                <span className="text-[10px] text-gray-500 block">Total Order Qty</span>
                <strong className="text-gray-900 text-sm">
                  {challan.order_total_ordered_qty ?? challan.total_ordered_qty ?? 0}
                </strong>
              </div>

              <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-2xs">
                <span className="text-[10px] text-gray-500 block">Prior Dispatched</span>
                <strong className="text-gray-700 text-sm">
                  {challan.order_prior_delivered_qty ?? 0}
                </strong>
              </div>

              <div className="bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-2xs">
                <span className="text-[10px] text-blue-100 block">This Challan</span>
                <strong className="text-sm">
                  {challan.challan_delivered_qty ?? challan.total_delivered_qty ?? 0}
                </strong>
              </div>

              <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-2xs">
                <span className="text-[10px] text-gray-500 block">Total So Far</span>
                <strong className="text-indigo-700 text-sm">
                  {challan.order_cumulative_delivered_qty ?? challan.total_delivered_qty ?? 0}
                </strong>
              </div>

              <div
                className={`px-3 py-1.5 rounded-lg border shadow-2xs ${
                  (challan.order_remaining_qty ?? 0) > 0
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                }`}
              >
                <span className="text-[10px] block opacity-80">Pending to Deliver</span>
                <strong className="text-sm">
                  {challan.order_remaining_qty ?? 0}
                </strong>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <h3 className="font-bold text-gray-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span>Order BOM Items & Delivery Breakdown ({items.length} items)</span>
              </h3>
              {challan.order_remaining_qty > 0 ? (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                  ⚠️ {challan.order_remaining_qty} Units Pending for this Order
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                  ✓ Order Fully Dispatched
                </span>
              )}
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3 w-8 text-center">#</th>
                    <th className="py-2.5 px-3 min-w-[160px]">Item Description</th>
                    <th className="py-2.5 px-3 w-16 text-center">Unit</th>
                    <th className="py-2.5 px-3 w-20 text-right">Order Qty</th>
                    <th className="py-2.5 px-3 w-20 text-right">Prior Sent</th>
                    <th className="py-2.5 px-3 w-24 text-right bg-blue-50/70 text-blue-900">This Challan</th>
                    <th className="py-2.5 px-3 w-20 text-right">Total Sent</th>
                    <th className="py-2.5 px-3 w-20 text-right text-amber-900 bg-amber-50/50">Pending</th>
                    <th className="py-2.5 px-3 min-w-[140px] text-center">Item Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((it, idx) => {
                    const ord = Number(it.ordered_qty ?? it.qty ?? 0);
                    const prior = Number(it.prior_delivered_qty ?? 0);
                    const thisDel = Number(it.delivered_qty ?? it.this_challan_qty ?? it.qty ?? 0);
                    const cumDel = Number(it.cumulative_delivered_qty ?? (prior + thisDel));
                    const rem = Number(it.remaining_qty ?? Math.max(0, ord - cumDel));
                    const isInThisChallan = thisDel > 0;

                    return (
                      <tr
                        key={it.id || idx}
                        className={`hover:bg-gray-50/80 transition ${
                          isInThisChallan ? 'bg-blue-50/10 font-medium' : 'opacity-85'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center text-gray-400 font-bold">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-gray-800">{it.item_name}</div>
                          <div className="text-[10px] text-gray-400 flex items-center gap-2">
                            <span>Category: {it.category || 'General'}</span>
                            {it.brand && <span>Brand: {it.brand}</span>}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center text-gray-500 font-mono">{it.unit || 'Nos'}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-700">{ord}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-500">{prior}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700 bg-blue-50/30">
                          {thisDel > 0 ? (
                            <span className="text-blue-700 font-bold">{thisDel}</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-gray-800">{cumDel}</td>
                        <td
                          className={`py-2.5 px-3 text-right font-mono font-bold bg-amber-50/30 ${
                            rem > 0 ? 'text-amber-600' : 'text-emerald-600'
                          }`}
                        >
                          {rem}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isInThisChallan && rem === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 size={11} /> Delivered ({thisDel})
                            </span>
                          ) : isInThisChallan && rem > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                              Partially Delivered ({thisDel})
                            </span>
                          ) : rem === 0 && prior >= ord ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                              Prior Delivered ({prior})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <Clock size={11} /> Pending ({rem} {it.unit || ''})
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-100 font-bold text-xs border-t border-gray-200">
                  <tr>
                    <td colSpan={3} className="py-2.5 px-3 text-right text-gray-700 uppercase tracking-wider text-[10px]">
                      Order Totals
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-900">
                      {items.reduce((acc, curr) => acc + Number(curr.ordered_qty || 0), 0)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-600">
                      {items.reduce((acc, curr) => acc + Number(curr.prior_delivered_qty || 0), 0)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-blue-700 text-sm bg-blue-50/50">
                      {items.reduce(
                        (acc, curr) => acc + Number(curr.delivered_qty ?? curr.this_challan_qty ?? 0),
                        0
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-900">
                      {items.reduce(
                        (acc, curr) =>
                          acc +
                          Number(
                            curr.cumulative_delivered_qty ??
                              (Number(curr.prior_delivered_qty || 0) +
                                Number(curr.delivered_qty ?? curr.this_challan_qty ?? 0))
                          ),
                        0
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-700 bg-amber-50/50">
                      {items.reduce((acc, curr) => acc + Number(curr.remaining_qty || 0), 0)}
                    </td>
                    <td className="py-2.5 px-3 text-center text-[10px] font-semibold text-gray-500">
                      {items.filter((it) => Number(it.remaining_qty || 0) > 0).length > 0
                        ? `${items.filter((it) => Number(it.remaining_qty || 0) > 0).length} items pending`
                        : 'All items completed'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
