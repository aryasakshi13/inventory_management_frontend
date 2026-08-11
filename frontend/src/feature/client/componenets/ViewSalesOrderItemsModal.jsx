import React from "react";
import { X, FileText, ExternalLink } from "lucide-react";

export const ViewSalesOrderItemsModal = ({
    isOpen,
    onClose,
    order,
}) => {


    console.log(order,"asasasasasasasas")

    if (!isOpen || !order) return null;

    console.log("Sales Order Object inside View Modal:", order);

    const getFullImageUrl = (path) => {
        if (!path || typeof path !== 'string') return '';
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        if (path.startsWith('/uploads') || path.startsWith('uploads')) {
            const cleanPath = path.startsWith('/') ? path : `/${path}`;
            return `http://localhost:5001${cleanPath}`;
        }
        return `http://localhost:5001/uploads/${path}`;
    };

    const rawPoCopy = order.poCopy || order.po_copy || order.po_copy_url;
    const poCopyUrl = getFullImageUrl(rawPoCopy);

    console.log("Resolved poCopyUrl:", poCopyUrl);


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4">

                    <h2 className="text-xl font-semibold text-gray-900">
                        Sales Order Details
                    </h2>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-md hover:bg-gray-100 transition"
                    >
                        <X size={22} className="text-gray-700" />
                    </button>

                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[75vh]">

                    {/* Order Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

                        <div>
                            <p className="text-sm text-gray-500">Order ID</p>
                            <p className="font-semibold text-gray-900">
                                SO-{order.Id}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">PO Number</p>
                            <p className="font-semibold text-gray-900">
                                {order.poNo}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">PO Date</p>
                            <p className="font-semibold text-gray-900">
                                {new Date(order.poDate).toLocaleDateString("en-IN")}
                            </p>
                        </div>

                    </div>

                    {/* PO Document Preview */}
                    {poCopyUrl && (
                        <div className="bg-blue-50/40 border border-blue-200 rounded-xl p-4 mb-6 space-y-2">
                            <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                                <p className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                                    <FileText size={14} className="text-blue-600" /> Attached PO Copy Document
                                </p>
                                <a
                                    href={poCopyUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                                >
                                    <ExternalLink size={13} /> View Full Screen
                                </a>
                            </div>

                            {poCopyUrl.toLowerCase().endsWith('.pdf') ? (
                                <a
                                    href={poCopyUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                                >
                                    <FileText size={28} className="text-red-500" />
                                    <div>
                                        <p className="font-bold text-gray-900 text-xs">PO Copy Document (PDF)</p>
                                        <p className="text-[10px] text-gray-500">Click to open or download PDF file</p>
                                    </div>
                                </a>
                            ) : (
                                <div className="relative rounded-lg overflow-hidden border border-blue-200 bg-white group max-h-64 flex justify-center items-center p-2">
                                    <img
                                        src={poCopyUrl}
                                        alt="PO Copy"
                                        className="max-h-56 object-contain rounded-md"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                    <a
                                        href={poCopyUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-semibold gap-1.5 text-xs rounded-lg"
                                    >
                                        <ExternalLink size={15} /> Open Full Size Image
                                    </a>
                                </div>
                            )}
                        </div>
                    )}


                    {/* Items Table */}
                    <div className="overflow-x-auto">

                        <table className="min-w-full border border-gray-200 rounded-lg">

                            <thead className="bg-gray-100">

                                <tr>

                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        Item Name
                                    </th>

                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                                        Qty
                                    </th>

                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                        Price
                                    </th>

                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                        Total
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {order.items.map((item) => (

                                    <tr
                                        key={item.itemId ?? item.Id}
                                        className="border-t hover:bg-gray-50"
                                    >

                                        <td className="px-4 py-3 text-gray-900">
                                            {item.itemName}
                                        </td>

                                        <td className="px-4 py-3 text-center text-gray-900">
                                            {item.qty}
                                        </td>

                                        <td className="px-4 py-3 text-right text-gray-900">
                                            ₹{Number(item.price ?? item.price).toLocaleString()}
                                        </td>

                                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                                            ₹{Number(item.total ?? item.total).toLocaleString()}
                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                    {/* Grand Total */}
                    <div className="flex justify-end mt-6">

                        <div className="bg-blue-50 px-5 py-3 rounded-lg">

                            <p className="text-sm text-gray-600">
                                Grand Total
                            </p>

                            <p className="text-xl font-bold text-blue-700">
                                ₹{Number(order.totalAmount).toLocaleString()}
                            </p>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
};