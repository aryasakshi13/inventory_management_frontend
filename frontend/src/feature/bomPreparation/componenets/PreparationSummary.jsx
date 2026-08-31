import React from "react";
import {
  Save,
  CheckCircle2,
  Download,
} from "lucide-react";

const PreparationSummary = ({
  onSaveDraft,
  onSubmit,
  onDownloadReport,
  saving,
}) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap justify-between items-center gap-3">
        {onDownloadReport ? (
          <button
            type="button"
            onClick={onDownloadReport}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-600 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2.5 text-sm font-semibold transition shadow-xs"
          >
            <Download className="h-4 w-4" />
            Download BOM Sheet (.xlsx)
          </button>
        ) : <div />}

        <div className="flex items-center gap-3">
          <button
            onClick={onSaveDraft}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition shadow-xs"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </button>

          <button
            onClick={onSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition shadow-xs"
          >
            <CheckCircle2 className="h-4 w-4" />
            {saving ? "Submitting..." : "Submit BOM / BOQ"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreparationSummary;