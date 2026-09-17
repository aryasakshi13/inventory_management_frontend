import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  Layers,
  Building2,
  Calendar,
  FileText,
  Package,
  Wrench,
  CheckCircle2,
  Clock,
  Send,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Percent,
  Copy,
  PlusCircle
} from 'lucide-react';
import { fetchQuotationById, updateQuotationStatus } from '../services/quotationService';

export const ViewQuotationModal = ({
  isOpen,
  quotationId,
  onClose,
  onCreateRevision,
  onStatusUpdated,
}) => {
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeVersionId, setActiveVersionId] = useState(quotationId);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    if (quotationId) {
      setActiveVersionId(quotationId);
    }
  }, [quotationId]);

  useEffect(() => {
    if (!isOpen || !activeVersionId) return;

    const loadQuotation = async () => {
      try {
        setLoading(true);
        const res = await fetchQuotationById(activeVersionId);
        if (res?.success && res.data) {
          setQuotation(res.data);
        }
      } catch (err) {
        console.error('Failed to load quotation details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadQuotation();
  }, [isOpen, activeVersionId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleStatusChange = async (newStatus) => {
    if (!quotation?.id) return;
    try {
      setUpdatingStatus(true);
      const res = await updateQuotationStatus(quotation.id, newStatus);
      if (res?.success) {
        setQuotation((prev) => ({ ...prev, status: newStatus }));
        if (onStatusUpdated) onStatusUpdated(quotation.id, newStatus);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return '—';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal).split('T')[0];
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return String(dateVal).split('T')[0] || '—';
    }
  };

  const statusColors = {
    Draft: 'bg-gray-100 text-gray-700 border-gray-300',
    Sent: 'bg-blue-50 text-blue-700 border-blue-200',
    Accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    Revised: 'bg-amber-50 text-amber-700 border-amber-200',
    Converted: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const isInHouse = quotation?.order_type === 'in_house';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col border border-gray-200">
        
        {/* Top Action Header */}
        <div className="flex items-center justify-between border-b px-6 py-3.5 bg-slate-900 text-white no-print">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold font-mono text-blue-400">
              {quotation?.quotation_number || 'Quotation'}
            </span>
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              v{quotation?.version || 1}
            </span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusColors[quotation?.status] || 'bg-gray-100 text-gray-700'}`}>
              {quotation?.status || 'Draft'}
            </span>
            {isInHouse ? (
              <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <Package size={12} /> In-House
              </span>
            ) : (
              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <Wrench size={12} /> Site Assembly
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white font-medium text-xs transition cursor-pointer"
            >
              <Printer size={14} />
              Print / PDF
            </button>

            {/* Create Revision Button */}
            <button
              onClick={() => {
                onClose();
                onCreateRevision(quotation);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-bold text-xs transition cursor-pointer"
            >
              <Layers size={14} />
              Create Revision (v{(Number(quotation?.version) || 1) + 1})
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Version History Selector Tabs (If revisions exist) */}
        {quotation?.revisions && quotation.revisions.length > 1 && (
          <div className="bg-slate-100 border-b border-gray-200 px-6 py-2 flex items-center gap-2 overflow-x-auto text-xs no-print">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
              <Layers size={13} className="text-gray-400" /> Version History:
            </span>
            {quotation.revisions.map((rev) => (
              <button
                key={rev.id}
                onClick={() => setActiveVersionId(rev.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer border shrink-0 ${
                  Number(rev.id) === Number(quotation.id)
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                v{rev.version} ({rev.status}) - ₹{(Number(rev.grand_total) || 0).toLocaleString('en-IN')}
              </button>
            ))}
          </div>
        )}

        {/* Modal Printable Sheet Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-xs bg-white" ref={printRef}>
          {loading ? (
            <div className="py-20 text-center text-gray-400 font-medium">Loading quotation details...</div>
          ) : !quotation ? (
            <div className="py-20 text-center text-gray-400 font-medium">No quotation found.</div>
          ) : (
            <>
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-gray-200 pb-6">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-gray-900">
                    QUOTATION / PROFORMA
                  </h1>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    Quotation No: <span className="font-bold text-gray-900">{quotation.quotation_number}</span> (Revision v{quotation.version})
                  </p>
                  {quotation.project_name && (
                    <p className="text-xs text-blue-700 font-semibold mt-1">
                      Project: {quotation.project_name}
                    </p>
                  )}
                </div>

                <div className="text-left sm:text-right text-xs space-y-1">
                  <p className="text-gray-500">
                    Date of Issue: <span className="font-semibold text-gray-900">{formatDate(quotation.quotation_date)}</span>
                  </p>
                  <p className="text-gray-500">
                    Valid Until: <span className="font-semibold text-gray-900">{formatDate(quotation.valid_until)}</span>
                  </p>
                  <p className="text-gray-500">
                    Type:{' '}
                    <span className="font-semibold text-gray-900 capitalize">
                      {quotation.order_type === 'in_house' ? 'In-House Direct Delivery' : 'Site Assembly Project'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Client & Company Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200 space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Quotation For (Client)
                  </span>
                  <p className="text-sm font-bold text-gray-900">{quotation.client_name || 'Client'}</p>
                  {quotation.contact_person && (
                    <p className="text-gray-600">Attn: {quotation.contact_person}</p>
                  )}
                  {quotation.client_address && (
                    <p className="text-gray-600">{quotation.client_address}</p>
                  )}
                  {quotation.client_phone && (
                    <p className="text-gray-600">Phone: {quotation.client_phone}</p>
                  )}
                  {quotation.client_email && (
                    <p className="text-gray-600">Email: {quotation.client_email}</p>
                  )}
                  {quotation.client_gstin && (
                    <p className="text-gray-600 font-mono font-medium">GSTIN: {quotation.client_gstin}</p>
                  )}
                </div>

                <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100 space-y-1.5 text-blue-950">
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block">
                    Issued By (Company)
                  </span>
                  <p className="text-sm font-bold text-gray-900">Namami Infotech India Pvt. Ltd.</p>
                  <p className="text-gray-600">Industrial Area, Noida, Uttar Pradesh - 201301</p>
                  <p className="text-gray-600">Email: sales@namami-infotech.com</p>
                  <p className="text-gray-600">Web: www.namami-infotech.com</p>
                  <p className="text-gray-600 font-mono font-medium">GSTIN: 09AAECN1234F1Z5</p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="overflow-hidden border border-gray-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[11px] border-b border-gray-200">
                    <tr>
                      <th className="p-3 w-10 text-center">#</th>
                      <th className="p-3 min-w-[220px]">Item & Description</th>
                      <th className="p-3 w-20 text-center">UOM</th>
                      <th className="p-3 w-20 text-right">Qty</th>
                      <th className="p-3 w-28 text-right">Unit Price</th>
                      <th className="p-3 w-32 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {(quotation.items || []).map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="p-3 text-center text-gray-400 font-semibold">{idx + 1}</td>
                        <td className="p-3">
                          <p className="font-bold text-gray-900">{item.item_name}</p>
                          {item.description && (
                            <p className="text-gray-500 text-[11px] mt-0.5">{item.description}</p>
                          )}
                        </td>
                        <td className="p-3 text-center text-gray-600">{item.uom || 'Nos'}</td>
                        <td className="p-3 text-right font-bold text-gray-900">{item.quantity}</td>
                        <td className="p-3 text-right text-gray-700">
                          ₹{Number(item.unit_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-bold text-gray-900">
                          ₹{Number(item.total_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Block */}
              <div className="flex flex-col md:flex-row justify-between gap-6 pt-2">
                {/* Terms & Notes */}
                <div className="flex-1 space-y-3">
                  {quotation.terms_and_conditions && (
                    <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Terms & Conditions
                      </span>
                      <p className="text-gray-700 whitespace-pre-line text-[11px] leading-relaxed">
                        {quotation.terms_and_conditions}
                      </p>
                    </div>
                  )}

                  {quotation.remarks && (
                    <div className="p-3 rounded-xl border border-dashed border-gray-200 text-gray-600 text-[11px]">
                      <strong>Remarks:</strong> {quotation.remarks}
                    </div>
                  )}
                </div>

                {/* Amount Totals */}
                <div className="w-full md:w-80 bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2.5">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-gray-900">
                      ₹{Number(quotation.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {Number(quotation.discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount:</span>
                      <span className="font-semibold">
                        - ₹{Number(quotation.discount_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-600">
                    <span>GST / Tax ({quotation.tax_rate || 0}%):</span>
                    <span className="font-semibold text-gray-900">
                      ₹{Number(quotation.tax_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="border-t border-gray-300 pt-2 flex justify-between items-center text-sm font-bold text-gray-900">
                    <span>Grand Total:</span>
                    <span className="text-base text-blue-700">
                      ₹{Number(quotation.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Update Quick Bar (no-print) */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700 text-xs">Quotation Status:</span>
                  <select
                    value={quotation.status}
                    disabled={updatingStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2.5 py-1 text-xs bg-white font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Revised">Revised</option>
                    <option value="Converted">Converted to Order</option>
                  </select>
                </div>

                <p className="text-[11px] text-gray-500">
                  Locked & Immutable. To alter pricing or quantities, click <strong>Create Revision</strong>.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t bg-gray-50 no-print">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
