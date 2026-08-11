import { useState, useEffect, useMemo } from 'react';
import { fetchSalesOrders } from '../../client/services/salesOrderService';

export const useSalesOrder = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('');

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      try {
        const res = await fetchSalesOrders();
        const data = res?.data ?? res;
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching sales orders:', err);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const q = searchQuery.toLowerCase().trim();
      const orderId = (order.orderId ?? order.Id ?? '').toString().trim();
      const clientName = (order.clientName ?? '').toString().toLowerCase();
      const poNo = (order.poNo ?? '').toString().toLowerCase();
      const isNumericQuery = /^[0-9]+$/.test(q);
      const orderIdExactMatch = orderId === q;
      const orderIdContainsMatch = !isNumericQuery && orderId.toLowerCase().includes(q);
      const matchesQuery =
        !q ||
        orderIdExactMatch ||
        orderIdContainsMatch ||
        clientName.includes(q) ||
        poNo.includes(q);

   
      const matchesClient =
        !clientFilter || clientName === clientFilter.toLowerCase();

      return matchesQuery && matchesClient;
    });
  }, [orders, searchQuery, clientFilter]);

  const addOrder = (newOrder) => {
    setOrders((prev) => [newOrder, ...prev]);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setClientFilter('');
  };

  return {
    orders: filteredOrders,
    loading,
    searchQuery,
    setSearchQuery,
      clientFilter,
      setClientFilter,
    resetFilters,
    addOrder,
  };
};