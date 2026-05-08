import React, { useMemo } from 'react';
import { 
  ShoppingBag, CheckCircle2, AlertCircle, 
  ArrowRight, Database, RefreshCw,
  ExternalLink, PieChart
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import SectionHeader from '../components/SectionHeader';
import MetricCard from '../components/MetricCard';
import { formatRupees, cn } from '../lib/utils';
import { getAccountFeedHealth } from '../data/aggregatedData';
import { getDateRangeString } from '../lib/dataUtils';

import { useSearchParams } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';

const FeedHealthDashboard: React.FC<{ dateRange: string }> = ({ dateRange }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeImpact = searchParams.get('impact') || 'all';
  const searchQuery = searchParams.get('search') || '';

  const updateFilter = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value === 'all') nextParams.delete(key);
    else nextParams.set(key, value);
    setSearchParams(nextParams);
  };

  const stats = useMemo(() => getAccountFeedHealth(), []);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <PageHeader 
        title="Feed Intelligence" 
        dateRange={getDateRangeString(dateRange)} 
      />

      <div className="space-y-6">
        {stats.criticalAlert && (
          <div className="bg-red-50 border-2 border-red-500 rounded-xl p-6 flex items-start gap-4">
            <div className="text-red-500 text-3xl">🚨</div>
            <div>
              <h2 className="text-red-800 font-black text-lg">Feed Crisis: 100% Disapproval Rate</h2>
              <p className="text-red-700 mt-1 text-sm">
                All 4,043 products are disapproved. Root cause: missing <code>image_link</code> and 
                <code>product_type</code> on every product. No Shopping or PMax ads can serve product 
                listings until fixed. This is the highest-priority issue in the account.
              </p>
              <div className="mt-3 flex gap-3 flex-wrap">
                <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full">
                  4,043 products disapproved
                </span>
                <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full">
                  0 approved
                </span>
                <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full">
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

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-7 space-y-6">
          <SectionHeader title="Critical Issues" />

          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden p-6 space-y-6">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center p-1 bg-gray-50 border border-gray-100 rounded-xl shadow-inner">
                  {['all', 'Critical', 'High', 'Medium'].map((impact) => (
                    <button
                      key={impact}
                      onClick={() => updateFilter('impact', impact)}
                      className={cn(
                        "px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all",
                        activeImpact === impact 
                          ? "bg-gray-900 text-white shadow-md" 
                          : "text-gray-400 hover:text-gray-600"
                      )}
                    >
                      {impact}
                    </button>
                  ))}
                </div>

                <div className="relative group">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-indigo-500 transition-colors" strokeWidth={3} />
                  <input
                    type="text"
                    placeholder="Search issues..."
                    value={searchQuery}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-900 w-80 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all border-gray-100 hover:border-gray-200"
                  />
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-50 border-t border-gray-50 pt-6">
              {stats.topIssues
                .filter(issue => {
                  const matchesImpact = activeImpact === 'all' || issue.impact === activeImpact;
                  const matchesSearch = issue.reason.toLowerCase().includes(searchQuery.toLowerCase());
                  return matchesImpact && matchesSearch;
                })
                .map((issue) => (
                <div key={issue.reason} className="py-4 flex items-center justify-between group hover:bg-gray-50/50 transition-colors px-2 rounded-lg">
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border",
                      issue.impact === 'Critical' ? "bg-red-50 text-red-700 border-red-100" : issue.impact === 'High' ? "bg-orange-50 text-orange-700 border-orange-100" : "bg-blue-50 text-blue-700 border-blue-100"
                    )}>
                      {issue.impact}
                    </div>
                    <div>
                      <div className="text-sm font-black text-gray-900">{issue.reason}</div>
                      <div className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase">{issue.count} products affected</div>
                      {(issue as any).note && <div className="text-xs text-gray-500 mt-1">{(issue as any).note}</div>}
                    </div>
                  </div>
                  <button className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-all">
                     <ArrowRight size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button className="w-full py-3 bg-white border border-gray-100 text-gray-700 rounded-xl text-xs font-black hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm">
                View All Merchant Center Diagnostics
                <ExternalLink size={12} className="text-gray-400" />
            </button>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-6">
          <SectionHeader title="Attribute Quality" />

          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-8">
            <div className="space-y-6">
               {stats.attributeQuality.map((attr) => (
                 <div key={attr.field} className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
                       <span className="text-gray-400">{attr.field}</span>
                       <span className={cn(
                          attr.score >= 90 ? "text-green-600" : attr.score >= 70 ? "text-blue-600" : "text-amber-600"
                       )}>{attr.score}% Health</span>
                    </div>
                    <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                       <div 
                        className={cn(
                          "h-full transition-all duration-1000",
                          attr.score >= 90 ? "bg-green-500" : attr.score >= 70 ? "bg-blue-500" : "bg-amber-500"
                        )}
                        style={{ width: `${attr.score}%` }}
                       />
                    </div>
                 </div>
               ))}
            </div>

            <div className="p-6 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
               <div className="flex items-center gap-2 mb-3">
                  <PieChart size={14} className="text-indigo-600" strokeWidth={3} />
                  <h4 className="text-[10px] font-black text-indigo-900 tracking-widest uppercase">Scaling Impact</h4>
               </div>
               <p className="text-[11px] font-bold text-indigo-700 leading-relaxed">
                  Optimizing <strong>Product Titles</strong> could increase impression share by up to <strong>22%</strong>.
               </p>
               <button className="mt-4 text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                  Get Recommendations <ArrowRight size={10} />
               </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mt-6">
            <h3 className="font-black text-gray-900 text-lg mb-4">🔧 Fix Priority Order</h3>
            <div className="space-y-3">
              {[
                { step: 1, action: 'Upload product images to Shopify CDN and add image_link to all 4,043 products in the feed', impact: 'Unlocks Shopping + PMax serving', urgency: 'This week' },
                { step: 2, action: 'Set product_type for all products using category hierarchy (e.g. "Leggings > Cotton > Ankle Length")', impact: 'Enables category targeting in campaigns', urgency: 'This week' },
                { step: 3, action: 'Add GTIN / set identifier_exists=false for products without barcode', impact: 'Improves impression share by 15-20%', urgency: 'Next 2 weeks' },
                { step: 4, action: 'Expand short titles to 70+ characters with color, size, material, brand', impact: 'Improves search match rate', urgency: 'Next month' },
              ].map(item => (
                <div key={item.step} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-black text-sm flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{item.action}</p>
                    <p className="text-xs text-green-700 mt-1">Impact: {item.impact}</p>
                    <p className="text-xs text-gray-500">Timeline: {item.urgency}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedHealthDashboard;
