import axios from 'axios';

const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const BASE_URL = isLocalhost
  ? '/api/quotations'
  : 'https://www.namami-infotech.com/inventory/api/quotations';

export const fetchQuotations = async (params = {}) => {
  const response = await axios.get(BASE_URL, {
    params,
    withCredentials: true,
  });
  return response.data;
};

export const fetchQuotationById = async (id) => {
  const response = await axios.get(`${BASE_URL}/${id}`, {
    withCredentials: true,
  });
  return response.data;
};

export const createQuotation = async (quotationData) => {
  const response = await axios.post(BASE_URL, quotationData, {
    withCredentials: true,
  });
  return response.data;
};

export const createQuotationRevision = async (id, revisionData) => {
  const response = await axios.post(`${BASE_URL}/${id}/revision`, revisionData, {
    withCredentials: true,
  });
  return response.data;
};

export const updateQuotationStatus = async (id, status) => {
  const response = await axios.patch(
    `${BASE_URL}/${id}/status`,
    { status },
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const deleteQuotation = async (id) => {
  const response = await axios.delete(`${BASE_URL}/${id}`, {
    withCredentials: true,
  });
  return response.data;
};
