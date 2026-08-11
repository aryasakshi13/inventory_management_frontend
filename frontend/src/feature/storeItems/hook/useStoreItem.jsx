import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getAllStoreItems,
  addStoreItem,
  updateStoreItem,
  deleteStoreItem,
} from '../services/storeItemService';

export const useStoreItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllStoreItems();
      const itemsList = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.storeItems)
        ? data.storeItems
        : [];
      setItems(itemsList);
    } catch (err) {
      console.error('Failed to fetch store items:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch store items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Helper function for stock calculations
  const getItemStatus = (qty, threshold) => {
    const quantity = qty ?? 0;
    const thresh = threshold ?? 10;
    if (quantity <= 0) return 'Out of Stock';
    if (quantity <= thresh) return 'Low Stock';
    return 'In Stock';
  };

  const categories = useMemo(() => {
    const catSet = new Set(items.map((i) => i.category).filter(Boolean));
    return [...catSet];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const thresh = item.min_threshold ?? item.minThreshold ?? 10;
      const status = getItemStatus(item.quantity, thresh);
      const name = item.item_name || item.name || '';
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
      const matchesStatus = selectedStatus ? status === selectedStatus : true;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, searchQuery, selectedCategory, selectedStatus]);

  const metrics = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    items.forEach((item) => {
      const thresh = item.min_threshold ?? item.minThreshold ?? 10;
      const status = getItemStatus(item.quantity, thresh);
      if (status === 'In Stock') inStock++;
      if (status === 'Low Stock') lowStock++;
      if (status === 'Out of Stock') outOfStock++;
    });

    return { total: items.length, inStock, lowStock, outOfStock };
  }, [items]);

  const handleSaveItem = async (formData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      if (editingItem) {
        const id = editingItem.id || editingItem._id;
        await updateStoreItem(id, formData);
      } else {
        await addStoreItem(formData);
      }
      await fetchItems();
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Failed to save store item:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to save store item';
      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this store item?')) {
      try {
        setError(null);
        await deleteStoreItem(id);
        await fetchItems();
      } catch (err) {
        console.error('Failed to delete store item:', err);
        const errorMsg = err.response?.data?.message || err.message || 'Failed to delete store item';
        alert(errorMsg);
      }
    }
  };

  return {
    items: filteredItems,
    categories,
    metrics,
    loading,
    isSubmitting,
    error,
    refetchItems: fetchItems,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    resetFilters: () => {
      setSearchQuery('');
      setSelectedCategory('');
      setSelectedStatus('');
    },
    isModalOpen,
    editingItem,
    handleOpenCreate: () => {
      setEditingItem(null);
      setIsModalOpen(true);
    },
    handleOpenEdit: (item) => {
      setEditingItem(item);
      setIsModalOpen(true);
    },
    handleCloseModal: () => {
      setIsModalOpen(false);
      setEditingItem(null);
    },
    handleSaveItem,
    handleDeleteItem,
  };
};