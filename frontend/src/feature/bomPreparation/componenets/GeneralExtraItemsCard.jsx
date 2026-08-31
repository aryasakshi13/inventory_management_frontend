import React from "react";
import { Plus, Trash2, Wrench } from "lucide-react";

const GeneralExtraItemsCard = ({
  extraItems = [],
  masterItems = [],
  units = [],
  brands = [],
  itemBrands = {},
  onAddGeneralExtra,
  onUpdateExtraItem,
  onRemoveExtraItem,
}) => {
  const getBrandsForItem = (extra) => {
    const itemNameClean = String(extra.item_name || extra.itemName || "").trim().toLowerCase();
    const itemIdClean = String(extra.item_id || "").trim();

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

    if (extra.brand && extra.brand.trim() && !brandList.includes(extra.brand.trim())) {
      brandList.push(extra.brand.trim());
    }

    if (brandList.length === 0 && Array.isArray(brands) && brands.length > 0) {
      brands.forEach((b) => {
        const bName = typeof b === "string" ? b : b.brand_name || b.name;
        if (bName && !brandList.includes(String(bName).trim())) {
          brandList.push(String(bName).trim());
        }
      });
    }

    return [...new Set(brandList.filter(Boolean))];
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-amber-50/20 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-white shadow-sm">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              General / Site-Wide Extra Materials
            </h3>
            <p className="text-xs text-slate-500">
              Additional materials not tied to a specific product (e.g. tools, safety gear, general civil supplies).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddGeneralExtra}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
        >
          <Plus className="h-4 w-4" />
          Add Site Extra Item
        </button>
      </div>

      <div className="p-6">
        {extraItems.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-xs text-slate-500">
            No general site items added. If you need miscellaneous site items, click{" "}
            <button
              type="button"
              onClick={onAddGeneralExtra}
              className="font-semibold text-slate-800 hover:underline"
            >
              + Add Site Extra Item
            </button>
            .
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
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
                          className="w-full min-w-[200px] rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
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
                          className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
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
                          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                        >
                          <option value="">-- Select Brand --</option>
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
                          className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
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
  );
};

export default GeneralExtraItemsCard;
