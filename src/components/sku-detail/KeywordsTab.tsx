import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Filter, ArrowUpRight, AlertCircle, Eye, Zap, Plus, X, Target,
  IndianRupee, Activity
} from 'lucide-react';
import { SKU } from '../../data/mockData';
import { CampaignMapping } from '../../data/campaignSkuMap';
import { SearchTermsData, KeywordIntent } from '../../data/searchTerms';
import { formatRupees, cn } from '../../lib/utils';
import SectionHeader from '../SectionHeader';

interface KeywordsTabProps {
  sku: SKU;
  mapping: CampaignMapping;
  data: SearchTermsData;
}

const intentColors: Record<KeywordIntent, { bg: string; text: string; label: string; border: string }> = {
  branded:      { bg: 'bg-blue-50', text: 'text-blue-700', label: '🏷 Branded', border: 'border-blue-200' },
  generic_high: { bg: 'bg-green-50', text: 'text-green-700', label: '✅ Generic - High', border: 'border-green-200' },
  generic_low:  { bg: 'bg-yellow-50', text: 'text-yellow-700', label: '⚠ Generic - Low', border: 'border-yellow-200' },
  on_brand:     { bg: 'bg-purple-50', text: 'text-purple-700', label: '👗 On-brand', border: 'border-purple-200' },
  competitor:   { bg: 'bg-orange-50', text: 'text-orange-700', label: '🔄 Competitor', border: 'border-orange-200' },
  negative:     { bg: 'bg-red-50', text: 'text-red-700', label: '🚫 Negative intent', border: 'border-red-200' },
};

const actionConfig = {
  scale:          { bg: 'bg-green-600', text: 'text-white', icon: ArrowUpRight, label: 'Scale' },
  monitor:        { bg: 'bg-blue-600', text: 'text-white', icon: Eye, label: 'Monitor' },
  add_negative:   { bg: 'bg-red-600', text: 'text-white', icon: X, label: 'Exclude' },
  optimize_bid:   { bg: 'bg-orange-600', text: 'text-white', icon: Zap, label: 'Optimize' },
  add_to_search:  { bg: 'bg-purple-600', text: 'text-white', icon: Plus, label: 'Add to Search' },
};

