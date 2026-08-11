import React, { useState, useEffect } from 'react';
import { useSalesOrder } from '../hooks/useSalesOrder';
import { SalesOrderFilter } from '../component/salesOrderFilter';
import { SalesOrderTable } from '../component/salesOrderTable';
import { getClients } from "../../client/services/clientService";
import { createSalesOrder } from '../../client/services/salesOrderService';
import { Pagination } from '../../../components/common/pagination';
import { ViewSalesOrderItemsModal } from '../../client/componenets/ViewSalesOrderItemsModal';

// REUSING YOUR MODAL FROM CLIENT SECTION HERE:
import { AddSalesOrderModal } from '../../client/componenets/AddSalesOrderModal';

export const SalesOrderPage = () => {
  const {
    orders,
    loading,
    searchQuery,
    setSearchQuery,
    resetFilters,
    addOrder,
  } = useSalesOrder();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Pagination state (client-side)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;


  const [clients, setClients] = useState([]);



useEffect(() => {
  const fetchClients = async () => {
    try {
      const response = await getClients();

      console.log("Clients API Response:", response);

      setClients(response?.data ?? response);
    } catch (err) {
      console.error(err);
    }
  };

  fetchClients();
}, []);

// Reset to first page when the orders or search query change
useEffect(() => {
  setCurrentPage(1);
}, [searchQuery, orders.length]);

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const handleCreateSubmit = async (formData) => {
    try {
      const response = await createSalesOrder(formData);
      const createdOrder = response?.data ?? response;

      if (response?.success && response.data) {
        addOrder(response.data);
      } else if (createdOrder && typeof createdOrder === 'object') {
        addOrder(createdOrder);
      }

      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create sales order:', error);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sales Orders</h1>
          <p className="text-xs text-gray-500">Manage, track, and process customer sales orders</p>
        </div>
      </div>

      {/* Filter Component */}
      <SalesOrderFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        resetFilters={resetFilters}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Table Component */}
      {loading ? (
        <div className="p-6 text-center text-xs text-gray-500">Loading sales orders...</div>
      ) : (
        <>
          <SalesOrderTable
            orders={orders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
            onSelectOrder={handleSelectOrder}
            onQuickView={handleSelectOrder}
          >
            <Pagination
              currentPage={currentPage}
              totalPages={Math.max(1, Math.ceil((orders?.length || 0) / itemsPerPage))}
              totalItems={orders?.length || 0}
              itemsPerPage={itemsPerPage}
              onPageChange={(p) => setCurrentPage(Math.max(1, Math.min(Math.max(1, Math.ceil((orders?.length || 0) / itemsPerPage)), p)))}
            />
          </SalesOrderTable>
        </>
      )}

      {/* Reused Create Sales Order Modal from client directory */}
      <AddSalesOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        clients={clients}
      />

      {/* View Sales Order Items Modal */}
      <ViewSalesOrderItemsModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        order={selectedOrder}
      />

      {/* View Sales Order Details Modal */}
      {/* <ViewSalesOrderModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        order={selectedOrder}
      /> */}
    </div>
  );
};