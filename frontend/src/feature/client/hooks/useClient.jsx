// src/features/clients/hooks/useClients.js

import { useState, useMemo, useEffect } from 'react';
import { getClients, createClient,updateClient, getClientById } from "../services/clientService";

export function useClients() {
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  
  // Drawer & Modal states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);


  
useEffect(() => {
    fetchClients();
 }, []);

const fetchClients = async () => {
    try {
        const response = await getClients();

        if (response.success) {
            setClients(response.data);
        }
    } catch (err) {
        console.error(err);
    }
};

  
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      console.log("client data is here ",clients);
      const matchesSearch =
        client.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.gstIn?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter ? client.status === statusFilter : true;

      return matchesSearch && matchesStatus;
    });
  }, [clients, searchQuery, statusFilter]);



  // Handlers
  const handleOpenDrawer = (client) => {
    setSelectedClient(client);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleOpenCreateModal = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (client) => {
    console.log("Editing client:", client);
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };


  
   const handleSaveClient = async (formData) => {

    try {

          const payload = {
            companyName: formData.companyName,
            contactPerson: formData.contactPerson,
            Phone: formData.Phone,
            emailId: formData.emailId,
            gstIn: formData.gstIn,
            Address: formData.Address,
            status: formData.status,
            role: formData.role || 'client'
          };

        if (editingClient) {

            // Update API (later)
              const response = await updateClient(editingClient.id, payload);

              if (response.success) {
                  await fetchClients();
                  handleCloseModal();
              }
  
        } else {

            const response = await createClient(payload);

            if (response.success) {

                await fetchClients();

                handleCloseModal();
            }
        }

    } catch (error) {

        console.error(error);

        alert(error.response?.data?.message || "Something went wrong");
    }
};

  return {
    clients: filteredClients,
    totalCount: clients.length,
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
  };
}