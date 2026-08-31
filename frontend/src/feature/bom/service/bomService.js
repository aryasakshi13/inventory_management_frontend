import axios from "axios";

const BASE_URL = "http://localhost:5001/api/bom";

// Get all BOMs
export const getBOMs = async () => {
    const response = await axios.get(BASE_URL);
    return response.data;
};

// Get single BOM
export const getBOMById = async (id) => {
    const response = await axios.get(`${BASE_URL}/${id}`);
    return response.data;
};

// Create BOM
export const createBOM = async (payload) => {
    const response = await axios.post(
        `${BASE_URL}/add`,
         payload);
    return response.data;
};

// Update BOM
export const updateBOM = async (id, payload) => {
    const response = await axios.put(
        `${BASE_URL}/${id}`,
        payload
    );

    return response.data;
};

// Delete BOM
export const deleteBOM = async (id) => {
    const response = await axios.delete(
        `${BASE_URL}/${id}`
    );

    return response.data;
};

// Get products
export const getProducts = async () => {
    const response = await axios.get(
        "http://localhost:5001/api/products"
    );

    return response.data;
};

// Create product
export const createProduct = async (payload) => {
    const response = await axios.post(
        "http://localhost:5001/api/products/add",
        payload
    );

    return response.data;
};

// Get items
export const getItems = async () => {
    const response = await axios.get(
        "http://localhost:5001/api/itemNew"
    );

    return response.data;
};