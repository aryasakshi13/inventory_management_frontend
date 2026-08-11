import React from 'react';
import { Package, Search, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { useStoreItems } from '../hook/useStoreItem';
import { StoreItemsTable } from '../component/StoreItemtable';
import { AddEditStoreModal } from '../component/AddEditstoreModal';

export const StorePage = () => {
  const {
    items,
    categories,
    metrics,
    loading,
    isSubmitting,
    error,
    refetchItems,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    resetFilters,
    isModalOpen,
    editingItem,
    handleOpenCreate,
    handleOpenEdit,
    handleCloseModal,
    handleSaveItem,
    handleDeleteItem,
  } = useStoreItems();

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 text-xs">
      
      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            onClick={refetchItems}
            className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 font-semibold rounded-lg text-[11px] transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package size={22} className="text-blue-600" /> Store Items
          </h1>
          <p className="text-xs text-gray-500">Manage store inventory items, categories, and stock status</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
        >
          <Plus size={15} /> Add Item
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Total Items</span>
          <p className="text-xl font-extrabold text-gray-900 mt-1">{metrics.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-100 bg-emerald-50/20 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase">In Stock</span>
          <p className="text-xl font-extrabold text-emerald-700 mt-1">{metrics.inStock}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-100 bg-amber-50/20 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-600 uppercase">Low Stock</span>
          <p className="text-xl font-extrabold text-amber-700 mt-1">{metrics.lowStock}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-100 bg-rose-50/20 shadow-2xs">
          <span className="text-[10px] font-bold text-rose-600 uppercase">Out of Stock</span>
          <p className="text-xl font-extrabold text-rose-700 mt-1">{metrics.outOfStock}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Search Item</label>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search item name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-1.5 border border-gray-300 rounded-lg text-gray-900 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full p-1.5 border border-gray-300 rounded-lg text-gray-900 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={resetFilters}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg font-semibold text-gray-700 transition"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Reset Filters
          </button>
        </div>
      </div>

      {/* Main Items Table */}
      <StoreItemsTable
        items={items}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteItem}
        loading={loading}
      />

      {/* Modal */}
      <AddEditStoreModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveItem}
        editingItem={editingItem}
        isSubmitting={isSubmitting}
      />

    </div>
  );
};