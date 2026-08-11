import React from 'react';

export const PurchaseSummaryCard = ({ totals }) => {
  return (
    <div className="flex justify-end">
      <div className="w-full md:w-80 bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-2.5 text-xs">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal:</span>
          <span className="font-mono font-semibold text-gray-900">
            ₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span>Total Discount (-):</span>
          <span className="font-mono font-semibold text-emerald-600">
            - ₹{totals.totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span>Total Tax (+):</span>
          <span className="font-mono font-semibold text-amber-600">
            + ₹{totals.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <hr className="border-gray-200" />

        <div className="flex justify-between text-sm font-bold text-gray-900 pt-1">
          <span>Grand Total:</span>
          <span className="font-mono text-blue-600">
            ₹{totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
};