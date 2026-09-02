import axios from 'axios';

const getBaseUrl = () => {
  return window.location.hostname === 'localhost'
    ? 'http://localhost:5001/api/employees'
    : 'https://www.namami-infotech.com/inventory/api/employees';
};

const BASE_URL = getBaseUrl();

// Fetch employees with backend query params
export const getAllEmployees = async (params = {}) => {
  const response = await axios.get(BASE_URL, {
    params, // Sends ?search=...&role=...&status=... to backend
    withCredentials: true,
  });
  return response.data;
};

// Add new employee
export const createEmployee = async (employeeData) => {
  const response = await axios.post(`${BASE_URL}/add`, employeeData, {
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

// Update existing employee
export const updateEmployee = async (id, employeeData) => {
  const response = await axios.put(`${BASE_URL}/${id}`, employeeData, {
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

// Toggle or update status (Active / Inactive)
export const toggleEmployeeStatus = async (id, currentStatus) => {
  const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
  const response = await axios.put(`${BASE_URL}/${id}/status`, {
    employee_status: newStatus,
    status: newStatus.toLowerCase()
  }, {
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

// Delete employee
export const deleteEmployee = async (id) => {
  const response = await axios.delete(`${BASE_URL}/${id}`, {
    withCredentials: true,
  });
  return response.data;
};

// Fetch all roles
export const getRoles = async () => {
  const response = await axios.get(`${BASE_URL}/roles`, {
    withCredentials: true,
  });
  return response.data;
};
 
export const getNextEmployeeCode = async () => {
  const response = await axios.get(`${BASE_URL}/next-code`, {
    withCredentials: true,
  });
  return response.data; // returns { success: true, employee_code: "EMP0001" }
};