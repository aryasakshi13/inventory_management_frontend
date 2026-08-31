// src/features/clients/hooks/useClients.js

import { useState, useMemo, useEffect } from 'react';
import { getClients, createClient,updateClient, getClientById } from "../services/clientService";

export function useClients() {
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  // Inline table filters
  const [inlineFilters, setInlineFilters] = useState({
    companyName: '',
    role: '',
    gstIn: '',
    contactPerson: '',
    status: '',
  });
  
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

  const handleInlineFilterChange = (field, value) => {
    setInlineFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearInlineFilters = () => {
    setInlineFilters({
      companyName: '',
      role: '',
      gstIn: '',
      contactPerson: '',
      status: '',
    });
  };

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      // Global search: strictly by Company Name as requested
      const matchesGlobalSearch = searchQuery
        ? client.companyName?.toLowerCase().includes(searchQuery.toLowerCase().trim())
        : true;

      // Inline Header Filters
      const matchesInlineCompany = inlineFilters.companyName
        ? client.companyName?.toLowerCase().includes(inlineFilters.companyName.toLowerCase().trim())
        : true;

      const clientRole = (client.role || '').toLowerCase();
      const matchesInlineRole = inlineFilters.role
        ? clientRole === inlineFilters.role.toLowerCase().trim()
        : true;

      const matchesInlineGst = inlineFilters.gstIn
        ? client.gstIn?.toLowerCase().includes(inlineFilters.gstIn.toLowerCase().trim())
        : true;

      const matchesInlineContact = inlineFilters.contactPerson
        ? client.contactPerson?.toLowerCase().includes(inlineFilters.contactPerson.toLowerCase().trim())
        : true;

      const matchesInlineStatus = inlineFilters.status
        ? client.status === inlineFilters.status
        : true;

      return (
        matchesGlobalSearch &&
        matchesInlineCompany &&
        matchesInlineRole &&
        matchesInlineGst &&
        matchesInlineContact &&
        matchesInlineStatus
      );
    });
  }, [clients, searchQuery, inlineFilters]);



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
    inlineFilters,
    setInlineFilter: handleInlineFilterChange,
    clearInlineFilters: handleClearInlineFilters,
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