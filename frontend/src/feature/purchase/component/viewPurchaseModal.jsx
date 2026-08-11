import React, { useState } from 'react';
import { X, Printer, User, Phone, Mail, FileText, Calendar, Tag, ExternalLink, ZoomIn } from 'lucide-react';

export const ViewPurchaseModal = ({ isOpen, onClose, purchase }) => {
  const [showFullImage, setShowFullImage] = useState(false);

  if (!isOpen || !purchase) return null;

  console.log("Purchase Object inside View Modal:", purchase);

  const getFullImageUrl = (path) => {
    if (!path || typeof path !== 'string') return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('/uploads') || path.startsWith('uploads')) {
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      return `http://localhost:5001${cleanPath}`;
    }
    return `http://localhost:5001/uploads/${path}`;
  };

  const rawInvoiceCopy = purchase.invoice_copy || purchase.invoice_url || purchase.invoiceCopy || purchase.invoice_file || purchase.poCopy;
  const invoiceImageUrl = getFullImageUrl(rawInvoiceCopy);

  console.log("Resolved invoiceImageUrl:", invoiceImageUrl);


  // Helper functions for safe formatting
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (val) => {
    const num = parseFloat(val || 0);
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      {/* Modal Card Container */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-xs">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">Purchase Entry #{purchase.id}</h2>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-semibold rounded-full text-[10px] uppercase">
                  {purchase.bill_no}
                </span>
              </div>
              <p className="text-gray-500 text-[11px]">Created on {formatDate(purchase.created_at)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200/60 rounded-lg transition"
              title="Print Entry"
            >
              <Printer size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Top Info Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Vendor Details */}
            <div className="bg-gray-50/60 border border-gray-200 rounded-xl p-4 space-y-2">
              <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <User size={13} className="text-gray-400" /> Vendor Details
              </h3>
              <p className="font-bold text-sm text-gray-900">{purchase.vendor_name || 'N/A'}</p>
              
              <div className="space-y-1 text-gray-600 pt-1">
                <div className="flex items-center gap-2">
                  <Phone size={12} className="text-gray-400" />
                  <span>{purchase.vendor_phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={12} className="text-gray-400" />
                  <span>{purchase.vendor_email || 'No Email Provided'}</span>
                </div>
              </div>
            </div>

            {/* Bill & Invoice Details */}
            <div className="bg-gray-50/60 border border-gray-200 rounded-xl p-4 space-y-2">
              <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Tag size={13} className="text-gray-400" /> Invoice Information
              </h3>
              
              <div className="grid grid-cols-2 gap-2 text-gray-700">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Invoice No</span>
                  <span className="font-semibold text-gray-900">{purchase.invoice_no || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Invoice Date</span>
                  <span className="font-semibold text-gray-900 flex items-center gap-1">
                    <Calendar size={11} className="text-gray-400" />
                    {formatDate(purchase.invoice_date)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Bill No</span>
                  <span className="font-semibold text-gray-900">{purchase.bill_no}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Total Quantity</span>
                  <span className="font-semibold text-gray-900">{parseFloat(purchase.total_qty || 0)} Units</span>
                </div>
              </div>
            </div>

          </div>

          {/* Uploaded Invoice Image / PDF Section */}
          {invoiceImageUrl && (
            <div className="bg-blue-50/40 border border-blue-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {invoiceImageUrl.toLowerCase().endsWith('.pdf') ? (
                  <a
                    href={invoiceImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-200 transition"
                    title="Click to view PDF"
                  >
                    <FileText size={24} />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowFullImage(true)}
                    className="relative group rounded-lg overflow-hidden border border-blue-200 bg-white w-20 h-20 flex-shrink-0 cursor-pointer shadow-2xs"
                    title="Click to expand full size image"
                  >
                    <img
                      src={invoiceImageUrl}
                      alt="Invoice Copy"
                      className="w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                      <ZoomIn size={16} />
                    </div>
                  </button>
                )}

                <div>
                  <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <FileText size={13} className="text-blue-600" />
                    Attached Invoice {invoiceImageUrl.toLowerCase().endsWith('.pdf') ? 'Document (PDF)' : 'Image'}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {invoiceImageUrl.toLowerCase().endsWith('.pdf')
                      ? 'Click icon or link to open original PDF document.'
                      : 'Click thumbnail to zoom or view original full size below.'}
                  </p>
                </div>
              </div>

              <a
                href={invoiceImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 font-semibold rounded-lg hover:bg-blue-50 hover:border-blue-400 transition text-xs flex items-center gap-1.5 flex-shrink-0 shadow-2xs"
              >
                <ExternalLink size={14} /> View Original Full Size
              </a>
            </div>
          )}


          {/* Purchased Items Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-gray-100/70 px-4 py-2.5 border-b border-gray-200">
              <h3 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">
                Items Purchased ({purchase.items?.length || 0})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3 w-8 text-center">#</th>
                    <th className="py-2.5 px-3">Item Name</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Rate</th>
                    <th className="py-2.5 px-3 text-right">Tax (%)</th>
                    <th className="py-2.5 px-3 text-right">Discount</th>
                    <th className="py-2.5 px-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {purchase.items && purchase.items.length > 0 ? (
                    purchase.items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-3 text-center text-gray-400 font-semibold">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-gray-900">{item.item_name}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-700">
                          {parseFloat(item.qty || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-700">
                          {formatCurrency(item.rate)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-700">
                          {parseFloat(item.tax_percent || 0)}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-700">
                          {formatCurrency(item.discount_amount)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                          {formatCurrency(item.line_total)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-4 text-center text-gray-400">
                        No item breakdown available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Section: Remarks & Grand Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Remarks Container */}
            <div className="bg-gray-50/60 border border-gray-200 rounded-xl p-3">
              <span className="text-gray-400 font-bold block text-[10px] uppercase mb-1">Remarks</span>
              <p className="text-gray-700 italic">
                {purchase.remarks || 'No additional remarks or notes recorded for this purchase entry.'}
              </p>
            </div>

            {/* Financial Summary Card */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 font-mono">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(purchase.subtotal)}</span>
              </div>
              
              <div className="flex justify-between text-emerald-600">
                <span>Total Discount (-):</span>
                <span>{formatCurrency(purchase.discount_amount)}</span>
              </div>

              <div className="flex justify-between text-amber-600">
                <span>Total Tax (+):</span>
                <span>{formatCurrency(purchase.tax_amount)}</span>
              </div>

              <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between text-sm font-bold text-gray-900">
                <span>Grand Total:</span>
                <span className="text-blue-600">{formatCurrency(purchase.grand_total)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition"
          >
            Close
          </button>
        </div>

      </div>

      {/* Full Image Preview Lightbox Overlay */}
      {showFullImage && (
        <div
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative max-w-5xl max-h-[95vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setShowFullImage(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 bg-black/50 p-1.5 rounded-full transition flex items-center gap-1 text-xs px-3 cursor-pointer"
            >
              <X size={16} /> Close Preview
            </button>
            <img
              src={invoiceImageUrl}
              alt="Invoice Copy Full Size"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl bg-white p-1"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-3 flex items-center gap-3">
              <a
                href={invoiceImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 shadow-md"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={14} /> Open in New Tab
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};