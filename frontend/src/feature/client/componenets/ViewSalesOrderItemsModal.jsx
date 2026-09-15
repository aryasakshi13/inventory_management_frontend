import React from "react";
import {
    X,
    FileText,
    ExternalLink,
    Wrench,
    MapPin,
    Calendar,
    Phone,
    User,
    Building2,
    UserCheck,
    Info,
    Package,
    Truck
} from "lucide-react";

export const ViewSalesOrderItemsModal = ({
    isOpen,
    onClose,
    order,
}) => {
    if (!isOpen || !order) return null;

    const getFullImageUrl = (path) => {
        if (!path || typeof path !== 'string') return '';
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        const base = window.location.hostname === 'localhost'
            ? 'http://localhost:5001'
            : 'https://www.namami-infotech.com/inventory';
        if (path.startsWith('/uploads') || path.startsWith('uploads')) {
            const cleanPath = path.startsWith('/') ? path : `/${path}`;
            return `${base}${cleanPath}`;
        }
        return `${base}/uploads/${path}`;
    };

    const rawPoCopy = order.poCopy || order.po_copy || order.po_copy_url;
    const poCopyUrl = getFullImageUrl(rawPoCopy);

    const formatDate = (dateVal) => {
        if (!dateVal) return 'N/A';
        try {
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return String(dateVal).split('T')[0];
            return d.toLocaleDateString("en-IN");
        } catch {
            return String(dateVal).split('T')[0] || 'N/A';
        }
    };

    // Determine if this order is an In-House Manufactured Product order or a Site Assembly project order
    const isInHouse =
        order.orderType === 'in_house' ||
        order.order_type === 'in_house' ||
        (typeof order.projectName === 'string' && order.projectName.toLowerCase().startsWith('in-house')) ||
        (typeof order.project_name === 'string' && order.project_name.toLowerCase().startsWith('in-house')) ||
        (Array.isArray(order.items) && order.items.length > 0 && order.items.every(it => (it.fulfilment_mode || '').includes('in_house'))) ||
        (!order.siteContactPerson && !order.siteContactNumber && (!order.projectIncharge || order.projectIncharge === 'N/A' || order.projectIncharge === 'NA'));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">

                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50">

                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg font-bold text-gray-900">
                                Sales Order Details
                            </h2>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                order.status === 'Confirmed'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                                {order.status || 'Pending'}
                            </span>

                            {/* Order Fulfilment Type Badge */}
                            {isInHouse ? (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1">
                                    <Package size={13} className="text-purple-600" />
                                    In-House Order
                                </span>
                            ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
                                    <Wrench size={13} className="text-blue-600" />
                                    Site Assembly Order
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Order ID: <span className="font-semibold text-gray-800">SO-{order.Id}</span> | Client: <span className="font-semibold text-gray-800">{order.clientName || 'N/A'}</span>
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-gray-200/60 text-gray-500 hover:text-gray-800 transition cursor-pointer"
                    >
                        <X size={20} />
                    </button>

                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[78vh] space-y-6 text-xs">

                    {/* Section 1: Order Metadata */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">

                        <div>
                            <p className="text-[11px] font-medium text-gray-500">Order ID</p>
                            <p className="font-bold text-gray-900 text-xs mt-0.5 font-mono">
                                SO-{order.Id}
                            </p>
                        </div>

                        <div>
                            <p className="text-[11px] font-medium text-gray-500">
                                {isInHouse ? 'Order / Fulfilment Type' : 'Project Incharge / Engineer'}
                            </p>
                            {isInHouse ? (
                                <p className="font-bold text-purple-700 text-xs mt-0.5 inline-flex items-center gap-1">
                                    <Package size={13} /> In-House Production
                                </p>
                            ) : (
                                <p className="font-semibold text-blue-700 text-xs mt-0.5">
                                    {order.projectIncharge || 'Unassigned'}
                                </p>
                            )}
                        </div>

                        <div>
                            <p className="text-[11px] font-medium text-gray-500">PO Number</p>
                            <p className="font-semibold text-gray-900 text-xs mt-0.5 font-mono">
                                {order.poNo || order.poNumber || 'N/A'}
                            </p>
                        </div>

                        <div>
                            <p className="text-[11px] font-medium text-gray-500">PO Date</p>
                            <p className="font-semibold text-gray-900 text-xs mt-0.5">
                                {formatDate(order.poDate)}
                            </p>
                        </div>

                    </div>

                    {/* Section 2: Conditional Details based on Order Type */}
                    {isInHouse ? (
                        /* 🌟 IN-HOUSE ORDER DETAILS (Site details hidden) */
                        <div className="bg-purple-50/40 p-4 border border-purple-200 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs font-bold text-purple-900 uppercase tracking-wider">
                                    <Building2 size={15} className="text-purple-600" />
                                    <span>In-House Delivery & Billing Details</span>
                                </div>
                                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                                    Direct Warehouse Delivery
                                </span>
                            </div>

                            <div className="p-2.5 bg-white border border-purple-100 rounded-lg text-purple-900 text-[11px] flex items-center gap-2">
                                <Info size={14} className="text-purple-600 shrink-0" />
                                <span>This order is for <strong>In-House Manufactured Products</strong>. It is dispatched directly to the client without site-level survey or engineer deployment.</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-2xs">
                                    <span className="text-[10px] font-semibold text-gray-400 uppercase flex items-center gap-1 block">
                                        <MapPin size={11} className="text-purple-600" /> Delivery / Shipping Address
                                    </span>
                                    <span className="text-xs text-gray-800 block mt-1 font-medium">
                                        {order.shippingAddress || order.siteAddress || order.site_address || 'N/A'}
                                    </span>
                                </div>

                                <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-2xs">
                                    <span className="text-[10px] font-semibold text-gray-400 uppercase flex items-center gap-1 block">
                                        <Building2 size={11} className="text-purple-600" /> Billing Address
                                    </span>
                                    <span className="text-xs text-gray-800 block mt-1 font-medium">
                                        {order.billingAddress || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {(order.expectedDeliveryDate || order.remarks || order.projectRemarks) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {order.expectedDeliveryDate && (
                                        <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-2xs">
                                            <span className="text-[10px] font-semibold text-gray-400 uppercase flex items-center gap-1 block">
                                                <Calendar size={11} className="text-purple-600" /> Expected Delivery Date
                                            </span>
                                            <span className="text-xs font-bold text-gray-800 block mt-1">
                                                {formatDate(order.expectedDeliveryDate)}
                                            </span>
                                        </div>
                                    )}
                                    {(order.remarks || order.projectRemarks) && (
                                        <div className={`bg-white p-3 rounded-lg border border-purple-100 shadow-2xs ${!order.expectedDeliveryDate ? 'md:col-span-2' : ''}`}>
                                            <span className="text-[10px] font-semibold text-gray-400 uppercase block">Remarks / Order Notes</span>
                                            <span className="text-xs text-gray-700 block mt-1">
                                                {order.remarks || order.projectRemarks}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* 🌟 SITE PROJECT DETAILS (For Site Assembly Orders) */
                        <div className="bg-slate-50/70 p-4 border border-slate-200 rounded-xl space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                                <Wrench size={15} className="text-blue-600" />
                                <span>Project & Site Details</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="bg-white p-3 rounded-lg border border-slate-200">
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Project Name</span>
                                    <span className="text-xs font-bold text-slate-900 block mt-0.5">{order.projectName || order.project_name || 'N/A'}</span>
                                </div>

                                <div className="bg-white p-3 rounded-lg border border-slate-200">
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Site Contact Person</span>
                                    <span className="text-xs font-semibold text-slate-800 block mt-0.5">{order.siteContactPerson || order.site_contact_person || 'N/A'}</span>
                                </div>

                                <div className="bg-white p-3 rounded-lg border border-slate-200">
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Site Contact Phone</span>
                                    <span className="text-xs font-semibold text-slate-800 block mt-0.5">{order.siteContactNumber || order.site_contact_number || 'N/A'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                <div className="bg-white p-3 rounded-lg border border-slate-200">
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Project / Site Address (Shipping)</span>
                                    <span className="text-xs text-slate-800 block mt-0.5">{order.shippingAddress || order.siteAddress || order.site_address || 'N/A'}</span>
                                </div>

                                <div className="bg-white p-3 rounded-lg border border-slate-200">
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Billing Address</span>
                                    <span className="text-xs text-slate-800 block mt-0.5">{order.billingAddress || 'N/A'}</span>
                                </div>
                            </div>

                            {(order.remarks || order.projectRemarks) && (
                                <div className="bg-white p-3 rounded-lg border border-slate-200">
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Remarks / Order Notes</span>
                                    <span className="text-xs text-slate-700 block mt-0.5">{order.remarks || order.projectRemarks}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Section 3: PO Document Preview */}
                    {poCopyUrl && (
                        <div className="bg-blue-50/40 border border-blue-200 rounded-xl p-4 space-y-2">
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

                    {/* Section 4: Line Items Table */}
                    <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-700">
                            Ordered Products ({order.items?.length || 0})
                        </p>
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="min-w-full">
                                <thead className="bg-gray-100 text-xs font-semibold text-gray-700 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-2.5 text-left w-12">#</th>
                                        <th className="px-4 py-2.5 text-left">Product Name</th>
                                        <th className="px-4 py-2.5 text-center w-28">Qty</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {order.items && order.items.length > 0 ? (
                                        order.items.map((item, idx) => (
                                            <tr key={item.itemId ?? item.Id ?? idx} className="hover:bg-gray-50">
                                                <td className="px-4 py-2.5 text-gray-500">{idx + 1}</td>
                                                <td className="px-4 py-2.5 text-gray-900 font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <span>{item.productName || item.itemName}</span>
                                                        {isInHouse && (
                                                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                                                In-House
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 text-center text-gray-900 font-bold">
                                                    {item.qty}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="px-4 py-6 text-center text-gray-400">
                                                No items found in this order.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="flex justify-end border-t px-6 py-3 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                        Close
                    </button>
                </div>

            </div>

        </div>
    );
};