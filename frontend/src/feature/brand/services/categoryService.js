import axios from 'axios';

const getBaseUrl = () => {
  return window.location.hostname === 'localhost'
    ? 'http://localhost:5001/api/categories'
    : 'https://www.namami-infotech.com/inventory/api/categories';
};

const BASE_URL = getBaseUrl();

// Fetch all categories with optional search & status filter
export const getAllCategories = async (params = {}) => {
  const response = await axios.get(BASE_URL, {
    params,
    withCredentials: true,
  });
  return response.data;
};

// Fetch only active categories for dropdowns
export const getActiveCategories = async () => {
  const response = await axios.get(BASE_URL, {
    params: { activeOnly: true },
    withCredentials: true,
  });
  return response.data;
};

// Fetch next suggested category code (e.g. CAT001)
export const getNextCategoryCode = async () => {
  const response = await axios.get(`${BASE_URL}/next-code`, {
    withCredentials: true,
  });
  return response.data;
};

// Add new category (default status is Active)
export const createCategory = async (categoryData) => {
  const response = await axios.post(BASE_URL, categoryData, {
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

// Update existing category
export const updateCategory = async (id, categoryData) => {
  const response = await axios.put(`${BASE_URL}/${id}`, categoryData, {
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

// Toggle category status (Active / Inactive)
export const toggleCategoryStatus = async (id, currentStatus) => {
  const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
  const response = await axios.patch(`${BASE_URL}/${id}/status`, {
    status: newStatus,
  }, {
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

// Delete category
export const deleteCategory = async (id) => {
  const response = await axios.delete(`${BASE_URL}/${id}`, {
    withCredentials: true,
  });
  return response.data;
};
