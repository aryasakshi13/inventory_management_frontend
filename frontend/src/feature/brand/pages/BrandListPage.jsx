import React, { useState, useEffect, useCallback } from 'react';
import {
  Tag,
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  X,
  Layers,
  Hash
} from 'lucide-react';
import {
  getAllBrands,
  getNextBrandCode,
  createBrand,
  updateBrand,
  toggleBrandStatus,
  deleteBrand
} from '../services/brandService';
import {
  getAllCategories,
  getNextCategoryCode,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory
} from '../services/categoryService';

export const BrandListPage = () => {
  // Active Main Tab: 'brands' or 'categories'
  const [activeTab, setActiveTab] = useState('brands');

  // --- Brands State ---
  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [brandSearch, setBrandSearch] = useState('');
  const [brandStatusFilter, setBrandStatusFilter] = useState('');

  // Brand Modal State
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [brandCodeInput, setBrandCodeInput] = useState('');
  const [brandNameInput, setBrandNameInput] = useState('');
  const [submittingBrand, setSubmittingBrand] = useState(false);
  const [brandFormError, setBrandFormError] = useState('');
  const [brandStatusUpdatingId, setBrandStatusUpdatingId] = useState(null);

  // --- Categories State ---
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryStatusFilter, setCategoryStatusFilter] = useState('');

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryCodeInput, setCategoryCodeInput] = useState('');
  const [categoryNameInput, setCategoryNameInput] = useState('');
  const [submittingCategory, setSubmittingCategory] = useState(false);
  const [categoryFormError, setCategoryFormError] = useState('');
  const [categoryStatusUpdatingId, setCategoryStatusUpdatingId] = useState(null);

  // ==========================================
  // FETCH BRANDS
  // ==========================================
  const fetchBrands = useCallback(async () => {
    try {
      setLoadingBrands(true);
      const res = await getAllBrands({
        search: brandSearch,
        status: brandStatusFilter,
      });
      if (res && res.data) {
        setBrands(res.data);
      } else if (Array.isArray(res)) {
        setBrands(res);
      } else {
        setBrands([]);
      }
    } catch (err) {
      console.error('Error fetching brands:', err);
    } finally {
      setLoadingBrands(false);
    }
  }, [brandSearch, brandStatusFilter]);

  // ==========================================
  // FETCH CATEGORIES
  // ==========================================
  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const res = await getAllCategories({
        search: categorySearch,
        status: categoryStatusFilter,
      });
      if (res && res.data) {
        setCategories(res.data);
      } else if (Array.isArray(res)) {
        setCategories(res);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  }, [categorySearch, categoryStatusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'brands') {
        fetchBrands();
      } else {
        fetchCategories();
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [activeTab, fetchBrands, fetchCategories]);

  // Initial load for both
  useEffect(() => {
    fetchBrands();
    fetchCategories();
  }, [fetchBrands, fetchCategories]);

  // ==========================================
  // BRAND HANDLERS
  // ==========================================
  const handleOpenBrandModal = async (brand = null) => {
    setBrandFormError('');
    if (brand) {
      setEditingBrand(brand);
      setBrandCodeInput(brand.brand_code || `BRD${String(brand.brand_id).padStart(3, '0')}`);
      setBrandNameInput(brand.brand_name || '');
    } else {
      setEditingBrand(null);
      setBrandNameInput('');
      try {
        const nextRes = await getNextBrandCode();
        setBrandCodeInput(nextRes?.brand_code || 'BRD001');
      } catch (err) {
        setBrandCodeInput(`BRD${String(brands.length + 1).padStart(3, '0')}`);
      }
    }
    setIsBrandModalOpen(true);
  };

  const handleCloseBrandModal = () => {
    setIsBrandModalOpen(false);
    setEditingBrand(null);
    setBrandCodeInput('');
    setBrandNameInput('');
    setBrandFormError('');
  };

  const handleBrandSubmit = async (e) => {
    e.preventDefault();
    if (!brandNameInput.trim()) {
      setBrandFormError('Please enter a valid brand name.');
      return;
    }

    try {
      setSubmittingBrand(true);
      setBrandFormError('');

      if (editingBrand) {
        await updateBrand(editingBrand.brand_id, {
          brand_code: brandCodeInput.trim(),
          brand_name: brandNameInput.trim(),
          status: editingBrand.status || 'Active',
        });
      } else {
        await createBrand({
          brand_code: brandCodeInput.trim(),
          brand_name: brandNameInput.trim(),
          status: 'Active',
        });
      }

      handleCloseBrandModal();
      fetchBrands();
    } catch (err) {
      console.error('Error saving brand:', err);
      const msg = err.response?.data?.message || 'Failed to save brand. Please try again.';
      setBrandFormError(msg);
    } finally {
      setSubmittingBrand(false);
    }
  };

  const handleToggleBrandStatus = async (brand) => {
    try {
      setBrandStatusUpdatingId(brand.brand_id);
      await toggleBrandStatus(brand.brand_id, brand.status);
      fetchBrands();
    } catch (err) {
      console.error('Error updating brand status:', err);
      alert('Failed to update brand status.');
    } finally {
      setBrandStatusUpdatingId(null);
    }
  };

  const handleDeleteBrand = async (brand) => {
    if (
      window.confirm(
        `Are you sure you want to delete brand "${brand.brand_name}" (${brand.brand_code || 'N/A'})? This action cannot be undone.`
      )
    ) {
      try {
        await deleteBrand(brand.brand_id);
        fetchBrands();
      } catch (err) {
        console.error('Error deleting brand:', err);
        alert(err.response?.data?.message || 'Failed to delete brand.');
      }
    }
  };

  // ==========================================
  // CATEGORY HANDLERS
  // ==========================================
  const handleOpenCategoryModal = async (cat = null) => {
    setCategoryFormError('');
    if (cat) {
      setEditingCategory(cat);
      setCategoryCodeInput(cat.category_code || `CAT${String(cat.category_id).padStart(3, '0')}`);
      setCategoryNameInput(cat.category_name || '');
    } else {
      setEditingCategory(null);
      setCategoryNameInput('');
      try {
        const nextRes = await getNextCategoryCode();
        setCategoryCodeInput(nextRes?.category_code || 'CAT001');
      } catch (err) {
        setCategoryCodeInput(`CAT${String(categories.length + 1).padStart(3, '0')}`);
      }
    }
    setIsCategoryModalOpen(true);
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
    setCategoryCodeInput('');
    setCategoryNameInput('');
    setCategoryFormError('');
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryNameInput.trim()) {
      setCategoryFormError('Please enter a valid category name.');
      return;
    }

    try {
      setSubmittingCategory(true);
      setCategoryFormError('');

      if (editingCategory) {
        await updateCategory(editingCategory.category_id, {
          category_code: categoryCodeInput.trim(),
          category_name: categoryNameInput.trim(),
          status: editingCategory.status || 'Active',
        });
      } else {
        await createCategory({
          category_code: categoryCodeInput.trim(),
          category_name: categoryNameInput.trim(),
          status: 'Active',
        });
      }

      handleCloseCategoryModal();
      fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      const msg = err.response?.data?.message || 'Failed to save category. Please try again.';
      setCategoryFormError(msg);
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleToggleCategoryStatus = async (cat) => {
    try {
      setCategoryStatusUpdatingId(cat.category_id);
      await toggleCategoryStatus(cat.category_id, cat.status);
      fetchCategories();
    } catch (err) {
      console.error('Error updating category status:', err);
      alert('Failed to update category status.');
    } finally {
      setCategoryStatusUpdatingId(null);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (
      window.confirm(
        `Are you sure you want to delete category "${cat.category_name}" (${cat.category_code || 'N/A'})? This action cannot be undone.`
      )
    ) {
      try {
        await deleteCategory(cat.category_id);
        fetchCategories();
      } catch (err) {
        console.error('Error deleting category:', err);
        alert(err.response?.data?.message || 'Failed to delete category.');
      }
    }
  };

  // Counters
  const totalBrands = brands.length;
  const activeBrands = brands.filter((b) => (b.status || '').toLowerCase() === 'active').length;
  const inactiveBrands = totalBrands - activeBrands;

  const totalCategories = categories.length;
  const activeCategories = categories.filter((c) => (c.status || '').toLowerCase() === 'active').length;
  const inactiveCategories = totalCategories - activeCategories;

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">
      {/* 🌟 1. PAGE HEADER */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
            {activeTab === 'brands' ? <Tag className="w-5 h-5" /> : <FolderTree className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              {activeTab === 'brands' ? 'Brand Master' : 'Category Master'}
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                {activeTab === 'brands' ? `${totalBrands} Brands` : `${totalCategories} Categories`}
              </span>
            </h1>
            <p className="text-xs text-gray-500">
              {activeTab === 'brands'
                ? 'Manage product brand catalog, unique brand codes, and active status'
                : 'Manage store item categories, category codes, and active status'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Main Sub-Tabs Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('brands')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeTab === 'brands'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Tag size={13} />
              <span>Brands</span>
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FolderTree size={13} />
              <span>Categories</span>
            </button>
          </div>

          <button
            onClick={() => (activeTab === 'brands' ? handleOpenBrandModal() : handleOpenCategoryModal())}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98] cursor-pointer shrink-0"
          >
            <Plus size={15} />
            {activeTab === 'brands' ? 'Add Brand' : 'Add Category'}
          </button>
        </div>
      </div>

      {/* 🌟 2. STATS & FILTERS BAR */}
      <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Quick Stats Badges */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Total:</span>
            <strong className="text-gray-900 font-bold">
              {activeTab === 'brands' ? totalBrands : totalCategories}
            </strong>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Active:</span>
            <strong className="text-emerald-700 font-bold">
              {activeTab === 'brands' ? activeBrands : activeCategories}
            </strong>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-medium">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Inactive:</span>
            <strong className="text-rose-700 font-bold">
              {activeTab === 'brands' ? inactiveBrands : inactiveCategories}
            </strong>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-1 md:max-w-md md:justify-end">
          {/* Search Input with Clear Button */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={activeTab === 'brands' ? 'Search code or brand name...' : 'Search code or category name...'}
              value={activeTab === 'brands' ? brandSearch : categorySearch}
              onChange={(e) => {
                const val = e.target.value;
                if (activeTab === 'brands') {
                  setBrandSearch(val);
                } else {
                  setCategorySearch(val);
                }
              }}
              className="w-full pl-10 pr-9 py-2 text-xs text-gray-900 font-medium bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder:text-gray-400 transition"
            />
            {((activeTab === 'brands' && brandSearch) || (activeTab === 'categories' && categorySearch)) && (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'brands') setBrandSearch('');
                  else setCategorySearch('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-200/60 transition cursor-pointer"
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={activeTab === 'brands' ? brandStatusFilter : categoryStatusFilter}
            onChange={(e) =>
              activeTab === 'brands' ? setBrandStatusFilter(e.target.value) : setCategoryStatusFilter(e.target.value)
            }
            className="text-xs bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium shrink-0 cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* 🌟 3. DATA TABLE (BRANDS OR CATEGORIES) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse table-fixed">
            <thead className="bg-slate-50 text-gray-600 font-bold uppercase tracking-wider text-[10px] border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-4 w-[8%] text-center">#</th>
                <th className="py-3.5 px-4 w-[20%]">{activeTab === 'brands' ? 'Brand Code' : 'Category Code'}</th>
                <th className="py-3.5 px-4 w-[34%]">{activeTab === 'brands' ? 'Brand Name' : 'Category Name'}</th>
                <th className="py-3.5 px-4 w-[18%]">Status</th>
                <th className="py-3.5 px-4 w-[12%]">Created Date</th>
                <th className="py-3.5 px-4 w-[8%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {activeTab === 'brands' ? (
                loadingBrands ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <p className="font-medium text-xs">Loading brands...</p>
                      </div>
                    </td>
                  </tr>
                ) : brands.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Tag className="w-8 h-8 text-gray-300" />
                        <p className="font-semibold text-gray-600">No brands found</p>
                        <p className="text-[11px] text-gray-400">
                          {brandSearch || brandStatusFilter
                            ? 'Try clearing your filters'
                            : 'Click "+ Add Brand" above to register your first brand'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  brands.map((brand, idx) => {
                    const isActive = (brand.status || '').toLowerCase() === 'active';
                    const isUpdatingThis = brandStatusUpdatingId === brand.brand_id;
                    const code = brand.brand_code || `BRD${String(brand.brand_id).padStart(3, '0')}`;

                    return (
                      <tr key={brand.brand_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-center font-mono text-gray-400 text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 truncate">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80 font-mono font-bold text-xs">
                            <Hash className="w-3 h-3 text-blue-500" />
                            {code}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-gray-900 truncate">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                              {(brand.brand_name?.[0] || 'B').toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-gray-900 truncate" title={brand.brand_name}>
                              {brand.brand_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleBrandStatus(brand)}
                              disabled={isUpdatingThis}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                isActive ? 'bg-emerald-500' : 'bg-slate-300'
                              } ${isUpdatingThis ? 'opacity-50 cursor-wait' : ''}`}
                              title={isActive ? 'Click to make Inactive' : 'Click to make Active'}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                  isActive ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                            <span
                              className={`text-xs font-semibold ${
                                isActive ? 'text-emerald-700' : 'text-slate-500'
                              }`}
                            >
                              {isUpdatingThis ? 'Updating...' : brand.status || (isActive ? 'Active' : 'Inactive')}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 text-xs truncate">
                          {brand.created_At || brand.created_at
                            ? new Date(brand.created_At || brand.created_at).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenBrandModal(brand)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              title="Edit Brand"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteBrand(brand)}
                              className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Delete Brand"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )
              ) : (
                /* CATEGORIES TABLE */
                loadingCategories ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <p className="font-medium text-xs">Loading categories...</p>
                      </div>
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FolderTree className="w-8 h-8 text-gray-300" />
                        <p className="font-semibold text-gray-600">No categories found</p>
                        <p className="text-[11px] text-gray-400">
                          {categorySearch || categoryStatusFilter
                            ? 'Try clearing your filters'
                            : 'Click "+ Add Category" above to register your first category'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  categories.map((cat, idx) => {
                    const isActive = (cat.status || '').toLowerCase() === 'active';
                    const isUpdatingThis = categoryStatusUpdatingId === cat.category_id;
                    const code = cat.category_code || `CAT${String(cat.category_id).padStart(3, '0')}`;

                    return (
                      <tr key={cat.category_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-center font-mono text-gray-400 text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 truncate">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-mono font-bold text-xs">
                            <Hash className="w-3 h-3 text-indigo-500" />
                            {code}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-gray-900 truncate">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                              {(cat.category_name?.[0] || 'C').toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-gray-900 truncate" title={cat.category_name}>
                              {cat.category_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleCategoryStatus(cat)}
                              disabled={isUpdatingThis}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                isActive ? 'bg-emerald-500' : 'bg-slate-300'
                              } ${isUpdatingThis ? 'opacity-50 cursor-wait' : ''}`}
                              title={isActive ? 'Click to make Inactive' : 'Click to make Active'}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                  isActive ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                            <span
                              className={`text-xs font-semibold ${
                                isActive ? 'text-emerald-700' : 'text-slate-500'
                              }`}
                            >
                              {isUpdatingThis ? 'Updating...' : cat.status || (isActive ? 'Active' : 'Inactive')}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 text-xs truncate">
                          {cat.created_At || cat.created_at
                            ? new Date(cat.created_At || cat.created_at).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenCategoryModal(cat)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              title="Edit Category"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat)}
                              className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🌟 4. ADD / EDIT BRAND MODAL */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {editingBrand ? 'Edit Brand' : 'Add New Brand'}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {editingBrand ? 'Update brand details' : 'Register brand with auto-active status'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseBrandModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleBrandSubmit} className="p-6 space-y-4 text-xs">
              {brandFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{brandFormError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">Brand Code</label>
                <div className="relative">
                  <Hash className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. BRD001"
                    value={brandCodeInput}
                    onChange={(e) => setBrandCodeInput(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900 font-mono font-bold transition uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  Brand Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tata, Finolex, Havells, Schneider"
                  value={brandNameInput}
                  onChange={(e) => setBrandNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900 font-medium transition"
                  autoFocus
                />
              </div>

              {!editingBrand && (
                <div className="p-2.5 bg-emerald-50/60 border border-emerald-200/60 rounded-xl text-[11px] text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>New brands will be created as <strong>Active</strong> by default.</span>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseBrandModal}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBrand}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {submittingBrand && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingBrand ? 'Save Changes' : 'Create Brand'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🌟 5. ADD / EDIT CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <FolderTree className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {editingCategory ? 'Update category details' : 'Register category with auto-active status'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseCategoryModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4 text-xs">
              {categoryFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{categoryFormError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">Category Code</label>
                <div className="relative">
                  <Hash className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. CAT001"
                    value={categoryCodeInput}
                    onChange={(e) => setCategoryCodeInput(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-gray-900 font-mono font-bold transition uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Electronics, Hardware, Cables, Sanitary"
                  value={categoryNameInput}
                  onChange={(e) => setCategoryNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-gray-900 font-medium transition"
                  autoFocus
                />
              </div>

              {!editingCategory && (
                <div className="p-2.5 bg-emerald-50/60 border border-emerald-200/60 rounded-xl text-[11px] text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>New categories will be created as <strong>Active</strong> by default.</span>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseCategoryModal}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCategory}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {submittingCategory && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingCategory ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
