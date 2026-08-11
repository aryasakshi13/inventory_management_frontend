// src/features/clients/pages/ClientDetailPage.jsx


import { getClientById } from "../services/clientService";


import React, { useState,useEffect } from 'react';
import { CLIENT_TAB_CONFIG } from '../constants/clientconstants';
import { OverviewTab } from '../componenets/tabs/overviewTab';
import { OrdersTab } from '../componenets/tabs/ordersTab';
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {AddSalesOrderModal} from '../componenets/AddSalesOrderModal';
import { createSalesOrder } from "../services/salesOrderService";




// Map tab IDs to components
const TAB_COMPONENTS = {
  overview: OverviewTab,
  orders: OrdersTab,
};



export const ClientDetailPage = ({  userRole = 'sales' }) => {

  const navigate = useNavigate();

  const { clientId } = useParams();


    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter tabs by role
  const visibleTabs = CLIENT_TAB_CONFIG.filter((tab) => tab.allowedRoles.includes(userRole));
  const [activeTabId, setActiveTabId] = useState(visibleTabs[0]?.id || 'overview');

  const ActiveComponent = TAB_COMPONENTS[activeTabId] || OverviewTab;

    useEffect(() => {
        const fetchClient = async () => {
            try {
                const response = await getClientById(clientId);
                if(response.success){
                    setClient(response.data);
                }
            } catch(error){

                console.log(
                    "Client fetch error",
                    error
                );

            } finally {
                setLoading(false);
            }

        };
        fetchClient();
    }, [clientId]);

    const handleCreateSalesOrder = async (formData) => {
    try {
      console.log('Submitting Sales Order for Client:');

      const response = await createSalesOrder(formData);
      console.log("Sales Order Created:", response);

      if (response?.success) {
        setIsModalOpen(false);
      } else if (response) {
        setIsModalOpen(false);
      }

      // Optional: refresh orders list in the orders tab after saving
    } catch (error) {
      console.error('Failed to create sales order:', error);
    }
  };

      if(loading){
        return <div>Loading client details...</div>;
    }

      if(!client){
        return <div>Client not found</div>;
    }

     const modalClientData = {
      id: client._id || client.id || clientId,
      name: client.companyName || client.name,
      gstIn: client.gstIn || client.gstin || '',
      billingAddress: client.billingAddress || client.Address || '',
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 mb-4"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      {/* Top Banner */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-xs flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{client?.companyName}</h1>
          <p className="text-sm text-gray-500 mt-1">GSTIN: {client?.gstIn} • Primary Contact: {client?.contactPerson}</p>
        </div>
        <div>
          {userRole === 'sales' && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            onClick={() => setIsModalOpen(true)}>
              + Add Sales Order
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTabId === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Active Tab */}
      <div>
        <ActiveComponent 
        client={client}
        clientId={clientId} />
      </div>

      <AddSalesOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        client={modalClientData} // Dynamic client details passed from API response
        onSubmit={handleCreateSalesOrder}
      />
    </div>
  );
};