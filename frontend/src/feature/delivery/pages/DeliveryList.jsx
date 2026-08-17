import React, { useState, useEffect } from 'react';
import { Plus, Eye, Truck } from 'lucide-react';
import { getAllDeliveryChallans } from '../services/deliveryService';



export const DeliveryList = ({ onAddNew, onViewChallan }) => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const res = await getAllDeliveryChallans();
      console.log(res,"sasasasasasas")
      if (res?.data) {
        setDeliveries(res.data);
      } else if (Array.isArray(res)) {
        setDeliveries(res);
      }
    } catch (err) {
      console.error('Failed to fetch delivery challans:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Truck size={22} className="text-blue-600" />
            Delivery Challans
          </h1>
          <p className="text-xs text-gray-500">Track all outward shipments and partial delivery statuses</p>
        </div>

        <button
          onClick={onAddNew}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-sm transition"
        >
          <Plus size={16} /> New Delivery
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-gray-500">Loading delivery records...</div>
        ) : deliveries.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500">No delivery challans found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Challan No</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Dispatch Date</th>
                  <th className="py-3 px-4 text-right">Ordered Qty</th>
                  <th className="py-3 px-4 text-right">Delivered Qty</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {deliveries.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/70">
                    <td className="py-3 px-4 font-bold text-blue-600">{item.challan_no}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-800">{item.customer_name}</div>
                      <div className="text-[11px] text-gray-400">{item.customer_phone || '-'}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(item.dispatch_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono  text-gray-800">{item.total_ordered_qty}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                      {item.total_delivered_qty}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          item.status === 'Fully Delivered'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onViewChallan && onViewChallan(item.id)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};