import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Send, AlertCircle, Clock, CheckCircle2, Truck, Calendar, Package, Factory, Info } from 'lucide-react';
import { useDeliveryForm } from '../hooks/useDeliveryForm';
import { fetchSalesOrders, getProducts } from '../../client/services/salesOrderService';
import { fetchAllBOMPreparations } from '../../bomPreparation/services/bomPreparationService';
import { createDeliveryChallan, fetchOrderDispatchSummary, getAllDeliveryChallans } from '../services/deliveryService';

export const CreateDeliveryPage = ({ onBack, onSuccess }) => {
  const dateInputRef = useRef(null);
  const [salesOrders, setSalesOrders] = useState([]);
  const [deliveryMode, setDeliveryMode] = useState('site_material'); // 'site_material' | 'in_house'
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedOrderSummary, setSelectedOrderSummary] = useState(null);
  const [preparationId, setPreparationId] = useState(null);
  const [orderItemsList, setOrderItemsList] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const {
    formData,
    items,
    populateItems,
    loading,
    error,
    setError,
    setLoading,
    handleHeaderChange,
    updateItemRow,
    resetForm,
  } = useDeliveryForm();

  // Transporter Name Change with validation
  const handleTransporterChange = (e) => {
    const rawVal = e.target.value;
    const cleanVal = rawVal.replace(/[^a-zA-Z0-9\s&.-]/g, '');
    handleHeaderChange({ target: { name: 'transporter_name', value: cleanVal } });
  };

  // Vehicle Number Change with auto uppercase
  const handleVehicleChange = (e) => {
    const rawVal = e.target.value;
    const cleanVal = rawVal.toUpperCase().replace(/[^A-Z0-9\s-]/g, '');
    handleHeaderChange({ target: { name: 'vehicle_no', value: cleanVal } });
  };

  // Fetch all Sales Orders, BOM Preparations, and Products on mount
  useEffect(() => {
    const loadSalesOrders = async () => {
      try {
        setLoadingOrders(true);
        const [res, prepRes, challanRes, prodRes] = await Promise.all([
          fetchSalesOrders(),
          fetchAllBOMPreparations().catch(() => ({ data: [] })),
          getAllDeliveryChallans().catch(() => ({ data: [] })),
          getProducts().catch(() => ({ data: [] })),
        ]);


        console.log(res.data, "salesOrderService")


        const ordersList = res?.data ?? (Array.isArray(res) ? res : []);
        const prepsList = prepRes?.data ?? (Array.isArray(prepRes) ? prepRes : []);
        const challanList = challanRes?.data ?? (Array.isArray(challanRes) ? challanRes : []);
        const masterProducts = prodRes?.data ?? (Array.isArray(prodRes) ? prodRes : []);

        const prodModeMap = new Map();
        masterProducts.forEach((p) => {
          if (p.id) prodModeMap.set(String(p.id), p.fulfilment_mode);
          if (p.product_name) prodModeMap.set(p.product_name.trim().toLowerCase(), p.fulfilment_mode);
        });

        const prepMap = new Map();
        prepsList.forEach((p) => {
          if (p.sales_order_id) {
            prepMap.set(Number(p.sales_order_id), p);
          }
        });

        // Set of Order IDs that are already 100% delivered
        const fullyDeliveredOrderIds = new Set();
        challanList.forEach((ch) => {
          const ordId = Number(ch.order_id);
          if (!ordId) return;
          const totalOrd = Number(ch.total_ordered_qty || ch.order_total_ordered_qty || 0);
          const cumDel = Number(ch.cumulative_delivered_qty ?? ch.total_delivered_qty ?? 0);
          if (ch.status === 'Fully Delivered' || (totalOrd > 0 && cumDel >= totalOrd)) {
            fullyDeliveredOrderIds.add(ordId);
          }
        });

        // Helper to accurately classify In-House manufactured product orders vs Site Assembly project orders
        const checkIsInHouseOrder = (ord, hasPreparedBOM) => {
          if (!ord) return false;

          const oType = String(ord.orderType || ord.order_type || '').trim().toLowerCase();
          if (oType === 'in_house' || oType === 'inhouse' || oType === 'direct') return true;
          if (Boolean(ord.is_in_house_manufacturing) || Boolean(ord.isInHouseOrder)) return true;

          const pName = String(ord.projectName || ord.project_name || '').trim().toLowerCase();
          if (pName.startsWith('in-house') || pName.includes('in-house') || pName.includes('direct delivery')) return true;

          const incharge = String(ord.projectIncharge || ord.project_incharge || '').trim().toLowerCase();
          if (incharge.includes('in-house') || incharge.includes('inhouse') || incharge.includes('direct')) return true;

          const items = Array.isArray(ord.items) ? ord.items : [];
          if (items.length > 0) {
            let hasInHouse = false;
            let hasSite = false;

            items.forEach((it) => {
              let mode = it.fulfilment_mode || it.fulfilmentMode;
              const itName = String(it.productName || it.item_name || it.itemName || '').trim().toLowerCase();
              const capName = String(it.capacity || it.description || '').trim().toLowerCase();
              const pid = String(it.productId || it.product_id || '');

              if (!mode && pid && prodModeMap.has(pid)) {
                mode = prodModeMap.get(pid);
              }
              if (!mode && itName && prodModeMap.has(itName)) {
                mode = prodModeMap.get(itName);
              }
              if (!mode && capName && prodModeMap.has(capName)) {
                mode = prodModeMap.get(capName);
              }

              // Fallback safety for known product names
              if (!mode) {
                if (itName.includes('pump') || itName.includes('light') || itName.includes('keyboard')) {
                  mode = 'in_house_manufacturing';
                } else if (
                  itName.includes('solar system') ||
                  itName.includes('laptop') ||
                  itName.includes('pc') ||
                  itName.includes('water system') ||
                  itName.includes('123445')
                ) {
                  mode = 'site_assembly';
                }
              }

              if (mode === 'in_house_manufacturing' || mode === 'in_house') {
                hasInHouse = true;
              } else if (mode === 'site_assembly') {
                hasSite = true;
              }
            });

            if (hasInHouse && !hasSite) {
              return true;
            }
            if (hasSite) {
              return false;
            }
          }

          if (hasPreparedBOM) {
            return false;
          }

          return false;
        };

        const eligibleOrders = ordersList
          .filter((ord) => {
            const ordId = Number(ord.Id || ord.id);
            if (!ordId) return false;
            // Exclude orders that are already 100% delivered
            if (fullyDeliveredOrderIds.has(ordId)) return false;
            return true;
          })
          .map((ord) => {
            const ordId = Number(ord.Id || ord.id);
            const prep = prepMap.get(ordId);
            const mode = String(ord.fulfilment_mode || '').trim().toLowerCase();
            const oType = String(ord.orderType || ord.order_type || '').trim().toLowerCase();
            const isInHouse =
              mode === 'in_house_manufacturing' ||
              mode === 'in_house' ||
              oType === 'in_house' ||
              Boolean(ord.is_in_house_manufacturing) ||
              checkIsInHouseOrder(ord, prep && prep.items && prep.items.length > 0);

            return {
              ...ord,
              preparationId: prep ? prep.id : null,
              fulfilment_mode: isInHouse ? 'in_house_manufacturing' : 'site_assembly',
              isInHouseOrder: isInHouse,
            };
          })
          .sort((a, b) => Number(b.Id || b.id || 0) - Number(a.Id || a.id || 0));

        setSalesOrders(eligibleOrders);
      } catch (err) {
        console.error('Failed to load sales orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    };
    loadSalesOrders();
  }, []);

  // Filtered orders according to active delivery mode (Site Delivery vs In-House Direct Delivery)
  const filteredOrders = useMemo(() => {
    return salesOrders.filter((ord) => {
      const mode = String(ord.fulfilment_mode || '').trim().toLowerCase();
      const oType = String(ord.orderType || ord.order_type || '').trim().toLowerCase();
      const isIH = mode === 'in_house_manufacturing' || oType === 'in_house' || ord.isInHouseOrder;
      if (deliveryMode === 'in_house') {
        return isIH;
      }
      return !isIH;
    });
  }, [salesOrders, deliveryMode]);

  // Handle Sales Order selection change & load dispatch summary
  const handleOrderSelect = async (e) => {
    const orderId = e.target.value;
    setSelectedOrderId(orderId);
    setSelectedOrderSummary(null);
    setPreparationId(null);
    setOrderItemsList([]);
    setError(null);

    if (!orderId) {
      handleHeaderChange({ target: { name: 'customer_name', value: '' } });
      handleHeaderChange({ target: { name: 'delivery_address', value: '' } });
      populateItems([]);
      return;
    }

    const found = salesOrders.find(
      (o) => String(o.Id || o.id) === String(orderId)
    );

    if (found) {
      const cName = found.clientName || found.companyName || found.customer_name || '';
      const address = found.shippingAddress || found.billingAddress || '';

      handleHeaderChange({ target: { name: 'customer_name', value: cName } });
      handleHeaderChange({ target: { name: 'delivery_address', value: address } });

      const autoChallanNo = `DL-${found.poNo || found.Id || Date.now()}`;
      handleHeaderChange({ target: { name: 'challan_no', value: autoChallanNo } });
      setPreparationId(found.preparationId || null);
    }

    try {
      setLoadingSummary(true);
      const summaryRes = await fetchOrderDispatchSummary(orderId, { mode: deliveryMode });
      if (summaryRes?.success && summaryRes.data) {
        const data = summaryRes.data;
        setSelectedOrderSummary(data);
        setPreparationId(data.preparation_id || null);

        const allItems = (data.items || []).map((it, idx) => {
          const reqQty = Number(it.required_qty) || 0;
          const prevDispatched = Math.min(reqQty, Math.max(0, Number(it.already_dispatched_qty) || 0));
          const balance = Math.max(0, reqQty - prevDispatched);

          return {
            key: it.key || `prep-item-${it.item_id}-${idx}`,
            item_id: it.item_id,
            product_id: it.product_id || it.item_id,
            item_name: it.item_name,
            brand: it.brand,
            unit: it.unit,
            category: it.category || 'General',
            required_qty: reqQty,
            already_dispatched_qty: prevDispatched,
            balance_qty: balance,
            warehouse_stock: it.warehouse_stock,
            suggested_dispatch_qty: it.suggested_dispatch_qty ?? Math.min(balance, Number(it.warehouse_stock) || 0),
          };
        });

        setOrderItemsList(allItems);

        // Auto-populate ALL items as fixed rows in the dispatch table
        const allRows = allItems.map((it, idx) => ({
          id: Date.now() + idx + Math.random(),
          item_id: it.item_id,
          product_id: it.product_id,
          item_name: it.item_name,
          brand: it.brand || '',
          unit: it.unit || 'Nos',
          category: it.category,
          required_qty: it.required_qty,
          already_dispatched_qty: it.already_dispatched_qty,
          balance_qty: it.balance_qty,
          warehouse_stock: it.warehouse_stock,
          ordered_qty: it.balance_qty,
          delivered_qty: it.suggested_dispatch_qty ?? (it.warehouse_stock > 0 ? Math.min(it.balance_qty, it.warehouse_stock) : it.balance_qty),
          selected_order_item_key: it.key,
        }));

        populateItems(allRows);
      } else if (Array.isArray(found?.items) && found.items.length > 0) {
        // Fallback for In-House orders with no BOM prep: populate directly from Sales Order line items
        const directItems = found.items.map((it, idx) => ({
          key: `direct-item-${idx}`,
          item_id: it.itemId || it.Id || idx + 1,
          product_id: it.productId || it.product_id || 0,
          item_name: it.productName || it.itemName || it.name || 'Finished Good',
          brand: it.brandName || '',
          unit: 'Nos',
          category: 'Finished Goods',
          required_qty: Number(it.qty) || 1,
          already_dispatched_qty: 0,
          balance_qty: Number(it.qty) || 1,
          warehouse_stock: 9999,
          suggested_dispatch_qty: Number(it.qty) || 1,
        }));
        setOrderItemsList(directItems);

        const allRows = directItems.map((it, idx) => ({
          id: Date.now() + idx + Math.random(),
          item_id: it.item_id,
          product_id: it.product_id,
          item_name: it.item_name,
          brand: it.brand || '',
          unit: it.unit || 'Nos',
          category: it.category,
          required_qty: it.required_qty,
          already_dispatched_qty: it.already_dispatched_qty,
          balance_qty: it.balance_qty,
          warehouse_stock: it.warehouse_stock,
          ordered_qty: it.balance_qty,
          delivered_qty: it.balance_qty,
          selected_order_item_key: it.key,
        }));
        populateItems(allRows);
      }
    } catch (sumErr) {
      console.warn('Could not fetch order dispatch summary:', sumErr);
      if (Array.isArray(found?.items) && found.items.length > 0) {
        const directItems = found.items.map((it, idx) => ({
          key: `direct-item-${idx}`,
          item_id: it.itemId || it.Id || idx + 1,
          product_id: it.productId || it.product_id || 0,
          item_name: it.productName || it.itemName || it.name || 'Finished Good',
          brand: it.brandName || '',
          unit: 'Nos',
          category: 'Finished Goods',
          required_qty: Number(it.qty) || 1,
          already_dispatched_qty: 0,
          balance_qty: Number(it.qty) || 1,
          warehouse_stock: 9999,
          suggested_dispatch_qty: Number(it.qty) || 1,
        }));
        setOrderItemsList(directItems);

        const allRows = directItems.map((it, idx) => ({
          id: Date.now() + idx + Math.random(),
          item_id: it.item_id,
          product_id: it.product_id,
          item_name: it.item_name,
          brand: it.brand || '',
          unit: it.unit || 'Nos',
          category: it.category,
          required_qty: it.required_qty,
          already_dispatched_qty: it.already_dispatched_qty,
          balance_qty: it.balance_qty,
          warehouse_stock: it.warehouse_stock,
          ordered_qty: it.balance_qty,
          delivered_qty: it.balance_qty,
          selected_order_item_key: it.key,
        }));
        populateItems(allRows);
      }
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleReset = () => {
    resetForm();
    setSelectedOrderId('');
    setSelectedOrderSummary(null);
    setPreparationId(null);
    setOrderItemsList([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!selectedOrderId) return setError('Please select a Sales Order / PO Number.');
    if (!formData.dispatch_date) return setError('Dispatch date is required.');

    // Transporter Name validation
    if (formData.transporter_name && formData.transporter_name.trim()) {
      const transName = formData.transporter_name.trim();
      if (!/^[a-zA-Z0-9\s&.-]+$/.test(transName)) {
        return setError('Transporter Name contains invalid special characters (slashes and symbols are not allowed).');
      }
    }

    // Vehicle No validation
    if (formData.vehicle_no && formData.vehicle_no.trim()) {
      const vehNo = formData.vehicle_no.trim();
      if (!/^[A-Z0-9\s-]+$/.test(vehNo)) {
        return setError('Vehicle Number contains invalid characters. Only letters, numbers, spaces, and hyphens are allowed.');
      }
      const rawAlphanumeric = vehNo.replace(/[\s-]/g, '');
      if (rawAlphanumeric.length < 4) {
        return setError('Vehicle Number must contain at least 4 alphanumeric characters.');
      }
    }

    const validItems = items.filter((it) => Number(it.delivered_qty) > 0);
    if (validItems.length === 0) {
      return setError('Please specify a dispatch quantity greater than 0 for at least one item.');
    }

    // Check if any dispatched quantity exceeds available balance or stock
    for (const it of validItems) {
      const balance = Number(it.balance_qty ?? it.ordered_qty ?? 0);
      const stock = Number(it.warehouse_stock ?? 0);
      const del = Number(it.delivered_qty);

      if (del > balance) {
        return setError(`Dispatched quantity for "${it.item_name}" (${del}) cannot exceed remaining balance (${balance}).`);
      }
      if (del > stock) {
        return setError(`Dispatched quantity for "${it.item_name}" (${del}) exceeds available warehouse stock (${stock}).`);
      }
    }

    const payload = {
      order_id: Number(selectedOrderId),
      preparation_id: preparationId,
      challan_no: formData.challan_no,
      dispatch_date: formData.dispatch_date,
      transporter_name: formData.transporter_name?.trim() || null,
      vehicle_no: formData.vehicle_no?.trim() || null,
      delivery_items: validItems.map((it) => ({
        item_id: it.item_id,
        ordered_qty: Number(it.ordered_qty) || Number(it.required_qty),
        delivered_qty: Number(it.delivered_qty),
      })),
    };

    try {
      setLoading(true);
      const res = await createDeliveryChallan(payload);
      setLoading(false);
      if (res.success) {
        resetForm();
        setSelectedOrderId('');
        setSelectedOrderSummary(null);
        setPreparationId(null);
        setOrderItemsList([]);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to create delivery.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              type="button"
              className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Truck size={22} className="text-blue-600" />
              Create Delivery & Dispatch
            </h1>
            <p className="text-xs text-gray-500">
              Deliver Site Materials (BOM items) for projects, or Direct Finished Goods for manufactured product orders
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-md flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2 DELIVERY MODES SWITCHER */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs mb-6">
        <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
          Select Delivery Type:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Mode 1: Site Material Delivery */}
          <button
            type="button"
            onClick={() => {
              setDeliveryMode('site_material');
              setSelectedOrderId('');
              setSelectedOrderSummary(null);
              populateItems([]);
            }}
            className={`p-3.5 rounded-lg border-2 text-left transition flex items-start gap-3 cursor-pointer ${deliveryMode === 'site_material'
              ? 'border-blue-600 bg-blue-50/50 shadow-xs'
              : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
          >
            <div className={`p-2 rounded-lg ${deliveryMode === 'site_material' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              <Package size={18} />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                <span>Site Delivery (Material / BOM Items)</span>
                {deliveryMode === 'site_material' && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-blue-600 text-white rounded font-bold">Active</span>
                )}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                Dispatches raw materials, components & BOM items for Site Assembly solar projects.
              </div>
            </div>
          </button>

          {/* Mode 2: Direct Product Delivery */}
          <button
            type="button"
            onClick={() => {
              setDeliveryMode('in_house');
              setSelectedOrderId('');
              setSelectedOrderSummary(null);
              populateItems([]);
            }}
            className={`p-3.5 rounded-lg border-2 text-left transition flex items-start gap-3 cursor-pointer ${deliveryMode === 'in_house'
              ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
              : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
          >
            <div className={`p-2 rounded-lg ${deliveryMode === 'in_house' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              <Factory size={18} />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                <span>Direct Product Delivery (Finished Goods)</span>
                {deliveryMode === 'in_house' && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-indigo-600 text-white rounded font-bold">Active</span>
                )}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                Dispatches manufactured Finished Goods directly to clients for In-House product orders.
              </div>
            </div>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Sales Order & Logistics Info */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <Truck size={16} className="text-blue-600" />
            Delivery Header & Logistics Info
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            {/* Sales Order / PO Search & Select Dropdown */}
            <div className="md:col-span-2">
              <label className="block font-bold text-gray-700 mb-1">
                Select {deliveryMode === 'in_house' ? 'In-House (Finished Goods) Order' : 'Site Assembly Project Order'} *
              </label>
              <select
                value={selectedOrderId}
                onChange={handleOrderSelect}
                required
                className="w-full border border-gray-300 rounded-md p-2.5 bg-white focus:ring-1 focus:ring-blue-500 text-black font-medium"
              >
                <option value="">
                  {loadingOrders
                    ? 'Loading Orders...'
                    : filteredOrders.length === 0
                      ? `-- No ${filteredOrders === 'in_house_manufacturing' ? '"in_house_manufacturing"' : 'Site Assembly'} Orders Ready for Delivery --`
                      : `-- Select ${filteredOrders === 'in_house_manufacturing' ? '"in_house_manufacturing"' : 'Site Project Order'} --`}
                </option>
                {console.log("filteredOrders", filteredOrders)}

                {filteredOrders.map((ord) => {
                  const oId = ord.Id || ord.id;
                  const poLabel = ord.poNo ? `(PO: ${ord.poNo})` : '';
                  const clientLabel = ord.clientName || ord.companyName || 'Customer';
                  return (
                    <option key={oId} value={oId}>
                      SO-{oId} {poLabel} - {clientLabel}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Dispatch Date */}
            <div>
              <label className="block font-bold text-gray-700 mb-1">Dispatch Date *</label>
              <div
                onClick={() => dateInputRef.current?.showPicker?.()}
                className="relative cursor-pointer"
              >
                <input
                  ref={dateInputRef}
                  type="date"
                  name="dispatch_date"
                  required
                  value={formData.dispatch_date}
                  onChange={handleHeaderChange}
                  onClick={(e) => e.currentTarget?.showPicker?.()}
                  onFocus={(e) => e.currentTarget?.showPicker?.()}
                  className="w-full border border-gray-300 rounded-md p-2.5 bg-white focus:ring-1 focus:ring-blue-500 text-black cursor-pointer font-medium"
                />
              </div>
            </div>

            {/* Transporter Name */}
            <div>
              <label className="block font-medium text-gray-700 mb-1">Transporter Name</label>
              <input
                type="text"
                name="transporter_name"
                placeholder="e.g. Blue Dart, Self Delivery"
                value={formData.transporter_name}
                onChange={handleTransporterChange}
                className="w-full border border-gray-300 rounded-md p-2.5 bg-white focus:ring-1 focus:ring-blue-500 text-black"
              />
            </div>

            {/* Vehicle No */}
            <div className="md:col-span-2">
              <label className="block font-medium text-gray-700 mb-1">Vehicle No</label>
              <input
                type="text"
                name="vehicle_no"
                placeholder="e.g. DL 01 AB 1234 / UP32AB1234"
                value={formData.vehicle_no}
                onChange={handleVehicleChange}
                className="w-full border border-gray-300 rounded-md p-2.5 bg-white focus:ring-1 focus:ring-blue-500 text-black font-mono uppercase"
              />
            </div>

            {/* Delivery Address */}
            <div className="md:col-span-2">
              <label className="block font-medium text-gray-700 mb-1">Delivery / Site Address</label>
              <input
                type="text"
                name="delivery_address"
                readOnly
                placeholder="Auto-populated from Sales Order"
                value={formData.delivery_address}
                className="w-full bg-gray-50 border border-gray-300 rounded-md p-2.5 text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Partial Dispatch Summary Status Cards */}
        {selectedOrderSummary && (
          <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 border border-blue-200 rounded-lg p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-3 border-b border-blue-200/60 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  {deliveryMode === 'in_house' ? 'Finished Goods Fulfillment' : 'Site Material BOM Dispatch'} for PO #{selectedOrderSummary.po_number}
                </span>
                <p className="text-[11px] text-gray-600 mt-0.5">
                  Customer: <strong className="text-gray-800">{selectedOrderSummary.customer_name}</strong> | Previous Deliveries: <strong className="text-gray-800">{selectedOrderSummary.previous_challans_count}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${selectedOrderSummary.is_fully_fulfilled
                  ? 'bg-emerald-100 text-emerald-800'
                  : selectedOrderSummary.total_dispatched_qty > 0
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-blue-100 text-blue-800'
                  }`}>
                  {selectedOrderSummary.is_fully_fulfilled ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                  {selectedOrderSummary.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="bg-white p-2.5 rounded-md border border-gray-200">
                <div className="text-gray-500 text-[11px]">
                  {deliveryMode === 'in_house' ? 'Total Ordered Products' : 'Total BOM Required'}
                </div>
                <div className="text-base font-bold text-gray-800">
                  {selectedOrderSummary.total_required_qty} <span className="text-xs font-normal text-gray-500">Qty ({selectedOrderSummary.items?.length || 0} items)</span>
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-md border border-gray-200">
                <div className="text-gray-500 text-[11px]">Already Dispatched</div>
                <div className="text-base font-bold text-indigo-600">
                  {selectedOrderSummary.total_dispatched_qty} <span className="text-xs font-normal text-gray-500">Qty</span>
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-md border border-gray-200">
                <div className="text-gray-500 text-[11px]">Remaining Balance</div>
                <div className="text-base font-bold text-amber-600">
                  {selectedOrderSummary.total_balance_qty} <span className="text-xs font-normal text-gray-500">Qty</span>
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-md border border-gray-200">
                <div className="text-gray-500 text-[11px]">Delivery Shipment #</div>
                <div className="text-base font-bold text-emerald-600">Shipment #{selectedOrderSummary.previous_challans_count + 1}</div>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Line Items Table (Clean, Read-only descriptions, non-box text) */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                {deliveryMode === 'in_house' ? <Factory size={16} className="text-indigo-600" /> : <Package size={16} className="text-blue-600" />}
                {deliveryMode === 'in_house' ? 'Finished Goods to Dispatch' : 'Site Material / BOM Items to Dispatch'}
              </h2>
              <p className="text-[11px] text-gray-500">
                Item details are auto-loaded. Enter the dispatch quantity for each item below.
              </p>
            </div>
            {items.length > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full border border-gray-200">
                {items.length} Items Listed
              </span>
            )}
          </div>

          {!selectedOrderId ? (
            <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500">
              Please select a Sales Order above to view the items for dispatch.
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500">
              {loadingSummary ? 'Loading order items...' : 'No items found for this order.'}
            </div>
          ) : (
            <div className="overflow-x-auto w-full border border-gray-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs min-w-[850px]">
                <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">#</th>
                    <th className="py-3 px-3 min-w-[240px]">
                      {deliveryMode === 'in_house' ? 'Finished Good Description' : 'Item Description'}
                    </th>
                    <th className="py-3 px-3 w-20 text-center">Unit</th>
                    <th className="py-3 px-3 w-24 text-right">Required Qty</th>
                    <th className="py-3 px-3 w-24 text-right">Already Sent</th>
                    <th className="py-3 px-3 w-24 text-right">Balance Qty</th>
                    <th className="py-3 px-3 w-28 text-right">Warehouse Stock</th>
                    <th className="py-3 px-3 w-36 text-right bg-blue-50/70 text-blue-900">Dispatch Qty (Now)</th>
                    <th className="py-3 px-3 w-24 text-right">New Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item, idx) => {
                    const required = Number(item.required_qty ?? item.ordered_qty) || 0;
                    const alreadySent = Number(item.already_dispatched_qty) || 0;
                    const balance = Number(item.balance_qty ?? Math.max(0, required - alreadySent));
                    const delivered = Number(item.delivered_qty) || 0;
                    const newBalance = Math.max(0, balance - delivered);
                    const stock = Number(item.warehouse_stock ?? 0);
                    const isStockInsufficient = delivered > stock;

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/60">
                        <td className="py-3 px-3 text-center text-gray-400 font-bold">{idx + 1}</td>

                        {/* Item Details (Normal Text, Non-editable) */}
                        <td className="py-3 px-3">
                          <div className="font-semibold text-gray-900 text-xs">{item.item_name}</div>
                          <div className="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5">
                            <span>Category: {item.category || 'General'}</span>
                            {item.brand && <span>• Brand: {item.brand}</span>}
                          </div>
                        </td>

                        {/* Unit (Normal Text) */}
                        <td className="py-3 px-3 text-center font-mono text-gray-600">
                          {item.unit || 'Nos'}
                        </td>

                        {/* Required Qty (Normal Text) */}
                        <td className="py-3 px-3 text-right font-mono text-gray-700 font-medium">
                          {required}
                        </td>

                        {/* Already Sent Qty (Normal Text) */}
                        <td className="py-3 px-3 text-right font-mono text-indigo-600 font-medium">
                          {alreadySent}
                        </td>

                        {/* Remaining Balance Qty (Normal Text) */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-amber-600">
                          {balance}
                        </td>

                        {/* Warehouse Stock Available */}
                        <td className="py-3 px-3 text-right font-mono font-medium">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${stock <= 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                            {stock}
                          </span>
                        </td>

                        {/* Current Dispatch Qty Input */}
                        <td className="py-3 px-3 bg-blue-50/20">
                          <input
                            type="number"
                            min="0"
                            max={balance || 0}
                            placeholder="0"
                            disabled={balance === 0}
                            value={item.delivered_qty}
                            onChange={(e) => updateItemRow(item.id, 'delivered_qty', e.target.value)}
                            className={`w-full bg-white border rounded p-1.5 text-right font-mono font-bold text-blue-700 text-xs focus:ring-1 ${isStockInsufficient || Number(item.delivered_qty) > balance
                              ? 'border-rose-500 bg-rose-50 text-rose-700'
                              : 'border-gray-300 focus:ring-blue-500'
                              }`}
                          />
                          {Number(item.delivered_qty) > balance && (
                            <div className="text-[10px] text-rose-600 font-medium mt-0.5 text-right">
                              Exceeds Balance ({balance})
                            </div>
                          )}
                          {isStockInsufficient && Number(item.delivered_qty) <= balance && (
                            <div className="text-[10px] text-rose-600 font-medium mt-0.5 text-right">
                              Exceeds Stock ({stock})
                            </div>
                          )}
                        </td>

                        {/* Calculated New Balance After This Dispatch */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                          {newBalance}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-100 font-bold text-xs border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={3} className="py-2.5 px-3 text-right text-gray-800 uppercase text-[10px]">
                      Totals
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-900">
                      {items.reduce((acc, curr) => acc + Number(curr.required_qty ?? curr.ordered_qty ?? 0), 0)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-indigo-700">
                      {items.reduce((acc, curr) => acc + Number(curr.already_dispatched_qty ?? 0), 0)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-700">
                      {items.reduce((acc, curr) => acc + Number(curr.balance_qty ?? 0), 0)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-500 text-[10px]">
                      -
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-blue-700 text-sm bg-blue-50/50">
                      {items.reduce((acc, curr) => acc + Number(curr.delivered_qty || 0), 0)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                      {items.reduce(
                        (acc, curr) =>
                          acc +
                          Math.max(
                            0,
                            Number(curr.balance_qty || 0) - Number(curr.delivered_qty || 0)
                          ),
                        0
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Section 4: Submit Button */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 rounded-md text-xs font-semibold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading || items.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-sm disabled:opacity-50 transition cursor-pointer"
          >
            <Send size={14} />
            {loading ? 'Submitting...' : 'Save & Dispatch Delivery'}
          </button>
        </div>
      </form>
    </div>
  );
};
