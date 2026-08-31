import React, { useState } from "react";

import BOMPreparationHeader from "../componenets/BOMPreparationHeader";
import ConfirmedOrdersTable from "../componenets/ConfirmedOrdersTable";
import SalesOrderInfo from "../componenets/SalesOrderInfo";
import ProductBOMCard from "../componenets/ProductBOMCard";
import PreparationSummary from "../componenets/PreparationSummary";
import ViewBOMPreparationModal from "../componenets/ViewBOMPreparationModal";
import { exportBOMDetailReport } from "../../../utils/exportReport";

import useBOMPreparation from "../hooks/useBOMPreparation";

const BOMPreparationPage = () => {
  const {
    confirmedOrders,
    selectedOrder,
    selectSalesOrder,
    orderProducts,

    bomItems,
    updateBOMItem,
    bomStatusList,

    extraItems,
    addExtraItem,
    updateExtraItem,
    removeExtraItem,

    units,
    brands,
    items,
    itemBrands,

    saveDraft,
    submitPreparation,

    loading,
    bomLoading,
    saving,
    error,
    warning,
  } = useBOMPreparation();

  const [showOrders, setShowOrders] = useState(true);
  const [viewOrder, setViewOrder] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const handlePrepare = async (order) => {
    setShowOrders(false);
    await selectSalesOrder(order);
  };

  const handleEdit = async (order) => {
    setShowOrders(false);
    await selectSalesOrder(order);
  };

  const handleView = (order) => {
    setViewOrder(order);
    setIsViewModalOpen(true);
  };

  const handleBack = () => {
    setShowOrders(true);
  };

  const handleSaveDraft = async () => {
    const success = await saveDraft();

    if (success) {
      alert("BOM / BOQ saved as draft.");
      setShowOrders(true);
    }
  };

  const handleSubmit = async () => {
    const success = await submitPreparation();

    if (success) {
      alert("BOM / BOQ submitted successfully.");
      setShowOrders(true);
    }
  };

  // Helper to filter standard BOM items for a specific product
  const getProductBOMItems = (product) => {
    if (
      orderProducts.length <= 1 &&
      bomItems.length > 0 &&
      !bomItems.some(
        (it) => it.product_name && it.product_name !== product.productName
      )
    ) {
      return bomItems;
    }
    const cleanProdName = (product.productName || "").trim().toLowerCase();
    return bomItems.filter((it) => {
      const itProdName = (it.product_name || "").trim().toLowerCase();
      return (
        itProdName === cleanProdName ||
        (product.productId && it.product_id === product.productId)
      );
    });
  };

  // Helper to filter extra items for a specific product
  const getProductExtraItems = (product) => {
    const cleanProdName = (product.productName || "").trim().toLowerCase();
    return extraItems.filter((it) => {
      const itProdName = (it.product_name || "").trim().toLowerCase();
      return (
        itProdName === cleanProdName ||
        (product.productId && it.product_id === product.productId)
      );
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <BOMPreparationHeader
          onBack={!showOrders ? handleBack : null}
        />

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {warning && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            ⚠️ {warning}
          </div>
        )}

        {/* STEP 1: Confirmed Orders List */}
        {showOrders && (
          <ConfirmedOrdersTable
            orders={confirmedOrders}
            onPrepare={handlePrepare}
            onEdit={handleEdit}
            onView={handleView}
            loading={loading}
          />
        )}

        {/* View BOM Modal */}
        <ViewBOMPreparationModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          order={viewOrder}
          onEdit={(ord) => {
            setIsViewModalOpen(false);
            handleEdit(ord);
          }}
        />

        {/* STEP 2: Selected Order BOM Preparation */}
        {!showOrders && selectedOrder && (
          <>
            <SalesOrderInfo order={selectedOrder} />

            {bomLoading ? (
              <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500 shadow-sm">
                ⏳ Fetching standard BOM from database…
              </div>
            ) : (
              <>
                {/* PRODUCT-WISE BOM & EXTRA ITEMS SECTIONS */}
                <div className="space-y-6">
                  {orderProducts.map((product, idx) => {
                    const prodBomItems = getProductBOMItems(product);
                    const prodExtraItems = getProductExtraItems(product);
                    const status = (bomStatusList || []).find(
                      (b) =>
                        b.productName?.trim().toLowerCase() ===
                        product.productName?.trim().toLowerCase()
                    );

                    return (
                      <ProductBOMCard
                        key={product.productId || idx}
                        product={product}
                        productIndex={idx}
                        bomStatus={status}
                        bomItems={prodBomItems}
                        extraItems={prodExtraItems}
                        masterItems={items}
                        units={units}
                        brands={brands}
                        itemBrands={itemBrands}
                        onUpdateBOMItem={updateBOMItem}
                        onAddExtraItem={() => addExtraItem(product)}
                        onUpdateExtraItem={updateExtraItem}
                        onRemoveExtraItem={removeExtraItem}
                      />
                    );
                  })}
                </div>

                {/* STEP 5: SAVE & SUBMIT */}
                <PreparationSummary
                  onSaveDraft={handleSaveDraft}
                  onSubmit={handleSubmit}
                  onDownloadReport={() =>
                    exportBOMDetailReport(selectedOrder, bomItems, extraItems)
                  }
                  saving={saving}
                />
              </>
            )}
          </>
        )}
      </div>

      <style>{`
        .table-header {
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          white-space: nowrap;
        }

        .table-cell {
          padding: 14px 16px;
          font-size: 13px;
          color: #475569;
          white-space: nowrap;
        }

        .input-select {
          min-width: 130px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: white;
          padding: 8px 10px;
          font-size: 13px;
          outline: none;
        }

        .input-select:focus,
        .input-number:focus,
        .input-text:focus {
          border-color: #64748b;
          box-shadow: 0 0 0 2px #f1f5f9;
          outline: none;
        }

        .input-number {
          width: 110px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 13px;
        }

        .input-text {
          min-width: 180px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
};

export default BOMPreparationPage;