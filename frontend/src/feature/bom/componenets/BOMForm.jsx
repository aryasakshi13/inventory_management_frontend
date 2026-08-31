import React, { useEffect, useState } from "react";

const emptyForm = {
    productId: "",
    description: "",
    items: []
};

const BOMForm = ({
    bom,
    products,
    items,
    loading,
    onCreate,
    onUpdate,
    onClose
}) => {

    const [formData, setFormData] =
        useState(emptyForm);

    // =====================================================
    // EDIT DATA
    // =====================================================

    useEffect(() => {

        if (bom) {

            setFormData({
                productId: bom.product_id || bom.productId || "",
                description: bom.description || "",
                items: bom.items?.map((item) => ({
                    itemId: item.item_id || item.itemId,
                    quantity: item.quantity,
                    remarks: item.remarks || ""
                })) || []
            });

        } else {

            setFormData(emptyForm);

        }

    }, [bom]);

    // =====================================================
    // BASIC CHANGE
    // =====================================================

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // =====================================================
    // ADD ITEM
    // =====================================================

    const handleAddItem = () => {

        setFormData((prev) => ({
            ...prev,

            items: [
                ...prev.items,

                {
                    itemId: "",
                    quantity: "",
                    remarks: ""
                }
            ]
        }));
    };

    // =====================================================
    // REMOVE ITEM
    // =====================================================

    const handleRemoveItem = (index) => {

        setFormData((prev) => ({
            ...prev,

            items: prev.items.filter(
                (_, itemIndex) =>
                    itemIndex !== index
            )
        }));
    };

    // =====================================================
    // ITEM CHANGE
    // =====================================================

    const handleItemChange = (
        index,
        field,
        value
    ) => {

        setFormData((prev) => {

            const updatedItems =
                [...prev.items];

            if (field === "itemId") {
                const selected = items.find(
                    (i) => String(i.id) === String(value)
                );
                const itemUnit = selected?.unit || selected?.uom || "Nos";

                updatedItems[index] = {
                    ...updatedItems[index],
                    itemId: value,
                    unit: itemUnit
                };
            } else {
                updatedItems[index] = {
                    ...updatedItems[index],
                    [field]: value
                };
            }

            return {
                ...prev,
                items: updatedItems
            };
        });
    };

    // =====================================================
    // SUBMIT
    // =====================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!formData.productId) {
            alert("Product is required.");
            return;
        }

        if (!formData.items.length) {
            alert("Add at least one item.");
            return;
        }

        const itemIds = formData.items.map(
            (item) => item.itemId
        );

        if (
            new Set(itemIds).size !==
            itemIds.length
        ) {
            alert(
                "Duplicate items are not allowed."
            );
            return;
        }

        for (const item of formData.items) {

            if (!item.itemId) {
                alert("Please select an item.");
                return;
            }

            if (
                !item.quantity ||
                Number(item.quantity) <= 0
            ) {
                alert(
                    "Quantity must be greater than 0."
                );
                return;
            }
        }

        const payload = {
            productId:
                Number(formData.productId),

            capacity:
                "Standard",

            description:
                formData.description,

            store_items_id:
                formData.items.map((item) => ({
                    itemId:
                        Number(item.itemId),

                    quantity:
                        Number(item.quantity),

                    remarks:
                        item.remarks || null
                }))
        };

        let response;

        if (bom?.id) {

            response =
                await onUpdate(
                    bom.id,
                    payload
                );

        } else {

            response =
                await onCreate(payload);

        }

        if (response?.success) {
            onClose();
        } else {
            alert(
                response?.message ||
                "Failed to save BOM."
            );
        }
    };

    return (

        <form
            onSubmit={handleSubmit}
            className="space-y-6 text-slate-900"
        >

            {/* =====================================================
                HEADER
            ===================================================== */}

            <div className="flex justify-between items-start">

                <div>

                    <h2 className="text-2xl font-semibold text-slate-900">
                        {bom
                            ? "Edit BOM"
                            : "Create BOM"}
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                        Define standard materials required
                        for the product.
                    </p>

                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="
                        text-slate-600
                        hover:text-slate-900
                        font-medium
                    "
                >
                    Back
                </button>

            </div>


            {/* =====================================================
                BOM DETAILS
            ===================================================== */}

            <div className="bg-white border border-slate-200 rounded-lg p-6">

                <h3 className="font-semibold text-slate-900 mb-5">
                    BOM Details
                </h3>

                <div className="grid grid-cols-1 gap-5">

                    {/* PRODUCT */}

                    <div>

                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Product *
                        </label>

                        <select
                            name="productId"
                            value={formData.productId}
                            onChange={handleChange}
                            className="
                                w-full
                                bg-white
                                text-slate-900
                                border
                                border-slate-300
                                rounded-lg
                                px-3
                                py-2
                                outline-none
                                focus:ring-2
                                focus:ring-blue-500
                                focus:border-blue-500
                            "
                        >

                            <option
                                value=""
                                className="text-slate-900"
                            >
                                Select Product
                            </option>

                            {products.map(
                                (product) => (

                                    <option
                                        key={product.id}
                                        value={product.id}
                                        className="text-slate-900"
                                    >
                                        {
                                            product.product_name
                                        }
                                    </option>

                                )
                            )}

                        </select>

                    </div>

                </div>

            </div>


            {/* =====================================================
                BOM ITEMS
            ===================================================== */}

            <div className="bg-white border border-slate-200 rounded-lg p-6">

                <div className="flex justify-between items-start mb-5">

                    <div>

                        <h3 className="font-semibold text-slate-900">
                            BOM Items
                        </h3>

                        <p className="text-sm text-slate-500 mt-1">
                            Materials required for this BOM.
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={handleAddItem}
                        className="
                            px-4
                            py-2
                            bg-white
                            text-slate-700
                            border
                            border-slate-300
                            rounded-lg
                            hover:bg-slate-50
                            hover:text-slate-900
                            font-medium
                        "
                    >
                        + Add Item
                    </button>

                </div>


                {/* ITEMS TABLE */}

                <div className="overflow-x-auto">

                    <table className="w-full">

                        <thead>

                            <tr className="border-b border-slate-200 bg-slate-50">

                                <th className="text-left py-3 px-2 text-sm font-semibold text-slate-700">
                                    Item
                                </th>

                                <th className="text-center py-3 px-2 text-sm font-semibold text-slate-700 w-28">
                                    UOM
                                </th>

                                <th className="text-left py-3 px-2 text-sm font-semibold text-slate-700 w-36">
                                    Quantity
                                </th>

                                <th className="text-center py-3 px-2 text-sm font-semibold text-slate-700 w-24">
                                    Action
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {formData.items.map(
                                (bomItem, index) => {

                                    const selectedItem =
                                        items.find(
                                            (item) =>
                                                String(
                                                    item.id
                                                ) ===
                                                String(
                                                    bomItem.itemId
                                                )
                                        );

                                    return (

                                        <tr
                                            key={index}
                                            className="border-b border-slate-200"
                                        >

                                            {/* ITEM */}

                                            <td className="py-3 pr-3">

                                                <select
                                                    value={
                                                        bomItem.itemId
                                                    }
                                                    onChange={(e) =>
                                                        handleItemChange(
                                                            index,
                                                            "itemId",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="
                                                        w-full
                                                        min-w-[200px]
                                                        bg-white
                                                        text-slate-900
                                                        border
                                                        border-slate-300
                                                        rounded-lg
                                                        px-3
                                                        py-2
                                                        outline-none
                                                        focus:ring-2
                                                        focus:ring-blue-500
                                                        focus:border-blue-500
                                                    "
                                                >

                                                    <option
                                                        value=""
                                                        className="text-slate-900"
                                                    >
                                                        Select Item
                                                    </option>

                                                    {items.map(
                                                        (item) => (

                                                            <option
                                                                key={
                                                                    item.id
                                                                }
                                                                value={
                                                                    item.id
                                                                }
                                                                className="text-slate-900"
                                                            >
                                                                {
                                                                    item.item_name
                                                                }
                                                            </option>

                                                        )
                                                    )}

                                                </select>

                                            </td>

                                            {/* UOM */}

                                            <td className="py-3 px-2 text-center">

                                                <span className={`inline-block px-3 py-2 rounded-lg text-xs font-semibold ${
                                                    selectedItem
                                                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                                                        : "bg-slate-50 text-slate-400 border border-slate-200"
                                                }`}>
                                                    {selectedItem ? (selectedItem.unit || selectedItem.uom || bomItem.unit || "Nos") : "—"}
                                                </span>

                                            </td>


                                            {/* QUANTITY */}

                                            <td className="py-3 px-2">

                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    placeholder="0"
                                                    value={
                                                        bomItem.quantity
                                                    }
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                                            handleItemChange(
                                                                index,
                                                                "quantity",
                                                                val
                                                            );
                                                        }
                                                    }}
                                                    className="
                                                        w-full
                                                        bg-white
                                                        text-slate-900
                                                        border
                                                        border-slate-300
                                                        rounded-lg
                                                        px-3
                                                        py-2
                                                        outline-none
                                                        focus:ring-2
                                                        focus:ring-blue-500
                                                        focus:border-blue-500
                                                    "
                                                />

                                            </td>


                                            {/* ACTION */}

                                            <td className="py-3 px-2 text-center">

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRemoveItem(
                                                            index
                                                        )
                                                    }
                                                    className="
                                                        text-red-600
                                                        hover:text-red-800
                                                        font-medium
                                                    "
                                                >
                                                    Remove
                                                </button>

                                            </td>

                                        </tr>

                                    );
                                }
                            )}

                        </tbody>

                    </table>

                </div>


                {/* EMPTY STATE */}

                {!formData.items.length && (

                    <div className="
                        py-10
                        text-center
                        text-slate-500
                        border-t
                        border-slate-100
                    ">
                        No items added.
                    </div>

                )}

            </div>


            {/* =====================================================
                FOOTER
            ===================================================== */}

            <div className="flex justify-end gap-3">

                <button
                    type="button"
                    onClick={onClose}
                    className="
                        px-5
                        py-2
                        bg-white
                        text-slate-700
                        border
                        border-slate-300
                        rounded-lg
                        hover:bg-slate-50
                        hover:text-slate-900
                        font-medium
                    "
                >
                    Cancel
                </button>


                <button
                    type="submit"
                    disabled={loading}
                    className="
                        px-5
                        py-2
                        bg-blue-600
                        hover:bg-blue-700
                        disabled:bg-blue-300
                        text-white
                        rounded-lg
                        font-medium
                    "
                >
                    {loading
                        ? "Saving..."
                        : bom
                        ? "Update BOM"
                        : "Save BOM"}
                </button>

            </div>

        </form>
    );
};

export default BOMForm;