import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  getConfirmedSalesOrders,
  fetchBOMForOrder,
  saveBOMPreparation,
  submitBOMPreparation,
  getMastersData,
  fetchAllBOMPreparations,
  fetchBOMPreparationByOrderId,
} from "../services/bomPreparationService";

const useBOMPreparation = () => {
  const [confirmedOrders, setConfirmedOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [bomItems, setBomItems] = useState([]);
  const [extraItems, setExtraItems] = useState([]);
  const [bomStatusList, setBomStatusList] = useState([]);

  const [units, setUnits] = useState([]);
  const [brands, setBrands] = useState([]);
  const [items, setItems] = useState([]);
  const [itemBrands, setItemBrands] = useState({});

  const [loading, setLoading] = useState(false);
  const [bomLoading, setBomLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  // -----------------------------------
  // Load confirmed orders + BOM preparation status
  // -----------------------------------
  const fetchConfirmedOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [ordersRes, prepsRes] = await Promise.all([
        getConfirmedSalesOrders(),
        fetchAllBOMPreparations(),
      ]);

      const orders = ordersRes?.data?.data ?? ordersRes?.data ?? ordersRes;
      const preparations = prepsRes?.data ?? prepsRes ?? [];

      const prepMap = new Map();
      if (Array.isArray(preparations)) {
        preparations.forEach((p) => {
          if (p.sales_order_id) {
            prepMap.set(Number(p.sales_order_id), p);
          }
        });
      }

      const normalizedOrders = Array.isArray(orders)
        ? orders.map((order) => {
          const rawItems = Array.isArray(order.items) ? order.items : [];
          const firstItem = rawItems[0] ?? {};

          // Normalize items array with clean names and capacities
          const normalizedItems = rawItems.map((item, idx) => ({
            id: item.id ?? item.Id ?? item.itemId ?? idx + 1,
            productId: item.productId ?? item.product_id ?? null,
            productName: item.productName ?? item.itemName ?? item.name ?? "",
            brandName: item.brandName ?? item.brand ?? "",
            capacity: item.capacity ?? item.Capacity ?? "",
            qty: Number(item.qty ?? item.quantity ?? 1) || 1,
            price: item.price ?? 0,
            total: item.total ?? 0,
          }));

          // Derive overall product names and capacities for the order
          const productNames = normalizedItems
            .map((i) => i.productName)
            .filter(Boolean)
            .join(", ");

          const totalOrderQty = normalizedItems.reduce(
            (sum, i) => sum + (Number(i.qty) || 1),
            0
          );

          const orderId = order.id ?? order.Id ?? order.sales_order_id;
          const existingPrep = prepMap.get(Number(orderId));

          return {
            ...order,
            id: orderId,
            sales_order_no:
              order.sales_order_no ??
              order.salesOrderNo ??
              order.poNo ??
              order.poNumber ??
              order.orderId ??
              order.Id,
            client_name:
              order.client_name ??
              order.clientName ??
              order.client?.name ??
              order.client?.companyName,
            items: normalizedItems,
            product_id:
              order.product_id ??
              order.productId ??
              firstItem.productId ??
              firstItem.product_id,
            product_name:
              productNames ||
              order.product_name ||
              order.productName ||
              firstItem.productName ||
              firstItem.itemName ||
              "—",
            capacity:
              normalizedItems.map((i) => i.capacity).filter(Boolean).join(", ") ||
              order.capacity ||
              order.Capacity ||
              firstItem.capacity ||
              "—",
            order_quantity:
              totalOrderQty > 0
                ? totalOrderQty
                : Number(order.order_quantity ?? order.orderQuantity ?? order.quantity ?? firstItem.qty ?? 1),
            order_date: order.order_date ?? order.orderDate ?? order.poDate,
            shippingAddress: order.shippingAddress ?? order.siteAddress ?? order.deliveryAddress ?? "",
            is_prepared: Boolean(existingPrep),
            bom_status: existingPrep ? "Confirmed" : "Pending",
            preparation: existingPrep || null,
          };
        })
        : [];

      setConfirmedOrders(normalizedOrders);
    } catch (err) {
      console.error("fetchConfirmedOrders error:", err);
      setError(
        err?.response?.data?.message || "Failed to load confirmed sales orders."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // -----------------------------------
  // Load masters (Units, Brands, Items)
  // -----------------------------------
  const fetchMasters = useCallback(async () => {
    try {
      const response = await getMastersData();
      if (response?.success && response.data) {
        setUnits(response.data.units || []);
        setBrands(response.data.brands || []);
        setItems(response.data.items || []);
        setItemBrands(response.data.itemBrands || {});
      }
    } catch (err) {
      console.warn("Could not load backend masters, using fallback:", err);
      setUnits([
        { id: "Nos", unit_name: "Nos" },
        { id: "Meter", unit_name: "Meter" },
        { id: "Set", unit_name: "Set" },
        { id: "Kg", unit_name: "Kg" },
        { id: "Pcs", unit_name: "Pcs" },
      ]);
    }
  }, []);

  // -----------------------------------
  // Initial load
  // -----------------------------------
  useEffect(() => {
    fetchConfirmedOrders();
    fetchMasters();
  }, [fetchConfirmedOrders, fetchMasters]);

  // -----------------------------------
  // Select Sales Order -> Auto-fetch BOM
  // -----------------------------------
  const selectSalesOrder = async (order) => {
    try {
      setSelectedOrder(order);
      setBomItems([]);
      setExtraItems([]);
      setBomStatusList([]);
      setError("");
      setWarning("");
      setBomLoading(true);

      // Extract products from order
      let orderProducts = [];

      if (Array.isArray(order.items) && order.items.length > 0) {
        orderProducts = order.items.map((it) => ({
          productId: it.productId || null,
          productName: it.productName || it.itemName || "",
          capacity: it.capacity || "",
          qty: Number(it.qty) || 1,
        }));
      } else {
        orderProducts = [
          {
            productId: order.product_id || order.productId || null,
            productName: order.product_name || order.productName || "",
            capacity: order.capacity || "",
            qty: Number(order.order_quantity || order.orderQuantity || 1) || 1,
          },
        ];
      }

      // If order already has prepared items, load them directly into standard and extra items
      if (order.preparation && Array.isArray(order.preparation.items) && order.preparation.items.length > 0) {
        const prepItems = order.preparation.items;
        const isItemExtra = (i) => Boolean(i.is_extra || i.is_additional || String(i.is_extra) === "1");

        const standard = prepItems
          .filter((i) => !isItemExtra(i))
          .map((item) => ({
            ...item,
            id: item.id || `item_${item.item_id}`,
            item_id: item.item_id,
            itemName: item.item_name || item.itemName,
            item_name: item.item_name || item.itemName,
            product_name: item.product_name,
            standardQty: Number(item.standardQty ?? item.calculatedQty ?? item.calculated_quantity ?? item.quantity ?? 1),
            calculatedQty: Number(item.calculatedQty ?? item.calculated_quantity ?? item.finalQty ?? item.quantity ?? 1),
            finalQty: Number(item.finalQty ?? item.calculatedQty ?? item.calculated_quantity ?? item.quantity ?? 1),
            unit: item.unit || "Nos",
            brand: item.brand || "",
            remarks: item.remarks || "",
            is_extra: false,
          }));

        const extras = prepItems
          .filter((i) => isItemExtra(i))
          .map((item) => ({
            tempId: Date.now() + Math.random(),
            product_id: item.product_id || orderProducts[0]?.productId || null,
            product_name: item.product_name || orderProducts[0]?.productName || "",
            item_id: item.item_id,
            item_name: item.item_name || item.itemName || "",
            quantity: Number(item.calculatedQty ?? item.calculated_quantity ?? item.quantity ?? 1),
            unit: item.unit || "Nos",
            brand: item.brand || "",
            remarks: item.remarks || "",
            is_extra: true,
          }));

        setBomItems(standard);
        setExtraItems(extras);
        setBomStatusList([]);
        setBomLoading(false);
        return;
      }

      const response = await fetchBOMForOrder(order.id, orderProducts);

      if (response?.success && response.data) {
        const fetchedItems = (response.data.items || []).map((item) => ({
          ...item,
          standardQty: Number(item.standardQty ?? item.quantity ?? 1),
          calculatedQty: Number(item.calculatedQty ?? item.finalQty ?? 1),
          finalQty: Number(item.finalQty ?? item.calculatedQty ?? 1),
          unit: item.unit || "Nos",
          brand: item.brand || "",
          is_extra: false,
        }));

        setBomItems(fetchedItems);
        setBomStatusList(response.data.bomList || []);

        if (response.data.allItemsFound === false) {
          const missing = (response.data.bomList || [])
            .filter((b) => !b.found)
            .map((b) => `${b.productName} (${b.capacity || "N/A"})`)
            .join(", ");
          setWarning(
            `Standard BOM is not configured for: ${missing}. You can add materials using Extra Items below.`
          );
        }
      } else {
        setError(response?.message || "Failed to load BOM from database.");
      }
    } catch (err) {
      console.error("selectSalesOrder BOM error:", err);
      setError(
        err?.response?.data?.message || "Failed to load standard BOM for this order."
      );
    } finally {
      setBomLoading(false);
    }
  };

  // -----------------------------------
  // Order Products helper
  // -----------------------------------
  const orderProducts = useMemo(() => {
    if (!selectedOrder) return [];
    if (Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0) {
      return selectedOrder.items.map((it, idx) => ({
        productId: it.productId || null,
        productName: it.productName || it.itemName || `Product ${idx + 1}`,
        capacity: it.capacity || "",
        qty: Number(it.qty) || 1,
      }));
    }
    if (selectedOrder.product_name || selectedOrder.productName) {
      return [
        {
          productId: selectedOrder.product_id || selectedOrder.productId || null,
          productName: selectedOrder.product_name || selectedOrder.productName || "Product",
          capacity: selectedOrder.capacity || "",
          qty: Number(selectedOrder.order_quantity || selectedOrder.orderQuantity || 1) || 1,
        },
      ];
    }
    return [];
  }, [selectedOrder]);

  // -----------------------------------
  // Update BOM item
  // -----------------------------------
  const updateBOMItem = (itemId, field, value) => {
    setBomItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
            ...item,
            [field]: value,
          }
          : item
      )
    );
  };

  // -----------------------------------
  // Add Extra Item
  // -----------------------------------
  const addExtraItem = (targetProduct = null) => {
    let prodName = "";
    let prodId = null;

    if (typeof targetProduct === "string") {
      prodName = targetProduct;
      const matched = orderProducts.find((p) => p.productName === targetProduct);
      if (matched) prodId = matched.productId;
    } else if (targetProduct && typeof targetProduct === "object") {
      prodName = targetProduct.productName || targetProduct.product_name || "";
      prodId = targetProduct.productId || targetProduct.product_id || null;
    } else if (orderProducts.length > 0) {
      prodName = orderProducts[0].productName;
      prodId = orderProducts[0].productId;
    }

    setExtraItems((prev) => [
      ...prev,
      {
        tempId: Date.now() + Math.random(),
        product_id: prodId,
        product_name: prodName,
        item_id: "",
        item_name: "",
        quantity: "",
        unit: "Nos",
        brand: "",
        remarks: "",
        is_extra: true,
      },
    ]);
  };

  // -----------------------------------
  // Update Extra Item
  // -----------------------------------
  const updateExtraItem = (tempId, field, value) => {
    setExtraItems((prev) =>
      prev.map((item) => {
        if (item.tempId !== tempId) return item;

        const updated = { ...item, [field]: value };

        // If product_name changed, also update product_id if found in orderProducts
        if (field === "product_name") {
          const matchedProd = orderProducts.find((p) => p.productName === value);
          if (matchedProd) {
            updated.product_id = matchedProd.productId;
          }
        }

        // If item_id changed, auto-populate item_name, unit, brand from items master
        if (field === "item_id") {
          const matched = items.find((m) => String(m.id) === String(value));
          if (matched) {
            updated.item_name = matched.item_name;
            updated.unit = matched.unit || matched.uom || "Nos";
            updated.unit_id = matched.unit || matched.uom || "Nos";
            if (matched.brand && !updated.brand) {
              updated.brand = matched.brand;
            }
          }
        }

        return updated;
      })
    );
  };

  // -----------------------------------
  // Remove Extra Item
  // -----------------------------------
  const removeExtraItem = (tempId) => {
    setExtraItems((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  // -----------------------------------
  // Create Payload
  // -----------------------------------
  const createPayload = (status) => {
    const primaryBomId = bomItems.find((it) => it.bom_id)?.bom_id || 1;

    return {
      sales_order_id: selectedOrder?.id,
      bom_id: primaryBomId,
      status,
      remarks: selectedOrder?.remarks || null,
      items: [
        ...bomItems.map((item) => ({
          item_id: item.item_id || item.id,
          bom_id: item.bom_id,
          product_id: item.product_id,
          product_name: item.product_name,
          unit: item.unit,
          brand: item.brand,
          standard_qty: item.standardQty,
          calculated_qty: item.calculatedQty,
          final_qty: Number(item.finalQty),
          remarks: item.remarks,
          is_extra: false,
        })),

        ...extraItems
          .filter((item) => item.item_id && Number(item.quantity) > 0)
          .map((item) => ({
            item_id: Number(item.item_id),
            product_id: item.product_id || null,
            product_name: item.product_name || null,
            unit: item.unit,
            brand: item.brand,
            standard_qty: Number(item.quantity),
            calculated_qty: Number(item.quantity),
            final_qty: Number(item.quantity),
            remarks: item.remarks,
            is_extra: true,
          })),
      ],
    };
  };

  // -----------------------------------
  // Save Draft
  // -----------------------------------
  const saveDraft = async () => {
    try {
      setSaving(true);
      setError("");

      const payload = createPayload("Draft");
      if (!payload.items.length) {
        setError("No items in BOM preparation to save.");
        return false;
      }

      const res = await saveBOMPreparation(payload);
      if (res?.success) {
        await fetchConfirmedOrders();
        return true;
      } else {
        setError(res?.message || "Failed to save draft.");
        return false;
      }
    } catch (err) {
      console.error("saveDraft error:", err);
      setError(
        err?.response?.data?.message || "An error occurred while saving draft."
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------------
  // Submit BOM
  // -----------------------------------
  const submitPreparation = async () => {
    try {
      setSaving(true);
      setError("");

      const payload = createPayload("Submitted");
      if (!payload.items.length) {
        setError("No items in BOM preparation to submit.");
        return false;
      }

      const res = await saveBOMPreparation(payload);
      if (res?.success) {
        await fetchConfirmedOrders();
        return true;
      } else {
        setError(res?.message || "Failed to submit BOM preparation.");
        return false;
      }
    } catch (err) {
      console.error("submitPreparation error:", err);
      setError(
        err?.response?.data?.message ||
        "An error occurred while submitting preparation."
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    confirmedOrders,
    selectedOrder,
    selectSalesOrder,
    orderProducts,

    bomItems,
    updateBOMItem,
    bomStatusList,

    extraItems,
    addExtraItem,
    updateExtraItem,
    removeExtraItem,

    units,
    brands,
    items,
    itemBrands,

    saveDraft,
    submitPreparation,

    loading,
    bomLoading,
    saving,
    error,
    warning,

    refreshOrders: fetchConfirmedOrders,
  };
};

export default useBOMPreparation;