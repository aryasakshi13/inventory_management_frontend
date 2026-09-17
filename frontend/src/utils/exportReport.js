import * as XLSX from "xlsx";

/**
 * Generic helper to download an array of objects as an Excel (.xlsx) file
 * with auto-calculated column widths.
 */
export const exportToExcel = (data, fileName = "report", sheetName = "Report") => {
  if (!Array.isArray(data) || data.length === 0) {
    alert("No data available to export.");
    return false;
  }

  try {
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-fit column widths based on maximum cell content length
    const colWidths = Object.keys(data[0] || {}).map((key) => {
      const maxContentLength = data.reduce((max, row) => {
        const val = row[key] !== null && row[key] !== undefined ? String(row[key]) : "";
        return Math.max(max, val.length);
      }, key.length);

      return { wch: Math.min(Math.max(maxContentLength + 3, 10), 50) };
    });

    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));

    const dateStr = new Date().toISOString().split("T")[0];
    const finalFileName = `${fileName.replace(/\.xlsx$/i, "")}_${dateStr}.xlsx`;

    XLSX.writeFile(workbook, finalFileName);
    return true;
  } catch (error) {
    console.error("Export to Excel error:", error);
    alert("Failed to export report to Excel. Please try again.");
    return false;
  }
};

/**
 * 1. Export Sales Orders Report
 */
export const exportSalesOrdersReport = (orders = []) => {
  if (!orders || orders.length === 0) {
    alert("No sales orders to export.");
    return;
  }

  const exportData = orders.map((order, index) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const productNames = items.length > 0
      ? items.map((i) => `${i.productName || i.itemName || "Product"} (${i.capacity || "N/A"}) x ${i.qty || 1}`).join("; ")
      : `${order.product_name || order.productName || "—"} (${order.capacity || "N/A"}) x ${order.order_quantity || 1}`;

    const totalQty = items.length > 0
      ? items.reduce((sum, i) => sum + (Number(i.qty) || 0), 0)
      : (order.order_quantity || order.orderQuantity || 1);

    const formatOrderDate = (d) => {
      if (!d) return "—";
      try {
        return new Date(d).toLocaleDateString("en-IN");
      } catch {
        return String(d).split("T")[0];
      }
    };

    return {
      "S.No": index + 1,
      "Sales Order No": order.sales_order_no || order.salesOrderNo || order.poNo || `SO-${order.id}`,
      "Client Name": order.client_name || order.clientName || order.client?.name || "—",
      "PO Date": formatOrderDate(order.order_date || order.orderDate || order.poDate),
      "Products Ordered": productNames,
      "Total Quantity": totalQty,
      "Status": order.status || order.Status || "Pending",
      "Shipping / Site Address": order.shippingAddress || order.siteAddress || "—",
      "BOM Prepared": order.is_prepared || order.preparation ? "Yes" : "No",
    };
  });

  exportToExcel(exportData, "Sales_Orders_Report", "Sales Orders");
};

/**
 * 2. Export BOM Master List Report (Item-wise detailed sheet for all BOMs)
 */
export const exportBOMMasterReport = (boms = []) => {
  if (!boms || boms.length === 0) {
    alert("No BOM records to export.");
    return;
  }

  const rows = [];
  let sNo = 1;

  boms.forEach((bom) => {
    const rawItems = Array.isArray(bom.items) && bom.items.length > 0
      ? bom.items
      : (Array.isArray(bom.store_items_id) ? bom.store_items_id : []);

    const dateVal = bom.created_at ? new Date(bom.created_at).toLocaleDateString("en-IN") : "—";

    if (rawItems.length === 0) {
      rows.push({
        "S.No": sNo++,
        "BOM ID": bom.id || "—",
        "Product Name": bom.product_name || bom.productName || "—",
        "Item / Material Name": "—",
        "Quantity": 0,
        "Unit / UOM": "—",
        "Created Date": dateVal,
      });
    } else {
      rawItems.forEach((it) => {
        const itName = it.item_name || it.itemName || it.name || (it.itemId ? `Item #${it.itemId}` : "—");
        const itQty = Number(it.quantity ?? it.qty ?? 1);
        const itUnit = it.unit || it.uom || "Nos";

        rows.push({
          "S.No": sNo++,
          "BOM ID": bom.id || "—",
          "Product Name": bom.product_name || bom.productName || "—",
          "Item / Material Name": itName,
          "Quantity": itQty,
          "Unit / UOM": itUnit,
          "Created Date": dateVal,
        });
      });
    }
  });

  exportToExcel(rows, "BOM_Master_Report", "BOM Master Items");
};

/**
 * 3. Export Single BOM Preparation Detailed Sheet (for a Sales Order)
 */
