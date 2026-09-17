import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Building2,
  FileText,
  Package,
  Wrench,
  Percent,
  Layers,
  Info,
  AlertCircle
} from 'lucide-react';
import { getClients } from '../../client/services/clientService';
import { createQuotation, createQuotationRevision } from '../services/quotationService';
import axios from 'axios';

export const CreateQuotationModal = ({
  isOpen,
  onClose,
  onSuccess,
  sourceQuotation = null, // If provided, this is Create Revision Mode!
}) => {
  const isRevision = Boolean(sourceQuotation);

  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [clientId, setClientId] = useState('');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState('');
  const [orderType, setOrderType] = useState('in_house');
  const [projectName, setProjectName] = useState('');
  const [taxRate, setTaxRate] = useState(18);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [termsAndConditions, setTermsAndConditions] = useState(
    '1. Quotation is valid for 30 days from date of issue.\n2. Payment terms: 50% advance, 50% on delivery.\n3. Goods once sold will not be returned.'
  );
  const [remarks, setRemarks] = useState('');

  const [items, setItems] = useState([
    {
      product_id: '',
      item_name: '',
      description: '',
      uom: 'Nos',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
    },
  ]);

  // Load clients and products
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        const [clientRes, prodRes] = await Promise.all([
          getClients({ role: 'client', limit: 200 }).catch(() => ({ data: [] })),
          axios.get('/api/products', { withCredentials: true }).catch(() => ({ data: { data: [] } })),
        ]);

        const cList = Array.isArray(clientRes?.data) ? clientRes.data : (Array.isArray(clientRes) ? clientRes : []);
        setClients(cList);

        const pList = prodRes?.data?.data || prodRes?.data || [];
        setProducts(Array.isArray(pList) ? pList : []);
      } catch (err) {
        console.warn('Failed to load initial quotation dropdown data:', err);
      }
    };

    loadData();
  }, [isOpen]);

  // Populate data if Revision Mode
  useEffect(() => {
    if (isOpen && isRevision && sourceQuotation) {
      setClientId(sourceQuotation.client_id || sourceQuotation.clientId || '');
      setQuotationDate(new Date().toISOString().split('T')[0]);
      setValidUntil(sourceQuotation.valid_until ? sourceQuotation.valid_until.split('T')[0] : '');
      setOrderType(sourceQuotation.order_type || sourceQuotation.orderType || 'in_house');
      setProjectName(sourceQuotation.project_name || sourceQuotation.projectName || '');
      setTaxRate(Number(sourceQuotation.tax_rate ?? 18));
      setDiscountAmount(Number(sourceQuotation.discount_amount ?? 0));
      setTermsAndConditions(sourceQuotation.terms_and_conditions || '');
      setRemarks(sourceQuotation.remarks || '');

      if (Array.isArray(sourceQuotation.items) && sourceQuotation.items.length > 0) {
        setItems(
          sourceQuotation.items.map((it) => ({
            product_id: it.product_id || '',
            item_name: it.item_name || it.product_name || '',
            description: it.description || it.capacity || '',
            uom: it.uom || it.unit || 'Nos',
            quantity: Number(it.quantity || it.qty || 1),
            unit_price: Number(it.unit_price || it.unitPrice || it.price || 0),
            total_price: Number(it.total_price || it.totalPrice || it.total || 0),
          }))
        );
      }
    } else if (isOpen && !isRevision) {
      // Reset form
      setClientId('');
      setQuotationDate(new Date().toISOString().split('T')[0]);
      setValidUntil('');
      setOrderType('in_house');
      setProjectName('');
      setTaxRate(18);
      setDiscountAmount(0);
      setTermsAndConditions(
        '1. Quotation is valid for 30 days from date of issue.\n2. Payment terms: 50% advance, 50% on delivery.\n3. Goods once sold will not be returned.'
      );
      setRemarks('');
      setItems([
        {
          product_id: '',
          item_name: '',
          description: '',
          uom: 'Nos',
          quantity: 1,
          unit_price: 0,
          total_price: 0,
        },
      ]);
      setError(null);
    }
  }, [isOpen, isRevision, sourceQuotation]);

  if (!isOpen) return null;

  // Handle Item Row Changes
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    if (field === 'product_id') {
      const selectedProd = products.find((p) => String(p.id) === String(value));
      if (selectedProd) {
        item.item_name = selectedProd.product_name || selectedProd.name || '';
        item.description = selectedProd.description || selectedProd.capacity || item.description || '';
        item.uom = selectedProd.uom || selectedProd.unit || item.uom || 'Nos';
        if (selectedProd.price || selectedProd.selling_price) {
          item.unit_price = Number(selectedProd.price || selectedProd.selling_price || 0);
        }
      }
    }

    const qty = Number(item.quantity || 0);
    const price = Number(item.unit_price || 0);
    item.total_price = qty * price;

    updated[index] = item;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        product_id: '',
        item_name: '',
        description: '',
        uom: 'Nos',
        quantity: 1,
        unit_price: 0,
        total_price: 0,
      },
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Summary Calculations
  const subtotal = items.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
  const discount = Number(discountAmount || 0);
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = (taxableAmount * Number(taxRate || 0)) / 100;
  const grandTotal = taxableAmount + tax;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!clientId) {
      return setError('Please select a client.');
    }

    if (items.some((it) => !it.product_id && !it.item_name.trim())) {
      return setError('Please select a product for all item rows.');
    }

    if (items.some((it) => Number(it.quantity) <= 0)) {
      return setError('Item quantity must be greater than 0.');
    }

    const payload = {
      clientId,
      quotationDate,
      validUntil: validUntil || null,
      orderType,
      projectName: projectName.trim(),
      taxRate: Number(taxRate || 0),
      discountAmount: Number(discountAmount || 0),
      termsAndConditions,
      remarks,
      items,
    };

    try {
      setLoading(true);
      let response;
      if (isRevision && sourceQuotation?.id) {
        response = await createQuotationRevision(sourceQuotation.id, payload);
      } else {
        response = await createQuotation(payload);
      }

      if (response?.success) {
        onSuccess(response.data);
        onClose();
      } else {
        setError(response?.message || 'Failed to save quotation.');
      }
    } catch (err) {
      console.error('Error saving quotation:', err);
      setError(err?.response?.data?.message || err.message || 'Server error while saving quotation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col border border-gray-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/30 border border-blue-400/30 text-blue-300">
              {isRevision ? <Layers size={20} /> : <FileText size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">
                  {isRevision
                    ? `Create Revision for ${sourceQuotation.quotation_number}`
                    : 'Create New Quotation'}
                </h2>
                {isRevision && (
                  <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    New Version: v{(Number(sourceQuotation.version) || 1) + 1}
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-200/80">
                {isRevision
                  ? 'Creates a new locked revision (v2, v3) preserving previous version audit history.'
                  : 'Prepare and send professional quotation to prospective or existing clients.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs bg-slate-50/50">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Client & Basic Info */}
          <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <Building2 size={15} className="text-blue-600" />
              Client & Quotation Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Client Selector */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Client / Company <span className="text-red-500">*</span>
                </label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  disabled={isRevision}
                  className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium disabled:bg-gray-100"
                >
                  <option value="">-- Select Client --</option>
                  {clients.map((c) => (
                    <option key={c.Id || c.id} value={c.Id || c.id}>
                      {c.companyName || c.clientName} {c.Phone ? `(${c.Phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quotation Date */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Quotation Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={quotationDate}
                  onChange={(e) => setQuotationDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium"
                />
              </div>

              {/* Validity Date */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Valid Until (Expiry)</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium"
                />
              </div>
            </div>

            {/* Order / Fulfilment Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block font-semibold text-gray-700 mb-1.5">Quotation / Fulfilment Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${
                      orderType === 'in_house'
                        ? 'border-purple-600 bg-purple-50/70 text-purple-900 font-bold'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="orderType"
                      value="in_house"
                      checked={orderType === 'in_house'}
                      onChange={() => setOrderType('in_house')}
                      className="hidden"
                    />
                    <Package size={16} className={orderType === 'in_house' ? 'text-purple-600' : 'text-gray-400'} />
                    <span>In-House Direct Product</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${
                      orderType === 'site_assembly'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="orderType"
                      value="site_assembly"
                      checked={orderType === 'site_assembly'}
                      onChange={() => setOrderType('site_assembly')}
                      className="hidden"
                    />
                    <Wrench size={16} className={orderType === 'site_assembly' ? 'text-blue-600' : 'text-gray-400'} />
                    <span>Site Assembly Project</span>
                  </label>
                </div>
              </div>

              {/* Project / Title Name */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {orderType === 'site_assembly' ? 'Project / Site Name' : 'Subject / Order Title'}
                </label>
                <input
                  type="text"
                  placeholder={orderType === 'site_assembly' ? 'e.g. 50kW Rooftop Solar Project - Noida' : 'e.g. In-House Solar Mounting Delivery'}
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Line Items Builder */}
          <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <Package size={15} className="text-blue-600" />
                Line Items & Pricing ({items.length})
              </h3>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-semibold transition cursor-pointer"
              >
                <Plus size={14} />
                Add Item Row
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-gray-50 text-gray-600 border-b font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="p-2.5 w-10 text-center">#</th>
                    <th className="p-2.5 min-w-[200px]">Product / Item Name</th>
                    <th className="p-2.5 min-w-[160px]">Description / Capacity</th>
                    <th className="p-2.5 w-24">UOM</th>
                    <th className="p-2.5 w-24 text-right">Qty</th>
                    <th className="p-2.5 w-32 text-right">Unit Price (₹)</th>
                    <th className="p-2.5 w-32 text-right">Total (₹)</th>
                    <th className="p-2.5 w-12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2.5 text-center font-bold text-gray-400">{idx + 1}</td>
                      <td className="p-2.5">
                        <select
                          value={row.product_id || ''}
                          onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white text-gray-900 font-medium focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer"
                        >
                          <option value="">-- Select Product --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.product_name || p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          placeholder="e.g. 5kW / Hot Dip Galv..."
                          value={row.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs text-gray-800 focus:border-blue-500 outline-none"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={row.uom}
                          onChange={(e) => handleItemChange(idx, 'uom', e.target.value)}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs text-gray-800 focus:border-blue-500 outline-none"
                        />
                      </td>
                      <td className="p-2.5 text-right">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={row.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs text-right font-bold text-gray-900 focus:border-blue-500 outline-none"
                        />
                      </td>
                      <td className="p-2.5 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.unit_price}
                          onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs text-right font-medium text-gray-900 focus:border-blue-500 outline-none"
                        />
                      </td>
                      <td className="p-2.5 text-right font-bold text-gray-900">
                        ₹{(row.total_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          disabled={items.length === 1}
                          className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30 transition cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3">
              {/* Terms & Conditions */}
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Terms & Conditions</label>
                  <textarea
                    rows={3}
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Internal Remarks / Notes</label>
                  <input
                    type="text"
                    placeholder="Optional internal notes..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-xs text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-gray-900">
                    ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-gray-600">
                  <span>Discount Amount (₹):</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-28 text-right border border-gray-300 rounded px-2 py-0.5 bg-white text-xs font-semibold text-gray-900 outline-none"
                  />
                </div>

                <div className="flex items-center justify-between text-gray-600">
                  <span className="flex items-center gap-1">
                    <Percent size={13} className="text-gray-400" />
                    GST / Tax Rate (%):
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-28 text-right border border-gray-300 rounded px-2 py-0.5 bg-white text-xs font-semibold text-gray-900 outline-none"
                  />
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Tax Amount:</span>
                  <span className="font-semibold text-gray-900">
                    ₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="border-t border-gray-300 pt-2 flex justify-between items-center text-sm font-bold text-gray-900">
                  <span>Grand Total (INR):</span>
                  <span className="text-base text-blue-700">
                    ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading
                ? 'Saving Quotation...'
                : isRevision
                ? `Save Revision v${(Number(sourceQuotation.version) || 1) + 1}`
                : 'Create Quotation (v1)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
