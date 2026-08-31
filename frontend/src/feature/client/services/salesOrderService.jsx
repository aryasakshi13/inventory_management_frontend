import axios from "axios";

const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const BASE_URL = isLocalhost
    ? '/api/sales'
    : 'https://www.namami-infotech.com/inventory/api/sales';

console.log("Sales Order Service Base URL:", BASE_URL);

const AUTH_BASE_URL = isLocalhost
    ? 'http://localhost:5001/api/employees'
    : 'https://www.namami-infotech.com/inventory/api/auth';

const PRODUCT_BASE_URL = isLocalhost
    ? '/api/products'
    : 'https://www.namami-infotech.com/inventory/api/products';

export const fetchSalesOrders = async (params = {}) => {
    const response = await axios.get(
        `${BASE_URL}/all`,
        {
            params,
            withCredentials: true,
        }
    );

    return response.data;
};

export const createSalesOrder = async (formData) => {
    const response = await axios.post(
        `${BASE_URL}/add`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data"
            },
            withCredentials: true,
        }
    );

    return response.data;
};

export const updateSalesOrder = async (id, orderData) => {
    const response = await axios.patch(
        `${BASE_URL}/update/${id}`,
        orderData,
        {
            withCredentials: true,
        }
    );

    return response.data;
};

export const getProjectIncharges = async () => {
    const response = await axios.get(
        `${AUTH_BASE_URL}/`,
        {
            params: { role: 'Site Engineer' },
            withCredentials: true,
        }
    );

    return response.data;
};

export const getProducts = async () => {
    const response = await axios.get(
        `${PRODUCT_BASE_URL}`,
        {
            withCredentials: true,
        }
    );

    return response.data;
};