import { useState, useMemo } from 'react';


const createEmptyItem = () => ({
  id: Date.now() + Math.random(),
  itemName: '',
  quantity: 1,
  rate: 0,
  taxPercent: 0,
  discount: 0,
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
      prev.map((item) =>
        item.id === id
          ? { ...item, [field]: field === 'itemName' ? value : Number(value) || 0 }
          : item
      )
    );
  };

  // Financial Calculations
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    const itemsWithTotals = items.map((item) => {
      const baseAmount = item.quantity * item.rate;
      const discountAmount = item.discount;
      const taxableAmount = Math.max(0, baseAmount - discountAmount);
      const taxAmount = (taxableAmount * item.taxPercent) / 100;
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