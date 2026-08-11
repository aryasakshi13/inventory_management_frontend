// src/features/clients/components/tabs/OrdersTab.jsx
import React from 'react';
import { useState, useEffect } from 'react';
import { getSalesOrdersByClientId } from '../../services/clientService';
import {ViewSalesOrderItemsModal} from "../ViewSalesOrderItemsModal";
import { Eye } from "lucide-react";
import { Pagination } from '../../../../components/common/pagination';


export const OrdersTab = ({ clientId }) => {

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);

    // Pagination state (client-side)
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    useEffect(() => {

        if (!clientId) return;


        const fetchOrders = async () => {

            try {
                console.log("Fetching orders for client:", clientId);

                setLoading(true);

                const data = await getSalesOrdersByClientId(clientId);

                console.log("API Orders:", data.data);
                console.log("Orders Count:", data.data.length);

                setOrders(data.data);

                // reset to first page when new data is loaded
                setCurrentPage(1);

                console.log("Orders State:", data.data);


            } catch (error) {

                console.log(error);
                setError("Failed to load orders");

            }
            finally {
                setLoading(false);
            }

        };


        fetchOrders();


    }, [clientId]);

    const handleViewItems = (order) => {
        setSelectedOrder(order);
        setIsItemsModalOpen(true);
    };

    // pagination calculations
    const totalItems = orders?.length || 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const paginatedOrders = orders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-xs">

            <h3 className="text-base font-semibold text-gray-900 mb-4">
                Sales Order History
            </h3>


                        <div className="overflow-x-auto">
                            <div className="max-h-72 overflow-y-auto">
                                <table className="w-full text-left text-sm">

                                    <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase sticky top-0 z-10">

                    <tr>
                        <th className="p-3">SNo</th>
                        <th className="p-3">Order ID</th>
                        <th className="p-3">Shipping Address</th>
                        <th className="p-3">Total Amount</th>
                        <th className="p-3">PO No</th>
                        <th className="p-3">PO Date</th>
                        <th className="p-3">PO Copy</th>
                        <th className="p-3">Status</th>

                    </tr>

                  </thead>


                  <tbody className="divide-y divide-gray-100">

                    {
                        paginatedOrders.map((order) => (

                            <tr key={order.Id}>
                                 
                                 <td className="p-3 font-mono  text-blue-600">
                                    {order.sn}
                                </td>
  

                                <td className="p-3 font-mono  text-blue-600">
                                    {order.Id}
                                </td>

                                <td className="p-3 text-black">
                                    {order.shippingAddress}
                                </td>


                                <td className="p-3 text-black">
                                    ₹{order.totalAmount}
                                </td>

                                <td className="p-3 text-black">
                                    {order.poNo}
                                </td>


                                <td className="p-3 text-black">
                                    {order.poDate}
                                </td>


                                <td className="p-3 text-blue-600 cursor-pointer">
                                    {order.poCopy}
                                </td>


                                <td className="p-3 text-black">

                                    <span className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-800">
                                        {order.status}
                                    </span>

                                </td>

                                <td className="p-3">
                                    <button
                                        onClick={() => handleViewItems(order)}
                                        className="p-2 rounded-md hover:bg-blue-50 text-blue-600 transition"
                                        title="View Items"
                                    >
                                        <Eye size={18} />
                                    </button>
                                </td>

                            </tr>

                                                ))
                                        }


                                    </tbody>

                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="mt-3">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalItems={totalItems}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={(p) => setCurrentPage(Math.max(1, Math.min(totalPages, p)))}
                                />
                            </div>

                        </div>

            <ViewSalesOrderItemsModal
                isOpen={isItemsModalOpen}
                onClose={() => setIsItemsModalOpen(false)}
                order={selectedOrder}
            />


        </div>

    );

};