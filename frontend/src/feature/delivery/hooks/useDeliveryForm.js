import { useState } from 'react';

const createEmptyRow = () => ({
  id: Date.now() + Math.random(),
  product_id: '',
  category: '',
  item_name: '',
  ordered_qty: '',
  delivered_qty: '',
});

export const useDeliveryForm = (onSubmitSuccess) => {
  const [formData, setFormData] = useState({
    challan_no: '',
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    dispatch_date: new Date().toISOString().split('T')[0],
    transporter_name: '',
    vehicle_no: '',
    remarks: '',
  });

  const [items, setItems] = useState([createEmptyRow()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update header fields
  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Add new item row
  const addItemRow = () => {
    setItems((prev) => [...prev, createEmptyRow()]);
  };

  // Remove item row
  const removeItemRow = (rowId) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((item) => item.id !== rowId));
  };

  // Update line item values
  const updateItemRow = (rowId, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item;
        return { ...item, [field]: value };
      })
    );
  };

  // Populate item fields when selecting a product from store dropdown
  const selectStoreProduct = (rowId, product) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item;
        return {
          ...item,
          product_id: product.id,
          item_name: product.item_name,
          category: product.category || 'General',
        };
      })
    );
  };

  // Reset form state
  const resetForm = () => {
    setFormData({
      challan_no: '',
      customer_name: '',
      customer_phone: '',
      delivery_address: '',
      dispatch_date: new Date().toISOString().split('T')[0],
      transporter_name: '',
      vehicle_no: '',
      remarks: '',
    });
    setItems([createEmptyRow()]);
    setError(null);
  };

  return {
    formData,
    items,
    loading,
    error,
    setError,
    setLoading,
    handleHeaderChange,
    addItemRow,
    removeItemRow,
    updateItemRow,
    selectStoreProduct,
    resetForm,
  };
};