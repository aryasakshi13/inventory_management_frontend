import axios from "axios";


// const BASE_URL = "http://localhost:5001/api/sales";
const BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5001/api/sales'
    : 'https://www.namami-infotech.com/inventory/api/sales';


console.log("Sales Order Service Base URL:", BASE_URL);



const AUTH_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5001/api/auth'
    : 'https://www.namami-infotech.com/inventory/api/auth';

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

export const getProjectIncharges = async () => {
    const response = await axios.get(
        `${AUTH_BASE_URL}/employees`,
        {
            params: { role: 'project incharge' },
            withCredentials: true,
        }
    );

    return response.data;
};