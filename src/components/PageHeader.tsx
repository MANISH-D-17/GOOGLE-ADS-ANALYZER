import React from 'react';
import { 
  BarChart3, 
  Download, 
  RotateCcw, 
  ChevronDown 
} from 'lucide-react';
import { cn } from '../lib/utils';

interface PageHeaderProps {
  title: string;
  dateRange: string;
  currency?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, dateRange, currency = 'INR' }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-5 w-full md:w-auto">
        <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100/50 shadow-sm">
          <BarChart3 size={28} className="text-gray-900" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h1>
          <div className="flex items-center gap-4 mt-1.5">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100/50">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date Range:</span>
              <span className="text-[11px] font-black text-gray-700">{dateRange}</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100/50">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Currency:</span>
              <span className="text-[11px] font-black text-gray-700">{currency}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="relative group w-full md:w-32">
          <button className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-black text-gray-700 hover:bg-gray-50 transition-all">
            {currency}
            <ChevronDown size={14} className="text-gray-400" />
          </button>
        </div>
        
        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-white border border-gray-100 rounded-xl text-xs font-black text-gray-700 hover:bg-gray-50 transition-all">
          <Download size={14} className="text-gray-400" />
          Export
        </button>

        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-white border border-gray-100 rounded-xl text-xs font-black text-gray-700 hover:bg-gray-50 transition-all">
          <RotateCcw size={14} className="text-gray-400" />
          Refresh
        </button>
      </div>
    </div>
  );
};

export default PageHeader;
