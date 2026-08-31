import axios from "axios";
import { fetchSalesOrders } from "../../client/services/salesOrderService";

const BASE_URL = "http://localhost:5001/api/bomPrepare";

/**
 * Get confirmed sales orders
 */
export const getConfirmedSalesOrders = async (params = {}) => {
    const response = await fetchSalesOrders(params);
    const orders = response?.data?.data ?? response?.data ?? response;
    const confirmedOrders = Array.isArray(orders)
        ? orders.filter((order) =>
            String(order.status ?? order.Status ?? '').trim().toLowerCase() === 'confirmed'
        )
        : [];

    return { data: confirmedOrders };
};

/**
 * Automatically fetch & calculate BOM for order products from bom database table
 */
export const fetchBOMForOrder = async (salesOrderId, products = []) => {
    const response = await axios.post(
        `${BASE_URL}/fetch-bom`,
        {
            sales_order_id: salesOrderId,
            products,
        },
        {
            withCredentials: true,
        }
    );
    return response.data;
};

/**
 * Save or submit BOM Preparation
 */
export const saveBOMPreparation = async (payload) => {
    const response = await axios.post(
        `${BASE_URL}/add`,
        payload,
        {
            withCredentials: true,
        }
    );
    return response.data;
};

export const submitBOMPreparation = async (payload) => {
    return saveBOMPreparation({
        ...payload,
        status: "Prepared",
    });
};

/**
 * Get master data (units, brands, items)
 */
export const getMastersData = async () => {
    const response = await axios.get(
        `${BASE_URL}/masters`,
        {
            withCredentials: true,
        }
    );
    return response.data;
};

/**
 * Get all BOM preparations list
 */
export const fetchAllBOMPreparations = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/list`, {
            withCredentials: true,
        });
        return response.data;
    } catch (err) {
        console.warn("Failed to fetch all BOM preparations:", err);
        return { success: false, data: [] };
    }
};

/**
 * Get BOM preparation for specific sales order ID
 */
export const fetchBOMPreparationByOrderId = async (salesOrderId) => {
    try {
        const response = await axios.get(`${BASE_URL}/order/${salesOrderId}`, {
            withCredentials: true,
        });
        return response.data;
    } catch (err) {
        console.warn("Failed to fetch BOM preparation for order:", err);
        return { success: false, data: null };
    }
};