import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { getActualCampaigns } from '../data/actualDataLoader';
import { getScaleMultiplier, getDateRangeString, scaleMetrics } from '../lib/dataUtils';
import { cn, formatRupees } from '../lib/utils';
import { ShoppingBag, Users, Zap, MousePointer2, CreditCard, Activity, Search, Filter } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import SectionHeader from '../components/SectionHeader';
import MetricCard from '../components/MetricCard';
import SummaryCards from '../components/SummaryCards';
import PageHeader from '../components/PageHeader';
import { SKU, SKUState, GA4_FUNNEL, TRAFFIC_SOURCES, LTV_DATA } from '../data/mockData';

interface CampaignOverviewProps {
  dateRange: string;
}

const CampaignOverview: React.FC<CampaignOverviewProps> = ({ dateRange }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeStrategy = searchParams.get('strategy') || 'all';
  const searchQuery = searchParams.get('search') || '';
  
  const updateFilter = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value === 'all') nextParams.delete(key);
    else nextParams.set(key, value);
    setSearchParams(nextParams);
  };
  
  const multiplier = getScaleMultiplier(dateRange);

  // Scaled Data
  const scaledCampaigns = useMemo(() => {
    return getActualCampaigns().map(c => {
      const spend = Math.round(c.spend * multiplier);
      const revenue = Math.round(c.revenue * multiplier);
      const roas = revenue / (Math.max(1, spend));
      const strategy = roas > 4 ? "Scale" : roas >= 2 ? "Stable" : "Optimize";
      
      return {
        ...c,
        spend,
        revenue,
        conversions: Math.round(c.conversions * multiplier),
        roas,
        strategy
      };
    });
  }, [multiplier]);

  const filteredCampaigns = useMemo(() => {
    return scaledCampaigns.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStrategy = activeStrategy === 'all' || c.strategy.toLowerCase() === activeStrategy.toLowerCase();
      return matchesSearch && matchesStrategy;
    });
  }, [scaledCampaigns, searchQuery, activeStrategy]);

  const scaledFunnel = useMemo(() => {
    return GA4_FUNNEL.map(step => ({
      ...step,
      count: Math.round(step.count * multiplier)
    }));
  }, [multiplier]);

  const scaledTraffic = useMemo(() => {
    return TRAFFIC_SOURCES.map(source => ({
      ...source,
      sessions: Math.round(source.sessions * multiplier),
      revenue: Math.round(source.revenue * multiplier)
    }));
  }, [multiplier]);

  // Map campaigns to SKU-like objects for SummaryCards compatibility
  const campaignSummaryData = useMemo((): SKU[] => {
    return scaledCampaigns.map((c, i) => {
      let state: SKUState = 'stable';
      if (c.roas > 4) state = 'winner';
      else if (c.roas < 1.5 && c.spend > 5000) state = 'bleeder';
      else if (c.conversions === 0 && c.spend > 0) state = 'sleeper';
      else if (c.spend === 0) state = 'dead';

      return {
        id: `CAMP-${i}`,
        name: c.name,
        category: c.type,
        state: state,
        availability: 'in_stock',
        impressions: 0,
        ctr: 0,
        spend: c.spend,
        conversions: c.conversions,
        cvr: 0,
        revenue: c.revenue,
        roas: c.roas
      };
    });
  }, [scaledCampaigns]);

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      <PageHeader 
        title="Campaign Intelligence" 
        dateRange={getDateRangeString(dateRange)} 
      />

      {/* 1. Metrics Overview Section */}
      <SummaryCards skus={campaignSummaryData} />

      {/* 2. Performance by Campaign Table */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Performance by Campaign</h2>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-6">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center p-1 bg-gray-50 border border-gray-100 rounded-xl shadow-inner">
                {['all', 'Scale', 'Stable', 'Optimize'].map((s) => (
                  <button
                    key={s}
                    onClick={() => updateFilter('strategy', s)}
                    className={cn(
                      "px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all",
                      activeStrategy === s 
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
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-900 w-80 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all border-gray-100 hover:border-gray-200"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto pt-6 border-t border-gray-50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-bottom border-gray-100 rounded-lg overflow-hidden">
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Campaign Details</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Strategy</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Spend</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Revenue</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">ROAS</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Conv.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredCampaigns.map((campaign, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors">{campaign.name}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{campaign.type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          campaign.roas > 4 ? "bg-green-500" : campaign.roas >= 2 ? "bg-amber-500" : "bg-red-500"
                        )} />
                        <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
                          {campaign.roas > 4 ? "Scale" : campaign.roas >= 2 ? "Stable" : "Optimize"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-black text-gray-900">{formatRupees(campaign.spend)}</td>
                    <td className="px-6 py-4 text-right text-sm font-black text-gray-900">{formatRupees(campaign.revenue)}</td>
                    <td className={cn(
                      "px-6 py-4 text-right text-sm font-black",
                      campaign.roas > 4 ? "text-green-600" : campaign.roas >= 2 ? "text-amber-600" : "text-red-600"
                    )}>
                      {campaign.roas.toFixed(2)}x
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-gray-600">{campaign.conversions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. Trends & Signal Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Trends & Signals</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* GA4 Funnel */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-8">
              <Activity size={18} className="text-blue-600" />
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Conversion Funnel</h3>
            </div>
            <div className="space-y-8">
              {scaledFunnel.map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{step.event.replace('_', ' ')}</span>
                    <div className="text-right">
                      <div className="text-sm font-black text-gray-900">{step.count.toLocaleString()}</div>
                      {step.pct && <div className="text-[10px] text-blue-500 font-bold">{step.pct}% drop</div>}
                    </div>
                  </div>
                  <div className="h-2.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                    <div 
                      className="h-full bg-blue-600 rounded-full" 
                      style={{ width: `${idx === 0 ? 100 : (step.count / scaledFunnel[0].count) * 100}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-8">
              <Zap size={18} className="text-amber-500" />
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Acquisition Source</h3>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scaledTraffic} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="channel" type="category" tick={{fontSize: 10, fontWeight: 700, fill: '#9ca3af'}} width={100} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                    cursor={{fill: 'rgba(243, 244, 246, 0.4)'}}
                  />
                  <Bar dataKey="revenue" fill="#4f46e5" radius={[0, 8, 8, 0]} barSize={24}>
                    {scaledTraffic.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : '#818cf8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* LTV Cohorts */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Customer Lifetime Value</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {LTV_DATA.map((cohort, idx) => (
            <div key={idx} className="p-6 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{cohort.channel}</div>
              <div className="flex items-end gap-2 mb-2">
                <div className="text-3xl font-black text-gray-900">₹{cohort.ltv.toFixed(0)}</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">LTV</div>
              </div>
              <div className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                {cohort.users.toLocaleString()} New Users
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CampaignOverview;
