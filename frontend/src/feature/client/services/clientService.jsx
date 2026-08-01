                          
import axios from "axios";

const BASE_URL = "http://localhost:5001/api/client";

console.log("Client Service Base URL:", BASE_URL);

export const getClients = async (params = {}) => {
    const response = await axios.get(`${BASE_URL}/`, {
        params,
    });

    return response.data;
};

export const createClient = async (clientData) => {
  const response = await axios.post(
    `${BASE_URL}/add`,
    clientData,
    {
      withCredentials: true,
    }
  );

  return response.data;
};

export const updateClient = async (id, clientData) => {
        console.log("Updating client:", id);
    const response = await axios.put(`${BASE_URL}/update/${id}`, clientData, {
        withCredentials: true,
    });

    return response.data;
};

















                          