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
