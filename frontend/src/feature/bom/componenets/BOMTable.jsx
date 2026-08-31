import React, { useState } from "react";
import { Eye, Edit3, Trash2, PlusCircle } from "lucide-react";
import { Pagination } from "../../../components/common/pagination";

const BOMTable = ({
    products = [],
    loading,
    onEdit,
    onDelete,
    onView
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    if (loading) {
        return (
            <div className="border rounded-lg p-10 text-center text-slate-500 text-xs">
                Loading products and BOMs...
            </div>
        );
    }

    if (!products.length) {
        return (
            <div className="border rounded-lg p-10 text-center bg-white border-slate-200">
                <p className="text-gray-500 text-xs">
                    No products found.
                </p>
            </div>
        );
    }

    const totalItems = products.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const paginatedProducts = products.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-700 w-1/3">
                                Product Name
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-700 w-1/2">
                                Description
                            </th>
                            <th className="px-5 py-3 text-right text-xs font-semibold text-slate-700">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginatedProducts.map((row) => {
                            const hasBOM = Boolean(row.hasBOM && row.bom);

                            return (
                                <tr
                                    key={row.id}
                                    className="hover:bg-slate-50 text-xs transition-colors"
                                >
                                    <td className="px-5 py-4 font-semibold text-slate-900">
                                        {row.product_name}
                                    </td>
                                    <td className="px-5 py-4 text-slate-600 font-normal">
                                        {row.description || "—"}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex justify-end items-center gap-2">
                                            {/* VIEW BUTTON: Green if BOM exists, Gray with alert if BOM doesn't exist */}
                                            {hasBOM ? (
                                                <button
                                                    onClick={() => onView(row.bom)}
                                                    className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                                                    title="View BOM (Created)"
                                                    type="button"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => alert("Please create BOM for this product first. / Pehle BOM create karo.")}
                                                    className="p-2 text-slate-400 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                                                    title="BOM Not Created"
                                                    type="button"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            )}

                                            {/* EDIT / CREATE BUTTON */}
                                            <button
                                                onClick={() => onEdit(row.bom, row.id)}
                                                className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                                                title={hasBOM ? "Edit BOM" : "Create BOM for this product"}
                                                type="button"
                                            >
                                                <Edit3 size={16} />
                                            </button>

                                            {/* DELETE BUTTON (if BOM exists) */}
                                            {hasBOM && (
                                                <button
                                                    onClick={() => onDelete(row.bom.id)}
                                                    className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200"
                                                    title="Delete BOM"
                                                    type="button"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
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

export default BOMTable;