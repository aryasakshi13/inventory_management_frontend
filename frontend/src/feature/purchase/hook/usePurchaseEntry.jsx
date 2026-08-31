import { useState, useMemo } from 'react';


const createEmptyItem = () => ({
  id: Date.now() + Math.random(),
  item_id: null,
  product_id: null,
  itemName: '',
  brand: '',
  quantity: '1',
  rate: '',
  taxPercent: '',
  discount: '',
});

export const usePurchaseEntry = () => {
  const [headerData, setHeaderData] = useState({
    bill_no: '',
    vendor_name: '',
    vendor_phone: '',
    vendor_email: '',
    invoice_no: '',
    invoice_date: new Date().toISOString().split('T')[0],
    invoice_copy: '',
    invoice_file: null,
    remarks: '',
  });

  const [items, setItems] = useState([createEmptyItem()]);

  // Update Header details
  const updateHeader = (field, value) => {
    setHeaderData((prev) => ({ ...prev, [field]: value }));
  };

  // Dynamic Item Row Management
  const addItemRow = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  const removeItemRow = (id) => {
    if (items.length === 1) return; // Maintain at least 1 row
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItemRow = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (field === 'item' && value && typeof value === 'object') {
          return {
            ...item,
            item_id: value.id || null,
            itemId: value.id || null,
            product_id: value.id || null,
            itemName: value.item_name || value.name || '',
          };
        }
        return {
          ...item,
          [field]: value,
        };
      })
    );
  };

  // Financial Calculations
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    const itemsWithTotals = items.map((item) => {
      const q = Number(item.quantity) || 0;
      const r = Number(item.rate) || 0;
      const d = Number(item.discount) || 0;
      const t = Number(item.taxPercent) || 0;

      const baseAmount = q * r;
      const discountAmount = d;
      const taxableAmount = Math.max(0, baseAmount - discountAmount);
      const taxAmount = (taxableAmount * t) / 100;
      const lineTotal = taxableAmount + taxAmount;

      subtotal += baseAmount;
      totalDiscount += discountAmount;
      totalTax += taxAmount;

      return { ...item, lineTotal };
    });

    const grandTotal = subtotal - totalDiscount + totalTax;

    return {
      subtotal,
      totalTax,
      totalDiscount,
      grandTotal,
      calculatedItems: itemsWithTotals,
    };
  }, [items]);

  const resetForm = () => {
    setHeaderData({
      bill_no: '',
      vendor_name: '',
      vendor_phone: '',
      vendor_email: '',
      invoice_no: '',
      invoice_date: new Date().toISOString().split('T')[0],
      invoice_copy: '',
      invoice_file: null,
      remarks: '',
    });
    setItems([createEmptyItem()]);
  };


  return {
    headerData,
    updateHeader,
    items: totals.calculatedItems,
    addItemRow,
    removeItemRow,
    updateItemRow,
    totals,
    resetForm,
  };
};