import React, { useState, useEffect } from 'react';
import {
  X,
  Boxes,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Clock,
  Check
} from 'lucide-react';
import axios from 'axios';
import { issueMaterialsToProduction } from '../../production/services/productionService';

export const StoreProductionRequestsModal = ({ isOpen, onClose, onRefreshStore }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchProductionRequests = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const prodUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:5001/api/production'
        : 'https://www.namami-infotech.com/inventory/api/production';
      const res = await axios.get(prodUrl, { withCredentials: true }).catch(() => ({ data: [] }));
      const allTasks = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
          ? res.data.data
          : [];
      // Filter tasks that need material dispatch
      const pendingTasks = allTasks.filter((t) =>
        ['planned', 'material requested', 'partially issued'].includes((t.status || 'planned').toLowerCase())
      );
      setRequests(pendingTasks);
    } catch (err) {
      console.error("Error fetching production requests in store:", err);
      setErrorMsg('Failed to load production requisitions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProductionRequests();
    }
  }, [isOpen]);

  const handleDispatchMaterials = async (task) => {
    if (!window.confirm(`Issue and dispatch all required BOM materials for "${task.task_id}" (${task.product_name})? This will deduct the items from Warehouse stock.`)) {
      return;
    }
    try {
      setProcessingId(task.id);
      setErrorMsg('');
      setSuccessMsg('');
      await issueMaterialsToProduction(task.id, {});
      setSuccessMsg(`Materials successfully dispatched for ${task.task_id}! Warehouse stock has been deducted.`);
      await fetchProductionRequests();
      if (onRefreshStore) onRefreshStore();
    } catch (err) {
      console.error("Error dispatching materials from store:", err);
      setErrorMsg(err.response?.data?.message || 'Failed to dispatch materials.');
    } finally {
      setProcessingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl overflow-hidden max-h-[85vh] flex flex-col text-xs">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Boxes size={18} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Production Material Requisitions (Store Dispatch)</h3>
              <p className="text-[11px] text-gray-500">
                Warehouse Manager review & dispatch raw materials requested by Production floor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-semibold flex items-center gap-2">
            <AlertCircle size={15} /> <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-semibold flex items-center gap-2">
            <CheckCircle2 size={15} /> <span>{successMsg}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="p-10 text-center text-gray-400 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span>Loading requisitions...</span>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-10 text-center text-gray-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
              <p className="text-sm font-bold text-gray-700">All Material Requests Fulfilled</p>
              <p className="text-xs text-gray-400">There are no pending raw material requisitions from the Production floor.</p>
            </div>
          ) : (
            requests.map((task) => {
              const reqQty = parseFloat(task.total_required_qty) || 0;
              const issQty = parseFloat(task.total_issued_qty) || 0;
              const isProcessing = processingId === task.id;

              return (
                <div
                  key={task.id}
                  className="p-4 bg-white border border-gray-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-indigo-300 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                        {task.task_id}
                      </span>
                      <span className="font-bold text-gray-900 text-xs">{task.product_name}</span>
                      <span className="text-[10px] text-gray-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                        Batch: {task.proposed_quantity} Units
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      In-charge: <strong>{task.assigned_to || 'Unassigned'}</strong> | Required: <strong>{reqQty} raw components</strong> (Issued: {issQty})
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDispatchMaterials(task)}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send size={13} />}
                    <span>⚡ Issue & Dispatch from Store</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
