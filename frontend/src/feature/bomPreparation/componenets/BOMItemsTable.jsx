import React from "react";

const BOMItemsTable = ({
  items,
  units,
  brands = [],
  itemBrands = {},
  masterItems = [],
  onUpdate,
  bomStatusList = [],
}) => {
  // Check if items span multiple products
  const productNames = [...new Set(items.map((i) => i.product_name).filter(Boolean))];
  const showProductCol = productNames.length > 1;

  // Helper to get purchased brands for a specific item
  const getBrandsForItem = (item) => {
    const itemNameClean = String(item.item_name || item.itemName || "").trim().toLowerCase();
    const itemIdClean = String(item.item_id || item.id || "").trim();

    const purchased =
      itemBrands[itemIdClean] ||
      itemBrands[itemNameClean] ||
      masterItems.find((m) => String(m.id) === itemIdClean || String(m.item_name || "").trim().toLowerCase() === itemNameClean)?.brands ||
      [];

    const brandList = [...purchased];

    // If item already has a saved brand from previous preparation, include it
    if (item.brand && item.brand.trim() && !brandList.includes(item.brand.trim())) {
      brandList.push(item.brand.trim());
    }

    return [...new Set(brandList.filter(Boolean))];
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="font-semibold text-slate-900">BOM / BOQ Items</h2>
        <p className="mt-1 text-sm text-slate-500">
          Review quantities and brands from the standard BOM.
        </p>

        {/* BOM status chips */}
        {bomStatusList.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {bomStatusList.map((b, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                  b.found
                    ? "bg-green-50 text-green-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {b.found ? "✓" : "⚠"} {b.productName}
                {b.capacity ? ` (${b.capacity})` : ""}
                {!b.found && " — no BOM"}
              </span>
            ))}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-500">
          No BOM items found. Use "Extra Items" below to add materials manually.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-header">#</th>
                {showProductCol && (
                  <th className="table-header">Product</th>
                )}
                <th className="table-header">Item</th>
                <th className="table-header text-center">Std Qty</th>
                <th className="table-header">Unit</th>
                <th className="table-header text-center">Calc Qty</th>
                <th className="table-header">Brand</th>
                <th className="table-header">Remarks</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {items.map((item, index) => (
                <tr key={item.id ?? index} className="hover:bg-slate-50">
                  <td className="table-cell">{index + 1}</td>

                  {showProductCol && (
                    <td className="table-cell">
                      <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        {item.product_name || "—"}
                      </span>
                    </td>
                  )}

                  <td className="table-cell font-medium text-slate-900">
                    {item.item_name || item.itemName || "—"}
                  </td>

                  <td className="table-cell text-center">
                    {item.standardQty ?? 0}
                  </td>

                  <td className="table-cell">
                    <span className="text-slate-600">{item.unit || "—"}</span>
                  </td>

                  <td className="table-cell text-center">
                    <span className="rounded-md bg-blue-50 px-3 py-1 font-semibold text-blue-700">
                      {item.calculatedQty ?? 0}
                    </span>
                  </td>

                  <td className="table-cell">
                    {(() => {
                      const itemBrandList = getBrandsForItem(item);
                      return (
                        <select
                          value={item.brand || ""}
                          onChange={(e) =>
                            onUpdate(item.id, "brand", e.target.value)
                          }
                          className="input-select min-w-[130px]"
                        >
                          <option value="">-- Select Brand --</option>
                          {itemBrandList.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      );
                    })()}
                  </td>

                  <td className="table-cell">
                    <input
                      type="text"
                      value={item.remarks || ""}
                      onChange={(e) =>
                        onUpdate(item.id, "remarks", e.target.value)
                      }
                      placeholder="Optional"
                      className="input-text"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BOMItemsTable;