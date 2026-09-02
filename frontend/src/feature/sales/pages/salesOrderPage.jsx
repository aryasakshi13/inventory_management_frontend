import { useState, useEffect } from 'react';
import { useSalesOrder } from '../hooks/useSalesOrder';
import { SalesOrderFilter } from '../component/salesOrderFilter';
import { SalesOrderTable } from '../component/salesOrderTable';
import { getClients } from "../../client/services/clientService";
import { createSalesOrder } from '../../client/services/salesOrderService';
import { Pagination } from '../../../components/common/pagination';
import { ViewSalesOrderItemsModal } from '../../client/componenets/ViewSalesOrderItemsModal';
import { exportSalesOrdersReport } from '../../../utils/exportReport';

// REUSING YOUR MODAL FROM CLIENT SECTION HERE:
import { AddSalesOrderModal } from '../../client/componenets/AddSalesOrderModal';

export const SalesOrderPage = () => {
  const {
    orders,
    loading,
    searchQuery,
    setSearchQuery,
    inlineFilters,
    setInlineFilter,
    clearInlineFilters,
    resetFilters,
    addOrder,
    updateOrderStatus,
  } = useSalesOrder();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role || user.Role || '';

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
        const response = await getClients({ role: 'client', limit: 100 });
        const list = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
        const clientsOnly = list.filter(c => (c?.role ?? '').toString().trim().toLowerCase() === 'client');
        setClients(clientsOnly);
      } catch (err) {
        console.error('Error fetching clients for sales order:', err);
      }
    };

    fetchClients();
  }, []);

  // Reset to first page when orders, search query, or inline filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, inlineFilters, orders.length]);

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

  const hasAnyFilter = Boolean(
    searchQuery ||
    inlineFilters?.orderId ||
    inlineFilters?.clientName ||
    inlineFilters?.projectIncharge ||
    inlineFilters?.poDate ||
    inlineFilters?.poNo ||
    inlineFilters?.status
  );

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Sales Orders</h1>
          <p className="text-xs text-gray-500">Manage, track, and process customer sales orders</p>
        </div>
      </div>

      {/* Filter Component (Global Client Search + Clear All) */}
      <SalesOrderFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        hasActiveFilters={hasAnyFilter}
        onClearAll={resetFilters}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onDownloadReport={() => exportSalesOrdersReport(orders)}
      />

      {/* Table Component */}
      {loading ? (
        <div className="p-6 text-center text-xs text-gray-500">Loading sales orders...</div>
      ) : (
        <>
          <SalesOrderTable
            orders={orders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
            inlineFilters={inlineFilters}
            setInlineFilter={setInlineFilter}
            clearInlineFilters={clearInlineFilters}
            onSelectOrder={handleSelectOrder}
            onQuickView={handleSelectOrder}
            onStatusChange={updateOrderStatus}
            userRole={userRole}
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