export const exportBOMDetailReport = (order, standardItems = [], extraItems = []) => {
  if (!order) {
    alert("No order selected for BOM export.");
    return;
  }

  const rows = [];

  // 1. Standard Items
  standardItems.forEach((item, idx) => {
    rows.push({
      "Section": "Standard BOM",
      "Product": item.product_name || "—",
      "Item / Material Name": item.item_name || item.itemName || "—",
      "Std Qty": Number(item.standardQty ?? item.quantity ?? 1),
      "Unit": item.unit || "Nos",
      "Calculated Qty": Number(item.calculatedQty ?? item.finalQty ?? 1),
      "Brand": item.brand || "—",
      "Remarks": item.remarks || "",
    });
  });

  // 2. Extra Items
  extraItems.forEach((item, idx) => {
    rows.push({
      "Section": "Extra / Additional Item",
      "Product": item.product_name || "—",
      "Item / Material Name": item.item_name || item.itemName || "—",
      "Std Qty": Number(item.quantity ?? 1),
      "Unit": item.unit || "Nos",
      "Calculated Qty": Number(item.quantity ?? 1),
      "Brand": item.brand || "—",
      "Remarks": item.remarks || "",
    });
  });

  if (rows.length === 0) {
    alert("No items in BOM to export.");
    return;
  }

  const soNo = order.sales_order_no || order.salesOrderNo || `SO_${order.id}`;
  exportToExcel(rows, `BOM_Report_${soNo}`, "BOM Items");
};

/**
 * 4. Export Warehouse / Store Stock Report
 */
export const exportWarehouseStockReport = (items = []) => {
  if (!items || items.length === 0) {
    alert("No warehouse stock items to export.");
    return;
  }

  const getItemStatus = (qty, threshold) => {
    const quantity = qty ?? 0;
    const thresh = threshold ?? 10;
    if (quantity <= 0) return "Out of Stock";
    if (quantity <= thresh) return "Low Stock";
    return "In Stock";
  };

  const exportData = items.map((item, index) => {
    const threshold = item.min_threshold ?? item.minThreshold ?? 10;
    const quantity = item.quantity ?? 0;
    const status = getItemStatus(quantity, threshold);
    const itemType = (item.item_type || 'raw_material').replace('_', ' ');

    return {
      "S.No": index + 1,
      "Item Code / ID": item.item_code || `STORE-${item.id || index + 1}`,
      "Classification": itemType.charAt(0).toUpperCase() + itemType.slice(1),
      "Category": item.category || "General",
      "Item Name": item.item_name || item.itemName || "—",
      "UOM / Unit": item.unit || item.uom || "Nos",
      "Current Stock Quantity": quantity,
      "Min Alert Threshold": threshold,
      "Stock Status": status,
      "Item Status": item.is_active !== undefined ? (Number(item.is_active) === 0 ? "Inactive" : "Active") : "Active",
    };
  });

  exportToExcel(exportData, "Warehouse_Stock_Report", "Warehouse Stock");
};

/**
 * 5. Export Damaged Items Detailed Task Report
 */
