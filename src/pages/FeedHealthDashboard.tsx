import React, { useMemo, useState } from 'react';
import { 
  ShoppingBag, CheckCircle2, AlertCircle, 
  ArrowRight, Database, Search, Filter,
  Tag, Box, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import SectionHeader from '../components/SectionHeader';
import MetricCard from '../components/MetricCard';
import { cn } from '../lib/utils';
import { getAccountFeedHealth } from '../data/aggregatedData';
import { getActualSKUs } from '../data/actualDataLoader';
import { getDateRangeString } from '../lib/dataUtils';

const PAGE_SIZE = 10;

const FeedHealthDashboard: React.FC<{ dateRange: string }> = ({ dateRange }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeStatus = searchParams.get('status') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const [currentPage, setCurrentPage] = useState(1);

  const stats = useMemo(() => getAccountFeedHealth(), []);
  const allSkus = useMemo(() => getActualSKUs(), []);

  const updateFilter = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value === 'all') nextParams.delete(key);
    else nextParams.set(key, value);
    setSearchParams(nextParams);
    setCurrentPage(1);
  };

  const filteredSkus = useMemo(() => {
    return allSkus.filter(sku => {
      const matchesSearch = sku.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            sku.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = activeStatus === 'all' || sku.status === activeStatus;
      return matchesSearch && matchesStatus;
    });
  }, [allSkus, searchQuery, activeStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredSkus.length / PAGE_SIZE));
  const paginatedSkus = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSkus.slice(start, start + PAGE_SIZE);
  }, [filteredSkus, currentPage]);

  const getAttributeQuality = (sku: any, fieldName: string) => {
    const attr = sku.attributes?.find((a: any) => a.field === fieldName);
    return attr?.quality || 'warning';
  };

  const countIssues = (sku: any) => {
    if (!sku.attributes) return 0;
    return sku.attributes.filter((a: any) => a.quality !== 'good').length;
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <PageHeader 
        title="Feed Intelligence" 
        dateRange={getDateRangeString(dateRange)} 
      />

      <div className="space-y-6">
        {stats.criticalAlert && (
          <div className="bg-red-50 border-2 border-red-500 rounded-xl p-6 flex items-start gap-4 shadow-sm">
            <div className="text-red-500 text-3xl">🚨</div>
            <div>
              <h2 className="text-red-800 font-black text-lg">Feed Crisis: 100% Disapproval Rate</h2>
              <p className="text-red-700 mt-1 text-sm font-medium">
                All 4,043 products are disapproved. Root cause: missing <code>image_link</code> and 
                <code>product_type</code> on every product. No Shopping or PMax ads can serve product 
                listings until fixed. This is the highest-priority issue in the account.
              </p>
              <div className="mt-3 flex gap-3 flex-wrap">
                <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full border border-red-200">
                  4,043 products disapproved
                </span>
                <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full border border-red-200">
                  0 approved
                </span>
                <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full border border-red-200">
                  Est. lost impressions: 10M+/month
                </span>
              </div>
            </div>
          </div>
        )}

        <SectionHeader title="Global Feed Status" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            label="Total Products"
            value={stats.totalItems.toLocaleString()}
            subtitle="Merchant Center Feed"
            color="#3b82f6"
            icon={<ShoppingBag />}
            positive={true}
            change=""
          />

          <MetricCard 
            label="Approved"
            value={stats.approved.toLocaleString()}
            subtitle={((stats.approved / stats.totalItems) * 100).toFixed(1) + '% of feed'}
            color="#ef4444"
            icon={<CheckCircle2 />}
            positive={false}
            change=""
          />

          <MetricCard 
            label="Disapproved"
            value={stats.disapproved.toString()}
            subtitle="Immediate Action"
            color="#ef4444"
            icon={<AlertCircle />}
            positive={false}
            change=""
          />

          <MetricCard 
            label="Excluded"
            value={stats.excluded.toString()}
            subtitle="Out of scope"
            color="#f59e0b"
            icon={<Database />}
            positive={true}
            change=""
          />
        </div>
      </div>

      <div className="space-y-6">
        <SectionHeader title="Feed Product Directory" />

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden p-6 space-y-6">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center p-1 bg-gray-50 border border-gray-100 rounded-xl shadow-inner">
                {['all', 'active', 'disapproved', 'excluded'].map((status) => (
                  <button
                    key={status}
                    onClick={() => updateFilter('status', status)}
                    className={cn(
                      "px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all",
                      activeStatus === status 
                        ? "bg-gray-900 text-white shadow-md" 
                        : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="relative group">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-indigo-500 transition-colors" strokeWidth={3} />
                <input
                  type="text"
                  placeholder="Search products or IDs..."
                  value={searchQuery}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-900 w-80 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all border-gray-100 hover:border-gray-200"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-6 border-t border-gray-50 pt-6">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
                 <Filter size={12} className="text-indigo-600" strokeWidth={3} />
                 <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">
                   {filteredSkus.length} / {allSkus.length} Products Analyzed
                 </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Product ID</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Title</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest px-2 text-center">Status</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest px-2 text-right">Price</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest px-2 text-center">Image</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest px-2 text-center">GTIN</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest px-2 text-center">Issues</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedSkus.map((sku) => {
                  const imageQuality = getAttributeQuality(sku, 'image_link');
                  const gtinQuality = getAttributeQuality(sku, 'gtin');
                  const issuesCount = countIssues(sku);
                  
                  return (
                    <tr key={sku.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2">
                          <Box size={14} className="text-gray-400" />
                          <span className="text-sm font-black text-gray-900">{sku.id}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex flex-col max-w-[280px]">
                          <span className="text-sm font-bold text-gray-800 line-clamp-1" title={sku.name}>{sku.name}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Tag size={10} className="text-gray-400" />
                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight truncate">{sku.category || 'Uncategorized'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-black uppercase border inline-block whitespace-nowrap",
                            sku.status === 'active' ? "bg-green-50 text-green-700 border-green-200" : 
                            sku.status === 'disapproved' ? "bg-red-50 text-red-700 border-red-200" : 
                            "bg-gray-100 text-gray-600 border-gray-200"
                          )}>
                            {sku.status === 'active' ? 'Approved' : 'Disapproved'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <span className="text-sm font-bold text-gray-900">{sku.price}</span>
                        <div className="text-[9px] font-bold text-gray-400 uppercase mt-1">{sku.availability}</div>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <span className={cn(
                          "w-2 h-2 rounded-full inline-block",
                          imageQuality === 'good' ? "bg-green-500" : imageQuality === 'warning' ? "bg-amber-500" : "bg-red-500"
                        )} title={imageQuality} />
                      </td>
                      <td className="py-4 px-2 text-center">
                        <span className={cn(
                          "w-2 h-2 rounded-full inline-block",
                          gtinQuality === 'good' ? "bg-green-500" : gtinQuality === 'warning' ? "bg-amber-500" : "bg-red-500"
                        )} title={gtinQuality} />
                      </td>
                      <td className="py-4 px-2 text-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-black",
                          issuesCount === 0 ? "bg-gray-100 text-gray-400" : "bg-red-50 text-red-600"
                        )}>
                          {issuesCount}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <button className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 rounded-lg text-gray-400 hover:text-indigo-600 transition-all inline-flex">
                          <ArrowRight size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredSkus.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-sm text-gray-500 font-medium">
                      No products found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredSkus.length)} of {filteredSkus.length}
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
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedHealthDashboard;
