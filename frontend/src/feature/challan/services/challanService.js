import axios from 'axios';

const BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5001/api/delivery'
  : 'https://www.namami-infotech.com/inventory/api/delivery';

// Official Delivery Challans API
export const getAllChallans = async () => {
  const response = await axios.get(`${BASE_URL}/official-challans`, {
    withCredentials: true,
  });
  return response.data;
};

export const getChallanById = async (id) => {
  const response = await axios.get(`${BASE_URL}/official-challans/${id}`, {
    withCredentials: true,
  });
  return response.data;
};

export const createChallan = async (payload) => {
  const response = await axios.post(`${BASE_URL}/official-challans`, payload, {
    withCredentials: true,
  });
  return response.data;
};

// Fetch available deliveries to issue a challan against
export const getAvailableDeliveries = async () => {
  const response = await axios.get(`${BASE_URL}/all`, {
    withCredentials: true,
  });
  return response.data;
};

export const getDeliveryById = async (id) => {
  const response = await axios.get(`${BASE_URL}/${id}`, {
    withCredentials: true,
  });
  return response.data;
};

export const fetchOrderDispatchSummary = async (orderId) => {
  const response = await axios.get(`${BASE_URL}/order-summary/${orderId}`, {
    withCredentials: true,
  });
  return response.data;
};

