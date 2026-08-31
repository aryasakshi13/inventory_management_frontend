import React from "react";
import { Calculator, ChevronDown } from "lucide-react";

const BOMSelector = ({
  bomOptions,
  selectedBOM,
  onChange,
  onCalculate,
  disabled,
}) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Standard BOM / BOQ
          </label>

          <div className="relative">
            <select
              value={selectedBOM?.id || ""}
              onChange={(e) => onChange(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-4 py-2.5 pr-10 text-sm outline-none focus:border-slate-500"
            >
              <option value="">
                Select Standard BOM / BOQ
              </option>

              {bomOptions.map((bom) => (
                <option key={bom.id} value={bom.id}>
                  {bom.bom_name ||
                    `${bom.product_name} - ${bom.capacity}`}
                </option>
              ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <button
          disabled={disabled || !selectedBOM}
          onClick={onCalculate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Calculator className="h-4 w-4" />
          Calculate BOM
        </button>
      </div>
    </div>
  );
};

export default BOMSelector;