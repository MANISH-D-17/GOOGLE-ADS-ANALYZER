import React from 'react';
import { Search, ChevronDown, Filter } from 'lucide-react';
import { cn } from '../lib/utils';
import { SKUState } from '../data/actualDataLoader';

interface FilterBarProps {
  activeState: SKUState | 'all';
  setActiveState: (state: SKUState | 'all') => void;
  category: string;
  setCategory: (cat: string) => void;
  availability: string;
  setAvailability: (avail: string) => void;
  sort: string;
  setSort: (sort: string) => void;
  search: string;
  setSearch: (search: string) => void;
  count: number;
  total: number;
}

const FilterBar: React.FC<FilterBarProps> = ({
  activeState, setActiveState,
  category, setCategory,
  availability, setAvailability,
  sort, setSort,
  search, setSearch,
  count, total
}) => {
  const states: (SKUState | 'all')[] = ['all', 'winner', 'bleeder', 'sleeper', 'dead', 'stable'];
  
  const categories = ['all', 'Leggings', 'Kurti', 'Saree shaper', 'Loungewear'];
  const availabilities = ['all', 'in_stock', 'out_of_stock', 'preorder'];
  const sortOptions = [
    { id: 'spend_desc', label: 'Spend (high → low)' },
    { id: 'roas_asc', label: 'ROAS (low → high)' },
    { id: 'revenue_desc', label: 'Revenue (high → low)' },
    { id: 'impr_desc', label: 'Impressions (high → low)' },
    { id: 'state_bleeders', label: 'State priority (Bleeders first)' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center p-1 bg-gray-50 border border-gray-100 rounded-xl shadow-inner">
          {states.map((s) => (
            <button
              key={s}
              onClick={() => setActiveState(s)}
              className={cn(
                "px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all",
                activeState === s 
                  ? "bg-gray-900 text-white shadow-md" 
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="relative group">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-indigo-500 transition-colors" strokeWidth={3} />
          <input
            type="text"
            placeholder="Search Intelligence Network..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-900 w-80 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all border-gray-100 hover:border-gray-200"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-6 border-t border-gray-50 pt-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Type:</span>
            <div className="relative group">
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="appearance-none bg-gray-50/50 border border-gray-100 pl-3 pr-8 py-1.5 rounded-lg text-[11px] font-black text-gray-700 focus:outline-none cursor-pointer hover:bg-white transition-all"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c.toUpperCase()}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-black text-gray-400 tracking-widest">In Stock:</span>
            <div className="relative group">
              <select 
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="appearance-none bg-gray-50/50 border border-gray-100 pl-3 pr-8 py-1.5 rounded-lg text-[11px] font-black text-gray-700 focus:outline-none cursor-pointer hover:bg-white transition-all"
              >
                {availabilities.map(a => (
                  <option key={a} value={a}>{a.replace('_', ' ').toUpperCase()}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Sort:</span>
            <div className="relative group">
              <select 
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none bg-gray-50/50 border border-gray-100 pl-3 pr-8 py-1.5 rounded-lg text-[11px] font-black text-gray-700 focus:outline-none cursor-pointer hover:bg-white transition-all"
              >
                {sortOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label.toUpperCase()}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
           <Filter size={12} className="text-indigo-600" strokeWidth={3} />
           <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">
             {count} / {total} Active Results
           </span>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
