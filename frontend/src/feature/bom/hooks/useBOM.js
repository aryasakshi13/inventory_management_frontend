import { useEffect, useState } from "react";

import {
    getBOMs,
    getBOMById,
    createBOM,
    updateBOM,
    deleteBOM,
    getProducts,
    getItems
} from "../service/bomService";

const useBOM = () => {

    const [boms, setBoms] = useState([]);

    const [products, setProducts] = useState([]);

    const [items, setItems] = useState([]);

    const [loading, setLoading] = useState(false);

    const [formLoading, setFormLoading] = useState(false);

    const [error, setError] = useState("");

    // =====================================================
    // LOAD BOMs
    // =====================================================

    const loadBOMs = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await getBOMs();

            if (response.success) {

                setBoms(response.data);

            } else {

                setError(
                    response.message ||
                    "Failed to load BOMs."
                );

            }

        } catch (error) {

            console.error("Load BOMs error:", error);

            setError(
                error.response?.data?.message ||
                "Failed to load BOMs."
            );

        } finally {

            setLoading(false);

        }
    };

    // =====================================================
    // LOAD PRODUCTS
    // =====================================================

    const loadProducts = async () => {

        try {

            const response = await getProducts();

            if (response.success) {

                setProducts(response.data);

            }

        } catch (error) {

            console.error(
                "Load products error:",
                error
            );

        }
    };

    // =====================================================
    // LOAD ITEMS
    // =====================================================

    const loadItems = async () => {

        try {

            const response = await getItems();

            if (response.success) {

                setItems(response.data);

            }

        } catch (error) {

            console.error(
                "Load items error:",
                error
            );

        }
    };

    // =====================================================
    // LOAD SINGLE BOM
    // =====================================================

    const loadBOMById = async (id) => {

        try {

            setFormLoading(true);

            const response =
                await getBOMById(id);

            return response;

        } catch (error) {

            console.error(
                "Load BOM error:",
                error
            );

            throw error;

        } finally {

            setFormLoading(false);

        }
    };

    // =====================================================
    // CREATE BOM
    // =====================================================

    const handleCreateBOM = async (payload) => {

        try {

            setFormLoading(true);

            const response =
                await createBOM(payload);

            if (response.success) {

                await loadBOMs();

            }

            return response;

        } finally {

            setFormLoading(false);

        }
    };

    // =====================================================
    // UPDATE BOM
    // =====================================================

    const handleUpdateBOM = async (
        id,
        payload
    ) => {

        try {

            setFormLoading(true);

            const response =
                await updateBOM(
                    id,
                    payload
                );

            if (response.success) {

                await loadBOMs();

            }

            return response;

        } finally {

            setFormLoading(false);

        }
    };

    // =====================================================
    // DELETE BOM
    // =====================================================

    const handleDeleteBOM = async (id) => {

        const response =
            await deleteBOM(id);

        if (response.success) {

            await loadBOMs();

        }

        return response;
    };

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        loadBOMs();
        loadProducts();
        loadItems();

    }, []);

    return {

        boms,

        products,

        items,

        loading,

        formLoading,

        error,

        loadBOMs,
        loadProducts,
        loadBOMById,
        handleCreateBOM,
        handleUpdateBOM,
        handleDeleteBOM
    };
};

export default useBOM;