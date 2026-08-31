import React from "react";

const BOMPreparationHeader = ({ onBack }) => {
  if (!onBack) return null;

  return (
    <div className="flex justify-end items-center mb-4">
      <button
        onClick={onBack}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-xs"
      >
        ← Back to Orders
      </button>
    </div>
  );
};

export default BOMPreparationHeader;