const KeywordsTab: React.FC<KeywordsTabProps> = ({ mapping, data }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeIntent = (searchParams.get('tab_intent') as KeywordIntent | 'all') || 'all';

  const updateFilters = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all') {
      newParams.delete('tab_intent');
    } else {
      newParams.set('tab_intent', value);
    }
    setSearchParams(newParams);
  };

  const filteredTerms = data.terms.filter(t => activeIntent === 'all' || t.intent === activeIntent);

  const intentStats = useMemo(() => {
    const stats: Record<KeywordIntent, { count: number; spend: number; revenue: number }> = {} as any;
    
    (Object.keys(intentColors) as KeywordIntent[]).forEach(intent => {
      const terms = data.terms.filter(t => t.intent === intent);
      stats[intent] = {
        count: terms.length,
        spend: terms.reduce((sum, t) => sum + t.spend, 0),
        revenue: terms.reduce((sum, t) => sum + t.revenue, 0),
      };
    });
    
    return stats;
  }, [data]);

  return (
    <div className="space-y-12">
      {/* Campaign Context Banner */}
      <div className="space-y-6">
        <SectionHeader title="Campaign Context" />
        <div className="bg-indigo-900 rounded-xl p-6 text-white flex items-center justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Target size={120} />
          </div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <Target size={24} className="text-indigo-300" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">Active Campaign</div>
              <div className="text-lg font-black">{mapping.campaign}</div>
              <div className="text-xs font-medium text-indigo-200 mt-0.5">Listing Group: {mapping.listingGroup}</div>
            </div>
          </div>
          <div className="flex gap-8 border-l border-white/10 pl-8 relative z-10">
            <div>
              <div className="text-[10px] font-black uppercase text-indigo-300 mb-1">Daily Budget</div>
              <div className="text-lg font-black">{formatRupees(mapping.budget)}</div>
            </div>
            <div>
              <div className="text-[10px] font-black uppercase text-indigo-300 mb-1">Target ROAS</div>
              <div className="text-lg font-black">{mapping.roas}x</div>
            </div>
            <div>
              <div className="text-[10px] font-black uppercase text-indigo-300 mb-1">Opt. Score</div>
              <div className="text-lg font-black text-green-400">{mapping.optScore}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Intent Breakdown */}
      <div className="space-y-6">
        <SectionHeader title="Intent Breakdown" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 'branded', label: 'Branded', color: intentColors.branded, icon: <Target /> },
            { id: 'generic_high', label: 'High Intent', color: intentColors.generic_high, icon: <Activity /> },
            { id: 'on_brand', label: 'On-Brand', color: intentColors.on_brand, icon: <Activity /> },
            { id: 'negative', label: 'Wasted Spend', color: intentColors.negative, icon: <IndianRupee /> },
          ].map((item) => {
            const stats = intentStats[item.id as KeywordIntent];
            const roas = stats.revenue / (stats.spend || 1);
            return (
              <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all group">
                <div className={cn("inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase mb-4 border", item.color.bg, item.color.text, item.color.border)}>
                  {item.label}
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-3xl font-black text-gray-900 tracking-tight">{stats.count}</div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Queries</div>
                  </div>
                  <div className="text-right">
                    <div className={cn("text-sm font-black", roas > mapping.roas ? "text-green-600" : "text-red-600")}>
                      {roas.toFixed(1)}x ROAS
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Spend: {formatRupees(stats.spend)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search Terms Table */}
      <div className="space-y-6">
        <SectionHeader title="Query Intelligence" />
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden p-6 space-y-6">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center p-1 bg-gray-50 border border-gray-100 rounded-xl shadow-inner">
                {['all', 'branded', 'generic_high', 'negative'].map((i) => (
                  <button
                    key={i}
                    onClick={() => updateFilters(i)}
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

              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
                 <Filter size={12} className="text-indigo-600" strokeWidth={3} />
                 <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">
                   Showing {filteredTerms.length} of {data.totalTerms} queries
                 </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Search Term</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right px-2">Clicks</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right px-2">CVR</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right px-2">ROAS</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right px-2">Spend</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Intent</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTerms.map((term) => {
                  const ActionIcon = actionConfig[term.action as keyof typeof actionConfig].icon;
                  return (
                    <tr key={term.term} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-5 px-2">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-900">{term.term}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-0.5">via {term.matchedVia}</span>
                        </div>
                      </td>
                      <td className="py-5 text-right text-sm font-bold text-gray-600 px-2">{term.clicks.toLocaleString()}</td>
                      <td className="py-5 text-right text-sm font-bold text-gray-600 px-2">{term.cvr}%</td>
                      <td className={cn(
                        "py-5 text-right text-sm font-black px-2",
                        term.roas > mapping.roas ? "text-green-600" : term.roas < 1 ? "text-red-600" : "text-indigo-600"
                      )}>
                        {term.roas}x
                      </td>
                      <td className="py-5 text-right text-sm font-bold text-gray-900 px-2">{formatRupees(term.spend)}</td>
                      <td className="py-5 px-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-black uppercase border",
                          intentColors[term.intent].bg,
                          intentColors[term.intent].text,
                          intentColors[term.intent].border
                        )}>
                          {intentColors[term.intent].label.split(' ').pop()}
                        </span>
                      </td>
                      <td className="py-5 px-2 text-right">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black border ml-auto",
                          actionConfig[term.action as keyof typeof actionConfig].bg,
                          actionConfig[term.action as keyof typeof actionConfig].text
                        )}>
                          <ActionIcon size={12} strokeWidth={3} />
                          {actionConfig[term.action as keyof typeof actionConfig].label}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Negative Keywords Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <SectionHeader title="Active Negatives" />
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm min-h-[200px]">
            <div className="flex flex-wrap gap-2">
              {data.negativeKeywords.map(word => (
                <span key={word} className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-bold text-gray-500 flex items-center gap-2 hover:bg-white hover:shadow-sm transition-all cursor-default">
                  {word}
                  <X size={12} className="cursor-pointer hover:text-red-500" />
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <SectionHeader title="Opportunities" indicatorColor="bg-red-600" />
          <div className="bg-red-50/50 border border-red-100 rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-red-600" strokeWidth={3} />
                <h3 className="text-sm font-black text-gray-900 tracking-tight">Recommended Exclusions</h3>
              </div>
              <div className="text-[10px] font-black text-red-600 bg-red-100/50 px-2 py-0.5 rounded uppercase border border-red-200">
                Waste: {formatRupees(data.terms.filter(t => t.intent === 'negative').reduce((s,t) => s+t.spend, 0))}/mo
              </div>
            </div>
            <div className="space-y-3">
              {data.recommendedNegatives.map(word => (
                <div key={word} className="flex items-center justify-between bg-white p-3 rounded-xl border border-red-100/50 group hover:border-red-400 transition-all shadow-sm">
                  <span className="text-xs font-black text-gray-700">{word}</span>
                  <button className="text-[10px] font-black text-red-600 hover:bg-red-600 hover:text-white px-4 py-1.5 rounded-lg transition-all border border-red-200 uppercase tracking-widest">
                    Exclude
                  </button>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-red-200">
              Exclude All & Save Budget
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeywordsTab;
