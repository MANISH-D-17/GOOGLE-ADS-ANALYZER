import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  render?: (value: any, row: any) => React.ReactNode;
  className?: string;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  searchable?: boolean;
  onRowClick?: (row: any) => void;
  filterSlot?: React.ReactNode;
}

export const DataTable: React.FC<DataTableProps> = ({ data, columns, searchable = true, onRowClick, filterSlot }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const filteredData = data.filter(row => 
    Object.values(row).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const currentData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="space-y-4">
      {(searchable || filterSlot) && (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex-1">
            {filterSlot}
          </div>
          {searchable && (
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search data..." 
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full sm:w-64 transition-all"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                {columns.map((col, idx) => (
                  <th key={idx} className={cn(
                    "px-4 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap",
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.className
                  )}>
                    <div className={cn("flex items-center gap-1", col.align === 'right' && "justify-end", col.align === 'center' && "justify-center")}>
                      {col.label}
                      {col.sortable && <ArrowUpDown size={12} className="text-gray-300 cursor-pointer hover:text-gray-600" />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentData.length > 0 ? (
                currentData.map((row, rIdx) => (
                  <tr 
                    key={rIdx} 
                    onClick={() => onRowClick && onRowClick(row)}
                    className={cn(
                      "group transition-colors",
                      onRowClick ? "hover:bg-gray-50/80 cursor-pointer" : "hover:bg-gray-50/50"
                    )}
                  >
                    {columns.map((col, cIdx) => (
                      <td key={cIdx} className={cn(
                        "px-4 py-5 text-sm whitespace-nowrap",
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      )}>
                        {col.render ? col.render(row[col.key], row) : <span className="font-bold text-gray-600">{row[col.key]}</span>}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Showing {(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length}
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
      )}
    </div>
  );
};
