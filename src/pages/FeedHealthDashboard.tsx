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
import { getActualSKUs } from '../data/actualDataLoader';

import { useSearchParams } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';

const FeedHealthDashboard: React.FC<{ dateRange: string }> = ({ dateRange }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeImpact = searchParams.get('impact') || 'all';
  const searchQuery = searchParams.get('search') || '';

  const skus = useMemo(() => getActualSKUs(), []);
  
  const updateFilter = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value === 'all') nextParams.delete(key);
    else nextParams.set(key, value);
    setSearchParams(nextParams);
  };
  
  const stats = useMemo(() => {
    const totalItems = skus.length;
    const approved = skus.filter(s => s.status === 'active').length;
    const disapproved = skus.filter(s => s.status === 'disapproved').length;
    
    // Aggregate issues
    const issueMap: Record<string, number> = {};
    const attributeQuality: Record<string, { total: number, good: number }> = {};
    
    skus.forEach(s => {
      s.attributes.forEach(a => {
        if (!attributeQuality[a.field]) attributeQuality[a.field] = { total: 0, good: 0 };
        attributeQuality[a.field].total++;
        if (a.quality === 'good') attributeQuality[a.field].good++;
        
        if (a.issue) {
          issueMap[a.issue] = (issueMap[a.issue] || 0) + 1;
        }
      });
    });

    const topIssues = Object.entries(issueMap)
      .map(([reason, count]) => ({ reason, count, impact: count > 100 ? 'Critical' : 'Medium' }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const qualityScores = Object.entries(attributeQuality).map(([field, q]) => ({
      field,
      score: Math.round((q.good / q.total) * 100)
    }));

    return { totalItems, approved, disapproved, excluded: 0, topIssues, qualityScores };
  }, [skus]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <PageHeader title="Merchant Center Feed Health" dateRange={dateRange} />

      <div className="space-y-6">
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
            color="#10b981"
            icon={<CheckCircle2 />}
            positive={true}
            change=""
          />

          <MetricCard 
            label="Disapproved"
            value={stats.disapproved.toString()}
            subtitle="Immediate Action"
            color="#ef4444"
            icon={<AlertCircle />}
            positive={true}
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
               {stats.qualityScores.map((attr) => (
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
        </div>
      </div>
    </div>
  );
};

export default FeedHealthDashboard;
