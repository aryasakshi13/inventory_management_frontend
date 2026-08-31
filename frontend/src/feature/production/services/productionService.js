import axios from 'axios';

const getBaseUrl = () => {
  return window.location.hostname === 'localhost'
    ? 'http://localhost:5001/api/production'
    : 'https://www.namami-infotech.com/inventory/api/production';
};

const BASE_URL = getBaseUrl();

// Fetch all production tasks with filters
export const getAllProductionTasks = async (params = {}) => {
  const response = await axios.get(BASE_URL, {
    params,
    withCredentials: true,
  });
  return response.data;
};

// Fetch next suggested task ID (e.g. PRD-001)
export const getNextTaskId = async () => {
  const response = await axios.get(`${BASE_URL}/next-id`, {
    withCredentials: true,
  });
  return response.data;
};

// Fetch single production task by ID
export const getProductionTaskById = async (id) => {
  const response = await axios.get(`${BASE_URL}/${id}`, {
    withCredentials: true,
  });
  return response.data;
};

// Create a new production task
export const createProductionTask = async (taskData) => {
  const response = await axios.post(BASE_URL, taskData, {
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

// Update production task details
export const updateProductionTask = async (id, taskData) => {
  const response = await axios.put(`${BASE_URL}/${id}`, taskData, {
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

// Issue Materials from Store to Production
export const issueMaterialsToProduction = async (id, payload = {}) => {
  const response = await axios.post(`${BASE_URL}/${id}/issue-materials`, payload, {
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

// Record Finished Goods & Output
export const recordFinishedGoods = async (id, payload) => {
  const response = await axios.post(`${BASE_URL}/${id}/record-output`, payload, {
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

// Update Production Status
export const updateProductionStatus = async (id, status) => {
  const response = await axios.patch(`${BASE_URL}/${id}/status`, { status }, {
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

// Delete Production Task
export const deleteProductionTask = async (id) => {
  const response = await axios.delete(`${BASE_URL}/${id}`, {
    withCredentials: true,
  });
  return response.data;
};
