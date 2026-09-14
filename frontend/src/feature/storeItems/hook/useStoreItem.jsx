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
  const [selectedItemType, setSelectedItemType] = useState('all');

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
    const quantity = parseFloat(qty ?? 0);
    const thresh = parseFloat(threshold ?? 10);
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
      const thresh = item.min_threshold ?? item.minThreshold ?? item.min_stock_level ?? item.reorder_point ?? 10;
      const qty = item.quantity ?? item.stock_quantity ?? item.opening_stock ?? 0;
      const status = getItemStatus(qty, thresh);
      const name = item.item_name || item.name || '';
      const rawTypeStr = (item.item_type || item.type || '').toString().toLowerCase().trim();

      const matchesSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.linked_product_name || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
      const matchesStatus = selectedStatus
        ? status.trim().toLowerCase() === selectedStatus.trim().toLowerCase()
        : true;

      let matchesItemType = true;
      if (selectedItemType === 'finished_good') {
        matchesItemType = rawTypeStr.includes('finish');
      } else if (selectedItemType === 'raw_material') {
        matchesItemType = !rawTypeStr.includes('finish') && !rawTypeStr.includes('consum');
      } else if (selectedItemType === 'consumable') {
        matchesItemType = rawTypeStr.includes('consum');
      }

      return matchesSearch && matchesCategory && matchesStatus && matchesItemType;
    });
  }, [items, searchQuery, selectedCategory, selectedStatus, selectedItemType]);

  const metrics = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let rawCount = 0;
    let finishedCount = 0;
    let consumableCount = 0;

    items.forEach((item) => {
      const thresh = item.min_threshold ?? item.minThreshold ?? item.min_stock_level ?? item.reorder_point ?? 10;
      const qty = item.quantity ?? item.stock_quantity ?? item.opening_stock ?? 0;
      const status = getItemStatus(qty, thresh);
      if (status === 'In Stock') inStock++;
      if (status === 'Low Stock') lowStock++;
      if (status === 'Out of Stock') outOfStock++;

      const rawTypeStr = (item.item_type || item.type || '').toString().toLowerCase().trim();
      if (rawTypeStr.includes('finish')) {
        finishedCount++;
      } else if (rawTypeStr.includes('consum')) {
        consumableCount++;
      } else {
        rawCount++;
      }
    });

    return { 
      total: items.length, 
      inStock, 
      lowStock, 
      outOfStock,
      rawCount,
      finishedCount,
      consumableCount
    };
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
    selectedItemType,
    setSelectedItemType,
    resetFilters: () => {
      setSearchQuery('');
      setSelectedCategory('');
      setSelectedStatus('');
      setSelectedItemType('all');
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