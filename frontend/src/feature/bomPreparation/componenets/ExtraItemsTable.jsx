import React from "react";
import { Plus, Trash2 } from "lucide-react";

const ExtraItemsTable = ({
  extraItems,
  orderProducts = [],
  items,
  units,
  brands = [],
  itemBrands = {},
  onAdd,
  onUpdate,
  onRemove,
}) => {
  // Helper to get purchased brands for an extra item
  const getBrandsForItem = (extra) => {
    let brandList = [];

    // Check item matching extra.item_id
    if (extra.item_id) {
      const matched = items.find((m) => String(m.id) === String(extra.item_id));
      if (matched?.item_name) {
        const key = String(matched.item_name).trim().toLowerCase();
        if (itemBrands[key]) {
          brandList.push(...itemBrands[key]);
        }
      }
      if (matched?.brands && Array.isArray(matched.brands)) {
        matched.brands.forEach((b) => {
          if (b && !brandList.includes(b)) brandList.push(b);
        });
      }
      if (matched?.brand && !brandList.includes(matched.brand)) {
        brandList.push(matched.brand);
      }
    }

    // Check item matching extra.item_name
    if (extra.item_name) {
      const key = String(extra.item_name).trim().toLowerCase();
      if (itemBrands[key]) {
        itemBrands[key].forEach((b) => {
          if (b && !brandList.includes(b)) brandList.push(b);
        });
      }
    }

    // If item already has a brand that's not in the purchased list, include it
    if (extra.brand && extra.brand.trim() && !brandList.includes(extra.brand.trim())) {
      brandList.push(extra.brand.trim());
    }

    return [...new Set(brandList.filter(Boolean))];
  };
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">
            Extra Items
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Add items that are not part of the standard BOM and associate them with a product.
          </p>
        </div>

        <button
          onClick={onAdd}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Plus className="h-4 w-4" />
          Add Extra Item
        </button>
      </div>

      {extraItems.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-500">
          No extra items added.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-header">Product</th>
                <th className="table-header">Item</th>
                <th className="table-header">Quantity</th>
                <th className="table-header">Unit</th>
                <th className="table-header">Brand</th>
                <th className="table-header">Remarks</th>
                <th className="table-header text-center">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {extraItems.map((extra) => (
                <tr key={extra.tempId}>
                  <td className="table-cell">
                    {orderProducts && orderProducts.length > 1 ? (
                      <select
                        value={extra.product_name || ""}
                        onChange={(e) =>
                          onUpdate(
                            extra.tempId,
                            "product_name",
                            e.target.value
                          )
                        }
                        className="input-select min-w-[160px] font-medium text-indigo-700 bg-indigo-50/60"
                      >
                        {orderProducts.map((p, idx) => (
                          <option key={idx} value={p.productName}>
                            {p.productName}
                          </option>
                        ))}
                        <option value="General / Site Extra">
                          General / Site Extra
                        </option>
                      </select>
                    ) : (
                      <span className="inline-block rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                        {extra.product_name || orderProducts?.[0]?.productName || "General / Site Extra"}
                      </span>
                    )}
                  </td>

                  <td className="table-cell">
                    <select
                      value={extra.item_id}
                      onChange={(e) =>
                        onUpdate(
                          extra.tempId,
                          "item_id",
                          e.target.value
                        )
                      }
                      className="input-select min-w-[200px]"
                    >
                      <option value="">
                        Select Item
                      </option>

                      {items.map((item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.item_name}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="table-cell">
                    <input
                      type="number"
                      min="0"
                      value={extra.quantity}
                      onChange={(e) =>
                        onUpdate(
                          extra.tempId,
                          "quantity",
                          e.target.value
                        )
                      }
                      className="input-number"
                      placeholder="Qty"
                    />
                  </td>

                  <td className="table-cell">
                    <span className="inline-block rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {extra.unit || "Nos"}
                    </span>
                  </td>

                  <td className="table-cell">
                    {(() => {
                      const itemBrandList = getBrandsForItem(extra);
                      return (
                        <select
                          value={extra.brand || ""}
                          onChange={(e) =>
                            onUpdate(
                              extra.tempId,
                              "brand",
                              e.target.value
                            )
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
                      value={extra.remarks}
                      onChange={(e) =>
                        onUpdate(
                          extra.tempId,
                          "remarks",
                          e.target.value
                        )
                      }
                      className="input-text"
                      placeholder="Optional"
                    />
                  </td>

                  <td className="table-cell text-center">
                    <button
                      onClick={() =>
                        onRemove(extra.tempId)
                      }
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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

export default ExtraItemsTable;
