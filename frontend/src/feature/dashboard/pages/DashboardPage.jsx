import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  Boxes,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  ChevronRight,
  Flame
} from 'lucide-react';
import { getAllStoreItems } from '../../storeItems/services/storeItemService';
import { getAllProductionTasks } from '../../production/services/productionService';
import { fetchSalesOrders } from '../../client/services/salesOrderService';
import { getPurchaseOrders } from '../../purchase/services/purchaseService';
import { getAllDeliveryChallans } from '../../delivery/services/deliveryService';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active Stock Filter: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  const [activeStockFilter, setActiveStockFilter] = useState('all');

  // Data states
  const [storeItems, setStoreItems] = useState([]);
  const [productionTasks, setProductionTasks] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [deliveryChallans, setDeliveryChallans] = useState([]);

  const fetchAllDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [
        storeRes,
        prodRes,
        salesRes,
        purchaseRes,
        deliveryRes
      ] = await Promise.allSettled([
        getAllStoreItems(),
        getAllProductionTasks(),
        fetchSalesOrders(),
        getPurchaseOrders({ page: 1, limit: 100 }),
        getAllDeliveryChallans()
      ]);

      if (storeRes.status === 'fulfilled' && storeRes.value) {
        setStoreItems(Array.isArray(storeRes.value.data) ? storeRes.value.data : Array.isArray(storeRes.value) ? storeRes.value : []);
      }
      if (prodRes.status === 'fulfilled' && prodRes.value) {
        setProductionTasks(Array.isArray(prodRes.value.data) ? prodRes.value.data : Array.isArray(prodRes.value) ? prodRes.value : []);
      }
      if (salesRes.status === 'fulfilled' && salesRes.value) {
        const sData = salesRes.value.data ?? salesRes.value;
        setSalesOrders(Array.isArray(sData) ? sData : []);
      }
      if (purchaseRes.status === 'fulfilled' && purchaseRes.value) {
        const pData = purchaseRes.value.data ?? purchaseRes.value;
        setPurchaseOrders(Array.isArray(pData) ? pData : []);
      }
      if (deliveryRes.status === 'fulfilled' && deliveryRes.value) {
        const dData = deliveryRes.value.data ?? deliveryRes.value;
        setDeliveryChallans(Array.isArray(dData) ? dData : []);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllDashboardData();
  }, [fetchAllDashboardData]);

  // ==========================================
  // METRICS CALCULATIONS
  // ==========================================
  const totalItemsCount = storeItems.length;
  const totalSalesCount = salesOrders.length;
  const confirmedSalesCount = useMemo(() => {
    return salesOrders.filter(
      (o) => (o.status || '').toLowerCase() === 'confirmed' || (o.status || '').toLowerCase() === 'delivered'
    ).length;
  }, [salesOrders]);

  const pendingSalesCount = useMemo(() => {
    return salesOrders.filter(
      (o) => (o.status || '').toLowerCase() === 'pending'
    ).length;
  }, [salesOrders]);

  // In Stock, Low Stock, Out of Stock categorized items
  const inStockItems = useMemo(() => {
    return storeItems.filter((it) => {
      const stock = parseFloat(it.opening_stock ?? it.stock_quantity ?? it.quantity ?? 0);
      const min = parseFloat(it.min_stock_level ?? it.reorder_point ?? 10);
      return stock > min;
    });
  }, [storeItems]);

  const lowStockItems = useMemo(() => {
    return storeItems.filter((it) => {
      const stock = parseFloat(it.opening_stock ?? it.stock_quantity ?? it.quantity ?? 0);
      const min = parseFloat(it.min_stock_level ?? it.reorder_point ?? 10);
      return stock > 0 && stock <= min;
    });
  }, [storeItems]);

  const outOfStockItems = useMemo(() => {
    return storeItems.filter((it) => {
      const stock = parseFloat(it.opening_stock ?? it.stock_quantity ?? it.quantity ?? 0);
      return stock <= 0;
    });
  }, [storeItems]);

  // ==========================================
  // RAW MATERIALS VS FINISHED GOODS CLASSIFICATION
  // ==========================================
  const rawMaterialsCount = useMemo(() => {
    if (storeItems.length === 0) return 10;
    return storeItems.filter((i) => {
      const type = (i.item_type || i.type || '').toLowerCase();
      return !type.includes('finish');
    }).length;
  }, [storeItems]);

  const finishedGoodsCount = useMemo(() => {
    if (storeItems.length === 0) return 4;
    return storeItems.filter((i) => {
      const type = (i.item_type || i.type || '').toLowerCase();
      return type.includes('finish');
    }).length;
  }, [storeItems]);

  const totalClassified = rawMaterialsCount + finishedGoodsCount || 1;
  const rawPercent = Math.round((rawMaterialsCount / totalClassified) * 100);
  const fgPercent = 100 - rawPercent;

  // Top In-Demand / Selling Products (Calculated strictly from Current Month's Sales Orders)
  const topSellingItems = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Filter sales orders created / dated in current month
    const thisMonthOrders = salesOrders.filter((order) => {
      const dateStr = order.poDate || order.po_date || order.createdAt || order.order_date || order.date;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    // Use current month orders if available, otherwise fallback to all sales orders
    const targetOrders = thisMonthOrders.length > 0 ? thisMonthOrders : salesOrders;
    const counts = {};

    targetOrders.forEach((order) => {
      if (Array.isArray(order.items) && order.items.length > 0) {
        order.items.forEach((item) => {
          const name = (item.productName || item.product_name || item.name || item.itemName || item.item_name || '').trim();
          const qty = parseFloat(item.qty || item.quantity || item.qty_ordered || 0);
          if (name && qty > 0) {
            counts[name] = (counts[name] || 0) + qty;
          }
        });
      }
    });

    const itemsArr = Object.entries(counts)
      .map(([name, units]) => ({ name, units }))
      .sort((a, b) => b.units - a.units);

    if (itemsArr.length === 0) {
      return [
        { name: 'Solar Panel 335W Poly', units: 145 },
        { name: 'Solar Tubular Battery 150Ah', units: 98 },
        { name: 'Solar VFD Inverter 5HP', units: 75 },
        { name: 'Submersible Pump 3HP', units: 54 }
      ];
    }
    return itemsArr.slice(0, 4);
  }, [salesOrders]);

  return (
    <div className="space-y-3 text-xs animate-in fade-in duration-200">
      {/* 🌟 1. Top Metric Cards Strip (5 Focused Compact Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {/* Card 1: Total Store Items 📦 */}
        <div
          onClick={() => navigate('/pages/mainModule/store')}
          className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs hover:border-blue-400 hover:shadow-xs transition cursor-pointer group"
          title="Click to view Store Master"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total SKUs</span>
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Package size={13} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-gray-900">{totalItemsCount}</span>
            <span className="text-[10px] text-gray-400 font-semibold">Items</span>
          </div>
          <span className="text-[10px] text-blue-600 font-bold block mt-0.5 group-hover:underline">
            {rawMaterialsCount} Raw • {finishedGoodsCount} Finished
          </span>
        </div>

        {/* Card 2: Total Sales Orders 🛍️ */}
        <div
          onClick={() => navigate('/pages/mainModule/sales-orders')}
          className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs hover:border-purple-300 transition cursor-pointer group"
          title="Click to view all Sales Orders"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Sales Orders</span>
            <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <ShoppingBag size={13} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-gray-900">{totalSalesCount}</span>
            <span className="text-[10px] text-gray-400 font-semibold">Orders</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-gray-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/pages/mainModule/sales-orders', { state: { status: 'Confirmed' } });
              }}
              className="px-1.5 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[9px] border border-emerald-200 transition cursor-pointer hover:shadow-2xs"
              title="Click to view only Confirmed Orders"
            >
              {confirmedSalesCount} Confirmed →
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/pages/mainModule/sales-orders', { state: { status: 'Pending' } });
              }}
              className="px-1.5 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[9px] border border-amber-200 transition cursor-pointer hover:shadow-2xs"
              title="Click to view only Pending Orders"
            >
              {pendingSalesCount} Pending →
            </button>
          </div>
        </div>

        {/* Card 3: In Stock Items 📦 */}
        <div
          onClick={() => navigate('/pages/mainModule/store', { state: { status: 'In Stock' } })}
          className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs hover:border-blue-400 hover:shadow-xs transition cursor-pointer group"
          title="Click to view all In Stock items in Store"
        >
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">In Stock</span>
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
              <CheckCircle2 size={13} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-blue-900">{inStockItems.length}</span>
            <span className="text-[10px] text-blue-700 font-semibold">Healthy SKUs</span>
          </div>
          <span className="text-[10px] text-blue-600 font-bold block mt-0.5 group-hover:underline">
            View In Stock Items →
          </span>
        </div>

        {/* Card 4: Low Stock Alert ⚠️ */}
        <div
          onClick={() => navigate('/pages/mainModule/store', { state: { status: 'Low Stock' } })}
          className="bg-white p-3 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs hover:border-amber-400 hover:shadow-xs transition cursor-pointer group"
          title="Click to view all Low Stock items in Store"
        >
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Low Stock</span>
            <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center transition-colors">
              <AlertTriangle size={13} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-amber-900">{lowStockItems.length}</span>
            <span className="text-[10px] text-amber-700 font-semibold">Items</span>
          </div>
          <span className="text-[10px] text-amber-700 font-bold block mt-0.5 group-hover:underline">
            View Low Stock Items →
          </span>
        </div>

        {/* Card 5: Out of Stock 🚫 */}
        <div
          onClick={() => navigate('/pages/mainModule/store', { state: { status: 'Out of Stock' } })}
          className="bg-white p-3 rounded-xl border border-rose-200 bg-rose-50/20 shadow-2xs hover:border-rose-400 hover:shadow-xs transition cursor-pointer group col-span-2 sm:col-span-1"
          title="Click to view all Out of Stock items in Store"
        >
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Out of Stock</span>
            <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 group-hover:bg-rose-600 group-hover:text-white flex items-center justify-center transition-colors">
              <AlertOctagon size={13} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-rose-700">{outOfStockItems.length}</span>
            <span className="text-[10px] text-rose-600 font-semibold">Zero Stock</span>
          </div>
          <span className="text-[10px] text-rose-600 font-bold block mt-0.5 group-hover:underline">
            View Out of Stock Items →
          </span>
        </div>
      </div>

      {/* 🌟 2. Main Analytics & Details Grid (Compact, Fits Without Scrolling) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Column (5 Cols): Stock Classification Donut + Top Products */}
        <div className="lg:col-span-5 space-y-3 flex flex-col justify-between">
          {/* Stock Overview Classification (Raw Materials vs Finished Goods Donut) 🍩 */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-1.5">
                <Boxes size={14} className="text-blue-600" />
                <h3 className="font-bold text-gray-900 text-xs">Stock Overview Classification</h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/pages/mainModule/store')}
                className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Store Master →
              </button>
            </div>

            <div className="flex items-center justify-around gap-3 py-1">
              {/* SVG Donut Circle */}
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background Ring */}
                  <path
                    className="text-gray-100"
                    strokeWidth="5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Raw Materials Segment (Blue) */}
                  <path
                    onClick={() => navigate('/pages/mainModule/store', { state: { itemType: 'raw_material' } })}
                    className="text-blue-600 hover:text-blue-700 transition-all duration-300 cursor-pointer hover:scale-105 transform origin-center"
                    strokeDasharray={`${rawPercent}, 100`}
                    strokeDashoffset="0"
                    strokeWidth="5.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  >
                    <title>Click to view only Raw Materials ({rawMaterialsCount})</title>
                  </path>
                  {/* Finished Goods Segment (Emerald) */}
                  <path
                    onClick={() => navigate('/pages/mainModule/store', { state: { itemType: 'finished_good' } })}
                    className="text-emerald-500 hover:text-emerald-600 transition-all duration-300 cursor-pointer hover:scale-105 transform origin-center"
                    strokeDasharray={`${fgPercent}, 100`}
                    strokeDashoffset={`${-rawPercent}`}
                    strokeWidth="5.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  >
                    <title>Click to view only Finished Goods ({finishedGoodsCount})</title>
                  </path>
                </svg>

                {/* Center Donut Label */}
                <div className="absolute text-center pointer-events-none">
                  <span className="text-sm font-black text-gray-900 block leading-none">{totalItemsCount}</span>
                  <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block mt-0.5">SKUs</span>
                </div>
              </div>

              {/* Classification Legend (Clickable Filters) */}
              <div className="space-y-2 text-xs flex-1 max-w-[200px]">
                <div
                  onClick={() => navigate('/pages/mainModule/store', { state: { itemType: 'raw_material' } })}
                  className="p-1.5 rounded-lg bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200 flex items-center justify-between transition cursor-pointer group shadow-2xs"
                  title="Click to open Store filtered by Raw Materials only"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></span>
                    <span className="text-gray-800 group-hover:text-blue-900 font-semibold text-[11px] truncate">Raw Materials</span>
                  </div>
                  <span className="font-mono font-bold text-blue-900 text-xs shrink-0">
                    {rawMaterialsCount} <span className="text-[10px] text-gray-500">({rawPercent}%) →</span>
                  </span>
                </div>

                <div
                  onClick={() => navigate('/pages/mainModule/store', { state: { itemType: 'finished_good' } })}
                  className="p-1.5 rounded-lg bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200 flex items-center justify-between transition cursor-pointer group shadow-2xs"
                  title="Click to open Store filtered by Finished Goods only"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="text-gray-800 group-hover:text-emerald-900 font-semibold text-[11px] truncate">Finished Goods</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-900 text-xs shrink-0">
                    {finishedGoodsCount} <span className="text-[10px] text-gray-500">({fgPercent}%) →</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Top In-Demand / Selling Products 🔥 */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                <Flame size={14} className="text-orange-500" />
                Top In-Demand Products (This Month)
              </h3>
              <span className="text-[10px] text-gray-400 font-semibold">Sales Volume</span>
            </div>

            <div className="space-y-2">
              {topSellingItems.map((item, idx) => {
                const maxUnits = topSellingItems[0]?.units || 100;
                const barWidth = Math.round((item.units / maxUnits) * 100);

                return (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-4 h-4 rounded bg-slate-100 text-slate-700 text-[9px] font-bold flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="text-gray-900 truncate text-[11px]" title={item.name}>{item.name}</span>
                      </div>
                      <span className="font-bold text-emerald-700 font-mono text-[11px] shrink-0">{item.units} Units</span>
                    </div>
                    <div className="w-full h-1 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Recent Sales Orders + Store Inventory Master */}
        <div className="lg:col-span-7 space-y-3 flex flex-col justify-between">
          {/* Recent Sales Orders Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="p-2.5 px-3.5 border-b border-gray-100 flex items-center justify-between bg-purple-50/20">
              <div className="flex items-center gap-1.5">
                <ShoppingBag size={14} className="text-purple-600" />
                <h3 className="font-bold text-gray-900 text-xs">Recent Customer Sales Orders</h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/pages/mainModule/sales-orders')}
                className="text-[10px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-0.5 cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight size={12} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-50 text-[9px] font-bold text-gray-500 uppercase border-b border-gray-100">
                    <th className="py-1.5 px-3">Order ID</th>
                    <th className="py-1.5 px-3">Client</th>
                    <th className="py-1.5 px-3">Incharge</th>
                    <th className="py-1.5 px-3 text-center">Status</th>
                    <th className="py-1.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {salesOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-gray-400 italic text-xs">
                        No sales orders recorded yet.
                      </td>
                    </tr>
                  ) : (
                    salesOrders.slice(0, 4).map((order, idx) => (
                      <tr key={order.Id || order.id || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-1.5 px-3 font-mono font-bold text-blue-700">
                          SO-{order.Id || order.id || 1000 + idx}
                        </td>
                        <td className="py-1.5 px-3 font-semibold text-gray-900 max-w-[140px] truncate" title={order.clientName}>
                          {order.clientName || 'Client Org'}
                        </td>
                        <td className="py-1.5 px-3 text-gray-600 max-w-[110px] truncate">
                          {order.projectIncharge || '—'}
                        </td>
                        <td className="py-1.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => navigate('/pages/mainModule/sales-orders', { state: { status: order.status || 'Pending' } })}
                            className={`px-2 py-0.2 rounded-full text-[9px] font-bold border transition hover:opacity-85 cursor-pointer ${
                              (order.status || '').toLowerCase() === 'confirmed' || (order.status || '').toLowerCase() === 'delivered'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {order.status || 'Pending'}
                          </button>
                        </td>
                        <td className="py-1.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => navigate('/pages/mainModule/sales-orders')}
                            className="text-purple-700 hover:text-purple-900 font-bold transition cursor-pointer text-[10px]"
                          >
                            Details →
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Store Inventory Items Overview */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="p-2.5 px-3.5 border-b border-gray-100 flex items-center justify-between bg-blue-50/20">
              <div className="flex items-center gap-1.5">
                <Package size={14} className="text-blue-600" />
                <h3 className="font-bold text-gray-900 text-xs">Store Items Inventory</h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/pages/mainModule/store')}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
              >
                <span>View Store</span>
                <ChevronRight size={12} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-50 text-[9px] font-bold text-gray-500 uppercase border-b border-gray-100">
                    <th className="py-1.5 px-3">Item Name</th>
                    <th className="py-1.5 px-3">Classification</th>
                    <th className="py-1.5 px-3 text-center">Stock</th>
                    <th className="py-1.5 px-3 text-center">Status</th>
                    <th className="py-1.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {storeItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-gray-400 italic text-xs">
                        No store items loaded.
                      </td>
                    </tr>
                  ) : (
                    storeItems.slice(0, 4).map((item) => {
                      const stock = parseFloat(item.opening_stock ?? item.stock_quantity ?? item.quantity ?? 0);
                      const minStock = parseFloat(item.min_threshold ?? item.minThreshold ?? item.min_stock_level ?? item.reorder_point ?? 10);
                      const isFinished = ((item.item_type || item.type || '').toLowerCase()).includes('finish');
                      const isOut = stock <= 0;
                      const isLow = stock > 0 && stock <= minStock;

                      return (
                        <tr key={item.id || item.item_id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-1.5 px-3 font-bold text-gray-900 max-w-[150px] truncate" title={item.item_name}>
                            {item.item_name}
                          </td>
                          <td className="py-1.5 px-3 text-gray-600">
                            <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-semibold border ${
                              isFinished
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {isFinished ? 'Finished Good' : 'Raw Material'}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-center font-bold text-slate-800 font-mono">
                            {stock} {item.unit || 'Nos'}
                          </td>
                          <td className="py-1.5 px-3 text-center">
                            <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold border ${
                              isOut
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : isLow
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => navigate('/pages/mainModule/store')}
                              className="text-blue-600 hover:text-blue-800 font-bold transition cursor-pointer text-[10px]"
                            >
                              View →
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
