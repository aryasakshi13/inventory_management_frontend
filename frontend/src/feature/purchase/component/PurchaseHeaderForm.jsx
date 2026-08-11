import React, { useState, useEffect } from 'react';
import { getClients } from '../../client/services/clientService';
import { uploadImageApi } from '../../../services/uploadService';
import { Loader2 } from 'lucide-react';

export const PurchaseHeaderForm = ({ headerData, updateHeader }) => {
  const [vendors, setVendors] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await getClients({ role: 'vendor' });
        if (res.success) setVendors(res.data || []);
      } catch (err) {
        console.error('Failed to load vendor clients:', err);
      }
    };
    fetchVendors();
  }, []);

  const handleVendorChange = (e) => {
    const vendorName = e.target.value;
    const vendor = vendors.find((v) => (v.companyName || v.name) === vendorName);
    const contact = vendor?.Phone
      ? vendor.Phone.replace(/\D/g, '').slice(0, 10)
      : vendor?.contactNumber
      ? vendor.contactNumber.replace(/\D/g, '').slice(0, 10)
      : '';
    const email = vendor?.email || '';
    updateHeader('vendor_name', vendorName);
    updateHeader('vendor_phone', contact);
    updateHeader('vendor_email', email);
  };

  const handleInvoiceFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    updateHeader('invoice_file', file);

    try {
      setUploading(true);
      const res = await uploadImageApi(file, 'purchase');
      if (res && res.url) {
        updateHeader('invoice_copy', res.url);
      }
    } catch (err) {

      console.error('Invoice upload error:', err);
    } finally {
      setUploading(false);
    }
  };


  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4 text-xs">
      <h3 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">Header Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-gray-500 font-semibold mb-1">Bill No (Unique & Manual)</label>
          <input
            type="text"
            value={headerData.bill_no || ''}
            onChange={(e) => updateHeader('bill_no', e.target.value)}
            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg p-2 font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-gray-600 font-semibold mb-1">Vendor Name *</label>
          <select
            value={headerData.vendor_name || ''}
            onChange={handleVendorChange}
            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Select Vendor</option>
            {vendors.map((vendor) => (
              <option key={vendor.id || vendor._id || vendor.companyName} value={vendor.companyName || vendor.name}>
                {vendor.companyName || vendor.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-600 font-semibold mb-1">Vendor Phone</label>
          <input
            type="tel"
            placeholder="Contact details"
            inputMode="numeric"
            maxLength={10}
            value={headerData.vendor_phone || ''}
            onChange={(e) => updateHeader('vendor_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-gray-600 font-semibold mb-1">Invoice No *</label>
          <input
            type="text"
            placeholder="Supplier Invoice #"
            value={headerData.invoice_no || ''}
            onChange={(e) => updateHeader('invoice_no', e.target.value)}
            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-gray-600 font-semibold mb-1">Invoice Date</label>
          <input
            type="date"
            value={headerData.invoice_date || ''}
            onChange={(e) => updateHeader('invoice_date', e.target.value)}
            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* //image OR PDF upload  */}
        <div>
          <label className="block text-gray-600 font-semibold mb-1">Upload Invoice (PDF / Image)</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleInvoiceFileChange}
            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
          />
          {uploading && (
            <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
              <Loader2 size={12} className="animate-spin" /> Uploading image...
            </div>
          )}
          {headerData.invoice_copy && (
            <a
              href={headerData.invoice_copy}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 underline mt-1 block truncate"
            >
              View Uploaded Invoice
            </a>
          )}
        </div>


        <div className="md:col-span-2">
          <label className="block text-gray-600 font-semibold mb-1">Remarks</label>
          <input
            type="text"
            placeholder="Add notes or remarks..."
            value={headerData.remarks || ''}
            onChange={(e) => updateHeader('remarks', e.target.value)}
            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};