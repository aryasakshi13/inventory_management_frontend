import React from 'react';
import { Layers, Calendar, Package, Hash, RefreshCw } from 'lucide-react';

const ItemsTable = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400 text-xs bg-white">
                <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                <p className="font-bold uppercase tracking-wider text-[10px] text-gray-400">Assembling Product Layout Grid...</p>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="text-gray-400 text-xs text-center py-20 font-bold uppercase tracking-wider bg-white">
                No individual hardware blueprints logged in your directory databases yet.
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-auto bg-white">
            {/* LIGHT TABLE GRID HEADERS */}
           <div className="sticky top-0 z-20 bg-gray-50 border-b border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-gray-50 text-gray-400 font-bold text-[11px] tracking-wider grid grid-cols-12 hidden md:grid uppercase">
                <div className="col-span-2 flex items-center gap-1"><Hash size={12} /> Item ID</div>              
                <div className="col-span-3 flex items-center gap-1"><Layers size={12} /> Category</div>
                <div className="col-span-4 flex items-center gap-1"><Package size={12} /> Item Name </div>
                <div className="col-span-3 flex items-center gap-1"><Calendar size={12} /> Item Stock</div>
            </div>
          </div>

            {/* LIGHT TABLE ROWS */}
            <div className="divide-y divide-gray-100 bg-white">
                {data.map((row) => {
                    const totalStock = parseInt(row.TotalGlobalStock) || 0;
                    return (
                        <div 
                            key={row.ItemId} 
                            className="p-4 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-0 items-center text-xs hover:bg-gray-50/60 transition-colors font-semibold text-gray-700"
                        >
                            {/* Product ID */}
                            <div className="col-span-2 pl-4 text-black font-medium">
                                #{String(row.ItemId).padStart(4, '0')}
                            </div>
                             
                             <div className="col-span-3 text-black font-medium uppercase tracking-wide truncate pr-4">
                               
                                    {row.Category}
                            
                            </div>


                            {/* Item Name */}
                            <div className="col-span-4 text-black font-medium uppercase tracking-wide truncate pr-2">
                                {row.ItemName}
                            </div>

                            {/* Category Badge */}
                            
                            {/* Real-time Accumulated Units Stock */}
                            <div className="col-span-3">
                                <span className={`inline-block  font-medium px-2.5 py-0.5 rounded text-[11px] border ${
                                    totalStock > 0 
                                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200/60' 
                                        : 'text-amber-700 bg-amber-50 border-amber-200/60'
                                }`}>
                                    {totalStock} 
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ItemsTable;