import React from "react";

const BOMFilter = ({
    filters,
    products,
    onFilterChange,
    onClear
}) => {
    return (
        <div className="bg-white border border-slate-200 rounded-lg p-4 mb-5 shadow-xs">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* PRODUCT FILTER */}
                <div className="w-full md:w-72">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Filter by Product
                    </label>
                    <select
                        name="productId"
                        value={filters.productId}
                        onChange={onFilterChange}
                        className="
                            w-full
                            bg-white
                            text-slate-900
                            border
                            border-slate-300
                            rounded-lg
                            px-3
                            py-2
                            text-xs
                            outline-none
                            focus:ring-2
                            focus:ring-blue-500
                            focus:border-blue-500
                        "
                    >
                        <option value="" className="text-slate-900">
                            All Products
                        </option>
                        {products.map((product) => (
                            <option
                                key={product.id}
                                value={product.id}
                                className="text-slate-900"
                            >
                                {product.product_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* CLEAR FILTER */}
                {filters.productId && (
                    <div className="flex justify-end pt-5">
                        <button
                            type="button"
                            onClick={onClear}
                            className="
                                text-xs
                                font-medium
                                text-blue-600
                                hover:text-blue-800
                                bg-blue-50
                                border
                                border-blue-200
                                px-3
                                py-1.5
                                rounded-lg
                                transition
                            "
                        >
                            Clear Filter
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BOMFilter;