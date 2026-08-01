// src/features/clients/pages/ClientListPage.jsx

import React from 'react';
import { useClients } from '../hooks/useClient';
import { ClientFilters } from '../componenets/clientFilter';
import { ClientTable } from '../componenets/clientTable';
import { ClientQuickDrawer } from '../componenets/clientQuickDrawer';
import { ClientFormModal } from '../componenets/clientFormodel';
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import {useState, useEffect } from "react";
import { Pagination } from '@/components/common/pagination';

export const ClientListPage = () => {

  const navigate = useNavigate();
  const location = useLocation();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    clients,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedClient,
    isDrawerOpen,
    isModalOpen,
    editingClient,
    handleOpenDrawer,
    handleCloseDrawer,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleCloseModal,
    handleSaveClient,
  } = useClients();

  
 useEffect(() => {

if(location.state?.fromDrawer && location.state.clientId){

 const client = clients.find(
   c => c.id === location.state.clientId
 );

 if(client){
   handleOpenDrawer(client);
 }

}

},[
 location,
 clients
]);

useEffect(() => {
    setCurrentPage(1);
}, [searchQuery, statusFilter]);



const handleNavigateToDetail = (clientId) => {
    navigate(`/pages/mainModule/clients/${clientId}`);
};

  const totalItems = clients.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Slice clients for current page
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = clients.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500">Manage client profiles, GST information, and sales history.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + Add Client
        </button>
      </div>

      {/* Filter Bar */}
      <ClientFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />


      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
      {/* Main Table */}
      <ClientTable
        // clients={clients}
        clients={paginatedClients}
        onRowClick={handleOpenDrawer}
        onEditClick={handleOpenEditModal}
      />

      {/* Pagination Bar at Table Footer */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={(newPage) => setCurrentPage(newPage)}
        />

      </div>

      {/* Slide-over Side Drawer */}
      <ClientQuickDrawer
        isOpen={isDrawerOpen}
        client={selectedClient}
        onClose={handleCloseDrawer}
        onViewFullProfile={handleNavigateToDetail}
      />

      {/* Form Modal */}
      <ClientFormModal
        isOpen={isModalOpen}
        initialData={editingClient}
        onClose={handleCloseModal}
        onSubmit={handleSaveClient}
      />
    </div>
  );
};