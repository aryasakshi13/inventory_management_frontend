import React, { useState } from "react";
import { Package, Eye, Edit3, ArrowRight, Download } from "lucide-react";
import { Pagination } from "../../../components/common/pagination";
import { exportSalesOrdersReport } from "../../../utils/exportReport";

const ConfirmedOrdersTable = ({ orders = [], onPrepare, onEdit, onView, loading }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalItems = orders?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedOrders = (orders || []).slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-slate-600" />
            <h2 className="font-semibold text-slate-900">Confirmed Sales Orders</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Select a confirmed sales order to prepare or view its BOM / BOQ.
          </p>
        </div>

        <button
          type="button"
          onClick={() => exportSalesOrdersReport(orders)}
          title="Download Confirmed Orders BOM Report (Excel)"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-xs transition"
        >
          <Download size={15} /> Download Orders Report
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[950px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="table-header">SO No.</th>
              <th className="table-header">Client</th>
              <th className="table-header">Product(s)</th>
              <th className="table-header">Order Qty</th>
              <th className="table-header">Order Date</th>
              <th className="table-header text-center">Status</th>
              <th className="table-header text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td
                  colSpan="7"
                  className="px-5 py-10 text-center text-sm text-slate-500"
                >
                  Loading confirmed orders…
                </td>
              </tr>
            ) : !orders || orders.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="px-5 py-10 text-center text-sm text-slate-500"
                >
                  No confirmed sales orders available for BOM preparation.
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => {
                const hasItems =
                  Array.isArray(order.items) && order.items.length > 0;

                // Product names (de-duped)
                const productNames = hasItems
                  ? [...new Set(order.items.map((i) => i.productName).filter(Boolean))]
                  : [order.product_name].filter(Boolean);

                // Total order qty
                const totalQty = hasItems
                  ? order.items.reduce((s, i) => s + (Number(i.qty) || 0), 0)
                  : order.order_quantity;

                const isConfirmed =
                  order.bom_status === "Confirmed" || order.is_prepared;

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="table-cell font-semibold text-slate-900">
                      {order.sales_order_no || order.id}
                    </td>

                    <td className="table-cell">{order.client_name || "—"}</td>

                    <td className="table-cell">
                      {productNames.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {productNames.map((name, i) => (
                            <span key={i} className="font-medium text-slate-800">
                              {name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="table-cell font-medium">
                      {totalQty || "—"}
                    </td>

                    <td className="table-cell">
                      {order.order_date
                        ? new Date(order.order_date).toLocaleDateString("en-IN")
                        : "—"}
                    </td>

                    <td className="table-cell text-center">
                      {isConfirmed ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          Confirmed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          Pending
                        </span>
                      )}
                    </td>

                    <td className="table-cell text-right">
                      {isConfirmed ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onView && onView(order)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-xs"
                            title="View Prepared BOM / BOQ"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                            View
                          </button>
                          <button
                            onClick={() => (onEdit ? onEdit(order) : onPrepare(order))}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition shadow-xs"
                            title="Edit BOM / BOQ"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onPrepare(order)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-slate-700 transition shadow-xs"
                        >
                          Prepare
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default ConfirmedOrdersTable;