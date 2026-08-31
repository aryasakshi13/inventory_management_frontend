import axios from 'axios';

const getBaseUrl = () => {
  return window.location.hostname === 'localhost'
    ? 'http://localhost:5001/api/brands'
    : 'https://www.namami-infotech.com/inventory/api/brands';
};

const BASE_URL = getBaseUrl();

// Fetch all brands with optional filters
export const getAllBrands = async (params = {}) => {
  const response = await axios.get(BASE_URL, {
    params,
    withCredentials: true,
  });
  return response.data;
};

// Fetch only active brands for dropdowns
export const getActiveBrands = async () => {
  const response = await axios.get(BASE_URL, {
    params: { activeOnly: true },
    withCredentials: true,
  });
  return response.data;
};

// Fetch next suggested brand code (e.g. BRD001)
export const getNextBrandCode = async () => {
  const response = await axios.get(`${BASE_URL}/next-code`, {
    withCredentials: true,
  });
  return response.data;
};

// Add new brand (default status is Active)
export const createBrand = async (brandData) => {
  const response = await axios.post(BASE_URL, brandData, {
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

// Update existing brand
export const updateBrand = async (id, brandData) => {
  const response = await axios.put(`${BASE_URL}/${id}`, brandData, {
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

// Toggle brand status (Active / Inactive)
export const toggleBrandStatus = async (id, currentStatus) => {
  const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
  const response = await axios.patch(`${BASE_URL}/${id}/status`, {
    status: newStatus,
  }, {
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

// Delete brand
export const deleteBrand = async (id) => {
  const response = await axios.delete(`${BASE_URL}/${id}`, {
    withCredentials: true,
  });
  return response.data;
};
