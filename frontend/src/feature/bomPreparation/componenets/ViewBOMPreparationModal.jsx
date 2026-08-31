import React, { useState, useMemo } from "react";
import { X, Edit3, CheckCircle2, Package, Layers, ChevronDown, ChevronRight, ChevronsUpDown, Download } from "lucide-react";
import { exportBOMDetailReport } from "../../../utils/exportReport";

export const ViewBOMPreparationModal = ({
  isOpen,
  onClose,
  order,
  onEdit,
}) => {
  const [expandedProducts, setExpandedProducts] = useState({});

  const preparation = order?.preparation || {};
  const items = useMemo(() => {
    return Array.isArray(preparation.items) ? preparation.items : [];
  }, [preparation.items]);

  // Categorize or count items
  const isItemExtra = (i) => Boolean(i.is_extra || i.is_additional || String(i.is_extra) === "1");

  const standardItems = useMemo(() => {
    return items.filter((i) => !isItemExtra(i));
  }, [items]);

  const extraItems = useMemo(() => {
    return items.filter((i) => isItemExtra(i));
  }, [items]);

  const formatOrderDate = (dateVal) => {
    if (!dateVal) return "—";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal).split("T")[0];
      return d.toLocaleDateString("en-IN");
    } catch {
      return String(dateVal).split("T")[0] || "—";
    }
  };

  const getProductDisplayName = (item) => {
    if (item?.product_name && item.product_name !== "—" && item.product_name !== "Extra Item" && !item.product_name.includes(",")) {
      return item.product_name;
    }
    if (Array.isArray(order?.items) && order.items.length === 1) {
      return order.items[0].productName || order.items[0].itemName;
    }
    if (order?.product_name && !order.product_name.includes(",")) {
      return order.product_name;
    }
    if (Array.isArray(order?.items) && order.items.length > 0) {
      return order.items[0].productName || order.items[0].itemName;
    }
    return item?.product_name || "Solar System";
  };

  // Group items by product
  const groupedProducts = useMemo(() => {
    if (!items.length) return [];
    const map = {};
    items.forEach((item) => {
      const prodName = getProductDisplayName(item);
      if (!map[prodName]) {
        map[prodName] = {
          productName: prodName,
          items: [],
          standardCount: 0,
          extraCount: 0,
        };
      }
      const isExtra = isItemExtra(item);
      if (isExtra) {
        map[prodName].extraCount += 1;
      } else {
        map[prodName].standardCount += 1;
      }
      map[prodName].items.push(item);
    });
    return Object.values(map);
  }, [items, order]);

  const toggleProduct = (prodName) => {
    setExpandedProducts((prev) => ({
      ...prev,
      [prodName]: !prev[prodName],
    }));
  };

  const toggleAll = () => {
    const allExpanded = groupedProducts.every(
      (g) => Boolean(expandedProducts[g.productName])
    );
    const newState = {};
    groupedProducts.forEach((g) => {
      newState[g.productName] = !allExpanded;
    });
    setExpandedProducts(newState);
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Prepared BOM / BOQ Details
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={12} /> Confirmed
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Sales Order: <span className="font-semibold text-slate-800">{order.sales_order_no || order.id}</span> | Client: <span className="font-semibold text-slate-800">{order.client_name || "—"}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Sales Order Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Sales Order No.</p>
              <p className="font-bold text-slate-900 text-xs mt-0.5">{order.sales_order_no || order.id}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">Client</p>
              <p className="font-semibold text-slate-900 text-xs mt-0.5">{order.client_name || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">Order Date</p>
              <p className="font-semibold text-slate-900 text-xs mt-0.5">{formatOrderDate(order.order_date)}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">Shipping Address</p>
              <p className="font-medium text-slate-800 text-xs mt-0.5 truncate" title={order.shippingAddress || "—"}>
                {order.shippingAddress || "—"}
              </p>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <p className="text-xs font-medium text-blue-700">Standard BOM Items</p>
              <p className="mt-1 text-2xl font-bold text-blue-900">{standardItems.length}</p>
            </div>

            <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4">
              <p className="text-xs font-medium text-purple-700">Extra Items</p>
              <p className="mt-1 text-2xl font-bold text-purple-900">{extraItems.length}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-600">Total Items</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{items.length}</p>
            </div>
          </div>

          {/* Prepared Items List (Grouped by Product with Collapsible Accordions) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={15} className="text-blue-600" />
                Products & Prepared Items List ({items.length})
              </h3>

              {groupedProducts.length > 0 && (
                <button
                  onClick={toggleAll}
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition"
                >
                  <ChevronsUpDown size={13} />
                  Toggle All
                </button>
              )}
            </div>

            {groupedProducts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-slate-400">
                No items recorded in this preparation.
              </div>
            ) : (
              <div className="space-y-3">
                {groupedProducts.map((group, groupIdx) => {
                  const isExpanded = Boolean(expandedProducts[group.productName]);

                  return (
                    <div
                      key={groupIdx}
                      className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs transition"
                    >
                      {/* Collapsible Accordion Header */}
                      <button
                        type="button"
                        onClick={() => toggleProduct(group.productName)}
                        className={`w-full flex items-center justify-between px-4 py-3 transition text-left ${
                          isExpanded ? "bg-slate-50 border-b border-slate-200" : "bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                            <Package size={15} />
                          </div>

                          <div>
                            <span className="text-xs font-bold text-slate-900">
                              {group.productName}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-500">
                                {group.items.length} items total
                              </span>
                              {group.standardCount > 0 && (
                                <span className="rounded bg-blue-100/70 px-1.5 py-0.2 text-[9px] font-semibold text-blue-700">
                                  {group.standardCount} Standard
                                </span>
                              )}
                              {group.extraCount > 0 && (
                                <span className="rounded bg-purple-100 px-1.5 py-0.2 text-[9px] font-bold text-purple-700">
                                  {group.extraCount} Extra
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-slate-400">
                            {isExpanded ? "Collapse" : "Expand"}
                          </span>
                          {isExpanded ? (
                            <ChevronDown size={17} className="text-slate-500" />
                          ) : (
                            <ChevronRight size={17} className="text-slate-500" />
                          )}
                        </div>
                      </button>

                      {/* Items Table in Expanded Accordion */}
                      {isExpanded && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-50/50 text-slate-600 font-semibold border-b border-slate-200">
                              <tr>
                                <th className="px-4 py-2 text-left w-10">#</th>
                                <th className="px-4 py-2 text-left">Item Type</th>
                                <th className="px-4 py-2 text-left">Item Name</th>
                                <th className="px-4 py-2 text-center">Quantity</th>
                                <th className="px-4 py-2 text-left">Unit</th>
                                <th className="px-4 py-2 text-left">Brand</th>
                                <th className="px-4 py-2 text-left">Remarks</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {group.items.map((item, idx) => {
                                const isExtra = isItemExtra(item);

                                return (
                                  <tr key={item.id ?? idx} className="hover:bg-slate-50/60">
                                    <td className="px-4 py-2.5 text-slate-500">{idx + 1}</td>
                                    <td className="px-4 py-2.5">
                                      {isExtra ? (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                                          Extra Item
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
                                          Standard BOM
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2.5 font-medium text-slate-900">
                                      {item.item_name || item.itemName || `Item #${item.item_id}`}
                                    </td>
                                    <td className="px-4 py-2.5 text-center font-bold text-blue-700">
                                      {item.calculatedQty ?? item.calculated_quantity ?? item.final_qty ?? item.quantity ?? 0}
                                    </td>
                                    <td className="px-4 py-2.5 text-slate-600">
                                      {item.unit || "Nos"}
                                    </td>
                                    <td className="px-4 py-2.5 text-slate-700 font-medium">
                                      {item.brand || "—"}
                                    </td>
                                    <td className="px-4 py-2.5 text-slate-500">
                                      {item.remarks || "—"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap justify-between items-center gap-2 border-t border-slate-200 p-4 bg-slate-50">
          <button
            type="button"
            onClick={() => exportBOMDetailReport(order, standardItems, extraItems)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition"
          >
            <Download size={14} /> Download BOM Sheet (.xlsx)
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold text-xs transition"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                if (onEdit) onEdit(order);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-xs shadow-xs transition"
            >
              <Edit3 size={14} /> Edit BOM Preparation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewBOMPreparationModal;

