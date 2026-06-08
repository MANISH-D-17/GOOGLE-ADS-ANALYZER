import React from 'react';
import { Search, Bell, Menu, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface HeaderProps {
  dateRange: string;
  setDateRange: (range: string) => void;
  onMobileMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ dateRange, setDateRange, onMobileMenuToggle }) => {
  const dateOptions = ['Today', 'Yesterday', 'Last 7d', 'Last 30d', 'Last 90d'];

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 text-gray-500 hover:text-gray-900"
        >
          <Menu size={20} />
        </button>
        <div className="text-sm font-bold text-gray-900 md:block hidden">GADS <span className="text-gray-400 font-medium">· Analytics</span></div>
        <div className="text-sm font-bold text-gray-900 md:hidden block">GADS Analytics</div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center bg-gray-50 border border-gray-100 rounded-lg p-1 mr-4 hidden md:flex">
          {dateOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => setDateRange(opt)}
              className={cn(
                "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                dateRange === opt 
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200" 
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
        
        {/* Mobile Date Dropdown Alternative */}
        <select 
          className="md:hidden border border-gray-200 rounded-md text-xs p-1"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
        >
          {dateOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        
        <div className="flex items-center gap-4 border-l border-gray-100 pl-4 ml-2">
          <div className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <Search size={18} />
          </div>
          <div className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <Bell size={18} />
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
            A
          </div>
        </div>
      </div>
    </header>
  );
};
