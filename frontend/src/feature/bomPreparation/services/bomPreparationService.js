import axios from "axios";
import { fetchSalesOrders } from "../../client/services/salesOrderService";

const BASE_URL = window.location.hostname === 'localhost'
    ? "http://localhost:5001/api/bomPrepare"
    : "https://www.namami-infotech.com/inventory/api/bomPrepare";

/**
 * Get confirmed sales orders (exclusively for site assembly; in-house manufacturing skips BOM preparation)
 */
export const getConfirmedSalesOrders = async (params = {}) => {
    const response = await fetchSalesOrders(params);
    const orders = response?.data?.data ?? response?.data ?? response;
    const confirmedOrders = Array.isArray(orders)
        ? orders.filter((order) => {
            const isConfirmed = String(order.status ?? order.Status ?? '').trim().toLowerCase() === 'confirmed';
            if (!isConfirmed) return false;

            // In-house manufacturing products skip BOM preparation
            const isInHouse =
                order.orderType === 'in_house' ||
                order.order_type === 'in_house' ||
                (typeof order.projectName === 'string' && order.projectName.toLowerCase().startsWith('in-house')) ||
                (typeof order.project_name === 'string' && order.project_name.toLowerCase().startsWith('in-house'));

            if (isInHouse) {
                return false;
            }

            const rawItems = Array.isArray(order.items) ? order.items : [];
            const hasSiteAssembly = rawItems.some((item) => (item.fulfilment_mode || 'site_assembly') === 'site_assembly');
            const isAllInHouse = rawItems.length > 0 && rawItems.every((item) => item.fulfilment_mode === 'in_house_manufacturing');

            if (isAllInHouse || (order.is_in_house_manufacturing && !hasSiteAssembly)) {
                return false;
            }
            return true;
        })
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