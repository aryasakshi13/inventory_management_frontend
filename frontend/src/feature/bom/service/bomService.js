import axios from "axios";

const isLocal = window.location.hostname === 'localhost';

const BASE_URL = isLocal
    ? "http://localhost:5001/api/bom"
    : "https://www.namami-infotech.com/inventory/api/bom";

const PRODUCTS_URL = isLocal
    ? "http://localhost:5001/api/products"
    : "https://www.namami-infotech.com/inventory/api/products";

const ITEMS_URL = isLocal
    ? "http://localhost:5001/api/itemNew"
    : "https://www.namami-infotech.com/inventory/api/itemNew";

// Get all BOMs
export const getBOMs = async () => {
    const response = await axios.get(BASE_URL, { withCredentials: true });
    return response.data;
};

// Get single BOM
export const getBOMById = async (id) => {
    const response = await axios.get(`${BASE_URL}/${id}`, { withCredentials: true });
    return response.data;
};

// Create BOM
export const createBOM = async (payload) => {
    const response = await axios.post(
        `${BASE_URL}/add`,
        payload,
        { withCredentials: true }
    );
    return response.data;
};

// Update BOM
export const updateBOM = async (id, payload) => {
    const response = await axios.put(
        `${BASE_URL}/${id}`,
        payload,
        { withCredentials: true }
    );
    return response.data;
};

// Delete BOM
export const deleteBOM = async (id) => {
    const response = await axios.delete(
        `${BASE_URL}/${id}`,
        { withCredentials: true }
    );
    return response.data;
};

// Get products
export const getProducts = async () => {
    const response = await axios.get(PRODUCTS_URL, { withCredentials: true });
    return response.data;
};

// Create product
export const createProduct = async (payload) => {
    const response = await axios.post(
        `${PRODUCTS_URL}/add`,
        payload,
        { withCredentials: true }
    );
    return response.data;
};

// Get items
export const getItems = async () => {
    const response = await axios.get(ITEMS_URL, { withCredentials: true });
    return response.data;
};