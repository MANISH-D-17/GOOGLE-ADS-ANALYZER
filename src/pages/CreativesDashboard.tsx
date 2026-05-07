import React, { useMemo } from 'react';
import { 
  Plus, AlertCircle, 
  Layout, ExternalLink, Play, Target,
  ArrowRight, Activity, Zap, ImageIcon, Video, Type,
  Search, Filter, List, Grid
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import SectionHeader from '../components/SectionHeader';
import MetricCard from '../components/MetricCard';
import { cn } from '../lib/utils';
import { getActualCampaigns } from '../data/actualDataLoader';
import { getAccountAssetGroups } from '../data/aggregatedData';
import { getDateRangeString } from '../lib/dataUtils';
import { AssetGroup } from '../data/assetGroups';

const CreativesDashboard: React.FC<{ dateRange: string }> = ({ dateRange }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeHealth = searchParams.get('health') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const viewMode = searchParams.get('view') || 'grid';

  const assetGroups = useMemo(() => getAccountAssetGroups(), []);
  const campaigns = useMemo(() => getActualCampaigns(), []);
  
  const updateFilter = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value === 'all') nextParams.delete(key);
    else nextParams.set(key, value);
    setSearchParams(nextParams);
  };

  const filteredAssetGroups = useMemo(() => {
    return assetGroups.filter(g => {
      const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) || g.campaignName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesHealth = activeHealth === 'all' || 
                           (activeHealth === 'excellent' && g.overallScore >= 80) ||
                           (activeHealth === 'good' && g.overallScore >= 60 && g.overallScore < 80) ||
                           (activeHealth === 'poor' && g.overallScore < 60);
      return matchesSearch && matchesHealth;
    });
  }, [assetGroups, searchQuery, activeHealth]);

  const accountHealth = useMemo(() => {
    const total = assetGroups.reduce((s: number, g: AssetGroup) => s + g.overallScore, 0);
    return Math.round(total / (assetGroups.length || 1));
  }, [assetGroups]);

  const insights = useMemo(() => {
    const topCampaign = campaigns.sort((a, b) => b.revenue - a.revenue)[0];
    return {
      topPerformer: topCampaign?.name || 'None',
      scalingOpportunity: campaigns.filter(c => c.roas > 4).length
    };
  }, [campaigns]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <PageHeader 
        title="Creative Intelligence" 
        dateRange={getDateRangeString(dateRange)} 
      />

      <div className="space-y-6">
        <SectionHeader title="Creative Performance Overview" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            label="Global Creative Health"
            value={accountHealth + '%'}
            subtitle="Account Average"
            color={accountHealth >= 80 ? "#10b981" : accountHealth >= 60 ? "#f59e0b" : "#ef4444"}
            icon={<Activity />}
            positive={true}
            change=""
          />

          <MetricCard 
            label="Active Asset Groups"
            value={assetGroups.length.toString()}
            subtitle="Syncing Data"
            color="#3b82f6"
            icon={<Layout />}
            positive={true}
            change=""
          />

          <MetricCard 
            label="Top Assets"
            value="42"
            subtitle="Rated 'BEST'"
            color="#10b981"
            icon={<Zap />}
            positive={true}
            change=""
          />

          <MetricCard 
            label="Critical Gaps"
            value="3"
            subtitle="Missing Video/Images"
            color="#ef4444"
            icon={<AlertCircle />}
            positive={true}
            change=""
          />
        </div>
      </div>

      <div className="space-y-6">
        <SectionHeader title="Asset Group Analysis" />

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center p-1 bg-gray-50 border border-gray-100 rounded-xl shadow-inner">
                {['all', 'excellent', 'good', 'poor'].map((h) => (
                  <button
                    key={h}
                    onClick={() => updateFilter('health', h)}
                    className={cn(
                      "px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all",
                      activeHealth === h 
                        ? "bg-gray-900 text-white shadow-md" 
                        : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>

              <div className="relative group">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-indigo-500 transition-colors" strokeWidth={3} />
                <input
                  type="text"
                  placeholder="Search asset groups..."
                  value={searchQuery}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-900 w-80 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all border-gray-100 hover:border-gray-200"
                />
              </div>

              <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-xl p-1 ml-auto">
                <button
                  onClick={() => updateFilter('view', 'grid')}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    viewMode === 'grid' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => updateFilter('view', 'table')}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    viewMode === 'table' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-gray-50">
              {filteredAssetGroups.map((group) => (
                <div key={group.name} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-6">
                    <div className="space-y-1">
                      <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Asset Group</div>
                      <h3 className="text-lg font-black text-gray-900 leading-tight">{group.name}</h3>
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                        <Target size={12} className="text-blue-500" />
                        {group.campaignName}
                      </div>
                    </div>
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm border shadow-sm",
                      group.overallScore >= 80 ? "bg-green-50 text-green-600 border-green-100" : group.overallScore >= 60 ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-red-50 text-red-600 border-red-100"
                    )}>
                      {group.overallScore}%
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-tight">
                      <span className="text-gray-400">Asset Strength</span>
                      <span className="text-gray-900">{group.overallScore >= 80 ? 'Excellent' : group.overallScore >= 60 ? 'Good' : 'Needs Work'}</span>
                    </div>
                    <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-1000",
                          group.overallScore >= 80 ? "bg-green-500" : group.overallScore >= 60 ? "bg-amber-500" : "bg-red-500"
                        )}
                        style={{ width: `${group.overallScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-8 space-y-2">
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50/50 rounded-lg border border-gray-100/50">
                      <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase">
                        <Type size={12} /> Headlines
                      </div>
                      <span className="text-xs font-black text-gray-700">{group.headlines.length}/15</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50/50 rounded-lg border border-gray-100/50">
                      <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase">
                        <ImageIcon size={12} /> Images
                      </div>
                      <span className="text-xs font-black text-gray-700">{group.images.length}/20</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50/50 rounded-lg border border-gray-100/50">
                      <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase">
                        <Video size={12} /> Videos
                      </div>
                      <span className={cn("text-xs font-black", group.videos.length === 0 ? "text-red-500" : "text-gray-700")}>
                        {group.videos.length}/5
                      </span>
                    </div>
                  </div>

                  {group.missingAssets && group.missingAssets.length > 0 && (
                    <div className="mt-6 p-4 bg-red-50/50 rounded-xl border border-red-100/50">
                      <div className="flex items-center gap-2 text-[10px] font-black text-red-500 uppercase mb-2">
                        <AlertCircle size={12} /> Critical Gaps
                      </div>
                      <div className="space-y-1">
                        {group.missingAssets.slice(0, 2).map((m: string) => (
                          <div key={m} className="text-[10px] font-bold text-red-400 flex items-center gap-2">
                            <ArrowRight size={10} /> {m}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button className="w-full mt-8 py-3 bg-white border border-gray-100 text-gray-700 rounded-xl text-xs font-black hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm">
                    Optimize Group
                    <ExternalLink size={12} className="text-gray-400" />
                  </button>
                </div>
              ))}

              <div className="bg-gray-50/30 border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all cursor-pointer group">
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-indigo-500 transition-colors">
                  <Plus size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">New Asset Group</h3>
                  <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tight">Scale Account Reach</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto pt-6 border-t border-gray-50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Asset Group</th>
                    <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Campaign</th>
                    <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center px-2">Headlines</th>
                    <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center px-2">Images</th>
                    <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center px-2">Videos</th>
                    <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right px-2">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredAssetGroups.map((group) => (
                    <tr key={group.name} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-2">
                        <span className="text-sm font-black text-gray-900">{group.name}</span>
                      </td>
                      <td className="py-4 px-2">
                        <span className="text-xs font-bold text-gray-500">{group.campaignName}</span>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <span className="text-xs font-black text-gray-700">{group.headlines.length}/15</span>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <span className="text-xs font-black text-gray-700">{group.images.length}/20</span>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <span className={cn("text-xs font-black", group.videos.length === 0 ? "text-red-500" : "text-gray-700")}>
                          {group.videos.length}/5
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-black uppercase border",
                          group.overallScore >= 80 ? "bg-green-50 text-green-700 border-green-200" : group.overallScore >= 60 ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-red-50 text-red-700 border-red-200"
                        )}>
                          {group.overallScore}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Intelligence Analysis */}
      <div className="space-y-6">
        <SectionHeader title="Intelligence Insight" />
        <div className="bg-indigo-900 rounded-xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10">
             <Activity size={120} />
          </div>
          <div className="relative z-10 space-y-6">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                   <Zap className="text-yellow-400" size={20} strokeWidth={3} />
                </div>
                <h3 className="text-xl font-black tracking-tight">Scaling Recommendation</h3>
             </div>
             <p className="text-indigo-100 text-sm font-medium max-w-2xl leading-relaxed">
                Our analysis of your GA4 Cohort data reveals that <strong>Paid Search users have a 7x higher 120-day LTV (₹94.92)</strong> compared to PMax users (₹14.22). 
                While PMax drives volume, your high-value customers are coming from specific search queries. 
                We recommend shifting 15% of PMax budget into top-performing Search campaigns to maximize long-term account profitability.
             </p>
             <div className="flex gap-4">
                <button className="bg-white text-indigo-900 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-all">
                   Generate Scale Plan
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreativesDashboard;