export const exportDamagedItemsDetailedReport = (tasks = [], dateRange = {}) => {
  if (!tasks || tasks.length === 0) {
    alert("No damaged items data available to export.");
    return;
  }

  const rows = [];
  let sNo = 1;

  tasks.forEach((task) => {
    let damagedItems = [];
    const notes = task.notes || '';
    const scrapMatch = notes.match(/\[RAW MATERIALS SCRAP DETAILS\]:\s*([\s\S]*?)(?=\n\[|$)/i);
    if (scrapMatch && scrapMatch[1]) {
      const scrapText = scrapMatch[1].trim();
      const entries = scrapText.split(',').map((s) => s.trim()).filter(Boolean);
      entries.forEach((entry) => {
        const parts = entry.split(':');
        if (parts.length >= 2) {
          const name = parts[0].trim();
          const rest = parts[1].trim();
          const qtyMatch = rest.match(/([\d.]+)/);
          const unitMatch = rest
            .replace(/[\d.]+/g, '')
            .replace(/\/?\s*(?:damaged|scrapped|defective)\b/gi, '')
            .replace(/[\/\s]+$/, '')
            .trim();
          damagedItems.push({
            item_name: name,
            qty: qtyMatch ? parseFloat(qtyMatch[1]) : rest,
            unit: unitMatch || 'Units',
          });
        } else {
          damagedItems.push({
            item_name: entry.replace(/damaged|scrapped/gi, '').trim(),
            qty: '—',
            unit: '—',
          });
        }
      });
    }

    const taskDate = task.completion_date || task.updated_at || task.created_at;
    const formattedDate = taskDate ? new Date(taskDate).toLocaleDateString("en-IN") : "—";

    if (damagedItems.length === 0) {
      rows.push({
        "S.No": sNo++,
        "Task ID": task.task_id || `TASK-${task.id}`,
        "Product / Batch Name": task.product_name || "—",
        "Assigned / In-charge": task.assigned_to || "—",
        "Reported Date": formattedDate,
        "Damaged Item Name": "—",
        "Damaged / Scrapped Qty": 0,
        "Unit": "—",
      });
    } else {
      damagedItems.forEach((it) => {
        const cleanUnit = it.unit ? String(it.unit).replace(/[\/\s]+$/, '').trim() : "Units";
        rows.push({
          "S.No": sNo++,
          "Task ID": task.task_id || `TASK-${task.id}`,
          "Product / Batch Name": task.product_name || "—",
          "Assigned / In-charge": task.assigned_to || "—",
          "Reported Date": formattedDate,
          "Damaged Item Name": it.item_name || "—",
          "Damaged / Scrapped Qty": it.qty ?? 0,
          "Unit": cleanUnit || "Units",
        });
      });
    }
  });

  const rangeStr = (dateRange.from || dateRange.to)
    ? `_${dateRange.from || 'start'}_to_${dateRange.to || 'end'}`
    : '';

  exportToExcel(rows, `Damaged_Items_Detailed_Report${rangeStr}`, "Detailed Damage Report");
};

/**
 * 6. Export Damaged Items Date-Range Summary Report
 */
export const exportDamagedItemsSummaryReport = (aggregatedItems = [], dateRange = {}) => {
  if (!aggregatedItems || aggregatedItems.length === 0) {
    alert("No summary damage data available to export.");
    return;
  }

  const rows = aggregatedItems.map((it, idx) => {
    const reportedDate = it.latest_date ? new Date(it.latest_date).toLocaleDateString("en-IN") : "—";
    const cleanUnit = it.unit ? String(it.unit).replace(/[\/\s]+$/, '').trim() : "Units";
    return {
      "S.No": idx + 1,
      "Damaged Item Name": it.item_name || "—",
      "Total Damaged / Scrapped Qty": it.total_qty ?? 0,
      "Unit": cleanUnit || "Units",
      "Reported Date": reportedDate,
    };
  });

  const rangeStr = (dateRange.from || dateRange.to)
    ? `_${dateRange.from || 'start'}_to_${dateRange.to || 'end'}`
    : '';

  exportToExcel(rows, `Damaged_Items_Summary_Report${rangeStr}`, "Damage Summary Report");
};

/**
 * 7. Export Returned Items Report
 */
export const exportReturnedItemsReport = (tasks = [], dateRange = {}) => {
  if (!tasks || tasks.length === 0) {
    alert("No returned items data available to export.");
    return;
  }

  const rows = [];
  let sNo = 1;

  tasks.forEach((task) => {
    const isAccepted = (task.notes || '').includes('[STORE RETURNS ACCEPTED]');
    const taskDate = task.completion_date || task.updated_at || task.created_at;
    const formattedDate = taskDate ? new Date(taskDate).toLocaleDateString("en-IN") : "—";

    const notes = task.notes || '';
    const returnMatch = notes.match(/\[STORE RETURN DETAILS\]:\s*([\s\S]*?)(?=\n\[|$)/i);
    let returnedItems = [];
    if (returnMatch && returnMatch[1]) {
      const returnText = returnMatch[1].trim();
      const entries = returnText.split(',').map((s) => s.trim()).filter(Boolean);
      entries.forEach((entry) => {
        const parts = entry.split(':');
        if (parts.length >= 2) {
          const name = parts[0].trim();
          const rest = parts[1].trim();
          const qtyMatch = rest.match(/([\d.]+)/);
          const unitMatch = rest
            .replace(/[\d.]+/g, '')
            .replace(/\/?\s*(?:returned|to|store)\b/gi, '')
            .replace(/[\/\s]+$/, '')
            .trim();
          returnedItems.push({
            item_name: name,
            qty: qtyMatch ? parseFloat(qtyMatch[1]) : rest,
            unit: unitMatch || 'Units',
          });
        } else {
          returnedItems.push({
            item_name: entry.replace(/returned to store/gi, '').trim(),
            qty: '—',
            unit: '—',
          });
        }
      });
    }

    if (returnedItems.length === 0) {
      rows.push({
        "S.No": sNo++,
        "Task ID": task.task_id || `TASK-${task.id}`,
        "Finished Product": task.product_name || "—",
        "Returned Item Name": "—",
        "Returned Qty": 0,
        "Unit": "—",
        "Returned Date": formattedDate,
        "Store Inward Status": isAccepted ? "Accepted in Store" : "Pending Acceptance"
      });
    } else {
      returnedItems.forEach((it) => {
        const cleanUnit = it.unit ? String(it.unit).replace(/[\/\s]+$/, '').trim() : "Units";
        rows.push({
          "S.No": sNo++,
          "Task ID": task.task_id || `TASK-${task.id}`,
          "Finished Product": task.product_name || "—",
          "Returned Item Name": it.item_name || "—",
          "Returned Qty": it.qty ?? 0,
          "Unit": cleanUnit || "Units",
          "Returned Date": formattedDate,
          "Store Inward Status": isAccepted ? "Accepted in Store" : "Pending Acceptance"
        });
      });
    }
  });

  const rangeStr = (dateRange.from || dateRange.to)
    ? `_${dateRange.from || 'start'}_to_${dateRange.to || 'end'}`
    : '';

  exportToExcel(rows, `Returned_Items_Report${rangeStr}`, "Returned Items");
};

