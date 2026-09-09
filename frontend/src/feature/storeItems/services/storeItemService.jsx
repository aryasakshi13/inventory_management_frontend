import axios from 'axios';

// const BASE_URL = 'http://localhost:5001/api/store-items';

const BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5001/api/store-items'
  : 'https://www.namami-infotech.com/inventory/api/store-items';


// Add new store item
export const addStoreItem = async (itemData) => {
  console.log('addStoreItem called:', itemData);
  const response = await axios.post(`${BASE_URL}/add`, itemData, {
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  console.log('addStoreItem response:', response);
  return response.data;
};

// Get all store items
export const getAllStoreItems = async () => {
  const response = await axios.get(`${BASE_URL}`, {
    withCredentials: true,
  });
  return response.data;
};

// Get single store item by ID
export const getStoreItemById = async (id) => {
  const response = await axios.get(`${BASE_URL}/${id}`, {
    withCredentials: true,
  });
  return response.data;
};

// Update store item by ID
export const updateStoreItem = async (id, itemData) => {
  console.log('updateStoreItem called:', id, itemData);
  try {
    const response = await axios.put(`${BASE_URL}/update/${id}`, itemData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (err) {
    // Fallback if /update/:id is not found
    const response = await axios.put(`${BASE_URL}/${id}`, itemData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  }
};

// Delete store item by ID
export const deleteStoreItem = async (id) => {
  console.log('deleteStoreItem called:', id);
  try {
    const response = await axios.delete(`${BASE_URL}/delete/${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (err) {
    const response = await axios.delete(`${BASE_URL}/${id}`, {
      withCredentials: true,
    });
    return response.data;
  }
};