import axios from 'axios';

// const BASE_URL = 'http://localhost:5001/api/purchase-order';

const BASE_URL = window.location.hostname === 'localhost'
            ? 'http://localhost:5001/api/purchase-order'
            : 'https://www.namami-infotech.com/inventory/api/purchase-order';



export const createPurchaseOrder = async (purchaseData) => {

  console.log('createPurchaseOrder calleddwdwedwqewqewqe', purchaseData);
  const response = await axios.post(`${BASE_URL}/add`, purchaseData, {
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  console.log('createPurchaseOrder response', response);
  return response.data;
};


export const getPurchaseOrders = async ({
  page = 1,
  limit = 10,
  search = '',
  fromDate = '',
  toDate = '',
} = {}) => {
  console.log('getPurchaseOrders called', {
    page,
    limit,
    search,
    fromDate,
    toDate,
  });

  const response = await axios.get(`${BASE_URL}/all`, {
    withCredentials: true,
    params: {
      page,
      limit,
      search: search || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    },
  });

  console.log('getPurchaseOrders response', response);

  return response.data;
};

// export const getPurchaseOrders = async () => {
//   console.log('getPurchaseOrders called');

  

//   const response = await axios.get(`${BASE_URL}/all`, {
//     withCredentials: true,
//   });

//   console.log('getPurchaseOrders response', response);
//   return response.data;
// };