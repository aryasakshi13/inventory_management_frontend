import React, { useMemo, useState } from "react";
import { Download } from "lucide-react";
// import { useNavigate, useLocation } from "react-router-dom";

import useBOM from "../hooks/useBOM";
import { getBOMById, createProduct } from "../service/bomService";
import { exportBOMMasterReport, exportToExcel } from "../../../utils/exportReport";

import BOMFilter from "../componenets/BOMFilter";
import BOMTable from "../componenets/BOMTable";
import BOMForm from "../componenets/BOMForm";

const BOMManagementPage = () => {

    const {
        boms,
        products,
        items,
        loading,
        formLoading,
        loadProducts,
        handleCreateBOM,
        handleUpdateBOM,
        handleDeleteBOM
    } = useBOM();

    const [showProductModal, setShowProductModal] = useState(false);
    const [newProductName, setNewProductName] = useState("");
    const [newProductDescription, setNewProductDescription] = useState("");
    const [creatingProduct, setCreatingProduct] = useState(false);
    const [productError, setProductError] = useState("");

    const handleExportSingleBOM = (bom) => {
        if (!bom) return;
        const bItems = Array.isArray(bom.items) ? bom.items : [];
        const exportData = bItems.map((it, idx) => ({
            "S.No": idx + 1,
            "Product Name": bom.product_name || bom.productName || "—",
            "Item Name": it.item_name || it.name || it.itemName || "Unknown Item",
            "Quantity": it.quantity ?? it.qty ?? it.total_quantity ?? 0,
            "UOM": it.unit || it.uom || "Nos",
        }));
        const pName = (bom.product_name || bom.productName || "BOM").replace(/[^a-zA-Z0-9_-]/g, "_");
        exportToExcel(exportData, `BOM_${pName}`, "BOM Items");
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        if (!newProductName.trim()) {
            setProductError("Product name is required.");
            return;
        }

        try {
            setCreatingProduct(true);
            setProductError("");
            const res = await createProduct({
                product_name: newProductName.trim(),
                description: newProductDescription.trim()
            });
            if (res && (res.success || res.data)) {
                await loadProducts();
                setShowProductModal(false);
                setNewProductName("");
                setNewProductDescription("");
                alert("Product created successfully!");
            } else {
                setProductError(res?.message || "Failed to create product.");
            }
        } catch (err) {
            console.error("Create product error:", err);
            setProductError(err.response?.data?.message || "Failed to create product.");
        } finally {
            setCreatingProduct(false);
        }
    };

    const [showForm, setShowForm] =
        useState(false);

    const [selectedBOM, setSelectedBOM] =
        useState(null);

    const [selectedBomForView, setSelectedBomForView] =
        useState(null);

    const [isViewModalOpen, setIsViewModalOpen] =
        useState(false);

    const [filters, setFilters] = useState({
        productId: ""
    });

    // =====================================================
    // FILTER CHANGE
    // =====================================================

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // =====================================================
    // CLEAR FILTER
    // =====================================================

    const clearFilters = () => {
        setFilters({
            productId: ""
        });
    };

    // =====================================================
    // PRODUCTS TABLE DATA (MAPPED WITH BOM STATUS)
    // =====================================================

    const productTableData = useMemo(() => {
        return products
            .filter((p) => {
                if (!filters.productId) return true;
                return String(p.id) === String(filters.productId);
            })
            .map((prod) => {
                const matchedBom = boms.find((b) => Number(b.product_id) === Number(prod.id));
                return {
                    id: prod.id,
                    product_id: prod.id,
                    product_name: prod.product_name,
                    description: prod.description || matchedBom?.description || "",
                    bom: matchedBom || null,
                    hasBOM: Boolean(matchedBom)
                };
            });
    }, [products, boms, filters]);

    // =====================================================
    // CREATE
    // =====================================================

    const handleCreate = () => {
        setSelectedBOM(null);
        setShowForm(true);
    };

    // =====================================================
    // EDIT / CREATE FOR PRODUCT
    // =====================================================

    const handleEdit = async (bom, productId) => {
        if (!bom && productId) {
            // Open form to create BOM for this specific product
            setSelectedBOM({ product_id: productId });
            setShowForm(true);
            return;
        }

        if (bom?.id) {
            try {
                const response = await getBOMById(bom.id);
                if (response.success) {
                    setSelectedBOM(response.data);
                    setShowForm(true);
                }
            } catch (error) {
                console.error("Failed to load BOM:", error);
                setSelectedBOM(bom);
                setShowForm(true);
            }
        }
    };

    // =====================================================
    // VIEW
    // =====================================================

    const handleView = async (bom) => {
        if (!bom) return;

        try {
            const response = await getBOMById(bom.id);
            const bomDetails = response?.data || bom;

            setSelectedBomForView({
                ...bomDetails,
                product_name: bomDetails.product_name || bom.product_name || "—",
                capacity: bomDetails.capacity || bom.capacity || "—",
                description: bomDetails.description || bom.description || "No description available.",
                items: Array.isArray(bomDetails.items)
                    ? bomDetails.items
                    : Array.isArray(bom.items)
                    ? bom.items
                    : []
            });
            setIsViewModalOpen(true);
        } catch (error) {
            console.error("Failed to load BOM details:", error);
            setSelectedBomForView({
                ...bom,
                description: bom.description || "No description available.",
                items: Array.isArray(bom.items) ? bom.items : []
            });
            setIsViewModalOpen(true);
        }
    };

    // =====================================================
    // DELETE
    // =====================================================

    const handleDelete = async (id) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this BOM?"
            );

        if (!confirmed) {
            return;
        }

        try {

            const response =
                await handleDeleteBOM(id);

            if (!response.success) {

                alert(
                    response.message ||
                    "Failed to delete BOM."
                );
            }

        } catch (error) {

            console.error(
                "Delete BOM error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to delete BOM."
            );
        }
    };

    // =====================================================
    // FORM SCREEN
    // =====================================================

    if (showForm) {

        return (

            <div className="space-y-4">

                <BOMForm
                    bom={selectedBOM}
                    products={products}
                    items={items}
                    loading={formLoading}
                    onCreate={handleCreateBOM}
                    onUpdate={handleUpdateBOM}
                    onClose={() => {
                        setShowForm(false);
                        setSelectedBOM(null);
                    }}
                />

            </div>
        );
    }

    // =====================================================
    // MAIN PAGE
    // =====================================================

    return (

        <div className="space-y-4">

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap justify-end items-center gap-2 sm:gap-3">
                <button
                    type="button"
                    onClick={() => exportBOMMasterReport(boms)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs sm:text-sm shadow-xs transition cursor-pointer"
                >
                    <Download size={15} /> Export Report
                </button>

                <button
                    type="button"
                    onClick={handleCreate}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs sm:text-sm shadow-xs transition cursor-pointer"
                >
                    + Create BOM
                </button>
            </div>

            {/* FILTER */}
            <BOMFilter
                filters={filters}
                products={products}
                onFilterChange={handleFilterChange}
                onClear={clearFilters}
            />

            {/* TABLE */}
            <BOMTable
                products={productTableData}
                loading={loading}
                onEdit={handleEdit}
                onView={handleView}
                onDelete={handleDelete}
            />

            {isViewModalOpen && selectedBomForView && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-5 py-4 shrink-0">
                            <h3 className="text-sm font-bold uppercase tracking-wide text-white">
                                BOM / BOQ Details
                            </h3>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleExportSingleBOM(selectedBomForView)}
                                    className="flex items-center gap-1 rounded-lg border border-emerald-600 bg-emerald-600 px-2.5 py-1 text-xs text-white hover:bg-emerald-700 transition"
                                >
                                    <Download size={13} /> Export Excel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsViewModalOpen(false);
                                        setSelectedBomForView(null);
                                    }}
                                    className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-700 transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Product Name</p>
                                <p className="mt-1 text-base font-bold text-slate-900">
                                    {selectedBomForView.product_name || selectedBomForView.productName || "—"}
                                </p>
                            </div>

                            {/* Item Name, Quantity & UOM Table (Always shown, scrollable on overflow) */}
                            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wide text-slate-800">
                                        Item Name & Quantity
                                    </span>
                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 font-mono">
                                        {Array.isArray(selectedBomForView.items) ? selectedBomForView.items.length : 0} items
                                    </span>
                                </div>

                                {Array.isArray(selectedBomForView.items) && selectedBomForView.items.length > 0 ? (
                                    <div className="overflow-x-auto max-h-72 overflow-y-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-3.5 py-2.5 w-10 text-center">#</th>
                                                    <th className="px-3.5 py-2.5">Item Name</th>
                                                    <th className="px-3.5 py-2.5 text-center">UOM</th>
                                                    <th className="px-3.5 py-2.5 text-center">Quantity</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                {selectedBomForView.items.map((bomItem, index) => {
                                                    const itemId = bomItem.item_id ?? bomItem.itemId ?? bomItem.id ?? bomItem.ItemId;
                                                    const itemName = bomItem.item_name || bomItem.name || bomItem.itemName || "Unknown Item";
                                                    const quantity = bomItem.quantity ?? bomItem.qty ?? bomItem.total_quantity ?? 0;
                                                    const unit = bomItem.unit || bomItem.uom || "Nos";

                                                    return (
                                                        <tr key={`${itemId ?? "item"}-${index}`} className="hover:bg-blue-50/40 transition-colors">
                                                            <td className="px-3.5 py-2.5 text-center text-slate-400 font-mono">{index + 1}</td>
                                                            <td className="px-3.5 py-2.5 font-semibold text-slate-900">{itemName}</td>
                                                            <td className="px-3.5 py-2.5 text-center font-medium text-slate-700">{unit}</td>
                                                            <td className="px-3.5 py-2.5 text-center font-bold text-blue-700 font-mono">{quantity}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="p-6 text-center text-xs text-slate-500">
                                        No items added for this BOM.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Small Create Product Modal */}
            {showProductModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl p-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h2 className="text-sm font-bold text-slate-900">
                                Create New Product
                            </h2>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowProductModal(false);
                                    setNewProductName("");
                                    setNewProductDescription("");
                                    setProductError("");
                                }}
                                className="text-slate-400 hover:text-slate-600 text-base font-bold p-1 rounded-lg hover:bg-slate-100"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveProduct} className="space-y-3 pt-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Product Name *
                                </label>
                                <input
                                    type="text"
                                    autoFocus
                                    value={newProductName}
                                    onChange={(e) => {
                                        setNewProductName(e.target.value);
                                        if (productError) setProductError("");
                                    }}
                                    placeholder="Enter product name (e.g. Solar Inverter)"
                                    className="w-full text-black border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                                />
                                {productError && (
                                    <p className="text-[11px] text-rose-600 font-medium mt-1">
                                        {productError}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    rows={3}
                                    value={newProductDescription}
                                    onChange={(e) => setNewProductDescription(e.target.value)}
                                    placeholder="Enter product description (optional)"
                                    className="w-full text-black border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowProductModal(false);
                                        setNewProductName("");
                                        setNewProductDescription("");
                                        setProductError("");
                                    }}
                                    className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 text-xs font-medium hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingProduct}
                                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 shadow-xs"
                                >
                                    {creatingProduct ? "Saving..." : "Save Product"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default BOMManagementPage;