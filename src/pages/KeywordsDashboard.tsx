import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Target, ArrowUpRight, Eye, Zap, Plus, X, Search,
  CreditCard, IndianRupee, ShoppingBag, Filter, MousePointer2, Percent
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import SectionHeader from '../components/SectionHeader';
import MetricCard from '../components/MetricCard';
import { formatRupees, cn } from '../lib/utils';
import { getAccountKeywordsSummary } from '../data/aggregatedData';
import { getScaleMultiplier, getDateRangeString, scaleMetrics } from '../lib/dataUtils';
import { getActualSearchTerms } from '../data/actualDataLoader';

const intentColors: Record<string, { bg: string; text: string; label: string; border: string }> = {
  branded:      { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Branded', border: 'border-blue-200' },
  generic_high: { bg: 'bg-green-50', text: 'text-green-700', label: 'High Intent', border: 'border-green-200' },
  generic_low:  { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Low Intent', border: 'border-yellow-200' },
  on_brand:     { bg: 'bg-purple-50', text: 'text-purple-700', label: 'On-brand', border: 'border-purple-200' },
  competitor:   { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Competitor', border: 'border-orange-200' },
  negative:     { bg: 'bg-red-50', text: 'text-red-700', label: 'Negative', border: 'border-red-200' },
};

const KeywordsDashboard: React.FC<{ dateRange: string }> = ({ dateRange }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeIntent = searchParams.get('intent') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const multiplier = getScaleMultiplier(dateRange);

  const allSearchTerms = useMemo(() => {
    const raw = getActualSearchTerms();
    return raw.map(t => ({
      ...t,
      spend: t.spend * multiplier,
      revenue: t.revenue * multiplier,
      clicks: Math.round(t.clicks * multiplier),
      impressions: Math.round(t.impressions * multiplier),
      roas: (t.revenue * multiplier) / (Math.max(1, t.spend * multiplier))
    }));
  }, [multiplier]);
  
  const filteredTerms = useMemo(() => {
    return allSearchTerms.filter(t => {
      const matchesSearch = t.term.toLowerCase().includes(searchQuery.toLowerCase()) || t.campaignName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesIntent = activeIntent === 'all' || t.intent === activeIntent;
      return matchesSearch && matchesIntent;
    });
  }, [allSearchTerms, searchQuery, activeIntent]);

  const filteredTotal = useMemo(() => {
    const spend = filteredTerms.reduce((acc, t) => acc + t.spend, 0);
    const revenue = filteredTerms.reduce((acc, t) => acc + t.revenue, 0);
    const clicks = filteredTerms.reduce((acc, t) => acc + t.clicks, 0);
    const impressions = filteredTerms.reduce((acc, t) => acc + t.impressions, 0);
    return {
      spend,
      revenue,
      clicks,
      impressions,
      roas: revenue / (spend || 1),
      cvr: clicks > 0 ? (revenue / clicks) : 0 // Simplified CVR for total
    };
  }, [filteredTerms]);

  const accountSummary = useMemo(() => {
    const totalSpend = allSearchTerms.reduce((acc, t) => acc + t.spend, 0);
    const totalRevenue = allSearchTerms.reduce((acc, t) => acc + t.revenue, 0);
    return {
      totalSpend,
      totalRevenue,
      roas: totalRevenue / (totalSpend || 1)
    };
  }, [allSearchTerms]);

  const updateFilter = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value === 'all') nextParams.delete(key);
    else nextParams.set(key, value);
    setSearchParams(nextParams);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <PageHeader 
        title="Keyword Intelligence" 
        dateRange={getDateRangeString(dateRange)} 
      /><div className="space-y-6">
        <SectionHeader title="Metrics Overview" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            label="Total Search Spend"
            value={formatRupees(accountSummary.totalSpend)}
            change="+14.2%"
            positive={true}
            color="#3b82f6"
            icon={<CreditCard />}
          />

          <MetricCard 
            label="Aggregated ROAS"
            value={accountSummary.roas.toFixed(2) + 'x'}
            change="-2.4%"
            positive={false}
            color="#8b5cf6"
            icon={<Target />}
          />

          <MetricCard 
            label="Unique Queries"
            value={allSearchTerms.length.toString()}
            subtitle="Analyzed Search Terms"
            color="#10b981"
            icon={<Search />}
            positive={true}
            change=""
          />

          <MetricCard 
            label="Conversion Rate"
            value="4.8%"
            subtitle="Account Average"
            color="#f59e0b"
            icon={<Percent />}
            positive={true}
            change=""
          />
        </div>
      </div>

      <div className="space-y-6">
        <SectionHeader title="Keyword Performance" />

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden p-6 space-y-6">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center p-1 bg-gray-50 border border-gray-100 rounded-xl shadow-inner">
                {['all', 'branded', 'generic_high', 'generic_low', 'negative'].map((i) => (
                  <button
                    key={i}
                    onClick={() => updateFilter('intent', i)}
                    className={cn(
                      "px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all",
                      activeIntent === i 
                        ? "bg-gray-900 text-white shadow-md" 
                        : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    {i === 'all' ? 'All' : i.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div className="relative group">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-indigo-500 transition-colors" strokeWidth={3} />
                <input
                  type="text"
                  placeholder="Search queries..."
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
                   {filteredTerms.length} / {allSearchTerms.length} Search Terms Analyzed
                 </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Search Query</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Intent</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right px-2">Spend</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right px-2">Clicks</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right px-2">CVR</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right px-2">Revenue</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right px-2">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTerms.map((t) => {
                  const intent = intentColors[t.intent] || intentColors.generic_low;
                  return (
                    <tr key={t.term} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-2">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-900">{t.term}</span>
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{t.campaignName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-black uppercase border",
                          intent.bg, intent.text, intent.border
                        )}>
                          {intent.label}
                        </span>
                      </td>
                      <td className="py-4 text-right text-sm font-bold text-gray-900 px-2">{formatRupees(t.spend)}</td>
                      <td className="py-4 text-right text-sm font-bold text-gray-700 px-2">{t.clicks.toLocaleString()}</td>
                      <td className="py-4 text-right text-sm font-bold text-gray-700 px-2">{t.cvr.toFixed(1)}%</td>
                      <td className="py-4 text-right text-sm font-bold text-gray-900 px-2">{formatRupees(t.revenue)}</td>
                      <td className={cn(
                        "py-4 text-right text-sm font-black px-2",
                        t.roas >= 4 ? "text-green-600" : t.roas < 1.5 ? "text-red-600" : "text-blue-600"
                      )}>
                        {t.roas.toFixed(2)}x
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-gray-100 bg-gray-50/30">
                <tr>
                  <td className="py-6 px-2" colSpan={2}>
                    <span className="text-sm font-black text-gray-900 tracking-tighter uppercase">TOTAL (FILTERED)</span>
                  </td>
                  <td className="py-6 text-right text-sm font-black text-gray-900 px-2">{formatRupees(filteredTotal.spend)}</td>
                  <td className="py-6 text-right text-sm font-black text-gray-900 px-2">{filteredTotal.clicks.toLocaleString()}</td>
                  <td className="py-6 text-right text-sm font-black text-gray-400 px-2">--</td>
                  <td className="py-6 text-right text-sm font-black text-gray-900 px-2">{formatRupees(filteredTotal.revenue)}</td>
                  <td className={cn(
                    "py-6 text-right text-sm font-black px-2",
                    filteredTotal.roas >= 4 ? "text-green-600" : "text-blue-600"
                  )}>
                    {filteredTotal.roas.toFixed(2)}x
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeywordsDashboard;
