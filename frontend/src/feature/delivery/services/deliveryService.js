import axios from 'axios';

// const BASE_URL = 'http://localhost:5001/api/delivery';

const BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5001/api/delivery'
  : 'https://www.namami-infotech.com/inventory/api/delivery';


export const createDeliveryChallan = async (payload) => {
  const response = await axios.post(`${BASE_URL}/add`, payload, {
    withCredentials: true,
  });
  return response.data;
};

export const getAllDeliveryChallans = async () => {
  const response = await axios.get(`${BASE_URL}/all`, {
    withCredentials: true,
  });
  return response.data;
};

export const getDeliveryChallanById = async (id) => {
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

export const getMaterialReceipts = async () => {
  const response = await axios.get(`${BASE_URL}/receipts`, {
    withCredentials: true,
  });
  return response.data;
};

export const acceptDeliveryReceipt = async (challanId, payload) => {
  const response = await axios.post(`${BASE_URL}/${challanId}/accept`, payload, {
    withCredentials: true,
  });
  return response.data;
};

