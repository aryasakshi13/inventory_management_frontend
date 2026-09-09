import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Package,
  Plus,
  Search,
  Truck,
  Factory,
  CheckCircle,
  X,
  Edit2,
  Trash2,
  Loader2,
  Layers,
  Info,
  AlertCircle
} from "lucide-react";
import { Pagination } from "../../components/common/pagination";

const getBaseUrl = () => {
  return window.location.hostname === 'localhost'
    ? 'http://localhost:5001/api/products'
    : 'https://www.namami-infotech.com/inventory/api/products';
};

const API_BASE = getBaseUrl();

const ProductTab = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    product_name: "",
    description: "",
    fulfilment_mode: "site_assembly", // 'site_assembly' | 'in_house_manufacturing'
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_BASE);
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : [];
      setProducts(list);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      product_name: "",
      description: "",
      fulfilment_mode: "site_assembly",
    });
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      product_name: product.product_name || "",
      description: product.description || "",
      fulfilment_mode: product.fulfilment_mode || "site_assembly",
    });
    setFormError("");
    setShowModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.product_name.trim()) {
      setFormError("Product name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError("");

      if (editingProduct) {
        await axios.put(`${API_BASE}/${editingProduct.id}`, formData);
      } else {
        await axios.post(`${API_BASE}/add`, formData);
      }  

      await fetchProducts();
      setShowModal(false);
    } catch (err) {
      console.error("Failed to save product:", err);
      setFormError(err.response?.data?.message || "Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete product "${name}"?`)) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/${id}`);
      await fetchProducts();
    } catch (err) {
      console.error("Failed to delete product:", err);
      alert(err.response?.data?.message || "Failed to delete product");
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      (p.product_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMode =
      filterMode === "all" ||
      (p.fulfilment_mode || "site_assembly") === filterMode;

    return matchesSearch && matchesMode;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterMode, products.length]);

  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4">
      {/* 🌟 1. PAGE TABS - BOM / BOQ Style */}
      <div className="bg-white border border-slate-200 px-4 sm:px-6 pt-3 sm:pt-4 rounded-xl shadow-xs">
        <div className="flex gap-4 sm:gap-8 overflow-x-auto">
          {/* TAB 1: ALL PRODUCTS */}
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              filterMode === "all"
                ? "text-blue-600 border-blue-600 font-semibold"
                : "text-slate-500 border-transparent hover:text-slate-800"
            }`}
          >
            <span>All Products</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                filterMode === "all" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              {products.length}
            </span>
          </button>

          {/* TAB 2: SITE ASSEMBLY */}
          <button
            type="button"
            onClick={() => setFilterMode("site_assembly")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              filterMode === "site_assembly"
                ? "text-blue-600 border-blue-600 font-semibold"
                : "text-slate-500 border-transparent hover:text-slate-800"
            }`}
          >
            <span>Site Assembly / Direct Dispatch</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                filterMode === "site_assembly" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              {products.filter((p) => (p.fulfilment_mode || "site_assembly") === "site_assembly").length}
            </span>
          </button>

          {/* TAB 3: IN-HOUSE MANUFACTURING */}
          <button
            type="button"
            onClick={() => setFilterMode("in_house_manufacturing")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              filterMode === "in_house_manufacturing"
                ? "text-blue-600 border-blue-600 font-semibold"
                : "text-slate-500 border-transparent hover:text-slate-800"
            }`}
          >
            <span>In-House Manufacturing</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                filterMode === "in_house_manufacturing" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              {products.filter((p) => p.fulfilment_mode === "in_house_manufacturing").length}
            </span>
          </button>
        </div>
      </div>

      {/* 🌟 2. SEARCH & ACTION BUTTON ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Search products by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus size={15} />
          Create New Product
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="animate-spin text-blue-600 mb-2" size={28} />
            <p className="text-xs">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Package className="mx-auto mb-2 text-slate-300" size={36} />
            <p className="text-sm font-semibold text-slate-700">No products found</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchTerm || filterMode !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first product"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Fulfilment Mode</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedProducts.map((p, idx) => {
                  const isMfg = p.fulfilment_mode === "in_house_manufacturing";
                  const displayIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <tr key={p.id || idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-medium">{displayIndex}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-md bg-slate-100 text-slate-700">
                            <Package size={14} />
                          </span>
                          {p.product_name}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {isMfg ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Factory size={12} />
                            In-House Manufacturing
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Truck size={12} />
                            Site Assembly / Direct Dispatch
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {p.description || "-"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.product_name)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
          />
        )}
      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 text-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="text-blue-600" size={20} />
                <h2 className="text-base font-bold text-slate-900">
                  {editingProduct ? "Edit Product" : "Create New Product"}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  placeholder="e.g. 5kW On-Grid Solar System, Solar Inverter 5kVA, Laptop Pro"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Fulfilment Mode Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Fulfilment Mode *
                </label>
                <select
                  value={formData.fulfilment_mode}
                  onChange={(e) => setFormData({ ...formData, fulfilment_mode: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white font-semibold text-slate-900 cursor-pointer"
                >
                  <option value="site_assembly">Site Assembly</option>
                  <option value="in_house_manufacturing">In-House Manufacturing</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Description / Specifications (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter product description, technical specifications, or usage notes..."
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Saving...
                    </>
                  ) : editingProduct ? (
                    "Update Product"
                  ) : (
                    "Create Product"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductTab;