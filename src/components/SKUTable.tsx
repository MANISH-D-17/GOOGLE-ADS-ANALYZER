import React, { useState } from 'react';
import { ChevronRight, AlertCircle, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { SKU, SKUState } from '../data/mockData';
import { cn, formatRupees, formatImpressions, stateBadgeColor } from '../lib/utils';

interface SKUTableProps {
  skus: any[]; // Changed to any to support ActualSKU
  onRowClick: (sku: any) => void;
}

const ITEMS_PER_PAGE = 25;

const SKUTable: React.FC<SKUTableProps> = ({ skus, onRowClick }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(skus.length / ITEMS_PER_PAGE);
  
  const currentSkus = skus.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const columns = [
    { label: 'Product / Category', className: 'w-[300px]' },
    { label: 'Intelligence State', className: 'w-[140px]' },
    { label: 'Availability', className: 'w-[100px] text-center' },
    { label: 'Impressions', className: 'w-[120px] text-right' },
    { label: 'CTR', className: 'w-[80px] text-right' },
    { label: 'Spend', className: 'w-[120px] text-right' },
    { label: 'Conv.', className: 'w-[80px] text-right' },
    { label: 'CVR', className: 'w-[80px] text-right' },
    { label: 'Revenue', className: 'w-[120px] text-right' },
    { label: 'ROAS', className: 'w-[100px] text-right' },
    { label: '', className: 'w-[40px]' },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                {columns.map((col, idx) => (
                  <th 
                    key={idx} 
                    className={cn(
                      "px-4 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400",
                      col.className
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentSkus.map((sku) => (
                <tr 
                  key={sku.id} 
                  onClick={() => onRowClick(sku)}
                  className="group hover:bg-gray-50/80 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">
                        {sku.name}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                          {sku.category}
                        </span>
                        <span className="text-[10px] text-gray-300 font-bold uppercase tracking-tight">•</span>
                        <span className="text-[10px] text-gray-400 font-black tracking-tight">
                          {sku.id}
                        </span>
                      </div>
                      {sku.warning && (
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] font-black text-red-500 uppercase tracking-tight">
                          <AlertCircle size={12} strokeWidth={3} />
                          {sku.warning}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border shadow-sm",
                      stateBadgeColor(sku.state)
                    )}>
                      {sku.state}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-center">
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full mx-auto ring-4 ring-offset-0",
                      sku.availability === 'in_stock' ? "bg-green-500 ring-green-50" : 
                      sku.availability === 'out_of_stock' ? "bg-red-500 ring-red-50" : "bg-amber-500 ring-amber-50"
                    )} />
                  </td>
                  <td className="px-4 py-5 text-right text-sm font-bold text-gray-600">
                    {formatImpressions(sku.impressions)}
                  </td>
                  <td className="px-4 py-5 text-right text-sm font-bold text-gray-600">
                    {sku.ctr}%
                  </td>
                  <td className="px-4 py-5 text-right text-sm font-black text-gray-900">
                    {formatRupees(sku.spend)}
                  </td>
                  <td className="px-4 py-5 text-right text-sm font-bold text-gray-600">
                    {Math.round(sku.conversions)}
                  </td>
                  <td className="px-4 py-5 text-right text-sm font-bold text-gray-600">
                    {((sku.conversions / (sku.clicks || 1)) * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-5 text-right text-sm font-black text-gray-900">
                    {formatRupees(sku.revenue)}
                  </td>
                  <td className={cn(
                    "px-4 py-5 text-right text-sm font-black",
                    sku.roas >= 4 ? "text-green-600" : sku.roas < 1.5 ? "text-red-600" : "text-blue-600"
                  )}>
                    {sku.roas.toFixed(2)}x
                  </td>
                  <td className="px-4 py-5 text-right">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                      <ChevronRight size={18} strokeWidth={3} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2">
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, skus.length)} of {skus.length}
        </div>
        <div className="flex items-center gap-2">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="p-2 rounded-lg border border-gray-100 bg-white text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="text-[10px] font-black text-gray-900 uppercase">
            Page {currentPage} of {totalPages}
          </div>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="p-2 rounded-lg border border-gray-100 bg-white text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRightIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SKUTable;
