import React from "react";
import { Package, Plus, Trash2, CheckCircle2, AlertCircle, Layers } from "lucide-react";

const ProductBOMCard = ({
  product,
  productIndex = 0,
  bomStatus,
  bomItems = [],
  extraItems = [],
  masterItems = [],
  units = [],
  brands = [],
  itemBrands = {},
  onUpdateBOMItem,
  onAddExtraItem,
  onUpdateExtraItem,
  onRemoveExtraItem,
}) => {
  const getBrandsForItem = (item) => {
    const itemNameClean = String(item.item_name || item.itemName || "").trim().toLowerCase();
    const itemIdClean = String(item.item_id || item.id || "").trim();

    const purchased =
      itemBrands[itemIdClean] ||
      itemBrands[itemNameClean] ||
      masterItems.find(
        (m) =>
          String(m.id) === itemIdClean ||
          String(m.item_name || "").trim().toLowerCase() === itemNameClean
      )?.brands ||
      [];

    const brandList = [...purchased];

    // If item already has a saved brand from previously prepared BOM, include it
    if (item.brand && item.brand.trim() && !brandList.includes(item.brand.trim())) {
      brandList.push(item.brand.trim());
    }

    return [...new Set(brandList.filter(Boolean))];
  };

  const isBomFound = bomStatus ? bomStatus.found : bomItems.length > 0;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
      {/* PRODUCT HEADER */}
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50/30 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-sm">
            {productIndex + 1}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                {product.productName || "Product"}
              </h2>
              {product.capacity && (
                <span className="rounded-md bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  {product.capacity}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Ordered Quantity:{" "}
              <span className="font-semibold text-slate-800">
                {product.qty || 1} Nos
              </span>
            </p>
          </div>
        </div>

        {/* STATUS BADGE */}
        <div className="flex items-center gap-2">
          {isBomFound ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200/60">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Standard BOM Found
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200/60">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              No Standard BOM Configured
            </span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 1. STANDARD BOM ITEMS SECTION */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-800">
                Standard BOM / BOQ Items
              </h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {bomItems.length} {bomItems.length === 1 ? "item" : "items"}
              </span>
            </div>
          </div>

          {bomItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50/50 px-4 py-6 text-center text-xs text-amber-800">
              ⚠️ No standard BOM items found for <strong>{product.productName}</strong>. You can add required materials using the extra items section below.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[750px] text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-2.5 text-left w-12">#</th>
                    <th className="px-4 py-2.5 text-left">Item Name</th>
                    <th className="px-4 py-2.5 text-center w-24">Std Qty</th>
                    <th className="px-4 py-2.5 text-left w-20">Unit</th>
                    <th className="px-4 py-2.5 text-center w-24">Calc Qty</th>
                    <th className="px-4 py-2.5 text-left w-48">Brand</th>
                    <th className="px-4 py-2.5 text-left">Remarks</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {bomItems.map((item, index) => {
                    const itemBrandList = getBrandsForItem(item);
                    return (
                      <tr key={item.id ?? index} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-2.5 text-xs text-slate-400 font-mono">
                          {index + 1}
                        </td>

                        <td className="px-4 py-2.5 font-medium text-slate-900">
                          {item.item_name || item.itemName || "—"}
                        </td>

                        <td className="px-4 py-2.5 text-center text-slate-600">
                          {item.standardQty ?? 0}
                        </td>

                        <td className="px-4 py-2.5 text-slate-600 text-xs font-medium">
                          {item.unit || "Nos"}
                        </td>

                        <td className="px-4 py-2.5 text-center">
                          <span className="inline-block min-w-[32px] rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-100">
                            {item.calculatedQty ?? 0}
                          </span>
                        </td>

                        <td className="px-4 py-2.5">
                          <select
                            value={item.brand || ""}
                            onChange={(e) =>
                              onUpdateBOMItem(item.id, "brand", e.target.value)
                            }
                            disabled={itemBrandList.length === 0}
                            className={`w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${
                              itemBrandList.length === 0
                                ? "bg-slate-100/80 text-slate-400 cursor-not-allowed"
                                : "bg-white text-slate-800"
                            }`}
                          >
                            <option value="">
                              {itemBrandList.length === 0
                                ? "-- No Brand Available --"
                                : "-- Select Brand --"}
                            </option>
                            {itemBrandList.map((b) => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-4 py-2.5">
                          <input
                            type="text"
                            value={item.remarks || ""}
                            onChange={(e) =>
                              onUpdateBOMItem(item.id, "remarks", e.target.value)
                            }
                            placeholder="Optional remarks"
                            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 2. EXTRA ITEMS FOR THIS PRODUCT */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/20 p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-indigo-600" />
              <h4 className="text-sm font-semibold text-slate-900">
                Extra / Additional Items for {product.productName}
              </h4>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                {extraItems.length}
              </span>
            </div>

            <button
              type="button"
              onClick={onAddExtraItem}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Extra Item for {product.productName}
            </button>
          </div>

          {extraItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-indigo-200 bg-white/70 px-4 py-5 text-center text-xs text-slate-500">
              No extra items added for <strong>{product.productName}</strong>. Click{" "}
              <button
                type="button"
                onClick={onAddExtraItem}
                className="font-medium text-indigo-600 hover:underline"
              >
                + Add Extra Item
              </button>{" "}
              if additional materials are required.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-indigo-200/80 bg-white">
              <table className="w-full min-w-[750px] text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Select Item</th>
                    <th className="px-4 py-2.5 text-left w-28">Quantity</th>
                    <th className="px-4 py-2.5 text-left w-20">Unit</th>
                    <th className="px-4 py-2.5 text-left w-48">Brand</th>
                    <th className="px-4 py-2.5 text-left">Remarks</th>
                    <th className="px-4 py-2.5 text-center w-16">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {extraItems.map((extra) => {
                    const itemBrandList = getBrandsForItem(extra);
                    return (
                      <tr key={extra.tempId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-2.5">
                          <select
                            value={extra.item_id || ""}
                            onChange={(e) =>
                              onUpdateExtraItem(extra.tempId, "item_id", e.target.value)
                            }
                            className="w-full min-w-[200px] rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="">-- Select Material / Item --</option>
                            {masterItems.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.item_name}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-4 py-2.5">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={extra.quantity}
                            onChange={(e) =>
                              onUpdateExtraItem(extra.tempId, "quantity", e.target.value)
                            }
                            placeholder="Qty"
                            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>

                        <td className="px-4 py-2.5">
                          <span className="inline-block rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                            {extra.unit || "Nos"}
                          </span>
                        </td>

                        <td className="px-4 py-2.5">
                          <select
                            value={extra.brand || ""}
                            onChange={(e) =>
                              onUpdateExtraItem(extra.tempId, "brand", e.target.value)
                            }
                            disabled={!extra.item_id || itemBrandList.length === 0}
                            className={`w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${
                              !extra.item_id || itemBrandList.length === 0
                                ? "bg-slate-100/80 text-slate-400 cursor-not-allowed"
                                : "bg-white text-slate-800"
                            }`}
                          >
                            <option value="">
                              {!extra.item_id
                                ? "-- Select Item First --"
                                : itemBrandList.length === 0
                                ? "-- No Brand Available --"
                                : "-- Select Brand --"}
                            </option>
                            {itemBrandList.map((b) => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-4 py-2.5">
                          <input
                            type="text"
                            value={extra.remarks || ""}
                            onChange={(e) =>
                              onUpdateExtraItem(extra.tempId, "remarks", e.target.value)
                            }
                            placeholder="Optional remarks"
                            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>

                        <td className="px-4 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => onRemoveExtraItem(extra.tempId)}
                            title="Remove Extra Item"
                            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductBOMCard;
