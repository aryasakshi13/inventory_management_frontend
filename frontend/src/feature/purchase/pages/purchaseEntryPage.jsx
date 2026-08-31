import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePurchaseEntry } from '../hook/usePurchaseEntry';
import { createPurchaseOrder } from '../services/purchaseService';
import { uploadImageApi } from '../../../services/uploadService';

import { PurchaseHeaderForm } from '../component/PurchaseHeaderForm';
import { PurchaseItemsTable } from '../component/PurchaseItemsTable';
import { PurchaseSummaryCard } from '../component/PurchaseSummaryCard';


import {
  Save,
  PlusCircle,
  XCircle,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

export const PurchaseEntryPage = ({ onCancel, onSaveSuccess }) => {
  const navigate = useNavigate();

  const [saveError, setSaveError] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    headerData,
    updateHeader: rawUpdateHeader,
    items,
    addItemRow,
    removeItemRow,
    updateItemRow,
    totals,
    resetForm,
  } = usePurchaseEntry();

  const updateHeader = (field, value) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    rawUpdateHeader(field, value);
  };

  console.log('PurchaseEntryPage Rendered');

  // =========================================================
  // SAVE PURCHASE ENTRY
  // =========================================================
  const handleSave = async (saveAndNew = false) => {
    console.log('========================================');
    console.log(
      saveAndNew
        ? 'SAVE & NEW BUTTON CLICKED'
        : 'SAVE ENTRY BUTTON CLICKED'
    );
    console.log('========================================');

    setSaveError('');
    const newErrors = {};

    // =========================================================
    // VALIDATION
    // =========================================================

    // Bill No
    if (!headerData.bill_no?.trim()) {
      newErrors.bill_no = 'Bill No is required.';
    } else if (!/^[a-zA-Z0-9\-_]+$/.test(headerData.bill_no.trim())) {
      newErrors.bill_no = 'Bill No can only contain letters, numbers, hyphens (-), and underscores (_). Slashes (/) and other symbols are not allowed.';
    } else if (!/[a-zA-Z0-9]/.test(headerData.bill_no.trim())) {
      newErrors.bill_no = 'Bill No must contain at least one letter or number and cannot be only symbols.';
    }

    // Vendor Name
    if (!headerData.vendor_name?.trim()) {
      newErrors.vendor_name = 'Vendor Name is required.';
    }

    // Invoice No
    if (!headerData.invoice_no?.trim()) {
      newErrors.invoice_no = 'Invoice No is required.';
    } else if (!/^[a-zA-Z0-9\-_]+$/.test(headerData.invoice_no.trim())) {
      newErrors.invoice_no = 'Invoice No can only contain letters, numbers, hyphens (-), and underscores (_). Slashes (/) and other symbols are not allowed.';
    } else if (!/[a-zA-Z0-9]/.test(headerData.invoice_no.trim())) {
      newErrors.invoice_no = 'Invoice No must contain at least one letter or number and cannot be only symbols.';
    }

    // Vendor Phone
    if (
      headerData.vendor_phone &&
      !/^\d{10}$/.test(headerData.vendor_phone)
    ) {
      newErrors.vendor_phone = 'Vendor Phone must be exactly 10 digits.';
    }

    // Item Name Validation
    const invalidItem = items.find((i) => !i.itemName?.trim());
    if (invalidItem) {
      newErrors.items = 'Please select or enter an Item Name for all item rows.';
    }

    // Quantity Validation
    const invalidQty = items.find((i) => !i.quantity || Number(i.quantity) <= 0);
    if (invalidQty) {
      newErrors.items = newErrors.items || 'Quantity must be greater than 0 for all items.';
    }

    // Duplicate Item + Brand Validation
    const seenCombos = new Set();
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.itemName?.trim()) continue;
      const itemIdKey = String(it.item_id || it.itemId || it.itemName).trim().toLowerCase();
      const brandKey = String(it.brand || '').trim().toLowerCase();
      const comboKey = `${itemIdKey}__${brandKey}`;

      if (seenCombos.has(comboKey)) {
        const itemDisplayName = it.itemName || `Item #${it.item_id}`;
        const brandDisplayName = it.brand?.trim() ? ` with brand "${it.brand.trim()}"` : '';
        newErrors.items = `Duplicate item detected: "${itemDisplayName}"${brandDisplayName} cannot be added multiple times. Please combine their quantity into a single row.`;
        break;
      }
      seenCombos.add(comboKey);
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSaveError(Object.values(newErrors)[0]);
      console.warn('API NOT CALLED - Validation failed:', newErrors);
      return;
    }

    setErrors({});

    // =========================================================
    // DEBUG - CURRENT FORM DATA
    // =========================================================

    console.log('========================================');
    console.log('HEADER DATA:', headerData);
    console.log('ITEMS:', items);
    console.log('TOTALS:', totals);

    // =========================================================
    // CREATE PAYLOAD
    // =========================================================

    let invoiceCopyUrl = headerData.invoice_copy || null;
    if (!invoiceCopyUrl && headerData.invoice_file) {
      try {
        const uploadRes = await uploadImageApi(headerData.invoice_file, 'purchase');
        if (uploadRes && uploadRes.url) {
          invoiceCopyUrl = uploadRes.url;
        }
      } catch (err) {

        console.error('Invoice upload failed during save:', err);
      }
    }

    const payload = {
      // -----------------------------
      // Purchase Header
      // -----------------------------
      bill_no: headerData.bill_no,
      vendor_name: headerData.vendor_name,
      vendor_phone: headerData.vendor_phone || '',
      vendor_email: headerData.vendor_email || '',
      invoice_no: headerData.invoice_no,
      invoice_date: headerData.invoice_date,
      invoice_copy: invoiceCopyUrl,


      // -----------------------------
      // Purchase Totals
      // -----------------------------
      total_qty: items.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
      ),

      subtotal: Number(totals.subtotal || 0),

      tax_amount: Number(
        totals.totalTax || 0
      ),

      discount_amount: Number(
        totals.totalDiscount || 0
      ),

      grand_total: Number(
        totals.grandTotal || 0
      ),

      // -----------------------------
      // Other Details
      // -----------------------------
      remarks: headerData.remarks || '',

      created_by: 1,

      // -----------------------------
      // Purchase Items
      // -----------------------------
      items: items.map((item) => ({
        item_id: item.item_id || item.itemId || null,
        brand: item.brand || '',
        quantity: Number(item.quantity || 0),
        qty: Number(item.quantity || 0),
        rate: Number(item.rate || 0),
        tax_percent: Number(item.taxPercent || 0),
        discount: Number(item.discount || 0),
        discount_amount: Number(item.discount || 0),
        line_total: Number(item.lineTotal || 0),
      })),

    };


    // =========================================================
    // CONSOLE COMPLETE PAYLOAD
    // =========================================================

    console.log('========================================');
    console.log('CALLING API WITH PAYLOAD:');
    console.log(payload);
    console.log('PAYLOAD JSON:', JSON.stringify(payload, null, 2));
    console.log('========================================');

    // =========================================================
    // API CALL
    // =========================================================
    setIsSubmitting(true);
    try {
      console.log('Invoking createPurchaseOrder API...');
      const response = await createPurchaseOrder(payload);
      console.log('API call finished, response:', response);

      if (response?.success !== false) {
        alert(`Purchase Bill ${headerData.bill_no} saved successfully!`);

        if (saveAndNew) {
          resetForm();
        } else if (onSaveSuccess) {
          onSaveSuccess();
        } else {
          navigate('/pages/mainModule/purchase');
        }
      } else {
        setSaveError(
          response?.message || 'Failed to save purchase entry.'
        );
      }
    } catch (error) {
      console.error('Purchase save failed:', error);
      setSaveError(
        error.response?.data?.message ||
        error.message ||
        'Failed to save purchase entry.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-6 pb-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex items-center justify-between mb-4">

        {/* Back Button */}

        <button
          type="button"
          onClick={() =>
            navigate('/pages/mainModule/purchase')
          }
          className="flex items-center gap-2 px-3 text-black py-2 bg-white border rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft size={16} />

          Back
        </button>

        {/* Page Title */}

        <div>
          <h1 className="text-xl font-bold text-gray-900">
            New Purchase Entry
          </h1>

          <p className="text-sm text-gray-500">
            Record incoming stock and vendor purchase bill
          </p>
        </div>
      </div>

      {/* =====================================================
          PURCHASE HEADER FORM
      ====================================================== */}

      <PurchaseHeaderForm
        headerData={headerData}
        updateHeader={updateHeader}
        errors={errors}
      />

      {/* =====================================================
          PURCHASE ITEMS
      ====================================================== */}

      <PurchaseItemsTable
        items={items}
        addItemRow={addItemRow}
        removeItemRow={removeItemRow}
        updateItemRow={updateItemRow}
        errors={errors}
      />

      {/* =====================================================
          PURCHASE SUMMARY
      ====================================================== */}

      <PurchaseSummaryCard
        totals={totals}
      />

      {/* =====================================================
          ERROR MESSAGE
      ====================================================== */}

      {saveError && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-red-600">
          {saveError}
        </div>
      )}

      {/* =====================================================
          FOOTER ACTIONS
      ====================================================== */}

      <div className="sticky bottom-0 -mx-4 -mb-4 p-4 bg-white border-t border-gray-200 flex justify-end gap-3 z-20 shadow-md">

        {/* ===================================================
            CANCEL
        ==================================================== */}

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => {
            console.log('Cancel clicked');

            if (onCancel) {
              onCancel();
            } else {
              navigate('/pages/mainModule/purchase');
            }
          }}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50"
        >
          <XCircle size={16} />

          Cancel
        </button>

        {/* ===================================================
            SAVE & NEW
        ==================================================== */}

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => {
            console.log('Save & New clicked');

            handleSave(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />}

          Save & New
        </button>

        {/* ===================================================
            SAVE ENTRY
        ==================================================== */}

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => {
            console.log('Save Entry clicked');

            handleSave(false);
          }}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}

          Save Entry
        </button>

      </div>
    </div>
  );
};