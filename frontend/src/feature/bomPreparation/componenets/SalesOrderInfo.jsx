import React from "react";

const SalesOrderInfo = ({ order }) => {
  if (!order) return null;

  const hasMultipleProducts =
    Array.isArray(order.items) && order.items.length > 1;

  const formatOrderDate = (dateVal) => {
    if (!dateVal) return "—";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) {
        return String(dateVal).split("T")[0];
      }
      return d.toLocaleDateString("en-IN");
    } catch {
      return String(dateVal).split("T")[0] || "—";
    }
  };

  const summaryDetails = [
    { label: "Sales Order No.", value: order.sales_order_no },
    { label: "Client", value: order.client_name },
    { label: "Order Date", value: formatOrderDate(order.order_date) },
    { label: "Shipping Address", value: order.shippingAddress },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div>
        <h2 className="font-semibold text-slate-900">Sales Order Details</h2>
        <p className="mt-1 text-sm text-slate-500">
          Information from the confirmed sales order.
        </p>
      </div>

      {/* Order summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {summaryDetails.map((d) => (
          <div
            key={d.label}
            className="rounded-lg border border-slate-200 bg-slate-50 p-3"
          >
            <p className="text-xs font-medium text-slate-500">{d.label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {d.value || "—"}
            </p>
          </div>
        ))}
      </div>

      {/* Products table */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {hasMultipleProducts ? "Products in this Order" : "Product"}
        </p>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left">#</th>
                <th className="px-4 py-2 text-left">Product Name</th>
                <th className="px-4 py-2 text-center">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.isArray(order.items) && order.items.length > 0 ? (
                order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-500">{idx + 1}</td>
                    <td className="px-4 py-2 font-medium text-slate-900">
                      {item.productName || "—"}
                    </td>
                    <td className="px-4 py-2 text-center font-semibold text-slate-900">
                      {item.qty}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-2 text-slate-500">1</td>
                  <td className="px-4 py-2 font-medium text-slate-900">
                    {order.product_name || "—"}
                  </td>
                  <td className="px-4 py-2 text-center font-semibold text-slate-900">
                    {order.order_quantity}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesOrderInfo;